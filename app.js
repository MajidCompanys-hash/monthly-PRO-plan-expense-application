/* ==========================================================================
 * إدارة شؤوني - منطق التطبيق (JavaScript)
 * يعمل بالكامل داخل الجهاز. لا يتصل إلا بـ Google Drive الخاص بك عند تفعيل المزامنة.
 *
 * المحتويات:
 *   1. الأساسيات: الثوابت والحالة والدوال المساعدة
 *   2. التخزين في الجهاز وقاعدة البيانات الداخلية
 *   3. النسخ الاحتياطي والإشعارات الصغيرة
 *   4. أيقونات الفئات
 *   5. لوحة «أقسامي» في الرئيسية
 *   6. مستشاري الذكي: تحليل بياناتك داخل الجهاز فقط
 *   7. لوحات الرئيسية ومكوّنات التقارير المشتركة
 *   8. الشاشات: الرئيسية، السجل، الميزانية، التقارير
 *   9. التقرير السنوي
 *  10. العرض
 *  11. التسجيل السريع
 *  12. نافذة إضافة وتعديل العمليات
 *  13. الالتزامات الشهرية، والأهل
 *  14. الخطط والأهداف: المناسبات وحساب الادخار
 *  15. الخطط والأهداف: معالج الخطة الذكية
 *  16. السيارات: التأمين والملكية والصيانة والتنبيهات
 *  17. ديوني وخطة التخلص منها
 *  18. الأمانات: أموال الآخرين التي عندك
 *  19. مستنداتي: الخزنة المشفّرة
 *  20. بصمة الوجه، تأكيد العمليات الخطيرة، ووضع المدير
 *  21. قراءة رسائل البنك
 *  22. المزامنة مع Google Drive
 *  23. المظهر والثيمات
 *  24. الإصدار وما الجديد
 *  25. بيانات المثال
 *  26. التقارير: الطباعة وPDF وExcel / Numbers
 *  27. ويدجت الآيفون والماك
 *  28. أدوات احترافية: الحسابات، الراتب المتوقع، التوقعات، القفل، التقويم، الزكاة
 *  29. الأحداث (الضغط والكتابة)
 *  30. التشغيل
 * ========================================================================== */
'use strict';
(function(){

/* ---------- 1. الأساسيات: الثوابت والحالة والدوال المساعدة ---------- */
const CUR='ر.ع.';
const EXP_CATS=[
 {id:'food',n:'بقالة وطعام',c:'#D08A2E'},{id:'rest',n:'مطاعم ومقاهي',c:'#C2562F'},
 {id:'fuel',n:'وقود ومواصلات',c:'#3E7CB1'},{id:'car',n:'صيانة وتأمين السيارة',c:'#5B6F8A'},{id:'bills',n:'فواتير (كهرباء، ماء، إنترنت)',c:'#6B5CA5'},
 {id:'home',n:'سكن وإيجار',c:'#2F7F7A'},{id:'loan',n:'أقساط والتزامات',c:'#8A4F7D'},
 {id:'health',n:'صحة',c:'#C0445A'},{id:'shop',n:'تسوق وملابس',c:'#B0662F'},
 {id:'edu',n:'تعليم ودورات',c:'#3B8F5A'},{id:'fun',n:'ترفيه وسفر',c:'#4E68C7'},
 {id:'family',n:'أهل وهدايا',c:'#A0527B'},{id:'charity',n:'صدقات وزكاة',c:'#2E8B72'},
 {id:'other',n:'أخرى',c:'#7A8494'}];
const INC_CATS=[{id:'salary',n:'راتب',c:'#1C7F55'},{id:'freelance',n:'عمل إضافي',c:'#2A8F7A'},
 {id:'business',n:'مبيعات المشروع',c:'#3A7D9A'},{id:'gift',n:'هدايا ومكافآت',c:'#7A6CC0'},{id:'iother',n:'دخل آخر',c:'#6C7A70'}];
const METHODS=[['cash','نقدًا'],['card','بطاقة'],['transfer','تحويل']];
const MONTHS=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const DAYS=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const catOf=id=>EXP_CATS.find(c=>c.id===id)||INC_CATS.find(c=>c.id===id)||EXP_CATS[EXP_CATS.length-1];

const S={quick:[],del:{},tx:{},settings:{monthlyBudget:0,budgets:{}},tab:'home',month:ym(new Date()),q:'',ftype:'all'};

function ym(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function isoD(d){return ym(d)+'-'+String(d.getDate()).padStart(2,'0')}
function today(){return isoD(new Date())}
function daysTo(iso){if(!iso)return null;return Math.ceil((new Date(iso+'T12:00')-new Date())/864e5)}
function fmtD(iso){if(!iso)return '—';const d=new Date(iso+'T12:00');return d.getDate()+' '+MONTHS[d.getMonth()]+' '+d.getFullYear()}
/* تقريب لثلاث خانات (البيسة) */
/* تقريب المبالغ لثلاث خانات (بيسة) بدقة، ومتماثل للسالب والموجب: 1.0005→1.001 و −1.0005→−1.001 */
function r3(x){x=Number(x)||0;const g=x<0?-1:1;return g*Math.round(Math.abs(x)*1000+1e-7)/1000||0}
/* عدد أيام الشهر الذي فيه التاريخ d */
function monthDays(d){return new Date(d.getFullYear(),d.getMonth()+1,0).getDate()}
/* العدد بالعربية: 1 واحد، 2 مثنى، 3-10 جمع، 11+ مفرد منصوب */
function countWord(n,one,two,few,many){return n===1?one:n===2?two:n<=10?n+' '+few:n+' '+many}
/* أيقونة خطية موحّدة */
function svgI(p,sw){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw||1.8}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`}
/* بداية النافذة المنبثقة الموحّدة */
function sheetTop(label){return `<div class="scrim" data-close></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${label}"><div class="in"><div class="grab"></div>`}
/* معدلات آخر n أشهر مكتملة لها بيانات (لا يدخل فيها الشهر الحالي) */
function pastMonths(n){const cm=ym(new Date());const out=[];for(let k=1;k<=(n||3);k++){const a=inMonth(shiftMonth(cm,-k));if(a.length)out.push(a)}return out}
function pastAvg(fn,n){const M=pastMonths(n);return M.length?M.reduce((s,a)=>s+fn(a),0)/M.length:null}
/* عرض المبالغ: بدون كسور إذا كان المبلغ صحيحًا، وبثلاث خانات (البيسة) إذا فيه كسور */
function money(v){const n=r3(Number(v)||0);const whole=Math.abs(n-Math.round(n))<0.0005;return n.toLocaleString('en-US',whole?{maximumFractionDigits:0}:{minimumFractionDigits:3,maximumFractionDigits:3})}
/* المبلغ مع العملة: نص عادي (للإشعارات) وعرض بخط صغير للعملة */
function rial(v){return money(v)+' '+CUR}
function amtH(v){return money(v)+'<small class="cur"> '+CUR+'</small>'}
/* المبلغ داخل حقول الإدخال: بدون فاصل الآلاف */
function amtIn(v){const n=r3(Number(v)||0);return Math.abs(n-Math.round(n))<0.0005?String(Math.round(n)):n.toFixed(3)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
/* قراءة المبالغ: تقبل الأرقام العربية، والفاصلة العشرية العربية، وفاصل الآلاف مثل 1,636.000 */
function parseAmt(s){s=String(s||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/٫/g,'.').replace(/[٬\s]/g,m=>m==='٬'?',':'').replace(/ر\.ع\.?|OMR|RO/gi,'');
  if(/^\d{1,3}(,\d{3})+(\.\d*)?$/.test(s))s=s.replace(/,/g,'');
  s=s.replace(/[٫,،]/g,'.').replace(/[^\d.]/g,'');const i=s.indexOf('.');if(i>=0)s=s.slice(0,i+1)+s.slice(i+1).replace(/\./g,'');
  const n=parseFloat(s);return isFinite(n)?r3(n):0}
function monthName(m){const [y,mm]=m.split('-');return MONTHS[+mm-1]+' '+y}
function shiftMonth(m,k){const [y,mm]=m.split('-').map(Number);return ym(new Date(y,mm-1+k,1))}
function uidGen(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function list(){return Object.values(S.tx)}
function inMonth(m){return list().filter(t=>t.date&&t.date.slice(0,7)===m)}
function sum(a,type){return r3(a.filter(t=>t.type===type).reduce((s,t)=>s+(+t.amount||0),0))}

/* ---------- 2. التخزين في الجهاز وقاعدة البيانات الداخلية ---------- */
/* rev: رقم يزيد مع كل حفظ، ويُكتب في الذاكرة الأساسية وفي قاعدة البيانات الداخلية.
   إذا فشل الحفظ في الذاكرة الأساسية (امتلأت)، تكون القاعدة الداخلية أحدث، فتُعتمد هي عند الفتح التالي. */
function cacheSave(){S.rev=(S.rev||0)+1;try{secStamp()}catch(e){}try{localStorage.setItem('masareef:v1',JSON.stringify({rev:S.rev,tx:S.tx,del:S.del,settings:S.settings}))}catch(e){if(!S.lsWarned){S.lsWarned=1;toast('ذاكرة التطبيق ممتلئة. بياناتك محفوظة في قاعدة البيانات الداخلية، واحفظ نسخة احتياطية كملف',null,7000)}}mirrorSoon()}
function cacheLoad(){let raw=null;try{raw=localStorage.getItem('masareef:v1')}catch(e){}
  if(!raw){S.lsState='missing';return}
  try{const r=JSON.parse(raw);if(!r||typeof r!=='object')throw 0;S.tx=r.tx||{};S.del=r.del||{};S.settings=Object.assign({monthlyBudget:0,budgets:{}},r.settings||{});S.lsRev=S.rev=+r.rev||0;S.lsState='ok';if(S.snapVer)S.snapVerData=backupText()}
  catch(e){S.lsState='corrupt';try{localStorage.setItem('masareef:v1:corrupt',raw)}catch(er){}}}
/* ===== قاعدة البيانات الداخلية =====
   الحفظ على ثلاث طبقات داخل هاتفك:
   1) ذاكرة التطبيق (localStorage): النسخة الأساسية السريعة.
   2) قاعدة بيانات IndexedDB مقسّمة: كل عملية سجل مستقل، وكل قسم (الديون، الالتزامات، الخطط...) في خانة مستقلة.
      تُحدَّث تلقائيًا بعد كل حفظ، ومنها تُستعاد البيانات إذا تلفت الذاكرة الأساسية.
   3) لقطات يومية تلقائية (آخر 14 يومًا) + لقطة قبل كل تحديث أو استعادة أو حذف شامل. */
const DATA_SECS=[['debts','الديون'],['recurring','الالتزامات الشهرية'],['goals','الخطط والادخار'],['trusts','الأمانات'],['cars','السيارات'],['people','الأهل'],['accounts','الحسابات'],['transfers','التحويلات']];
const IDB=(()=>{let dbp=null;
  const open=()=>dbp||(dbp=new Promise((res,rej)=>{if(!window.indexedDB){rej(new Error('noidb'));return}const r=indexedDB.open('masareef-data',1);
    r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('tx',{keyPath:'id'});d.createObjectStore('sec');d.createObjectStore('snap',{keyPath:'id'})};r.onsuccess=()=>res(r.result);r.onerror=()=>{dbp=null;rej(r.error)}}));
  const req=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
  return{open,
    tr:(stores,fn)=>open().then(d=>new Promise((res,rej)=>{const t=d.transaction(stores,'readwrite');fn(t);t.oncomplete=()=>res(true);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error||new Error('abort'))})),
    all:s=>open().then(d=>req(d.transaction(s).objectStore(s).getAll())),
    get:(s,k)=>open().then(d=>req(d.transaction(s).objectStore(s).get(k))),
    keys:s=>open().then(d=>req(d.transaction(s).objectStore(s).getAllKeys()))}})();
/* تقسيم الإعدادات إلى أقسام مستقلة */
function splitSettings(st){st=st||S.settings;const out={},rest=Object.assign({},st);DATA_SECS.forEach(([k])=>{out[k]=st[k]||[];delete rest[k]});out.settings=rest;return out}
function joinSettings(parts){const st=Object.assign({monthlyBudget:0,budgets:{}},parts.settings||{});DATA_SECS.forEach(([k])=>{if(Array.isArray(parts[k])&&parts[k].length)st[k]=parts[k]});return st}
function fmtAt(iso){const d=new Date(iso);return isNaN(d)?'':fmtD(isoD(d))+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function fnv(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)}return (h>>>0).toString(16).toUpperCase().padStart(8,'0')}
/* المرآة: تكتب فقط ما تغيّر منذ آخر مرة */
const Mirror={known:null,secs:{},t:null,at:0,ok:null,err:'',busy:false,again:false};
function mirrorSoon(){clearTimeout(Mirror.t);Mirror.t=setTimeout(mirrorFlush,350)}
async function mirrorFlush(){if(!Mirror.known)return;if(Mirror.busy){Mirror.again=true;return}Mirror.busy=true;
  try{const put=[],gone=[],nk=new Map();for(const t of Object.values(S.tx)){const s=JSON.stringify(t);nk.set(t.id,s);if(Mirror.known.get(t.id)!==s)put.push(t)}
    for(const id of Mirror.known.keys())if(!nk.has(id))gone.push(id);
    const parts=splitSettings();parts.del=S.del;const secPut=Object.entries(parts).map(([k,v])=>[k,v,JSON.stringify(v)]).filter(([k,,s])=>Mirror.secs[k]!==s);
    if(put.length||gone.length||secPut.length){await IDB.tr(['tx','sec'],t=>{const T=t.objectStore('tx'),X=t.objectStore('sec');put.forEach(x=>T.put(x));gone.forEach(id=>T.delete(id));
      secPut.forEach(([k,v])=>X.put(v,k));X.put({at:Date.now(),n:nk.size,v:APP_VERSION,rev:S.rev||0},'meta')});
      secPut.forEach(([k,,s])=>Mirror.secs[k]=s)}
    Mirror.known=nk;Mirror.at=Date.now();Mirror.ok=true;Mirror.err=''}
  catch(e){Mirror.ok=false;Mirror.err=String(e&&e.message||e)}
  Mirror.busy=false;if(Mirror.again){Mirror.again=false;mirrorSoon()}}
/* عند الفتح: تجهيز المرآة، واستعادة البيانات منها إذا كانت الذاكرة الأساسية فارغة أو تالفة */
async function dbBoot(){try{const [txs,keys]=await Promise.all([IDB.all('tx'),IDB.keys('sec')]);const sec={};for(const k of keys)sec[k]=await IDB.get('sec',k);
    const idbNewer=S.lsState==='ok'&&sec.meta&&+sec.meta.rev>(S.lsRev||0);
    if((S.lsState!=='ok'||idbNewer)&&(txs.length||(sec.settings&&Object.keys(sec.settings).length>2))){
      S.rev=Math.max(S.rev||0,+(sec.meta&&sec.meta.rev)||0);S.tx={};txs.forEach(t=>{if(t&&t.id)S.tx[t.id]=t});S.del=sec.del||{};S.settings=joinSettings(sec);
      Mirror.known=new Map(txs.map(t=>[t.id,JSON.stringify(t)]));cacheSave();migrateRecs();render();
      toast(idbNewer?'آخر تعديلاتك لم تُحفظ في الذاكرة الأساسية (كانت ممتلئة)، فاستُعيدت من قاعدة البيانات الداخلية':S.lsState==='corrupt'?'كانت الذاكرة الأساسية تالفة، واستُعيدت بياناتك كاملة من قاعدة البيانات الداخلية':'استُعيدت بياناتك من قاعدة البيانات الداخلية',null,6000);S.lsState='ok'}
    else{Mirror.known=new Map(txs.map(t=>[t.id,JSON.stringify(t)]));Object.keys(sec).forEach(k=>{if(k!=='meta')Mirror.secs[k]=JSON.stringify(sec[k])})}
    await mirrorFlush();
    if(S.snapVer)await snapTake('قبل التحديث إلى الإصدار '+APP_VERSION,false,S.snapVerData);S.snapVer=null;S.snapVerData=null;
    setTimeout(snapDaily,2500)}
  catch(e){Mirror.ok=false;Mirror.err=String(e&&e.message||e)}}
/* اللقطات */
function dataCounts(st){st=st||S.settings;const L=st===S.settings?list():[];const D=st.debts||[];
  return{tx:L.length,inc:L.filter(t=>t.type==='inc').length,exp:L.filter(t=>t.type==='exp').length,recurring:(st.recurring||[]).length,debts:D.length,debtsDone:D.filter(d=>!(+d.balance>0.0005)).length,debtPays:D.reduce((s,d)=>s+(d.pays||[]).length,0),goals:(st.goals||[]).length,trusts:(st.trusts||[]).length,cars:(st.cars||[]).length,people:(st.people||[]).length,accounts:(st.accounts||[]).length,transfers:(st.transfers||[]).length}}
async function snapTake(label,auto,txt){try{txt=txt||backupText();const o=JSON.parse(txt);const id=auto?'day-'+today():'s-'+Date.now();
    await IDB.tr(['snap'],t=>t.objectStore('snap').put({id,at:new Date().toISOString(),label:label||'لقطة يومية تلقائية',auto:!!auto,counts:o.counts||null,check:o.check||'',size:txt.length,data:txt}));await snapPrune();return id}catch(e){return null}}
async function snapPrune(){const A=(await IDB.all('snap')).sort((a,b)=>b.at.localeCompare(a.at));const del=A.filter(s=>s.auto).slice(14).concat(A.filter(s=>!s.auto).slice(12));
  if(del.length)await IDB.tr(['snap'],t=>del.forEach(s=>t.objectStore('snap').delete(s.id)))}
async function snapDaily(){if(!list().length&&!debts().length&&!recs().length)return;try{if(!await IDB.get('snap','day-'+today()))await snapTake('',true)}catch(e){}}
async function snapList(){try{return (await IDB.all('snap')).sort((a,b)=>b.at.localeCompare(a.at))}catch(e){return []}}

async function putTx(t){txPrep(t);cacheSave();render();Sync.soon()}
async function delTx(id){delete S.tx[id];S.del[id]=Date.now();cacheSave();render();Sync.soon()}
/* حفظ أو حذف مجموعة عمليات دفعة واحدة: حفظ واحد وعرض واحد بدل تكراره لكل عملية */
function txPrep(t){delete t.localOnly;if(!S.tx[t.id]&&!t.sample&&admPendNew())t.pend=1;t.u=Date.now();S.tx[t.id]=t}
async function putTxMany(arr){arr.forEach(txPrep);cacheSave();render();Sync.soon()}
async function delTxMany(ids){const n=Date.now();ids.forEach(id=>{delete S.tx[id];S.del[id]=n});cacheSave();render();Sync.soon()}
/* كل قسم له وقت آخر تعديل (_su)، حتى تدمج المزامنة بين الأجهزة كل قسم على حدة ولا يضيع تعديل قسم بسبب تعديل قسم آخر */
const SecJ={};
function secStamp(){const now=Date.now(),su=S.settings._su=Object.assign({},S.settings._su||{});const parts=splitSettings();delete parts.settings._su;delete parts.settings._u;
  Object.entries(parts).forEach(([k,v])=>{const j=JSON.stringify(v);if(SecJ[k]!==undefined&&SecJ[k]!==j)su[k]=now;SecJ[k]=j})}
function secSeed(){const parts=splitSettings();delete parts.settings._su;delete parts.settings._u;Object.entries(parts).forEach(([k,v])=>SecJ[k]=JSON.stringify(v))}
async function putSettings(){S.settings._u=Date.now();cacheSave();Sync.soon()}
/* تنزيل أي ملف أو Blob إلى جهازك (دالة واحدة لكل التطبيق) */
function dlBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},2000)}
function saveFile(name,text,type){try{dlBlob(new Blob([text],{type}),name);return true}catch(e){return false}}

/* ---------- 3. النسخ الاحتياطي والإشعارات الصغيرة ---------- */
/* النسخة الاحتياطية: ملف مقسّم إلى أقسام واضحة، مع عدد السجلات وبصمة للتحقق من سلامته */
function backupObj(){const tx=list().slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.createdAt||'').localeCompare(b.createdAt||''));const data=Object.assign({tx},splitSettings());
  return{app:'masareef',v:2,name:'إدارة شؤوني - نسخة احتياطية',at:new Date().toISOString(),appVersion:APP_VERSION,counts:dataCounts(),check:fnv(JSON.stringify(data)),data}}
function backupText(){return JSON.stringify(backupObj(),null,1)}
/* قراءة أي نسخة (القديمة 1 أو الجديدة 2) والتحقق منها */
function parseBackup(txt){let o;try{o=JSON.parse(txt)}catch(e){return{err:'الملف تالف أو ليس بصيغة صحيحة'}}
  if(!o||o.app!=='masareef')return{err:'هذا الملف ليس نسخة احتياطية من إدارة شؤوني'};
  let tx,settings,check=null;
  if(o.v>=2&&o.data){tx=o.data.tx;settings=joinSettings(o.data);check=o.check?fnv(JSON.stringify(o.data))===o.check:null}
  else{tx=o.tx;settings=Object.assign({monthlyBudget:0,budgets:{}},o.settings||{})}
  if(!Array.isArray(tx))return{err:'لا توجد عمليات في الملف'};
  const ok=[],bad=[];tx.forEach(t=>{if(t&&t.id&&(t.type==='inc'||t.type==='exp')&&isFinite(+t.amount)&&+t.amount>0&&/^\d{4}-\d\d-\d\d$/.test(t.date||''))ok.push(t);else bad.push(t)});
  return{tx:ok,bad:bad.length,settings,check,at:o.at||'',appVersion:o.appVersion||'',v:o.v||1}}
async function applyBackup(B,mode){const now=Date.now();
  if(mode==='replace'){const keep=new Set(B.tx.map(t=>t.id));Object.keys(S.tx).forEach(id=>{if(!keep.has(id)){delete S.tx[id];S.del[id]=now}})}
  B.tx.forEach(t=>{const c=Object.assign({},t);delete c.localOnly;c.u=now;S.tx[c.id]=c;delete S.del[c.id]});
  S.settings=mode==='replace'?Object.assign({},B.settings):Object.assign({},S.settings,B.settings,(()=>{const o={};DATA_SECS.forEach(([k])=>{const a=S.settings[k]||[],b=B.settings[k]||[];const m=new Map(a.map(x=>[x.id,x]));b.forEach(x=>m.set(x.id,x));o[k]=[...m.values()]});return o})());
  S.settings._u=now;cacheSave();migrateRecs();render();Sync.soon()}
/* نافذة الاستعادة: معاينة ما في الملف ومقارنته بما عندك قبل أي تغيير */
function openRestore(txt,label){try{const o=JSON.parse(txt);if(o&&o.app==='masareef'&&o.enc){openDecrypt(o,label);return}}catch(e){}const L=document.getElementById('layer');const B=parseBackup(txt);if(B.err){toast(B.err);return}let mode='replace';
  const cur=dataCounts(),nw=Object.assign(dataCounts(B.settings),{tx:B.tx.length,inc:B.tx.filter(t=>t.type==='inc').length,exp:B.tx.filter(t=>t.type==='exp').length});
  const rows=[['العمليات','tx'],['الديون','debts'],['دفعات الديون','debtPays'],['الالتزامات الشهرية','recurring'],['الخطط','goals'],['الأمانات','trusts'],['السيارات','cars'],['الأهل','people'],['الحسابات','accounts'],['التحويلات','transfers']];
  const draw=()=>{L.innerHTML=`${sheetTop('استعادة')}<h2 style="margin-top:0">استعادة ${esc(label||'نسخة احتياطية')}</h2>
   <div class="panel paybk"><div class="sumrow"><span>تاريخ النسخة</span><b>${B.at?fmtAt(B.at):'—'}</b></div>${B.appVersion?`<div class="sumrow"><span>من الإصدار</span><b>${esc(B.appVersion)}</b></div>`:''}
    <div class="sumrow"><span>سلامة الملف</span><b class="${B.check===false?'amt-exp':'amt-inc'}">${B.check===true?'سليم ومطابق لبصمته ✓':B.check===false?'⚠ البصمة لا تطابق: الملف عُدّل أو تلف جزء منه':'نسخة قديمة بدون بصمة'}</b></div>
    ${B.bad?`<div class="sumrow"><span>سجلات غير صالحة ستُتجاهل</span><b class="amt-exp">${B.bad}</b></div>`:''}</div>
   <table class="cmptbl"><thead><tr><th>القسم</th><th>عندك الآن</th><th>في الملف</th></tr></thead><tbody>${rows.map(([n,k])=>`<tr><td>${n}</td><td class="num">${cur[k]}</td><td class="num${nw[k]!==cur[k]?' diff':''}">${nw[k]}</td></tr>`).join('')}</tbody></table>
   <div class="field" style="margin-top:12px"><label>طريقة الاستعادة</label><div class="seg"><button class="n" data-rsm="replace" aria-pressed="${mode==='replace'}">استبدال كامل بما في الملف</button><button class="n" data-rsm="merge" aria-pressed="${mode==='merge'}">دمج مع بياناتي</button></div></div>
   <p class="note">${mode==='replace'?'تصبح بياناتك مطابقة تمامًا للملف، ويُحذف ما ليس فيه.':'تُضاف العمليات والسجلات الموجودة في الملف، ويُحدَّث المتشابه منها، ولا يُحذف شيء من بياناتك.'} قبل الاستعادة تُحفظ لقطة من بياناتك الحالية، ويمكنك التراجع.</p>
   <div class="actions"><button class="btn block" id="rsGo">استعادة الآن</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`};
  draw();L.oninput=L.onchange=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.rsm){mode=x.dataset.rsm;draw();return}
    if(x.id==='rsGo'){x.disabled=true;const before=backupText();const sid=await snapTake('قبل الاستعادة',false,before);await applyBackup(B,mode);L.innerHTML='';
      toast('استُعيدت البيانات: '+countWord(B.tx.length,'عملية واحدة','عمليتان','عمليات','عملية'),async()=>{await applyBackup(parseBackup(before),'replace');toast('أُعيدت بياناتك كما كانت')},10000)}}}
/* للتوافق مع النسخ السابقة من الأزرار */
/* فحص السلامة: يقرأ كل قسم ويتأكد من صحة ترابطه */
/* فحص ارتباطات الديون: الدين ↔ دفعاته ↔ عملياتها في السجل ↔ المستندات ↔ الأيقونات ↔ الالتزامات الشهرية. fix=إصلاح الآمن فقط */
function debtLinks(fix){const D=debts(),ids=new Set(D.map(d=>d.id)),I=[];let fixed=0;
  const seen={};D.forEach(d=>{seen[d.id]=(seen[d.id]||0)+1});const dupId=Object.keys(seen).filter(k=>seen[k]>1);if(dupId.length)I.push('معرّف دين مكرر ('+dupId.length+')');
  const orphTx=list().filter(t=>t.debt&&!ids.has(t.debt));if(orphTx.length)I.push(countWord(orphTx.length,'عملية واحدة','عمليتان','عمليات','عملية')+' في السجل مرتبطة بدين محذوف');
  const lost=[];D.forEach(d=>(d.pays||[]).forEach(p=>{if(p.tx&&!S.tx[p.tx])lost.push([d,p])}));
  if(lost.length){if(fix){lost.forEach(([d,p])=>{p.txGone=p.tx;delete p.tx});fixed+=lost.length}else I.push(countWord(lost.length,'دفعة واحدة','دفعتان','دفعات','دفعة')+' دين حُذف مصروفها من السجل')}
  const unl=list().filter(t=>t.debt&&ids.has(t.debt)&&!(D.find(d=>d.id===t.debt).pays||[]).some(p=>p.tx===t.id));if(unl.length)I.push(countWord(unl.length,'عملية واحدة','عمليتان','عمليات','عملية')+' سداد دين في السجل غير مسجّلة في دفعات الدين');
  const ic=(S.settings.icons||{});const oi=Object.keys(ic).filter(k=>k.startsWith('debt:')&&!ids.has(k.slice(5)));if(oi.length&&fix){oi.forEach(k=>delete ic[k]);fixed+=oi.length}
  const vd=(Vault.docs||[]).filter(x=>x.debt&&!ids.has(x.debt));if(vd.length)I.push(countWord(vd.length,'مستند واحد','مستندان','مستندات','مستندًا')+' في الخزنة مرتبط بدين محذوف');
  D.forEach(d=>{const st=debtStart(d);if(d.trackFrom&&st&&d.trackFrom<st){if(fix){d.trackFrom=st;fixed++}else I.push('«'+d.name+'»: بداية المتابعة قبل بداية الدين')}
    if(+d.totalN&&+d.paidN>+d.totalN)I.push('«'+d.name+'»: الأقساط المدفوعة أكثر من العدد الكلي');
    if(!(+d.balance>=0)||!isFinite(+d.balance))I.push('«'+d.name+'»: رصيد غير صحيح')});
  const RN=new Set(recs().map(r=>(r.name||'').trim()));const dbl=D.filter(d=>+d.balance>0&&RN.has((d.name||'').trim()));if(dbl.length)I.push('قسط «'+dbl[0].name+'» مضاف أيضًا كالتزام شهري (يُحسب مرتين)');
  return {issues:I,fixed,count:D.length,pays:D.reduce((s,d)=>s+(d.pays||[]).filter(p=>p.tx&&S.tx[p.tx]).length,0),docs:(Vault.docs||[]).filter(x=>x.debt&&ids.has(x.debt)).length}}
async function dataHealth(){const L=list(),R=recs(),D=debts();const out=[];const add=(ok,t,d)=>out.push({ok,t,d});
  let lsOk=false,lsSize=0;try{const raw=localStorage.getItem('masareef:v1')||'';lsSize=raw.length;const p=JSON.parse(raw);lsOk=!!p&&Object.keys(p.tx||{}).length===L.length}catch(e){}
  add(lsOk,'الذاكرة الأساسية تُقرأ بالكامل',lsOk?countWord(L.length,'عملية واحدة','عمليتان','عمليات','عملية')+' · '+Math.ceil(lsSize/1024)+' كيلوبايت':'لم تُطابق، وستُعاد كتابتها');
  let mOk=false,mTx=0;try{await mirrorFlush();mTx=(await IDB.keys('tx')).length;const st=await IDB.get('sec','settings');mOk=mTx===L.length&&!!st}catch(e){}
  add(mOk,'قاعدة البيانات الداخلية مطابقة',mOk?'كل عملية سجل مستقل، وكل قسم في خانته':'غير مطابقة ('+mTx+' من '+L.length+')'+(Mirror.err?' · '+Mirror.err:''));
  const bad=L.filter(t=>!(isFinite(+t.amount)&&+t.amount>0)||!/^\d{4}-\d\d-\d\d$/.test(t.date||'')||!(t.type==='inc'||t.type==='exp'));
  add(!bad.length,'كل العمليات لها نوع ومبلغ وتاريخ صحيح',bad.length?bad.length+' عملية تحتاج مراجعة من السجل':'');
  const orphan=L.filter(t=>t.rec&&!R.some(r=>r.id===t.rec)).length;add(true,'دفعات الالتزامات مرتبطة بالتزاماتها',orphan?orphan+' دفعة لالتزامات حذفتها، محفوظة في السجل':'');
  const lostTx=D.reduce((s,d)=>s+(d.pays||[]).filter(p=>p.tx&&!S.tx[p.tx]).length,0);add(true,'دفعات الديون محفوظة داخل كل دين',countWord(D.reduce((s,d)=>s+(d.pays||[]).length,0),'دفعة واحدة','دفعتان','دفعات','دفعة')+(lostTx?' · '+lostTx+' منها حُذف مصروفها من السجل':''));
  {const K=debtLinks(false);add(!K.issues.length,'ارتباطات الديون (الدفعات، السجل، المستندات، الشهرية)',K.issues.length?K.issues.join(' · '):countWord(K.count,'دين واحد','دينان','ديون','دينًا')+' · '+countWord(K.pays,'دفعة واحدة','دفعتان','دفعات','دفعة')+' مرتبطة بالسجل'+(K.docs?' · '+countWord(K.docs,'مستند واحد','مستندان','مستندات','مستندًا'):'')+' ✓')}
  const dup={};L.forEach(t=>{const k=[t.date,t.type,t.cat,(+t.amount).toFixed(3),t.note||''].join('|');dup[k]=(dup[k]||0)+1});const dups=Object.values(dup).filter(n=>n>1).length;
  add(true,'العمليات المكررة المحتملة',dups?dups+' مجموعة متشابهة (نفس اليوم والمبلغ والبيان)، راجعها في السجل':'لا يوجد');
  let pers=null;try{pers=navigator.storage&&navigator.storage.persisted?await navigator.storage.persisted():null}catch(e){}
  const inst=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
  add(pers||inst,'حماية التخزين من الحذف التلقائي',pers?'محمي دائمًا':inst?'التطبيق مثبّت على الشاشة الرئيسية، فلا يحذف النظام بياناته تلقائيًا':'افتح التطبيق من أيقونته على الشاشة الرئيسية وليس من Safari، واحفظ نسخة احتياطية كملف بانتظام');
  return out}
/* 🔄 تحديث البيانات: إعادة قراءة كل البيانات من الحفظ، وإعادة حساب الديون والأقسام، ومطابقة قاعدة البيانات الداخلية، ثم فحص السلامة */
async function refreshAll(btn){if(btn)btn.disabled=true;const t0=Date.now();
  try{migrateRecs();debts().forEach(d=>{try{debtSync(d)}catch(e){}});try{const K=debtLinks(true);if(K.fixed)putSettings()}catch(e){}secSeed();cacheSave();await mirrorFlush();const H=await dataHealth();if(Sync.linked())Sync.soon();render();
    const bad=H.filter(h=>!h.ok);const c=dataCounts();
    toast(bad.length?'تم التحديث · '+countWord(bad.length,'ملاحظة واحدة','ملاحظتان','ملاحظات','ملاحظة')+': '+bad[0].t:'✓ تم تحديث البيانات وقراءتها: '+countWord(c.tx,'عملية واحدة','عمليتان','عمليات','عملية')+' · '+countWord(c.debts,'دين','دينان','ديون','دينًا')+' · '+countWord(c.recurring,'التزام','التزامان','التزامات','التزامًا'),null,6000);
    if(document.querySelector('#layer .dbstat'))openDataCenter()}
  catch(e){toast('تعذّر التحديث: '+(e&&e.message||e))}if(btn)btn.disabled=false}
/* مركز قاعدة البيانات */
async function openDataCenter(){const L=document.getElementById('layer');L.innerHTML=`${sheetTop('قاعدة البيانات')}<h2 style="margin-top:0">🗄️ قاعدة البيانات</h2><p class="note">جارٍ الفحص…</p></div></div>`;
  const H=await dataHealth(),SN=await snapList();let est=null;try{est=navigator.storage&&navigator.storage.estimate?await navigator.storage.estimate():null}catch(e){}
  const c=dataCounts(),lb=advLastBackup(),lbd=lb?Math.max(0,-daysTo(lb)):null,warn=H.filter(h=>!h.ok).length;const fp=backupObj().check;
  const secRows=[['tx','العمليات (الدخل والمصاريف)',c.tx,c.inc+' دخل · '+c.exp+' مصروف'],['debts','الديون',c.debts,(c.debts-c.debtsDone)+' قائم · '+c.debtsDone+' منتهٍ · '+c.debtPays+' دفعة'],['monthly','الالتزامات الشهرية',c.recurring,''],['plans','الخطط والادخار',c.goals,''],['trusts','الأمانات',c.trusts,''],['','السيارات',c.cars,''],['','الأهل',c.people,''],['','حساباتي والتحويلات',c.accounts,c.transfers+' تحويل'],['','مستنداتي (خزنة مشفّرة منفصلة)',Vault.docs.length,'لها نسخة احتياطية مشفّرة خاصة من «مستنداتي»']];
  const draw=()=>{L.innerHTML=`${sheetTop('قاعدة البيانات')}<h2 style="margin-top:0">🗄️ قاعدة البيانات</h2>
   <div class="dbstat ${warn?'warn':'ok'}"><b>${warn?'⚠ '+countWord(warn,'ملاحظة واحدة','ملاحظتان','ملاحظات','ملاحظة')+' تحتاج انتباهك':'✓ قاعدة البيانات سليمة ومحفوظة'}</b><small>بصمة البيانات الحالية: <span dir="ltr" class="num">${fp}</span></small></div>
   <button class="btn block" id="dcRefresh" style="margin:10px 0">🔄 تحديث البيانات وإعادة الفحص</button>
   <h3>أين تُحفظ بياناتك</h3><div class="panel dblayers">
    <div><b>1. ذاكرة التطبيق</b><span>النسخة الأساسية، تُحفظ فورًا عند كل تغيير</span></div>
    <div><b>2. قاعدة البيانات الداخلية</b><span>نسخة ثانية مقسّمة: كل عملية سجل مستقل وكل قسم في خانته${Mirror.at?' · آخر تحديث '+fmtAt(new Date(Mirror.at).toISOString()).split(' ').pop():''}</span></div>
    <div><b>3. اللقطات التلقائية</b><span>${SN.length?countWord(SN.length,'لقطة واحدة','لقطتان','لقطات','لقطة')+' · آخرها '+fmtAt(SN[0].at):'تبدأ اليوم'} (يومية لآخر 14 يومًا، وقبل كل تحديث أو استعادة)</span></div>
    <div><b>4. Google Drive</b><span>${Sync.linked()?'مربوط: نسخة في مجلد خاص بالتطبيق في حسابك':'غير مربوط (اختياري)'}</span></div>
    <div class="${lbd===null||lbd>14?'amt-exp':''}"><b>5. ملف نسخة احتياطية عندك</b><span>${lb?'آخر نسخة '+fmtD(lb)+(lbd>14?' · مرّ '+daysWord(lbd)+'، احفظ نسخة جديدة':''):'لم تحفظ نسخة كملف بعد، احفظ واحدة الآن'}</span></div>
    ${est&&est.usage?`<div><b>المساحة المستخدمة</b><span>${(est.usage/1048576).toFixed(1)} ميجابايت</span></div>`:''}</div>
   <h3>الأقسام</h3><div class="panel dbsecs">${secRows.map(([k,n,v,d])=>`<div class="dbsec"><div><b>${n}</b>${d?`<small>${d}</small>`:''}</div><b class="num">${v}</b>${k?`<button class="chip" data-dbx="${k}" aria-label="تصدير ${n}">📊</button>`:'<span></span>'}</div>`).join('')}</div>
   <h3>فحص السلامة</h3><div class="panel dbchecks">${H.map(h=>`<div class="${h.ok?'':'bad'}"><span>${h.ok?'✓':'⚠'}</span><div><b>${h.t}</b>${h.d?`<small>${esc(h.d)}</small>`:''}</div></div>`).join('')}</div>
   <h3>اللقطات المحفوظة</h3><div class="panel dbsnaps">${SN.length?SN.map(s=>`<div class="dbsnap"><div><b>${esc(s.label)}</b><small>${fmtAt(s.at)}${s.counts?' · '+s.counts.tx+' عملية · '+s.counts.debts+' دين · '+s.counts.recurring+' التزام':''}</small></div><div class="chips"><button class="chip" data-snapsave="${esc(s.id)}">حفظ كملف</button><button class="chip" data-snaprest="${esc(s.id)}">استعادة</button></div></div>`).join(''):'<p class="note" style="margin:6px">لا توجد لقطات بعد.</p>'}
    <button class="btn ghost block" id="snapNow" style="margin-top:8px">أخذ لقطة الآن</button></div>
   <h3>الحفظ والاستخراج</h3><div class="stack">
    <button class="btn block" id="dcBackup">💾 حفظ نسخة احتياطية كاملة (ملف)</button>
    <button class="btn ghost block" id="dcEnc">🔐 نسخة احتياطية مشفّرة بكلمة سر</button>
    <div class="panel storbox" id="dcStor"></div>
    <label class="btn ghost block" for="restoreFile2" id="dcRestoreLbl" style="text-align:center;cursor:pointer">📂 استعادة من ملف نسخة احتياطية</label><input type="file" id="restoreFile2" accept=".json,application/json" hidden>
    <div class="row2"><button class="btn ghost" id="dcXlsx">📊 Excel / Numbers</button><button class="btn ghost" id="dcPrint">🖨️ طباعة / PDF</button></div></div>
   <p class="note">بياناتك لا تغادر هاتفك إلا إلى ملف تحفظه أنت، أو إلى Google Drive الخاص بك إن ربطته.</p>
   <div class="actions"><button class="btn ghost block" data-close>إغلاق</button></div></div></div>`};
  draw();fillStorage(document.getElementById('dcStor'));L.oninput=null;
  L.onchange=e=>{if(e.target.id==='restoreFile2'&&e.target.files[0]){const r=new FileReader();r.onload=()=>openRestore(r.result,'من ملف');r.readAsText(e.target.files[0]);e.target.value=''}};
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='dcBackup'){await saveBackupFile();openDataCenter();return}
    if(x.id==='dcXlsx'){openExport();return}
    if(x.id==='dcRefresh'){refreshAll(x);return}
    if(x.id==='dcEnc'){openEncBackup();return}
    if(x.id==='dcPrint'){openPrintSheet('full');return}
    if(x.id==='snapNow'){x.disabled=true;await snapTake('لقطة يدوية');toast('أُخذت لقطة من بياناتك');openDataCenter();return}
    if(x.dataset.dbx){const m={tx:['summary','tx'],debts:['summary','debts'],monthly:['monthly'],plans:['plans'],trusts:['trusts']}[x.dataset.dbx];exportXlsx(m,'all');return}
    if(x.dataset.snapsave){const s=(await snapList()).find(y=>y.id===x.dataset.snapsave);if(s)await shareFile('idarat-shuooni-snapshot-'+s.at.slice(0,10)+'.json',s.data,'application/json');return}
    if(x.dataset.snaprest){const s=(await snapList()).find(y=>y.id===x.dataset.snaprest);if(s)openRestore(s.data,'لقطة '+fmtD(s.at.slice(0,10)));return}}}
async function saveBackupFile(){const r=await shareFile('idarat-shuooni-backup-'+today()+'.json',backupText(),'application/json');
  if(r!=='cancel'){try{localStorage.setItem('masareef:lastBackup',today())}catch(e){}toast(r==='shared'?'اختر «حفظ في الملفات» أو iCloud Drive لحفظ النسخة':'حُفظت النسخة الاحتياطية في الملفات')}}


/* أسماء الخانات: الاسم القصير ثابت، والطويل يتحرك تلقائيًا ليظهر كاملًا */
const MQ_SEL=['.tile>b','.tx .t>b','.ghead b','.hp-main>b','.wd-main>b','.alertrow b','.folder>b','.qbtn .qn','.hstat b','.recrow>div>b','.dbsec>div>b','.dgcell>span','.apvrow b','.filerow>span','.dbsnap b','.dghead>b','.cardocs b'].join(',');
const MQ_RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function fitLabels(root){if(MQ_RM)return;(root||document).querySelectorAll(MQ_SEL).forEach(el=>{if(el.closest('.gm,.paperwrap,#printArea'))return;
  if(el.dataset.mq==='1'&&el.firstElementChild&&el.firstElementChild.classList.contains('mq-in')){mqMeasure(el);return}
  if(el.dataset.mq||el.querySelector('br,.meter,.pill'))return;if(!el.clientWidth)return;
  el.classList.add('mq-on');const over=el.scrollWidth-el.clientWidth;el.dataset.mq='1';
  if(over<=2){return}
  const inn=document.createElement('span');inn.className='mq-in';while(el.firstChild)inn.appendChild(el.firstChild);el.appendChild(inn);mqMeasure(el)})}
function mqMeasure(el){const inn=el.firstElementChild;const d=inn.scrollWidth-el.clientWidth;
  if(d<=2){el.classList.remove('mq-run');inn.style.removeProperty('--mq-d');return}
  el.classList.add('mq-run');inn.style.setProperty('--mq-d',(d+6)+'px');inn.style.setProperty('--mq-t',Math.max(5,(d+6)/22+3).toFixed(1)+'s')}
let mqT;function fitSoon(){clearTimeout(mqT);mqT=setTimeout(()=>fitLabels(),60)}
try{new MutationObserver(fitSoon).observe(document.body,{childList:true,subtree:true})}catch(e){}
window.addEventListener('resize',()=>{document.querySelectorAll('[data-mq]').forEach(el=>{if(!el.querySelector('.mq-in'))delete el.dataset.mq});fitSoon()});
document.addEventListener('toggle',fitSoon,true);


/* ===== التصغير والتكبير لكل الأقسام والعناوين =====
   يعمل تلقائيًا على كل الشاشات والنوافذ، بدون تعديل كل شاشة على حدة:
   - العناوين الأساسية (h2) والفرعية (h3) ومجموعات الديون: الضغط على العنوان يصغّر أو يكبّر ما تحته حتى العنوان التالي.
   - بطاقات البنود (الخطط، الديون، الأمانات، السيارات، المستندات، الادخار): الضغط على رأس البطاقة يصغّرها إلى اسمها.
   - عنوان الصفحة نفسها (الذي فيه زر «الرئيسية») وعنوان النافذة لا يُصغَّران.
   - يُحفظ اختيارك في هذا الجهاز، ويبقى بعد إعادة الفتح. */
const FOLD_KEY='masareef:fold';
const Fold={c:null,
  load(){if(this.c)return this.c;let a=[];try{a=JSON.parse(localStorage.getItem(FOLD_KEY)||'[]')}catch(e){}this.c=new Set(Array.isArray(a)?a:[]);return this.c},
  save(){try{localStorage.setItem(FOLD_KEY,JSON.stringify([...this.load()].slice(-400)))}catch(e){}},
  is(k){return this.load().has(k)},
  set(k,closed){const c=this.load();if(closed)c.add(k);else c.delete(k);this.save()}};
const FOLD_ITEM='.ghead,.carhead,.savhead,.dghead,.dayhead,.alerthead';
const FOLD_SKIP='.hero,.lk-in,.paperwrap,#printArea,.qduas,.qhead,.tile,.recrow,.mq-in,.impcard,[data-nofold]';
function foldTxt(el){return (el.querySelector('h2,h3,b')||el).textContent.replace(/[0-9٠-٩.,٫٬()%+−\-—·:]/g,'').replace(/\s+/g,' ').trim().slice(0,48)}
function foldScope(el){const sh=el.closest('.sheet');return sh?'s:'+(sh.getAttribute('aria-label')||''):'v:'+(S.tab||'home')}
function foldLevel(el){if(el.matches('h2')||(el.matches('.backrow')&&el.querySelector(':scope>h2')))return 2;if(el.matches('h3'))return 3;if(el.matches('.dghead,.dayhead'))return 3;if(el.matches(FOLD_ITEM))return 4;return 0}
function foldIsTitle(el){if(el.matches('[data-nofold]')||el.querySelector('[data-tab="home"]'))return true;
  if(el.closest('.sheet')){let p=el.previousElementSibling;while(p&&p.matches('.grab,.scrim'))p=p.previousElementSibling;return !p&&el.parentElement&&el.parentElement.matches('.sheet>.in')}return false}
function foldify(root){if(!root)return;const heads=[...root.querySelectorAll('h2,h3,.backrow,'+FOLD_ITEM)].filter(el=>!el.dataset.fold&&!el.closest(FOLD_SKIP)&&!(el.matches('h2,h3')&&el.parentElement.matches('.backrow'))&&foldLevel(el));
  heads.sort((a,b)=>foldLevel(a)-foldLevel(b));
  for(const h of heads){h.dataset.fold='x';if(foldIsTitle(h))continue;const lv=foldLevel(h);const body=[];let n=h.nextElementSibling;
    while(n){const l=n.dataset&&n.dataset.fold!==undefined?foldLevel(n):(n.matches('h2,h3,.backrow,.dghead,.dayhead')?foldLevel(n):0);if(l&&l<=lv)break;if(n.matches('.fold-tools'))break;body.push(n);n=n.nextElementSibling}
    if(!body.length||body.every(x=>x.matches('script,template')))continue;
    const w=document.createElement('div');w.className='fold-b';h.parentNode.insertBefore(w,body[0]);body.forEach(x=>w.appendChild(x));
    const k=foldScope(h)+'|'+lv+'|'+foldTxt(h);h.dataset.fold=k;h.classList.add('fold-h','fold-l'+lv);h.setAttribute('role','button');h.tabIndex=0;
    const closed=Fold.is(k);h.classList.toggle('fold-closed',closed);w.hidden=closed;h.setAttribute('aria-expanded',!closed)}
  const scope=root.matches&&root.matches('#view')?root:null;
  if(scope&&!scope.querySelector('.fold-tools,.rec-tools')&&scope.querySelectorAll('.fold-l2,.fold-l3').length>=2){const t=document.createElement('div');t.className='fold-tools';
    t.innerHTML='<button class="chip" type="button" data-fall="0">⊖ تصغير الكل</button><button class="chip" type="button" data-fall="1">⊕ توسيع الكل</button>';
    let n=scope.querySelector('.fold-h');while(n&&n.parentElement!==scope&&!n.parentElement.matches('.fold-b'))n=n.parentElement;if(n)n.parentNode.insertBefore(t,n)}}
function foldToggle(h,closed){if(closed===undefined)closed=!h.classList.contains('fold-closed');const w=h.nextElementSibling;if(!w||!w.matches('.fold-b'))return;
  h.classList.toggle('fold-closed',closed);w.hidden=closed;h.setAttribute('aria-expanded',!closed);Fold.set(h.dataset.fold,closed);if(!closed)fitSoon()}
function foldAll(root,open){root.querySelectorAll('.fold-h').forEach(h=>{if(!h.closest('.fold-b[hidden]')||open)foldToggle(h,!open)})}
document.addEventListener('click',e=>{const fa=e.target.closest('[data-fall]');if(fa){e.stopPropagation();foldAll(fa.closest('#view,.sheet')||document,fa.dataset.fall==='1');return}
  const h=e.target.closest('.fold-h');if(!h||e.target.closest('button,a,input,select,textarea,label,summary,[data-edit],[data-rtog]'))return;
  foldToggle(h)},true);
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('fold-h')){e.preventDefault();foldToggle(e.target)}});
try{const fo=new MutationObserver(()=>{foldify(document.getElementById('view'));foldify(document.getElementById('layer'))});
  ['view','layer'].forEach(id=>{const el=document.getElementById(id);if(el)fo.observe(el,{childList:true,subtree:true})})}catch(e){}

let tt;function toast(msg,undo,dur){let el=document.querySelector('.toast');if(!el){el=document.createElement('div');el.className='toast';el.setAttribute('role','status');document.body.appendChild(el)}el.innerHTML='';const s=document.createElement('span');s.textContent=msg;el.appendChild(s);if(undo){const b=document.createElement('button');b.textContent='تراجع';b.onclick=()=>{el.hidden=true;undo()};el.appendChild(b)}el.hidden=false;clearTimeout(tt);tt=setTimeout(()=>el.hidden=true,dur||(undo?6000:2600))}

/* ---------- 4. أيقونات الفئات ---------- */
const CI={
 food:'<circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H6.2"/>',
 rest:'<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3"/>',
 fuel:'<path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16"/><path d="M3 21h13"/><path d="M7 7h5v4H7z"/><path d="M15 9h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
 car:'<path d="M5 16v-5l2-5h10l2 5v5"/><path d="M3 16h18v3H3z"/><path d="M7 19v2M17 19v2"/><circle cx="7.5" cy="13.5" r="1"/><circle cx="16.5" cy="13.5" r="1"/>',
 bills:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
 home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
 loan:'<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18"/>',
 health:'<path d="M20.8 8.6a5 5 0 0 0-8.8-3.2A5 5 0 0 0 3.2 8.6c0 5.4 8.8 11 8.8 11s8.8-5.6 8.8-11z"/><path d="M6.5 12h2.5l1.5-2.5 2 5 1.5-2.5h2.5"/>',
 shop:'<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
 edu:'<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/><path d="M22 9v6"/>',
 fun:'<path d="M2.5 11.5 21 4l-6 17-3.5-7.5z"/><path d="M11.5 13.5 21 4"/>',
 family:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2c2.8.3 5 2.6 5 5.8"/>',
 charity:'<path d="M12 20s-7-4.4-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8C19 15.6 12 20 12 20z"/><path d="M12 2.5v2.5M7.5 3.5l1 1.6M16.5 3.5l-1 1.6"/>',
 other:'<circle cx="6" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="18" cy="12" r="1.4" fill="currentColor"/>',
 salary:'<path d="M3 7a2 2 0 0 1 2-2h12v3"/><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 13.5h2"/>',
 freelance:'<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
 business:'<path d="M4 10v10h16V10"/><path d="M3 10l2-6h14l2 6"/><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M10 20v-5h4v5"/>',
 gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12"/><path d="M12 8c-1.5-3-5-3.5-5-1.5S10 8 12 8zM12 8c1.5-3 5-3.5 5-1.5S14 8 12 8z"/>',
 iother:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'
};
// أيقونات إضافية للأقسام
CI.calendar='<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M8 14h3v3H8z"/>';
CI.shield='<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>';
CI.kaaba='<path d="M4 7l8-4 8 4v10l-8 4-8-4z"/><path d="M4 7l8 4 8-4M12 11v10M4 10.5l8 4 8-4"/>';
CI.moon='<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>';
CI.ring='<circle cx="12" cy="15" r="6"/><path d="M9 4h6l-1.5 3.5h-3z"/>';
CI.card='<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>';
CI.idcard='<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.6-1.5 1.7-2.2 3-2.2s2.4.7 3 2.2M14 10h4M14 13h3"/>';
CI.passport='<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 16h6"/>';
CI.doc='<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>';
CI.wifi='<path d="M2.5 9a14 14 0 0 1 19 0"/><path d="M5.5 12.5a9.5 9.5 0 0 1 13 0"/><path d="M8.7 16a5 5 0 0 1 6.6 0"/><circle cx="12" cy="19.3" r=".9"/>';
CI.phone='<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/>';
CI.bolt='<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z"/>';
CI.drop='<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>';
CI.lock='<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>';

/* ===== الصورة / الأيقونة قبل الاسم: قابلة للتغيير من «إدارة البيانات»، وتتحدث في كل الصفحات =====
   المفتاح: نوع:معرّف (cat:food، rec:…، debt:…، person:…، payee:…، acc:…، goal:…) */
const ICO_EMO=['💡','⚡','💧','📶','📱','🏠','🔑','🧹','👩‍👧','👨‍👩‍👧','👵','👴','👶','🚗','⛽','🛒','🍽️','☕','🥖','🏥','💊','🎓','📚','🎁','🕌','🤲','💰','💳','🏦','📈','✈️','🧳','🎉','💍','🛋️','🧺','👕','💈','🐑','🌴','📦','🔧','🧾','📄','🎮','🏋️','⚽','🐪','🌙','⭐'];
const ICO_COL=['#2F7F7A','#3E7CB1','#1F5AA6','#6B5CA5','#8A4F7D','#B8423A','#C2562F','#B0662F','#C9881E','#3B8F5A','#1E7A4F','#7A8494'];
function icoOv(key){return ((S.settings&&S.settings.icons)||{})[key]||null}
function icoHtml(o,cls){cls=cls||'cbadge';if(o.t==='img')return `<span class="${cls} icoimg"><img src="${o.v}" alt=""></span>`;const c=o.c||'#2F7F7A';
  return `<span class="${cls}" style="background:${c}1f;color:${c}">${o.t==='emo'?`<span class="icoemo">${o.v}</span>`:svgI(CI[o.v]||CI.other)}</span>`}
function ovBadge(key,fb){const o=icoOv(key);return o?icoHtml(o):fb}
function openIconPick(key,name,defHtml){const L=document.getElementById('layer');const cur=icoOv(key)||{};let t=cur.t||'svg',v=cur.v||'',c=cur.c||ICO_COL[0];
  const keys=Object.keys(CI).filter(k=>typeof CI[k]==='string');
  const draw=()=>{const prev=v?icoHtml({t,v,c},'cbadge big'):(defHtml||'').replace('class="cbadge"','class="cbadge big"');
    L.innerHTML=`${sheetTop('الأيقونة')}<h2 style="margin-top:0">تغيير الصورة قبل «${esc(name)}»</h2>
     <div class="icoprev">${prev}<b>${esc(name)}</b></div>
     <div class="seg seg3"><button class="n" data-ict="svg" aria-pressed="${t==='svg'}">أيقونة</button><button class="n" data-ict="emo" aria-pressed="${t==='emo'}">رمز</button><button class="n" data-ict="img" aria-pressed="${t==='img'}">صورة</button></div>
     ${t==='img'?`<div class="stack" style="margin-top:12px"><label class="btn ghost block" for="icoFile" style="text-align:center;cursor:pointer">📷 اختيار صورة أو شعار من الجهاز</label><input type="file" id="icoFile" accept="image/*" hidden><p class="note" style="margin:0">تُصغَّر الصورة تلقائيًا وتُحفظ داخل بياناتك، وتظهر على كل أجهزتك بعد المزامنة.</p></div>`
     :`<div class="icogrid">${(t==='svg'?keys:ICO_EMO).map(x=>`<button class="icocell${v===x?' on':''}" data-icv="${esc(x)}" aria-label="${esc(x)}">${t==='svg'?svgI(CI[x]):`<span class="icoemo">${x}</span>`}</button>`).join('')}</div>
     <div class="icocols">${ICO_COL.map(x=>`<button class="icocol${c===x?' on':''}" data-icc="${x}" style="background:${x}" aria-label="لون"></button>`).join('')}</div>`}
     <div class="actions"><button class="btn block" id="icoSave" ${v?'':'disabled'}>حفظ</button>${icoOv(key)?'<button class="btn ghost block" id="icoReset">إرجاع الأيقونة الأصلية</button>':''}<button class="btn ghost block" data-close>إلغاء</button></div></div></div>`};
  const set=o=>{S.settings.icons=Object.assign({},S.settings.icons||{});if(o)S.settings.icons[key]=o;else delete S.settings.icons[key];putSettings();render()};
  draw();L.oninput=null;
  L.onchange=e=>{if(e.target.id!=='icoFile'||!e.target.files[0])return;const f=e.target.files[0];const img=new Image();const u=URL.createObjectURL(f);
    img.onload=()=>{const N=96,cv=document.createElement('canvas');cv.width=cv.height=N;const g=cv.getContext('2d');const m=Math.min(img.width,img.height);g.fillStyle='#fff';g.fillRect(0,0,N,N);g.drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,N,N);URL.revokeObjectURL(u);v=cv.toDataURL('image/jpeg',.82);t='img';draw()};
    img.onerror=()=>{URL.revokeObjectURL(u);toast('تعذّر فتح الصورة')};img.src=u};
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.ict){if(t!==x.dataset.ict){t=x.dataset.ict;v=''}draw();return}
    if(x.dataset.icv){v=x.dataset.icv;draw();return}
    if(x.dataset.icc){c=x.dataset.icc;draw();return}
    if(x.id==='icoSave'&&v){set(t==='img'?{t,v}:{t,v,c});L.innerHTML='';toast('تغيّرت الصورة قبل «'+name+'» في كل الصفحات');return}
    if(x.id==='icoReset'){set(null);L.innerHTML='';toast('أُرجعت الأيقونة الأصلية');return}}}
/* أيقونة العملية في السجل: أيقونة التزامها أو دينها إن غُيّرت، وإلا أيقونة فئتها */
function personAv(p){const o=icoOv('person:'+p.id);return o?icoHtml(o,'avatar icoav'):`<span class="avatar" style="background:${personColor(p.id)}22;color:${personColor(p.id)}">${esc(p.name.charAt(0))}</span>`}
const PAYEE_IC={bank:['loan','#1F5AA6'],shop:['shop','#C2562F'],gov:['bills','#6B5CA5'],person:['family','#2F7F7A'],other:['other','#7A8494']};
function payeeBadge(p){const d=PAYEE_IC[p.type]||PAYEE_IC.other;return ovBadge('payee:'+p.id,`<span class="cbadge" style="background:${d[1]}1f;color:${d[1]}">${svgI(CI[d[0]]||CI.other)}</span>`)}
function accBadge(a){const c=a.kind==='card'?'#B8423A':a.kind==='cash'?'#3B8F5A':'#1F5AA6';return ovBadge('acc:'+a.id,`<span class="cbadge" style="background:${c}1f;color:${c}">${svgI(a.kind==='cash'?CI.salary:CI.card||CI.other)}</span>`)}
function txIco(t,c){const o=(t.rec&&icoOv('rec:'+t.rec))||(t.debt&&icoOv('debt:'+t.debt))||icoOv('cat:'+t.cat);return o?icoHtml(o,'ic'):`<span class="ic" style="background:${c.c}1f;color:${c.c}">${catIcon(t.cat)}</span>`}
function catIcon(id){return `${svgI(CI[id]||CI.other)}`}
function cbadge(id){const c=catOf(id);return ovBadge('cat:'+id,`<span class="cbadge" style="background:${c.c}1f;color:${c.c}">${catIcon(id)}</span>`)}

/* ===== أسماء الأقسام القابلة للتعديل من وضع المدير =====
   كل اسم له مفتاح واسم أصلي؛ ما تكتبه يُحفظ في بياناتك (labels) ويظهر في الشاشات والطباعة والتصدير. */
const LBL_GROUPS=[
 ['أقسام القائمة الشهرية',[['msec.bills','الفواتير والسكن'],['msec.family','مصروف العائلة والرواتب'],['msec.debt','أقساط الديون'],['msec.other','التزامات أخرى']]],
 ['مجموعات الديون',[['dgrp.bank','البنوك والتمويل'],['dgrp.people','ديون لأشخاص'],['dgrp.personal','ديون شخصية وأخرى']]],
 ['أقسامي في الرئيسية وعناوين صفحاتها',[['sec.master','إدارة البيانات'],['sec.monthly','الالتزامات الشهرية'],['sec.debts','ديوني'],['sec.trusts','الأمانات'],['sec.docs','مستنداتي'],['sec.cars','السيارات'],['sec.house','الأهل والبيت'],['sec.budget','الميزانية'],['sec.plans','خططي وأهدافي'],['sec.acc','حساباتي'],['sec.cal','تقويم المدفوعات'],['sec.zakat','حاسبة الزكاة'],['sec.sms','رسائل البنك'],['sec.widget','ويدجت الآيفون والماك']]],
 ['الشريط السفلي',[['tab.home','الرئيسية'],['tab.monthly','الشهرية'],['tab.log','السجل'],['tab.budget','إدارة البيانات'],['tab.reports','التقارير']]]];
const LBL_DEF={};LBL_GROUPS.forEach(([,L])=>L.forEach(([k,d])=>LBL_DEF[k]=d));
function lbl(k){const v=((S.settings&&S.settings.labels)||{})[k];return v&&String(v).trim()?String(v).trim():(LBL_DEF[k]||k)}
function lblClean(v){return String(v||'').replace(/[<>&"'`]/g,'').replace(/\s+/g,' ').trim().slice(0,40)}
function lblSet(map){const L=Object.assign({},S.settings.labels||{});Object.entries(map).forEach(([k,v])=>{v=lblClean(v);if(!v||v===LBL_DEF[k])delete L[k];else L[k]=v});S.settings.labels=L;putSettings();render();applyTabLabels()}
function applyTabLabels(){document.querySelectorAll('nav.tabs [data-tab]').forEach(b=>{const k='tab.'+b.dataset.tab;if(!LBL_DEF[k])return;const t=[...b.childNodes].reverse().find(n=>n.nodeType===3);if(t&&t.textContent!==lbl(k))t.textContent=lbl(k)})}
/* زر ✏️ صغير بجانب العنوان، يظهر للمدير فقط */
function renBtn(k){return admOn()?`<button class="chip ren" type="button" data-rename="${k}" aria-label="تعديل اسم ${esc(lbl(k))}"><span class="lk">🔒 </span>✏️</button>`:''}
function openRename(k){const L=document.getElementById('layer');
  L.innerHTML=`${sheetTop('تعديل الاسم')}<h2 style="margin-top:0">✏️ تعديل الاسم</h2><div class="stack">
   <div class="field"><label for="rnV">الاسم الجديد</label><input class="inp" id="rnV" maxlength="40" value="${esc(lbl(k))}" autocomplete="off"></div>
   <p class="note" style="margin:0">الاسم الأصلي: «${esc(LBL_DEF[k])}». يظهر الاسم الجديد في كل مكان: الشاشات والطباعة والتصدير.</p></div>
   <div class="actions"><button class="btn block" id="rnSave">حفظ الاسم</button>${lbl(k)!==LBL_DEF[k]?'<button class="btn ghost block" id="rnReset">إرجاع الاسم الأصلي</button>':''}<button class="btn ghost block" data-close>إلغاء</button></div></div></div>`;
  setTimeout(()=>{const i=document.getElementById('rnV');if(i){i.focus();i.select()}},60);
  L.oninput=L.onchange=null;L.onkeydown=e=>{if(e.key==='Enter'&&e.target.id==='rnV')document.getElementById('rnSave').click()};
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';L.onkeydown=null;return}
    if(x.id==='rnSave'){const v=lblClean(document.getElementById('rnV').value);if(!v){toast('اكتب اسمًا');return}lblSet({[k]:v});L.innerHTML='';L.onkeydown=null;toast('تغيّر الاسم إلى «'+v+'»')}
    if(x.id==='rnReset'){lblSet({[k]:''});L.innerHTML='';L.onkeydown=null;toast('أُرجع الاسم الأصلي «'+LBL_DEF[k]+'»')}}}
function openLabels(){const L=document.getElementById('layer');
  const draw=()=>{L.innerHTML=`${sheetTop('أسماء الأقسام')}<h2 style="margin-top:0">✏️ أسماء الأقسام</h2><p class="note">غيّر أي اسم ثم احفظ. اترك الخانة فارغة لإرجاع الاسم الأصلي.</p>
   ${LBL_GROUPS.map(([g,Ls])=>`<h3>${g}</h3><div class="panel stack lblbox">${Ls.map(([k,d])=>`<div class="field"><label for="lb-${k.replace('.','-')}">${esc(d)}</label><input class="inp" id="lb-${k.replace('.','-')}" data-lbl="${k}" maxlength="40" placeholder="${esc(d)}" value="${lbl(k)!==d?esc(lbl(k)):''}" autocomplete="off"></div>`).join('')}</div>`).join('')}
   <div class="actions"><button class="btn block" id="lbSave">حفظ الأسماء</button><button class="btn ghost block" id="lbReset">إرجاع كل الأسماء الأصلية</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`};
  draw();L.oninput=L.onchange=L.onkeydown=null;
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='lbSave'){const m={};L.querySelectorAll('[data-lbl]').forEach(i=>m[i.dataset.lbl]=i.value);lblSet(m);L.innerHTML='';toast('حُفظت أسماء الأقسام')}
    if(x.id==='lbReset'){if(!confirm('إرجاع كل الأسماء إلى أصلها؟'))return;const m={};Object.keys(LBL_DEF).forEach(k=>m[k]='');lblSet(m);L.innerHTML='';toast('أُرجعت كل الأسماء الأصلية')}}}

/* ---------- 5. لوحة «أقسامي» في الرئيسية ---------- */
const TI={
 car:'<path d="M5 16V11l2-5h10l2 5v5M3 16h18v3H3zM7 19v2M17 19v2"/><circle cx="7.5" cy="13.5" r="1"/><circle cx="16.5" cy="13.5" r="1"/>',
 bills:'<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 2v4M16 2v4M4 10h16M9 15l2 2 4-4"/>',
 family:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2c2.8.3 5 2.6 5 5.8"/>',
 plan:'<path d="M5 11a7 6 0 0 1 13-2h2v4l-2 1-1 3h-2v-1h-5v1H8l-1-3a6 6 0 0 1-2-3z"/>',
 budget:'<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6 5"/>',
 sms:'<path d="M4 5h16v11H8l-4 4z"/><path d="M8 10h8M8 13h5"/>',
 debt:'<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18"/>',
 docs:CI.idcard,
 widget:'<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/>',
 trust:'<path d="M3 13h3l3 2h4a1.5 1.5 0 0 1 0 3H9"/><path d="M13 18l5-2.5a1.6 1.6 0 0 1 2 2.4L14 21H8l-5-2"/><circle cx="15" cy="7" r="3"/>',
 acc:'<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M16 15h2"/><path d="M6 6l9-3 1.5 3"/>',
 zakat:'<path d="M12 3l8 4v2H4V7z"/><path d="M6 9v8M10 9v8M14 9v8M18 9v8M3 20h18"/>',
 cal:CI.calendar,
 adv:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>'
};
function tile(o){return `<button class="tile${o.st?' '+o.st:''}" ${o.attr}><span class="ti" style="background:${o.c}22;color:${o.c}">${svgI(TI[o.i])}</span><b>${o.t}</b><small>${o.s}</small></button>`}
function dashHtml(onData){
  const m=S.month,a=inMonth(m),exp=sum(a,'exp');const T=[];
  const C=cars(),al=carAlerts();
  T.push({i:'car',c:'#3E7CB1',attr:'data-tab="cars"',t:esc(lbl('sec.cars')),st:al.length?'alert':C.length?'good':'',s:!C.length?'أضف سيارتك لمتابعة التأمين والملكية والصيانة':al.length?esc(al[0].text)+(al.length>1?' (+'+(al.length-1)+')':''):(C.length===1?'سيارة واحدة':C.length+' سيارات')+' · كل شيء ساري'});
  {const A=docAlertList();const n=Vault.docs.length;T.push({i:'docs',c:'#24508C',attr:'data-tab="docs"',t:esc(lbl('sec.docs')),st:A.some(a=>a.level==='late')?'alert':'',s:A.length?esc(A[0].title)+' '+esc(A[0].when.split('،')[0]):n?n+' مستند في الخزنة المشفّرة':'البطاقة والجواز والـCV في خزنة مشفّرة'})}
    {const held=trustsHeld(),n=trusts().filter(t=>trustCalc(t).rem>0).length,al=trustAlertList();T.push({i:'trust',c:'#6B5C3A',attr:'data-tab="trusts"',t:esc(lbl('sec.trusts')),st:al.some(a=>a.level==='late')?'alert':'',s:held?'عندك <span class="num">'+amtH(held)+'</span> لـ'+countWord(n,'شخص واحد','شخصين','أشخاص','شخصًا')+(al.length?' · '+al.length+' موعد قريب':''):'وثّق أموال الآخرين التي عندك'})}
  const st=recStatus(m);const late=st.R.filter(i=>!i.isPaid&&(m<ym(new Date())||(m===ym(new Date())&&new Date().getDate()>i.day)));
  T.push({i:'bills',c:'#6B5CA5',attr:'data-tab="monthly"',t:esc(lbl('sec.monthly')),st:late.length?'alert':st.R.length&&!st.left?'good':'',s:!st.R.length?'الفواتير والإيجار وأقساط الديون في مكان واحد':!st.left?'دفعت كلها هذا الشهر':'باقي '+st.left+' من '+st.R.length+(late.length?' · '+late.length+' متأخر':'')});
  const P=people(),po=byPerson(a);const pt=P.reduce((s,p)=>s+(po[p.id]||0),0);const over=P.filter(p=>+p.allowance&&(po[p.id]||0)>+p.allowance);
  T.push({i:'family',c:'#2F7F7A',attr:'data-tab="house"',t:esc(lbl('sec.house')),st:over.length?'alert':'',s:!P.length?'وزّع المصاريف على أفراد أسرتك':over.length?'تجاوزت مخصص '+esc(over[0].name):P.length+' أشخاص · صُرف <span class="num">'+amtH(pt)+'</span>'});
  const B=+S.settings.monthlyBudget||0;let bs='حدّد سقفًا شهريًا لمصاريفك',bst='';
  if(B){const d=new Date();const dl=monthDays(d)-d.getDate()+1;bs=exp>B?'تجاوزت بـ <span class="num">'+amtH(exp-B)+'</span>':'صرفت '+Math.round(exp/B*100)+'%'+(m===ym(d)?' · يوميًا <span class="num">'+amtH(dailyPlan().daily)+'</span>':'');bst=exp>B?'alert':''}
  if(!onData)T.push({i:'budget',c:'#B0662F',attr:'data-tab="budget"',t:esc(lbl('sec.budget')),st:bst,s:bs});
  {const AT=accTotals();T.push({i:'acc',c:'#1F6B55',attr:'data-accopen="1"',t:esc(lbl('sec.acc')),s:AT.known?'مجموع أرصدتك <span class="num">'+amtH(AT.total)+'</span>':'أرصدة الجاري والكاش والبطاقات، والتحويل بينها'})}
  T.push({i:'cal',c:'#C9881E',attr:'data-paycal="1"',t:esc(lbl('sec.cal')),s:'مواعيد الفواتير والأقساط والراتب والخطط'});
  T.push({i:'zakat',c:'#2E8B72',attr:'data-zakat="1"',t:esc(lbl('sec.zakat')),s:S.settings.zakat&&S.settings.zakat.hawl?'الحول '+fmtD(addDays(S.settings.zakat.hawl,354)):'احسب زكاة مالك بدقة'});
  T.push({i:'sms',c:'#7A6CC0',attr:'id="openImp2"',t:esc(lbl('sec.sms')),s:'الصق رسالة الخصم لتسجيلها'});
  {const at=widgetAt();T.push({i:'widget',c:'#1F5AA6',attr:'data-wopen="1"',t:esc(lbl('sec.widget')),st:at&&dataChangedAt()>at?'alert':'',s:at?(dataChangedAt()>at?'بياناته قديمة، حدّثها':'حُدّث '+fmtD(isoD(new Date(at)))):'ملخصك على الشاشة الرئيسية وسطح المكتب'})}
  return `<div class="dash">${T.map(tile).join('')}</div>`;
}

/* ---------- 6. مستشاري الذكي: تحليل بياناتك داخل الجهاز فقط ---------- */
function advCtx(){const now=new Date(),cm=ym(now);const a=inMonth(cm);const inc=sum(a,'inc'),exp=sum(a,'exp');
  const prev=pastMonths(3),avgInc=pastAvg(x=>sum(x,'inc'))||0,avgExp=avgExpense();
  const dim=monthDays(now),day=now.getDate();
  const st=recStatus(cm);const G=(S.settings.goals||[]).map(g=>({g,c:goalCalc(g)}));
  return{now,cm,a,inc,exp,prev,avgInc,avgExp,dim,day,st,G,baseInc:Math.max(inc,avgInc),refExp:avgExp||exp,B:+S.settings.monthlyBudget||0,gs:goalsSummary(),Ds:debts().filter(d=>+d.balance>0)}}
function advLastBackup(){try{return localStorage.getItem('masareef:lastBackup')||''}catch(e){return ''}}
function advPriorities(c){const P=[];const add=(w,ic,t,s,act,kind)=>P.push({w,ic,t,s,act,kind:kind||''});
  const late=c.st.R.filter(i=>!i.isPaid&&c.day>i.day);
  if(late.length)add(100,'bills',countWord(late.length,'دفعة متأخرة','دفعتان متأخرتان','دفعات متأخرة','دفعة متأخرة')+': '+late.slice(0,3).map(i=>esc(i.name)).join('، '),'المجموع <b class="num">'+amtH(late.reduce((s,i)=>s+i.amount-(i.paidAmt||0),0))+'</b>. ادفعها أولًا لتتجنب الغرامات.',['افتح الشهرية','data-tab="monthly"'],'bill');
  const soon=c.st.R.filter(i=>!i.isPaid&&i.day>=c.day&&i.day-c.day<=3);
  if(soon.length)add(70,'cal','قريبًا خلال 3 أيام: '+soon.slice(0,3).map(i=>esc(i.name)).join('، '),'جهّز <b class="num">'+money(soon.reduce((s,i)=>s+i.amount-(i.paidAmt||0),0))+'</b> '+CUR+'.',['الشهرية','data-tab="monthly"'],'bill');
  trustAlertList().slice(0,3).forEach(x=>add(x.level==='late'?88:62,'trust',esc(x.title),esc(x.when),['الأمانات','data-tab="trusts"'],'trust'));
  carAlertList().slice(0,3).forEach(x=>add(x.level==='late'?95:60,'car',esc(x.title),esc(x.when),['السيارات','data-tab="cars"'],'car'));
  docAlertList().slice(0,3).forEach(x=>add(x.level==='late'?90:55,'doc',esc(x.title),esc(x.when),['مستنداتي','data-tab="docs"'],'doc'));
  if(c.inc>0&&c.exp>c.inc)add(92,'warn','مصاريفك هذا الشهر أكثر من دخلك','تجاوزته بـ <b class="num">'+amtH(c.exp-c.inc)+'</b>. راجع أكبر الفئات وأجّل غير الضروري.',['السجل','data-tab="log"']);
  if(c.B&&c.day>=3){const proj=c.exp/c.day*c.dim;
    if(c.exp>c.B)add(90,'budget','تجاوزت سقف مصاريفك الشهري','صرفت <b class="num">'+amtH(c.exp)+'</b> من سقف <b class="num">'+amtH(c.B)+'</b>.',['الميزانية','data-tab="budget"']);
    else if(proj>c.B*1.05)add(80,'budget','بهذا المعدل ستتجاوز سقفك','المتوقع حتى آخر الشهر <b class="num">'+amtH(proj)+'</b>. لتلتزم لا تتجاوز <b class="num">'+amtH(dailyPlan().daily)+'</b> يوميًا.',['خطة الصرف','data-dayplan="1"'])}
  {const d=dailyPlan();if(d.has&&d.todayLeft<-0.0005)add(76,'budget','تجاوزت مصروف اليوم','صرفت <b class="num">'+amtH(d.spentToday)+'</b> من <b class="num">'+amtH(d.daily)+'</b>. سيقل مصروف الأيام القادمة إلى نحو <b class="num">'+amtH(Math.max(0,d.avail)/Math.max(1,d.left-1))+'</b>.',['خطة الصرف','data-dayplan="1"'],'today')}
  const sur=avgSurplus();
  if(sur!==null&&c.gs.plan>0.0005&&c.gs.plan>sur+0.0005){const far=c.gs.G.filter(x=>!x.c.done).sort((a,b)=>b.c.monthly-a.c.monthly)[0];
    add(85,'plan','خططك أكبر من قدرتك الشهرية','تحتاج <b class="num">'+amtH(c.gs.plan)+'</b> شهريًا، ومتوسط ما يتبقى لك <b class="num">'+amtH(Math.max(0,sur))+'</b>.'+(far?' جرّب تأجيل موعد «'+esc(far.g.name)+'» أو تقليل مبلغها.':''),far?['عدّل الخطة','data-goplan="'+esc(far.g.id)+'"']:['الخطط','data-tab="budget"'])}
  c.G.filter(x=>x.c.past&&!x.c.done&&x.c.tgt).slice(0,2).forEach(x=>add(75,'plan','حان موعد «'+esc(x.g.name)+'» ولم تكتمل','ادّخرت <b class="num">'+amtH(x.c.sv)+'</b> من <b class="num">'+amtH(x.c.tgt)+'</b>.',['افتح الخطة','data-goplan="'+esc(x.g.id)+'"']));
  if(c.gs.total>0.0005&&c.day>=10)add(c.day>=20?68:52,'plan','باقي حصة خططك لهذا الشهر','ادّخر <b class="num">'+amtH(c.gs.total)+'</b>'+(c.gs.near?'، وأقرب خطة «'+esc(c.gs.near.g.name)+'»':'')+'.',['أودعت مبلغًا','data-advdep="1"'],'share');
  {const acc=savAcc();if(acc.balance!==null&&acc.balance!==''&&(+acc.balance)<savTotal()-0.0005)add(60,'warn','رصيد حساب الادخار أقل من مجموع خططك','الفرق <b class="num">'+amtH(savTotal()-(+acc.balance))+'</b>. سجّل ما صرفته من الخطط.',['حساب الادخار','data-tab="budget"'])}
  if(c.Ds.length&&c.baseInc){const inst=c.Ds.reduce((s,d)=>s+debtInst(d),0);const r=inst/c.baseInc;
    if(r>0.4)add(72,'debt','أقساطك '+Math.round(r*100)+'% من دخلك','الأفضل أن تبقى أقل من 40%. تجنّب أي دين جديد حتى تنخفض النسبة.',['ديوني','data-tab="debts"'])}
  if(c.Ds.length){const D=debtPlan();const ex=Math.max(10,Math.round(Math.max(0,sur||0)*0.1/5)*5);const b=simDebts(c.Ds,D.extra,D.strategy,true),p=simDebts(c.Ds,(+D.extra||0)+ex,D.strategy,true);
    if(!b.stuck&&!p.stuck&&b.months-p.months>=1)add(58,'debt','عجّل التخلص من ديونك','لو زدت <b class="num">'+amtH(ex)+'</b> شهريًا تنتهي في '+monthLabel(p.months)+' بدل '+monthLabel(b.months)+(b.interest-p.interest>0.5?' وتوفّر فوائد <b class="num">'+amtH(b.interest-p.interest)+'</b>':'')+'.',['خطة الديون','data-tab="debts"'])}
  if(c.prev.length){const avg={};c.prev.forEach(x=>x.filter(t=>t.type==='exp').forEach(t=>avg[t.cat]=(avg[t.cat]||0)+(+t.amount)/c.prev.length));const now={};c.a.filter(t=>t.type==='exp').forEach(t=>now[t.cat]=(now[t.cat]||0)+(+t.amount));
    Object.entries(now).filter(([k,v])=>avg[k]&&v>avg[k]*1.4&&v-avg[k]>=10).sort((x,y)=>(y[1]-avg[y[0]])-(x[1]-avg[x[0]])).slice(0,2).forEach(([k,v])=>add(50,'up','صرفك على «'+esc(catOf(k).n)+'» ارتفع','هذا الشهر <b class="num">'+amtH(v)+'</b> ومعدلك <b class="num">'+amtH(avg[k])+'</b> (أعلى بـ <span dir="ltr">'+Math.round((v/avg[k]-1)*100)+'%</span>).',['السجل','data-tab="log"']))}
  if(!c.inc&&c.day>=7&&c.avgInc>0)add(45,'bulb','لم تسجّل دخل هذا الشهر','سجّل راتبك ليكون التحليل دقيقًا.',['سجّل الدخل','data-advinc="1"']);
  proAdvice(add);
  return P.sort((a,b)=>b.w-a.w)}
function advChecklist(c){const L=[];const add=(done,t,s,act)=>L.push({done:!!done,t,s,act});const has=k=>c.G.some(x=>x.g.kind===k);
  const em=c.G.find(x=>x.g.kind==='emergency');
  add(em,'صندوق الطوارئ',em?'ادّخرت منه '+money(em.c.sv)+' '+CUR:'احتياطي يغطي 3 أشهر من مصاريفك'+(c.refExp?' (تقريبًا <b class="num">'+amtH(c.refExp*3)+'</b>)':'')+' للظروف المفاجئة.',['أنشئ الخطة','data-advplan="emergency"']);
  const miss=['ramadan','fitr','adha'].filter(k=>!has(k));
  add(!miss.length,'خطط رمضان والعيدين',miss.length?'ينقصك: '+miss.map(k=>GOAL_KINDS[k].n).join('، ')+'. أحسب مواعيدها بالهجري تلقائيًا.':'كلها مضافة.',miss.length?['أضف '+GOAL_KINDS[miss[0]].n,'data-gadd="'+miss[0]+'"']:null);
  const C=cars();
  if(C.length){const bad=C.filter(x=>!x.insExpiry||!x.regExpiry);add(!bad.length,'تواريخ التأمين والملكية لسياراتك',bad.length?'أكمل التواريخ لـ'+bad.map(x=>esc(x.name)).join('، ')+' لأنبّهك قبل الانتهاء.':'سأنبهك قبل انتهائها.',['السيارات','data-tab="cars"']);
    if(!has('insurance')&&!has('mulkiya'))add(false,'ادخار لتأمين وتجديد السيارة','تأمين السيارة السنوي يأتي دفعة واحدة؛ قسّمه على الأشهر.',['أضف الخطة','data-gadd="insurance"'])}
  else add(false,'سجّل سيارتك','لتنبيهك قبل انتهاء التأمين والملكية وموعد الصيانة.',['السيارات','data-tab="cars"']);
  add(+S.settings.payday,'يوم نزول الراتب',+S.settings.payday?'يوم '+S.settings.payday+' من كل شهر':'حدّده لأحسب مصروفك اليومي حتى الراتب بالضبط وادخار الخطط على عدد الرواتب.',['حدّد اليوم','data-dayplan="pay"']);
  add(c.B,'سقف المصاريف الشهري',c.B?'سقفك '+money(c.B)+' '+CUR:'حدّد سقفًا لأحسب لك المبلغ اليومي المتاح وأنبهك قبل التجاوز.',['حدّد السقف','data-tab="budget"']);
  add(recs().length,'الفواتير والالتزامات الثابتة',recs().length?recs().length+' التزامات تتكرر كل شهر':'أضف الإيجار والإنترنت والكهرباء لتظهر كل شهر في «الشهرية».',['الشهرية','data-tab="monthly"']);
  if(c.G.length){const acc=savAcc();add(acc.balance!==null&&acc.balance!=='','رصيد حساب الادخار','اكتب رصيد البنك لأطابقه مع مجموع خططك.',['حساب الادخار','data-tab="budget"'])}
  {const mine=Vault.docs.filter(d=>!d.owner);const id=mine.some(d=>d.type==='id'),pp=mine.some(d=>d.type==='passport');
   add(id&&pp,'بطاقتك وجوازك في الخزنة',id&&pp?'محفوظة ومشفّرة، وأنبهك قبل انتهائها.':'ينقصك: '+[!id&&'البطاقة الشخصية',!pp&&'جواز السفر'].filter(Boolean).join(' و')+'. أضف تاريخ الانتهاء لأنبهك.',['مستنداتي','data-tab="docs"'])}
  {const lb=advLastBackup();const ok=Sync.linked()||(lb&&(Date.now()-new Date(lb+'T12:00'))/864e5<=30);
   add(ok,'نسخة احتياطية حديثة',Sync.linked()?'المزامنة مع Google Drive مفعّلة.':lb?'آخر نسخة '+fmtD(lb)+(ok?'':'، احفظ نسخة جديدة.'):'لم تحفظ نسخة بعد. احفظها حتى لا تضيع بياناتك.',['احفظ نسخة','data-advbak="1"'])}
  add(people().length,'الأهل والبيت',people().length?people().length+' أشخاص':'أضف أفراد أسرتك لتعرف كم يُصرف على كل واحد.',['الأهل والبيت','data-tab="house"']);
  return L}
function advScore(c,P,CL){const parts=[];
  {const inc=c.inc||c.avgInc,exp=c.inc?c.exp:c.avgExp;const r=inc?(inc-exp)/inc:null;parts.push(['نسبة التوفير',r===null?12:Math.max(0,Math.min(1,r/0.2))*25,25])}
  {const em=c.G.find(x=>x.g.kind==='emergency');parts.push(['صندوق الطوارئ',em&&c.refExp?Math.min(1,em.c.sv/(c.refExp*3))*20:0,20])}
  {const late=c.st.R.filter(i=>!i.isPaid&&c.day>i.day).length;parts.push(['الالتزام بالدفع',Math.max(0,15-5*late),15])}
  {let v=15;if(c.Ds.length){const r=c.baseInc?c.Ds.reduce((s,d)=>s+debtInst(d),0)/c.baseInc:1;v=r<=0.2?13:r<=0.4?9:r<=0.5?5:2}parts.push(['الديون',v,15])}
  {const sur=avgSurplus();let v=5;if(c.G.length){v=10;if(sur!==null&&c.gs.plan>sur+0.0005)v-=5;if(c.G.some(x=>x.c.past&&!x.c.done&&x.c.tgt))v-=3}parts.push(['الخطط',Math.max(0,v),10])}
  parts.push(['الميزانية',!c.B?2:c.exp<=c.B?5:0,5]);
  parts.push(['الترتيب والتنظيم',CL.length?CL.filter(x=>x.done).length/CL.length*10:0,10]);
  const total=Math.round(parts.reduce((s,p)=>s+p[1],0));
  const lbl=total>=80?['ممتاز','var(--inc)']:total>=60?['جيد','var(--accent)']:total>=40?['مقبول','var(--warn)']:['يحتاج اهتمامًا','var(--exp)'];
  return{total,lbl,parts}}
function advIc(k){const m={warn:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',up:'<path d="M4 17l6-6 4 4 6-7"/><path d="M15 8h5v5"/>',bulb:TI.adv,cal:CI.calendar,car:TI.car,debt:TI.debt,doc:CI.idcard,plan:TI.plan,bills:TI.bills,budget:TI.budget,trust:TI.trust};
  return svgI(m[k]||m.bulb)}
function advRow(p,i){const lv=p.w>=80?'high':p.w>=55?'mid':'low';
  return `<div class="advrow ${lv}"><span class="advic">${advIc(p.ic)}</span><div class="advtx"><b>${i!=null?'<span class="advn">'+(i+1)+'</span>':''}${p.t}</b><small>${p.s}</small></div>${p.act?`<button class="chip" ${p.act[1]}>${p.act[0]}</button>`:''}</div>`}
function advGreet(){const h=new Date().getHours();return h<12?'صباح الخير':h<18?'مساء الخير':'مساء النور'}
function advHomeHtml(){if(!list().length&&!(S.settings.goals||[]).length)return '';
  const c=advCtx(),P=advPriorities(c),CL=advChecklist(c),sc=advScore(c,P,CL);const top=P.filter(p=>!['car','doc','share','today','bill','trust'].includes(p.kind)).slice(0,3);const miss=CL.filter(x=>!x.done).length;
  return `<h2>مستشاري</h2><div class="panel advcard"><div class="advhead"><div class="hp-ring adv-ring" style="--p:${sc.total};--rc:${sc.lbl[1]}"><span class="num">${sc.total}</span></div><div style="min-width:0"><span class="note">${advGreet()}، صحتك المالية</span><b style="color:${sc.lbl[1]}">${sc.lbl[0]}</b><small class="note">${P.length?countWord(P.length,'أولوية واحدة','أولويتان','أولويات','أولوية')+' لك الآن':'لا شيء عاجل، أحسنت'}${miss?' · '+miss+' أشياء قد تكون نسيتها':''}</small></div></div>
  ${top.length?'<div class="advlist">'+top.map(p=>advRow(p)).join('')+'</div>':'<div class="okbox" style="margin-top:10px">كل شيء تحت السيطرة هذا الشهر.</div>'}
  <div class="row2" style="margin-top:10px"><button class="btn ghost" data-tab="advisor">التحليل الكامل</button><button class="btn ghost" data-ask="1">اسأل المستشار</button></div></div>`}
function vAdvisor(){const c=advCtx(),P=advPriorities(c),CL=advChecklist(c),sc=advScore(c,P,CL),dp=dailyPlan();const done=CL.filter(x=>x.done).length;
  const parts=sc.parts.map(([n,v,m])=>`<div class="advpart"><span>${n}</span><span class="meter"><i style="width:${v/m*100}%;background:${v/m>=.7?'var(--inc)':v/m>=.4?'var(--warn)':'var(--exp)'}"></i></span><b class="num">${Math.round(v)}/${m}</b></div>`).join('');
  return `<div class="backrow" style="margin-top:4px"><h2 style="margin:0">مستشاري الذكي</h2><div style="display:flex;gap:6px"><button class="chip pay" data-ask="1">اسأل المستشار</button><button class="chip" data-tab="home">الرئيسية</button></div></div>
  <div class="panel"><div class="advhead"><div class="hp-ring adv-ring big" style="--p:${sc.total};--rc:${sc.lbl[1]}"><span class="num">${sc.total}</span></div><div><span class="note">صحتك المالية من 100</span><b style="color:${sc.lbl[1]};font-size:20px">${sc.lbl[0]}</b><small class="note">أحلّل دخلك ومصاريفك وخططك وديونك داخل هاتفك فقط.</small></div></div><div class="advparts">${parts}</div></div>
  <h2>أولوياتك الآن</h2>${P.length?'<div class="panel advlist" style="padding-block:4px">'+P.map(advRow).join('')+'</div>':'<div class="okbox">لا توجد أولويات عاجلة. استمر على هذا.</div>'}
  <h2>خطة الصرف اليومية</h2><div class="panel">${dp.has?planBreakdownHtml(dp):'<div class="note">سجّل دخلك هذا الشهر أو حدّد سقفًا للمصاريف لأحسب لك مصروفًا يوميًا ثابتًا.</div>'}<div class="chips" style="margin:10px 0 0"><button class="chip pay" data-dayplan="1">تفاصيل كل يوم</button><button class="chip" data-ask="1">هل أقدر أشتري؟</button></div></div>
  <div class="backrow"><h2 style="margin:0">قد تكون نسيت</h2><span class="note">أنجزت ${done} من ${CL.length}</span></div>
  <div class="panel"><div class="meter" style="margin-bottom:8px"><i style="width:${done/CL.length*100}%;background:var(--inc)"></i></div>${CL.map(x=>`<div class="chk ${x.done?'done':''}"><span class="chkbox">${x.done?'✓':''}</span><div class="advtx"><b>${x.t}</b><small>${x.s}</small></div>${!x.done&&x.act?`<button class="chip pay" ${x.act[1]}>${x.act[0]}</button>`:''}</div>`).join('')}</div>`}

/* يوم نزول الراتب: إذا حُدّد تصبح الفترة من راتب إلى الراتب التالي بدل الشهر الميلادي */
function payDate(y,m0){const pd=+S.settings.payday;const dim=new Date(y,m0+1,0).getDate();const d=new Date(y,m0,Math.min(pd,dim),12);
  const w=d.getDay(),rule=S.settings.payRule||'none';
  if(rule==='before'){if(w===5)d.setDate(d.getDate()-1);else if(w===6)d.setDate(d.getDate()-2)}
  else if(rule==='after'){if(w===5)d.setDate(d.getDate()+2);else if(w===6)d.setDate(d.getDate()+1)}
  return d}
function payCycle(now){if(!+S.settings.payday)return null;now=now||new Date();const t=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);
  const cur=payDate(t.getFullYear(),t.getMonth());let start,next;
  if(cur<=t){start=cur;next=payDate(t.getFullYear(),t.getMonth()+1)}else{start=payDate(t.getFullYear(),t.getMonth()-1);next=cur}
  const D=(a,b)=>Math.round((b-a)/864e5);const end=new Date(next);end.setDate(end.getDate()-1);
  return{start:isoD(start),next:isoD(next),end:isoD(end),len:D(start,next),dayIdx:D(start,t)+1,left:D(t,next)}}
/* عدد الرواتب من اليوم حتى تاريخ معيّن (لحساب ادخار الخطط بدقة) */
function paydaysUntil(dl){if(!+S.settings.payday)return null;const t=new Date();t.setHours(0,0,0,0);let n=0;
  for(let k=0;k<240;k++){const d=payDate(t.getFullYear(),t.getMonth()+k);if(d>dl)break;if(d>=t)n++}return n}
/* الالتزامات والأقساط المستحقة بين تاريخين (قد تمتد الفترة على شهرين) */
function dueItems(from,to){const out=[];for(let m=from.slice(0,7);m<=to.slice(0,7);m=shiftMonth(m,1))monthItems(m).forEach(i=>{const date=recDate({day:i.day},m);if(date>=from&&date<=to)out.push(Object.assign({date},i))});return out}
function periodTo(d){return d.cyc?'حتى نزول الراتب':'حتى نهاية الشهر'}
/* خطة الصرف اليومية: مبلغ متساوٍ لكل يوم حتى الراتب القادم (أو نهاية الشهر) بعد خصم الالتزامات والأقساط والادخار.
 * هذا هو «المتاح يوميًا» الوحيد في التطبيق (الرئيسية، الميزانية، المستشار، الويدجت). */
const isFixedTx=t=>!!(t.rec||t.debt||t.cat==='loan');
function varSpend(a){return a.filter(t=>t.type==='exp'&&!isFixedTx(t)).reduce((s,t)=>s+(+t.amount||0),0)}
function dailyPlan(extra){const now=new Date(),cm=ym(now),td=today();const cyc=payCycle(now);
  const mEnd=cm+'-'+String(monthDays(now)).padStart(2,'0');
  const from=cyc?cyc.start:cm+'-01',to=cyc?cyc.end:mEnd;const a=inRange(from,td);
  const dim=cyc?cyc.len:+mEnd.slice(8),day=cyc?cyc.dayIdx:now.getDate(),left=cyc?cyc.left:dim-day+1;
  const incRec=sum(a,'inc'),avgInc=pastAvg(x=>sum(x,'inc'))||0;const expected=!incRec&&avgInc>0;const inc=incRec||avgInc;
  const items=dueItems(from,to);const spent=sum(a,'exp');const unpaid=items.filter(i=>!i.isPaid).reduce((s,i)=>s+i.amount-(i.paidAmt||0),0);
  const save=goalsSummary().total;const bufPct=+S.settings.dayBuf||0;const buffer=inc*bufPct/100;const B=+S.settings.monthlyBudget||0;
  let avail=inc-spent-unpaid-save-buffer-(extra||0),by='income';
  if(B){const capA=B-spent-unpaid-(extra||0);if(capA<avail){avail=capA;by='cap'}}
  const spentToday=varSpend(a.filter(t=>t.date===td));
  const daily=Math.max(0,avail+spentToday)/Math.max(1,left);
  const avgDay=(pastAvg(varSpend)||0)/30.4;
  return{now,cm,cyc,from,to,items,dim,day,left,inc,incRec,expected,spent,unpaid,save,bufPct,buffer,B,by,avail,spentToday,daily,todayLeft:daily-spentToday,avgDay,has:inc>0||B>0}}
/* كم المفروض أن يكون في حسابك الجاري اليوم حسب الخطة (منفصل عن حساب الادخار) */
function mainAcc(){return Object.assign({name:'الحساب الجاري',balance:null,at:'',carry:{}},S.settings.mainAcc||{})}
function bankPlan(d){d=d||dailyPlan();const acc=mainAcc();const key=d.cyc?d.from:d.cm;const carry=+acc.carry[key]||0;
  const C=d.items.reduce((s,i)=>s+i.amount,0),dueBy=d.items.filter(i=>i.date<=today()).reduce((s,i)=>s+i.amount,0);
  const G=S.settings.goals||[];const Sv=goalsSummary().plan;const dep=G.reduce((s,g)=>s+(+((g.log||{})[d.cm])||0),0);
  let d0=(d.inc-C-Sv-d.buffer)/d.dim;if(d.B)d0=Math.min(d0,(d.B-C)/d.dim);d0=Math.max(0,d0);
  const expected=carry+d.inc-dueBy-Sv-d0*d.day;const recorded=carry+d.incRec-d.spent-dep;
  const hasBal=acc.balance!==null&&acc.balance!==''&&acc.at&&acc.at>=d.from;
  const tr=trustsHeld('main');
  return{acc,key,carry,C,dueBy,Sv,dep,d0,expected,recorded,tr,actual:hasBal?+acc.balance:null,own:hasBal?r3(+acc.balance-tr):null,diff:hasBal?+acc.balance-tr-expected:null}}
function bankHtml(d){const b=bankPlan(d);const startLbl=d.cyc?'رصيدك قبل نزول الراتب':'متبقٍ من الشهر الماضي';
  return `<div class="bankbox"><div class="bkh"><span>المفروض في ${esc(b.acc.name)} اليوم حسب الخطة</span><b class="num">${money(b.expected)}</b><small>${CUR}${d.expected?' · قبل تسجيل الراتب، حسب معدل دخلك':''}</small></div>
   <div class="sumrow"><span>${d.cyc?'منذ راتب '+fmtD(d.from):'بداية الشهر'}${b.carry?' ('+startLbl+' '+money(b.carry)+')':''} + الدخل</span><b class="num">${amtH(b.carry+d.inc)}</b></div>
   ${b.dueBy?`<div class="sumrow"><span>التزامات وأقساط حتى اليوم</span><b class="num">− ${money(b.dueBy)}</b></div>`:''}
   ${b.Sv?`<div class="sumrow"><span>تحويل الادخار لحساب الادخار</span><b class="num">− ${money(b.Sv)}</b></div>`:''}
   <div class="sumrow"><span>مصروف ${countWord(d.day,'يوم واحد','يومين','أيام','يومًا')} × <span class="num">${amtH(b.d0)}</span></span><b class="num">− ${money(b.d0*d.day)}</b></div>
   <div class="sumrow total"><span>حسب ما سجّلته فعلًا</span><b class="num ${b.recorded>=b.expected?'amt-inc':'amt-exp'}">${amtH(b.recorded)}</b></div>
   <div class="note">${b.recorded>=b.expected?'أنت متقدم على الخطة بـ <b class="num">'+amtH(b.recorded-b.expected)+'</b>'+(b.Sv-b.dep>0.0005?'، منها <b class="num">'+amtH(b.Sv-b.dep)+'</b> ادخار لم تحوّله لحساب الادخار بعد.':'.'):'صرفت أكثر من الخطة بـ <b class="num">'+amtH(b.expected-b.recorded)+'</b> حتى اليوم.'}</div>
   ${b.tr?`<div class="note" style="margin-top:6px">في هذا الحساب أمانات للآخرين <b class="num">${amtH(b.tr)}</b> ليست لك، وتُخصم من رصيدك الفعلي عند المقارنة.</div>`:''}
   ${b.actual!==null?`<div class="${Math.abs(b.diff)<0.5?'okbox':b.diff>0?'okbox':'warnbox'}" style="margin-top:8px">رصيدك الفعلي <b class="num">${amtH(b.actual)}</b> (${fmtD(b.acc.at)})${b.tr?'، أموالك منه <b class="num">'+amtH(b.own)+'</b> بعد خصم الأمانات':''}: ${Math.abs(b.diff)<0.5?'مطابق للخطة.':b.diff>0?'أعلى من المفروض بـ <b class="num">'+amtH(b.diff)+'</b>.':'أقل من المفروض بـ <b class="num">'+amtH(-b.diff)+'</b>. ربما عمليات لم تُسجّل.'}</div>`:''}
   <div class="row2" style="margin-top:8px"><div class="field"><label for="bkBal">رصيدك الفعلي الآن</label><input class="inp num" id="bkBal" inputmode="decimal" placeholder="من تطبيق البنك" value="${b.actual!==null?amtIn(b.actual):''}" style="text-align:left"></div>
   <div class="field"><label for="bkCarry">${startLbl}</label><input class="inp num" id="bkCarry" inputmode="decimal" placeholder="0.000" value="${b.carry?amtIn(b.carry):''}" style="text-align:left"></div></div>
   <button class="btn ghost block" id="bkSave" style="margin-top:6px">حفظ ومقارنة</button></div>`}
/* بطاقة «اليوم» في الرئيسية */
function todayHtml(){if(S.month!==ym(new Date()))return '';const d=dailyPlan();
  if(!d.has)return list().length?`<div class="today"><div class="tdh"><b>مصروفك اليومي</b></div><div class="note">سجّل دخلك أو حدّد سقفًا للمصاريف، وأحسب لك مبلغًا ثابتًا لكل يوم.</div></div>`:'';
  const pct=d.daily?Math.min(100,d.spentToday/d.daily*100):100;const over=d.todayLeft<-0.0005;
  return `<div class="today${over?' over':''}"><div class="tdh"><b>اليوم</b><span class="note">${d.cyc?'الراتب بعد <b class="num">'+countWord(d.left,'يوم واحد','يومين','أيام','يومًا')+'</b> ('+fmtD(d.cyc.next)+')':countWord(d.left,'يوم واحد','يومان','أيام','يومًا')+' حتى نهاية الشهر'}</span></div>
   <div class="tdm"><div><span>متبقٍ لك اليوم</span><b class="num ${over?'amt-exp':'amt-inc'}">${over?'−':''}${money(Math.abs(d.todayLeft))}</b></div><div><span>مصروف اليوم</span><b class="num">${amtH(d.daily)}</b></div><div><span>صرفت اليوم</span><b class="num">${amtH(d.spentToday)}</b></div></div>
   <div class="meter"><i style="width:${pct}%;background:${over?'var(--exp)':pct>80?'var(--warn)':'var(--inc)'}"></i></div>
   ${d.cyc?`<div class="paybar" title="الأيام منذ آخر راتب"><i style="width:${Math.min(100,(d.day-1)/d.dim*100)}%"></i></div><div class="note" style="display:flex;justify-content:space-between"><span>راتب ${fmtD(d.from)}</span><span>اليوم ${d.day} من ${d.dim}</span><span>راتب ${fmtD(d.cyc.next)}</span></div>`:''}
   ${over?`<div class="note" style="color:var(--exp)">تجاوزت مصروف اليوم، فسيصبح مصروف الأيام القادمة <b class="num">${amtH(Math.max(0,d.avail)/Math.max(1,d.left-1))}</b> تقريبًا.</div>`:''}
   <div class="tdbank"><span>المفروض في حسابك الجاري اليوم</span><b class="num">${amtH(bankPlan(d).expected)}</b></div>
   <div class="chips" style="margin:8px 0 0"><button class="chip pay" data-dayplan="1">خطة الصرف اليومية</button><button class="chip" data-ask="1">هل أقدر أشتري؟</button>${d.cyc?'':'<button class="chip" data-dayplan="pay">حدّد يوم الراتب</button>'}</div></div>`}
/* تفصيل الحساب: من الدخل إلى مصروف كل يوم */
function planBreakdownHtml(d){const row=(n,v,sg,cls)=>`<div class="sumrow"><span>${n}</span><b class="num ${cls||''}">${sg}${money(Math.abs(v))}</b></div>`;
  return `${d.by==='cap'?row('سقف المصاريف الشهري',d.B,'',''):row(d.expected?'الدخل المتوقع (معدل آخر الأشهر)':d.cyc?'الدخل منذ راتب '+fmtD(d.from):'الدخل هذا الشهر',d.inc,'','amt-inc')}
   ${row('صرفت حتى الآن',d.spent,'− ','')}${d.unpaid?row('التزامات وأقساط لم تُدفع '+periodTo(d),d.unpaid,'− ',''):''}${d.by!=='cap'&&d.save?row(d.cyc?'ادخار الخطط من هذا الراتب':'ادخار الخطط لهذا الشهر',d.save,'− ',''):''}${d.by!=='cap'&&d.buffer?row('احتياطي '+d.bufPct+'%',d.buffer,'− ',''):''}
   <div class="sumrow total"><span>المتاح للصرف ${periodTo(d)}</span><b class="num ${d.avail<0?'amt-exp':''}">${d.avail<0?'−':''}${money(Math.abs(d.avail+d.spentToday))}</b></div>
   <div class="sumrow total"><span>÷ ${countWord(d.left,'يوم واحد','يومان','أيام','يومًا')} = مصروفك كل يوم</span><b class="num amt-inc">${amtH(d.daily)}</b></div>
   ${d.by==='cap'?'<div class="note">المبلغ محسوب من سقف المصاريف لأنه أقل مما يسمح به دخلك بعد الادخار.</div>':''}`}
function payFieldsHtml(){const pd=+S.settings.payday||0,rule=S.settings.payRule||'none';
  return `<div class="panel stack" id="payBox"><b>يوم نزول الراتب</b>
   <div class="field"><label for="payDay">يوم الشهر</label><select class="inp" id="payDay"><option value="0" ${!pd?'selected':''}>غير محدد (أحسب حتى نهاية الشهر)</option>${[...Array(31)].map((_,i)=>`<option value="${i+1}" ${pd===i+1?'selected':''}>يوم ${i+1}</option>`).join('')}</select></div>
   ${pd?`<div class="field"><label>إذا صادف جمعة أو سبت</label><div class="seg seg3">${[['none','في موعده'],['before','ينزل قبلها'],['after','ينزل بعدها']].map(([v,n])=>`<button class="n" data-prule="${v}" aria-pressed="${rule===v}">${n}</button>`).join('')}</div></div>
   <div class="note">الراتب القادم: <b>${DAYS[new Date(payCycle().next+'T12:00').getDay()]} ${fmtD(payCycle().next)}</b> (بعد ${countWord(payCycle().left,'يوم واحد','يومين','أيام','يومًا')}). تُحسب الخطة اليومية وخطط الادخار حسب الرواتب المتبقية.</div>`:'<div class="note">حدّده ليصبح مصروفك اليومي محسوبًا حتى نزول الراتب بالضبط، وليُحسب ادخار الخطط على عدد الرواتب المتبقية.</div>'}</div>`}
function openDayPlan(focusPay){const L=document.getElementById('layer');
  const draw=()=>{const d=dailyPlan();const a=inRange(d.from,d.to);const byDay={};a.filter(t=>t.type==='exp'&&!isFixedTx(t)).forEach(t=>byDay[t.date]=(byDay[t.date]||0)+(+t.amount));
   const days=[];const s0=new Date(d.from+'T12:00');for(let i=1;i<=d.dim;i++){const dt=new Date(s0);dt.setDate(s0.getDate()+i-1);const iso=isoD(dt);const act=byDay[iso]||0;
     const st=i<d.day?(act>d.daily*1.1?'over':'ok'):i===d.day?'today':'next';
     days.push(`<div class="dprow ${st}"><span class="dpd">${DAYS[dt.getDay()]} ${dt.getDate()}${dt.getDate()===1||i===1?' '+MONTHS[dt.getMonth()].slice(0,3):''}</span><span class="dpbar"><i style="width:${Math.min(100,(i<=d.day?act:d.daily)/Math.max(d.daily,0.001)*100)}%"></i></span><b class="num">${i<d.day?money(act):i===d.day?money(act)+' / '+money(d.daily):money(d.daily)}</b></div>`)}
   if(d.cyc)days.push(`<div class="dprow payrow"><span class="dpd">${DAYS[new Date(d.cyc.next+'T12:00').getDay()]} ${+d.cyc.next.slice(8)}</span><span>نزول الراتب</span><b>💰</b></div>`);
   L.innerHTML=`${sheetTop('خطة الصرف اليومية')}
    <h2 style="margin-top:0">خطة الصرف اليومية</h2>
    ${d.has?`<div class="dphero"><span>مصروفك كل يوم ${d.cyc?'حتى نزول الراتب '+fmtD(d.cyc.next):'حتى نهاية '+esc(MONTHS[d.now.getMonth()])}</span><b class="num">${money(d.daily)}</b><small>${CUR} · بالتساوي على ${countWord(d.left,'يوم واحد','يومين','أيام','يومًا')}${d.cyc?' متبقية قبل الراتب':''}</small></div>
    <div class="panel" style="margin-top:10px">${planBreakdownHtml(d)}</div>`:`<div class="note">سجّل دخلك أو حدّد سقفًا للمصاريف في «الخطة» لأحسب لك مصروفًا يوميًا ثابتًا.</div>`}
    <div style="margin-top:10px">${payFieldsHtml()}</div>
    ${d.has?`<h2>حسابك الجاري اليوم</h2><div class="panel">${bankHtml(d)}</div>
    <div class="field" style="margin-top:10px"><label>احتياطي للطوارئ من الدخل</label><div class="seg seg3">${[0,5,10].map(v=>`<button class="n" data-dbuf="${v}" aria-pressed="${d.bufPct===v}">${v?v+'%':'بدون'}</button>`).join('')}</div></div>
    ${d.avail+d.spentToday<0?`<div class="warnbox" style="margin-top:10px">التزاماتك وادخارك أكبر مما تبقّى بـ <b class="num">${amtH(-(d.avail+d.spentToday))}</b>. خفّف ادخار هذا الشهر أو أجّل خطة حتى لا ترهق نفسك.</div>`
      :d.avgDay&&d.daily<d.avgDay*0.8?`<div class="warnbox" style="margin-top:10px">معدل صرفك المعتاد <b class="num">${amtH(d.avgDay)}</b> يوميًا، والخطة تعطيك <b class="num">${amtH(d.daily)}</b>. ستحتاج تخفيفًا بسيطًا، أو قلّل الاحتياطي.</div>`
      :d.avgDay?`<div class="okbox" style="margin-top:10px">الخطة مريحة: معدل صرفك المعتاد <b class="num">${amtH(d.avgDay)}</b> يوميًا.</div>`:''}
    <h2>${d.cyc?'أيام الفترة حتى الراتب':'أيام الشهر'}</h2><div class="note" style="margin-bottom:6px">الأيام الماضية: ما صرفته فعلًا (بدون الالتزامات). الأيام القادمة: مصروفك المخطط. إذا وفّرت يومًا يزيد مصروف ما بعده تلقائيًا.</div>
    <div class="panel dplist">${days.join('')}</div>`:''}
    <div class="actions"><div class="row2"><button class="btn" data-ask="1">هل أقدر أشتري؟</button><button class="btn ghost" data-close>إغلاق</button></div></div></div></div>`};
  draw();if(focusPay)setTimeout(()=>{const p=document.getElementById('payBox');p&&p.scrollIntoView({block:'center'})},30);
  const keepScroll=fn=>{const s=L.querySelector('.sheet');const y=s?s.scrollTop:0;fn();const s2=L.querySelector('.sheet');if(s2)s2.scrollTop=y};
  L.oninput=null;
  L.onchange=async e=>{if(e.target.id==='payDay'){S.settings.payday=+e.target.value;await putSettings();keepScroll(draw);render();toast(+e.target.value?'تُحسب الخطة الآن حتى نزول الراتب':'تُحسب الخطة حتى نهاية الشهر')}};
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.prule){S.settings.payRule=x.dataset.prule;await putSettings();keepScroll(draw);render();return}
    if(x.dataset.dbuf!==undefined){S.settings.dayBuf=+x.dataset.dbuf;await putSettings();keepScroll(draw);render();return}
    if(x.id==='bkSave'){const acc=mainAcc();const v=document.getElementById('bkBal').value.trim(),cv=document.getElementById('bkCarry').value.trim();const key=bankPlan().key;
      acc.carry=Object.assign({},acc.carry,{[key]:cv===''?0:parseAmt(cv)});if(v!==''){acc.balance=parseAmt(v);acc.at=today()}S.settings.mainAcc=acc;await putSettings();keepScroll(draw);render();toast('حُفظ رصيد الحساب');return}
    if(x.dataset.ask){openAsk();return}}}

/* المستشار التفاعلي: أسئلة سريعة و«هل أقدر أشتري؟» من بياناتك داخل الجهاز */
function parseAsk(q){const s=String(q||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g,'.');
  const m=s.match(/(\d+(?:[.,]\d+)?)/);const amt=m?parseFloat(m[1].replace(',','.')):0;
  let item=s.replace(m?m[0]:'','').replace(/ريال|ر\.ع\.?|ر ع|بقيمة|بسعر|سعره|سعرها|بـ|\bب\b|أبي|ابي|أبغى|ابغى|أريد|اريد|أشتري|اشتري|شراء|هل|أقدر|اقدر|أستطيع|استطيع|[؟?!]/g,' ').replace(/\s+/g,' ').trim();
  return{amt,item}}
function affordReply(amt,item,when){const d=dailyPlan();const nm=item?'«'+esc(item)+'»':'هذا المبلغ';
  if(!d.has)return `<p>سجّل دخلك أو حدّد سقفًا للمصاريف أولًا حتى أحسب أثر ${nm} على باقي الفترة.</p>`;
  if(when==='next'){const nx=shiftMonth(d.cm,1);const [y,mm]=nx.split('-').map(Number);const dimN=new Date(y,mm,0).getDate();
    const fixed=monthItems(nx).reduce((s,i)=>s+i.amount,0);const inc=pastAvg(x=>sum(x,'inc'))||d.inc;const save=goalsSummary().plan;
    const daily=(inc-fixed-save-amt)/dimN,base=(inc-fixed-save)/dimN;const ok=daily>=Math.max(d.avgDay*0.9,base*0.75);
    return `<div class="verdict ${ok?'ok':daily>0?'mid':'bad'}">${ok?'مريحة الشهر القادم':daily>0?'ممكنة الشهر القادم مع بعض التخفيف':'كبيرة حتى على الشهر القادم'}</div>
     <p>إذا اشتريت ${nm} بـ <b class="num">${amtH(amt)}</b> أول ${esc(MONTHS[mm-1])}، يكون مصروفك اليومي فيه نحو <b class="num">${amtH(Math.max(0,daily))}</b> بدل <b class="num">${amtH(Math.max(0,base))}</b> (على أساس دخل <b class="num">${amtH(inc)}</b> والتزامات <b class="num">${amtH(fixed)}</b> وادخار <b class="num">${amtH(save)}</b>).</p>`}
  const nowPool=d.avail+d.spentToday,newPool=nowPool-amt,newDaily=newPool/d.left;const ref=d.avgDay||d.daily;const drop=d.daily?Math.round((1-Math.max(0,newDaily)/d.daily)*100):100;
  const lv=newPool<0?'bad':(newDaily>=ref*0.9&&amt<=nowPool*0.3)?'ok':newDaily>=ref*0.6?'mid':'bad';
  const title={ok:'مريحة، اشترها وأنت مطمئن',mid:'ممكنة، لكنها ستضغطك '+periodTo(d),bad:newPool<0?'لا أنصح بها الآن':'سترهقك '+periodTo(d)}[lv];
  let h=`<div class="verdict ${lv}">${title}</div><p>${newPool<0?`المتاح لك ${periodTo(d)} <b class="num">${amtH(Math.max(0,nowPool))}</b> فقط بعد الالتزامات والادخار، و${nm} يحتاج <b class="num">${amtH(amt)}</b>.`
    :`بعد ${nm} يصير مصروفك اليومي <b class="num">${amtH(newDaily)}</b> بدل <b class="num">${amtH(d.daily)}</b>${drop>0?' (أقل بـ <span dir="ltr">'+drop+'%</span>)':''} لمدة ${countWord(d.left,'يوم واحد','يومان','أيام','يومًا')}.${d.avgDay?' ومعدل صرفك المعتاد <b class="num">'+amtH(d.avgDay)+'</b> يوميًا.':''}`}</p>`;
  const tips=[];
  if(lv!=='ok'){
    const G=(S.settings.goals||[]).map(g=>({g,c:goalCalc(g)})).filter(x=>x.c.sv>=amt&&x.c.days>90&&!x.c.done).sort((a,b)=>b.c.days-a.c.days)[0];
    if(G){const extra=amt/Math.max(1,G.c.months-1);tips.push(`خذها من خطة «${esc(G.g.name)}» (مدّخر فيها <b class="num">${amtH(G.c.sv)}</b>)، وزِد ادخارها <b class="num">${amtH(extra)}</b> شهريًا لتلحق موعدها.`)}
    if(amt>=30){const n=3,part=amt/n,pd=(nowPool-part)/d.left;tips.push(`قسّمها على ${n} أشهر (<b class="num">${amtH(part)}</b> شهريًا)، فيصير مصروفك اليومي هذا الشهر <b class="num">${amtH(Math.max(0,pd))}</b>.`)}
    const months=Math.max(1,Math.ceil(amt/Math.max(1,(avgSurplus()||0)*0.3)));if(avgSurplus()>0)tips.push(`ادّخر لها: بـ <b class="num">${amtH(amt/months)}</b> شهريًا تكون جاهزة خلال ${monthsWord(months)}.`);
    const c=advCtx();if(c.prev.length){const avg={},now={};c.prev.forEach(x=>x.filter(t=>t.type==='exp'&&!isFixedTx(t)).forEach(t=>avg[t.cat]=(avg[t.cat]||0)+(+t.amount)/c.prev.length));
      const top=Object.entries(avg).filter(([k])=>!['home','bills','loan'].includes(k)).sort((a,b)=>b[1]-a[1])[0];if(top)tips.push(`أو خفّف «${esc(catOf(top[0]).n)}» (معدلك <b class="num">${amtH(top[1])}</b> شهريًا)؛ كل 10% توفر <b class="num">${amtH(top[1]*0.1)}</b>.`)}}
  if(tips.length)h+=`<ul class="tips">${tips.map(t=>`<li>${t}</li>`).join('')}</ul>`;
  h+=`<div class="chips"><button class="chip pay" data-askbuy="${amt}" data-item="${esc(item||'')}">اشتريتها، سجّلها</button>${lv!=='ok'?`<button class="chip" data-askgoal="${amt}" data-item="${esc(item||'')}">اجعلها خطة ادخار</button><button class="chip" data-askq="next:${amt}:${esc(item||'')}">ماذا لو الشهر القادم؟</button><button class="chip" data-askq="buy:${r3(amt/2)}:${esc(item||'')}">ماذا لو بنصف المبلغ؟</button>`:''}</div>`;
  return h}
function askAnswer(kind,arg){const d=dailyPlan();
  if(!d.has&&kind!=='help')return '<p>سجّل دخلك هذا الشهر أو حدّد سقفًا للمصاريف أولًا، وبعدها أجيبك بدقة.</p>';
  if(kind==='today')return `<p>مصروفك اليوم <b class="num">${amtH(d.daily)}</b>، صرفت منه <b class="num">${amtH(d.spentToday)}</b>، ${d.todayLeft>=0?'وباقٍ لك <b class="num amt-inc">'+amtH(d.todayLeft)+'</b>.':'وتجاوزته بـ <b class="num amt-exp">'+amtH(-d.todayLeft)+'</b>، فسيقل مصروف الأيام القادمة قليلًا.'}</p><p class="note">ما توفّره اليوم يُضاف تلقائيًا إلى الأيام القادمة.</p>`;
  if(kind==='month')return `<p>هذا حسابك ${periodTo(d)}:</p><div class="panel" style="padding:8px 12px">${planBreakdownHtml(d)}</div><div class="chips" style="margin-top:6px"><button class="chip pay" data-dayplan="1">افتح خطة الصرف اليومية</button></div>`;
  if(kind==='bank'){const b=bankPlan(d);return `<p>المفروض في ${esc(b.acc.name)} اليوم حسب الخطة <b class="num">${amtH(b.expected)}</b>، وحسب ما سجّلته <b class="num">${amtH(b.recorded)}</b>${b.actual!==null?'، ورصيدك الفعلي <b class="num">'+amtH(b.actual)+'</b>':''}.${b.tr?' وفي حسابك أمانات للآخرين <b class="num">'+amtH(b.tr)+'</b> ليست لك.':''}</p><div class="chips" style="margin-top:6px"><button class="chip pay" data-dayplan="1">التفاصيل والمقارنة</button></div>`}
  if(kind==='week'){const dow=d.now.getDay();const toSat=(6-dow+7)%7+1;const n=Math.min(toSat,d.left);return `<p>من اليوم حتى السبت (${countWord(n,'يوم واحد','يومان','أيام','يومًا')}) تستطيع صرف <b class="num">${amtH(d.daily*n-d.spentToday)}</b>، أي <b class="num">${amtH(d.daily)}</b> لكل يوم.</p>`}
  if(kind==='save'){const c=advCtx();if(!c.prev.length)return '<p>أحتاج شهرًا كاملًا على الأقل من بياناتك لأعرف أين يمكنك التوفير.</p>';
    const avg={},now={};c.prev.forEach(x=>x.filter(t=>t.type==='exp'&&!isFixedTx(t)).forEach(t=>avg[t.cat]=(avg[t.cat]||0)+(+t.amount)/c.prev.length));c.a.filter(t=>t.type==='exp'&&!isFixedTx(t)).forEach(t=>now[t.cat]=(now[t.cat]||0)+(+t.amount));
    const L=Object.entries(avg).filter(([k])=>!['home','bills','loan'].includes(k)).sort((a,b)=>b[1]-a[1]).slice(0,3);if(!L.length)return '<p>مصاريفك المتغيرة قليلة أصلًا. أحسنت.</p>';
    const tot=L.reduce((s,[,v])=>s+v*0.15,0);
    return `<p>أكثر ما يمكنك التوفير منه (معدل آخر الأشهر):</p><ul class="tips">${L.map(([k,v])=>`<li>«${esc(catOf(k).n)}»: <b class="num">${amtH(v)}</b> شهريًا${now[k]?' (هذا الشهر حتى الآن <b class="num">'+amtH(now[k])+'</b>)':''}. تخفيضه 15% يوفر <b class="num">${amtH(v*0.15)}</b>.</li>`).join('')}</ul><p>لو خفّفتها كلها 15% توفر <b class="num">${amtH(tot)}</b> شهريًا، أي <b class="num">${amtH(tot*12)}</b> في السنة.</p>`}
  if(kind==='debtx'){const Ds=debts().filter(x=>+x.balance>0.0005);if(!Ds.length)return '<p>لا ديون متبقية مسجّلة. مبروك!</p>';const P=debtPlan(),E=arg.amt||20;
    const b=simDebts(Ds,P.extra,P.strategy,true),p=simDebts(Ds,(+P.extra||0)+E,P.strategy,true);if(b.stuck||p.stuck)return '<p>أحد الديون قسطه لا يغطي فائدته، فلا ينتهي بهذه الأرقام. راجع أقساطك من «إدارة البيانات».</p>';
    return `<p>لو دفعت <b class="num">${amtH(E)}</b> إضافية شهريًا فوق أقساطك (${P.strategy==='snowball'?'للأصغر أولًا':'للأعلى فائدة أولًا'}):</p><ul class="tips"><li>تنتهي ديونك في <b>${monthLabel(p.months)}</b> بدل ${monthLabel(b.months)}${b.months-p.months>0?' (أبكر بـ'+monthsWord(b.months-p.months)+')':''}.</li>${b.interest-p.interest>0.5?`<li>توفّر فوائد تقارب <b class="num">${amtH(b.interest-p.interest)}</b>.</li>`:''}<li>ويقل مصروفك اليومي بنحو <b class="num">${amtH(E/30.4)}</b>.</li></ul><p class="note">حساب مبني على الأرصدة والفوائد المسجّلة، وليس وعدًا بتاريخ نهائي.</p><div class="chips"><button class="chip" data-askq="debtx:${E*2}">ماذا لو ${money(E*2)}؟</button></div>`}
  if(kind==='newinst'){const A=arg.amt;const inc=d.inc;if(!inc)return '<p>سجّل دخلك أولًا لأقدّر أثر القسط الجديد.</p>';const cur=debts().filter(x=>+x.balance>0.0005).reduce((s,x)=>s+debtInst(x),0);
    const r0=Math.round(cur/inc*100),r1=Math.round((cur+A)/inc*100);const sur=avgSurplus();const lv=r1<=30&&(sur===null||sur-A>0)?'ok':r1<=40&&(sur===null||sur-A>-0.0005)?'mid':'bad';
    return `<div class="verdict ${lv}">${lv==='ok'?'يبدو محتملًا':lv==='mid'?'ممكن لكنه سيضغطك':'لا أنصح به الآن'}</div><p>أقساطك الحالية <b class="num">${amtH(cur)}</b> (<span dir="ltr">${r0}%</span> من دخلك). مع قسط <b class="num">${amtH(A)}</b> تصير <span dir="ltr">${r1}%</span>، والأفضل أن تبقى أقل من 40%.${sur!==null?' ومتوسط ما يتبقى لك شهريًا <b class="num">'+amtH(sur)+'</b>، فيصير بعده <b class="num">'+(sur-A<0?'−':'')+amtH(Math.abs(sur-A))+'</b>.':''}</p><p class="note">تقدير من بياناتك المسجّلة فقط، ولا يشمل شروط التمويل ورسومه.</p>`}
  if(kind==='buy')return affordReply(arg.amt,arg.item,'now');
  if(kind==='next')return affordReply(arg.amt,arg.item,'next');
  return '<p>اكتب المبلغ وما تريد شراءه، مثل: «جوال 250» أو «هل أقدر أشتري ساعة بـ 80؟»، أو اختر سؤالًا من الأزرار.</p>'}
function openAsk(){const L=document.getElementById('layer');const msgs=[];
  const say=(who,html)=>{msgs.push({who,html});paint()};
  const paint=()=>{const box=document.getElementById('askLog');if(!box)return;box.innerHTML=msgs.map(m=>`<div class="bub ${m.who}">${m.html}</div>`).join('');box.scrollTop=box.scrollHeight;
    const s=L.querySelector('.sheet');if(s)s.scrollTop=s.scrollHeight};
  const ask=(q,kind,arg)=>{say('me',esc(q));setTimeout(()=>say('bot',askAnswer(kind,arg)),120)};
  const free=q=>{const p=parseAsk(q);const t=q.replace(/[أإآ]/g,'ا');if(p.amt>0&&/قسط/.test(t))return ask(q,'newinst',p);if(p.amt>0&&/دين|ديون|اضافي/.test(t))return ask(q,'debtx',p);if(p.amt>0)return ask(q,'buy',p);
    if(/اليوم/.test(t))return ask(q,'today');if(/اسبوع|الويكند|العطله|العطلة|نهايه|نهاية/.test(t))return ask(q,'week');if(/اوفر|توفير|وفر/.test(t))return ask(q,'save');if(/حساب|البنك|رصيد/.test(t))return ask(q,'bank');if(/الشهر|باقي|متبقي|كم/.test(t))return ask(q,'month');return ask(q,'help')};
  const d=dailyPlan();
  L.innerHTML=`${sheetTop('اسأل المستشار')}
   <div class="backrow" style="margin:0 0 8px"><h2 style="margin:0">اسأل المستشار</h2><span class="note">من بياناتك داخل هاتفك</span></div>
   <div class="asklog" id="askLog"></div>
   <div class="chips askq"><button class="chip" data-askq="today">كم أقدر أصرف اليوم؟</button><button class="chip" data-askq="week">حتى نهاية الأسبوع؟</button><button class="chip" data-askq="month">كم باقي لي هذا الشهر؟</button><button class="chip" data-askq="save">وين أقدر أوفّر؟</button><button class="chip" data-askq="bank">كم المفروض في حسابي؟</button><button class="chip" data-askq="debtx:20">ماذا لو دفعت 20 إضافية للدين؟</button><button class="chip" data-askq="short">ماذا لو لم يكفِ المال؟</button></div>
   <div class="askin"><input class="inp" id="askTx" placeholder="مثال: جوال 250 أو هل أقدر أشتري ساعة بـ 80؟" autocomplete="off"><button class="btn" id="askGo" aria-label="إرسال">اسأل</button></div>
   <div class="actions"><button class="btn ghost block" data-close>إغلاق</button></div></div></div>`;
  say('bot',`${advGreet()}! ${d.has?`مصروفك اليوم <b class="num">${amtH(d.daily)}</b> وباقٍ منه <b class="num">${amtH(Math.max(0,d.todayLeft))}</b>. `:''}اكتب ما تريد شراءه ومبلغه، وأقول لك هل يرهقك حتى نهاية الشهر وما البدائل.`);
  const sendTx=()=>{const i=document.getElementById('askTx');const q=i.value.trim();if(!q)return;i.value='';free(q)};
  L.oninput=L.onchange=null;
  L.onkeydown=e=>{if(e.target.id==='askTx'&&e.key==='Enter'){e.preventDefault();sendTx()}};
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';L.onkeydown=null;return}
    if(x.id==='askGo'){sendTx();return}
    if(x.dataset.askq){const [k,a,it]=x.dataset.askq.split(':');const lab={today:'كم أقدر أصرف اليوم؟',week:'كم أقدر أصرف حتى نهاية الأسبوع؟',month:'كم باقي لي هذا الشهر؟',save:'وين أقدر أوفّر؟',bank:'كم المفروض في حسابي اليوم؟'};
      if(k==='short'){L.innerHTML='';L.onkeydown=null;openShortfall();return}if(k==='debtx')return ask('ماذا لو دفعت '+money(+a)+' إضافية للدين؟','debtx',{amt:+a});
      if(k==='next')return ask('ماذا لو اشتريتها الشهر القادم؟','next',{amt:+a,item:it});if(k==='buy')return ask('ماذا لو كانت '+money(+a)+'؟','buy',{amt:+a,item:it});return ask(lab[k],k)}
    if(x.dataset.askbuy){L.innerHTML='';L.onkeydown=null;openSheet(null,{type:'exp',amount:r3(+x.dataset.askbuy),note:x.dataset.item||''});return}
    if(x.dataset.askgoal){L.innerHTML='';L.onkeydown=null;openPlanWizard(null,'device',{name:x.dataset.item||'',target:money(+x.dataset.askgoal)});return}
    if(x.dataset.dayplan){openDayPlan();return}}}

/* ---------- 7. لوحات الرئيسية ومكوّنات التقارير المشتركة ---------- */
function plansHomeHtml(){const all=(S.settings.goals||[]).map(g=>({g,c:goalCalc(g)})).sort((a,b)=>a.g.due.localeCompare(b.g.due));
  if(!all.length)return `<h2>خططي</h2><div class="panel hplan-empty"><span>خطط لرمضان والعيدين والتأمين وشراء سيارة، وأحسب لك كم تدّخر كل شهر.</span><button class="chip pay" data-plannew="1">+ خطة جديدة</button></div>`;
  const W=all.filter(x=>x.c.tgt>0);const T=W.reduce((s,x)=>s+x.c.tgt,0),V=W.reduce((s,x)=>s+Math.min(x.c.sv,x.c.tgt),0),R=W.reduce((s,x)=>s+x.c.rem,0);const pct=T?Math.round(V/T*100):0;
  const gs=goalsSummary();const done=W.filter(x=>x.c.done).length;
  const rows=all.map(({g,c})=>{const col=PLAN_T[g.kind]?PLAN_T[g.kind].c:(GOAL_ICON[g.kind]||['', 'var(--accent)'])[1];
    const when=c.done?'اكتملت':c.past?'حان موعدها':c.days===0?'اليوم':'بعد '+daysWord(c.days);
    const right=!c.tgt?'<b class="hp-amt" style="font-size:13px">حدّد المبلغ</b>':c.done?'<b class="hp-amt amt-inc">اكتمل ✓</b>':`<b class="hp-amt num">${money(c.rem)}</b><small>${c.past?'متبقٍ':'متبقٍ · '+money(c.monthly)+(c.byPay?' كل راتب':' شهريًا')}</small>`;
    return `<button class="hprow${c.past&&!c.done?' late':''}" data-goplan="${esc(g.id)}">${goalBadge(g)}<span class="hp-main"><b>${esc(g.name)}</b><small>${c.done||c.past?when:'⏳ '+countWord(c.days,'يوم واحد','يومان','أيام','يومًا')+(c.byPay?' · '+countWord(c.months,'راتب واحد','راتبان','رواتب','راتبًا'):'')}${c.tgt?' · أنجزت <span class="num">'+amtH(c.sv)+'</span> (<span dir="ltr">'+Math.round(c.pct)+'%</span>)':''}</small>${c.tgt?`<span class="meter"><i style="width:${c.pct}%;background:${c.done?'var(--inc)':col}"></i></span>`:''}</span><span class="hp-side">${right}</span></button>`}).join('');
  return `<div class="backrow"><h2 style="margin:0">خططي</h2><div style="display:flex;gap:6px"><button class="chip" data-plannew="1">+ خطة</button><button class="chip pay" data-tab="budget">إدارة الخطط</button></div></div>
  <div class="panel hplans">${T?`<div class="hp-sum"><div class="hp-ring" style="--p:${pct}"><span class="num">${pct}%</span></div><div class="hp-cells">
   <div><span>المتبقي لتحقيقها</span><b class="num">${amtH(R)}</b></div><div><span>ادّخرت</span><b class="num">${amtH(V)}</b></div>
   <div><span>المطلوب كاملًا</span><b class="num">${amtH(T)}</b></div><div><span>${gs.total>0.0005?'ادّخر هذا الشهر':'هذا الشهر'}</span><b class="num ${gs.total>0.0005?'':'amt-inc'}">${gs.total>0.0005?money(gs.total):'مكتمل ✓'}</b></div></div></div>
   <div class="note hp-meta">${countWord(all.length,'خطة واحدة','خطتان','خطط','خطة')}${done?' · اكتمل منها '+done:''} · اضغط على أي خطة لفتحها</div>`:''}
   <div class="hp-list">${rows}</div></div>`}
function trendChart(m,H){const months=[];for(let k=5;k>=0;k--)months.push(shiftMonth(m,-k));
  const data=months.map(x=>{const a=inMonth(x);return{m:x,inc:sum(a,'inc'),exp:sum(a,'exp')}});
  const maxV=Math.max(1,...data.map(d=>Math.max(d.inc,d.exp)));const step=niceStep(maxV/4),top=Math.ceil(maxV/step)*step;
  H=H||190;const W=340,L=44,R=8,T=10,Bm=26,ch=H-T-Bm,cw=(W-L-R)/6;
  let svg=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="الدخل والمصاريف لآخر ستة أشهر" style="direction:ltr;display:block">`;
  for(let v=0;v<=top+1e-9;v+=step){const y=T+ch-v/top*ch;svg+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1"/><text x="${L-6}" y="${y+4}" text-anchor="end" font-size="10" fill="var(--muted)" font-family="-apple-system,sans-serif">${fmtK(v)}</text>`}
  data.forEach((d,i)=>{const x0=L+i*cw+cw*0.18,bw=cw*0.3;const hi=d.inc/top*ch,he=d.exp/top*ch;
    svg+=`<rect x="${x0}" y="${T+ch-hi}" width="${bw}" height="${hi}" rx="3" fill="var(--inc)"/><rect x="${x0+bw+2}" y="${T+ch-he}" width="${bw}" height="${he}" rx="3" fill="var(--exp)"/>`;
    svg+=`<text x="${L+i*cw+cw/2}" y="${H-8}" text-anchor="middle" font-size="10.5" fill="${d.m===m?'var(--fg)':'var(--muted)'}" font-family="-apple-system,sans-serif" font-weight="${d.m===m?700:400}">${MONTHS[+d.m.slice(5)-1]}</text>`});
  return svg+`</svg><div class="legend"><span><i style="background:var(--inc)"></i>الدخل</span><span><i style="background:var(--exp)"></i>المصاريف</span></div>`}
function monthStatsHtml(m){const a=inMonth(m),b=inMonth(shiftMonth(m,-1));const inc=sum(a,'inc'),exp=sum(a,'exp'),pexp=sum(b,'exp');
  const ch=pexp?Math.round((exp-pexp)/pexp*100):null;const rate=inc?Math.round((inc-exp)/inc*100):null;
  const byCat={};a.filter(t=>t.type==='exp').forEach(t=>byCat[t.cat]=(byCat[t.cat]||0)+(+t.amount));const top=Object.entries(byCat).sort((x,y)=>y[1]-x[1])[0];
  const y=m.slice(0,4);let yi=0,ye=0;for(let k=1;k<=+m.slice(5);k++){const q=inMonth(y+'-'+String(k).padStart(2,'0'));yi+=sum(q,'inc');ye+=sum(q,'exp')}
  const cell=(l,v,sub,cls)=>`<div class="hstat"><span>${l}</span><b class="num ${cls||''}">${v}</b>${sub?`<small>${sub}</small>`:''}</div>`;
  return `<div class="hstats">
   ${cell('مقارنة بالشهر الماضي',ch===null?'—':`<span dir="ltr">${ch>0?'+':''}${ch}%</span>`,pexp?'الماضي '+money(pexp)+' · الحالي '+money(exp):'لا بيانات للشهر الماضي',ch>0?'amt-exp':ch<0?'amt-inc':'')}
   ${cell('نسبة ما وفّرته',rate===null?'—':`<span dir="ltr">${rate}%</span>`,inc?'من دخل الشهر':'سجّل دخلك لتظهر النسبة',rate!==null&&rate<0?'amt-exp':rate>0?'amt-inc':'')}
   ${cell('أكثر ما صرفت عليه',top?esc(catOf(top[0]).n):'—',top?money(top[1])+' · '+Math.round(top[1]/exp*100)+'%':'')}
   ${cell('منذ بداية '+y,(yi-ye<0?'−':'')+money(Math.abs(yi-ye)),'دخل '+money(yi)+' · صرف '+money(ye),yi-ye<0?'amt-exp':'amt-inc')}
  </div>`}
function catBreakdownHtml(m){const a=inMonth(m),exp=sum(a,'exp');const byCat={};a.filter(t=>t.type==='exp').forEach(t=>byCat[t.cat]=(byCat[t.cat]||0)+(+t.amount));
  const cats=Object.entries(byCat).sort((x,y)=>y[1]-x[1]);if(!cats.length)return '';const max=cats[0][1];
  return `<h2>أين ذهبت أموالك</h2><div class="panel">${cats.map(([id,v])=>{const c=catOf(id);return `<div class="catrow">${cbadge(c.id)}<div class="name">${esc(c.n)} <small class="num">${exp?Math.round(v/exp*100):0}%</small><div class="meter"><i style="width:${v/max*100}%;background:${c.c}"></i></div></div><span class="num">${amtH(v)}</span></div>`}).join('')}</div>`}
function repHomeHtml(){if(!list().length)return '';
  return `<div class="backrow"><h2 style="margin:0">ملخص التقارير</h2><button class="chip pay" data-tab="reports">كل التقارير</button></div>
  <div class="panel hrep">${monthStatsHtml(S.month)}<div class="hchart">${trendChart(S.month,150)}</div>
  <div class="hrep-btns"><button class="chip" data-gorep="month">التقرير الشهري</button><button class="chip" data-gorep="year">التقرير السنوي</button><button class="chip" data-gorep="print">طباعة / PDF</button></div></div>`}
/* ---------- 8. الشاشات: الرئيسية، السجل، الميزانية، التقارير ---------- */
function txRow(t){const c=catOf(t.cat);const cls=t.type==='inc'?'amt-inc':'amt-exp';
  return `<button class="tx" data-edit="${esc(t.id)}">${txIco(t,c)}
  <span class="t"><b>${esc(t.note||c.n)}</b><small>${esc(c.n)} · ${esc((METHODS.find(m=>m[0]===t.method)||['',''])[1])}${t.person?' · لـ'+esc(personName(t.person)):''}${t.sample?' · مثال':''}${t.pend?' · <span class="pendtag">⏳ بانتظار الاعتماد</span>':''}${Vault.docs.some(d=>d.tx===t.id)?' · 📎':''}${t.acc&&t.acc!=='main'&&t.acc!=='cash'?' · '+esc(accName(t.acc)):''}</small></span>
  <span class="num ${cls}">${t.type==='inc'?'+':'−'}${amtH(t.amount)}</span></button>`}

function vHome(){
  const m=S.month,pc=m===ym(new Date())?payCycle():null,a=pc?inRange(pc.start,pc.end):inMonth(m),inc=sum(a,'inc'),exp=sum(a,'exp'),left=inc-exp;
  const lastInc=!pc&&!inc?list().filter(t=>t.type==='inc'&&t.date<m+'-01'&&t.date>=shiftMonth(m,-1)+'-15').sort((x,y)=>y.date.localeCompare(x.date))[0]:null;
  const recent=a.slice().sort((x,y)=>(y.date+y.createdAt).localeCompare(x.date+x.createdAt)).slice(0,5);
  const empty=!list().length?`<div class="panel empty"><b>ابدأ بتسجيل أول عملية</b>اضغط زر + في الأسفل وسجّل راتبك أو أول مصروف. يمكنك أيضًا تجربة التطبيق ببيانات مثال ثم حذفها.<div style="margin-top:14px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn" data-open-add>إضافة عملية</button><button class="btn ghost" id="loadSample">تجربة ببيانات مثال</button></div></div>`:'';
  return `${duaTickerHtml()}${spiritHtml('top')}${rzHtml('top')}<section class="hero"><div class="lbl">${pc?'المتبقي من راتب هذه الدورة':'المتبقي في '+esc(MONTHS[+m.slice(5)-1])}</div>
   <div class="big"><span class="num">${left<0?'−':''}${money(Math.abs(left))}</span> <small>${CUR}</small></div>
   <div class="row"><div class="cell"><span><span class="ar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M17 7 7 17M7 9v8h8"/></svg></span>الدخل</span><b class="num">${amtH(inc)}</b></div><div class="cell"><span><span class="ar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span>المصاريف</span><b class="num">${amtH(exp)}</b></div></div>${pc?`<div class="lbl" style="margin-top:10px;font-size:12.5px">دورة الراتب: ${fmtD(pc.start)} – ${fmtD(pc.end)}</div>`:''}</section>
   ${salaryDueHtml()}${backupNudgeHtml()}${lastInc?`<div class="infobox"><span>💡 آخر دخل «${esc(lastInc.note||catOf(lastInc.cat).n)}» <b class="num">${amtH(lastInc.amount)}</b> مسجّل بتاريخ ${fmtD(lastInc.date)}، فيُحسب في شهر ${esc(MONTHS[+lastInc.date.slice(5,7)-1])}. حدّد يوم نزول الراتب ليُحسب دخلك ومصاريفك من يوم نزوله.</span><button class="chip pay" data-dayplan="pay">حدّد يوم الراتب</button></div>`:''}${todayHtml()}${finStatusHtml()}
   ${pendHtml()||billAlertsHtml()||trustAlertsHtml()||carAlertsHtml()||docAlertsHtml()?'<div style="margin-top:14px">'+pendHtml()+billAlertsHtml()+trustAlertsHtml()+carAlertsHtml()+docAlertsHtml()+'</div>':''}${spiritHtml('mid')}${rzHtml('mid')}${widgetNudgeHtml()}${empty}${advHomeHtml()}${plansHomeHtml()}${repHomeHtml()}
   ${recent.length?`<h2>آخر العمليات</h2><div class="panel" style="padding:6px 10px">${recent.map(txRow).join('')}</div><div style="margin-top:8px"><button class="chip" data-tab="log">عرض كل العمليات</button></div>`:''}${debtsBrowseHtml()}${spiritHtml('bottom')}${rzHtml('bottom')}`;
}

function vLog(){
  let a=inMonth(S.month);
  if(S.ftype!=='all')a=a.filter(t=>t.type===S.ftype);
  if(S.q){const q=S.q.trim();a=a.filter(t=>(t.note||'').includes(q)||catOf(t.cat).n.includes(q)||String(t.amount).includes(q)||(t.person&&personName(t.person).includes(q)))}
  a.sort((x,y)=>(y.date+(y.createdAt||'')).localeCompare(x.date+(x.createdAt||'')));
  const groups={};a.forEach(t=>(groups[t.date]=groups[t.date]||[]).push(t));
  const body=a.length?Object.entries(groups).map(([d,arr])=>{const dt=new Date(d+'T12:00');const tot=sum(arr,'exp');
    return `<div class="daygroup"><div class="dayhead"><span>${DAYS[dt.getDay()]} ${dt.getDate()} ${MONTHS[dt.getMonth()]}</span><span>${tot?'صرف <span class="num">'+amtH(tot)+'</span>':''}</span></div><div class="panel" style="padding:6px 10px">${arr.map(txRow).join('')}</div></div>`}).join('')
   :`<div class="panel empty"><b>لا توجد عمليات</b>${S.q||S.ftype!=='all'?'جرّب تغيير البحث أو الفلتر.':'لم تسجّل شيئًا في هذا الشهر بعد.'}</div>`;
  return `<input class="search" id="q" type="search" placeholder="ابحث بالملاحظة أو الفئة أو المبلغ" value="${esc(S.q)}">
  <div class="chips">${[['all','الكل'],['exp','المصاريف'],['inc','الدخل']].map(([k,n])=>`<button class="chip" data-ftype="${k}" aria-pressed="${S.ftype===k}">${n}</button>`).join('')}</div>${body}`;
}

/* سقف المصاريف الشهري: خانة واحدة بجانبها زر «حفظ»، والحالة الحالية، واقتراحات بضغطة */
function capHtml(){const B=+S.settings.monthlyBudget||0,cm=ym(new Date()),exp=sum(inMonth(cm),'exp');
  const prev=[1,2,3].map(k=>sum(inMonth(shiftMonth(cm,-k)),'exp')).filter(v=>v>0);const last=prev.length?prev[0]:0,avg=prev.length?r3(prev.reduce((a,b)=>a+b,0)/prev.length):0;
  const dp=B?dailyPlan():null;const left=r3(B-exp);
  return `<div class="panel stack capbox">
   <div class="capnow ${B?(left<0?'over':'ok'):'none'}">${B?`<div><span>السقف الحالي</span><b class="num">${amtH(B)}</b></div><div><span>صرفت هذا الشهر</span><b class="num">${amtH(exp)}</b></div><div><span>${left<0?'تجاوزت بـ':'يتبقى'}</span><b class="num">${amtH(Math.abs(left))}</b></div>${dp&&dp.daily>0&&left>0?`<div><span>يوميًا</span><b class="num">${amtH(dp.daily)}</b></div>`:''}`:'<span>لم تحدّد سقفًا بعد. اكتب المبلغ ثم اضغط «حفظ».</span>'}</div>
   <label for="mb" class="note" style="margin:0">${B?'تحديث السقف (بالريال العُماني)':'السقف الشهري (بالريال العُماني)'}</label>
   <div class="capin"><input class="inp num" id="mb" inputmode="decimal" placeholder="مثال: 450.000" value="${B?amtIn(B):''}" style="text-align:left" enterkeyhint="done"><button class="btn" id="mbSave">حفظ</button></div>
   ${last||avg?`<div class="chips"><span class="note">اقتراح:</span>${prev.length>1?`<button class="chip" data-mbset="${avg}">متوسط آخر ${countWord(prev.length,'شهر','شهرين','أشهر','شهرًا')} ${money(avg)}</button>`:''}${last&&(prev.length<2||last!==avg)?`<button class="chip" data-mbset="${last}">الشهر الماضي ${money(last)}</button>`:''}</div>`:''}
   ${B?'<button class="chip" id="mbClear" style="align-self:flex-start">إلغاء السقف</button>':''}
   <span class="note" style="margin:0">يُستخدم في الرئيسية لحساب المتبقي والمبلغ اليومي المتاح، ويُحفظ أيضًا بالضغط على «تم» في لوحة المفاتيح.</span></div>`}
function capSave(v){const n=v===''||v==null?0:parseAmt(String(v));if(n===null||isNaN(n)||n<0){toast('اكتب مبلغًا صحيحًا، مثل 450');return false}
  S.settings.monthlyBudget=r3(n);if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();putSettings();render();
  toast(n?'حُفظ السقف '+rial(n)+(dailyPlan().daily>0?' · يوميًا '+rial(dailyPlan().daily):''):'أُلغي سقف المصاريف');return true}
function vBudget(){
  const a=inMonth(S.month);const spent={};a.filter(t=>t.type==='exp').forEach(t=>spent[t.cat]=(spent[t.cat]||0)+(+t.amount));
  const b=S.settings.budgets||{};
  return vMaster()+`<h2>🎯 الخطط والميزانية</h2>`+goalsHtml()+`<h2>سقف المصاريف الشهري</h2>
  ${capHtml()}
  <h2>حدود الفئات (اختياري)</h2>
  <div class="panel">${EXP_CATS.map(c=>{const lim=+b[c.id]||0,s=spent[c.id]||0;const pct=lim?Math.min(100,s/lim*100):0;const cls=lim&&s>lim?'over':pct>80?'near':'';
   return `<div class="brow"><div style="min-width:0"><div style="display:flex;align-items:center;gap:8px">${cbadge(c.id)}${esc(c.n)}</div>
   <div class="note">صرفت <span class="num">${amtH(s)}</span>${lim?' من <span class="num">'+amtH(lim)+'</span>':''}</div>${lim?`<div class="meter" style="height:5px;margin-top:4px"><i class="${cls}" style="width:${pct}%"></i></div>`:''}</div>
   <input class="inp num" data-bcat="${c.id}" inputmode="decimal" placeholder="—" value="${lim?amtIn(lim):''}" aria-label="حد ${esc(c.n)}"></div>`}).join('')}
   <button class="btn block" id="saveBudget" style="margin-top:12px">حفظ حدود الفئات</button><p class="note" style="margin:6px 0 0;text-align:center">يُحفظ أيضًا تلقائيًا عند الخروج من الخانة.</p></div>`;
}

function vReports(){const seg=`<button class="btn ghost block refreshbtn" id="refreshAll" style="margin-bottom:10px">🔄 تحديث البيانات والتقارير</button><div class="row2" style="margin-bottom:12px"><button class="btn" id="printRep">طباعة التقرير وخياراته</button><button class="btn ghost" id="quickPrint">طباعة سريعة</button></div><div class="seg" style="margin-bottom:4px"><button class="n" data-rmode="month" aria-pressed="${S.rmode!=='year'}">تقرير شهري</button><button class="n" data-rmode="year" aria-pressed="${S.rmode==='year'}">تقرير سنوي</button></div>`;
  const mm=vReportsMonth();const i=mm.indexOf('<h2>بياناتك</h2>');
  return seg+(S.rmode==='year'?vYear():mm.slice(0,i)+reportsMonthExtras())+mm.slice(i)+versionHtml()}
function vReportsMonth(){
  return `${S.month===ym(new Date())?forecastHtml():''}<h2 style="margin-top:4px">آخر ستة أشهر</h2><div class="panel">${trendChart(S.month)}</div>
  <h2>ملخص ${esc(monthName(S.month))}</h2>${monthStatsHtml(S.month)}${catBreakdownHtml(S.month)}${yearCmpHtml(S.month)}${catTrendHtml(S.month)}
  <h2>بياناتك</h2>
  <div class="panel stack">
   <div class="storbox" id="storBox"><div class="sumrow"><span>المساحة المستخدمة على جهازك</span><b class="note">جارٍ الحساب…</b></div></div>
   <button class="btn block" id="dbOpen">🗄️ قاعدة البيانات: الحفظ والفحص والاستعادة</button>
   <button class="btn ghost block" id="expOpen">تصدير Excel / Numbers / PDF</button>
   <button class="btn ghost block" id="csvBtn" data-x="1">${S.rmode==='year'?'تنزيل عمليات السنة كملف Excel (CSV)':'تنزيل عمليات الشهر كملف Excel (CSV)'}</button>
   <button class="btn ghost block" data-wopen="1">ويدجت الآيفون والماك</button>
   <button class="btn ghost block" id="fileBackup">حفظ نسخة احتياطية كملف</button>
   <label class="btn ghost block" for="restoreFile" style="text-align:center;cursor:pointer">استعادة من ملف نسخة احتياطية</label>
   <input type="file" id="restoreFile" accept=".json,application/json" hidden>
   <button class="btn ghost block" id="copyBackup">نسخ النسخة الاحتياطية كنص</button>
   <details><summary class="note" style="cursor:pointer">استعادة من نص منسوخ</summary>
     <div class="stack" style="margin-top:10px"><textarea class="inp" id="restoreTxt" placeholder="الصق النسخة الاحتياطية هنا"></textarea><button class="btn ghost" id="restoreBtn">استعادة</button></div></details>
   ${list().some(t=>t.sample)?'<button class="btn ghost block" id="clearSample">حذف بيانات المثال</button>':''}
   <button class="btn ghost block" data-tab="settings">⚙️ الضبط: قفل التطبيق وبصمة الوجه ووضع المدير</button>
   <button class="btn ghost block" id="scGuide">⚡ تسجيل رسائل البنك تلقائيًا (اختصارات الآيفون)</button>
   <div id="wipeArea"><button class="btn ghost block" id="wipeAsk" style="color:var(--exp)">حذف كل البيانات</button></div>
   <p class="note" style="margin:0">${Sync.linked()?'بياناتك محفوظة في جهازك، وتُنسخ إلى مجلد خفي خاص بالتطبيق في Google Drive الخاص بك فقط. لا يتصل التطبيق بأي جهة غير Google Drive الخاص بك.':'التطبيق لا يتصل بالإنترنت ولا يرسل بياناتك لأي جهة، وكل شيء محفوظ داخل هاتفك فقط. لذلك احفظ نسخة احتياطية كملف بين حين وآخر، لأن حذف التطبيق من الهاتف يحذف بياناته.'}</p>
  </div>`;
}
function niceStep(x){const p=Math.pow(10,Math.floor(Math.log10(x)));const f=x/p;return (f<=1?1:f<=2?2:f<=5?5:10)*p}
function fmtK(v){return v>=1000?(v/1000).toLocaleString('en-US',{maximumFractionDigits:1})+'k':String(Math.round(v))}

/* ---------- 9. التقرير السنوي ---------- */
function vYear(){
  const y=S.month.slice(0,4);const ms=[...Array(12)].map((_,i)=>y+'-'+String(i+1).padStart(2,'0'));
  const data=ms.map(m=>{const a=inMonth(m);return{m,inc:sum(a,'inc'),exp:sum(a,'exp'),n:a.length}});
  const ya=list().filter(t=>t.date&&t.date.slice(0,4)===y);
  const inc=sum(ya,'inc'),exp=sum(ya,'exp'),active=data.filter(d=>d.n).length;
  const maxV=Math.max(1,...data.map(d=>Math.max(d.inc,d.exp)));const step=niceStep(maxV/4),top=Math.ceil(maxV/step)*step;
  const W=340,H=180,L=40,R=6,T=10,Bm=22,ch=H-T-Bm,cw=(W-L-R)/12;
  let svg=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="الدخل والمصاريف لكل شهر في ${y}" style="direction:ltr;font-family:var(--f-body)">`;
  for(let v=0;v<=top+1e-9;v+=step){const yy=T+ch-v/top*ch;svg+=`<line x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}" stroke="var(--line)" stroke-width="1"/><text x="${L-5}" y="${yy+4}" text-anchor="end" font-size="9.5" fill="var(--muted)">${fmtK(v)}</text>`}
  data.forEach((d,i)=>{const bw=cw*0.34,x0=L+i*cw+cw*0.14;const hi=d.inc/top*ch,he=d.exp/top*ch;
    svg+=`<rect x="${x0}" y="${T+ch-hi}" width="${bw}" height="${hi}" rx="2" fill="var(--inc)"/><rect x="${x0+bw+1}" y="${T+ch-he}" width="${bw}" height="${he}" rx="2" fill="var(--exp)"/>`;
    svg+=`<text x="${L+i*cw+cw/2}" y="${H-6}" text-anchor="middle" font-size="10" fill="${d.m===S.month?'var(--fg)':'var(--muted)'}" font-weight="${d.m===S.month?700:400}">${i+1}</text>`});
  svg+='</svg>';
  const byCat={};ya.filter(t=>t.type==='exp').forEach(t=>byCat[t.cat]=(byCat[t.cat]||0)+(+t.amount));
  const cats=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  const maxM=data.filter(d=>d.exp).sort((a,b)=>b.exp-a.exp)[0];
  const recYear={};ya.filter(t=>t.rec).forEach(t=>{const r=recs().find(x=>x.id===t.rec);const n=r?r.name:(t.note||'التزام');recYear[n]=(recYear[n]||0)+(+t.amount)});
  const recTot=Object.values(recYear).reduce((s,v)=>s+v,0);
  const monthRows=data.filter(d=>d.n).map(d=>`<div class="sumrow"><span>${MONTHS[+d.m.slice(5)-1]}</span><span><span class="num amt-inc">+${money(d.inc)}</span> &nbsp; <span class="num amt-exp">−${money(d.exp)}</span> &nbsp; <b class="num">${amtH(d.inc-d.exp)}</b></span></div>`).join('');
  return `<div class="monthbar" style="margin-bottom:0"><button data-yshift="1" aria-label="السنة التالية">›</button><strong>سنة ${y}</strong><button data-yshift="-1" aria-label="السنة السابقة">‹</button></div>
  <h2>ملخص السنة</h2>
  <div class="stats">
   <div class="stat"><span>إجمالي الدخل</span><b class="num amt-inc">${amtH(inc)}</b></div>
   <div class="stat"><span>إجمالي المصاريف</span><b class="num amt-exp">${amtH(exp)}</b></div>
   <div class="stat"><span>الصافي (المدّخر)</span><b class="num ${inc-exp<0?'amt-exp':''}">${amtH(inc-exp)}</b></div>
   <div class="stat"><span>متوسط الصرف الشهري</span><b class="num">${amtH(active?exp/active:0)}</b></div>
   <div class="stat"><span>نسبة الادخار</span><b class="num">${inc?Math.round((inc-exp)/inc*100)+'%':'—'}</b></div>
   <div class="stat"><span>أعلى شهر صرفًا</span><b style="font-size:15px">${maxM?MONTHS[+maxM.m.slice(5)-1]:'—'}</b></div>
  </div>
  <h2>كل شهر في ${y}</h2><div class="panel">${svg}<div class="legend"><span><i style="background:var(--inc)"></i>الدخل</span><span><i style="background:var(--exp)"></i>المصاريف</span></div></div>
  ${monthRows?`<div class="panel" style="margin-top:10px">${monthRows}</div>`:''}
  ${cats.length?`<h2>المصاريف حسب الفئة</h2><div class="panel">${cats.map(([id,v])=>{const c=catOf(id);return `<div class="catrow">${cbadge(c.id)}<div class="name">${esc(c.n)} <small class="num">${exp?Math.round(v/exp*100):0}%</small><div class="meter"><i style="width:${v/cats[0][1]*100}%;background:${c.c}"></i></div></div><span class="num">${amtH(v)}</span></div>`}).join('')}</div>`:''}
  ${personSplitHtml(ya,'المصاريف حسب الأشخاص')}
  ${(()=>{const o={};ya.filter(t=>t.car&&t.type==='exp').forEach(t=>o[t.car]=(o[t.car]||0)+(+t.amount));const e=Object.entries(o);if(!e.length)return '';const tt=e.reduce((s,x)=>s+x[1],0);return `<h2>تكاليف السيارات خلال السنة</h2><div class="panel">${e.sort((a,b)=>b[1]-a[1]).map(([id,v])=>`<div class="sumrow"><span>${esc(carName(id))}</span><b class="num">${amtH(v)}</b></div>`).join('')}${e.length>1?`<div class="sumrow"><b>المجموع</b><b class="num">${amtH(tt)}</b></div>`:''}</div>`})()}
  ${recTot?`<h2>الالتزامات الشهرية خلال السنة</h2><div class="panel">${Object.entries(recYear).sort((a,b)=>b[1]-a[1]).map(([n,v])=>`<div class="sumrow"><span>${esc(n)}</span><b class="num">${amtH(v)}</b></div>`).join('')}<div class="sumrow"><b>المجموع</b><b class="num">${amtH(recTot)}</b></div></div>`:''}`;
}
function reportsMonthExtras(){const m=S.month,a=inMonth(m),st=recStatus(m);
  return personSplitHtml(a,'المصاريف حسب الأشخاص')+(st.R.length?`<h2>الالتزامات الشهرية</h2><div class="panel"><div class="sumrow"><span>المدفوع</span><b class="num">${amtH(st.paidAmt)}</b></div><div class="sumrow"><span>عدد المدفوع</span><b>${st.paid.length} من ${st.R.length}</b></div><div class="sumrow"><span>المتوقع شهريًا</span><b class="num">${amtH(st.total)}</b></div></div>`:'')}

/* ---------- 10. العرض ---------- */
function render(){admChip();applyTabLabels();setTimeout(()=>fillStorage(document.getElementById('storBox')),50);
  document.getElementById('mLabel').textContent=monthName(S.month);
  document.getElementById('monthbar').hidden=S.tab==='settings';
  const v=document.getElementById('view');
  const keepQ=document.activeElement&&document.activeElement.id==='q';
  const focusedB=document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.bcat;
  if(S.tab==='budget'&&(focusedB||['mb','salAmt'].includes(document.activeElement?.id)))return; // don't clobber typing
  v.innerHTML=S.tab==='home'?vHome():S.tab==='log'?vLog():S.tab==='budget'?vBudget():S.tab==='house'?vHouse():S.tab==='monthly'?vMonthly():S.tab==='cars'?vCars():S.tab==='docs'?vDocs():S.tab==='advisor'?vAdvisor():S.tab==='trusts'?vTrusts():S.tab==='settings'?vSettings():vReports();
  if(S.tab==='docs')setTimeout(hydrateDocs,0);
  document.querySelectorAll('nav.tabs [data-tab]').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===S.tab?'page':'false'));
  if(keepQ){const q=document.getElementById('q');if(q){q.focus();q.setSelectionRange(q.value.length,q.value.length)}}
}

/* ---------- 11. التسجيل السريع ---------- */
function quickList(){const since=isoD(new Date(Date.now()-120*864e5));const g={};
  list().forEach(t=>{if(!t.date||t.date<since||t.rec)return;const k=[t.type,t.cat,(t.note||'').trim(),t.amount,t.person||''].join('|');const o=g[k]||(g[k]={t,n:0,last:''});o.n++;if(t.date>=o.last){o.last=t.date;o.t=t}});
  return Object.values(g).filter(x=>x.n>=2).sort((a,b)=>b.n-a.n||b.last.localeCompare(a.last)).slice(0,6).map(x=>x.t)}
function quickHtml(){if(!list().length)return '';const q=quickList();S.quick=q;
  if(!q.length)return `<h2>تسجيل سريع</h2><div class="panel note" style="margin:0">العمليات التي تكررها (مثل القهوة أو الوقود) ستظهر هنا تلقائيًا لتسجيلها بضغطة واحدة.</div>`;
  return `<h2>تسجيل سريع</h2><div class="quick">${q.map((t,i)=>{const c=catOf(t.cat);return `<button class="qbtn" data-quick="${i}" aria-label="تسجيل ${esc(t.note||c.n)} ${money(t.amount)}">${cbadge(t.cat)}<span class="qn">${esc(t.note||SHORT[t.cat]||c.n)}</span><b class="num ${t.type==='inc'?'amt-inc':''}">${amtH(t.amount)}</b></button>`}).join('')}</div>
  <p class="note" style="margin:6px 2px 0">ضغطة واحدة تسجّلها بتاريخ اليوم.</p>`}
function quickAdd(i){const s=(S.quick||[])[+i];if(!s)return;const t=Object.assign({},s,{id:uidGen(),date:today(),createdAt:new Date().toISOString()});delete t.sample;delete t.src;delete t.localOnly;
  putTx(t);toast('سُجّل '+(t.note||catOf(t.cat).n)+' '+rial(t.amount),()=>delTx(t.id))}

/* ---------- 12. نافذة إضافة وتعديل العمليات ---------- */
const SHORT={food:'بقالة',rest:'مطاعم',fuel:'وقود',car:'السيارة',bills:'فواتير',home:'سكن',loan:'أقساط',health:'صحة',shop:'تسوق',edu:'تعليم',fun:'ترفيه',family:'أهل',charity:'صدقات',other:'أخرى',salary:'راتب',freelance:'عمل إضافي',business:'المشروع',gift:'هدايا',iother:'أخرى'};
function freqCats(type){const cnt={};list().forEach(x=>{if(x.type===type)cnt[x.cat]=(cnt[x.cat]||0)+1});const base=type==='inc'?INC_CATS:EXP_CATS;return base.map((c,i)=>[c,i]).sort((a,b)=>((cnt[b[0].id]||0)-(cnt[a[0].id]||0))||a[1]-b[1]).map(x=>x[0])}
function guessCat(note){const l=(note||'').toLowerCase().trim();if(l.length<2)return '';const learned=(S.settings.merchantCats||{})[mkey(note)];if(learned)return learned;for(const [c,w] of Object.entries(KW))if(w.some(x=>l.includes(x)))return c;return ''}
/* اختيار سريع من أسماء القائمة الشهرية داخل نافذة الإضافة (+):
   المصروف: الالتزامات (تُسجَّل دفعةً لها وتظهر مدفوعة في الشهرية) وأقساط الديون (تفتح نافذة السداد).
   الدخل/الإيداع: أسماء الأهل وأسماء القائمة الشهرية تُكتب في البيان. */
function namePickHtml(t){const m=(t.date||today()).slice(0,7);const items=monthItems(m);let ch='';
  if(t.type==='exp'){ch=items.map(i=>{const due=r3(Math.max(0,i.amount-(i.paidAmt||0)));const on=i.kind==='rec'&&t.rec===i.id;
      return `<button class="chip${on?' on':''}" ${i.kind==='debt'?'data-fdebt':'data-frec'}="${esc(i.id)}" aria-pressed="${on}">${i.isPaid?'✓ ':''}${esc(i.name)}${!i.isPaid&&due?` <small class="num">${money(due)}</small>`:''}</button>`}).join('')}
  if(t.type==='exp'){const Y=payees().filter(p=>p.type!=='person');ch+=Y.map(p=>`<button class="chip" data-fname="${esc(p.name)}" aria-pressed="${(t.note||'')===p.name}">🏢 ${esc(p.name)}</button>`).join('')}
  else{const names=[...new Set(people().map(p=>p.name).concat(payees().map(p=>p.name),recs().map(r=>r.name)))].filter(Boolean);ch=names.map(n=>`<button class="chip" data-fname="${esc(n)}" aria-pressed="${(t.note||'')===n}">${esc(n)}</button>`).join('')}
  if(!ch)return '';
  const it=t.rec&&items.find(i=>i.kind==='rec'&&i.id===t.rec);
  return `<div class="npick"><span class="note">${t.type==='exp'?'دفع من القائمة الشهرية:':'إيداع من الأسماء المسجّلة:'}</span><div class="chips npk">${ch}</div>${it?`<p class="note okline" style="margin:4px 0 0">✓ تُسجَّل دفعةً لـ«${esc(it.name)}» في الشهرية (${esc(monthName(m))})${it.isPaid?'، وهو مدفوع من قبل فتُضاف دفعة أخرى':''}</p>`:''}</div>`}
function openSheet(t,pre){
  const isNew=!t;
  const blank=()=>Object.assign({id:uidGen(),type:'exp',amount:'',cat:'',date:today(),method:S.settings.lastMethod||'card',note:'',person:''},pre||{});
  t=t?Object.assign({},t):blank();
  let manualCat=!!t.cat,askDel=false,showAll=false;
  const L=document.getElementById('layer');
  const yest=()=>isoD(new Date(Date.now()-864e5));
  const draw=(focusAmt,focusNote)=>{const all=freqCats(t.type);let cats=showAll?all:all.slice(0,7);if(t.cat&&!cats.find(c=>c.id===t.cat))cats=cats.slice(0,6).concat(all.find(c=>c.id===t.cat)||[]);const P=people();const td=today(),yd=yest();
   L.innerHTML=`<div class="scrim" data-close></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${isNew?'إضافة عملية':'تعديل عملية'}"><div class="in">
    <div class="grab"></div>
    <div class="seg"><button class="e" data-type="exp" aria-pressed="${t.type==='exp'}">مصروف</button><button class="i" data-type="inc" aria-pressed="${t.type==='inc'}">دخل</button></div>
    <div class="amtbox"><input id="fAmt" inputmode="decimal" placeholder="0.000" value="${t.amount!==''?esc(t.amount):''}" aria-label="المبلغ" autocomplete="off"><span>${CUR}</span></div>
    <div class="stack">
     ${isNew?namePickHtml(t):''}
     <div class="catgrid" role="group" aria-label="الفئة">${cats.map(c=>`<button class="cg" data-cat="${c.id}" aria-pressed="${t.cat===c.id}" title="${esc(c.n)}"><i style="background:${c.c}1f;color:${c.c}">${catIcon(c.id)}</i>${esc(SHORT[c.id]||c.n)}</button>`).join('')}${showAll?'':'<button class="cg" id="catMore"><i style="background:var(--surface-2);color:var(--muted)">…</i>المزيد</button>'}</div>
     <input class="inp" id="fNote" placeholder="ملاحظة (اختياري): ${t.type==='inc'?'راتب أكتوبر':'لولو، وقود، قهوة'}" value="${esc(t.note)}" maxlength="80" autocomplete="off" aria-label="ملاحظة">
     <div class="chips" role="group" aria-label="التاريخ" style="align-items:center"><button class="chip" data-dset="${td}" aria-pressed="${t.date===td}">اليوم</button><button class="chip" data-dset="${yd}" aria-pressed="${t.date===yd}">أمس</button><input class="inp" type="date" id="fDate" value="${esc(t.date)}" style="width:auto;flex:1;min-width:130px;padding:6px 10px" aria-label="تاريخ آخر"></div>
     <div class="seg seg3" role="group" aria-label="طريقة الدفع">${METHODS.map(m=>`<button class="n" data-meth="${m[0]}" aria-pressed="${t.method===m[0]}">${m[1]}</button>`).join('')}</div>
     ${t.type==='exp'&&P.length?`<div class="chips" role="group" aria-label="لمن هذا المصروف"><button class="chip" data-person="" aria-pressed="${!t.person}">لي / للبيت</button>${P.map(p=>`<button class="chip" data-person="${esc(p.id)}" aria-pressed="${t.person===p.id}"><span class="dot" style="background:${personColor(p.id)}"></span>${esc(p.name)}</button>`).join('')}</div>`:''}
     ${accList().length>2?`<div class="chips" role="group" aria-label="الحساب"><span class="note">الحساب:</span>${accList().map(a=>`<button class="chip" data-facc="${esc(a.id)}" aria-pressed="${accOf(t)===a.id}">${esc(a.name)}</button>`).join('')}</div>`:''}
     ${!isNew?`<div class="chips"><button class="chip" id="fRcpt">📎 إرفاق صورة الإيصال</button>${Vault.docs.filter(d=>d.tx===t.id).map(d=>`<button class="chip" data-frcv="${esc(d.id)}">📎 ${esc(d.title)}</button>`).join('')}</div>`:''}
     <p class="note" id="fErr" hidden style="color:var(--exp);margin:0"></p>
     ${isNew?`<div class="actions"><div class="row2"><button class="btn" id="fSave">حفظ</button><button class="btn ghost" id="fSaveMore">حفظ وإضافة أخرى</button></div>
       <div class="row2"><button class="btn ghost" id="openImp">لصق رسالة البنك</button><button class="btn ghost" data-close>إلغاء</button></div></div>`
      :`<div class="actions"><button class="btn block" id="fSave">حفظ التعديل</button></div>${askDel?'<div class="confirm"><span>هل تريد حذف هذه العملية نهائيًا؟</span><div class="row2"><button class="btn danger" id="fDel">نعم، احذف</button><button class="btn ghost" id="fDelNo">تراجع</button></div></div>':'<button class="btn ghost block" id="fDelAsk" style="color:var(--exp)">حذف العملية</button>'}`}
    </div></div></div>`;
   if(focusAmt||focusNote)setTimeout(()=>{const i=document.getElementById(focusAmt?'fAmt':'fNote');const ae=document.activeElement;if(ae&&ae!==i&&ae.closest&&ae.closest('#layer')&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))return;/* لا نسحب المؤشر إن بدأت الكتابة في خانة أخرى */if(i){i.focus();if(focusNote)i.setSelectionRange(i.value.length,i.value.length)}},40);
  };
  const grab=()=>{const g=i=>document.getElementById(i);if(g('fAmt'))t.amount=g('fAmt').value;if(g('fDate'))t.date=g('fDate').value;if(g('fNote'))t.note=g('fNote').value};
  const press=(sel,fn)=>L.querySelectorAll(sel).forEach(b=>b.setAttribute('aria-pressed',fn(b)));
  L.oninput=e=>{if(e.target.id==='fNote'&&!manualCat){const g=guessCat(e.target.value);if(g&&(t.type==='inc')===!!INC_CATS.find(c=>c.id===g)&&g!==t.cat){t.cat=g;if(L.querySelector('.cg[data-cat="'+g+'"]'))press('.cg',b=>b.dataset.cat===g);else{grab();draw(false,true)}}}};
  L.onchange=e=>{if(e.target.id==='fDate'){t.date=e.target.value;press('[data-dset]',b=>b.dataset.dset===t.date)}};
  const save=async more=>{grab();const amt=parseAmt(t.amount);const err=document.getElementById('fErr');
    if(!amt){err.hidden=false;err.textContent='اكتب المبلغ أولًا، مثل 3.500';return}
    if(!t.cat){err.hidden=false;err.textContent='اختر الفئة';return}
    const rec={id:t.id,type:t.type,amount:amt,cat:t.cat,date:t.date||today(),method:t.method,note:(t.note||'').trim(),createdAt:t.createdAt||new Date().toISOString()};
    if(t.sample)rec.sample=true; if(t.type==='exp'&&t.person)rec.person=t.person; ['rec','src','car','debt','pend','apv','acc'].forEach(k=>{if(t[k])rec[k]=t[k]});if(rec.type!=='exp')delete rec.rec;
    let setChanged=false;
    if(S.settings.lastMethod!==t.method){S.settings.lastMethod=t.method;setChanged=true}
    if(rec.note&&manualCat){const k=mkey(rec.note);if(k&&(S.settings.merchantCats||{})[k]!==rec.cat){S.settings.merchantCats=Object.assign({},S.settings.merchantCats||{},{[k]:rec.cat});setChanged=true}}
    if(setChanged)putSettings();
    if(more){await putTx(rec);const keep={type:t.type,date:t.date,method:t.method};t=Object.assign(blank(),keep);manualCat=false;draw(true);toast('حُفظت، أضف التالية',()=>delTx(rec.id));return}
    L.innerHTML='';L.oninput=L.onchange=null;await putTx(rec);
    if(rec.date.slice(0,7)!==S.month){S.month=rec.date.slice(0,7);render()}
    isNew?toast('حُفظت العملية',()=>delTx(rec.id)):toast('حُفظ التعديل')};
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';L.oninput=L.onchange=null;return}
    if(x.id==='openImp'){openImport();return}
    if(x.dataset.type){grab();if(t.type!==x.dataset.type){t.type=x.dataset.type;t.cat='';manualCat=false;delete t.rec}draw();return}
    if(x.dataset.frec){grab();if(t.rec===x.dataset.frec){delete t.rec;draw();return}const r=recs().find(y=>y.id===x.dataset.frec);if(!r)return;const it=monthItems((t.date||today()).slice(0,7)).find(i=>i.kind==='rec'&&i.id===r.id);
      t.rec=r.id;if(r.cat){t.cat=r.cat;manualCat=true}t.note=r.name;t.person=r.person||'';if(!parseAmt(t.amount)&&it){const due=r3(Math.max(0,it.amount-(it.paidAmt||0)));t.amount=amtIn(due||it.amount)}draw(true);return}
    if(x.dataset.fdebt){L.innerHTML='';L.oninput=L.onchange=null;openDebtPay(x.dataset.fdebt);return}
    if(x.dataset.fname){grab();t.note=x.dataset.fname;draw(true);return}
    if(x.id==='catMore'){grab();showAll=true;draw();return}
    if(x.dataset.cat){t.cat=x.dataset.cat;manualCat=true;press('.cg',b=>b===x);return}
    if(x.dataset.dset){t.date=x.dataset.dset;document.getElementById('fDate').value=t.date;press('[data-dset]',b=>b===x);return}
    if(x.dataset.meth){t.method=x.dataset.meth;press('[data-meth]',b=>b===x);if(!t.accSet)press('[data-facc]',b=>b.dataset.facc===accOf(t));return}
    if(x.dataset.facc){t.acc=x.dataset.facc;t.accSet=1;press('[data-facc]',b=>b===x);return}
    if(x.id==='fRcpt'){const pre={type:'receipt',tx:t.id,title:'إيصال - '+(t.note||catOf(t.cat).n)+' '+fmtD(t.date)};L.innerHTML='';L.oninput=L.onchange=null;withVault(()=>openDoc(null,pre),Vault.cfg?'افتح الخزنة لإرفاق الإيصال':'أنشئ خزنة المستندات أولًا لحفظ الإيصالات مشفّرة');return}
    if(x.dataset.frcv){const id=x.dataset.frcv;L.innerHTML='';L.oninput=L.onchange=null;withVault(()=>viewDoc(id));return}
    if(x.dataset.person!==undefined){t.person=x.dataset.person;press('[data-person]',b=>b===x);return}
    if(x.id==='fDelAsk'){grab();askDel=true;draw();return}
    if(x.id==='fDelNo'){grab();askDel=false;draw();return}
    if(x.id==='fDel'){const old=S.tx[t.id]&&Object.assign({},S.tx[t.id]);L.innerHTML='';L.oninput=L.onchange=null;await delTx(t.id);toast('حُذفت العملية',old?()=>putTx(old):null);return}
    if(x.id==='fSave'){await save(false);return}
    if(x.id==='fSaveMore'){await save(true);return}
  };
  draw(isNew&&t.amount==='');
}

/* ---------- 13. الالتزامات الشهرية، والأهل ---------- */
const REC_KINDS={
 wifi:{n:'واي فاي وإنترنت المنزل',cat:'bills'},phone:{n:'باقة الهاتف',cat:'bills'},
 elec:{n:'فاتورة الكهرباء',cat:'bills',variable:1},water:{n:'فاتورة المياه',cat:'bills',variable:1},
 rent:{n:'إيجار المنزل',cat:'home'},maid:{n:'راتب العاملة المنزلية',cat:'home'},
 loan:{n:'قسط شهري',cat:'loan'},family:{n:'مصروف شهري للأهل',cat:'family'},custom:{n:'التزام آخر',cat:'other'}
};
const AV_COLORS=['#2F7F7A','#8A4F7D','#B0662F','#3E7CB1','#6B5CA5','#C2562F','#3B8F5A','#A0527B'];
function people(){return S.settings.people||[]}
function recs(){return S.settings.recurring||[]}
function personName(id){const p=people().find(x=>x.id===id);return p?p.name:'شخص محذوف'}
function personColor(id){const i=people().findIndex(x=>x.id===id);return AV_COLORS[(i<0?0:i)%AV_COLORS.length]}
/* التاريخ بنظام يوم/شهر/سنة، مثل 5/11/2026 */
function dmy(iso){if(!iso)return '—';const [y,m,d]=iso.split('-');return (+d)+'/'+(+m)+'/'+y}
/* تاريخ استحقاق البند في الشهر m */
function dueOf(i,m){const [y,mm]=m.split('-').map(Number);const d=Math.min(Math.max(1,+i.day||1),new Date(y,mm,0).getDate());return m+'-'+String(d).padStart(2,'0')}
/* الدفع يُفتح من تاريخ الاستحقاق؛ قبله يحتاج وضع المدير */
/* إعداد قفل الدفع (من ⚙️ الضبط): مفعّل؟ على أي أشهر؟ ويُفتح قبل الموعد بكم يوم؟ */
function payLockCfg(){return Object.assign({on:true,scope:'all',before:0},S.settings.payLock||{})}
function payOpenDate(i,m){return addDays(dueOf(i,m),-(+payLockCfg().before||0))}
function payLocked(i,m){const c=payLockCfg();if(!c.on||i.isPaid||i.paidAmt>0.0005)return false;if(c.scope==='future'&&m<=ym(new Date()))return false;return payOpenDate(i,m)>today()}
function nextDueTxt(i,m){const n=shiftMonth(m,1);const it=monthItems(n).find(x=>x.kind===i.kind&&x.id===i.id);return it?{amt:it.amount,date:dueOf(it,n)}:null}
function recPaid(r,m){return list().find(t=>t.rec===r.id&&t.date&&t.date.slice(0,7)===m)}
function recDate(r,m){const [y,mm]=m.split('-').map(Number);const dim=new Date(y,mm,0).getDate();const d=Math.min(Math.max(1,+r.day||1),dim);return m+'-'+String(d).padStart(2,'0')}
function debtPaidIn(d,m){return (d.pays||[]).filter(p=>p.date&&p.date.slice(0,7)===m).reduce((x,p)=>x+(+p.amt||0),0)}
function monthItems(m){const out=[];
  recs().forEach(r=>{if(!recActive(r,m))return;const L=billLedger(r,m);if(L){out.push({kind:'rec',id:r.id,name:r.name,amount:L.total,bill:L.bill,prev:L.prev,day:+r.day||1,person:r.person||'',variable:!!(REC_KINDS[r.kind]&&REC_KINDS[r.kind].variable),isPaid:L.remaining<=0.0005,paidAmt:L.paid,tracked:true,ref:r});return}
    const p=recPaid(r,m);out.push({kind:'rec',id:r.id,name:r.name,amount:billAmt(r,m),day:+r.day||1,person:r.person||'',variable:!!(REC_KINDS[r.kind]&&REC_KINDS[r.kind].variable),isPaid:!!p,paidAmt:p?+p.amount:0,ref:r})});
  debts().forEach(d=>{const pa=debtPaidIn(d,m);if(!(+d.balance>0)&&!pa)return;if(d.start&&m<d.start.slice(0,7)&&!pa)return;if(d.trackFrom&&m<d.trackFrom.slice(0,7)&&!pa)return;const once=d.mode==='once';if(once&&!pa&&(!d.end||d.end.slice(0,7)!==m))return;const arr=once?0:debtArrLeft(d,m),base=once?r3((+d.balance)+pa):+d.payment||0;out.push({kind:'debt',id:d.id,name:(once?'سداد ':'قسط ')+d.name,amount:r3(base+arr),prev:arr,day:+d.day||1,person:'',variable:false,isPaid:arr>0?pa>=r3(base+arr)-0.0005:pa>0,paidAmt:pa,ref:d})});
  return out}
function recStatus(m){const R=monthItems(m);const paid=R.filter(i=>i.isPaid);const total=R.reduce((x,i)=>x+i.amount,0);const paidAmt=R.reduce((x,i)=>x+(i.paidAmt||0),0);const partial=R.filter(i=>!i.isPaid&&i.paidAmt>0);return{R,paid,partial,total,paidAmt,dueLeft:r3(R.filter(i=>!i.isPaid).reduce((x,i)=>x+i.amount-(i.paidAmt||0),0)),left:R.length-paid.length}}
/* حساب الفاتورة: فاتورة كل شهر + المتأخرات السابقة − ما دفعته = المتبقي (للفواتير التي فيها «since») */
/* المبلغ الشهري في شهر معيّن: تعديل لشهر واحد، أو آخر تغيير «من شهر كذا فصاعدًا»، أو المبلغ الأساسي */
function amtAt(r,m){const H=r.amtHist||{};const k=Object.keys(H).filter(x=>x<=m).sort().pop();return k?+H[k]:+r.amount||0}
function billAmt(r,m){const v=(r.bills||{})[m];return v!==undefined&&v!==''?+v:amtAt(r,m)}
/* هل الالتزام فعّال في هذا الشهر؟ (من شهر البداية حتى شهر النهاية إن وُجد) */
function recActive(r,m){return (!r.start||m>=r.start)&&(!r.until||m<=r.until)}
function recPays(r){return list().filter(t=>t.rec===r.id&&t.type==='exp'&&t.date)}
function billLedger(r,m){const since=r.since;if(!since||m<since)return null;
  const P=recPays(r).filter(t=>t.date>=since+'-01');let prev=+r.arrears||0;
  for(let k=since;k<m;k=shiftMonth(k,1))if(recActive(r,k))prev+=billAmt(r,k);
  prev-=P.filter(t=>t.date<m+'-01').reduce((s,t)=>s+(+t.amount),0);
  const bill=billAmt(r,m),paid=P.filter(t=>t.date.slice(0,7)===m).reduce((s,t)=>s+(+t.amount),0);const total=r3(prev+bill);
  return{prev:r3(prev),bill,total,paid:r3(paid),remaining:r3(total-paid)}}
/* الفواتير القديمة: تفعيل الدفع الجزئي والمتبقي ابتداءً من الشهر الحالي (الأشهر السابقة كما هي) */
function migrateRecs(){const R=S.settings.recurring||[];let ch=0;R.forEach(r=>{if(!r.since){r.since=ym(new Date());r.arrears=+r.arrears||0;ch=1}});
  debts().forEach(d=>{(d.pays||[]).forEach(p=>{if(!p.id){p.id=uidGen();ch=1}});if(!d.start){d.start=debtStart(d);ch=1}if(!(+d.balance>0.0005)&&!d.closed){debtSync(d);ch=1}});if(ch)putSettings()}
function remindDay(r){return Math.min(31,Math.max(1,+r.remind||Math.max(1,(+r.day||1)-2)))}
/* تنبيهات الفواتير: من يوم التذكير الذي تحدده حتى تُدفع */
function billAlertList(){const m=ym(new Date()),day=new Date().getDate();const out=[];
  monthItems(m).filter(i=>i.kind==='rec'&&!i.isPaid).forEach(i=>{const r=i.ref;const rd=remindDay(r);const later=(r.later||{})[m];if(later&&i.paidAmt>0){if(today()<later)return}else if(day<rd&&day<=i.day)return;
    const due=i.amount-(i.paidAmt||0);const late=day>i.day;const L=billLedger(r,m);
    out.push({ref:'bill:'+r.id+':'+m,id:r.id,level:late?'late':'warn',days:i.day-day,title:(i.paidAmt>0?'باقي '+r.name+' ':(late?'تأخر دفع ':'ادفع ')+r.name+' ')+money(due)+' '+CUR,
      when:(i.paidAmt>0?'دفعت منها '+money(i.paidAmt)+(later?' · تذكيرك '+fmtD(later):''):late?'كان موعده يوم '+i.day:i.day===day?'موعده اليوم':'موعده يوم '+i.day+' (بعد '+countWord(i.day-day,'يوم واحد','يومين','أيام','يومًا')+')')+(L&&L.prev>0.0005&&!i.paidAmt?' · منها متأخرات سابقة '+money(L.prev):'')})});
  return out.sort((a,b)=>a.days-b.days)}
function billAlertsHtml(){const A=billAlertList();if(!A.length)return '';
  return `<div class="alertbox"><div class="alerthead"><b>تذكير الفواتير</b><span class="pill late">${A.length}</span></div>${A.map(a=>`<div class="alertrow ${a.level}"><span class="adot"></span><div style="min-width:0"><b>${esc(a.title)}</b><small>${esc(a.when)}</small></div><button class="chip pay" data-rpay="${esc(a.id)}" data-m="${ym(new Date())}">دفعت</button></div>`).join('')}</div>`}
/* تذكيرات الفواتير في تقويم الآيفون: حدث شهري في يوم التذكير مع تنبيه الساعة 9 صباحًا */
function billsIcs(){const now=new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';const start=new Date();
  const ev=recs().map(r=>{const rd=remindDay(r);const d=new Date(start.getFullYear(),start.getMonth(),Math.min(rd,28));if(d<start)d.setMonth(d.getMonth()+1);
    const ds=icsDate(isoD(d));const title='ادفع '+r.name;
    return ['BEGIN:VEVENT','UID:bill-'+r.id+'@masareef','DTSTAMP:'+now,'DTSTART:'+ds+'T090000','DTEND:'+ds+'T091500','RRULE:FREQ=MONTHLY;BYMONTHDAY='+Math.min(rd,28),'SUMMARY:'+title,
      'DESCRIPTION:موعد الدفع يوم '+(+r.day||1)+' من كل شهر'+(+r.amount?' - المبلغ تقريبًا '+money(r.amount)+' ر.ع.':'')+' - من تطبيق إدارة شؤوني',
      'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+title,'TRIGGER:PT0M','END:VALARM','END:VEVENT'].join('\r\n')});
  if(!ev.length)return '';return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//masareef//AR','CALSCALE:GREGORIAN',...ev,'END:VCALENDAR'].join('\r\n')+'\r\n'}
function saveBillsIcs(){const t=billsIcs();if(!t){toast('أضف فاتورة أولًا');return}saveFile('idarat-shuooni-bills.ics',t,'text/calendar');toast('افتح الملف وأضفه للتقويم ليذكّرك كل شهر')}
function byPerson(a){const o={};a.filter(t=>t.type==='exp').forEach(t=>{const k=t.person||'';o[k]=(o[k]||0)+(+t.amount||0)});return o}
function personSplitHtml(a,title){const o=byPerson(a);const tot=Object.values(o).reduce((s,v)=>s+v,0);if(!tot)return '';
  const rows=[['', 'لي وللبيت']].concat(people().map(p=>[p.id,p.name])).concat(Object.keys(o).filter(k=>k&&!people().find(p=>p.id===k)).map(k=>[k,'شخص محذوف']));
  return `<h2>${title}</h2><div class="panel">${rows.filter(([k])=>o[k]).sort((x,y)=>o[y[0]]-o[x[0]]).map(([k,n])=>{const v=o[k];const col=k?personColor(k):'var(--accent)';
    return `<div class="catrow"><span class="dot" style="background:${col}"></span><div class="name">${esc(n)} <small class="num">${Math.round(v/tot*100)}%</small><div class="meter"><i style="width:${v/tot*100}%;background:${col}"></i></div></div><span class="num">${amtH(v)}</span></div>`}).join('')}</div>`}

function vMonthly(){
  const m=S.month;const st=recStatus(m);const cur=m===ym(new Date());const todayD=new Date().getDate();
  const PD={};list().forEach(t=>{if(t.rec&&t.date){const k=t.rec+'|'+t.date.slice(0,7);(PD[k]=PD[k]||[]).push(t.date)}});
  const Y=m.slice(0,4),YM={};for(let k=1;k<=12;k++){const mm=Y+'-'+String(k).padStart(2,'0');YM[mm]={};monthItems(mm).forEach(x=>YM[mm][x.kind+x.id]=x)}
  /* تفاصيل الدفع لكل أشهر السنة: الموعد والمبلغ وتاريخ الدفع، أخضر = مدفوع، أحمر = غير مدفوع */
  const yearGridHtml=i=>{const td=today();const cells=Object.keys(YM).map(mm=>{const x=YM[mm][i.kind+i.id];const mn=MONTHS[+mm.slice(5)-1];
      if(!x){const tf=i.kind==='debt'&&i.ref.trackFrom&&mm<i.ref.trackFrom.slice(0,7);return `<div class="yg-c off${tf?' pre':''}"><b>${mn}</b><small>${tf?'قبل المتابعة':'—'}</small></div>`}
      const du=dueOf(x,mm),pd=(x.kind==='rec'?(PD[x.id+'|'+mm]||[]):(x.ref.pays||[]).filter(p=>p.date&&p.date.slice(0,7)===mm).map(p=>p.date)).sort().pop();
      const cls=x.isPaid?'ok':du<=td?'bad':x.paidAmt?'part':'up';
      return `<button class="yg-c ${cls}${mm===m?' cur':''}" type="button" data-gomonth="${mm}" aria-label="${mn} ${Y}"><b>${mn}</b><span class="num">${money(x.isPaid?x.paidAmt:cls==='up'&&x.tracked?x.bill:Math.max(0,x.amount-(x.paidAmt||0)))}</span><small>${x.isPaid?'دُفع':'موعده'}</small><small class="num">${x.isPaid?dmy(pd):dmy(du)}</small></button>`}).join('');
    return `<details class="ygrid"><summary>📅 تفاصيل الدفع لسنة ${Y}</summary><div class="yg">${cells}</div><div class="yg-key"><span class="ok">مدفوع</span><span class="bad">غير مدفوع</span><span class="up">قادم</span></div></details>`};
  const row=i=>{const late=!i.isPaid&&(m<ym(new Date())||(cur&&todayD>i.day));
    const due=dueOf(i,m),pdates=i.kind==='rec'?(PD[i.id+'|'+m]||[]):(i.ref.pays||[]).filter(x=>x.date&&x.date.slice(0,7)===m).map(x=>x.date),lastPaid=pdates.slice().sort().pop();
    const pill=i.isPaid?`<span class="pill paid">دُفع${lastPaid?' '+dmy(lastPaid):''}</span>`:late?`<span class="pill late">متأخر · موعده ${dmy(due)}</span>`:i.paidAmt?`<span class="pill soon">دُفع جزء · موعده ${dmy(due)}</span>`:`<span class="pill soon">موعده ${dmy(due)}</span>`;
    const lockedPay=payLocked(i,m);
    const pay=i.isPaid?(i.kind==='debt'&&+i.ref.balance>0.0005?`<button class="chip" data-dpay="${esc(i.id)}" aria-label="دفعة إضافية لـ${esc(i.name)}">+ دفعة إضافية</button>`:''):`<button class="chip pay${lockedPay?' early':''}" ${i.kind==='debt'?'data-dpay':'data-rpay'}="${esc(i.id)}"${lockedPay?` data-early="${payOpenDate(i,m)}" aria-label="الدفع يُفتح في ${dmy(payOpenDate(i,m))}"`:''}>${lockedPay?'🔒 يُفتح '+dmy(payOpenDate(i,m)):'دفعت'}</button>`;
    const nx=i.isPaid?nextDueTxt(i,m):null;
    const nextLine=nx?`<div class="nextdue">التالي: <b class="num">${amtH(nx.amt)}</b> · موعده ${dmy(nx.date)}${payLockCfg().on&&nx.date>today()?' · يُفتح الدفع '+(+payLockCfg().before?'في '+dmy(addDays(nx.date,-payLockCfg().before)):'في موعده'):''}</div>`:'';
    const edit=`<button class="chip" ${i.kind==='debt'?'data-dedit':'data-redit'}="${esc(i.id)}" aria-label="تعديل ${esc(i.name)}"><span class="lk">🔒 </span>تعديل</button>`;
    const rem=r3(Math.max(0,i.amount-(i.paidAmt||0)));const pm0=shiftMonth(m,-1);
    const prevTag=i.prev>0.0005?`<span class="prevtag">${i.kind==='debt'?'+ متأخرات من الأشهر الماضية':'+ متبقٍ من الشهر الماضي'} <span class="num">${amtH(i.prev)}</span></span>`:i.kind==='debt'&&+i.ref.balance>0&&!debtPaidIn(i.ref,pm0)&&(!i.ref.start||i.ref.start.slice(0,7)<=pm0)&&(!i.ref.trackFrom||i.ref.trackFrom.slice(0,7)<=pm0)&&i.ref.mode!=='once'?'<span class="prevtag">لم يُسجَّل قسط الشهر الماضي</span>':'';
    const amtBox=`<div class="rec-amt${i.isPaid?' ok':i.paidAmt?' part':''}">${i.isPaid?`<small>مدفوع ✓</small><b class="num">${money(i.paidAmt)}</b>`:`<small>${i.paidAmt?'باقٍ':'المقرر'}</small><b class="num">${money(rem)}</b>`}</div>`;
    const op=(S.recOpen||{})[i.kind+i.id];
    return `<div class="recrow rec2${i.isPaid?' done':''}${op?' open':''}" data-rkey="${i.kind+esc(i.id)}">${i.kind==='debt'?debtBadge(i.ref):recBadge(i.ref)}<div class="rtog" data-rtog="${i.kind+esc(i.id)}" role="button" aria-expanded="${op?'true':'false'}" aria-label="عرض تفاصيل ${esc(i.name)}"><b>${i.kind==='debt'?'<span class="tag">دين</span>':''}${esc(i.name)}</b><small>${i.tracked?`فاتورة <span class="num">${amtH(i.bill)}</span>${i.prev>0.0005?' + متأخرات سابقة <span class="num amt-exp">'+amtH(i.prev)+'</span>':i.prev<-0.0005?' − رصيد لك <span class="num">'+amtH(-i.prev)+'</span>':''}${Math.abs(i.prev)>0.0005?' = <span class="num">'+amtH(i.amount)+'</span>':''}${i.paidAmt&&!i.isPaid?' · دفعت <span class="num">'+amtH(i.paidAmt)+'</span> · المتبقي <b class="num">'+amtH(i.amount-i.paidAmt)+'</b>'+((i.ref.later||{})[m]?' · تذكير '+fmtD(i.ref.later[m]):''):''}<br>`:`<span class="num">${money(i.amount)}</span> ${CUR}${i.variable?' تقريبًا':''} · `}يوم الدفع ${i.day}${i.kind==='rec'?' · تذكير يوم '+remindDay(i.ref)+' · 🔁 '+(i.ref.until?'حتى '+monthName(i.ref.until):'شهريًا مستمر'):''}${i.person?' · لـ'+esc(personName(i.person)):''}${i.kind==='debt'?' · متبقٍ <span class="num">'+amtH(i.ref.balance)+'</span>':''}</small>${prevTag}</div>${amtBox}
      ${nextLine}<div class="recact">${pill}${pay}${i.paidAmt>0.0005?`<button class="chip unpay" data-unpay="${i.kind}|${esc(i.id)}|${m}" aria-label="إلغاء دفع ${esc(i.name)}"><span class="lk">🔒 </span>إلغاء الدفع</button>`:''}${edit}</div>${yearGridHtml(i)}${i.kind==='rec'?recHistHtml(i.ref,m):debtHistHtml(i.ref)}</div>`};
  /* الأقسام: الفواتير، مصروف العائلة، أقساط الديون، وأخرى */
  const secOf=i=>{const k=i.ref.kind;if(i.kind==='debt'||k==='loan')return 'debt';if(['wifi','phone','elec','water','rent'].includes(k)||i.ref.cat==='bills')return 'bills';if(['family','maid'].includes(k)||i.ref.cat==='family'||i.person)return 'family';return 'other'};
  const SECS=[['bills','🧾'],['family','👨‍👩‍👧'],['debt','🏦'],['other','📌']].map(([k,ic])=>[k,ic+' '+esc(lbl('msec.'+k))]);
  const recRows=`<div class="chips rec-tools"><button class="chip" data-rall="1">⊕ توسيع الكل</button><button class="chip" data-rall="0">⊖ تصغير الكل</button></div>`+SECS.map(([k,title])=>{const I=st.R.filter(i=>secOf(i)===k);if(!I.length)return '';
    const tot=I.reduce((s,i)=>s+i.amount,0),pd=I.reduce((s,i)=>s+Math.min(i.amount,i.paidAmt||0),0),left=r3(Math.max(0,tot-pd)),np=I.filter(i=>i.isPaid).length;
    const rows=I.slice().sort((x,y)=>(x.isPaid-y.isPaid)||(x.day-y.day));
    const closed=secClosed(k);
    return `<div class="recsec${closed?' closed':''}" data-sec="${k}"><div class="recsec-h"><button class="recsec-t" data-stog="${k}" aria-expanded="${!closed}"><span class="chev">${closed?'◂':'▾'}</span><span class="rst"><b>${title}</b><small>${np} من ${I.length} مدفوع · المقرر <span class="num">${amtH(tot)}</span></small></span></button>
      ${renBtn('msec.'+k)}<div class="recsec-left ${left<=0.0005?'ok':''}">${left<=0.0005?'<b>✓ مدفوع بالكامل</b>':`<small>المتبقي</small><b class="num">${money(left)}</b>`}</div></div>
     <div class="recsec-body"><div class="panel" style="padding-block:4px">${rows.map(row).join('')}</div><button class="chip secadd" data-secadd="${k}"><span class="lk">🔒 </span>+ إضافة في ${title.replace(/^\S+\s/,'')}</button></div></div>`}).join('');
  return `<div class="backrow" data-nofold style="margin-top:4px"><h2 style="margin:0">${esc(lbl('sec.monthly'))}</h2><span style="display:flex;gap:6px">${renBtn('sec.monthly')}<button class="chip" data-paycal="1">📅 التقويم</button><button class="chip pay" data-recpick="1"><span class="lk">🔒 </span>+ إضافة التزام</button></span></div>
  ${st.R.length?`<div class="planbox"><span class="note" style="color:var(--fg)">${st.left?'دفعت '+st.paid.length+' من '+st.R.length+' هذا الشهر'+(st.partial.length?' · '+countWord(st.partial.length,'واحدة مدفوعة جزئيًا','اثنتان مدفوعتان جزئيًا','مدفوعة جزئيًا','مدفوعة جزئيًا'):'')+' · باقٍ عليك '+money(st.dueLeft):'دفعت كل مصاريفك الثابتة هذا الشهر'}</span>
    <span class="big2"><span class="num">${amtH(st.paidAmt)}</span> <small style="font-size:14px;font-weight:400">من <span class="num">${money(st.total)}</span> ${CUR}</small></span></div>
    ${recRows}
    ${st.left>1?`<button class="btn ghost block" id="payAll" style="margin-top:10px">تسجيل كل المتبقي بنفس المبالغ</button>`:''}
    <div class="chips" style="margin-top:10px"><button class="chip" data-xopen="monthly">📊 تصدير الالتزامات Excel / PDF</button></div>`
   :`<div class="panel empty" style="padding:18px 12px"><b>رتّب فواتيرك الشهرية في مكان واحد</b>أضف الإنترنت والكهرباء والإيجار وأي مصروف يتكرر كل شهر، وتظهر أقساط ديونك هنا تلقائيًا. كل شهر تضغط «دفعت» فيُسجَّل المصروف تلقائيًا، وتعرف ما بقي عليك.</div>`}
  <button class="btn ghost block" data-recpick="1" style="margin-top:12px"><span class="lk">🔒 </span>+ إضافة التزام آخر</button>
  ${m===ym(new Date())?subsHtml():''}
  ${recs().length?`<div class="panel stack" style="margin-top:12px"><b>تذكير الفواتير</b><div class="note">يظهر التذكير في الرئيسية من يوم التذكير الذي تحدده لكل فاتورة حتى تدفعها. ولتصلك تنبيهات حتى والتطبيق مغلق، أضفها لتقويم هاتفك.</div><div class="row2"><button class="btn ghost" id="billsIcs">إضافة التذكيرات للتقويم</button><button class="btn ghost" id="askNotify">تفعيل الإشعارات</button></div></div>`:''}`;
}

function vHouse(){
  const m=S.month,a=inMonth(m);
  const P=people();const po=byPerson(a);
  const pCards=P.map(p=>{const spent=po[p.id]||0;const al=+p.allowance||0;const pct=al?Math.min(100,spent/al*100):0;
    return `<div class="person"><div class="top2"><div style="display:flex;gap:10px;align-items:center;min-width:0">${personAv(p)}<div style="min-width:0"><b style="font-weight:600">${esc(p.name)}</b><div class="note">${esc(p.rel||'')}</div></div></div>
      <div class="gm"><span>صُرف هذا الشهر</span><b class="num" style="font-size:17px">${money(spent)}</b></div></div>
      ${al?`<div class="meter"><i class="${spent>al?'over':pct>80?'near':''}" style="width:${pct}%"></i></div><div class="budgetline" style="margin:0"><span>المخصص الشهري <b class="num">${amtH(al)}</b></span><span>${spent>al?'تجاوز بـ <b class="num amt-exp">'+amtH(spent-al)+'</b>':'متبقٍ <b class="num">'+amtH(al-spent)+'</b>'}</span></div>`:''}
      <div class="gbtns"><button class="chip" data-pspend="${esc(p.id)}">+ مصروف لـ${esc(p.name)}</button><button class="chip" data-pedit="${esc(p.id)}">تعديل</button></div></div>`}).join('');
  return `<h2 style="margin-top:4px">الأهل والبيت</h2>
  ${P.length?`<div class="panel" style="padding-block:2px">${pCards}</div>`:`<div class="panel empty" style="padding:18px 12px"><b>وزّع مصاريفك على أفراد أسرتك</b>أضف أسماء من تصرف عليهم، مثل الوالدة أو الزوجة أو الأبناء، وحدّد لكل واحد مبلغًا شهريًا إن أردت. بعدها اختر الاسم عند تسجيل أي مصروف.</div>`}
  <div class="chips" style="margin-top:12px"><button class="chip" data-padd="1">+ إضافة شخص</button></div>
  ${personSplitHtml(a,'توزيع مصاريف '+esc(MONTHS[+m.slice(5)-1]))}`;
}

function openPerson(id){
  const L=document.getElementById('layer');const P=S.settings.people||(S.settings.people=[]);const ex=id?P.find(x=>x.id===id):null;
  const p=ex?Object.assign({},ex):{id:uidGen(),name:'',rel:'',allowance:''};let askDel=false;
  const draw=()=>{L.innerHTML=`${sheetTop('شخص')}
   <h2 style="margin-top:0">${ex?'تعديل '+esc(ex.name):'إضافة شخص'}</h2><div class="stack">
   <div class="field"><label for="pName">الاسم</label><input class="inp" id="pName" value="${esc(p.name)}" placeholder="مثال: أم محمد" maxlength="30"></div>
   <div class="field"><label for="pRel">صلة القرابة (اختياري)</label><input class="inp" id="pRel" value="${esc(p.rel)}" placeholder="الوالدة، الزوجة، الابن، الأخ…" maxlength="30" list="relList"><datalist id="relList">${['الوالدة','الوالد','الزوجة','الابن','الابنة','الأخ','الأخت','الجدة','العاملة المنزلية'].map(r=>`<option value="${r}">`).join('')}</datalist></div>
   <div class="field"><label for="pAl">المخصص الشهري (اختياري)</label><input class="inp num" id="pAl" inputmode="decimal" value="${p.allowance?amtIn(p.allowance):''}" placeholder="0.000" style="text-align:left"></div>
   <p class="note" style="margin:0">المخصص يساعدك تعرف هل تجاوزت ما حددته لهذا الشخص في الشهر.</p>
   <p class="note" id="pErr" hidden style="color:var(--exp);margin:0"></p>
   <button class="btn block" id="pSave">حفظ</button>
   ${ex?(askDel?'<div class="confirm"><span>حذف هذا الشخص؟ تبقى مصاريفه المسجلة كما هي.</span><div class="row2"><button class="btn danger" id="pDel">نعم، احذف</button><button class="btn ghost" id="pDelNo">تراجع</button></div></div>':'<button class="btn ghost block" id="pDelAsk" style="color:var(--exp)">حذف</button>'):'<button class="btn ghost block" data-close>إلغاء</button>'}
   </div></div></div>`};
  const grab=()=>{p.name=document.getElementById('pName').value;p.rel=document.getElementById('pRel').value;p.allowance=document.getElementById('pAl').value};
  L.onchange=L.oninput=null;
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='pDelAsk'){grab();askDel=true;draw();return}
    if(x.id==='pDelNo'){grab();askDel=false;draw();return}
    if(x.id==='pDel'){S.settings.people=P.filter(y=>y.id!==p.id);L.innerHTML='';putSettings();render();toast('حُذف');return}
    if(x.id==='pSave'){grab();if(!p.name.trim()){const er=document.getElementById('pErr');er.hidden=false;er.textContent='اكتب الاسم';return}
      const rec={id:p.id,name:p.name.trim(),rel:p.rel.trim(),allowance:parseAmt(p.allowance)};const i=P.findIndex(y=>y.id===p.id);if(i>=0)P[i]=rec;else P.push(rec);
      L.innerHTML='';putSettings();render();toast('حُفظ '+rec.name)}};
  draw();
}
/* مدة تكرار الالتزام: اختيار سريع بدل كتابة شهر النهاية */
const REC_DUR=[[0,'مستمر'],[6,'6 أشهر'],[12,'سنة'],[24,'سنتان'],[36,'3 سنوات'],[60,'5 سنوات'],[120,'10 سنوات']];
function monthsSpan(a,b){const [y1,m1]=a.split('-').map(Number),[y2,m2]=b.split('-').map(Number);return (y2-y1)*12+(m2-m1)+1}
/* سؤال «هل توجد متأخرات لم تُدفع من الأشهر الماضية؟» في نموذجي الالتزام والدين */
function arrQHtml(p,yes,val,note){return `<div class="field arrq"><label>هل توجد متأخرات لم تُدفع من الأشهر الماضية؟</label><div class="seg"><button class="n" type="button" data-arrq="0" aria-pressed="${!yes}">لا</button><button class="n" type="button" data-arrq="1" aria-pressed="${!!yes}">نعم، يوجد متأخرات</button></div>
   <div id="${p}ArrBox" class="stack" style="margin-top:8px"${yes?'':' hidden'}><input class="inp num" id="${p}Arr" inputmode="decimal" value="${+val?amtIn(val):''}" placeholder="مبلغ المتأخرات 0.000" style="text-align:left" aria-label="مبلغ المتأخرات"><span class="note" style="margin:0">${note}</span></div></div>`}
function arrQToggle(x){const box=x.closest('.arrq');const yes=x.dataset.arrq==='1';box.querySelectorAll('[data-arrq]').forEach(b=>b.setAttribute('aria-pressed',b===x));const bx=box.querySelector('[id$="ArrBox"]');bx.hidden=!yes;if(yes){const i=bx.querySelector('input');setTimeout(()=>i.focus(),30)}}
/* تاريخ بدء متابعة الدين في التطبيق: المحدد، أو أول دفعة مسجلة، أو تاريخ الإضافة */
function debtTrackFrom(d){if(d.trackFrom)return d.trackFrom;const P=(d.pays||[]).map(p=>p.date).filter(Boolean).sort();const L=(d.log||[]).map(x=>x.at).filter(Boolean).sort();return P[0]||L[0]||d.start||today()}
/* الأقساط: المدفوعة (قبل المتابعة + المسجلة في التطبيق) والكلي والباقي */
function debtInstInfo(d){const inApp=(d.pays||[]).filter(p=>+p.amt>0).length;const before=+d.paidN||0;const paid=before+inApp;const tot=+d.totalN||0;return{paid,tot,left:tot?Math.max(0,tot-paid):null,before,inApp}}
/* متأخرات الدين المتبقية في الشهر m: تُخصم منها كل زيادة دُفعت فوق القسط في الأشهر التالية */
function debtArrLeft(d,m){if(!(+d.arrears>0)||d.mode==='once')return 0;const since=d.arrSince||m;if(m<since)return 0;let left=+d.arrears;const inst=+d.payment||0;
  for(let k=since;k<m;k=shiftMonth(k,1)){left-=Math.max(0,debtPaidIn(d,k)-inst);if(left<=0.0005)return 0}const bl=Number(String(d.balance).replace(/,/g,''))||0;return r3(Math.min(left,Math.max(0,bl+debtPaidIn(d,m))))}
function openRec(id,kind){
  const L=document.getElementById('layer');const R=S.settings.recurring||(S.settings.recurring=[]);const ex=id?R.find(x=>x.id===id):null;
  const k=REC_KINDS[ex?ex.kind:kind]||REC_KINDS.custom;
  const r=ex?Object.assign({},ex,{amount:amtIn(amtAt(ex,S.month))}):{id:uidGen(),kind:kind,name:kind==='custom'?'':k.n,amount:'',cat:k.cat,day:kind==='rent'?1:5,person:'',start:S.month};let askDel=false,scope='from';
  const scopeHtml=()=>ex&&Math.abs(parseAmt(r.amount)-amtAt(ex,S.month))>0.0005?`<div class="field"><label>تطبيق المبلغ الجديد</label><div class="seg"><button class="n" data-rscope="from" aria-pressed="${scope==='from'}">من ${esc(MONTHS[+S.month.slice(5)-1])} فصاعدًا</button><button class="n" data-rscope="only" aria-pressed="${scope==='only'}">${esc(MONTHS[+S.month.slice(5)-1])} فقط</button></div><span class="note">${scope==='from'?'الأشهر السابقة تبقى بمبلغها القديم '+money(amtAt(ex,shiftMonth(S.month,-1)))+'.':'يعود المبلغ '+money(amtAt(ex,S.month))+' في الشهر التالي.'}</span></div>`:'';
  const recPreview=()=>{const a=parseAmt(r.amount);if(!a)return '';const ms=[];for(let i=0,m=S.month;i<4;i++,m=shiftMonth(m,1)){const on=(!r.start||m>=r.start)&&(!r.until||m<=r.until);if(on)ms.push(MONTHS[+m.slice(5)-1]+' '+money(scope==='only'&&ex&&m!==S.month?amtAt(ex,m):a))}
    const nM=r.until?monthsSpan(r.start||S.month,r.until):0;
    return '🔁 يتكرر كل شهر'+(r.until?' حتى '+monthName(r.until)+' ('+countWord(nM,'شهر واحد','شهران','أشهر','شهرًا')+' · المجموع '+money(a*nM)+' '+CUR+')':' بشكل مستمر')+(ms.length?': '+ms.join(' · ')+(r.until&&r.until<=shiftMonth(S.month,3)?'':' …'):'')};
  const draw=()=>{L.innerHTML=`${sheetTop('التزام شهري')}
   <h2 style="margin-top:0">${ex?'تعديل الالتزام':'التزام شهري جديد'}</h2><div class="stack">
   <div class="field"><label for="rName">الاسم</label><input class="inp" id="rName" value="${esc(r.name)}" placeholder="مثال: اشتراك النادي" maxlength="40"></div>
   <div class="row2"><div class="field"><label for="rAmt">المبلغ الشهري${k.variable?' (تقريبي)':''}</label><input class="inp num" id="rAmt" inputmode="decimal" value="${r.amount!==''?esc(r.amount):''}" placeholder="0.000" style="text-align:left"></div>
   <div class="field"><label for="rDay">يوم الدفع في الشهر</label><input class="inp num" id="rDay" type="number" min="1" max="31" value="${esc(r.day)}" style="text-align:left"></div></div>
   <div id="rScopeBox">${scopeHtml()}</div>
   ${arrQHtml('r',r.arrQ!==undefined?r.arrQ:+r.arrears>0,r.arrears,'المبلغ المتأخر من الأشهر الماضية كما في الفاتورة أو الكشف. يُضاف لمستحق هذا الشهر، ويُخصم منه كل ما تدفعه.')}
   <div class="field"><label>مدة التكرار</label><div class="chips durchips">${REC_DUR.map(([n,t])=>`<button class="chip" type="button" data-rdur="${n}" aria-pressed="${n?!!r.until&&monthsSpan(r.start||S.month,r.until)===n:!r.until}">${t}</button>`).join('')}<input class="inp num" id="rCount" type="number" min="1" max="600" inputmode="numeric" placeholder="عدد الأشهر" value="${r.until&&!REC_DUR.some(([n])=>n&&monthsSpan(r.start||S.month,r.until)===n)?monthsSpan(r.start||S.month,r.until):''}" aria-label="عدد أشهر التكرار" style="width:110px;padding:6px 10px"></div></div>
   <div class="row2"><div class="field"><label for="rStart">يبدأ من شهر</label><input class="inp" type="month" id="rStart" value="${esc(r.start||'')}"></div>
   <div class="field"><label for="rUntil">ينتهي في شهر (اختياري)</label><input class="inp" type="month" id="rUntil" value="${esc(r.until||'')}" placeholder="مستمر"></div></div>
   <div class="recprev" id="rPrev">${recPreview()}</div>
   <div class="stack recadv"><h3 style="margin:6px 0 0">خيارات إضافية</h3>
   <div class="field"><label for="rRemind">يوم التذكير</label><input class="inp num" id="rRemind" type="number" min="1" max="31" value="${esc(r.remind||Math.max(1,(+r.day||1)-2))}" style="text-align:left"></div>
   <div class="field"><label for="rBill">مبلغ فاتورة ${esc(monthName(S.month))}${k.variable?' (من الفاتورة الفعلية)':' (إن اختلف)'}</label><input class="inp num" id="rBill" inputmode="decimal" value="${(r.bills||{})[S.month]!==undefined?amtIn(r.bills[S.month]):''}" placeholder="${r.amount!==''?esc(r.amount):'0.000'}" style="text-align:left"></div>
   <p class="note" style="margin:0">المتأخرات: المبلغ المستحق السابق كما يظهر في الفاتورة (مثل الكهرباء والمياه). يُضاف لفاتورة الشهر، ويُخصم منه كل ما تدفعه، فتعرف المتبقي عليك بالضبط.</p>
   <div class="row2"><div class="field"><label for="rCat">الفئة</label><select class="inp" id="rCat">${EXP_CATS.map(c=>`<option value="${c.id}" ${r.cat===c.id?'selected':''}>${esc(c.n)}</option>`).join('')}</select></div>
   <div class="field"><label for="rPerson">لمن؟</label><select class="inp" id="rPerson"><option value="">لي / للبيت</option>${people().map(p=>`<option value="${esc(p.id)}" ${r.person===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div></div>
   ${k.variable?'<p class="note" style="margin:0">المبلغ يتغير كل شهر، لذلك عند الضغط على «دفعت» تكتب المبلغ الفعلي من الفاتورة.</p>':''}</div>
   <p class="note" id="rErr" hidden style="color:var(--exp);margin:0"></p>
   <button class="btn block" id="rSave">حفظ</button>
   ${ex?(askDel?'<div class="confirm"><span>حذف هذا الالتزام؟ تبقى الدفعات السابقة في السجل.</span><div class="row2"><button class="btn danger" id="rDel">نعم، احذف</button><button class="btn ghost" id="rDelNo">تراجع</button></div></div>':'<button class="btn ghost block" id="rDelAsk" style="color:var(--exp)">حذف الالتزام</button>'):'<button class="btn ghost block" data-close>إلغاء</button>'}
   </div></div></div>`};
  const grab=()=>{r.arrQ=!!document.querySelector('#rArrBox:not([hidden])');r.name=document.getElementById('rName').value;r.amount=document.getElementById('rAmt').value;r.start=document.getElementById('rStart').value;r.until=document.getElementById('rUntil').value;r.day=document.getElementById('rDay').value;r.remind=document.getElementById('rRemind').value;r.arrearsIn=document.getElementById('rArr').value;r.billIn=document.getElementById('rBill').value;r.cat=document.getElementById('rCat').value;r.person=document.getElementById('rPerson').value};
  const live=()=>{grab();const p=document.getElementById('rPrev');if(p)p.innerHTML=recPreview();const sb=document.getElementById('rScopeBox');if(sb)sb.innerHTML=scopeHtml()};
  L.onchange=e=>{if(['rAmt','rStart','rUntil'].includes(e.target.id))live()};
  L.oninput=e=>{if(e.target.id==='rCount'){const n=parseInt(e.target.value);const st=document.getElementById('rStart').value||S.month;document.getElementById('rUntil').value=n>0?shiftMonth(st,Math.min(600,n)-1):'';live();L.querySelectorAll('[data-rdur]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.rdur===(n>0?n:0)));return}
    if(['rAmt','rStart','rUntil'].includes(e.target.id))live()};
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.rscope){grab();scope=x.dataset.rscope;live();return}
    if(x.dataset.arrq){arrQToggle(x);return}
    if(x.dataset.rdur!==undefined){grab();const n=+x.dataset.rdur;if(!r.start)r.start=S.month;r.until=n?shiftMonth(r.start,n-1):'';draw();return}
    if(x.id==='rDelAsk'){grab();askDel=true;draw();return}
    if(x.id==='rDelNo'){grab();askDel=false;draw();return}
    if(x.id==='rDel'){S.settings.recurring=R.filter(y=>y.id!==r.id);L.innerHTML='';putSettings();render();toast('حُذف الالتزام');return}
    if(x.id==='rSave'){grab();const er=document.getElementById('rErr');const amt=parseAmt(r.amount);const day=Math.min(31,Math.max(1,parseInt(r.day)||1));
      if(!r.name.trim()){er.hidden=false;er.textContent='اكتب اسم الالتزام';return}
      if(!amt){er.hidden=false;er.textContent='اكتب المبلغ الشهري، مثل 25.000';return}
      if(r.until&&r.start&&r.until<r.start){er.hidden=false;er.textContent='شهر النهاية قبل شهر البداية';return}
      const bills=Object.assign({},r.bills||{});const amtHist=Object.assign({},(ex&&ex.amtHist)||{});let base=amt;const changed=ex&&Math.abs(amt-amtAt(ex,S.month))>0.0005;
      if(changed){if(scope==='only'){bills[S.month]=amt;base=+ex.amount||amt}else{if(!Object.keys(amtHist).length)amtHist[ex.start||'0000-01']=+ex.amount||0;Object.keys(amtHist).filter(x=>x>S.month).forEach(x=>delete amtHist[x]);amtHist[S.month]=amt;delete bills[S.month]}}
      else if(ex)base=+ex.amount||amt;
      if(String(r.billIn||'').trim()!=='')bills[S.month]=parseAmt(r.billIn);else if(!(changed&&scope==='only'))delete bills[S.month];
      const arrIn=r.arrQ?String(r.arrearsIn||'').trim():'';const arrears=arrIn===''?0:parseAmt(arrIn);
      const rec={id:r.id,kind:r.kind,name:r.name.trim(),amount:base,amtHist,start:r.start||'',until:r.until||'',cat:r.cat,day,person:r.person||'',half:!!r.half,later:r.later||{},remind:Math.min(31,Math.max(1,parseInt(r.remind)||Math.max(1,day-2))),arrears,since:(ex&&ex.since&&+ex.arrears===arrears)?ex.since:S.month,bills};if(!ex)recLog(rec,'أُضيف الالتزام بمبلغ '+rial(amt)+' شهريًا'+(rec.start?' من '+monthName(rec.start):''));else{rec.log=(ex.log||[]).slice();
        if(changed)recLog(rec,scope==='only'?'مبلغ '+monthName(S.month)+' فقط: '+rial(amt)+' (بدل '+money(amtAt(ex,S.month))+')':'تغيير المبلغ من '+money(amtAt(ex,S.month))+' إلى '+rial(amt)+' من '+monthName(S.month));
        if(Math.abs((+ex.arrears||0)-arrears)>0.0005)recLog(rec,'تعديل المتأخرات السابقة إلى '+rial(arrears));
        if((ex.bills||{})[S.month]!==bills[S.month]&&bills[S.month]!==undefined&&!(changed&&scope==='only'))recLog(rec,'فاتورة '+monthName(S.month)+': '+rial(bills[S.month]));
        if(+ex.day!==day)recLog(rec,'تغيير يوم الدفع إلى '+day);
        if((ex.until||'')!==(rec.until||''))recLog(rec,rec.until?'ينتهي في '+monthName(rec.until):'صار مستمرًا بلا نهاية')}
      const i=R.findIndex(y=>y.id===r.id);if(i>=0)R[i]=rec;else R.push(rec);
      L.innerHTML='';putSettings();render();toast('حُفظ '+rec.name)}};
  draw();
}
function recTx(r,m){const tx={id:uidGen(),type:'exp',amount:+r.amount,cat:r.cat,date:m===ym(new Date())?today():recDate(r,m),method:'transfer',note:r.name,createdAt:new Date().toISOString(),rec:r.id};if(r.person)tx.person=r.person;return tx}
/* دفع الالتزامات الشهرية: نافذة منظمة فيها المستحق والمتبقي، ثم تأكيد، ثم «تراجع» إذا أخطأت */
function recState(r,m){const pays=recPays(r).filter(t=>t.date.slice(0,7)===m).sort((a,b)=>a.date.localeCompare(b.date));const L=billLedger(r,m);
  if(L)return{bill:L.bill,prev:L.prev,total:L.total,paid:L.paid,due:r3(Math.max(0,L.remaining)),credit:r3(Math.max(0,-L.remaining)),pays,tracked:true};
  const paid=r3(pays.reduce((s,t)=>s+(+t.amount),0)),bill=+r.amount||0;return{bill,prev:0,total:bill,paid,due:r3(Math.max(0,bill-paid)),credit:0,pays,tracked:false}}
function payRec(id,m){openRecPay(id,m||S.month)}
function openRecPay(id,m){const r=recs().find(x=>x.id===id);if(!r)return;const L=document.getElementById('layer');
  const cur=m===ym(new Date());let st=recState(r,m);let amt=r.half&&!st.paid&&st.due>0?r3(st.due/2):(st.due||st.bill),half=!!r.half,later=(r.later||{})[m]||(()=>{const pc=payCycle();if(pc&&pc.next.slice(0,7)>=m)return pc.next;const d=new Date();d.setDate(d.getDate()+7);return isoD(d)})(),date=cur?today():recDate(r,m),method=S.settings.lastMethod||'transfer',note='',step='form';
  const after=()=>r3(st.due-amt);
  const prevTxt=()=>!amt?'اكتب مبلغ الدفعة.':Math.abs(after())<0.0005?'<b class="amt-inc">تُسدَّد الفاتورة بالكامل ✓</b>':after()>0?`يبقى عليك <b class="num">${amtH(after())}</b> بعد هذه الدفعة، ويظهر في «بانتظار الدفع».`:`دفعت أكثر من المستحق بـ <b class="num">${amtH(-after())}</b>${st.tracked?'، ويُحسب رصيدًا لك في فاتورة الشهر القادم.':'. تأكد من المبلغ.'}`;
  const draw=()=>{const k=REC_KINDS[r.kind]||{};
   L.innerHTML=`${sheetTop('دفع '+r.name)}
    <h2 style="margin-top:0">دفع ${esc(r.name)}</h2><div class="note" style="margin:-6px 0 10px">${esc(monthName(m))} · موعده يوم ${+r.day||1}</div>
    ${step==='form'?`
    <div class="panel paybk">
      <div class="sumrow"><span>فاتورة ${esc(MONTHS[+m.slice(5)-1])}${k.variable&&!(r.bills||{})[m]?' (تقريبية)':''}</span><b class="num">${amtH(st.bill)}</b></div>
      ${st.prev>0.0005?`<div class="sumrow"><span>متأخرات سابقة</span><b class="num amt-exp">+ ${money(st.prev)}</b></div>`:st.prev<-0.0005?`<div class="sumrow"><span>رصيد لك من قبل</span><b class="num amt-inc">− ${money(-st.prev)}</b></div>`:''}
      ${st.paid>0.0005?`<div class="sumrow"><span>دفعت سابقًا هذا الشهر</span><b class="num">− ${money(st.paid)}</b></div>${st.pays.map(t=>`<div class="sumrow sub"><span>${fmtD(t.date)} · ${esc((METHODS.find(x=>x[0]===t.method)||['',''])[1])}</span><span class="num">${amtH(t.amount)}</span></div>`).join('')}`:''}
      <div class="sumrow total"><span>المستحق الآن</span><b class="num">${amtH(st.due)}</b></div>
      ${k.variable||st.prev?`<button class="chip" data-rpedit="1" style="margin-top:6px">تعديل مبلغ الفاتورة أو المتأخرات</button>`:''}</div>
    <div class="amtbox"><input id="rpAmt" inputmode="decimal" value="${amt?amtIn(amt):''}" placeholder="0.000" aria-label="مبلغ الدفعة"><span>${CUR}</span></div>
    <div class="chips" style="justify-content:center">${st.due?`<button class="chip" data-rpamt="${st.due}">كامل المستحق</button>`:''}${st.prev>0.0005&&st.bill<st.due?`<button class="chip" data-rpamt="${st.bill}">فاتورة الشهر فقط</button>`:''}${st.due>2?`<button class="chip" data-rpamt="${r3(st.due/2)}">النصف</button>`:''}</div>
    <div class="payprev" id="rpPrev">${prevTxt()}</div>
    <div class="stack" style="margin-top:10px">
     <div id="rpLater" ${amt&&after()>0.0005?'':'hidden'} class="field"><label for="rpLaterD">ذكّرني بالمتبقي يوم</label><input class="inp" type="date" id="rpLaterD" value="${esc(later)}"><span class="note">${payCycle()?'الافتراضي: يوم نزول الراتب القادم.':'يظهر التذكير في الرئيسية ويصلك إشعار في هذا اليوم.'}</span></div>
     <label class="toggle"><input type="checkbox" id="rpHalf" ${half?'checked':''}><span>عادةً أدفع النصف: اجعل نصف المبلغ هو الافتراضي لهذه الفاتورة</span></label>
     <div class="seg seg3">${METHODS.map(([v,n])=>`<button class="n" data-rpm="${v}" aria-pressed="${method===v}">${n}</button>`).join('')}</div>
     <div class="row2"><div class="field"><label for="rpDate">تاريخ الدفع</label><input class="inp" type="date" id="rpDate" value="${esc(date)}"></div>
     <div class="field"><label for="rpNote">ملاحظة (اختياري)</label><input class="inp" id="rpNote" value="${esc(note)}" placeholder="رقم الإيصال مثلًا" maxlength="60"></div></div>
     <p class="note" id="rpErr" hidden style="color:var(--exp);margin:0"></p></div>
    <div class="actions"><button class="btn block" id="rpNext">متابعة</button><button class="btn ghost block" data-close>إلغاء</button></div>`
    :`<div class="confirmpay"><span class="note">راجع الدفعة قبل الحفظ</span><b class="num">${money(amt)} <small>${CUR}</small></b>
      <div class="sumrow"><span>الالتزام</span><b>${esc(r.name)}</b></div><div class="sumrow"><span>التاريخ</span><b>${fmtD(date)}</b></div>
      <div class="sumrow"><span>طريقة الدفع</span><b>${esc((METHODS.find(x=>x[0]===method)||['',''])[1])}</b></div>${note?`<div class="sumrow"><span>ملاحظة</span><b>${esc(note)}</b></div>`:''}
      <div class="sumrow total"><span>${after()>=-0.0005?'المتبقي بعدها':'رصيد لك بعدها'}</span><b class="num ${after()>0.0005?'amt-exp':'amt-inc'}">${amtH(Math.abs(after()))}</b></div>
      ${after()>0.0005?`<div class="sumrow"><span>تذكيرك بالمتبقي</span><b>${fmtD(later)}</b></div>`:''}
      <div class="note">سيُسجَّل مصروفًا في فئة «${esc(catOf(r.cat).n)}». يمكنك التراجع بعد الحفظ.</div></div>
    <div class="actions"><button class="btn block" id="rpSave">تأكيد الدفع</button><button class="btn ghost block" id="rpBack">رجوع للتعديل</button></div>`}
    </div></div>`};
  const grab=()=>{const a=document.getElementById('rpAmt');if(a)amt=parseAmt(a.value);const lt=document.getElementById('rpLaterD');if(lt&&lt.value)later=lt.value;const hf=document.getElementById('rpHalf');if(hf)half=hf.checked;const d=document.getElementById('rpDate');if(d)date=d.value||date;const n=document.getElementById('rpNote');if(n)note=n.value.trim()};
  draw();
  L.onchange=null;
  const syncLater=()=>{const b=document.getElementById('rpLater');if(b)b.hidden=!(amt&&after()>0.0005)};
  L.oninput=e=>{if(e.target.id==='rpAmt'){amt=parseAmt(e.target.value);const p=document.getElementById('rpPrev');if(p)p.innerHTML=prevTxt();syncLater()}};
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.rpamt){amt=+x.dataset.rpamt;document.getElementById('rpAmt').value=amtIn(amt);document.getElementById('rpPrev').innerHTML=prevTxt();syncLater();return}
    if(x.dataset.rpm){grab();method=x.dataset.rpm;draw();return}
    if(x.dataset.rpedit){L.innerHTML='';openRec(r.id);return}
    if(x.id==='rpNext'){grab();const er=document.getElementById('rpErr');if(!amt){er.hidden=false;er.textContent='اكتب مبلغ الدفعة';return}
      if(date.slice(0,7)!==m){er.hidden=false;er.textContent='التاريخ يجب أن يكون في '+monthName(m);return}step='confirm';draw();return}
    if(x.id==='rpBack'){step='form';draw();return}
    if(x.id==='rpSave'){x.disabled=true;r.half=half;r.later=Object.assign({},r.later||{});if(after()>0.0005)r.later[m]=later;else delete r.later[m];await putSettings();const t=recTx(r,m);t.amount=amt;t.date=date;t.method=method;if(note)t.note=r.name+' · '+note;S.settings.lastMethod=method;
      await putTx(t);L.innerHTML='';st=recState(r,m);
      toast(st.due>0.0005?'سُجّلت دفعة '+rial(amt)+'، المتبقي '+rial(st.due)+'، سأذكّرك '+fmtD(later):(()=>{const nx=nextDueTxt({kind:'rec',id:r.id},m);return 'شكرًا على الدفع ✓ سُدّد '+r.name+' بالكامل'+(nx?' · التالي '+rial(nx.amt)+' بتاريخ '+dmy(nx.date):'')})(),async()=>{await delTx(t.id);toast('أُلغيت الدفعة')},9000)}}}
/* كل التزام شهري خانة واحدة: أيقونته، ودفعاته، وتعديلاته، وسجل أشهره؛ ومنها يُطبع كشفه */
const REC_IC={wifi:['wifi','#3E7CB1'],phone:['phone','#6B5CA5'],elec:['bolt','#C9881E'],water:['drop','#2E8BB5'],rent:['home','#2F7F7A'],maid:['family','#8A4F7D'],loan:['loan','#8A4F7D'],family:['family','#B0662F']};
/* اختيار نوع الالتزام: كل الأنواع متاحة دائمًا ويمكن تكرارها (مثل كهرباء لبيتين) */
const SEC_KINDS={bills:['elec','water','wifi','phone','rent','custom'],family:['family','maid'],other:['custom']};
const SEC_NAME={get bills(){return lbl('msec.bills')},get family(){return lbl('msec.family')},get debt(){return lbl('msec.debt')},get other(){return lbl('msec.other')}};
function secClosed(k){try{return (JSON.parse(localStorage.getItem('masareef:msec')||'{}'))[k]===1}catch(e){return false}}
function secToggle(k){let o={};try{o=JSON.parse(localStorage.getItem('masareef:msec')||'{}')}catch(e){}o[k]=o[k]===1?0:1;try{localStorage.setItem('masareef:msec',JSON.stringify(o))}catch(e){}return o[k]===1}
function openRecPick(sec){if(sec==='debt'){openDebt();return}if(sec==='other'){openRec(null,'custom');return}const L=document.getElementById('layer');const have={};recs().forEach(r=>have[r.kind]=(have[r.kind]||0)+1);
  L.innerHTML=`${sheetTop('إضافة التزام')}<h2 style="margin-top:0">${sec?'إضافة في '+SEC_NAME[sec]:'إضافة التزام شهري'}</h2>
   <div class="recpick">${Object.entries(REC_KINDS).filter(([k])=>k!=='loan'&&(!sec||SEC_KINDS[sec].includes(k))).map(([k,v])=>`<button class="rp" data-radd="${k}">${recBadge({kind:k,cat:v.cat})}<b>${esc(v.n)}</b>${have[k]?`<small>عندك ${have[k]}</small>`:''}</button>`).join('')}
   ${sec?'':`<button class="rp" data-dadd="1">${debtBadge({type:'other'})}<b>دين أو قسط</b><small>${debts().length?'عندك '+debts().length:''}</small></button>`}</div>
   <p class="note">يمكنك إضافة نفس النوع أكثر من مرة، مثل كهرباء لبيتين أو اشتراكين مختلفين، وتسميته باسم مختلف.</p>
   <div class="actions"><button class="btn ghost block" data-close>إغلاق</button></div></div></div>`;
  L.oninput=L.onchange=null;
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.radd){openRec(null,x.dataset.radd);return}if(x.dataset.dadd){L.innerHTML='';openDebt();return}}}
function recBadge(r){const k=REC_IC[r.kind];const c=k?k[1]:catOf(r.cat).c;return ovBadge('rec:'+r.id,`<span class="cbadge" style="background:${c}1f;color:${c}">${svgI(CI[k?k[0]:r.cat]||CI.other)}</span>`)}
/* سجل التحديثات: يُحفظ داخل الالتزام نفسه */
function recLog(r,t){if(!r)return;r.log=(r.log||[]).concat([{at:today(),t}]).slice(-80)}
/* أشهر الالتزام من بدايته حتى الشهر المعروض (آخر 12 شهرًا) مع الفاتورة والمدفوع والمتبقي */
function recHistory(r,upTo){const pays=recPays(r);const first=[r.start,r.since,...pays.map(t=>t.date.slice(0,7))].filter(Boolean).sort()[0]||upTo;
  const out=[];for(let m=upTo,k=0;m>=first&&k<12;m=shiftMonth(m,-1),k++){if(!recActive(r,m))continue;const P=pays.filter(t=>t.date.slice(0,7)===m).sort((a,b)=>a.date.localeCompare(b.date));const L=billLedger(r,m);
    const paid=r3(P.reduce((s,t)=>s+(+t.amount),0)),bill=billAmt(r,m);
    out.push({m,bill,prev:L?L.prev:0,total:L?L.total:bill,paid,remaining:L?L.remaining:r3(Math.max(0,bill-paid)),pays:P,tracked:!!L})}
  return out}
function recHistHtml(r,m){const H=recHistory(r,m);const lg=(r.log||[]).slice().reverse();
  return `<details class="rechist"><summary>سجل الالتزام <span class="note">(${countWord(H.length,'شهر واحد','شهران','أشهر','شهرًا')}${lg.length?' · '+countWord(lg.length,'تحديث واحد','تحديثان','تحديثات','تحديثًا'):''})</span></summary>
   <div class="rh-list">${H.map(h=>`<div class="rh-m${h.m===m?' cur':''}"><div class="rh-top"><b>${esc(monthName(h.m))}</b><span class="pill ${h.remaining<=0.0005?'paid':h.paid?'soon':'late'}">${h.remaining<=0.0005?'مدفوع':h.paid?'باقٍ '+money(h.remaining):'لم يُدفع'}</span></div>
     <div class="note">فاتورة ${rial(h.bill)}${h.prev>0.0005?' + متأخرات '+money(h.prev):h.prev<-0.0005?' − رصيد '+money(-h.prev):''}${Math.abs(h.prev)>0.0005?' = '+rial(h.total):''} · دفعت ${rial(h.paid)}</div>
     ${h.pays.length?`<div class="paylist">${h.pays.map(t=>`<span class="paychip"><button class="pce" data-txedit="${esc(t.id)}" aria-label="تعديل الدفعة"><span class="num">${amtH(t.amount)}</span> · ${fmtD(t.date)}${t.pend?' ⏳':''} ✎</button><button data-txdel="${esc(t.id)}" aria-label="حذف الدفعة">✕</button></span>`).join('')}</div>`:''}</div>`).join('')}</div>
   ${lg.length?`<div class="rh-log"><b>التحديثات</b>${lg.slice(0,8).map(x=>`<div class="sumrow sub"><span>${esc(x.t)}</span><span>${fmtD(x.at)}</span></div>`).join('')}</div>`:''}
   <div class="chips" style="margin:8px 0 0"><button class="chip" data-recprint="${esc(r.id)}">كشف للطباعة</button></div></details>`}
/* كشف التزام واحد للطباعة أو الحفظ PDF، من نفس بيانات الخانة */
function printRec(id){const r=recs().find(x=>x.id===id);if(!r)return;const now=new Date();const H=recHistory(r,ym(now)).reverse();const N=v=>`<span class="n">${money(v)}</span>`;
  const sp=H.reduce((s,h)=>s+h.paid,0),last=H[H.length-1];
  let body=`<header class="rh"><div><div class="rapp">إدارة شؤوني</div><h1>كشف التزام: ${esc(r.name)}</h1><div class="rper">${esc(catOf(r.cat).n)} · يوم الدفع ${+r.day||1} · ${r.until?'حتى '+monthName(r.until):'شهري مستمر'}</div></div><div class="rmeta">أُعدّ في ${fmtD(today())} الساعة ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}<br>العملة: الريال العُماني (ر.ع.)</div></header>
   <section><h2>الملخص</h2><div class="kpis"><div><span>المبلغ الشهري الحالي</span><b>${N(amtAt(r,ym(now)))}</b></div><div><span>مجموع ما دفعته</span><b>${N(sp)}</b></div><div><span>المتبقي عليك الآن</span><b class="${last&&last.remaining>0.0005?'no':'ok'}">${N(Math.max(0,last?last.remaining:0))}</b></div><div><span>عدد الأشهر</span><b>${H.length}</b></div></div></section>
   <section class="txs"><h2>الأشهر والدفعات</h2><table><thead><tr><th>الشهر</th><th>الفاتورة</th><th>متأخرات سابقة</th><th>المستحق</th><th>المدفوع</th><th>المتبقي</th><th>الدفعات</th></tr></thead><tbody>${H.map(h=>`<tr><td class="nw">${esc(monthName(h.m))}</td><td>${N(h.bill)}</td><td>${h.prev?N(h.prev):'—'}</td><td>${N(h.total)}</td><td>${N(h.paid)}</td><td class="${h.remaining>0.0005?'no':'ok'}">${N(Math.max(0,h.remaining))}</td><td>${h.pays.map(t=>money(t.amount)+' ('+fmtD(t.date)+')').join('<br>')||'—'}</td></tr>`).join('')}</tbody><tfoot><tr><td>المجموع</td><td>${N(H.reduce((s,h)=>s+h.bill,0))}</td><td></td><td></td><td>${N(sp)}</td><td></td><td></td></tr></tfoot></table></section>
   ${(r.log||[]).length?`<section><h2>سجل التحديثات</h2><table><thead><tr><th>التاريخ</th><th>التحديث</th></tr></thead><tbody>${r.log.map(x=>`<tr><td class="nw">${fmtD(x.at)}</td><td>${esc(x.t)}</td></tr>`).join('')}</tbody></table></section>`:''}
   <footer class="rf">كشف من تطبيق «إدارة شؤوني»${S.settings.printDev===false?'':`<br>تصميم وتطوير: ${DEV.name}، ${DEV.title} · ${DEV.country}`}</footer>`;
  prStyle('portrait');let el=document.getElementById('printArea');if(!el){el=document.createElement('div');el.id='printArea';document.body.appendChild(el)}
  el.className='rep';el.innerHTML=body;const old=document.title;document.title='كشف '+r.name;window.addEventListener('afterprint',()=>{document.title=old},{once:true});
  try{window.print()}catch(e){toast('تعذّرت الطباعة هنا')}setTimeout(()=>{document.title=old},3000)}
/* تعديل دفعة مسجلة: المبلغ والتاريخ والطريقة، مع المتبقي بعد التعديل وزر تراجع */
function openPayEdit(txId){const t0=S.tx[txId];if(!t0)return;const r=recs().find(x=>x.id===t0.rec);const m=t0.date.slice(0,7);const L=document.getElementById('layer');
  let amt=+t0.amount,date=t0.date,method=t0.method||'transfer';
  const base=()=>{if(!r)return null;const st=recState(r,m);return r3(st.total-(st.paid-(+t0.amount)))};
  const left=()=>base()===null?null:r3(base()-amt);
  const prev=()=>left()===null?'':Math.abs(left())<0.0005?'<b class="amt-inc">بعد التعديل تُسدَّد الفاتورة بالكامل ✓</b>':left()>0?'بعد التعديل يبقى عليك <b class="num">'+amtH(left())+'</b>':'بعد التعديل يصبح لك رصيد زائد <b class="num">'+amtH(-left())+'</b>';
  const draw=()=>{L.innerHTML=`${sheetTop('تعديل دفعة')}<h2 style="margin-top:0">تعديل دفعة ${esc(r?r.name:(t0.note||catOf(t0.cat).n))}</h2>
    <div class="note" style="margin:-6px 0 10px">المسجّل حاليًا ${rial(t0.amount)} بتاريخ ${fmtD(t0.date)}</div>
    <div class="amtbox"><input id="peAmt" inputmode="decimal" value="${amtIn(amt)}" aria-label="المبلغ"><span>${CUR}</span></div>
    <div class="payprev" id="pePrev">${prev()}</div>
    <div class="stack" style="margin-top:8px"><div class="seg seg3">${METHODS.map(([v,n])=>`<button class="n" data-pem="${v}" aria-pressed="${method===v}">${n}</button>`).join('')}</div>
     <div class="field"><label for="peDate">تاريخ الدفع</label><input class="inp" type="date" id="peDate" value="${esc(date)}"></div>
     <p class="note" id="peErr" hidden style="color:var(--exp);margin:0"></p></div>
    <div class="actions"><button class="btn block" id="peSave">حفظ التعديل</button><button class="btn ghost block" id="peDel" style="color:var(--exp)">حذف الدفعة</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`};
  draw();L.onchange=null;
  L.oninput=e=>{if(e.target.id==='peAmt'){amt=parseAmt(e.target.value);const p=document.getElementById('pePrev');if(p)p.innerHTML=prev()}};
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.pem){amt=parseAmt(document.getElementById('peAmt').value);date=document.getElementById('peDate').value||date;method=x.dataset.pem;draw();return}
    if(x.id==='peDel'){openPayDel(txId);return}
    if(x.id==='peSave'){amt=parseAmt(document.getElementById('peAmt').value);date=document.getElementById('peDate').value||date;const er=document.getElementById('peErr');
      if(!amt){er.hidden=false;er.textContent='اكتب المبلغ، أو اختر «حذف الدفعة»';return}
      if(r&&date.slice(0,7)!==m){er.hidden=false;er.textContent='التاريخ يجب أن يبقى في '+monthName(m);return}
      const lft=left();const old=Object.assign({},t0);const t=Object.assign({},t0,{amount:amt,date,method});if(r){recLog(r,'تعديل دفعة '+fmtD(t0.date)+' من '+money(t0.amount)+' إلى '+rial(amt)+(date!==t0.date?' وتاريخها '+fmtD(date):''));await putSettings()}await putTx(t);L.innerHTML='';
      toast(r?(lft>0.0005?'عُدّلت الدفعة إلى '+rial(amt)+'، المتبقي '+rial(lft):'عُدّلت الدفعة إلى '+rial(amt)):'عُدّلت الدفعة',async()=>{if(r){r.log=(r.log||[]).slice(0,-1);await putSettings()}await putTx(old);toast('أُعيدت الدفعة كما كانت')},9000)}}}
/* حذف دفعة خاطئة لاحقًا من سجل الالتزام */
/* إلغاء الدفع: يرجع الالتزام أو القسط «غير مدفوع» لأي شهر إذا ضغطت «دفعت» بالخطأ */
function openUnpay(kind,id,m){const L=document.getElementById('layer');const r=kind==='rec'?recs().find(x=>x.id===id):null,d=kind==='debt'?debts().find(x=>x.id===id):null;if(!r&&!d)return;
  const P=r?recPays(r).filter(t=>t.date.slice(0,7)===m).sort((a,b)=>a.date.localeCompare(b.date)):debtPays(d).filter(p=>p.date&&p.date.slice(0,7)===m);
  if(!P.length){toast('لا توجد دفعات في '+monthName(m));return}
  const amt=p=>r?+p.amount:+p.amt;const tot=r3(P.reduce((s,p)=>s+amt(p),0));const name=r?r.name:'قسط '+d.name;
  L.innerHTML=`${sheetTop('إلغاء الدفع')}<h2 style="margin-top:0">إرجاع «${esc(name)}» غير مدفوع؟</h2>
   <div class="panel paybk"><div class="sumrow"><span>الشهر</span><b>${esc(monthName(m))}</b></div>
    ${P.map(p=>`<div class="sumrow sub"><span>دفعة ${fmtD(p.date)}</span><span class="num">${money(amt(p))}</span></div>`).join('')}
    <div class="sumrow total"><span>${P.length>1?'مجموع الدفعات التي ستُلغى':'الدفعة التي ستُلغى'}</span><b class="num">${money(tot)}</b></div></div>
   <p class="note">${r?'يُحذف المصروف من السجل، ويرجع الالتزام إلى «بانتظار الدفع» بمستحقه كاملًا كما كان.':'تُحذف الدفعة ومصروفها، ويرجع المبلغ إلى المتبقي من الدين، ويرجع القسط إلى «بانتظار الدفع».'} يمكنك التراجع بعدها.</p>
   <div class="actions"><button class="btn danger block" id="upYes">نعم، ألغِ الدفع</button><button class="btn ghost block" data-close>رجوع</button></div></div></div>`;
  L.oninput=L.onchange=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id!=='upYes')return;x.disabled=true;
    const txs=(r?P.map(t=>t.id):P.map(p=>p.tx).filter(Boolean)).map(k=>S.tx[k]).filter(Boolean).map(t=>Object.assign({},t));
    const snap=JSON.stringify({recurring:S.settings.recurring||[],debts:debts()});
    if(r){for(const t of P)await delTx(t.id);recLog(r,'إلغاء دفع '+monthName(m)+': '+countWord(P.length,'دفعة واحدة','دفعتان','دفعات','دفعة')+' بمجموع '+money(tot)+'، ورجع غير مدفوع')}
    else for(const p of P.slice())await delDebtPay(d,p);
    await putSettings();L.innerHTML='';render();
    toast('رجع «'+name+'» غير مدفوع لشهر '+monthName(m),async()=>{const o=JSON.parse(snap);S.settings.recurring=o.recurring;S.settings.debts=o.debts;txs.forEach(t=>delete S.del[t.id]);await putTxMany(txs);await putSettings();render();toast('أُعيدت الدفعات')},9000)}}
function openPayDel(txId){const t=S.tx[txId];if(!t)return;const L=document.getElementById('layer');
  L.innerHTML=`${sheetTop('حذف دفعة')}<h2 style="margin-top:0">حذف هذه الدفعة؟</h2>
   <div class="panel"><div class="sumrow"><span>${esc(t.note||catOf(t.cat).n)}</span><b class="num">${amtH(t.amount)}</b></div><div class="sumrow"><span>التاريخ</span><b>${fmtD(t.date)}</b></div></div>
   <p class="note">يعود المبلغ إلى «المستحق» في هذا الالتزام، ويُحذف المصروف من السجل.</p>
   <div class="actions"><button class="btn danger block" id="pdYes">نعم، احذف الدفعة</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`;
  L.oninput=L.onchange=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='pdYes'){const copy=Object.assign({},t);const rr=recs().find(y=>y.id===t.rec);if(rr){recLog(rr,'حذف دفعة '+rial(t.amount)+' بتاريخ '+fmtD(t.date));await putSettings()}await delTx(t.id);L.innerHTML='';toast('حُذفت الدفعة',async()=>{if(rr){rr.log=(rr.log||[]).slice(0,-1);await putSettings()}delete S.del[copy.id];await putTx(copy);toast('أُعيدت الدفعة')},9000)}}}
function payAll(){const m=S.month,cur=m===ym(new Date());const L=document.getElementById('layer');
  const items=monthItems(m).filter(i=>!i.isPaid&&(!payLocked(i,m)||(admOn()&&admOpen()))).map(i=>{if(i.kind==='rec'){const st=recState(i.ref,m);return{i,amt:st.due}}const d=i.ref;return{i,amt:r3(Math.min(d.mode==='once'?+d.balance:+d.payment||0,(+d.balance)*(1+(+d.rate||0)/1200)))}}).filter(x=>x.amt>0);
  if(!items.length){toast('لا يوجد ما يُدفع');return}const tot=items.reduce((s,x)=>s+x.amt,0);
  L.innerHTML=`${sheetTop('تسجيل كل المتبقي')}<h2 style="margin-top:0">تسجيل كل المتبقي لـ${esc(monthName(m))}</h2>
   <div class="panel">${items.map(x=>`<div class="sumrow"><span>${esc(x.i.name)}</span><b class="num">${amtH(x.amt)}</b></div>`).join('')}<div class="sumrow total"><span>المجموع</span><b class="num">${amtH(tot)}</b></div></div>
   <p class="note">ستُسجَّل ${countWord(items.length,'دفعة واحدة','دفعتان','دفعات','دفعة')} بالمبالغ المستحقة. إذا كان مبلغ أي فاتورة مختلفًا فادفعها وحدها من زر «دفعت». ويمكنك التراجع بعد الحفظ.</p>
   <div class="actions"><button class="btn block" id="paConfirm">تأكيد تسجيل الكل</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`;
  L.oninput=L.onchange=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id!=='paConfirm')return;x.disabled=true;const snap=JSON.stringify(S.settings.debts||[]);const made=[];
    for(const {i,amt} of items){if(i.kind==='rec'){const t=recTx(i.ref,m);t.amount=amt;await putTx(t);made.push(t.id)}
      else{const p=await applyDebtPayment(i.ref,amt,cur?today():recDate({day:i.day},m),true);if(p.tx)made.push(p.tx)}}
    await putSettings();L.innerHTML='';render();
    toast('سُجّلت '+countWord(made.length,'دفعة واحدة','دفعتان','دفعات','دفعة')+' بمجموع '+rial(tot),async()=>{await delTxMany(made);S.settings.debts=JSON.parse(snap);await putSettings();render();toast('أُلغي تسجيل الدفعات')},9000)}}

/* ---------- 14. الخطط والأهداف: المناسبات وحساب الادخار ---------- */
const GOAL_KINDS={
 ramadan:{n:'رمضان',hint:'مقاضي رمضان والإفطارات والصدقات',hijri:[9,1]},
 fitr:{n:'عيد الفطر',hint:'ملابس العيد والعيادي والهدايا',hijri:[10,1]},
 adha:{n:'عيد الأضحى',hint:'الأضحية والعيادي والملابس',hijri:[12,10]},
 insurance:{n:'تأمين المركبة',hint:'تجديد التأمين السنوي'},
 mulkiya:{n:'تجديد ملكية المركبة',hint:'رسوم التجديد والفحص'},
 custom:{n:'هدف آخر',hint:'مثل: سفر، جهاز، رسوم دراسية'}
};
const HIJRI_FALLBACK={'9-1':['2027-02-08','2028-01-28','2029-01-16','2030-01-05'],'10-1':['2027-03-09','2028-02-26','2029-02-14','2030-02-04'],'12-10':['2027-05-16','2028-05-05','2029-04-24','2030-04-13']};
let hijriFmt=null;try{hijriFmt=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{day:'numeric',month:'numeric',year:'numeric'});if(hijriFmt.resolvedOptions().calendar!=='islamic-umalqura')hijriFmt=null}catch(e){hijriFmt=null}
const hijriCache={};
function nextHijri(m,d,fromIso){const ck=m+'-'+d+'@'+fromIso;if(hijriCache[ck])return hijriCache[ck];let r=null;
  if(hijriFmt){const x=new Date(fromIso+'T12:00');for(let i=0;i<400;i++){const p=hijriFmt.formatToParts(x);const hm=+(p.find(q=>q.type==='month')||{}).value,hd=+(p.find(q=>q.type==='day')||{}).value;if(hm===m&&hd===d){r=isoD(x);break}x.setDate(x.getDate()+1)}}
  if(!r){const l=HIJRI_FALLBACK[m+'-'+d]||[];r=l.find(s=>s>=fromIso)||l[l.length-1]}
  return hijriCache[ck]=r}
function monthsWord(n){return countWord(n,'شهر واحد','شهران','أشهر','شهرًا')}
function daysWord(n){return countWord(n,'يوم واحد','يومان','أيام','يومًا')}
function goalCalc(g){const tgt=+g.target||0,sv=+g.saved||0,rem=Math.max(0,tgt-sv);
  const due=new Date(g.due+'T12:00');const dl=new Date(due);const k=GOAL_KINDS[g.kind]||GOAL_KINDS.custom;if(k.hijri)dl.setDate(dl.getDate()-7);
  const now=new Date();const days=Math.ceil((due-now)/864e5);
  const pays=paydaysUntil(dl);let months=pays!==null?pays:(dl.getFullYear()*12+dl.getMonth())-(now.getFullYear()*12+now.getMonth())+1;if(months<1)months=1;
  const stm=Math.min(sv,+((g.log||{})[ym(now)])||0);const plan=(rem+stm)/months;const left=Math.max(0,plan-stm);
  return{tgt,sv,rem,days,months,byPay:pays!==null,monthly:plan,left,stm,done:tgt>0&&sv>=tgt,past:days<0,pct:tgt?Math.min(100,sv/tgt*100):0,dl}}
function goalDate(g){return fmtD(g.due)+((GOAL_KINDS[g.kind]||{}).hijri?' (تقريبًا)':'')}
function goalsSummary(){const G=(S.settings.goals||[]).map(g=>({g,c:goalCalc(g)})).filter(x=>!x.c.past);
  const total=G.reduce((s,x)=>s+x.c.left,0),plan=G.reduce((s,x)=>s+x.c.monthly,0);const near=G.slice().sort((a,b)=>a.g.due.localeCompare(b.g.due))[0];return{G,total,plan,near}}
function goalsHtml(){
  const all=(S.settings.goals||[]).slice().sort((a,b)=>a.due.localeCompare(b.due));
  const {total:leftNow,plan:total}=goalsSummary();
  const avg=avgSurplus();
  let advice='';
  if(all.length&&total>0){
    if(avg===null)advice='<div class="note">بعد أن تسجّل دخلك ومصاريفك لشهر كامل، سأقارن الخطة بما يتبقى لك فعلًا كل شهر.</div>';
    else if(total>avg)advice=`<div class="warnbox">تحتاج إلى ادخار <b class="num">${amtH(total)}</b> شهريًا، بينما متوسط ما تبقّى لك في آخر ${pastMonths().length===1?'شهر':monthsWord(pastMonths().length)} هو <b class="num">${amtH(avg)}</b>. خفّض مبلغ بعض الأهداف، أو قلّل الصرف في أكبر فئة عندك.</div>`;
    else advice=`<div class="okbox">خطتك ممكنة: يتبقى لك في المتوسط <b class="num">${amtH(avg)}</b> شهريًا، والخطة تحتاج منه <b class="num">${amtH(total)}</b> (${Math.round(total/avg*100)}%).</div>`}
  const have=new Set(all.map(g=>g.kind));
  const adds=['ramadan','fitr','adha','insurance','mulkiya'].filter(k=>!have.has(k)).map(k=>`<button class="chip" data-gadd="${k}">+ ${esc(GOAL_KINDS[k].n)}</button>`).join('');
  const cards=all.map(g=>{const c=goalCalc(g);
    const status=c.past?'حان موعده':c.days===0?'اليوم':'بعد '+daysWord(c.days);
    return `<div class="goal${c.done?' done':''}" id="goal-${esc(g.id)}"><div class="ghead"><div style="display:flex;gap:10px;align-items:flex-start;min-width:0">${goalBadge(g)}<div style="min-width:0"><b>${esc(g.name)}</b><small>${esc(goalDate(g))} · ${status}</small></div></div>
      <div class="gm">${!c.tgt?'<span>المبلغ المطلوب</span><b style="font-size:14px">لم يُحدَّد</b>':c.done?'<span>الحالة</span><b class="amt-inc" style="font-size:15px">اكتمل</b>':c.past?'<span>المتبقي</span><b class="num">'+amtH(c.rem)+'</b>':'<span>ادّخر شهريًا</span><b class="num">'+amtH(c.monthly)+'</b>'}</div></div>
      ${c.tgt?`<div class="meter"><i style="width:${c.pct}%;${c.done?'background:var(--inc)':''}"></i></div>
      <div class="gcount"><div><b class="num">${c.done?'✓':Math.max(0,c.days)}</b><span>${c.done?'اكتملت':c.past?'حان الموعد':c.days===0?'اليوم':'يوم حتى الموعد'}${c.byPay&&!c.done&&!c.past?'<br>'+countWord(c.months,'راتب واحد','راتبان','رواتب','راتبًا')+' قبله':''}</span></div><div><b class="num amt-inc">${amtH(c.sv)}</b><span>أنجزت <span dir="ltr">${Math.round(c.pct)}%</span></span></div><div><b class="num">${amtH(c.rem)}</b><span>المتبقي</span></div></div>
      <div class="budgetline" style="margin:0"><span>المطلوب <b class="num">${amtH(c.tgt)}</b></span><span>${c.past||c.done?'':c.stm&&c.left<0.0005?'حصة هذا الشهر مكتملة':c.stm?'باقٍ هذا الشهر '+money(c.left):'خلال '+(c.byPay?countWord(c.months,'راتب واحد','راتبين','رواتب','راتبًا'):monthsWord(c.months))}</span></div>`:''}
      ${(g.items||[]).length?`<details><summary class="note" style="cursor:pointer">البنود (${g.items.length})</summary><div style="margin-top:6px">${g.items.map(i=>`<div class="sumrow"><span>${esc(i.n)}</span><b class="num">${amtH(i.a)}</b></div>`).join('')}</div></details>`:''}
      <div class="gbtns">${c.tgt?`<button class="chip" data-gdep="${esc(g.id)}">+ أضفت مبلغًا للادخار</button>`:''}${+g.saved>0?`<button class="chip" data-gspend="${esc(g.id)}">صرفت منها</button>`:''}<button class="chip" data-gedit="${esc(g.id)}">${c.tgt?'تعديل':'تحديد المبلغ'}</button>${c.past&&g.repeat!=='once'?`<button class="chip" data-gnext="${esc(g.id)}">ابدأ خطة العام القادم</button>`:''}</div></div>`}).join('');
  return `<div class="backrow" style="margin-top:4px"><h2 style="margin:0">${esc(lbl('sec.plans'))}</h2><button class="chip pay" data-plannew="1">+ خطة جديدة</button></div>
  ${all.length?`<div class="planbox"><span class="note" style="color:var(--fg)">${leftNow>0.0005?"المتبقي لتدّخره هذا الشهر لكل أهدافك":"ادّخرت حصة هذا الشهر لكل أهدافك"}</span><span class="big2"><span class="num">${money(leftNow)}</span> <small style="font-size:14px;font-weight:400">${CUR}</small></span>${advice}</div>
  ${savingsHtml()?'<h2>حساب الادخار</h2>'+savingsHtml():''}
  <h2>الخطط</h2><div class="stack">${cards}</div>`:`<div class="panel empty" style="padding:18px 12px"><b>خطط لأهدافك قبل وقتها</b>اضغط «خطة جديدة» واختر: خطة سنوية، تعديل المنزل، شراء سيارة، سفر، زواج وغيرها. وسأحسب لك كم تدّخر كل شهر وهل الخطة مريحة لميزانيتك.</div>`}
  ${adds?`<div class="note" style="margin:12px 2px 6px">المناسبات (المواعيد تُحسب تلقائيًا):</div><div class="chips">${adds}</div>`:''}`;
}
function openGoal(id,kind){
  const L=document.getElementById('layer');const G=S.settings.goals||(S.settings.goals=[]);
  const ex=id?G.find(x=>x.id===id):null;
  const k=GOAL_KINDS[ex?ex.kind:kind]||GOAL_KINDS.custom;
  const g=ex?Object.assign({},ex):{id:uidGen(),kind:kind,name:kind==='custom'?'':k.n,target:'',saved:'',due:k.hijri?nextHijri(k.hijri[0],k.hijri[1],today()):'',repeat:kind==='custom'?'once':'yearly'};
  let askDel=false;
  const draw=()=>{L.innerHTML=`${sheetTop(esc(k.n))}
   <h2 style="margin-top:0">${ex?'تعديل الهدف':'هدف جديد: '+esc(k.n)}</h2>
   <div class="stack">
    <div class="field"><label for="gName">اسم الهدف</label><input class="inp" id="gName" value="${esc(g.name)}" placeholder="${esc(k.hint)}" maxlength="40"></div>
    <div class="row2"><div class="field"><label for="gTarget">المبلغ المطلوب (${CUR})</label><input class="inp num" id="gTarget" inputmode="decimal" value="${g.target!==''?esc(g.target):''}" placeholder="0.000" style="text-align:left"></div>
    <div class="field"><label for="gSaved">ادّخرت منه حتى الآن</label><input class="inp num" id="gSaved" inputmode="decimal" value="${g.saved!==''?esc(g.saved):''}" placeholder="0.000" style="text-align:left"></div></div>
    <div class="field"><label for="gDue">${k.hijri?'تاريخ المناسبة':kind==='insurance'||g.kind==='insurance'?'تاريخ انتهاء التأمين':g.kind==='mulkiya'||kind==='mulkiya'?'تاريخ انتهاء الملكية':'الموعد'}</label><input class="inp" type="date" id="gDue" value="${esc(g.due)}"></div>
    ${k.hijri?'<p class="note" style="margin:0">التاريخ محسوب بتقويم أم القرى وقد يختلف يومًا حسب رؤية الهلال. أحسب الادخار ليكتمل قبل المناسبة بأسبوع لتتسوّق مبكرًا.</p>':''}
    <div class="field"><label for="gRepeat">التكرار</label><select class="inp" id="gRepeat"><option value="yearly" ${g.repeat!=='once'?'selected':''}>يتكرر كل سنة</option><option value="once" ${g.repeat==='once'?'selected':''}>مرة واحدة</option></select></div>
    <p class="note" id="gErr" hidden style="color:var(--exp);margin:0"></p>
    <button class="btn block" id="gSave">حفظ الهدف</button>
    ${ex?(askDel?'<div class="confirm"><span>حذف هذا الهدف؟</span><div class="row2"><button class="btn danger" id="gDel">نعم، احذف</button><button class="btn ghost" id="gDelNo">تراجع</button></div></div>':'<button class="btn ghost block" id="gDelAsk" style="color:var(--exp)">حذف الهدف</button>'):'<button class="btn ghost block" data-close>إلغاء</button>'}
   </div></div></div>`};
  const grab=()=>{g.name=document.getElementById('gName').value;g.target=document.getElementById('gTarget').value;g.saved=document.getElementById('gSaved').value;g.due=document.getElementById('gDue').value;g.repeat=document.getElementById('gRepeat').value};
  L.onchange=L.oninput=null;
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='gDelAsk'){grab();askDel=true;draw();return}
    if(x.id==='gDelNo'){grab();askDel=false;draw();return}
    if(x.id==='gDel'){S.settings.goals=G.filter(y=>y.id!==g.id);L.innerHTML='';putSettings();render();toast('حُذف الهدف');return}
    if(x.id==='gSave'){grab();const err=document.getElementById('gErr');const t=parseAmt(g.target);
      if(!g.name.trim()){err.hidden=false;err.textContent='اكتب اسمًا للهدف';return}
      if(!t){err.hidden=false;err.textContent='اكتب المبلغ الذي تحتاجه، مثل 300.000';return}
      if(!g.due){err.hidden=false;err.textContent='اختر تاريخ الموعد';return}
      const rec={id:g.id,kind:g.kind,name:g.name.trim(),target:t,saved:parseAmt(g.saved),due:g.due,repeat:g.repeat,log:g.log||{}};
      const i=G.findIndex(y=>y.id===g.id);if(i>=0)G[i]=rec;else G.push(rec);
      L.innerHTML='';putSettings();render();toast('حُفظ الهدف');}
  };
  draw();
}

/* savings account: one bank account split into plan "envelopes" */
const SPEND_CAT={ramadan:'food',fitr:'family',adha:'family',insurance:'car',mulkiya:'car',house:'home',carbuy:'car',wedding:'family',travel:'fun',hajj:'charity',edu:'edu',device:'shop',emergency:'other',annual:'other',custom:'other'};
function savAcc(){return Object.assign({name:'حساب الادخار',balance:null,at:''},S.settings.savingsAcc||{})}
function savTotal(){return (S.settings.goals||[]).reduce((x,g)=>x+(+g.saved||0),0)}
function savingsHtml(){const G=(S.settings.goals||[]).filter(g=>+g.saved>0||goalCalc(g).tgt>0);if(!G.length)return '';
  const acc=savAcc(),tot=savTotal(),trS=trustsHeld('savings');const has=acc.balance!==null&&acc.balance!=='';const diff=has?Math.round(((+acc.balance)-trS-tot)*1000)/1000:0;
  const rows=G.filter(g=>+g.saved>0).sort((a,b)=>(+b.saved)-(+a.saved)).map(g=>{const p=tot?(+g.saved)/tot*100:0;const ic=PLAN_T[g.kind]?PLAN_T[g.kind].c:(GOAL_ICON[g.kind]||['', '#7A8494'])[1];
    return `<div class="catrow">${goalBadge(g)}<div class="name">${esc(g.name)} <small class="num">${Math.round(p)}%</small><div class="meter"><i style="width:${p}%;background:${ic}"></i></div></div><span class="num">${amtH(g.saved)}</span></div>`}).join('');
  const status=(trS?`<div class="note">في حساب الادخار أمانات للآخرين <b class="num">${amtH(trS)}</b> تُخصم من رصيد البنك عند المطابقة.</div>`:'')+(!has?'<div class="note">اكتب رصيد الحساب الفعلي من تطبيق البنك لنتأكد أنه مطابق لخططك.</div>'
    :Math.abs(diff)<0.001?`<div class="okbox">رصيد البنك <b class="num">${amtH(acc.balance)}</b> مطابق لمجموع خططك.</div>`
    :diff>0?`<div class="warnbox" style="background:var(--accent-soft)">في البنك <b class="num">${amtH(diff)}</b> زيادة غير موزّعة على الخطط.</div><button class="chip pay" id="savSplit" data-amt="${diff}">وزّع الزيادة على الخطط</button>`
    :`<div class="warnbox">رصيد البنك أقل من مجموع خططك بـ <b class="num">${amtH(-diff)}</b>. ربما صرفت منه ولم تسجّل ذلك، استخدم «صرفت من الخطة».</div>`);
  return `<div class="savcard"><div class="savhead"><span class="cbadge" style="background:#ffffff26;color:#fff">${svgI(CI.loan)}</span><div style="min-width:0"><span class="lbl">${esc(acc.name)}</span><div class="big"><span class="num">${money(tot)}</span> <small>${CUR}</small></div><span class="lbl">المفروض أن يكون في الحساب حسب خططك</span></div></div>
    <div class="row2" style="margin-top:12px"><button class="btn light" id="savDep">أودعت مبلغًا</button><button class="btn light ghost2" id="savBal">تحديث رصيد البنك</button></div></div>
    <div class="panel stack" style="margin-top:10px"><div class="note" style="display:flex;justify-content:space-between;gap:8px"><span>توزيع الحساب على الخطط</span>${has&&acc.at?'<span>رصيد البنك حُدّث '+fmtD(acc.at)+'</span>':''}</div>${rows||'<div class="note">لم تدّخر شيئًا بعد. اضغط «أودعت مبلغًا» وسأوزّعه على خططك.</div>'}${status}</div>`}
function splitPlan(amount){const G=(S.settings.goals||[]).map(g=>({g,c:goalCalc(g)})).filter(x=>!x.c.past&&!x.c.done&&x.c.rem>0).sort((a,b)=>a.g.due.localeCompare(b.g.due));
  const out={};let left=r3(amount);
  for(const x of G){if(left<=0)break;const v=Math.min(left,x.c.left,x.c.rem);if(v>0){out[x.g.id]=v;left-=v}}
  if(left>0.0005){const need=G.map(x=>({id:x.g.id,r:x.c.rem-(out[x.g.id]||0)})).filter(x=>x.r>0);const tr=need.reduce((a,x)=>a+x.r,0);
    if(tr>0){const pool=Math.min(left,tr);let given=0;need.forEach(x=>{const v=Math.floor(pool*x.r/tr*1000)/1000;out[x.id]=(out[x.id]||0)+v;given+=v});
      const dust=r3((pool-given));if(dust>0){const t=need.slice().sort((a,b)=>b.r-a.r)[0];out[t.id]+=dust;given+=dust}left-=given}}
  Object.keys(out).forEach(k=>out[k]=r3(out[k]));return{out,left:Math.max(0,r3(left)),G}}
function openSavDeposit(pre,fromSurplus){const L=document.getElementById('layer');const G=(S.settings.goals||[]).filter(g=>!goalCalc(g).past);
  let amt=pre!=null?pre:r3(goalsSummary().total);let parts={};
  const calc=()=>{parts=splitPlan(amt).out};calc();
  const draw=()=>{const used=Object.values(parts).reduce((a,v)=>a+(+v||0),0);const rest=r3((amt-used));
   L.innerHTML=`${sheetTop('إيداع')}
    <h2 style="margin-top:0">${fromSurplus?'توزيع الزيادة على الخطط':'أودعت في '+esc(savAcc().name)}</h2>
    <div class="amtbox"><input id="sdAmt" inputmode="decimal" value="${amtIn(amt)}" aria-label="المبلغ" ${fromSurplus?'readonly':''}><span>${CUR}</span></div>
    <p class="note" style="text-align:center;margin:0 0 10px">وزّعتُه تلقائيًا: أولًا حصة هذا الشهر لكل خطة حسب أقرب موعد، والباقي بنسبة ما تحتاجه كل خطة. يمكنك تعديل أي مبلغ.</p>
    <div class="panel" style="padding-block:4px">${G.map(g=>`<div class="brow"><div style="display:flex;gap:8px;align-items:center;min-width:0">${goalBadge(g)}<div style="min-width:0"><b style="font-weight:500">${esc(g.name)}</b><div class="note">متبقٍ ${money(goalCalc(g).rem)}</div></div></div><input class="inp num" data-sp="${esc(g.id)}" inputmode="decimal" value="${parts[g.id]?amtIn(parts[g.id]):''}" placeholder="0.000"></div>`).join('')}</div>
    <div class="sumrow" style="margin-top:6px"><span>غير موزّع</span><b class="num ${Math.abs(rest)>0.0005?'amt-exp':''}" id="sdRest">${money(rest)}</b></div>
    <div class="actions"><button class="btn block" id="sdSave">حفظ التوزيع</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`};
  const sync=()=>{const used=[...L.querySelectorAll('[data-sp]')].reduce((a,e)=>a+parseAmt(e.value),0);const r=document.getElementById('sdRest');if(r){const rest=r3((amt-used));r.textContent=money(rest);r.className='num '+(Math.abs(rest)>0.0005?'amt-exp':'')}};
  L.oninput=e=>{if(e.target.id==='sdAmt'){amt=parseAmt(e.target.value);calc();L.querySelectorAll('[data-sp]').forEach(i=>i.value=parts[i.dataset.sp]?amtIn(parts[i.dataset.sp]):'');sync()}else if(e.target.dataset.sp!==undefined)sync()};
  L.onchange=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='sdSave'){const mk=ym(new Date());let n=0,sumv=0;L.querySelectorAll('[data-sp]').forEach(i=>{const v=parseAmt(i.value);if(!v)return;const g=(S.settings.goals||[]).find(y=>y.id===i.dataset.sp);if(!g)return;
        g.saved=Math.round(((+g.saved||0)+v)*1000)/1000;g.log=Object.assign({},g.log||{});g.log[mk]=Math.round(((+g.log[mk]||0)+v)*1000)/1000;n++;sumv+=v});
      const acc=savAcc();if(!fromSurplus&&acc.balance!==null&&acc.balance!==''){acc.balance=Math.round(((+acc.balance)+amt)*1000)/1000;acc.at=today()}S.settings.savingsAcc=acc;
      L.innerHTML='';await putSettings();render();toast(n?'وُزّع '+rial(sumv)+' على '+n+(n===1?' خطة':' خطط'):'لم يُوزَّع شيء')}};
  draw()}
function openSavBalance(){const L=document.getElementById('layer');const acc=savAcc();
  L.innerHTML=`${sheetTop('رصيد البنك')}
   <h2 style="margin-top:0">رصيد حساب الادخار</h2><div class="stack">
   <div class="field"><label for="sbName">اسم الحساب</label><input class="inp" id="sbName" value="${esc(acc.name)}" maxlength="40" placeholder="مثال: حساب التوفير"></div>
   <div class="field"><label for="sbBal">الرصيد الحالي كما يظهر في تطبيق البنك</label><input class="inp num" id="sbBal" inputmode="decimal" value="${acc.balance!==null&&acc.balance!==''?amtIn(acc.balance):''}" placeholder="0.000" style="text-align:left"></div>
   <p class="note" style="margin:0">مجموع خططك الآن <b class="num">${amtH(savTotal())}</b>. إذا كان رصيد البنك أكبر، توزّع الزيادة على الخطط بضغطة.</p>
   <div class="actions"><button class="btn block" id="sbSave">حفظ</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div></div>`;
  L.oninput=L.onchange=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='sbSave'){const v=document.getElementById('sbBal').value.trim();S.settings.savingsAcc=Object.assign(savAcc(),{name:document.getElementById('sbName').value.trim()||'حساب الادخار',balance:v===''?null:parseAmt(v),at:today()});L.innerHTML='';await putSettings();render();toast('حُفظ رصيد الحساب')}}}
function openSpend(id){const g=(S.settings.goals||[]).find(x=>x.id===id);if(!g)return;const L=document.getElementById('layer');const cat=SPEND_CAT[g.kind]||'other';
  L.innerHTML=`${sheetTop('صرفت من الخطة')}
   <h2 style="margin-top:0">صرفت من «${esc(g.name)}»</h2>
   <div class="amtbox"><input id="spAmt" inputmode="decimal" placeholder="0.000" value="" aria-label="المبلغ"><span>${CUR}</span></div>
   <p class="note" style="text-align:center;margin:0 0 10px">المدّخر في هذه الخطة <b class="num">${amtH(g.saved)}</b>. يُخصم المبلغ منها ومن رصيد حساب الادخار.</p>
   <div class="stack"><label class="toggle"><input type="checkbox" id="spTx" checked><span>سجّله كمصروف في فئة «${esc(catOf(cat).n)}»</span></label>
   <div class="actions"><button class="btn block" id="spSave">حفظ</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div></div>`;
  L.oninput=L.onchange=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='spSave'){const v=parseAmt(document.getElementById('spAmt').value);if(!v){L.innerHTML='';return}const asTx=document.getElementById('spTx').checked;
      g.saved=Math.max(0,Math.round(((+g.saved||0)-v)*1000)/1000);const acc=savAcc();if(acc.balance!==null&&acc.balance!==''){acc.balance=Math.max(0,Math.round(((+acc.balance)-v)*1000)/1000);acc.at=today();S.settings.savingsAcc=acc}
      L.innerHTML='';await putSettings();if(asTx)await putTx({id:uidGen(),type:'exp',amount:v,cat,date:today(),method:'transfer',note:g.name,createdAt:new Date().toISOString()});else render();toast('خُصم '+rial(v)+' من '+g.name)}}}

function openDeposit(id){
  const L=document.getElementById('layer');const g=(S.settings.goals||[]).find(x=>x.id===id);if(!g)return;const c=goalCalc(g);
  L.innerHTML=`${sheetTop('إضافة للادخار')}
   <h2 style="margin-top:0">أضفت مبلغًا لادخار ${esc(g.name)}</h2>
   <div class="amtbox"><input id="dAmt" inputmode="decimal" placeholder="0.000" value="${c.left>0.0005&&!c.done?amtIn(c.left):''}" aria-label="المبلغ"><span>${CUR}</span></div>
   <p class="note" style="text-align:center;margin:0 0 12px">المتبقي لهذا الشهر: <span class="num">${amtH(c.left)}</span></p>
   <div class="stack"><button class="btn block" id="dSave">حفظ</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`;
  L.onchange=L.oninput=null;
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='dSave'){const v=parseAmt(document.getElementById('dAmt').value);if(!v){L.innerHTML='';return}
      g.saved=Math.round(((+g.saved||0)+v)*1000)/1000;g.log=Object.assign({},g.log||{});const mk=ym(new Date());g.log[mk]=Math.round(((+g.log[mk]||0)+v)*1000)/1000;{const acc=savAcc();if(acc.balance!==null&&acc.balance!==''){acc.balance=Math.round(((+acc.balance)+v)*1000)/1000;acc.at=today();S.settings.savingsAcc=acc}}L.innerHTML='';putSettings();render();
      toast(g.saved>=g.target?'اكتمل ادخار '+g.name:'أُضيف '+rial(v)+' إلى '+g.name)}};
}
function nextCycle(id){const g=(S.settings.goals||[]).find(x=>x.id===id);if(!g)return;const k=GOAL_KINDS[g.kind]||{};
  if(k.hijri){const d=new Date(g.due+'T12:00');d.setDate(d.getDate()+20);g.due=nextHijri(k.hijri[0],k.hijri[1],isoD(d))}
  else{const d=new Date(g.due+'T12:00');d.setFullYear(d.getFullYear()+1);g.due=isoD(d)}
  g.saved=0;g.log={};putSettings();render();toast('بدأت خطة '+g.name+' للعام القادم')}

/* ---------- 15. الخطط والأهداف: معالج الخطة الذكية ---------- */
const PLAN_T={
 annual:{n:'خطة سنوية',hint:'مبلغ تدّخره خلال السنة',icon:'calendar',c:'#24508C',items:[],repeat:'yearly',endOfYear:true},
 house:{n:'تعديل المنزل',hint:'ترميم أو تجديد أو توسعة',icon:'home',c:'#2F7F7A',items:['المطبخ','الدهان','الأثاث','الكهرباء والسباكة','الحديقة']},
 carbuy:{n:'شراء سيارة',hint:'الدفعة الأولى ورسوم الشراء',icon:'car',c:'#3E7CB1',items:['الدفعة الأولى','التأمين والتسجيل','إكسسوارات وتظليل']},
 wedding:{n:'زواج',hint:'المهر والتجهيزات',icon:'ring',c:'#A0527B',items:['المهر','الذهب','القاعة والضيافة','الأثاث']},
 travel:{n:'سفر',hint:'رحلة أو إجازة',icon:'fun',c:'#4E68C7',items:['التذاكر','الفندق','المصروف']},
 hajj:{n:'حج أو عمرة',hint:'تكلفة الحملة والمصروف',icon:'kaaba',c:'#6B5C3A',items:['تكلفة الحملة','المصروف والهدايا']},
 emergency:{n:'صندوق الطوارئ',hint:'احتياطي للظروف المفاجئة',icon:'shield',c:'#B8423A',items:[],smart:'emergency'},
 edu:{n:'تعليم ودراسة',hint:'رسوم أو دورة',icon:'edu',c:'#3B8F5A',items:['الرسوم','الكتب والأدوات']},
 device:{n:'جهاز أو مشتريات',hint:'هاتف، حاسوب، أثاث',icon:'shop',c:'#B0662F',items:[]},
 custom:{n:'خطة أخرى',hint:'أي هدف تريده',icon:'iother',c:'#7A8494',items:[]}
};
Object.entries(PLAN_T).forEach(([k,v])=>{if(!GOAL_KINDS[k])GOAL_KINDS[k]={n:v.n,hint:v.hint}});
const GOAL_ICON={ramadan:['moon','#2E8B72'],fitr:['gift','#7A6CC0'],adha:['family','#B0662F'],insurance:['car','#3E7CB1'],mulkiya:['car','#5B6F8A']};
function goalBadge(g){const t=PLAN_T[g.kind];const ic=t?[t.icon,t.c]:GOAL_ICON[g.kind]||['iother','#7A8494'];
  return ovBadge('goal:'+g.id,`<span class="cbadge" style="background:${ic[1]}1f;color:${ic[1]}">${svgI(CI[ic[0]]||CI.iother)}</span>`)}
function avgSurplus(){return pastAvg(a=>sum(a,'inc')-sum(a,'exp'))}
function avgExpense(){return pastAvg(a=>sum(a,'exp'))||0}
function addMonthsIso(n){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()+n);const nd=monthDays(d);d.setDate(Math.min(new Date().getDate(),nd));return isoD(d)}
function monthsUntil(iso){const d=new Date(iso+'T12:00'),n=new Date();return Math.max(1,(d.getFullYear()*12+d.getMonth())-(n.getFullYear()*12+n.getMonth())+1)}
function openPlanWizard(id,kind,pre){
  const L=document.getElementById('layer');const G=S.settings.goals||(S.settings.goals=[]);const ex=id?G.find(x=>x.id===id):null;
  let step=ex?2:1,askDel=false,p=null;const kind0=!ex&&kind&&PLAN_T[kind]?kind:'';
  const init=k=>{const t=PLAN_T[k];p={id:uidGen(),kind:k,name:k==='custom'?'':t.n,target:'',saved:'',due:t.endOfYear?new Date().getFullYear()+'-12-31':addMonthsIso(11),repeat:t.repeat||'once',mode:'date',monthly:'',items:t.items.map(n=>({n,a:''})),log:{}}};
  if(kind0){init(kind0);step=2;if(PLAN_T[kind0].smart==='emergency'){const ae=avgExpense()||sum(inMonth(ym(new Date())),'exp');if(ae)p.target=amtIn(Math.round(ae*3))}if(pre){if(pre.name)p.name=pre.name;if(pre.target)p.target=pre.target}}
  if(ex){p=JSON.parse(JSON.stringify(ex));p.items=(p.items||[]).map(i=>({n:i.n,a:i.a?amtIn(i.a):''}));p.target=p.target?money(p.target):'';p.saved=p.saved?money(p.saved):'';p.monthly=p.monthly?money(p.monthly):'';p.mode=p.mode||'date'}
  const itemsTotal=()=>p.items.reduce((s,i)=>s+parseAmt(i.a),0);
  const tgt=()=>itemsTotal()||parseAmt(p.target);
  const others=()=>(S.settings.goals||[]).filter(g=>g.id!==p.id).map(g=>goalCalc(g)).filter(c=>!c.past).reduce((s,c)=>s+c.monthly,0);
  const calc=()=>{const T=tgt(),sv=parseAmt(p.saved),rem=Math.max(0,T-sv);let months,due,monthly;
    if(p.mode==='monthly'){monthly=parseAmt(p.monthly);months=monthly>0?Math.max(1,Math.ceil(rem/monthly)):0;due=months?addMonthsIso(months-1):''}
    else{due=p.due;months=due?monthsUntil(due):0;monthly=months?rem/months:0}
    return{T,sv,rem,months,due,monthly}};
  const preview=()=>{const c=calc();if(!c.T)return '<div class="note">اكتب المبلغ المطلوب أو مبالغ البنود، وسأحسب لك الخطة.</div>';
    if(c.rem<=0)return '<div class="okbox">ادّخرت المبلغ كاملًا. هذه الخطة مكتملة.</div>';
    if(!c.months)return '<div class="note">'+(p.mode==='monthly'?'اكتب المبلغ الذي تستطيع ادخاره شهريًا.':'اختر موعد الهدف.')+'</div>';
    const avg=avgSurplus(),free=avg===null?null:avg-others();
    let s=`<div class="planpreview"><div><span class="note">ادّخر شهريًا</span><b class="num">${amtH(c.monthly)}</b></div><div><span class="note">المدة</span><b>${monthsWord(c.months)}</b></div><div><span class="note">يكتمل في</span><b>${fmtD(c.due)}</b></div></div>`;
    if(free===null)s+='<div class="note">بعد تسجيل دخلك ومصاريفك لشهر كامل، سأخبرك هل الخطة مريحة لميزانيتك.</div>';
    else if(free<=0)s+=`<div class="warnbox">بعد خططك الحالية لا يتبقى لك فائض شهري (المتوسط <b class="num">${amtH(avg)}</b>). خفّض بعض المصاريف أو أجّل خطة أخرى أولًا.</div>`;
    else if(c.monthly<=free*0.7)s+=`<div class="okbox">خطة مريحة: تأخذ ${Math.round(c.monthly/free*100)}% مما يتبقى لك شهريًا بعد خططك الحالية (<b class="num">${amtH(free)}</b>).</div>`;
    else{const comfy=free*0.6;const m2=Math.ceil(c.rem/comfy);s+=`<div class="warnbox">الخطة ${c.monthly>free?'أكبر من':'قريبة من'} فائضك الشهري بعد خططك الحالية (<b class="num">${amtH(free)}</b>). لتكون مريحة: ادّخر <b class="num">${amtH(comfy)}</b> شهريًا وتكتمل في ${fmtD(addMonthsIso(m2-1))}.</div><button class="chip" id="pComfy" data-m="${m2}">طبّق الاقتراح</button>`}
    return s};
  const T=()=>PLAN_T[p.kind]||PLAN_T.custom;
  const draw=()=>{
    if(step===1){L.innerHTML=`${sheetTop('خطة جديدة')}
      <h2 style="margin-top:0">خطة جديدة</h2><p class="note" style="margin:-4px 0 12px">اختر نوع الخطة، وسأجهّز لك البنود وأحسب المبلغ الشهري.</p>
      <div class="plangrid">${Object.entries(PLAN_T).map(([k,t])=>`<button class="pt" data-pt="${k}"><span class="cbadge" style="background:${t.c}1f;color:${t.c}">${svgI(CI[t.icon])}</span><b>${esc(t.n)}</b><small>${esc(t.hint)}</small></button>`).join('')}</div>
      <div class="actions"><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`;return}
    const t=T();const sm=t.smart==='emergency'?avgExpense():0;
    L.innerHTML=`${sheetTop(esc(t.n))}
     <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">${goalBadge(p)}<h2 style="margin:0">${ex?'تعديل الخطة':esc(t.n)}</h2>${ex?'':'<button class="chip" id="pBack" style="margin-inline-start:auto">تغيير النوع</button>'}</div>
     <div class="stack">
      <div class="field"><label for="pName">اسم الخطة</label><input class="inp" id="pName" value="${esc(p.name)}" placeholder="${esc(t.hint)}" maxlength="40"></div>
      <div class="field"><label>بنود الخطة ${p.items.length?'':'(اختياري)'}</label>
       <div class="items">${p.items.map((it,i)=>`<div class="itemrow"><input class="inp" data-in="${i}" value="${esc(it.n)}" placeholder="اسم البند" maxlength="30"><input class="inp num" data-ia="${i}" inputmode="decimal" value="${esc(it.a)}" placeholder="0.000" style="text-align:left"><button class="chip" data-irm="${i}" aria-label="حذف البند">✕</button></div>`).join('')}</div>
       <button class="chip" id="pAddItem" style="align-self:flex-start">+ إضافة بند</button></div>
      <div class="row2"><div class="field"><label for="pTarget">المبلغ المطلوب (${CUR})</label><input class="inp num" id="pTarget" inputmode="decimal" value="${itemsTotal()?amtIn(itemsTotal()):esc(p.target)}" ${itemsTotal()?'readonly':''} placeholder="0.000" style="text-align:left"></div>
       <div class="field"><label for="pSaved">ادّخرت منه حتى الآن</label><input class="inp num" id="pSaved" inputmode="decimal" value="${esc(p.saved)}" placeholder="0.000" style="text-align:left"></div></div>
      ${sm?`<button class="chip" id="pSmart" data-v="${(sm*3).toFixed(3)}">المقترح: 3 أشهر من مصاريفك = ${money(sm*3)}</button>`:''}
      <div class="seg" role="group" aria-label="طريقة الحساب"><button class="n" data-pmode="date" aria-pressed="${p.mode!=='monthly'}">أحدد الموعد</button><button class="n" data-pmode="monthly" aria-pressed="${p.mode==='monthly'}">أحدد المبلغ الشهري</button></div>
      ${p.mode==='monthly'?`<div class="field"><label for="pMonthly">أستطيع ادخار شهريًا (${CUR})</label><input class="inp num" id="pMonthly" inputmode="decimal" value="${esc(p.monthly)}" placeholder="0.000" style="text-align:left"></div>`
       :`<div class="chips">${[[6,'6 أشهر'],[12,'سنة'],[24,'سنتان'],[36,'3 سنوات']].map(([m,n])=>`<button class="chip" data-pdue="${m}">${n}</button>`).join('')}</div><div class="field"><label for="pDue">موعد الهدف</label><input class="inp" type="date" id="pDue" value="${esc(p.due)}"></div>`}
      <div id="pPrev">${preview()}</div>
      <div class="field"><label for="pRepeat">التكرار</label><select class="inp" id="pRepeat"><option value="once" ${p.repeat!=='yearly'?'selected':''}>مرة واحدة</option><option value="yearly" ${p.repeat==='yearly'?'selected':''}>تتكرر كل سنة</option></select></div>
      <p class="note" id="pErr" hidden style="color:var(--exp);margin:0"></p>
      <div class="actions"><button class="btn block" id="pSave">حفظ الخطة</button>
      ${ex?(askDel?'<div class="confirm"><span>حذف هذه الخطة؟</span><div class="row2"><button class="btn danger" id="pDel">نعم، احذف</button><button class="btn ghost" id="pDelNo">تراجع</button></div></div>':'<button class="btn ghost block" id="pDelAsk" style="color:var(--exp)">حذف الخطة</button>'):'<button class="btn ghost block" data-close>إلغاء</button>'}</div>
     </div></div></div>`};
  const grab=()=>{const g=i=>document.getElementById(i);if(!g('pName'))return;p.name=g('pName').value;p.saved=g('pSaved').value;if(!itemsTotal())p.target=g('pTarget').value;
    if(g('pMonthly'))p.monthly=g('pMonthly').value;if(g('pDue'))p.due=g('pDue').value;p.repeat=g('pRepeat').value;
    L.querySelectorAll('[data-in]').forEach(e=>p.items[+e.dataset.in].n=e.value);L.querySelectorAll('[data-ia]').forEach(e=>p.items[+e.dataset.ia].a=e.value)};
  const refresh=()=>{grab();const tg=document.getElementById('pTarget');if(tg){const it=itemsTotal();if(it){tg.value=amtIn(it);tg.readOnly=true}else tg.readOnly=false}
    const pv=document.getElementById('pPrev');if(pv)pv.innerHTML=preview()};
  L.oninput=e=>{if(e.target.closest('.sheet'))refresh()};
  L.onchange=e=>{if(e.target.id==='pDue'||e.target.id==='pRepeat')refresh()};
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';L.oninput=L.onchange=null;return}
    if(x.dataset.pt){init(x.dataset.pt);step=2;draw();return}
    if(x.id==='pBack'){step=1;draw();return}
    if(x.id==='pAddItem'){grab();p.items.push({n:'',a:''});draw();const ins=L.querySelectorAll('[data-in]');ins[ins.length-1].focus();return}
    if(x.dataset.irm!==undefined){grab();p.items.splice(+x.dataset.irm,1);draw();return}
    if(x.dataset.pmode){grab();p.mode=x.dataset.pmode;if(p.mode==='monthly'&&!parseAmt(p.monthly)){const c=calc();if(c.monthly)p.monthly=amtIn(c.monthly)}draw();return}
    if(x.dataset.pdue){grab();p.due=addMonthsIso(+x.dataset.pdue-1);document.getElementById('pDue').value=p.due;refresh();return}
    if(x.id==='pSmart'){grab();p.items.forEach(i=>i.a='');p.target=amtIn(+x.dataset.v);draw();return}
    if(x.id==='pComfy'){grab();const m=+x.dataset.m;if(p.mode==='monthly'){const c=calc();p.monthly=amtIn(c.rem/m)}else p.due=addMonthsIso(m-1);draw();return}
    if(x.id==='pDelAsk'){grab();askDel=true;draw();return}
    if(x.id==='pDelNo'){grab();askDel=false;draw();return}
    if(x.id==='pDel'){S.settings.goals=G.filter(y=>y.id!==p.id);L.innerHTML='';L.oninput=L.onchange=null;putSettings();render();toast('حُذفت الخطة');return}
    if(x.id==='pSave'){grab();const er=document.getElementById('pErr');const c=calc();
      if(!p.name.trim()){er.hidden=false;er.textContent='اكتب اسمًا للخطة';return}
      if(!c.T){er.hidden=false;er.textContent='اكتب المبلغ المطلوب أو مبالغ البنود';return}
      if(!c.due){er.hidden=false;er.textContent=p.mode==='monthly'?'اكتب المبلغ الشهري':'اختر موعد الهدف';return}
      const rec={id:p.id,kind:p.kind,name:p.name.trim(),target:c.T,saved:parseAmt(p.saved),due:c.due,repeat:p.repeat,log:p.log||{},mode:p.mode,monthly:p.mode==='monthly'?parseAmt(p.monthly):0,
        items:p.items.filter(i=>i.n.trim()||parseAmt(i.a)).map(i=>({n:i.n.trim()||'بند',a:parseAmt(i.a)}))};
      if(p.carRef)rec.carRef=p.carRef;
      const i=G.findIndex(y=>y.id===rec.id);if(i>=0)G[i]=rec;else G.push(rec);
      L.innerHTML='';L.oninput=L.onchange=null;S.tab='budget';putSettings();render();toast(ex?'حُفظ التعديل':'أُضيفت خطة '+rec.name)}
  };
  draw();
}

/* ---------- 16. السيارات: التأمين والملكية والصيانة والتنبيهات ---------- */
const SVC_TYPES=['تغيير زيت','إطارات','بطارية','فرامل','فحص دوري','تكييف','غسيل وتلميع','قطع غيار','أخرى'];
function cars(){return S.settings.cars||[]}
function carName(id){const c=cars().find(x=>x.id===id);return c?c.name:'سيارة محذوفة'}
function expPill(iso){const d=daysTo(iso);if(d===null)return '<span class="pill soon">لم يُحدَّد</span>';
  if(d<0)return `<span class="pill late">انتهى منذ ${daysWord(-d)}</span>`;if(d<=30)return `<span class="pill warn">بعد ${daysWord(d)}</span>`;return `<span class="pill soon">بعد ${daysWord(d)}</span>`}
function plusYear(iso){const d=new Date((iso||today())+'T12:00');d.setFullYear(d.getFullYear()+1);return isoD(d)}
function svcDue(car){const out=[];const last={};(car.services||[]).forEach(s=>{if(!last[s.type]||s.date>=last[s.type].date)last[s.type]=s});
  Object.values(last).forEach(s=>{let due=false,why='';const dd=daysTo(s.nextDate);
    if(s.nextDate&&dd<=14){due=true;why=dd<0?'متأخرة '+daysWord(-dd):'بعد '+daysWord(dd)}
    if(s.nextOdo&&car.odo){const left=s.nextOdo-car.odo;if(left<=500){due=true;why=left<0?'تجاوزت بـ '+(-left).toLocaleString('en-US')+' كم':'باقي '+left.toLocaleString('en-US')+' كم'}}
    if(s.nextDate||s.nextOdo)out.push({s,due,why:why||(s.nextDate?'في '+fmtD(s.nextDate):'عند '+(+s.nextOdo).toLocaleString('en-US')+' كم')})});
  return out}
function ownerLabel(c){if(!c.owner)return 'سيارتي';if(c.owner.startsWith('p:')){const p=people().find(x=>'p:'+x.id===c.owner);return p?p.name:'شخص محذوف'}return c.owner}
function carAlertList(){const out=[];cars().forEach(c=>{const lead=+c.alertDays||30;
  [['ins','التأمين','انتهى ','ينتهي '],['reg','الملكية','انتهت ','تنتهي ']].forEach(([k,n,past,fut])=>{const d=daysTo(c[k+'Expiry']);if(d===null||d>lead)return;
    out.push({car:c,k,ref:c.id+':'+k,days:d,level:d<0||d<=7?'late':'warn',title:(d<0?past:fut)+n+' '+c.name+(c.owner?' ('+ownerLabel(c)+')':''),when:d<0?'منذ '+daysWord(-d):d===0?'اليوم':'بعد '+daysWord(d)})});
  svcDue(c).filter(x=>x.due).forEach(x=>out.push({car:c,k:'svc',ref:c.id+':svc:'+x.s.id,days:0,level:'warn',title:'صيانة '+x.s.type+' لـ'+c.name,when:x.why}))});
  return out.sort((a,b)=>a.days-b.days)}
function carAlerts(){return carAlertList().map(a=>({car:a.car,text:a.title+' '+a.when,d:a.days}))}
function carAlertsHtml(){const A=carAlertList();if(!A.length)return '';
  return `<div class="alertbox"><div class="alerthead"><b>تنبيهات السيارات</b><span class="pill late">${A.length}</span></div>${A.map(a=>`<div class="alertrow ${a.level}"><span class="adot"></span><div style="min-width:0"><b>${esc(a.title)}</b><small>${esc(a.when)}</small></div>${a.k==='svc'?`<button class="chip" data-tab="cars">تفاصيل</button>`:`<button class="chip pay" data-crenew="${esc(a.ref)}">جدّدت</button>`}</div>`).join('')}</div>`}
function icsDate(iso){return iso.replace(/-/g,'')}
function carIcs(c){const now=new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';const ev=[];
  [['ins','تأمين'],['reg','ملكية']].forEach(([k,n])=>{const e=c[k+'Expiry'];if(!e)return;const d=new Date(e+'T12:00');d.setDate(d.getDate()+1);
    const title='انتهاء '+n+' '+c.name;const lead=+c.alertDays||30;
    const al=[...new Set([lead,7,1])].filter(x=>x>0).map(x=>['BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+title+' بعد '+x+' يوم','TRIGGER:-P'+x+'D','END:VALARM'].join('\r\n'));
    ev.push(['BEGIN:VEVENT','UID:'+c.id+'-'+k+'-'+icsDate(e)+'@masareef','DTSTAMP:'+now,'DTSTART;VALUE=DATE:'+icsDate(e),'DTEND;VALUE=DATE:'+icsDate(isoD(d)),'SUMMARY:'+title,'DESCRIPTION:تذكير من تطبيق إدارة شؤوني'+(c[k+'Cost']?' - المبلغ المتوقع '+money(c[k+'Cost'])+' ر.ع.':''),...al,'END:VEVENT'].join('\r\n'))});
  if(!ev.length)return '';return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//masareef//AR','CALSCALE:GREGORIAN',...ev,'END:VCALENDAR'].join('\r\n')+'\r\n'}
async function notifyCarAlerts(){try{if(!('Notification' in window)||Notification.permission!=='granted')return;const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();
  const day=today();for(const a of carAlertList().concat(billAlertList(),trustAlertList())){const key='masareef:nt:'+a.ref+':'+day;let seen=null;try{seen=localStorage.getItem(key)}catch(e){}if(seen)continue;
    const opt={body:a.when,icon:'icon-192.png',tag:a.ref,lang:'ar',dir:'rtl'};
    if(reg&&reg.showNotification)await reg.showNotification(a.title,opt);else new Notification(a.title,opt);
    try{localStorage.setItem(key,'1')}catch(e){}}}catch(e){}}
async function askNotify(){if(!('Notification' in window)){toast('هاتفك لا يدعم الإشعارات هنا. ثبّت التطبيق على الشاشة الرئيسية أولًا');return}
  const r=await Notification.requestPermission();if(r==='granted'){toast('فُعّلت الإشعارات');notifyCarAlerts();render()}else toast('لم تُفعَّل الإشعارات. يمكنك تفعيلها من إعدادات الهاتف')}
function carGoal(car,k){return (S.settings.goals||[]).find(g=>g.carRef===car.id+':'+k)}
/* مستندات السيارة: محفوظة مشفّرة في خزنة «مستنداتي» ومربوطة بالسيارة */
function carDocsHtml(c){const D=Vault.docs.filter(d=>d.car===c.id);const lock=!Vault.key&&Vault.cfg;
  return `<div class="recrow cardocs"><div style="min-width:0"><b>مستندات السيارة ${lock?'🔒':''}</b><small>${D.length?(D.length===1?'مستند واحد مشفّر':countWord(D.length,'مستند واحد','مستندان','مستندات','مستندًا')+' مشفّرة')+' في الخزنة':'أرفق التأمين والملكية وأي مستند مهم، تُحفظ مشفّرة'}</small>
   ${D.length?`<div class="chips" style="margin:6px 0 0">${D.map(d=>`<button class="chip" data-cdview="${esc(d.id)}">📎 ${esc(d.title)}${(d.files||[]).length>1?' ('+d.files.length+')':''}${d.expiry?' · '+fmtD(d.expiry):''}</button>`).join('')}</div>`:''}</div></div>
   <div class="chips" style="margin:4px 0 0"><button class="chip pay" data-cdoc="${esc(c.id)}:carins">+ وثيقة التأمين</button><button class="chip" data-cdoc="${esc(c.id)}:mulk">+ الملكية</button><button class="chip" data-cdoc="${esc(c.id)}:carother">+ مستند آخر</button></div>`}
function carDocPre(carId,type){const c=cars().find(x=>x.id===carId);if(!c)return null;const owner=c.owner&&c.owner.startsWith('p:')?c.owner.slice(2):'';
  return{type,car:c.id,owner,title:DOC_T[type][0].replace(' مركبة','')+' - '+c.name,expiry:type==='carins'?c.insExpiry||'':type==='mulk'?c.regExpiry||'':''}}
/* إذا كانت الخزنة مقفلة: نفتحها أولًا ثم نكمل ما طلبته */
function withVault(fn,msg){if(Vault.key){vaultTouch();fn();return}S.afterVault=fn;S.tab='docs';render();window.scrollTo(0,0);toast(msg||(Vault.cfg?'افتح الخزنة لإكمال العملية':'أنشئ خزنة المستندات أولًا، ثم أكمل'))}
function afterVault(){const fn=S.afterVault;S.afterVault=null;if(fn&&Vault.key)setTimeout(fn,60)}
function vCars(){
  const y=S.month.slice(0,4);const C=cars();
  const card=c=>{
    const yr=list().filter(t=>t.car===c.id&&t.date&&t.date.slice(0,4)===y);const tot=yr.reduce((s,t)=>s+(+t.amount||0),0);
    const row=(k,n)=>{const g=carGoal(c,k);return `<div class="recrow"><div><b>${n}</b><small>ينتهي ${fmtD(c[k+'Expiry'])}${c[k+'Cost']?' · <span class="num">'+money(c[k+'Cost'])+'</span> '+CUR:''}</small></div>
      <div class="recact">${expPill(c[k+'Expiry'])}<button class="chip pay" data-crenew="${esc(c.id)}:${k}">جدّدت</button>${c[k+'Expiry']&&c[k+'Cost']?(g?'<button class="chip" data-go="budget">في الخطة</button>':`<button class="chip" data-csave="${esc(c.id)}:${k}">ادّخر له</button>`):''}</div></div>`};
    const due=svcDue(c);const svcs=(c.services||[]).slice().sort((a,b)=>b.date.localeCompare(a.date));
    return `<div class="carcard"><div class="carhead"><div><b>${esc(c.name)}</b>${c.owner?`<span class="pill soon" style="display:inline-block;margin-bottom:4px">لـ${esc(ownerLabel(c))}</span><br>`:''}<span class="note">${[c.plate?'لوحة '+esc(c.plate):'',c.year?esc(c.year):'',c.odo?'<span class="num">'+(+c.odo).toLocaleString('en-US')+'</span> كم':''].filter(Boolean).join(' · ')}</span></div>
      <div class="gm"><span>تكاليف ${y}</span><b class="num" style="font-size:17px">${money(tot)}</b></div></div>
      ${row('ins','التأمين')}${row('reg','تجديد الملكية')}
      ${carDocsHtml(c)}
      <div class="recrow"><div><b>الصيانة القادمة</b><small>${due.length?due.map(x=>esc(x.s.type)+': '+esc(x.why)).join('، '):'سجّل صيانة وحدد موعدها القادم ليذكّرك التطبيق'}</small></div>
      <div class="recact">${due.some(x=>x.due)?'<span class="pill late">مستحقة</span>':due.length?'<span class="pill paid">لا شيء مستحق</span>':''}</div></div>
      ${svcs.length?`<details style="margin-top:4px"><summary class="note" style="cursor:pointer">سجل الصيانة (${svcs.length})</summary><div style="margin-top:6px">${svcs.map(s=>`<button class="svc" data-sedit="${esc(c.id)}:${esc(s.id)}"><span><b style="font-weight:500">${esc(s.type)}</b><small>${fmtD(s.date)}${s.odo?' · <span class="num">'+(+s.odo).toLocaleString('en-US')+'</span> كم':''}${s.note?' · '+esc(s.note):''}</small></span><span class="num amt-exp">${s.cost?money(s.cost):''}</span></button>`).join('')}</div></details>`:''}
      <div class="gbtns" style="margin-top:8px"><button class="chip pay" data-sadd="${esc(c.id)}">+ صيانة</button><button class="chip" data-cedit="${esc(c.id)}">تعديل السيارة</button>${c.insExpiry||c.regExpiry?`<button class="chip" data-cics="${esc(c.id)}">أضف التذكير للتقويم</button>`:''}</div></div>`};
  const mine=C.filter(c=>!c.owner),others=C.filter(c=>c.owner);
  const notif=('Notification' in window)?Notification.permission:'na';
  const cards=carAlertsHtml()+(notif==='default'&&C.length?`<div class="panel" style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:12px"><span class="note" style="flex:1;min-width:180px">فعّل إشعارات الهاتف ليصلك تنبيه عند اقتراب انتهاء التأمين أو الملكية.</span><button class="chip pay" id="askNotify">تفعيل الإشعارات</button></div>`:'')
    +(mine.length?mine.map(card).join(''):'')
    +(others.length?`<div class="backrow" style="margin-top:18px"><h2 style="margin:0">سيارات الأهل والآخرين</h2></div>`+others.map(card).join(''):'');
  return `<div class="backrow"><h2 style="margin:4px 0">${esc(lbl('sec.cars'))}</h2><button class="chip" data-tab="home">الرئيسية ‹</button></div>
   <div class="row2" style="margin-bottom:12px"><button class="btn" data-cadd="me">+ سيارتي</button><button class="btn ghost" data-cadd="other">+ سيارة للأهل</button></div>
   ${C.length?cards:`<div class="panel empty"><b>تابع تأمين سيارتك وملكيتها وصيانتها</b>أضف سيارتك مع تاريخ انتهاء التأمين والملكية، وسيذكّرك التطبيق قبل الموعد بشهر، ويحسب لك كم تدّخر لهما شهريًا.</div>`}
   `;
}
function openCar(id,pre){
  const L=document.getElementById('layer');const C=S.settings.cars||(S.settings.cars=[]);const ex=id?C.find(x=>x.id===id):null;
  const c=ex?Object.assign({},ex):Object.assign({id:uidGen(),name:'',plate:'',year:'',odo:'',insExpiry:'',insCost:'',insCo:'',regExpiry:'',regCost:'',services:[],owner:'',alertDays:30},pre||{});let askDel=false;
  const f=(idn,lab,val,extra)=>`<div class="field"><label for="${idn}">${lab}</label><input class="inp${extra&&extra.num?' num':''}" id="${idn}" value="${esc(val)}" ${extra&&extra.attrs||''}></div>`;
  const draw=()=>{L.innerHTML=`${sheetTop('سيارة')}
   <h2 style="margin-top:0">${ex?'تعديل '+esc(ex.name):'إضافة سيارة'}</h2><div class="stack">
   ${f('cName','اسم السيارة',c.name,{attrs:'placeholder="مثال: لاندكروزر 2019" maxlength="30"'})}
   <div class="field"><label for="cOwner">صاحب السيارة</label><select class="inp" id="cOwner"><option value="" ${!c.owner?'selected':''}>سيارتي</option>${people().map(p=>`<option value="p:${esc(p.id)}" ${c.owner==='p:'+p.id?'selected':''}>${esc(p.name)}</option>`).join('')}<option value="__other" ${c.owner&&!c.owner.startsWith('p:')?'selected':''}>شخص آخر…</option></select></div>
   <div class="field" id="cOtherWrap" ${c.owner&&!c.owner.startsWith('p:')||c._other?'':'hidden'}><label for="cOther">اسم صاحب السيارة</label><input class="inp" id="cOther" value="${esc(c.owner&&!c.owner.startsWith('p:')?c.owner:'')}" maxlength="30" placeholder="مثال: أخي سالم"></div>
   <div class="row2">${f('cPlate','رقم اللوحة (اختياري)',c.plate,{attrs:'maxlength="15"'})}${f('cOdo','قراءة العداد (كم)',c.odo,{num:1,attrs:'inputmode="numeric" style="text-align:left"'})}</div>
   <h2 style="margin:6px 0 0;font-size:15px">التأمين</h2>
   <div class="row2">${f('cInsExp','تاريخ انتهاء التأمين',c.insExpiry,{attrs:'type="date"'})}${f('cInsCost','قيمة التجديد',c.insCost?money(c.insCost):'',{num:1,attrs:'inputmode="decimal" placeholder="0.000" style="text-align:left"'})}</div>
   ${f('cInsCo','شركة التأمين (اختياري)',c.insCo,{attrs:'maxlength="30"'})}
   <h2 style="margin:6px 0 0;font-size:15px">الملكية</h2>
   <div class="row2">${f('cRegExp','تاريخ انتهاء الملكية',c.regExpiry,{attrs:'type="date"'})}${f('cRegCost','رسوم التجديد والفحص',c.regCost?money(c.regCost):'',{num:1,attrs:'inputmode="decimal" placeholder="0.000" style="text-align:left"'})}</div>
   <div class="field"><label for="cAlert">نبّهني قبل الانتهاء بـ</label><select class="inp" id="cAlert">${[[7,'أسبوع'],[14,'أسبوعين'],[30,'شهر'],[60,'شهرين']].map(([d,n])=>`<option value="${d}" ${(+c.alertDays||30)===d?'selected':''}>${n}</option>`).join('')}</select></div>
   <p class="note" id="cErr" hidden style="color:var(--exp);margin:0"></p>
   <button class="btn block" id="cSave">حفظ</button>
   ${ex?(askDel?'<div class="confirm"><span>حذف هذه السيارة؟ تبقى مصاريفها المسجلة في السجل.</span><div class="row2"><button class="btn danger" id="cDel">نعم، احذف</button><button class="btn ghost" id="cDelNo">تراجع</button></div></div>':'<button class="btn ghost block" id="cDelAsk" style="color:var(--exp)">حذف السيارة</button>'):'<button class="btn ghost block" data-close>إلغاء</button>'}
   </div></div></div>`};
  const v=i=>document.getElementById(i).value;
  const grab=()=>{c.name=v('cName');c.plate=v('cPlate');c.odo=v('cOdo');c.insExpiry=v('cInsExp');c.insCost=v('cInsCost');c.insCo=v('cInsCo');c.regExpiry=v('cRegExp');c.regCost=v('cRegCost');const o=v('cOwner');c.owner=o==='__other'?(v('cOther').trim()||'شخص آخر'):o;c.alertDays=+v('cAlert')||30};
  L.oninput=null;L.onchange=e=>{if(e.target.id==='cOwner'){const w=document.getElementById('cOtherWrap');w.hidden=e.target.value!=='__other';if(!w.hidden)document.getElementById('cOther').focus()}};
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='cDelAsk'){grab();askDel=true;draw();return}
    if(x.id==='cDelNo'){grab();askDel=false;draw();return}
    if(x.id==='cDel'){S.settings.cars=C.filter(y=>y.id!==c.id);L.innerHTML='';putSettings();render();toast('حُذفت السيارة');return}
    if(x.id==='cSave'){grab();if(!c.name.trim()){const er=document.getElementById('cErr');er.hidden=false;er.textContent='اكتب اسم السيارة';return}
      const rec=Object.assign({},c,{name:c.name.trim(),plate:c.plate.trim(),odo:parseInt(String(c.odo).replace(/[^\d]/g,''))||0,insCost:parseAmt(c.insCost),regCost:parseAmt(c.regCost),insCo:c.insCo.trim(),services:c.services||[]});
      const i=C.findIndex(y=>y.id===c.id);if(i>=0)C[i]=rec;else C.push(rec);
      ['ins','reg'].forEach(k=>{const g=carGoal(rec,k);if(g&&rec[k+'Expiry']){g.due=rec[k+'Expiry'];g.target=rec[k+'Cost']||g.target}});
      L.innerHTML='';putSettings();render();toast('حُفظت '+rec.name)}};
  draw();
}
function openRenew(ref){
  const [cid,k]=ref.split(':');const c=cars().find(x=>x.id===cid);if(!c)return;const L=document.getElementById('layer');const n=k==='ins'?'التأمين':'الملكية';
  L.innerHTML=`${sheetTop('تجديد')}
   <h2 style="margin-top:0">جدّدت ${n} لـ${esc(c.name)}</h2>
   <div class="amtbox"><input id="nAmt" inputmode="decimal" placeholder="0.000" value="${c[k+'Cost']?amtIn(c[k+'Cost']):''}" aria-label="المبلغ المدفوع"><span>${CUR}</span></div>
   <div class="stack"><div class="row2"><div class="field"><label for="nDate">تاريخ الدفع</label><input class="inp" type="date" id="nDate" value="${today()}"></div>
   <div class="field"><label for="nExp">ينتهي الجديد في</label><input class="inp" type="date" id="nExp" value="${plusYear(c[k+'Expiry']&&daysTo(c[k+'Expiry'])>-60?c[k+'Expiry']:today())}"></div></div>
   <p class="note" style="margin:0">يُسجَّل المبلغ كمصروف في فئة السيارة، ويُحدَّث تاريخ الانتهاء.</p>
   <button class="btn block" id="nSave">حفظ</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`;
  L.onchange=L.oninput=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='nSave'){const amt=parseAmt(document.getElementById('nAmt').value);const d=document.getElementById('nDate').value||today();const exp=document.getElementById('nExp').value;
      c[k+'Expiry']=exp;if(amt)c[k+'Cost']=amt;
      const g=carGoal(c,k);if(g){g.due=exp;g.saved=0;g.log={};if(amt)g.target=amt}
      L.innerHTML='';await putSettings();
      if(amt){const t={id:uidGen(),type:'exp',amount:amt,cat:'car',date:d,method:'card',note:'تجديد '+n+' - '+c.name,createdAt:new Date().toISOString(),car:c.id};if(c.owner&&c.owner.startsWith('p:'))t.person=c.owner.slice(2);await putTx(t)}else render();
      toast('جُدِّد '+n+' حتى '+fmtD(exp))}};
}
function carToGoal(ref){const [cid,k]=ref.split(':');const c=cars().find(x=>x.id===cid);if(!c)return;
  const G=S.settings.goals||(S.settings.goals=[]);if(carGoal(c,k))return;
  G.push({id:uidGen(),kind:k==='ins'?'insurance':'mulkiya',name:(k==='ins'?'تأمين ':'ملكية ')+c.name,target:c[k+'Cost'],saved:0,due:c[k+'Expiry'],repeat:'yearly',log:{},carRef:c.id+':'+k});
  putSettings();render();toast('أُضيف إلى خطة الادخار')}
function openSvc(cid,sid){
  const c=cars().find(x=>x.id===cid);if(!c)return;c.services=c.services||[];const ex=sid?c.services.find(x=>x.id===sid):null;
  const s=ex?Object.assign({},ex):{id:uidGen(),type:'',date:today(),odo:c.odo||'',cost:'',note:'',nextDate:'',nextOdo:''};let askDel=false;
  const L=document.getElementById('layer');
  const draw=()=>{L.innerHTML=`${sheetTop('صيانة')}
   <h2 style="margin-top:0">${ex?'تعديل الصيانة':'صيانة جديدة'} · ${esc(c.name)}</h2><div class="stack">
   <div class="field"><label>نوع الصيانة</label><div class="chips">${SVC_TYPES.map(t=>`<button class="chip" data-stype="${t}" aria-pressed="${s.type===t}">${t}</button>`).join('')}</div></div>
   <div class="row2"><div class="field"><label for="sDate">التاريخ</label><input class="inp" type="date" id="sDate" value="${esc(s.date)}"></div>
   <div class="field"><label for="sCost">التكلفة (${CUR})</label><input class="inp num" id="sCost" inputmode="decimal" value="${s.cost?amtIn(s.cost):''}" placeholder="0.000" style="text-align:left"></div></div>
   <div class="row2"><div class="field"><label for="sOdo">العداد وقتها (كم)</label><input class="inp num" id="sOdo" inputmode="numeric" value="${esc(s.odo)}" style="text-align:left"></div>
   <div class="field"><label for="sNote">الورشة / ملاحظة</label><input class="inp" id="sNote" value="${esc(s.note)}" maxlength="40"></div></div>
   <h2 style="margin:6px 0 0;font-size:15px">الموعد القادم (اختياري)</h2>
   <div class="row2"><div class="field"><label for="sNextD">بتاريخ</label><input class="inp" type="date" id="sNextD" value="${esc(s.nextDate)}"></div>
   <div class="field"><label for="sNextO">أو عند العداد (كم)</label><input class="inp num" id="sNextO" inputmode="numeric" value="${esc(s.nextOdo)}" style="text-align:left"></div></div>
   <p class="note" style="margin:0">يذكّرك التطبيق قبل الموعد بأسبوعين، أو قبل الوصول للعداد بـ500 كم.</p>
   <p class="note" id="sErr" hidden style="color:var(--exp);margin:0"></p>
   <button class="btn block" id="sSave">حفظ</button>
   ${ex?(askDel?'<div class="confirm"><span>حذف هذه الصيانة ومصروفها من السجل؟</span><div class="row2"><button class="btn danger" id="sDel">نعم، احذف</button><button class="btn ghost" id="sDelNo">تراجع</button></div></div>':'<button class="btn ghost block" id="sDelAsk" style="color:var(--exp)">حذف</button>'):'<button class="btn ghost block" data-close>إلغاء</button>'}
   </div></div></div>`};
  const v=i=>document.getElementById(i).value;
  const grab=()=>{s.date=v('sDate');s.cost=v('sCost');s.odo=v('sOdo');s.note=v('sNote');s.nextDate=v('sNextD');s.nextOdo=v('sNextO')};
  L.onchange=L.oninput=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.stype){grab();s.type=x.dataset.stype;draw();return}
    if(x.id==='sDelAsk'){grab();askDel=true;draw();return}
    if(x.id==='sDelNo'){grab();askDel=false;draw();return}
    if(x.id==='sDel'){c.services=c.services.filter(y=>y.id!==s.id);L.innerHTML='';await putSettings();if(s.txId&&S.tx[s.txId])await delTx(s.txId);else render();toast('حُذفت');return}
    if(x.id==='sSave'){grab();if(!s.type){const er=document.getElementById('sErr');er.hidden=false;er.textContent='اختر نوع الصيانة';return}
      const num=q=>parseInt(String(q||'').replace(/[^\d]/g,''))||0;
      const rec={id:s.id,type:s.type,date:s.date||today(),cost:parseAmt(s.cost),odo:num(s.odo),note:(s.note||'').trim(),nextDate:s.nextDate||'',nextOdo:num(s.nextOdo),txId:s.txId||''};
      if(rec.odo>(+c.odo||0))c.odo=rec.odo;
      let txp=null;
      if(rec.cost){const old=rec.txId&&S.tx[rec.txId];const t=Object.assign({},old||{id:uidGen(),createdAt:new Date().toISOString(),method:'card'},{type:'exp',amount:rec.cost,cat:'car',date:rec.date,note:'صيانة: '+rec.type+' - '+c.name,car:c.id});rec.txId=t.id;txp=t}
      else if(rec.txId&&S.tx[rec.txId]){await delTx(rec.txId);rec.txId=''}
      const i=c.services.findIndex(y=>y.id===rec.id);if(i>=0)c.services[i]=rec;else c.services.push(rec);
      L.innerHTML='';await putSettings();if(txp)await putTx(txp);else render();toast('حُفظت الصيانة')}};
  draw();
}

/* ---------- 17. ديوني وخطة التخلص منها ---------- */
const DEBT_T={loan:['قرض بنكي','loan','#8A4F7D'],card:['بطاقة ائتمان','card','#B8423A'],car:['تمويل سيارة','car','#3E7CB1'],house:['تمويل سكني','home','#2F7F7A'],people:['دين لشخص','family','#2E8B72'],personal:['دين شخصي','loan','#B0662F'],other:['دين آخر','iother','#7A8494']};
function debts(){return S.settings.debts||[]}
function debtPlan(){return Object.assign({strategy:'avalanche',extra:0},S.settings.debtPlan||{})}
function monthLabel(n){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()+Math.max(0,n-1)+debtOff());return MONTHS[d.getMonth()]+' '+d.getFullYear()}
function simDebts(list,extra,strategy,rollover){
  const now=new Date();const ahead=iso=>{const t=new Date(iso+'T12:00');return (t.getFullYear()-now.getFullYear())*12+t.getMonth()-now.getMonth()};
  const A=list.filter(d=>(+d.balance||0)>0.0005).map(d=>{const once=d.mode==='once';return{id:d.id,b:+d.balance,r:(+d.rate||0)/1200,p:once?0:+d.payment||0,once,at:once&&d.end?Math.max(1,ahead(d.end)+1):1,done:0}});
  const budget=A.reduce((s,d)=>s+d.p,0)+(+extra||0);let m=0,interest=0,paid=0;
  while(A.some(d=>d.b>0.0005)&&m<600){m++;
    A.forEach(d=>{if(d.b>0){const i=d.b*d.r;d.b+=i;interest+=i}});
    let left=rollover?budget:Infinity;
    A.forEach(d=>{if(d.b>0&&!d.once){const x=Math.min(d.b,d.p,left);d.b-=x;paid+=x;if(rollover)left-=x}});
    A.forEach(d=>{if(d.once&&d.b>0&&m>=d.at){paid+=d.b;d.b=0}});
    if(rollover){const order=A.filter(d=>d.b>0.0005&&!d.once).sort(strategy==='snowball'?(a,b)=>a.b-b.b:(a,b)=>(b.r-a.r)||(a.b-b.b));
      for(const d of order){if(left<=0.0005)break;const x=Math.min(d.b,left);d.b-=x;paid+=x;left-=x}}
    A.forEach(d=>{if(d.b<=0.0005&&!d.done){d.b=0;d.done=m}})}
  const stuck=A.some(d=>!d.done);
  return{months:stuck?null:m,interest,paid,finish:Object.fromEntries(A.map(d=>[d.id,d.done||null])),stuck}}
function debtBadge(d){const t=DEBT_T[d.type]||DEBT_T.other;return ovBadge('debt:'+d.id,`<span class="cbadge" style="background:${t[2]}1f;color:${t[2]}">${svgI(CI[t[1]]||CI.iother)}</span>`)}
function debtResHtml(){const Ds=debts(),P=debtPlan();if(!Ds.some(d=>+d.balance>0))return '<div class="okbox">لا توجد ديون متبقية. مبروك!</div>';
  const plan=simDebts(Ds,P.extra,P.strategy,true),base=simDebts(Ds,0,P.strategy,false);
  if(plan.stuck){const bad=Ds.filter(d=>+d.balance>0&&d.mode!=='once'&&(+d.payment||0)<=(+d.balance)*(+d.rate||0)/1200+0.0005).map(d=>d.name);
    return `<div class="warnbox">لا يمكن إنهاء الديون بهذه المبالغ: ${bad.length?'القسط لا يغطي الفائدة الشهرية في '+bad.map(esc).join('، ')+'. ':''}زد القسط أو المبلغ الإضافي.</div>`}
  let h=`<div class="planpreview"><div><span class="note">تتخلص من ديونك في</span><b>${monthLabel(plan.months)}</b></div><div><span class="note">المدة</span><b>${monthsWord(plan.months)}</b></div><div><span class="note">إجمالي ما ستدفعه</span><b class="num">${amtH(plan.paid)}</b></div></div>`;
  if(plan.interest>0.0005)h+=`<div class="note">منها فوائد متوقعة <b class="num">${money(plan.interest)}</b> ${CUR}</div>`;
  if(+P.extra>0&&!base.stuck){const dm=base.months-plan.months,di=base.interest-plan.interest;
    h+=`<div class="okbox">بإضافة <b class="num">${amtH(P.extra)}</b> شهريًا تنتهي ${dm>0?'قبل '+monthsWord(dm)+' من موعدها':'في نفس الموعد تقريبًا'}${di>0.5?' وتوفّر <b class="num">'+amtH(di)+'</b> من الفوائد':''}.</div>`}
  else if(!+P.extra)h+='<div class="note">أضف مبلغًا إضافيًا ولو بسيطًا كل شهر لتنتهي أسرع وتدفع فوائد أقل.</div>';
  const order=Ds.filter(d=>+d.balance>0).sort((a,b)=>(plan.finish[a.id]||999)-(plan.finish[b.id]||999));
  h+=`<div class="panel" style="padding-block:6px"><div class="note" style="padding-block:4px">ترتيب السداد حسب خطتك</div>${order.map((d,i)=>`<div class="sumrow"><span>${i+1}. ${esc(d.name)}</span><b>${plan.finish[d.id]?monthLabel(plan.finish[d.id]):'—'}</b></div>`).join('')}</div>`;
  return h}
/* أقسام الديون: البنوك والتمويل، ديون لأشخاص، ديون شخصية وأخرى */
const DEBT_G={bank:['البنوك والتمويل','#3E7CB1','loan'],people:['ديون لأشخاص','#2E8B72','family'],personal:['ديون شخصية وأخرى','#B0662F','iother']};
Object.keys(DEBT_G).forEach(k=>Object.defineProperty(DEBT_G[k],0,{get:()=>lbl('dgrp.'+k),enumerable:true}));
function debtGroup(d){return d.type==='people'?'people':['loan','card','car','house'].includes(d.type)?'bank':'personal'}
const DEBT_SORT={end:'الأقرب انتهاءً',amount:'الأكبر مبلغًا',period:'الأطول مدة',rate:'الأعلى فائدة'};
/* القسط الشهري: الدين الذي يُسدَّد دفعة واحدة ليس له قسط شهري */
function debtInst(d){return d.mode==='once'?0:+d.payment||0}
function debtStart(d){return d.start||(debtPays(d)[0]||{}).date||((d.log||[])[0]||{}).at||today()}
function daysBetween(a,b){return Math.round((new Date(b+'T12:00')-new Date(a+'T12:00'))/864e5)}
function monthsBetween(a,b){const A=new Date(a+'T12:00'),B=new Date(b+'T12:00');return Math.max(0,(B.getFullYear()-A.getFullYear())*12+B.getMonth()-A.getMonth()-(B.getDate()<A.getDate()?1:0))}
function spanWord(a,b){if(!a||!b)return '—';const m=monthsBetween(a,b);if(m>=12){const y=Math.floor(m/12),r=m%12;return countWord(y,'سنة','سنتان','سنوات','سنة')+(r?' و'+monthsWord(r):'')}
  if(m>=1)return monthsWord(m);const d=Math.max(0,daysBetween(a,b));return d?daysWord(d):'نفس اليوم'}
/* موعد الانتهاء المقرر: المتفق عليه إن وُجد، وإلا حسب خطتك */
function debtEnd(d,pl){if(d.closed)return d.closed.end;if(d.end)return d.end;pl=pl||debtSim();const n=pl.finish[d.id];
  if(!n)return d.end||null;const t=new Date();const dt=new Date(t.getFullYear(),t.getMonth()+n-1+debtOff(),1);dt.setDate(Math.min(+d.day||1,monthDays(dt)));return isoD(dt)}
function debtSim(){const P=debtPlan();return simDebts(debts(),P.extra,P.strategy,true)}
/* عند انتهاء الدين يُحفظ ملخصه: المدة، طريقة التخلص منه، وما دفعته */
const CLOSE_M={lump:'دفعة واحدة بالمبلغ الإجمالي',inst:'أقساط على فترات',early:'أقساط ثم سداد مبكر للباقي'};
function debtCloseInfo(d){const P=debtPays(d);const last=P[P.length-1];const end=last?last.date:today();
  const total=r3(P.reduce((s,p)=>s+(+p.amt||0),0)),int=r3(P.reduce((s,p)=>s+payParts(d,p).int,0));
  const method=P.length<=1?'lump':(d.mode!=='once'&&last&&+last.amt>=1.5*(+d.payment||0)?'early':'inst');
  return{start:debtStart(d),end,total,int,count:P.length,method}}
function debtSync(d){if(!(+d.balance>0.0005)){if(!d.closed){d.closed=debtCloseInfo(d);debtLog(d,'انتهى الدين: '+CLOSE_M[d.closed.method]+' خلال '+spanWord(d.closed.start,d.closed.end))}}
  else if(d.closed){delete d.closed;debtLog(d,'أُعيد فتح الدين بعد تعديل الدفعات')}}
function debtSort(A,k,pl){const e=d=>debtEnd(d,pl)||'9999';const per=d=>daysBetween(debtStart(d),debtEnd(d,pl)||today());
  return A.slice().sort(k==='amount'?(a,b)=>(+b.balance)-(+a.balance):k==='period'?(a,b)=>per(b)-per(a):k==='rate'?(a,b)=>(+b.rate||0)-(+a.rate||0)||(+b.balance)-(+a.balance):(a,b)=>e(a).localeCompare(e(b)))}
function debtCard(d,pl){const t=DEBT_T[d.type]||DEBT_T.other;const o=Math.max(+d.original||0,+d.balance||0);const p=o?Math.min(100,(o-(+d.balance))/o*100):0;const cm=ym(new Date());
  const once=d.mode==='once';const paidThis=debtPaidIn(d,cm)>0;const end=debtEnd(d,pl),start=debtStart(d);const dueNow=once?(end&&end.slice(0,7)<=cm):true;
  const late=!paidThis&&dueNow&&(once?daysTo(end)<0:new Date().getDate()>(+d.day||1));
  const pill=paidThis&&!once?'<span class="pill paid">قسط الشهر مدفوع</span>':late?`<span class="pill late">${once?'تأخر السداد':'قسط الشهر متأخر'}</span>`:once?`<span class="pill soon">يُسدَّد ${end?fmtD(end):''}</span>`:`<span class="pill soon">القسط يوم ${+d.day||1}</span>`;
  const n=debtLeft(d);const dl=end?daysTo(end):null;
  return `<div class="goal dcard" style="--gc:${DEBT_G[debtGroup(d)][1]}"><div class="ghead"><div style="display:flex;gap:10px;align-items:flex-start;min-width:0">${debtBadge(d)}<div style="min-width:0"><b>${esc(d.name)}</b><small>${[t[0]!==d.name?t[0]:'',d.lender].filter(Boolean).map(esc).join(' · ')||esc(t[0])}</small></div></div>
    <div class="gm"><span>المتبقي</span><b class="num">${amtH(d.balance)}</b></div></div>
    <div class="meter"><i style="width:${p}%;background:var(--inc)"></i></div>
    <div class="budgetline" style="margin:0"><span>سدّدت ${Math.round(p)}% من <b class="num">${amtH(o)}</b></span>${pill}</div>
    <div class="dinfo"><div><span>بدأ</span><b>${fmtD(start)}</b></div><div><span>ينتهي المقرر</span><b>${end?fmtD(end):'—'}</b></div><div><span>المدة</span><b>${end?spanWord(start,end):'—'}</b></div></div>
    <div class="budgetline" style="margin:0"><span>${once?'يُسدَّد <b>دفعة واحدة</b> بالمبلغ الإجمالي':'القسط <b class="num">'+amtH(d.payment)+'</b>'}${+d.rate?' · فائدة '+(+d.rate)+'%':' · بدون فائدة'}</span></div>
    ${(()=>{const I=debtInstInfo(d),tf=debtTrackFrom(d);return `<div class="dinfo dtrack"><div><span>المتابعة من</span><b>${dmy(tf)}</b></div>${!once&&(I.tot||I.paid)?`<div><span>الأقساط</span><b>${I.tot?I.paid+' من '+I.tot:I.paid+' مدفوعة'}</b></div>${I.tot?`<div><span>باقٍ حسب العقد</span><b>${countWord(I.left,'قسط واحد','قسطان','أقساط','قسطًا')}</b></div>`:''}`:''}${d.ref?`<div><span>رقم العقد</span><b dir="ltr">${esc(d.ref)}</b></div>`:''}</div>${d.note?`<div class="note" style="margin:0">📝 ${esc(d.note)}</div>`:''}${!once&&I.tot&&n&&Math.abs(n-I.left)>1?`<div class="warnbox" style="margin:0;font-size:13px">⚠️ المتبقي (${money(d.balance)}) يكفي لـ${countWord(n,'قسط واحد','قسطين','أقساط','قسطًا')}، والعقد يقول باقٍ ${countWord(I.left,'قسط واحد','قسطان','أقساط','قسطًا')}. راجع «المتبقي الآن» أو القسط أو عدد الأقساط من إدارة البيانات.</div>`:''}`})()}
    ${n||dl!==null?`<div class="dleft">⏳ ${once?'':n?'حسب المتبقي: باقٍ '+countWord(n,'قسط واحد','قسطان','أقساط','قسطًا')+' · ':''}${dl===null?'':dl<0?'تأخر '+daysWord(-dl):dl===0?'موعده اليوم':'بعد '+daysWord(dl)}</div>`:''}
    <div class="gbtns">${DMODE==='manage'?`<button class="chip pay" data-dedit="${esc(d.id)}"><span class="lk">🔒 </span>تعديل</button><button class="chip" data-dprint="${esc(d.id)}">كشف للطباعة</button>`:`<button class="chip pay" data-dgopay="${esc(d.id)}">💳 الدفع من ${esc(lbl('sec.monthly'))}</button><button class="chip" data-dprint="${esc(d.id)}">كشف</button>`}</div>
    ${debtHistHtml(d)}</div>`}
function debtDoneCard(d){const t=DEBT_T[d.type]||DEBT_T.other;const c=d.closed||debtCloseInfo(d);const o=Math.max(+d.original||0,c.total);
  return `<div class="goal done dcard" style="--gc:${DEBT_G[debtGroup(d)][1]}"><div class="ghead"><div style="display:flex;gap:10px;align-items:flex-start;min-width:0">${debtBadge(d)}<div style="min-width:0"><b>${esc(d.name)}</b><small>${[t[0]!==d.name?t[0]:'',d.lender].filter(Boolean).map(esc).join(' · ')||esc(t[0])}</small></div></div>
    <span class="pill paid">انتهى ✓</span></div>
    <div class="dinfo"><div><span>المبلغ الأصلي</span><b class="num">${amtH(o)}</b></div><div><span>مجموع ما دفعته</span><b class="num">${amtH(c.total)}</b></div><div><span>${c.int>0.0005?'منها فوائد':'الدفعات'}</span><b class="num">${c.int>0.0005?amtH(c.int):c.count}</b></div></div>
    <div class="ddone"><div><span>المدة</span><b>${fmtD(c.start)} ← ${fmtD(c.end)} · استغرق ${spanWord(c.start,c.end)}</b></div>
     <div><span>طريقة التخلص منه</span><b>${CLOSE_M[c.method]}${c.count>1?' ('+countWord(c.count,'دفعة واحدة','دفعتان','دفعات','دفعة')+')':''}</b></div></div>
    <div class="gbtns"><button class="chip" data-dprint="${esc(d.id)}">كشف للطباعة</button>${DMODE==='manage'?`<button class="chip" data-dedit="${esc(d.id)}"><span class="lk">🔒 </span>تعديل</button>`:''}</div>
    ${debtHistHtml(d)}</div>`}
/* خانة التذكير في قسم الديون: أدعية وآيات التيسير وقضاء الدين. تعديلها من وضع المدير فقط */
const DEBT_DUA=[
 ['﴿فَإِنَّ مَعَ الْعُسْرِ يُسْرًا • إِنَّ مَعَ الْعُسْرِ يُسْرًا﴾','سورة الشرح: 5-6'],
 ['﴿وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا • وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ﴾','سورة الطلاق: 2-3'],
 ['﴿سَيَجْعَلُ اللَّهُ بَعْدَ عُسْرٍ يُسْرًا﴾','سورة الطلاق: 7'],
 ['اللهم اكفني بحلالك عن حرامك، وأغنني بفضلك عمّن سواك','رواه الترمذي'],
 ['اللهم إني أعوذ بك من الهمّ والحزن، والعجز والكسل، والبخل والجبن، وضلَع الدَّين وغلبة الرجال','رواه البخاري'],
 ['اللهم لا سهل إلا ما جعلته سهلًا، وأنت تجعل الحَزْن إذا شئت سهلًا','رواه ابن حبان']];
function debtNoteParts(){return String(S.settings.debtNote||'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean)}
function debtNoteHtml(){const P=debtNoteParts();const lock=admOn()&&!Adm.open;
  if(!P.length)return `<div class="panel dnote empty"><div class="dnote-h"><b>🤲 تذكير</b><button class="chip" id="dnEdit">${lock?'🔒 ':''}+ إضافة</button></div><span class="note">اكتب هنا أدعية وآيات التيسير وقضاء الدين، فتظهر شريطًا متحركًا هنا وفي الرئيسية.${admOn()?' تعديلها من وضع المدير فقط.':''}</span></div>`;
  return `<div class="dnote-tk">${duaTickerHtml('in-debts')}<button class="chip" id="dnEdit" aria-label="تعديل الأدعية">${lock?'🔒':'✎'} تعديل</button></div>`}
function openDebtNote(){const L=document.getElementById('layer');let txt=S.settings.debtNote||'';
  const draw=()=>{L.innerHTML=`${sheetTop('تذكير')}<h2 style="margin-top:0">🤲 تذكير «ديوني»</h2>
   <div class="stack"><div class="field"><label for="dnTxt">أدعية وآيات وكلمات تذكّرك (اترك سطرًا فارغًا بين كل واحدة)</label><textarea class="inp dntxt" id="dnTxt" maxlength="3000" rows="9">${esc(txt)}</textarea></div>
   <div class="field"><label>إضافة من المقترحات</label><div class="dnsug">${DEBT_DUA.map((d,i)=>`<button class="dnchip" data-dns="${i}"><span>${esc(d[0])}</span><small>${esc(d[1])}</small></button>`).join('')}</div></div>
   <p class="note" style="margin:0">تظهر كاملة أعلى صفحة «ديوني»، وواحدة منها كل يوم في الرئيسية.</p></div>
   <div class="actions"><button class="btn block" id="dnSave">حفظ</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`};
  draw();L.onchange=null;L.oninput=e=>{if(e.target.id==='dnTxt')txt=e.target.value};
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.dns){const d=DEBT_DUA[+x.dataset.dns];const t=d[0]+'\n('+d[1]+')';if(txt.includes(d[0])){toast('موجودة مسبقًا');return}txt=(txt.trim()?txt.trim()+'\n\n':'')+t;const a=document.getElementById('dnTxt');a.value=txt;a.scrollTop=a.scrollHeight;x.classList.add('on');return}
    if(x.id==='dnSave'){S.settings.debtNote=txt.trim().slice(0,3000);await putSettings();L.innerHTML='';render();toast(S.settings.debtNote?'حُفظ التذكير':'حُذف التذكير')}}}
/* سورة الملك: نص مشروع تنزيل (tanzil.net)، برسمين: الإملائي والعثماني. النص ثابت ولا يُعدَّل من التطبيق حفاظًا على صحته */
const MULK={"simple":{"b":"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ","v":["تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ","الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا وَهُوَ الْعَزِيزُ الْغَفُورُ","الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا مَّا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ فَارْجِعِ الْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ","ثُمَّ ارْجِعِ الْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ الْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ","وَلَقَدْ زَيَّنَّا السَّمَاءَ الدُّنْيَا بِمَصَابِيحَ وَجَعَلْنَاهَا رُجُومًا لِّلشَّيَاطِينِ وَأَعْتَدْنَا لَهُمْ عَذَابَ السَّعِيرِ","وَلِلَّذِينَ كَفَرُوا بِرَبِّهِمْ عَذَابُ جَهَنَّمَ وَبِئْسَ الْمَصِيرُ","إِذَا أُلْقُوا فِيهَا سَمِعُوا لَهَا شَهِيقًا وَهِيَ تَفُورُ","تَكَادُ تَمَيَّزُ مِنَ الْغَيْظِ كُلَّمَا أُلْقِيَ فِيهَا فَوْجٌ سَأَلَهُمْ خَزَنَتُهَا أَلَمْ يَأْتِكُمْ نَذِيرٌ","قَالُوا بَلَىٰ قَدْ جَاءَنَا نَذِيرٌ فَكَذَّبْنَا وَقُلْنَا مَا نَزَّلَ اللَّهُ مِن شَيْءٍ إِنْ أَنتُمْ إِلَّا فِي ضَلَالٍ كَبِيرٍ","وَقَالُوا لَوْ كُنَّا نَسْمَعُ أَوْ نَعْقِلُ مَا كُنَّا فِي أَصْحَابِ السَّعِيرِ","فَاعْتَرَفُوا بِذَنبِهِمْ فَسُحْقًا لِّأَصْحَابِ السَّعِيرِ","إِنَّ الَّذِينَ يَخْشَوْنَ رَبَّهُم بِالْغَيْبِ لَهُم مَّغْفِرَةٌ وَأَجْرٌ كَبِيرٌ","وَأَسِرُّوا قَوْلَكُمْ أَوِ اجْهَرُوا بِهِ إِنَّهُ عَلِيمٌ بِذَاتِ الصُّدُورِ","أَلَا يَعْلَمُ مَنْ خَلَقَ وَهُوَ اللَّطِيفُ الْخَبِيرُ","هُوَ الَّذِي جَعَلَ لَكُمُ الْأَرْضَ ذَلُولًا فَامْشُوا فِي مَنَاكِبِهَا وَكُلُوا مِن رِّزْقِهِ وَإِلَيْهِ النُّشُورُ","أَأَمِنتُم مَّن فِي السَّمَاءِ أَن يَخْسِفَ بِكُمُ الْأَرْضَ فَإِذَا هِيَ تَمُورُ","أَمْ أَمِنتُم مَّن فِي السَّمَاءِ أَن يُرْسِلَ عَلَيْكُمْ حَاصِبًا فَسَتَعْلَمُونَ كَيْفَ نَذِيرِ","وَلَقَدْ كَذَّبَ الَّذِينَ مِن قَبْلِهِمْ فَكَيْفَ كَانَ نَكِيرِ","أَوَلَمْ يَرَوْا إِلَى الطَّيْرِ فَوْقَهُمْ صَافَّاتٍ وَيَقْبِضْنَ مَا يُمْسِكُهُنَّ إِلَّا الرَّحْمَٰنُ إِنَّهُ بِكُلِّ شَيْءٍ بَصِيرٌ","أَمَّنْ هَٰذَا الَّذِي هُوَ جُندٌ لَّكُمْ يَنصُرُكُم مِّن دُونِ الرَّحْمَٰنِ إِنِ الْكَافِرُونَ إِلَّا فِي غُرُورٍ","أَمَّنْ هَٰذَا الَّذِي يَرْزُقُكُمْ إِنْ أَمْسَكَ رِزْقَهُ بَل لَّجُّوا فِي عُتُوٍّ وَنُفُورٍ","أَفَمَن يَمْشِي مُكِبًّا عَلَىٰ وَجْهِهِ أَهْدَىٰ أَمَّن يَمْشِي سَوِيًّا عَلَىٰ صِرَاطٍ مُّسْتَقِيمٍ","قُلْ هُوَ الَّذِي أَنشَأَكُمْ وَجَعَلَ لَكُمُ السَّمْعَ وَالْأَبْصَارَ وَالْأَفْئِدَةَ قَلِيلًا مَّا تَشْكُرُونَ","قُلْ هُوَ الَّذِي ذَرَأَكُمْ فِي الْأَرْضِ وَإِلَيْهِ تُحْشَرُونَ","وَيَقُولُونَ مَتَىٰ هَٰذَا الْوَعْدُ إِن كُنتُمْ صَادِقِينَ","قُلْ إِنَّمَا الْعِلْمُ عِندَ اللَّهِ وَإِنَّمَا أَنَا نَذِيرٌ مُّبِينٌ","فَلَمَّا رَأَوْهُ زُلْفَةً سِيئَتْ وُجُوهُ الَّذِينَ كَفَرُوا وَقِيلَ هَٰذَا الَّذِي كُنتُم بِهِ تَدَّعُونَ","قُلْ أَرَأَيْتُمْ إِنْ أَهْلَكَنِيَ اللَّهُ وَمَن مَّعِيَ أَوْ رَحِمَنَا فَمَن يُجِيرُ الْكَافِرِينَ مِنْ عَذَابٍ أَلِيمٍ","قُلْ هُوَ الرَّحْمَٰنُ آمَنَّا بِهِ وَعَلَيْهِ تَوَكَّلْنَا فَسَتَعْلَمُونَ مَنْ هُوَ فِي ضَلَالٍ مُّبِينٍ","قُلْ أَرَأَيْتُمْ إِنْ أَصْبَحَ مَاؤُكُمْ غَوْرًا فَمَن يَأْتِيكُم بِمَاءٍ مَّعِينٍ"]},"uthmani":{"b":"بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ","v":["تَبَٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ","ٱلَّذِى خَلَقَ ٱلْمَوْتَ وَٱلْحَيَوٰةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا وَهُوَ ٱلْعَزِيزُ ٱلْغَفُورُ","ٱلَّذِى خَلَقَ سَبْعَ سَمَٰوَٰتٍ طِبَاقًا مَّا تَرَىٰ فِى خَلْقِ ٱلرَّحْمَٰنِ مِن تَفَٰوُتٍ فَٱرْجِعِ ٱلْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ","ثُمَّ ٱرْجِعِ ٱلْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ ٱلْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ","وَلَقَدْ زَيَّنَّا ٱلسَّمَآءَ ٱلدُّنْيَا بِمَصَٰبِيحَ وَجَعَلْنَٰهَا رُجُومًا لِّلشَّيَٰطِينِ وَأَعْتَدْنَا لَهُمْ عَذَابَ ٱلسَّعِيرِ","وَلِلَّذِينَ كَفَرُوا۟ بِرَبِّهِمْ عَذَابُ جَهَنَّمَ وَبِئْسَ ٱلْمَصِيرُ","إِذَآ أُلْقُوا۟ فِيهَا سَمِعُوا۟ لَهَا شَهِيقًا وَهِىَ تَفُورُ","تَكَادُ تَمَيَّزُ مِنَ ٱلْغَيْظِ كُلَّمَآ أُلْقِىَ فِيهَا فَوْجٌ سَأَلَهُمْ خَزَنَتُهَآ أَلَمْ يَأْتِكُمْ نَذِيرٌ","قَالُوا۟ بَلَىٰ قَدْ جَآءَنَا نَذِيرٌ فَكَذَّبْنَا وَقُلْنَا مَا نَزَّلَ ٱللَّهُ مِن شَىْءٍ إِنْ أَنتُمْ إِلَّا فِى ضَلَٰلٍ كَبِيرٍ","وَقَالُوا۟ لَوْ كُنَّا نَسْمَعُ أَوْ نَعْقِلُ مَا كُنَّا فِىٓ أَصْحَٰبِ ٱلسَّعِيرِ","فَٱعْتَرَفُوا۟ بِذَنۢبِهِمْ فَسُحْقًا لِّأَصْحَٰبِ ٱلسَّعِيرِ","إِنَّ ٱلَّذِينَ يَخْشَوْنَ رَبَّهُم بِٱلْغَيْبِ لَهُم مَّغْفِرَةٌ وَأَجْرٌ كَبِيرٌ","وَأَسِرُّوا۟ قَوْلَكُمْ أَوِ ٱجْهَرُوا۟ بِهِۦٓ إِنَّهُۥ عَلِيمٌۢ بِذَاتِ ٱلصُّدُورِ","أَلَا يَعْلَمُ مَنْ خَلَقَ وَهُوَ ٱللَّطِيفُ ٱلْخَبِيرُ","هُوَ ٱلَّذِى جَعَلَ لَكُمُ ٱلْأَرْضَ ذَلُولًا فَٱمْشُوا۟ فِى مَنَاكِبِهَا وَكُلُوا۟ مِن رِّزْقِهِۦ وَإِلَيْهِ ٱلنُّشُورُ","ءَأَمِنتُم مَّن فِى ٱلسَّمَآءِ أَن يَخْسِفَ بِكُمُ ٱلْأَرْضَ فَإِذَا هِىَ تَمُورُ","أَمْ أَمِنتُم مَّن فِى ٱلسَّمَآءِ أَن يُرْسِلَ عَلَيْكُمْ حَاصِبًا فَسَتَعْلَمُونَ كَيْفَ نَذِيرِ","وَلَقَدْ كَذَّبَ ٱلَّذِينَ مِن قَبْلِهِمْ فَكَيْفَ كَانَ نَكِيرِ","أَوَلَمْ يَرَوْا۟ إِلَى ٱلطَّيْرِ فَوْقَهُمْ صَٰٓفَّٰتٍ وَيَقْبِضْنَ مَا يُمْسِكُهُنَّ إِلَّا ٱلرَّحْمَٰنُ إِنَّهُۥ بِكُلِّ شَىْءٍۭ بَصِيرٌ","أَمَّنْ هَٰذَا ٱلَّذِى هُوَ جُندٌ لَّكُمْ يَنصُرُكُم مِّن دُونِ ٱلرَّحْمَٰنِ إِنِ ٱلْكَٰفِرُونَ إِلَّا فِى غُرُورٍ","أَمَّنْ هَٰذَا ٱلَّذِى يَرْزُقُكُمْ إِنْ أَمْسَكَ رِزْقَهُۥ بَل لَّجُّوا۟ فِى عُتُوٍّ وَنُفُورٍ","أَفَمَن يَمْشِى مُكِبًّا عَلَىٰ وَجْهِهِۦٓ أَهْدَىٰٓ أَمَّن يَمْشِى سَوِيًّا عَلَىٰ صِرَٰطٍ مُّسْتَقِيمٍ","قُلْ هُوَ ٱلَّذِىٓ أَنشَأَكُمْ وَجَعَلَ لَكُمُ ٱلسَّمْعَ وَٱلْأَبْصَٰرَ وَٱلْأَفْـِٔدَةَ قَلِيلًا مَّا تَشْكُرُونَ","قُلْ هُوَ ٱلَّذِى ذَرَأَكُمْ فِى ٱلْأَرْضِ وَإِلَيْهِ تُحْشَرُونَ","وَيَقُولُونَ مَتَىٰ هَٰذَا ٱلْوَعْدُ إِن كُنتُمْ صَٰدِقِينَ","قُلْ إِنَّمَا ٱلْعِلْمُ عِندَ ٱللَّهِ وَإِنَّمَآ أَنَا۠ نَذِيرٌ مُّبِينٌ","فَلَمَّا رَأَوْهُ زُلْفَةً سِيٓـَٔتْ وُجُوهُ ٱلَّذِينَ كَفَرُوا۟ وَقِيلَ هَٰذَا ٱلَّذِى كُنتُم بِهِۦ تَدَّعُونَ","قُلْ أَرَءَيْتُمْ إِنْ أَهْلَكَنِىَ ٱللَّهُ وَمَن مَّعِىَ أَوْ رَحِمَنَا فَمَن يُجِيرُ ٱلْكَٰفِرِينَ مِنْ عَذَابٍ أَلِيمٍ","قُلْ هُوَ ٱلرَّحْمَٰنُ ءَامَنَّا بِهِۦ وَعَلَيْهِ تَوَكَّلْنَا فَسَتَعْلَمُونَ مَنْ هُوَ فِى ضَلَٰلٍ مُّبِينٍ","قُلْ أَرَءَيْتُمْ إِنْ أَصْبَحَ مَآؤُكُمْ غَوْرًا فَمَن يَأْتِيكُم بِمَآءٍ مَّعِينٍۭ"]}};

const AR_D=n=>String(n).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);
/* شريط الأدعية المتحرك في الرئيسية: نسخة من خانة «تذكير» في قسم الديون */
function duaTickerHtml(cls){const P=debtNoteParts().map(p=>p.replace(/\s*\n\s*/g,' '));if(!P.length)return '';
  const st=Math.floor(Date.now()/864e5)%P.length;const L=P.slice(st).concat(P.slice(0,st));const one=L.map(p=>`<span>${esc(p)}</span>`).join('<i>✦</i>');
  const dur=Math.max(25,Math.round(L.join('').length*0.28));
  return `<button class="ticker${cls?' '+cls:''}" data-duaread="1" aria-label="أدعية التيسير، اضغط لقراءتها كاملة"><span class="tk-ic">🤲</span><span class="tk-win"><span class="tk-run" style="animation-duration:${dur}s">${one}<i>✦</i>${one}<i>✦</i></span></span></button>`}
function openDuaRead(){const P=debtNoteParts();const L=document.getElementById('layer');
  L.innerHTML=`${sheetTop('الأدعية')}<h2 style="margin-top:0">🤲 أدعية التيسير وقضاء الدين</h2><div class="duaread">${P.map(p=>`<p>${esc(p)}</p>`).join('')}</div>
   <div class="actions"><button class="btn ghost block" data-tab="debts" data-close>ديوني</button><button class="btn ghost block" data-close>إغلاق</button></div></div></div>`;
  L.oninput=L.onchange=null;L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.dataset.tab){L.innerHTML='';S.tab='home';render();setTimeout(()=>{const h=document.getElementById('homeDebts');if(h){h.scrollIntoView({block:'start'});window.scrollBy(0,-70)}},60);return}if(x.hasAttribute('data-close'))L.innerHTML=''}}
/* أذكار الصباح والمساء من «حصن المسلم»، وآياتها من نص مشروع تنزيل. تُعرض كما هي ولا تُعدَّل */
const ADHKAR={"M": [{"c": 1, "r": "آية الكرسي · البقرة ٢٥٥", "t": "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ", "q": "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ ﴿٢٥٥﴾", "d": "من قالها حين يصبح أجير من الجن حتى يمسى ومن قالها حين يمسى أجير من الجن حتى يصبح."}, {"c": 3, "r": "سورة الإخلاص", "t": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "q": "قُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾ اللَّهُ الصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ﴿٤﴾", "d": "من قالها حين يصبح وحين يمسى كفته من كل شىء (الإخلاص والمعوذتين)."}, {"c": 3, "r": "سورة الفلق", "t": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "q": "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴿١﴾ مِن شَرِّ مَا خَلَقَ ﴿٢﴾ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ﴿٣﴾ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ﴿٤﴾ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴿٥﴾", "d": "من قالها حين يصبح وحين يمسى كفته من كل شىء (الإخلاص والمعوذتين)."}, {"c": 3, "r": "سورة الناس", "t": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "q": "قُلْ أَعُوذُ بِرَبِّ النَّاسِ ﴿١﴾ مَلِكِ النَّاسِ ﴿٢﴾ إِلَٰهِ النَّاسِ ﴿٣﴾ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ﴿٤﴾ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ﴿٥﴾ مِنَ الْجِنَّةِ وَالنَّاسِ ﴿٦﴾", "d": "من قالها حين يصبح وحين يمسى كفته من كل شىء (الإخلاص والمعوذتين)."}, {"c": 1, "r": "مسلم", "t": "أَصْبَحْنا وَأَصْبَحَ المُلْكُ لله وَالحَمدُ لله، لا إلهَ إلاّ اللّهُ وَحدَهُ لا شَريكَ لهُ، لهُ المُلكُ ولهُ الحَمْد، وهُوَ على كلّ شَيءٍ قدير، رَبِّ أسْأَلُكَ خَيرَ ما في هذا اليوم وَخَيرَ ما بَعْدَه، وَأَعوذُ بِكَ مِنْ شَرِّ ما في هذا اليوم وَشَرِّ ما بَعْدَه، رَبِّ أَعوذُبِكَ مِنَ الْكَسَلِ وَسوءِ الْكِبَر، رَبِّ أَعوذُ بِكَ مِنْ عَذابٍ في النّارِ وَعَذابٍ في القَبْر."}, {"c": 1, "r": "البخاري", "t": "اللّهمَّ أَنْتَ رَبِّي لا إلهَ إلاّ أَنْتَ، خَلَقْتَني وَأَنا عَبْدُك، وَأَنا عَلى عَهْدِكَ وَوَعْدِكَ ما اسْتَطَعْت، أَعوذُبِكَ مِنْ شَرِّ ما صَنَعْت، أَبوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبوءُ بِذَنْبي فَاغْفِرْ لي فَإِنَّهُ لا يَغْفِرُ الذُّنوبَ إِلاّ أَنْتَ.", "d": "من قالها موقنا بها حين يمسى ومات من ليلته دخل الجنة وكذلك حين يصبح."}, {"c": 3, "r": "أحمد", "t": "رَضيتُ بِاللهِ رَبَّاً وَبِالإسْلامِ ديناً وَبِمُحَمَّدٍ صلى الله عليه وسلم نَبِيّاً.", "d": "من قالها حين يصبح وحين يمسى كان حقا على الله أن يرضيه يوم القيامة."}, {"c": 4, "r": "أبو داود", "t": "اللّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُك، وَأُشْهِدُ حَمَلَةَ عَرْشِك، وَمَلَائِكَتَكَ، وَجَميعَ خَلْقِك، أَنَّكَ أَنْتَ اللهُ لا إلهَ إلاّ أَنْتَ وَحْدَكَ لا شَريكَ لَك، وَأَنَّ ُ مُحَمّداً عَبْدُكَ وَرَسولُك.", "d": "من قالها أعتقه الله من النار."}, {"c": 1, "r": "أبو داود", "t": "اللّهُمَّ ما أَصْبََحَ بي مِنْ نِعْمَةٍ أَو بِأَحَدٍ مِنْ خَلْقِك، فَمِنْكَ وَحْدَكَ لا شريكَ لَك، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْر.", "d": "من قالها حين يصبح أدى شكر يومه."}, {"c": 7, "r": "ابن السني", "t": "حَسْبِيَ اللّهُ لا إلهَ إلاّ هُوَ عَلَيهِ تَوَكَّلتُ وَهُوَ رَبُّ العَرْشِ العَظيم.", "d": "من قالها كفاه الله ما أهمه من أمر الدنيا والأخرة."}, {"c": 3, "r": "ابن ماجه", "t": "بِسمِ اللهِ الذي لا يَضُرُّ مَعَ اسمِهِ شَيءٌ في الأرْضِ وَلا في السّماءِ وَهوَ السّميعُ العَليم.", "d": "لم يضره من الله شيء."}, {"c": 1, "r": "الترمذي", "t": "اللّهُمَّ بِكَ أَصْبَحْنا وَبِكَ أَمْسَينا، وَبِكَ نَحْيا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُور."}, {"c": 1, "r": "أحمد", "t": "أَصْبَحْنا عَلَى فِطْرَةِ الإسْلاَمِ، وَعَلَى كَلِمَةِ الإِخْلاَصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِينَا إبْرَاهِيمَ حَنِيفاً مُسْلِماً وَمَا كَانَ مِنَ المُشْرِكِينَ."}, {"c": 3, "r": "مسلم", "t": "سُبْحانَ اللهِ وَبِحَمْدِهِ عَدَدَ خَلْقِه، وَرِضا نَفْسِه، وَزِنَةَ عَرْشِه، وَمِدادَ كَلِماتِه."}, {"c": 3, "r": "أحمد", "t": "اللّهُمَّ عافِني في بَدَني، اللّهُمَّ عافِني في سَمْعي، اللّهُمَّ عافِني في بَصَري، لا إلهَ إلاّ أَنْتَ."}, {"c": 1, "r": "أبو داود", "t": "اللّهُمَّ إِنِّي أسْأَلُكَ العَفْوَ وَالعافِيةَ في الدُّنْيا وَالآخِرَة، اللّهُمَّ إِنِّي أسْأَلُكَ العَفْوَ وَالعافِيةَ في ديني وَدُنْيايَ وَأهْلي وَمالي، اللّهُمَّ اسْتُرْ عوْراتي وَآمِنْ رَوْعاتي، اللّهُمَّ احْفَظْني مِن بَينِ يَدَيَّ وَمِن خَلْفي وَعَن يَميني وَعَن شِمالي، وَمِن فَوْقي، وَأَعوذُ بِعَظَمَتِكَ أَن أُغْتالَ مِن تَحْتي."}, {"c": 3, "r": "الترمذي", "t": "يَا حَيُّ يَا قيُّومُ بِرَحْمَتِكَ أسْتَغِيثُ أصْلِحْ لِي شَأنِي كُلَّهُ وَلاَ تَكِلْنِي إلَى نَفْسِي طَرْفَةَ عَيْنٍ."}, {"c": 1, "r": "أبو داود", "t": "أَصْبَحْنا وَأَصْبَحْ المُلكُ للهِ رَبِّ العالَمين، اللّهُمَّ إِنِّي أسْأَلُكَ خَيْرَ هذا اليَوْم، فَتْحَهُ، وَنَصْرَهُ، وَنورَهُ وَبَرَكَتَهُ، وَهُداهُ، وَأَعوذُ بِكَ مِنْ شَرِّ ما فيهِ وَشَرِّ ما بَعْدَه."}, {"c": 1, "r": "الترمذي", "t": "اللّهُمَّ عالِمَ الغَيْبِ وَالشّهادَةِ فاطِرَ السّماواتِ وَالأرْضِ رَبَّ كلِّ شَيءٍ وَمَليكَه، أَشْهَدُ أَنْ لا إِلهَ إِلاّ أَنْت، أَعوذُ بِكَ مِن شَرِّ نَفْسي وَمِن شَرِّ الشَّيْطانِ وَشِرْكِهِ، وَأَنْ أَقْتَرِفَ عَلى نَفْسي سوءاً أَوْ أَجُرَّهُ إِلى مُسْلِم."}, {"c": 3, "r": "", "t": "أَعوذُ بِكَلِماتِ اللّهِ التّامّاتِ مِنْ شَرِّ ما خَلَق."}, {"c": 3, "r": "", "t": "أسْتَغْفِرُ اللهَ العَظِيمَ الَّذِي لاَ إلَهَ إلاَّ هُوَ، الحَيُّ القَيُّومُ، وَأتُوبُ إلَيهِ."}, {"c": 1, "r": "ابن ماجه", "t": "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا."}, {"c": 100, "r": "الترمذي", "t": "لَا إلَه إلّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءِ قَدِيرِ.", "d": "من قالها 100 مرة في يوم كانت له عدل عشر رقاب، وكتبت له مئة حسنة، ومحيت عنه مئة سيئة، وكانت له حرزا من الشيطان في يومه ذلك حتى يمسي ولم يأتي أحد بأفضل مما جاء به إلا احد عمل أكثر من ذلك"}, {"c": 100, "r": "مسلم", "t": "سُبْحانَ اللهِ وَبِحَمْدِهِ.", "d": "حُطَّتْ خَطَايَاهُ وَإِنْ كَانَتْ مِثْلَ زَبَدِ الْبَحْرِ. لَمْ يَأْتِ أَحَدٌ يَوْمَ الْقِيَامَةِ بِأَفْضَلَ مِمَّا جَاءَ بِهِ إِلَّا أَحَدٌ قَالَ مِثْلَ مَا قَالَ أَوْ زَادَ عَلَيْهِ."}, {"c": 100, "r": "البخاري", "t": "أسْتَغْفِرُ اللهَ وَأتُوبُ إلَيْهِ", "d": "مائة حسنة، ومُحيت عنه مائة سيئة، وكانت له حرزاً من الشيطان حتى يمسى."}], "E": [{"c": 1, "r": "آية الكرسي · البقرة ٢٥٥", "t": "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ", "q": "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ ﴿٢٥٥﴾", "d": "من قالها حين يصبح أجير من الجن حتى يمسى ومن قالها حين يمسى أجير من الجن حتى يصبح."}, {"c": 1, "r": "خواتيم سورة البقرة ٢٨٥-٢٨٦", "t": "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ", "q": "آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ وَقَالُوا سَمِعْنَا وَأَطَعْنَا غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ ﴿٢٨٥﴾ لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ ﴿٢٨٦﴾", "d": "من قرأ آيتين من آخر سورة البقرة في ليلة كفتاه."}, {"c": 3, "r": "سورة الإخلاص", "t": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "q": "قُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾ اللَّهُ الصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ﴿٤﴾", "d": "من قالها حين يصبح وحين يمسى كفته من كل شىء (الإخلاص والمعوذتين)."}, {"c": 3, "r": "سورة الفلق", "t": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "q": "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴿١﴾ مِن شَرِّ مَا خَلَقَ ﴿٢﴾ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ﴿٣﴾ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ﴿٤﴾ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴿٥﴾"}, {"c": 3, "r": "سورة الناس", "t": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "q": "قُلْ أَعُوذُ بِرَبِّ النَّاسِ ﴿١﴾ مَلِكِ النَّاسِ ﴿٢﴾ إِلَٰهِ النَّاسِ ﴿٣﴾ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ﴿٤﴾ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ﴿٥﴾ مِنَ الْجِنَّةِ وَالنَّاسِ ﴿٦﴾"}, {"c": 1, "r": "مسلم", "t": "أَمْسَيْنا وَأَمْسى الملكُ لله وَالحَمدُ لله، لا إلهَ إلاّ اللّهُ وَحدَهُ لا شَريكَ لهُ، لهُ المُلكُ ولهُ الحَمْد، وهُوَ على كلّ شَيءٍ قدير، رَبِّ أسْأَلُكَ خَيرَ ما في هذهِ اللَّيْلَةِ وَخَيرَ ما بَعْدَها، وَأَعوذُ بِكَ مِنْ شَرِّ ما في هذهِ اللَّيْلةِ وَشَرِّ ما بَعْدَها، رَبِّ أَعوذُبِكَ مِنَ الْكَسَلِ وَسوءِ الْكِبَر، رَبِّ أَعوذُ بِكَ مِنْ عَذابٍ في النّارِ وَعَذابٍ في القَبْر."}, {"c": 1, "r": "البخاري", "t": "اللّهمَّ أَنْتَ رَبِّي لا إلهَ إلاّ أَنْتَ، خَلَقْتَني وَأَنا عَبْدُك، وَأَنا عَلى عَهْدِكَ وَوَعْدِكَ ما اسْتَطَعْت، أَعوذُبِكَ مِنْ شَرِّ ما صَنَعْت، أَبوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبوءُ بِذَنْبي فَاغْفِرْ لي فَإِنَّهُ لا يَغْفِرُ الذُّنوبَ إِلاّ أَنْتَ.", "d": "من قالها موقنا بها حين يمسى ومات من ليلته دخل الجنة وكذلك حين يصبح."}, {"c": 3, "r": "أحمد", "t": "رَضيتُ بِاللهِ رَبَّاً وَبِالإسْلامِ ديناً وَبِمُحَمَّدٍ صلى الله عليه وسلم نَبِيّاً.", "d": "من قالها حين يصبح وحين يمسى كان حقا على الله أن يرضيه يوم القيامة."}, {"c": 4, "r": "أبو داود", "t": "اللّهُمَّ إِنِّي أَمسيتُ أُشْهِدُك، وَأُشْهِدُ حَمَلَةَ عَرْشِك، وَمَلَائِكَتَكَ، وَجَميعَ خَلْقِك، أَنَّكَ أَنْتَ اللهُ لا إلهَ إلاّ أَنْتَ وَحْدَكَ لا شَريكَ لَك، وَأَنَّ ُ مُحَمّداً عَبْدُكَ وَرَسولُك.", "d": "من قالها أعتقه الله من النار."}, {"c": 1, "r": "أبو داود", "t": "اللّهُمَّ ما أَمسى بي مِنْ نِعْمَةٍ أَو بِأَحَدٍ مِنْ خَلْقِك، فَمِنْكَ وَحْدَكَ لا شريكَ لَك، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْر.", "d": "من قالها حين يمسى أدى شكر يومه."}, {"c": 7, "r": "ابن السني", "t": "حَسْبِيَ اللّهُ لا إلهَ إلاّ هُوَ عَلَيهِ تَوَكَّلتُ وَهُوَ رَبُّ العَرْشِ العَظيم.", "d": "من قالها كفاه الله ما أهمه من أمر الدنيا والأخرة."}, {"c": 3, "r": "ابن ماجه", "t": "بِسمِ اللهِ الذي لا يَضُرُّ مَعَ اسمِهِ شَيءٌ في الأرْضِ وَلا في السّماءِ وَهوَ السّميعُ العَليم.", "d": "لم يضره من الله شيء."}, {"c": 1, "r": "الترمذي", "t": "اللّهُمَّ بِكَ أَمْسَينا وَبِكَ أَصْبَحْنا، وَبِكَ نَحْيا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ."}, {"c": 1, "r": "أحمد", "t": "أَمْسَيْنَا عَلَى فِطْرَةِ الإسْلاَمِ، وَعَلَى كَلِمَةِ الإِخْلاَصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِينَا إبْرَاهِيمَ حَنِيفاً مُسْلِماً وَمَا كَانَ مِنَ المُشْرِكِينَ."}, {"c": 3, "r": "مسلم", "t": "سُبْحانَ اللهِ وَبِحَمْدِهِ عَدَدَ خَلْقِه، وَرِضا نَفْسِه، وَزِنَةَ عَرْشِه، وَمِدادَ كَلِماتِه."}, {"c": 3, "r": "أحمد", "t": "اللّهُمَّ عافِني في بَدَني، اللّهُمَّ عافِني في سَمْعي، اللّهُمَّ عافِني في بَصَري، لا إلهَ إلاّ أَنْتَ."}, {"c": 1, "r": "أبو داود", "t": "اللّهُمَّ إِنِّي أسْأَلُكَ العَفْوَ وَالعافِيةَ في الدُّنْيا وَالآخِرَة، اللّهُمَّ إِنِّي أسْأَلُكَ العَفْوَ وَالعافِيةَ في ديني وَدُنْيايَ وَأهْلي وَمالي، اللّهُمَّ اسْتُرْ عوْراتي وَآمِنْ رَوْعاتي، اللّهُمَّ احْفَظْني مِن بَينِ يَدَيَّ وَمِن خَلْفي وَعَن يَميني وَعَن شِمالي، وَمِن فَوْقي، وَأَعوذُ بِعَظَمَتِكَ أَن أُغْتالَ مِن تَحْتي."}, {"c": 3, "r": "الترمذي", "t": "يَا حَيُّ يَا قيُّومُ بِرَحْمَتِكَ أسْتَغِيثُ أصْلِحْ لِي شَأنِي كُلَّهُ وَلاَ تَكِلْنِي إلَى نَفْسِي طَرْفَةَ عَيْنٍ."}, {"c": 1, "r": "أبو داود", "t": "أَمْسَيْنا وَأَمْسَى الْمُلْكُ للهِ رَبِّ الْعَالَمَيْنِ، اللَّهُمَّ إِنَّي أسْأَلُكَ خَيْرَ هَذَه اللَّيْلَةِ فَتْحَهَا ونَصْرَهَا، ونُوْرَهَا وبَرَكَتهَا، وَهُدَاهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فيهِا وَشَرَّ مَا بَعْدَهَا."}, {"c": 1, "r": "الترمذي", "t": "اللّهُمَّ عالِمَ الغَيْبِ وَالشّهادَةِ فاطِرَ السّماواتِ وَالأرْضِ رَبَّ كلِّ شَيءٍ وَمَليكَه، أَشْهَدُ أَنْ لا إِلهَ إِلاّ أَنْت، أَعوذُ بِكَ مِن شَرِّ نَفْسي وَمِن شَرِّ الشَّيْطانِ وَشِرْكِهِ، وَأَنْ أَقْتَرِفَ عَلى نَفْسي سوءاً أَوْ أَجُرَّهُ إِلى مُسْلِم."}, {"c": 3, "r": "", "t": "أَعوذُ بِكَلِماتِ اللّهِ التّامّاتِ مِنْ شَرِّ ما خَلَق."}, {"c": 3, "r": "", "t": "أسْتَغْفِرُ اللهَ العَظِيمَ الَّذِي لاَ إلَهَ إلاَّ هُوَ، الحَيُّ القَيُّومُ، وَأتُوبُ إلَيهِ."}, {"c": 100, "r": "الترمذي", "t": "لَا إلَه إلّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءِ قَدِيرِ.", "d": "كانت له عدل عشر رقاب، وكتبت له مئة حسنة، ومحيت عنه مئة سيئة، وكانت له حرزا من الشيطان."}, {"c": 100, "r": "مسلم", "t": "سُبْحانَ اللهِ وَبِحَمْدِهِ.", "d": "حُطَّتْ خَطَايَاهُ وَإِنْ كَانَتْ مِثْلَ زَبَدِ الْبَحْرِ. لَمْ يَأْتِ أَحَدٌ يَوْمَ الْقِيَامَةِ بِأَفْضَلَ مِمَّا جَاءَ بِهِ إِلَّا أَحَدٌ قَالَ مِثْلَ مَا قَالَ أَوْ زَادَ عَلَيْهِ."}], "R": [{"q": "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ﴿٢﴾ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ قَدْ جَعَلَ اللَّهُ لِكُلِّ شَيْءٍ قَدْرًا ﴿٣﴾", "r": "سورة الطلاق ٢-٣"}, {"q": "فَقُلْتُ اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا ﴿١٠﴾ يُرْسِلِ السَّمَاءَ عَلَيْكُم مِّدْرَارًا ﴿١١﴾ وَيُمْدِدْكُم بِأَمْوَالٍ وَبَنِينَ وَيَجْعَل لَّكُمْ جَنَّاتٍ وَيَجْعَل لَّكُمْ أَنْهَارًا ﴿١٢﴾", "r": "سورة نوح ١٠-١٢"}, {"q": "قُلِ اللَّهُمَّ مَالِكَ الْمُلْكِ تُؤْتِي الْمُلْكَ مَن تَشَاءُ وَتَنزِعُ الْمُلْكَ مِمَّن تَشَاءُ وَتُعِزُّ مَن تَشَاءُ وَتُذِلُّ مَن تَشَاءُ بِيَدِكَ الْخَيْرُ إِنَّكَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ ﴿٢٦﴾ تُولِجُ اللَّيْلَ فِي النَّهَارِ وَتُولِجُ النَّهَارَ فِي اللَّيْلِ وَتُخْرِجُ الْحَيَّ مِنَ الْمَيِّتِ وَتُخْرِجُ الْمَيِّتَ مِنَ الْحَيِّ وَتَرْزُقُ مَن تَشَاءُ بِغَيْرِ حِسَابٍ ﴿٢٧﴾", "r": "سورة آل عمران ٢٦-٢٧"}, {"q": "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٥﴾ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٦﴾", "r": "سورة الشرح ٥-٦"}, {"t": "اللَّهُمَّ اكْفِنِي بِحَلاَلِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكِ عَمَّنْ سِوَاكَ.", "r": "دعاء قضاء الدين · الترمذي"}, {"t": "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ.", "r": "دعاء قضاء الدين · البخاري"}, {"t": "اللَّهُمَّ إِنِّي عَبْدُكَ، ابْنُ عَبْدِكَ، ابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ، عَدْلٌ فِيَّ قَضَاؤُكَ، أَسْأَلُكَ بِكُلِّ اسْمٍ هُوَ لَكَ، سَمَّيْتَ بِهِ نَفْسَكَ، أَوْ أَنْزَلْتَهُ فِي كِتَابِكَ، أَوْ عَلَّمْتَهُ أَحَداً مِنْ خَلْقِكَ، أَوِ اسْتَأْثَرْتَ بِهِ فِي عِلْمِ الغَيْبِ عِنْدَكَ، أَنْ تَجْعَلَ القُرْآنَ رَبِيعَ قَلْبِي، وَنُورَ صَدْرِي، وَجَلاَءَ حُزْنِي، وَذَهَابَ هَمِّي.", "r": "دعاء الهم والحزن · أحمد"}, {"t": "لاَ إِلَهَ إِلاَّ اللَّهُ الْعَظِيمُ الْحَلِيمُ، لاَ إِلَهَ إِلاَّ اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لاَ إِلَهَ إِلاَّ اللَّهُ رَبُّ السَّمَوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ.", "r": "دعاء الكرب · البخاري ومسلم"}, {"t": "اللَّهُمَّ رَحْمَتَكَ أَرْجُو، فَلاَ تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ، لاَ إِلَهَ إِلاَّ أَنْتَ.", "r": "دعاء الكرب · أبو داود"}]};
const RIZQ_DUA=ADHKAR.R;
function zkHtml(z,cls){return `${z.t?`<div class="zk-t">${esc(z.t)}</div>`:''}${z.q?`<div class="zk-q${cls?' '+cls:''}">${z.q}</div>`:''}`}
function adhkarKind(){const h=new Date().getHours();return h>=4&&h<12?'M':'E'}
function adhkarState(k){try{return JSON.parse(localStorage.getItem('masareef:zk:'+today()+':'+k)||'{}')}catch(e){return {}}}
function adhkarSave(k,o){try{localStorage.setItem('masareef:zk:'+today()+':'+k,JSON.stringify(o))}catch(e){}}
function adhkarDone(k){const L=ADHKAR[k],st=adhkarState(k);return L.filter((z,i)=>(st[i]||0)>=z.c).length}
function openAdhkar(kind){let k=kind||adhkarKind();const L=document.getElementById('layer');let fs=20;try{fs=+localStorage.getItem('masareef:zfs')||20}catch(e){}
  const draw=()=>{const A=ADHKAR[k],st=adhkarState(k),dn=adhkarDone(k);
    L.innerHTML=`<div class="scrim" data-close></div><div class="sheet quran" role="dialog" aria-modal="true" aria-label="الأذكار"><div class="in"><div class="grab"></div>
     <div class="qhead"><h2 style="margin:0">${k==='M'?'☀️ أذكار الصباح':'🌙 أذكار المساء'}</h2><div class="qtools"><button class="iconbtn" data-zfs="-2" aria-label="تصغير الخط">أ−</button><button class="iconbtn" data-zfs="2" aria-label="تكبير الخط">أ+</button></div></div>
     <div class="seg"><button class="n" data-zkk="M" aria-pressed="${k==='M'}">الصباح</button><button class="n" data-zkk="E" aria-pressed="${k==='E'}">المساء</button></div>
     <div class="zkprog"><span>أنجزت ${dn} من ${A.length}</span><div class="meter"><i style="width:${dn/A.length*100}%;background:var(--inc)"></i></div></div>
     <p class="note" style="margin:4px 0 8px">اضغط على الذكر بعد كل قراءة ليُعدّ.</p>
     <div class="zklist" style="font-size:${fs}px">${A.map((z,i)=>{const n=st[i]||0,ok=n>=z.c;return `<button class="zk${ok?' ok':''}" data-zk="${i}">${zkHtml(z)}<span class="zk-f"><span class="zk-r">${esc(z.r||'')}</span><b class="zk-n">${ok?'✓':AR_D(z.c-n)+(z.c>1?' من '+AR_D(z.c):'')}</b></span></button>`}).join('')}</div>
     <div class="actions"><div class="row2"><button class="btn ghost" id="zkReset">إعادة العدّ</button><button class="btn" data-close>إغلاق</button></div>
      <p class="note" style="margin:0;text-align:center">المصدر: حصن المسلم · الآيات من مشروع تنزيل</p></div></div></div>`};
  draw();L.oninput=L.onchange=null;
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';render();return}
    if(x.dataset.zkk){k=x.dataset.zkk;draw();return}
    if(x.dataset.zfs){fs=Math.min(34,Math.max(15,fs+ +x.dataset.zfs));try{localStorage.setItem('masareef:zfs',fs)}catch(er){}L.querySelector('.zklist').style.fontSize=fs+'px';return}
    if(x.id==='zkReset'){adhkarSave(k,{});draw();return}
    if(x.dataset.zk){const i=+x.dataset.zk,z=ADHKAR[k][i],st=adhkarState(k);if((st[i]||0)>=z.c)return;st[i]=(st[i]||0)+1;adhkarSave(k,st);try{navigator.vibrate&&navigator.vibrate(12)}catch(er){}
      const ok=st[i]>=z.c;x.classList.toggle('ok',ok);x.querySelector('.zk-n').textContent=ok?'✓':AR_D(z.c-st[i])+(z.c>1?' من '+AR_D(z.c):'');
      const dn=adhkarDone(k);const p=L.querySelector('.zkprog');p.querySelector('span').textContent='أنجزت '+dn+' من '+ADHKAR[k].length;p.querySelector('i').style.width=(dn/ADHKAR[k].length*100)+'%';
      if(ok){const nx=x.nextElementSibling;if(nx)setTimeout(()=>nx.scrollIntoView({block:'center',behavior:'smooth'}),180)}
      if(dn===ADHKAR[k].length)toast(k==='M'?'أتممت أذكار الصباح، تقبّل الله':'أتممت أذكار المساء، تقبّل الله')}}}
/* بطاقتا «سورة الملك» و«الأذكار» في الرئيسية */

/* ===== 💰 أدعية البركة في الرزق ونزول الراتب: صفحة قراءة بنظام الصفحات =====
   الآيات منسوخة حرفيًا من نص «تنزيل» (simple)، والأحاديث مع مصدرها. */
const RZ_PAGES={"sal": [{"t": "الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ", "r": "ابن ماجه، وحسّنه الألباني", "n": "كان النبي ﷺ يقولها إذا رأى ما يحب. تُقال عند نزول الراتب وكل نعمة."}, {"q": "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ وَأَدْخِلْنِي بِرَحْمَتِكَ فِي عِبَادِكَ الصَّالِحِينَ ﴿١٩﴾", "r": "سورة النمل ١٩", "n": "دعاء شكر النعمة وطلب التوفيق للعمل الصالح."}, {"q": "وَإِذْ تَأَذَّنَ رَبُّكُمْ لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ وَلَئِن كَفَرْتُمْ إِنَّ عَذَابِي لَشَدِيدٌ ﴿٧﴾", "r": "سورة إبراهيم ٧", "n": "الشكر سبب الزيادة."}, {"t": "اللَّهُمَّ أَكْثِرْ مَالَهُ وَوَلَدَهُ، وَبَارِكْ لَهُ فِيمَا أَعْطَيْتَهُ", "r": "البخاري ومسلم", "n": "دعاء النبي ﷺ لأنس رضي الله عنه، ويُدعى به للنفس: «اللهم بارك لي فيما أعطيتني»."}, {"q": "وَمَا أَنفَقْتُم مِّن شَيْءٍ فَهُوَ يُخْلِفُهُ وَهُوَ خَيْرُ الرَّازِقِينَ ﴿٣٩﴾", "r": "سورة سبأ ٣٩", "n": "تذكير بالصدقة والإنفاق من الراتب، فما أُنفق يُخلفه الله."}], "rizq": [{"q": "إِنَّ اللَّهَ هُوَ الرَّزَّاقُ ذُو الْقُوَّةِ الْمَتِينُ ﴿٥٨﴾", "r": "سورة الذاريات ٥٨"}, {"q": "وَمَا مِن دَابَّةٍ فِي الْأَرْضِ إِلَّا عَلَى اللَّهِ رِزْقُهَا وَيَعْلَمُ مُسْتَقَرَّهَا وَمُسْتَوْدَعَهَا كُلٌّ فِي كِتَابٍ مُّبِينٍ ﴿٦﴾", "r": "سورة هود ٦"}, {"q": "فَإِذَا قُضِيَتِ الصَّلَاةُ فَانتَشِرُوا فِي الْأَرْضِ وَابْتَغُوا مِن فَضْلِ اللَّهِ وَاذْكُرُوا اللَّهَ كَثِيرًا لَّعَلَّكُمْ تُفْلِحُونَ ﴿١٠﴾", "r": "سورة الجمعة ١٠", "n": "السعي في طلب الرزق مع ذكر الله."}, {"t": "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا", "r": "ابن ماجه", "n": "يُقال بعد صلاة الفجر."}, {"t": "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى، وَالْعَفَافَ وَالْغِنَى", "r": "مسلم"}, {"t": "اللَّهُمَّ اغْفِرْ لِي، وَارْحَمْنِي، وَاهْدِنِي، وَعَافِنِي، وَارْزُقْنِي", "r": "مسلم"}, {"q": "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا ﴿٢﴾ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ قَدْ جَعَلَ اللَّهُ لِكُلِّ شَيْءٍ قَدْرًا ﴿٣﴾", "r": "سورة الطلاق ٢-٣"}, {"q": "فَقُلْتُ اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا ﴿١٠﴾ يُرْسِلِ السَّمَاءَ عَلَيْكُم مِّدْرَارًا ﴿١١﴾ وَيُمْدِدْكُم بِأَمْوَالٍ وَبَنِينَ وَيَجْعَل لَّكُمْ جَنَّاتٍ وَيَجْعَل لَّكُمْ أَنْهَارًا ﴿١٢﴾", "r": "سورة نوح ١٠-١٢"}, {"q": "قُلِ اللَّهُمَّ مَالِكَ الْمُلْكِ تُؤْتِي الْمُلْكَ مَن تَشَاءُ وَتَنزِعُ الْمُلْكَ مِمَّن تَشَاءُ وَتُعِزُّ مَن تَشَاءُ وَتُذِلُّ مَن تَشَاءُ بِيَدِكَ الْخَيْرُ إِنَّكَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ ﴿٢٦﴾ تُولِجُ اللَّيْلَ فِي النَّهَارِ وَتُولِجُ النَّهَارَ فِي اللَّيْلِ وَتُخْرِجُ الْحَيَّ مِنَ الْمَيِّتِ وَتُخْرِجُ الْمَيِّتَ مِنَ الْحَيِّ وَتَرْزُقُ مَن تَشَاءُ بِغَيْرِ حِسَابٍ ﴿٢٧﴾", "r": "سورة آل عمران ٢٦-٢٧"}, {"q": "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٥﴾ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٦﴾", "r": "سورة الشرح ٥-٦"}, {"t": "اللَّهُمَّ اكْفِنِي بِحَلاَلِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكِ عَمَّنْ سِوَاكَ.", "r": "دعاء قضاء الدين · الترمذي"}, {"t": "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ.", "r": "دعاء قضاء الدين · البخاري"}, {"t": "اللَّهُمَّ إِنِّي عَبْدُكَ، ابْنُ عَبْدِكَ، ابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ، عَدْلٌ فِيَّ قَضَاؤُكَ، أَسْأَلُكَ بِكُلِّ اسْمٍ هُوَ لَكَ، سَمَّيْتَ بِهِ نَفْسَكَ، أَوْ أَنْزَلْتَهُ فِي كِتَابِكَ، أَوْ عَلَّمْتَهُ أَحَداً مِنْ خَلْقِكَ، أَوِ اسْتَأْثَرْتَ بِهِ فِي عِلْمِ الغَيْبِ عِنْدَكَ، أَنْ تَجْعَلَ القُرْآنَ رَبِيعَ قَلْبِي، وَنُورَ صَدْرِي، وَجَلاَءَ حُزْنِي، وَذَهَابَ هَمِّي.", "r": "دعاء الهم والحزن · أحمد"}, {"t": "لاَ إِلَهَ إِلاَّ اللَّهُ الْعَظِيمُ الْحَلِيمُ، لاَ إِلَهَ إِلاَّ اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لاَ إِلَهَ إِلاَّ اللَّهُ رَبُّ السَّمَوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ.", "r": "دعاء الكرب · البخاري ومسلم"}, {"t": "اللَّهُمَّ رَحْمَتَكَ أَرْجُو، فَلاَ تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ، لاَ إِلَهَ إِلاَّ أَنْتَ.", "r": "دعاء الكرب · أبو داود"}]};
const RZ_SECS=[['sal','عند نزول الراتب'],['rizq','البركة في الرزق']];
const RZ_POS=[['with','بجانب زر الأذكار (الافتراضي)'],['top','أعلى الرئيسية'],['mid','بعد التنبيهات'],['bottom','أسفل الرئيسية'],['hide','مخفي']];
function rzCfg(){return Object.assign({pos:'with',rep:3},S.settings.rizqBtn||{})}
function rzBtn(small){return `<button class="rzbtn${small?' sm':''}" data-rizq="1" aria-label="أدعية الرزق ونزول الراتب"><span class="rz-ic">💰</span><span class="rz-t">${small?'أدعية الرزق':'أدعية البركة في الرزق ونزول الراتب'}</span></button>`}
function rzHtml(where){const c=rzCfg();const alone=c.pos==='with'&&where==='top'&&wird().pos==='hide';if(c.pos!==where&&!alone)return '';return `<div class="rzrow ${where}">${rzBtn(false)}</div>`}
function openRizq(sec){const L=document.getElementById('layer');let fs=20,pg={};try{fs=+localStorage.getItem('masareef:zfs')||20;pg=JSON.parse(localStorage.getItem('masareef:rzpg')||'{}')||{}}catch(e){}
  let k=sec||(new Date().getDate()<=5||(S.settings.payday&&Math.abs(new Date().getDate()-(+S.settings.payday))<=2)?'sal':'rizq');if(!RZ_PAGES[k])k='sal';let i=Math.min(+pg[k]||0,RZ_PAGES[k].length-1);
  const save=()=>{pg[k]=i;try{localStorage.setItem('masareef:rzpg',JSON.stringify(pg))}catch(e){}};const cnt={};const ck=()=>k+':'+i;
  const draw=()=>{const A=RZ_PAGES[k],z=A[i];
    L.innerHTML=`<div class="scrim" data-close></div><div class="sheet quran rzsheet" role="dialog" aria-modal="true" aria-label="أدعية الرزق"><div class="in"><div class="grab"></div>
     <div class="qhead"><h2 style="margin:0">💰 أدعية الرزق</h2><div class="qtools"><button class="iconbtn" data-rzfs="-2" aria-label="تصغير الخط">أ−</button><button class="iconbtn" data-rzfs="2" aria-label="تكبير الخط">أ+</button></div></div>
     <div class="seg">${RZ_SECS.map(([kk,n])=>`<button class="n" data-rzsec="${kk}" aria-pressed="${k===kk}">${n}</button>`).join('')}</div>
     <button class="rzpage${(cnt[ck()]||0)>=rzCfg().rep?' done':''}" data-rztap="1" style="font-size:${fs}px" aria-live="polite" aria-label="اضغط بعد كل قراءة">${zkHtml(z)}<span class="rz-ref">${esc(z.r||'')}</span>${z.n?`<span class="rz-note">${esc(z.n)}</span>`:''}
      <span class="rz-cnt">${(()=>{const c=cnt[ck()]||0,n=rzCfg().rep;return n>1?(c>=n?'✓ أتممت '+AR_D(n)+' مرات':'اضغط بعد كل قراءة · '+AR_D(c)+' من '+AR_D(n)):(c?'✓':'اضغط بعد القراءة')})()}</span></button>
     <div class="rzrep"><span class="note">التكرار:</span>${[1,3,7].map(v=>`<button class="chip" data-rzrep="${v}" aria-pressed="${rzCfg().rep===v}">${v===1?'مرة':AR_D(v)+' مرات'}</button>`).join('')}</div>
     <div class="rznav"><button class="btn ghost" data-rzgo="-1" ${i?'':'disabled'}>› السابق</button><span class="rz-n"><b class="num">${AR_D(i+1)}</b> من <span class="num">${AR_D(A.length)}</span></span><button class="btn" data-rzgo="1" ${i<A.length-1?'':'disabled'}>التالي ‹</button></div>
     <div class="rzdots">${A.map((_,j)=>`<button class="rzdot${j===i?' on':''}" data-rzto="${j}" aria-label="صفحة ${j+1}"></button>`).join('')}</div>
     ${k==='sal'?'<p class="note" style="margin:6px 0 0;text-align:center">لا يوجد دعاء مخصوص لنزول الراتب في السنة؛ والمستحب حمد الله وشكره وسؤال البركة والإنفاق منه.</p>':''}
     <div class="actions"><button class="btn ghost block" data-close>إغلاق</button><p class="note" style="margin:0;text-align:center">الآيات من مشروع تنزيل · الأحاديث بمصادرها</p></div></div></div>`;
    const pgEl=L.querySelector('.rzpage');let x0=null;pgEl.addEventListener('touchstart',e=>{x0=e.touches[0].clientX},{passive:true});
    pgEl.addEventListener('touchend',e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)<50)return;go(dx<0?1:-1)},{passive:true})};
  const go=d=>{const n=i+d;if(n<0||n>=RZ_PAGES[k].length)return;i=n;save();draw()};
  draw();L.oninput=L.onchange=null;
  L.onkeydown=e=>{if(e.key==='ArrowLeft')go(1);if(e.key==='ArrowRight')go(-1)};
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';L.onkeydown=null;return}
    if(x.dataset.rzgo){go(+x.dataset.rzgo);return}
    if(x.dataset.rztap){const n=rzCfg().rep,c=cnt[ck()]||0;if(c>=n){go(1);return}cnt[ck()]=c+1;try{navigator.vibrate&&navigator.vibrate(12)}catch(er){}
      if(c+1>=n){draw();if(i<RZ_PAGES[k].length-1)setTimeout(()=>{if(L.querySelector('.rzsheet'))go(1)},550);else toast('أتممت أدعية «'+RZ_SECS.find(z=>z[0]===k)[1]+'»، تقبّل الله')}else{const el=L.querySelector('.rz-cnt');el.textContent='اضغط بعد كل قراءة · '+AR_D(c+1)+' من '+AR_D(n);const pgEl=L.querySelector('.rzpage');pgEl.classList.remove('pulse');void pgEl.offsetWidth;pgEl.classList.add('pulse')}return}
    if(x.dataset.rzrep){S.settings.rizqBtn=Object.assign({},rzCfg(),{rep:+x.dataset.rzrep});putSettings();draw();return}
    if(x.dataset.rzto!==undefined){i=+x.dataset.rzto;save();draw();return}
    if(x.dataset.rzsec){k=x.dataset.rzsec;i=Math.min(+pg[k]||0,RZ_PAGES[k].length-1);draw();return}
    if(x.dataset.rzfs){fs=Math.max(14,Math.min(34,fs+(+x.dataset.rzfs)));try{localStorage.setItem('masareef:zfs',fs)}catch(e){}L.querySelector('.rzpage').style.fontSize=fs+'px';return}}}

/* ===== صفحات القراءة (سورة الملك، الأذكار، أدعية الرزق): شاشة كاملة، زر خروج واضح، وألوان خلفية للاختيار ===== */
const RD_THEMES=[['app','لون التطبيق','var(--bg)'],['paper','ورقي','#FBF5E6'],['green','أخضر هادئ','#EAF4EE'],['blue','أزرق فاتح','#EAF1FA'],['rose','وردي فاتح','#FAEEF1'],['night','ليلي','#10161E']];
function rdTheme(){try{const v=localStorage.getItem('masareef:rdtheme');return RD_THEMES.some(t=>t[0]===v)?v:'app'}catch(e){return 'app'}}
function rdThemeSet(v){try{localStorage.setItem('masareef:rdtheme',v)}catch(e){}document.querySelectorAll('.sheet.quran').forEach(rdDecorate)}
function rdSwatches(){const cur=rdTheme();return `<div class="rdsw" role="group" aria-label="لون خلفية القراءة">${RD_THEMES.map(([k,n,c])=>`<button class="rdsw-b${cur===k?' on':''}" data-rdth="${k}" aria-pressed="${cur===k}" title="${n}"><i style="background:${c}"></i><span>${n}</span></button>`).join('')}</div>`}
function rdDecorate(sh){RD_THEMES.forEach(([k])=>sh.classList.remove('rd-'+k));sh.classList.add('full','rd-'+rdTheme());
  const tools=sh.querySelector('.qhead .qtools');if(tools&&!tools.querySelector('.rd-x')){tools.insertAdjacentHTML('afterbegin','<button class="iconbtn rd-th" data-rdpick="1" aria-label="لون الخلفية">🎨</button>');tools.insertAdjacentHTML('beforeend','<button class="iconbtn rd-x" data-close aria-label="خروج">✕</button>')}}
try{new MutationObserver(()=>document.querySelectorAll('#layer .sheet.quran').forEach(sh=>{if(!sh.classList.contains('full')||!sh.querySelector('.rd-x'))rdDecorate(sh)})).observe(document.getElementById('layer'),{childList:true,subtree:true})}catch(e){}
document.addEventListener('click',e=>{const pk=e.target.closest('[data-rdpick]');if(pk){e.stopPropagation();const sh=pk.closest('.sheet');const ex=sh.querySelector('.rdsw-pop');if(ex){ex.remove();return}const qh=sh.querySelector('.qhead');qh.insertAdjacentHTML('afterend','<div class="rdsw-pop">'+rdSwatches()+'</div>');return}
  const th=e.target.closest('[data-rdth]');if(th){e.stopPropagation();rdThemeSet(th.dataset.rdth);document.querySelectorAll('.rdsw-b').forEach(b=>{const on=b.dataset.rdth===th.dataset.rdth;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});const pop=th.closest('.rdsw-pop');if(pop)setTimeout(()=>pop.remove(),250);return}},true);
function spiritHtml(where){const W=wird();if(W.pos!==where)return '';const done=(W.log||[]).includes(today()),n=wirdStreak();const k=adhkarKind(),zd=adhkarDone(k),zt=ADHKAR[k].length;
  return `<div class="spirit ${where}${W.adhkar?'':' one'}${rzCfg().pos==='with'?' withrz':''}"><button class="wirdcard${done?' done':''}" data-wird="1"><span class="wd-ic">📖</span><span class="wd-main"><b>${esc(W.title)}</b><small>${done?'قرأتها اليوم ✓':esc(W.sub)}${n>1?' · '+countWord(n,'ليلة','ليلتان','ليالٍ','ليلة'):''}</small></span></button>
   ${W.adhkar?`<button class="wirdcard zkcard${zd===zt?' done':''}" data-adhkar="1"><span class="wd-ic">${k==='M'?'☀️':'🌙'}</span><span class="wd-main"><b>${k==='M'?'أذكار الصباح':'أذكار المساء'}</b><small>${zd===zt?'أتممتها اليوم ✓':zd?'أنجزت '+zd+' من '+zt:'حصن المسلم'}</small></span></button>`:''}${rzCfg().pos==='with'?rzBtn(true):''}</div>`}

/* ورد سورة الملك: مكان الزر واسمه والأدعية بعد القراءة من وضع المدير فقط */
const WIRD_POS=[['top','تحت شريط الأدعية (الافتراضي)'],['mid','بعد التنبيهات'],['bottom','أسفل الرئيسية'],['hide','مخفي']];
const WIRD_DUA=[["رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً إِنَّكَ أَنتَ الْوَهَّابُ", "سورة آل عمران: 8"], ["رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ", "سورة إبراهيم: 41"], ["وَقُل رَّبِّ اغْفِرْ وَارْحَمْ وَأَنتَ خَيْرُ الرَّاحِمِينَ", "سورة المؤمنون: 118"], ["رَّبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِمَن دَخَلَ بَيْتِيَ مُؤْمِنًا وَلِلْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ وَلَا تَزِدِ الظَّالِمِينَ إِلَّا تَبَارًا", "سورة نوح: 28"]];
function wird(){const W=Object.assign({pos:'top',title:'سورة الملك',sub:'وردي كل ليلة قبل النوم',script:'simple',duas:null,dhead:'🤲 أدعية طلب الرزق والبركة',adhkar:true,log:[]},S.settings.wird||{});
  if(W.show===false&&!(S.settings.wird||{}).pos)W.pos='hide';if(W.note&&!W.duas)W.duas=[W.note];delete W.show;delete W.note;return W}
/* الأدعية بعد السورة: الافتراضية (آيات وأدعية موثّقة) أو ما كتبه المدير */
function wirdDuas(W){return W.duas?W.duas.map(t=>({t})):RIZQ_DUA}
function duaToText(d){return (d.q?d.q:d.t)+(d.r?'\n('+d.r+')':'')}
function wirdStreak(){const W=wird(),s=new Set(W.log||[]);let n=0;const d=new Date();if(!s.has(isoD(d)))d.setDate(d.getDate()-1);while(s.has(isoD(d))){n++;d.setDate(d.getDate()-1)}return n}
let wakeL=null;
function openWird(){const W=wird();const L=document.getElementById('layer');const T=MULK[W.script==='uthmani'?'uthmani':'simple'];
  let fs=26;try{fs=+localStorage.getItem('masareef:qfs')||26}catch(e){}
  const done=(W.log||[]).includes(today()),n=wirdStreak();
  L.innerHTML=`<div class="scrim" data-close></div><div class="sheet quran" role="dialog" aria-modal="true" aria-label="${esc(W.title)}"><div class="in"><div class="grab"></div>
    <div class="qhead"><div><h2 style="margin:0">${esc(W.title)}</h2><small class="note">سورة الملك · ٣٠ آية · مكية</small></div>
     <div class="qtools"><button class="iconbtn" data-qfs="-2" aria-label="تصغير الخط">أ−</button><button class="iconbtn" data-qfs="2" aria-label="تكبير الخط">أ+</button></div></div>
    <div class="qtext ${W.script==='uthmani'?'uth':'smp'}" style="font-size:${fs}px"><div class="qbasm">${T.b}</div><p>${T.v.map((v,i)=>`<span class="qv">${v}</span> <span class="qn">﴿${AR_D(i+1)}﴾</span>`).join(' ')}</p><div class="qend">صدق الله العظيم</div></div>
    ${wirdDuas(W).length?`<div class="qduas"><h3>${esc(W.dhead)}</h3>${wirdDuas(W).map(d=>`<div class="qdua">${d.q?`<div class="zk-q">${d.q}</div>`:`<div class="zk-t">${esc(d.t)}</div>`}${d.r?`<small>${esc(d.r)}</small>`:''}</div>`).join('')}</div>`:''}
    <div class="actions"><button class="btn block${done?' ghost':''}" id="wdDone">${done?'قرأتها اليوم ✓':'أتممت القراءة'}</button>
     <div class="row2"><button class="btn ghost" id="wdEdit">⚙️ إعدادات (المدير)</button><button class="btn ghost" data-close>إغلاق</button></div>
     <p class="note" style="margin:0;text-align:center">${n>1?'قرأتها '+countWord(n,'ليلة واحدة','ليلتين','ليالٍ','ليلة')+' متتالية · ':''}نص المصحف: مشروع تنزيل (tanzil.net) · الخط: Amiri Quran</p></div></div></div>`;
  try{navigator.wakeLock&&navigator.wakeLock.request('screen').then(w=>{wakeL=w}).catch(()=>{})}catch(e){}
  const close=()=>{L.innerHTML='';try{wakeL&&wakeL.release();wakeL=null}catch(e){}};
  L.oninput=L.onchange=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){close();return}
    if(x.dataset.qfs){fs=Math.min(46,Math.max(18,fs+ +x.dataset.qfs));try{localStorage.setItem('masareef:qfs',fs)}catch(er){}const t=L.querySelector('.qtext');if(t)t.style.fontSize=fs+'px';return}
    if(x.id==='wdDone'){if(!(W.log||[]).includes(today())){W.log=(W.log||[]).concat([today()]).slice(-400);S.settings.wird=W;await putSettings();toast('تقبّل الله منك')}close();render();return}
    if(x.id==='wdEdit'){close();openWirdSettings();return}}}
function openWirdSettings(){const W=wird();const L=document.getElementById('layer');let duas=W.duas?W.duas.join('\n\n'):RIZQ_DUA.map(duaToText).join('\n\n');let custom=!!W.duas;
  L.innerHTML=`${sheetTop('إعدادات الورد')}<h2 style="margin-top:0">⚙️ إعدادات ${esc(W.title)}</h2><div class="stack">
   <div class="field"><label>مكان الزر في الرئيسية</label><div class="wpos">${WIRD_POS.map(([k,n])=>`<button class="chip" data-wsp="${k}" aria-pressed="${W.pos===k}">${n}</button>`).join('')}</div></div>
   <div class="field"><label for="wsTitle">اسم الزر</label><input class="inp" id="wsTitle" value="${esc(W.title)}" maxlength="30"></div>
   <div class="field"><label for="wsSub">السطر الصغير تحته</label><input class="inp" id="wsSub" value="${esc(W.sub)}" maxlength="60"></div>
   <div class="field"><label>الرسم</label><div class="seg"><button class="n" data-wss="simple" aria-pressed="${W.script!=='uthmani'}">الرسم الإملائي (أوضح)</button><button class="n" data-wss="uthmani" aria-pressed="${W.script==='uthmani'}">رسم المصحف العثماني</button></div></div>
   <label class="toggle"><input type="checkbox" id="wsZk" ${W.adhkar?'checked':''}><span>إظهار «أذكار الصباح والمساء» بجانبه</span></label>
   <div class="field"><label for="wsHead">عنوان قسم الأدعية بعد السورة</label><input class="inp" id="wsHead" value="${esc(W.dhead)}" maxlength="50"></div>
   <div class="field"><label for="wsDuas">الأدعية بعد السورة (اترك سطرًا فارغًا بين كل دعاء)</label><textarea class="inp dntxt" id="wsDuas" rows="7" maxlength="3000">${esc(duas)}</textarea></div>
   <div class="field"><label>إضافة من المقترحات (آيات دعاء كاملة من المصحف)</label><div class="dnsug">${WIRD_DUA.map((d,i)=>`<button class="dnchip" data-wsd="${i}"><span>${d[0]}</span><small>${esc(d[1])}</small></button>`).join('')}
    ${debtNoteParts().length?`<button class="dnchip" data-wsd="note"><span>إضافة أدعية «تذكير» من صفحة «ديوني»</span><small>${countWord(debtNoteParts().length,'دعاء واحد','دعاءان','أدعية','دعاءً')}</small></button>`:''}</div></div>
   <button class="btn ghost block" id="wsDef">استعادة الأدعية الافتراضية (آيات الرزق وأدعية قضاء الدين والهم والكرب)</button>
   <p class="note" style="margin:0">نص السورة ثابت من مصدر موثوق ولا يُعدَّل، حفاظًا على صحته.</p>
   <button class="btn ghost block" id="wsReset" style="color:var(--exp)">مسح سجل الليالي (${(W.log||[]).length})</button></div>
   <div class="actions"><button class="btn block" id="wsSave">حفظ</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`;
  L.onchange=null;L.oninput=e=>{if(e.target.id==='wsDuas'){duas=e.target.value;custom=true}};
  const addD=t=>{custom=true;if(duas.includes(t)){toast('موجود مسبقًا');return false}duas=(duas.trim()?duas.trim()+'\n\n':'')+t;const a=document.getElementById('wsDuas');a.value=duas;a.scrollTop=a.scrollHeight;return true};
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.wsp){W.pos=x.dataset.wsp;L.querySelectorAll('[data-wsp]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.wsp===W.pos));return}
    if(x.dataset.wss){W.script=x.dataset.wss;L.querySelectorAll('[data-wss]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.wss===W.script));return}
    if(x.dataset.wsd){if(x.dataset.wsd==='note')debtNoteParts().forEach(addD);else{const d=WIRD_DUA[+x.dataset.wsd];addD('﴿'+d[0]+'﴾\n('+d[1]+')')}x.classList.add('on');return}
    if(x.id==='wsDef'){custom=false;duas=RIZQ_DUA.map(duaToText).join('\n\n');document.getElementById('wsDuas').value=duas;toast('ستُستعاد الأدعية الافتراضية عند الحفظ');return}
    if(x.id==='wsReset'){W.log=[];x.textContent='مسح سجل الليالي (0)';return}
    if(x.id==='wsSave'){const g=i=>document.getElementById(i);W.title=g('wsTitle').value.trim()||'سورة الملك';W.sub=g('wsSub').value.trim();
      W.duas=custom?g('wsDuas').value.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean).slice(0,30):null;W.dhead=g('wsHead').value.trim()||'🤲 أدعية طلب الرزق والبركة';W.adhkar=g('wsZk').checked;
      S.settings.wird=W;await putSettings();L.innerHTML='';render();toast('حُفظت إعدادات الورد')}}}

let DMODE='view';
/* ديوني — التصفح في الرئيسية (عرض فقط). الإدارة في «إدارة البيانات»، ودفع الأقساط في «الالتزامات الشهرية» */
function debtsBrowseHtml(){const Ds=debts();DMODE='view';
  const head=`<div class="backrow" id="homeDebts"><h2 style="margin:0">${esc(lbl('sec.debts'))}</h2><button class="chip" data-mdgo="debts">⚙️ الإدارة ‹</button></div>`;
  if(!Ds.length)return head+`<div class="panel empty"><b>اعرف ديونك ومتى تتخلص منها</b>أضف القروض وبطاقات الائتمان والديون لأشخاص من «إدارة البيانات» ← قسم الديون، فتظهر هنا للمتابعة، وتظهر أقساطها في «${esc(lbl('sec.monthly'))}» للدفع.</div><button class="btn ghost block" data-mdgo="debts" style="margin-top:10px">⚙️ إضافة دين من إدارة البيانات</button>`+debtNoteHtml();
  const act=Ds.filter(d=>+d.balance>0.0005),done=Ds.filter(d=>!(+d.balance>0.0005));const pl=act.length?debtSim():null;const F=debtFree();
  const g=S.debtGrp||'all',k=S.debtSort||'end';const inst=act.reduce((s,d)=>s+debtInst(d),0);
  const grpCells=Object.entries(DEBT_G).map(([key,v])=>{const L=act.filter(d=>debtGroup(d)===key);return L.length?`<button class="dgcell" data-dgrp="${key}" aria-pressed="${g===key}" style="--gc:${v[1]}"><span>${v[0]}</span><b class="num">${amtH(L.reduce((s,d)=>s+(+d.balance),0))}</b><small>${countWord(L.length,'دين واحد','دينان','ديون','دينًا')}</small></button>`:''}).join('');
  const filt=`<div class="chips dfilter"><button class="chip" data-dgrp="all" aria-pressed="${g==='all'}">الكل (${act.length})</button>${Object.entries(DEBT_G).map(([key,v])=>{const c=act.filter(d=>debtGroup(d)===key).length;return c?`<button class="chip" data-dgrp="${key}" aria-pressed="${g===key}">${v[0]} (${c})</button>`:''}).join('')}${done.length?`<button class="chip" data-dgrp="done" aria-pressed="${g==='done'}">انتهت (${done.length})</button>`:''}</div>
   ${g==='done'||!act.length?'':`<div class="dsort"><span class="note">ترتيب:</span>${Object.entries(DEBT_SORT).map(([key,n])=>`<button class="chip" data-dsort="${key}" aria-pressed="${k===key}">${n}</button>`).join('')}</div>`}`;
  const groups=Object.keys(DEBT_G).filter(key=>g==='all'||g===key);
  const list=g==='done'?'':groups.map(key=>{const L=debtSort(act.filter(d=>debtGroup(d)===key),k,pl);if(!L.length)return '';
    return `<div class="dghead" style="--gc:${DEBT_G[key][1]}"><b>${esc(DEBT_G[key][0])}</b>${renBtn('dgrp.'+key)}<span class="note">متبقٍ <span class="num">${amtH(L.reduce((s,d)=>s+(+d.balance),0))}</span></span></div><div class="stack">${L.map(d=>debtCard(d,pl)).join('')}</div>`}).join('')||(act.length?'':'<div class="okbox">لا ديون متبقية. مبروك! 🎉</div>');
  const arch=done.length&&(g==='all'||g==='done')?`<div class="backrow" id="debtArch" style="margin-top:14px"><h3 style="margin:0">سجل الديون المنتهية</h3><span class="note">${countWord(done.length,'دين واحد','دينان','ديون','دينًا')}</span></div>
    <div class="stack">${done.slice().sort((a,b)=>((b.closed||{}).end||'').localeCompare((a.closed||{}).end||'')).map(debtDoneCard).join('')}</div>`:'';
  const sum=!act.length?'':F&&F.stuck?`<div class="warnbox" style="margin:0">القسط لا يكفي لإنهاء أحد الديون. راجع الأقساط من «إدارة البيانات».</div>`:F?`<div class="panel hplans dfree"><div class="hp-sum"><div class="hp-ring" style="--p:${F.pct}"><span class="num">${F.pct}%</span></div><div class="hp-cells">
    <div><span>المتبقي</span><b class="num">${amtH(F.rem)}</b></div><div><span>الأقساط الشهرية</span><b class="num">${amtH(inst)}</b></div>
    <div><span>يوم التحرر</span><b>${fmtD(F.date)}</b></div><div><span>العد التنازلي</span><b>⏳ ${daysWord(F.days)}</b></div></div></div>
    <div class="note hp-meta">${F.next?(F.next.late?'<b class="amt-exp">قسط '+esc(F.next.name)+' متأخر</b> (كان يوم '+F.next.day+')':'القادم: '+esc(F.next.name)+' يوم '+F.next.day)+' · <span class="num">'+amtH(F.next.amt)+'</span>':'دفعت أقساط هذا الشهر كلها ✓'}</div>
    <button class="chip pay" data-tab="monthly" style="margin-top:8px">💳 دفع أقساط هذا الشهر من «${esc(lbl('sec.monthly'))}» ‹</button></div>`:'';
  const out=head+sum+(act.length?`<div class="dgrid">${grpCells}</div>`:'')+debtNoteHtml()+filt+list+arch
   +(act.length?`<h3>خطة التخلص من الديون</h3><div class="panel stack"><div id="debtRes" class="stack">${debtResHtml()}</div><p class="note" style="margin:0">طريقة السداد والمبلغ الإضافي تُضبط من «إدارة البيانات» ← الديون.</p></div>`:'');
  return out}
/* ديوني — الإدارة داخل «إدارة البيانات»: الإضافة والتعديل والأيقونات والمستندات والكشوف والخطة والتصدير */
function debtsManageHtml(){const Ds=debts(),P=debtPlan();DMODE='manage';
  const act=Ds.filter(d=>+d.balance>0.0005),done=Ds.filter(d=>!(+d.balance>0.0005));const pl=act.length?debtSim():null;
  const free=(()=>{const a=avgSurplus();return a===null?null:a-goalsSummary().plan})();
  const row=d=>{const I=debtInstInfo(d);return `<div class="mdrow"><button class="mdico" data-icoedit="debt:${esc(d.id)}" data-iconame="${esc(d.name)}" aria-label="تغيير صورة ${esc(d.name)}">${debtBadge(d)}<span class="mdico-e">✎</span></button><div><b>${esc(d.name)}</b><small>${esc((DEBT_T[d.type]||DEBT_T.other)[0])+(d.lender?' · '+esc(d.lender):'')+' · المتبقي '+money(d.balance)+(d.mode!=='once'&&+d.payment?' · القسط '+money(d.payment):'')+(I.tot?' · '+I.paid+' من '+I.tot+' قسط':'')+' · المتابعة من '+dmy(debtTrackFrom(d))+(d.ref?' · عقد '+esc(d.ref):'')}</small></div><button class="chip" data-dedit="${esc(d.id)}"><span class="lk">🔒 </span>تعديل</button></div>`};
  const cards=act.length?`<details class="dmcards"><summary class="note">📂 ملفات كل دين: الدفعات والسجل والمستندات والكشف (${act.length})</summary><div class="stack" style="margin-top:8px">${debtSort(act,'end',pl).map(d=>debtCard(d,pl)).join('')}</div></details>`:'';
  const arch=done.length?`<details class="dmcards"><summary class="note">✓ الديون المنتهية (${done.length})</summary><div class="stack" style="margin-top:8px">${done.map(debtDoneCard).join('')}</div></details>`:'';
  const r=`<h2>🏦 ${esc(lbl('sec.debts'))}</h2><div class="panel mdlist">${Ds.length?Ds.map(row).join(''):'<p class="note" style="margin:6px 0">لا توجد ديون. أضفها هنا فتظهر للمتابعة في الرئيسية، وأقساطها في «'+esc(lbl('sec.monthly'))+'» للدفع.</p>'}</div>
  <div class="chips" style="margin-top:6px"><button class="chip secadd" data-dadd="1"><span class="lk">🔒 </span>+ دين</button>${Ds.length?'<button class="chip" data-dgohome="1">عرضها في الرئيسية ‹</button>':''}</div>
  ${cards}${arch}
  ${Ds.length?`<div class="row2 dexp" style="margin-top:8px"><button class="btn ghost" data-dexp="pdf">🖨️ طباعة / PDF</button><button class="btn ghost" data-dexp="xlsx">📊 Excel / Numbers</button></div>`:''}
  ${act.length?`<h3>خطة التخلص من الديون</h3>
  <div class="panel stack">
   <div class="seg" role="group" aria-label="ترتيب السداد"><button class="n" data-dstrat="avalanche" aria-pressed="${P.strategy!=='snowball'}">الأعلى فائدة أولًا</button><button class="n" data-dstrat="snowball" aria-pressed="${P.strategy==='snowball'}">الأصغر مبلغًا أولًا</button></div>
   <p class="note" style="margin:0">${P.strategy==='snowball'?'تسدّد الدين الأصغر أولًا فتشعر بالإنجاز بسرعة، ثم تنقل قسطه إلى الدين التالي.':'تسدّد الدين الأعلى فائدة أولًا، فتدفع أقل فوائد ممكنة. وعند انتهائه يُنقل قسطه إلى الدين التالي.'}</p>
   <div class="field"><label for="debtExtra">مبلغ إضافي أدفعه شهريًا فوق الأقساط (${CUR})</label><input class="inp num" id="debtExtra" inputmode="decimal" value="${+P.extra?amtIn(P.extra):''}" placeholder="0.000" style="text-align:left"></div>
   <div class="chips">${[0,25,50,100].map(v=>`<button class="chip" data-dextra="${v}">${v?'+'+v:'بدون إضافة'}</button>`).join('')}${free&&free>1?`<button class="chip pay" data-dextra="${Math.floor(free*0.5)}">المقترح من فائضك: ${Math.floor(free*0.5)}</button>`:''}</div>
   <div id="debtRes" class="stack">${debtResHtml()}</div>
  </div><div id="debtCmp" style="margin-top:10px">${debtCompareHtml()}</div>`:''}`;
  DMODE='view';return r}
function openDebt(id){const L=document.getElementById('layer');const A=S.settings.debts||(S.settings.debts=[]);const ex=id?A.find(x=>x.id===id):null;
  const d=ex?Object.assign({},ex,{original:ex.original?money(ex.original):'',balance:money(ex.balance),payment:+ex.payment?money(ex.payment):'',rate:ex.rate||'',mode:ex.mode||'inst',start:debtStart(ex),end:ex.end||''}):{id:uidGen(),type:'loan',name:'',lender:'',original:'',balance:'',payment:'',rate:'',day:1,pays:[],mode:'inst',start:today(),end:'',trackFrom:today()};let askDel=false;
  if(ex&&!d.trackFrom)d.trackFrom=debtTrackFrom(ex);
  const draw=()=>{L.innerHTML=`${sheetTop('دين')}
   <h2 style="margin-top:0">${ex?'تعديل الدين':'دين جديد'}</h2><div class="stack">
   <div class="catgrid">${Object.entries(DEBT_T).map(([k,t])=>`<button class="cg" data-dtype="${k}" aria-pressed="${d.type===k}"><i style="background:${t[2]}1f;color:${t[2]}">${svgI(CI[t[1]])}</i>${t[0]}</button>`).join('')}</div>
   <div class="row2"><div class="field"><label for="dName">اسم الدين</label><input class="inp" id="dName" value="${esc(d.name)}" placeholder="مثال: قرض شخصي" maxlength="30"></div>
   <div class="field"><label for="dLender">${d.type==='people'?'اسم الشخص':'الجهة (اختياري)'}</label>${nameSelect('dLender',d.lender,d.type==='people'?['person']:['bank','person','gov','other'],d.type==='people'?'— اختر الشخص —':'— اختر الجهة —')}</div></div>
   <div class="note dgroupnote">القسم: <b>${DEBT_G[debtGroup(d)][0]}</b></div>
   <div class="seg" role="group" aria-label="طريقة السداد"><button class="n" data-dmode="inst" aria-pressed="${d.mode!=='once'}">أقساط شهرية</button><button class="n" data-dmode="once" aria-pressed="${d.mode==='once'}">دفعة واحدة بالمبلغ الإجمالي</button></div>
   <div class="row2"><div class="field"><label for="dOrig">المبلغ الأصلي</label><input class="inp num" id="dOrig" inputmode="decimal" value="${esc(d.original)}" placeholder="0.000" style="text-align:left"></div>
   <div class="field"><label for="dBal">المتبقي الآن</label><input class="inp num" id="dBal" inputmode="decimal" value="${esc(d.balance)}" placeholder="0.000" style="text-align:left"></div></div>
   <div class="row2"><div class="field"${d.mode==='once'?' hidden':''}><label for="dPay">القسط الشهري</label><input class="inp num" id="dPay" inputmode="decimal" value="${esc(d.payment)}" placeholder="0.000" style="text-align:left"></div>
   <div class="field"><label for="dRate">الفائدة السنوية % (اختياري)</label><input class="inp num" id="dRate" inputmode="decimal" value="${esc(d.rate)}" placeholder="0" style="text-align:left"></div></div>
   <div class="field"${d.mode==='once'?' hidden':''}><label for="dDay">يوم دفع القسط في الشهر</label><input class="inp num" id="dDay" type="number" min="1" max="31" value="${esc(d.day)}" style="text-align:left"></div>
   <div class="row2"><div class="field"><label for="dStart">تاريخ بداية الدين</label><input class="inp" type="date" id="dStart" value="${esc(d.start)}"></div>
   <div class="field"><label for="dEnd">${d.mode==='once'?'موعد السداد':'موعد الانتهاء حسب العقد (اختياري)'}</label><input class="inp" type="date" id="dEnd" value="${esc(d.end)}"></div></div>
   <div class="dsec"><b>📅 متابعة الدفع في التطبيق</b>
    <div class="field"><label for="dTrack">بدأت متابعة الدفع في التطبيق من</label><input class="inp" type="date" id="dTrack" value="${esc(d.trackFrom||'')}"><span class="note" style="margin:0">الأشهر قبل هذا التاريخ تُعتبر مدفوعة، ولا تظهر كمتأخرة. ومنه يبدأ التطبيق قراءة الأقساط ومتابعتها.</span></div>
    ${d.mode==='once'?'':`<div class="row2"><div class="field"><label for="dTotN">عدد الأقساط الكلي (اختياري)</label><input class="inp num" id="dTotN" type="number" min="0" inputmode="numeric" value="${esc(d.totalN||'')}" placeholder="مثال: 60" style="text-align:left"></div>
    <div class="field"><label for="dPaidN">أقساط دفعتها قبل المتابعة</label><input class="inp num" id="dPaidN" type="number" min="0" inputmode="numeric" value="${esc(d.paidN||'')}" placeholder="${d.start&&d.trackFrom?Math.max(0,monthsSpan(d.start.slice(0,7),d.trackFrom.slice(0,7))-1):'0'}" style="text-align:left"></div></div>`}</div>
   <div class="row2"><div class="field"><label for="dRef">رقم العقد / القرض (اختياري)</label><input class="inp" id="dRef" value="${esc(d.ref||'')}" maxlength="40" dir="ltr" style="text-align:left"></div>
   <div class="field"><label for="dNote">ملاحظة (اختياري)</label><input class="inp" id="dNote" value="${esc(d.note||'')}" maxlength="80"></div></div>
   ${d.mode==='once'?'':arrQHtml('d',d.arrQ!==undefined?d.arrQ:(ex?debtArrLeft(ex,ym(new Date()))>0:false),d.arrQ!==undefined?d.arrIn:(ex?debtArrLeft(ex,ym(new Date())):''),'أقساط لم تُدفع من الأشهر الماضية. تُضاف لقسط هذا الشهر في «الشهرية» حتى تُسدَّد، وهي جزء من المتبقي.')}
   <p class="note" style="margin:0">المتبقي تجده في كشف حساب البنك أو تطبيقه. والفائدة اتركها فارغة إن كان الدين بدون فائدة.</p>
   <p class="note" id="dErr" hidden style="color:var(--exp);margin:0"></p>
   <div class="actions"><button class="btn block" id="dSave">حفظ</button>
   ${ex?(askDel?'<div class="confirm"><span>حذف هذا الدين؟ تبقى دفعاته في السجل.</span><div class="row2"><button class="btn danger" id="dDel">نعم، احذف</button><button class="btn ghost" id="dDelNo">تراجع</button></div></div>':'<button class="btn ghost block" id="dDelAsk" style="color:var(--exp)">حذف الدين</button>'):'<button class="btn ghost block" data-close>إلغاء</button>'}</div>
   </div></div></div>`};
  const v=i=>document.getElementById(i).value;
  const grab=()=>{const g=i=>{const e=document.getElementById(i);return e?e.value:undefined};d.trackFrom=g('dTrack')??d.trackFrom;d.totalN=g('dTotN')??d.totalN;d.paidN=g('dPaidN')??d.paidN;d.ref=g('dRef')??d.ref;d.note=g('dNote')??d.note;const ab=document.getElementById('dArrBox');d.arrQ=!!(ab&&!ab.hidden);d.arrIn=document.getElementById('dArr')?v('dArr'):d.arrIn;d.name=v('dName');d.lender=v('dLender');d.original=v('dOrig');d.balance=v('dBal');d.payment=v('dPay');d.rate=v('dRate');d.day=v('dDay');d.start=v('dStart');d.end=v('dEnd')};
  L.oninput=L.onchange=null;
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.dmode){grab();d.mode=x.dataset.dmode;draw();return}
    if(x.dataset.arrq){arrQToggle(x);return}
    if(x.dataset.dtype){grab();d.type=x.dataset.dtype;if(d.type==='people'&&!ex&&d.mode!=='once'&&!d.payment)d.mode='once';if(!d.name.trim()||Object.values(DEBT_T).some(t=>t[0]===d.name))d.name=DEBT_T[d.type][0];draw();return}
    if(x.id==='dDelAsk'){grab();askDel=true;draw();return}
    if(x.id==='dDelNo'){grab();askDel=false;draw();return}
    if(x.id==='dDel'){S.settings.debts=A.filter(y=>y.id!==d.id);L.innerHTML='';putSettings();render();toast('حُذف الدين');return}
    if(x.id==='dSave'){grab();const er=document.getElementById('dErr');const bal=parseAmt(d.balance),pay=parseAmt(d.payment),rate=parseFloat(String(d.rate).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[^\d.]/g,''))||0;
      const once=d.mode==='once',wasDone=ex&&ex.closed;
      if(!d.name.trim()){er.hidden=false;er.textContent='اكتب اسم الدين';return}
      if(d.type==='people'&&!d.lender.trim()){er.hidden=false;er.textContent='اكتب اسم الشخص صاحب الدين';return}
      if(!bal&&!wasDone){er.hidden=false;er.textContent='اكتب المبلغ المتبقي';return}
      if(once&&!d.end){er.hidden=false;er.textContent='حدّد موعد السداد';return}
      if(d.end&&d.start&&d.end<d.start){er.hidden=false;er.textContent='موعد الانتهاء قبل تاريخ البداية';return}
      if(!once&&!pay&&bal){er.hidden=false;er.textContent='اكتب القسط الشهري، أو اختر «دفعة واحدة»';return}
      if(!once&&bal&&pay<=bal*rate/1200){er.hidden=false;er.textContent='القسط أقل من الفائدة الشهرية ('+money(bal*rate/1200)+')، فلن ينتهي الدين. راجع المبالغ';return}
      const rec={id:d.id,type:d.type,name:d.name.trim(),lender:d.lender.trim(),original:Math.max(parseAmt(d.original),bal),balance:bal,payment:once?0:pay,rate,day:once?+d.end.slice(8,10):Math.min(31,Math.max(1,parseInt(d.day)||1)),mode:once?'once':'inst',start:d.start||today(),end:d.end||'',pays:(ex&&ex.pays)||[],log:(ex&&ex.log)||[]};
      if(wasDone)rec.closed=Object.assign({},ex.closed,{start:rec.start});
      if(d.trackFrom&&d.start&&d.trackFrom<d.start.slice(0,10)){er.hidden=false;er.textContent='تاريخ بدء المتابعة قبل تاريخ بداية الدين';return}
      rec.trackFrom=d.trackFrom||today();const tn=parseInt(d.totalN)||0,pn=parseInt(d.paidN);if(tn>0)rec.totalN=tn;if(!isNaN(pn)&&pn>=0)rec.paidN=pn;else if(d.start&&rec.trackFrom&&!once)rec.paidN=Math.max(0,monthsSpan(d.start.slice(0,7),rec.trackFrom.slice(0,7))-1);
      if(tn&&rec.paidN>tn){er.hidden=false;er.textContent='الأقساط المدفوعة أكثر من العدد الكلي';return}
      const rf=lblClean(d.ref||''),nt=lblClean(d.note||'');if(rf)rec.ref=rf;if(nt)rec.note=nt;
      if(ex&&(ex.trackFrom||'')!==rec.trackFrom&&ex.trackFrom)debtLog(rec,'بدء المتابعة من '+fmtD(rec.trackFrom));
      {const cm=ym(new Date()),aIn=!once&&d.arrQ?parseAmt(String(d.arrIn||'')):0,aOld=ex?debtArrLeft(ex,cm):0;if(Math.abs((aIn||0)-aOld)>0.0005||!ex){if(aIn>0){rec.arrears=Math.min(aIn,bal);rec.arrSince=cm}else{delete rec.arrears;delete rec.arrSince}}else if(ex&&ex.arrears){rec.arrears=ex.arrears;rec.arrSince=ex.arrSince}
       if(aIn>0&&Math.abs(aIn-aOld)>0.0005)debtLog(rec,'متأخرات من الأشهر الماضية: '+money(aIn))}
      if(!ex)debtLog(rec,'إضافة الدين: المتبقي '+money(bal)+(once?'، يُسدَّد دفعة واحدة في '+fmtD(rec.end):'، القسط '+money(pay))+(rate?'، الفائدة '+rate+'%':''));
      else{const ch=[];if(Math.abs(ex.balance-bal)>0.0005)ch.push('المتبقي '+money(ex.balance)+' ← '+money(bal));if(Math.abs(ex.payment-pay)>0.0005)ch.push('القسط '+money(ex.payment)+' ← '+money(pay));
        if((+ex.rate||0)!==rate)ch.push('الفائدة '+(+ex.rate||0)+'% ← '+rate+'%');if((+ex.day||1)!==rec.day)ch.push('يوم القسط '+(+ex.day||1)+' ← '+rec.day);if(ex.name!==rec.name)ch.push('الاسم ← '+rec.name);if((ex.mode||'inst')!==rec.mode)ch.push(rec.mode==='once'?'صار السداد دفعة واحدة':'صار السداد أقساطًا');if((ex.end||'')!==rec.end&&rec.end)ch.push('موعد الانتهاء ← '+fmtD(rec.end));
        if(ch.length)debtLog(rec,'تعديل: '+ch.join('، '))}
      debtSync(rec);const i=A.findIndex(y=>y.id===rec.id);if(i>=0)A[i]=rec;else A.push(rec);
      L.innerHTML='';putSettings();render();toast('حُفظ '+rec.name)}};
  draw()}
function openDebtPay(id){const L=document.getElementById('layer');const d=debts().find(x=>x.id===id);if(!d)return;
  const intr=(+d.balance)*(+d.rate||0)/1200;const once=d.mode==='once',full=r3((+d.balance)+intr);
  L.innerHTML=`${sheetTop('سداد')}
   <h2 style="margin-top:0">سداد ${esc(d.name)}</h2>
   <div class="amtbox"><input id="dpAmt" inputmode="decimal" value="${amtIn(once?full:Math.min(r3((+d.payment)+Math.max(0,debtArrLeft(d,ym(new Date()))-0)),full))}" aria-label="المبلغ المدفوع"><span>${CUR}</span></div>${!once&&debtArrLeft(d,ym(new Date()))>0?`<p class="note" style="margin:0 0 8px;text-align:center">يشمل القسط <span class="num">${money(d.payment)}</span> + متأخرات <span class="num amt-exp">${money(debtArrLeft(d,ym(new Date())))}</span></p>`:''}
   <div class="chips" style="justify-content:center">${once?'':`<button class="chip" data-dpamt="${Math.min(+d.payment,full)}">القسط</button>`}<button class="chip pay" data-dpamt="${full}">كامل المتبقي (سداد نهائي)</button></div>
   <div class="stack"><div class="field"><label for="dpDate">تاريخ الدفع</label><input class="inp" type="date" id="dpDate" value="${today()}"></div>
   <label class="note" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="dpTx" checked style="width:18px;height:18px"> سجّلها كمصروف في فئة الأقساط</label>
   <div class="payprev" id="dpPrev"></div>
   <p class="note" style="margin:0">${intr>0.0005?'من المبلغ تقريبًا <span class="num">'+amtH(intr)+'</span> فائدة هذا الشهر، والباقي يُخصم من الدين. ':''}يمكنك دفع مبلغ أكبر من القسط لتنتهي أسرع.</p>
   <div class="actions"><button class="btn block" id="dpSave">حفظ السداد</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div></div>`;
  const dprev=()=>{const a=parseAmt(document.getElementById('dpAmt').value);const p=document.getElementById('dpPrev');if(!p)return;const nb=Math.max(0,r3((+d.balance)-Math.max(0,a-intr)));
    p.innerHTML=!a?'اكتب المبلغ.':nb<=0.0005?'<b class="amt-inc">بهذه الدفعة ينتهي الدين بالكامل ✓</b>':'المتبقي من الدين بعدها <b class="num">'+amtH(nb)+'</b> (الآن '+money(d.balance)+')'};
  dprev();L.onchange=null;L.oninput=e=>{if(e.target.id==='dpAmt')dprev()};
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.dpamt){document.getElementById('dpAmt').value=amtIn(+x.dataset.dpamt);dprev();return}
    if(x.id==='dpSave'){const amt=parseAmt(document.getElementById('dpAmt').value);if(!amt){L.innerHTML='';return}x.disabled=true;const snap=JSON.stringify(debts());const date=document.getElementById('dpDate').value||today();
      const p=await applyDebtPayment(d,amt,date,document.getElementById('dpTx').checked);
      L.innerHTML='';await putSettings();render();toast(d.balance<=0?'مبروك! انتهى دين '+d.name:'شكرًا على الدفع ✓ المتبقي من '+d.name+' '+rial(d.balance)+(()=>{const nx=nextDueTxt({kind:'debt',id:d.id},ym(new Date()));return nx?' · القسط القادم بتاريخ '+dmy(nx.date):''})(),async()=>{S.settings.debts=JSON.parse(snap);if(p.tx)await delTx(p.tx);await putSettings();render();toast('أُلغي السداد')},9000)}};
}

/* سجل الدين: كل دفعة محفوظة بفائدتها وأصلها والمتبقي بعدها، وكل تعديل يُسجَّل داخل الدين */
function debtLog(d,t){if(!d)return;d.log=(d.log||[]).concat([{at:today(),t}]).slice(-80)}
function debtPays(d){return (d.pays||[]).map((p,i)=>({p,i})).sort((a,b)=>(a.p.date||'').localeCompare(b.p.date||'')||a.i-b.i).map(x=>x.p)}
/* أجزاء الدفعة: الفائدة والأصل. الدفعات القديمة (قبل 2.9) تُقدَّر فائدتها */
function payParts(d,p){const int=p.int!==undefined?+p.int:(+d.rate?Math.min(+p.amt||0,r3((+d.balance)*(+d.rate)/1200)):0);return{int,prin:p.prin!==undefined?+p.prin:Math.max(0,r3((+p.amt||0)-int))}}
/* المتبقي بعد كل دفعة: المحفوظ، أو يُحسب رجوعًا من الرصيد الحالي */
function payBalances(d){const P=debtPays(d);const out=new Map();let after=+d.balance||0;
  for(let k=P.length-1;k>=0;k--){const p=P[k];const b=p.bal!==undefined?+p.bal:after;out.set(p,b);after=b+payParts(d,p).prin}
  return out}
async function applyDebtPayment(d,amt,date,asTx){const int=r3(Math.min(amt,(+d.balance)*(+d.rate||0)/1200));const prin=r3(Math.min(+d.balance,Math.max(0,amt-int)));d.balance=Math.max(0,r3((+d.balance)-prin));
  let txId='';if(asTx){const t={id:uidGen(),type:'exp',amount:amt,cat:'loan',date,method:'transfer',note:'قسط '+d.name,createdAt:new Date().toISOString(),debt:d.id};txId=t.id;await putTx(t)}
  const p={id:uidGen(),date,amt,int,prin,bal:d.balance,tx:txId};d.pays=(d.pays||[]).concat([p]).slice(-240);debtLog(d,'دفعة '+money(amt)+' بتاريخ '+fmtD(date)+'، المتبقي '+money(d.balance));debtSync(d);return p}
/* تعديل دفعة قديمة أو حذفها: يُصحَّح المتبقي من الدين والمتبقي بعد الدفعات اللاحقة والمصروف المرتبط */
function shiftLaterBal(d,p,delta){const P=debtPays(d);const k=P.indexOf(p);P.slice(k).forEach(q=>{if(q.bal!==undefined)q.bal=Math.max(0,r3(+q.bal+delta))})}
async function editDebtPay(d,p,amt,date){const {int,prin}=payParts(d,p);const before=r3((+d.balance)+prin);const np=r3(Math.min(before,Math.max(0,amt-int)));const delta=r3(prin-np);
  const old={amt:p.amt,date:p.date};shiftLaterBal(d,p,delta);d.balance=Math.max(0,r3((+d.balance)+delta));Object.assign(p,{amt,date,int,prin:np});
  const t=p.tx&&S.tx[p.tx];if(t)await putTx(Object.assign({},t,{amount:amt,date}));
  debtLog(d,'تعديل دفعة '+fmtD(old.date)+': '+money(old.amt)+(old.amt!==amt?' ← '+money(amt):'')+(old.date!==date?' (التاريخ '+fmtD(date)+')':'')+'، المتبقي '+money(d.balance));if(d.closed)delete d.closed;debtSync(d)}
async function delDebtPay(d,p){const {prin}=payParts(d,p);shiftLaterBal(d,p,prin);d.balance=r3((+d.balance)+prin);d.pays=(d.pays||[]).filter(x=>x!==p);
  if(p.tx&&S.tx[p.tx])await delTx(p.tx);debtLog(d,'حذف دفعة '+money(p.amt)+' بتاريخ '+fmtD(p.date)+'، المتبقي '+money(d.balance));if(d.closed&&+d.balance<=0.0005)delete d.closed;debtSync(d)}
function openDebtPayEdit(id,pid){const L=document.getElementById('layer');const d=debts().find(x=>x.id===id);const p=d&&(d.pays||[]).find(x=>x.id===pid);if(!p)return;
  const {int,prin}=payParts(d,p);let askDel=false;
  const prev=a=>{if(!a)return 'اكتب المبلغ.';const np=Math.min(r3((+d.balance)+prin),Math.max(0,a-int));const nb=Math.max(0,r3((+d.balance)+prin-np));
    return nb<=0.0005?'<b class="amt-inc">بعد التعديل يصبح الدين مسدّدًا بالكامل ✓</b>':'المتبقي من الدين بعد التعديل <b class="num">'+amtH(nb)+'</b> (الآن '+money(d.balance)+')'};
  const draw=()=>{L.innerHTML=`${sheetTop('دفعة دين')}
   <h2 style="margin-top:0">تعديل دفعة ${esc(d.name)}</h2>
   <div class="panel paybk"><div class="sumrow"><span>المبلغ المسجّل</span><b class="num">${money(p.amt)}</b></div><div class="sumrow"><span>التاريخ</span><b>${fmtD(p.date)}</b></div>${int>0.0005?`<div class="sumrow sub"><span>منها فائدة</span><span class="num">${money(int)}</span></div>`:''}</div>
   <div class="amtbox"><input id="dqAmt" inputmode="decimal" value="${amtIn(p.amt)}" aria-label="مبلغ الدفعة"><span>${CUR}</span></div>
   <div class="stack"><div class="field"><label for="dqDate">تاريخ الدفع</label><input class="inp" type="date" id="dqDate" value="${esc(p.date)}"></div>
   <div class="payprev" id="dqPrev">${prev(p.amt)}</div>
   <p class="note" style="margin:0">يُصحَّح المتبقي من الدين تلقائيًا${p.tx&&S.tx[p.tx]?'، ويُعدَّل المصروف المرتبط في السجل':''}. ويمكنك التراجع بعد الحفظ.</p>
   <p class="note" id="dqErr" hidden style="color:var(--exp);margin:0"></p>
   <div class="actions"><button class="btn block" id="dqSave">حفظ التعديل</button>
   ${askDel?'<div class="confirm"><span>حذف هذه الدفعة؟ يعود مبلغها إلى المتبقي من الدين.</span><div class="row2"><button class="btn danger" id="dqDel">نعم، احذف</button><button class="btn ghost" id="dqDelNo">تراجع</button></div></div>':'<button class="btn ghost block" id="dqDelAsk" style="color:var(--exp)">حذف الدفعة</button>'}</div></div></div></div>`};
  draw();L.onchange=null;L.oninput=e=>{if(e.target.id==='dqAmt')document.getElementById('dqPrev').innerHTML=prev(parseAmt(e.target.value))};
  const undo=(snap,tx)=>async()=>{S.settings.debts=JSON.parse(snap);if(tx){delete S.del[tx.id];await putTx(tx)}await putSettings();render();toast('أُلغي التعديل')};
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='dqDelAsk'||x.id==='dqDelNo'){const a=document.getElementById('dqAmt').value,dt=document.getElementById('dqDate').value;askDel=x.id==='dqDelAsk';draw();document.getElementById('dqAmt').value=a;document.getElementById('dqDate').value=dt;document.getElementById('dqPrev').innerHTML=prev(parseAmt(a));return}
    const snap=JSON.stringify(debts()),tx=p.tx&&S.tx[p.tx]?Object.assign({},S.tx[p.tx]):null;
    if(x.id==='dqDel'){x.disabled=true;await delDebtPay(d,p);L.innerHTML='';await putSettings();render();toast('حُذفت الدفعة، المتبقي '+rial(d.balance),undo(snap,tx),9000);return}
    if(x.id==='dqSave'){const amt=parseAmt(document.getElementById('dqAmt').value),date=document.getElementById('dqDate').value||p.date;const er=document.getElementById('dqErr');
      if(!amt){er.hidden=false;er.textContent='اكتب مبلغ الدفعة، أو احذفها';return}
      if(amt===+p.amt&&date===p.date){L.innerHTML='';return}
      x.disabled=true;await editDebtPay(d,p,amt,date);L.innerHTML='';await putSettings();render();toast('عُدّلت الدفعة، المتبقي '+rial(d.balance),undo(snap,tx),9000)}}}
/* عدد الأقساط المتبقية لكل دين بقسطه الحالي، ويوم التحرر من الديون حسب خطتك */
function debtLeft(d){if(!(+d.balance>0.0005))return 0;return simDebts([d],0,'avalanche',false).months}
function debtOff(){const Ds=debts().filter(d=>+d.balance>0.0005),cm=ym(new Date());return Ds.length&&Ds.every(d=>debtPaidIn(d,cm)>0)?1:0}
function debtFree(){const Ds=debts().filter(d=>+d.balance>0.0005);if(!Ds.length)return null;const P=debtPlan();const pl=simDebts(Ds,P.extra,P.strategy,true);
  const rem=Ds.reduce((s,d)=>s+(+d.balance),0),orig=Ds.reduce((s,d)=>s+Math.max(+d.original||0,+d.balance||0),0);
  const out={rem:r3(rem),orig:r3(orig),pct:orig?Math.round((orig-rem)/orig*100):0,inst:r3(Ds.reduce((s,d)=>s+debtInst(d),0)),stuck:pl.stuck,left:Math.max(0,...Ds.filter(d=>d.mode!=='once').map(d=>pl.finish[d.id]||0)),count:Ds.length};
  if(pl.stuck)return out;const last=Ds.filter(d=>pl.finish[d.id]===pl.months);const n=new Date();const dt=new Date(n.getFullYear(),n.getMonth()+pl.months-1+debtOff(),1);
  const day=Math.min(monthDays(dt),Math.max(...last.map(d=>+d.day||1)));dt.setDate(day);
  out.date=isoD(dt);out.label=monthLabel(pl.months);out.days=Math.max(0,daysTo(out.date));
  const cm=ym(n);const nx=Ds.filter(d=>!debtPaidIn(d,cm)&&(d.mode!=='once'||(d.end&&d.end.slice(0,7)===cm))).sort((a,b)=>(+a.day||1)-(+b.day||1))[0];if(nx)out.next={name:nx.name,day:+nx.day||1,amt:nx.mode==='once'?+nx.balance:+nx.payment||0,late:n.getDate()>(+nx.day||1)};
  return out}
/* سجل الدين داخل خانته: الدفعات (تعديل/حذف)، المستندات المشفّرة، التحديثات، والكشف */
function debtHistHtml(d){const P=debtPays(d).reverse();const lg=(d.log||[]).slice().reverse();const D=Vault.docs.filter(x=>x.debt===d.id);const lock=!Vault.key&&Vault.cfg;
  return `<details class="rechist"><summary>سجل الدين <span class="note">(${P.length?countWord(P.length,'دفعة واحدة','دفعتان','دفعات','دفعة'):'لا دفعات'}${D.length?' · '+D.length+' 📎':''}${lg.length?' · '+lg.length+' تحديث':''})</span></summary>
   ${P.length?`<div class="paylist">${P.slice(0,24).map(p=>`<span class="paychip"><button class="pce" data-dpe="${esc(d.id)}|${esc(p.id||'')}" aria-label="تعديل الدفعة"><span class="num">${amtH(p.amt)}</span> · ${fmtD(p.date)}${S.tx[p.tx]&&S.tx[p.tx].pend?' ⏳':''} ✎</button></span>`).join('')}</div>
    <div class="note" style="margin:4px 2px">اضغط على أي دفعة لتعديلها أو حذفها، ويُصحَّح المتبقي تلقائيًا.</div>`:'<div class="note">لا دفعات مسجّلة بعد.</div>'}
   <div class="rh-log"><b>مستندات الدين ${lock?'🔒':''}</b>${D.length?`<div class="chips" style="margin:6px 0 0">${D.map(x=>`<button class="chip" data-cdview="${esc(x.id)}">📎 ${esc(x.title)}${(x.files||[]).length>1?' ('+x.files.length+')':''}</button>`).join('')}</div>`:'<div class="note">أرفق عقد القرض وإيصالات السداد، تُحفظ مشفّرة في خزنتك ولا تُزامَن.</div>'}
    <div class="chips" style="margin:6px 0 0"><button class="chip pay" data-ddoc="${esc(d.id)}:debtdoc">+ العقد أو مستند</button><button class="chip" data-ddoc="${esc(d.id)}:debtrcpt">+ إيصال سداد</button></div></div>
   ${lg.length?`<div class="rh-log"><b>التحديثات</b>${lg.slice(0,8).map(x=>`<div class="sumrow sub"><span>${esc(x.t)}</span><span>${fmtD(x.at)}</span></div>`).join('')}</div>`:''}
   <div class="chips" style="margin:8px 0 0"><button class="chip" data-dprint="${esc(d.id)}">كشف للطباعة</button></div></details>`}
function debtDocPre(id,type){const d=debts().find(x=>x.id===id);if(!d||!DOC_T[type])return null;return{type,debt:d.id,owner:'',title:DOC_T[type][0]+' - '+d.name,expiry:''}}
/* كشف دين واحد للطباعة أو الحفظ PDF */
function printDebt(id){const d=debts().find(x=>x.id===id);if(!d)return;const now=new Date();const N=v=>`<span class="n">${money(v)}</span>`;const t=DEBT_T[d.type]||DEBT_T.other;
  const P=debtPays(d),B=payBalances(d);const o=Math.max(+d.original||0,+d.balance||0);const sp=P.reduce((s,p)=>s+(+p.amt||0),0),si=P.reduce((s,p)=>s+payParts(d,p).int,0);
  const Dp=debtPlan();const pl=+d.balance>0.0005?simDebts(debts(),Dp.extra,Dp.strategy,true):null;const left=debtLeft(d);const docs=Vault.docs.filter(x=>x.debt===d.id);
  let body=`<header class="rh"><div><div class="rapp">إدارة شؤوني</div><h1>كشف دين: ${esc(d.name)}</h1><div class="rper">${esc(DEBT_G[debtGroup(d)][0])} · ${esc(t[0])}${d.lender?' · '+esc(d.lender):''} · ${d.mode==='once'?'يُسدَّد دفعة واحدة':'القسط يوم '+(+d.day||1)}${+d.rate?' · فائدة سنوية '+(+d.rate)+'%':' · بدون فائدة'}</div></div><div class="rmeta">أُعدّ في ${fmtD(today())} الساعة ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}<br>العملة: الريال العُماني (ر.ع.)</div></header>
   <section><h2>الملخص</h2><div class="kpis"><div><span>المبلغ الأصلي</span><b>${N(o)}</b></div><div><span>مجموع ما سدّدته</span><b>${N(sp)}</b></div><div><span>المتبقي الآن</span><b class="${+d.balance>0.0005?'no':'ok'}">${N(d.balance)}</b></div><div><span>${d.mode==='once'?'طريقة السداد':'القسط الشهري'}</span><b>${d.mode==='once'?'دفعة واحدة':N(d.payment)}</b></div><div><span>بدأ في</span><b>${fmtD(debtStart(d))}</b></div><div><span>${d.closed?'انتهى في':'ينتهي المقرر'}</span><b>${(()=>{const e=debtEnd(d,pl||debtSim());return e?fmtD(e):'—'})()}</b></div>${d.closed?`<div><span>استغرق</span><b>${spanWord(d.closed.start,d.closed.end)}</b></div><div><span>طريقة التخلص منه</span><b>${CLOSE_M[d.closed.method]}</b></div>`:''}
    <div><span>نسبة السداد</span><b>${o?Math.round((o-(+d.balance))/o*100):100}%</b></div><div><span>الأقساط المتبقية</span><b>${+d.balance>0.0005?(left===null?'لا ينتهي بهذا القسط':left):'مسدّد'}</b></div><div><span>ينتهي حسب خطتك</span><b>${pl&&pl.finish[d.id]?monthLabel(pl.finish[d.id]):+d.balance>0.0005?'—':'انتهى ✓'}</b></div>${si>0.0005?`<div><span>فوائد دفعتها</span><b>${N(si)}</b></div>`:''}</div></section>
   <section class="txs"><h2>الدفعات</h2>${P.length?`<table><thead><tr><th>#</th><th>التاريخ</th><th>المبلغ</th>${+d.rate?'<th>فائدة</th><th>من الأصل</th>':''}<th>المتبقي بعدها</th><th>مصروف مسجّل</th></tr></thead><tbody>${P.map((p,i)=>{const q=payParts(d,p);return `<tr><td>${i+1}</td><td class="nw">${fmtD(p.date)}</td><td>${N(p.amt)}</td>${+d.rate?`<td>${N(q.int)}</td><td>${N(q.prin)}</td>`:''}<td>${N(B.get(p))}</td><td>${p.tx&&S.tx[p.tx]?'نعم':'—'}</td></tr>`}).join('')}</tbody><tfoot><tr><td></td><td>المجموع</td><td>${N(sp)}</td>${+d.rate?`<td>${N(si)}</td><td>${N(sp-si)}</td>`:''}<td></td><td></td></tr></tfoot></table>`:'<p>لا دفعات مسجّلة.</p>'}</section>
   ${docs.length?`<section><h2>المستندات المرفقة (محفوظة مشفّرة في التطبيق)</h2><table><tbody>${docs.map(x=>`<tr><td>${esc(x.title)}</td><td>${(x.files||[]).length} ${(x.files||[]).length===1?'ملف':'ملفات'}</td><td class="nw">${x.created?fmtD(x.created.slice(0,10)):''}</td></tr>`).join('')}</tbody></table></section>`:''}
   ${(d.log||[]).length?`<section><h2>سجل التحديثات</h2><table><thead><tr><th>التاريخ</th><th>التحديث</th></tr></thead><tbody>${d.log.map(x=>`<tr><td class="nw">${fmtD(x.at)}</td><td>${esc(x.t)}</td></tr>`).join('')}</tbody></table></section>`:''}
   <section class="sign"><div><span>توقيع المقترض</span><i></i></div><div><span>اعتماد الجهة الدائنة</span><i></i></div></section>
   <footer class="rf">كشف من تطبيق «إدارة شؤوني»${S.settings.printDev===false?'':`<br>تصميم وتطوير: ${DEV.name}، ${DEV.title} · ${DEV.country}`}</footer>`;
  prStyle('portrait');let el=document.getElementById('printArea');if(!el){el=document.createElement('div');el.id='printArea';document.body.appendChild(el)}
  el.className='rep';el.innerHTML=body;const old=document.title;document.title='كشف دين '+d.name;window.addEventListener('afterprint',()=>{document.title=old},{once:true});
  try{window.print()}catch(e){toast('تعذّرت الطباعة هنا')}setTimeout(()=>{document.title=old},3000)}

/* ---------- 18. الأمانات: أموال الآخرين التي عندك ---------- */
/* الأمانة ليست دخلًا ولا مصروفًا، فلا تدخل في التقارير ولا الخطة اليومية، لكنها تُخصم عند مقارنة رصيد البنك. */
const TRUST_WHERE={main:'الحساب الجاري',savings:'حساب الادخار',cash:'نقدًا',other:'مكان آخر'};
function trusts(){return S.settings.trusts||[]}
function trustCalc(t){const ret=(t.returns||[]).reduce((s,r)=>s+(+r.amt||0),0);const amt=+t.amount||0;const rem=r3(Math.max(0,amt-ret));
  const st=rem<=0.0005?'done':ret>0?'part':'open';const dd=t.due&&st!=='done'?daysTo(t.due):null;
  return{amt,ret:r3(ret),rem,st,dd,last:(t.returns||[]).map(r=>r.date).sort().pop()||''}}
function trustsHeld(where){return r3(trusts().filter(t=>!where||(t.where||'main')===where).reduce((s,t)=>s+trustCalc(t).rem,0))}
const TRUST_ST={open:['لم تُرجع','soon'],part:['أُرجع جزء منها','soon'],done:['أُرجعت كاملة','paid']};
function trustAlertList(){return trusts().map(t=>({t,c:trustCalc(t)})).filter(x=>x.c.dd!==null&&x.c.dd<=7).map(x=>({ref:'trust:'+x.t.id,id:x.t.id,days:x.c.dd,level:x.c.dd<0?'late':'warn',
  title:'إرجاع أمانة '+x.t.name+' '+money(x.c.rem)+' '+CUR,when:x.c.dd<0?'موعدها كان '+fmtD(x.t.due):x.c.dd===0?'موعدها اليوم':'موعدها '+fmtD(x.t.due)+' (بعد '+countWord(x.c.dd,'يوم واحد','يومين','أيام','يومًا')+')'})).sort((a,b)=>a.days-b.days)}
function trustAlertsHtml(){const A=trustAlertList();if(!A.length)return '';
  return `<div class="alertbox"><div class="alerthead"><b>مواعيد إرجاع الأمانات</b><span class="pill late">${A.length}</span></div>${A.map(a=>`<div class="alertrow ${a.level}"><span class="adot"></span><div style="min-width:0"><b>${esc(a.title)}</b><small>${esc(a.when)}</small></div><button class="chip pay" data-tret="${esc(a.id)}">أرجعت</button></div>`).join('')}</div>`}
function vTrusts(){const T=trusts();const f=S.tfilter||'open';
  const head=`<div class="backrow"><h2 style="margin:4px 0">${esc(lbl('sec.trusts'))}</h2><div style="display:flex;gap:6px"><button class="chip pay" data-tnew="1">+ أمانة</button><button class="chip" data-tab="home">الرئيسية ‹</button></div></div>`;
  if(!T.length)return head+`<div class="panel empty"><b>وثّق الأموال التي ائتمنك عليها الآخرون</b>إذا أعطاك أحد مبلغًا تحفظه له، سجّله هنا باسمه وتاريخه ومكانه. لا يُحسب دخلًا ولا مصروفًا، لكنه يُخصم عند مقارنة رصيد البنك حتى تعرف أموالك أنت. وسجّل كل إرجاع، جزئيًا أو كاملًا، واطبع كشفًا لأي أمانة.</div><button class="btn block" data-tnew="1">إضافة أمانة</button>`;
  const all=T.map(t=>({t,c:trustCalc(t)}));const held=all.reduce((s,x)=>s+x.c.rem,0),ret=all.reduce((s,x)=>s+x.c.ret,0),tot=all.reduce((s,x)=>s+x.c.amt,0);
  const byW=Object.keys(TRUST_WHERE).map(k=>[k,trustsHeld(k)]).filter(([,v])=>v>0.0005);
  const people={};all.filter(x=>x.c.rem>0).forEach(x=>{people[x.t.name]=(people[x.t.name]||0)+x.c.rem});
  const L=all.filter(x=>f==='all'||(f==='open'?x.c.st!=='done':x.c.st==='done')).sort((a,b)=>(a.c.st==='done')-(b.c.st==='done')||(a.c.dd??1e9)-(b.c.dd??1e9)||b.t.date.localeCompare(a.t.date));
  const card=({t,c})=>{const p=c.amt?Math.min(100,c.ret/c.amt*100):0;
    return `<div class="goal${c.st==='done'?' done':''}" id="trust-${esc(t.id)}"><div class="ghead"><div style="display:flex;gap:10px;align-items:flex-start;min-width:0"><span class="cbadge" style="background:#6B5C3A1f;color:#6B5C3A">${svgI(TI.trust)}</span><div style="min-width:0"><b>${esc(t.name)}</b><small>${esc(t.purpose||'أمانة')} · استلمتها ${fmtD(t.date)} · ${esc(TRUST_WHERE[t.where||'main'])}</small></div></div>
      <div class="gm"><span>${c.st==='done'?'الحالة':'المتبقي عندك'}</span><b class="num ${c.st==='done'?'amt-inc':''}">${c.st==='done'?'أُرجعت':money(c.rem)}</b></div></div>
      <div class="gcount"><div><b class="num">${amtH(c.amt)}</b><span>المبلغ</span></div><div><b class="num amt-inc">${amtH(c.ret)}</b><span>أرجعت <span dir="ltr">${Math.round(p)}%</span></span></div><div><b class="num">${c.dd===null?'—':c.dd<0?'متأخر':c.dd}</b><span>${c.dd===null?(t.due?'':'بلا موعد'):c.dd<0?'منذ '+daysWord(-c.dd):'يوم حتى الإرجاع'}</span></div></div>
      <div class="meter"><i style="width:${p}%;background:var(--inc)"></i></div>
      <div class="budgetline" style="margin:0"><span class="pill ${TRUST_ST[c.st][1]}">${TRUST_ST[c.st][0]}</span><span>${(t.returns||[]).length?'آخر إرجاع '+fmtD(c.last):t.due?'موعد الإرجاع '+fmtD(t.due):''}</span></div>
      ${(t.returns||[]).length?`<details><summary class="note" style="cursor:pointer">سجل الإرجاع (${t.returns.length})</summary><div style="margin-top:6px">${t.returns.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(r=>`<div class="sumrow"><span>${fmtD(r.date)}${r.note?' · '+esc(r.note):''}</span><b class="num">${amtH(r.amt)}</b></div>`).join('')}</div></details>`:''}
      <div class="gbtns">${c.st!=='done'?`<button class="chip pay" data-tret="${esc(t.id)}">أرجعت مبلغًا</button>`:''}<button class="chip" data-tprint="${esc(t.id)}">كشف للطباعة</button><button class="chip" data-tedit="${esc(t.id)}">تعديل</button></div></div>`};
  return head+`<div class="savcard trustcard"><div class="savhead"><span class="cbadge" style="background:#ffffff26;color:#fff">${svgI(TI.trust)}</span><div style="min-width:0"><span class="lbl">أمانات عندك الآن (ليست لك)</span><div class="big"><span class="num">${money(held)}</span> <small>${CUR}</small></div><span class="lbl">من ${countWord(all.filter(x=>x.c.rem>0).length,'أمانة واحدة','أمانتين','أمانات','أمانة')} · أرجعت حتى الآن ${money(ret)} من ${money(tot)}</span></div></div></div>
   ${byW.length?`<div class="panel" style="margin-top:10px">${byW.map(([k,v])=>`<div class="sumrow"><span>${esc(TRUST_WHERE[k])}</span><b class="num">${amtH(v)}</b></div>`).join('')}${Object.keys(people).length>1?`<div class="note" style="margin-top:6px">${Object.entries(people).sort((a,b)=>b[1]-a[1]).map(([n,v])=>esc(n)+' '+money(v)).join(' · ')}</div>`:''}</div>`:''}
   <div class="chips" style="margin-top:12px">${[['open','عندي الآن'],['done','أُرجعت'],['all','الكل']].map(([k,n])=>`<button class="chip" data-tfilter="${k}" aria-pressed="${f===k}">${n}</button>`).join('')}<button class="chip" data-treport="1">تقرير الأمانات</button></div>
   <div class="stack" style="margin-top:8px">${L.length?L.map(card).join(''):'<div class="note">لا توجد أمانات في هذا التصنيف.</div>'}</div>`}
function openTrust(id){const L=document.getElementById('layer');const A=S.settings.trusts||(S.settings.trusts=[]);const ex=id?A.find(x=>x.id===id):null;
  const t=ex?Object.assign({},ex):{id:uidGen(),name:'',phone:'',amount:'',date:today(),where:'main',purpose:'',due:'',note:'',returns:[]};let askDel=false;
  const draw=()=>{L.innerHTML=`${sheetTop('أمانة')}
   <h2 style="margin-top:0">${ex?'تعديل الأمانة':'أمانة جديدة'}</h2><div class="stack">
   <div class="field"><label for="tName">صاحب الأمانة</label><input class="inp" id="tName" value="${esc(t.name)}" placeholder="من أعطاك المال؟" maxlength="40" list="tNames"><datalist id="tNames">${[...new Set(trusts().map(x=>x.name))].map(n=>`<option value="${esc(n)}">`).join('')}</datalist></div>
   <div class="row2"><div class="field"><label for="tAmt">المبلغ (${CUR})</label><input class="inp num" id="tAmt" inputmode="decimal" value="${t.amount!==''?amtIn(t.amount):''}" placeholder="0.000" style="text-align:left"></div>
   <div class="field"><label for="tDate">تاريخ الاستلام</label><input class="inp" type="date" id="tDate" value="${esc(t.date)}"></div></div>
   <div class="row2"><div class="field"><label for="tWhere">أين هي الآن؟</label><select class="inp" id="tWhere">${Object.entries(TRUST_WHERE).map(([k,n])=>`<option value="${k}" ${(t.where||'main')===k?'selected':''}>${n}</option>`).join('')}</select></div>
   <div class="field"><label for="tDue">موعد الإرجاع (اختياري)</label><input class="inp" type="date" id="tDue" value="${esc(t.due||'')}"></div></div>
   <div class="field"><label for="tPurpose">الغرض</label><input class="inp" id="tPurpose" value="${esc(t.purpose||'')}" placeholder="مثال: حفظ مبلغ، شراء غرض له، توصيل لشخص" maxlength="60"></div>
   <div class="row2"><div class="field"><label for="tPhone">هاتفه (اختياري)</label><input class="inp num" id="tPhone" inputmode="tel" value="${esc(t.phone||'')}" placeholder="9xxxxxxx" style="text-align:left"></div>
   <div class="field"><label for="tNote">ملاحظة</label><input class="inp" id="tNote" value="${esc(t.note||'')}" maxlength="80"></div></div>
   <p class="note" style="margin:0">الأمانة لا تُسجَّل دخلًا ولا مصروفًا. تُخصم فقط عند مقارنة رصيد ${esc(TRUST_WHERE[t.where||'main'])} الفعلي.</p>
   <p class="note" id="tErr" hidden style="color:var(--exp);margin:0"></p>
   <button class="btn block" id="tSave">حفظ</button>
   ${ex?(askDel?'<div class="confirm"><span>حذف هذه الأمانة وسجل إرجاعها؟</span><div class="row2"><button class="btn danger" id="tDel">نعم، احذف</button><button class="btn ghost" id="tDelNo">تراجع</button></div></div>':'<button class="btn ghost block" id="tDelAsk" style="color:var(--exp)">حذف</button>'):'<button class="btn ghost block" data-close>إلغاء</button>'}
   </div></div></div>`};
  const v=k=>document.getElementById(k).value;
  const grab=()=>{t.name=v('tName');t.amount=v('tAmt');t.date=v('tDate');t.where=v('tWhere');t.due=v('tDue');t.purpose=v('tPurpose');t.phone=v('tPhone');t.note=v('tNote')};
  L.onchange=L.oninput=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='tDelAsk'){grab();askDel=true;draw();return}
    if(x.id==='tDelNo'){grab();askDel=false;draw();return}
    if(x.id==='tDel'){S.settings.trusts=A.filter(y=>y.id!==t.id);L.innerHTML='';await putSettings();render();toast('حُذفت الأمانة');return}
    if(x.id==='tSave'){grab();const er=document.getElementById('tErr');const amt=parseAmt(t.amount);
      if(!t.name.trim()){er.hidden=false;er.textContent='اكتب اسم صاحب الأمانة';return}
      if(!amt){er.hidden=false;er.textContent='اكتب المبلغ';return}
      if(!t.date){er.hidden=false;er.textContent='حدّد تاريخ الاستلام';return}
      const ret=(t.returns||[]).reduce((s,r)=>s+(+r.amt||0),0);if(amt+0.0005<ret){er.hidden=false;er.textContent='المبلغ أقل مما أرجعته ('+money(ret)+')';return}
      const rec={id:t.id,name:t.name.trim(),phone:t.phone.trim(),amount:amt,date:t.date,where:t.where,due:t.due||'',purpose:t.purpose.trim(),note:t.note.trim(),returns:t.returns||[]};
      const i=A.findIndex(y=>y.id===t.id);if(i>=0)A[i]=rec;else A.push(rec);L.innerHTML='';await putSettings();S.tab='trusts';render();
      toast(ex?'حُفظت الأمانة':'سُجّلت أمانة '+rec.name);if(!ex)setTimeout(()=>trustShare(rec,'in'),150)}};
  draw()}
function openTrustReturn(id){const L=document.getElementById('layer');const t=trusts().find(x=>x.id===id);if(!t)return;const c=trustCalc(t);
  L.innerHTML=`${sheetTop('إرجاع أمانة')}
   <h2 style="margin-top:0">أرجعت من أمانة ${esc(t.name)}</h2>
   <div class="amtbox"><input id="trAmt" inputmode="decimal" value="${amtIn(c.rem)}" aria-label="المبلغ"><span>${CUR}</span></div>
   <div class="chips" style="justify-content:center"><button class="chip" data-tramt="${c.rem}">كامل المتبقي ${money(c.rem)}</button>${c.rem>2?`<button class="chip" data-tramt="${r3(c.rem/2)}">النصف</button>`:''}</div>
   <div class="stack"><div class="row2"><div class="field"><label for="trDate">التاريخ</label><input class="inp" type="date" id="trDate" value="${today()}"></div>
   <div class="field"><label for="trNote">ملاحظة</label><input class="inp" id="trNote" placeholder="مثال: تحويل بنكي" maxlength="60"></div></div>
   <p class="note" id="trErr" hidden style="color:var(--exp);margin:0"></p>
   <div class="actions"><button class="btn block" id="trSave">حفظ الإرجاع</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div></div>`;
  L.oninput=L.onchange=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.tramt){document.getElementById('trAmt').value=amtIn(+x.dataset.tramt);return}
    if(x.id==='trSave'){const amt=parseAmt(document.getElementById('trAmt').value);const er=document.getElementById('trErr');
      if(!amt){er.hidden=false;er.textContent='اكتب المبلغ';return}if(amt>c.rem+0.0005){er.hidden=false;er.textContent='المتبقي من الأمانة '+money(c.rem)+' فقط';return}
      t.returns=(t.returns||[]).concat([{id:uidGen(),date:document.getElementById('trDate').value||today(),amt,note:document.getElementById('trNote').value.trim()}]);
      L.innerHTML='';await putSettings();render();const nc=trustCalc(t);toast(nc.st==='done'?'أُرجعت أمانة '+t.name+' كاملة':'سُجّل الإرجاع، المتبقي '+rial(nc.rem));setTimeout(()=>trustShare(t,'out',amt),150)}}}
/* إشعار لصاحب الأمانة عبر واتساب أو أي تطبيق، بعد موافقتك */
function trustShare(t,kind,amt){const c=trustCalc(t);const L=document.getElementById('layer');
  const msg=kind==='in'?`السلام عليكم ${t.name}،\nأؤكد استلامي منك أمانة بمبلغ ${money(t.amount)} ر.ع. بتاريخ ${fmtD(t.date)}${t.purpose?' ('+t.purpose+')':''}.\nوهي محفوظة عندي حتى تطلبها${t.due?'، وموعد إرجاعها '+fmtD(t.due):''}.`
    :`السلام عليكم ${t.name}،\nأرجعت لك اليوم ${money(amt)} ر.ع. من أمانتك.\n${c.st==='done'?'وبذلك أُرجعت الأمانة كاملة ('+money(c.amt)+' ر.ع.). جزاك الله خيرًا على الثقة.':'المتبقي عندي '+money(c.rem)+' ر.ع. من أصل '+money(c.amt)+' ر.ع.'}`;
  L.innerHTML=`${sheetTop('إشعار صاحب الأمانة')}<h2 style="margin-top:0">إرسال إشعار لـ${esc(t.name)}؟</h2>
   <div class="panel" style="white-space:pre-line;line-height:1.8">${esc(msg)}</div>
   <div class="actions"><div class="row2">${t.phone?`<a class="btn" href="https://wa.me/968${esc(String(t.phone).replace(/\D/g,'').replace(/^968/,''))}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener" data-close>واتساب</a>`:`<button class="btn" id="tsShare">مشاركة</button>`}<button class="btn ghost" data-close>لا، شكرًا</button></div></div></div></div>`;
  L.oninput=L.onchange=null;
  L.onclick=async e=>{const x=e.target.closest('button,a,[data-close]');if(!x)return;
    if(x.id==='tsShare'){try{if(navigator.share){await navigator.share({text:msg})}else{await navigator.clipboard.writeText(msg);toast('نُسخت الرسالة')}}catch(err){}L.innerHTML='';return}
    if(x.hasAttribute('data-close')){setTimeout(()=>{L.innerHTML=''},50);return}}}
/* كشف أمانة واحدة للطباعة أو الحفظ PDF */
function printTrust(id){const t=trusts().find(x=>x.id===id);if(!t)return;const c=trustCalc(t);const now=new Date();
  const N=v=>`<span class="n">${money(v)}</span>`;
  const rows=[['صاحب الأمانة',esc(t.name)+(t.phone?' · <span class="n">'+esc(t.phone)+'</span>':'')],['الغرض',esc(t.purpose||'—')],['تاريخ الاستلام',fmtD(t.date)],['مكان حفظها',esc(TRUST_WHERE[t.where||'main'])],['موعد الإرجاع',t.due?fmtD(t.due):'عند الطلب'],['المبلغ',N(c.amt)],['المُرجع',N(c.ret)],['المتبقي',N(c.rem)],['الحالة',TRUST_ST[c.st][0]]];
  let body=`<header class="rh"><div><div class="rapp">إدارة شؤوني</div><h1>كشف أمانة: ${esc(t.name)}</h1><div class="rper">${esc(t.purpose||'')}</div></div><div class="rmeta">أُعدّ في ${fmtD(today())} الساعة ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}<br>العملة: الريال العُماني (ر.ع.)</div></header>
   <section><h2>بيانات الأمانة</h2><table><tbody>${rows.map(([k,v])=>`<tr><th style="width:32%">${k}</th><td>${v}</td></tr>`).join('')}</tbody></table></section>
   <section><h2>سجل الإرجاع</h2>${(t.returns||[]).length?`<table><thead><tr><th>#</th><th>التاريخ</th><th>المبلغ</th><th>الرصيد بعده</th><th>ملاحظة</th></tr></thead><tbody>${(()=>{let b=c.amt;return t.returns.slice().sort((a,b2)=>a.date.localeCompare(b2.date)).map((r,i)=>{b-=+r.amt;return `<tr><td class="idx">${i+1}</td><td class="nw">${fmtD(r.date)}</td><td>${N(r.amt)}</td><td>${N(Math.max(0,b))}</td><td>${esc(r.note||'')}</td></tr>`}).join('')})()}</tbody><tfoot><tr><td></td><td>المجموع</td><td>${N(c.ret)}</td><td>${N(c.rem)}</td><td></td></tr></tfoot></table>`:'<p>لم يُرجع شيء بعد.</p>'}</section>
   ${t.note?`<p class="hint">ملاحظة: ${esc(t.note)}</p>`:''}
   <section class="sign"><div><span>توقيع المؤتمَن</span><i></i></div><div><span>توقيع صاحب الأمانة</span><i></i></div></section>
   <footer class="rf">كشف من تطبيق «إدارة شؤوني»${S.settings.printDev===false?'':`<br>تصميم وتطوير: ${DEV.name}، ${DEV.title} · ${DEV.country}`}</footer>`;
  prStyle('portrait');let el=document.getElementById('printArea');if(!el){el=document.createElement('div');el.id='printArea';document.body.appendChild(el)}
  el.className='rep';el.innerHTML=body;const old=document.title;document.title='كشف أمانة '+t.name;window.addEventListener('afterprint',()=>{document.title=old},{once:true});
  try{window.print()}catch(e){toast('تعذّرت الطباعة هنا')}setTimeout(()=>{document.title=old},3000)}

/* ---------- 19. مستنداتي: الخزنة المشفّرة ---------- */
const DOC_T={id:['البطاقة الشخصية','idcard','#24508C',60],passport:['جواز السفر','passport','#2E8B72',180],license:['رخصة القيادة','car','#3E7CB1',60],cv:['السيرة الذاتية (CV)','doc','#6B5CA5',0],
 cert:['شهادة','edu','#3B8F5A',0],mulk:['ملكية مركبة','car','#5B6F8A',30],carins:['تأمين مركبة','shield','#3E7CB1',30],carother:['مستند سيارة','car','#7A6CC0',0],debtdoc:['عقد أو مستند دين','loan','#8A4F7D',0],receipt:['إيصال شراء','doc','#3B8F5A',0],debtrcpt:['إيصال سداد','doc','#B0662F',0],health:['بطاقة صحية','health','#C0445A',30],other:['مستند آخر','iother','#7A8494',30]};
const VDB=(()=>{let dbp=null;
  const open=()=>dbp||(dbp=new Promise((res,rej)=>{const r=indexedDB.open('masareef-vault',1);r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('kv');d.createObjectStore('docs',{keyPath:'id'});d.createObjectStore('blobs')};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
  const rq=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
  const st=(s,m)=>open().then(d=>d.transaction(s,m||'readonly').objectStore(s));
  return{get:(s,k)=>st(s).then(o=>rq(o.get(k))),all:s=>st(s).then(o=>rq(o.getAll())),put:(s,v,k)=>st(s,'readwrite').then(o=>rq(k===undefined?o.put(v):o.put(v,k))),del:(s,k)=>st(s,'readwrite').then(o=>rq(o.delete(k))),clear:s=>st(s,'readwrite').then(o=>rq(o.clear()))}})();
const Vault={key:null,docs:[],cfg:null,ready:false,urls:[],lockT:null,last:Date.now()};
const te=x=>new TextEncoder().encode(x),td=b=>new TextDecoder().decode(b);
async function vDerive(pin,salt){const base=await crypto.subtle.importKey('raw',te(pin),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function vEnc(key,data){const iv=crypto.getRandomValues(new Uint8Array(12));const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,data));return{iv,ct}}
async function vDec(key,o){return crypto.subtle.decrypt({name:'AES-GCM',iv:o.iv},key,o.ct)}
async function vaultLoad(){try{Vault.cfg=await VDB.get('kv','cfg')||null;Vault.bio=await VDB.get('kv','bio')||null;Vault.docs=await VDB.all('docs')||[];}catch(e){Vault.docs=[]}Vault.ready=true;if(S.tab==='home'||S.tab==='docs')render()}
function vaultLock(){Vault.key=null;S.docFolder=null;Vault.urls.forEach(u=>URL.revokeObjectURL(u));Vault.urls=[];if(S.tab==='docs'||document.querySelector('.sheet[data-vault]')){const L=document.getElementById('layer');if(L.querySelector('[data-vault]'))L.innerHTML='';render()}}
function vaultTouch(){Vault.last=Date.now()}
setInterval(()=>{if(Vault.key&&Date.now()-Vault.last>5*60*1000)vaultLock()},30000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){clearTimeout(Vault.lockT);Vault.lockT=setTimeout(vaultLock,60000)}else clearTimeout(Vault.lockT)});
function docAlertList(){const out=[];Vault.docs.forEach(d=>{const t=DOC_T[d.type]||DOC_T.other;if(!d.expiry||!t[3]||d.car||d.debt||d.tx)return;const n=daysTo(d.expiry);
  if(n<=t[3])out.push({d,days:n,level:n<0||n<=14?'late':'warn',title:(n<0?'انتهت صلاحية ':'تنتهي صلاحية ')+d.title+(d.owner&&!d.title.includes(personName(d.owner))?' ('+personName(d.owner)+')':''),when:n<0?'منذ '+daysWord(-n):n===0?'اليوم':'بعد '+daysWord(n)+(d.type==='passport'&&n>0?'، وكثير من الدول تشترط صلاحية 6 أشهر للسفر':'')})});
  return out.sort((a,b)=>a.days-b.days)}
function docAlertsHtml(){const A=docAlertList();if(!A.length)return '';
  return `<div class="alertbox"><div class="alerthead"><b>تنبيهات المستندات</b><span class="pill late">${A.length}</span></div>${A.map(a=>`<div class="alertrow ${a.level}"><span class="adot"></span><div style="min-width:0"><b>${esc(a.title)}</b><small>${esc(a.when)}</small></div><button class="chip" data-tab="docs">تفاصيل</button></div>`).join('')}</div>`}
function docBadge(d){const t=DOC_T[d.type]||DOC_T.other;return `<span class="cbadge" style="background:${t[2]}1f;color:${t[2]}">${svgI(CI[t[1]])}</span>`}
function vDocs(){
  const head=`<div class="backrow"><h2 style="margin:4px 0">${esc(lbl('sec.docs'))}</h2><span style="display:flex;gap:6px">${Vault.key?'<button class="chip" id="vaultLock">قفل</button>':''}<button class="chip" data-tab="home">الرئيسية ‹</button></span></div>`;
  if(!Vault.ready)return head+'<div class="panel empty">جارٍ التحميل…</div>';
  if(!window.crypto||!crypto.subtle)return head+'<div class="panel empty"><b>التشفير غير متاح هنا</b>افتح التطبيق من رابطه الآمن (https) لاستخدام الخزنة.</div>';
  if(!Vault.cfg)return head+`<div class="panel stack vaultbox"><span class="cbadge big">${catIcon('iother').replace(/<circle[^>]*\/><path[^>]*\/>/,CI.lock)}</span><b style="font-size:17px">خزنة مستنداتك الشخصية</b>
    <p class="note" style="margin:0;line-height:1.8">احفظ صور البطاقة الشخصية والجواز والرخصة والسيرة الذاتية والشهادات في خزنة مشفّرة على هذا الجهاز، مع تنبيه قبل انتهاء صلاحيتها، ومشاركتها بأمان عند الحاجة.</p>
    <div class="field"><label for="vPin1">اختر رمزًا للخزنة (4 إلى 8 أرقام)</label><input class="inp num pin" id="vPin1" type="password" inputmode="numeric" autocomplete="new-password" maxlength="8"></div>
    <div class="field"><label for="vPin2">أعد كتابة الرمز</label><input class="inp num pin" id="vPin2" type="password" inputmode="numeric" autocomplete="new-password" maxlength="8"></div>
    <p class="note" id="vErr" hidden style="color:var(--exp);margin:0"></p>
    <button class="btn block" id="vaultSetup">إنشاء الخزنة</button>
    <p class="note" style="margin:0">مهم: لا يمكن استرجاع الرمز إذا نسيته، لأن الملفات مشفّرة به. احفظه في مكان آمن.</p></div>`;
  if(!Vault.key)return head+`${docAlertsHtml()}<div class="panel stack vaultbox"><span class="cbadge big">${catIcon('iother').replace(/<circle[^>]*\/><path[^>]*\/>/,CI.lock)}</span><b style="font-size:17px">الخزنة مقفلة</b><span class="note">${Vault.docs.length?Vault.docs.length+' مستند محفوظ':'لا توجد مستندات بعد'}</span>
    <div class="field"><label for="vPin">رمز الخزنة</label><input class="inp num pin" id="vPin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="8"></div>
    <p class="note" id="vErr" hidden style="color:var(--exp);margin:0"></p>${Vault.bio?`<button class="btn block faceid" id="vaultBio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" aria-hidden="true"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M9 9v1.5M15 9v1.5M12 9v4h-1M9.5 16c1.5 1 3.5 1 5 0"/></svg> فتح ببصمة الوجه</button><button class="btn ghost block" id="vaultUnlock">فتح بالرمز</button>`:'<button class="btn block" id="vaultUnlock">فتح الخزنة</button>'}
    <details><summary class="note" style="cursor:pointer">نسيت الرمز؟</summary><div class="stack" style="margin-top:8px"><p class="note" style="margin:0">لا يمكن فتح الملفات بدون الرمز. يمكنك حذف الخزنة والبدء من جديد، وستُحذف كل المستندات المحفوظة فيها.</p><button class="btn danger" id="vaultReset">حذف الخزنة والبدء من جديد</button></div></details></div>`;
  const card=d=>{const t=DOC_T[d.type]||DOC_T.other;const n=d.expiry?daysTo(d.expiry):null;
    const pill=n===null?'':n<0?`<span class="pill late">منتهي منذ ${daysWord(-n)}</span>`:t[3]&&n<=t[3]?`<span class="pill warn">ينتهي بعد ${daysWord(n)}</span>`:`<span class="pill soon">صالح حتى ${fmtD(d.expiry)}</span>`;
    return `<div class="goal"><div class="ghead"><div style="display:flex;gap:10px;align-items:flex-start;min-width:0">${docBadge(d)}<div style="min-width:0"><b>${esc(d.title)}</b><small>${d.owner?'لـ'+esc(personName(d.owner))+' · ':''}${!(d.files||[]).length?'بدون ملفات':(d.files.length===1?'ملف واحد':d.files.length===2?'ملفان':d.files.length+' ملفات')}</small></div></div>${pill}</div>
      ${(d.files||[]).length?`<div class="thumbs">${d.files.map(f=>`<button class="thumb" data-vview="${esc(d.id)}" data-fid="${esc(f.id)}" aria-label="عرض ${esc(f.name)}">${f.mime==='application/pdf'?'<span class="pdf">PDF</span>':'<img alt="" data-thumb="'+esc(f.id)+'">'}</button>`).join('')}</div>`:''}
      <div class="gbtns"><button class="chip" data-vview="${esc(d.id)}">عرض</button><button class="chip pay" data-vshare="${esc(d.id)}">مشاركة</button><button class="chip" data-vsecure="${esc(d.id)}">إرسال بكلمة مرور</button><button class="chip" data-vedit="${esc(d.id)}">تعديل</button></div></div>`};
  return head+(S.docFolder?'':docAlertsHtml()+`<div class="row2" style="margin-bottom:12px"><button class="btn" data-vadd="1">+ إضافة مستند</button><button class="btn ghost" id="vaultExport">تصدير الخزنة</button></div>`)+`
   ${docFoldersHtml(card)}${Vault.docs.length?'':`<div class="panel empty" style="margin-top:12px"><b>لا توجد مستندات بعد</b>اضغط «إضافة مستند» وصوّر البطاقة أو الجواز، أو اختر ملف PDF مثل السيرة الذاتية.</div>`}
   <div class="panel stack" style="margin-top:14px"><b>الأمان</b><p class="note" style="margin:0;line-height:1.8">كل الملفات مشفّرة على هذا الجهاز برمز الخزنة، ولا تُرفع إلى أي مكان، ولا تدخل في المزامنة. تُقفل الخزنة تلقائيًا بعد 5 دقائق أو عند الخروج من التطبيق. لنقلها إلى جهاز آخر: «تصدير الخزنة» ثم «استيراد» على الجهاز الآخر بنفس الرمز.</p>
   ${bioCapable()?(Vault.bio?'<div class="sumrow" style="align-items:center"><span>الفتح ببصمة الوجه مفعّل</span><button class="chip" id="bioOff">إيقاف</button></div>':'<button class="btn block faceid" id="bioOn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" aria-hidden="true"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M9 9v1.5M15 9v1.5M12 9v4h-1M9.5 16c1.5 1 3.5 1 5 0"/></svg> تفعيل الفتح ببصمة الوجه</button>'):''}
   <label class="btn ghost block" for="vaultImportFile" style="text-align:center;cursor:pointer">استيراد خزنة من ملف</label><input type="file" id="vaultImportFile" accept=".json,application/json" hidden></div>`;
}

const DOC_FOLDER={id:'البطاقات الشخصية',passport:'جوازات السفر',license:'رخص القيادة',cv:'السير الذاتية',cert:'الشهادات',mulk:'ملكيات المركبات',carins:'تأمين المركبات',carother:'مستندات السيارات',debtdoc:'مستندات الديون',receipt:'إيصالات المشتريات',debtrcpt:'إيصالات السداد',health:'البطاقات الصحية',other:'مستندات أخرى'};
function docFoldersHtml(card){
  const by=S.docBy||'type',f=S.docFolder;const sortD=(a,b)=>(a.owner?personName(a.owner):'').localeCompare(b.owner?personName(b.owner):'')||(a.created||'').localeCompare(b.created||'');
  const seg=`<div class="seg" style="margin-bottom:12px"><button class="n" data-docby="type" aria-pressed="${by==='type'}">حسب النوع</button><button class="n" data-docby="person" aria-pressed="${by==='person'}">حسب الشخص</button></div>`;
  if(f){const [k,v]=f.split(':');const list=Vault.docs.filter(d=>k==='type'?d.type===v:(d.owner||'')===v).sort(sortD);
    const name=k==='type'?DOC_FOLDER[v]||v:(v?personName(v):'مستنداتي أنا');
    const sub=k==='type'?(()=>{const g={};list.forEach(d=>{const o=d.owner?personName(d.owner):'أنا';g[o]=(g[o]||0)+1});return Object.entries(g).map(([o,n])=>o+(n>1?' ('+n+')':'')).join('، ')})():'';
    return `<div class="backrow" style="margin-bottom:10px"><div style="display:flex;gap:10px;align-items:center;min-width:0">${k==='type'?docBadge({type:v}):'<span class="avatar" style="background:'+(v?personColor(v):'var(--accent)')+'22;color:'+(v?personColor(v):'var(--accent)')+'">'+esc(name.charAt(0))+'</span>'}<div style="min-width:0"><b style="font-size:17px">${esc(name)}</b><div class="note">${list.length?list.length+' مستند'+(sub?' · '+esc(sub):''):'فارغ'}</div></div></div><button class="chip" data-docfolder="">كل المجلدات ‹</button></div>
      <button class="btn block" data-vadd="${esc(f)}" style="margin-bottom:12px">+ إضافة ${k==='type'?esc((DOC_T[v]||DOC_T.other)[0]):'مستند لـ'+esc(name)}</button>
      ${list.length?`<div class="stack">${list.map(card).join('')}</div>`:'<div class="panel empty">لا توجد مستندات في هذا المجلد بعد.</div>'}`}
  const folders=by==='type'
    ?Object.keys(DOC_T).map(k=>{const L=Vault.docs.filter(d=>d.type===k);const owners=[...new Set(L.map(d=>d.owner?personName(d.owner):'أنا'))];const alert=L.some(d=>{const t=DOC_T[d.type];const n=d.expiry?daysTo(d.expiry):null;return n!==null&&t[3]&&n<=t[3]});
        return `<button class="folder${L.length?'':' empty'}${alert?' alert':''}" data-docfolder="type:${k}">${docBadge({type:k})}<b>${esc(DOC_FOLDER[k])}</b><small>${L.length?L.length+' · '+esc(owners.slice(0,3).join('، '))+(owners.length>3?'…':''):'فارغ'}</small></button>`}).join('')
    :[''].concat(people().map(p=>p.id)).map(pid=>{const L=Vault.docs.filter(d=>(d.owner||'')===pid);const nm=pid?personName(pid):'أنا';const col=pid?personColor(pid):'var(--accent)';
        return `<button class="folder${L.length?'':' empty'}" data-docfolder="person:${esc(pid)}"><span class="avatar" style="width:30px;height:30px;font-size:14px;background:${col}22;color:${col}">${esc(nm.charAt(0))}</span><b>${esc(nm)}</b><small>${L.length?L.length+' مستند':'فارغ'}</small></button>`}).join('');
  return seg+`<div class="folders">${folders}</div>`+(by==='person'&&!people().length?'<p class="note" style="margin-top:8px">أضف أفراد أسرتك من قسم «البيت» لتظهر مجلداتهم هنا.</p>':'');
}
async function hydrateDocs(){if(!Vault.key)return;for(const img of document.querySelectorAll('img[data-thumb]')){try{const o=await VDB.get('blobs',img.dataset.thumb);if(!o)continue;const buf=await vDec(Vault.key,o);const u=URL.createObjectURL(new Blob([buf],{type:'image/jpeg'}));Vault.urls.push(u);img.src=u}catch(e){}}}
async function vaultFiles(d){const out=[];for(const f of d.files||[]){const o=await VDB.get('blobs',f.id);if(!o)continue;const buf=await vDec(Vault.key,o);out.push(new File([buf],f.name,{type:f.mime}))}return out}
async function compressImage(file){try{if(!/^image\//.test(file.type))return file;const bmp=await createImageBitmap(file);const sc=Math.min(1,2000/Math.max(bmp.width,bmp.height));const c=document.createElement('canvas');c.width=Math.round(bmp.width*sc);c.height=Math.round(bmp.height*sc);c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);const b=await new Promise(r=>c.toBlob(r,'image/jpeg',0.85));return b?new File([b],(file.name||'صورة').replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'}):file}catch(e){return file}}
function openDoc(id,pre){if(!Vault.key)return;const L=document.getElementById('layer');const ex=id?Vault.docs.find(x=>x.id===id):null;
  const d=ex?{id:ex.id,car:ex.car||'',debt:ex.debt||'',tx:ex.tx||'',type:ex.type,title:ex.title,owner:ex.owner||'',issue:ex.issue||'',expiry:ex.expiry||'',number:'',notes:'',files:(ex.files||[]).slice(),created:ex.created}:(()=>{const ty=pre&&pre.type||'id',ow=pre&&pre.owner||'';return{id:uidGen(),type:ty,title:pre&&pre.title||DOC_T[ty][0]+(ow?' - '+personName(ow):''),owner:ow,issue:'',expiry:pre&&pre.expiry||'',number:'',notes:'',files:[],car:pre&&pre.car||'',debt:pre&&pre.debt||'',tx:pre&&pre.tx||''}})();
  const added=[],removed=[];let askDel=false,loaded=!ex;
  const draw=()=>{L.innerHTML=`<div class="scrim" data-close></div><div class="sheet" data-vault role="dialog" aria-modal="true" aria-label="مستند"><div class="in"><div class="grab"></div>
   <h2 style="margin-top:0">${ex?'تعديل المستند':'مستند جديد'}</h2><div class="stack">
   <div class="catgrid">${Object.entries(DOC_T).map(([k,t])=>`<button class="cg" data-dt="${k}" aria-pressed="${d.type===k}"><i style="background:${t[2]}1f;color:${t[2]}">${svgI(CI[t[1]])}</i>${t[0].replace(' (CV)','')}</button>`).join('')}</div>
   <div class="row2"><div class="field"><label for="vTitle">الاسم</label><input class="inp" id="vTitle" value="${esc(d.title)}" maxlength="40"></div>
   <div class="field"><label for="vOwner">لمن؟</label><select class="inp" id="vOwner"><option value="">لي</option>${people().map(p=>`<option value="${esc(p.id)}" ${d.owner===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div></div>
   ${cars().length?`<div class="field"><label for="vCar">مرتبط بسيارة</label><select class="inp" id="vCar"><option value="">لا</option>${cars().map(c=>`<option value="${esc(c.id)}" ${d.car===c.id?'selected':''}>${esc(c.name)}${c.owner?' ('+esc(ownerLabel(c))+')':''}</option>`).join('')}</select></div>`:''}
   ${debts().length?`<div class="field"><label for="vDebt">مرتبط بدين</label><select class="inp" id="vDebt"><option value="">لا</option>${debts().map(x=>`<option value="${esc(x.id)}" ${d.debt===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>`:''}
   <div class="field"><label for="vNum">رقم المستند (اختياري، يُحفظ مشفّرًا)</label><input class="inp" id="vNum" value="${esc(d.number)}" dir="ltr" autocomplete="off" maxlength="40" ${loaded?'':'placeholder="جارٍ فك التشفير…"'}></div>
   <div class="row2"><div class="field"><label for="vIssue">تاريخ الإصدار</label><input class="inp" type="date" id="vIssue" value="${esc(d.issue)}"></div>
   <div class="field"><label for="vExp">تاريخ الانتهاء</label><input class="inp" type="date" id="vExp" value="${esc(d.expiry)}"></div></div>
   <div class="field"><label>الملفات</label><div class="filelist">${d.files.map(f=>`<div class="filerow"><span>${f.mime==='application/pdf'?'PDF':'صورة'} · ${esc(f.name)}</span><button class="chip" data-frm="${esc(f.id)}" aria-label="حذف الملف">✕</button></div>`).join('')}${added.map((f,i)=>`<div class="filerow new"><span>جديد · ${esc(f.name)}</span><button class="chip" data-arm="${i}" aria-label="حذف الملف">✕</button></div>`).join('')}</div>
    <label class="btn ghost block" for="vFile" style="text-align:center;cursor:pointer">+ صورة أو ملف PDF</label><input type="file" id="vFile" accept="image/*,application/pdf" multiple hidden>
    <span class="note">${d.type==='id'||d.type==='license'?'صوّر الوجه الأمامي والخلفي.':d.type==='passport'?'صوّر صفحة البيانات.':''} يمكنك التصوير بالكاميرا مباشرة أو الاختيار من الصور أو الملفات.</span></div>
   <div class="field"><label for="vNotes">ملاحظات (اختياري، تُحفظ مشفّرة)</label><input class="inp" id="vNotes" value="${esc(d.notes)}" maxlength="200"></div>
   <p class="note" id="vdErr" hidden style="color:var(--exp);margin:0"></p>
   <div class="actions"><button class="btn block" id="vSave">حفظ</button>
   ${ex?(askDel?'<div class="confirm"><span>حذف هذا المستند وملفاته نهائيًا؟</span><div class="row2"><button class="btn danger" id="vDel">نعم، احذف</button><button class="btn ghost" id="vDelNo">تراجع</button></div></div>':'<button class="btn ghost block" id="vDelAsk" style="color:var(--exp)">حذف المستند</button>'):'<button class="btn ghost block" data-close>إلغاء</button>'}</div>
   </div></div></div>`};
  const grab=()=>{const g=i=>document.getElementById(i);if(g('vCar'))d.car=g('vCar').value;if(g('vDebt'))d.debt=g('vDebt').value;d.title=g('vTitle').value;d.owner=g('vOwner').value;d.number=g('vNum').value;d.issue=g('vIssue').value;d.expiry=g('vExp').value;d.notes=g('vNotes').value};
  if(ex&&ex.secret)vDec(Vault.key,ex.secret).then(b=>{const o=JSON.parse(td(b));d.number=o.number||'';d.notes=o.notes||'';loaded=true;const a=document.getElementById('vNum'),n=document.getElementById('vNotes');if(a&&!a.value)a.value=d.number;if(n&&!n.value)n.value=d.notes}).catch(()=>{loaded=true});
  L.oninput=null;L.onchange=e=>{if(e.target.id==='vOwner'){grab();const base=d.title.split(' - ')[0];if(Object.values(DOC_T).some(t=>t[0]===base)){d.title=base+(d.owner?' - '+personName(d.owner):'');document.getElementById('vTitle').value=d.title}return}
    if(e.target.id==='vFile'){grab();const fs=[...e.target.files];for(const f of fs){if(f.size>20*1024*1024){toast('الملف '+f.name+' أكبر من 20 ميجابايت');continue}added.push(f)}e.target.value='';draw()}};
  L.onclick=async e=>{vaultTouch();const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.dt){grab();const base=d.title.split(' - ')[0];if(!d.title.trim()||Object.values(DOC_T).some(t=>t[0]===base))d.title=DOC_T[x.dataset.dt][0]+(d.owner?' - '+personName(d.owner):'');d.type=x.dataset.dt;draw();return}
    if(x.dataset.frm){grab();removed.push(x.dataset.frm);d.files=d.files.filter(f=>f.id!==x.dataset.frm);draw();return}
    if(x.dataset.arm!==undefined){grab();added.splice(+x.dataset.arm,1);draw();return}
    if(x.id==='vDelAsk'){grab();askDel=true;draw();return}
    if(x.id==='vDelNo'){grab();askDel=false;draw();return}
    if(x.id==='vDel'){for(const f of ex.files||[])await VDB.del('blobs',f.id);await VDB.del('docs',ex.id);Vault.docs=Vault.docs.filter(y=>y.id!==ex.id);L.innerHTML='';render();toast('حُذف المستند');return}
    if(x.id==='vSave'){grab();const er=document.getElementById('vdErr');if(!d.title.trim()){er.hidden=false;er.textContent='اكتب اسم المستند';return}
      x.disabled=true;x.textContent='جارٍ التشفير والحفظ…';
      try{for(const f of added){const c=await compressImage(f);const buf=await c.arrayBuffer();const fid=uidGen();await VDB.put('blobs',await vEnc(Vault.key,buf),fid);d.files.push({id:fid,name:c.name||'ملف',mime:c.type||'application/octet-stream',size:c.size})}
        for(const fid of removed)await VDB.del('blobs',fid);
        if(d.owner&&Object.values(DOC_T).some(t=>t[0]===d.title.trim()))d.title=d.title.trim()+' - '+personName(d.owner);
        const rec={id:d.id,car:d.car||'',debt:d.debt||'',tx:d.tx||'',type:d.type,title:d.title.trim(),owner:d.owner,issue:d.issue,expiry:d.expiry,files:d.files,created:d.created||new Date().toISOString(),secret:await vEnc(Vault.key,te(JSON.stringify({number:d.number.trim(),notes:d.notes.trim()})))};
        await VDB.put('docs',rec);const i=Vault.docs.findIndex(y=>y.id===rec.id);if(i>=0)Vault.docs[i]=rec;else Vault.docs.push(rec);
        L.innerHTML='';render();toast('حُفظ '+rec.title+' مشفّرًا'+(rec.car?' ومربوط بالسيارة':rec.debt?' ومربوط بالدين':rec.tx?' ومربوط بالعملية':''))}
      catch(err){x.disabled=false;x.textContent='حفظ';er.hidden=false;er.textContent='تعذّر الحفظ. قد تكون مساحة الهاتف ممتلئة'}}};
  draw()}
async function viewDoc(id,fid){const d=Vault.docs.find(x=>x.id===id);if(!d||!Vault.key)return;const L=document.getElementById('layer');
  let info={number:'',notes:''};try{info=JSON.parse(td(await vDec(Vault.key,d.secret)))}catch(e){}
  const parts=[];for(const f of d.files||[]){try{const o=await VDB.get('blobs',f.id);const buf=await vDec(Vault.key,o);const u=URL.createObjectURL(new Blob([buf],{type:f.mime}));Vault.urls.push(u);parts.push({f,u})}catch(e){}}
  parts.sort((a,b)=>(b.f.id===fid)-(a.f.id===fid));
  L.innerHTML=`<div class="scrim" data-close></div><div class="sheet" data-vault role="dialog" aria-modal="true" aria-label="${esc(d.title)}"><div class="in"><div class="grab"></div>
   <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">${docBadge(d)}<h2 style="margin:0">${esc(d.title)}</h2></div>
   <div class="panel" style="padding-block:6px">${info.number?`<div class="sumrow"><span>الرقم</span><span style="display:flex;gap:8px;align-items:center"><b dir="ltr">${esc(info.number)}</b><button class="chip" id="vCopyNum">نسخ</button></span></div>`:''}${d.issue?`<div class="sumrow"><span>الإصدار</span><b>${fmtD(d.issue)}</b></div>`:''}${d.expiry?`<div class="sumrow"><span>الانتهاء</span><b>${fmtD(d.expiry)}</b></div>`:''}${d.owner?`<div class="sumrow"><span>لمن</span><b>${esc(personName(d.owner))}</b></div>`:''}${info.notes?`<div class="sumrow"><span>ملاحظات</span><span>${esc(info.notes)}</span></div>`:''}</div>
   <div class="stack" style="margin-top:12px">${parts.map(p=>p.f.mime==='application/pdf'?`<a class="btn ghost block" href="${p.u}" target="_blank" rel="noopener" style="text-align:center;text-decoration:none">فتح ${esc(p.f.name)}</a>`:`<img src="${p.u}" alt="${esc(p.f.name)}" class="docimg">`).join('')}</div>
   <div class="actions"><div class="row2"><button class="btn" data-vshare="${esc(d.id)}">مشاركة</button><button class="btn ghost" data-vsecure="${esc(d.id)}">إرسال بكلمة مرور</button></div><button class="btn ghost block" data-close>إغلاق</button></div></div></div>`;
  L.oninput=L.onchange=null;
  L.onclick=async e=>{vaultTouch();const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='vCopyNum'){try{await navigator.clipboard.writeText(info.number);toast('نُسخ الرقم')}catch(err){toast('تعذّر النسخ')}return}
    if(x.dataset.vshare){await shareDoc(x.dataset.vshare);return}
    if(x.dataset.vsecure){await secureSend(x.dataset.vsecure);return}}}
async function shareDoc(id){const d=Vault.docs.find(x=>x.id===id);if(!d||!Vault.key)return;const L=document.getElementById('layer');
  L.innerHTML=`<div class="scrim" data-close></div><div class="sheet" data-vault role="dialog" aria-modal="true" aria-label="إرسال"><div class="in"><div class="grab"></div><p class="note" style="text-align:center;padding:24px 0">جارٍ تجهيز الملفات…</p></div></div>`;
  const raw=await vaultFiles(d);if(!raw.length){L.innerHTML='';toast('لا توجد ملفات في هذا المستند');return}
  const safe=d.title.replace(/[\\/:*?"<>|]/g,'-');
  const files=raw.map((f,i)=>{const ext=(f.name.match(/\.[A-Za-z0-9]+$/)||[f.type==='application/pdf'?'.pdf':'.jpg'])[0];return new File([f],safe+(raw.length>1?' ('+(i+1)+')':'')+ext,{type:f.type})});
  const sel=files.map(()=>true);
  const draw=()=>{L.innerHTML=`<div class="scrim" data-close></div><div class="sheet" data-vault role="dialog" aria-modal="true" aria-label="إرسال ${esc(d.title)}"><div class="in"><div class="grab"></div>
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">${docBadge(d)}<h2 style="margin:0">إرسال «${esc(d.title)}»</h2></div>
    <div class="field"><label>الملفات التي ستُرسل</label><div class="filelist">${files.map((f,i)=>`<label class="filerow" style="cursor:pointer"><span><input type="checkbox" data-shi="${i}" ${sel[i]?'checked':''} style="width:18px;height:18px;vertical-align:-4px;margin-inline-end:8px">${esc(f.name)}</span><span class="note">${f.size>1048576?(f.size/1048576).toFixed(1)+' م.ب':Math.max(1,Math.round(f.size/1024))+' ك.ب'}</span></label>`).join('')}</div></div>
    <div class="warnbox" style="margin-top:10px">سيُرسل الملف كما هو بدون تشفير، ويستطيع من يستلمه فتحه وحفظه. أرسله فقط لمن تثق به.</div>
    <div class="actions"><button class="btn block" id="shGo">موافق، أرسل عبر واتساب أو البريد</button><button class="btn ghost block" data-vsecure="${esc(d.id)}">أرسله محميًا بكلمة مرور بدلًا من ذلك</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`};
  L.oninput=null;L.onchange=e=>{if(e.target.dataset.shi!==undefined)sel[+e.target.dataset.shi]=e.target.checked};
  L.onclick=async e=>{vaultTouch();const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.vsecure){await secureSend(x.dataset.vsecure);return}
    if(x.id==='shGo'){const out=files.filter((f,i)=>sel[i]);if(!out.length){toast('اختر ملفًا واحدًا على الأقل');return}
      if(navigator.canShare&&navigator.canShare({files:out})){navigator.share({files:out,title:d.title}).then(()=>{L.innerHTML='';toast('أُرسل '+(out.length===1?'الملف':out.length+' ملفات'))}).catch(err=>{if(!err||err.name!=='AbortError')toast('تعذّرت المشاركة، حاول مرة أخرى')});return}
      out.forEach((f,i)=>dlBlob(f,/^[\x20-\x7E]+$/.test(f.name)?f.name:'idarat-shuooni-document-'+(i+1)+((f.name.match(/\.[A-Za-z0-9]+$/)||[''])[0])));L.innerHTML='';toast('حُفظت الملفات في التنزيلات، ويمكنك إرفاقها في واتساب أو البريد')}};
  draw()}
function b64(u8){let s='';for(let i=0;i<u8.length;i+=32768)s+=String.fromCharCode.apply(null,u8.subarray(i,i+32768));return btoa(s)}
function unb64(s){const b=atob(s);const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
function randPass(){const a='ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';const r=crypto.getRandomValues(new Uint8Array(10));return [...r].map(x=>a[x%a.length]).join('')}
async function secureSend(id){const d=Vault.docs.find(x=>x.id===id);if(!d||!Vault.key)return;const files=await vaultFiles(d);if(!files.length){toast('لا توجد ملفات في هذا المستند');return}
  const pass=randPass();const salt=crypto.getRandomValues(new Uint8Array(16));const key=await vDerive(pass,salt);
  const payload={title:d.title,files:await Promise.all(files.map(async f=>({name:f.name,type:f.type,data:b64(new Uint8Array(await f.arrayBuffer()))})))};
  const e=await vEnc(key,te(JSON.stringify(payload)));
  const html=`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>مستند محمي</title><style>body{font-family:-apple-system,Segoe UI,Tahoma,sans-serif;background:#F2F5F9;color:#16202E;margin:0;padding:24px 16px}main{max-width:480px;margin:0 auto;background:#fff;border-radius:18px;padding:22px;box-shadow:0 6px 18px rgb(0 0 0/.08)}h1{font-size:20px;margin:0 0 6px}p{color:#5D6878;line-height:1.7}input{width:100%;box-sizing:border-box;font-size:18px;padding:12px;border:1px solid #D9DFE7;border-radius:12px;direction:ltr;text-align:center}button,a.b{display:block;width:100%;box-sizing:border-box;margin-top:12px;padding:13px;border:0;border-radius:12px;background:#1F5AA6;color:#fff;font-size:16px;font-weight:600;text-align:center;text-decoration:none}img{max-width:100%;border-radius:12px;margin-top:12px}#err{color:#B8423A}</style></head><body><main><h1>مستند محمي بكلمة مرور</h1><p>أُرسل إليك هذا المستند مشفّرًا. اكتب كلمة المرور التي وصلتك في رسالة منفصلة لفتحه. يعمل الفتح داخل جهازك دون إنترنت.</p><input id="p" placeholder="كلمة المرور" autocomplete="off"><button id="o">فتح المستند</button><p id="err"></p><div id="out"></div></main><script>const D=${JSON.stringify({s:b64(salt),i:b64(e.iv),c:b64(e.ct)})};const u=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));document.getElementById('o').onclick=async()=>{try{const b=await crypto.subtle.importKey('raw',new TextEncoder().encode(document.getElementById('p').value.trim()),'PBKDF2',false,['deriveKey']);const k=await crypto.subtle.deriveKey({name:'PBKDF2',salt:u(D.s),iterations:250000,hash:'SHA-256'},b,{name:'AES-GCM',length:256},false,['decrypt']);const r=JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:u(D.i)},k,u(D.c))));const o=document.getElementById('out');o.innerHTML='<h1 style="margin-top:16px"></h1>';o.firstChild.textContent=r.title;document.getElementById('err').textContent='';r.files.forEach(f=>{const url=URL.createObjectURL(new Blob([u(f.data)],{type:f.type}));if(f.type.startsWith('image/')){const i=document.createElement('img');i.src=url;o.appendChild(i)}const a=document.createElement('a');a.className='b';a.href=url;a.download=f.name;a.textContent='تنزيل '+f.name;o.appendChild(a)})}catch(x){document.getElementById('err').textContent='كلمة المرور غير صحيحة، أو المتصفح لا يدعم الفتح. افتح الملف في Safari أو Chrome.'}}<\/script></body></html>`;
  const file=new File([html],'مستند-محمي.html',{type:'text/html'});
  const L=document.getElementById('layer');
  L.innerHTML=`<div class="scrim" data-close></div><div class="sheet" data-vault role="dialog" aria-modal="true" aria-label="إرسال بكلمة مرور"><div class="in"><div class="grab"></div>
   <h2 style="margin-top:0">إرسال «${esc(d.title)}» بكلمة مرور</h2>
   <ol class="note" style="line-height:1.9;padding-inline-start:18px;margin:0 0 10px"><li>أرسل الملف المحمي عبر واتساب أو البريد.</li><li>أرسل كلمة المرور <b>برسالة منفصلة</b> أو بطريق آخر (اتصال مثلًا).</li><li>يفتح المستلم الملف في المتصفح ويكتب كلمة المرور.</li></ol>
   <div class="passbox"><span class="note">كلمة المرور</span><b dir="ltr" class="num" id="sPass">${pass}</b><button class="chip" id="sCopy">نسخ</button></div>
   <div class="actions"><button class="btn block" id="sShare">مشاركة الملف المحمي</button><button class="btn ghost block" data-close>تم</button></div>
   <p class="note" style="margin:8px 0 0">لن تُحفظ كلمة المرور في التطبيق. وإذا فتح المستلم الملف من معاينة البريد ولم يعمل، فليفتحه في Safari أو Chrome.</p></div></div>`;
  L.oninput=L.onchange=null;
  L.onclick=async ev=>{const x=ev.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='sCopy'){try{await navigator.clipboard.writeText(pass);toast('نُسخت كلمة المرور')}catch(err){toast('تعذّر النسخ، اكتبها يدويًا')}return}
    if(x.id==='sShare'){try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'مستند محمي'});return}}catch(err){if(err&&err.name==='AbortError')return}
      dlBlob(file,file.name);toast('حُفظ الملف المحمي في التنزيلات')}}}
async function vaultExport(){if(!Vault.key)return;const blobs={};for(const d of Vault.docs)for(const f of d.files||[]){const o=await VDB.get('blobs',f.id);if(o)blobs[f.id]={iv:b64(o.iv),ct:b64(o.ct)}}
  const ser=o=>o?{iv:b64(o.iv),ct:b64(o.ct)}:null;
  const out={app:'masareef-vault',v:1,at:new Date().toISOString(),cfg:{salt:b64(Vault.cfg.salt),check:ser(Vault.cfg.check)},docs:Vault.docs.map(d=>Object.assign({},d,{secret:ser(d.secret)})),blobs};
  saveFile('idarat-shuooni-vault-'+today()+'.json',JSON.stringify(out),'application/json');toast('صُدّرت الخزنة مشفّرة. تحتاج رمز الخزنة لفتحها')}
async function vaultImport(txt){try{const o=JSON.parse(txt);if(!o||o.app!=='masareef-vault')throw 0;
  const pin=document.getElementById('vImpPin')?document.getElementById('vImpPin').value:'';
  const des=x=>x?{iv:unb64(x.iv),ct:unb64(x.ct)}:null;const k2=await vDerive(pin||'',unb64(o.cfg.salt));
  try{await vDec(k2,des(o.cfg.check))}catch(e){toast('رمز ملف الخزنة غير صحيح');return false}
  let n=0;for(const d of o.docs){if(Vault.docs.some(x=>x.id===d.id))continue;const files=[];
    for(const f of d.files||[]){const b=o.blobs[f.id];if(!b)continue;const buf=await vDec(k2,des(b));await VDB.put('blobs',await vEnc(Vault.key,buf),f.id);files.push(f)}
    const sec=d.secret?await vEnc(Vault.key,await vDec(k2,des(d.secret))):await vEnc(Vault.key,te('{}'));
    const rec=Object.assign({},d,{files,secret:sec});await VDB.put('docs',rec);Vault.docs.push(rec);n++}
  render();toast('استُورد '+n+' مستند');return true}catch(e){toast('هذا الملف ليس خزنة من إدارة شؤوني');return false}}

/* ---------- 20. بصمة الوجه، تأكيد العمليات الخطيرة، ووضع المدير ---------- */
const BIO_SALT=te('masareef-vault-faceid-v1');
const bioCapable=()=>!!(window.PublicKeyCredential&&navigator.credentials&&navigator.credentials.create);
async function bioKeyFrom(prfOut){return crypto.subtle.importKey('raw',prfOut,{name:'AES-GCM'},false,['encrypt','decrypt'])}
async function bioAssert(credId){const a=await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{type:'public-key',id:credId}],userVerification:'required',timeout:60000,extensions:{prf:{eval:{first:BIO_SALT}}}}});
  const r=a&&a.getClientExtensionResults&&a.getClientExtensionResults();const out=r&&r.prf&&r.prf.results&&r.prf.results.first;if(!out)throw new Error('noprf');return out}
async function bioEnable(pin){
  try{const key=await vDerive(pin,Vault.cfg.salt);await vDec(key,Vault.cfg.check)}catch(e){return 'badpin'}
  let cred;try{cred=await navigator.credentials.create({publicKey:{rp:{name:'إدارة شؤوني'},user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'خزنة إدارة شؤوني',displayName:'خزنة إدارة شؤوني'},
    challenge:crypto.getRandomValues(new Uint8Array(32)),pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],timeout:60000,
    authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'preferred',userVerification:'required'},extensions:{prf:{eval:{first:BIO_SALT}}}}})}catch(e){return e&&e.name==='NotAllowedError'?'cancel':'fail'}
  const credId=new Uint8Array(cred.rawId);let out=null;
  try{const r=cred.getClientExtensionResults();out=r&&r.prf&&r.prf.results&&r.prf.results.first}catch(e){}
  if(!out){try{out=await bioAssert(credId)}catch(e){return e.message==='noprf'?'noprf':(e&&e.name==='NotAllowedError'?'cancel':'fail')}}
  const k=await bioKeyFrom(out);const bio={credId,pin:await vEnc(k,te(pin)),at:new Date().toISOString()};await VDB.put('kv',bio,'bio');Vault.bio=bio;return 'ok'}
async function bioUnlock(){const out=await bioAssert(Vault.bio.credId);const k=await bioKeyFrom(out);const pin=td(await vDec(k,Vault.bio.pin));const key=await vDerive(pin,Vault.cfg.salt);await vDec(key,Vault.cfg.check);return key}
function openBioSetup(){const L=document.getElementById('layer');
  L.innerHTML=`<div class="scrim" data-close></div><div class="sheet" data-vault role="dialog" aria-modal="true" aria-label="الفتح ببصمة الوجه"><div class="in"><div class="grab"></div>
   <h2 style="margin-top:0">الفتح ببصمة الوجه</h2>
   <p class="note" style="line-height:1.8;margin:0 0 10px">اكتب رمز الخزنة مرة واحدة للتأكيد، ثم وافق على بصمة الوجه. بعدها تفتح الخزنة بنظرة. يُحفظ الرمز مشفّرًا ولا يُفك إلا ببصمتك. يحتاج iOS 18 أو أحدث، وعلى الـMac يعمل ببصمة الإصبع.</p>
   <div class="stack"><div class="field"><label for="bPin">رمز الخزنة</label><input class="inp num pin" id="bPin" type="password" inputmode="numeric" maxlength="8"></div>
   <p class="note" id="bErr" hidden style="color:var(--exp);margin:0"></p>
   <div class="actions"><button class="btn block" id="bGo">تفعيل بصمة الوجه</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div></div>`;
  L.oninput=L.onchange=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='bGo'){const er=document.getElementById('bErr');x.disabled=true;const r=await bioEnable(document.getElementById('bPin').value);x.disabled=false;
      const msg={badpin:'الرمز غير صحيح',cancel:'أُلغيت بصمة الوجه. حاول مرة أخرى',noprf:'هاتفك أو متصفحك لا يدعم الفتح ببصمة الوجه هنا. حدّث الآيفون إلى iOS 18 أو أحدث، وافتح التطبيق من Safari',fail:'تعذّر التفعيل. تأكد أن بصمة الوجه مفعّلة في إعدادات الهاتف'};
      if(r==='ok'){L.innerHTML='';render();toast('فُعّل الفتح ببصمة الوجه')}else{er.hidden=false;er.textContent=msg[r]||msg.fail}}}}

/* التحقق من هويتك ببصمة الوجه (أو رمز الجهاز) قبل العمليات الخطيرة مثل حذف كل البيانات */
const GUARD_K='masareef:guard';
function b64e(u8){let s='';u8.forEach(c=>s+=String.fromCharCode(c));return btoa(s)}
function b64d(s){return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
async function uvAvailable(){try{return bioCapable()&&!!PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()}catch(e){return false}}
function uvFlag(ad){try{return !!(new Uint8Array(ad)[32]&4)}catch(e){return false}}
async function verifyUser(){if(!await uvAvailable())return 'unavailable';
  const challenge=crypto.getRandomValues(new Uint8Array(32));const ids=[];
  if(Vault.bio&&Vault.bio.credId)ids.push(new Uint8Array(Vault.bio.credId));
  try{const g=localStorage.getItem(GUARD_K);if(g)ids.push(b64d(g))}catch(e){}
  try{
    if(ids.length){const a=await navigator.credentials.get({publicKey:{challenge,allowCredentials:ids.map(id=>({type:'public-key',id})),userVerification:'required',timeout:60000}});
      return a&&uvFlag(a.response.authenticatorData)?'ok':'fail'}
    const c=await navigator.credentials.create({publicKey:{rp:{name:'إدارة شؤوني'},user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'تأكيد إدارة شؤوني',displayName:'تأكيد إدارة شؤوني'},
      challenge,pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],timeout:60000,authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'discouraged',userVerification:'required'}}});
    if(!c)return 'fail';try{localStorage.setItem(GUARD_K,b64e(new Uint8Array(c.rawId)))}catch(e){}
    const ad=c.response.getAuthenticatorData?c.response.getAuthenticatorData():null;return !ad||uvFlag(ad)?'ok':'fail'
  }catch(e){return e&&(e.name==='NotAllowedError'||e.name==='AbortError')?'cancel':'fail'}}
async function vaultPinOk(pin){if(!Vault.cfg||!pin)return false;try{const key=await vDerive(pin,Vault.cfg.salt);await vDec(key,Vault.cfg.check);return true}catch(e){return false}}
/* وضع المدير: التعديل والحذف والتراجع واعتماد العمليات تحتاج رمز المدير أو بصمة الوجه.
   الإعداد محفوظ في هذا الهاتف فقط ولا يدخل في المزامنة ولا النسخة الاحتياطية. */
const ADM_K='masareef:admin',ADM_IDLE=5*60*1000;
const Adm={open:false,last:0,cfg:undefined,fails:0,wait:0};
function admCfg(){if(Adm.cfg===undefined){try{Adm.cfg=JSON.parse(localStorage.getItem(ADM_K)||'null')||null}catch(e){Adm.cfg=null}}return Adm.cfg}
function admSave(c){Adm.cfg=c||null;try{c?localStorage.setItem(ADM_K,JSON.stringify(c)):localStorage.removeItem(ADM_K)}catch(e){}}
function admOn(){return !!admCfg()}
function admOpen(){if(!admOn())return true;if(Adm.open&&Date.now()-Adm.last>ADM_IDLE)admLock(true);return Adm.open}
function admLock(silent){Adm.open=false;admChip();if(!silent)toast('قُفل وضع المدير')}
function admUnlocked(){Adm.open=true;Adm.last=Date.now();Adm.fails=0;admChip()}
/* العمليات الجديدة وقت قفل وضع المدير تنتظر اعتمادك */
function admPendNew(){const c=admCfg();return !!c&&c.approve!==false&&!admOpen()}
async function admHash(pin,salt){const base=await crypto.subtle.importKey('raw',te(pin),'PBKDF2',false,['deriveBits']);return b64e(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},base,256)))}
async function admPinOk(pin){const c=admCfg();if(!c||!pin)return false;return await admHash(String(pin),b64d(c.salt))===c.hash}
setInterval(()=>{if(Adm.open&&Date.now()-Adm.last>ADM_IDLE)admLock(true)},30000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&Adm.open){Adm.hid=Date.now()}else if(Adm.hid){if(Date.now()-Adm.hid>60000)admLock(true);Adm.hid=0}});
function admChip(){document.body.classList.toggle('adm-locked',admOn()&&!Adm.open);const h=document.querySelector('.hdr-actions');if(!h)return;let b=document.getElementById('admChip');
  if(!admOn()){if(b)b.remove();return}
  if(!b){b=document.createElement('button');b.id='admChip';b.type='button';h.prepend(b)}
  const o=Adm.open;b.className='admchip'+(o?' on':'');b.textContent=o?'🛡️ المدير':'🔒';b.setAttribute('aria-label',o?'وضع المدير مفتوح، اضغط للقفل':'وضع المدير مقفل، اضغط للفتح')}
/* نافذة فتح وضع المدير: فوق أي نافذة مفتوحة، ثم تكمل العملية التي طلبتها */
function admAsk(then,why){let el=document.getElementById('admLayer');if(!el){el=document.createElement('div');el.id='admLayer';document.body.appendChild(el)}const c=admCfg();
  el.innerHTML=`<div class="scrim adm" data-x></div><div class="sheet adm" role="dialog" aria-modal="true" aria-label="صلاحية المدير"><div class="in"><div class="grab"></div>
   <h2 style="margin-top:0">🛡️ صلاحية المدير</h2><p class="note" style="margin-top:-4px">${esc(why||'التعديل والحذف والتراجع والاعتماد تحتاج صلاحية المدير.')}</p>
   ${c.bio?'<button class="btn block" id="admBio">فتح ببصمة الوجه</button>':''}
   <div class="field" style="margin-top:10px"><label for="admPin">رمز المدير</label><input class="inp num pin" id="admPin" type="password" inputmode="numeric" maxlength="8" autocomplete="off"></div>
   <p class="note" id="admErr" hidden style="color:var(--exp);margin:0"></p>
   <div class="actions"><button class="btn block${c.bio?' ghost':''}" id="admGo">فتح بالرمز</button><button class="btn ghost block" data-x>إلغاء</button></div>
   <p class="note" style="margin:0">يبقى مفتوحًا 5 دقائق من آخر استخدام، ويُقفل عند الخروج من التطبيق.</p></div></div>`;
  const close=()=>{el.innerHTML=''};const ok=()=>{close();admUnlocked();toast('فُتح وضع المدير');if(then)setTimeout(then,40)};
  const err=m=>{const e=document.getElementById('admErr');if(e){e.hidden=false;e.textContent=m}};
  el.onclick=async e=>{const x=e.target.closest('button,[data-x]');if(!x)return;e.stopPropagation();
    if(x.hasAttribute('data-x')){close();return}
    if(x.id==='admBio'){const r=await verifyUser();if(r==='ok')ok();else err(r==='cancel'?'أُلغيت بصمة الوجه. حاول مرة أخرى أو استخدم الرمز':'تعذّرت بصمة الوجه، استخدم الرمز');return}
    if(x.id==='admGo'){if(Date.now()<Adm.wait){err('محاولات كثيرة. انتظر '+Math.ceil((Adm.wait-Date.now())/1000)+' ثانية');return}
      x.disabled=true;const good=await admPinOk(document.getElementById('admPin').value);x.disabled=false;
      if(good){ok();return}Adm.fails++;if(Adm.fails>=5){Adm.wait=Date.now()+30000;Adm.fails=0}err('الرمز غير صحيح');const i=document.getElementById('admPin');i.value='';i.focus()}};
  el.onkeydown=e=>{if(e.key==='Enter'&&e.target.id==='admPin'){e.preventDefault();document.getElementById('admGo').click()}};
  if(!c.bio)setTimeout(()=>{const i=document.getElementById('admPin');if(i)i.focus()},60)}
/* كل زر تعديل أو حذف أو تراجع أو اعتماد يمر من هنا أولًا */
const ADM_SEL=['[data-edit]','[data-txdel]','[data-txedit]','[data-dpe]','[data-redit]','[data-dedit]','[data-tedit]','[data-cedit]','[data-gedit]','[data-pedit]','[data-sedit]','[data-rpedit]',
  '[data-apv]','[data-apedit]','#syncEncOff','[data-unpay]','[data-recpick]','[data-secadd]','[data-early]','[data-icoedit]','#rzOn','[data-rzpos]','[data-payedit]','#payAdd','[data-mdi]','#plOn','[data-plscope]','[data-plbefore]','[data-rename]','#lblEdit','[data-acedit]','#acAdd','[data-trdel]','[data-subadd]','#dnEdit','#wdEdit','#apvAll','[id$="DelAsk"]','#pdYes','.toast button','#clearSample','#restoreBtn','label[for="restoreFile"]','label[for="restoreFile2"]','[data-snaprest]','#syncUnlink','#vaultReset','#admOff','#admPinChange','#admApprove','#admBioSet'].join(',');
document.addEventListener('click',e=>{if(!admOn())return;if(e.target.closest('#admLayer'))return;
  if(admOpen()){if(e.target.closest('button,label'))Adm.last=Date.now();return}
  const b=e.target.closest(ADM_SEL);if(!b)return;e.preventDefault();e.stopImmediatePropagation();
  admAsk(()=>{if(b.isConnected)b.click()},b.matches('.toast button')?'التراجع عن عملية يحتاج صلاحية المدير.':b.matches('[data-apv],[data-apedit],#apvAll')?'اعتماد العمليات يحتاج صلاحية المدير.':b.matches('[data-early]')?'الدفع قبل موعده يحتاج صلاحية المدير.':b.matches('#plOn,[data-plscope],[data-plbefore]')?'تغيير قفل الدفع من صلاحيات المدير.':b.matches('[data-rename],#lblEdit')?'تعديل أسماء الأقسام من وضع المدير فقط.':b.matches('[data-recpick],[data-secadd],[data-redit],[data-dedit],[data-rpedit]')?'إضافة الالتزامات الشهرية وتعديلها من وضع المدير فقط. الدفع متاح دائمًا.':null)},true);
/* العمليات بانتظار الاعتماد */
function pendList(){return list().filter(t=>t.pend).sort((a,b)=>(b.date||'').localeCompare(a.date||''))}
function pendHtml(){if(!admOn())return '';const P=pendList();if(!P.length)return '';const tot=P.filter(t=>t.type==='exp').reduce((s,t)=>s+(+t.amount||0),0);
  return `<div class="alertbox"><div class="alerthead"><b>بانتظار اعتمادك</b><span class="pill soon">${P.length}</span></div><div class="alertrow warn"><span class="adot"></span><div style="min-width:0"><b>تحتاج مراجعتك: ${countWord(P.length,'عملية واحدة','عمليتان','عمليات','عملية')}</b><small>أُدخلت ووضع المدير مقفل${tot?' · مصاريف بمجموع '+rial(tot):''}</small></div><button class="chip pay" data-apopen="1">مراجعة</button></div></div>`}
function openApprovals(){const L=document.getElementById('layer');
  const draw=()=>{const P=pendList();if(!P.length){L.innerHTML='';render();toast('لا عمليات بانتظار الاعتماد');return}
    L.innerHTML=`${sheetTop('الاعتماد')}<h2 style="margin-top:0">بانتظار اعتمادك (${P.length})</h2>
     <p class="note" style="margin-top:-6px">هذه العمليات أُدخلت ووضع المدير مقفل. هي محسوبة في أرصدتك من الآن، والاعتماد يوثّق أنك راجعتها.</p>
     <div class="panel" style="padding-block:4px">${P.map(t=>{const c=catOf(t.cat);return `<div class="apvrow">${txIco(t,c)}
      <div style="min-width:0"><b>${esc(t.note||c.n)}</b><small>${fmtD(t.date)} · ${esc(c.n)}</small></div><b class="num ${t.type==='inc'?'amt-inc':'amt-exp'}">${t.type==='inc'?'+':'−'}${amtH(t.amount)}</b>
      <div class="apvbtns"><button class="chip pay" data-apv="${esc(t.id)}">اعتماد ✓</button><button class="chip" data-apedit="${esc(t.id)}">تعديل أو حذف</button></div></div>`}).join('')}</div>
     <div class="actions"><button class="btn block" id="apvAll">اعتماد الكل (${P.length})</button><button class="btn ghost block" data-close>إغلاق</button></div></div></div>`};
  const approve=async ids=>{for(const id of ids){const t=S.tx[id];if(!t)continue;const c=Object.assign({},t);delete c.pend;c.apv=today();await putTx(c)}};
  draw();L.oninput=L.onchange=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.apv){await approve([x.dataset.apv]);toast('اعتُمدت العملية');draw();return}
    if(x.dataset.apedit){const t=S.tx[x.dataset.apedit];if(t){L.innerHTML='';openSheet(t)}return}
    if(x.id==='apvAll'){const ids=pendList().map(t=>t.id);await approve(ids);L.innerHTML='';render();toast('اعتُمدت '+countWord(ids.length,'عملية واحدة','عمليتان','عمليات','عملية'))}}}
/* إعداد وضع المدير */
function admHtml(){const c=admCfg();
  if(!c)return `<div class="panel stack admbox"><b>🛡️ وضع المدير</b><span class="note">احمِ تطبيقك من الأخطاء والعبث: التعديل والحذف والتراجع واعتماد العمليات وتعديل الالتزامات والديون والخطط تحتاج رمز المدير أو بصمة الوجه. والإدخال الجديد يبقى متاحًا، ويُعلَّم «بانتظار الاعتماد» حتى تراجعه.</span><button class="btn block" id="admSetup">تفعيل وضع المدير</button></div>`;
  const P=pendList().length;
  return `<div class="panel stack admbox"><div class="sumrow" style="align-items:center"><b>🛡️ وضع المدير مفعّل</b><span class="pill ${Adm.open?'paid':'soon'}">${Adm.open?'مفتوح':'مقفل'}</span></div>
   <span class="note">${Adm.open?'يمكنك الآن التعديل والحذف والاعتماد. يُقفل تلقائيًا بعد 5 دقائق بدون استخدام.':'التعديل والحذف والتراجع والاعتماد تحتاج الرمز أو بصمة الوجه.'}</span>
   <div class="sumrow"><span>اعتماد العمليات المُدخلة وهو مقفل</span><button class="chip${c.approve!==false?' pay':''}" id="admApprove">${c.approve!==false?'مفعّل':'متوقف'}</button></div>
   ${P?`<div class="sumrow"><span>بانتظار الاعتماد</span><button class="chip pay" data-apopen="1">${P} · مراجعة</button></div>`:''}
   <div class="sumrow"><span>بصمة الوجه للمدير</span><button class="chip" id="admBioSet">${c.bio?'مفعّلة · إيقاف':'تفعيل'}</button></div>
   <div class="row2"><button class="btn ghost" id="${Adm.open?'admLockBtn':'admUnlockBtn'}">${Adm.open?'قفل الآن':'فتح وضع المدير'}</button><button class="btn ghost" id="admPinChange">تغيير الرمز</button></div>
   <button class="btn ghost block" id="admOff" style="color:var(--exp)">إيقاف وضع المدير</button></div>`}
function openAdmSetup(change){const L=document.getElementById('layer');let bio=false;
  uvAvailable().then(uv=>{
  L.innerHTML=`${sheetTop('وضع المدير')}<h2 style="margin-top:0">${change?'تغيير رمز المدير':'تفعيل وضع المدير'}</h2>
   <div class="stack"><p class="note" style="margin:0">اختر رمزًا من 4 إلى 8 أرقام، مختلفًا عن رمز قفل الهاتف إن أمكن. يُحفظ مشفّرًا في هذا الهاتف فقط.</p>
   <div class="row2"><div class="field"><label for="amP1">رمز المدير</label><input class="inp num pin" id="amP1" type="password" inputmode="numeric" maxlength="8" autocomplete="off"></div>
   <div class="field"><label for="amP2">أعد كتابته</label><input class="inp num pin" id="amP2" type="password" inputmode="numeric" maxlength="8" autocomplete="off"></div></div>
   ${change?'':`<label class="note" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="amApv" checked style="width:18px;height:18px"> العمليات المُدخلة وهو مقفل تنتظر اعتمادي</label>
   ${uv?'<label class="note" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="amBio" checked style="width:18px;height:18px"> الفتح ببصمة الوجه أيضًا</label>':''}`}
   <p class="note" id="amErr" hidden style="color:var(--exp);margin:0"></p>
   <div class="actions"><button class="btn block" id="amSave">${change?'حفظ الرمز الجديد':'تفعيل'}</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div></div>`;
  L.oninput=L.onchange=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id!=='amSave')return;const er=document.getElementById('amErr');const p1=document.getElementById('amP1').value.trim(),p2=document.getElementById('amP2').value.trim();
    if(!/^\d{4,8}$/.test(p1)){er.hidden=false;er.textContent='الرمز من 4 إلى 8 أرقام';return}
    if(p1!==p2){er.hidden=false;er.textContent='الرمزان غير متطابقين';return}
    x.disabled=true;const salt=crypto.getRandomValues(new Uint8Array(16));const hash=await admHash(p1,salt);
    if(change){admSave(Object.assign({},admCfg(),{salt:b64e(salt),hash}));L.innerHTML='';render();toast('تغيّر رمز المدير');return}
    const wantBio=!!(document.getElementById('amBio')||{}).checked;if(wantBio)bio=(await verifyUser())==='ok';
    admSave({salt:b64e(salt),hash,approve:document.getElementById('amApv').checked,bio,since:today()});admUnlocked();L.innerHTML='';render();
    toast(wantBio&&!bio?'فُعّل وضع المدير بالرمز. لم تُفعَّل بصمة الوجه':'فُعّل وضع المدير')}})}
async function wipeAll(){await snapTake('قبل حذف كل البيانات');await delTxMany(list().map(t=>t.id));S.settings={monthlyBudget:0,budgets:{}};await putSettings();render();toast('حُذفت كل البيانات')}
async function openWipe(){const L=document.getElementById('layer');const uv=await uvAvailable();const hasPin=!!Vault.cfg;let showPin=!uv&&hasPin,busy=false;
  const word='احذف';const norm=s=>String(s||'').replace(/[ً-ْـ\s]/g,'').replace(/[أإآ]/g,'ا');
  const draw=()=>{L.innerHTML=`${sheetTop('حذف كل البيانات')}
   <h2 style="margin-top:0;color:var(--exp)">حذف كل البيانات</h2>
   <div class="warnbox">سيُحذف نهائيًا من هذا الجهاز: كل العمليات، الميزانيات، الخطط وحساب الادخار، السيارات، الديون، الأمانات، الأهل والالتزامات الشهرية، والإعدادات.${Sync.linked()?' <b>والمزامنة مفعّلة، فسيُحذف أيضًا من أجهزتك الأخرى المرتبطة بنفس الحساب.</b>':''}</div>
   <p class="note" style="margin:8px 0">خزنة «مستنداتي» لا تُحذف من هنا. لا يمكن التراجع عن الحذف.</p>
   <button class="btn ghost block" id="wBak">احفظ نسخة احتياطية أولًا</button>
   <div class="stack" style="margin-top:12px">
    <div class="field"><label for="wWord">للتأكيد اكتب كلمة «<b>${word}</b>»</label><input class="inp" id="wWord" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
    ${showPin?`<div class="field"><label for="wPin">رمز خزنة «مستنداتي»</label><input class="inp num pin" id="wPin" type="password" inputmode="numeric" maxlength="8"></div>`:''}
    <p class="note">${uv?'بعد كتابة الكلمة ستُطلب بصمة الوجه (أو رمز الهاتف) للتأكد أنك أنت.':hasPin?'جهازك لا يدعم بصمة الوجه هنا، لذلك يُطلب رمز الخزنة للتأكد أنك أنت.':'جهازك لا يدعم بصمة الوجه هنا. للحماية الأقوى فعّل الخزنة في «مستنداتي» ليُطلب رمزها قبل الحذف.'}</p>
    <p class="note" id="wErr" hidden style="color:var(--exp);margin:0"></p>
   </div>
   <div class="actions"><button class="btn danger block" id="wGo" disabled>${showPin?'تأكيد بالرمز والحذف':uv?'تأكيد ببصمة الوجه والحذف':'حذف نهائي'}</button>${uv&&hasPin&&!showPin?'<button class="btn ghost block" id="wUsePin">استخدم رمز الخزنة بدل البصمة</button>':''}<button class="btn ghost block" data-close>إلغاء</button></div></div></div>`};
  const err=m=>{const e=document.getElementById('wErr');if(e){e.hidden=!m;e.textContent=m||''}};
  const ready=()=>{const ok=norm(document.getElementById('wWord').value)===norm(word);document.getElementById('wGo').disabled=!ok;return ok};
  draw();
  L.oninput=e=>{if(e.target.id==='wWord'){ready();err('')}};L.onchange=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x||busy)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='wBak'){if(saveFile('idarat-shuooni-backup-'+today()+'.json',backupText(),'application/json')){try{localStorage.setItem('masareef:lastBackup',today())}catch(e){}toast('حُفظت النسخة الاحتياطية في الملفات')}return}
    if(x.id==='wUsePin'){const w=document.getElementById('wWord').value;showPin=true;draw();document.getElementById('wWord').value=w;ready();return}
    if(x.id==='wGo'){if(!ready())return;busy=true;x.disabled=true;
      if(showPin){if(!await vaultPinOk(document.getElementById('wPin').value)){busy=false;x.disabled=false;err('رمز الخزنة غير صحيح.');return}}
      else if(uv){const r=await verifyUser();if(r!=='ok'){busy=false;x.disabled=false;err(r==='cancel'?'أُلغي التحقق ببصمة الوجه. لم يُحذف شيء.':'تعذّر التحقق من هويتك. لم يُحذف شيء.'+(hasPin?' يمكنك استخدام رمز الخزنة.':''));
        if(hasPin&&!document.getElementById('wUsePin')){const b=document.createElement('button');b.className='btn ghost block';b.id='wUsePin';b.textContent='استخدم رمز الخزنة بدل البصمة';x.after(b)}return}}
      L.innerHTML='';busy=false;await wipeAll()}}}

/* ---------- 21. قراءة رسائل البنك ---------- */
const KW={
 food:['lulu','لولو','carrefour','كارفور','nesto','نستو','al fair','الفير','hypermarket','supermarket','سوبرماركت','هايبر','بقالة','grocery','safeer','سفير','khimji','ramez','رامز','bakery','مخبز'],
 rest:['cafe','café','coffee','كافيه','مقهى','قهوة','restaurant','مطعم','starbucks','mcdonald','kfc','talabat','طلبات','akeed','pizza','burger','tim hortons','costa','shawarma','شاورما','karak','كرك'],
 fuel:['shell','شل','oman oil','omanoil','al maha','المها','petrol','fuel','وقود','بترول','otaxi','mwasalat','مواصلات','parking','موقف'],
 bills:['nama','نماء','omantel','عمانتل','ooredoo','اوريدو','أوريدو','vodafone','فودافون','awasr','أوامر','electric','كهرباء','water','مياه','internet','انترنت','إنترنت','mazoon','مزون','majan','مجان','بلدية','municipality'],
 health:['pharmacy','صيدلية','hospital','مستشفى','clinic','عيادة','medical','طبي','dental','أسنان'],
 shop:['amazon','noon','نون','centrepoint','shein','zara','mall','مول','ikea','sharaf','lifestyle','نمشي','namshi','splash','shoes','ملابس'],
 loan:['loan','قرض','قسط','installment','instalment','تمويل'],
 edu:['school','مدرسة','university','جامعة','college','كلية','course','دورة','udemy','coursera','institute','معهد'],
 fun:['cinema','vox','سينما','oman air','salam air','salamair','طيران','booking.com','hotel','فندق','airbnb','netflix','spotify','playstation','shahid','شاهد','osn','steam'],
 charity:['zakat','زكاة','صدقة','charity','خيرية','donation','تبرع'],
 home:['rent','إيجار','ايجار'],
 car:['tyre','tire','إطارات','اطارات','garage','ورشة','قطع غيار','spare parts','service center','car wash','غسيل سيارات','insurance','تأمين','royal oman police','شرطة عمان']
};
function normDigits(s){return String(s).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/٫/g,'.').replace(/٬/g,',')}
function hashStr(s){let h=5381;for(const c of s.replace(/\s+/g,' ').trim())h=((h<<5)+h+c.charCodeAt(0))|0;return 'h'+(h>>>0).toString(36)}
function mkey(s){return String(s||'').toLowerCase().replace(/[^a-z؀-ۿ]+/g,' ').trim().slice(0,30)}
const AMT_RE=/(?:\bOMR(?![A-Za-z])|\bR\.?O\.?(?![A-Za-z])|ر\.?\s?ع\.?|ريال(?:\s*عماني)?)\s*([0-9][0-9,]*(?:\.[0-9]{1,3})?)|([0-9][0-9,]*(?:\.[0-9]{1,3})?)\s*(?:OMR(?![A-Za-z])|R\.?O\.?(?![A-Za-z])|ر\.?\s?ع\.?|ريال)/gi;
const MON={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
function pickDate(t){
  let m=t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/),y,mo,d;
  if(m){y=+m[1];mo=+m[2];d=+m[3]}
  else if((m=t.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/))){d=+m[1];mo=+m[2];y=+m[3]}
  else if((m=t.match(/(\d{1,2})[\s\-]?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\-,]*(\d{2,4})/i))){d=+m[1];mo=MON[m[2].toLowerCase()];y=+m[3]}
  if(!m)return today();
  if(y<100)y+=2000;
  if(mo>12&&d<=12){const k=mo;mo=d;d=k}
  const dt=new Date(y,mo-1,d);if(isNaN(dt)||dt.getMonth()!==mo-1||dt>new Date())return today();
  return y+'-'+String(mo).padStart(2,'0')+'-'+String(d).padStart(2,'0');
}
function pickMerchant(t){
  const pats=[/(?:\bat|@)\s+([A-Za-z0-9&'.*\- ]{2,40}?)(?=\s+(?:on|in|dated|ref|card|with|using|for|avl|available|bal)\b|[,;:\n]|\.(?:\s|$)|$)/i,
    /(?:لدى|عند)\s+([^\n،,:]{2,40}?)(?=\s+(?:بتاريخ|في\s+تاريخ|يوم|في\s+\d|بطاقة|الرصيد|رصيد)|[،,:\n]|\.(?:\s|$)|$)/,
    /\b(?:from|to)\s+([A-Za-z][A-Za-z0-9&'.\- ]{1,40}?)(?=\s+(?:on|in|dated|ref|via|avl|bal)\b|[,;:\n]|\.(?:\s|$)|$)/i,
    /(?:من|إلى|الى)\s+([^\n،,:]{2,40}?)(?=\s+(?:بتاريخ|في\s+تاريخ|يوم|في\s+\d|الرصيد|رصيد)|[،,:\n]|\.(?:\s|$)|$)/];
  for(const p of pats){const m=t.match(p);if(m){const v=m[1].trim().replace(/\s{2,}/g,' ');
    if(v.length>=2&&!/account|a\/c|acct|card|حساب|بطاقت|your|customer|عميل|xx/i.test(v)&&!/^\d/.test(v))return v}}
  return '';
}
/* اتجاه العملية: إيداع (دخل) أو خصم (مصروف)، بموازنة كلمات الإيداع والخصم في الرسالة */
const SMS_CR=[[/\bcredited\b/i,2],[/\bcredit(?:ed)?\s+(?:to|in|into)\b/i,2],[/\bdeposit/i,2],[/\breceived\b/i,2],[/\bincoming\b/i,2],[/\breversal\b/i,1],[/\bCr\.?(?=\s|$|[,:])/,1],
  [/(?:to|into|in)\s+your\s+(?:a\/c|acc|acct|account)/i,2],[/إيداع|ايداع|أودع|اودع|أُودع/,2],[/إضافة|اضافة|أضيف|اضيف|أُضيف/,1],[/استلام|استلمت|وارد/,2],[/(?:إلى|الى|في|لـ|ل)\s*حسابك/,2],[/دائن/,1]];
const SMS_DR=[[/\bdebited\b/i,2],[/\bdebit\b/i,1],[/\bpurchase/i,2],[/\bspent\b/i,2],[/\bwithdraw/i,2],[/\bpaid\b/i,1],[/\bpayment\b/i,1],[/\bPOS\b/,2],[/\bDr\.?(?=\s|$|[,:])/,1],
  [/from\s+your\s+(?:a\/c|acc|acct|account|card)/i,2],[/خصم|مخصوم/,2],[/شراء|مشتريات/,2],[/سحب/,2],[/\bدفع|سداد/,1],[/من\s*(?:حسابك|بطاقتك)/,2],[/مدين/,1]];
function smsDirection(t){if(/salary|payroll|راتب|رواتب|refund|استرداد|مسترد/i.test(t))return 'inc';
  const sc=L=>L.reduce((s,[r,w])=>s+(r.test(t)?w:0),0);const c=sc(SMS_CR),d=sc(SMS_DR);return c>d?'inc':'exp'}
function parseSms(raw){
  const t=normDigits(raw).replace(/‏|‎/g,'');
  const key=hashStr(t);
  const base={raw:raw.trim(),key,ok:false};
  if(/\bOTP\b|رمز التحقق|رمز التفعيل|كلمة المرور|one[- ]time|verification code|الرمز السري/i.test(t))return Object.assign(base,{reason:'رسالة رمز تحقق وليست عملية'});
  let amount=0;AMT_RE.lastIndex=0;let m;
  while((m=AMT_RE.exec(t))){const pre=t.slice(Math.max(0,m.index-32),m.index);
    if(/bal|رصيد|available|avl|المتاح|المتوفر|limit|الحد/i.test(pre))continue;
    amount=parseFloat((m[1]||m[2]).replace(/,/g,''));if(amount)break}
  if(!amount){const f=t.match(/(?:amount|amt|مبلغ|بمبلغ)\s*:?\s*([0-9][0-9,]*\.[0-9]{1,3})/i)||t.match(/\b([0-9][0-9,]*\.[0-9]{3})\b/);if(f)amount=parseFloat(f[1].replace(/,/g,''))}
  if(!amount)return Object.assign(base,{reason:'لم أجد مبلغًا في الرسالة'});
  const type=smsDirection(t);
  const atm=/\bATM\b|صراف|cash withdrawal|سحب نقدي/i.test(t);
  const method=atm?'cash':(type==='inc'||/transfer|تحويل|حوالة/i.test(t))?'transfer':'card';
  let merchant=atm?'':pickMerchant(t);
  const low=(merchant+' '+t).toLowerCase();
  const learned=(S.settings.merchantCats||{})[mkey(merchant)];
  let cat;
  if(learned&&((type==='inc')===!!INC_CATS.find(c=>c.id===learned)))cat=learned;
  else if(type==='inc')cat=/salary|payroll|راتب/i.test(t)?'salary':'iother';
  else if(atm)cat='other';
  else{cat='other';for(const [c,words] of Object.entries(KW)){if(words.some(w=>low.includes(w))){cat=c;break}}}
  const note=merchant||(atm?'سحب نقدي من الصراف':type==='inc'?(cat==='salary'?'راتب':'إيداع في الحساب'):'');
  const dup=list().some(x=>x.src===key);
  return Object.assign(base,{ok:true,on:!dup,dup,amount:amount.toFixed(3),type,cat,date:pickDate(t),method,note,merchant});
}
function splitMsgs(text){
  const parts=normDigits(text).split(/\n\s*\n+/).map(s=>s.trim()).filter(Boolean);
  return parts.flatMap(p=>{const lines=p.split('\n').map(s=>s.trim()).filter(Boolean);
    const hasAmt=l=>{AMT_RE.lastIndex=0;return AMT_RE.test(l)};
    const withAmt=lines.filter(l=>hasAmt(l)&&/debit|credit|purchase|withdraw|paid|خصم|شراء|سحب|إيداع|ايداع|راتب|deposit/i.test(l));
    return withAmt.length>1&&withAmt.length===lines.filter(hasAmt).length?lines:[p]});
}
const DEMO_SMS=`Your a/c XXX1234 has been debited with OMR 23.450 at LULU HYPERMARKET on 12/10/2026. Avl Bal OMR 512.300

تم خصم مبلغ 4.200 ر.ع من بطاقتك المنتهية بـ 5678 لدى STARBUCKS بتاريخ 12/10/2026. الرصيد المتاح 488.100 ر.ع

Dear Customer, your a/c XXX1234 has been credited with OMR 850.000 SALARY on 01/10/2026.

Your OTP for online purchase is 482913. Do not share it.`;
let IMP={text:'',items:[]};
function openImport(){
  const L=document.getElementById('layer');
  const pasteHtml=()=>`<p class="note" style="margin:0 0 10px">انسخ رسالة البنك من تطبيق الرسائل والصقها هنا. يمكنك لصق عدة رسائل مرة واحدة، مع ترك سطر فارغ بين كل رسالة وأخرى.</p>
    <div class="stack"><textarea class="inp msgs" id="iTxt" dir="auto" placeholder="مثال: تم خصم مبلغ 12.500 ر.ع من حسابك لدى ...">${esc(IMP.text)}</textarea>
    <p class="note" id="iErr" hidden style="color:var(--exp);margin:0"></p>
    <button class="btn block" id="iParse">قراءة الرسائل</button>
    <div class="row2"><button class="btn ghost" id="iDemo">جرّب برسائل مثال</button><button class="btn ghost" data-close>إلغاء</button></div>
    <p class="note" style="margin:0">القراءة تتم داخل هذه الصفحة. لا يُحفظ نص الرسالة ولا رقم حسابك، فقط المبلغ والجهة والتاريخ.</p>
    <button class="btn ghost block" id="iShort">⚡ اجعلها تلقائية باختصارات الآيفون</button></div>`;
  const itemsHtml=()=>{const okN=IMP.items.filter(i=>i.ok).length;
    return `<p class="note" style="margin:0 0 10px">قرأت ${IMP.items.length} رسالة ووجدت ${okN} عملية. راجع الفئة والمبلغ قبل الإضافة.</p><div class="stack">`+
    IMP.items.map((it,i)=>{
      if(!it.ok)return `<div class="impcard skip"><div class="note" style="color:var(--fg)">تجاهلت هذه الرسالة: ${esc(it.reason)}</div><div class="snip" dir="auto">${esc(it.raw.slice(0,110))}${it.raw.length>110?'…':''}</div></div>`;
      const cats=it.type==='inc'?INC_CATS:EXP_CATS;
      return `<div class="impcard"><label class="head"><input type="checkbox" data-i="${i}" data-f="on" ${it.on?'checked':''}>
        <span class="num ${it.type==='inc'?'amt-inc':'amt-exp'}">${it.type==='inc'?'+':'−'}${money(parseAmt(it.amount))}</span><span>${esc(it.note||catOf(it.cat).n)}</span>
        ${it.dup?'<span class="badge">مسجّلة سابقًا</span>':''}</label>
        <div class="row2"><select class="inp" data-i="${i}" data-f="type" aria-label="النوع"><option value="exp" ${it.type==='exp'?'selected':''}>مصروف</option><option value="inc" ${it.type==='inc'?'selected':''}>دخل</option></select>
        <input class="inp num" data-i="${i}" data-f="amount" inputmode="decimal" value="${esc(it.amount)}" aria-label="المبلغ" style="text-align:left"></div>
        <div class="row2"><select class="inp" data-i="${i}" data-f="cat" aria-label="الفئة">${cats.map(c=>`<option value="${c.id}" ${it.cat===c.id?'selected':''}>${esc(c.n)}</option>`).join('')}</select>
        <input class="inp" type="date" data-i="${i}" data-f="date" value="${esc(it.date)}" aria-label="التاريخ"></div>
        <input class="inp" data-i="${i}" data-f="note" value="${esc(it.note)}" placeholder="ملاحظة" aria-label="ملاحظة" maxlength="80">
        ${it.date&&it.date.slice(0,7)!==ym(new Date())?`<div class="note impwarn">تاريخها ${fmtD(it.date)}، فتُحسب في شهر ${esc(monthName(it.date.slice(0,7)))}. عدّل التاريخ إن كان غير صحيح.</div>`:''}</div>`}).join('')+
    `<button class="btn block" id="iAdd">إضافة العمليات المحددة</button><button class="btn ghost block" id="iBack">رجوع للصق رسائل أخرى</button></div>`};
  const draw=()=>{L.innerHTML=`${sheetTop('استيراد من رسائل البنك')}
    <h2 style="margin-top:0">استيراد من رسائل البنك</h2>${IMP.items.length?itemsHtml():pasteHtml()}</div></div>`};
  L.onchange=e=>{const el=e.target;if(el.dataset.i==null)return;const it=IMP.items[+el.dataset.i];const f=el.dataset.f;
    if(f==='on')it.on=el.checked;else it[f]=el.value;
    if(f==='type'){it.cat=it.type==='inc'?'iother':'other';draw()}};
  L.oninput=e=>{if(e.target.id==='iTxt')IMP.text=e.target.value};
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';L.onchange=L.oninput=null;return}
    if(x.id==='iDemo'){IMP.text=DEMO_SMS;draw();return}
    if(x.id==='iShort'){openShortcutGuide();return}
    if(x.id==='iBack'){IMP.items=[];draw();return}
    if(x.id==='iParse'){const v=(document.getElementById('iTxt').value||'').trim();IMP.text=v;
      if(!v){const er=document.getElementById('iErr');er.hidden=false;er.textContent='الصق رسالة البنك أولًا';return}
      IMP.items=splitMsgs(v).map(parseSms);draw();return}
    if(x.id==='iAdd'){let n=0;const IMP_added=[],IMP_new=[];const mc=Object.assign({},S.settings.merchantCats||{});
      for(const it of IMP.items){if(!it.ok||!it.on)continue;const amt=parseAmt(it.amount);if(!amt)continue;
        const rec={id:uidGen(),type:it.type,amount:amt,cat:it.cat,date:it.date||today(),method:it.method,note:(it.note||'').trim(),createdAt:new Date().toISOString(),src:it.key};
        if(it.merchant)mc[mkey(it.merchant)]=it.cat;
        IMP_new.push(rec);IMP_added.push(rec.date);n++}
      if(IMP_new.length)await putTxMany(IMP_new);
      S.settings.merchantCats=mc;putSettings();
      L.innerHTML='';L.onchange=L.oninput=null;IMP={text:'',items:[]};
      const mons=[...new Set(IMP_added.map(d=>d.slice(0,7)))];
      toast(n?'أُضيفت '+countWord(n,'عملية واحدة','عمليتان','عمليات','عملية')+(mons.length===1&&mons[0]!==ym(new Date())?' في شهر '+monthName(mons[0]):mons.length>1?' في '+mons.map(monthName).join(' و'):''):'لم تُحدَّد أي عملية',null,5000);return}
  };
  draw();
}

/* ---------- 22. المزامنة مع Google Drive ---------- */
function mergeData(r){
  const del=Object.assign({},r.del||{});for(const [k,v] of Object.entries(S.del||{}))if(!del[k]||v>del[k])del[k]=v;
  const rt=r.tx||{};const tx={};const ids=new Set([...Object.keys(S.tx),...Object.keys(rt)]);
  ids.forEach(id=>{const a=S.tx[id],b=rt[id];const w=!a?b:!b?a:((+b.u||0)>(+a.u||0)?b:a);if(!w)return;if(del[id]&&del[id]>=(+w.u||0))return;tx[id]=w});
  const cut=Date.now()-180*864e5;for(const k in del)if(del[k]<cut)delete del[k];
  S.tx=tx;S.del=del;
  if(r.settings){const L=S.settings,Rm=r.settings;
    if(!L._su||!Rm._su){if((+Rm._u||0)>(+L._u||0))S.settings=Object.assign({monthlyBudget:0,budgets:{}},Rm)}
    else{/* دمج قسمًا قسمًا: لكل قسم تؤخذ النسخة الأحدث تعديلًا */
      const lp=splitSettings(L),rp=splitSettings(Rm),su=Object.assign({},L._su),out={};
      Object.keys(Object.assign({},lp,rp)).forEach(k=>{const lt=+L._su[k]||0,rt=+Rm._su[k]||0;if(rt>lt){out[k]=rp[k];su[k]=rt}else out[k]=lp[k]});
      const st=Object.assign({monthlyBudget:0,budgets:{}},out.settings);DATA_SECS.forEach(([k])=>{st[k]=out[k]||[]});st._su=su;st._u=Math.max(+L._u||0,+Rm._u||0);S.settings=st}
    secSeed()}
}
const Sync=(()=>{
  const CFG_KEY='masareef:sync',FILE='masareef-data.json',SCOPE='https://www.googleapis.com/auth/drive.appdata',API='https://www.googleapis.com';
  let cfg={};try{cfg=JSON.parse(localStorage.getItem(CFG_KEY)||'{}')||{}}catch(e){cfg={}}
  const saveCfg=()=>{try{localStorage.setItem(CFG_KEY,JSON.stringify(cfg))}catch(e){}};
  let timer=null,busy=false,pending=false,state=cfg.linked?'idle':'off';
  const LOCK='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  const CLOUD_OFF='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 9.5z"/><path d="M3 3l18 18"/></svg>';
  const CLOUD='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 9.5z"/></svg>';
  function hhmm(t){const d=new Date(t);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
  function paint(){const el=document.getElementById('sync');if(!el)return;
    const map={off:[CLOUD_OFF,'غير متصل بـ Google Drive','warn'],idle:[CLOUD,'متصل بـ Google Drive','good'],busy:[CLOUD,'جارٍ المزامنة…','good'],
      ok:[CLOUD,(cfg.encKey?'🔐 ':'')+'متصل · آخر مزامنة '+(cfg.last?hhmm(cfg.last):''),'good'],needpass:[CLOUD_OFF,'المزامنة مشفّرة: اكتب كلمة السر','warn'],needtap:[CLOUD_OFF,'غير متصل، اضغط للمزامنة','warn'],offline:[CLOUD_OFF,'بدون إنترنت، سيتزامن لاحقًا','warn'],error:[CLOUD_OFF,'تعذّرت المزامنة، اضغط','warn']};
    const m=map[state]||map.off;el.className='sync '+m[2]+(state==='busy'?' busy':'');el.innerHTML=m[0]+'<span>'+m[1]+'</span>';el.setAttribute('aria-label',m[1]);el.title=m[1];
    if(S.tab==='settings'){const st=document.getElementById('syncState');if(st){st.textContent=m[1];st.className='syncstate '+m[2]}}}
  function set(s){state=s;paint()}
  function loadGsi(){return new Promise((res,rej)=>{if(window.google&&google.accounts&&google.accounts.oauth2)return res();
    const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;s.onload=()=>res();s.onerror=()=>rej(new Error('net'));document.head.appendChild(s)})}
  function tokenValid(){return cfg.token&&cfg.exp&&Date.now()<cfg.exp-60000}
  /* نافذة دخول Google تُجهَّز مسبقًا، وتُفتح مباشرة من ضغطتك؛ لأن Safari يمنع فتحها إذا تأخرت ولو لحظة */
  let tc=null,tcCid='',pend=null;
  function ensureTc(){if(!(window.google&&google.accounts&&google.accounts.oauth2)||!cfg.clientId)return null;if(tc&&tcCid===cfg.clientId)return tc;
    tc=google.accounts.oauth2.initTokenClient({client_id:cfg.clientId,scope:SCOPE,
      callback:r=>{const P=pend;pend=null;if(!P)return;if(r&&r.access_token){cfg.token=r.access_token;cfg.exp=Date.now()+(+r.expires_in||3600)*1000;cfg.linked=true;saveCfg();P.res(cfg.token)}else P.rej(new Error((r&&r.error)||'auth'))},
      error_callback:e=>{const P=pend;pend=null;if(P)P.rej(new Error((e&&e.type)||'popup'))}});tcCid=cfg.clientId;return tc}
  /* لا يُحمَّل شيء من Google إلا بعد أن تكتب رمزك أو تكون مربوطًا فعلًا */
  function prime(force){if(!cfg.clientId&&!force)return;loadGsi().then(ensureTc).catch(()=>{})}
  function ask(t){return new Promise((res,rej)=>{pend={res,rej};t.requestAccessToken({prompt:cfg.linked?'':'consent'})})}
  async function getToken(interactive){if(tokenValid())return cfg.token;if(!interactive)return null;
    const t=ensureTc();if(t)return ask(t);
    await loadGsi();const t2=ensureTc();if(!t2)throw new Error('net');return ask(t2)}
  async function api(url,opt){opt=opt||{};const r=await fetch(url,Object.assign({},opt,{headers:Object.assign({Authorization:'Bearer '+cfg.token},opt.headers||{})}));
    if(r.status===401){cfg.token='';saveCfg();throw new Error('auth')}if(!r.ok)throw new Error('http '+r.status);return r}
  async function findFile(){if(cfg.fileId)return cfg.fileId;
    const r=await api(API+'/drive/v3/files?spaces=appDataFolder&fields=files(id)&q='+encodeURIComponent("name='"+FILE+"'"));const j=await r.json();
    if(j.files&&j.files[0]){cfg.fileId=j.files[0].id;saveCfg()}return cfg.fileId||null}
  /* تشفير ملف المزامنة: المفتاح يُشتق من كلمة السر ويُحفظ في هذا الجهاز فقط، والملف على Google Drive لا يُقرأ بدونه */
  async function encKey(){return crypto.subtle.importKey('raw',b64d(cfg.encKey),{name:'AES-GCM'},false,['encrypt','decrypt'])}
  async function deriveRaw(pass,salt){const base=await crypto.subtle.importKey('raw',te(pass),'PBKDF2',false,['deriveKey']);
    const k=await crypto.subtle.deriveKey({name:'PBKDF2',salt:b64d(salt),iterations:250000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},true,['encrypt','decrypt']);return b64e(new Uint8Array(await crypto.subtle.exportKey('raw',k)))}
  async function pull(){const id=await findFile();if(!id)return null;let j;try{const r=await api(API+'/drive/v3/files/'+id+'?alt=media');j=await r.json()}catch(e){if(/404/.test(e.message)){cfg.fileId='';saveCfg();return null}throw e}
    if(j&&j.enc==='sync-v1'){cfg.rSalt=j.salt;saveCfg();if(!cfg.encKey)throw new Error('needpass');
      try{return JSON.parse(td(await vDec(await encKey(),{iv:b64d(j.iv),ct:b64d(j.ct)})))}catch(e){throw new Error('badpass')}}
    if(cfg.rSalt){cfg.rSalt='';saveCfg()}return j}
  async function push(data){if(cfg.encKey&&!cfg.plainNext){const o=await vEnc(await encKey(),te(JSON.stringify(data)));data={app:'masareef',enc:'sync-v1',v:2,at:data.at,salt:cfg.encSalt,iv:b64e(o.iv),ct:b64e(o.ct)}}
    const body=JSON.stringify(data);const id=await findFile();
    if(id){try{await api(API+'/upload/drive/v3/files/'+id+'?uploadType=media',{method:'PATCH',headers:{'Content-Type':'application/json'},body});return}catch(e){if(!/404/.test(e.message))throw e;cfg.fileId='';saveCfg()}}
    const bd='masareef'+Date.now();
    const mp='--'+bd+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify({name:FILE,parents:['appDataFolder']})+'\r\n--'+bd+'\r\nContent-Type: application/json\r\n\r\n'+body+'\r\n--'+bd+'--';
    const r=await api(API+'/upload/drive/v3/files?uploadType=multipart&fields=id',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+bd},body:mp});
    const j=await r.json();cfg.fileId=j.id;saveCfg()}
  async function run(interactive){
    if(!cfg.clientId||(!cfg.linked&&!interactive))return;
    if(busy){pending=true;return}
    if(!navigator.onLine){set('offline');return}
    busy=true;set('busy');
    try{const tok=await getToken(interactive);
      if(!tok){busy=false;set('needtap');return}
      const remote=await pull();if(remote)mergeData(remote);
      await push({app:'masareef',v:2,at:new Date().toISOString(),tx:S.tx,del:S.del,settings:S.settings});
      if(cfg.plainNext){delete cfg.encKey;delete cfg.encSalt;delete cfg.plainNext;cfg.rSalt=''}else if(cfg.encKey)cfg.rSalt=cfg.encSalt;
      cfg.last=Date.now();saveCfg();cacheSave();render();set('ok');
      if(interactive)toast('تمت المزامنة مع Google Drive')}
    catch(e){const m=e.message||'';cfg.lastErr=m;saveCfg();set(m==='needpass'||m==='badpass'?'needpass':m==='auth'||/popup|access_denied/.test(m)?'needtap':'error');
      if(interactive)toast(m==='needpass'?'ملف المزامنة مشفّر: اكتب كلمة سر المزامنة من ⚙️ الضبط':m==='badpass'?'كلمة سر المزامنة غير صحيحة، فلم يُرفع شيء حتى لا تُستبدل بياناتك':m==='net'?'تعذّر الاتصال بـ Google، تأكد من الإنترنت':m==='popup_failed_to_open'?'لم تُفتح نافذة Google. اضغط السحابة ☁️ مرة أخرى':/popup_closed/.test(m)?'أُغلقت نافذة Google قبل إكمال الدخول':m==='auth'||/popup|access_denied/.test(m)?'لم يكتمل تسجيل الدخول إلى Google':/http 403/.test(m)?'Google رفض الوصول: تأكد من تفعيل Google Drive API في مشروعك':'تعذّرت المزامنة، حاول مرة أخرى',null,6000);
      if(S.tab==='settings')render()}
    busy=false;if(pending){pending=false;setTimeout(()=>run(false),400)}}
  return{
    cfg:()=>cfg,linked:()=>!!cfg.linked,paint,state:()=>state,
    /* fresh: تشفير جديد بملح جديد. وإلا: كلمة سر ملف مشفّر موجود من جهاز آخر */
    async setPass(pass,fresh){const salt=fresh||!cfg.rSalt?b64e(crypto.getRandomValues(new Uint8Array(16))):cfg.rSalt;
      while(busy)await new Promise(r=>setTimeout(r,200));const old={k:cfg.encKey,s:cfg.encSalt};cfg.encKey=await deriveRaw(pass,salt);cfg.encSalt=salt;delete cfg.plainNext;saveCfg();await run(true);
      if(state==='needpass'||(state==='error'&&!fresh)){if(old.k){cfg.encKey=old.k;cfg.encSalt=old.s}else{delete cfg.encKey;delete cfg.encSalt}saveCfg();return false}return state==='ok'},
    async encOff(){if(!cfg.encKey)return;while(busy)await new Promise(r=>setTimeout(r,200));cfg.plainNext=true;saveCfg();await run(true);return !cfg.encKey},
    soon(){if(!cfg.linked)return;clearTimeout(timer);timer=setTimeout(()=>run(false),2500)},
    now:()=>run(true),prime,
    async link(id){cfg={clientId:id.trim()};saveCfg();await run(true)},
    unlink(){const t=cfg.token;cfg={};saveCfg();try{if(t&&window.google&&google.accounts&&google.accounts.oauth2)google.accounts.oauth2.revoke(t,()=>{})}catch(e){}set('off');render()},
    start(){paint();if(cfg.linked)run(false);if(cfg.clientId)setTimeout(prime,1500);
      addEventListener('online',()=>run(false));
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')run(false)})}
  };
})();
function syncHtml(){const c=Sync.cfg();
  const how=`<details><summary class="note" style="cursor:pointer">من أين أحصل على الرمز؟</summary><div class="note" style="margin-top:8px;line-height:1.8">
      إن كان عندك رمز برنامج «الزمرة الملكية» فاستخدم نفس الرمز، لأن التطبيقين على نفس الرابط في GitHub.<br>
      وإن لم يكن عندك: ادخل console.cloud.google.com ← أنشئ مشروعًا ← فعّل Google Drive API ← APIs &amp; Services ← Credentials ← Create credentials ← OAuth client ID ← النوع Web application ← في Authorized JavaScript origins أضف رابط موقعك مثل https://اسمك.github.io ← انسخ الرمز والصقه هنا.</div></details>`;
  const on=!!c.linked;
  return `<div class="panel stack syncbox">
    <div class="syncstat ${on?'good':'warn'}"><span class="syncdot"></span><div><b>${on?'متصل بـ Google Drive':'غير متصل'}</b><small class="syncstate ${on?'good':'warn'}" id="syncState">${on?(c.last?'آخر مزامنة '+fmtD(isoD(new Date(c.last)))+' '+String(new Date(c.last).getHours()).padStart(2,'0')+':'+String(new Date(c.last).getMinutes()).padStart(2,'0'):'لم تتم مزامنة بعد'):'بياناتك محفوظة في هذا الجهاز فقط'}</small></div></div>
    <p class="note" style="margin:0">زر السحابة ☁️ في أعلى الشاشة هو زر المزامنة: <b class="amt-inc">أخضر</b> = متصل، <b class="amt-exp">أحمر</b> = غير متصل. اضغطه للمزامنة في أي وقت.</p>
    ${on?`${c.rSalt&&!c.encKey?`<div class="warnbox stack" style="margin:0"><b>🔐 ملف المزامنة على Google Drive مشفّر</b><span class="note" style="margin:0">اكتب كلمة سر المزامنة التي اخترتها على جهازك الآخر. لن يُرفع شيء من هذا الجهاز حتى تكتبها، حفاظًا على بياناتك.</span>
      <input class="inp" id="syncPass" type="password" autocomplete="current-password" placeholder="كلمة سر المزامنة"><button class="btn block" id="syncPassGo">فتح المزامنة المشفّرة</button></div>`
     :c.encKey?`<div class="setrow"><div><b>🔐 ملف المزامنة مشفّر</b><small>لا يُقرأ على Google Drive إلا بكلمة السر</small></div><button class="chip" id="syncEncOff"><span class="lk">🔒 </span>إيقاف التشفير</button></div>`
     :`<div class="setrow"><div><b>🔓 ملف المزامنة غير مشفّر</b><small>شفّره بكلمة سر لتبقى بياناتك لك وحدك</small></div><button class="chip pay" id="syncEncOn">تشفير</button></div>`}
    <button class="btn ghost block" id="syncUnlink">إلغاء الربط على هذا الجهاز</button>`
    :`<div class="field"><label for="syncCid">رمز Google (Client ID)</label><input class="inp" id="syncCid" dir="ltr" value="${esc(c.clientId||'')}" placeholder="xxxx.apps.googleusercontent.com" autocomplete="off" style="font-size:13px"></div>
    <p class="note" id="syncErr" hidden style="color:var(--exp);margin:0"></p>
    <button class="btn block" id="syncLink">ربط Google Drive</button>${how}`}
    <p class="note" style="margin:0">البيانات تُحفظ في مجلد خفي خاص بالتطبيق داخل حسابك، ولا يراها غيرك. اربط أجهزتك الأخرى بنفس الحساب ونفس الرمز.</p></div>`;
}

/* ---------- 23. المظهر والثيمات ---------- */
const SKINS={royal:['أزرق ملكي','#163C74','#2461AE','#178486'],emerald:['زمردي','#0B4D3C','#12805F','#1A9A8A'],burgundy:['عنابي','#5A1428','#8E2A44','#B5523A'],
 gold:['ذهبي ليلي','#2B2416','#5A4416','#9A6B12'],violet:['بنفسجي','#2E1F66','#5B3FB0','#3F6FD0'],sand:['رملي','#5B3A1E','#8A5A2B','#B98545']};
const Look=(()=>{const K='masareef:look';let v={skin:'royal',mode:'auto',text:'md',cards:'soft'};try{Object.assign(v,JSON.parse(localStorage.getItem(K)||'{}'))}catch(e){}
  function apply(){const r=document.documentElement;r.dataset.skin=v.skin;r.dataset.text=v.text;r.dataset.cards=v.cards;
    if(v.mode==='auto')r.removeAttribute('data-theme');else r.dataset.theme=v.mode;
    const m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',(SKINS[v.skin]||SKINS.royal)[1])}
  function set(k,val){v[k]=val;try{localStorage.setItem(K,JSON.stringify(v))}catch(e){}apply()}
  return{get:()=>v,set,apply}})();
Look.apply();
function openLook(){const L=document.getElementById('layer');
  const draw=()=>{const v=Look.get();
   L.innerHTML=`${sheetTop('المظهر')}
    <h2 style="margin-top:0">المظهر</h2>
    <div class="field"><label>لون التطبيق</label><div class="skins">${Object.entries(SKINS).map(([k,s])=>`<button class="skin" data-skin="${k}" aria-pressed="${v.skin===k}"><span class="sw" style="background:linear-gradient(140deg,${s[1]},${s[2]} 60%,${s[3]})"></span>${s[0]}</button>`).join('')}</div></div>
    <div class="field" style="margin-top:14px"><label>الوضع</label><div class="seg seg3">${[['auto','تلقائي'],['light','فاتح'],['dark','داكن']].map(([k,n])=>`<button class="n" data-lmode="${k}" aria-pressed="${v.mode===k}">${n}</button>`).join('')}</div></div>
    <div class="field" style="margin-top:14px"><label>حجم الخط</label><div class="seg">${[['md','عادي'],['lg','كبير']].map(([k,n])=>`<button class="n" data-ltext="${k}" aria-pressed="${v.text===k}">${n}</button>`).join('')}</div></div>
    <div class="field" style="margin-top:14px"><label>شكل البطاقات</label><div class="seg">${[['soft','ناعم بظلال'],['flat','مسطّح بسيط']].map(([k,n])=>`<button class="n" data-lcards="${k}" aria-pressed="${v.cards===k}">${n}</button>`).join('')}</div></div>
    <p class="note" style="margin:12px 0 0">يُحفظ المظهر على هذا الجهاز، ويمكنك اختيار مظهر مختلف لكل جهاز.</p>
    <div class="actions"><button class="btn block" data-close>تم</button></div></div></div>`};
  L.oninput=L.onchange=null;
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.skin){Look.set('skin',x.dataset.skin);draw();return}
    if(x.dataset.lmode){Look.set('mode',x.dataset.lmode);draw();return}
    if(x.dataset.ltext){Look.set('text',x.dataset.ltext);draw();return}
    if(x.dataset.lcards){Look.set('cards',x.dataset.lcards);draw();return}};
  draw()}

/* ---------- 24. الإصدار وما الجديد ---------- */
const DEV={name:'ماجد الرميمي',title:'مهندس ومطور تقنية معلومات',country:'سلطنة عُمان',phone:'95134234',intl:'96895134234'};
const APP_VERSION='2.27.0';
const CHANGELOG=[
 {v:'2.27.0',d:'2026-10-15',items:['«وضعي المالي» في الرئيسية: الأموال المتوفرة في حساباتك، والدخل، والمصروفات، والمستحق ولم يُدفع، والمتبقي بعد الالتزامات، والديون المتبقية ونسبة سدادها','المؤشرات المالية: تغطية الالتزامات، ونسبة الدخل المخصص للديون، والمصروفات المتغيرة، والسيولة المتاحة','«ماذا أفعل إذا لم يكفِ المال؟»: يحسب العجز المتوقع، ويرتب الالتزامات غير المدفوعة حسب الأولوية (المتأخر والسكن والخدمات أولًا)، ويبين ما يغطيه المتوفر وما لا يغطيه، مع خطوات عملية','مقارنة المبلغ الإضافي للديون: الأعلى فائدة أولًا أو الأصغر أولًا، بموعد الانتهاء والفوائد وأول دين يُغلق','المستشار: تنبيه إذا كانت وتيرة إنفاقك في فئة ستتجاوز حدّها قبل نهاية الشهر، وتنبيه العجز','اسأل المستشار: «ماذا لو دفعت 20 إضافية للدين؟»، و«هل أستطيع تحمل قسط جديد؟» (اكتب: قسط 50)','تشفير ملف المزامنة بكلمة سر من ⚙️ الضبط: يُشفَّر على هاتفك قبل رفعه إلى Google Drive، ولا يُرفع شيء من جهاز لا يعرف الكلمة حتى لا تُستبدل البيانات']},
 {v:'2.26.0',d:'2026-10-15',items:['«ديوني» أُعيد تنظيمه وتوزيعه: التصفح في «الرئيسية» (الملخص ونسبة السداد ويوم التحرر، الأقسام والترتيب، بطاقة كل دين بسجله ومستنداته وكشفه، والديون المنتهية، وخطة التخلص من الديون)','إدارة الديون من «إدارة البيانات»: الإضافة والتعديل والأيقونات، وملفات كل دين (الدفعات والسجل والمستندات والكشف)، والديون المنتهية، وطريقة السداد والمبلغ الإضافي، والطباعة وExcel','دفع الأقساط من «الالتزامات الشهرية»: زر «💳 الدفع» في بطاقة الدين بالرئيسية يأخذك لقسطه مباشرة، وبعد دفع قسط الشهر يظهر زر «+ دفعة إضافية» للسداد المبكر','أُزيل مربع «ديوني» من «أقسامي»، والروابط القديمة إلى ديوني تفتح قسمه في الرئيسية','تغيير الصورة أو الأيقونة قبل أي اسم من «إدارة البيانات»: اضغط على الأيقونة (عليها ✎) واختر أيقونة بلون، أو رمزًا، أو صورة/شعارًا من جهازك','يشمل: الأشخاص، الجهات، الحسابات، الالتزامات الشهرية، الديون، والفئات (قسم جديد «🏷️ الفئات»)','تتحدث تلقائيًا في كل الصفحات: الشهرية، الديون، السجل، الأهل والبيت، وغيرها، وتنتقل لأجهزتك بالمزامنة','الصورة تُقصّ وتُصغَّر تلقائيًا، وزر «إرجاع الأيقونة الأصلية»','سؤال «هل توجد متأخرات لم تُدفع من الأشهر الماضية؟» عند إضافة أو تعديل التزام أو دين: المتأخرات تُضاف لمستحق الشهر حتى تُسدَّد، وتظهر «+ متأخرات» في الشهرية','زر «🔄 تحديث البيانات» في التقارير وقاعدة البيانات: يعيد حساب كل الأقسام ومطابقة قاعدة البيانات الداخلية وفحص السلامة','الديون: قسم جديد «📅 متابعة الدفع في التطبيق» في نموذج الدين: تاريخ بداية الدين الفعلي، وتاريخ بدء المتابعة في التطبيق تحدده أنت، والأشهر قبله تُعتبر مدفوعة ولا تظهر كمتأخرة','عدد الأقساط الكلي، وعدد الأقساط التي دفعتها قبل المتابعة (يُحسب تلقائيًا من الفرق بين التاريخين إن تركته فارغًا)، ورقم العقد/القرض، وملاحظة','بطاقة الدين تعرض: المتابعة من، الأقساط (مثلًا 21 من 60)، الأقساط الباقية، ورقم العقد، وكل دفعة من التطبيق تُحسب قسطًا','شبكة السنة تُظهر الأشهر قبل المتابعة «قبل المتابعة» بدل اعتبارها غير مدفوعة','ملف Excel للديون فيه الأعمدة الجديدة للتعديل والاستيراد']},
 {v:'2.25.0',d:'2026-10-15',items:['صفحات القراءة (سورة الملك، الأذكار، أدعية الرزق) تفتح بشاشة كاملة مع زر خروج ✕ واضح أعلى الصفحة','🎨 لون خلفية القراءة: لون التطبيق، ورقي، أخضر هادئ، أزرق فاتح، وردي فاتح، ليلي، من داخل الصفحة أو من ⚙️ الضبط','أدعية الرزق: اضغط على الدعاء أو الآية بعد كل قراءة، وبعد ٣ مرات ينتقل تلقائيًا للتالي، ويمكن اختيار التكرار مرة أو ٣ أو ٧']},
 {v:'2.24.0',d:'2026-10-15',items:['قسم «💼 الراتب والمتبقي هذا الشهر» في إدارة البيانات: نفس أرقام الرئيسية (الدخل، المصاريف، المتبقي من الراتب، الالتزامات غير المدفوعة، المتبقي بعدها، والراتب القادم) وتتحدث معها تلقائيًا','منه: تسجيل الراتب بضغطة، والراتب المعتاد، ويوم نزول الراتب (تتحول الرئيسية لحساب دورة الراتب)، وخطة الصرف اليومية','خانة «سقف المصاريف الشهري» بجانبها زر «حفظ»، وتُحفظ أيضًا بزر «تم» في لوحة المفاتيح أو عند الخروج من الخانة','تظهر فوقها حالة السقف: السقف الحالي، وما صرفته، والمتبقي أو التجاوز، والمبلغ اليومي المتاح','اقتراحات بضغطة: الشهر الماضي أو متوسط آخر الأشهر، وزر «إلغاء السقف»','حدود الفئات تُحفظ تلقائيًا عند الخروج من كل خانة، وزر حفظها صار داخل قسمها']},
 {v:'2.23.0',d:'2026-10-15',items:['زر صغير «💰 أدعية الرزق» بجانب زر الأذكار في الأعلى','صفحة قراءة بنظام الصفحات: دعاء في كل صفحة بخط كبير، مع «التالي/السابق» والسحب بالإصبع ونقاط الصفحات، ويتذكر آخر صفحة','قسمان: «عند نزول الراتب» (الحمد والشكر وسؤال البركة والإنفاق) و«البركة في الرزق» (آيات وأدعية صحيحة بمصادرها)، والآيات منسوخة حرفيًا من نص تنزيل','من ⚙️ الضبط: إظهار الزر أو إخفاؤه، ونقله بجانب الأذكار أو أعلى الرئيسية أو بعد التنبيهات أو أسفلها']},
 {v:'2.22.0',d:'2026-10-14',items:['الاستيراد والتصدير مرتب بالأقسام في صفحة إدارة البيانات: لكل قسم صف بزرّي «📤 تصدير» و«📥 استيراد»، مع «تصدير الكل» و«استيراد ملف كامل»','💰 الإيداعات والدخل في ورقة مستقلة، و💸 المصروفات والخصومات في ورقة مستقلة: التاريخ والمبلغ والفئة والبيان وطريقة الدفع والحساب (ولمن في المصروفات)، بقوائم منسدلة','اختيار الفترة: هذا الشهر، هذه السنة، الكل، أو «قالب فارغ» للإدخال من الصفر','الاستيراد يكشف المكرر فلا يُضاف مرتين، ويرفض التاريخ والفئة غير الصحيحين برقم الصف، ويقبل التاريخ 14/10/2026 أو 2026-10-14','استيراد قسم يقرأ ورقة ذلك القسم فقط']},
 {v:'2.21.0',d:'2026-10-14',items:['صفحة «🗄️ إدارة البيانات» مكان «الخطة» في الشريط السفلي: الأشخاص، الجهات (بنوك ومحلات وجهات)، الحسابات، الالتزامات، الديون، ومعها الخطط والميزانية','أيقونات «أقسامي» و«تسجيل سريع» انتقلت من الرئيسية إلى إدارة البيانات؛ الرئيسية صارت للمتابعة والتقارير اليومية والشهرية والسنوية والخطط','الاختيار من البيانات بدل الكتابة: جهة الدين تُختار من القائمة، والجهات المسجلة تظهر في زر + للاختيار، ومع خيار «+ اسم جديد» يُحفظ في البيانات','تصدير البيانات الأساسية إلى Excel / Numbers بقوائم منسدلة جاهزة في كل عمود، ثم استيرادها بعد التعديل مع معاينة (جديد/معدّل/أخطاء) ولقطة قبل الاستيراد وتراجع، ثم مزامنة تلقائية']},
 {v:'2.20.1',d:'2026-10-14',items:['المزامنة من زر واحد فقط: أيقونة السحابة ☁️ في الأعلى. حُذفت الأزرار المكررة («مزامنة الآن» والطريقة البديلة وزر التقارير)، وبقي في الضبط الربط أول مرة وإلغاء الربط','السحابة ☁️ خضراء عندما يكون التطبيق متصلًا بـ Google Drive، وحمراء عندما يكون غير متصل، وتدور أثناء المزامنة','بطاقة المزامنة في الضبط أُعيدت صياغتها: حالة الاتصال وآخر مزامنة وزر واحد فقط','«🔒 قفل الدفع قبل الموعد» صار قابلًا للتعديل من ⚙️ الضبط (من وضع المدير): تشغيل/إيقاف، كل الأشهر أو الأشهر القادمة فقط، ويُفتح يوم الموعد أو قبله بـ3 أيام أو أسبوع أو 15 يومًا']},
 {v:'2.20.0',d:'2026-10-14',items:['القائمة الشهرية: مواعيد الدفع بنظام يوم/شهر/سنة (مثل 5/11/2026)، وتاريخ كل دفعة','«📅 تفاصيل الدفع للسنة» داخل كل بند: الأشهر الـ12 بالمبلغ والموعد وتاريخ الدفع، أخضر = مدفوع، أحمر = غير مدفوع، واضغط أي شهر لفتحه','المبلغ المدفوع بالأخضر وغير المدفوع بالأحمر','رسالة «شكرًا على الدفع» مع مبلغ وموعد الشهر التالي، ويظهر «التالي» تحت البند المدفوع','الدفع يُفتح من تاريخ الاستحقاق فقط؛ قبله يظهر «🔒 يُفتح في…»، والدفع المبكر من وضع المدير','«تسجيل كل المتبقي» لا يشمل ما لم يحن موعده','الصفحة ثابتة على قدّ الشاشة: لا تكبير بالإصبعين ولا بالنقر المزدوج، ولا تكبير تلقائي عند الكتابة','إصلاح زر المزامنة: نافذة دخول Google تُجهَّز مسبقًا وتُفتح مباشرة من ضغطتك، لأن Safari في الآيفون كان يمنعها فلا يحدث شيء','زر «الربط بطريقة بديلة»: ينتقل لصفحة Google ثم يرجع للتطبيق، إذا لم تظهر النافذة في تطبيق الشاشة الرئيسية','حالة المزامنة ظاهرة على الشاشات الصغيرة: الأيقونة تدور أثناء المزامنة، وتصير خضراء عند النجاح وحمراء عند الخطأ','رسائل أوضح عند فشل المزامنة (نافذة لم تُفتح، أُغلقت، رفض Google، لا إنترنت)','إعدادات المزامنة انتقلت إلى ⚙️ الضبط، وزر السحابة في الأعلى يفتحها إن لم تكن مربوطة']},
 {v:'2.19.0',d:'2026-10-14',items:['صفحة ⚙️ الضبط من زر جديد أعلى الشاشة: كل إعدادات التطبيق في مكان واحد','فتح قفل التطبيق ببصمة الوجه: تفعيل وإيقاف في أي وقت من الضبط (بالرمز ثم البصمة)','بصمة الوجه تُطلب تلقائيًا عند فتح التطبيق، أو بلمسة على شاشة القفل، والرمز يبقى احتياطيًا','اختيار وقت القفل بعد الخروج: فورًا، دقيقة، 5 أو 15 دقيقة، وتغيير رمز القفل بالرمز أو بالبصمة','تعديل أسماء الأقسام من وضع المدير: أقسام الشهرية، مجموعات الديون، أقسامي وعناوين صفحاتها، والشريط السفلي','زر ✏️ بجانب عناوين الشهرية ومجموعات الديون لتعديل الاسم مباشرة (للمدير)','زر + : اختر اسمًا من القائمة الشهرية فيُكتب المبلغ المتبقي والفئة والشخص، وتُسجَّل الدفعة في الشهرية مباشرة؛ وأقساط الديون تفتح نافذة السداد','الدخل/الإيداع من زر +: اختر من أسماء الأهل والقائمة الشهرية','إضافة التزام شهري أسهل: اختر مدة التكرار بضغطة (مستمر، 6 أشهر، سنة، سنتان، 3، 5، 10 سنوات) أو اكتب عدد الأشهر، ويظهر تاريخ الانتهاء والمجموع','«خيارات إضافية» في نموذج الالتزام قابلة للتصغير','إصلاح: بعد «حفظ وإضافة أخرى» كانت الكتابة السريعة في خانة الملاحظة تذهب أحيانًا إلى خانة المبلغ']},
 {v:'2.18.1',d:'2026-10-14',items:['التصغير والتكبير صار في كل التطبيق: اضغط على أي عنوان أساسي أو فرعي ليُصغَّر ما تحته أو يظهر','بطاقات الديون والخطط والأمانات والسيارات والمستندات والادخار تُصغَّر إلى اسمها بالضغط على رأسها','مجموعات أيام السجل، ومجموعات الديون، وصناديق التنبيهات قابلة للتصغير أيضًا','أقسام النوافذ مثل «قاعدة البيانات» تُصغَّر وتُكبَّر كذلك','زرا «تصغير الكل» و«توسيع الكل» أعلى كل صفحة فيها أكثر من قسم، ويُحفظ اختيارك في جهازك']},
 {v:'2.18.0',d:'2026-10-14',items:['مراجعة شاملة للتطبيق: توحيد أسماء الأقسام («الالتزامات الشهرية» و«ديوني» في كل مكان)','إصلاح مهم: إذا امتلأت ذاكرة التطبيق الأساسية لم تكن آخر تعديلاتك تُعتمد عند الفتح التالي؛ الآن تُستعاد تلقائيًا من قاعدة البيانات الداخلية','المزامنة بين الأجهزة تدمج كل قسم على حدة، فلا يضيع تعديل الديون على جهاز بسبب تعديل الالتزامات على جهاز آخر','«حذف كل البيانات» وحذف بيانات المثال واستيراد الرسائل والاعتماد صارت تُحفظ دفعة واحدة (أسرع بكثير مع البيانات الكبيرة)','الحسابات والتحويلات صارت أقسامًا مستقلة في قاعدة البيانات والنسخة الاحتياطية ومعاينة الاستعادة','تقريب المبالغ بدقة البيسة في كل المجاميع','تحسين ملف التشغيل بدون إنترنت: لا يحفظ صفحات الخطأ','حذف أكواد وتنسيقات غير مستخدمة، وتوحيد دوال التنزيل وأيام الشهر']},
 {v:'2.17.1',d:'2026-10-14',items:['تصغير وتكبير كل قسم في الالتزامات الشهرية بالضغط على عنوانه، ويُحفظ اختيارك','كل بند يظهر مختصرًا (الاسم والمبلغ وزر «دفعت»)، وبالضغط على اسمه تظهر تفاصيله وسجله وأزرار التعديل','«توسيع الكل» و«تصغير الكل»','زر «+ إضافة في …» داخل كل قسم يضيف التزامًا من نوع القسم مباشرة، من وضع المدير']},
 {v:'2.17.0',d:'2026-10-14',items:['«حساباتي»: رصيد الجاري والكاش والبطاقات، والتحويل بينها (لا يُحسب دخلًا ولا مصروفًا)، ومطابقة الرصيد الفعلي مع كشف الفرق','«هل نزل راتبك؟» في يوم الراتب بالمبلغ المعتاد، وتؤكده بضغطة','توقّع الأشهر الثلاثة القادمة في التقارير، وتنبيه المستشار إذا كان شهر متوقعًا بالسالب','قفل التطبيق ببصمة الوجه أو رمز عند فتحه، وإخفاء المبالغ بزر 👁 في الأعلى','نسخة احتياطية مشفّرة بكلمة سر، وتذكير بحفظ نسخة كل أسبوع','إرفاق صورة الإيصال بأي عملية، محفوظة مشفّرة في خزنة «مستنداتي»','تقويم المدفوعات: الفواتير والأقساط والراتب والخطط والتجديدات على شهر كامل','حاسبة الزكاة: النصاب بسعر الذهب، وخصم الأمانات والديون الحالّة، وموعد الحول','تنبيه عند الوصول إلى 80% من سقف أي فئة، وكشف الاشتراكات المتكررة','مقارنة بنفس الشهر من العام الماضي، واتجاه أهم الفئات لستة أشهر','الالتزامات الشهرية مقسّمة: الفواتير والسكن، مصروف العائلة والرواتب، أقساط الديون، وأخرى؛ لكل قسم المقرر والمتبقي بخط كبير، والمدفوع بالأخضر','«متبقٍ من الشهر الماضي» يظهر بوضوح على الالتزام الذي لم يُسدَّد كاملًا، وتتجدد القائمة كل شهر تلقائيًا','تسجيل رسائل البنك تلقائيًا عبر اختصارات الآيفون، وتسجيل مصروف سريع من رابط','مساحة التطبيق على جهازك في التقارير وقاعدة البيانات']},
 {v:'2.16.1',d:'2026-10-14',items:['قائمة الالتزامات الشهرية ثابتة: إضافة التزام (مصاريف الأهل، رواتب، كهرباء، ماء، إنترنت...) وتعديله وحذفه وتعديل مبلغه من وضع المدير فقط','زر «دفعت» يبقى متاحًا دائمًا من الوضع العادي','علامة 🔒 على أزرار الإضافة والتعديل وإلغاء الدفع عندما يكون وضع المدير مقفلًا']},
 {v:'2.16.0',d:'2026-10-14',items:['إصلاح: رسائل التحويل الواردة (مثل «تم تحويل مبلغ إلى حسابك» و«transferred to your account» و«payment received») كانت تُقرأ مصروفًا، وصارت تُقرأ دخلًا','قراءة اتجاه الرسالة صارت بموازنة كلمات الإيداع والخصم، والراتب والاسترداد دخل دائمًا','إصلاح: المبلغ المكتوب بالأرقام العربية مع الفاصلة العربية (مثل ١٬٢٥٠٫٥٠٠) كان يُقرأ خطأ، وصار يُقرأ 1,250.5','عند تحديد يوم الراتب: الرئيسية تعرض دخل ومصاريف دورة الراتب الحالية (من يوم نزوله) بدل الشهر الميلادي','تنبيه في الرئيسية إذا كان الراتب مسجّلًا في آخر الشهر السابق، مع زر «حدّد يوم الراتب»','عند استيراد رسالة بتاريخ شهر آخر يظهر تنبيه بالشهر الذي ستُحسب فيه']},
 {v:'2.15.1',d:'2026-10-14',items:['أسماء الخانات الطويلة تتحرك تلقائيًا ذهابًا وإيابًا لتظهر كاملة، والقصيرة تبقى ثابتة','يشمل: أقسام الرئيسية، العمليات، الالتزامات، الديون، الخطط، التنبيهات، المستندات، وغيرها']},
 {v:'2.15.0',d:'2026-10-14',items:['زر سورة الملك وبجانبه «أذكار الصباح والمساء» تحت شريط الأدعية مباشرة، مع خيار المكان: تحت الشريط، بعد التنبيهات، أسفل الرئيسية، أو مخفي (من وضع المدير)','بعد السورة قسم «🤲 أدعية طلب الرزق والبركة»: آيات الرزق والتيسير من المصحف، وأدعية قضاء الدين والهم والكرب من حصن المسلم، ويعدّلها المدير','أذكار الصباح والمساء من حصن المسلم مع عدّاد لكل ذكر بالضغط، ويختار الصباح أو المساء حسب الوقت','قسم الأدعية في قسم الديون صار شريطًا متحركًا مثل الرئيسية، وتعديله من وضع المدير','خط Amiri Quran المخصص للمصحف داخل التطبيق ليظهر الرسم العثماني بعلاماته كاملة وبدون إنترنت','التحقق من نص السورة بمقارنته حرفًا حرفًا مع مصحف مجمع الملك فهد (حفص) ومصادر أخرى']},
 {v:'2.14.0',d:'2026-10-14',items:['شريط متحرك في أعلى الرئيسية بأدعية التيسير وقضاء الدين من خانة «تذكير»، يتوقف عند لمسه، وبالضغط تقرؤها كاملة بخط كبير','زر «📖 سورة الملك» في الرئيسية: قارئ مريح بخط كبير قابل للتكبير، والشاشة لا تنطفئ أثناء القراءة','«أتممت القراءة» يسجّل الليلة ويعرض عدد الليالي المتتالية','نص السورة من مشروع تنزيل الموثوق، بالرسم الإملائي أو العثماني','إعدادات الزر (الاسم، الظهور، الرسم، ملاحظة بعد القراءة) من وضع المدير فقط']},
 {v:'2.13.0',d:'2026-10-14',items:['قاعدة بيانات داخلية ثانية مقسّمة: كل عملية سجل مستقل، وكل قسم (الديون، الالتزامات، الخطط، الأمانات، السيارات، الأهل) في خانة مستقلة، تُحدَّث تلقائيًا بعد كل حفظ','استعادة تلقائية من قاعدة البيانات الداخلية إذا تلفت ذاكرة التطبيق أو فرغت','لقطات تلقائية: يومية لآخر 14 يومًا، وقبل كل تحديث أو استعادة أو حذف شامل، مع استعادتها أو حفظها كملف','«🗄️ قاعدة البيانات» في التقارير: أين تُحفظ بياناتك، عدد السجلات في كل قسم، فحص السلامة، بصمة البيانات، والتصدير لكل قسم','نسخة احتياطية جديدة مقسّمة إلى أقسام واضحة مع عدد السجلات وبصمة تتحقق من سلامة الملف','الاستعادة صارت بمعاينة: تقارن ما في الملف بما عندك، وتختار استبدالًا كاملًا أو دمجًا، مع «تراجع»']},
 {v:'2.12.1',d:'2026-10-14',items:['خانة «🤲 تذكير» في قسم الديون: اكتب فيها أدعية وآيات التيسير وقضاء الدين، وتعديلها من وضع المدير فقط','مقترحات جاهزة من القرآن والأدعية المأثورة تضيفها بضغطة','تظهر كاملة أعلى قسم الديون، وواحدة منها كل يوم في الرئيسية، وفي أعلى تقرير الديون المطبوع']},
 {v:'2.12.0',d:'2026-10-14',items:['تصدير Excel / Numbers (.xlsx) حقيقي من داخل التطبيق: كل قسم في ورقة مرتبة من اليمين لليسار، مع أسهم الفلترة والترتيب ومجاميع بالمعادلات','أوراق الديون: الديون الحالية بأقسامها، كل الدفعات بالفائدة والمتبقي بعد كل دفعة، والديون المنتهية بمدتها وطريقة التخلص منها','أوراق أخرى: الملخص، الالتزامات الشهرية بكل شهر ودفعاته، العمليات، الخطط، الأمانات','«تقرير الديون» للطباعة أو PDF: كل قسم في جدول، شريط التقدّم، ما سدّدته شهرًا بشهر، سجل المنتهية، وعمود ☐ للمراجعة','نافذة «تصدير وطباعة التقارير» من التقارير، وأزرار مباشرة في قسم الديون والالتزامات الشهرية','على الآيفون: اختر «Numbers» من قائمة المشاركة لفتح الملف وتعديله، أو «حفظ في الملفات»']},
 {v:'2.11.1',d:'2026-10-14',items:['زر «إلغاء الدفع» في الالتزامات الشهرية وأقساط الديون: إذا ضغطت «دفعت» بالخطأ يرجع الالتزام «بانتظار الدفع» كما كان، لأي شهر تختاره','يعرض قبل الإلغاء الدفعات التي ستُحذف ومجموعها، ويُسجَّل في «التحديثات»، مع زر «تراجع»']},
 {v:'2.11.0',d:'2026-10-14',items:['«قسم الديون» مرتب في أقسام: البنوك والتمويل، ديون لأشخاص (باسم الشخص)، ديون شخصية وأخرى','فرز الديون حسب: الأقرب انتهاءً، الأكبر مبلغًا، الأطول مدة، الأعلى فائدة، مع تصفية حسب القسم','لكل دين: تاريخ البداية، موعد الانتهاء المقرر، ومدته الكاملة','طريقتا سداد: أقساط شهرية، أو دفعة واحدة بالمبلغ الإجمالي في موعد تحدده، وزر «كامل المتبقي» للسداد النهائي','«سجل الديون المنتهية»: كل دين ينتهي يبقى محفوظًا بدفعاته ومستنداته، ومتى بدأ وانتهى، والمدة التي استغرقها، وطريقة التخلص منه','تقرير مبسّط لقسم الديون أسفل الرئيسية: المتبقي، الأقساط الباقية، يوم التحرر، وكل قسم بضغطة','التقرير المطبوع وكشف الدين يعرضان القسم والمدة والديون المنتهية']},
 {v:'2.10.0',d:'2026-10-13',items:['«وضع المدير»: التعديل والحذف والتراجع وتعديل الالتزامات الشهرية والديون والخطط والسيارات والأمانات تحتاج رمز المدير أو بصمة الوجه','اعتماد المدفوعات: ما يُدخل ووضع المدير مقفل يُعلَّم «⏳ بانتظار الاعتماد» حتى تراجعه وتعتمده أو تعدّله، مع «اعتماد الكل»','تنبيه «بانتظار اعتمادك» في الرئيسية، وعلامة ⏳ على الدفعات المنتظرة في الالتزامات والديون والسجل','قفل تلقائي بعد 5 دقائق بدون استخدام أو عند الخروج من التطبيق، وزر 🛡️ في الأعلى للفتح والقفل','رمز المدير يُحفظ مشفّرًا في هاتفك فقط، ولا يدخل في المزامنة ولا النسخة الاحتياطية']},
 {v:'2.9.0',d:'2026-10-13',items:['«التحرر من الديون» في الرئيسية: كم قسطًا باقيًا، ويوم التحرر من الديون بالتاريخ، وعدّ تنازلي بالأيام، ونسبة ما سدّدته، والقسط القادم','كل دين صار له «سجل الدين» داخل خانته: الدفعات، المستندات، والتحديثات','تعديل أي دفعة قديمة أو حذفها بالضغط عليها، ويُصحَّح المتبقي من الدين والمصروف المرتبط تلقائيًا مع زر «تراجع»','إرفاق عقد القرض وإيصالات السداد بالدين، تُحفظ مشفّرة في خزنة «مستنداتي» ولا تُزامَن','«كشف للطباعة» لكل دين: الملخص، كل دفعة بتاريخها ومبلغها والفائدة والمتبقي بعدها، المستندات المرفقة، وسجل التحديثات','«باقٍ X قسطًا» في خانة كل دين وفي التقرير المطبوع، وفي ويدجت الآيفون والماك','كل دفعة دين تُحفظ بفائدتها وأصلها والمتبقي بعدها لكشف أدق']},
 {v:'2.8.0',d:'2026-10-13',items:['كل التزام شهري صار خانة واحدة بأيقونته (كهرباء، ماء، إنترنت، هاتف، إيجار...)، وفيها كل ما يخصه','«سجل الالتزام» داخل الخانة: كل شهر بفاتورته والمتأخرات وما دفعته والمتبقي، مع دفعاته وتعديلها أو حذفها من نفس المكان','«التحديثات» تُحفظ داخل الخانة تلقائيًا: إضافة الالتزام، تغيير المبلغ، المتأخرات، فاتورة شهر، يوم الدفع، تعديل أو حذف دفعة','«كشف للطباعة» لكل التزام من نفس بياناته: الأشهر والدفعات والمتبقي وسجل التحديثات','التقرير الشهري المطبوع يعرض لكل التزام: المستحق والمدفوع والمتبقي وتواريخ الدفعات والحالة (مدفوع أو جزئي)','سجل السداد داخل خانة كل قسط دين','زر ثابت «+ إضافة التزام» أعلى صفحة الشهرية وأسفلها، يفتح كل الأنواع دائمًا ويمكن تكرار النوع نفسه (مثل كهرباء لبيتين)']},
 {v:'2.7.0',d:'2026-10-13',items:['نافذة دفع منظمة للالتزامات الشهرية: فاتورة الشهر + المتأخرات − ما دفعته سابقًا = المستحق الآن','عند كتابة المبلغ يظهر فورًا كم يبقى عليك بعد الدفعة، مع أزرار «كامل المستحق» و«فاتورة الشهر فقط» و«النصف»','خطوة تأكيد قبل الحفظ تعرض المبلغ والتاريخ وطريقة الدفع والمتبقي','زر «تراجع» بعد كل دفعة، وحذف أي دفعة خاطئة لاحقًا من سجل الالتزام مع إمكانية إعادتها','«عادةً أدفع النصف»: يجعل نصف المبلغ هو الافتراضي لهذه الفاتورة','«ذكّرني بالمتبقي يوم...»: تختار تاريخ التذكير بالباقي (الافتراضي يوم الراتب)، فيظهر في الرئيسية ويصلك إشعار','«تسجيل كل المتبقي» صار يعرض القائمة والمجموع للتأكيد، مع تراجع عن الكل','سداد الديون يعرض المتبقي من الدين بعد الدفعة، مع زر تراجع','الملخص الشهري يحسب الدفعات الجزئية ويعرض ما بقي عليك','تعديل أي دفعة مسجلة (المبلغ والتاريخ والطريقة) بالضغط عليها، مع المتبقي بعد التعديل وزر تراجع','المبالغ تظهر بدون كسور إذا كانت صحيحة (25 بدل 25.000)، وبالبيسة فقط عند وجود كسور، ومعها «ر.ع.»','الالتزامات الشهرية: شهر بداية وشهر نهاية اختياري (أو مستمر)، ومعاينة الأشهر القادمة قبل الحفظ','تغيير مبلغ الالتزام: «من هذا الشهر فصاعدًا» مع بقاء الأشهر السابقة بمبلغها القديم، أو «هذا الشهر فقط»','إصلاح: المبالغ من 1,000 فأكثر في الحقول المعبأة مسبقًا كانت تُقرأ خطأً (مثل 1,636 تصبح 1.636)']},
 {v:'2.6.0',d:'2026-10-13',items:['قسم «الأمانات»: توثّق من أعطاك مالًا تحفظه له، بالمبلغ وتاريخ الاستلام ومكانه (الحساب الجاري أو الادخار أو نقدًا) وموعد الإرجاع والغرض','تسجيل الإرجاع الجزئي أو الكامل، مع سجل لكل إرجاع والمتبقي عندك، وتنبيه قبل موعد الإرجاع','الأمانة ليست دخلًا ولا مصروفًا، لكنها تُخصم عند مقارنة رصيد البنك الفعلي، فتعرف أموالك أنت','إشعار صاحب الأمانة عبر واتساب عند الاستلام والإرجاع بعد موافقتك','تقرير الأمانات للطباعة أو PDF، وكشف لكل أمانة مع خانات التوقيع','مستندات السيارة: إرفاق وثيقة التأمين والملكية وأي مستند (صور أو PDF) من بطاقة السيارة، تُحفظ مشفّرة في الخزنة ومربوطة بالسيارة']},
 {v:'2.5.1',d:'2026-10-13',items:['فحص شامل قبل النشر: كل الأقسام في التواريخ الحساسة (نهاية الشهر وفبراير والسنة الكبيسة ورأس السنة) ومع يوم راتب 1 و25 و31، و500 ضغطة عشوائية، و6000 عملية، واستعادة نسخ قديمة','تحسين التوافق مع إصدارات iOS الأقدم: ألوان بديلة حتى لا تختفي الأشرطة والخلفيات','حماية من إدخال نصوص برمجية في الأسماء والملاحظات (تم التحقق)']},
 {v:'2.5.0',d:'2026-10-13',items:['«يوم نزول الراتب»: تحدده مرة واحدة (مع خيار إذا صادف جمعة أو سبت)، فتصبح الخطة اليومية من راتب إلى راتب بدل الشهر الميلادي','العد التنازلي «الراتب بعد كذا يوم» في الرئيسية مع شريط يبين موقعك بين الراتبين، ومصروف يومي دقيق حتى نزول الراتب','الخطط تُحسب على عدد الرواتب المتبقية قبل موعدها: «11 راتبًا قبله» و«كذا كل راتب»','المفروض في حسابك الجاري يُحسب من آخر راتب، مع خانة «رصيدك قبل نزول الراتب»','تذكير الفواتير: تحدد يوم التذكير لكل فاتورة، فيظهر في الرئيسية حتى تدفعها، ويصلك إشعار، ويمكن إضافته لتقويم الآيفون ليذكّرك كل شهر','المتأخرات والدين السابق للكهرباء والمياه وغيرها: فاتورة الشهر + المتأخرات − ما دفعته = المتبقي، مع الدفع الجزئي ومبلغ فاتورة مختلف لكل شهر']},
 {v:'2.4.0',d:'2026-10-13',items:['ويدجت للآيفون (الشاشة الرئيسية وشاشة القفل) يظهر أيضًا على سطح مكتب الماك: المتبقي هذا الشهر، المتاح يوميًا، نسبة الصرف من السقف، الدخل والمصاريف، حصيلة السنة، الخطط والمتبقي منها، الالتزامات القادمة، وأولويات مستشاري','الويدجت بثلاثة أحجام، ويحسب المتاح يوميًا حسب اليوم تلقائيًا، مع خيار إخفاء المبالغ','ويدجت لسطح مكتب الماك الأقدم من Sonoma عبر تطبيق Übersicht المجاني','خانة «ويدجت الآيفون والماك» في «أقسامي» وفي التقارير، مع خطوات الإعداد وتذكير في الرئيسية عندما تصبح بيانات الويدجت قديمة','«خطة الصرف اليومية»: مبلغ متساوٍ لكل يوم حتى نهاية الشهر بعد خصم الالتزامات والأقساط وادخار الخطط، مع احتياطي اختياري 5% أو 10%، وجدول بكل أيام الشهر','بطاقة «اليوم» في الرئيسية: مصروف اليوم وما صرفته وما بقي، وإذا وفّرت يومًا يزيد مصروف الأيام القادمة تلقائيًا','«اسأل المستشار»: محادثة تكتب فيها ما تريد شراءه ومبلغه، فيخبرك هل يرهقك حتى نهاية الشهر، ومصروفك اليومي بعده، مع بدائل: من خطة ادخار، أو التقسيط، أو الشهر القادم، أو تجعلها خطة','أسئلة سريعة: كم أصرف اليوم؟ حتى نهاية الأسبوع؟ كم باقي لي؟ وين أوفّر؟','الخطط تعرض العد التنازلي بالأيام حتى موعدها، وما أنجزته، والمتبقي، في بطاقات الخطط والرئيسية والويدجت','«المفروض في حسابك الجاري اليوم» حسب الخطة، ومقارنته بما سجّلته وبرصيدك الفعلي في البنك','«المتاح يوميًا» صار رقمًا واحدًا في كل التطبيق (الرئيسية، الميزانية، المستشار، الويدجت)']},
 {v:'2.3.0',d:'2026-10-13',items:['نافذة «طباعة التقرير» بخيارات كثيرة: شهر أو سنة أو فترة محددة، وقوالب جاهزة (مختصر، كامل، للمراجعة) أو اختيار الأقسام بنفسك','قسم «ملاحظات للمراجعة»: يكشف المبالغ الكبيرة والعمليات المكررة وما ليس له فئة، والالتزامات غير المدفوعة','قائمة العمليات: تصفية حسب النوع والفئة، ترتيب بالتاريخ أو المبلغ، تجميع حسب اليوم أو الفئة مع المجاميع، رصيد تراكمي، وعمود ☐ للمراجعة وعمود للملاحظات','أقسام جديدة في التقرير: السيارات والتجديدات، أولويات مستشاري، حساب الادخار، ومؤشرات إضافية في الملخص','معاينة التقرير داخل التطبيق قبل الطباعة، وخط كبير، وصفحة أفقية، وطباعة أبيض وأسود لتوفير الحبر','«طباعة سريعة» بآخر خيارات استخدمتها','حماية «حذف كل البيانات»: كتابة كلمة «احذف» ثم التأكيد ببصمة الوجه، أو برمز الخزنة إذا لم تتوفر البصمة، مع زر لحفظ نسخة احتياطية قبل الحذف']},
 {v:'2.2.0',d:'2026-10-13',items:['إعادة صياغة شاملة: دوال مشتركة واحدة بدل الكود المكرر (التواريخ، الأيقونات، النوافذ، المتوسطات، صيغ العدد)','بلا تكرار في الشاشات: ملخص التقارير والرسم البياني مكوّن واحد في الرئيسية وصفحة التقارير','«أين ذهبت أموالك» انتقلت إلى التقرير الشهري، وأُزيلت من «أقسامي» الخانات الموجودة أصلًا في الرئيسية أو الشريط السفلي','مستشاري لا يكرر ما يظهر في الرئيسية (تنبيهات السيارات والمستندات وحصة الخطط)','إصلاح شكل نقاط ألوان الأشخاص في البيت والسيارات','ترتيب ملفات الكود في 27 قسمًا والتصميم في 14 قسمًا مع فهرس محدّث']},
 {v:'2.1.0',d:'2026-10-13',items:['«مستشاري الذكي»: يحلّل دخلك ومصاريفك وخططك وديونك داخل هاتفك ويعطيك درجة لصحتك المالية من 100','«أولوياتك الآن»: ترتيب تلقائي لما يجب أن تبدأ به (دفعات متأخرة، تجاوز الميزانية، خطط أكبر من قدرتك، تسريع سداد الديون...) مع زر للتنفيذ','«خطة دخلك المقترحة»: توزيع دخلك على الالتزامات والخطط والطوارئ والمصروف اليومي','«قد تكون نسيت»: قائمة بالأشياء المهمة الناقصة مثل صندوق الطوارئ وخطط رمضان والعيدين وتواريخ التأمين والنسخة الاحتياطية','لوحة «خططي» في الرئيسية: كل خططك مع المتبقي لتحقيق كل خطة ونسبة الإنجاز وموعدها، واضغط على أي خطة لتفتحها مباشرة','إجمالي ما ادّخرته والمتبقي لكل الخطط وما تحتاج ادخاره هذا الشهر','«ملخص التقارير» في الرئيسية: مصاريف الشهر ومقارنتها بالشهر الماضي، نسبة التوفير، أكثر فئة صرف، وحصيلة السنة','رسم للدخل والمصاريف لآخر 6 أشهر، وأزرار مباشرة للتقرير الشهري والسنوي والطباعة']},
 {v:'2.0.0',d:'2026-10-13',items:['«حساب الادخار»: حساب بنكي واحد موزّع داخل التطبيق على خططك، مع نسبة ومبلغ كل خطة','«أودعت مبلغًا»: تكتب مبلغًا واحدًا فيوزّعه التطبيق على الخطط تلقائيًا، ويمكنك تعديله','مطابقة رصيد البنك مع مجموع الخطط، وتوزيع أي زيادة بضغطة','«صرفت منها»: الصرف من خطة يخصم من مدّخرها ومن رصيد الحساب ويُسجَّل كمصروف']},
 {v:'1.9.2',d:'2026-10-13',items:['خيار إظهار أو إخفاء بيانات المطوّر في التقارير المطبوعة']},
 {v:'1.9.1',d:'2026-10-13',items:['بيانات صاحب التطبيق ومطوّره في «عن التطبيق» وفي التقارير المطبوعة']},
 {v:'1.9.0',d:'2026-10-13',items:['إرسال مستندات الخزنة كملفات عادية عبر واتساب أو البريد بعد موافقتك، مع اختيار الملفات وأسماء واضحة لها','طباعة التقرير الشهري أو السنوي أو حفظه PDF بشكل مرتب مع التواريخ: الملخص، الفئات، الأشخاص، المصاريف الشهرية، الديون، الخطط، وكل العمليات','حفظ التقرير كملف يُفتح ويُطبع من أي جهاز','قسم جديد «الشهرية» في الشريط السفلي: مصاريفك الثابتة وأقساط ديونك في قائمة واحدة تتكرر كل شهر','القائمة مقسومة إلى «بانتظار الدفع» و«تم الدفع»، وكل ما تدفعه ينتقل تلقائيًا','زر الإضافة صار عائمًا، والشريط السفلي: الرئيسية، الشهرية، السجل، الخطة، التقارير. والأهل من لوحة «أقسامي»']},
 {v:'1.8.0',d:'2026-10-13',items:['خزنة «مستنداتي» مرتبة في مجلدات: البطاقات الشخصية، جوازات السفر، رخص القيادة، السير الذاتية، الشهادات وغيرها','أكثر من مستند في كل مجلد لك ولأفراد أسرتك، مع اسم صاحب المستند تلقائيًا','عرض الخزنة «حسب النوع» أو «حسب الشخص»']},
 {v:'1.7.0',d:'2026-10-13',items:['الاسم الجديد: «إدارة شؤوني»، مع أيقونة وشعار جديدين']},
 {v:'1.6.0',d:'2026-10-13',items:['إعادة تنظيم البرنامج كاملًا: الكود في 24 قسمًا مرتبًا، والتصميم في ملف واحد منظم','حذف بقايا غير مستخدمة من الإصدارات الأولى','إصلاح محاذاة أيقونات العمليات في السجل، وتوضيح موعد الالتزامات الشهرية']},
 {v:'1.5.1',d:'2026-10-13',items:['فتح خزنة المستندات ببصمة الوجه (iOS 18 أو أحدث)، وببصمة الإصبع على الـMac']},
 {v:'1.5.0',d:'2026-10-13',items:['قسم «مستنداتي»: خزنة مشفّرة برمز للبطاقة الشخصية والجواز والرخصة والسيرة الذاتية والشهادات','إضافة المستند بالتصوير أو من الصور أو ملف PDF، مع رقمه وتاريخ إصداره وانتهائه','تنبيه قبل انتهاء المستندات (الجواز قبل 6 أشهر)','مشاركة المستند، أو إرساله ملفًا محميًا بكلمة مرور','تصدير الخزنة مشفّرة واستيرادها على جهاز آخر، وقفل تلقائي']},
 {v:'1.4.0',d:'2026-10-13',items:['قسم «ديوني»: إجمالي الديون المتبقية، والأقساط الشهرية، ونسبة ما سدّدته','خطة التخلص من الديون: الأعلى فائدة أولًا أو الأصغر مبلغًا أولًا، مع تاريخ الانتهاء لكل دين ولكل الديون','مبلغ إضافي شهري: يحسب كم شهرًا توفّر وكم من الفوائد، مع اقتراح من فائضك','زر «سدّدت القسط» يخصم من الدين ويسجّل المصروف تلقائيًا','بطاقة «ديوني» في الرئيسية مع تنبيه القسط المتأخر']},
 {v:'1.3.0',d:'2026-10-13',items:['تنبيهات السيارات في أعلى الرئيسية عند اقتراب انتهاء التأمين أو الملكية أو موعد الصيانة، مع زر «جدّدت»','اختيار مدة التنبيه لكل سيارة: أسبوع أو أسبوعين أو شهر أو شهرين','إشعارات الهاتف للتنبيهات','«أضف التذكير للتقويم»: تذكير في تقويم الهاتف يصلك حتى لو كان التطبيق مغلقًا','قسم «سيارات الأهل والآخرين» مع تحديد صاحب كل سيارة']},
 {v:'1.2.0',d:'2026-10-13',items:['«خطة جديدة» بقوالب جاهزة: خطة سنوية، تعديل المنزل، شراء سيارة، زواج، سفر، حج أو عمرة، صندوق الطوارئ، تعليم، جهاز','تقسيم الخطة إلى بنود يُجمع مبلغها تلقائيًا','حساب ذكي: بتاريخ محدد أو بمبلغ شهري ثابت، مع تقييم هل الخطة مريحة لميزانيتك واقتراح بديل','زر المظهر في الأعلى: 6 ألوان، والوضع الفاتح أو الداكن، وحجم الخط، وشكل البطاقات']},
 {v:'1.1.0',d:'2026-10-13',items:['خانة الإصدار و«ما الجديد» في صفحة التقارير','إشعار بعد كل تحديث، وزر «البحث عن تحديث»','تحميل النسخة الجديدة تلقائيًا عند فتح التطبيق']},
 {v:'1.0.0',d:'2026-10-13',items:['تسجيل المصاريف والدخل مع أيقونة لكل فئة، والتسجيل السريع والتراجع','الميزانية الشهرية وحدود الفئات','خطة الادخار لرمضان والعيدين والتأمين','البيت: الالتزامات الشهرية والأهل','السيارات: التأمين والملكية والصيانة','التقارير الشهرية والسنوية وتنزيل Excel','قراءة رسائل البنك','المزامنة بين أجهزتك عبر Google Drive']}
];
function versionHtml(){
  return `<h2>عن التطبيق</h2><div class="panel stack">
   <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><b>إدارة شؤوني</b><div class="note">الإصدار <span class="num">${APP_VERSION}</span> · ${fmtD(CHANGELOG[0].d)}</div></div><button class="chip" id="checkUpd">البحث عن تحديث</button></div>
   <div class="devcard"><span class="avatar" style="width:44px;height:44px;background:var(--accent-soft);color:var(--accent);font-size:18px">م</span><div style="min-width:0"><span class="note">صاحب التطبيق ومطوّره</span><b>${DEV.name}</b><div class="note">${DEV.title} · ${DEV.country}</div></div></div>
   <div class="sumrow" style="align-items:center"><span>الهاتف</span><span style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end"><b class="num" dir="ltr">+968 ${DEV.phone}</b><a class="chip" href="tel:+${DEV.intl}">اتصال</a><a class="chip" href="https://wa.me/${DEV.intl}" target="_blank" rel="noopener">واتساب</a></span></div>
   <details${S.showNew?' open':''}><summary class="note" style="cursor:pointer">ما الجديد</summary><div style="margin-top:8px">${CHANGELOG.map(c=>`<div style="padding-block:6px"><b class="num" style="font-size:13px">${c.v}</b> <span class="note">${fmtD(c.d)}</span><ul style="margin:4px 0 0;padding-inline-start:18px;font-size:13px;line-height:1.7">${c.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div></details></div>`;
}
function checkVersion(){let last=null;try{last=localStorage.getItem('masareef:ver')}catch(e){}
  if(last&&last!==APP_VERSION){S.showNew=true;S.snapVer=1;setTimeout(()=>toast('تم التحديث إلى الإصدار '+APP_VERSION+'. اطّلع على الجديد في التقارير'),600)}
  try{localStorage.setItem('masareef:ver',APP_VERSION)}catch(e){}}

/* ---------- 25. بيانات المثال ---------- */
function loadSample(){
  const m=S.month,d=n=>m+'-'+String(n).padStart(2,'0'),p=shiftMonth(m,-1),pd=n=>p+'-'+String(n).padStart(2,'0');
  const rows=[['inc',850,'salary',d(1),'transfer','راتب الشهر'],['exp',180,'home',d(2),'transfer','إيجار الشقة'],['exp',22.5,'fuel',d(3),'card','تعبئة وقود'],
   ['exp',31.75,'food',d(4),'card','مقاضي البيت'],['exp',4.2,'rest',d(5),'cash','قهوة وفطور'],['exp',38.4,'bills',d(6),'card','فاتورة الكهرباء'],
   ['exp',15,'charity',d(7),'cash','صدقة'],['exp',12.9,'bills',d(8),'card','باقة الإنترنت'],['inc',60,'business',d(8),'cash','مبيعات المواد الغذائية'],
   ['inc',850,'salary',pd(1),'transfer','راتب الشهر'],['exp',180,'home',pd(2),'transfer','إيجار الشقة'],['exp',210.3,'food',pd(10),'card','مقاضي'],['exp',95,'shop',pd(18),'card','ملابس'],['exp',60,'fuel',pd(20),'card','وقود']];
  putTxMany(rows.map(r=>({id:uidGen(),type:r[0],amount:r[1],cat:r[2],date:r[3],method:r[4],note:r[5],createdAt:new Date().toISOString(),sample:true})));
  toast('أُضيفت بيانات مثال، يمكنك حذفها من التقارير');
}


/* ---------- 26. التقارير: الطباعة وPDF وExcel / Numbers ---------- */
/* الأقسام المتاحة في التقرير المطبوع، والقوالب الجاهزة */
const PR_SECTIONS=[
 ['summary','الملخص والأرقام الرئيسية'],['review','ملاحظات للمراجعة'],['months','تفصيل كل شهر'],['cats','المصاريف حسب الفئة'],
 ['people','المصاريف حسب الأشخاص'],['monthly','الالتزامات الشهرية'],['debts','الديون وخطة السداد'],['plans','الخطط وحساب الادخار'],
 ['trusts','الأمانات'],['cars','السيارات والتجديدات'],['advisor','أولويات مستشاري'],['tx','قائمة العمليات']];
const PR_PRESETS={short:['summary','cats','advisor'],full:PR_SECTIONS.map(x=>x[0]),review:['summary','review','cats','monthly','tx'],trusts:['trusts']};
const PR_PRESET_N={short:'مختصر',full:'كامل',review:'للمراجعة',trusts:'الأمانات',custom:'مخصص'};
function prDefaults(){return{period:'month',from:'',to:'',preset:'full',secs:PR_PRESETS.full.slice(),txType:'all',txCat:'',sort:'asc',group:'none',running:false,reviewCols:false,font:'normal',orient:'portrait',ink:'color'}}
function prOpts(){const o=Object.assign(prDefaults(),JSON.parse(JSON.stringify(S.settings.printOpts||{})));o.dev=S.settings.printDev!==false;return o}
function prRange(o){
  if(o.period==='year'){const y=S.month.slice(0,4);return{from:y+'-01-01',to:y+'-12-31',label:'التقرير السنوي '+y,prev:[(+y-1)+'-01-01',(+y-1)+'-12-31']}}
  if(o.period==='range'&&o.from&&o.to){const f=o.from<=o.to?o.from:o.to,t=o.from<=o.to?o.to:o.from;const days=Math.round((new Date(t)-new Date(f))/864e5)+1;
    const pe=new Date(f+'T12:00');pe.setDate(pe.getDate()-1);const ps=new Date(pe);ps.setDate(ps.getDate()-days+1);
    return{from:f,to:t,label:'تقرير من '+fmtD(f)+' إلى '+fmtD(t),prev:[isoD(ps),isoD(pe)]}}
  const end=m=>{const [y,mm]=m.split('-').map(Number);return m+'-'+String(new Date(y,mm,0).getDate()).padStart(2,'0')};const pm=shiftMonth(S.month,-1);
  return{from:S.month+'-01',to:end(S.month),label:'تقرير شهر '+monthName(S.month),prev:[pm+'-01',end(pm)]}}
function inRange(f,t){return list().filter(x=>x.date&&x.date>=f&&x.date<=t)}
/* ملاحظات المراجعة: عمليات تستحق نظرة ثانية */
function prReviewFlags(A,oneMonth,m){const F=[];const E=A.filter(t=>t.type==='exp');
  const avg=E.length?sum(E,'exp')/E.length:0;
  E.filter(t=>avg&&+t.amount>=Math.max(avg*2.5,20)).sort((a,b)=>b.amount-a.amount).slice(0,6).forEach(t=>F.push(['مبلغ كبير',t]));
  const seen={};A.forEach(t=>{const k=[t.date,t.type,t.cat,(+t.amount).toFixed(3)].join('|');(seen[k]=seen[k]||[]).push(t)});
  Object.values(seen).filter(g=>g.length>1).forEach(g=>F.push(['قد تكون مكررة ('+g.length+' مرات)',g[0]]));
  A.filter(t=>t.cat==='other'&&!t.note).forEach(t=>F.push(['بدون فئة ولا بيان',t]));
  const out=F.map(([k,t])=>({k,date:t.date,name:t.note||catOf(t.cat).n,amt:+t.amount,type:t.type}));
  if(oneMonth)recStatus(m).R.filter(i=>!i.isPaid).forEach(i=>out.push({k:'التزام لم يُدفع',date:recDate({day:i.day},m),name:i.name,amt:i.amount,type:'exp'}));
  return out.sort((a,b)=>a.date.localeCompare(b.date))}
function reportDoc(o){o=o||prOpts();const R=prRange(o),has=k=>o.secs.includes(k);if(o.secs.length===1&&o.secs[0]==='trusts')R.label='تقرير الأمانات · '+R.label.replace(/^تقرير |^التقرير /,'');
  const A=inRange(R.from,R.to).sort((a,b)=>a.date.localeCompare(b.date)||(a.createdAt||'').localeCompare(b.createdAt||''));
  const inc=sum(A,'inc'),exp=sum(A,'exp'),net=inc-exp;const now=new Date();
  const months=[];for(let m=R.from.slice(0,7);m<=R.to.slice(0,7);m=shiftMonth(m,1))months.push(m);
  const oneMonth=months.length===1,m0=months[0];
  const T=(head,rows,foot,cls)=>`<table${cls?` class="${cls}"`:''}><thead><tr>${head.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody>${foot?`<tfoot><tr>${foot.map(f=>`<td>${f}</td>`).join('')}</tr></tfoot>`:''}</table>`;
  const N=(v,sg)=>`<span class="n">${sg||''}${money(v)}</span>`,SN=v=>N(Math.abs(v),v<0?'−':''),P=(v,t)=>t?Math.round(v/t*100)+'%':'—';
  const parts=[];const sec=(id,title,body,cls)=>{parts.push({id,title});return `<section id="r-${id}"${cls?` class="${cls}"`:''}><h2>${title}</h2>${body}</section>`};
  let h='';
  if(has('summary')){const days=Math.max(1,Math.round((Math.min(new Date(R.to+'T12:00'),now)-new Date(R.from+'T12:00'))/864e5)+1);
    const pA=inRange(R.prev[0],R.prev[1]),pexp=sum(pA,'exp');const big=A.filter(t=>t.type==='exp').sort((a,b)=>b.amount-a.amount)[0];
    h+=sec('summary','الملخص',`<div class="kpis"><div><span>الدخل</span><b>${N(inc)}</b></div><div><span>المصاريف</span><b>${N(exp)}</b></div><div><span>الصافي</span><b class="${net<0?'no':'ok'}">${SN(net)}</b></div><div><span>نسبة الادخار</span><b>${inc?'<span class="n">'+Math.round(net/inc*100)+'%</span>':'—'}</b></div></div>
     <div class="kpis k2"><div><span>عدد العمليات</span><b>${A.length}</b></div><div><span>متوسط الصرف اليومي</span><b>${N(exp/days)}</b></div><div><span>أكبر مصروف</span><b>${big?N(big.amount):'—'}</b>${big?`<small>${esc(big.note||catOf(big.cat).n)}</small>`:''}</div><div><span>مقارنة بالفترة السابقة</span><b class="${pexp&&exp>pexp?'no':'ok'}">${pexp?'<span class="n">'+(exp>=pexp?'+':'−')+Math.abs(Math.round((exp-pexp)/pexp*100))+'%</span>':'—'}</b>${pexp?`<small>كانت ${N(pexp)}</small>`:''}</div></div>`)}
  if(has('review')){const F=prReviewFlags(A,oneMonth,m0);
    h+=sec('review','ملاحظات للمراجعة',F.length?`<p class="hint">عمليات تستحق نظرة ثانية قبل اعتماد التقرير.</p>`+T(['الملاحظة','التاريخ','البيان','المبلغ','✓'],F.map(f=>`<tr><td><b>${esc(f.k)}</b></td><td class="nw">${fmtD(f.date)}</td><td>${esc(f.name)}</td><td>${N(f.amt,f.type==='inc'?'+':'−')}</td><td class="box">☐</td></tr>`)):'<p class="okline">لا توجد ملاحظات. لا مبالغ غير معتادة ولا عمليات مكررة.</p>')}
  if(has('months')&&!oneMonth){const rows=months.map(m=>{const a=inMonth(m).filter(t=>t.date>=R.from&&t.date<=R.to);const ii=sum(a,'inc'),ee=sum(a,'exp');return a.length?`<tr><td>${esc(monthName(m))}</td><td>${N(ii)}</td><td>${N(ee)}</td><td>${SN(ii-ee)}</td><td>${P(ii-ee,ii)}</td><td>${a.length}</td></tr>`:''}).filter(Boolean);
    if(rows.length)h+=sec('months','تفصيل كل شهر',T(['الشهر','الدخل','المصاريف','الصافي','الادخار','العمليات'],rows,['المجموع',N(inc),N(exp),SN(net),P(net,inc),A.length]))}
  if(has('cats')){const bc={},bn={};A.filter(t=>t.type==='exp').forEach(t=>{bc[t.cat]=(bc[t.cat]||0)+(+t.amount);bn[t.cat]=(bn[t.cat]||0)+1});const cats=Object.entries(bc).sort((a,b)=>b[1]-a[1]);
    if(cats.length)h+=sec('cats','المصاريف حسب الفئة',T(['الفئة','العمليات','المبلغ','النسبة',''],cats.map(([c,v])=>`<tr><td>${esc(catOf(c).n)}</td><td>${bn[c]}</td><td>${N(v)}</td><td>${P(v,exp)}</td><td class="barc"><i style="width:${exp?v/cats[0][1]*100:0}%"></i></td></tr>`),['المجموع',A.filter(t=>t.type==='exp').length,N(exp),'100%','']))}
  if(has('people')){const pe=Object.entries(byPerson(A)).filter(([,v])=>v>0);
    if(pe.length>1)h+=sec('people','المصاريف حسب الأشخاص',T(['الشخص','المبلغ','النسبة'],pe.sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<tr><td>${k?esc(personName(k)):'لي وللبيت'}</td><td>${N(v)}</td><td>${P(v,exp)}</td></tr>`)))}
  if(has('monthly')&&oneMonth){const st=recStatus(m0);if(st.R.length){const pd=i=>i.kind==='rec'?recPays(i.ref).filter(t=>t.date.slice(0,7)===m0):(i.ref.pays||[]).filter(p=>p.date&&p.date.slice(0,7)===m0).map(p=>({amount:p.amt,date:p.date}));
    h+=sec('monthly','الالتزامات الشهرية',T(['البند','يوم الدفع','المستحق','المدفوع','المتبقي','الدفعات','الحالة','✓'],st.R.slice().sort((a,b)=>a.day-b.day).map(i=>{const rem=r3(Math.max(0,i.amount-(i.paidAmt||0)));return `<tr><td>${esc(i.name)}${i.prev>0.0005?`<br><small>منها متأخرات ${money(i.prev)}</small>`:''}</td><td>${i.day}</td><td>${N(i.amount)}</td><td>${N(i.paidAmt||0)}</td><td class="${rem>0.0005?'no':'ok'}">${N(rem)}</td><td>${pd(i).map(t=>money(t.amount)+' ('+fmtD(t.date)+')').join('<br>')||'—'}</td><td class="${i.isPaid?'ok':i.paidAmt?'':'no'}">${i.isPaid?'مدفوع':i.paidAmt?'جزئي':'لم يُدفع'}</td><td class="box">${i.isPaid?'☑':'☐'}</td></tr>`}),['المجموع','',N(st.total),N(st.paidAmt),N(st.dueLeft),'',`مدفوع ${st.paid.length} من ${st.R.length}`,'']))}}
  if(has('debts')){const Ds=debts().filter(d=>+d.balance>0.0005),Dn=debts().filter(d=>d.closed);if(Ds.length||Dn.length){const pl=debtSim();const GK=Object.keys(DEBT_G);let x='';
    if(Ds.length)x+=T(['القسم','الدين','بدأ','المتبقي','القسط','الفائدة','ينتهي المقرر','المدة'],debtSort(Ds,'end',pl).sort((a,b)=>GK.indexOf(debtGroup(a))-GK.indexOf(debtGroup(b))).map(d=>{const e=debtEnd(d,pl),st=debtStart(d);return `<tr><td>${DEBT_G[debtGroup(d)][0]}</td><td>${esc(d.name)}${d.lender?' ('+esc(d.lender)+')':''}</td><td class="nw">${fmtD(st)}</td><td>${N(d.balance)}</td><td>${d.mode==='once'?'دفعة واحدة':N(d.payment)}</td><td>${+d.rate?d.rate+'%':'—'}</td><td class="nw">${e?fmtD(e):'—'}</td><td>${e?spanWord(st,e):'—'}</td></tr>`}),['المجموع','','',N(Ds.reduce((s2,d)=>s2+(+d.balance),0)),N(Ds.reduce((s2,d)=>s2+debtInst(d),0)),'','','']);
    if(Dn.length)x+='<h3>ديون انتهت</h3>'+T(['الدين','من','إلى','استغرق','طريقة التخلص','مجموع ما دُفع'],Dn.map(d=>{const c=d.closed;return `<tr><td>${esc(d.name)}</td><td class="nw">${fmtD(c.start)}</td><td class="nw">${fmtD(c.end)}</td><td>${spanWord(c.start,c.end)}</td><td>${CLOSE_M[c.method]}</td><td>${N(c.total)}</td></tr>`}));
    h+=sec('debts','الديون',x)}}
  if(has('plans')){const G=(S.settings.goals||[]);if(G.length){const acc=savAcc(),tot=savTotal();const hb=acc.balance!==null&&acc.balance!=='';
    h+=sec('plans','الخطط والأهداف',T(['الخطة','المطلوب','المدّخر','المتبقي','الإنجاز','الموعد','ادّخر شهريًا'],G.slice().sort((a,b)=>a.due.localeCompare(b.due)).map(g=>{const c=goalCalc(g);return `<tr><td>${esc(g.name)}</td><td>${N(c.tgt)}</td><td>${N(c.sv)}</td><td>${N(c.rem)}</td><td>${c.tgt?Math.round(c.pct)+'%':'—'}</td><td class="nw">${fmtD(g.due)}</td><td>${c.done?'مكتمل':c.past?'حان موعدها':N(c.monthly)}</td></tr>`}),['المجموع',N(G.reduce((s,g)=>s+(+g.target||0),0)),N(tot),N(G.reduce((s,g)=>s+goalCalc(g).rem,0)),'','',N(goalsSummary().plan)])+
     (tot||hb?`<p class="hint">${esc(acc.name)}: المفروض <b>${N(tot)}</b>${hb?` · رصيد البنك <b>${N(acc.balance)}</b> (${Math.abs(acc.balance-tot)<0.001?'مطابق':acc.balance>tot?'زيادة '+money(acc.balance-tot):'نقص '+money(tot-acc.balance)}) آخر تحديث ${fmtD(acc.at)}`:''}</p>`:''))}}
  if(has('trusts')){const TL=trusts().map(t=>({t,c:trustCalc(t)})).filter(x=>x.t.date<=R.to&&(x.c.rem>0||x.c.last>=R.from||x.t.date>=R.from)).sort((a,b)=>a.t.date.localeCompare(b.t.date));
    if(TL.length){const rets=[];TL.forEach(x=>(x.t.returns||[]).filter(r=>r.date>=R.from&&r.date<=R.to).forEach(r=>rets.push({n:x.t.name,date:r.date,amt:r.amt,note:r.note})));rets.sort((a,b)=>a.date.localeCompare(b.date));
      const sA=TL.reduce((s,x)=>s+x.c.amt,0),sR=TL.reduce((s,x)=>s+x.c.ret,0),sM=TL.reduce((s,x)=>s+x.c.rem,0);
      h+=sec('trusts','الأمانات (أموال الآخرين عندك)',`<p class="hint">ليست دخلًا ولا مصروفًا. المتبقي عندك الآن <b>${N(sM)}</b>.</p>`+T(['#','صاحب الأمانة','الاستلام','المبلغ','المُرجع','المتبقي','الحالة','مكانها','✓'],TL.map((x,i)=>`<tr><td class="idx">${i+1}</td><td>${esc(x.t.name)}${x.t.purpose?` <small>(${esc(x.t.purpose)})</small>`:''}</td><td class="nw">${fmtD(x.t.date)}</td><td>${N(x.c.amt)}</td><td>${N(x.c.ret)}</td><td>${N(x.c.rem)}</td><td class="${x.c.st==='done'?'ok':x.c.dd!==null&&x.c.dd<0?'no':''}">${TRUST_ST[x.c.st][0]}${x.c.dd!==null&&x.c.st!=='done'?'<br><small>موعدها '+fmtD(x.t.due)+'</small>':''}</td><td>${esc(TRUST_WHERE[x.t.where||'main'])}</td><td class="box">☐</td></tr>`),['','المجموع','',N(sA),N(sR),N(sM),'','',''])+
       (rets.length?`<h2 style="margin-top:10px">ما أرجعته في هذه الفترة</h2>`+T(['التاريخ','لمن','المبلغ','ملاحظة'],rets.map(r=>`<tr><td class="nw">${fmtD(r.date)}</td><td>${esc(r.n)}</td><td>${N(r.amt)}</td><td>${esc(r.note||'')}</td></tr>`),['المجموع','',N(rets.reduce((s,r)=>s+(+r.amt),0)),'']):''))}}
  if(has('cars')){const C=cars();if(C.length){const st=d=>d===null?'—':d<0?`<span class="no">منتهٍ منذ ${daysWord(-d)}</span>`:d<=30?`<span class="no">بعد ${daysWord(d)}</span>`:`<span class="ok">ساري</span>`;
    h+=sec('cars','السيارات والتجديدات',T(['السيارة','المالك','انتهاء التأمين','الحالة','انتهاء الملكية','الحالة'],C.map(c=>`<tr><td>${esc(c.name)}${c.plate?` <small>(${esc(c.plate)})</small>`:''}</td><td>${esc(ownerLabel(c))}</td><td class="nw">${fmtD(c.insExpiry)}</td><td>${st(daysTo(c.insExpiry))}</td><td class="nw">${fmtD(c.regExpiry)}</td><td>${st(daysTo(c.regExpiry))}</td></tr>`)))}}
  if(has('advisor')){const c=advCtx(),Pr=advPriorities(c),CL=advChecklist(c),sc=advScore(c,Pr,CL);
    h+=sec('advisor','أولويات مستشاري',`<p class="hint">صحتك المالية <b>${sc.total}/100</b> (${sc.lbl[0]}) حسب بيانات الشهر الحالي.</p>`+(Pr.length?T(['#','الأولوية','التفاصيل','✓'],Pr.map((p,i)=>`<tr><td>${i+1}</td><td><b>${p.t}</b></td><td>${p.s}</td><td class="box">☐</td></tr>`)):'<p class="okline">لا توجد أولويات عاجلة.</p>')+
     (CL.some(x=>!x.done)?`<p class="hint" style="margin-top:6px">قد تكون نسيت: ${CL.filter(x=>!x.done).map(x=>esc(x.t)).join('، ')}.</p>`:''))}
  if(has('tx')){let X=A.slice();if(o.txType!=='all')X=X.filter(t=>t.type===o.txType);if(o.txCat)X=X.filter(t=>t.cat===o.txCat);
    if(o.sort==='desc')X.reverse();else if(o.sort==='amount')X.sort((a,b)=>b.amount-a.amount);
    const run=o.running&&o.sort==='asc'&&o.txType==='all'&&!o.txCat;const rv=o.reviewCols;
    const head=['#','التاريخ','النوع','الفئة','البيان','الدفع','المبلغ'].concat(run?['الرصيد']:[]).concat(rv?['✓','ملاحظات']:[]);const cols=head.length;
    let bal=0,i=0;const row=t=>{i++;bal+=t.type==='inc'?+t.amount:-t.amount;return `<tr><td class="idx">${i}</td><td class="nw">${fmtD(t.date)}</td><td>${t.type==='inc'?'دخل':'مصروف'}</td><td>${esc(catOf(t.cat).n)}</td><td>${esc(t.note||'')}${t.person?' <small>(لـ'+esc(personName(t.person))+')</small>':''}</td><td>${esc((METHODS.find(x=>x[0]===t.method)||['',''])[1])}</td><td class="${t.type==='inc'?'ok':''}">${N(t.amount,t.type==='inc'?'+':'−')}</td>${run?`<td>${SN(bal)}</td>`:''}${rv?'<td class="box">☐</td><td class="note"></td>':''}</tr>`};
    let rows=[];
    if(o.group==='none')rows=X.map(row);
    else{const key=o.group==='day'?(t=>t.date):(t=>t.cat);const lab=o.group==='day'?(k=>{const d=new Date(k+'T12:00');return DAYS[d.getDay()]+' '+fmtD(k)}):(k=>catOf(k).n);
      const G={};const order=[];X.forEach(t=>{const k=key(t);if(!G[k]){G[k]=[];order.push(k)}G[k].push(t)});
      if(o.group==='cat')order.sort((a,b)=>sum(G[b],'exp')+sum(G[b],'inc')-sum(G[a],'exp')-sum(G[a],'inc'));
      order.forEach(k=>{const g=G[k];const gi=sum(g,'inc'),ge=sum(g,'exp');rows.push(`<tr class="grp"><td colspan="${cols}">${esc(lab(k))}<span>${g.length} ${g.length===1?'عملية':'عمليات'} · ${ge?'صرف '+money(ge):''}${gi&&ge?' · ':''}${gi?'دخل '+money(gi):''}</span></td></tr>`);g.forEach(t=>rows.push(row(t)))})}
    const fi=sum(X,'inc'),fe=sum(X,'exp');const flt=[o.txType==='inc'?'الدخل فقط':o.txType==='exp'?'المصاريف فقط':'',o.txCat?'فئة '+catOf(o.txCat).n:'',o.sort==='amount'?'مرتبة حسب المبلغ':o.sort==='desc'?'الأحدث أولًا':'',o.group==='day'?'مجمّعة حسب اليوم':o.group==='cat'?'مجمّعة حسب الفئة':''].filter(Boolean).join(' · ');
    const foot=['','','','','',`المجموع${fi&&fe?' (الصافي)':''}`,(fi&&fe?SN(fi-fe):fi?N(fi,'+'):N(fe,'−'))].concat(run?['']:[]).concat(rv?['','']:[]);
    h+=sec('tx',`العمليات (${X.length})`,(flt?`<p class="hint">${esc(flt)}</p>`:'')+(X.length?T(head,rows,foot,rv?'review':''):'<p>لا توجد عمليات بهذه الخيارات.</p>'),'txs')}
  const toc=parts.length>2?`<nav class="toc">${parts.map((p,i)=>`<span>${i+1}. ${p.title.replace(/\s*\(\d+\)$/,'')}</span>`).join('')}</nav>`:'';
  const head=`<header class="rh"><div><div class="rapp">إدارة شؤوني</div><h1>${esc(R.label)}</h1><div class="rper">الفترة: ${fmtD(R.from)} – ${fmtD(R.to)}</div></div><div class="rmeta">أُعدّ في ${fmtD(today())} الساعة ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}<br>العملة: الريال العُماني (ر.ع.)${o.secs.includes('review')||o.reviewCols?'<br>راجعه: ____________':''}</div></header>`;
  const foot=`<footer class="rf">تقرير من تطبيق «إدارة شؤوني» · ${esc(R.label)}${o.dev?`<br>تصميم وتطوير: ${DEV.name}، ${DEV.title} · ${DEV.country} · <span class="n">+968 ${DEV.phone}</span>`:''}</footer>`;
  const cls=['rep',o.font==='lg'?'fs-lg':'',o.ink==='bw'?'ink-bw':''].filter(Boolean).join(' ');
  return {title:R.label,cls,orient:o.orient,body:head+toc+(h||'<p>اختر قسمًا واحدًا على الأقل.</p>')+foot,count:parts.length,tx:A.length};
}
/* تصميم التقرير: واحد للمعاينة والطباعة والملف المحفوظ */
const PRINT_CSS=`.rep .dua{border:1px solid #D9C98F;background:#FBF7EA;border-radius:10px;padding:8px 14px;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}.rep .dua p{margin:4px 0;white-space:pre-line;font-size:1.05em}
.rep .pbar{display:inline-block;width:56px;height:7px;border-radius:4px;background:#E6EAF0;vertical-align:middle;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact}.rep .pbar i{display:block;height:100%;background:#1E7A4F}.rep .pbar.wide{width:100%}
.rep{font-family:-apple-system,"SF Arabic","Segoe UI",Tahoma,sans-serif;color:#16202E;background:#fff;direction:rtl;font-size:12px;line-height:1.55}
.rep.fs-lg{font-size:14px}
.rep .rh{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;border-bottom:3px solid #163C74;padding-bottom:10px;margin-bottom:12px}
.rep .rapp{color:#2461AE;font-weight:700;font-size:1.08em}.rep h1{margin:2px 0 0;font-size:1.8em;line-height:1.3}.rep .rper{color:#5D6878;font-size:.92em;margin-top:2px}.rep .rmeta{color:#5D6878;font-size:.92em;text-align:left;line-height:1.7}
.rep .toc{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:.92em;color:#5D6878;border:1px solid #D9DFE7;border-radius:8px;padding:6px 10px;margin-bottom:14px}
.rep section{margin-bottom:16px;break-inside:avoid}.rep section.txs{break-inside:auto}.rep h2{font-size:1.17em;margin:0 0 6px;color:#163C74;border-inline-start:4px solid #2461AE;padding-inline-start:8px}
.rep .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.rep .kpis.k2{margin-top:8px}.rep .kpis div{border:1px solid #D9DFE7;border-radius:8px;padding:8px 10px}.rep .kpis span{display:block;color:#5D6878;font-size:.92em}.rep .kpis b{font-size:1.33em}.rep .kpis small{display:block}
.rep table{width:100%;border-collapse:collapse}.rep th,.rep td{border:1px solid #D9DFE7;padding:5px 7px;text-align:right;vertical-align:top}.rep th{background:#EEF3FA;font-weight:700}
.rep tbody tr:nth-child(even) td{background:#FAFBFD}.rep tfoot td{font-weight:700;background:#F2F5F9}.rep thead{display:table-header-group}.rep tr{break-inside:avoid}
.rep tr.grp td{background:#E8EEF7!important;font-weight:700;color:#163C74}.rep tr.grp span{float:left;font-weight:400;color:#5D6878}
.rep td.idx{color:#8A94A3;width:1%;white-space:nowrap}.rep td.box{text-align:center;font-size:1.25em;width:1%}.rep table.review td.note{min-width:90px}
.rep td.barc{width:22%}.rep td.barc i{display:block;height:8px;border-radius:4px;background:#2461AE}
.rep .n{font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:isolate;white-space:nowrap}.rep .ok{color:#1C7F55}.rep .no{color:#B8423A}.rep .nw{white-space:nowrap}.rep small{color:#5D6878}
.rep .hint{margin:0 0 6px;color:#5D6878}.rep .okline{margin:0;color:#1C7F55}
.rep .rf{margin-top:18px;border-top:1px solid #D9DFE7;padding-top:6px;color:#5D6878;font-size:.85em;text-align:center}
.rep.ink-bw,.rep.ink-bw *{color:#000!important;border-color:#999!important}.rep.ink-bw th,.rep.ink-bw tfoot td,.rep.ink-bw tr.grp td,.rep.ink-bw tbody tr td{background:#fff!important}.rep.ink-bw td.barc i{background:#555!important}.rep.ink-bw h2{border-color:#000!important}`;
function prStyle(orient){let el=document.getElementById('prCss');if(!el){el=document.createElement('style');el.id='prCss';document.head.appendChild(el)}
  el.textContent=PRINT_CSS+`\n@media print{html,body{background:#fff!important;padding:0!important}body>*:not(#printArea){display:none!important}#printArea{display:block!important}@page{size:A4 ${orient==='landscape'?'landscape':'portrait'};margin:14mm 12mm}}`}
function printReport(o){const r=reportDoc(o);prStyle(r.orient);let el=document.getElementById('printArea');if(!el){el=document.createElement('div');el.id='printArea';document.body.appendChild(el)}
  el.className=r.cls;el.innerHTML=r.body;const old=document.title;document.title=r.title+' - إدارة شؤوني';
  const done=()=>{document.title=old};window.addEventListener('afterprint',done,{once:true});
  try{window.print()}catch(e){toast('تعذّرت الطباعة هنا. استخدم «حفظ كملف»')}setTimeout(done,3000)}
function saveReportFile(o){const r=reportDoc(o);const html=`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(r.title)}</title><style>${PRINT_CSS} body{margin:0;background:#fff}.rep{max-width:900px;margin:0 auto;padding:20px}@page{size:A4 ${r.orient==='landscape'?'landscape':'portrait'};margin:14mm 12mm}@media print{.rep{padding:0;max-width:none}}</style></head><body><div class="${r.cls}">${r.body}</div></body></html>`;
  const R=prRange(o||prOpts());saveFile('idarat-shuooni-report-'+R.from+'_'+R.to+'.html',html,'text/html');toast('حُفظ التقرير. افتحه في المتصفح واطبعه أو احفظه PDF')}
/* ===== تصدير Excel / Numbers (.xlsx) داخل الهاتف بدون أي مكتبة أو اتصال ===== */
const XL=(()=>{
  const enc=new TextEncoder();
  const crcT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
  const crc=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=crcT[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0};
  /* ملف ZIP بسيط (بدون ضغط) كما يتطلبه تنسيق xlsx */
  function zip(files){const parts=[],cen=[];let off=0;
    const u16=v=>[v&255,(v>>>8)&255],u32=v=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
    for(const f of files){const name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data,c=crc(data);
      const loc=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0)]);
      parts.push(loc,name,data);
      cen.push(new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),name);
      off+=loc.length+name.length+data.length}
    const cs=cen.reduce((s,p)=>s+p.length,0);
    const end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cs),...u32(off),...u16(0)]);
    const all=parts.concat(cen,[end]);const out=new Uint8Array(all.reduce((s,p)=>s+p.length,0));let i=0;for(const p of all){out.set(p,i);i+=p.length}return out}
  const x=s=>String(s).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const col=i=>{let s='';i++;while(i){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s};
  const serial=iso=>{const [y,m,d]=iso.split('-').map(Number);return (Date.UTC(y,m-1,d)-Date.UTC(1899,11,30))/864e5};
  /* الأنماط: 0 نص، 1 رأس الجدول، 2 مبلغ بكسور، 3 تاريخ، 4 نسبة، 5 عنوان، 6 مجموع بكسور، 7 وصف، 8 مبلغ صحيح، 9 مجموع صحيح، 10 نص المجموع، 11 عدد */
  const STYLES=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0.000"/><numFmt numFmtId="165" formatCode="yyyy-mm-dd"/></numFmts>
<fonts count="4"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font><font><b/><sz val="15"/><color rgb="FF1F5AA6"/><name val="Arial"/></font><font><sz val="10"/><color rgb="FF5D6878"/><name val="Arial"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDCE6F4"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF1F3F6"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFB8C2D0"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="12"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"><alignment horizontal="center"/></xf>
<xf numFmtId="9" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"><alignment horizontal="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="164" fontId="1" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="3" fontId="1" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/>
<xf numFmtId="0" fontId="1" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"><alignment horizontal="center"/></xf></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  /* خلية: الأنواع s نص، n مبلغ، i عدد، d تاريخ، p نسبة (0-1) */
  const cell=(ref,v,t,tot)=>{if(v===null||v===undefined||v==='')return tot?`<c r="${ref}" s="10"/>`:'';
    if(v&&typeof v==='object'&&'v' in v){t=v.t||t;v=v.v;if(v===null||v===undefined||v==='')return ''}
    if(t==='d'&&typeof v==='string'&&/^\d{4}-\d\d-\d\d$/.test(v))return `<c r="${ref}" s="3"><v>${serial(v)}</v></c>`;
    if((t==='n'||t==='i'||t==='p')&&typeof v==='number'&&isFinite(v)){const r=Math.round(v*1000)/1000;const s=t==='p'?4:t==='i'?11:Number.isInteger(r)?(tot?9:8):(tot?6:2);return `<c r="${ref}" s="${s}"><v>${t==='p'?v:r}</v></c>`}
    return `<c r="${ref}" t="inlineStr" s="${tot?10:0}"><is><t xml:space="preserve">${x(v)}</t></is></c>`};
  function sheetXml(sh){const head=sh.head,n=head.length,H=4;let rows='';const last=col(n-1);
    rows+=`<row r="1" ht="24" customHeight="1">${cell('A1',sh.title,'s').replace('s="0"','s="5"')}</row>`;
    if(sh.sub)rows+=`<row r="2">${cell('A2',sh.sub,'s').replace('s="0"','s="7"')}</row>`;
    rows+=`<row r="${H}" ht="30" customHeight="1">${head.map((h,i)=>`<c r="${col(i)}${H}" t="inlineStr" s="1"><is><t>${x(h[0])}</t></is></c>`).join('')}</row>`;
    sh.rows.forEach((r,k)=>{const R=H+1+k;rows+=`<row r="${R}">${r.map((v,i)=>cell(col(i)+R,v,head[i][1])).join('')}</row>`});
    const lastData=H+sh.rows.length;
    if(sh.totals&&sh.rows.length){const R=lastData+1;rows+=`<row r="${R}">${head.map((h,i)=>{const ref=col(i)+R;
      if(i===0)return `<c r="${ref}" t="inlineStr" s="10"><is><t>المجموع</t></is></c>`;
      if(sh.totals.includes(i)){const sum=Math.round(sh.rows.reduce((s,r)=>{const v=r[i]&&typeof r[i]==='object'?r[i].v:r[i];return s+(typeof v==='number'?v:0)},0)*1000)/1000;
        return `<c r="${ref}" s="${Number.isInteger(sum)?9:6}"><f>SUM(${col(i)}${H+1}:${col(i)}${lastData})</f><v>${sum}</v></c>`}
      return `<c r="${ref}" s="10"/>`}).join('')}</row>`}
    const widths=head.map(h=>h[2]||(h[1]==='s'?18:h[1]==='d'?13:12));
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews><sheetView rightToLeft="1" workbookViewId="0"${sh.first?' tabSelected="1"':''}><pane ySplit="${H}" topLeftCell="A${H+1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="18"/><cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols>
<sheetData>${rows}</sheetData>${sh.rows.length?`<autoFilter ref="A${H}:${last}${lastData}"/>`:''}${sh.dv&&sh.dv.length?`<dataValidations count="${sh.dv.length}">${sh.dv.map(([c,f])=>`<dataValidation type="list" allowBlank="1" showErrorMessage="1" errorTitle="اختر من القائمة" error="اختر قيمة من القائمة المنسدلة" sqref="${col(c)}${H+1}:${col(c)}${H+500}"><formula1>${x(f)}</formula1></dataValidation>`).join('')}</dataValidations>`:''}
<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="${n>8?'landscape':'portrait'}" fitToWidth="1" fitToHeight="0"/></worksheet>`}
  function build(sheets){sheets=sheets.filter(Boolean);sheets[0].first=true;const used={};
    sheets.forEach((s,i)=>{let nm=String(s.name).replace(/[\[\]:*?\/\\]/g,' ').slice(0,31)||'ورقة';while(used[nm])nm=(nm.slice(0,28)+' '+(i+1));used[nm]=1;s.name=nm});
    const files=[
     {name:'[Content_Types].xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`},
     {name:'_rels/.rels',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`},
     {name:'docProps/core.xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>إدارة شؤوني</dc:title><dc:creator>إدارة شؤوني</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0,19)}Z</dcterms:created></cp:coreProperties>`},
     {name:'xl/workbook.xml',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${sheets.map((s,i)=>`<sheet name="${x(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets><definedNames>${sheets.map((s,i)=>s.rows.length?`<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${x(s.name).replace(/'/g,"''")}'!$A$4:$${col(s.head.length-1)}$${4+s.rows.length}</definedName>`:'').join('')}</definedNames><calcPr calcId="0" fullCalcOnLoad="1"/></workbook>`},
     {name:'xl/_rels/workbook.xml.rels',data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`},
     {name:'xl/styles.xml',data:STYLES}].concat(sheets.map((s,i)=>({name:`xl/worksheets/sheet${i+1}.xml`,data:sheetXml(s)})));
    return zip(files)}
  return{build}})();
/* أوراق التصدير: كل قسم في ورقة مرتبة، مع فلترة وترتيب جاهز ومجاميع بالمعادلات */
const EXP_SECS=[['summary','الملخص'],['debts','الديون (الحالية، الدفعات، المنتهية)'],['monthly','الالتزامات الشهرية'],['tx','العمليات (الدخل والمصاريف)'],['plans','الخطط والادخار'],['trusts','الأمانات']];
function expRange(p){const y=S.month.slice(0,4);if(p==='year')return{from:y+'-01-01',to:y+'-12-31',label:'سنة '+y};
  if(p==='all'){const L=list().map(t=>t.date).filter(Boolean).sort();return{from:L[0]||today(),to:L[L.length-1]>today()?L[L.length-1]:today(),label:'كل الفترات'}}
  const [yy,mm]=S.month.split('-').map(Number);return{from:S.month+'-01',to:S.month+'-'+String(new Date(yy,mm,0).getDate()).padStart(2,'0'),label:monthName(S.month)}}
function expSheets(secs,period){const R=expRange(period),sub=`إدارة شؤوني · أُعدّ في ${fmtD(today())} · العملة: الريال العُماني`;const out=[];const has=k=>secs.includes(k);
  const pl=debtSim();const DS=debts(),act=DS.filter(d=>+d.balance>0.0005),done=DS.filter(d=>!(+d.balance>0.0005));const GK=Object.keys(DEBT_G);
  if(has('summary')){const A=inRange(R.from,R.to);const F=debtFree();const st=recStatus(ym(new Date()));const G=(S.settings.goals||[]).map(g=>goalCalc(g));const TR=trusts().map(trustCalc);
    out.push({name:'الملخص',title:'ملخص إدارة شؤوني',sub,head:[['البند','s',34],['القيمة','n',18],['ملاحظة','s',34]],rows:[
      ['الدخل ('+R.label+')',sum(A,'inc'),''],['المصاريف ('+R.label+')',sum(A,'exp'),''],['الصافي ('+R.label+')',r3(sum(A,'inc')-sum(A,'exp')),''],
      ['إجمالي الديون المتبقية',r3(act.reduce((s,d)=>s+(+d.balance),0)),countWord(act.length,'دين واحد','دينان','ديون','دينًا')],
      ['الأقساط الشهرية',r3(act.reduce((s,d)=>s+debtInst(d),0)),''],
      ['يوم التحرر من الديون',F&&F.date?{v:F.date,t:'d'}:'—',F&&F.left?'باقٍ '+countWord(F.left,'قسط واحد','قسطان','أقساط','قسطًا'):''],
      ['ديون انتهت',{v:done.length,t:'i'},'مجموع ما سُدّد '+money(done.reduce((s,d)=>s+((d.closed||{}).total||0),0))],
      ['الالتزامات هذا الشهر: المستحق',r3(st.total),''],['الالتزامات هذا الشهر: المدفوع',r3(st.paidAmt),'الباقي '+money(st.dueLeft)],
      ['الخطط: المدّخر',r3(G.reduce((s,c)=>s+c.sv,0)),'من '+money(G.reduce((s,c)=>s+c.tgt,0))],
      ['الأمانات المتبقية عندك',r3(TR.reduce((s,c)=>s+c.rem,0)),'ليست مالك']]})}
  if(has('debts')){
    out.push({name:'الديون',title:'الديون الحالية',sub:sub+' · استخدم أسهم الفلترة في الرأس للتصفية والترتيب',head:[['القسم','s',18],['الدين','s',22],['النوع','s',14],['الجهة / الشخص','s',16],['تاريخ البداية','d'],['المبلغ الأصلي','n'],['المسدَّد','n'],['المتبقي','n'],['نسبة السداد','p'],['القسط الشهري','n'],['الفائدة %','i'],['طريقة السداد','s',16],['أقساط متبقية','i'],['ينتهي المقرر','d'],['المدة','s',16],['مراجعة ✓','s',10]],
      rows:debtSort(act,'end',pl).sort((a,b)=>GK.indexOf(debtGroup(a))-GK.indexOf(debtGroup(b))).map(d=>{const o=Math.max(+d.original||0,+d.balance||0),e=debtEnd(d,pl),st=debtStart(d);const once=d.mode==='once';
        return [DEBT_G[debtGroup(d)][0],d.name,(DEBT_T[d.type]||DEBT_T.other)[0],d.lender||'',st,o,r3(o-(+d.balance)),+d.balance,o?(o-(+d.balance))/o:0,once?0:+d.payment||0,+d.rate||0,once?'دفعة واحدة':'أقساط شهرية',once?'':debtLeft(d),e||'',e?spanWord(st,e):'','☐']}),totals:[5,6,7,9]});
    const P=[];DS.forEach(d=>{const B=payBalances(d);debtPays(d).forEach(p=>{const q=payParts(d,p);P.push([p.date,d.name,DEBT_G[debtGroup(d)][0],+p.amt,q.int,q.prin,B.get(p),p.tx&&S.tx[p.tx]?'نعم':'لا'])})});
    P.sort((a,b)=>a[0].localeCompare(b[0]));
    out.push({name:'دفعات الديون',title:'كل دفعات الديون',sub,head:[['التاريخ','d'],['الدين','s',22],['القسم','s',18],['المبلغ','n'],['منها فائدة','n'],['من أصل الدين','n'],['المتبقي بعدها','n'],['مسجّلة كمصروف','s',12]],rows:P,totals:[3,4,5]});
    out.push({name:'الديون المنتهية',title:'سجل الديون المنتهية',sub,head:[['الدين','s',22],['القسم','s',18],['الجهة / الشخص','s',16],['من','d'],['إلى','d'],['استغرق','s',16],['طريقة التخلص منه','s',26],['عدد الدفعات','i'],['مجموع المدفوع','n'],['الفوائد','n']],
      rows:done.map(d=>{const c=d.closed||debtCloseInfo(d);return [d.name,DEBT_G[debtGroup(d)][0],d.lender||'',c.start,c.end,spanWord(c.start,c.end),CLOSE_M[c.method],c.count,c.total,c.int]}),totals:[7,8,9]})}
  if(has('monthly')){const rows=[];const cm=ym(new Date());for(let m=R.from.slice(0,7);m<=R.to.slice(0,7)&&m<=cm;m=shiftMonth(m,1))
    monthItems(m).forEach(i=>{const dates=i.kind==='rec'?recPays(i.ref).filter(t=>t.date.slice(0,7)===m).map(t=>fmtD(t.date)+': '+money(t.amount)):debtPays(i.ref).filter(p=>p.date&&p.date.slice(0,7)===m).map(p=>fmtD(p.date)+': '+money(p.amt));
      const rem=r3(Math.max(0,i.amount-(i.paidAmt||0)));rows.push([monthName(m),i.name,i.kind==='debt'?'قسط دين':catOf(i.ref.cat).n,{v:i.day,t:'i'},i.amount,i.paidAmt||0,rem,i.isPaid?'مدفوع':i.paidAmt?'مدفوع جزئيًا':'لم يُدفع',dates.join(' · ')])});
    out.push({name:'الالتزامات الشهرية',title:'الالتزامات الشهرية · '+R.label,sub,head:[['الشهر','s',14],['الالتزام','s',22],['الفئة','s',16],['يوم الدفع','i'],['المستحق','n'],['المدفوع','n'],['المتبقي','n'],['الحالة','s',13],['الدفعات','s',30]],rows,totals:[4,5,6]})}
  if(has('tx')){const A=inRange(R.from,R.to).sort((a,b)=>a.date.localeCompare(b.date)||(a.createdAt||'').localeCompare(b.createdAt||''));
    out.push({name:'العمليات',title:'العمليات · '+R.label,sub,head:[['التاريخ','d'],['النوع','s',9],['الفئة','s',16],['البيان','s',26],['طريقة الدفع','s',12],['الشخص','s',12],['الدخل','n'],['المصروف','n'],['ملاحظة','s',14]],
      rows:A.map(t=>[t.date,t.type==='inc'?'دخل':'مصروف',catOf(t.cat).n,t.note||'',(METHODS.find(m=>m[0]===t.method)||['',''])[1],t.person?personName(t.person):'',t.type==='inc'?+t.amount:'',t.type==='exp'?+t.amount:'',t.pend?'بانتظار الاعتماد':t.sample?'مثال':'']),totals:[6,7]})}
  if(has('plans')){const G=(S.settings.goals||[]).map(g=>({g,c:goalCalc(g)})).sort((a,b)=>(a.g.due||'').localeCompare(b.g.due||''));
    out.push({name:'الخطط',title:'الخطط والادخار',sub,head:[['الخطة','s',22],['المبلغ المستهدف','n'],['المدّخر','n'],['المتبقي','n'],['نسبة الإنجاز','p'],['الموعد','d'],['الأيام المتبقية','i'],['المطلوب شهريًا','n'],['الحالة','s',12]],
      rows:G.map(({g,c})=>[g.name,c.tgt,c.sv,c.rem,c.tgt?Math.min(1,c.sv/c.tgt):0,g.due||'',c.done?'':Math.max(0,c.days),c.done?0:r3(c.monthly||0),c.done?'اكتملت':c.past?'حان موعدها':'جارية']),totals:[1,2,3,7]})}
  if(has('trusts')){const TL=trusts().map(t=>({t,c:trustCalc(t)})).sort((a,b)=>a.t.date.localeCompare(b.t.date));
    out.push({name:'الأمانات',title:'الأمانات (أموال الآخرين عندك)',sub,head:[['صاحب الأمانة','s',20],['الغرض','s',18],['تاريخ الاستلام','d'],['المبلغ','n'],['المُرجع','n'],['المتبقي عندك','n'],['آخر إرجاع','d'],['موعد الإرجاع','d'],['مكانها','s',14],['الحالة','s',14]],
      rows:TL.map(({t,c})=>[t.name,t.purpose||'',t.date,c.amt,c.ret,c.rem,c.last,t.due||'',TRUST_WHERE[t.where||'main'],TRUST_ST[c.st][0]]),totals:[3,4,5]})}
  return out}
/* المشاركة على الآيفون: «فتح في Numbers» أو «حفظ في الملفات»، وإلا تنزيل */
async function shareFile(name,data,type){const f=new File([data],name,{type});
  try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:name});return 'shared'}}catch(e){if(e&&e.name==='AbortError')return 'cancel'}
  dlBlob(f,name);return 'saved'}
async function exportXlsx(secs,period){let sh=expSheets(secs,period);if(sh.length>1)sh=sh.filter(x=>x.rows.length);if(!sh.length){toast('اختر قسمًا واحدًا على الأقل');return}
  const data=XL.build(sh);const R=expRange(period);const ks=secs.filter(k=>k!=='summary');const nm='idarat-shuooni-'+(ks.length===1?ks[0]:'report')+'-'+(period==='all'?'all':R.from.slice(0,period==='year'?4:7))+'.xlsx';
  const r=await shareFile(nm,data,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  if(r!=='cancel')toast(r==='shared'?'اختر «Numbers» لفتحه وتعديله، أو «حفظ في الملفات»':'حُفظ الملف '+nm+'، افتحه في Numbers أو Excel')}
/* نافذة التصدير: Excel / Numbers أو PDF */
function openExport(only){const L=document.getElementById('layer');const o=Object.assign({secs:EXP_SECS.map(s=>s[0]),period:'month'},S.settings.expOpts||{});if(only)o.secs=[only];
  const draw=()=>{L.innerHTML=`${sheetTop('تصدير')}<h2 style="margin-top:0">تصدير وطباعة التقارير</h2>
   <div class="stack">
    <div class="field"><label>الأقسام</label><div class="prsecs">${EXP_SECS.map(([k,n])=>`<label class="toggle"><input type="checkbox" data-xs="${k}" ${o.secs.includes(k)?'checked':''}><span>${n}</span></label>`).join('')}</div></div>
    <div class="field"><label>فترة العمليات والالتزامات</label><div class="seg seg3">${[['month',esc(monthName(S.month))],['year','سنة '+S.month.slice(0,4)],['all','كل الفترات']].map(([v,n])=>`<button class="n" data-xp="${v}" aria-pressed="${o.period===v}">${n}</button>`).join('')}</div></div>
    <div class="panel expinfo"><b>📊 Excel / Numbers (.xlsx)</b><span class="note">كل قسم في ورقة مستقلة، من اليمين لليسار، مع أسهم الفلترة والترتيب في رأس كل جدول، ومجاميع بالمعادلات تتحدّث عند التعديل. على الآيفون اختر «Numbers» من قائمة المشاركة.</span>
     <button class="btn block" id="xGo">تصدير Excel / Numbers</button></div>
    <div class="panel expinfo"><b>📄 PDF للطباعة والمراجعة</b><span class="note">تقرير مرتب بجداول واضحة وعمود ☐ للمراجعة. من نافذة الطباعة اختر «مشاركة» ثم «حفظ في الملفات» ليصبح PDF.</span>
     <button class="btn ghost block" id="xPdf">طباعة / حفظ PDF</button></div>
    <p class="note" id="xErr" hidden style="color:var(--exp);margin:0"></p>
   </div><div class="actions"><button class="btn ghost block" data-close>إغلاق</button></div></div></div>`};
  const save=()=>{if(!only){S.settings.expOpts={secs:o.secs.slice(),period:o.period};putSettings()}};
  draw();L.oninput=null;
  L.onchange=e=>{const t=e.target;if(t.dataset.xs){o.secs=EXP_SECS.map(s=>s[0]).filter(k=>k===t.dataset.xs?t.checked:o.secs.includes(k));save()}};
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.xp){o.period=x.dataset.xp;save();draw();return}
    const err=m=>{const el=document.getElementById('xErr');el.hidden=!m;el.textContent=m||''};
    if(!o.secs.length){err('اختر قسمًا واحدًا على الأقل');return}
    if(x.id==='xGo'){x.disabled=true;x.textContent='جارٍ تجهيز الملف…';try{await exportXlsx(['summary'].concat(o.secs.filter(k=>k!=='summary')).filter(k=>o.secs.includes(k)),o.period)}catch(er){err('تعذّر إنشاء الملف')}x.disabled=false;x.textContent='تصدير Excel / Numbers';return}
    if(x.id==='xPdf'){if(o.secs.length===1&&o.secs[0]==='debts'){printDebtsAll();return}
      const map={summary:['summary'],debts:['debts'],monthly:['monthly'],tx:['tx'],plans:['plans'],trusts:['trusts']};const po=prOpts();const R=expRange(o.period);
      po.secs=[].concat(...o.secs.map(k=>map[k]||[]));po.period=o.period==='all'?'range':o.period;if(o.period==='all'){po.from=R.from;po.to=R.to}printReport(po)}}}
/* تقرير الديون الكامل للطباعة أو PDF: لمراجعة الانتهاء من الديون أولًا بأول */
function printDebtsAll(){const DS=debts();if(!DS.length){toast('لا توجد ديون');return}const now=new Date();const N=v=>`<span class="n">${money(v)}</span>`;
  const pl=debtSim(),F=debtFree();const act=DS.filter(d=>+d.balance>0.0005),done=DS.filter(d=>!(+d.balance>0.0005));
  const O=act.reduce((s,d)=>s+Math.max(+d.original||0,+d.balance||0),0),Rm=act.reduce((s,d)=>s+(+d.balance),0);
  const T=(head,rows,foot)=>`<table><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody>${foot?`<tfoot><tr>${foot.map(f=>`<td>${f}</td>`).join('')}</tr></tfoot>`:''}</table>`;
  const bar=p=>`<span class="pbar"><i style="width:${Math.round(p)}%"></i></span> ${Math.round(p)}%`;
  let body=`<header class="rh"><div><div class="rapp">إدارة شؤوني</div><h1>تقرير الديون</h1><div class="rper">${countWord(act.length,'دين قائم','دينان قائمان','ديون قائمة','دينًا قائمًا')}${done.length?' · '+countWord(done.length,'دين منتهٍ','دينان منتهيان','ديون منتهية','دينًا منتهيًا'):''}</div></div><div class="rmeta">أُعدّ في ${fmtD(today())} الساعة ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}<br>العملة: الريال العُماني (ر.ع.)<br>راجعه: ____________</div></header>
   ${debtNoteParts().length?`<section class="dua">${debtNoteParts().map(p=>`<p>${esc(p)}</p>`).join('')}</section>`:''}<section><h2>الملخص</h2><div class="kpis"><div><span>المتبقي من الديون</span><b class="no">${N(Rm)}</b></div><div><span>من أصل</span><b>${N(O)}</b></div><div><span>نسبة ما سدّدته</span><b class="ok">${O?Math.round((O-Rm)/O*100):100}%</b></div><div><span>الأقساط الشهرية</span><b>${N(act.reduce((s,d)=>s+debtInst(d),0))}</b></div>
    ${F&&!F.stuck?`<div><span>يوم التحرر من الديون</span><b>${fmtD(F.date)}</b></div><div><span>الأقساط الباقية</span><b>${F.left||'—'}</b></div><div><span>الأيام الباقية</span><b>${F.days}</b></div>`:''}${done.length?`<div><span>ديون انتهت</span><b class="ok">${done.length}</b></div>`:''}</div></section>`;
  Object.entries(DEBT_G).forEach(([k,g])=>{const L=debtSort(act.filter(d=>debtGroup(d)===k),'end',pl);if(!L.length)return;
    body+=`<section><h2>${g[0]}</h2>`+T(['#','الدين','الجهة / الشخص','بدأ','الأصلي','المتبقي','التقدّم','القسط','باقٍ','ينتهي المقرر','المدة','✓'],L.map((d,i)=>{const o=Math.max(+d.original||0,+d.balance||0),e=debtEnd(d,pl),st=debtStart(d),n=debtLeft(d);
      return `<tr><td class="idx">${i+1}</td><td>${esc(d.name)}${+d.rate?` <small>(${d.rate}%)</small>`:''}</td><td>${esc(d.lender||'—')}</td><td class="nw">${fmtD(st)}</td><td>${N(o)}</td><td>${N(d.balance)}</td><td class="nw">${bar(o?(o-(+d.balance))/o*100:0)}</td><td>${d.mode==='once'?'دفعة واحدة':N(d.payment)}</td><td>${d.mode==='once'?'—':n||'—'}</td><td class="nw">${e?fmtD(e):'—'}</td><td>${e?spanWord(st,e):'—'}</td><td class="box">☐</td></tr>`}),
      ['','المجموع','','',N(L.reduce((s,d)=>s+Math.max(+d.original||0,+d.balance||0),0)),N(L.reduce((s,d)=>s+(+d.balance),0)),'',N(L.reduce((s,d)=>s+debtInst(d),0)),'','','',''])+`</section>`});
  const ms=[];for(let k=11;k>=0;k--)ms.push(shiftMonth(ym(now),-k));const byM=ms.map(m=>({m,v:DS.reduce((s,d)=>s+debtPays(d).filter(p=>p.date&&p.date.slice(0,7)===m).reduce((a,p)=>a+(+p.amt||0),0),0)})).filter(x=>x.v>0);
  if(byM.length){const mx=Math.max(...byM.map(x=>x.v));body+=`<section><h2>ما سدّدته شهرًا بشهر</h2>`+T(['الشهر','المسدَّد',''],byM.map(x=>`<tr><td class="nw">${esc(monthName(x.m))}</td><td>${N(x.v)}</td><td style="width:55%"><span class="pbar wide"><i style="width:${Math.round(x.v/mx*100)}%"></i></span></td></tr>`),['المجموع',N(byM.reduce((s,x)=>s+x.v,0)),''])+`</section>`}
  if(done.length)body+=`<section><h2>سجل الديون المنتهية</h2>`+T(['#','الدين','القسم','من','إلى','استغرق','طريقة التخلص منه','الدفعات','مجموع المدفوع'],done.map((d,i)=>{const c=d.closed||debtCloseInfo(d);return `<tr><td class="idx">${i+1}</td><td>${esc(d.name)}</td><td>${DEBT_G[debtGroup(d)][0]}</td><td class="nw">${fmtD(c.start)}</td><td class="nw">${fmtD(c.end)}</td><td>${spanWord(c.start,c.end)}</td><td>${CLOSE_M[c.method]}</td><td>${c.count}</td><td>${N(c.total)}</td></tr>`}),['','المجموع','','','','','','',N(done.reduce((s,d)=>s+((d.closed||{}).total||0),0))])+`</section>`;
  body+=`<footer class="rf">تقرير من تطبيق «إدارة شؤوني»${S.settings.printDev===false?'':`<br>تصميم وتطوير: ${DEV.name}، ${DEV.title} · ${DEV.country}`}</footer>`;
  prStyle('landscape');let el=document.getElementById('printArea');if(!el){el=document.createElement('div');el.id='printArea';document.body.appendChild(el)}
  el.className='rep';el.innerHTML=body;const old=document.title;document.title='تقرير الديون - إدارة شؤوني';window.addEventListener('afterprint',()=>{document.title=old},{once:true});
  try{window.print()}catch(e){toast('تعذّرت الطباعة هنا')}setTimeout(()=>{document.title=old},3000)}
/* نافذة خيارات الطباعة مع المعاينة */
function openPrintSheet(preset){const L=document.getElementById('layer');const o=prOpts();
  if(S.rmode==='year'&&o.period!=='range')o.period='year';else if(o.period==='year'&&S.rmode!=='year')o.period='month';
  if(preset&&PR_PRESETS[preset]){o.preset=preset;o.secs=PR_PRESETS[preset].slice();if(preset==='review'){o.reviewCols=true;o.group='day'}}
  if(!o.from){o.from=S.month+'-01';o.to=today()}
  let preview=false;
  const save=()=>{const k=Object.assign({},o);delete k.dev;S.settings.printOpts=k;S.settings.printDev=o.dev;putSettings()};
  const seg=(name,val,opts)=>`<div class="seg${opts.length===3?' seg3':''}">${opts.map(([v,n])=>`<button class="n" data-pr="${name}" data-v="${v}" aria-pressed="${val===v}">${n}</button>`).join('')}</div>`;
  const sel=(id,val,opts)=>`<select class="inp" id="${id}">${opts.map(([v,n])=>`<option value="${v}" ${val===v?'selected':''}>${n}</option>`).join('')}</select>`;
  const draw=()=>{const r=reportDoc(o);const R=prRange(o);
   L.innerHTML=`${sheetTop('خيارات الطباعة')}
    <h2 style="margin-top:0">طباعة التقرير</h2>
    <div class="stack">
     <div class="field"><label>الفترة</label>${seg('period',o.period,[['month','شهر'],['year','سنة'],['range','فترة محددة']])}</div>
     ${o.period==='range'?`<div class="row2"><div class="field"><label for="prFrom">من</label><input class="inp" type="date" id="prFrom" value="${esc(o.from)}"></div><div class="field"><label for="prTo">إلى</label><input class="inp" type="date" id="prTo" value="${esc(o.to)}"></div></div>`
      :`<div class="prnav"><button class="iconbtn" data-prm="1" aria-label="التالي">›</button><b>${o.period==='year'?S.month.slice(0,4):esc(monthName(S.month))}</b><button class="iconbtn" data-prm="-1" aria-label="السابق">‹</button></div>`}
     <div class="field"><label>نوع التقرير</label><div class="chips">${Object.entries(PR_PRESET_N).map(([k,n])=>`<button class="chip" data-prp="${k}" aria-pressed="${o.preset===k}">${n}</button>`).join('')}</div></div>
     <div class="field"><label>الأقسام</label><div class="prsecs">${PR_SECTIONS.map(([k,n])=>`<label class="toggle"><input type="checkbox" data-prs="${k}" ${o.secs.includes(k)?'checked':''}><span>${n}</span></label>`).join('')}</div></div>
     ${o.secs.includes('tx')?`<div class="panel stack prtx"><b>قائمة العمليات</b>
      <div class="row2"><div class="field"><label for="prType">النوع</label>${sel('prType',o.txType,[['all','الكل'],['exp','المصاريف فقط'],['inc','الدخل فقط']])}</div>
      <div class="field"><label for="prCat">الفئة</label>${sel('prCat',o.txCat,[['','كل الفئات']].concat(EXP_CATS.concat(INC_CATS).map(c=>[c.id,c.n])))}</div></div>
      <div class="row2"><div class="field"><label for="prSort">الترتيب</label>${sel('prSort',o.sort,[['asc','التاريخ: الأقدم أولًا'],['desc','التاريخ: الأحدث أولًا'],['amount','المبلغ: الأكبر أولًا']])}</div>
      <div class="field"><label for="prGroup">التجميع</label>${sel('prGroup',o.group,[['none','بدون'],['day','حسب اليوم'],['cat','حسب الفئة']])}</div></div>
      <label class="toggle"><input type="checkbox" id="prRun" ${o.running?'checked':''}><span>عمود الرصيد التراكمي${o.sort!=='asc'||o.txType!=='all'||o.txCat?' (مع الترتيب من الأقدم وكل العمليات فقط)':''}</span></label>
      <label class="toggle"><input type="checkbox" id="prRev" ${o.reviewCols?'checked':''}><span>عمود ☐ للمراجعة وعمود فارغ للملاحظات</span></label></div>`:''}
     <div class="field"><label>شكل الصفحة</label>
      ${seg('font',o.font,[['normal','خط عادي'],['lg','خط كبير']])}
      <div style="height:6px"></div>${seg('orient',o.orient,[['portrait','عمودي'],['landscape','أفقي']])}
      <div style="height:6px"></div>${seg('ink',o.ink,[['color','بالألوان'],['bw','أبيض وأسود']])}</div>
     <label class="toggle"><input type="checkbox" id="prDev" ${o.dev?'checked':''}><span>إظهار بيانات المطوّر في التقرير</span></label>
     <div class="note" id="prInfo">${esc(R.label)} · ${countWord(r.count,'قسم واحد','قسمان','أقسام','قسمًا')} · ${countWord(r.tx,'عملية واحدة','عمليتان','عمليات','عملية')}</div>
     ${preview?`<div class="paperwrap" id="prPrev"><div class="${r.cls} paper">${r.body}</div></div>`:''}
    </div>
    <div class="actions"><div class="row2"><button class="btn" id="prPrint">طباعة / PDF</button><button class="btn ghost" id="prPreview">${preview?'إخفاء المعاينة':'معاينة'}</button></div><div class="row2"><button class="btn ghost" id="prFile">حفظ كملف</button><button class="btn ghost" data-close>إغلاق</button></div></div></div></div>`;
   if(preview)fitPaper()};
  const fitPaper=()=>{const w=document.getElementById('prPrev');if(!w)return;const p=w.firstElementChild;const z=Math.min(1,(w.clientWidth-20)/(o.orient==='landscape'?1040:740));p.style.width=(o.orient==='landscape'?1040:740)+'px';p.style.zoom=z};
  const upd=()=>{save();const y=L.querySelector('.sheet')?.scrollTop||0;draw();const s=L.querySelector('.sheet');if(s)s.scrollTop=y};
  prStyle(o.orient);draw();
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.pr){o[x.dataset.pr]=x.dataset.v;upd();return}
    if(x.dataset.prm){S.month=shiftMonth(S.month,(o.period==='year'?12:1)*+x.dataset.prm);render();upd();return}
    if(x.dataset.prp){o.preset=x.dataset.prp;if(PR_PRESETS[o.preset])o.secs=PR_PRESETS[o.preset].slice();if(o.preset==='review'){o.reviewCols=true;if(o.group==='none')o.group='day'}upd();return}
    if(x.id==='prPreview'){preview=!preview;upd();if(preview)setTimeout(()=>document.getElementById('prPrev')?.scrollIntoView({block:'start',behavior:'smooth'}),30);return}
    if(x.id==='prPrint'){save();printReport(o);return}
    if(x.id==='prFile'){save();saveReportFile(o);return}};
  L.onchange=e=>{const t=e.target;
    if(t.dataset.prs){o.secs=PR_SECTIONS.map(s=>s[0]).filter(k=>k===t.dataset.prs?t.checked:o.secs.includes(k));o.preset=Object.keys(PR_PRESETS).find(k=>PR_PRESETS[k].length===o.secs.length&&PR_PRESETS[k].every(s=>o.secs.includes(s)))||'custom';upd();return}
    const map={prFrom:'from',prTo:'to',prType:'txType',prCat:'txCat',prSort:'sort',prGroup:'group'};
    if(map[t.id]){o[map[t.id]]=t.value;upd();return}
    if(t.id==='prRun'){o.running=t.checked;upd();return}
    if(t.id==='prRev'){o.reviewCols=t.checked;upd();return}
    if(t.id==='prDev'){o.dev=t.checked;upd();return}};
  L.oninput=null}
/* طباعة سريعة بآخر خيارات حفظتها، لنفس الشهر أو السنة المعروضة */
function quickPrint(){const o=prOpts();if(o.period!=='range')o.period=S.rmode==='year'?'year':'month';printReport(o)}

/* ---------- 27. ويدجت الآيفون والماك ---------- */
/* iOS لا يسمح لتطبيقات الويب بإنشاء ويدجت، لذلك يعرضها تطبيق Scriptable المجاني من ملف صغير تحفظه أنت في iCloud Drive.
 * الملف فيه أرقام ملخصة فقط (بلا تفاصيل العمليات)، ولا يتصل الويدجت بالإنترنت. */
/* نص سكربت الويدجت (مصدره ملفا widget/ ويُدمج هنا ليبقى التطبيق ملفًا واحدًا) */
const WIDGET_SRC={ios:"// إدارة شؤوني - ويدجت الآيفون (ويظهر أيضًا على سطح مكتب الماك)\n// يقرأ ملف idarat-widget.json من مجلد Scriptable في iCloud Drive فقط. لا يتصل بالإنترنت ولا يرسل أي بيانات.\n// المطوّر: ماجد الرميمي - سلطنة عُمان\nconst FILE = 'idarat-widget.json';\nconst APP_URL = '__APP_URL__';\n// اتجاه الواجهة: إذا كانت لغة الآيفون عربية يقلب iOS ترتيب العناصر تلقائيًا، فنراعي ذلك.\n// لو ظهر الترتيب معكوسًا عندك غيّر null إلى true أو false.\nconst FORCE_MIRROR = null;\nconst MIRROR = FORCE_MIRROR !== null ? FORCE_MIRROR : /^(ar|he|fa|ur)/i.test((Device.language && Device.language()) || '');\n\nconst C = {\n  bgA: new Color('#163C74'), bgB: new Color('#1F5AA6'), fg: Color.white(), dim: new Color('#FFFFFF', 0.72),\n  faint: new Color('#FFFFFF', 0.18), good: new Color('#7EE0B0'), bad: new Color('#FFB4AB'), warn: new Color('#FFD58A')\n};\nconst fm = FileManager.iCloud();\n\nasync function load() {\n  const p = fm.joinPath(fm.documentsDirectory(), FILE);\n  if (!fm.fileExists(p)) return null;\n  try { if (!fm.isFileDownloaded(p)) await fm.downloadFileFromiCloud(p); } catch (e) {}\n  try { return JSON.parse(fm.readString(p)); } catch (e) { return null; }\n}\n\nfunction num(v, D) {\n  if (D && D.privacy) return '•••';\n  const n = Math.abs(Number(v) || 0);\n  const s = n.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });\n  return (Number(v) < 0 ? '−' : '') + s;\n}\nfunction ago(iso) {\n  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));\n  if (m < 1) return 'الآن';\n  if (m < 60) return 'قبل ' + m + ' د';\n  const h = Math.round(m / 60);\n  if (h < 24) return 'قبل ' + h + ' س';\n  return 'قبل ' + Math.round(h / 24) + ' يوم';\n}\nfunction bar(pct, w, h, color) {\n  const dc = new DrawContext(); dc.size = new Size(w, h); dc.opaque = false; dc.respectScreenScale = true;\n  const r = h / 2;\n  let p = new Path(); p.addRoundedRect(new Rect(0, 0, w, h), r, r); dc.addPath(p); dc.setFillColor(C.faint); dc.fillPath();\n  const fw = Math.max(0, Math.min(1, pct / 100)) * w;\n  if (fw > 0) { // يبدأ الشريط من اليمين\n    p = new Path(); p.addRoundedRect(new Rect(w - Math.max(fw, h), 0, Math.max(fw, h), h), r, r); dc.addPath(p); dc.setFillColor(color || C.good); dc.fillPath();\n  }\n  return dc.getImage();\n}\nfunction txt(st, s, size, opts) {\n  opts = opts || {};\n  const t = st.addText(String(s));\n  t.font = opts.bold ? Font.boldSystemFont(size) : opts.semi ? Font.semiboldSystemFont(size) : Font.systemFont(size);\n  t.textColor = opts.color || C.fg; t.lineLimit = opts.lines || 1; t.minimumScaleFactor = 0.6;\n  if (opts.center) t.centerAlignText(); else t.rightAlignText();\n  return t;\n}\n// صف من اليمين لليسار: العنوان يمينًا والقيمة يسارًا\nfunction row(parent, label, value, size, valColor) {\n  const r = parent.addStack(); r.layoutHorizontally(); r.centerAlignContent();\n  const v = () => txt(r, value, size, { semi: true, color: valColor }), l = () => txt(r, label, size - 1, { color: C.dim });\n  if (MIRROR) { l(); r.addSpacer(); v(); } else { v(); r.addSpacer(); l(); }\n  return r;\n}\n// يضيف عناصر صف أفقي بحيث يظهر الأول يمينًا دائمًا\nfunction hrow(parent, items) { const r = parent.addStack(); r.layoutHorizontally(); r.centerAlignContent(); (MIRROR ? items : items.slice().reverse()).forEach(f => f(r)); return r; }\nfunction rightBlock(parent) { const s = parent.addStack(); s.layoutVertically(); return s; }\nfunction alignRight(parent, build) { const r = parent.addStack(); r.layoutHorizontally(); if (!MIRROR) r.addSpacer(); const inner = r.addStack(); inner.layoutVertically(); build(inner); if (MIRROR) r.addSpacer(); return inner; }\n\nfunction live(D) {\n  const now = new Date();\n  if (D.pay && D.pay.next) { // الفترة حتى الراتب القادم\n    const t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);\n    const left = Math.round((new Date(D.pay.next + 'T12:00') - t) / 86400000);\n    return { same: left > 0, daily: left > 0 ? Math.max(0, D.m.spendable) / left : null, daysLeft: left, pay: true };\n  }\n  const ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');\n  const same = D.month === ym;\n  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();\n  const left = dim - now.getDate() + 1;\n  const daily = same ? Math.max(0, D.m.spendable) / left : null;\n  return { same, daily, daysLeft: left };\n}\n\nfunction header(w, D, L) {\n  hrow(w, [h => txt(h, 'إدارة شؤوني', 11, { bold: true }), h => h.addSpacer(), h => txt(h, D ? (L.same ? (L.pay ? 'الراتب بعد ' + L.daysLeft + ' يوم' : D.monthName) : (L.pay ? 'نزل الراتب، حدّث البيانات' : 'بيانات ' + D.monthName)) : '', 10, { color: L && !L.same ? C.warn : C.dim })]);\n}\n\nfunction smallBody(st, D, L, big) {\n  alignRight(st, b => {\n    txt(b, 'المتبقي هذا الشهر', 10, { color: C.dim });\n    txt(b, num(D.m.left, D), big ? 26 : 22, { bold: true, color: D.m.left < 0 ? C.bad : C.fg });\n    txt(b, D.cur, 9, { color: C.dim });\n  });\n  st.addSpacer(4);\n  if (L.daily !== null) row(st, 'المتاح يوميًا', num(L.daily, D), 11, C.good);\n  else row(st, 'المتاح يوميًا', '—', 11);\n  st.addSpacer(4);\n  const used = D.m.budget ? D.m.budgetPct : (D.m.inc ? Math.round(D.m.exp / D.m.inc * 100) : 0);\n  const lbl = D.m.budget ? 'صرفت ' + used + '% من السقف' : (D.m.inc ? 'صرفت ' + used + '% من الدخل' : 'لا دخل مسجّل');\n  st.addImage(bar(used, 140, 6, used > 100 ? C.bad : used > 85 ? C.warn : C.good)).imageSize = new Size(140, 6);\n  st.addSpacer(2);\n  txt(st, lbl, 9, { color: C.dim });\n}\n\nfunction mediumSide(st, D) {\n  row(st, 'الدخل', num(D.m.inc, D), 11, C.good);\n  st.addSpacer(2);\n  row(st, 'المصاريف', num(D.m.exp, D), 11, C.bad);\n  st.addSpacer(6);\n  if (D.plans && D.plans.count) {\n    row(st, 'خططي', D.plans.pct + '%', 11);\n    st.addSpacer(2);\n    st.addImage(bar(D.plans.pct, 130, 5, C.good)).imageSize = new Size(130, 5);\n    st.addSpacer(2);\n    txt(st, 'متبقٍ ' + num(D.plans.remaining, D), 9, { color: C.dim });\n  }\n  st.addSpacer(6);\n  if (D.next && D.next.length) {\n    const n = D.next[0];\n    txt(st, 'التالي: ' + n.t, 10, { semi: true, color: n.late ? C.bad : C.warn, lines: 1 });\n    txt(st, n.when, 9, { color: C.dim });\n  }\n}\n\nfunction largeExtra(w, D) {\n  w.addSpacer(8);\n  const cell = (label, v, col) => y => { const s = y.addStack(); s.layoutVertically(); txt(s, label, 9, { color: C.dim }); txt(s, v, 12, { bold: true, color: col }); };\n  const y = hrow(w, [cell('دخل السنة', num(D.y.inc, D)), y => y.addSpacer(), cell('صرف السنة', num(D.y.exp, D)), y => y.addSpacer(), cell('صافي ' + D.y.year, num(D.y.net, D), D.y.net < 0 ? C.bad : C.good)]);\n  y.backgroundColor = C.faint; y.cornerRadius = 10; y.setPadding(6, 8, 6, 8);\n  if (D.plans && D.plans.list && D.plans.list.length) {\n    w.addSpacer(8);\n    txt(w, 'الخطط', 11, { bold: true });\n    D.plans.list.slice(0, 3).forEach(p => {\n      w.addSpacer(3);\n      row(w, p.n + (p.days != null && !p.done ? ' · ⏳ ' + p.days + ' يوم' : ''), p.done ? 'اكتملت' : 'متبقٍ ' + num(p.rem, D), 10, p.done ? C.good : C.fg);\n      w.addSpacer(2);\n      hrow(w, [b => { b.addImage(bar(p.pct, 290, 4, C.good)).imageSize = new Size(290, 4); }, b => b.addSpacer()]);\n    });\n  }\n  if (D.debts && D.debts.left) {\n    w.addSpacer(8);\n    row(w, 'التحرر من الديون · باقٍ ' + D.debts.left + ' قسط', D.debts.free ? D.debts.free.split('-').reverse().join('/') : '', 10, C.fg);\n  }\n  if (D.pri && D.pri.length) {\n    w.addSpacer(8);\n    row(w, 'أولوياتي', D.score ? 'صحتك المالية ' + D.score.v + '/100' : '', 11, C.dim);\n    D.pri.slice(0, 3).forEach((p, i) => { w.addSpacer(2); txt(w, (i + 1) + '. ' + p, 10, { lines: 1 }); });\n  }\n}\n\nfunction accessory(w, D, L, fam) {\n  if (fam === 'accessoryInline') { txt(w, D ? 'يوميًا ' + (L.daily !== null ? num(L.daily, D) : '—') + ' ' + D.cur : 'إدارة شؤوني', 12); return; }\n  if (!D) { txt(w, 'إدارة شؤوني', 12, { bold: true }); return; }\n  if (fam === 'accessoryCircular') {\n    const pct = D.m.budget ? Math.max(0, 100 - D.m.budgetPct) : (D.plans ? D.plans.pct : 0);\n    txt(w, pct + '%', 14, { bold: true, center: true });\n    txt(w, D.m.budget ? 'متبقٍ' : 'خططي', 9, { center: true }); return;\n  }\n  txt(w, 'المتبقي ' + num(D.m.left, D), 13, { bold: true });\n  txt(w, 'يوميًا ' + (L.daily !== null ? num(L.daily, D) : '—'), 12);\n  if (D.next && D.next[0]) txt(w, D.next[0].t, 11);\n}\n\nasync function build() {\n  const D = await load();\n  const fam = config.widgetFamily || 'large';\n  const w = new ListWidget();\n  w.url = APP_URL;\n  w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);\n  const L = D ? live(D) : null;\n  if (fam.startsWith('accessory')) { accessory(w, D, L, fam); return w; }\n  const g = new LinearGradient(); g.colors = [C.bgB, C.bgA]; g.locations = [0, 1]; g.startPoint = new Point(1, 0); g.endPoint = new Point(0, 1);\n  w.backgroundGradient = g;\n  w.setPadding(12, 14, 12, 14);\n  header(w, D, L);\n  w.addSpacer(6);\n  if (!D) {\n    txt(w, 'لا توجد بيانات بعد', 13, { bold: true });\n    w.addSpacer(4);\n    txt(w, 'افتح «إدارة شؤوني» ← التقارير ← ويدجت الآيفون والماك، ثم «تحديث بيانات الويدجت» واحفظ الملف في مجلد Scriptable.', 10, { color: C.dim, lines: 5 });\n    return w;\n  }\n  if (fam === 'small') {\n    smallBody(w, D, L, false);\n  } else {\n    const body = hrow(w, [\n      b => { const main = b.addStack(); main.layoutVertically(); smallBody(main, D, L, true); },\n      b => b.addSpacer(12),\n      b => { const side = b.addStack(); side.layoutVertically(); side.size = new Size(140, 0); mediumSide(side, D); }]);\n    body.topAlignContent();\n    if (fam === 'large' || fam === 'extraLarge') largeExtra(w, D);\n  }\n  w.addSpacer();\n  hrow(w, [f => txt(f, 'حُدّث ' + ago(D.at), 8, { color: L.same ? C.dim : C.warn }), f => f.addSpacer(), f => txt(f, D.privacy ? 'المبالغ مخفية' : '', 8, { color: C.dim })]);\n  return w;\n}\n\nconst widget = await build();\nif (config.runsInWidget) Script.setWidget(widget);\nelse await widget.presentLarge();\nScript.complete();\n",mac:"// إدارة شؤوني - ويدجت سطح مكتب الماك (لتطبيق Übersicht المجاني)\n// يقرأ نفس ملف idarat-widget.json من مجلد Scriptable في iCloud Drive. لا يتصل بالإنترنت.\n// المطوّر: ماجد الرميمي - سلطنة عُمان\nimport { css } from 'uebersicht';\n\nexport const command = `cat \"$HOME/Library/Mobile Documents/iCloud~dk~simonbs~Scriptable/Documents/idarat-widget.json\" 2>/dev/null || cat \"$HOME/Library/Mobile Documents/com~apple~CloudDocs/idarat-widget.json\" 2>/dev/null`;\nexport const refreshFrequency = 5 * 60 * 1000;\n\n// مكان الويدجت على الشاشة: غيّر top و right كما تحب\nexport const className = `\n  top: 40px; right: 40px; width: 340px; direction: rtl;\n  font-family: -apple-system, \"SF Arabic\", \"Geeza Pro\", sans-serif; color: #fff;\n  background: linear-gradient(135deg, #1F5AA6, #163C74); border-radius: 20px; padding: 16px 18px;\n  box-shadow: 0 12px 30px rgba(0,0,0,.25); -webkit-font-smoothing: antialiased;\n`;\n\nconst dim = css`color: rgba(255,255,255,.72); font-size: 11px;`;\nconst rowC = css`display: flex; justify-content: space-between; align-items: baseline; margin-top: 4px; font-size: 13px;`;\nconst barC = css`height: 6px; border-radius: 3px; background: rgba(255,255,255,.18); overflow: hidden; margin-top: 4px;`;\nconst fill = (p, c) => ({ width: Math.max(0, Math.min(100, p)) + '%', height: '100%', background: c || '#7EE0B0', borderRadius: 3, marginInlineStart: 0 });\nconst box = css`background: rgba(255,255,255,.12); border-radius: 12px; padding: 8px 10px; margin-top: 10px;`;\n\nconst num = (v, D) => D.privacy ? '•••' : ((v < 0 ? '−' : '') + Math.abs(Number(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }));\nconst ago = iso => { const m = Math.round((Date.now() - new Date(iso)) / 60000); return m < 1 ? 'الآن' : m < 60 ? `قبل ${m} د` : m < 1440 ? `قبل ${Math.round(m / 60)} س` : `قبل ${Math.round(m / 1440)} يوم`; };\n\nexport const render = ({ output }) => {\n  let D = null; try { D = JSON.parse(output); } catch (e) {}\n  if (!D) return (<div><b>إدارة شؤوني</b><div className={dim} style={{ marginTop: 6, lineHeight: 1.6 }}>لا توجد بيانات بعد. من التطبيق: التقارير ← ويدجت الآيفون والماك ← «تحديث بيانات الويدجت»، واحفظ الملف في مجلد Scriptable في iCloud Drive.</div></div>);\n  const now = new Date(); const ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');\n  const dimM = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();\n  const payLeft = D.pay && D.pay.next ? Math.round((new Date(D.pay.next + 'T12:00') - new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)) / 864e5) : null;\n  const same = payLeft !== null ? payLeft > 0 : D.month === ym;\n  const daily = same ? Math.max(0, D.m.spendable) / (payLeft !== null ? payLeft : (dimM - now.getDate() + 1)) : null;\n  const used = D.m.budget ? D.m.budgetPct : (D.m.inc ? Math.round(D.m.exp / D.m.inc * 100) : 0);\n  return (\n    <div>\n      <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>إدارة شؤوني</b><span className={dim} style={{ color: same ? undefined : '#FFD58A' }}>{same ? (payLeft !== null ? `الراتب بعد ${payLeft} يوم` : D.monthName) : (payLeft !== null ? 'نزل الراتب، حدّث البيانات' : 'بيانات ' + D.monthName)}</span></div>\n      <div className={dim} style={{ marginTop: 8 }}>المتبقي هذا الشهر</div>\n      <div style={{ fontSize: 30, fontWeight: 700, color: D.m.left < 0 ? '#FFB4AB' : '#fff' }}>{num(D.m.left, D)} <span style={{ fontSize: 13, fontWeight: 400 }}>{D.cur}</span></div>\n      <div className={rowC}><span>المتاح يوميًا</span><b style={{ color: '#7EE0B0' }}>{daily === null ? '—' : num(daily, D)}</b></div>\n      <div className={barC}><div style={fill(used, used > 100 ? '#FFB4AB' : used > 85 ? '#FFD58A' : '#7EE0B0')} /></div>\n      <div className={dim}>{D.m.budget ? `صرفت ${used}% من السقف` : D.m.inc ? `صرفت ${used}% من الدخل` : 'لا دخل مسجّل'}</div>\n      <div className={rowC}><span>الدخل</span><b>{num(D.m.inc, D)}</b></div>\n      <div className={rowC}><span>المصاريف</span><b>{num(D.m.exp, D)}</b></div>\n      <div className={box} style={{ display: 'flex', justifyContent: 'space-between' }}>\n        <div><div className={dim}>دخل {D.y.year}</div><b>{num(D.y.inc, D)}</b></div>\n        <div><div className={dim}>صرف السنة</div><b>{num(D.y.exp, D)}</b></div>\n        <div><div className={dim}>الصافي</div><b style={{ color: D.y.net < 0 ? '#FFB4AB' : '#7EE0B0' }}>{num(D.y.net, D)}</b></div>\n      </div>\n      {D.plans && D.plans.count ? (<div className={box}>\n        <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>خططي {D.plans.pct}%</b><span className={dim}>متبقٍ {num(D.plans.remaining, D)}</span></div>\n        {D.plans.list.slice(0, 3).map(p => (<div key={p.n} style={{ marginTop: 6 }}>\n          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span>{p.n}{p.days != null && !p.done ? ` · ⏳ ${p.days} يوم` : ''}</span><span className={dim}>{p.done ? 'اكتملت' : 'متبقٍ ' + num(p.rem, D)}</span></div>\n          <div className={barC}><div style={fill(p.pct)} /></div></div>))}\n      </div>) : null}\n      {D.debts && D.debts.left ? (<div className={box} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><b>التحرر من الديون</b><span>باقٍ {D.debts.left} قسط · {D.debts.free ? D.debts.free.split('-').reverse().join('/') : ''}</span></div>) : null}\n      {D.next && D.next.length ? (<div className={box}><b style={{ fontSize: 12 }}>القادم</b>{D.next.slice(0, 3).map(n => (<div key={n.t} className={rowC} style={{ fontSize: 12 }}><span style={{ color: n.late ? '#FFB4AB' : '#fff' }}>{n.t}</span><span className={dim}>{n.when}</span></div>))}</div>) : null}\n      {D.pri && D.pri.length ? (<div className={box}><div style={{ display: 'flex', justifyContent: 'space-between' }}><b style={{ fontSize: 12 }}>أولوياتي</b>{D.score ? <span className={dim}>صحتك المالية {D.score.v}/100</span> : null}</div>{D.pri.slice(0, 3).map((p, i) => (<div key={i} style={{ fontSize: 12, marginTop: 3 }}>{i + 1}. {p}</div>))}</div>) : null}\n      <div className={dim} style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}><span>{D.privacy ? 'المبالغ مخفية' : ''}</span><span style={{ color: same ? undefined : '#FFD58A' }}>حُدّث {ago(D.at)}</span></div>\n    </div>\n  );\n};\n"};
const WIDGET_FILE='idarat-widget.json',WIDGET_K='masareef:widgetAt';
function plain(h){const d=document.createElement('div');d.innerHTML=h;return d.textContent.replace(/\s+/g,' ').trim()}
function widgetAt(){try{return +localStorage.getItem(WIDGET_K)||0}catch(e){return 0}}
function dataChangedAt(){return Math.max(+S.settings._u||0,...list().map(t=>+t.u||0),0)}
function widgetData(){const now=new Date(),cm=ym(now),a=inMonth(cm);const inc=sum(a,'inc'),exp=sum(a,'exp');const B=+S.settings.monthlyBudget||0;const gs=goalsSummary();const priv=!!S.settings.widgetPrivacy;
  const y=String(now.getFullYear());let yi=0,ye=0;for(let k=1;k<=now.getMonth()+1;k++){const q=inMonth(y+'-'+String(k).padStart(2,'0'));yi+=sum(q,'inc');ye+=sum(q,'exp')}
  const G=(S.settings.goals||[]).map(g=>({g,c:goalCalc(g)})).filter(x=>x.c.tgt>0);const T=G.reduce((s,x)=>s+x.c.tgt,0),V=G.reduce((s,x)=>s+Math.min(x.c.sv,x.c.tgt),0);
  const day=now.getDate();const next=[];
  recStatus(cm).R.filter(i=>!i.isPaid).forEach(i=>next.push({t:i.name+(priv?'':' '+money(i.amount-(i.paidAmt||0))),when:i.day<day?'متأخر منذ يوم '+i.day:i.day===day?'اليوم':'يوم '+i.day,late:i.day<day,o:i.day-day}));
  carAlertList().forEach(x=>next.push({t:plain(x.title),when:plain(x.when),late:x.level==='late',o:x.days}));
  docAlertList().forEach(x=>next.push({t:plain(x.title),when:plain(x.when).split('،')[0],late:x.level==='late',o:x.days}));
  next.sort((p,q)=>p.o-q.o);
  const c=advCtx(),P=advPriorities(c),sc=advScore(c,P,advChecklist(c));
  const pc=payCycle(now);
  return{v:1,app:'idarat-shuooni',at:now.toISOString(),month:cm,pay:pc?{next:pc.next,start:pc.start}:null,monthName:monthName(cm),cur:CUR,privacy:priv,
    m:{inc:r3(inc),exp:r3(exp),left:r3(inc-exp),budget:B,budgetPct:B?Math.round(exp/B*100):0,spendable:r3(Math.max(0,dailyPlan().avail+dailyPlan().spentToday))},
    y:{year:y,inc:r3(yi),exp:r3(ye),net:r3(yi-ye)},
    plans:{count:G.length,saved:r3(V),target:r3(T),remaining:r3(T-V),pct:T?Math.round(V/T*100):0,thisMonth:r3(gs.total),
      list:G.sort((p,q)=>p.g.due.localeCompare(q.g.due)).slice(0,4).map(x=>({n:x.g.name,rem:r3(x.c.rem),sv:r3(x.c.sv),pct:Math.round(x.c.pct),done:x.c.done,days:Math.max(0,x.c.days)}))},
    debts:(()=>{const F=debtFree();return{remaining:r3(debts().reduce((s,d)=>s+Math.max(0,+d.balance||0),0)),left:F&&!F.stuck?F.left:null,free:F&&!F.stuck?F.date:null,pct:F?F.pct:null}})(),
    next:next.slice(0,4).map(({t,when,late})=>({t,when,late})),
    score:{v:sc.total,lbl:sc.lbl[0]},pri:P.slice(0,3).map(p=>plain(p.t))}}
function appUrl(){return location.origin+location.pathname.replace(/index\.html$/,'')}
function widgetScript(kind){return kind==='mac'?WIDGET_SRC.mac:WIDGET_SRC.ios.replace('__APP_URL__',appUrl())}
/* يحفظ الملف عبر قائمة المشاركة (احفظه في iCloud Drive ← Scriptable) أو ينزّله */
async function exportWidget(){const json=JSON.stringify(widgetData());const done=()=>{try{localStorage.setItem(WIDGET_K,String(Date.now()))}catch(e){}render()};
  try{const f=new File([json],WIDGET_FILE,{type:'application/json'});
    if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'بيانات ويدجت إدارة شؤوني'});done();toast('حُدّثت بيانات الويدجت');return}}
  catch(e){if(e&&e.name==='AbortError')return}
  if(saveFile(WIDGET_FILE,json,'application/json')){done();toast('نُزّل الملف. انقله إلى مجلد Scriptable في iCloud Drive')}}
function widgetNudgeHtml(){const at=widgetAt();if(!at||dataChangedAt()<=at||Date.now()-at<3*3600e3)return '';
  return `<div class="wnudge"><span>بيانات الويدجت قديمة (${fmtD(isoD(new Date(at)))})</span><button class="chip pay" data-wexp="1">حدّث الويدجت</button></div>`}
function openWidget(){const L=document.getElementById('layer');
  const draw=()=>{const D=widgetData(),at=widgetAt();const pct=D.m.budget?D.m.budgetPct:(D.m.inc?Math.round(D.m.exp/D.m.inc*100):0);
   L.innerHTML=`${sheetTop('ويدجت الآيفون والماك')}
   <h2 style="margin-top:0">ويدجت الآيفون والماك</h2>
   <div class="wprev" aria-label="شكل الويدجت"><div class="wp-h"><b>إدارة شؤوني</b><span>${esc(D.monthName)}</span></div>
    <div class="wp-b"><div><span>المتبقي هذا الشهر</span><b class="num">${D.privacy?'•••':money(D.m.left)}</b></div><div><span>المتاح يوميًا</span><b class="num">${D.privacy?'•••':money(Math.max(0,D.m.spendable)/(monthDays(new Date())-new Date().getDate()+1))}</b></div></div>
    <div class="wp-bar"><i style="width:${Math.min(100,pct)}%"></i></div>
    <div class="wp-f"><span>خططي <span dir="ltr">${D.plans.pct}%</span></span><span>${D.next[0]?esc(D.next[0].t):'لا التزامات قريبة'}</span></div></div>
   <div class="stack" style="margin-top:12px">
    <div class="note">آخر تحديث للويدجت: <b>${at?fmtD(isoD(new Date(at)))+' '+new Date(at).toTimeString().slice(0,5):'لم يُحدَّث بعد'}</b></div>
    <button class="btn block" id="wExp">تحديث بيانات الويدجت</button>
    <label class="toggle"><input type="checkbox" id="wPriv" ${D.privacy?'checked':''}><span>إخفاء المبالغ في الويدجت (تظهر •••)</span></label>
    <p class="note" style="margin:0;line-height:1.8">يعرض الويدجت: المتبقي هذا الشهر، والمتاح يوميًا (يُحسب حسب اليوم تلقائيًا)، ونسبة الصرف من السقف، والدخل والمصاريف، وحصيلة السنة، والخطط والمتبقي منها، والالتزامات القادمة، وأولويات مستشاري. وعلى شاشة القفل: المتبقي والمتاح يوميًا.</p>
    <details class="panel wsteps"${at?'':' open'}><summary><b>الإعداد لأول مرة على الآيفون</b></summary><ol>
     <li>ثبّت تطبيق <a href="https://apps.apple.com/app/id1405459188" target="_blank" rel="noopener">Scriptable</a> المجاني.</li>
     <li>اضغط «نسخ سكربت الويدجت» بالأسفل، ثم افتح Scriptable واضغط <b>+</b> والصق، وسمّه «إدارة شؤوني».</li>
     <li>ارجع هنا واضغط «تحديث بيانات الويدجت» ← <b>حفظ في الملفات</b> ← iCloud Drive ← مجلد <b>Scriptable</b> ← حفظ (واختر «استبدال» في المرات القادمة).</li>
     <li>اضغط مطولًا على الشاشة الرئيسية ← تعديل ← إضافة أداة ← Scriptable ← اختر الحجم ← اضغط على الأداة واختر Script: «إدارة شؤوني». ويمكنك إضافتها في شاشة القفل أيضًا.</li></ol></details>
    <details class="panel wsteps"><summary><b>على الماك (MacBook)</b></summary><ol>
     <li><b>macOS Sonoma أو أحدث:</b> اضغط بالزر الأيمن على سطح المكتب ← تعديل الأدوات ← ستجد أدوات الآيفون ← Scriptable، واسحبها إلى سطح المكتب. يلزم نفس حساب Apple والآيفون قريب أو على نفس الشبكة.</li>
     <li><b>إصدار أقدم:</b> ثبّت تطبيق Übersicht المجاني، ثم «تنزيل ويدجت الماك» وضع الملف في مجلد الأدوات الخاص به. يقرأ نفس الملف من iCloud Drive.</li></ol></details>
    <div class="row2"><button class="btn ghost" id="wCopy">نسخ سكربت الويدجت</button><button class="btn ghost" id="wSave">حفظ السكربت كملف</button></div>
    <button class="btn ghost block" id="wMac">تنزيل ويدجت الماك (Übersicht)</button>
    <p class="note" style="margin:0">الويدجت لا يتصل بالإنترنت، ويقرأ أرقامًا ملخصة فقط من ملف في iCloud Drive الخاص بك. لا يستطيع التطبيق تحديثه وحده، لذلك اضغط «تحديث بيانات الويدجت» بعد تسجيل مصاريفك، وسأذكّرك في الرئيسية إذا صارت بياناته قديمة.</p>
   </div>
   <div class="actions"><button class="btn ghost block" data-close>إغلاق</button></div></div></div>`};
  draw();
  L.oninput=null;
  L.onchange=async e=>{if(e.target.id==='wPriv'){S.settings.widgetPrivacy=e.target.checked;await putSettings();draw();toast(e.target.checked?'ستُخفى المبالغ في الويدجت بعد التحديث':'ستظهر المبالغ في الويدجت بعد التحديث')}};
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;
    if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='wExp'){await exportWidget();if(document.getElementById('wExp'))draw();return}
    if(x.id==='wCopy'){try{await navigator.clipboard.writeText(widgetScript('ios'));toast('نُسخ السكربت. الصقه في Scriptable')}catch(err){saveFile('idarat-widget.js',widgetScript('ios'),'text/javascript');toast('تعذّر النسخ، فحفظته كملف')}return}
    if(x.id==='wSave'){saveFile('idarat-widget.js',widgetScript('ios'),'text/javascript');toast('حُفظ السكربت');return}
    if(x.id==='wMac'){saveFile('idarat-widget.jsx',widgetScript('mac'),'text/javascript');toast('حُفظ ويدجت الماك. ضعه في مجلد أدوات Übersicht');return}}}

/* ---------- 28. أدوات احترافية: الحسابات، الراتب المتوقع، التوقعات، القفل، التقويم، الزكاة ---------- */
function addDays(iso,n){const d=new Date(iso+'T12:00');d.setDate(d.getDate()+n);return isoD(d)}
/* ===== حساباتي: رصيد كل حساب، والتحويل بينها، ومطابقة الرصيد الفعلي ===== */
const ACC_KIND={main:'حساب جاري',cash:'نقدًا (كاش)',card:'بطاقة ائتمان',other:'حساب آخر'};
function accList(){const A=(S.settings.accounts||[]).slice();if(!A.some(a=>a.id==='main'))A.unshift({id:'main',kind:'main',name:mainAcc().name});if(!A.some(a=>a.id==='cash'))A.splice(1,0,{id:'cash',kind:'cash',name:'الكاش'});return A}
function accSaveList(A){S.settings.accounts=A;return putSettings()}
function accOf(t){const A=S.settings.accounts||[];if(t.acc&&(t.acc==='main'||t.acc==='cash'||A.some(a=>a.id===t.acc)))return t.acc;if(t.method==='cash')return 'cash';if(t.method==='card'){const c=A.find(a=>a.forCard);if(c)return c.id}return 'main'}
function transfers(){return S.settings.transfers||[]}
function accBalance(a){if(!a.anchor)return null;const A=a.anchor;const after=(d,at)=>d>A.date||(d===A.date&&(at||'')>A.at);let b=+A.bal;
  list().forEach(t=>{if(accOf(t)===a.id&&after(t.date,t.createdAt))b+=t.type==='inc'?+t.amount:-(+t.amount)});
  transfers().forEach(x=>{if(!after(x.date,x.at))return;if(x.from===a.id)b-=+x.amount;if(x.to===a.id)b+=+x.amount});return r3(b)}
function accName(id){const a=accList().find(x=>x.id===id);return a?a.name:id==='savings'?savAcc().name:'—'}
function accBalances(){const A=accList();const out={};const anc={};A.forEach(a=>{if(a.anchor){out[a.id]=+a.anchor.bal;anc[a.id]=a.anchor}});if(!Object.keys(anc).length)return out;
  const after=(A0,d,at)=>d>A0.date||(d===A0.date&&(at||'')>A0.at);const L=list();for(let i=0;i<L.length;i++){const t=L[i];const id=accOf(t);const A0=anc[id];if(A0&&after(A0,t.date,t.createdAt))out[id]+=t.type==='inc'?+t.amount:-(+t.amount)}
  transfers().forEach(x=>{[[x.from,-1],[x.to,1]].forEach(([id,sg])=>{const A0=anc[id];if(A0&&after(A0,x.date,x.at))out[id]+=sg*(+x.amount)})});Object.keys(out).forEach(k=>out[k]=r3(out[k]));return out}
function accTotals(){const BB=accBalances();const A=accList().map(a=>({a,b:a.id in BB?BB[a.id]:null}));const sv=savAcc();const svb=sv.balance!==null&&sv.balance!==''?+sv.balance:null;
  const known=A.filter(x=>x.b!==null);return{A,svb,total:r3(known.reduce((s,x)=>s+x.b,0)+(svb||0)),known:known.length+(svb!==null?1:0)}}
function openAccounts(){const L=document.getElementById('layer');
  const draw=()=>{const T=accTotals();const tr=transfers().slice().sort((a,b)=>(b.date+b.at).localeCompare(a.date+a.at)).slice(0,8);
   L.innerHTML=`${sheetTop('حساباتي')}<h2 style="margin-top:0">💳 حساباتي</h2>
    <div class="acctotal"><span>مجموع أرصدتك المعروفة</span><b class="num">${money(T.total)} <small>${CUR}</small></b><small>${T.known?'من '+countWord(T.known,'حساب واحد','حسابين','حسابات','حسابًا'):'اكتب رصيد كل حساب مرة واحدة، وبعدها يحسبه التطبيق تلقائيًا'}</small></div>
    <div class="stack">${T.A.map(({a,b})=>`<div class="acccard"><div class="acc-h"><div><b>${esc(a.name)}</b><small>${ACC_KIND[a.kind]||''}${a.forCard?' · مشتريات البطاقة':''}</small></div><b class="num ${b!==null&&b<0?'amt-exp':''}">${b===null?'—':money(b)}</b></div>
      <small class="note">${a.anchor?'آخر مطابقة '+fmtD(a.anchor.date)+(a.anchor.date<addDays(today(),-30)?' · طابقه من جديد':''):'لم تحدّد رصيده بعد'}</small>
      <div class="chips"><button class="chip pay" data-acrec="${esc(a.id)}">${a.anchor?'مطابقة الرصيد':'حدّد الرصيد الحالي'}</button><button class="chip" data-acedit="${esc(a.id)}"><span class="lk">🔒 </span>تعديل</button></div></div>`).join('')}
     ${T.svb!==null?`<div class="acccard"><div class="acc-h"><div><b>${esc(savAcc().name)}</b><small>حساب الادخار · يُدار من الخطط</small></div><b class="num">${money(T.svb)}</b></div></div>`:''}</div>
    <div class="row2" style="margin-top:12px"><button class="btn" id="acTrf">⇄ تحويل بين حساباتي</button><button class="btn ghost" id="acAdd"><span class="lk">🔒 </span>+ حساب</button></div>
    ${tr.length?`<h3>آخر التحويلات</h3><div class="panel">${tr.map(x=>`<div class="sumrow"><span>${fmtD(x.date)} · ${esc(accName(x.from))} ← ${esc(accName(x.to))}${x.note?' · '+esc(x.note):''}</span><span><b class="num">${money(x.amount)}</b> <button class="chip" data-trdel="${esc(x.id)}" aria-label="حذف التحويل">✕</button></span></div>`).join('')}</div>`:''}
    <p class="note">التحويل بين حساباتك لا يُحسب دخلًا ولا مصروفًا. المصروف بالكاش يُخصم من «الكاش»، وغيره من الحساب الجاري، إلا إذا اخترت حسابًا آخر عند التسجيل.</p>
    <div class="actions"><button class="btn ghost block" data-close>إغلاق</button></div></div></div>`};
  draw();L.oninput=L.onchange=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';render();return}
    if(x.dataset.acrec){openAccRec(x.dataset.acrec);return}
    if(x.dataset.acedit||x.id==='acAdd'){openAccEdit(x.dataset.acedit||null);return}
    if(x.id==='acTrf'){openTransfer();return}
    if(x.dataset.trdel){const all=transfers();const it=all.find(y=>y.id===x.dataset.trdel);S.settings.transfers=all.filter(y=>y!==it);await putSettings();draw();toast('حُذف التحويل',async()=>{S.settings.transfers=transfers().concat([it]);await putSettings();draw()},8000)}}}
function openAccRec(id){const L=document.getElementById('layer');const A=accList();const a=A.find(x=>x.id===id);if(!a)return;const app=accBalance(a);
  L.innerHTML=`${sheetTop('مطابقة')}<h2 style="margin-top:0">${a.anchor?'مطابقة رصيد':'رصيد'} ${esc(a.name)}</h2>
   ${app!==null?`<div class="panel paybk"><div class="sumrow"><span>حسب التطبيق</span><b class="num">${money(app)}</b></div><div class="sumrow"><span>من آخر مطابقة ${fmtD(a.anchor.date)}</span><span class="num">${money(a.anchor.bal)}</span></div></div>`:''}
   <div class="field" style="margin-top:10px"><label for="arBal">الرصيد الفعلي الآن (من تطبيق البنك أو محفظتك)</label><div class="amtbox"><input id="arBal" inputmode="decimal" placeholder="0.000" aria-label="الرصيد الفعلي"><span>${CUR}</span></div></div>
   <div class="payprev" id="arPrev">${app!==null?'اكتب الرصيد لأقارنه بحساب التطبيق.':'من الآن يحسب التطبيق رصيد هذا الحساب تلقائيًا من كل دخل ومصروف وتحويل.'}</div>
   <div class="actions"><button class="btn block" id="arSave">حفظ الرصيد</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`;
  L.onchange=null;L.oninput=e=>{if(e.target.id!=='arBal'||app===null)return;const v=parseAmt(e.target.value),d=r3(v-app);document.getElementById('arPrev').innerHTML=!e.target.value?'':Math.abs(d)<0.0005?'<b class="amt-inc">مطابق تمامًا ✓</b>':`الفرق <b class="num ${d<0?'amt-exp':'amt-inc'}">${d>0?'+':'−'}${money(Math.abs(d))}</b>: ${d<0?'غالبًا مصروف لم تسجّله.':'غالبًا دخل لم تسجّله.'} يُعتمد الرصيد الفعلي من الآن.`};
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){openAccounts();return}
    if(x.id==='arSave'){const raw=document.getElementById('arBal').value;if(raw.trim()===''){toast('اكتب الرصيد');return}const v=parseAmt(raw)*(raw.trim().startsWith('-')||raw.trim().startsWith('−')?-1:1);
      const now=new Date().toISOString();a.log=(a.log||[]).concat([{date:today(),app,actual:v}]).slice(-24);a.anchor={bal:v,date:today(),at:now};
      if(a.id==='main'){const m=mainAcc();m.balance=v;m.at=today();S.settings.mainAcc=m}
      await accSaveList(A);toast(app!==null&&Math.abs(v-app)>=0.0005?'حُفظ الرصيد، والفرق '+money(Math.abs(v-app)):'حُفظ الرصيد');openAccounts()}}}
function openAccEdit(id){const L=document.getElementById('layer');const A=accList();const ex=id?A.find(x=>x.id===id):null;const a=ex?Object.assign({},ex):{id:uidGen(),kind:'other',name:''};
  const draw=()=>{L.innerHTML=`${sheetTop('حساب')}<h2 style="margin-top:0">${ex?'تعديل الحساب':'حساب جديد'}</h2><div class="stack">
   <div class="field"><label for="aeName">اسم الحساب</label><input class="inp" id="aeName" value="${esc(a.name)}" maxlength="30" placeholder="مثال: بطاقة بنك مسقط"></div>
   ${a.id==='main'||a.id==='cash'?'':`<div class="seg seg3">${['other','card'].map(k=>`<button class="n" data-aek="${k}" aria-pressed="${a.kind===k}">${ACC_KIND[k]}</button>`).join('')}</div>
   ${a.kind==='card'?`<label class="toggle"><input type="checkbox" id="aeCard" ${a.forCard?'checked':''}><span>مشتريات «البطاقة» تُخصم من هذا الحساب</span></label>`:''}`}
   </div><div class="actions"><button class="btn block" id="aeSave">حفظ</button>${ex&&a.id!=='main'&&a.id!=='cash'?'<button class="btn ghost block" id="aeDel" style="color:var(--exp)">حذف الحساب</button>':''}<button class="btn ghost block" data-close>إلغاء</button></div></div></div>`};
  draw();L.oninput=L.onchange=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){openAccounts();return}
    if(x.dataset.aek){a.name=document.getElementById('aeName').value;a.kind=x.dataset.aek;draw();return}
    if(x.id==='aeDel'){const used=list().some(t=>t.acc===a.id)||transfers().some(t=>t.from===a.id||t.to===a.id);if(used){toast('مرتبط بعمليات أو تحويلات، فلا يُحذف. يمكنك تغيير اسمه');return}await accSaveList(A.filter(y=>y.id!==a.id));openAccounts();return}
    if(x.id==='aeSave'){a.name=document.getElementById('aeName').value.trim();if(!a.name){toast('اكتب اسم الحساب');return}const c=document.getElementById('aeCard');a.forCard=!!(c&&c.checked&&a.kind==='card');
      let B=A.map(y=>y.id===a.id?a:a.forCard?Object.assign({},y,{forCard:false}):y);if(!ex)B.push(a);await accSaveList(B);if(a.id==='main'){const m=mainAcc();m.name=a.name;S.settings.mainAcc=m;await putSettings()}openAccounts()}}}
function openTransfer(){const L=document.getElementById('layer');const A=accList();let from='main',to=A.find(a=>a.id!=='main')?A.find(a=>a.id!=='main').id:'cash';
  const opt=(sel)=>A.map(a=>`<option value="${esc(a.id)}" ${sel===a.id?'selected':''}>${esc(a.name)}</option>`).join('');
  L.innerHTML=`${sheetTop('تحويل')}<h2 style="margin-top:0">⇄ تحويل بين حساباتي</h2><div class="stack">
   <div class="amtbox"><input id="tfAmt" inputmode="decimal" placeholder="0.000" aria-label="المبلغ"><span>${CUR}</span></div>
   <div class="row2"><div class="field"><label for="tfFrom">من</label><select class="inp" id="tfFrom">${opt(from)}</select></div><div class="field"><label for="tfTo">إلى</label><select class="inp" id="tfTo">${opt(to)}</select></div></div>
   <div class="row2"><div class="field"><label for="tfDate">التاريخ</label><input class="inp" type="date" id="tfDate" value="${today()}"></div><div class="field"><label for="tfNote">ملاحظة</label><input class="inp" id="tfNote" maxlength="40" placeholder="سحب من الصراف مثلًا"></div></div>
   <p class="note" style="margin:0">مثال: سحبت 50 من الصراف = تحويل من الحساب الجاري إلى الكاش. لا يُحسب مصروفًا.</p></div>
   <div class="actions"><button class="btn block" id="tfSave">حفظ التحويل</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`;
  L.oninput=L.onchange=null;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){openAccounts();return}
    if(x.id==='tfSave'){const g=i=>document.getElementById(i).value;const amt=parseAmt(g('tfAmt'));if(!amt){toast('اكتب المبلغ');return}if(g('tfFrom')===g('tfTo')){toast('اختر حسابين مختلفين');return}
      const it={id:uidGen(),date:g('tfDate')||today(),from:g('tfFrom'),to:g('tfTo'),amount:amt,note:g('tfNote').trim(),at:new Date().toISOString()};S.settings.transfers=transfers().concat([it]);await putSettings();toast('حُفظ التحويل');openAccounts()}}}
/* ===== الراتب المتوقع ===== */
function lastSalary(){return list().filter(t=>t.type==='inc'&&t.cat==='salary').sort((a,b)=>b.date.localeCompare(a.date))[0]||null}
function salaryDueHtml(){const pc=payCycle();if(!pc||S.month!==ym(new Date()))return '';if(list().some(t=>t.type==='inc'&&t.cat==='salary'&&t.date>=addDays(pc.start,-5)))return '';
  try{if(localStorage.getItem('masareef:salskip')===today())return ''}catch(e){}const ls=lastSalary();
  return `<div class="saldue"><span class="sd-ic">💰</span><div class="sd-m"><b>هل نزل راتبك؟</b><small>موعده ${fmtD(pc.start)}${ls?' · المعتاد <span class="num">'+amtH(ls.amount)+'</span>':''}</small></div><div class="sd-b"><button class="chip pay" data-salyes="1">نعم، نزل</button><button class="chip" data-salno="1">ليس بعد</button></div></div>`}
/* ===== توقّع الأشهر الثلاثة القادمة ===== */
function forecast(n){n=n||3;const cm=ym(new Date());const past=[1,2,3].map(k=>shiftMonth(cm,-k));const used=past.filter(m=>inMonth(m).length);
  const ls=lastSalary();const incAvg=ls?+ls.amount:(used.length?used.reduce((s,m)=>s+sum(inMonth(m),'inc'),0)/used.length:0);
  const varAvg=used.length?used.reduce((s,m)=>s+inMonth(m).filter(t=>t.type==='exp'&&!isFixedTx(t)).reduce((a,t)=>a+(+t.amount),0),0)/used.length:0;
  const Ds=debts().filter(d=>+d.balance>0.0005);const pl=Ds.length?debtSim():{finish:{}};const G=(S.settings.goals||[]).map(g=>({g,c:goalCalc(g)})).filter(x=>!x.c.done&&x.c.tgt);
  const rows=[];for(let k=0;k<n;k++){const m=shiftMonth(cm,k);
    const obl=recs().filter(r=>recActive(r,m)).reduce((s,r)=>s+amtAt(r,m),0);
    const dm=Ds.reduce((s,d)=>{if(d.mode==='once')return s+(d.end&&d.end.slice(0,7)===m?+d.balance:0);const f=pl.finish[d.id];return s+(f&&k+1>f+debtOff()?0:debtInst(d))},0);
    const plans=G.filter(x=>x.g.due&&x.g.due.slice(0,7)>=m).reduce((s,x)=>s+(x.c.monthly||0),0);
    const left=incAvg-obl-dm-plans-varAvg;rows.push({m,inc:r3(incAvg),obl:r3(obl),debt:r3(dm),plans:r3(plans),vari:r3(varAvg),left:r3(left)})}
  return{rows,basis:ls?'آخر راتب':used.length?'متوسط دخلك':'',ok:incAvg>0}}
function forecastHtml(){const F=forecast(3);if(!F.ok)return '';
  return `<h2>توقّع الأشهر الثلاثة القادمة</h2><div class="panel fcast"><table class="cmptbl"><thead><tr><th></th>${F.rows.map(r=>`<th>${esc(MONTHS[+r.m.slice(5)-1])}</th>`).join('')}</tr></thead><tbody>
   <tr><td>الدخل المتوقع</td>${F.rows.map(r=>`<td class="num">${money(r.inc)}</td>`).join('')}</tr>
   <tr><td>الالتزامات الشهرية</td>${F.rows.map(r=>`<td class="num">− ${money(r.obl)}</td>`).join('')}</tr>
   <tr><td>أقساط الديون</td>${F.rows.map(r=>`<td class="num">− ${money(r.debt)}</td>`).join('')}</tr>
   <tr><td>حصص الخطط</td>${F.rows.map(r=>`<td class="num">− ${money(r.plans)}</td>`).join('')}</tr>
   <tr><td>المصروف المعتاد</td>${F.rows.map(r=>`<td class="num">− ${money(r.vari)}</td>`).join('')}</tr>
   <tr class="tot"><td>المتبقي المتوقع</td>${F.rows.map(r=>`<td class="num ${r.left<0?'amt-exp':'amt-inc'}">${r.left<0?'−':''}${money(Math.abs(r.left))}</td>`).join('')}</tr></tbody></table>
   <p class="note" style="margin:8px 0 0">تقدير مبني على ${F.basis}، والتزاماتك وأقساطك وخططك، ومتوسط مصروفك المتغيّر في آخر 3 أشهر.${F.rows.some(r=>r.left<0)?' <b class="amt-exp">شهر بالسالب: جهّز له من الآن أو أجّل خطة.</b>':''}</p></div>`}
/* ===== قفل التطبيق وإخفاء المبالغ ===== */
const LOCK_K='masareef:applock';
function lockCfg(){try{return JSON.parse(localStorage.getItem(LOCK_K)||'null')}catch(e){return null}}
function lockSave(c){try{c?localStorage.setItem(LOCK_K,JSON.stringify(c)):localStorage.removeItem(LOCK_K)}catch(e){}}
async function lockPinOk(pin){const c=lockCfg();if(!c||!pin)return false;return await admHash(String(pin),b64d(c.salt))===c.hash}
const LockS={fails:0,wait:0,hid:0};
function showLock(){const c=lockCfg();if(!c||document.getElementById('lockScreen'))return;const el=document.createElement('div');el.id='lockScreen';el.setAttribute('role','dialog');el.setAttribute('aria-label','التطبيق مقفل');
  el.innerHTML=`<div class="lk-in"><div class="lk-logo">🔒</div><h2>إدارة شؤوني</h2><p class="note">التطبيق مقفل لحماية بياناتك</p>
   ${c.bio?'<button class="btn block" id="lkBio">فتح ببصمة الوجه</button>':''}
   <input class="inp num pin" id="lkPin" type="password" inputmode="numeric" maxlength="8" placeholder="الرمز" autocomplete="off" aria-label="رمز فتح التطبيق">
   <button class="btn ${c.bio?'ghost ':''}block" id="lkGo">فتح بالرمز</button><p class="note" id="lkErr" style="color:var(--exp)"></p></div>`;
  document.body.appendChild(el);document.body.classList.add('app-locked');
  const ok=()=>{el.remove();document.body.classList.remove('app-locked','app-hidden');LockS.fails=0};
  el.onclick=async e=>{const x=e.target.closest('button');if(!x)return;const er=document.getElementById('lkErr');
    if(x.id==='lkBio'){const r=await verifyUser();if(r==='ok')ok();else er.textContent=r==='cancel'?'أُلغيت بصمة الوجه':'تعذّرت بصمة الوجه، استخدم الرمز';return}
    if(x.id==='lkGo'){if(Date.now()<LockS.wait){er.textContent='انتظر '+Math.ceil((LockS.wait-Date.now())/1000)+' ثانية';return}
      if(await lockPinOk(document.getElementById('lkPin').value)){ok();return}LockS.fails++;if(LockS.fails>=5){LockS.wait=Date.now()+30000;LockS.fails=0}er.textContent='الرمز غير صحيح';document.getElementById('lkPin').value=''}};
  el.onkeydown=e=>{if(e.key==='Enter'&&e.target.id==='lkPin')document.getElementById('lkGo').click()};
  /* بصمة الوجه تُطلب تلقائيًا عند ظهور القفل؛ وإن منعها النظام يبقى زرها ظاهرًا */
  if(c.bio&&c.auto!==false){let tried=false;const auto=async()=>{if(tried||!el.isConnected)return;tried=true;const r=await verifyUser();el.dataset.auto=r;if(r==='ok'&&el.isConnected)ok();else tried=false};
    setTimeout(auto,350);
    /* بعض الأجهزة تمنع البصمة قبل أول لمسة: أول لمسة على شاشة القفل (خارج خانة الرمز) تطلبها */
    el.addEventListener('pointerup',e=>{if(!e.target.closest('input,button')&&el.dataset.auto!=='ok')auto()})}}
document.addEventListener('visibilitychange',()=>{if(!lockCfg())return;if(document.visibilityState==='hidden'){LockS.hid=Date.now();document.body.classList.add('app-hidden')}
  else{document.body.classList.remove('app-hidden');const af=lockCfg();const wait=af&&af.after!=null?+af.after*1000:60000;if(LockS.hid&&Date.now()-LockS.hid>=wait)showLock();LockS.hid=0}});
function hideAmtOn(){try{return localStorage.getItem('masareef:hideamt')==='1'}catch(e){return false}}
function applyHideAmt(){document.body.classList.toggle('hide-amt',hideAmtOn());const b=document.getElementById('privBtn');if(b){b.textContent=hideAmtOn()?'🙈':'👁';b.setAttribute('aria-label',hideAmtOn()?'إظهار المبالغ':'إخفاء المبالغ')}}
function privBtnInit(){const h=document.querySelector('.hdr-actions');if(!h||document.getElementById('privBtn'))return;
  {const g=document.createElement('button');g.id='setBtn';g.type='button';g.className='iconbtn';g.dataset.tab='settings';g.setAttribute('aria-label','الضبط');g.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';h.appendChild(g)}const b=document.createElement('button');b.id='privBtn';b.type='button';b.className='iconbtn privbtn';h.insertBefore(b,document.getElementById('lookBtn'));applyHideAmt()}
/* ===== صفحة ⚙️ الضبط: كل إعدادات التطبيق في مكان واحد، وتُفتح من زر ⚙️ أعلى الشاشة ===== */
const LOCK_AFTER=[[0,'فورًا'],[60,'بعد دقيقة'],[300,'بعد 5 دقائق'],[900,'بعد 15 دقيقة']];
function vSettings(){const c=lockCfg(),af=c&&c.after!=null?+c.after:60;setTimeout(()=>Sync.prime(),0);
  return `<div class="backrow" style="margin-top:4px"><h2 style="margin:0">⚙️ الضبط</h2><button class="chip" data-tab="home">الرئيسية ‹</button></div>
  <h2>🔐 قفل التطبيق وبصمة الوجه</h2>
  <div class="panel stack setbox">
   <div class="setrow"><div><b>قفل التطبيق</b><small>${c?'مفعّل: يطلب '+(c.bio?'بصمة الوجه أو الرمز':'الرمز')+' عند فتح التطبيق':'متوقف: التطبيق يفتح بدون رمز'}</small></div><button class="chip${c?'':' pay'}" id="lockSet">${c?'إيقاف':'تفعيل'}</button></div>
   ${c?`<div class="setrow"><div><b>فتح القفل ببصمة الوجه</b><small>${c.bio?'مفعّل: انظر إلى الهاتف ويُفتح التطبيق، والرمز يبقى احتياطيًا':'متوقف: الفتح بالرمز فقط'}</small></div><button class="tgl${c.bio?' on':''}" id="lockBio" role="switch" aria-checked="${!!c.bio}" aria-label="فتح القفل ببصمة الوجه"><i></i></button></div>
   ${c.bio?`<div class="setrow"><div><b>طلب البصمة تلقائيًا</b><small>تظهر بصمة الوجه فور فتح التطبيق بدون ضغط زر</small></div><button class="tgl${c.auto!==false?' on':''}" id="lockAuto" role="switch" aria-checked="${c.auto!==false}" aria-label="طلب البصمة تلقائيًا"><i></i></button></div>`:''}
   <div class="setrow col"><div><b>يُقفل بعد الخروج من التطبيق</b></div><div class="seg">${LOCK_AFTER.map(([v,n])=>`<button class="n" data-lockafter="${v}" aria-pressed="${af===v}">${n}</button>`).join('')}</div></div>
   <div class="setrow"><div><b>رمز القفل</b><small>من 4 إلى 8 أرقام، محفوظ مشفّرًا في هذا الجهاز</small></div><button class="chip" id="lockPinChange">تغيير الرمز</button></div>`:''}
   <div class="setrow"><div><b>إخفاء المبالغ</b><small>زر 👁 في الأعلى يخفيها أمام الآخرين</small></div><button class="tgl${hideAmtOn()?' on':''}" id="hideAmt" role="switch" aria-checked="${hideAmtOn()}" aria-label="إخفاء المبالغ"><i></i></button></div>
   <span class="note">الإعدادات هنا خاصة بهذا الجهاز، ولا تدخل في المزامنة ولا في النسخة الاحتياطية. إعدادات الآيفون لا تعرض خيارات تطبيقات الويب، لذلك كل ضبط التطبيق هنا.</span></div>
  <h2>🤲 زر أدعية الرزق</h2>${(()=>{const c=rzCfg();return `<div class="panel stack setbox">
   <div class="setrow"><div><b>إظهار زر «💰 أدعية الرزق»</b><small>أدعية البركة في الرزق ودعاء نزول الراتب، في صفحات سهلة القراءة</small></div><button class="tgl${c.pos!=='hide'?' on':''}" id="rzOn" role="switch" aria-checked="${c.pos!=='hide'}" aria-label="إظهار زر أدعية الرزق"><i></i></button></div>
   ${c.pos!=='hide'?`<div class="setrow col"><div><b>مكان الزر</b></div><div class="seg rzposseg">${RZ_POS.filter(x=>x[0]!=='hide').map(([v,n])=>`<button class="n" data-rzpos="${v}" aria-pressed="${c.pos===v}">${n}</button>`).join('')}</div></div>`:''}
   <div class="setrow"><div><b>فتح الأدعية الآن</b></div><button class="chip" data-rizq="1">💰 فتح</button></div>
   <div class="setrow col"><div><b>لون خلفية صفحات القراءة</b><small>سورة الملك والأذكار والأدعية · خاص بهذا الجهاز</small></div>${rdSwatches()}</div></div>`})()}
  <h2>🔒 قفل الدفع قبل الموعد</h2>${payLockHtml()}
  <h2>☁️ المزامنة مع Google Drive</h2><div id="syncBox">${syncHtml()}</div>
  <h2>🛡️ وضع المدير</h2>${admHtml()}
  <h2>✏️ أسماء الأقسام</h2><div class="panel stack"><span class="note">غيّر أسماء أقسام القائمة الشهرية ومجموعات الديون وأقسامي والشريط السفلي. يمكنك أيضًا الضغط على ✏️ بجانب أي عنوان مباشرة.</span><button class="btn ghost block" id="lblEdit"><span class="lk">🔒 </span>تعديل أسماء الأقسام</button></div>
  <h2>🗂️ البيانات والمظهر</h2>
  <div class="stack"><button class="btn ghost block" id="dbOpen">🗄️ قاعدة البيانات والنسخ الاحتياطي</button><button class="btn ghost block" id="lookBtn2">🎨 المظهر والألوان</button><button class="btn ghost block" data-tab="reports">📊 التقارير والمزامنة</button></div>
  <p class="note" style="text-align:center;margin-top:14px">إدارة شؤوني · الإصدار ${APP_VERSION}</p>`}
function payLockHtml(){const c=payLockCfg();
  return `<div class="panel stack setbox">
   <div class="setrow"><div><b>قفل زر «دفعت» حتى يحين الموعد</b><small>${c.on?'مفعّل: يظهر «🔒 يُفتح في…» حتى تاريخ الفتح':'متوقف: الدفع متاح في أي وقت'}</small></div><button class="tgl${c.on?' on':''}" id="plOn" role="switch" aria-checked="${c.on}" aria-label="قفل الدفع حتى الموعد"><i></i></button></div>
   ${c.on?`<div class="setrow col"><div><b>يُطبَّق على</b></div><div class="seg"><button class="n" data-plscope="all" aria-pressed="${c.scope==='all'}">كل الأشهر</button><button class="n" data-plscope="future" aria-pressed="${c.scope==='future'}">الأشهر القادمة فقط</button></div></div>
   <div class="setrow col"><div><b>يُفتح الدفع</b></div><div class="seg">${[[0,'يوم الموعد'],[3,'قبله بـ3 أيام'],[7,'قبله بأسبوع'],[15,'قبله بـ15 يومًا']].map(([v,n])=>`<button class="n" data-plbefore="${v}" aria-pressed="${+c.before===v}">${n}</button>`).join('')}</div></div>`:''}
   <span class="note">الدفع المبكر متاح دائمًا من وضع المدير. وموعد كل بند تغيّره من «تعديل» البند نفسه (يوم الدفع في الشهر).</span></div>`}
function payLockSet(o){S.settings.payLock=Object.assign(payLockCfg(),o);putSettings();render()}
/* التحقق بالرمز الحالي (أو بصمة الوجه إن كانت مفعّلة) قبل تغيير إعدادات القفل */
function lockAsk(title,why,done){const L=document.getElementById('layer');const c=lockCfg();
  L.innerHTML=`${sheetTop(title)}<h2 style="margin-top:0">${title}</h2><p class="note">${why}</p><div class="stack">
   <div class="field"><label for="laPin">رمز القفل الحالي</label><input class="inp num pin" id="laPin" type="password" inputmode="numeric" maxlength="8" autocomplete="off"></div><p class="note" id="laErr" style="color:var(--exp);margin:0"></p></div>
   <div class="actions"><button class="btn block" id="laGo">متابعة</button>${c&&c.bio?'<button class="btn ghost block" id="laBio">ببصمة الوجه</button>':''}<button class="btn ghost block" data-close>إلغاء</button></div></div></div>`;
  L.oninput=L.onchange=null;L.onkeydown=e=>{if(e.key==='Enter'&&e.target.id==='laPin')document.getElementById('laGo').click()};
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';L.onkeydown=null;return}
    if(x.id==='laBio'){const r=await verifyUser();if(r==='ok'){L.innerHTML='';L.onkeydown=null;done()}else document.getElementById('laErr').textContent=r==='cancel'?'أُلغيت بصمة الوجه':'تعذّرت بصمة الوجه، استخدم الرمز';return}
    if(x.id==='laGo'){if(Date.now()<LockS.wait){document.getElementById('laErr').textContent='انتظر '+Math.ceil((LockS.wait-Date.now())/1000)+' ثانية';return}
      if(await lockPinOk(document.getElementById('laPin').value)){LockS.fails=0;L.innerHTML='';L.onkeydown=null;done()}
      else{LockS.fails++;if(LockS.fails>=5){LockS.wait=Date.now()+30000;LockS.fails=0}document.getElementById('laErr').textContent='الرمز غير صحيح';document.getElementById('laPin').value=''}}}}
async function lockBioToggle(){const c=lockCfg();if(!c)return;
  if(c.bio){lockSave(Object.assign({},c,{bio:false}));render();toast('أُوقف فتح القفل ببصمة الوجه، والفتح بالرمز فقط');return}
  if(!await uvAvailable()){toast('بصمة الوجه غير متاحة في هذا الجهاز أو المتصفح. افتح التطبيق من أيقونته على الشاشة الرئيسية');return}
  lockAsk('تفعيل بصمة الوجه','اكتب رمز القفل الحالي، ثم أكّد ببصمة الوجه لتفعيل فتح التطبيق بها.',async()=>{const r=await verifyUser();
    if(r==='ok'){lockSave(Object.assign({},lockCfg(),{bio:true}));render();toast('فُعّل فتح القفل ببصمة الوجه')}else toast(r==='cancel'?'أُلغيت بصمة الوجه، لم يتغيّر شيء':'تعذّرت بصمة الوجه، لم يتغيّر شيء')})}
function lockPinChange(){lockAsk('تغيير رمز القفل','للتأكد أنك صاحب الجهاز.',()=>{const L=document.getElementById('layer');
  L.innerHTML=`${sheetTop('رمز جديد')}<h2 style="margin-top:0">رمز القفل الجديد</h2><div class="row2"><div class="field"><label for="lp1">رمز من 4 إلى 8 أرقام</label><input class="inp num pin" id="lp1" type="password" inputmode="numeric" maxlength="8"></div><div class="field"><label for="lp2">أعد كتابته</label><input class="inp num pin" id="lp2" type="password" inputmode="numeric" maxlength="8"></div></div><p class="note" id="lpErr" style="color:var(--exp)"></p>
   <div class="actions"><button class="btn block" id="lpSave">حفظ الرمز</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`;
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='lpSave'){const p1=document.getElementById('lp1').value.trim(),p2=document.getElementById('lp2').value.trim(),er=document.getElementById('lpErr');
      if(!/^\d{4,8}$/.test(p1)){er.textContent='الرمز من 4 إلى 8 أرقام';return}if(p1!==p2){er.textContent='الرمزان غير متطابقين';return}
      const salt=crypto.getRandomValues(new Uint8Array(16));lockSave(Object.assign({},lockCfg(),{salt:b64e(salt),hash:await admHash(p1,salt)}));L.innerHTML='';render();toast('تغيّر رمز القفل')}}})}
function openLockSetup(){const L=document.getElementById('layer');const c=lockCfg();
  if(c){L.innerHTML=`${sheetTop('القفل')}<h2 style="margin-top:0">إيقاف قفل التطبيق</h2><div class="field"><label for="lsOld">الرمز الحالي</label><input class="inp num pin" id="lsOld" type="password" inputmode="numeric" maxlength="8"></div><p class="note" id="lsErr" style="color:var(--exp)"></p>
    <div class="actions">${c.bio?'<button class="btn ghost block" id="lsBioOff">إيقاف ببصمة الوجه</button>':''}<button class="btn block" id="lsOff">إيقاف القفل</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`;
    L.oninput=L.onchange=null;L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
      if(x.id==='lsBioOff'){if(await verifyUser()==='ok'){lockSave(null);L.innerHTML='';render();toast('أُوقف قفل التطبيق')}return}
      if(x.id==='lsOff'){if(await lockPinOk(document.getElementById('lsOld').value)){lockSave(null);L.innerHTML='';render();toast('أُوقف قفل التطبيق')}else document.getElementById('lsErr').textContent='الرمز غير صحيح'}};return}
  uvAvailable().then(uv=>{L.innerHTML=`${sheetTop('القفل')}<h2 style="margin-top:0">تفعيل قفل التطبيق</h2><div class="stack">
    <div class="row2"><div class="field"><label for="ls1">رمز من 4 إلى 8 أرقام</label><input class="inp num pin" id="ls1" type="password" inputmode="numeric" maxlength="8"></div><div class="field"><label for="ls2">أعد كتابته</label><input class="inp num pin" id="ls2" type="password" inputmode="numeric" maxlength="8"></div></div>
    ${uv?'<label class="toggle"><input type="checkbox" id="lsBio" checked><span>الفتح ببصمة الوجه أيضًا</span></label>':''}
    <p class="note" style="margin:0">الرمز محفوظ مشفّرًا في هذا الهاتف فقط. إذا نسيته وليس عندك بصمة وجه، لا يمكن فتح التطبيق إلا بحذف بيانات الموقع من إعدادات Safari، فاحفظ نسخة احتياطية قبلها.</p><p class="note" id="lsErr" style="color:var(--exp)"></p></div>
    <div class="actions"><button class="btn block" id="lsSave">تفعيل</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`;
    L.oninput=L.onchange=null;L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
      if(x.id==='lsSave'){const p1=document.getElementById('ls1').value.trim(),p2=document.getElementById('ls2').value.trim(),er=document.getElementById('lsErr');
        if(!/^\d{4,8}$/.test(p1)){er.textContent='الرمز من 4 إلى 8 أرقام';return}if(p1!==p2){er.textContent='الرمزان غير متطابقين';return}
        const salt=crypto.getRandomValues(new Uint8Array(16));const hash=await admHash(p1,salt);let bio=false;const bx=document.getElementById('lsBio');if(bx&&bx.checked)bio=(await verifyUser())==='ok';
        lockSave({salt:b64e(salt),hash,bio});L.innerHTML='';render();toast('فُعّل قفل التطبيق'+(bx&&bx.checked&&!bio?' بالرمز فقط':''))}}})}
/* ===== نسخة احتياطية مشفّرة بكلمة سر ===== */
async function encBackupText(pass){const salt=crypto.getRandomValues(new Uint8Array(16));const key=await vDerive(pass,salt);const o=await vEnc(key,te(backupText()));
  return JSON.stringify({app:'masareef',enc:'aes-gcm-pbkdf2',v:2,name:'إدارة شؤوني - نسخة احتياطية مشفّرة',at:new Date().toISOString(),appVersion:APP_VERSION,salt:b64e(salt),iv:b64e(o.iv),ct:b64e(o.ct)})}
function openEncBackup(){const L=document.getElementById('layer');
  L.innerHTML=`${sheetTop('نسخة مشفّرة')}<h2 style="margin-top:0">🔐 نسخة احتياطية مشفّرة</h2><div class="stack">
   <div class="field"><label for="ebP1">كلمة سر (6 أحرف أو أكثر)</label><input class="inp" id="ebP1" type="password" autocomplete="new-password"></div>
   <div class="field"><label for="ebP2">أعد كتابتها</label><input class="inp" id="ebP2" type="password" autocomplete="new-password"></div>
   <p class="note" style="margin:0">الملف لا يُقرأ بدون هذه الكلمة، حتى لو وصل لغيرك. <b>لا يمكن استعادته إذا نسيتها</b>، فاكتبها في مكان آمن.</p><p class="note" id="ebErr" style="color:var(--exp)"></p></div>
   <div class="actions"><button class="btn block" id="ebGo">تشفير وحفظ</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`;
  L.oninput=L.onchange=null;L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='ebGo'){const p1=document.getElementById('ebP1').value,p2=document.getElementById('ebP2').value,er=document.getElementById('ebErr');if(p1.length<6){er.textContent='كلمة السر 6 أحرف على الأقل';return}if(p1!==p2){er.textContent='الكلمتان غير متطابقتين';return}
      x.disabled=true;x.textContent='جارٍ التشفير…';const txt=await encBackupText(p1);L.innerHTML='';const r=await shareFile('idarat-shuooni-backup-'+today()+'-encrypted.json',txt,'application/json');
      if(r!=='cancel'){try{localStorage.setItem('masareef:lastBackup',today())}catch(er2){}toast('حُفظت النسخة المشفّرة')}}}}
function openDecrypt(o,label){const L=document.getElementById('layer');
  L.innerHTML=`${sheetTop('فك التشفير')}<h2 style="margin-top:0">🔐 نسخة مشفّرة</h2><div class="field"><label for="dcP">كلمة السر</label><input class="inp" id="dcP" type="password" autocomplete="current-password"></div><p class="note" id="dcErr" style="color:var(--exp)"></p>
   <div class="actions"><button class="btn block" id="dcGo">فتح النسخة</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`;
  L.oninput=L.onchange=null;L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='dcGo'){x.disabled=true;try{const key=await vDerive(document.getElementById('dcP').value,b64d(o.salt));const txt=td(await vDec(key,{iv:b64d(o.iv),ct:b64d(o.ct)}));openRestore(txt,label||'نسخة مشفّرة')}
      catch(er){x.disabled=false;document.getElementById('dcErr').textContent='كلمة السر غير صحيحة أو الملف تالف'}}}}
function backupNudgeHtml(){if(list().length<10)return '';const lb=advLastBackup();const days=lb?Math.max(0,-daysTo(lb)):999;if(days<7)return '';
  try{const sn=localStorage.getItem('masareef:bksnooze');if(sn&&sn>=today())return ''}catch(e){}
  return `<div class="infobox"><span>💾 ${lb?'مرّ '+daysWord(days)+' على آخر نسخة احتياطية.':'لم تحفظ نسخة احتياطية بعد.'} احفظ نسخة في iCloud حتى لا تضيع بياناتك.</span><button class="chip pay" data-bknow="1">حفظ</button><button class="chip" data-bklater="1">لاحقًا</button></div>`}
/* ===== تقويم المدفوعات ===== */
function calItems(m){const out={};const add=(d,o)=>{(out[d]=out[d]||[]).push(o)};const cur=ym(new Date());
  monthItems(m).forEach(i=>{const d=recDate({day:i.day},m);add(d,{t:i.name,a:i.amount,k:i.isPaid?'paid':(d<today()?'late':'due')})});
  if(+S.settings.payday){const [y,mm]=m.split('-').map(Number);add(isoD(payDate(y,mm-1)),{t:'نزول الراتب',a:lastSalary()?+lastSalary().amount:0,k:'inc'})}
  (S.settings.goals||[]).forEach(g=>{if(g.due&&g.due.slice(0,7)===m)add(g.due,{t:'موعد خطة: '+g.name,a:goalCalc(g).tgt,k:'plan'})});
  trusts().forEach(t=>{if(t.due&&t.due.slice(0,7)===m&&trustCalc(t).rem>0)add(t.due,{t:'إرجاع أمانة: '+t.name,a:trustCalc(t).rem,k:'due'})});
  cars().forEach(c=>{[['insExpiry','تأمين '],['regExpiry','ملكية ']].forEach(([f,n])=>{if(c[f]&&c[f].slice(0,7)===m)add(c[f],{t:'تجديد '+n+c.name,a:0,k:'plan'})})});
  return out}
function openPayCalendar(m){m=m||S.month;const L=document.getElementById('layer');let sel=null;
  const draw=()=>{const I=calItems(m);const [y,mm]=m.split('-').map(Number);const first=new Date(y,mm-1,1).getDay();const dim=new Date(y,mm,0).getDate();const td=today();
    const cells=[];for(let k=0;k<(first+1)%7;k++)cells.push('<div class="cd e"></div>');
    for(let d=1;d<=dim;d++){const iso=m+'-'+String(d).padStart(2,'0');const it=I[iso]||[];const ks=[...new Set(it.map(x=>x.k))];
      cells.push(`<button class="cd${iso===td?' td':''}${iso===sel?' sel':''}${it.length?' has':''}" data-cday="${iso}"><span>${d}</span><i>${ks.map(k=>`<em class="k-${k}"></em>`).join('')}</i></button>`)}
    const L2=sel?(I[sel]||[]):Object.entries(I).sort().flatMap(([d,a])=>a.map(x=>Object.assign({d},x)));
    const tot=Object.values(I).flat().filter(x=>x.k!=='inc'&&x.k!=='plan').reduce((s,x)=>s+(+x.a||0),0);
    L.innerHTML=`${sheetTop('التقويم')}<div class="qhead"><button class="iconbtn" data-cm="1" aria-label="الشهر التالي">›</button><h2 style="margin:0">📅 ${esc(monthName(m))}</h2><button class="iconbtn" data-cm="-1" aria-label="الشهر السابق">‹</button></div>
     <div class="calg"><div class="cw">السبت</div><div class="cw">الأحد</div><div class="cw">الاثنين</div><div class="cw">الثلاثاء</div><div class="cw">الأربعاء</div><div class="cw">الخميس</div><div class="cw">الجمعة</div>${cells.join('')}</div>
     <div class="calkey"><span><em class="k-due"></em>مستحق</span><span><em class="k-late"></em>متأخر</span><span><em class="k-paid"></em>مدفوع</span><span><em class="k-inc"></em>راتب</span><span><em class="k-plan"></em>خطة / تجديد</span></div>
     <div class="panel">${L2.length?L2.map(x=>`<div class="sumrow"><span><em class="dotk k-${x.k}"></em>${sel?'':fmtD(x.d)+' · '}${esc(x.t)}</span><b class="num">${x.a?money(x.a):''}</b></div>`).join(''):'<p class="note" style="margin:6px">لا شيء في هذا '+(sel?'اليوم':'الشهر')+'.</p>'}</div>
     ${!sel&&tot?`<p class="note">مجموع المدفوعات في الشهر: <b class="num">${money(tot)}</b> ${CUR}</p>`:''}
     <div class="actions"><button class="btn ghost block" data-close>إغلاق</button></div></div></div>`};
  draw();L.oninput=L.onchange=null;
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.cm){m=shiftMonth(m,+x.dataset.cm);sel=null;draw();return}
    if(x.dataset.cday){sel=sel===x.dataset.cday?null:x.dataset.cday;draw()}}}
/* ===== حاسبة الزكاة (للاسترشاد) ===== */
function openZakat(){const L=document.getElementById('layer');const Z=Object.assign({gold:'',hawl:'',extra:'',debt:''},S.settings.zakat||{});
  const T=accTotals();const held=trustsHeld();const due=recStatus(ym(new Date())).dueLeft;
  const draw=()=>{const gold=parseAmt(Z.gold),nisab=r3(gold*85);const cash=T.total;const extra=parseAmt(Z.extra),dd=Z.debt===''?r3(due):parseAmt(Z.debt);
    const base=r3(cash+extra-held-dd);const zk=base>=nisab&&nisab>0?r3(base*0.025):0;const hd=Z.hawl?daysTo(addDays(Z.hawl,354)):null;
    L.innerHTML=`${sheetTop('الزكاة')}<h2 style="margin-top:0">🕋 حاسبة الزكاة</h2><div class="stack">
     <div class="field"><label for="zkGold">سعر غرام الذهب عيار 24 اليوم (${CUR})</label><input class="inp num" id="zkGold" inputmode="decimal" value="${esc(Z.gold)}" placeholder="مثال: 31.500" style="text-align:left"></div>
     <div class="panel paybk">
      <div class="sumrow"><span>أرصدة حساباتك والادخار</span><b class="num">${money(cash)}</b></div>
      ${T.known?'':'<div class="note">حدّد أرصدة حساباتك من «حساباتي» ليُحسب هذا تلقائيًا.</div>'}
      <div class="sumrow"><span>أموال أخرى تجب فيها الزكاة (ذهب، أسهم، ديون لك مرجوّة)</span><input class="inp num zkin" id="zkExtra" inputmode="decimal" value="${esc(Z.extra)}" placeholder="0"></div>
      ${held?`<div class="sumrow"><span>الأمانات التي عندك (ليست مالك)</span><b class="num">− ${money(held)}</b></div>`:''}
      <div class="sumrow"><span>ديون حالّة عليك الآن</span><input class="inp num zkin" id="zkDebt" inputmode="decimal" value="${esc(Z.debt===''?amtIn(r3(due)):Z.debt)}"></div>
      <div class="sumrow total"><span>المال الخاضع للزكاة</span><b class="num">${money(base)}</b></div>
      <div class="sumrow"><span>النصاب (85 غرام ذهب)</span><b class="num">${nisab?money(nisab):'—'}</b></div>
      <div class="sumrow total"><span>الزكاة الواجبة (2.5%)</span><b class="num ${zk?'amt-inc':''}">${nisab?(zk?money(zk):'لم يبلغ النصاب'):'اكتب سعر الذهب'}</b></div></div>
     <div class="field"><label for="zkHawl">تاريخ بلوغ مالك النصاب (لحساب الحول الهجري)</label><input class="inp" type="date" id="zkHawl" value="${esc(Z.hawl)}"></div>
     ${hd!==null?`<div class="note">${hd>0?'يحول الحول بعد '+daysWord(hd)+' (في '+fmtD(addDays(Z.hawl,354))+')':'حال الحول، فأخرج زكاتك إن كان المال باقيًا فوق النصاب'}</div>`:''}
     <p class="note" style="margin:0">حاسبة للاسترشاد بحسب القول المشهور (ربع العشر بعد بلوغ النصاب ومرور الحول). للمسائل الخاصة كالديون المؤجلة والذهب المستعمل اسأل أهل العلم.</p></div>
     <div class="actions"><button class="btn block" id="zkSave">حفظ</button><button class="btn ghost block" data-close>إغلاق</button></div></div></div>`};
  const grab=()=>{const g=i=>document.getElementById(i);if(g('zkGold'))Z.gold=g('zkGold').value;if(g('zkExtra'))Z.extra=g('zkExtra').value;if(g('zkDebt'))Z.debt=g('zkDebt').value;if(g('zkHawl'))Z.hawl=g('zkHawl').value};
  draw();L.oninput=null;L.onchange=e=>{if(['zkGold','zkExtra','zkDebt','zkHawl'].includes(e.target.id)){grab();const y=L.querySelector('.sheet').scrollTop;draw();L.querySelector('.sheet').scrollTop=y}};
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='zkSave'){grab();S.settings.zakat=Z;await putSettings();L.innerHTML='';toast('حُفظت بيانات الزكاة')}}}
/* ===== سقف الفئات (تنبيه 80%) والاشتراكات المتكررة ===== */
function capAlerts(){const m=ym(new Date()),B=S.settings.budgets||{};const sp={};inMonth(m).filter(t=>t.type==='exp').forEach(t=>sp[t.cat]=(sp[t.cat]||0)+(+t.amount));
  return Object.entries(B).filter(([c,v])=>+v>0&&(sp[c]||0)>=0.8*v).map(([c,v])=>({c,v:+v,s:r3(sp[c]||0),pct:Math.round((sp[c]||0)/v*100)})).sort((a,b)=>b.pct-a.pct)}
function subsDetect(){const cm=ym(new Date());const ms=[1,2,3,4].map(k=>shiftMonth(cm,-k));const by={};
  list().filter(t=>t.type==='exp'&&!t.rec&&!t.debt&&t.note&&t.date>=ms[3]+'-01'&&t.date<cm+'-01').forEach(t=>{const k=mkey(t.note);if(!k)return;(by[k]=by[k]||{n:t.note,cat:t.cat,M:{}}).M[t.date.slice(0,7)]=+t.amount});
  const known=new Set(recs().map(r=>mkey(r.name)));
  return Object.values(by).filter(o=>{const v=Object.values(o.M);if(v.length<3)return false;const a=v.reduce((s,x)=>s+x,0)/v.length;return v.every(x=>Math.abs(x-a)<=Math.max(0.5,a*0.12))}).filter(o=>!known.has(mkey(o.n)))
    .map(o=>{const v=Object.values(o.M);return{n:o.n,cat:o.cat,a:r3(v.reduce((s,x)=>s+x,0)/v.length),k:v.length}}).sort((a,b)=>b.a-a.a).slice(0,6)}
function subsHtml(){const L=subsDetect();if(!L.length)return '';
  return `<h2>اشتراكات ومصاريف متكررة لاحظتها</h2><div class="panel">${L.map(s=>`<div class="sumrow"><span>${esc(s.n)} <small class="note">· ${s.k} أشهر متتالية تقريبًا</small></span><span><b class="num">${money(s.a)}</b> <button class="chip" data-subadd="${esc(s.n)}|${s.a}|${esc(s.cat)}"><span class="lk">🔒 </span>أضفه للالتزامات</button></span></div>`).join('')}
   <p class="note" style="margin:6px 0 0">راجعها: هل ما زلت تحتاجها؟ وإن كانت ثابتة أضفها للالتزامات الشهرية لتدخل في خطتك.</p></div>`}
/* ===== مقارنة سنوية واتجاه الفئات ===== */
function yearCmpHtml(m){const a=inMonth(m),b=inMonth(shiftMonth(m,-12));if(!b.length)return '';const ea=sum(a,'exp'),eb=sum(b,'exp'),ia=sum(a,'inc'),ib=sum(b,'inc');const p=(x,y)=>y?Math.round((x-y)/y*100):null;
  const cell=(l,x,y,good)=>{const d=p(x,y);return `<div class="hstat"><span>${l}</span><b class="num">${money(x)}</b><small>العام الماضي ${money(y)}${d===null?'':' · <span class="'+((good?d>=0:d<=0)?'amt-inc':'amt-exp')+'">'+(d>0?'+':'')+d+'%</span>'}</small></div>`};
  return `<h2>مقارنة بنفس الشهر من العام الماضي</h2><div class="hstats">${cell('الدخل',ia,ib,true)}${cell('المصاريف',ea,eb,false)}</div>`}
function catTrendHtml(m){const ms=[5,4,3,2,1,0].map(k=>shiftMonth(m,-k));const tot={};const V={};
  ms.forEach(mm=>inMonth(mm).filter(t=>t.type==='exp').forEach(t=>{tot[t.cat]=(tot[t.cat]||0)+(+t.amount);(V[t.cat]=V[t.cat]||{})[mm]=((V[t.cat]||{})[mm]||0)+(+t.amount)}));
  const top=Object.entries(tot).sort((a,b)=>b[1]-a[1]).slice(0,5);if(top.length<2)return '';
  return `<h2>اتجاه أهم الفئات (6 أشهر)</h2><div class="panel">${top.map(([c])=>{const vals=ms.map(mm=>V[c][mm]||0);const mx=Math.max(...vals)||1;const last=vals[5],prev=vals[4];const d=prev?Math.round((last-prev)/prev*100):null;const cc=catOf(c);
    return `<div class="ctrend"><span class="ct-n">${esc(cc.n)}</span><span class="ct-b">${vals.map((v,i)=>`<i style="height:${Math.max(3,v/mx*100)}%;background:${cc.c}${i===5?'':'99'}" title="${money(v)}"></i>`).join('')}</span><span class="ct-v"><b class="num">${money(last)}</b>${d===null?'':`<small class="${d>0?'amt-exp':'amt-inc'}">${d>0?'↑':'↓'}${Math.abs(d)}%</small>`}</span></div>`}).join('')}</div>`}
/* ===== مساحة التطبيق على الجهاز ===== */
let storMemo=null;async function storageInfo(){if(storMemo&&Date.now()-storMemo.t<20000)return storMemo.v;const v=await storageInfo0();storMemo={t:Date.now(),v};return v}
async function storageInfo0(){let usage=null,quota=null;try{if(navigator.storage&&navigator.storage.estimate){const e=await navigator.storage.estimate();usage=e.usage;quota=e.quota}}catch(e){}
  let ls=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);ls+=(k.length+(localStorage.getItem(k)||'').length)*2}}catch(e){}
  let snaps=0;try{snaps=(await snapList()).reduce((s,x)=>s+(x.size||0)*2,0)}catch(e){}
  const docs=Vault.docs.reduce((s,d)=>s+(d.files||[]).reduce((a,f)=>a+(+f.size||0),0),0);
  let cache=0;try{if(window.caches){for(const k of await caches.keys()){const c=await caches.open(k);for(const r of await c.keys()){const res=await c.match(r);if(res){const b=await res.clone().blob();cache+=b.size}}}}}catch(e){}
  return{usage,quota,ls,snaps,docs,cache}}
function fmtBytes(b){if(b==null)return '—';if(b<1024)return b+' بايت';if(b<1048576)return (b/1024).toFixed(0)+' كيلوبايت';return (b/1048576).toFixed(1)+' ميجابايت'}
async function fillStorage(el){if(!el)return;const s=await storageInfo();const total=s.usage!=null?s.usage:s.ls+s.snaps+s.docs+s.cache;
  el.innerHTML=`<div class="sumrow"><span>المساحة المستخدمة على جهازك</span><b class="num">${fmtBytes(total)}</b></div>
   <div class="sumrow sub"><span>بياناتك (العمليات والأقسام)</span><span class="num">${fmtBytes(s.ls)}</span></div>
   <div class="sumrow sub"><span>اللقطات التلقائية</span><span class="num">${fmtBytes(s.snaps)}</span></div>
   <div class="sumrow sub"><span>مستنداتي (مشفّرة)</span><span class="num">${fmtBytes(s.docs)}</span></div>
   <div class="sumrow sub"><span>ملفات التطبيق للعمل بدون إنترنت</span><span class="num">${fmtBytes(s.cache)}</span></div>
   ${s.quota?`<div class="sumrow sub"><span>المتاح للتطبيق</span><span class="num">${fmtBytes(s.quota)}</span></div>`:''}`}
/* ===== اختصارات الآيفون: تسجيل رسالة البنك أو مصروف من رابط ===== */
function handleLaunchUrl(){let q;try{q=new URLSearchParams(location.search)}catch(e){return}const sms=q.get('sms'),amt=q.get('amt');if(!sms&&!amt)return;
  try{history.replaceState(null,'',location.pathname)}catch(e){}
  setTimeout(()=>{if(document.getElementById('lockScreen')){const iv=setInterval(()=>{if(!document.getElementById('lockScreen')){clearInterval(iv);go()}},400)}else go()},300);
  function go(){if(sms){IMP={text:sms,items:[]};openImport();setTimeout(()=>{const b=document.getElementById('iParse');if(b)b.click()},120)}
    else openSheet(null,{type:q.get('type')==='inc'?'inc':'exp',amount:amt,cat:q.get('cat')||'',note:q.get('note')||''})}}
function openShortcutGuide(){const L=document.getElementById('layer');const url=appUrl();
  L.innerHTML=`${sheetTop('الاختصارات')}<h2 style="margin-top:0">⚡ تسجيل رسائل البنك تلقائيًا</h2>
   <p class="note">بأتمتة من تطبيق «الاختصارات» في الآيفون: عند وصول رسالة من البنك يفتح التطبيق وفيه العملية جاهزة، فتضغط «إضافة» فقط. الرسالة لا تمر على أي طرف آخر.</p>
   <ol class="steps"><li>افتح تطبيق <b>الاختصارات</b> ← تبويب <b>الأتمتة</b> ← <b>+</b> ← <b>رسالة</b>.</li>
    <li>في «المرسل» اختر اسم البنك، أو في «الرسالة تحتوي» اكتب كلمة مثل <b>OMR</b> أو <b>ر.ع</b>. اختر <b>التشغيل فورًا</b>.</li>
    <li>أضف الإجراء <b>فتح عناوين URL</b>، والصق الرابط التالي، ثم ضع بعد <b>sms=</b> المتغيّر <b>«الرسالة»</b> بعد تمريره على إجراء <b>ترميز URL</b>.</li></ol>
   <div class="codebox" dir="ltr">${esc(url)}?sms=</div><button class="btn ghost block" id="scCopy">نسخ الرابط</button>
   <p class="note">ولتسجيل مصروف سريع من اختصار أو من Siri: <span dir="ltr">${esc(url)}?amt=3.5&amp;note=قهوة</span></p>
   <div class="actions"><button class="btn ghost block" data-close>إغلاق</button></div></div></div>`;
  L.oninput=L.onchange=null;L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='scCopy'){try{await navigator.clipboard.writeText(url+'?sms=');toast('نُسخ الرابط')}catch(er){toast('انسخه يدويًا من المربع')}}}}
/* نصائح المستشار من الأدوات الجديدة */
function proAdvice(add){{const d=dailyPlan();if(d.has&&d.avail+d.spentToday<-0.0005)add(94,'warn','التزاماتك المتبقية أكبر مما معك','العجز المتوقع '+periodTo(d)+' <b class="num">'+amtH(-(d.avail+d.spentToday))+'</b>. رتّب الالتزامات حسب الأولوية قبل أي شراء.',['ماذا أفعل؟','data-shortfall="1"'])}
  paceAlerts().slice(0,2).forEach(x=>add(56,'budget','بهذا المعدل قد تتجاوز ميزانية «'+esc(catOf(x.c).n)+'»','أنفقت <b class="num">'+amtH(x.s)+'</b> من <b class="num">'+amtH(x.v)+'</b> خلال '+countWord(x.day,'يوم واحد','يومين','أيام','يومًا')+'. إذا استمر الإنفاق بالمعدل نفسه قد يصل إلى <b class="num">'+amtH(x.proj)+'</b> بنهاية الشهر (تقدير وليس توقعًا مضمونًا).',['الميزانية','data-tab="budget"']));
capAlerts().slice(0,2).forEach(a=>add(a.pct>=100?86:66,'budget',(a.pct>=100?'تجاوزت سقف ':'وصلت ')+a.pct+'% من سقف «'+esc(catOf(a.c).n)+'»','صرفت <b class="num">'+amtH(a.s)+'</b> من <b class="num">'+amtH(a.v)+'</b> هذا الشهر.',['الميزانية','data-tab="budget"']));
  const F=forecast(3);const neg=F.ok?F.rows.find(r=>r.left<0):null;if(neg)add(74,'warn','شهر '+esc(MONTHS[+neg.m.slice(5)-1])+' متوقع بالسالب','المتوقع <b class="num">−'+amtH(Math.abs(neg.left))+'</b> بعد الالتزامات والأقساط والخطط. جهّز له من الآن.',['التوقّعات','data-tab="reports"']);
  const m=accList().find(a=>a.id==='main');if(m&&m.anchor&&m.anchor.date<addDays(today(),-30))add(45,'cal','طابق رصيد حسابك الجاري','آخر مطابقة كانت '+fmtD(m.anchor.date)+'. المطابقة الشهرية تكشف أي مصروف نسيت تسجيله.',['حساباتي','data-accopen="1"'])}

/* ---------- 28ب. البيانات الأساسية: إدخال الأسماء والجهات والحسابات مرة واحدة، ثم الاختيار منها في كل مكان ---------- */
const PAYEE_T={bank:'بنك / جهة تمويل',shop:'محل / متجر',gov:'جهة حكومية / خدمات',person:'شخص',other:'أخرى'};
function payees(){return S.settings.payees||[]}
/* كل الأسماء المسجّلة (أشخاص وجهات) للاختيار منها */
function knownNames(types){const P=payees().filter(p=>!types||types.includes(p.type)).map(p=>p.name);return [...new Set(P.concat(!types||types.includes('person')?people().map(p=>p.name):[]))].filter(Boolean)}
/* إدارة الراتب: نفس أرقام «المتبقي» في الرئيسية، مع ضبط يوم الراتب ومبلغه وتسجيله */
function salAmt(){const v=+S.settings.salaryAmt;if(v>0)return v;const ls=lastSalary();return ls?+ls.amount:0}
function salMgmtHtml(){const now=new Date(),cm=ym(now),pc=payCycle(),a=pc?inRange(pc.start,pc.end):inMonth(cm);const inc=sum(a,'inc'),exp=sum(a,'exp'),left=r3(inc-exp);
  const st=recStatus(cm),due=st.dueLeft,after=r3(left-due);const sal=a.filter(t=>t.type==='inc'&&t.cat==='salary').sort((x,y)=>y.date.localeCompare(x.date))[0];
  const pd=+S.settings.payday||0,rule=S.settings.payRule||'none',SA=salAmt();
  return `<div class="panel stack salbox">
   <div class="salhead"><span>${pc?'دورة الراتب: '+dmy(pc.start)+' ← '+dmy(pc.end):'شهر '+esc(MONTHS[now.getMonth()])+' '+now.getFullYear()}</span><small>نفس الأرقام التي تظهر في الرئيسية، وتتحدث معها تلقائيًا</small></div>
   <div class="salgrid">
    <div><span>الدخل</span><b class="num amt-inc">${amtH(inc)}</b></div>
    <div><span>المصاريف</span><b class="num amt-exp">${amtH(exp)}</b></div>
    <div class="big ${left<0?'neg':''}"><span>المتبقي من الراتب</span><b class="num">${left<0?'−':''}${amtH(Math.abs(left))}</b></div>
    <div><span>التزامات لم تُدفع</span><b class="num">${amtH(due)}</b></div>
    <div class="${after<0?'neg':''}"><span>المتبقي بعد الالتزامات</span><b class="num">${after<0?'−':''}${amtH(Math.abs(after))}</b></div>
    ${pc?`<div><span>الراتب القادم</span><b>${dmy(pc.next)}</b><small>بعد ${countWord(pc.left,'يوم واحد','يومين','أيام','يومًا')}</small></div>`:''}
   </div>
   ${sal?`<div class="okbox" style="margin:0">✓ سُجّل راتب هذه ${pc?'الدورة':'الشهر'}: <b class="num">${amtH(sal.amount)}</b> بتاريخ ${dmy(sal.date)}</div>`:`<div class="warnbox" style="margin:0">لم يُسجَّل راتب ${pc?'هذه الدورة':'هذا الشهر'} بعد.</div>`}
   <button class="btn block" data-salrec="1">💰 ${sal?'تسجيل دخل/راتب آخر':'تسجيل الراتب الآن'}${SA?' · '+money(SA):''}</button>
   <div class="setrow col"><div><b>الراتب المعتاد</b><small>يُقترح عند تسجيل الراتب، وإن تركته فارغًا يُستخدم آخر راتب سجّلته</small></div><div class="capin"><input class="inp num" id="salAmt" inputmode="decimal" placeholder="0.000" value="${+S.settings.salaryAmt?amtIn(S.settings.salaryAmt):''}" style="text-align:left" enterkeyhint="done"><button class="btn" id="salAmtSave">حفظ</button></div></div>
   <div class="setrow col"><div><b>يوم نزول الراتب</b><small>${pd?'تُحسب الرئيسية من يوم نزوله حتى الراتب القادم':'غير محدد: تُحسب الرئيسية حتى نهاية الشهر'}</small></div><select class="inp" id="payDay"><option value="0" ${!pd?'selected':''}>غير محدد</option>${[...Array(31)].map((_,i)=>`<option value="${i+1}" ${pd===i+1?'selected':''}>يوم ${i+1}</option>`).join('')}</select></div>
   ${pd?`<div class="setrow col"><div><b>إذا صادف جمعة أو سبت</b></div><div class="seg seg3">${[['none','في موعده'],['before','ينزل قبلها'],['after','ينزل بعدها']].map(([v,n])=>`<button class="n" data-prule="${v}" aria-pressed="${rule===v}">${n}</button>`).join('')}</div></div>`:''}
   <div class="row2"><button class="btn ghost" data-dayplan="1">📅 خطة الصرف اليومية</button><button class="btn ghost" data-tab="home">🏠 عرض في الرئيسية</button></div></div>`}
function vMaster(){const P=people(),Y=payees(),A=accList(),R=recs(),D=debts();
  const row=(t,s,attr,ico)=>`<div class="mdrow">${ico?`<button class="mdico" data-icoedit="${ico[0]}" data-iconame="${t}" aria-label="تغيير صورة ${t}">${ico[1]}<span class="mdico-e">✎</span></button>`:''}<div><b>${t}</b>${s?`<small>${s}</small>`:''}</div>${attr?`<button class="chip" ${attr}><span class="lk">🔒 </span>تعديل</button>`:''}</div>`;
  const sec=(title,items,addAttr,addTxt,empty)=>`<h2>${title}</h2><div class="panel mdlist">${items.length?items.join(''):`<p class="note" style="margin:6px 0">${empty}</p>`}</div><button class="chip secadd" ${addAttr}><span class="lk">🔒 </span>${addTxt}</button>`;
  return `<div class="backrow" style="margin-top:4px"><h2 style="margin:0">${esc(lbl('sec.master'))}</h2><button class="chip" data-tab="home">الرئيسية ‹</button></div>
  <p class="note" style="margin:0 2px 10px">أدخل هنا الأشخاص والجهات والحسابات والالتزامات والديون مرة واحدة، فتظهر جاهزة للاختيار في كل مكان بالتطبيق، بدون كتابة الأسماء من جديد ولا أخطاء إملائية.</p>
  <h2>📊 الاستيراد والتصدير (Excel / Numbers)</h2>${mdIoHtml()}
  <h2>أقسامي</h2>${dashHtml(true)}${quickHtml()}
  <h2>💼 الراتب والمتبقي هذا الشهر</h2>${salMgmtHtml()}
  ${sec('👨‍👩‍👧 الأشخاص',P.map(p=>row(esc(p.name),[p.rel?esc(p.rel):'',+p.allowance?'المخصص '+money(p.allowance):''].filter(Boolean).join(' · '),`data-pedit="${esc(p.id)}"`,['person:'+p.id,personAv(p)])),'data-padd="1"','+ شخص','لا يوجد أشخاص بعد.')}
  ${sec('🏢 الجهات (بنوك، محلات، جهات)',Y.map(p=>row(esc(p.name),esc(PAYEE_T[p.type]||PAYEE_T.other)+(p.note?' · '+esc(p.note):''),`data-payedit="${esc(p.id)}"`,['payee:'+p.id,payeeBadge(p)])),'id="payAdd"','+ جهة','أضف البنوك والمحلات والجهات التي تتعامل معها لتختارها بدل كتابتها.')}
  ${sec('💳 الحسابات',A.map(a=>row(esc(a.name),esc(ACC_KIND[a.kind]||''),`data-acedit="${esc(a.id)}"`,['acc:'+a.id,accBadge(a)])),'id="acAdd"','+ حساب','')}
  ${sec('🔁 الالتزامات الشهرية',R.map(r=>row(esc(r.name),money(amtAt(r,ym(new Date())))+' '+CUR+' · يوم '+(+r.day||1)+(r.person?' · لـ'+esc(personName(r.person)):'')+(r.until?' · حتى '+esc(monthName(r.until)):''),`data-redit="${esc(r.id)}"`,['rec:'+r.id,recBadge(r)])),'data-recpick="1"','+ التزام','لا توجد التزامات بعد.')}
  ${debtsManageHtml()}
  <h2>🏷️ الفئات</h2><div class="panel mdlist"><p class="note" style="margin:6px 0">اضغط على أي أيقونة لتغييرها، فتتغير في السجل والتقارير وكل الصفحات.</p><div class="catico">${EXP_CATS.concat(INC_CATS).map(c=>`<button class="mdico cat" data-icoedit="cat:${c.id}" data-iconame="${esc(c.n)}">${cbadge(c.id)}<span class="mdico-e">✎</span><small>${esc(SHORT[c.id]||c.n)}</small></button>`).join('')}</div></div>`}
function openPayee(id){const L=document.getElementById('layer');const Y=S.settings.payees||(S.settings.payees=[]);const ex=id?Y.find(x=>x.id===id):null;const p=ex?Object.assign({},ex):{id:uidGen(),name:'',type:'shop',note:''};
  const draw=()=>{L.innerHTML=`${sheetTop('جهة')}<h2 style="margin-top:0">${ex?'تعديل الجهة':'جهة جديدة'}</h2><div class="stack">
   <div class="field"><label for="pyName">الاسم</label><input class="inp" id="pyName" value="${esc(p.name)}" maxlength="40" placeholder="مثال: بنك مسقط، لولو، نماء"></div>
   <div class="field"><label>النوع</label><div class="chips">${Object.entries(PAYEE_T).map(([k,n])=>`<button class="chip" data-pyt="${k}" aria-pressed="${p.type===k}">${n}</button>`).join('')}</div></div>
   <div class="field"><label for="pyNote">ملاحظة (اختياري)</label><input class="inp" id="pyNote" value="${esc(p.note||'')}" maxlength="60"></div>
   <p class="note" id="pyErr" hidden style="color:var(--exp);margin:0"></p></div>
   <div class="actions"><button class="btn block" id="pySave">حفظ</button>${ex?'<button class="btn ghost block" id="pyDel" style="color:var(--exp)">حذف الجهة</button>':''}<button class="btn ghost block" data-close>إلغاء</button></div></div></div>`};
  const grab=()=>{p.name=document.getElementById('pyName').value;p.note=document.getElementById('pyNote').value};
  draw();L.oninput=L.onchange=null;
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.dataset.pyt){grab();p.type=x.dataset.pyt;draw();return}
    if(x.id==='pyDel'){S.settings.payees=Y.filter(y=>y.id!==p.id);L.innerHTML='';putSettings();render();toast('حُذفت الجهة');return}
    if(x.id==='pySave'){grab();const n=lblClean(p.name);const er=document.getElementById('pyErr');if(!n){er.hidden=false;er.textContent='اكتب الاسم';return}
      if(Y.some(y=>y.id!==p.id&&y.name.trim()===n)){er.hidden=false;er.textContent='هذا الاسم موجود من قبل';return}
      const o={id:p.id,name:n,type:p.type,note:lblClean(p.note)};S.settings.payees=ex?Y.map(y=>y.id===p.id?o:y):Y.concat([o]);L.innerHTML='';putSettings();render();toast(ex?'حُفظت الجهة':'أُضيفت «'+n+'»')}}}
/* إضافة اسم جديد بسرعة من داخل أي نموذج (يُحفظ في البيانات الأساسية) */
function quickPayee(type){const n=lblClean(prompt('اسم '+(type==='person'?'الشخص':'الجهة')+' الجديد:')||'');if(!n)return '';
  const Y=S.settings.payees||(S.settings.payees=[]);if(!Y.some(y=>y.name===n)&&!people().some(p=>p.name===n)){Y.push({id:uidGen(),name:n,type:type||'other',note:''});putSettings()}return n}
function nameSelect(id,val,types,ph){const names=knownNames(types);if(val&&!names.includes(val))names.unshift(val);
  return `<select class="inp" id="${id}" data-namesel="${(types||[]).join(',')}"><option value="">${ph||'— اختر —'}</option>${names.map(n=>`<option value="${esc(n)}" ${n===val?'selected':''}>${esc(n)}</option>`).join('')}<option value="__new">+ اسم جديد…</option></select>`}
document.addEventListener('change',e=>{const s=e.target;if(!s.matches||!s.matches('select[data-namesel]')||s.value!=='__new')return;
  const t=s.dataset.namesel.split(',')[0]||'other';const n=quickPayee(t);if(!n){s.value='';return}
  if(![...s.options].some(o=>o.value===n)){const o=document.createElement('option');o.value=n;o.textContent=n;s.insertBefore(o,s.lastElementChild)}s.value=n},true);

/* ===== Excel / Numbers: تصدير البيانات الأساسية بقوائم منسدلة، واستيرادها بعد التعديل ===== */
/* أقسام الاستيراد والتصدير: لكل قسم ورقة مستقلة وزرّان */
const MD_SECS=[['inc','💰','الإيداعات والدخل','الإيداعات'],['exp','💸','المصروفات والخصومات','المصروفات'],['people','👨‍👩‍👧','الأشخاص','الأشخاص'],['payees','🏢','الجهات','الجهات'],['accounts','💳','الحسابات','الحسابات'],['recurring','🔁','الالتزامات الشهرية','الالتزامات الشهرية'],['debts','🏦','الديون','الديون']];
const MD_PER=[['month','هذا الشهر'],['year','هذه السنة'],['all','الكل'],['blank','قالب فارغ']];
function mdPer(){return (S.settings.mdPer)||'month'}
function mdCount(k){const R=expRange(mdPer()==='blank'?'month':mdPer());if(k==='inc'||k==='exp')return mdPer()==='blank'?0:inRange(R.from,R.to).filter(t=>t.type===k).length;
  return {people:people(),payees:payees(),accounts:accList(),recurring:recs(),debts:debts()}[k].length}
function mdIoHtml(){const per=mdPer();
  return `<div class="panel stack mdio">
   <div class="field" style="margin:0"><label>فترة الإيداعات والمصروفات في الملف</label><div class="seg">${MD_PER.map(([k,n])=>`<button class="n" data-mdper="${k}" aria-pressed="${per===k}">${n}</button>`).join('')}</div></div>
   <div class="mdio-list">${MD_SECS.map(([k,ic,n])=>`<div class="mdio-row${k==='inc'?' inc':k==='exp'?' exp':''}"><div><b>${ic} ${n}</b><small>${mdCount(k)} ${k==='inc'||k==='exp'?(per==='blank'?'· قالب للإدخال':'· '+esc(expRange(per).label)):'سجل'}</small></div><div class="mdio-btns"><button class="chip" data-mdx="${k}" aria-label="تصدير ${n}">📤 تصدير</button><button class="chip" data-mdi="${k}" aria-label="استيراد ${n}"><span class="lk">🔒 </span>📥 استيراد</button></div></div>`).join('')}</div>
   <div class="row2"><button class="btn ghost" data-mdx="all">📤 تصدير الكل في ملف واحد</button><button class="btn ghost" data-mdi="all"><span class="lk">🔒 </span>📥 استيراد ملف كامل</button></div>
   <input type="file" id="mdFile" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>
   <span class="note" style="margin:0">صدّر القسم، عدّله في Numbers أو Excel (القوائم المنسدلة جاهزة في كل عمود)، ثم استورده من نفس القسم: تظهر معاينة قبل أي تغيير، وبعد الحفظ تتم المزامنة تلقائيًا. لا تغيّر عمود «المعرّف»، والصف الجديد يُترك معرّفه فارغًا.</span></div>`}
const MD_LISTS=()=>({
  cats:EXP_CATS.map(c=>c.n),kinds:Object.values(REC_KINDS).map(k=>k.n),dtypes:Object.values(DEBT_T).map(t=>t[0]),ptypes:Object.values(PAYEE_T),
  akinds:[ACC_KIND.other,ACC_KIND.card],people:people().map(p=>p.name),lenders:knownNames(),icats:INC_CATS.map(c=>c.n),meths:METHODS.map(m=>m[1]),accs:accList().map(a=>a.name)});
function mdSheets(only){const Lz=MD_LISTS(),sub='أُعدّ في '+fmtD(today())+' · لا تغيّر عمود «المعرّف». صف جديد = اترك المعرّف فارغًا. اختر من القوائم المنسدلة.';
  const LC='ABCDEFGHIJ';const listsSheet={name:'القوائم',title:'القوائم الجاهزة للاختيار',sub:'هذه القوائم تغذّي الأسهم المنسدلة في الأوراق الأخرى. أضف الأشخاص والجهات والحسابات من أوراقها أو من التطبيق.',
    head:[['فئات المصروف','s',22],['أنواع الالتزامات','s',24],['أنواع الديون','s',18],['أنواع الجهات','s',22],['أنواع الحسابات','s',16],['الأشخاص','s',18],['الجهات والأشخاص','s',22],['فئات الدخل','s',18],['طرق الدفع','s',12],['الحسابات','s',18]],rows:[]};
  const cols=[Lz.cats,Lz.kinds,Lz.dtypes,Lz.ptypes,Lz.akinds,Lz.people,Lz.lenders,Lz.icats,Lz.meths,Lz.accs];const n=Math.max(...cols.map(c=>c.length));
  for(let i=0;i<n;i++)listsSheet.rows.push(cols.map(c=>c[i]||''));
  const ref=(c,len)=>`'القوائم'!$${LC[c]}$5:$${LC[c]}$${Math.max(5,4+len+30)}`;
  const C=ym(new Date()),per=mdPer(),R=expRange(per==='blank'?'month':per);const TX=per==='blank'?[]:inRange(R.from,R.to).sort((a,b)=>a.date.localeCompare(b.date)||(a.createdAt||'').localeCompare(b.createdAt||''));
  const mName=k=>(METHODS.find(m=>m[0]===k)||['',''])[1];
  const all={
   inc:{name:'الإيداعات',title:'الإيداعات والدخل'+(per==='blank'?'':' · '+R.label),sub,head:[['المعرّف','s',16],['التاريخ','d'],['المبلغ','n'],['الفئة','s',18],['البيان','s',28],['طريقة الدفع','s',12],['الحساب','s',18]],
     rows:TX.filter(t=>t.type==='inc').map(t=>[t.id,t.date,+t.amount,catOf(t.cat).n,t.note||'',mName(t.method),accName(accOf(t))]),dv:[[3,ref(7,Lz.icats.length)],[5,ref(8,3)],[6,ref(9,Lz.accs.length)]]},
   exp:{name:'المصروفات',title:'المصروفات والخصومات'+(per==='blank'?'':' · '+R.label),sub,head:[['المعرّف','s',16],['التاريخ','d'],['المبلغ','n'],['الفئة','s',18],['البيان','s',28],['طريقة الدفع','s',12],['الحساب','s',18],['لمن','s',16]],
     rows:TX.filter(t=>t.type==='exp').map(t=>[t.id,t.date,+t.amount,catOf(t.cat).n,t.note||'',mName(t.method),accName(accOf(t)),t.person?personName(t.person):'']),dv:[[3,ref(0,Lz.cats.length)],[5,ref(8,3)],[6,ref(9,Lz.accs.length)],[7,ref(5,Lz.people.length)]]},
   people:{name:'الأشخاص',title:'الأشخاص',sub,head:[['المعرّف','s',16],['الاسم','s',22],['الصلة','s',16],['المخصص الشهري','n']],rows:people().map(p=>[p.id,p.name,p.rel||'',+p.allowance||''])},
   payees:{name:'الجهات',title:'الجهات: بنوك، محلات، جهات',sub,head:[['المعرّف','s',16],['الاسم','s',24],['النوع','s',22],['ملاحظة','s',26]],rows:payees().map(p=>[p.id,p.name,PAYEE_T[p.type]||PAYEE_T.other,p.note||'']),dv:[[2,ref(3,Lz.ptypes.length)]]},
   accounts:{name:'الحسابات',title:'الحسابات',sub,head:[['المعرّف','s',16],['الاسم','s',24],['النوع','s',18]],rows:accList().map(a=>[a.id,a.name,ACC_KIND[a.kind]||ACC_KIND.other]),dv:[[2,ref(4,2)]]},
   recurring:{name:'الالتزامات الشهرية',title:'الالتزامات الشهرية',sub,head:[['المعرّف','s',16],['الاسم','s',24],['النوع','s',24],['الفئة','s',18],['المبلغ الشهري','n'],['يوم الدفع','i'],['يبدأ (سنة-شهر)','s',14],['ينتهي (سنة-شهر)','s',14],['لمن','s',16]],
    rows:recs().map(r=>[r.id,r.name,(REC_KINDS[r.kind]||REC_KINDS.custom).n,catOf(r.cat).n,amtAt(r,C),{v:+r.day||1,t:'i'},r.start||'',r.until||'',r.person?personName(r.person):'']),dv:[[2,ref(1,Lz.kinds.length)],[3,ref(0,Lz.cats.length)],[8,ref(5,Lz.people.length)]]},
   debts:{name:'الديون',title:'الديون',sub:sub+' · المتبقي للعرض فقط في الديون الموجودة (يتغيّر بالدفعات من التطبيق)',head:[['المعرّف','s',16],['الاسم','s',22],['النوع','s',16],['الجهة / الشخص','s',20],['المتبقي','n'],['القسط الشهري','n'],['الفائدة %','n'],['يوم الدفع','i'],['تاريخ بداية الدين','s',14],['بداية المتابعة في التطبيق','s',16],['عدد الأقساط الكلي','i'],['أقساط مدفوعة قبل المتابعة','i'],['رقم العقد','s',16]],
    rows:debts().map(d=>[d.id,d.name,(DEBT_T[d.type]||DEBT_T.other)[0],d.lender||'',+d.balance||0,+d.payment||0,+d.rate||0,{v:+d.day||1,t:'i'},debtStart(d)||'',debtTrackFrom(d),+d.totalN||'',+d.paidN||'',d.ref||'']),dv:[[2,ref(2,Lz.dtypes.length)],[3,ref(6,Lz.lenders.length)]]}};
  const keys=!only||only==='all'?MD_SECS.map(x=>x[0]):[only];
  return keys.map(k=>all[k]).concat([listsSheet])}
async function mdExport(only){const data=XL.build(mdSheets(only));const sec=MD_SECS.find(x=>x[0]===only);
  const nm='idarat-shuooni-'+(sec?{inc:'deposits',exp:'expenses',people:'people',payees:'payees',accounts:'accounts',recurring:'monthly',debts:'debts'}[only]:'data')+(only==='inc'||only==='exp'||!sec?'-'+(mdPer()==='blank'?'template':mdPer()==='all'?'all':expRange(mdPer()).from.slice(0,mdPer()==='year'?4:7)):'')+'.xlsx';
  const r=await shareFile(nm,data,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  if(r!=='cancel')toast(r==='shared'?'اختر «Numbers» لفتحه وتعديله، ثم استورده من نفس القسم':'حُفظ الملف '+nm+'، عدّله في Numbers أو Excel ثم استورده',null,6000)}
/* قراءة ملف xlsx داخل الجهاز (بدون أي اتصال) */
async function readXlsx(buf){const u8=new Uint8Array(buf),dv=new DataView(buf);let eo=-1;for(let i=u8.length-22;i>=Math.max(0,u8.length-66000);i--){if(dv.getUint32(i,true)===0x06054b50){eo=i;break}}
  if(eo<0)throw new Error('notzip');const cnt=dv.getUint16(eo+10,true);let p=dv.getUint32(eo+16,true);const files={};const td=new TextDecoder();
  for(let k=0;k<cnt;k++){if(dv.getUint32(p,true)!==0x02014b50)break;const meth=dv.getUint16(p+10,true),csz=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
    files[td.decode(u8.subarray(p+46,p+46+nl))]={meth,csz,off};p+=46+nl+xl+cl}
  const get=async name=>{const f=files[name];if(!f)return null;const lnl=dv.getUint16(f.off+26,true),lxl=dv.getUint16(f.off+28,true);const raw=u8.subarray(f.off+30+lnl+lxl,f.off+30+lnl+lxl+f.csz);
    if(f.meth===0)return td.decode(raw);if(f.meth!==8||typeof DecompressionStream==='undefined')throw new Error('method');
    const out=await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();return td.decode(out)};
  const X=s=>new DOMParser().parseFromString(s,'application/xml');const T=(n,t)=>[...n.getElementsByTagNameNS('*',t)];
  const wb=X(await get('xl/workbook.xml')||'');const rels=X(await get('xl/_rels/workbook.xml.rels')||'');const rmap={};T(rels,'Relationship').forEach(r=>rmap[r.getAttribute('Id')]=r.getAttribute('Target'));
  const ssx=await get('xl/sharedStrings.xml');const SS=ssx?T(X(ssx),'si').map(si=>T(si,'t').map(t=>t.textContent).join('')):[];
  const out={};for(const sh of T(wb,'sheet')){const rid=sh.getAttribute('r:id')||sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');let tg=rmap[rid]||'';tg=tg.replace(/^\/?(xl\/)?/,'xl/');
    const xs=await get(tg);if(!xs)continue;const rows=[];for(const r of T(X(xs),'row')){const ri=+r.getAttribute('r')||rows.length+1;const arr=[];
      for(const c of T(r,'c')){const ref=c.getAttribute('r')||'';const L=(ref.match(/^[A-Z]+/)||['A'])[0];let ci=0;for(const ch of L)ci=ci*26+ch.charCodeAt(0)-64;ci--;const t=c.getAttribute('t');const v=T(c,'v')[0];let val='';
        if(t==='s')val=SS[+(v&&v.textContent)]||'';else if(t==='inlineStr')val=T(c,'t').map(x=>x.textContent).join('');else if(t==='b')val=v&&v.textContent==='1';else if(v){val=t==='str'||t==='e'?v.textContent:Number(v.textContent);if(typeof val==='number'&&isNaN(val))val=v.textContent}
        arr[ci]=val}rows[ri-1]=arr}
    out[sh.getAttribute('name')]=rows}
  return out}
const xlDate=v=>typeof v==='number'&&v>20000&&v<80000?isoD(new Date(Math.round((v-25569)*864e5)+43200000)):String(v||'').trim();
const xlMonth=v=>{if(v===''||v==null)return '';const s=xlDate(v);let m=s.match(/^(\d{4})-(\d{1,2})/);if(m)return m[1]+'-'+m[2].padStart(2,'0');m=s.match(/^(\d{1,2})[\/\-.](\d{4})$/);if(m)return m[2]+'-'+m[1].padStart(2,'0');m=s.match(/^\d{1,2}[\/\-.](\d{1,2})[\/\-.](\d{4})$/);if(m)return m[2]+'-'+m[1].padStart(2,'0');return null};
const xlNum=v=>typeof v==='number'?v:(String(v||'').trim()===''?'':parseAmt(String(v)));
/* تحويل الأوراق إلى تغييرات مقترحة مع التحقق من كل صف */
function mdPlan(book,only){const P={inc:[],exp:[],people:[],payees:[],accounts:[],recurring:[],debts:[],errors:[],found:[]};const want=k=>!only||only==='all'||only===k;
  const rev=(obj,v)=>{v=String(v||'').trim();return Object.keys(obj).find(k=>obj[k]===v)};
  const SK={'الإيداعات':'inc','المصروفات':'exp','الأشخاص':'people','الجهات':'payees','الحسابات':'accounts','الالتزامات الشهرية':'recurring','الديون':'debts'};
  const table=name=>{if(!want(SK[name]))return null;const rows=book[name];if(!rows)return null;P.found.push(name);const hi=rows.findIndex(r=>r&&r.some(c=>String(c).trim()==='المعرّف'));if(hi<0)return null;const H=rows[hi].map(h=>String(h||'').trim());
    return rows.slice(hi+1).filter(r=>r&&r.some(c=>String(c==null?'':c).trim()!=='')).map((r,i)=>{const o={_row:hi+2+i};H.forEach((h,ci)=>{if(h)o[h]=r[ci]==null?'':r[ci]});return o}).filter(o=>String(o['المعرّف']||'').trim()!=='المجموع')};
  const err=(sh,o,m)=>P.errors.push(sh+' · صف '+o._row+': '+m);
  const s=v=>String(v==null?'':v).trim();
  (table('الأشخاص')||[]).forEach(o=>{const name=lblClean(o['الاسم']);if(!name)return err('الأشخاص',o,'الاسم فارغ');const al=xlNum(o['المخصص الشهري']);if(al===null||isNaN(al))return err('الأشخاص',o,'المخصص ليس رقمًا');P.people.push({id:s(o['المعرّف']),name,rel:lblClean(o['الصلة']),allowance:al===''?'':al})});
  (table('الجهات')||[]).forEach(o=>{const name=lblClean(o['الاسم']);if(!name)return err('الجهات',o,'الاسم فارغ');const t=rev(PAYEE_T,o['النوع'])||(s(o['النوع'])?null:'other');if(!t)return err('الجهات',o,'النوع «'+s(o['النوع'])+'» ليس من القائمة');P.payees.push({id:s(o['المعرّف']),name,type:t,note:lblClean(o['ملاحظة'])})});
  (table('الحسابات')||[]).forEach(o=>{const name=lblClean(o['الاسم']);if(!name)return err('الحسابات',o,'الاسم فارغ');const id=s(o['المعرّف']);const k=id==='main'||id==='cash'?id:(rev({other:ACC_KIND.other,card:ACC_KIND.card},o['النوع'])||(s(o['النوع'])?null:'other'));if(!k)return err('الحسابات',o,'النوع ليس من القائمة');P.accounts.push({id,name,kind:k})});
  const pplName=n=>{n=s(n);if(!n)return '';const p=people().find(x=>x.name===n)||P.people.find(x=>x.name===n);return p?(p.id||'@'+n):null};
  (table('الالتزامات الشهرية')||[]).forEach(o=>{const sh='الالتزامات الشهرية',name=lblClean(o['الاسم']);if(!name)return err(sh,o,'الاسم فارغ');
    const kind=Object.keys(REC_KINDS).find(k=>REC_KINDS[k].n===s(o['النوع']))||(s(o['النوع'])?null:'custom');if(!kind)return err(sh,o,'النوع «'+s(o['النوع'])+'» ليس من القائمة');
    const cat=s(o['الفئة'])?(EXP_CATS.find(c=>c.n===s(o['الفئة'])||SHORT[c.id]===s(o['الفئة']))||{}).id:REC_KINDS[kind].cat;if(!cat)return err(sh,o,'الفئة «'+s(o['الفئة'])+'» ليست من القائمة');
    const amt=xlNum(o['المبلغ الشهري']);if(!(amt>0))return err(sh,o,'المبلغ الشهري غير صحيح');const day=parseInt(o['يوم الدفع'])||1;if(day<1||day>31)return err(sh,o,'يوم الدفع من 1 إلى 31');
    const st=xlMonth(o['يبدأ (سنة-شهر)']),un=xlMonth(o['ينتهي (سنة-شهر)']);if(st===null||un===null)return err(sh,o,'الشهر يُكتب هكذا: 2026-10');if(st&&un&&un<st)return err(sh,o,'شهر النهاية قبل البداية');
    const per=pplName(o['لمن']);if(per===null)return err(sh,o,'الشخص «'+s(o['لمن'])+'» غير موجود في ورقة الأشخاص');
    P.recurring.push({id:s(o['المعرّف']),name,kind,cat,amount:r3(amt),day,start:st,until:un,person:per})});
  (table('الديون')||[]).forEach(o=>{const sh='الديون',name=lblClean(o['الاسم']);if(!name)return err(sh,o,'الاسم فارغ');
    const type=Object.keys(DEBT_T).find(k=>DEBT_T[k][0]===s(o['النوع']))||(s(o['النوع'])?null:'other');if(!type)return err(sh,o,'النوع «'+s(o['النوع'])+'» ليس من القائمة');
    const pay=xlNum(o['القسط الشهري']),rate=xlNum(o['الفائدة %']),bal=xlNum(o['المتبقي']);if([pay,rate,bal].some(v=>v!==''&&(v===null||isNaN(v)||v<0)))return err(sh,o,'رقم غير صحيح');
    const dd=v=>{if(v===''||v==null)return '';const t=xlDate(v);let m=t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');m=t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);if(m)return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');return null};
    const X={};const has=k=>Object.prototype.hasOwnProperty.call(o,k);
    if(has('تاريخ بداية الدين')){const v=dd(o['تاريخ بداية الدين']);if(v===null)return err(sh,o,'تاريخ البداية غير صحيح');if(v)X.start=v}
    if(has('بداية المتابعة في التطبيق')){const v=dd(o['بداية المتابعة في التطبيق']);if(v===null)return err(sh,o,'تاريخ بداية المتابعة غير صحيح');if(v)X.trackFrom=v}
    if(X.start&&X.trackFrom&&X.trackFrom<X.start)return err(sh,o,'بداية المتابعة قبل بداية الدين');
    for(const [k,f] of [['عدد الأقساط الكلي','totalN'],['أقساط مدفوعة قبل المتابعة','paidN']])if(has(k)){const v=xlNum(o[k]);if(v!==''&&(v===null||isNaN(v)||v<0))return err(sh,o,'رقم غير صحيح في «'+k+'»');X[f]=v===''?'':Math.round(v)}
    if(X.totalN&&X.paidN&&X.paidN>X.totalN)return err(sh,o,'الأقساط المدفوعة أكثر من العدد الكلي');
    if(has('رقم العقد'))X.ref=lblClean(o['رقم العقد']);
    P.debts.push(Object.assign({id:s(o['المعرّف']),name,type,lender:lblClean(o['الجهة / الشخص']),payment:pay===''?0:r3(pay),rate:rate===''?0:+rate,day:Math.min(31,Math.max(1,parseInt(o['يوم الدفع'])||1)),balance:bal===''?0:r3(bal)},X))});
  const xlDay=v=>{if(v===''||v==null)return '';const t=xlDate(v);let m=t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');m=t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);if(m)return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');return null};
  const meth=v=>{v=s(v);if(!v)return 'cash';const m=METHODS.find(x=>x[1]===v||x[0]===v);return m?m[0]:null};
  const acc=v=>{v=s(v);if(!v)return '';const a=accList().find(x=>x.name===v)||P.accounts.find(x=>x.name===v);return a?(a.id||null):null};
  [['inc','الإيداعات',INC_CATS],['exp','المصروفات',EXP_CATS]].forEach(([ty,sh,CATS])=>{(table(sh)||[]).forEach(o=>{
    const d=xlDay(o['التاريخ']);if(!d)return err(sh,o,'التاريخ غير صحيح (اكتبه مثل 14/10/2026)');
    const amt=xlNum(o['المبلغ']);if(!(amt>0))return err(sh,o,'المبلغ غير صحيح');
    const cn=s(o['الفئة']);const cat=cn?(CATS.find(c=>c.n===cn||SHORT[c.id]===cn)||{}).id:(ty==='inc'?'iother':'other');if(!cat||!CATS.some(c=>c.id===cat))return err(sh,o,cn?'الفئة «'+cn+'» ليست من قائمة '+(ty==='inc'?'فئات الدخل':'فئات المصروف'):'اختر الفئة');
    const m=meth(o['طريقة الدفع']);if(!m)return err(sh,o,'طريقة الدفع ليست من القائمة');
    const a=acc(o['الحساب']);if(a===null)return err(sh,o,'الحساب «'+s(o['الحساب'])+'» غير موجود');
    let person='';if(ty==='exp'){const pv=pplName(o['لمن']);if(pv===null)return err(sh,o,'الشخص «'+s(o['لمن'])+'» غير موجود');person=pv}
    P[ty].push({id:s(o['المعرّف']),type:ty,date:d,amount:r3(amt),cat,note:lblClean(o['البيان']).slice(0,80),method:m,acc:a,person,_row:o._row,_sh:sh})})});
  return P}
/* مقارنة بما في التطبيق: جديد / معدّل / كما هو */
function mdDiff(P){const txd=ty=>{let add=0,chg=0,same=0,dup=0,miss=0;const keyOf=t=>[t.type,t.date,r3(+t.amount),(t.note||'').trim()].join('|');const have=new Set(list().map(keyOf));
    P[ty].forEach(o=>{const ex=o.id&&S.tx[o.id];if(!ex){if(have.has(keyOf(o))){o._dup=1;dup++;return}if(o.id)miss++;add++;return}const exAcc=ex.acc||'';const ch=['date','amount','cat','note','method','person'].some(k=>String(k==='amount'?r3(+ex[k]):ex[k]||'')!==String(k==='amount'?o.amount:o[k]||''))||(o.acc&&o.acc!==accOf(ex));
      if(ch&&ex.debt&&Math.abs(r3(+ex.amount)-o.amount)>0.0005){o._skip='مرتبطة بدين: عدّل مبلغها من الدين نفسه';P.errors.push(o._sh+' · صف '+o._row+': '+o._skip);return}ch?chg++:same++});return{add,chg,same,dup,miss}};
  const cmp=(list,cur,keys)=>{let add=0,chg=0,same=0,miss=0;list.forEach(o=>{const ex=o.id&&cur.find(c=>c.id===o.id);if(!ex){if(o.id&&!['main','cash'].includes(o.id))miss++;add++;return}keys.some(k=>o[k]!==undefined&&String(ex[k]??'')!==String(o[k]??''))?chg++:same++});return{add,chg,same,miss}};
  return{inc:txd('inc'),exp:txd('exp'),people:cmp(P.people,people(),['name','rel','allowance']),payees:cmp(P.payees,payees(),['name','type','note']),accounts:cmp(P.accounts,accList(),['name','kind']),
    recurring:cmp(P.recurring,recs().map(r=>Object.assign({},r,{amount:amtAt(r,ym(new Date()))})),['name','kind','cat','amount','day','start','until','person']),debts:cmp(P.debts,debts().map(d=>Object.assign({},d,{start:debtStart(d)||'',trackFrom:debtTrackFrom(d)})),['name','type','lender','payment','rate','day','start','trackFrom','totalN','paidN','ref'])}}
function mdApply(P){const st=S.settings,C=ym(new Date());const NT=[];
  const pid={};(st.people=st.people||[]);P.people.forEach(o=>{let ex=o.id&&st.people.find(x=>x.id===o.id);if(ex)Object.assign(ex,{name:o.name,rel:o.rel,allowance:o.allowance});else{ex={id:uidGen(),name:o.name,rel:o.rel,allowance:o.allowance};st.people.push(ex)}pid['@'+o.name]=ex.id});
  st.payees=st.payees||[];P.payees.forEach(o=>{const ex=o.id&&st.payees.find(x=>x.id===o.id);if(ex)Object.assign(ex,{name:o.name,type:o.type,note:o.note});else st.payees.push({id:uidGen(),name:o.name,type:o.type,note:o.note})});
  st.accounts=st.accounts||[];P.accounts.forEach(o=>{let ex=o.id&&st.accounts.find(x=>x.id===o.id);if(ex)Object.assign(ex,{name:o.name,kind:o.id==='main'||o.id==='cash'?ex.kind:o.kind});else if(o.id==='main'||o.id==='cash')st.accounts.push({id:o.id,kind:o.id,name:o.name});else st.accounts.push({id:uidGen(),kind:o.kind,name:o.name})});
  st.recurring=st.recurring||[];P.recurring.forEach(o=>{const person=o.person&&o.person[0]==='@'?pid[o.person]||'':o.person;const ex=o.id&&st.recurring.find(x=>x.id===o.id);
    if(ex){const old=amtAt(ex,C);if(Math.abs(old-o.amount)>0.0005){const h=Object.assign({},ex.amtHist||{});if(!Object.keys(h).length)h[ex.start||'0000-01']=+ex.amount||0;Object.keys(h).filter(k=>k>C).forEach(k=>delete h[k]);h[C]=o.amount;ex.amtHist=h;ex.amount=o.amount;recLog(ex,'تغيير المبلغ من '+money(old)+' إلى '+rial(o.amount)+' (استيراد Excel)')}
      Object.assign(ex,{name:o.name,kind:o.kind,cat:o.cat,day:o.day,start:o.start,until:o.until,person})}
    else{const r={id:uidGen(),kind:o.kind,name:o.name,amount:o.amount,amtHist:{},start:o.start||C,until:o.until,cat:o.cat,day:o.day,person,half:false,later:{},remind:Math.max(1,o.day-2),arrears:0,since:C,bills:{}};recLog(r,'أُضيف من ملف Excel بمبلغ '+rial(o.amount));st.recurring.push(r)}});
  st.debts=st.debts||[];P.debts.forEach(o=>{const ex=o.id&&st.debts.find(x=>x.id===o.id);const X={};['start','trackFrom','totalN','paidN','ref'].forEach(k=>{if(o[k]!==undefined)X[k]=o[k]});if(ex)Object.assign(ex,{name:o.name,type:o.type,lender:o.lender,payment:o.payment,rate:o.rate,day:o.day},X);
    else st.debts.push(Object.assign({id:uidGen(),type:o.type,name:o.name,lender:o.lender,original:o.balance,balance:o.balance,payment:o.payment,rate:o.rate,day:o.day,pays:[],mode:'inst',start:today(),trackFrom:today(),end:'',log:[{at:today(),t:'أُضيف من ملف Excel'}]},X))});
  ['inc','exp'].forEach(ty=>P[ty].forEach(o=>{if(o._dup||o._skip)return;const person=o.person&&o.person[0]==='@'?pid[o.person]||'':o.person;const ex=o.id&&S.tx[o.id];
    if(ex){const c=Object.assign({},ex,{date:o.date,amount:o.amount,cat:o.cat,note:o.note,method:o.method});if(ty==='exp')c.person=person||undefined;if(o.acc)c.acc=o.acc;if(!c.person)delete c.person;NT.push(c)}
    else{const t={id:uidGen(),type:ty,amount:o.amount,cat:o.cat,date:o.date,method:o.method,note:o.note,createdAt:new Date().toISOString(),src:'xlsx'};if(ty==='exp'&&person)t.person=person;if(o.acc&&o.acc!=='main'&&o.acc!=='cash')t.acc=o.acc;NT.push(t)}}));
  if(NT.length){NT.forEach(txPrep)}
  putSettings();render()}
async function mdImportFile(file,only){let book;try{book=await readXlsx(await file.arrayBuffer())}catch(e){toast(e.message==='method'?'هذا الجهاز لا يدعم قراءة الملف. حدّث النظام أو احفظه من Numbers بصيغة Excel':'الملف ليس ملف Excel صحيحًا (.xlsx)',null,6000);return}
  const P=mdPlan(book,only);const sec=MD_SECS.find(x=>x[0]===only);if(!P.found.length){toast(sec?'لم أجد ورقة «'+sec[3]+'» في الملف. صدّر هذا القسم من التطبيق أولًا ثم عدّله':'لم أجد أوراق البيانات في الملف. صدّر الملف من التطبيق أولًا ثم عدّله',null,6000);return}
  const D0=mdDiff(P);const D={};Object.keys(D0).forEach(k=>{if(!only||only==='all'||only===k)D[k]=D0[k]});const L=document.getElementById('layer');const names={inc:'الإيداعات',exp:'المصروفات',people:'الأشخاص',payees:'الجهات',accounts:'الحسابات',recurring:'الالتزامات الشهرية',debts:'الديون'};
  const tot=Object.values(D).reduce((s,d)=>s+d.add+d.chg,0);
  L.innerHTML=`${sheetTop('استيراد')}<h2 style="margin-top:0">📥 معاينة الاستيراد${sec?' · '+sec[2]:''}</h2>
   <table class="cmptbl"><thead><tr><th>القسم</th><th>جديد</th><th>معدّل</th><th>كما هو</th></tr></thead><tbody>${Object.entries(D).map(([k,d])=>`<tr><td>${names[k]}${d.dup?`<small class="note" style="display:block">${d.dup} مكرر لن يُضاف</small>`:''}</td><td class="num${d.add?' diff':''}">${d.add}</td><td class="num${d.chg?' diff':''}">${d.chg}</td><td class="num">${d.same}</td></tr>`).join('')}</tbody></table>
   ${P.errors.length?`<div class="warnbox" style="margin-top:10px"><b>${countWord(P.errors.length,'صف واحد فيه خطأ','صفان فيهما خطأ','صفوف فيها أخطاء','صفًا فيها أخطاء')} وسيُتجاهل:</b><ul class="mderr">${P.errors.slice(0,12).map(e=>`<li>${esc(e)}</li>`).join('')}</ul>${P.errors.length>12?'<span class="note">و'+(P.errors.length-12)+' غيرها</span>':''}</div>`:''}
   <p class="note">لا يُحذف شيء من التطبيق بالاستيراد؛ الحذف من التطبيق نفسه. تُحفظ لقطة قبل الاستيراد ويمكنك التراجع، ثم تتم المزامنة تلقائيًا.</p>
   <div class="actions">${tot?`<button class="btn block" id="mdGo">تطبيق ${countWord(tot,'تغيير واحد','تغييرين','تغييرات','تغييرًا')}</button>`:'<div class="okbox" style="margin:0">لا توجد تغييرات في الملف.</div>'}<button class="btn ghost block" data-close>إلغاء</button></div></div></div>`;
  L.oninput=L.onchange=null;L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='mdGo'){x.disabled=true;const before=backupText();await snapTake('قبل استيراد Excel',false,before);mdApply(P);L.innerHTML='';
      toast('طُبّقت '+countWord(tot,'تغيير واحد','تغييران','تغييرات','تغييرًا')+' من الملف',async()=>{await applyBackup(parseBackup(before),'replace');toast('أُعيدت بياناتك كما كانت')},10000)}}}


/* ---------- 28ج. إدارة شؤوني PRO: وضعي المالي، خطة العجز، مقارنة المبلغ الإضافي للديون ---------- */
/* «وضعي المالي»: لوحة واحدة تجمع المتوفر والدخل والديون والمستحق والمتبقي بعد الالتزامات، مع المؤشرات الخمسة */
function finStatus(){const now=new Date(),cm=ym(now),pc=payCycle(now),a=pc?inRange(pc.start,pc.end):inMonth(cm);
  const incRec=sum(a,'inc'),avgInc=pastAvg(x=>sum(x,'inc'))||0,inc=incRec||avgInc||salAmt();const exp=sum(a,'exp');
  const st=recStatus(cm);const due=st.dueLeft;const after=r3(inc-exp-due);
  const T=accTotals();const Ds=debts().filter(d=>+d.balance>0.0005);
  const rem=r3(Ds.reduce((s,d)=>s+(+d.balance),0)),orig=r3(Ds.reduce((s,d)=>s+Math.max(+d.original||0,+d.balance||0),0)),inst=r3(Ds.reduce((s,d)=>s+debtInst(d),0));
  const dp=dailyPlan();
  return{cm,pc,inc,incRec,expected:!incRec&&inc>0,exp,due,total:st.total,after,avail:T.known?T.total:null,rem,orig,inst,pct:orig?Math.round((orig-rem)/orig*100):null,n:Ds.length,
    cover:st.total?r3(inc/st.total):null,dti:inc?Math.round(inst/inc*100):null,vari:r3(varSpend(a)),liquid:r3(dp.avail+dp.spentToday),dp}}
function finStatusHtml(){if(S.month!==ym(new Date()))return '';if(!list().length&&!debts().length&&!recs().length)return '';const F=finStatus();
  const cell=(l,v,cls,sub)=>`<div class="${cls||''}"><span>${l}</span><b class="num">${v}</b>${sub?`<small>${sub}</small>`:''}</div>`;
  const sg=v=>(v<0?'−':'')+amtH(Math.abs(v));
  const ind=(l,v,good,sub)=>`<div class="hstat"><span>${l}</span><b class="num ${good===true?'amt-inc':good===false?'amt-exp':''}">${v}</b>${sub?`<small>${sub}</small>`:''}</div>`;
  return `<h2>وضعي المالي</h2><div class="panel stack fstat">
   <div class="salgrid">
    ${F.avail!==null?cell('الأموال المتوفرة',sg(F.avail),'','في حساباتك المسجّلة'):cell('الأموال المتوفرة','—','','حدّد أرصدتك من «حساباتي»')}
    ${cell(F.expected?'الدخل المتوقع':'الدخل','<span class="amt-inc">'+amtH(F.inc)+'</span>','',F.expected?'لم يُسجَّل بعد، حسب المعتاد':'')}
    ${cell('المصروفات','<span class="amt-exp">'+amtH(F.exp)+'</span>')}
    ${cell('مستحق ولم يُدفع',amtH(F.due),F.due>0.0005?'':'','الالتزامات والأقساط')}
    ${cell('المتبقي بعد الالتزامات',sg(F.after),'big'+(F.after<0?' neg':''))}
    ${F.n?cell('الديون المتبقية',amtH(F.rem),'',countWord(F.n,'دين واحد','دينان','ديون','دينًا')+(F.pct!==null?' · سدّدت '+F.pct+'%':'')):''}
   </div>
   ${F.n&&F.pct!==null?`<div class="meter" title="التقدم نحو سداد الديون"><i style="width:${F.pct}%;background:var(--inc)"></i></div>`:''}
   <div class="hstats">
    ${ind('تغطية الالتزامات',F.cover===null?'—':'×'+F.cover.toFixed(1),F.cover===null?null:F.cover>=1.2,F.cover===null?'لا التزامات مسجّلة':F.cover>=1?'دخلك يغطي التزاماتك':'دخلك لا يغطي التزاماتك')}
    ${ind('الدخل المخصص للديون',F.dti===null?'—':'<span dir="ltr">'+F.dti+'%</span>',F.dti===null?null:F.dti<=40,F.dti===null?'سجّل دخلك':'يُفضَّل أقل من 40%')}
    ${ind('المصروفات المتغيرة',amtH(F.vari),null,'طعام وتنقل وشراء…')}
    ${ind('السيولة المتاحة',sg(F.liquid),F.liquid>=0,'بعد الالتزامات والادخار '+periodTo(F.dp))}
   </div>
   ${F.after<0||F.liquid<0?`<div class="warnbox" style="margin:0">التزاماتك ومصروفاتك أكبر من دخلك ${periodTo(F.dp)} بـ <b class="num">${amtH(Math.abs(Math.min(F.after,F.liquid)))}</b>.</div>`:''}
   <div class="chips">${F.after<0||F.liquid<0?'<button class="chip pay" data-shortfall="1">ماذا أفعل إذا لم يكفِ المال؟</button>':'<button class="chip" data-shortfall="1">خطة الالتزامات المتبقية</button>'}<button class="chip" data-accopen="1">حساباتي</button></div>
   <p class="note" style="margin:0">مؤشرات لمتابعة وضعك من بياناتك المسجّلة فقط، وليست تقييمًا ائتمانيًا رسميًا.</p></div>`}
/* أولوية الالتزام عند العجز: المتأخر وذو العواقب أولًا */
function sfPriority(i,date){const k=i.ref&&i.ref.kind,late=date<today();
  if(i.kind==='debt'&&late)return[1,'قسط متأخر: قد تترتب عليه غرامات'];
  if(k==='rent'||(i.ref&&i.ref.cat==='home'))return[1,'السكن'];
  if(['elec','water'].includes(k))return[2,'خدمات أساسية'];
  if(i.kind==='debt')return[2,'قسط له موعد محدد'];
  if(['wifi','phone'].includes(k)||(i.ref&&i.ref.cat==='bills'))return[3,'فاتورة'];
  if(['family','maid'].includes(k)||(i.ref&&i.ref.cat==='family'))return[3,'الأسرة'];
  return[4,'يمكن مراجعته']}
function openShortfall(){const L=document.getElementById('layer');const d=dailyPlan();
  const have=r3(Math.max(0,d.inc-d.spent));const items=d.items.filter(i=>!i.isPaid).map(i=>{const p=sfPriority(i,i.date);return Object.assign({},i,{need:r3(Math.max(0,i.amount-(i.paidAmt||0))),pr:p[0],why:p[1]})}).filter(i=>i.need>0.0005)
    .sort((a,b)=>a.pr-b.pr||a.date.localeCompare(b.date));
  let left=have;items.forEach(i=>{i.cov=r3(Math.min(i.need,Math.max(0,left)));left=r3(left-i.need)});
  const need=r3(items.reduce((s,i)=>s+i.need,0)),gap=r3(Math.max(0,need-have));
  const tips=[];const gs=goalsSummary();if(gs.total>0.0005)tips.push(`أوقف ادخار الخطط مؤقتًا هذا الشهر: يوفّر <b class="num">${amtH(gs.total)}</b>، ثم أعد حسابها بعد أن تستقر.`);
  const c=advCtx();if(c.prev.length){const avg={};c.prev.forEach(x=>x.filter(t=>t.type==='exp'&&!isFixedTx(t)).forEach(t=>avg[t.cat]=(avg[t.cat]||0)+(+t.amount)/c.prev.length));
    Object.entries(avg).filter(([k])=>!['home','bills','loan','health'].includes(k)).sort((a,b)=>b[1]-a[1]).slice(0,3).forEach(([k,v])=>tips.push(`راجع «${esc(catOf(k).n)}» (معدلك <b class="num">${amtH(v)}</b> شهريًا): تخفيضه 25% يوفّر <b class="num">${amtH(v*0.25)}</b>.`))}
  if(items.some(i=>i.kind==='debt'&&i.cov<i.need))tips.push('إذا توقعت أنك لن تستطيع دفع قسط، تواصل مع الجهة الدائنة مبكرًا قبل موعده واسأل عن الخيارات المتاحة. لا تفترض إمكانية التأجيل دون موافقتها.');
  tips.push('أجّل أي شراء جديد غير ضروري حتى تغطي الالتزامات الأساسية.');
  L.innerHTML=`${sheetTop('خطة العجز')}<h2 style="margin-top:0">ماذا أفعل إذا لم يكفِ المال؟</h2>
   <div class="panel paybk">
    <div class="sumrow"><span>${d.expected?'الدخل المتوقع':'الدخل'} ${periodTo(d)}</span><b class="num">${amtH(d.inc)}</b></div>
    <div class="sumrow"><span>صرفت حتى الآن</span><b class="num">− ${money(d.spent)}</b></div>
    <div class="sumrow total"><span>المتوفر للالتزامات</span><b class="num">${amtH(have)}</b></div>
    <div class="sumrow"><span>التزامات وأقساط لم تُدفع ${periodTo(d)}</span><b class="num">${amtH(need)}</b></div>
    <div class="sumrow total"><span>${gap?'العجز المتوقع':'الفائض بعد الالتزامات'}</span><b class="num ${gap?'amt-exp':'amt-inc'}">${amtH(gap||r3(have-need))}</b></div></div>
   ${gap?`<div class="warnbox" style="margin-top:10px">لا يكفي ما معك لكل الالتزامات المتبقية. رتّبتها حسب الأولوية: المتأخر وما له عواقب أولًا، ثم السكن والخدمات الأساسية.</div>`:`<div class="okbox" style="margin-top:10px">ما معك يغطي التزاماتك المتبقية ${periodTo(d)}. هذا ترتيب دفعها المقترح.</div>`}
   <h3>ترتيب الدفع المقترح</h3>${items.length?`<div class="panel" style="padding-block:4px">${items.map((i,n)=>`<div class="sfrow"><span class="advn">${n+1}</span><div><b>${esc(i.name)}</b><small>${esc(i.why)} · ${dmy(i.date)}</small></div><div class="sf-a"><b class="num">${money(i.need)}</b><small class="${i.cov>=i.need-0.0005?'amt-inc':i.cov>0?'':'amt-exp'}">${i.cov>=i.need-0.0005?'مغطّى ✓':i.cov>0?'مغطّى '+money(i.cov):'غير مغطّى'}</small></div></div>`).join('')}</div>`:'<p class="note">لا التزامات غير مدفوعة في هذه الفترة.</p>'}
   <h3>خطوات تساعدك</h3><ul class="tips">${tips.map(t=>`<li>${t}</li>`).join('')}</ul>
   <p class="note">الترتيب اقتراح مبني على المواعيد والأنواع المسجّلة، والقرار لك. وفي الضيق الشديد أعطِ الأولوية للطعام والسكن والدواء.</p>
   <div class="actions"><div class="row2"><button class="btn" data-tab="monthly" data-close>الدفع من «${esc(lbl('sec.monthly'))}»</button><button class="btn ghost" data-close>إغلاق</button></div></div></div></div>`;
  L.oninput=L.onchange=null;L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.dataset.tab){L.innerHTML='';S.tab=x.dataset.tab;S.month=ym(new Date());render();window.scrollTo(0,0);return}if(x.hasAttribute('data-close'))L.innerHTML=''}}
/* مقارنة: أين تضع المبلغ الإضافي؟ على الأعلى فائدة أم لإغلاق الأصغر؟ */
function debtCompareHtml(){const Ds=debts().filter(d=>+d.balance>0.0005);if(Ds.length<2)return '';const P=debtPlan();const E=+P.extra>0?+P.extra:30;
  const base=simDebts(Ds,0,'avalanche',false),av=simDebts(Ds,E,'avalanche',true),sn=simDebts(Ds,E,'snowball',true);
  const first=r=>{const f=Ds.filter(d=>r.finish[d.id]).sort((a,b)=>r.finish[a.id]-r.finish[b.id])[0];return f?esc(f.name)+' ('+monthLabel(r.finish[f.id])+')':'—'};
  const row=(n,r)=>`<tr><td>${n}</td><td>${r.stuck?'لا ينتهي':monthLabel(r.months)}</td><td class="num">${r.stuck?'—':money(r.interest)}</td><td>${r.stuck?'—':first(r)}</td></tr>`;
  const best=!av.stuck&&!sn.stuck?(av.interest<sn.interest-0.5?'الأعلى فائدة أولًا يوفّر عليك <b class="num">'+amtH(sn.interest-av.interest)+'</b> فوائد أكثر':sn.interest<av.interest-0.5?'الأصغر أولًا أوفر هنا':'الطريقتان متقاربتان في الفوائد هنا')+'، والأصغر أولًا يغلق دينًا ويحرّر قسطه أسرع.':'';
  return `<div class="panel stack"><b>أين أضع مبلغًا إضافيًا قدره ${amtH(E)} شهريًا؟</b>
   <table class="cmptbl"><thead><tr><th>الطريقة</th><th>تنتهي الديون</th><th>الفوائد</th><th>أول دين يُغلق</th></tr></thead><tbody>
    ${row('بدون مبلغ إضافي',base)}${row('الأعلى فائدة أولًا',av)}${row('الأصغر مبلغًا أولًا',sn)}</tbody></table>
   ${best?`<p class="note" style="margin:0">${best}</p>`:''}
   <p class="note" style="margin:0">مقارنة حسابية بالأرصدة والأقساط والفوائد المسجّلة، وليست وعدًا بتاريخ نهائي.${+P.extra>0?'':' غيّر «مبلغ إضافي» أعلاه لتجربة مبلغ آخر.'}</p></div>`}
/* تنبيه وتيرة الإنفاق لكل فئة لها حد، قبل الوصول إلى 80% */
function paceAlerts(){const now=new Date(),day=now.getDate(),dim=monthDays(now);if(day<5||day>dim-2)return [];const B=S.settings.budgets||{};const sp={};
  inMonth(ym(now)).filter(t=>t.type==='exp').forEach(t=>sp[t.cat]=(sp[t.cat]||0)+(+t.amount));
  return Object.entries(B).map(([c,v])=>({c,v:+v,s:r3(sp[c]||0)})).filter(x=>x.v>0&&x.s<0.8*x.v&&x.s/day*dim>x.v*1.05).map(x=>Object.assign(x,{proj:r3(x.s/day*dim),day}))}

/* ===== تشفير ملف المزامنة: نافذة تفعيله ===== */
function openSyncEnc(){const L=document.getElementById('layer');
  L.innerHTML=`${sheetTop('تشفير المزامنة')}<h2 style="margin-top:0">🔐 تشفير ملف المزامنة</h2><div class="stack">
   <p class="note" style="margin:0;line-height:1.8">يُشفَّر ملف بياناتك على هاتفك قبل رفعه إلى Google Drive، فلا يقرؤه أحد بدون كلمة السر، حتى Google. على أجهزتك الأخرى تكتب نفس الكلمة مرة واحدة.</p>
   <div class="field"><label for="seP1">كلمة سر المزامنة (8 أحرف أو أكثر)</label><input class="inp" id="seP1" type="password" autocomplete="new-password"></div>
   <div class="field"><label for="seP2">أعد كتابتها</label><input class="inp" id="seP2" type="password" autocomplete="new-password"></div>
   <div class="warnbox" style="margin:0"><b>قبل التفعيل:</b> افتح التطبيق مرة على كل أجهزتك ليتحدّث إلى الإصدار '+APP_VERSION+'، لأن الإصدار القديم لا يعرف التشفير.<br><b>مهم:</b> لا يمكن استرجاع كلمة السر. إذا نسيتها تبقى بياناتك سليمة على هذا الجهاز، لكنك تحتاج إيقاف التشفير وتفعيله من جديد على كل الأجهزة.</div>
   <p class="note" id="seErr" style="color:var(--exp);margin:0"></p></div>
   <div class="actions"><button class="btn block" id="seGo">تشفير ومزامنة</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div>`;
  L.oninput=L.onchange=null;L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}
    if(x.id==='seGo'){const p1=document.getElementById('seP1').value,p2=document.getElementById('seP2').value,er=document.getElementById('seErr');
      if(p1.length<8){er.textContent='كلمة السر 8 أحرف على الأقل';return}if(p1!==p2){er.textContent='الكلمتان غير متطابقتين';return}
      x.disabled=true;x.textContent='جارٍ التشفير…';const ok=await Sync.setPass(p1,true);L.innerHTML='';render();toast(ok?'صار ملف المزامنة مشفّرًا. اكتب نفس الكلمة على أجهزتك الأخرى':'تعذّر التشفير الآن، حاول مرة أخرى',null,7000)}}}

/* ---------- 29. الأحداث (الضغط والكتابة) ---------- */
document.addEventListener('click',async e=>{
  {const rt=e.target.closest('[data-rtog]');if(rt&&!e.target.closest('button,a,summary,details')){const row=rt.closest('.recrow');const on=!row.classList.contains('open');row.classList.toggle('open',on);rt.setAttribute('aria-expanded',on);S.recOpen=S.recOpen||{};if(on)S.recOpen[rt.dataset.rtog]=1;else delete S.recOpen[rt.dataset.rtog];return}}
  const b=e.target.closest('button');if(!b||b.closest('#layer'))return;
  if(b.dataset.early&&!(admOn()&&admOpen())){toast('الدفع يُفتح في '+dmy(b.dataset.early)+'. للدفع الآن: وضع المدير، أو غيّر «قفل الدفع» من ⚙️ الضبط',null,6000);return}
  if(b.dataset.mdgo){S.tab='budget';render();setTimeout(()=>{const h=[...document.querySelectorAll('#view h2')].find(x=>x.textContent.trim().startsWith('🏦'));if(!h){window.scrollTo(0,0);return}if(h.classList.contains('fold-closed'))h.click();h.scrollIntoView({block:'start'});window.scrollBy(0,-70)},60);return}
  if(b.dataset.tab){if(b.dataset.tab==='debts'){S.tab='home';render();setTimeout(()=>{const h=document.getElementById('homeDebts');if(h){h.scrollIntoView({block:'start'});window.scrollBy(0,-70)}},60);return}S.tab=b.dataset.tab;render();window.scrollTo(0,0);return}
  if(b.dataset.go){S.tab=b.dataset.go;render();return}
  if(b.dataset.dayplan){openDayPlan(b.dataset.dayplan==='pay');return}
  if(b.dataset.ask){openAsk();return}
  if(b.dataset.wopen){openWidget();return}
  if(b.dataset.cdoc){const [cid,ty]=b.dataset.cdoc.split(':');const pre=carDocPre(cid,ty);if(pre)withVault(()=>openDoc(null,pre));return}
  if(b.dataset.ddoc){const [did,ty]=b.dataset.ddoc.split(':');const pre=debtDocPre(did,ty);if(pre)withVault(()=>openDoc(null,pre));return}
  if(b.id==='admChip'){if(admOpen()){admLock();render()}else admAsk(()=>render(),'افتح وضع المدير للتعديل والحذف والتراجع والاعتماد.');return}
  if(b.id==='admSetup'){openAdmSetup(false);return}
  if(b.id==='admPinChange'){openAdmSetup(true);return}
  if(b.id==='admUnlockBtn'){admAsk(()=>render());return}
  if(b.id==='admLockBtn'){admLock();render();return}
  if(b.id==='admApprove'){const c=admCfg();admSave(Object.assign({},c,{approve:c.approve===false}));render();toast(c.approve===false?'العمليات المُدخلة وهو مقفل تنتظر اعتمادك':'أُوقف الاعتماد، العمليات الجديدة تُحفظ مباشرة');return}
  if(b.id==='admBioSet'){const c=admCfg();if(c.bio){admSave(Object.assign({},c,{bio:false}));render();toast('أُوقفت بصمة الوجه للمدير');return}
    const r=await verifyUser();if(r==='ok'){admSave(Object.assign({},c,{bio:true}));render();toast('فُعّلت بصمة الوجه للمدير')}else toast(r==='unavailable'?'بصمة الوجه غير متاحة هنا':'لم تُفعَّل بصمة الوجه');return}
  if(b.id==='admOff'){const P=pendList();await putTxMany(P.map(t=>{const c=Object.assign({},t);delete c.pend;return c}));admSave(null);Adm.open=false;render();toast('أُوقف وضع المدير'+(P.length?' واعتُمدت العمليات المنتظرة':''));return}
  if(b.dataset.apopen){openApprovals();return}
  if(b.dataset.dgrp){S.debtGrp=b.dataset.dgrp;render();return}
  if(b.dataset.dsort){S.debtSort=b.dataset.dsort;render();return}
  if(b.dataset.dgohome){S.tab='home';render();setTimeout(()=>{const h=document.getElementById('homeDebts');if(h){h.scrollIntoView({block:'start'});window.scrollBy(0,-70)}},60);return}
  if(b.dataset.dgopay){const id=b.dataset.dgopay;S.tab='monthly';S.month=ym(new Date());render();setTimeout(()=>{const ra=document.querySelector('[data-rall="1"]');if(ra&&!document.querySelector('[data-dpay="'+id+'"]'))ra.click();const x=document.querySelector('.recrow [data-dpay="'+id+'"]');const rw=x&&x.closest('.recrow');if(rw){rw.scrollIntoView({block:'center'});rw.classList.add('flash');setTimeout(()=>rw.classList.remove('flash'),1600)}else openDebtPay(id)},80);return}
  if(b.dataset.unpay){const [k,id,m]=b.dataset.unpay.split('|');openUnpay(k,id,m);return}
  if(b.dataset.dexp){if(b.dataset.dexp==='pdf')printDebtsAll();else exportXlsx(['summary','debts'],'all');return}
  if(b.dataset.xopen){openExport(b.dataset.xopen);return}
  if(b.id==='expOpen'){openExport();return}
  if(b.id==='dnEdit'){openDebtNote();return}
  if(b.dataset.duaread){openDuaRead();return}
  if(b.dataset.wird){openWird();return}
  if(b.dataset.adhkar){openAdhkar();return}
  if(b.dataset.accopen){openAccounts();return}
  if(b.dataset.paycal){openPayCalendar();return}
  if(b.dataset.zakat){openZakat();return}
  if(b.dataset.salyes){const A=salAmt();openSheet(null,{type:'inc',cat:'salary',amount:A?amtIn(A):'',note:'راتب',method:'transfer'});return}
  if(b.dataset.salno){try{localStorage.setItem('masareef:salskip',today())}catch(e){}render();return}
  if(b.dataset.bknow){await saveBackupFile();render();return}
  if(b.dataset.bklater){try{localStorage.setItem('masareef:bksnooze',addDays(today(),3))}catch(e){}render();return}
  if(b.dataset.subadd){const [n,a,c]=b.dataset.subadd.split('|');const r={id:uidGen(),kind:'other',name:n,cat:c||'bills',amount:+a,day:new Date().getDate(),since:ym(new Date()),arrears:0};recLog(r,'أُضيف من الاشتراكات المتكررة');S.settings.recurring=recs().concat([r]);await putSettings();render();toast('أُضيف «'+n+'» للالتزامات الشهرية');return}
  if(b.id==='privBtn'||b.id==='hideAmt'){try{localStorage.setItem('masareef:hideamt',hideAmtOn()?'0':'1')}catch(e){}applyHideAmt();render();return}
  if(b.id==='lockSet'){openLockSetup();return}
  if(b.id==='lockBio'){lockBioToggle();return}
  if(b.id==='lockAuto'){const c=lockCfg();if(c){lockSave(Object.assign({},c,{auto:c.auto===false}));render()}return}
  if(b.id==='lockPinChange'){lockPinChange();return}
  if(b.dataset.lockafter!==undefined){const c=lockCfg();if(c){lockSave(Object.assign({},c,{after:+b.dataset.lockafter}));render();toast('يُقفل التطبيق '+LOCK_AFTER.find(x=>x[0]===+b.dataset.lockafter)[1]+' من الخروج منه')}return}
  if(b.id==='lookBtn2'){openLook();return}
  if(b.dataset.mdx){mdExport(b.dataset.mdx);return}
  if(b.dataset.mdi){S.mdOnly=b.dataset.mdi;const f=document.getElementById('mdFile');if(f)f.click();return}
  if(b.dataset.mdper){S.settings.mdPer=b.dataset.mdper;putSettings();render();return}
  if(b.id==='payAdd'){openPayee();return}
  if(b.dataset.icoedit){const k=b.dataset.icoedit;const tmp=document.createElement('div');tmp.innerHTML=b.innerHTML;const e=tmp.querySelector('.mdico-e');if(e)e.remove();const sm=tmp.querySelector('small');if(sm)sm.remove();if(icoOv(k)){const [ty,id]=k.split(':');tmp.innerHTML=ty==='cat'?`<span class="cbadge" style="background:${catOf(id).c}1f;color:${catOf(id).c}">${catIcon(id)}</span>`:tmp.innerHTML}openIconPick(k,b.dataset.iconame,tmp.innerHTML);return}
  if(b.dataset.payedit){openPayee(b.dataset.payedit);return}
  if(b.id==='acAdd'&&!b.closest('#layer')){openAccEdit(null);return}
  if(b.dataset.acedit&&!b.closest('#layer')){openAccEdit(b.dataset.acedit);return}
  if(b.dataset.rizq){openRizq();return}
  if(b.id==='rzOn'){const c=rzCfg();S.settings.rizqBtn=Object.assign({},c,{pos:c.pos==='hide'?(c.last||'with'):'hide',last:c.pos==='hide'?c.last:c.pos});putSettings();render();return}
  if(b.dataset.rzpos){S.settings.rizqBtn=Object.assign({},rzCfg(),{pos:b.dataset.rzpos});putSettings();render();toast('نُقل زر أدعية الرزق: '+RZ_POS.find(x=>x[0]===b.dataset.rzpos)[1]);return}
  if(b.id==='plOn'){payLockSet({on:!payLockCfg().on});toast(payLockCfg().on?'فُعّل قفل الدفع حتى الموعد':'أُوقف قفل الدفع: الدفع متاح في أي وقت');return}
  if(b.dataset.plscope){payLockSet({scope:b.dataset.plscope});return}
  if(b.dataset.plbefore!==undefined){payLockSet({before:+b.dataset.plbefore});return}
  if(b.dataset.rename||b.id==='lblEdit'){if(!admOn()){toast('فعّل وضع المدير أولًا من ⚙️ الضبط، فتعديل الأسماء من صلاحيات المدير');return}b.id==='lblEdit'?openLabels():openRename(b.dataset.rename);return}
  if(b.id==='scGuide'){openShortcutGuide();return}
  if(b.dataset.dpe){const [did,pid]=b.dataset.dpe.split('|');openDebtPayEdit(did,pid);return}
  if(b.dataset.dprint){printDebt(b.dataset.dprint);return}
  if(b.dataset.cdview){const id=b.dataset.cdview;withVault(()=>viewDoc(id));return}
  if(b.dataset.tnew){openTrust();return}
  if(b.dataset.tedit){openTrust(b.dataset.tedit);return}
  if(b.dataset.tret){openTrustReturn(b.dataset.tret);return}
  if(b.dataset.tprint){printTrust(b.dataset.tprint);return}
  if(b.dataset.tfilter){S.tfilter=b.dataset.tfilter;render();return}
  if(b.dataset.treport){openPrintSheet('trusts');return}
  if(b.dataset.wexp){exportWidget();return}
  if(b.dataset.advplan){openPlanWizard(null,b.dataset.advplan);return}
  if(b.dataset.advdep){openSavDeposit(null,false);return}
  if(b.dataset.advinc){openSheet(null,{type:'inc',cat:'salary'});return}
  if(b.dataset.advbak){S.tab='reports';render();setTimeout(()=>{const x=document.getElementById('fileBackup');x&&x.scrollIntoView({block:'center'})},50);return}
  if(b.dataset.goplan){S.tab='budget';render();const el=document.getElementById('goal-'+b.dataset.goplan);if(el){el.scrollIntoView({block:'center'});el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),1600)}else window.scrollTo(0,0);return}
  if(b.dataset.gorep){S.rmode=b.dataset.gorep==='year'?'year':'month';S.tab='reports';render();window.scrollTo(0,0);if(b.dataset.gorep==='print')openPrintSheet();return}
  if(b.id==='addBtn'||b.hasAttribute('data-open-add')){openSheet();return}
  if(b.id==='openImp2'){openImport();return}
  if(b.id==='sync'&&Sync.linked()){Sync.now();return}
  if(b.id==='sync'){S.tab='settings';render();setTimeout(()=>{const x=document.getElementById('syncBox');x&&x.scrollIntoView({block:'start'})},50);return}
  if(b.id==='refreshAll'){refreshAll(b);return}
  if(b.id==='printRep'){openPrintSheet();return}
  if(b.id==='quickPrint'){quickPrint();return}
  if(b.id==='checkUpd'){if(!('serviceWorker' in navigator)){toast('أنت على آخر إصدار');return}toast('جارٍ البحث عن تحديث…');try{const r=await navigator.serviceWorker.getRegistration();if(r){await r.update();if(r.installing||r.waiting){toast('وُجد تحديث، جارٍ تحميله…');return}}toast('أنت على آخر إصدار ('+APP_VERSION+')')}catch(e){toast('تعذّر البحث، تأكد من الإنترنت')}return}
  if(b.dataset.shortfall){openShortfall();return}
  if(b.id==='syncEncOn'){openSyncEnc();return}
  if(b.id==='syncEncOff'){if(!confirm('إيقاف التشفير؟ سيُرفع ملف المزامنة غير مشفّر من الآن.'))return;b.disabled=true;const ok=await Sync.encOff();render();toast(ok?'أُوقف تشفير ملف المزامنة':'تعذّر الإيقاف الآن، حاول مرة أخرى');return}
  if(b.id==='syncPassGo'){const v=document.getElementById('syncPass').value;if(!v){toast('اكتب كلمة السر');return}b.disabled=true;b.textContent='جارٍ الفتح…';const ok=await Sync.setPass(v,false);render();toast(ok?'فُتحت المزامنة المشفّرة':'كلمة السر غير صحيحة، أو تعذّر الاتصال');return}
  if(b.id==='syncUnlink'){Sync.unlink();toast('أُلغي الربط على هذا الجهاز، وبياناتك باقية فيه');return}
  if(b.id==='syncLink'){const v=(document.getElementById('syncCid').value||'').trim();const er=document.getElementById('syncErr');if(!/\.apps\.googleusercontent\.com$/.test(v)){er.hidden=false;er.textContent='الرمز غير صحيح. يجب أن ينتهي بـ .apps.googleusercontent.com';return}await Sync.link(v);render();return}
  if(b.dataset.quick!==undefined){quickAdd(b.dataset.quick);return}
  if(b.dataset.rmode){S.rmode=b.dataset.rmode;render();return}
  if(b.dataset.yshift){S.month=shiftMonth(S.month,12*(+b.dataset.yshift));render();return}
  if(b.id==='vaultSetup'){const p1=document.getElementById('vPin1').value,p2=document.getElementById('vPin2').value,er=document.getElementById('vErr');if(!/^\d{4,8}$/.test(p1)){er.hidden=false;er.textContent='الرمز يجب أن يكون من 4 إلى 8 أرقام';return}if(p1!==p2){er.hidden=false;er.textContent='الرمزان غير متطابقين';return}b.disabled=true;const salt=crypto.getRandomValues(new Uint8Array(16));const key=await vDerive(p1,salt);const cfg={salt,check:await vEnc(key,te('masareef-ok'))};await VDB.put('kv',cfg,'cfg');Vault.cfg=cfg;Vault.key=key;vaultTouch();render();toast('أُنشئت الخزنة وهي مفتوحة الآن');afterVault();return}
  if(b.id==='vaultUnlock'){const p=document.getElementById('vPin').value,er=document.getElementById('vErr');b.disabled=true;b.textContent='جارٍ الفتح…';try{const key=await vDerive(p,Vault.cfg.salt);await vDec(key,Vault.cfg.check);Vault.key=key;vaultTouch();render();afterVault()}catch(err){b.disabled=false;b.textContent='فتح الخزنة';er.hidden=false;er.textContent='الرمز غير صحيح'}return}
  if(b.id==='vaultLock'){vaultLock();toast('قُفلت الخزنة');return}
  if(b.id==='bioOn'){vaultTouch();openBioSetup();return}
  if(b.id==='bioOff'){await VDB.del('kv','bio');Vault.bio=null;render();toast('أُوقف الفتح ببصمة الوجه');return}
  if(b.id==='vaultBio'){const er=document.getElementById('vErr');try{Vault.key=await bioUnlock();vaultTouch();render();afterVault()}catch(err){er.hidden=false;er.textContent=err&&err.name==='NotAllowedError'?'لم تكتمل بصمة الوجه. حاول مرة أخرى أو افتح بالرمز':'تعذّر الفتح ببصمة الوجه. افتح بالرمز، ثم أعد تفعيلها'}return}
  if(b.id==='vaultReset'){for(const d of Vault.docs)for(const f of d.files||[])await VDB.del('blobs',f.id);await VDB.clear('docs');await VDB.del('kv','cfg');await VDB.del('kv','bio');Vault.bio=null;Vault.docs=[];Vault.cfg=null;Vault.key=null;render();toast('حُذفت الخزنة');return}
  if(b.dataset.vadd){vaultTouch();const v=b.dataset.vadd;openDoc(null,v.startsWith('type:')?{type:v.slice(5)}:v.startsWith('person:')?{owner:v.slice(7)}:null);return}
  if(b.dataset.docby){S.docBy=b.dataset.docby;S.docFolder=null;render();return}
  if(b.dataset.docfolder!==undefined){vaultTouch();S.docFolder=b.dataset.docfolder||null;render();window.scrollTo(0,0);return}
  if(b.dataset.vedit){vaultTouch();openDoc(b.dataset.vedit);return}
  if(b.dataset.vview){vaultTouch();await viewDoc(b.dataset.vview,b.dataset.fid);return}
  if(b.dataset.vshare){vaultTouch();await shareDoc(b.dataset.vshare);return}
  if(b.dataset.vsecure){vaultTouch();await secureSend(b.dataset.vsecure);return}
  if(b.id==='vaultExport'){vaultTouch();await vaultExport();return}
  if(b.dataset.dadd){openDebt();return}
  if(b.dataset.dedit){openDebt(b.dataset.dedit);return}
  if(b.dataset.dpay){openDebtPay(b.dataset.dpay);return}
  if(b.dataset.dstrat){S.settings.debtPlan=Object.assign(debtPlan(),{strategy:b.dataset.dstrat});putSettings();render();return}
  if(b.dataset.dextra!==undefined){S.settings.debtPlan=Object.assign(debtPlan(),{extra:+b.dataset.dextra});putSettings();render();return}
  if(b.dataset.cadd){openCar(null,b.dataset.cadd==='other'?{owner:people()[0]?'p:'+people()[0].id:'شخص آخر'}:null);return}
  if(b.dataset.cics){const c=cars().find(x=>x.id===b.dataset.cics);const t=c&&carIcs(c);if(!t){toast('أضف تاريخ انتهاء التأمين أو الملكية أولًا');return}saveFile('idarat-shuooni-reminder.ics',t,'text/calendar');toast('افتح الملف واضغط «إضافة الكل» ليُضاف التذكير لتقويم هاتفك');return}
  if(b.id==='askNotify'){await askNotify();return}
  if(b.id==='billsIcs'){saveBillsIcs();return}
  if(b.dataset.cedit){openCar(b.dataset.cedit);return}
  if(b.dataset.crenew){openRenew(b.dataset.crenew);return}
  if(b.dataset.csave){carToGoal(b.dataset.csave);return}
  if(b.dataset.sadd){openSvc(b.dataset.sadd);return}
  if(b.dataset.sedit){const [c1,s1]=b.dataset.sedit.split(':');openSvc(c1,s1);return}
  if(b.dataset.padd){openPerson();return}
  if(b.dataset.pedit){openPerson(b.dataset.pedit);return}
  if(b.dataset.pspend){openSheet(null,{person:b.dataset.pspend,cat:'family'});return}
  if(b.dataset.radd){openRec(null,b.dataset.radd);return}
  if(b.dataset.redit){openRec(b.dataset.redit);return}
  if(b.dataset.rpay){payRec(b.dataset.rpay,b.dataset.m);return}
  if(b.dataset.txdel){openPayDel(b.dataset.txdel);return}
  if(b.dataset.txedit){openPayEdit(b.dataset.txedit);return}
  if(b.dataset.recpick){openRecPick();return}
  if(b.dataset.secadd){openRecPick(b.dataset.secadd);return}
  if(b.dataset.stog){const c=secToggle(b.dataset.stog);const sec=b.closest('.recsec');if(sec){sec.classList.toggle('closed',c);b.setAttribute('aria-expanded',!c);b.querySelector('.chev').textContent=c?'◂':'▾'}return}
  if(b.dataset.rall!==undefined){const on=b.dataset.rall==='1';foldAll(document.getElementById('view'),on);S.recOpen={};document.querySelectorAll('.recrow.rec2[data-rkey]').forEach(r=>{r.classList.toggle('open',on);if(on)S.recOpen[r.dataset.rkey]=1});if(on){document.querySelectorAll('.recsec.closed').forEach(sc=>{secToggle(sc.dataset.sec);sc.classList.remove('closed');const t=sc.querySelector('.chev');if(t)t.textContent='▾'})}return}
  if(b.dataset.recprint){printRec(b.dataset.recprint);return}
  if(b.id==='payAll'){payAll();return}
  if(b.dataset.gomonth){S.month=b.dataset.gomonth;render();window.scrollTo(0,0);return}
  if(b.dataset.gadd){openGoal(null,b.dataset.gadd);return}
  if(b.dataset.gedit){const g=(S.settings.goals||[]).find(x=>x.id===b.dataset.gedit);if(g&&PLAN_T[g.kind])openPlanWizard(g.id);else openGoal(b.dataset.gedit);return}
  if(b.dataset.plannew){openPlanWizard();return}
  if(b.id==='lookBtn'){openLook();return}
  if(b.dataset.gdep){openDeposit(b.dataset.gdep);return}
  if(b.dataset.gspend){openSpend(b.dataset.gspend);return}
  if(b.id==='savDep'){openSavDeposit(null,false);return}
  if(b.id==='savBal'){openSavBalance();return}
  if(b.id==='savSplit'){openSavDeposit(+b.dataset.amt,true);return}
  if(b.dataset.gnext){nextCycle(b.dataset.gnext);return}
  if(b.id==='mPrev'){S.month=shiftMonth(S.month,-1);render();return}
  if(b.id==='mNext'){S.month=shiftMonth(S.month,1);render();return}
  if(b.dataset.edit){openSheet(S.tx[b.dataset.edit]);return}
  if(b.dataset.ftype){S.ftype=b.dataset.ftype;render();return}
  if(b.id==='loadSample'){loadSample();return}
  if(b.dataset.salrec){const A=salAmt();openSheet(null,{type:'inc',cat:'salary',amount:A?amtIn(A):'',note:'راتب '+MONTHS[new Date().getMonth()],method:'transfer'});return}
  if(b.id==='salAmtSave'){salAmtSave(document.getElementById('salAmt').value);return}
  if(b.dataset.prule&&!b.closest('#layer')){S.settings.payRule=b.dataset.prule;await putSettings();render();return}
  if(b.id==='mbSave'){capSave(document.getElementById('mb').value);return}
  if(b.dataset.mbset){capSave(b.dataset.mbset);return}
  if(b.id==='mbClear'){capSave(0);return}
  if(b.id==='saveBudget'){const bb={};document.querySelectorAll('[data-bcat]').forEach(i=>{const v=parseAmt(i.value);if(v)bb[i.dataset.bcat]=v});S.settings.budgets=bb;document.activeElement.blur();await putSettings();render();toast('حُفظت حدود الفئات');return}
  if(b.id==='clearSample'){delTxMany(list().filter(t=>t.sample).map(t=>t.id));toast('حُذفت بيانات المثال');return}
  if(b.id==='wipeAsk'){openWipe();return}
  if(b.id==='copyBackup'||b.id==='fileBackup'){try{localStorage.setItem('masareef:lastBackup',today())}catch(e){}}
  if(b.id==='copyBackup'){const txt=backupText();
    try{await navigator.clipboard.writeText(txt);toast('نُسخت النسخة الاحتياطية، الصقها في ملاحظاتك أو أرسلها لنفسك')}
    catch(err){const ta=document.getElementById('restoreTxt');ta.closest('details').open=true;ta.value=txt;ta.select();toast('حدّد النص الظاهر وانسخه يدويًا')}return}
  if(b.id==='restoreBtn'){openRestore(document.getElementById('restoreTxt').value,'من نص');return}
  if(b.id==='dbOpen'){openDataCenter();return}
  if(b.id==='fileBackup'){await saveBackupFile();return}
  if(b.id==='csvBtn'){const yr=S.rmode==='year';const a=(yr?list().filter(t=>t.date&&t.date.slice(0,4)===S.month.slice(0,4)):inMonth(S.month)).sort((x,y)=>x.date.localeCompare(y.date));
    const rows=[['التاريخ','النوع','الفئة','المبلغ','طريقة الدفع','ملاحظة','الشخص']].concat(a.map(t=>[t.date,t.type==='inc'?'دخل':'مصروف',catOf(t.cat).n,money(t.amount),(METHODS.find(m=>m[0]===t.method)||['',''])[1],t.note||'',t.person?personName(t.person):'']));
    const csv='\ufeff'+rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    saveFile('idarat-shuooni-'+(yr?S.month.slice(0,4):S.month)+'.csv',csv,'text/csv');return}
});
let debtT;document.addEventListener('input',e=>{if(e.target.id==='syncCid'&&/\.apps\.googleusercontent\.com$/.test(e.target.value.trim()))Sync.prime(true);if(e.target.id==='q'){S.q=e.target.value;render()}
  if(e.target.id==='debtExtra'){S.settings.debtPlan=Object.assign(debtPlan(),{extra:parseAmt(e.target.value)});const r=document.getElementById('debtRes');if(r)r.innerHTML=debtResHtml();const dc=document.getElementById('debtCmp');if(dc)dc.innerHTML=debtCompareHtml();clearTimeout(debtT);debtT=setTimeout(putSettings,800)}});
document.addEventListener('change',e=>{
  if(e.target.id==='restoreFile'&&e.target.files[0]){const r=new FileReader();r.onload=()=>openRestore(r.result,'من ملف');r.readAsText(e.target.files[0]);e.target.value=''}});

/* منع تكبير الصفحة بالإصبعين (Safari لا يلتزم دائمًا بإعداد الصفحة، فنمنعه هنا أيضًا) */
['gesturestart','gesturechange','gestureend'].forEach(ev=>document.addEventListener(ev,e=>e.preventDefault(),{passive:false}));
document.addEventListener('touchmove',e=>{if(e.touches&&e.touches.length>1)e.preventDefault()},{passive:false});
document.addEventListener('dblclick',e=>{if(!e.target.closest('input,textarea'))e.preventDefault()},{passive:false});
/* ---------- 30. التشغيل ---------- */
checkVersion();cacheLoad();migrateRecs();secSeed();if(lockCfg())showLock();privBtnInit();render();dbBoot();handleLaunchUrl();Sync.start();setTimeout(notifyCarAlerts,1500);vaultLoad();
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.classList&&e.target.classList.contains('pin')){const b=document.getElementById(e.target.id==='vPin'?'vaultUnlock':'vaultSetup');b&&b.click()}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='mb'){e.preventDefault();capSave(e.target.value)}if(e.key==='Enter'&&e.target.id==='salAmt'){e.preventDefault();salAmtSave(e.target.value)}});
function salAmtSave(v){const n=String(v||'').trim()===''?0:parseAmt(String(v));if(n===null||isNaN(n)||n<0){toast('اكتب مبلغًا صحيحًا');return}S.settings.salaryAmt=r3(n);if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();putSettings();render();toast(n?'حُفظ الراتب المعتاد '+rial(n):'أُلغي الراتب المعتاد')}
document.addEventListener('change',e=>{if(e.target.id==='payDay'&&!e.target.closest('#layer')){S.settings.payday=+e.target.value;putSettings();render();toast(+e.target.value?'تُحسب الرئيسية الآن من يوم نزول الراتب':'تُحسب الرئيسية حتى نهاية الشهر');return}
  if(e.target.id==='salAmt'){const v=parseAmt(e.target.value||'0')||0;if(Math.abs(v-(+S.settings.salaryAmt||0))>0.0005)salAmtSave(e.target.value);return}
  if(e.target.id==='mb'){const v=parseAmt(e.target.value||'0')||0;if(Math.abs(v-(+S.settings.monthlyBudget||0))>0.0005)capSave(e.target.value);return}
  if(e.target.dataset&&e.target.dataset.bcat!==undefined){const v=parseAmt(e.target.value||'')||0;const bb=Object.assign({},S.settings.budgets||{});if(v)bb[e.target.dataset.bcat]=r3(v);else delete bb[e.target.dataset.bcat];S.settings.budgets=bb;putSettings()}});
document.addEventListener('change',e=>{if(e.target.id==='mdFile'&&e.target.files&&e.target.files[0]){const f=e.target.files[0];e.target.value='';mdImportFile(f,S.mdOnly||'all')}});
document.addEventListener('change',async e=>{if(e.target.id==='vaultImportFile'&&e.target.files[0]){const f=e.target.files[0];e.target.value='';const txt=await f.text();const L=document.getElementById('layer');
  L.innerHTML=`<div class="scrim" data-close></div><div class="sheet" data-vault role="dialog" aria-modal="true" aria-label="استيراد خزنة"><div class="in"><div class="grab"></div><h2 style="margin-top:0">استيراد خزنة</h2><div class="stack"><div class="field"><label for="vImpPin">رمز الخزنة التي صُدّر منها الملف</label><input class="inp num pin" id="vImpPin" type="password" inputmode="numeric" maxlength="8"></div><div class="actions"><button class="btn block" id="vImpGo">استيراد</button><button class="btn ghost block" data-close>إلغاء</button></div></div></div></div>`;
  L.oninput=L.onchange=null;L.onclick=async ev=>{const x=ev.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';return}if(x.id==='vImpGo'){x.disabled=true;const ok=await vaultImport(txt);if(ok)L.innerHTML='';else x.disabled=false}}}});
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
if('serviceWorker' in navigator&&location.protocol!=='file:'){const hadCtl=!!navigator.serviceWorker.controller;let reloaded=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadCtl&&!reloaded){reloaded=true;location.reload()}});
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').then(r=>r.update()).catch(()=>{}))}
})();
