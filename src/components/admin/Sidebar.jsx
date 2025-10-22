import React from "react";
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-md p-4 flex flex-col">
      <h1 className="text-xl font-bold mb-8">Admin</h1>
      <nav className="flex flex-col space-y-3">
        <Link href="/admin/dashboard">
          <a className="hover:text-blue-600">Dashboard</a>
        </Link>
        <Link href="/admin/users">
          <a className="hover:text-blue-600">Users</a>
        </Link>
        <Link href="/admin/users/create">
          <a className="hover:text-blue-600">Create User</a>
        </Link>
      </nav>
    </aside>
  );
}
