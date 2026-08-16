/* Polka service worker — ТОЛЬКО веб-пуш. Без fetch/кэша, чтобы не мешать авто-обновлению приложения. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; }
  catch (e) { d = { body: event.data ? event.data.text() : "" }; }
  const title = (typeof d.title === "string") ? d.title : "Polka";   // можно передать "" — тогда iOS покажет только имя приложения + тело
  const opts = {
    body: d.body || "",
    icon: d.icon || "icon-192.png",
    badge: d.badge || "icon-192.png",
    tag: d.tag || undefined,          // одинаковый tag схлопывает повторы (напр. по каждому совместному чтению)
    renotify: !!d.tag,
    data: { url: d.url || self.registration.scope }
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const scope = self.registration.scope;
  const target = (event.notification.data && event.notification.data.url) || scope;
  event.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list) {
      if (c.url.indexOf(scope) === 0) {           // уже открыто окно Polka — фокусим его
        try { if (target && c.navigate) await c.navigate(target); } catch (e) {}
        return c.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  })());
});
