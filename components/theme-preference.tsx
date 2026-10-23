"use client";

import { useEffect, useSyncExternalStore } from "react";

export const THEME_STORAGE_KEY = "quora_bid_architect_theme_v1";
export type ThemePreference = "system" | "light" | "dark";

let sessionPreference: ThemePreference | null = null;
const THEME_EVENT = "bidcraft:theme-preference";

function readPreference(): ThemePreference {
  if (sessionPreference) return sessionPreference;
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
  } catch {
    /* The OS preference remains usable when storage is disabled. */
  }
  return "system";
}

function prefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function listenForThemeChanges(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === THEME_STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_EVENT, callback);
  media.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_EVENT, callback);
    media.removeEventListener("change", callback);
  };
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(listenForThemeChanges, readPreference, () => "system");
}

export function useDarkTheme(): boolean {
  return useSyncExternalStore(
    listenForThemeChanges,
    () => readPreference() === "dark" || (readPreference() === "system" && prefersDark()),
    () => false,
  );
}

function applyTheme() {
  const theme = readPreference();
  const dark = theme === "dark" || (theme === "system" && prefersDark());
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = dark ? "#101714" : "#F8F6EF";
  });
}

export function setThemePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
    sessionPreference = null;
  } catch {
    // Maintain the choice for this tab when persistence is disabled.
    sessionPreference = preference;
  }
  applyTheme();
  window.dispatchEvent(new Event(THEME_EVENT));
}

/** Global theme and PWA setup, even if the Settings popup has never been opened. */
export function AppClientSetup() {
  useEffect(() => {
    applyTheme();
    const unsubscribe = listenForThemeChanges(applyTheme);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return unsubscribe;
  }, []);
  return null;
}
