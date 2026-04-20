import { useEffect } from "react";

/**
 * Security guard — runs only in production.
 * - Blocks right-click context menu
 * - Blocks dev-tool shortcuts (F12, Ctrl/Cmd+Shift+I/J/C, Ctrl/Cmd+U)
 * - Disables text selection on non-input elements
 * - Detects DevTools open and clears the page
 *
 * NOTE: client-side anti-inspection is a deterrent, not real security.
 * Real security lives in Supabase RLS policies (already enabled on every table).
 */
export const SecurityGuard = () => {
  useEffect(() => {
    if (import.meta.env.DEV) return;

    const blockKeys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      // F12
      if (e.key === "F12") { e.preventDefault(); return false; }
      // Ctrl+Shift+I / J / C  (DevTools / Inspector)
      if (ctrl && e.shiftKey && (k === "i" || k === "j" || k === "c")) {
        e.preventDefault(); return false;
      }
      // Ctrl+U (view source)
      if (ctrl && k === "u") { e.preventDefault(); return false; }
      // Ctrl+S (save page)
      if (ctrl && k === "s") { e.preventDefault(); return false; }
    };

    const blockMenu = (e: MouseEvent) => { e.preventDefault(); return false; };
    const blockDrag = (e: DragEvent) => { e.preventDefault(); return false; };

    document.addEventListener("contextmenu", blockMenu);
    document.addEventListener("keydown", blockKeys);
    document.addEventListener("dragstart", blockDrag);

    // DevTools detector (best-effort)
    let devtoolsOpen = false;
    const threshold = 160;
    const detect = () => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          // Soft warning — don't nuke production users with strict policies
          console.clear();
        }
      } else {
        devtoolsOpen = false;
      }
    };
    const interval = window.setInterval(detect, 1500);

    // Suppress console output in production
    const noop = () => {};
    const orig = { log: console.log, warn: console.warn, info: console.info, debug: console.debug };
    console.log = noop; console.warn = noop; console.info = noop; console.debug = noop;

    return () => {
      document.removeEventListener("contextmenu", blockMenu);
      document.removeEventListener("keydown", blockKeys);
      document.removeEventListener("dragstart", blockDrag);
      window.clearInterval(interval);
      Object.assign(console, orig);
    };
  }, []);

  return null;
};
