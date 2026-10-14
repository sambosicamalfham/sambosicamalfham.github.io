/* بيدمج ops/settings.json جوا settings/main بـ Firestore (merge — ما بيمسح إشي مش مكتوب بالملف).
   بيشتغل من GitHub Actions بس، بالمفتاح المحفوظ بالـ Secrets. */
const fs = require('fs');
const admin = require('firebase-admin');
const patch = JSON.parse(fs.readFileSync(__dirname + '/settings.json', 'utf8'));
delete patch._note;
const BLOCK = ['blocked', 'inv', 'backup'];             // أشياء حساسة ما بتنلمس من هون
for(const k of BLOCK) if(k in patch){ console.error('refusing to touch: ' + k); process.exit(1); }
if(!Object.keys(patch).length){ console.log('nothing to apply'); process.exit(0); }
admin.initializeApp({credential: admin.credential.cert(JSON.parse(process.env.SA))});
admin.firestore().collection('settings').doc('main').set(patch, {merge: true})
  .then(() => { console.log('applied:', Object.keys(patch).join(', ')); process.exit(0); })
  .catch(e => { console.error(e.message); process.exit(1); });
