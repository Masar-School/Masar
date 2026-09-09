// Service Worker مشترك لتطبيقي مسار (الأهالي والطاقم)
// إستراتيجية بسيطة: صفحات HTML = الشبكة أولاً ثم النسخة المخزّنة عند انقطاع الإنترنت.
// باقي الملفات (أيقونات، مانفست) = المخزّن المحلي أولاً لأنها لا تتغيّر كثيراً.

const CACHE_NAME = "masar-cache-v1";
const PRECACHE_URLS = [
  "./index.html",
  "./Masar-staff.html",
  "./manifest-parent.json",
  "./manifest-staff.json",
  "./icon-parent-192.png",
  "./icon-parent-512.png",
  "./icon-staff-192.png",
  "./icon-staff-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const isHTML = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    // صفحات HTML: جرّب الشبكة أولاً (بيانات حيّة من الشيت)، ولو فشل استخدم آخر نسخة محفوظة
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // باقي الملفات الثابتة: المخزّن أولاً، والشبكة كخطة بديلة
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
