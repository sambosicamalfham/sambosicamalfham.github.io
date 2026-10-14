/* إشعارات للسائقين — بترنّ التلفون حتى لو مسكّر
   newOrder : طلب توصيل جديد  → لكل السائقين الفعّالين
   assigned : صاحب المحل اختار سائق للطلب → لهالسائق بس */
const functions = require('firebase-functions/v1');
// firebase-admin بنحمّله بس وقت التشغيل (عشان الرفع يكون أسرع)
let admin = null, db = null;
function init(){ if(!admin){ admin = require('firebase-admin'); admin.initializeApp(); db = admin.firestore(); } }
const SITE = 'https://sambosicamalfham.github.io/driver.html';

const TXT = {
  ar: {newT: '🛵 طلب جديد للتوصيل', asgT: '🛵 المحل أعطاك طلب'},
  he: {newT: '🛵 הזמנה חדשה למשלוח', asgT: '🛵 המסעדה העבירה לך הזמנה'}
};

async function driverDocs(uid){
  init();
  if(uid){ const d = await db.collection('drivers').doc(uid).get(); return d.exists ? [d] : []; }
  const s = await db.collection('drivers').where('active', '==', true).get();
  return s.docs;
}

async function push(docs, kind, o, id){
  const groups = {ar: [], he: []}, owner = {};
  docs.forEach(d => {
    const x = d.data(); if(!x.active || x.removed) return;
    const lang = x.lang === 'he' ? 'he' : 'ar';
    (x.fcm || []).forEach(t => { groups[lang].push(t); owner[t] = d.ref; });
  });
  const c = o.customer || {};
  const body = [c.addr || '', c.zone || '', '₪' + Number(o.total || 0)].filter(Boolean).join(' · ');
  for(const lang of ['ar', 'he']){
    const tokens = groups[lang]; if(!tokens.length) continue;
    const title = TXT[lang][kind];
    for(let i = 0; i < tokens.length; i += 500){
      const part = tokens.slice(i, i + 500);
      const res = await admin.messaging().sendEachForMulticast({
        tokens: part,
        notification: {title, body},
        data: {order: id, url: SITE},
        android: {priority: 'high'},
        webpush: {
          headers: {Urgency: 'high', TTL: '900'},
          notification: {title, body, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'pz-' + id, renotify: true,
                         requireInteraction: true, vibrate: [500, 200, 500, 200, 500, 200, 500]},
          fcmOptions: {link: SITE}
        }
      });
      // توكنات قديمة/ملغية — بنشيلها
      const bad = [];
      res.responses.forEach((r, k) => {
        const code = r.error && r.error.code;
        if(code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') bad.push(part[k]);
      });
      for(const t of bad) await owner[t].update({fcm: admin.firestore.FieldValue.arrayRemove(t)}).catch(() => {});
    }
  }
}

exports.newOrder = functions.region('europe-west1').firestore.document('orders/{id}').onCreate(async (snap, ctx) => {
  const o = snap.data() || {};
  if(o.type !== 'delivery') return null;
  await push(await driverDocs(null), 'newT', o, ctx.params.id);
  return null;
});

exports.assigned = functions.region('europe-west1').firestore.document('orders/{id}').onUpdate(async (ch, ctx) => {
  const a = ch.before.data() || {}, b = ch.after.data() || {};
  if(!b.driverUid || !b.assigned || b.assigned === a.assigned) return null;
  if(['done', 'cancel'].includes(b.status)) return null;
  await push(await driverDocs(b.driverUid), 'asgT', b, ctx.params.id);
  return null;
});

/* 💾 نسخة احتياطية تلقائية — كل يوم الساعة 4 الفجر
   بتحفظ كل البيانات بملف JSON بـ Firebase Storage ← backups/
   وبتمسح النسخ اللي أقدم من 30 يوم */
const BK_COLS = ['settings','categories','items','optionGroups','deals','coupons','orders','loyalty','reviews','drivers','shifts','staff'];
function bkClean(o){
  if(Array.isArray(o)) return o.map(bkClean);
  if(o && typeof o === 'object'){
    if(typeof o.toDate === 'function') return {__ts: o.toDate().toISOString()};
    const r = {}; Object.keys(o).forEach(k => r[k] = bkClean(o[k])); return r;
  }
  return o;
}
exports.dailyBackup = functions.region('europe-west1').runWith({timeoutSeconds: 300, memory: '512MB'})
  .pubsub.schedule('0 4 * * *').timeZone('Asia/Jerusalem').onRun(async () => {
  init();
  const out = {app: 'pizza-um-elfahem', at: new Date().toISOString(), data: {}};
  let docs = 0;
  for(const c of BK_COLS){
    const s = await db.collection(c).get();
    out.data[c] = {};
    s.docs.forEach(d => { out.data[c][d.id] = bkClean(d.data()); docs++; });
  }
  const bucket = admin.storage().bucket();
  const name = 'backups/backup-' + out.at.slice(0, 10) + '.json';
  await bucket.file(name).save(JSON.stringify(out), {contentType: 'application/json', resumable: false});
  // نمسح القديم (أكثر من 30 يوم)
  const [files] = await bucket.getFiles({prefix: 'backups/'});
  const old = Date.now() - 30 * 864e5;
  for(const f of files){
    const m = f.name.match(/backup-(\d{4}-\d{2}-\d{2})\.json$/);
    if(m && new Date(m[1]).getTime() < old) await f.delete().catch(() => {});
  }
  await db.collection('settings').doc('main').set({backup: {last: out.at, docs, file: name}}, {merge: true});
  return null;
});
