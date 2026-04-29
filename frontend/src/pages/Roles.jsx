import React, { useState, useEffect } from "react";
import axios from "axios";

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        axios.get("/api/roles"),
        axios.get("/api/permissions"),
      ]);
      setRoles(rolesRes.data);
      setAllPermissions(permsRes.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch roles or permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = async (role) => {
    try {
      const res = await axios.get(`/api/roles/${role.id}`);
      setSelectedRole(res.data);
      setSelectedPerms(res.data.permissions.map((p) => p.key));
      setSuccessMsg("");
      setError("");
    } catch (err) {
      setError("Failed to fetch role details");
    }
  };

  const togglePermission = (permKey) => {
    setSelectedPerms((prev) =>
      prev.includes(permKey)
        ? prev.filter((k) => k !== permKey)
        : [...prev, permKey]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      await axios.put(`/api/roles/${selectedRole.id}/permissions`, {
        permissions: selectedPerms,
      });
      setSuccessMsg(`Permissions updated for "${selectedRole.label}"`);
      fetchData();
    } catch (err) {
      setError("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by category
  const grouped = allPermissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Roles & Permissions</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Roles List */}
          <div className="bg-white rounded shadow p-4">
            <h2 className="font-bold text-gray-700 mb-4 text-lg border-b pb-2">Roles</h2>
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => handleSelectRole(role)}
                className={`p-3 rounded cursor-pointer mb-2 border transition ${
                  selectedRole?.id === role.id
                    ? "bg-blue-100 border-blue-400 text-blue-800"
                    : "hover:bg-gray-50 border-gray-200"
                }`}
              >
                <div className="font-semibold capitalize">{role.label}</div>
                <div className="text-xs text-gray-500">{role.description}</div>
              </div>
            ))}
          </div>

          {/* Permissions Editor */}
          <div className="md:col-span-2 bg-white rounded shadow p-4">
            {selectedRole ? (
              <>
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h2 className="font-bold text-gray-700 text-lg">
                    Permissions for: <span className="text-blue-600 capitalize">{selectedRole.label}</span>
                  </h2>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                {Object.entries(grouped).map(([category, perms]) => (
                  <div key={category} className="mb-5">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                      {category}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((perm) => (
                        <label
                          key={perm.key}
                          className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition ${
                            selectedPerms.includes(perm.key)
                              ? "bg-blue-50 border-blue-300"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPerms.includes(perm.key)}
                            onChange={() => togglePermission(perm.key)}
                            className="accent-blue-600"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-700">{perm.label}</div>
                            <div className="text-xs text-gray-400">{perm.key}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400">
                ← Select a role to view and edit permissions
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roles;
