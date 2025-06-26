# MiniExamLMS

## Description
MiniExamLMS is a modern, full-featured Learning Management System (LMS) for conducting secure online exams. It supports both Admin (Lecturer/Teacher/Super Admin) and Student roles, providing robust exam management, grading, and anti-cheating features. The platform is built for flexibility, security, and ease of use, leveraging Firebase for authentication and data storage, and React for a responsive UI.

## Technologies Used
- **Frontend:** React.js
- **Styling:** Tailwind CSS
- **Backend & Auth:** Firebase (Authentication, Firestore)
- **Routing:** React Router
- **Deployment:** Netlify

## Features
- **Role-based Authentication:** Separate flows for Admins, Super Admins, and Students using Firebase Auth.
- **Admin & Super Admin Dashboard:**
  - Create, edit, and delete exams with open/close times and access tokens.
  - Add, edit, and delete questions (Multiple Choice, Essay, True/False, Matching, Short Answer).
  - Set correct answers for objective questions; manual grading for essays/short answers.
  - View all student submissions, grade essays/short answers, and leave feedback notes.
  - View users by role, approve/reject teachers, and manage accounts (Super Admin).
- **Student Dashboard:**
  - Redeem exam access tokens to unlock and take exams.
  - View available and unlocked exams.
  - Timer and anti-cheating (tab switch detection) during exams.
  - Submit answers and view detailed results (correct/incorrect answers, teacher notes).
  - View submission history and results.
- **Automatic and Manual Grading:**
  - Auto-grading for objective questions (10 points each, 0 for incorrect).
  - Manual grading for essays and short answers (0 or 10 points, with notes).
  - Final score is a percentage out of 100.
- **Submission Tracking:**
  - Students can view their submission history and results.
- **Responsive UI:**
  - Built with Tailwind CSS for a clean, modern look.

## Setup Instructions
1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd miniexamlms
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Set up Firebase:**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
   - Enable Email/Password authentication.
   - Create a Firestore database (in test mode for development).
   - Copy your Firebase config values.
4. **Configure environment variables:**
   - Create a `.env` file in the project root:
     ```env
     REACT_APP_FIREBASE_API_KEY=your_api_key_here
     REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
     REACT_APP_FIREBASE_PROJECT_ID=your_project_id_here
     REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
     REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
     REACT_APP_FIREBASE_APP_ID=your_app_id_here
     REACT_APP_ADMIN_EMAIL=admin@exam.com # (or your chosen admin email)
     ```
5. **Start the development server:**
   ```sh
   npm start
   ```
6. **Access the app:**
   - Open [http://localhost:3000](http://localhost:3000) in your browser.

## AI Support Explanation
AI (such as IBM Granite or similar large language models) was used exclusively during the development phase of this project to assist with code generation, feature planning, and documentation. **No AI or LLM is included in the final deployed product.** All exam logic, grading, and user data are handled securely and transparently within the application and Firebase backend.

## Project Structure
```
miniexamlms/
├── public/
├── src/
│   ├── assets/
│   ├── components/         # Reusable UI components
│   ├── context/            # React Context for Auth
│   ├── hooks/              # Custom hooks
│   ├── pages/              # Page components (Login, Dashboard, Exam, etc.)
│   ├── services/           # Firebase and Firestore logic
│   ├── App.js
│   ├── index.js
│   └── index.css
├── .env                    # Firebase config (not committed)
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```
**Enjoy your secure, modern, and easy-to-use MiniExamLMS!**
