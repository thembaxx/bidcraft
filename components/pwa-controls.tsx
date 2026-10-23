"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { DownloadSimple, WifiSlash, ShareNetwork, X } from "@phosphor-icons/react";

import { Dialog } from "./ui/dialog";

const subscribeOnline = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};
const subscribeInstalled = (callback: () => void) => {
  const media = window.matchMedia("(display-mode: standalone)");
  window.addEventListener("appinstalled", callback);
  media.addEventListener("change", callback);
  return () => {
    window.removeEventListener("appinstalled", callback);
    media.removeEventListener("change", callback);
  };
};
const emptySubscription = () => () => {};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePWAStatus() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const isInstalled = useSyncExternalStore(
    subscribeInstalled,
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    () => false,
  );
  const isIOS = useSyncExternalStore(
    emptySubscription,
    () => /iphone|ipad|ipod/i.test(navigator.userAgent),
    () => false,
  );
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      return outcome === "accepted";
    } catch {
      return false;
    } finally {
      setDeferredPrompt(null);
    }
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isOnline,
    installApp,
  };
}

export function PWAInstallControl({
  variant = "button",
  status,
}: {
  variant?: "button" | "menu";
  status: ReturnType<typeof usePWAStatus>;
}) {
  const { isInstallable, isInstalled, isIOS, installApp } = status;
  const [showModal, setShowModal] = useState(false);

  if (isInstalled) return null;

  return (
    <>
      <button
        onClick={() => {
          if (isInstallable) {
            void installApp().then((accepted) => {
              if (!accepted) setShowModal(true);
            });
          } else {
            setShowModal(true);
          }
        }}
        className={
          variant === "menu"
            ? "flex min-h-11 w-full items-center gap-3 rounded-xl bg-[#DDFB82]/65 px-3 text-xs font-bold text-[#101714] transition-colors hover:bg-[#DDFB82] dark:bg-[#DDFB82]/90 dark:hover:bg-[#DDFB82]"
            : "min-h-11 px-3.5 py-2 rounded-full bg-[#DDFB82] text-[#0D0F0E] hover:bg-[#e3f773] transition-colors flex items-center gap-2 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
        }
        title="Install Bidcraft as a standalone PWA"
      >
        <DownloadSimple size={16} weight="bold" />
        <span>{variant === "menu" ? "Install Bidcraft" : "Install App"}</span>
      </button>

      {showModal && (
        <Dialog labelledBy="install-title" onClose={() => setShowModal(false)}>
          <div className="flex items-center justify-between">
            <h3 id="install-title" className="text-lg font-bold text-[#0D0F0E] dark:text-white">
              Install Bidcraft (PWA)
            </h3>
            <button
              aria-label="Close install instructions"
              onClick={() => setShowModal(false)}
              className="min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X size={18} />
            </button>
          </div>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            After an online visit, some cached pages and locally saved bid content may be available
            offline. Offline access is not guaranteed; live tender updates and AI processing require
            a connection.
          </p>
          {isIOS ? (
            <div className="mt-4 p-4 rounded-2xl bg-[#F8F6EF] dark:bg-[#0D0F0E] text-xs space-y-2 text-neutral-700 dark:text-neutral-300">
              <div className="flex items-center gap-2 font-semibold text-[#0D0F0E] dark:text-white">
                <ShareNetwork size={16} className="text-[#168B7A]" />
                <span>iOS Safari Installation Steps:</span>
              </div>
              <p>1. Tap the Share button in the Safari bottom bar.</p>
              <p>2. Select Add to Home Screen to launch in full-screen standalone mode.</p>
            </div>
          ) : (
            <div className="mt-4 p-4 rounded-2xl bg-[#F8F6EF] dark:bg-[#0D0F0E] text-xs space-y-2 text-neutral-700 dark:text-neutral-300">
              <p className="font-semibold text-[#0D0F0E] dark:text-white">
                Desktop / Chrome / Edge Installation:
              </p>
              <p>
                Click the Install icon in your browser address bar (or open this app in a top-level
                browser tab outside the preview iframe) to install directly to your OS dock.
              </p>
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <button
              onClick={() => setShowModal(false)}
              className="min-h-[44px] px-5 py-2 rounded-full bg-[#0D0F0E] text-white dark:bg-[#DDFB82] dark:text-[#0D0F0E] text-xs font-semibold"
            >
              Got It
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}

export function OfflineBanner() {
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-5 left-4 z-50 flex items-center gap-2.5 rounded-full bg-[#0D0F0E] text-[#DDFB82] border border-[#DDFB82]/40 px-4 py-2 text-xs font-semibold shadow-lg">
      <WifiSlash size={16} weight="bold" />
      <span>Offline · Local editing and search available. AI requires a connection.</span>
    </div>
  );
}
