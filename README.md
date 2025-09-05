# Highway Delite – Notes App (Email OTP Auth)

A full-stack notes application with email OTP authentication.

- Frontend: React 19 + Vite, React Router, Tailwind CSS
- Backend: Node.js + Express, MySQL (via mysql2), Nodemailer for OTP emails
- DB: MySQL

## Monorepo Structure

```
.
├─ backend/       # Express server, MySQL pool, email OTP, notes APIs
└─ frontend/      # React app (signup/signin with OTP, dashboard, notes UI)
```

## Live Demo

- Netlify URL: [ADD YOUR NETLIFY LINK HERE]

Replace the placeholder above with your deployed Netlify link.

## Features

- Email-based OTP authentication (signin and signup flows)
- User creation on first verified OTP (with name and DOB)
- Notes CRUD (create, list, delete) scoped by user

## Backend

- Entry: `backend/app.js` (Express server)
- DB pool: `backend/db.js` (MySQL connection via environment variables)
- Email: `backend/sendEmail.js` (Nodemailer SMTP, Gmail example)

### Env Vars (.env)

Create `backend/.env` with:

```
PORT=8080
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hd_app

MY_EMAIL=your_gmail@example.com
MY_PASSWORD=your_app_password
```

Notes:
- Use an App Password for Gmail (or configure any SMTP provider).
- Ensure the MySQL user has privileges and the database exists (tables are auto-created on boot).

### Install & Run (Backend)

From `backend/`:

```
npm install
npm run dev   # or: npm start after build
```

Scripts (from `backend/package.json`):
- `dev`: Run in development (ts-node-dev if TS source is used)
- `build`: TypeScript build (if using TS source)
- `start`: Run compiled server (dist)

The provided `app.js` starts Express on `http://localhost:8080` and ensures DB tables.

### API Endpoints (Summary)

- `GET /ping` – health check
- `POST /sendEmail` – send OTP to email `{ email }`
- `POST /verifyOtp` – verify OTP, optionally create user `{ email, otp, name?, dob? }`
- `GET /user/:id` – fetch user by id
- `POST /notes` – create note `{ userId, title, content? }`
- `GET /notes?userId=...` – list notes for a user
- `DELETE /notes/:id` – delete note by id

## Frontend

- Entry: `frontend/src/main.jsx`
- Routes: `frontend/src/App.jsx` defines `/signup`, `/signin`, `/dashboard`, and `/` → `SignUp`.
- Components: `frontend/src/Components/{SignUp,SignIn,Dashboard}.jsx`
- Assets: `frontend/public/`

### Configure API Base URL

Currently, API calls use `http://localhost:8080` directly in components (e.g., `SignIn.jsx`). For deployments, consider using an environment variable and a request helper.

### Install & Run (Frontend)

From `frontend/`:

```
npm install
npm run dev
```

Build/Preview:

```
npm run build
npm run preview
```

## Development Notes

- Tailwind v4 via `@tailwindcss/vite` is configured in `vite.config.js`.
- React Router v7 is used.
- Ensure CORS is enabled on the backend (already configured in `app.js`).

## Deployment

### Frontend (Netlify)

- Build command: `npm run build`
- Publish directory: `frontend/dist`
- Base directory: `frontend`
- Environment: configure `VITE_API_URL` (if you refactor to use env) to your backend URL.

Update the Live Demo link above once deployed.

### Backend (Any Node Hosting)

- Provide `.env` with DB and SMTP credentials.
- Expose port defined in `PORT`.
- Ensure MySQL database is reachable from your hosting provider.

## Scripts Quick Reference

- Backend: in `backend/`
  - `npm run dev`, `npm run build`, `npm start`
- Frontend: in `frontend/`
  - `npm run dev`, `npm run build`, `npm run preview`

## License

ISC
