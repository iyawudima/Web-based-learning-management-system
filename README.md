# ODFeL LMS (HTML/CSS/JS + Firebase)

## Structure
```
odfel-lms/
├─ firebase.json  firestore.rules  storage.rules
└─ public/
   ├─ index.html      Home page            (edit text/layout directly)
   ├─ login.html      Login
   ├─ register.html   Student registration (needs Matric Number)
   ├─ apply.html      Admission application (all 6 sections are plain HTML)
   ├─ status.html     Check application status
   ├─ app.html        Dashboard shell + sidebar menu (after login)
   ├─ css/style.css   All styling
   └─ js/  config.js (Firebase + institution + programmes)  core.js  login.js  register.js
           apply.js  status.js  app.js (dashboards)  admission.js (officer dashboard)  guard.js
```
Edit wording, labels and form fields in the .html files; JS only handles logic.
Open `public/index.html` with VS Code Live Server (never by double-click).

## Setup
1. Firebase Console → create project → add a **Web app** → copy config into `public/js/config.js`.
2. Build → **Authentication** → enable **Email/Password**.
3. Build → **Firestore Database** → create (production mode). Build → **Storage** → get started.
4. Install CLI: `npm i -g firebase-tools` → `firebase login` → `firebase init` (choose existing project; keep `public` as hosting dir, do NOT overwrite files) → `firebase deploy --only firestore:rules,storage,hosting`.
5. **First admin**: register normally on the site, then in Console → Firestore → `users/<your uid>` → change `role` to `admin`. Admin then promotes lecturers from Users page.
6. Authentication → Settings → Authorized domains: add your hosting/Vercel domain.

## Collections
users, courses, enrollments (`courseId_uid`), materials, assignments, quizzes (questions[]), submissions (`assignmentId_uid`), results (`quizId_uid`), announcements, settings/site.

## Deploy
Firebase Hosting: `firebase deploy`. Vercel: import repo, set output directory to `public`, no build command.

## Security notes (read this)
- Roles live in Firestore `users/{uid}.role`; rules block self-promotion, and students cannot edit grades or other students' records.
- **Quiz auto-grading is computed in the browser** and answers are stored in the quiz document, so a technical student could read answers or forge a score. For high-stakes exams move grading to a Cloud Function (needs Blaze plan) and keep answers in a staff-only document.
- Staff reading submissions/results is allowed for any lecturer; only the course's lecturer or admin may grade (enforced on update).
- Test rules in Firebase Rules Playground before going live.
- Deleting a course does not delete its content (orphans remain).

## Admission workflow (added)
1. Authentication > Sign-in method > enable **Anonymous** (used only so applicants can upload documents).
2. Publish the updated `firestore.rules` and `storage.rules`.
3. Edit `ADMISSION` in `public/js/config.js` (matric prefix, sessions, faculties/programmes).
4. Staff accounts (admin, officer, lecturer) can no longer self-register. Create each in Firebase Console > Authentication > Add user, then in Firestore add `users/<that uid>` with fields `name`, `email`, `role` (`admin` / `officer` / `lecturer`). The FIRST admin must be created this way. Later, admins can change roles on the Users page.
5. Flow: Apply (#/apply) -> reference + PIN -> officer reviews (#/admissions) -> Approve generates Matric -> applicant checks status, then Student Registration (#/register) with Matric + reference.
