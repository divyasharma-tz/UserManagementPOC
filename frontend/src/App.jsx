import { useEffect, useState } from "react";
import axios from "axios";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Contacts from "./pages/Contacts";
import NotFound from "./components/NotFound";

// Attach token from localStorage to every request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const getCookieValue = (name) => {
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
};

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const exchangeSct = async (sct) => {
      console.log("🔄 Starting SCT exchange...");
      // Using dev endpoint that skips validation for testing
      // Change to '/api/auth/sct-exchange' once real SCT is ready
      const res = await axios.post("/api/auth/sct-exchange-dev", { sct });
      console.log("✅ SCT exchanged successfully:", res.data.user);
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      setError("");
      return true;
    };

    const fetchUser = async () => {
      console.log("🚀 App starting - checking for authentication...");
      const sct = getCookieValue("sct_token");
      const token = localStorage.getItem("token");
      
      console.log("🔍 Found sct_token in cookies:", !!sct);
      console.log("🔍 Found token in localStorage:", !!token);

      try {
        if (sct) {
          console.log("📞 Calling SCT exchange endpoint...");
          await exchangeSct(sct);
          return;
        }

        if (!token) {
          console.log("❌ No authentication found");
          setUser(null);
          return;
        }

        console.log("📞 Calling /me endpoint with existing token...");
        const res = await axios.get("/api/auth/me");
        setUser(res.data);
        setError("");
        console.log("✅ User loaded from token:", res.data);
      } catch (err) {
        console.error("❌ Authentication failed:", err.response?.data?.message);
        localStorage.removeItem("token");
        setUser(null);
        setError(err.response?.data?.message || "Authentication failed");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const canManageUsers = user?.permissions?.includes("users:manage");
  const canReadContacts = user?.permissions?.includes("contacts:read");

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<Home user={user} error={error} />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login setUser={setUser} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" /> : <Register setUser={setUser} />}
        />
        <Route
          path="/contacts"
          element={canReadContacts ? <Contacts user={user} /> : <Navigate to="/" />}
        />
        <Route
          path="/users"
          element={canManageUsers ? <Users user={user} /> : <Navigate to="/" />}
        />
        <Route
          path="/roles"
          element={canManageUsers ? <Roles /> : <Navigate to="/" />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
