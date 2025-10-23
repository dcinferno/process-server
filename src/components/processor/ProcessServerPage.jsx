"use client";

import React, { useState } from "react";

export default function ProcessServerPage({ openRequests, closedRequests }) {
  const [openReqs, setOpenReqs] = useState(openRequests);
  const [closedReqs, setClosedReqs] = useState(closedRequests);

  // Modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function handleSendEmail(id) {
    try {
      const res = await fetch(`/api/process-server/request/${id}/send-email`, {
        method: "POST",
      });
      if (res.ok) {
        alert("Email sent successfully!");
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

  async function handleCloseRequest(id) {
    try {
      const res = await fetch(`/api/process-server/request/${id}/close`, {
        method: "POST",
      });
      if (res.ok) {
        alert("Request closed successfully!");
        setOpenReqs((prev) => prev.filter((req) => req._id !== id));
        const closedReq = openReqs.find((req) => req._id === id);
        if (closedReq) {
          setClosedReqs((prev) => [...prev, { ...closedReq, closed: true }]);
        }
        setModalOpen(false);
      } else {
        const data = await res.json();
        alert("Failed to close request: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error closing request: " + err.message);
    }
  }

  // Open modal with request details
  function openModal(req) {
    setSelectedRequest(req);
    setModalOpen(true);
  }

  // Close modal
  function closeModal() {
    setModalOpen(false);
    setSelectedRequest(null);
  }

  // Card view for mobile
  const renderCard = (req, showActions) => (
    <div
      key={req._id}
      className="bg-white shadow rounded p-4 mb-4 cursor-pointer"
      onClick={() => openModal(req)}
    >
      <p>
        <strong>Client:</strong> {req.clientName}
      </p>
      <p>
        <strong>Email:</strong> {req.email}
      </p>
      <p>
        <strong>Priority:</strong> {req.priority}
      </p>
      <p>
        <strong>Created:</strong> {new Date(req.createdAt).toLocaleDateString()}
      </p>
      {req.emailSent && (
        <p className="text-green-600 font-semibold">Email Sent</p>
      )}
    </div>
  );

  // Table view for desktop (your original table)
  const renderTable = (requests, title, showActions) => (
    <div className="hidden md:block mb-10">
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
        {/* Cards for mobile */}
        <div className="md:hidden mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
            Open Requests
          </h2>
          {openReqs.length === 0 ? (
            <p className="text-center text-gray-600">No open requests found.</p>
          ) : (
            openReqs.map((req) => renderCard(req, true))
          )}
        </div>

        {/* Desktop tables */}
        {renderTable(openReqs, "Open Requests", true)}

        {/* Closed Requests */}
        <div className="md:hidden mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
            Closed Requests
          </h2>
          {closedReqs.length === 0 ? (
            <p className="text-center text-gray-600">
              No closed requests found.
            </p>
          ) : (
            closedReqs.map((req) => renderCard(req, false))
          )}
        </div>

        {renderTable(closedReqs, "Closed Requests", false)}
      </div>

      {/* Modal */}
      {modalOpen && selectedRequest && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
              onClick={closeModal}
            >
              &times;
            </button>

            <h2 className="text-xl font-semibold mb-4">Request Details</h2>
            <p>
              <strong>Client:</strong> {selectedRequest.clientName}
            </p>
            <p>
              <strong>Email:</strong> {selectedRequest.email}
            </p>
            <p>
              <strong>Phone:</strong> {selectedRequest.phone}
            </p>
            <p>
              <strong>Priority:</strong> {selectedRequest.priority}
            </p>
            <p>
              <strong>Created:</strong>{" "}
              {new Date(selectedRequest.createdAt).toLocaleDateString()}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {selectedRequest.closed ? "Closed" : "Open"}
            </p>

            {!selectedRequest.closed && (
              <div className="mt-4 space-x-4">
                <button
                  onClick={() => handleSendEmail(selectedRequest._id)}
                  className="text-blue-600 hover:underline"
                >
                  {selectedRequest.emailSent ? "Resend Email" : "Send Email"}
                </button>
                <button
                  onClick={() => handleCloseRequest(selectedRequest._id)}
                  className="text-red-600 hover:underline"
                >
                  Close Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
