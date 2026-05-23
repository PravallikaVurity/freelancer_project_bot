# Freelancer Board – Social Impact Freelance Platform

A full-stack MERN application connecting freelancers with mission-driven clients.

## Tech Stack
- **Frontend**: React + Vite, Tailwind CSS, React Router, Axios, Socket.io Client, React Hot Toast
- **Backend**: Node.js, Express, MongoDB Atlas, Mongoose, JWT, Socket.io, Cloudinary, Nodemailer

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm run seed           # seed demo data
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL
npm run dev
```

## Demo Accounts (after seeding)
| Role       | Email                  | Password    |
|------------|------------------------|-------------|
| Admin      | admin@fb.com           | Admin@123   |
| Client     | client@fb.com          | Client@123  |
| Freelancer | freelancer@fb.com      | Free@123    |

## Environment Variables

### Backend `.env`
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=...
EMAIL_PASS=...
CLIENT_URL=http://localhost:5173
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
```

## Features
- JWT Authentication with role-based access (Freelancer / Client / Admin)
- Real-time chat with Socket.io (typing indicators, online status)
- Project posting, bidding, proposal management
- Admin dashboard with analytics, user management, dispute resolution
- Cloudinary file uploads, Nodemailer password reset emails
- Fully responsive dark-theme UI
