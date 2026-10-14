import {auth,$,errMsg} from "./core.js";
import {signInWithEmailAndPassword,sendPasswordResetEmail,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
onAuthStateChanged(auth,u=>{if(u&&!u.isAnonymous)location.href="app.html"});
$("#lf").onsubmit=async e=>{e.preventDefault();const b=e.submitter,f=e.target;b.disabled=true;$("#msg").textContent="";try{await signInWithEmailAndPassword(auth,f.email.value,f.password.value)}catch(x){$("#msg").textContent=errMsg(x);b.disabled=false}};
$("#fp").onclick=async e=>{e.preventDefault();const em=$("#lf").email.value;if(!em){$("#msg").textContent="Enter your email first.";return}try{await sendPasswordResetEmail(auth,em);$("#msg").textContent="Reset link sent to "+em}catch(x){$("#msg").textContent=errMsg(x)}};
