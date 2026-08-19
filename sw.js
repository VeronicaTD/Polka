/* Polka service worker — ТОЛЬКО веб-пуш. Без fetch/кэша, чтобы не мешать авто-обновлению приложения. */
const SB_URL = "https://pgcncqcgrmiibojwtfnn.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnY25jcWNncm1paWJvand0Zm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NjkzODAsImV4cCI6MjA5NzU0NTM4MH0.Nygp00DifqzDfxBschFMqypyjPOoK2gB8-oeGI8WnqE";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; }
  catch (e) { d = { body: event.data ? event.data.text() : "" }; }
  const title = (typeof d.title === "string") ? d.title : "Polka";   // "" → только имя приложения + тело
  const opts = {
    body: d.body || "",
    icon: d.icon || "icon-192.png",
    badge: d.badge || "icon-192.png",
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { url: d.url || self.registration.scope, logId: d.logId || null }
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const scope = self.registration.scope;
  const target = data.url || scope;
  event.waitUntil((async () => {
    // отметить, что пуш ОТКРЫТ (для правила «3 раза не открыл → пауза»)
    if (data.logId) {
      try {
        await fetch(SB_URL + "/rest/v1/rpc/notif_opened", {
          method: "POST",
          headers: { apikey: SB_ANON, Authorization: "Bearer " + SB_ANON, "Content-Type": "application/json" },
          body: JSON.stringify({ p_id: data.logId })
        });
      } catch (e) {}
    }
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list) {
      if (c.url.indexOf(scope) === 0) {
        try { if (target && c.navigate) await c.navigate(target); } catch (e) {}
        return c.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  })());
});
