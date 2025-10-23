"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawCallbackUrl = searchParams.get("callbackUrl") || "";
  const callbackUrl = rawCallbackUrl ? decodeURIComponent(rawCallbackUrl) : "";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (honeypot) {
      setError("Login Failed");
      return;
    }

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    const data = await res.json();

    if (res.ok) {
      if (callbackUrl) {
        router.push(callbackUrl);
      } else if (data.role === "admin") {
        router.push("/admin");
      } else if (data.role === "process-server") {
        router.push("/process-server");
      } else {
        router.push("/");
      }
    } else {
      setError(data.error || "Login failed");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow text-gray-900">
      <h1 className="text-2xl font-bold mb-4">Agent Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Honeypot field for spam prevention */}
        <input
          type="text"
          name="address"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          autoComplete="off"
          tabIndex="-1"
          style={{ display: "none" }}
          aria-hidden="true"
        />

        <label className="block">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded p-2 mt-1"
          />
        </label>

        <label className="block">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded p-2 mt-1"
          />
        </label>

        {error && <p className="text-red-600">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}
