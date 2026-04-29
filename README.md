# Access Control System

A modern **User Management System** built with **React + Node.js + PostgreSQL** featuring Role-Based Access Control (RBAC).

## 📋 Features

✅ **User Authentication**
- User Registration with validation
- User Login with JWT
- Secure password hashing with bcrypt
- Cookie-based session management

✅ **Role-Based Access Control (RBAC)**
- Admin users can manage all users
- Regular users have limited access
- Protected routes on frontend and backend

✅ **User Management Dashboard**
- View all registered users
- Create new users (admin only)
- Edit user details (admin only)
- Delete users (admin only)
- Role assignment (user/admin)

✅ **Security Features**
- HTTP-only cookies
- CORS protection
- Protected API endpoints
- Admin-only middleware
- No field autofill on forms

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite + Tailwind CSS |
| **Backend** | Node.js + Express 5 |
| **Database** | PostgreSQL |
| **Authentication** | JWT + bcrypt |
| **Routing** | React Router v7 |
| **API Client** | Axios |

---

## 📦 Project Structure

```
access-control-system/
├── backend/
│   ├── config/
│   │   └── db.js              ← Database connection
│   ├── middleware/
│   │   └── auth.js            ← JWT & RBAC middleware
│   ├── routes/
│   │   ├── auth.js            ← Login, Register, Me, Logout
│   │   └── users.js           ← User management endpoints
│   ├── server.js              ← Express app setup
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── EditUserModal.jsx
│   │   │   └── CreateUserModal.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Users.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
```

---

## 🚀 Installation & Setup

### **Prerequisites**
- Node.js (v18+)
- PostgreSQL (v12+)

### **Step 1: Setup Database**

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

### **Step 2: Setup Backend**

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_NAME=access_control
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD

JWT_SECRET=your_super_secret_jwt_key_change_this
NODE_ENV=development
```

Start backend:
```bash
npm run dev
```

### **Step 3: Setup Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open: **http://localhost:5173/**

---

## 📚 API Endpoints

### **Authentication**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user (protected) |
| POST | `/api/auth/logout` | Logout user |

### **User Management** (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get single user |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/:id` | Edit user |
| DELETE | `/api/users/:id` | Delete user |

---

## 🔐 RBAC Implementation

### **User Roles**
- **Admin** - Full system access, can manage users
- **User** - Limited access, cannot access user management

### **Protection Layers**

**Frontend:**
- UI elements hidden for non-admins
- Routes protected by role check
- Automatic redirect if unauthorized

**Backend:**
- `protect` middleware checks JWT
- `isAdmin` middleware checks role
- All user endpoints require admin role

---

## 👥 Default Admin Account

First user registered automatically becomes admin. Use this to:
1. Create additional users
2. Manage user roles
3. Edit/delete user accounts

---

## 🧪 Testing User Flow

### **Register New User**
1. Click "Register"
2. Fill in Name, Email, Password
3. Submit
4. Logged in automatically

### **Login**
1. Click "Login"
2. Enter Email and Password
3. Submit
4. Redirected to Home

### **Manage Users (Admin Only)**
1. Login as admin
2. Click "Users" in navbar
3. View all users in table
4. Click "Edit" to change user details
5. Click "Delete" to remove user
6. Click "+ Add New User" to create new user

### **Test Regular User Access**
1. Register as new user (will be "user" role)
2. "Users" tab will NOT appear
3. Trying to access `/users` redirects to home
4. API calls are blocked by backend

---

## 🎨 UI/UX Features

✅ **Clean, Modern Design**
- Tailwind CSS for styling
- Responsive layout
- Clear typography

✅ **User Feedback**
- Success/error messages
- Loading states
- Confirmation dialogs

✅ **Accessibility**
- No autofill on forms
- Clear navigation
- Semantic HTML

---

## 🔄 Future Enhancements

- [ ] User Invite System (email-based invitations)
- [ ] Module Federation (federated microfrontends)
- [ ] Password Reset via Email
- [ ] Two-Factor Authentication (2FA)
- [ ] Audit Logs (track user actions)
- [ ] Advanced Search & Filters
- [ ] User Profiles & Avatars
- [ ] Permission Management (granular permissions)

---

## 📝 Environment Variables

### Backend (.env)
```
PORT=5000                          # Server port
CLIENT_URL=http://localhost:5173   # Frontend URL
DB_HOST=localhost                  # Database host
DB_PORT=5432                       # Database port
DB_NAME=access_control             # Database name
DB_USER=postgres                   # Database user
DB_PASSWORD=password               # Database password
JWT_SECRET=your_secret_key         # JWT signing key
NODE_ENV=development               # Environment
```

---

## 🛡️ Security Considerations

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT stored in HTTP-only cookies
- ✅ CORS configured for specific origin
- ✅ Protected routes require authentication
- ✅ Admin-only endpoints verified on backend
- ✅ Input validation on all endpoints
- ✅ Email uniqueness enforced
- ✅ No autofill on authentication forms

---

## 📖 Usage Examples

### **Register a User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### **Create New User (Admin)**
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "password123",
    "role": "admin"
  }'
```

### **Get All Users (Admin)**
```bash
curl -X GET http://localhost:5000/api/users \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to database" | Check DB credentials in `.env` and PostgreSQL is running |
| "Port 5000 already in use" | Change `PORT` in `.env` or kill existing process |
| "Access denied" error on users API | Make sure you're logged in as admin |
| Frontend can't reach backend | Check `CLIENT_URL` in `.env` matches frontend URL |
| Form fields autofill | Browser cache - clear and try again |

---

## 📄 License

ISC

---

## 👨‍💻 Developer Notes

- **JWT Expiry:** 30 days
- **Cookie Settings:** HTTP-only, Secure (production), SameSite: Strict
- **Password Rules:** Minimum 8 characters recommended
- **Email Validation:** Basic email format validation

---

## 🎯 Next Steps for POC Ticket #185

1. ✅ Basic Authentication (Done)
2. ✅ Role-Based Access Control (Done)
3. ✅ User Management (Done)
4. ⏭️ User Invite System (To do)
5. ⏭️ Module Federation (To do)
6. ⏭️ Dayko Integration (To do)

---

## 📞 Support

For questions or issues, refer to the endpoint documentation above or check the backend logs.

---

**Built with ❤️ for POC #185**
