const INSTALL_DISMISSED_KEY = 'fts:pwa-install-dismissed';

const isStandaloneDisplay = () => {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // @ts-expect-error - iOS Safari exposes this flag.
  if (typeof navigator.standalone === 'boolean' && navigator.standalone) {
    return true;
  }

  return false;
};

const getLocalStorage = () => {
  try {
    return window.localStorage;
  } catch (_err) {
    return null;
  }
};

type InstallOutcome = 'accepted' | 'dismissed';

declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    prompt(): Promise<void>;
    readonly userChoice: Promise<{
      outcome: InstallOutcome;
      platform: string;
    }>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const shouldSuppressPrompt = () => {
  if (isStandaloneDisplay()) {
    return true;
  }

  const storage = getLocalStorage();
  if (!storage) {
    return false;
  }

  return storage.getItem(INSTALL_DISMISSED_KEY) === '1';
};

const persistDismissal = () => {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  storage.setItem(INSTALL_DISMISSED_KEY, '1');
};

const clearDismissal = () => {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(INSTALL_DISMISSED_KEY);
};

export const setupPwaInstallPrompt = (button: HTMLButtonElement) => {
  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  const hideButton = () => {
    button.hidden = true;
    button.disabled = false;
  };

  const showButton = () => {
    button.hidden = false;
    button.disabled = false;
  };

  hideButton();

  window.addEventListener('beforeinstallprompt', (event) => {
    if (shouldSuppressPrompt()) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    deferredPrompt = event;
    showButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideButton();
    clearDismissal();
  });

  button.addEventListener('click', async () => {
    if (!deferredPrompt) {
      return;
    }

    button.disabled = true;
    deferredPrompt.prompt();

    try {
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        clearDismissal();
      } else {
        persistDismissal();
      }
    } finally {
      deferredPrompt = null;
      hideButton();
    }
  });
};
