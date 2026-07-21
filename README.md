<p align="center">
  <img src="./Frontend/src/images/MainLogo.png" alt="JobGenie Banner" width="100%" />
</p>

<h1 align="center">✦ JobGenie — AI-Powered Interview Prep & Resume Builder</h1>

<p align="center">
  <em>Upload your resume. Paste a job description. Let the AI genie craft your winning career strategy.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/SCSS-Modules-CC6699?style=for-the-badge&logo=sass&logoColor=white" />
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 🚀 What is JobGenie?

**JobGenie** is a full-stack, state-of-the-art AI platform designed to help job seekers **accelerate their job search**, **ace technical and behavioral interviews**, and **generate custom-tailored, ATS-optimized resumes**. 

Simply upload your existing resume (PDF/DOCX) or input a personal description, paste the target job description, select your desired difficulty level, and JobGenie's intelligent AI core will generate a complete, structured readiness package:

- 🎯 **Match Score (0-100%)** — Quantitative assessment of how well your background aligns with the job profile.
- 💡 **Technical Interview Questions** — Custom scenario-based questions complete with expert intentions and perfect answers.
- 🗣️ **Behavioral Questions** — Custom questions targeted to the role, styled with detailed responses following the structured STAR method (Situation, Task, Action, Result).
- 📉 **Skill Gap Analysis** — Identification of missing technologies or soft skills with graded severity parameters (`low`, `medium`, `high`).
- 🗺️ **Preparation Roadmap** — A structured, day-by-day action plan offering specific study targets, tasks, and learning resources.
- 📄 **ATS-Optimized Resumes & Cover Letters** — Clean, semantic, editorial-grade A4 PDF documents generated dynamically based on your tailored profile.

---

## ✨ Features

### 🧠 Multi-Model AI Engine & Fallback Chain
To ensure maximum availability, reliability, and speed, JobGenie implements a resilient multi-provider AI fallback chain:
1. **Google Gemini 2.5 Flash** (Primary) → Lightning-fast inference delivering high-fidelity structured outputs via native JSON schemas.
2. **Groq Llama 3.3 70B** (Secondary Fallback) → Ultra-low latency fallback using top-performing open-weights models.
3. **OpenRouter (Gemini 2.0 Flash)** (Tertiary Safety Net) → High-availability public endpoint route.

*If any provider encounters rate-limiting or service downtime, the engine switches providers transparently in the background, ensuring 100% service uptime.*

### 📄 Dynamic PDF Generation (Puppeteer Core)
- **Refined Editorial Layout**: Styles inspired by premium design papers (using *Playfair Display* and *Source Serif* typography).
- **ATS-Optimized Output**: Outputs cleanly structured, table-free HTML elements that easily parse on all standard applicant tracking systems.
- **Dynamic Content Injection**: The backend expands on your resume sections dynamically to fill a perfect single page (or full pages) without visual gaps.
- **Tailored Resumes**: Auto-highlights relevant experiences, re-orders skills list to prioritize match parameters, and removes generic "AI giveaway" buzzwords.
- **Cover Letters**: Instantly formats a customized, professionally styled cover letter for the targeted position.

### 👥 Sharing and Collaborating
- **Public Share Links**: Generate unique, secure share links (`shareToken`) to let mentors, friends, or recruiters view your generated interview report.
- **Interactive Dashboard**: Keep track of previous runs, rename reports, or delete stale runs.

### 📝 Mock Interview Simulator (Interactive Scaffold)
- Test your readiness interactively. Users can load questions in a mock room and submit custom-typed answers to receive AI scoring, feedback, and suggestions.

---

## 🛠️ Tech Stack

### Frontend
- **React 19** — Lightweight component patterns utilizing concurrent rendering.
- **Vite 8** — Next-gen frontend toolchain offering instantaneous hot module replacement (HMR).
- **React Router 7** — Client-side SPA routing with integrated protected/guest layout route guards.
- **SCSS Modules** — Scoped, component-level CSS variables, zero style conflicts, and absolute design flexibility.
- **Firebase Auth** — Google OAuth verification using Client SDK.
- **Context API** — Global state management for authentication state and history listings.

### Backend
- **Express 5** — Minimalist node web framework incorporating unified asynchronous error handling.
- **Mongoose 9** — MongoDB object modeling schema definitions with custom verification rules.
- **Puppeteer** — Headless Chrome engine to render HTML templates into pixel-perfect PDF assets.
- **Firebase Admin SDK** — Verification of client authentication tokens.
- **JWT & bcryptjs** — Local secure cookie authentication and hashing mechanisms.
- **Multer** — Middleware managing multipart form uploads for parser analysis.
- **pdf-parse & mammoth** — Text extraction libraries for indexing and processing PDF/DOCX resumes.
- **node-cache** — Fast, in-memory key-value cache system reducing redundant provider calls.
- **express-rate-limit** — Client protection limiting brute force and API spam.
- **Winston & Helmet** — Structured logging and HTTP security headers.
- **Swagger UI** — Integrated interactive API explorer.

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────────┐
│                      CLIENT (React)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐    │
│  │   Home   │  │ Analyze  │  │Interview │  │ Recent  │    │
│  │  (Hero)  │  │  (Form)  │  │ (Report) │  │(History)│    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘    │
│       │              │             │              │       │
│  ┌────▼──────────────▼─────────────▼──────────────▼────┐  │
│  │          Auth Context + Interview Context           │  │
│  │          (JWT Cookies · Protected Routes)           │  │
│  └──────────────────────┬──────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────-─┘
                           │ Axios (HTTP-only cookies)
┌─────────────────────────▼─────────────────────────────────┐
│                    SERVER (Express 5)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │  Auth Routes │  │Interview API │  │  Resume PDF    │   │
│  │  /api/auth/* │  │/api/interview│  │/api/interview/ │   │
│  │              │  │              │  │  resume/pdf/*  │   │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘   │
│         │                 │                   │           │
│  ┌──────▼─────────────────▼───────────────────▼────────┐  │
│  │            AI Service (Multi-Provider Chain)        │  │
│  │     Gemini 2.5 Flash → Groq Llama 3.3 → OpenRouter  │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                 │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │              MongoDB (Mongoose ODM)                 │  │
│  │  Users · InterviewReports · TokenBlacklist          │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18.x
- **MongoDB** (Local instance or MongoDB Atlas Cloud URI)
- **Google Gemini API Key** ([Get one for free](https://aistudio.google.com/app/apikey))
- **Firebase Project Credentials** (Service Account JSON configuration)

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/JobGenie.git
cd JobGenie
```

### 2️⃣ Backend Setup
1. Navigate to the backend directory and install dependencies:
   ```bash
   cd Backend
   npm install
   ```
2. Create a `.env` configuration file in the `Backend/` directory:
   ```env
   # Server Details
   PORT=3000
   NODE_ENV=development

   # Database connection
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/jobgenie

   # Authentication
   JWT_SECRET=your_jwt_secret_key_here

   # API Keys (Provide primary key; fallbacks are optional)
   GOOGLE_GENAI_API_KEY=your_google_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   OPENROUTER_API_KEY=your_openrouter_api_key

   # Allowed Client URLs (comma-separated if multiple)
   CLIENT_URL=http://localhost:5173

   # Firebase Service Account base64 encoding (for Google OAuth verification)
   FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_encoded_service_account_json
   ```
   > **Tip**: You can base64-encode your `serviceAccountKey.json` on Windows PowerShell using:
   > `[Convert]::ToBase64String([IO.File]::ReadAllBytes("path/to/serviceAccountKey.json"))`

3. Launch backend service in development mode:
   ```bash
   npm run dev
   ```

### 3️⃣ Frontend Setup
1. Navigate to the frontend directory and install dependencies:
   ```bash
   cd ../Frontend
   npm install
   ```
2. Create a `.env` file in the `Frontend/` directory:
   ```env
   VITE_API_URL=http://localhost:3000
   ```
3. Set up Google Auth in `Frontend/src/config/firebase.js` using your Firebase App configuration details:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 📡 API Reference

Interactive API documentation is hosted directly at: **`http://localhost:3000/api-docs`**

### Authentication (`/api/auth/*`)
All cookie sessions use secure HTTP-only cookies.

| Method | Endpoint | Description | Authentication |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create a new local user account | Public |
| `POST` | `/api/auth/login` | Log in with email and password | Public |
| `POST` | `/api/auth/google` | Sign in or sign up via Firebase Google OAuth | Public |
| `GET` | `/api/auth/logout` | Log out and blacklist the session token | Public |
| `GET` | `/api/auth/get-me` | Get current user's profile information | 🔒 Private |
| `POST` | `/api/auth/verify-email/request` | Request validation email (*scaffolded*) | 🔒 Private |
| `GET` | `/api/auth/verify-email/:token` | Complete email validation flow (*scaffolded*) | Public |
| `POST` | `/api/auth/forgot-password` | Send password reset email (*scaffolded*) | Public |
| `POST` | `/api/auth/reset-password` | Complete password reset using token (*scaffolded*) | Public |

### Interview Reports & PDFs (`/api/interview/*`)

| Method | Endpoint | Description | Authentication |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/interview` | Upload resume + JD to generate report | 🔒 Private |
| `GET` | `/api/interview` | Get list of user reports (supports `page` & `limit`) | 🔒 Private |
| `GET` | `/api/interview/report/:interviewId` | Retrieve detailed report by database ID | 🔒 Private |
| `DELETE` | `/api/interview/:interviewId` | Delete a saved report from history | 🔒 Private |
| `PATCH` | `/api/interview/:interviewId` | Edit a report's title (`body: { title }`) | 🔒 Private |
| `POST` | `/api/interview/resume/pdf/:id` | Generate and export tailored resume PDF | 🔒 Private |
| `POST` | `/api/interview/report/pdf/:id` | Generate and export complete Q&A PDF report | 🔒 Private |
| `POST` | `/api/interview/cover-letter/pdf/:id`| Generate and export tailored cover letter PDF | 🔒 Private |
| `GET` | `/api/interview/shared/:shareToken` | Publicly view a shared report | Public |

### Interactive Mock Interviews (`/api/mock-interview/*`)

| Method | Endpoint | Description | Authentication |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/mock-interview/` | Initialize interactive mock interview session | 🔒 Private |
| `POST` | `/api/mock-interview/:sessionId/submit` | Submit an answer to a question for feedback and scoring | 🔒 Private |
| `GET` | `/api/mock-interview/:sessionId` | Retrieve active or completed session summary | 🔒 Private |
| `GET` | `/api/mock-interview/` | Get list of user's past mock interview sessions | 🔒 Private |

### ATS Score Checker (`/api/ats-check/*`)

| Method | Endpoint | Description | Authentication |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ats-check/` | Upload resume + JD to check ATS score | 🔒 Private |
| `GET` | `/api/ats-check/` | Get user's past ATS check logs | 🔒 Private |

### System Utility
| Method | Endpoint | Description | Authentication |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Check uptime, API, and DB connection status | Public |

---

## 📁 Project Structure

```
JobGenie/
├── Backend/
│   ├── server.js                    # Core startup entry point
│   └── src/
│       ├── app.js                   # Application middlewares & security headers
│       ├── config/
│       │   ├── database.js          # MongoDB connection handler
│       │   ├── firebaseAdmin.js     # Firebase SDK initialization
│       │   ├── logger.js            # Unified winston logging
│       │   └── swagger.js           # Swagger JSON specifications
│       ├── controllers/
│       │   ├── auth.controller.js   # Client authentication control
│       │   └── interview.controller.js  # Core report and Puppeteer controls
│       ├── middlewares/
│       │   ├── auth.middleware.js   # JWT token decryption & validation
│       │   └── file.middleware.js   # Multer file size/filter configuration
│       ├── models/
│       │   ├── user.model.js        # User database model
│       │   ├── interviewReport.model.js # Generated metrics & reports model
│       │   └── blacklist.model.js   # Invalidated session token log
│       ├── routes/
│       │   ├── auth.routes.js       # Auth endpoint controllers
│       │   └── interview.routes.js  # Main analytical endpoint controllers
│       └── services/
│           └── ai.service.js        # Multi-model core & PDF styling service
│
├── Frontend/
│   ├── index.html                   # Entry page with preconnect & meta tags
│   ├── vite.config.js               # Vite configurations
│   └── src/
│       ├── App.jsx                  # Main wrapper & toast context
│       ├── app.routes.jsx           # Route guard bindings
│       ├── main.jsx                 # Client bootstrapping script
│       ├── style.scss               # Main layout & theme variables
│       ├── config/
│       │   └── firebase.js          # Firebase Client configuration
│       ├── components/
│       │   ├── Navbar/              # Top navigations
│       │   ├── Footer/              # Page footer
│       │   ├── Layout/              # Dynamic layout frame
│       │   └── Toast/               # Toast notification context
│       └── features/
│           ├── auth/                # Login, Register, & Google Auth assets
│           └── interview/           # Form, report tables, & studies assets
│
└── README.md                        # Project documentation
```

---

## 🔑 Key Design Decisions

- **Cookie-Based JWT Strategy**: Cookies are signed, HTTP-only, and configured with SameSite protection to safeguard logins against XSS-based local storage attacks.
- **Server-Side Rendering for Documents**: Tailored resumes and cover letters are built on the server via Puppeteer to guarantee page layouts, page breaks, and custom fonts render perfectly.
- **Structured JSON Models**: Schema definition uses specific formats ensuring API replies conform perfectly to our models, bypassing fragile text splitting.
- **SCSS Modules Over Tailwind**: Using SCSS Modules allows for fine-grained style scoping without bloating the DOM with repetitive utility classes.

---

## 🎨 Design System (Aesthetic Guidelines)

JobGenie uses a premium dark-mode aesthetic with warm gold accents:

| CSS Variable | Value | Usage |
| :--- | :--- | :--- |
| `--bg-base` | `#0f0c1a` | Base layout body color |
| `--bg-card` | `#140927` | Element surface wrappers |
| `--gold-mid` | `#d4a017` | Secondary actions & branding highlights |
| `--text-primary` | `#f0eaff` | Standard heading & reading text |
| `--font-display` | `'Cinzel', serif` | Elegant title fonts |
| `--font-body` | `'DM Sans', sans-serif` | Clean reading and interface content |

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve JobGenie:

1. **Fork** this repository.
2. Create a branch: `git checkout -b feature/cool-feature`
3. Commit changes: `git commit -m "feat: added cool feature"`
4. Push to origin: `git push origin feature/cool-feature`
5. Submit a **Pull Request**.

Please follow the commit convention (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`).

---

## 📜 License

Distributed under the [MIT License](LICENSE). See `LICENSE` for more information.

---

<p align="center">
  <strong>Built with 💛 by <a href="https://github.com/jaypatel-tech116">Jay Patel</a></strong>
</p>
