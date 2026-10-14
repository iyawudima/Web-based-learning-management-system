import {auth,db,st,$,errMsg,sha,rnd} from "./core.js";
import {signInAnonymously} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {doc,writeBatch,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {ref,uploadBytesResumable} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import {ADMISSION as AD} from "./config.js";
const f=$("#wf"),E=f.elements,steps=[...f.querySelectorAll(".step")],bars=[...f.querySelectorAll(".steps span")],P=AD.programmes,uniq=a=>[...new Set(a)],yr=new Date().getFullYear();let i=0;
const fill=(n,a)=>{const s=E[n],v=s.value;s.innerHTML='<option value="">Select…</option>'+a.map(x=>`<option>${x}</option>`).join("");if(a.includes(v))s.value=v};
const grad=()=>["PGD","Masters"].includes(E.level.value);
function mode(){const g=grad();f.querySelectorAll("[data-show]").forEach(e=>{const on=(e.dataset.show==="grad")===g;e.hidden=!on;e.querySelectorAll("input,select,textarea").forEach(c=>c.disabled=!on)});f.querySelectorAll("[data-req-grad]").forEach(e=>e.required=g)}
const bindFiles=()=>f.querySelectorAll("input[type=file]").forEach(e=>e.onchange=()=>{const x=e.files[0];let m="";if(x){if(!(e.dataset.img?["image/jpeg","image/png"]:["application/pdf","image/jpeg","image/png"]).includes(x.type))m="Invalid file type.";else if(x.size>e.dataset.max*1048576)m="File too large (max "+e.dataset.max+" MB)."}e.setCustomValidity(m);if(m)e.reportValidity()});
E.faculty.onchange=()=>{fill("dept",uniq(P.filter(p=>p.faculty===E.faculty.value).map(p=>p.dept)));E.dept.onchange()};
E.dept.onchange=()=>{fill("programme",P.filter(p=>p.faculty===E.faculty.value&&p.dept===E.dept.value).map(p=>p.name));E.programme.onchange()};
E.programme.onchange=()=>{const pr=P.find(p=>p.name===E.programme.value);fill("level",pr?pr.levels:[]);$("#extraDocs").innerHTML="";
 (pr?.extraDocs||[]).forEach((l,k)=>{const n=$("#tExtra").content.cloneNode(true),inp=n.querySelector("input");n.querySelector("[data-l]").textContent=l;inp.name="extra"+k;inp.dataset.label=l;$("#extraDocs").append(n)});bindFiles();mode()};
E.level.onchange=mode;
function show(n){i=n;steps.forEach((s,k)=>s.hidden=k!==n);bars.forEach((b,k)=>b.classList.toggle("on",k<=n));$("#stepLabel").textContent=`Step ${n+1} of ${steps.length}: ${steps[n].dataset.title}`;$("#back").hidden=!n;$("#next").textContent=n===steps.length-1?"Submit application":"Next";$("#em").textContent=""}
const valid=()=>{const s=E.subjects;s.setCustomValidity(s.disabled||s.value.split("\n").filter(x=>x.trim()).length>=5?"":"Enter at least 5 subjects with grades.");
 for(const e of steps[i].querySelectorAll("input,select,textarea"))if(!e.disabled&&!e.checkValidity()){e.reportValidity();return false}return true};
$("#back").onclick=()=>show(i-1);
$("#next").onclick=async()=>{if(!valid())return;if(i<steps.length-1)return show(i+1);await submit()};
async function submit(){const btn=$("#next"),em=$("#em");btn.disabled=true;
 try{for(let k=0;k<steps.length;k++){show(k);if(!valid()){btn.disabled=false;return}}
  if(!auth.currentUser)await signInAnonymously(auth);
  const uid=auth.currentUser.uid,rf=`APP-${yr}-${rnd(6)}`,pin=rnd(8),rec={},fl={},sent={},fs=[...f.querySelectorAll("input[type=file]")].filter(e=>!e.disabled&&e.files[0]);
  for(const[k,v]of new FormData(f))if(typeof v==="string"&&!["ok1","ok2"].includes(k))rec[k]=v.trim();
  const total=fs.reduce((a,e)=>a+e.files[0].size,0);
    for(const e of fs){if(!AD.uploadFiles){fl[e.name]={label:e.dataset.label,path:"",fileName:e.files[0].name};continue}const x=e.files[0],path=`applications/${uid}/${rf}/${e.name}_${x.name.replace(/[^\w.\-]/g,"_")}`,bar=e.parentElement.querySelector(".prog i");$("#upMsg").textContent="Uploading "+e.dataset.label+"…";
   await new Promise((ok,no)=>{const t=uploadBytesResumable(ref(st,path),x,{contentType:x.type});t.on("state_changed",s=>{bar.style.width=s.bytesTransferred/s.totalBytes*100+"%";sent[e.name]=s.bytesTransferred;$("#allp").style.width=Object.values(sent).reduce((a,b)=>a+b,0)/total*100+"%"},no,ok)});fl[e.name]={label:e.dataset.label,path}}
   const token=await sha(rf+":"+pin),dup=await sha([rec.email.toLowerCase(),rec.session,rec.programme].join("|")),w=writeBatch(db);
  w.set(doc(db,"appIndex",dup),{ref:rf});
  w.set(doc(db,"applications",rf),{...rec,ref:rf,applicantUid:uid,files:fl,declaration:true,createdAt:serverTimestamp()});
  w.set(doc(db,"appStatus",token),{ref:rf,status:"Submitted",name:rec.fullName,remarks:"",updatedAt:serverTimestamp()});
  await w.commit();f.hidden=true;$("#done").hidden=false;$("#dRef").textContent=rf;$("#dPin").textContent=pin}
 catch(x){em.textContent=x.code==="permission-denied"?"Submission refused. If you already applied with this email for the same programme and session, use Check Status instead.":errMsg(x);btn.disabled=false}}
fill("session",AD.sessions);fill("mode",AD.modes);fill("examType",AD.examTypes);fill("faculty",uniq(P.map(p=>p.faculty)));["dept","programme","level"].forEach(n=>fill(n,[]));
E.dob.max=new Date(Date.now()-15*31557600000).toISOString().slice(0,10);E.dob.min=new Date(Date.now()-80*31557600000).toISOString().slice(0,10);E.examYear.min=1980;E.examYear.max=yr;
bindFiles();mode();show(0);
