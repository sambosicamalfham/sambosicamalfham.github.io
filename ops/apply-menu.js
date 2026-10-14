/* بيدمج ops/menu-patch.json جوّا المنيو بـ Firebase (items / optionGroups / deals / categories) حسب الـ id.
   merge بس — ما بيمسح ولا صنف. ما بيلمس طلبات ولا زباين ولا إعدادات. بيشتغل من GitHub Actions بس. */
const fs = require('fs');
const admin = require('firebase-admin');
const patch = JSON.parse(fs.readFileSync(__dirname + '/menu-patch.json', 'utf8'));
delete patch._note;
const OK = ['items', 'optionGroups', 'deals', 'categories'];
for(const k of Object.keys(patch)) if(!OK.includes(k)){ console.error('refusing collection: ' + k); process.exit(1); }
admin.initializeApp({credential: admin.credential.cert(JSON.parse(process.env.SA))});
const db = admin.firestore();
(async () => {
  const b = db.batch(); let n = 0;
  for(const c of Object.keys(patch)) for(const [id, data] of Object.entries(patch[c])){ b.set(db.collection(c).doc(id), data, {merge: true}); n++; }
  if(n) await b.commit();
  console.log('applied ' + n + ' docs: ' + Object.keys(patch).map(c => c + ' ' + Object.keys(patch[c]).length).join(', '));
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
