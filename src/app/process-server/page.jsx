import { connectDB } from "../../lib/db";
import Request from "../../lib/models/Request";
import ProcessServerPage from "../../components/processor/ProcessServerPage";
import { Suspense } from "react";

export default async function Page() {
  await connectDB();

  let openRequests = await Request.find({ status: "pending" })
    .sort({ createdAt: -1 })
    .lean();

  let closedRequests = await Request.find({ status: "closed" })
    .sort({ createdAt: -1 })
    .lean();

  // Convert ObjectIds and dates to strings for both
  openRequests = openRequests.map((req) => ({
    ...req,
    _id: req._id.toString(),
    createdAt: req.createdAt.toISOString(),
  }));

  closedRequests = closedRequests.map((req) => ({
    ...req,
    _id: req._id.toString(),
    createdAt: req.createdAt.toISOString(),
  }));

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProcessServerPage
        openRequests={openRequests}
        closedRequests={closedRequests}
      />
    </Suspense>
  );
}
