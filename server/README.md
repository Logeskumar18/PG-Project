# Lo2 Project - Authentication Server

## Authentication & User Management Module

A complete authentication system with JWT-based authentication and role-based access control.

### Features

✅ **User Registration** - Register with role-based accounts (HOD, Guide, Student)  
✅ **User Login** - Secure login with JWT token generation  
✅ **JWT Authentication** - Protected routes with token verification  
✅ **Role-Based Access Control** - Different permissions for HOD, Guide, and Student  
✅ **Password Security** - Bcrypt hashing for secure password storage  
✅ **Input Validation** - Express-validator for data validation  
✅ **Profile Management** - View and update user profile  

### User Roles

- **HOD** (Head of Department) - Full administrative access
- **Guide** - Faculty/mentor access
- **Student** - Student access

---

## Installation

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Setup

Create a `.env` file in the server directory (use `.env.example` as reference):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/lo2_project
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows (if MongoDB is installed as a service)
net start MongoDB

# Or use MongoDB Compass
```

### 4. Start the Server

```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:5000`

---

## API Endpoints

### Public Routes

#### 1. Register User
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Student",
  "department": "Computer Science",
  "studentId": "CS2024001",
  "phone": "1234567890"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Student",
      "department": "Computer Science",
      "studentId": "CS2024001",
      "phone": "1234567890",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 2. Login User
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Student"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Protected Routes (Require Authentication)

Add the JWT token in the Authorization header:
```
Authorization: Bearer <your_token_here>
```

#### 3. Get Profile
**GET** `/api/auth/profile`

#### 4. Update Profile
**PUT** `/api/auth/profile`

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "9876543210",
  "department": "Computer Science"
}
```

### Admin Routes (HOD Only)

#### 5. Get All Users
**GET** `/api/auth/users`

---

## Testing with Postman/Thunder Client

### 1. Register a User

**Method:** POST  
**URL:** `http://localhost:5000/api/auth/register`  
**Body (JSON):**
```json
{
  "name": "Test HOD",
  "email": "hod@test.com",
  "password": "test123",
  "role": "HOD",
  "department": "Computer Science",
  "employeeId": "EMP001"
}
```

### 2. Login

**Method:** POST  
**URL:** `http://localhost:5000/api/auth/login`  
**Body (JSON):**
```json
{
  "email": "hod@test.com",
  "password": "test123"
}
```

Copy the `token` from the response.

### 3. Access Protected Route

**Method:** GET  
**URL:** `http://localhost:5000/api/auth/profile`  
**Headers:**
```
Authorization: Bearer <paste_token_here>
```

---

## Project Structure

```
server/
├── config/
│   └── db.js                 # Database connection
├── controllers/
│   └── authController.js     # Authentication logic
├── middleware/
│   └── authMiddleware.js     # JWT & role verification
├── models/
│   └── User.js              # User schema
├── routes/
│   └── authRoutes.js        # API routes
├── .env                     # Environment variables
├── .env.example             # Environment template
├── .gitignore              # Git ignore file
├── package.json            # Dependencies
└── server.js               # Entry point
```

---

## Database Schema

### User Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | String | Yes | User's full name |
| email | String | Yes | Unique email address |
| password | String | Yes | Hashed password (min 6 chars) |
| role | String | Yes | HOD / Guide / Student |
| department | String | No | Department name |
| employeeId | String | No | For HOD/Guide (unique) |
| studentId | String | No | For Student (unique) |
| phone | String | No | Contact number |
| isActive | Boolean | Yes | Account status (default: true) |
| createdAt | Date | Yes | Registration timestamp |

---

## Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT token-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Input validation and sanitization
- ✅ Protected password field (not returned in queries)
- ✅ CORS configuration
- ✅ Environment variable protection

---

## Next Steps

This authentication module is the foundation. You can now build:

1. **Project Management Module** - Create and manage projects
2. **Guide Assignment Module** - Assign guides to students
3. **Milestone Tracking Module** - Track project progress
4. **Document Management Module** - Upload and manage documents
5. **Review System Module** - Submit and review project work

---

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

---

## License

ISC
