export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    <main className="p-6 space-y-10">
      {/* Admin Links */}
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-6 text-gray-900">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        <p className="mb-6">
          Welcome to your admin panel! Use the links below to manage your app.
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
    </main>
  );
}
