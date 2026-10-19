/* إدارة شؤوني — «مشروعي»: قراءة بيانات تطبيق «إدارة مشاريع الزمرة الملكية» وتحليلها في مكان واحد.
 * قراءة فقط: لا يكتب أي شيء في بيانات تطبيق المشروع. يُحمَّل هذا الملف عند فتح القسم فقط، فلا يُبطئ التطبيق.
 * المصدر: نفس الجهاز (التطبيقان على نفس رابط GitHub فيتشاركان التخزين)، أو نسخة JSON تستوردها من تطبيق الزمرة.
 * النسخ: لقطة يومية تلقائية في IndexedDB (بدون الصور) للرجوع لأي تاريخ، وتنزيل نسخة كاملة تُسترجع في تطبيق الزمرة. */
(function(){'use strict';
const A=window.__APP;if(!A)return;
const {money,esc,sheetTop,toast,fmtD,dmy,today,addDays,curM,mStart,mEnd,shiftMonth,monthName,MONTHS,countWord,dDiff,r3,CUR}=A;
const STORES=[['items','inv2'],['bundles','inv-bundles'],['customers','inv-cust'],['sales','inv-sales'],['suppliers','inv-sup'],['purchases','inv-pur'],['expenses','inv-exp'],['moves','inv-mov'],['quotes','inv-quo'],['closings','inv-clo'],['dents','inv-dent'],['ddocs','inv-ddoc']];
const ECATS={rent:'إيجار',sal:'رواتب',trn:'نقل وشحن',fuel:'وقود',util:'كهرباء وماء واتصالات',mkt:'تسويق وإعلان',mnt:'صيانة',oth:'أخرى'};
const n3=v=>money(+v||0);const arr=v=>Array.isArray(v)?v:[];
/* ---------- القراءة ---------- */
function lsJ(k,def){try{const v=localStorage.getItem(k);return v==null?def:JSON.parse(v)}catch(e){return def}}
function projectsLive(){let P=lsJ('inv-projects',[]);if(!Array.isArray(P))P=[];if(!P.some(p=>p&&p.id==='main'))P.unshift({id:'main',name:'المشروع الرئيسي'});return P.filter(p=>p&&p.id)}
function readProject(pid){const K=b=>pid==='main'?b:b+':'+pid;const o={v:1};STORES.forEach(([n,k])=>{o[n]=arr(lsJ(K(k),[]))});o.set=lsJ(K('inv-set'),{})||{};return o}
function liveAvailable(){try{return localStorage.getItem('inv2')!=null||localStorage.getItem('inv-sales')!=null||localStorage.getItem('inv-projects')!=null}catch(e){return false}}
function readLive(){return{src:'live',at:new Date().toISOString(),projects:projectsLive().map(p=>({id:p.id,name:p.name||'مشروع',data:readProject(p.id)}))}}
/* تجريد الصور والملفات الكبيرة للّقطات */
function strip(o){return JSON.parse(JSON.stringify(o,(k,v)=>typeof v==='string'&&v.length>1500&&/^data:/.test(v)?'':v))}
/* ---------- IndexedDB ---------- */
function idb(op,key,val){return new Promise((res,rej)=>{const r=indexedDB.open('masareef-biz',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onerror=()=>rej(r.error);
  r.onsuccess=()=>{const db=r.result;const tx=db.transaction('kv',op==='get'||op==='keys'?'readonly':'readwrite');const st=tx.objectStore('kv');
    const q=op==='get'?st.get(key):op==='put'?st.put(val,key):op==='del'?st.delete(key):st.getAllKeys();q.onsuccess=()=>res(q.result);tx.onerror=()=>rej(tx.error)}})}
async function snapTake(D){const k='snap:'+today();try{const ex=await idb('get',k);const s=strip(D);s.at=new Date().toISOString();await idb('put',k,s);
  const keys=(await idb('keys')).filter(x=>String(x).startsWith('snap:')).sort();const keep=new Set(keys.slice(-30));const byM={};keys.forEach(x=>{byM[String(x).slice(5,12)]=x});Object.values(byM).slice(-12).forEach(x=>keep.add(x));
  for(const x of keys)if(!keep.has(x))await idb('del',x);return !ex}catch(e){return false}}
async function snapList(){try{return (await idb('keys')).filter(x=>String(x).startsWith('snap:')).sort().reverse()}catch(e){return[]}}
/* ---------- الحسابات (بنفس معادلات تطبيق الزمرة) ---------- */
const retAmt=s=>arr(s.ret).reduce((t,r)=>t+(+r.amt||0),0);
const sGross=s=>Math.max(0,arr(s.lines).reduce((t,l)=>t+(+l.q||0)*(+l.price||0),0)+(+s.fee||0)-(+s.disc||0));
const sTotal=s=>Math.max(0,sGross(s)-retAmt(s));
const sCost=s=>{let t=arr(s.lines).reduce((x,l)=>x+(+l.q||0)*(+l.cost||0),0);arr(s.ret).forEach(r=>arr(r.items).forEach(it=>{const l=arr(s.lines)[it.i];if(l)t-=(+it.q||0)*(+l.cost||0)}));return t};
const sDue=s=>Math.max(0,sTotal(s)-(+s.paid||0));
const pTotal=p=>arr(p.lines).reduce((t,l)=>t+(+l.q||0)*(+l.cost||0),0);
const pDue=p=>Math.max(0,pTotal(p)-(+p.paid||0));
const vatOf=(t,set)=>{const r=+(set&&set.vat)||0;return r>0?Math.round(t*r/(100+r)*1000)/1000:0};
const inR=(d,f,t)=>{d=String(d||'');return(!f||d>=f)&&(!t||d<=t)};
/* يدمج مشاريع متعددة في مجموعة واحدة مع تمييز كل سجل بمشروعه */
function merged(B,pid){const P=B.projects.filter(p=>!pid||p.id===pid);const o={sales:[],expenses:[],purchases:[],items:[],customers:[],suppliers:[],moves:[],quotes:[],closings:[],set:{vat:0,budget:0}};
  P.forEach(p=>{['sales','expenses','purchases','items','customers','suppliers','moves','quotes','closings'].forEach(k=>arr(p.data[k]).forEach(x=>o[k].push(Object.assign({_p:p.id,_pn:p.name},x))));if(P.length===1)o.set=p.data.set||{}});return o}
function finance(M,f,t){let rev=0,cogs=0,ret=0,exp=0,vat=0,pur=0,n=0;
  M.sales.forEach(s=>{if(!inR(s.date,f,t))return;n++;const v=sTotal(s);rev+=v;cogs+=sCost(s);ret+=retAmt(s);vat+=vatOf(v,M.set)});
  M.expenses.forEach(x=>{if(inR(x.date,f,t))exp+=+x.amt||0});M.purchases.forEach(p=>{if(inR(p.date,f,t))pur+=pTotal(p)});
  const net0=rev-vat,gross=net0-cogs;return{rev:r3(rev),vat:r3(vat),sales:r3(net0),cogs:r3(cogs),gross:r3(gross),exp:r3(exp),net:r3(gross-exp),ret:r3(ret),pur:r3(pur),n,margin:net0>0?Math.round(gross/net0*100):null}}
function position(M){const inv=r3(M.items.reduce((s,i)=>s+Math.max(0,+i.qty||0)*(+i.buy||0),0));const recv=r3(M.sales.reduce((s,x)=>s+sDue(x),0));const pay=r3(M.purchases.reduce((s,p)=>s+pDue(p),0));
  const lastClose=M.closings.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];return{inv,recv,pay,equity:r3(inv+recv-pay),cash:lastClose?+lastClose.counted||0:null,cashAt:lastClose?lastClose.date:null,nItems:M.items.length}}
function ym(d){return String(d).slice(0,7)}
function perRange(per,o){const td=today(),y=td.slice(0,4),mo=td.slice(0,7);const lastDay=m=>{const [a,b]=m.split('-').map(Number);return m+'-'+String(new Date(a,b,0).getDate()).padStart(2,'0')};
  const shiftYM=(m,k)=>{const [a,b]=m.split('-').map(Number);const d=new Date(a,b-1+k,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
  if(per==='month')return{from:mo+'-01',to:lastDay(mo),pf:shiftYM(mo,-1)+'-01',pt:lastDay(shiftYM(mo,-1)),lbl:MONTHS[+mo.slice(5)-1]+' '+y};
  if(per==='last'){const m=shiftYM(mo,-1);return{from:m+'-01',to:lastDay(m),pf:shiftYM(mo,-2)+'-01',pt:lastDay(shiftYM(mo,-2)),lbl:MONTHS[+m.slice(5)-1]+' '+m.slice(0,4)}}
  if(per==='cycle'){const m=curM(),p=shiftMonth(m,-1);return{from:mStart(m),to:mEnd(m),pf:mStart(p),pt:mEnd(p),lbl:'دورة الراتب: '+monthName(m)}}
  if(per==='q'){const f=shiftYM(mo,-2)+'-01';return{from:f,to:lastDay(mo),pf:shiftYM(mo,-5)+'-01',pt:lastDay(shiftYM(mo,-3)),lbl:'آخر 3 أشهر'}}
  if(per==='y')return{from:y+'-01-01',to:y+'-12-31',pf:(+y-1)+'-01-01',pt:(+y-1)+td.slice(4),lbl:'سنة '+y};
  if(per==='range'&&o.from&&o.to){const f=o.from<=o.to?o.from:o.to,t=o.from<=o.to?o.to:o.from;const n=dDiff(f,t)+1;return{from:f,to:t,pf:addDays(f,-n),pt:addDays(f,-1),lbl:fmtD(f)+' – '+fmtD(t)}}
  return{from:'',to:'',pf:null,pt:null,lbl:'كل الفترات'}}
const ch=(a,b)=>b>0.0005?Math.round((a-b)/b*100):null;
/* أفضل المنتجات والزبائن والملاحظات الذكية */
function products(M,f,t){const P={};M.sales.filter(s=>inR(s.date,f,t)).forEach(s=>arr(s.lines).forEach(l=>{const k=l.bid?'b'+l.bid:'p'+l.pid;const o=P[k]=P[k]||{name:l.name,unit:l.unit||'',q:0,rev:0,cost:0};o.q+=+l.q||0;o.rev+=(+l.q||0)*(+l.price||0);o.cost+=(+l.q||0)*(+l.cost||0)}));
  return Object.values(P).map(o=>Object.assign(o,{rev:r3(o.rev),profit:r3(o.rev-o.cost),margin:o.rev>0?Math.round((o.rev-o.cost)/o.rev*100):0}))}
function custStats(M){const C={};M.customers.forEach(c=>{C[c._p+'|'+c.id]={c,n:0,tot:0,due:0,last:'',old:''}});
  M.sales.forEach(s=>{const k=s._p+'|'+s.cid;const o=C[k]=C[k]||{c:{id:s.cid,name:s.cname||'زبون نقدي',_p:s._p},n:0,tot:0,due:0,last:'',old:''};o.n++;o.tot+=sTotal(s);const d=sDue(s);o.due+=d;if(d>0.0005&&(!o.old||s.date<o.old))o.old=s.date;if(s.date>o.last)o.last=s.date});
  return Object.values(C).map(o=>Object.assign(o,{tot:r3(o.tot),due:r3(o.due)}))}
function insights(M,R){const out=[];const td=today();const F=finance(M,R.from,R.to);const P=R.pf?finance(M,R.pf,R.pt):null;
  if(P&&P.rev>0&&F.rev>0){const c=ch(F.rev,P.rev);if(Math.abs(c)>=10)out.push([c>0?'📈':'📉',(c>0?'المبيعات أعلى بـ':'المبيعات أقل بـ')+Math.abs(c)+'% من الفترة السابقة']);}
  if(F.net<0&&F.rev>0)out.push(['⚠️','المشروع خاسر في هذه الفترة بـ'+n3(-F.net)+'. راجع المصاريف والأسعار.']);
  if(F.margin!=null&&F.margin<15&&F.rev>0)out.push(['💡','هامش الربح '+F.margin+'% منخفض. فكّر في رفع أسعار الأصناف الأقل ربحًا.']);
  const low=M.items.filter(i=>+i.min>0&&(+i.qty||0)<=+i.min);if(low.length)out.push(['📦',countWord(low.length,'صنف وصل','صنفان وصلا','أصناف وصلت','صنفًا وصل')+' للحد الأدنى: '+low.slice(0,3).map(i=>i.name).join('، ')]);
  const exS=M.items.filter(i=>i.exp&&(+i.qty||0)>0&&dDiff(td,i.exp)<=30);if(exS.length)out.push(['⏳',countWord(exS.length,'صنف','صنفان','أصناف','صنفًا')+' تنتهي صلاحيته خلال 30 يومًا']);
  const sold=new Set();M.sales.filter(s=>dDiff(s.date,td)<=60).forEach(s=>arr(s.lines).forEach(l=>{if(l.pid)sold.add(String(l.pid));arr(l.comps).forEach(c=>sold.add(String(c.pid)))}));
  const slow=M.items.filter(i=>(+i.qty||0)>0&&!sold.has(String(i.id)));if(slow.length&&M.sales.length)out.push(['🐢',countWord(slow.length,'صنف راكد','صنفان راكدان','أصناف راكدة','صنفًا راكدًا')+' (لم يُبع منذ 60 يومًا) بقيمة '+n3(slow.reduce((s,i)=>s+(+i.qty||0)*(+i.buy||0),0))]);
  const C=custStats(M).filter(o=>o.due>0.0005&&o.old&&dDiff(o.old,td)>30);if(C.length)out.push(['🧾',countWord(C.length,'زبون عليه','زبونان عليهما','زبائن عليهم','زبونًا عليهم')+' مستحقات أقدم من 30 يومًا بمجموع '+n3(C.reduce((s,o)=>s+o.due,0))]);
  const pr=products(M,R.from,R.to).sort((a,b)=>b.profit-a.profit)[0];if(pr&&pr.profit>0)out.push(['🏆','أربح صنف: '+pr.name+' ('+n3(pr.profit)+')']);
  if(!out.length)out.push(['✅','لا ملاحظات مهمة في هذه الفترة.']);return out}
/* ---------- الواجهة ---------- */
const BZ={o:{tab:'sum',per:'month',pid:'',q:'',f:'all',from:'',to:'',snap:null,open:null},data:null};
async function getData(){if(BZ.o.snap){const s=await idb('get',BZ.o.snap);if(s)return Object.assign({},s,{src:'snap',key:BZ.o.snap})}
  if(liveAvailable()){const D=readLive();if(D.projects.some(p=>p.data.items.length||p.data.sales.length||p.data.expenses.length||p.data.purchases.length)){snapTake(D);return D}}
  const imp=await idb('get','import').catch(()=>null);if(imp)return Object.assign({},imp,{src:'import'});return null}
function bar2(a,b,mx){return `<div class="bz-b2"><i style="height:${Math.round(a/mx*100)}%"></i><i class="e" style="height:${Math.round(b/mx*100)}%"></i></div>`}
function kpi(l,v,c,sub,cls,inv){return `<div class="${cls||''}"><span>${l}</span><b class="num">${v}</b>${c!=null?`<small class="${(inv?c<=0:c>=0)?'amt-inc':'amt-exp'}">${c>=0?'▲':'▼'} ${Math.abs(c)}%</small>`:''}${sub?`<small>${sub}</small>`:''}</div>`}
function stPill(s){const d=sDue(s);return d<=0.0005?'<span class="pill paid">مسدد</span>':(+s.paid||0)>0.0005?`<span class="pill warn">باقٍ ${n3(d)}</span>`:`<span class="pill late">آجل ${n3(d)}</span>`}
const BZC=new Intl.Collator('ar',{sensitivity:'base',numeric:true});const az=(x,y)=>BZC.compare(String(x||''),String(y||''));
const BZ_SORTS={sales:[['new','الأحدث'],['old','الأقدم'],['big','الأكبر'],['small','الأصغر'],['due','الأكبر متبقيًا'],['az','الزبون أ – ي']],exp:[['new','الأحدث'],['old','الأقدم'],['big','الأكبر'],['small','الأصغر'],['az','البيان أ – ي']],stock:[['val','الأعلى قيمة'],['qty','الأكثر كمية'],['low','الأقل كمية'],['margin','الأعلى هامشًا'],['az','الاسم أ – ي']],cust:[['due','الأكبر متبقيًا'],['tot','الأكثر شراءً'],['last','آخر شراء'],['az','الاسم أ – ي']]};
function bzSortSel(tab,cur){const L=BZ_SORTS[tab];if(!L)return'';return `<div class="srt-row"><span class="note">↕️ ترتيب:</span><select class="inp" id="bzSort" aria-label="ترتيب">${L.map(([k,n])=>`<option value="${k}"${cur===k?' selected':''}>${n}</option>`).join('')}</select></div>`}
async function draw(){const L=document.getElementById('layer');const o=BZ.o;o.srt=o.srt||{};const D=await getData();BZ.data=D;
  if(!D){L.innerHTML=`${sheetTop('مشروعي')}<h2 style="margin-top:0">💼 مشروعي</h2><div class="panel stack"><b>لم أجد بيانات تطبيق «إدارة مشاريع الزمرة الملكية» على هذا الجهاز.</b>
    <span class="note">إذا كان التطبيقان على نفس رابط GitHub ونفس المتصفح، تظهر البيانات هنا تلقائيًا بعد فتح تطبيق الزمرة مرة واحدة. وإلا: من تطبيق الزمرة اختر «نسخة كاملة JSON» واستوردها هنا.</span>
    <button class="btn" id="bzImp">📂 استيراد نسخة من تطبيق الزمرة</button></div><input type="file" id="bzFile" accept=".json,application/json" hidden><div class="actions"><button class="btn ghost block" data-close>إغلاق</button></div></div></div>`;bind();return}
  const PJ=D.projects;const M=merged(D,o.pid);const R=perRange(o.per,o);const F=finance(M,R.from,R.to);const PF=R.pf?finance(M,R.pf,R.pt):null;const POS=position(M);
  const srcTxt=D.src==='live'?'🔄 مباشر من تطبيق الزمرة على هذا الجهاز':D.src==='snap'?'🗂️ نسخة '+fmtD(String(D.key).slice(5))+' (للعرض فقط)':'📂 من نسخة مستوردة '+(D.at?fmtD(String(D.at).slice(0,10)):'');
  let body='';
  if(o.q.trim()){body=searchHtml(M,o.q.trim())}
  else if(o.tab==='sum'){const ms=[];for(let k=11;k>=0;k--){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-k);ms.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'))}
    const MF=ms.map(m=>{const [y,mm]=m.split('-').map(Number);const f=finance(M,m+'-01',m+'-'+String(new Date(y,mm,0).getDate()).padStart(2,'0'));return{m,rev:f.rev,out:f.exp+f.cogs,net:f.net}});const mx=Math.max(1,...MF.map(x=>Math.max(x.rev,x.out)));
    let comb='';try{const pm=A.personalFlow(R.from||'0000-01-01',R.to||'9999-12-31');const nw=A.netWorth();comb=`<h3>👤 + 💼 الصورة الموحّدة</h3><div class="panel">
      <div class="sumrow"><span>صافي دخلك الشخصي (دخل − مصاريف)</span><b class="num ${pm.net<0?'amt-exp':'amt-inc'}">${pm.net<0?'−':''}${n3(Math.abs(pm.net))}</b></div>
      <div class="sumrow"><span>صافي ربح المشروع</span><b class="num ${F.net<0?'amt-exp':'amt-inc'}">${F.net<0?'−':''}${n3(Math.abs(F.net))}</b></div>
      <div class="sumrow tot"><span>المجموع في ${esc(R.lbl)}</span><b class="num">${pm.net+F.net<0?'−':''}${n3(Math.abs(pm.net+F.net))}</b></div>
      ${nw?`<div class="sumrow"><span>صافي ثروتك الشخصية</span><b class="num">${n3(nw.net)}</b></div><div class="sumrow"><span>قيمة المشروع (مخزون + مستحقات − ديون موردين)</span><b class="num">${n3(POS.equity)}</b></div><div class="sumrow tot"><span>إجمالي ما تملكه</span><b class="num">${n3(nw.net+POS.equity)}</b></div>`:''}</div>`}catch(e){}
    body=`<div class="pp-k bz-k">${kpi('المبيعات',n3(F.rev),PF?ch(F.rev,PF.rev):null,countWord(F.n,'فاتورة','فاتورتان','فواتير','فاتورة'))}${kpi('صافي الربح',(F.net<0?'−':'')+n3(Math.abs(F.net)),PF&&PF.net>0?ch(F.net,PF.net):null,'',F.net<0?'bad':'ok')}${kpi('الربح الإجمالي',n3(F.gross),null,F.margin!=null?'هامش '+F.margin+'%':'')}${kpi('المصاريف',n3(F.exp),PF?ch(F.exp,PF.exp):null,'','',1)}${kpi('المشتريات',n3(F.pur),null)}${kpi('متوسط الفاتورة',F.n?n3(F.rev/F.n):'—',null)}</div>
     <h3>📍 الوضع الآن</h3><div class="pp-k bz-k">${kpi('قيمة المخزون',n3(POS.inv),null,POS.nItems+' صنف')}${kpi('لك عند الزبائن',n3(POS.recv),null)}${kpi('عليك للموردين',n3(POS.pay),null,'','')}${kpi('صافي قيمة المشروع',n3(POS.equity),null)}</div>
     <h3>📊 آخر 12 شهرًا <small class="note">■ مبيعات ■ تكلفة ومصاريف</small></h3><div class="panel bz-chart">${MF.map(x=>`<div class="bz-c" title="${x.m}">${bar2(x.rev,x.out,mx)}<small>${MONTHS[+x.m.slice(5)-1].slice(0,3)}</small></div>`).join('')}</div>
     <h3>💡 ملاحظات ذكية</h3><div class="stack">${insights(M,R).map(([i,t])=>`<div class="panel pri-t"><span class="md-ic">${i}</span><div><small>${esc(t)}</small></div></div>`).join('')}</div>${comb}`}
  else if(o.tab==='sales'){const S=M.sales.filter(s=>inR(s.date,R.from,R.to)).filter(s=>o.f==='all'||(o.f==='due'?sDue(s)>0.0005:sDue(s)<=0.0005));const ss=o.srt.sales||'new';const nd=(a,b)=>String(b.date).localeCompare(String(a.date))||(+b.no||0)-(+a.no||0);
    S.sort(ss==='old'?(a,b)=>-nd(a,b):ss==='big'?(a,b)=>sTotal(b)-sTotal(a)||nd(a,b):ss==='small'?(a,b)=>sTotal(a)-sTotal(b)||nd(a,b):ss==='due'?(a,b)=>sDue(b)-sDue(a)||nd(a,b):ss==='az'?(a,b)=>az(a.cname||'زبون نقدي',b.cname||'زبون نقدي')||nd(a,b):nd);
    const PR=products(M,R.from,R.to).sort((a,b)=>b.rev-a.rev);const byM={};const grp=ss==='new'||ss==='old';S.forEach(s=>{const k=grp?ym(s.date):'all';(byM[k]=byM[k]||[]).push(s)});
    body=`<div class="seg seg3 bz-f">${[['all','الكل'],['due','غير مسدد'],['paid','مسدد']].map(([k,n])=>`<button class="n" data-bzf="${k}" aria-pressed="${o.f===k}">${n}</button>`).join('')}</div>${S.length>1?bzSortSel('sales',ss):''}
     ${S.length?Object.keys(byM).map(m=>`<div class="bz-mh">${m==='all'?'كل الفواتير':MONTHS[+m.slice(5)-1]+' '+m.slice(0,4)} <small class="num">${byM[m].length} · ${n3(byM[m].reduce((t,s)=>t+sTotal(s),0))}</small></div><div class="panel">${byM[m].map(s=>`<button class="bz-row" data-bzs="${esc(s._p+'|'+s.id)}"><span><b>#${s.no||''} ${esc(s.cname||'زبون نقدي')}</b><small class="note">${dmy(s.date)} · ${countWord(arr(s.lines).length,'صنف','صنفان','أصناف','صنفًا')}${PJ.length>1?' · '+esc(s._pn):''}</small></span><span class="bz-ra"><b class="num">${n3(sTotal(s))}</b>${stPill(s)}</span></button>`).join('')}</div>`).join(''):'<div class="okbox">لا فواتير في هذه الفترة.</div>'}
     ${PR.length?`<h3>🏆 الأصناف الأكثر مبيعًا</h3><div class="panel">${PR.slice(0,10).map(p=>`<div class="sumrow"><span>${esc(p.name)}<small class="note" style="display:block">${p.q} ${esc(p.unit)} · ربح ${n3(p.profit)} (${p.margin}%)</small></span><b class="num">${n3(p.rev)}</b></div>`).join('')}</div>`:''}`}
  else if(o.tab==='exp'){const es=o.srt.exp||'new';const ed=(a,b)=>String(b.date).localeCompare(String(a.date));const E=M.expenses.filter(x=>inR(x.date,R.from,R.to)).sort(es==='old'?(a,b)=>-ed(a,b):es==='big'?(a,b)=>(+b.amt||0)-(+a.amt||0)||ed(a,b):es==='small'?(a,b)=>(+a.amt||0)-(+b.amt||0)||ed(a,b):es==='az'?(a,b)=>az(a.note||ECATS[a.cat]||a.cat,b.note||ECATS[b.cat]||b.cat)||ed(a,b):ed);const byC={};E.forEach(x=>byC[x.cat]=(byC[x.cat]||0)+(+x.amt||0));const tot=E.reduce((s,x)=>s+(+x.amt||0),0);
    const Pu=M.purchases.filter(p=>inR(p.date,R.from,R.to)).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    body=`<div class="pp-k bz-k">${kpi('المصاريف',n3(tot),PF?ch(tot,PF.exp):null,countWord(E.length,'مصروف','مصروفان','مصاريف','مصروفًا'),'',1)}${kpi('المشتريات',n3(F.pur),PF?ch(F.pur,PF.pur):null,countWord(Pu.length,'فاتورة','فاتورتان','فواتير','فاتورة'))}</div>
     ${Object.keys(byC).length?`<h3>حسب الفئة</h3><div class="panel">${Object.entries(byC).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div class="prp-p"><div class="sumrow"><span>${esc(ECATS[c]||c)}</span><b class="num">${n3(v)} <small class="note">${tot?Math.round(v/tot*100):0}%</small></b></div><div class="prp-bar"><i style="width:${tot?Math.round(v/tot*100):0}%"></i></div></div>`).join('')}</div>`:''}
     <h3>💸 المصاريف</h3>${E.length>1?bzSortSel('exp',es):''}${E.length?`<div class="panel">${E.slice(0,80).map(x=>`<div class="sumrow"><span>${esc(x.note||ECATS[x.cat]||x.cat)}<small class="note" style="display:block">${dmy(x.date)} · ${esc(ECATS[x.cat]||x.cat)} · ${esc(x.method||'')}</small></span><b class="num amt-exp">${n3(x.amt)}</b></div>`).join('')}</div>`:'<p class="note">لا مصاريف.</p>'}
     <h3>🛒 المشتريات</h3>${Pu.length?`<div class="panel">${Pu.map(p=>`<div class="sumrow"><span>P${p.no||''} · ${esc(p.sname||'')}<small class="note" style="display:block">${dmy(p.date)} · ${arr(p.lines).map(l=>esc(l.name)+' ×'+l.q).slice(0,3).join('، ')}</small></span><span class="bz-ra"><b class="num">${n3(pTotal(p))}</b>${pDue(p)>0.0005?`<span class="pill late">عليك ${n3(pDue(p))}</span>`:'<span class="pill paid">مسدد</span>'}</span></div>`).join('')}</div>`:'<p class="note">لا مشتريات.</p>'}`}
  else if(o.tab==='stock'){const td=today();const sold=new Set();M.sales.filter(s=>dDiff(s.date,td)<=60).forEach(s=>arr(s.lines).forEach(l=>{if(l.pid)sold.add(String(l.pid));arr(l.comps).forEach(c=>sold.add(String(c.pid)))}));
    const tag=i=>+i.min>0&&(+i.qty||0)<=+i.min?'low':i.exp&&(+i.qty||0)>0&&dDiff(td,i.exp)<=30?'exp':(+i.qty||0)>0&&!sold.has(String(i.id))?'slow':'ok';
    const I=M.items.map(i=>Object.assign({},i,{_t:tag(i),_v:r3(Math.max(0,+i.qty||0)*(+i.buy||0))})).filter(i=>o.f==='all'||i._t===o.f);const ks=o.srt.stock||'val';const mg=i=>+i.sell>0?((+i.sell)-(+i.buy||0))/(+i.sell):-1;I.sort(ks==='qty'?(a,b)=>(+b.qty||0)-(+a.qty||0):ks==='low'?(a,b)=>(+a.qty||0)-(+b.qty||0):ks==='margin'?(a,b)=>mg(b)-mg(a):ks==='az'?(a,b)=>az(a.name,b.name):(a,b)=>b._v-a._v);const cnt=k=>M.items.filter(i=>tag(i)===k).length;
    body=`<div class="pp-k bz-k">${kpi('قيمة المخزون (بالتكلفة)',n3(POS.inv),null,M.items.length+' صنف')}${kpi('بسعر البيع',n3(M.items.reduce((s,i)=>s+Math.max(0,+i.qty||0)*(+i.sell||0),0)),null,'ربح متوقع '+n3(M.items.reduce((s,i)=>s+Math.max(0,+i.qty||0)*((+i.sell||0)-(+i.buy||0)),0)))}</div>
     <div class="mx-chips">${[['all','الكل',M.items.length],['low','📦 ناقص',cnt('low')],['exp','⏳ قارب الانتهاء',cnt('exp')],['slow','🐢 راكد',cnt('slow')]].map(([k,n,c])=>`<button class="chip${o.f===k?' on':''}" data-bzf="${k}">${n} <small>${c}</small></button>`).join('')}</div>${I.length>1?bzSortSel('stock',ks):''}
     ${I.length?`<div class="panel" style="margin-top:8px">${I.slice(0,150).map(i=>`<div class="sumrow"><span>${i._t==='low'?'📦 ':i._t==='exp'?'⏳ ':i._t==='slow'?'🐢 ':''}${esc(i.name)}<small class="note" style="display:block">${esc(i.cat||'')} · ${+i.qty||0} ${esc(i.unit||'')} · شراء ${n3(i.buy)} · بيع ${n3(i.sell)}${+i.buy>0?' · هامش '+Math.round(((+i.sell||0)-(+i.buy))/(+i.sell||1)*100)+'%':''}${i.exp?' · ينتهي '+dmy(i.exp):''}</small></span><b class="num">${n3(i._v)}</b></div>`).join('')}</div>`:'<div class="okbox">لا أصناف هنا.</div>'}`}
  else if(o.tab==='cust'){const cs=o.srt.cust||'due';const C=custStats(M).sort(cs==='tot'?(a,b)=>b.tot-a.tot:cs==='last'?(a,b)=>String(b.last).localeCompare(String(a.last)):cs==='az'?(a,b)=>az(a.c.name,b.c.name):(a,b)=>b.due-a.due||b.tot-a.tot);const sup={};M.purchases.forEach(p=>{const k=p._p+'|'+p.sid;const s=sup[k]=sup[k]||{name:p.sname||'مورد',tot:0,due:0,n:0};s.tot+=pTotal(p);s.due+=pDue(p);s.n++});
    body=`<div class="pp-k bz-k">${kpi('لك عند الزبائن',n3(POS.recv),null,C.filter(o=>o.due>0.0005).length+' زبون')}${kpi('عليك للموردين',n3(POS.pay),null,'')}</div>
     <h3>👥 الزبائن</h3>${C.length>1?bzSortSel('cust',cs):''}${C.length?`<div class="panel">${C.map(x=>`<button class="bz-row" data-bzc="${esc(x.c._p+'|'+x.c.id)}"><span><b>${esc(x.c.name||'')}</b><small class="note">${x.n} فاتورة · آخر شراء ${x.last?dmy(x.last):'—'}${x.c.phone?' · '+esc(x.c.phone):''}</small></span><span class="bz-ra"><b class="num">${n3(x.tot)}</b>${x.due>0.0005?`<span class="pill late">عليه ${n3(x.due)}</span>`:''}</span></button>`).join('')}</div>`:'<p class="note">لا زبائن.</p>'}
     <h3>🚚 الموردون</h3>${Object.keys(sup).length?`<div class="panel">${Object.values(sup).map(s=>`<div class="sumrow"><span>${esc(s.name)}<small class="note" style="display:block">${s.n} فاتورة شراء</small></span><span class="bz-ra"><b class="num">${n3(s.tot)}</b>${s.due>0.0005?`<span class="pill late">عليك ${n3(s.due)}</span>`:''}</span></div>`).join('')}</div>`:'<p class="note">لا موردين.</p>'}`}
  else if(o.tab==='bk'){const SL=await snapList();
    body=`<div class="panel stack"><b>المصدر الحالي</b><span class="note">${srcTxt}</span>${D.src==='snap'?'<button class="btn ghost" id="bzLive">↩︎ رجوع للبيانات الحالية</button>':''}</div>
     <h3>📥 نسخة كاملة</h3><div class="panel stack"><span class="note">ملف JSON بنفس صيغة تطبيق الزمرة (مع صور الأصناف)، تسترجعه من تطبيق الزمرة ← النسخ ← استرجاع.</span><button class="btn" id="bzFull"${D.src==='live'?'':' disabled'}>📥 تنزيل نسخة كاملة الآن</button>${D.src!=='live'?'<small class="note">متاح عند القراءة المباشرة من تطبيق الزمرة على هذا الجهاز.</small>':''}</div>
     <h3>🗂️ النسخ اليومية التلقائية <small class="note">(${SL.length})</small></h3><div class="panel">${SL.length?SL.map(k=>`<div class="sumrow"><span>${fmtD(String(k).slice(5))}</span><span style="display:flex;gap:6px"><button class="btn ghost sm" data-bzview="${esc(k)}">عرض</button><button class="btn ghost sm" data-bzdl="${esc(k)}">تنزيل</button></span></div>`).join(''):'<p class="note">تُحفظ نسخة كل يوم تفتح فيه «مشروعي» (آخر 30 يومًا + آخر نسخة من كل شهر لـ12 شهرًا).</p>'}</div>
     <p class="note">النسخ اليومية بدون صور الأصناف لتوفير المساحة. «عرض» يفتح القسم كما كان في ذلك اليوم للمقارنة والاسترجاع.</p>
     <h3>📂 استيراد</h3><div class="panel stack"><span class="note">إذا كان تطبيق الزمرة على جهاز آخر: صدّر منه «نسخة كاملة JSON» واستوردها هنا.</span><button class="btn ghost" id="bzImp">📂 استيراد نسخة من تطبيق الزمرة</button></div><input type="file" id="bzFile" accept=".json,application/json" hidden>`}
  const TABS=[['sum','📊','الملخص'],['sales','🧾','المبيعات'],['exp','💸','المصاريف'],['stock','📦','المخزون'],['cust','👥','الزبائن'],['bk','🗂️','النسخ']];
  L.innerHTML=`${sheetTop('مشروعي')}<div class="bz-top" data-nofold><h2 style="margin:0">💼 مشروعي</h2><small class="note">${srcTxt}</small></div>
   ${D.src==='snap'?`<div class="em-st warn">تعرض نسخة ${fmtD(String(D.key).slice(5))} <button class="chip" id="bzLive">رجوع للحالي</button></div>`:''}
   <input class="inp" id="bzQ" placeholder="🔍 ابحث: فاتورة، زبون، صنف، مصروف…" value="${esc(o.q)}" style="margin:6px 0">
   ${PJ.length>1?`<div class="mx-chips">${[['','كل المشاريع']].concat(PJ.map(p=>[p.id,p.name])).map(([k,n])=>`<button class="chip${o.pid===k?' on':''}" data-bzp="${esc(k)}">${esc(n)}</button>`).join('')}</div>`:''}
   <div class="bz-tabs">${TABS.map(([k,ic,n])=>`<button class="md-tab${o.tab===k&&!o.q?' on':''}" data-bzt="${k}"><span>${ic}</span>${n}</button>`).join('')}</div>
   ${['sum','sales','exp'].includes(o.tab)&&!o.q?`<div class="bz-per"><select class="inp" id="bzPer">${[['month','هذا الشهر'],['last','الشهر الماضي'],['cycle','دورة الراتب'],['q','آخر 3 أشهر'],['y','هذه السنة'],['all','كل الفترات'],['range','فترة محددة']].map(([k,n])=>`<option value="${k}"${o.per===k?' selected':''}>${n}</option>`).join('')}</select>${o.per==='range'?`<input class="inp" type="date" id="bzF" value="${o.from}"><input class="inp" type="date" id="bzT" value="${o.to}">`:''}<small class="note">📅 ${esc(R.lbl)}${R.from?' · '+fmtD(R.from)+' – '+fmtD(R.to):''}</small></div>`:''}
   ${body}
   <div class="row2" style="margin-top:12px"><button class="btn ghost" id="bzPrint">🖨️ تقرير PDF</button><button class="btn ghost" id="bzXl">📊 Excel</button></div>
   <p class="note" style="text-align:center">قراءة فقط: الإضافة والتعديل من تطبيق «إدارة مشاريع الزمرة الملكية».</p>
   <div class="actions"><button class="btn ghost block" data-close>إغلاق</button></div></div></div>`;bind()}
function searchHtml(M,q){const n=A.sNorm(q).toLowerCase();const has=t=>A.sNorm(String(t||'')).toLowerCase().includes(n);
  const S=M.sales.filter(s=>has(s.cname)||String(s.no)===q.replace(/^#/,'')||arr(s.lines).some(l=>has(l.name))).slice(0,30);const I=M.items.filter(i=>has(i.name)||has(i.en)||has(i.cat)).slice(0,30);
  const C=M.customers.filter(c=>has(c.name)||has(c.phone)).slice(0,20);const E=M.expenses.filter(x=>has(x.note)||has(ECATS[x.cat])).slice(0,20);
  const sec=(t,a,f)=>a.length?`<h3>${t} <small class="note">${a.length}</small></h3><div class="panel">${a.map(f).join('')}</div>`:'';
  const out=sec('🧾 فواتير',S,s=>`<button class="bz-row" data-bzs="${esc(s._p+'|'+s.id)}"><span><b>#${s.no||''} ${esc(s.cname||'')}</b><small class="note">${dmy(s.date)}</small></span><span class="bz-ra"><b class="num">${n3(sTotal(s))}</b>${stPill(s)}</span></button>`)
   +sec('📦 أصناف',I,i=>`<div class="sumrow"><span>${esc(i.name)}<small class="note" style="display:block">${+i.qty||0} ${esc(i.unit||'')} · بيع ${n3(i.sell)}</small></span><b class="num">${n3(Math.max(0,+i.qty||0)*(+i.buy||0))}</b></div>`)
   +sec('👥 زبائن',C,c=>`<button class="bz-row" data-bzc="${esc(c._p+'|'+c.id)}"><span><b>${esc(c.name)}</b><small class="note">${esc(c.phone||'')}</small></span></button>`)
   +sec('💸 مصاريف',E,x=>`<div class="sumrow"><span>${esc(x.note||ECATS[x.cat]||'')}<small class="note" style="display:block">${dmy(x.date)}</small></span><b class="num amt-exp">${n3(x.amt)}</b></div>`);
  return out||'<div class="okbox">لا نتائج.</div>'}
function saleSheet(key){const M=merged(BZ.data,'');const [p,id]=key.split('|');const s=M.sales.find(x=>String(x._p)===p&&String(x.id)===id);if(!s)return;
  const L=document.getElementById('layer');const prev=L.innerHTML;
  L.innerHTML=`${sheetTop('فاتورة')}<h2 style="margin-top:0">🧾 فاتورة #${s.no||''}</h2><div class="panel"><div class="sumrow"><span>الزبون</span><b>${esc(s.cname||'زبون نقدي')}</b></div><div class="sumrow"><span>التاريخ</span><b>${fmtD(s.date)}</b></div><div class="sumrow"><span>الدفع</span><b>${esc(s.method||'')}</b></div>${s.note?`<div class="sumrow"><span>ملاحظة</span><b>${esc(s.note)}</b></div>`:''}</div>
   <h3>الأصناف</h3><div class="panel">${arr(s.lines).map(l=>`<div class="sumrow"><span>${esc(l.name)}<small class="note" style="display:block">${l.q} ${esc(l.unit||'')} × ${n3(l.price)}${l.comps?' · '+arr(l.comps).map(c=>c.q+'×'+esc(c.name)).join('، '):''}</small></span><b class="num">${n3((+l.q||0)*(+l.price||0))}</b></div>`).join('')}
    ${+s.disc?`<div class="sumrow"><span>خصم</span><b class="num">− ${n3(s.disc)}</b></div>`:''}${+s.fee?`<div class="sumrow"><span>رسوم</span><b class="num">+ ${n3(s.fee)}</b></div>`:''}${retAmt(s)?`<div class="sumrow"><span>مرتجع</span><b class="num">− ${n3(retAmt(s))}</b></div>`:''}
    <div class="sumrow tot"><span>الإجمالي</span><b class="num">${n3(sTotal(s))}</b></div><div class="sumrow"><span>المدفوع</span><b class="num amt-inc">${n3(s.paid)}</b></div><div class="sumrow"><span>المتبقي</span><b class="num ${sDue(s)>0.0005?'amt-exp':''}">${n3(sDue(s))}</b></div><div class="sumrow"><span>الربح</span><b class="num">${n3(sTotal(s)-sCost(s))}</b></div></div>
   <div class="actions"><button class="btn ghost block" id="bzBack">› رجوع</button></div></div></div>`;
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.id==='bzBack'||x.hasAttribute('data-close')){draw();return}}}
function custSheet(key){const M=merged(BZ.data,'');const [p,id]=key.split('|');const S=M.sales.filter(s=>String(s._p)===p&&String(s.cid)===id).sort((a,b)=>String(b.date).localeCompare(String(a.date)));const c=M.customers.find(x=>String(x._p)===p&&String(x.id)===id)||{name:S[0]&&S[0].cname||'زبون'};
  const L=document.getElementById('layer');const tot=S.reduce((t,s)=>t+sTotal(s),0),due=S.reduce((t,s)=>t+sDue(s),0);
  L.innerHTML=`${sheetTop('زبون')}<h2 style="margin-top:0">👤 ${esc(c.name)}</h2><div class="pp-k bz-k">${kpi('مشترياته',n3(tot),null,S.length+' فاتورة')}${kpi('عليه',n3(due),null,'',due>0.0005?'bad':'ok')}</div>
   <div class="panel">${c.phone?`<div class="sumrow"><span>الهاتف</span><b dir="ltr">${esc(c.phone)}</b></div>`:''}${c.type?`<div class="sumrow"><span>النوع</span><b>${esc(c.type)}</b></div>`:''}${c.loc?`<div class="sumrow"><span>الموقع</span><b>${esc(c.loc)}</b></div>`:''}</div>
   <h3>الفواتير</h3><div class="panel">${S.map(s=>`<button class="bz-row" data-bzs="${esc(s._p+'|'+s.id)}"><span><b>#${s.no||''}</b><small class="note">${dmy(s.date)}</small></span><span class="bz-ra"><b class="num">${n3(sTotal(s))}</b>${stPill(s)}</span></button>`).join('')||'<p class="note">لا فواتير.</p>'}</div>
   <div class="actions"><button class="btn ghost block" id="bzBack">› رجوع</button></div></div></div>`;
  L.onclick=e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.id==='bzBack'||x.hasAttribute('data-close')){draw();return}if(x.dataset.bzs){saleSheet(x.dataset.bzs);return}}}
function fullBackup(pid){const o=readProject(pid);return JSON.stringify({v:1,items:o.items,bundles:o.bundles,customers:o.customers,sales:o.sales,suppliers:o.suppliers,purchases:o.purchases,expenses:o.expenses,moves:o.moves,quotes:o.quotes,closings:o.closings,dents:o.dents,ddocs:o.ddocs,set:o.set})}
async function importFile(f){const txt=await f.text();let o;try{o=JSON.parse(txt)}catch(e){toast('الملف ليس JSON صالحًا');return}
  let projects;if(o&&Array.isArray(o.projects))projects=o.projects;else if(o&&Array.isArray(o.items)&&Array.isArray(o.sales||[])){projects=[{id:'main',name:'المشروع الرئيسي',data:Object.assign({v:1},Object.fromEntries(STORES.map(([n])=>[n,arr(o[n])])),{set:o.set||{}})}]}
  else{toast('هذه ليست نسخة من تطبيق الزمرة');return}
  const D=strip({src:'import',at:new Date().toISOString(),projects});await idb('put','import',D);await snapTake(D);try{A.markImported&&A.markImported()}catch(e){}toast('استُوردت بيانات المشروع ✓');BZ.o.snap=null;draw()}
function printRep(){const D=BZ.data;if(!D)return;const o=BZ.o;const M=merged(D,o.pid);const R=perRange(o.per,o);const F=finance(M,R.from,R.to);const POS=position(M);const now=new Date();
  const N=v=>`<span class="n">${v<0?'−':''}${money(Math.abs(v))}</span>`;const T=(h,r)=>`<table><thead><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${r.join('')}</tbody></table>`;
  const PR=products(M,R.from,R.to).sort((a,b)=>b.rev-a.rev).slice(0,15);const E={};M.expenses.filter(x=>inR(x.date,R.from,R.to)).forEach(x=>E[x.cat]=(E[x.cat]||0)+(+x.amt||0));const C=custStats(M).filter(x=>x.due>0.0005).sort((a,b)=>b.due-a.due);
  const pn=o.pid?(D.projects.find(p=>p.id===o.pid)||{}).name:D.projects.map(p=>p.name).join(' + ');
  let h=`<header class="rh"><div><div class="rapp">${A.REP_LOGO}إدارة شؤوني</div><h1>تقرير المشروع: ${esc(pn)}</h1><div class="rper">${esc(R.lbl)}${R.from?' · '+fmtD(R.from)+' – '+fmtD(R.to):''}</div></div><div class="rmeta">${A.repOwner()}أُعدّ في ${fmtD(today())} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}<br>العملة: ر.ع.</div></header>
   <section><h2>الأداء</h2><div class="kpis"><div><span>المبيعات</span><b class="ok">${N(F.rev)}</b></div><div><span>الربح الإجمالي</span><b>${N(F.gross)}</b></div><div><span>المصاريف</span><b class="no">${N(F.exp)}</b></div><div><span>صافي الربح</span><b class="${F.net<0?'no':'ok'}">${N(F.net)}</b></div></div>
   ${T(['البند','المبلغ'],[['المبيعات',F.rev],['ضريبة القيمة المضافة',F.vat],['صافي المبيعات',F.sales],['تكلفة البضاعة المباعة',F.cogs],['الربح الإجمالي',F.gross],['المصاريف',F.exp],['صافي الربح',F.net],['المشتريات (للعلم)',F.pur],['المرتجعات (للعلم)',F.ret]].map(([a,b])=>`<tr><td>${a}</td><td class="nw">${N(b)}</td></tr>`))}</section>
   <section><h2>الوضع الحالي</h2>${T(['البند','المبلغ'],[['قيمة المخزون بالتكلفة',POS.inv],['لك عند الزبائن',POS.recv],['عليك للموردين',POS.pay],['صافي قيمة المشروع',POS.equity]].map(([a,b])=>`<tr><td>${a}</td><td class="nw">${N(b)}</td></tr>`))}</section>
   ${PR.length?`<section><h2>الأصناف الأكثر مبيعًا</h2>${T(['#','الصنف','الكمية','المبيعات','الربح','الهامش'],PR.map((p,i)=>`<tr><td class="idx">${i+1}</td><td>${esc(p.name)}</td><td>${p.q} ${esc(p.unit)}</td><td class="nw">${N(p.rev)}</td><td class="nw">${N(p.profit)}</td><td>${p.margin}%</td></tr>`))}</section>`:''}
   ${Object.keys(E).length?`<section><h2>المصاريف حسب الفئة</h2>${T(['الفئة','المبلغ'],Object.entries(E).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<tr><td>${esc(ECATS[c]||c)}</td><td class="nw">${N(v)}</td></tr>`))}</section>`:''}
   ${C.length?`<section><h2>المستحقات على الزبائن</h2>${T(['الزبون','الفواتير','المستحق','أقدم فاتورة غير مسددة'],C.map(x=>`<tr><td>${esc(x.c.name||'')}</td><td>${x.n}</td><td class="nw no">${N(x.due)}</td><td class="nw">${x.old?dmy(x.old):'—'}</td></tr>`))}</section>`:''}
   <section><h2>ملاحظات</h2><ul>${insights(M,R).map(([i,t])=>`<li>${i} ${esc(t)}</li>`).join('')}</ul></section>
   <footer class="rf">تقرير المشروع من «إدارة شؤوني» · قراءة من تطبيق إدارة مشاريع الزمرة الملكية · حُسب داخل الهاتف</footer>`;
  A.prStyle('portrait');let el=document.getElementById('printArea');if(!el){el=document.createElement('div');el.id='printArea';document.body.appendChild(el)}el.className='rep';el.innerHTML=A.repTotalsHtml(h);
  const old=document.title;document.title='تقرير المشروع - إدارة شؤوني';window.addEventListener('afterprint',()=>{document.title=old},{once:true});try{window.print()}catch(e){toast('تعذّرت الطباعة هنا')}setTimeout(()=>{document.title=old},3000)}
function xlsx(){const D=BZ.data;if(!D)return;const o=BZ.o;const M=merged(D,o.pid);const R=perRange(o.per,o);const sub=R.lbl+(R.from?' · '+R.from+' – '+R.to:'');const mp=D.projects.length>1;
  const S=M.sales.filter(s=>inR(s.date,R.from,R.to));const E=M.expenses.filter(x=>inR(x.date,R.from,R.to));const Pu=M.purchases.filter(p=>inR(p.date,R.from,R.to));
  const sh=[{name:'المبيعات',title:'فواتير المبيعات',sub,head:[['رقم','i'],['التاريخ','d'],['الزبون','s',24]].concat(mp?[['المشروع','s',18]]:[]).concat([['الإجمالي','n'],['المدفوع','n'],['المتبقي','n'],['الربح','n']]),rows:S.map(s=>[+s.no||0,s.date,s.cname||''].concat(mp?[s._pn]:[]).concat([r3(sTotal(s)),r3(+s.paid||0),r3(sDue(s)),r3(sTotal(s)-sCost(s))])),totals:mp?[4,5,6,7]:[3,4,5,6]},
    {name:'الأصناف المباعة',title:'المبيعات حسب الصنف',sub,head:[['الصنف','s',30],['الكمية','n'],['المبيعات','n'],['الربح','n'],['الهامش %','i']],rows:products(M,R.from,R.to).sort((a,b)=>b.rev-a.rev).map(p=>[p.name,p.q,p.rev,p.profit,p.margin]),totals:[2,3]},
    {name:'المصاريف',title:'المصاريف',sub,head:[['التاريخ','d'],['الفئة','s',20],['البيان','s',30],['الطريقة','s',10],['المبلغ','n']],rows:E.map(x=>[x.date,ECATS[x.cat]||x.cat,x.note||'',x.method||'',r3(+x.amt||0)]),totals:[4]},
    {name:'المشتريات',title:'المشتريات',sub,head:[['رقم','i'],['التاريخ','d'],['المورد','s',20],['الإجمالي','n'],['المدفوع','n'],['المتبقي','n']],rows:Pu.map(p=>[+p.no||0,p.date,p.sname||'',r3(pTotal(p)),r3(+p.paid||0),r3(pDue(p))]),totals:[3,4,5]},
    {name:'المخزون',title:'المخزون الحالي',sub:'الآن',head:[['الصنف','s',30],['الفئة','s',16],['الكمية','n'],['الوحدة','s',8],['الشراء','n'],['البيع','n'],['القيمة','n']],rows:M.items.map(i=>[i.name,i.cat||'',+i.qty||0,i.unit||'',+i.buy||0,+i.sell||0,r3(Math.max(0,+i.qty||0)*(+i.buy||0))]),totals:[6]},
    {name:'الزبائن',title:'الزبائن والمستحقات',sub:'الآن',head:[['الزبون','s',24],['الهاتف','s',14],['الفواتير','i'],['المشتريات','n'],['المستحق','n']],rows:custStats(M).map(x=>[x.c.name||'',x.c.phone||'',x.n,x.tot,x.due]),totals:[3,4]}];
  const data=A.XL.build(sh);A.shareFile('project-'+today()+'.xlsx',data,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').then(r=>{if(r!=='cancel')toast(r==='shared'?'اختر «Numbers» لفتحه':'حُفظ الملف')})}
function bind(){const L=document.getElementById('layer');let qt=null;
  L.oninput=e=>{if(e.target.id==='bzQ'){clearTimeout(qt);qt=setTimeout(async()=>{BZ.o.q=e.target.value;await draw();const q=document.getElementById('bzQ');if(q){q.focus();q.setSelectionRange(q.value.length,q.value.length)}},300)}};
  L.onchange=async e=>{const id=e.target.id;if(id==='bzSort'){BZ.o.srt=BZ.o.srt||{};BZ.o.srt[BZ.o.tab]=e.target.value;draw();return}if(id==='bzPer'){BZ.o.per=e.target.value;if(BZ.o.per==='range'&&!BZ.o.from){BZ.o.to=today();BZ.o.from=addDays(today(),-29)}draw();return}
    if(id==='bzF'||id==='bzT'){BZ.o[id==='bzF'?'from':'to']=e.target.value;if(BZ.o.from&&BZ.o.to)draw();return}
    if(id==='bzFile'){const f=e.target.files[0];e.target.value='';if(f)importFile(f);return}};
  L.onclick=async e=>{const x=e.target.closest('button,[data-close]');if(!x)return;if(x.hasAttribute('data-close')){L.innerHTML='';A.render();return}const sc=()=>{const s=L.querySelector('.sheet');if(s)s.scrollTop=0};
    if(x.dataset.bzt){BZ.o.tab=x.dataset.bzt;BZ.o.q='';BZ.o.f='all';await draw();sc();return}
    if(x.dataset.bzp!==undefined){BZ.o.pid=x.dataset.bzp;draw();return}
    if(x.dataset.bzf){BZ.o.f=x.dataset.bzf;draw();return}
    if(x.dataset.bzs){saleSheet(x.dataset.bzs);return}
    if(x.dataset.bzc){custSheet(x.dataset.bzc);return}
    if(x.dataset.bzview){BZ.o.snap=x.dataset.bzview;BZ.o.tab='sum';await draw();sc();return}
    if(x.id==='bzLive'){BZ.o.snap=null;await draw();return}
    if(x.dataset.bzdl){const s=await idb('get',x.dataset.bzdl);if(!s)return;const p=s.projects.find(z=>z.id===(BZ.o.pid||'main'))||s.projects[0];const d=p.data;
      A.shareFile('royal-group-'+String(x.dataset.bzdl).slice(5)+'.json',JSON.stringify({v:1,items:d.items,bundles:d.bundles,customers:d.customers,sales:d.sales,suppliers:d.suppliers,purchases:d.purchases,expenses:d.expenses,moves:d.moves,quotes:d.quotes,closings:d.closings,dents:d.dents,ddocs:d.ddocs,set:d.set}),'application/json');toast('نسخة بدون صور الأصناف');return}
    if(x.id==='bzFull'){const pid=BZ.o.pid||'main';A.shareFile('royal-group-full-'+today()+'.json',fullBackup(pid),'application/json');return}
    if(x.id==='bzImp'){document.getElementById('bzFile').click();return}
    if(x.id==='bzPrint'){printRep();return}
    if(x.id==='bzXl'){xlsx();return}}}
window.BZ_open=function(o){Object.assign(BZ.o,{q:'',snap:null},o||{});draw()};
window.BZ_api={liveAvailable,readLive,merged,finance,position,perRange,sTotal,sDue,insights};
})();
