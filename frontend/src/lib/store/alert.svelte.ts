type ModalType = 'success' | 'failure' | 'warning' | 'information';

interface AlertOptions {
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onconfirm?: () => void;
  oncancel?: () => void;
}

class AlertStore {
  isOpen = $state(false);
  type = $state<ModalType>('information');
  title = $state('');
  message = $state('');
  confirmText = $state('OK');
  cancelText = $state('Cancel');
  showCancel = $state(false);
  onconfirm = $state<() => void>(() => {});
  oncancel = $state<() => void>(() => {});

  // Generic show method
  show(options: AlertOptions) {
    this.title = options.title;
    this.message = options.message;
    this.type = options.type ?? 'information';
    this.confirmText = options.confirmText ?? 'OK';
    this.cancelText = options.cancelText ?? 'Cancel';
    this.showCancel = options.showCancel ?? false;
    this.onconfirm = options.onconfirm ?? (() => {});
    this.oncancel = options.oncancel ?? (() => {});
    this.isOpen = true;
  }

  // Quick helper shortcuts
  success(title: string, message: string, onconfirm?: () => void) {
    this.show({ title, message, type: 'success', onconfirm });
  }

  failure(title: string, message: string, onconfirm?: () => void) {
    this.show({ title, message, type: 'failure', onconfirm });
  }

  warning(title: string, message: string, options?: Omit<AlertOptions, 'title' | 'message' | 'type'>) {
    this.show({ title, message, type: 'warning', ...options });
  }

  information(title: string, message: string, options?: Omit<AlertOptions, 'title' | 'message' | 'type'>) {
    this.show({ title, message, type: 'information', ...options });
  }
}

// Export a single shared instance (Singleton)
export const alertModal = new AlertStore();