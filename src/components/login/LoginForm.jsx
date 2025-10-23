"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

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
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ...same as before... */}
      </form>
    </div>
  );
}
