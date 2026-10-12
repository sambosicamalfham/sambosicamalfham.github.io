/* عامل خدمة بسيط: بيخلّي المتجر ينزل كتطبيق.
   ما بيخزّن صفحات — دايماً بيجيب أحدث نسخة من الإنترنت، فالتحديثات بتوصل فوراً. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if(e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => new Response(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:sans-serif;text-align:center;padding:60px 20px;direction:rtl"><h2>📶 ما في إنترنت</h2><p>تأكد من الاتصال وجرّب كمان مرة</p><button onclick="location.reload()" style="padding:12px 22px;border-radius:12px;border:0;background:#e3242b;color:#fff;font-size:16px">جرّب كمان مرة</button></body>',
    {headers: {'Content-Type': 'text/html; charset=utf-8'}})));
});
