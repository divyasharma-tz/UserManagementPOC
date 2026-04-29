import React from "react";
import { Link } from "react-router-dom";

const Home = ({ user, error }) => {
  return (
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 overflow-hidden">      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {user ? (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white font-bold">
                  {(user.name || user.email)?.charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome, {user.name || user.email}!
              </h2>
              <p className="text-gray-600 mb-2">Email: {user.email}</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  user.permissions?.includes("users:manage")
                    ? "bg-red-100 text-red-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {user.permissions?.includes("users:manage") ? "👤 Admin User" : `👤 ${user.role}`}
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                {user.permissions?.includes("users:manage")
                  ? "Admin Dashboard"
                  : "Your Profile"}
              </h3>
              {user.permissions?.includes("users:manage") ? (
                <div className="text-sm text-gray-600 space-y-2">
                  <p>✅ View and manage all users</p>
                  <p>✅ Create new user accounts</p>
                  <p>✅ Edit user details and roles</p>
                  <p>✅ Remove users from system</p>
                </div>
              ) : (
                <div className="text-sm text-gray-600 space-y-2">
                  <p>📧 Email: {user.email}</p>
                  <p>👤 Role: {user.role}</p>
                  <p>
                    💡 Contact admin for account changes or issues
                  </p>
                </div>
              )}
            </div>

            {user.permissions?.includes("users:manage") && (
              <Link
                to="/users"
                className="inline-block w-full text-white bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-medium transition"
              >
                Go to User Management →
              </Link>
            )}
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 text-gray-800">
              Access Control System
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Secure user management with role-based access control
            </p>

            <div className="flex flex-col gap-4">
              <Link
                to="/login"
                className="w-full text-white bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-medium transition"
              >
                Login to Your Account
              </Link>
              <Link
                to="/register"
                className="w-full text-blue-600 border-2 border-blue-600 hover:bg-blue-50 p-3 rounded-lg font-medium transition"
              >
                Create New Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
