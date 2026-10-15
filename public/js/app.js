import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,updateProfile,sendPasswordResetEmail} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,collection,doc,getDoc,getDocs,setDoc,updateDoc,deleteDoc,addDoc,query,where,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {getStorage,ref,uploadBytes,getDownloadURL} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import {firebaseConfig,BRAND} from "./config.js";
import {admission} from "./admission.js";
if(firebaseConfig.apiKey==="YOUR_API_KEY"){document.getElementById("app").innerHTML='<div style="padding:30px;font-family:sans-serif"><h3>Firebase config missing</h3><p>Open <b>public/js/config.js</b> and paste your Firebase web app config.</p></div>';throw new Error("Firebase config missing")}

const fb=initializeApp(firebaseConfig),auth=getAuth(fb),db=getFirestore(fb),st=getStorage(fb);
const app=document.getElementById("app"),$=s=>document.querySelector(s);
let me=null,brand={...BRAND},pending=Promise.resolve(),main;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const toast=(m,e)=>{const d=document.createElement("div");d.textContent=m;if(e)d.className="err";$("#toast").append(d);setTimeout(()=>d.remove(),4500)};
const list=async(c,...q)=>(await getDocs(query(collection(db,c),...q))).docs.map(d=>({id:d.id,...d.data()}));
const fmt=t=>t?.toDate?t.toDate().toLocaleDateString():"";
const table=(h,rows)=>`<div class="tw"><table><tr>${h.map(x=>`<th>${x}</th>`).join("")}</tr>${rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join("")}</tr>`).join("")||`<tr><td colspan="${h.length}" class="muted">No records yet.</td></tr>`}</table></div>`;
const logo=()=>brand.logo?`<img src="${esc(brand.logo)}" alt="">`:`<span class="logo">${esc((brand.short||"L").slice(0,2))}</span>`;
const onSubmit=(sel,fn)=>document.querySelectorAll(sel).forEach(f=>f.addEventListener("submit",async e=>{e.preventDefault();const b=e.submitter;if(b)b.disabled=true;try{await fn(new FormData(f),f)}catch(x){toast(errMsg(x),1)}finally{if(b)b.disabled=false}}));
const errMsg=e=>({"auth/invalid-credential":"Wrong email or password.","auth/email-already-in-use":"This email is already registered.","auth/weak-password":"Password must be at least 6 characters.","auth/invalid-email":"Enter a valid email address.","permission-denied":"You do not have permission for this action."}[e.code]||e.message);
const embed=u=>{const m=u.match(/(?:v=|youtu\.be\/)([\w-]{11})/);return m?`<iframe src="https://www.youtube.com/embed/${m[1]}" allowfullscreen></iframe>`:`<video controls src="${esc(u)}"></video>`};
const upload=async(path,file)=>{const r=ref(st,path);await uploadBytes(r,file);return getDownloadURL(r)};

const A=admission({db,st,esc,toast,onSubmit,list,table,fmt,errMsg,route:()=>route(),main:()=>main,getMe:()=>me});

// ---------- App shell ----------
const paint=()=>document.querySelectorAll("[data-brand]").forEach(e=>e.textContent=brand[e.dataset.brand]||"");
let shelled=false;
function shell(p){const a=p==="course"?"courses":p;
 if(!shelled){shelled=true;main=$("#main");$("#uName").textContent=me.name;$("#uRole").textContent=me.role;$("#menu").onclick=()=>$("#side").classList.toggle("open");$("#out").onclick=()=>signOut(auth);$("#side nav").onclick=()=>$("#side").classList.remove("open")}
 document.querySelectorAll("#side nav a").forEach(l=>{l.hidden=!l.dataset.roles.split(" ").includes(me.role);l.classList.toggle("on",l.getAttribute("href")==="#/"+a)});
 main.innerHTML='<div class="spin">Loading…</div>';paint()}

// ---------- Pages ----------
async function dashboard(){let c=[];
 if(me.role==="admin"){const[u,k,e]=await Promise.all([list("users"),list("courses"),list("enrollments")]);c=[["Users",u.length],["Courses",k.length],["Enrollments",e.length]]}
 else if(me.role==="officer"){c=[["Applications",(await list("applications")).length]]}
 else if(me.role==="lecturer"){c=[["My courses",(await list("courses",where("lecturerId","==",me.uid))).length]]}
 else{const[e,r,s]=await Promise.all([list("enrollments",where("uid","==",me.uid)),list("results",where("uid","==",me.uid)),list("submissions",where("uid","==",me.uid))]);c=[["Enrolled courses",e.length],["Quizzes taken",r.length],["Assignments submitted",s.length]]}
 main.innerHTML=`<h2>Welcome, ${esc(me.name)}</h2><p class="muted">${esc(brand.name)} · ${esc(brand.program)}</p><div class="grid">${c.map(([l,v])=>`<div class="card stat"><b>${v}</b>${l}</div>`).join("")}</div>`}

const ccard=(c,en)=>`<div class="card ccard" data-t="${esc((c.code+" "+c.title).toLowerCase())}"><span class="tag">${esc(c.code)}</span><h3>${esc(c.title)}</h3><p class="muted">${esc(c.description||"")}<br>Lecturer: ${esc(c.lecturerName||"-")} ${c.semester?"· "+esc(c.semester):""}</p>${me.role==="student"&&!en?`<button class="btn" data-enroll="${c.id}">Enroll</button>`:`<a class="btn" href="#/course/${c.id}">Open</a>`}</div>`;
async function courses(){
 if(me.role==="admin"){const[cs,us]=await Promise.all([list("courses"),list("users",where("role","==","lecturer"))]);
  main.innerHTML=`<h2>Courses</h2><form id="cf" class="card form"><input name="code" placeholder="Course code e.g. CSC101" required><input name="title" placeholder="Course title" required><select name="lecturerId" required><option value="">Assign lecturer</option>${us.map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join("")}</select><input name="semester" placeholder="Semester / level"><textarea name="description" placeholder="Description"></textarea><button class="btn">Create course</button></form>${table(["Code","Title","Lecturer",""],cs.map(c=>[esc(c.code),`<a href="#/course/${c.id}">${esc(c.title)}</a>`,esc(c.lecturerName||""),`<button class="btn danger" data-del="${c.id}">Delete</button>`]))}`;
  onSubmit("#cf",async f=>{const l=us.find(u=>u.id===f.get("lecturerId"));await setDoc(doc(collection(db,"courses")),{code:f.get("code").toUpperCase(),title:f.get("title"),lecturerId:l.id,lecturerName:l.name,semester:f.get("semester"),description:f.get("description"),createdAt:serverTimestamp()});toast("Course created");route()});
  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{if(confirm("Delete this course?")){await deleteDoc(doc(db,"courses",b.dataset.del));route()}});return}
 const cs=me.role==="lecturer"?await list("courses",where("lecturerId","==",me.uid)):await list("courses");
 const en=me.role==="student"?new Set((await list("enrollments",where("uid","==",me.uid))).map(e=>e.courseId)):new Set();
 main.innerHTML=`<h2>${me.role==="lecturer"?"My Courses":"Courses"}</h2><input id="q" placeholder="Search by code or title…"><div class="grid">${cs.map(c=>ccard(c,en.has(c.id))).join("")||'<p class="muted">No courses available.</p>'}</div>`;
 $("#q").oninput=e=>document.querySelectorAll(".ccard").forEach(x=>x.hidden=!x.dataset.t.includes(e.target.value.toLowerCase()));
 document.querySelectorAll("[data-enroll]").forEach(b=>b.onclick=async()=>{try{await setDoc(doc(db,"enrollments",b.dataset.enroll+"_"+me.uid),{courseId:b.dataset.enroll,uid:me.uid,studentName:me.name,createdAt:serverTimestamp()});toast("Enrolled");route()}catch(x){toast(errMsg(x),1)}})}

async function course(id){
 const cd=await getDoc(doc(db,"courses",id));if(!cd.exists())return main.innerHTML="<p>Course not found.</p>";
 const c={id,...cd.data()},staff=me.role==="admin"||(me.role==="lecturer"&&c.lecturerId===me.uid);
 if(!staff&&!(await getDoc(doc(db,"enrollments",id+"_"+me.uid))).exists())return main.innerHTML=`<h2>${esc(c.title)}</h2><p>You are not enrolled in this course. <a href="#/courses">Go to courses</a></p>`;
 const W=where("courseId","==",id),mine=where("uid","==",me.uid);
 const[mats,asg,qz]=await Promise.all([list("materials",W),list("assignments",W),list("quizzes",W)]);
 const subs=staff?await list("submissions",W):await list("submissions",W,mine),res=staff?await list("results",W):await list("results",W,mine);
 const sub=a=>subs.find(s=>s.assignmentId===a.id&&s.uid===me.uid),took=q=>res.find(r=>r.quizId===q.id&&r.uid===me.uid);
 const forms=!staff?"":`<h3>Add content</h3><div class="grid">
 <form id="mf" class="card form"><b>Material / video</b><input name="title" placeholder="Title" required><select name="type"><option value="file">File (PDF, slides…)</option><option value="video">Video link (YouTube/MP4 URL)</option></select><input name="url" placeholder="Video URL (for video)"><input name="file" type="file"><button class="btn">Add</button></form>
 <form id="af" class="card form"><b>Assignment</b><input name="title" placeholder="Title" required><textarea name="desc" placeholder="Instructions" required></textarea><input name="due" type="date"><input name="max" type="number" placeholder="Max score" value="100" required><button class="btn">Publish</button></form>
 <form id="qf" class="card form"><b>Quiz</b><input name="title" placeholder="Quiz title" required><textarea name="qs" placeholder="One per line:&#10;Question | Option A | Option B | Option C | Option D | 2   (last number = correct option)" required></textarea><button class="btn">Create quiz</button></form></div>`;
 main.innerHTML=`<h2>${esc(c.code)} — ${esc(c.title)}</h2><p class="muted">${esc(c.description||"")}</p>
 <h3>Materials & Video Lessons</h3>${table(["Title","Type",""],mats.map(m=>[esc(m.title),m.type,m.type==="video"?`<details><summary>Watch</summary>${embed(m.url)}</details>`:`<a href="${esc(m.url)}" target="_blank" rel="noopener">Download</a>`]))}
 <h3>Assignments</h3>${asg.map(a=>{const s=sub(a);return`<div class="card" style="margin-bottom:10px"><b>${esc(a.title)}</b> <span class="tag">/${a.max}</span> <small class="muted">${a.due?"Due "+esc(a.due):""}</small><p>${esc(a.desc)}</p>${staff?"":s?`<p>Submitted ✔ ${s.score!=null?`<b>Score: ${s.score}/${a.max}</b> — ${esc(s.feedback||"")}`:"(awaiting grading)"}</p>`:`<form class="sf form" data-a="${a.id}"><textarea name="text" placeholder="Your answer"></textarea><input name="file" type="file"><button class="btn">Submit</button></form>`}</div>`}).join("")||'<p class="muted">None yet.</p>'}
 ${staff?`<h3>Submissions to grade</h3>${table(["Student","Assignment","Answer","Grade"],subs.map(s=>{const a=asg.find(x=>x.id===s.assignmentId)||{};return[esc(s.studentName),esc(a.title),`${esc(s.text||"")} ${s.fileUrl?`<a href="${esc(s.fileUrl)}" target="_blank" rel="noopener">File</a>`:""}`,`<form class="gf" data-id="${s.id}"><input name="score" type="number" min="0" max="${a.max||100}" value="${s.score??""}" required style="width:80px"><input name="feedback" placeholder="Feedback" value="${esc(s.feedback||"")}"><button class="btn">Save</button></form>`]}))}`:""}
 <h3>Quizzes</h3>${qz.map(q=>{const r=took(q);return`<div class="card" style="margin-bottom:10px"><b>${esc(q.title)}</b> <span class="tag">${q.questions.length} questions</span>${staff?"":r?`<p>Score: <b>${r.score}/${r.total}</b></p>`:`<form class="qf form" data-q="${q.id}">${q.questions.map((x,i)=>`<fieldset><legend>${i+1}. ${esc(x.q)}</legend>${x.options.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}" required style="width:auto"> ${esc(o)}</label><br>`).join("")}</fieldset>`).join("")}<button class="btn">Submit quiz</button></form>`}</div>`}).join("")||'<p class="muted">None yet.</p>'}
 ${staff?`<h3>Quiz results</h3>${table(["Student","Quiz","Score"],res.map(r=>[esc(r.studentName),esc((qz.find(q=>q.id===r.quizId)||{}).title),`${r.score}/${r.total}`]))}`:""}${forms}`;
 const done=m=>{toast(m);route()};
 onSubmit("#mf",async(f,el)=>{const ts=serverTimestamp(),type=f.get("type");let url=f.get("url"),path="";const file=f.get("file");
  if(type==="file"){if(!file?.size)throw new Error("Choose a file");path=`materials/${id}/${Date.now()}_${file.name}`;url=await upload(path,file)}else if(!url)throw new Error("Enter a video URL");
  await addDoc(collection(db,"materials"),{courseId:id,title:f.get("title"),type,url,path,createdAt:ts});done("Added")});
 onSubmit("#af",async f=>{await addDoc(collection(db,"assignments"),{courseId:id,title:f.get("title"),desc:f.get("desc"),due:f.get("due"),max:+f.get("max"),createdAt:serverTimestamp()});done("Assignment published")});
 onSubmit("#qf",async f=>{const questions=f.get("qs").split("\n").map(l=>l.trim()).filter(Boolean).map(l=>{const p=l.split("|").map(s=>s.trim()),a=+p.at(-1),o=p.slice(1,-1);if(o.length<2||!(a>=1&&a<=o.length))throw new Error("Bad line: "+l);return{q:p[0],options:o,answer:a-1}});
  await addDoc(collection(db,"quizzes"),{courseId:id,title:f.get("title"),questions,createdAt:serverTimestamp()});done("Quiz created")});
 onSubmit(".sf",async(f,el)=>{const file=f.get("file"),aid=el.dataset.a;if(!f.get("text")&&!file?.size)throw new Error("Write an answer or attach a file");let fileUrl="",filePath="";
  if(file?.size){filePath=`submissions/${me.uid}/${aid}_${file.name}`;fileUrl=await upload(filePath,file)}
  await setDoc(doc(db,"submissions",aid+"_"+me.uid),{assignmentId:aid,courseId:id,uid:me.uid,studentName:me.name,text:f.get("text"),fileUrl,filePath,createdAt:serverTimestamp()});done("Submitted")});
 onSubmit(".gf",async(f,el)=>{await updateDoc(doc(db,"submissions",el.dataset.id),{score:+f.get("score"),feedback:f.get("feedback"),gradedBy:me.uid,gradedAt:serverTimestamp()});done("Grade saved")});
 onSubmit(".qf",async(f,el)=>{const q=qz.find(x=>x.id===el.dataset.q);const score=q.questions.filter((x,i)=>+f.get("q"+i)===x.answer).length;
  await setDoc(doc(db,"results",q.id+"_"+me.uid),{quizId:q.id,courseId:id,uid:me.uid,studentName:me.name,score,total:q.questions.length,createdAt:serverTimestamp()});done(`Score: ${score}/${q.questions.length}`)})}

async function users(){const us=await list("users");
 main.innerHTML=`<h2>Users</h2><input id="q" placeholder="Search name or email…">${table(["Name","Email","Matric","Role"],us.map(u=>[esc(u.name),esc(u.email),esc(u.matric||""),`<select data-uid="${u.id}" ${u.id===me.uid?"disabled":""}>${["student","lecturer","officer","admin"].map(r=>`<option ${u.role===r?"selected":""}>${r}</option>`).join("")}</select>`]))}`;
 $("#q").oninput=e=>document.querySelectorAll("table tr:not(:first-child)").forEach(r=>r.hidden=!r.textContent.toLowerCase().includes(e.target.value.toLowerCase()));
 document.querySelectorAll("[data-uid]").forEach(s=>s.onchange=async()=>{try{await updateDoc(doc(db,"users",s.dataset.uid),{role:s.value});toast("Role updated")}catch(x){toast(errMsg(x),1)}})}
async function enrollments(){const e=await list("enrollments"),cs=await list("courses");
 main.innerHTML=`<h2>Enrollments</h2>${table(["Student","Course","Date",""],e.map(x=>{const c=cs.find(k=>k.id===x.courseId)||{};return[esc(x.studentName),esc(c.code||x.courseId),fmt(x.createdAt),`<button class="btn danger" data-d="${x.id}">Remove</button>`]}))}`;
 document.querySelectorAll("[data-d]").forEach(b=>b.onclick=async()=>{await deleteDoc(doc(db,"enrollments",b.dataset.d));route()})}
async function announcements(){const a=(await list("announcements")).sort((x,y)=>(y.createdAt?.seconds||0)-(x.createdAt?.seconds||0));
 main.innerHTML=`<h2>Announcements</h2>${me.role==="student"?"":`<form id="nf" class="card form"><input name="title" placeholder="Title" required><textarea name="body" placeholder="Message" required></textarea><button class="btn">Post</button></form>`}${a.map(x=>`<div class="card" style="margin-bottom:10px"><b>${esc(x.title)}</b> <small class="muted">${esc(x.authorName)} · ${fmt(x.createdAt)}</small><p>${esc(x.body)}</p></div>`).join("")||'<p class="muted">No announcements.</p>'}`;
 onSubmit("#nf",async f=>{await addDoc(collection(db,"announcements"),{title:f.get("title"),body:f.get("body"),authorName:me.name,createdAt:serverTimestamp()});route()})}
async function results(){const[r,s,cs]=await Promise.all([list("results",where("uid","==",me.uid)),list("submissions",where("uid","==",me.uid)),list("courses")]);const cn=id=>(cs.find(c=>c.id===id)||{}).code||id;
 main.innerHTML=`<h2>My Results</h2><h3>Quizzes</h3>${table(["Course","Score","Date"],r.map(x=>[esc(cn(x.courseId)),`${x.score}/${x.total}`,fmt(x.createdAt)]))}<h3>Assignments</h3>${table(["Course","Score","Feedback"],s.map(x=>[esc(cn(x.courseId)),x.score!=null?x.score:"Awaiting grade",esc(x.feedback||"")]))}`}
async function settings(){main.innerHTML=`<h2>System Settings</h2><form id="sf" class="card form"><label>Institution name</label><input name="name" value="${esc(brand.name)}" required><label>Short name</label><input name="short" value="${esc(brand.short)}"><label>Programme</label><input name="program" value="${esc(brand.program)}"><label>Academic session</label><input name="session" value="${esc(brand.session)}"><label>Logo URL</label><input name="logo" value="${esc(brand.logo)}"><button class="btn">Save</button></form>`;
 onSubmit("#sf",async f=>{brand={...brand,...Object.fromEntries(f)};await setDoc(doc(db,"settings","site"),Object.fromEntries(f),{merge:true});toast("Saved");route()})}
async function profile(){main.innerHTML=`<h2>My Profile</h2><form id="pf" class="card form"><label>Full name</label><input name="name" value="${esc(me.name)}" required><label>Phone</label><input name="phone" value="${esc(me.phone||"")}"><label>Email</label><input value="${esc(me.email)}" disabled><label>Matric no.</label><input value="${esc(me.matric||"")}" disabled><button class="btn">Update</button></form>`;
 onSubmit("#pf",async f=>{await updateDoc(doc(db,"users",me.uid),{name:f.get("name"),phone:f.get("phone")});Object.assign(me,{name:f.get("name"),phone:f.get("phone")});toast("Profile updated")})}

// ---------- Router ----------
const PAGES={dashboard,courses,users,enrollments,announcements,results,settings,profile,admissions:()=>A.admissions()};
async function route(){const[,p="",a]=location.hash.slice(1).split("/");
 if(!me){location.href="login.html";return}
 const allowed=[...document.querySelectorAll("#side nav a")].filter(l=>l.dataset.roles.split(" ").includes(me.role)).map(l=>l.getAttribute("href").slice(2));const page=p==="course"?"course":allowed.includes(p)?p:"dashboard";
 shell(page);try{page==="course"?await course(a):await PAGES[page]()}catch(e){main.innerHTML=`<div class="card"><b>Error</b><p>${esc(errMsg(e))}</p></div>`}}
window.addEventListener("hashchange",route);
const fail = (msg, u) => {
  document.getElementById("app").innerHTML =
    '<div style="padding:30px;font-family:sans-serif;max-width:680px;margin:auto">' +
    "<h3>Cannot open your account</h3>" +
    "<p>" + msg + "</p>" +
    "<p><b>Your UID:</b> <code>" + u.uid + "</code></p>" +
    '<button class="btn" id="lo">Logout</button></div>';
  document.getElementById("lo").onclick = () => signOut(auth);
};

onAuthStateChanged(auth, async (u) => {
  await pending;

  if (!u || u.isAnonymous) {
    location.href = "login.html";
    return;
  }

  let s;
  try {
    s = await getDoc(doc(db, "users", u.uid));
  } catch (e) {
    return fail("Cannot read your profile (" + e.code + "). Make sure Firestore is created and firestore.rules is published.", u);
  }

  if (!s.exists()) {
    return fail("No profile found. Create collection <b>users</b> with document ID exactly equal to your UID below.", u);
  }

  const role = s.data().role;
  if (!["admin", "officer", "lecturer", "student"].includes(role)) {
    return fail("Field <b>role</b> must be exactly one of: admin, officer, lecturer, student (found: " + esc(String(role)) + ").", u);
  }

  me = { uid: u.uid, ...s.data() };

  if (!location.hash || ["#/login", "#/register", "#/"].includes(location.hash)) {
    location.hash = "#/dashboard";
  }
  route();
});
 