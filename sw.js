/* إدارة شؤوني - يحفظ ملفات التطبيق في الجهاز ليعمل بدون إنترنت. لا يرسل أي بيانات.
 * عند كل تحديث يتغيّر رقم CACHE، فيحمّل الجهاز الملفات الجديدة ويحذف القديمة. */
const CACHE = 'masareef-v2.108.0';
const FILES = [
  './', './index.html', './style.css', './app.js', './business.js', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' }))).then(() => c.add(new Request('./amiri-quran.woff', { cache: 'reload' })).catch(() => {})).then(() => c.addAll(['./pdf.min.js','./pdf.worker.min.js'].map(u => new Request(u, { cache: 'reload' }))).catch(() => {})))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== OCR_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ملفات التطبيق من الذاكرة أولًا، وما ليس فيها من الإنترنت ثم يُحفظ.
// طلبات Google (المزامنة) لا تمر من هنا.
// قارئ العداد (مجلد ocr) كبير الحجم: يُحفظ في ذاكرة مستقلة عند أول استخدام ولا يُحذف مع التحديثات
const OCR_CACHE = 'masareef-ocr-v1';
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  if (new URL(e.request.url).pathname.includes('/ocr/')) {
    e.respondWith(caches.open(OCR_CACHE).then(c => c.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => { if (res.ok) c.put(e.request, res.clone()); return res; }))));
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
      // نحفظ الردود السليمة فقط، حتى لا تُحفظ صفحة خطأ مكان ملف حقيقي
      if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
  );
});
/* الضغط على إشعار التقرير يفتح التطبيق على التقرير */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) { c.navigate && c.navigate(url).catch(() => {}); return c.focus(); } }
    return self.clients.openWindow ? self.clients.openWindow(url) : null;
  }));
});
