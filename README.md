# PG-Project (Final Year)

Full-stack web application for managing final year/PG projects with role-based access for **HOD**, **Guide**, and **Student**.

## Overview
This project is a full-stack MERN-style application:
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT authentication + Role-Based Access Control (RBAC)

The backend currently includes a complete Authentication & User Management module and additional API modules (teams, communication, marks, activities, deadlines, etc.).

## Features
### Authentication & User Management
- User registration and login
- JWT token-based authentication
- Role-based access control (HOD / Guide / Student)
- Password hashing with bcrypt
- Input validation using express-validator
- Profile view/update

### Other Modules (API routes are present)
- Staff management (`/api/staff`)
- HOD functions (`/api/hod`)
- Team management (`/api/teams`)
- Communication (`/api/communication`)
- Student module (`/api/student`)
- Marks (`/api/marks`)
- Activities (`/api/activities`)
- Deadlines (`/api/deadlines`)
- Public endpoints (`/api/public`)

## Tech Stack
### Frontend (`/client`)
- React (Vite)
- react-router-dom
- axios
- Bootstrap / react-bootstrap
- recharts
- PDF tools: react-pdf, pdfjs-dist, html2pdf.js

### Backend (`/server`)
- express, cors, dotenv
- mongodb + mongoose
- jsonwebtoken
- bcryptjs
- express-validator
- multer (uploads)
- cloudinary (media)
- nodemailer (email)

## Project Structure
```text
PG-Project/
├── client/                  # React (Vite) frontend
└── server/                  # Express + MongoDB backend
```

## Prerequisites
- Node.js (LTS recommended)
- MongoDB (local or MongoDB Atlas)

## Setup & Run (Local)
### 1) Clone
```bash
git clone https://github.com/Logeskumar18/PG-Project.git
cd PG-Project
```

### 2) Backend setup
```bash
cd server
npm install
```

Create `server/.env` using `server/.env.example`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/lo2_project
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

Run backend:
```bash
npm run dev
# or
npm start
```
Backend runs at: `http://localhost:5000`

### 3) Frontend setup
```bash
cd ../client
npm install
```

Frontend env file (`client/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

Run frontend:
```bash
npm run dev
```
Frontend runs at: `http://localhost:5173`

## API Quick Check
Health endpoint:
- `GET /api/health`

Auth endpoints:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile` (protected)

## Notes
- Do **not** commit secrets (JWT secret, DB passwords, Cloudinary keys, etc.).
- See `server/README.md` for detailed API documentation and example requests.

## License
ISC
