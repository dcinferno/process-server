export const dynamic = "force-dynamic";
export const revalidate = 0;
import { connectDB } from "../../../lib/db";
import User from "../../../lib/models/User";
import Request from "../../../lib/models/Request";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

export default async function DashboardPage() {
  await connectDB();

  const totalUsers = await User.countDocuments();
  const openRequests = await Request.find({ status: "pending" })
    .sort({ createdAt: -1 })
    .lean();

  const revenue = 0; // Placeholder

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>{totalUsers}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>${revenue.toLocaleString()}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open Requests</CardTitle>
          </CardHeader>
          <CardContent>{openRequests.length}</CardContent>
        </Card>
      </div>
    </div>
  );
}
