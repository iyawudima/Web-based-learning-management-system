import {ADMISSION as AD} from "./config.js";
import {auth,db,st,$,errMsg,sha,toast} from "./core.js";
import {signInAnonymously} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {doc,getDoc,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {ref,uploadBytes} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
const up=s=>s.trim().toUpperCase();let cur=null;
async function load(rf,token){const s=await getDoc(doc(db,"appStatus",token));if(!s.exists())throw new Error("No application found. Check your reference number and PIN.");
 cur={rf,token};const d=s.data();$("#res").hidden=false;$("#rRef").textContent=rf;$("#rStatus").textContent=d.status;
 $("#rRemarks").textContent=d.remarks?"Remarks from admissions office: "+d.remarks:"";$("#rRemarks").hidden=!d.remarks;
 $("#approved").hidden=d.status!=="Approved";$("#rMatric").textContent=d.matric||"";$("#cr").hidden=d.status!=="Incomplete"}
$("#sf").onsubmit=async e=>{e.preventDefault();const f=e.target,b=e.submitter;b.disabled=true;$("#sm").textContent="";$("#res").hidden=true;
 try{const rf=up(f.elements.ref.value);await load(rf,await sha(rf+":"+up(f.elements.pin.value)))}catch(x){$("#sm").textContent=x.code?"No application found. Check your reference number and PIN.":x.message}b.disabled=false};
$("#cr").onsubmit=async e=>{e.preventDefault();const f=e.target,b=e.submitter,fs=[...f.files.files];$("#cm").textContent="";
 for(const z of fs)if(!["application/pdf","image/jpeg","image/png"].includes(z.type)||z.size>5242880){$("#cm").textContent=z.name+": only PDF/JPG/PNG up to 5 MB allowed.";return}
 b.disabled=true;
 try{if(!auth.currentUser)await signInAnonymously(auth);const uid=auth.currentUser.uid,cf=[];
  for(const z of fs){if(!AD.uploadFiles){cf.push({label:z.name,path:""});continue}const path=`applications/${uid}/${cur.rf}/fix${Date.now()}_${z.name.replace(/[^\w.\-]/g,"_")}`;await uploadBytes(ref(st,path),z,{contentType:z.type});cf.push({label:z.name,path})}
  await updateDoc(doc(db,"appStatus",cur.token),{status:"Under Review",correction:f.note.value,correctionFiles:cf,updatedAt:serverTimestamp()});
  toast("Correction submitted");f.reset();await load(cur.rf,cur.token)}catch(x){$("#cm").textContent=errMsg(x)}b.disabled=false};