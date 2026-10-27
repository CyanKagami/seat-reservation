import { randomUUID } from 'node:crypto';

function writeLog(level, message, context = {}) {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context
  };
  console[level](JSON.stringify(record));
}

function getErrorDetails(error) {
  if (!error || typeof error !== 'object') {
    return { message: String(error) };
  }

  const details = {
    name: error.name,
    message: error.message,
    stack: error.stack
  };
  for (const key of ['code', 'Code', '$fault']) {
    if (error[key] !== undefined) details[key] = error[key];
  }
  if (error.$metadata) {
    details.aws = {
      httpStatusCode: error.$metadata.httpStatusCode,
      requestId: error.$metadata.requestId,
      attempts: error.$metadata.attempts,
      totalRetryDelay: error.$metadata.totalRetryDelay
    };
  }
  return details;
}

export function logInfo(message, context = {}) {
  writeLog('info', message, context);
}

export function logWarn(message, context = {}) {
  writeLog('warn', message, context);
}

export function logError(message, error, context = {}) {
  writeLog('error', message, { ...context, error: getErrorDetails(error) });
}

export function requestLogContext(req, context = {}) {
  return {
    ...context,
    requestId: req.requestId,
    method: req.method,
    path: `${req.baseUrl || ''}${req.path}`
  };
}

export function requestLogger(service) {
  return (req, res, next) => {
    req.requestId = req.apiGateway?.context?.awsRequestId || randomUUID();
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const requestLog = {
        service,
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100
      };
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
      writeLog(level, 'HTTP request completed', requestLog);
    });

    next();
  };
}
