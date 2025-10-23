"use client";

import React, { useState } from "react";

export default function ProcessServerPage({ openRequests, closedRequests }) {
  // Local state for requests to allow UI updates after actions
  const [openReqs, setOpenReqs] = useState(openRequests);
  const [closedReqs, setClosedReqs] = useState(closedRequests);

  // Send email handler
  async function handleSendEmail(id) {
    try {
      const res = await fetch(`/api/process-server/request/${id}/send-email`, {
        method: "POST",
      });
      if (res.ok) {
        alert("Email sent successfully!");

        // Optionally update the state to mark emailSent true
        setOpenReqs((prev) =>
          prev.map((req) =>
            req._id === id ? { ...req, emailSent: true } : req
          )
        );
      } else {
        const data = await res.json();
        alert("Failed to send email: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error sending email: " + err.message);
    }
  }

  // Close request handler
  async function handleCloseRequest(id) {
    try {
      const res = await fetch(`/api/process-server/request/${id}/close`, {
        method: "POST",
      });
      if (res.ok) {
        alert("Request closed successfully!");

        // Move request from open to closed
        setOpenReqs((prev) => prev.filter((req) => req._id !== id));
        const closedReq = openReqs.find((req) => req._id === id);
        if (closedReq) {
          setClosedReqs((prev) => [...prev, { ...closedReq, closed: true }]);
        }
      } else {
        const data = await res.json();
        alert("Failed to close request: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error closing request: " + err.message);
    }
  }

  const renderTable = (requests, title, showActions) => (
    <div className="mb-10">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
        {title}
      </h2>
      {requests.length === 0 ? (
        <p className="text-center text-gray-600">
          No {title.toLowerCase()} found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold">
                  Client
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold">
                  Email
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold">
                  Phone
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold">
                  Priority
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold">
                  Created
                </th>
                {showActions && (
                  <th className="py-3 px-4 text-left text-sm font-semibold">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr
                  key={req._id}
                  className="border-b border-gray-200 hover:bg-gray-100 transition"
                >
                  <td className="py-3 px-4 text-sm">{req.clientName}</td>
                  <td className="py-3 px-4 text-sm break-words">{req.email}</td>
                  <td className="py-3 px-4 text-sm">{req.phone}</td>
                  <td className="py-3 px-4 text-sm capitalize">
                    {req.priority}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  {showActions && (
                    <td className="py-3 px-4 text-sm space-x-3">
                      <button
                        onClick={() => handleSendEmail(req._id)}
                        className="text-blue-600 hover:underline cursor-pointer bg-transparent border-none p-0"
                      >
                        {req.emailSent ? "Resend" : "Email"}
                      </button>
                      <button
                        onClick={() => handleCloseRequest(req._id)}
                        className="text-red-600 hover:underline cursor-pointer bg-transparent border-none p-0"
                      >
                        Close
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-10">
      <div className="bg-white text-black min-h-screen p-4 max-w-4xl mx-auto">
        {renderTable(openReqs, "Open Requests", true)}
        {renderTable(closedReqs, "Closed Requests", false)}
      </div>
    </main>
  );
}
