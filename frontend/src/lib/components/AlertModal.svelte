<script lang="ts">
  type ModalType = 'success' | 'failure' | 'warning' | 'information';

  // Svelte 5 Props destructuring with default values
  let {
    type = 'information',
    isOpen = $bindable(false),
    title = '',
    message = '',
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCancel = false,
    onconfirm = () => {},
    oncancel = () => {}
  }: {
    type?: ModalType;
    isOpen?: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    onconfirm?: () => void;
    oncancel?: () => void;
  } = $props();

  // State configurations for the four modes
  const stateConfig = {
    success: {
      borderColor: 'border-emerald-500',
      bgColor: 'bg-emerald-50 text-emerald-900',
      iconBg: 'bg-emerald-100 text-emerald-600',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      icon: '✓'
    },
    failure: {
      borderColor: 'border-rose-500',
      bgColor: 'bg-rose-50 text-rose-900',
      iconBg: 'bg-rose-100 text-rose-600',
      buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white',
      icon: '✕'
    },
    warning: {
      borderColor: 'border-amber-500',
      bgColor: 'bg-amber-50 text-amber-900',
      iconBg: 'bg-amber-100 text-amber-600',
      buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white',
      icon: '⚠'
    },
    information: {
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-50 text-blue-900',
      iconBg: 'bg-blue-100 text-blue-600',
      buttonBg: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: 'ℹ'
    }
  };

  // Svelte 5 Reactive Derived State
  let currentConfig = $derived(stateConfig[type]);

  function handleConfirm() {
    onconfirm();
    isOpen = false;
  }

  function handleCancel() {
    oncancel();
    isOpen = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    }
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4"
    onclick={handleCancel}
    onkeydown={handleKeydown}
    role="button"
    tabindex="-1"
  >
    <!-- Modal Box -->
    <div 
      class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border-t-4 {currentConfig.borderColor}"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      tabindex="0"
    >
      <div class="flex items-start gap-4">
        <!-- State Icon -->
        <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-xl font-bold {currentConfig.iconBg}">
          {currentConfig.icon}
        </div>

        <!-- Content -->
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900">
            {title}
          </h3>
          <p class="mt-2 text-sm text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-6 flex justify-end gap-3">
        {#if showCancel}
          <button
            type="button"
            class="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer "
            onclick={handleCancel}
          >
            {cancelText}
          </button>
        {/if}
        <button
          type="button"
          class="rounded-xl px-5 py-2 text-sm font-medium shadow-sm transition-colors cursor-pointer {currentConfig.buttonBg}"
          onclick={handleConfirm}
        >
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}