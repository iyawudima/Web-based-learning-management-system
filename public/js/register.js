import {auth,db,$,errMsg} from "./core.js";
import {createUserWithEmailAndPassword,updateProfile,deleteUser} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {doc,writeBatch,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const up=s=>s.trim().toUpperCase();
$("#rf").onsubmit=async e=>{e.preventDefault();const f=e.target,b=e.submitter,m=up(f.matric.value),ar=up(f.appRef.value);let u;b.disabled=true;$("#msg").textContent="";
 try{u=(await createUserWithEmailAndPassword(auth,f.email.value,f.password.value)).user;await updateProfile(u,{displayName:f.fullName.value});
  const w=writeBatch(db);
  w.update(doc(db,"matrics",m),{claimed:true,claimedBy:u.uid,proof:ar});
  w.set(doc(db,"users",u.uid),{name:f.fullName.value.trim(),email:f.email.value,role:"student",matric:m,applicationRef:ar,phone:"",createdAt:serverTimestamp()});
  await w.commit();location.href="app.html"}
 catch(x){if(u)await deleteUser(u).catch(()=>{});$("#msg").textContent=["permission-denied","not-found"].includes(x.code)?"Matric Number and application reference do not match, or this Matric Number has already been used.":errMsg(x);b.disabled=false}};
