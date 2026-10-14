import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,doc,getDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {getStorage} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import {firebaseConfig,BRAND} from "./config.js";
if(firebaseConfig.apiKey==="YOUR_API_KEY"){document.body.innerHTML='<div style="padding:30px;font-family:sans-serif"><h3>Firebase config missing</h3><p>Open <b>public/js/config.js</b> and paste your Firebase web config.</p></div>';throw new Error("Firebase config missing")}
const fb=initializeApp(firebaseConfig);
export const auth=getAuth(fb),db=getFirestore(fb),st=getStorage(fb),$=s=>document.querySelector(s);
export let brand={...BRAND};
export const paint=()=>{document.querySelectorAll("[data-brand]").forEach(e=>e.textContent=brand[e.dataset.brand]||"");document.querySelectorAll("img[data-logo]").forEach(i=>{if(brand.logo){i.src=brand.logo;i.hidden=false}})};
export const toast=(m,e)=>{let t=$("#toast");if(!t){t=document.createElement("div");t.id="toast";document.body.append(t)}const d=document.createElement("div");d.textContent=m;if(e)d.className="err";t.append(d);setTimeout(()=>d.remove(),4500)};
export const errMsg=e=>({"auth/invalid-credential":"Wrong email or password.","auth/email-already-in-use":"This email is already registered.","auth/weak-password":"Password must be at least 6 characters.","auth/invalid-email":"Enter a valid email address.","permission-denied":"You do not have permission for this action."}[e.code]||e.message);
export const sha=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,"0")).join("");
export const rnd=n=>[...crypto.getRandomValues(new Uint8Array(n))].map(b=>"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b%32]).join("");
paint();getDoc(doc(db,"settings","site")).then(s=>{if(s.exists()){brand={...brand,...s.data()};paint()}}).catch(()=>{});
