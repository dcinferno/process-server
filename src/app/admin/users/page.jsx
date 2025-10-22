import React from "react";
import UserTable from "../../../components/admin/UserTable";

export default function UsersPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">User Management</h2>
      <UserTable />
    </div>
  );
}
