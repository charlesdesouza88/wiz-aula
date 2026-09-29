// Wiz Aula service worker: shows push alerts and opens the class when one is tapped.
// Payload (from supabase/functions/send-push): { title, body, url, tag }.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Wiz Aula", {
      body: data.body || "Toque para entrar na aula.",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: data.tag,
      renotify: Boolean(data.tag),
      requireInteraction: true,
      lang: "pt-BR",
      data: { url: data.url || "/" },
    }),
  );
});

// Tapping the alert opens the Meet link directly (the Meet app on phones).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(self.clients.openWindow(url));
});
