@echo off
setlocal

:: Navigate to frontend directory (same folder as this script)
cd /d "%~dp0"

echo ================================================================
echo               K-Seat Frontend S3 Deployment Script
echo ================================================================
echo.

:: Stack config defaults - mirrors backend defaults
set "STACK_NAME=k-seat-backend"
set "AWS_REGION=us-east-1"

:: -----------------------------------------------------------------
:: 1. Verify Prerequisites
:: -----------------------------------------------------------------
echo [1/4] Checking prerequisites...

where aws >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] AWS CLI is not installed or not in PATH.
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not installed or not in PATH.
    exit /b 1
)

echo Verifying AWS credentials...
call aws sts get-caller-identity >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Unable to authenticate with AWS.
    echo Your AWS CLI credentials may be missing or expired.
    exit /b 1
)
for /f "tokens=*" %%i in ('aws sts get-caller-identity --query "Account" --output text 2^>nul') do set "AWS_ACCOUNT_ID=%%i"
echo Authenticated as AWS Account: %AWS_ACCOUNT_ID%
echo.

:: Read STACK_NAME and AWS_REGION from backend/.env if it exists
if exist "..\backend\.env" (
    for /f "usebackq eol=# tokens=1,* delims==" %%A in ("..\backend\.env") do (
        if /i "%%A"=="STACK_NAME" set "STACK_NAME=%%B"
        if /i "%%A"=="AWS_REGION" set "AWS_REGION=%%B"
    )
)

:: -----------------------------------------------------------------
:: 2. Fetch API Endpoint and S3 Bucket from Backend CloudFormation
:: -----------------------------------------------------------------
echo [2/4] Fetching backend stack outputs from CloudFormation...

call aws cloudformation describe-stacks --stack-name "%STACK_NAME%" --region "%AWS_REGION%" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Backend stack "%STACK_NAME%" was not found in region "%AWS_REGION%".
    echo Please deploy the backend first by running:
    echo   cd ..\backend ^&^& deploy.bat
    exit /b 1
)

for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name "%STACK_NAME%" --region "%AWS_REGION%" --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text 2^>nul') do set "API_ENDPOINT=%%i"
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name "%STACK_NAME%" --region "%AWS_REGION%" --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" --output text 2^>nul') do set "FRONTEND_URL=%%i"

set "BUCKET_NAME=seat-reservation-frontend-%AWS_ACCOUNT_ID%"

if not defined API_ENDPOINT (
    echo [ERROR] Could not find ApiEndpoint in CloudFormation stack outputs.
    exit /b 1
)

echo Backend API Endpoint:  %API_ENDPOINT%
echo Target S3 Bucket:      %BUCKET_NAME%
echo Frontend Website URL:  %FRONTEND_URL%
echo.

:: -----------------------------------------------------------------
:: 3. Write .env for Vite & Build
:: -----------------------------------------------------------------
echo [3/4] Building frontend static SPA...

:: SvelteKit reads PUBLIC_* variables from .env at build time via $env/static/public.
:: We write a .env.production file and pass it via DOTENV_CONFIG_PATH,
:: then delete it after the build to keep the workspace clean.
echo PUBLIC_API_URL=%API_ENDPOINT%/api > .env.production
echo VITE_API_BASE_URL=%API_ENDPOINT%/api >> .env.production

call npm run build
set "BUILD_RESULT=%ERRORLEVEL%"

:: Clean up the temporary env file
if exist ".env.production" del /f ".env.production"

if %BUILD_RESULT% neq 0 (
    echo.
    echo [ERROR] Frontend build failed!
    exit /b %BUILD_RESULT%
)

if not exist "build\index.html" (
    echo.
    echo [ERROR] build/index.html not found. Make sure adapter-static is configured.
    exit /b 1
)
echo Build completed successfully.
echo.

:: -----------------------------------------------------------------
:: 4. Upload Build Artifacts to S3
:: -----------------------------------------------------------------
echo [4/4] Uploading build files to s3://%BUCKET_NAME%...

call aws s3 sync build/ "s3://%BUCKET_NAME%" --delete --region "%AWS_REGION%"
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] S3 upload failed!
    exit /b %ERRORLEVEL%
)

echo.
echo ================================================================
echo                Frontend Deployed Successfully!
echo ================================================================
echo.
echo Your application is live at:
echo   %FRONTEND_URL%
echo.
echo Connected to Backend API:
echo   %API_ENDPOINT%
echo.
exit /b 0
