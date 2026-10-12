/* إشعارات Firebase (السائقين) — بترنّ حتى لو التلفون مسكّر */
try{
  self.window = self;
  importScripts('firebase-config.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
  firebase.initializeApp(self.FB_CONFIG);
  firebase.messaging();
}catch(e){}
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

/* لما السائق يكبس على الإشعار — بنفتح صفحة السائق */
self.addEventListener('notificationclick', e => {
  if(e.notification.data && e.notification.data.FCM_MSG) return;   // Firebase بيفتحها لحاله
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './driver.html';
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(list => {
    for(const c of list){ if(c.url.includes('driver.html') && 'focus' in c) return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
