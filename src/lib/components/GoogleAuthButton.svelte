<script lang="ts">
  import { onMount } from 'svelte';
    import type { GoogleUser } from '$lib/type/googleUser';
    import { goto } from '$app/navigation';
    import { user } from '$lib/store/auth.svelte';


  let { clientId } = $props();
  let buttonContainer = $state<HTMLDivElement | null>(null);
    let isLoaded = $state(false);

  onMount(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      // ⚡ ใช้ Type Casting เข้าถึง google บน window โดยตรง
      const google = (window as any).google;
      if (google) {
        // Initialize รอไว้สำหรับ Custom Trigger
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false
        });
        isLoaded = true;
      }
    };

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  });


  function onError(err:String) {
    console.log(err)
  }

  function handleCustomLogin() {
    const google = (window as any).google;
    if (!google) {
      onError('Google SDKยังไม่พร้อมใช้งาน');
      return;
    }

    // สั่งเปิด Google Prompt / Account Picker
    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // หาก Prompt แบบ One Tap โดนบล็อก หรือเคยปิดไป จะสั่ง fallback ให้แสดงกล่องเลือกบัญชี Google
        google.accounts.id.prompt();
      }
    });
  }

  async function handleCredentialResponse(response: { credential: string }): Promise<void> {
    const idToken = response.credential;

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken })
      });

      const data: { success: boolean; user?: GoogleUser; message?: string } = await res.json();

      if (res.ok && data.success && data.user) {
        user.email = data.user.email
        user.googleId = data.user.googleId
        user.name = data.user.name
        user.picture = data.user.picture

        console.log(user.picture)

        goto("/", { replaceState: true });
      } else {
        console.log(data)
        console.log(res)
        onError(data.message || 'Authentication failed');
      }
    } catch (err) {
      if (err instanceof Error) {
        onError(err.message);
      } else {
        onError('An unexpected error occurred');
      }
    }
  }
</script>
<button
  class="bg-secondary hover:bg-secondary-hover w-full h-10 rounded-lg text-white font-semibold"
  onclick={handleCustomLogin}
  disabled={!isLoaded}
>
  GOOGLE AUTH
</button>
