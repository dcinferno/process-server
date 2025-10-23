export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { connectDB } from "../../../../../lib/db";
import Request from "../../../../../lib/models/Request";

export default async function ClosePage({ params }) {
  const { id } = params;

  await connectDB();

  const request = await Request.findById(id);
  if (!request) {
    return <div>Request not found</div>;
  }

  try {
    await Request.findByIdAndUpdate(id, { status: "closed" });
  } catch (error) {
    console.error("Error closing request:", error);
    return <div>Failed to close request.</div>;
  }

  redirect("/process-server?closed=true");
}
