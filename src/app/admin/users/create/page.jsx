"use client";

import React, { useState } from "react";

export default function CreateUserPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretKey, setSecretKey] = useState(""); // new field
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("process-server");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, secretKey }),
    });

    if (res.ok) {
      setMessage("User created successfully!");
      setName("");
      setEmail("");
      setPassword("");
      setSecretKey(""); // reset secret key input too
    } else {
      const data = await res.json();
      setMessage(`Error: ${data.error || "Something went wrong"}`);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded shadow text-gray-900">
      <h2 className="text-xl font-semibold mb-4">Create User</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* existing fields */}
        <div>
          <label className="block mb-1 font-medium">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Role</label>
          <div className="flex space-x-6">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="role"
                value="process-server"
                checked={role === "process-server"}
                onChange={() => setRole("process-server")}
              />
              <span>Process Server</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="role"
                value="admin"
                checked={role === "admin"}
                onChange={() => setRole("admin")}
              />
              <span>Admin</span>
            </label>
          </div>
        </div>

        {/* new secret key input */}
        <div>
          <label className="block mb-1 font-medium">Secret Key</label>
          <input
            type="string"
            required
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder="Enter secret key"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create User
        </button>
      </form>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
