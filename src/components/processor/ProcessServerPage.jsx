"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ProcessServerPage({ openRequests, closedRequests }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailSent = searchParams.get("emailSent");
    const emailFailed = searchParams.get("emailFailed");
    const closed = searchParams.get("closed");

    if (emailSent === "true") {
      alert("Email sent successfully!");
    }
    if (emailFailed === "true") {
      alert("Failed to send email.");
    }
    if (closed === "true") {
      alert("Request closed successfully!");
    }
  }, [searchParams]);

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
                      <a
                        href={`/process-server/request/${req._id}/email`}
                        className="text-blue-600 hover:underline"
                      >
                        {req.emailSent ? "Resend" : "Email"}
                      </a>
                      <button
                        onClick={async () => {
                          const res = await fetch(
                            `/process-server/request/${req._id}/close`,
                            {
                              method: "POST",
                            }
                          );
                          if (res.ok) {
                            // Refresh the page client-side
                            window.location.href =
                              "/process-server?closed=true";
                          } else {
                            alert("Failed to close request.");
                          }
                        }}
                        className="text-red-600 hover:underline"
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
        {renderTable(openRequests, "Open Requests", true)}

        {renderTable(closedRequests, "Closed Requests", false)}
      </div>
    </main>
  );
}
