# Quick Start Guide - Access Control System

## 🚀 Get Running in 5 Minutes

### **Prerequisites**
- Node.js v18+
- PostgreSQL installed and running
- Git (optional)

---

## ⚡ Quick Setup

### **1. Database Setup (2 minutes)**

Open PostgreSQL and run:
```sql
CREATE DATABASE access_control;

\c access_control

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);
```

✅ Database ready!

---

### **2. Backend Setup (1 minute)**

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file with your database credentials
# (See Backend/.env.example or README.md)

# Start server
npm run dev
```

You should see:
```
Server is running on port 5000
Connected to the database
```

✅ Backend running!

---

### **3. Frontend Setup (1 minute)**

Open a **NEW terminal**:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

You should see:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

✅ Frontend running!

---

## 🎯 Test Immediately

1. Open **http://localhost:5173/** in your browser
2. Click **"Create New Account"**
3. Register with:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
4. You're logged in! 🎉

---

## 👨‍💼 Test as Admin

1. **First registered user is always admin**
2. After registration, click **"Users"** tab in navbar
3. You can now:
   - ✅ View all users
   - ✅ Create new users
   - ✅ Edit user details
   - ✅ Delete users

---

## 📋 Key Features to Try

### **Login Page**
- No autofill on form fields
- Email validation
- Clear error messages

### **User Management** (Admin only)
- Beautiful user table
- Edit modal for each user
- Change user roles
- Delete confirmation

### **Home Page**
- Shows different content for admin vs user
- Admin gets link to user management
- Regular user sees profile info

---

## 🔍 API Testing (Bonus)

Test endpoints with curl:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"pass123"}'

# Get all users (admin only)
curl -X GET http://localhost:5000/api/users \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

---

## ❌ Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot connect to database" | Check PostgreSQL is running and credentials in `.env` are correct |
| "Port 5000 in use" | Change `PORT` in `.env` to 5001 or kill process |
| Frontend won't reach backend | Make sure backend is running and check CORS in `.env` |
| Forms autofill | Clear browser cache |
| "Access denied" on users page | Make sure you're logged in as admin |

---

## 📚 Full Documentation

For complete details, see:
- [README.md](README.md) - Full documentation
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Project overview

---

## ✨ You're All Set!

The system is now ready to use. Try different features and see RBAC in action!

**Questions?** Check the README or troubleshooting section above.

---

**Happy Testing! 🚀**
