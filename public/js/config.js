// 1) Paste YOUR Firebase web config (Project settings > General > Your apps > Web).
//    This config is NOT secret; security comes from Firestore/Storage rules.
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
  export const firebaseConfig = {
    apiKey: "AIzaSyDqNOtuMVSHxJcqV1qnbkHs9zUwQoyVAG8",
  authDomain: "web-based-learning-management.firebaseapp.com",
  projectId: "web-based-learning-management",
  storageBucket: "web-based-learning-management.firebasestorage.app",
  messagingSenderId: "533618004523",
  appId: "1:533618004523:web:d20b6fd7e0f60eb374d06e",
  measurementId: "G-1KSV8QHF77"
};
// 2) Default branding. Admin > Settings overrides these at runtime (stored in Firestore).
export const BRAND = {
  name: "Your Institution Name",
  short: "YIN",
  program: "ODFeL",
  session: "2025/2026",
  logo: "" // optional image URL or path, e.g. "img/logo.png"
};

// ---- Admission settings (edit to match your institution). Programmes below are SAMPLE DATA. ----
export const ADMISSION = {
  matricPrefix: "ODF",                       // Matric format: ODF-2026-0001
  sessions: ["2025/2026", "2026/2027"],
  modes: ["Distance learning", "Flexible / blended", "Part-time"],
  examTypes: ["WAEC", "NECO", "NABTEB"],
  // levels containing PGD/Masters require a degree certificate instead of O'Level
    uploadFiles: false,   // canza zuwa true bayan ka kunna Firebase Storage// 
    programmes: [
    {faculty: "Science", dept: "Computer Science", name: "B.Sc. Computer Science", levels: ["Degree (100L)", "Direct Entry"], extraDocs: []},
    {faculty: "Science", dept: "Computer Science", name: "PGD Computer Science", levels: ["PGD"], extraDocs: []},
    {faculty: "Education", dept: "Educational Technology", name: "B.Ed. Educational Technology", levels: ["Degree (100L)", "Direct Entry"], extraDocs: ["NCE / teaching certificate (Direct Entry)"]},
    {faculty: "Management", dept: "Business Administration", name: "MBA", levels: ["Masters"], extraDocs: ["Statement of purpose"]}
  ]
};
