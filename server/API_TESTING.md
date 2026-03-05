# API Testing Guide

## Quick Start

1. **Start MongoDB** (make sure it's running)
2. **Start the server**: `npm run dev`
3. **Use these curl commands or Postman/Thunder Client**

---

## Test Commands (using curl)

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

### 2. Register HOD
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Dr. Smith\",\"email\":\"hod@college.edu\",\"password\":\"hod123\",\"role\":\"HOD\",\"department\":\"Computer Science\",\"employeeId\":\"HOD001\"}"
```

### 3. Register Guide
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Prof. Johnson\",\"email\":\"guide@college.edu\",\"password\":\"guide123\",\"role\":\"Guide\",\"department\":\"Computer Science\",\"employeeId\":\"GDE001\"}"
```

### 4. Register Student
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Alice Student\",\"email\":\"alice@college.edu\",\"password\":\"student123\",\"role\":\"Student\",\"department\":\"Computer Science\",\"studentId\":\"CS2024001\"}"
```

### 5. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"hod@college.edu\",\"password\":\"hod123\"}"
```

**Copy the token from the response!**

### 6. Get Profile (Protected Route)
```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 7. Get All Users (HOD Only)
```bash
curl http://localhost:5000/api/auth/users \
  -H "Authorization: Bearer YOUR_HOD_TOKEN_HERE"
```

---

## Using PowerShell

### Register User
```powershell
$body = @{
    name = "Dr. Smith"
    email = "hod@college.edu"
    password = "hod123"
    role = "HOD"
    department = "Computer Science"
    employeeId = "HOD001"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body $body -ContentType "application/json"
```

### Login
```powershell
$loginBody = @{
    email = "hod@college.edu"
    password = "hod123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $response.data.token
Write-Host "Token: $token"
```

### Get Profile
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/profile" -Method Get -Headers $headers
```

---

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "Lo2 Authentication API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register HOD",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Dr. Smith\",\n  \"email\": \"hod@college.edu\",\n  \"password\": \"hod123\",\n  \"role\": \"HOD\",\n  \"department\": \"Computer Science\",\n  \"employeeId\": \"HOD001\"\n}"
        },
        "url": {"raw": "http://localhost:5000/api/auth/register"}
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"hod@college.edu\",\n  \"password\": \"hod123\"\n}"
        },
        "url": {"raw": "http://localhost:5000/api/auth/login"}
      }
    },
    {
      "name": "Get Profile",
      "request": {
        "method": "GET",
        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
        "url": {"raw": "http://localhost:5000/api/auth/profile"}
      }
    }
  ]
}
```

---

## Expected Responses

### Successful Registration
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "675a1234...",
      "name": "Dr. Smith",
      "email": "hod@college.edu",
      "role": "HOD",
      "department": "Computer Science",
      "employeeId": "HOD001",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Successful Login
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "675a1234...",
      "name": "Dr. Smith",
      "email": "hod@college.edu",
      "role": "HOD"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error - User Already Exists
```json
{
  "status": "error",
  "message": "User already exists with this email"
}
```

### Error - Invalid Credentials
```json
{
  "status": "error",
  "message": "Invalid email or password"
}
```

### Error - Unauthorized Access
```json
{
  "status": "error",
  "message": "Not authorized, no token"
}
```
