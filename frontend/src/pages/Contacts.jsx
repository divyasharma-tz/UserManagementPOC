import React, { useState, useEffect } from "react";
import axios from "axios";

const Contacts = ({ user }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Permission checks
  const canWrite = user?.permissions?.includes("contacts:write");
  const canDelete = user?.permissions?.includes("contacts:delete");

  // Fetch all contacts
  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/contacts");
      setContacts(res.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch contacts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (contact) => {
    setSelectedContact(contact);
    setShowEditModal(true);
  };

  const handleDelete = async (contactId) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      try {
        await axios.delete(`/api/contacts/${contactId}`);
        setContacts(contacts.filter((c) => c.id !== contactId));
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete contact");
        console.error(err);
      }
    }
  };

  const handleContactUpdated = () => {
    setShowEditModal(false);
    setSelectedContact(null);
    fetchContacts();
  };

  if (loading) {
    return <div className="text-center py-8">Loading contacts...</div>;
  }

  return (
    <div className="min-h-[80vh] bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Contact Management</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {canWrite && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="mb-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            + Add New Contact
          </button>
        )}

        {contacts.length === 0 ? (
          <div className="bg-white p-6 rounded shadow text-center">
            <p className="text-gray-600">No contacts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full">
              <thead className="bg-gray-200 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                    Created By
                  </th>
                  {(canWrite || canDelete) && (
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {contact.name}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {contact.email}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {contact.phone || "-"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {contact.company || "-"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {contact.creator_name || "Unknown"}
                    </td>
                    {(canWrite || canDelete) && (
                      <td className="px-6 py-3 text-sm">
                        {canWrite && (
                          <button
                            onClick={() => handleEdit(contact)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs mr-2"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(contact.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Contact Modal */}
      {showEditModal && selectedContact && (
        <EditContactModal
          contact={selectedContact}
          onClose={() => setShowEditModal(false)}
          onContactUpdated={handleContactUpdated}
        />
      )}

      {/* Create Contact Modal */}
      {showCreateModal && (
        <CreateContactModal
          onClose={() => setShowCreateModal(false)}
          onContactCreated={() => {
            setShowCreateModal(false);
            fetchContacts();
          }}
        />
      )}
    </div>
  );
};

// ── Edit Contact Modal ────────────────────────────────────
const EditContactModal = ({ contact, onClose, onContactUpdated }) => {
  const [formData, setFormData] = useState({
    name: contact.name,
    email: contact.email,
    phone: contact.phone || "",
    company: contact.company || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.put(`/api/contacts/${contact.id}`, formData);
      onContactUpdated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update contact");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Edit Contact</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              required
              autoComplete="off"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              required
              autoComplete="off"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              autoComplete="off"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              autoComplete="off"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Contact"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Create Contact Modal ──────────────────────────────────
const CreateContactModal = ({ onClose, onContactCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.post("/api/contacts", formData);
      onContactCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create contact");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Add New Contact</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              required
              autoComplete="off"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              required
              autoComplete="off"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              autoComplete="off"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              autoComplete="off"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Contact"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Contacts;
