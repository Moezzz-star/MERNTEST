# BOOKLY — MERN Booking Platform

BOOKLY is a full-stack booking and appointment platform built with the MERN stack.

Users can create accounts, browse events, view available sessions, book appointments, manage their bookings, and update their profiles.

Administrators can manage users, events, sessions, capacities, and platform-wide bookings.

---

## Live Application

### Frontend

https://merntest-zouari.vercel.app

### Backend API

https://mongodb-crud-backend-qvkd.onrender.com

---

## Features

### Authentication

- User registration
- User login
- JWT authentication
- Password hashing with bcrypt
- Persistent sessions
- User/Admin authorization
- Protected API routes

### User Features

- Browse events
- View available sessions
- See remaining places
- Book a session
- Prevent duplicate bookings
- View personal appointments
- Cancel bookings
- Update profile

### Admin Features

- View all users
- Create users
- Edit users
- Delete users
- Create events
- Edit events
- Delete events
- Create sessions
- Edit sessions
- Cancel sessions
- Delete sessions
- Configure session capacity
- View all bookings

---

# Tech Stack

## Frontend

- React
- Vite
- JavaScript
- CSS
- Context API
- Fetch API

## Backend

- Node.js
- Express.js
- MongoDB Node.js Driver
- JWT
- bcryptjs
- CORS

## Database

- MongoDB Atlas

## Deployment

- Vercel — Frontend
- Render — Backend
- MongoDB Atlas — Database

## DevOps

- Git
- GitHub
- GitHub Actions
- Pull Requests
- Protected `main` branch
- CI/CD pipeline

---

# Architecture

```text
                         USER
                           │
                           ▼
                    React Frontend
                           │
                    Pages / Components
                           │
                       Services
                           │
                       API Client
                           │
                           ▼
                    Express REST API
                           │
                 Authentication Middleware
                           │
                      Controllers
                           │
                           ▼
                     MongoDB Atlas