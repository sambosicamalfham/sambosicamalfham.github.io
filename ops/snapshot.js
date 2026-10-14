/* بيكتب نسخة من المنيو (معلومات عامة بس — نفس اللي الزبون بيشوفه) لـ ops/menu.json
   عشان Claude يقدر يقرأ المنيو. ما فيها أرقام زباين ولا طلبات ولا كوبونات. */
const fs = require('fs');
const admin = require('firebase-admin');
admin.initializeApp({credential: admin.credential.cert(JSON.parse(process.env.SA))});
const db = admin.firestore();
const clean = o => JSON.parse(JSON.stringify(o, (k, v) => (v && typeof v.toDate === 'function') ? v.toDate().toISOString() : v));
(async () => {
  const out = {at: new Date().toISOString()};
  for(const c of ['categories', 'items', 'optionGroups', 'deals']){
    const s = await db.collection(c).get(); out[c] = {}; s.docs.forEach(d => out[c][d.id] = clean(d.data()));
  }
  const st = (await db.collection('settings').doc('main').get()).data() || {};
  ['blocked', 'mktOff', 'inv', 'backup', 'osek'].forEach(k => delete st[k]);
  out.settings = clean(st);
  fs.writeFileSync(__dirname + '/menu.json', JSON.stringify(out, null, 1));
  console.log(Object.keys(out).map(k => k + ':' + (typeof out[k] === 'object' ? Object.keys(out[k]).length : '')).join(' '));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
