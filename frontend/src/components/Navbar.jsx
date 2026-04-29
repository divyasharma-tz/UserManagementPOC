import React from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await axios.post("/api/auth/logout");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-6xl mx-auto p-4 flex justify-between items-center">
        <Link to="/" className="font-bold text-lg">
          Access Control
        </Link>
        <div>
          {user ? (
            <>
              <Link to="/" className="mx-2 hover:text-blue-300">
                Home
              </Link>
              {user.permissions?.includes("users:manage") && (
                <>
                  <Link to="/users" className="mx-2 hover:text-blue-300">
                    Users
                  </Link>
                  <Link to="/roles" className="mx-2 hover:text-blue-300">
                    Roles
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500 px-3 py-1 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mx-2">
                Login
              </Link>
              <Link to="/register" className="mx-2">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
