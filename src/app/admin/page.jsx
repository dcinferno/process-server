export const dynamic = "force-dynamic";
export const revalidate = 0;
import AdminPageWrapper from "../../components/admin/AdminPageWrapper";
import Link from "next/link";
import { connectDB } from "../../lib/db";
import Request from "../../lib/models/Request";
import { Suspense } from "react";

export default async function AdminIndexPage() {
  await connectDB();

  // Fetch requests with emailSent field
  const openRequests = await Request.find({ status: "pending" })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <Suspense fallback="Loading..">
      <AdminPageWrapper>
        <main className="p-6 space-y-10">
          {/* Admin Links */}
          <div className="max-w-3xl mx-auto bg-white rounded shadow p-6 text-gray-900">
            <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
            <p className="mb-6">
              Welcome to your admin panel! Use the links below to manage your
              app.
            </p>
            <nav className="flex flex-col space-y-4">
              <Link
                href="/admin/dashboard"
                className="text-blue-600 hover:underline text-lg"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/users"
                className="text-blue-600 hover:underline text-lg"
              >
                Users
              </Link>
              <Link
                href="/admin/users/create"
                className="text-blue-600 hover:underline text-lg"
              >
                Create User
              </Link>
            </nav>
          </div>

          {/* Open Requests Table */}
          <div className="bg-black rounded-lg shadow p-4 text-white">
            <h2 className="text-2xl font-semibold mb-4">Open Requests</h2>

            {openRequests.length === 0 ? (
              <p className="text-gray-400">No open requests found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-700">
                  <thead className="bg-gray-900 text-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left border-b border-gray-700">
                        Actions
                      </th>
                      <th className="px-4 py-2 text-left border-b border-gray-700">
                        Client
                      </th>
                      <th className="px-4 py-2 text-left border-b border-gray-700">
                        Email
                      </th>
                      <th className="px-4 py-2 text-left border-b border-gray-700">
                        Phone
                      </th>
                      <th className="px-4 py-2 text-left border-b border-gray-700">
                        Recipient
                      </th>
                      <th className="px-4 py-2 text-left border-b border-gray-700">
                        Priority
                      </th>
                      <th className="px-4 py-2 text-left border-b border-gray-700">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {openRequests.map((req) => (
                      <tr
                        key={req._id}
                        className="border-t border-gray-800 hover:bg-gray-800 transition"
                      >
                        <td className="px-4 py-2 space-x-2">
                          <a
                            href={`/admin/requests/${req._id}/email`}
                            className={`underline ${
                              req.emailSent
                                ? "text-yellow-400"
                                : "text-blue-400"
                            }`}
                          >
                            {req.emailSent ? "Resend" : "Email"}
                          </a>

                          <form
                            method="POST"
                            action={`/admin/requests/${req._id}/close`}
                            className="inline"
                          >
                            <button
                              type="submit"
                              className="text-red-400 underline ml-2"
                            >
                              Close
                            </button>
                          </form>
                        </td>

                        <td className="px-4 py-2">{req.clientName}</td>
                        <td className="px-4 py-2">{req.email}</td>
                        <td className="px-4 py-2">{req.phone}</td>
                        <td className="px-4 py-2">{req.recipientName}</td>
                        <td className="px-4 py-2 capitalize">{req.priority}</td>
                        <td className="px-4 py-2">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </AdminPageWrapper>
    </Suspense>
  );
}
