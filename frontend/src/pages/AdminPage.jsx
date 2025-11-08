import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function AdminPage() {
  const [file, setFile] = useState(null);
  const [type, setType] = useState("courses");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Please select a CSV file");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE}/admin/upload?type=${type}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link to="/admin/faculty-verify" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
          <h3 className="text-lg font-semibold text-blue-600 mb-2">Faculty Verification</h3>
          <p className="text-gray-600">Approve pending faculty registrations</p>
        </Link>
        
        <Link to="/admin/faculty-manage" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
          <h3 className="text-lg font-semibold text-green-600 mb-2">Faculty Management</h3>
          <p className="text-gray-600">View faculties and generate timetables</p>
        </Link>
        
        <Link to="/admin/batches" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
          <h3 className="text-lg font-semibold text-purple-600 mb-2">Batch Management</h3>
          <p className="text-gray-600">Manage student batches</p>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">
          CSV Data Upload
        </h2>

      <div className="flex flex-col gap-4">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="courses">Courses</option>
          <option value="faculty">Faculty</option>
          <option value="students">Students</option>
          <option value="rooms">Rooms</option>
        </select>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="border p-2 rounded"
        />

        <button
          onClick={handleUpload}
          disabled={loading}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Uploading..." : "Upload CSV"}
        </button>

        {message && (
          <div className="mt-3 p-2 bg-blue-100 text-blue-800 rounded">
            {message}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
