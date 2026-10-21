'use client';

import React, { useEffect, useState } from 'react';
import { DownloadSimple, WifiSlash, ShareNetwork, X } from '@phosphor-icons/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAStatus() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isOnline,
    installApp,
  };
}

export function PWAInstallControl() {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAStatus();
  const [showModal, setShowModal] = useState(false);

  if (isInstalled) return null;

  return (
    <>
      <button
        onClick={() => {
          if (isInstallable) {
            installApp();
          } else {
            setShowModal(true);
          }
        }}
        className="min-h-[40px] px-3.5 py-2 rounded-full bg-[#EDFF8C] text-[#0D0F0E] hover:bg-[#e3f773] transition-colors flex items-center gap-2 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
        title="Install Quora Bid Architect as a standalone PWA"
      >
        <DownloadSimple size={16} weight="bold" />
        <span>Install App</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#161918] border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0D0F0E] dark:text-white">
                Install Quora Bid Architect (PWA)
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Quora Bid Architect is offline-ready with service worker caching and local IndexedDB/storage persistence so you can review tenders and edit proposals anywhere.
            </p>
            {isIOS ? (
              <div className="mt-4 p-4 rounded-2xl bg-[#F1F1F1] dark:bg-[#0D0F0E] text-xs space-y-2 text-neutral-700 dark:text-neutral-300">
                <div className="flex items-center gap-2 font-semibold text-[#0D0F0E] dark:text-white">
                  <ShareNetwork size={16} className="text-[#309F92]" />
                  <span>iOS Safari Installation Steps:</span>
                </div>
                <p>1. Tap the Share button in the Safari bottom bar.</p>
                <p>2. Select Add to Home Screen to launch in full-screen standalone mode.</p>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-2xl bg-[#F1F1F1] dark:bg-[#0D0F0E] text-xs space-y-2 text-neutral-700 dark:text-neutral-300">
                <p className="font-semibold text-[#0D0F0E] dark:text-white">
                  Desktop / Chrome / Edge Installation:
                </p>
                <p>
                  Click the Install icon in your browser address bar (or open this app in a top-level browser tab outside the preview iframe) to install directly to your OS dock.
                </p>
              </div>
            )}
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="min-h-[44px] px-5 py-2 rounded-full bg-[#0D0F0E] text-white dark:bg-[#EDFF8C] dark:text-[#0D0F0E] text-xs font-semibold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineBanner() {
  const { isOnline } = usePWAStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-5 left-4 z-50 flex items-center gap-2.5 rounded-full bg-[#0D0F0E] text-[#EDFF8C] border border-[#EDFF8C]/40 px-4 py-2 text-xs font-semibold shadow-lg">
      <WifiSlash size={16} weight="bold" />
      <span>Offline Mode Active · Changes saved to local proposal vault</span>
    </div>
  );
}
