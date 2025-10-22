import Link from "next/link";

export default function AdminIndexPage() {
  return (
    <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
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
  );
}
