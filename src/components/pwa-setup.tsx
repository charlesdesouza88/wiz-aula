"use client";

import { useEffect } from "react";
import { listenForInstallPrompt } from "@/lib/install";
import { registerServiceWorker } from "@/lib/push";

/** Registers the service worker and catches the install prompt. Renders nothing. */
export function PwaSetup() {
  useEffect(() => {
    listenForInstallPrompt();
    registerServiceWorker();
  }, []);
  return null;
}
