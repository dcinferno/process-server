"use client";

import { useEffect, useState } from "react";

export default function MagicClient({ token }) {
  const [status, setStatus] = useState("Verifying...");
  const [request, setRequest] = useState(null);

  useEffect(() => {
    async function verifyToken() {
      try {
        const res = await fetch("/api/verify-magic-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) throw new Error("Invalid token");

        const data = await res.json();
        setRequest(data.request);
        setStatus("Verified! You can now upload documents and pay.");
      } catch (err) {
        setStatus("Verification failed or link expired.");
      }
    }

    verifyToken();
  }, [token]);

  return (
    <main>
      <h1>{status}</h1>
      {request && (
        <div>
          <p>Client Name: {request.clientName}</p>
          {/* Add more UI for payment/upload here */}
        </div>
      )}
    </main>
  );
}
