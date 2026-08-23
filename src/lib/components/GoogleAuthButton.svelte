<script lang="ts">
  let { clientId } = $props();

  function handleGoogleRedirect() {
    // 1. Where Google will send the user back after login
    const origin = window.location.origin.replace(/\/$/, '');
    const redirectUri = `${origin}/api/auth/google/callback`;
    
    // 2. Request standard profile and email scopes
    const scope = 'openid email profile';

    // 3. Construct Google OAuth 2.0 Authorization URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code', // Asks Google for an authorization code
      scope: scope,
      access_type: 'online',
      prompt: 'select_account' // Forces account selection screen
    });

    // 4. Redirect the browser to Google
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }
</script>

<button
  class="bg-secondary hover:bg-secondary-hover w-full h-10 rounded-lg text-white font-semibold"
  onclick={handleGoogleRedirect}
>
  GOOGLE AUTH
</button>