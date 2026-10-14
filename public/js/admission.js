import {doc,collection,writeBatch,runTransaction,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {ref as sref,getDownloadURL} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import {ADMISSION as AD} from "./config.js";

// Admission officer dashboard (applicant pages are plain HTML: apply.html, status.html, register.html)
export function admission(x){
 const {db,st,esc,toast,onSubmit,list,table,fmt,errMsg}=x,$=s=>document.querySelector(s),uniq=a=>[...new Set(a)];
 const STAT=["Submitted","Under Review","Incomplete","Approved","Rejected","Waitlisted"];
 // ---------- Admission officer dashboard ----------
 const DET=[["fullName","Full name"],["dob","Date of birth"],["gender","Gender"],["nationality","Nationality"],["stateOrigin","State of origin"],["lga","LGA"],["address","Address"],["phone","Phone"],["email","Email"],["resState","Residence state"],["resLga","Residence LGA"],["nokName","Next of kin"],["nokRel","Relationship"],["nokPhone","NOK phone"],["nokAddress","NOK address"],["session","Session"],["faculty","Faculty"],["dept","Department"],["programme","Programme"],["level","Entry level"],["mode","Mode"],["prevSchool","Previous school"],["highest","Highest qualification"],["degreeClass","Degree class"],["examType","Exam type"],["examNo","Exam number"],["examYear","Exam year"],["subjects","Subjects / grades"],["extra","Additional"]];
 async function admissions(){const mn=x.main();
  const[apps,sts]=await Promise.all([list("applications"),list("appStatus")]),sm=Object.fromEntries(sts.map(s=>[s.ref,s])),rows=apps.map(a=>({...a,stat:sm[a.ref]||{status:"Submitted"}}));
  const opt=k=>uniq(rows.map(r=>r[k]).filter(Boolean)).map(v=>`<option>${esc(v)}</option>`).join("");
  mn.innerHTML=`<h2>Admissions</h2><div class="two"><input id="fq" placeholder="Search name, reference or email…"><select id="fp"><option value="">All programmes</option>${opt("programme")}</select><select id="fs"><option value="">All sessions</option>${opt("session")}</select><select id="ft"><option value="">All statuses</option>${STAT.map(s=>`<option>${s}</option>`).join("")}</select></div><div id="tb"></div>`;
  const draw=()=>{const q=$("#fq").value.toLowerCase(),p=$("#fp").value,s=$("#fs").value,t=$("#ft").value;
   const r=rows.filter(a=>(!q||[a.fullName,a.ref,a.email].join(" ").toLowerCase().includes(q))&&(!p||a.programme===p)&&(!s||a.session===s)&&(!t||a.stat.status===t));
   $("#tb").innerHTML=table(["Reference","Applicant","Programme","Session","Status",""],r.map(a=>[esc(a.ref),esc(a.fullName),esc(a.programme),esc(a.session),`<span class="tag">${esc(a.stat.status)}</span>`,`<button class="btn" data-r="${a.ref}">Review</button>`]));
   document.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>review(rows.find(a=>a.ref===b.dataset.r)))};
  ["#fq","#fp","#fs","#ft"].forEach(i=>$(i).oninput=draw);draw()}
 async function review(a){const mn=x.main(),au=await list(`applications/${a.ref}/audit`),fl=[...Object.values(a.files||{}),...(a.stat.correctionFiles||[])];
  au.sort((p,q)=>(q.at?.seconds||0)-(p.at?.seconds||0));
  mn.innerHTML=`<button class="btn alt" id="bk">← Back</button><h2>${esc(a.fullName)} <span class="tag">${esc(a.stat.status)}</span></h2><p class="muted">${esc(a.ref)}${a.matric?" · Matric "+esc(a.matric):""}</p><div class="card"><div class="two">${DET.filter(([k])=>a[k]).map(([k,l])=>`<div><small class="muted">${l}</small><br><span style="white-space:pre-line">${esc(a[k])}</span></div>`).join("")}</div></div>
  <h3>Documents</h3><div class="card">${fl.map(o=>o.path?`<button class="btn alt" data-p="${esc(o.path)}">${esc(o.label)}</button>`:`<span class="tag">${esc(o.label)} (not uploaded)</span>`).join(" ")||"None"}</div>${a.stat.correction?`<h3>Applicant's correction</h3><div class="card">${esc(a.stat.correction)}</div>`:""}  <h3>Decision</h3>${a.matric?`<div class="card">Approved — final. Matric Number ${esc(a.matric)} issued.</div>`:`<form id="df" class="card form"><select name="action" required><option value="">Choose decision…</option>${STAT.slice(1).map(s=>`<option>${s}</option>`).join("")}</select><textarea name="remarks" placeholder="Remarks (shown to the applicant; required for Incomplete and Rejected)"></textarea><button class="btn">Record decision</button></form>`}
  <h3>Audit trail</h3>${table(["When","Officer","Action","Note"],au.map(z=>[fmt(z.at),esc(z.byName),esc(z.action),esc(z.note)]))}`;
  $("#bk").onclick=()=>x.route();
  document.querySelectorAll("[data-p]").forEach(b=>b.onclick=async()=>{const w=window.open("","_blank");try{w.location=await getDownloadURL(sref(st,b.dataset.p))}catch(e){w.close();toast(errMsg(e),1)}});
  onSubmit("#df",async f=>{await decide(a,f);x.route()})}
 async function decide(a,f){const act=f.get("action"),rem=f.get("remarks").trim(),me=x.getMe();
  if(["Incomplete","Rejected"].includes(act)&&!rem)throw new Error("Remarks are required for this decision.");
  const aud={action:act,note:rem,by:me.uid,byName:me.name,at:serverTimestamp()},ar=doc(db,"applications",a.ref),sr=doc(db,"appStatus",a.stat.id);
  if(act==="Approved"){let matric;const yr=a.session.split("/")[0],key="matric_"+a.session.replace(/\D/g,"");
   await runTransaction(db,async tx=>{
    if((await tx.get(ar)).data().matric)throw new Error("This application already has a Matric Number.");
    const cr=doc(db,"counters",key),c=await tx.get(cr),n=(c.exists()?c.data().n:0)+1;
    matric=`${AD.matricPrefix}-${yr}-${String(n).padStart(4,"0")}`;
    tx.set(cr,{n});
    tx.set(doc(db,"matrics",matric),{matric,appRef:a.ref,session:a.session,claimed:false,claimedBy:null,createdAt:serverTimestamp()});
    tx.update(ar,{decision:act,remarks:rem,matric,decidedBy:me.uid,decidedAt:serverTimestamp()});
    tx.update(sr,{status:act,remarks:rem,matric,updatedAt:serverTimestamp()});
    tx.set(doc(collection(db,`applications/${a.ref}/audit`)),{...aud,note:(rem?rem+" · ":"")+"Matric "+matric})});
   toast("Approved. Matric Number: "+matric)}
  else{const b=writeBatch(db);
   b.update(ar,{decision:act,remarks:rem,decidedBy:me.uid,decidedAt:serverTimestamp()});
   b.update(sr,{status:act,remarks:rem,updatedAt:serverTimestamp()});
   b.set(doc(collection(db,`applications/${a.ref}/audit`)),aud);await b.commit();toast("Decision recorded")}}
 return{admissions};
}
