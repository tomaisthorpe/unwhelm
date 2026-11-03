/// <reference lib="esnext" />
/// <reference lib="webworker" />

import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Only build-time static assets are precached. Pages, RSC responses, and
  // APIs can contain private data and must never enter a runtime cache.
  runtimeCaching: [
    {
      matcher: ({ sameOrigin }) => sameOrigin,
      handler: new NetworkOnly(),
    },
  ],
});

// Remove private responses saved by previous versions of the worker.
const legacyPrivateCaches = new Set([
  "pages",
  "pages-rsc",
  "pages-rsc-prefetch",
  "apis",
  "next-data",
  "static-data-assets",
  "others",
]);

// External scripts keep the page's CSP context instead of being fetched under
// the worker's policy, which cannot carry the page's script nonce.
self.addEventListener("install", serwist.handleInstall);
self.addEventListener("activate", (event) => {
  serwist.handleActivate(event);
  event.waitUntil(
    self.caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => legacyPrivateCaches.has(name))
          .map((name) => self.caches.delete(name)),
      ),
    ),
  );
});
self.addEventListener("message", serwist.handleCache);
self.addEventListener("fetch", (event) => {
  if (new URL(event.request.url).origin === self.location.origin) {
    serwist.handleFetch(event);
  }
});
