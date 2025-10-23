export const dynamic = "force-dynamic";
export const revalidate = 0;
import { redirect } from "next/navigation";
import { connectDB } from "../../../../../lib/db";
import Request from "../../../../../lib/models/Request";
import MagicToken from "../../../../../lib/models/MagicToken";
import { sendMagicLinkEmail } from "../../../../../lib/emailer";
import { v4 as uuidv4 } from "uuid";

export default async function EmailPage({ params }) {
  const { id } = await params;

  await connectDB();

  const request = await Request.findById(id);
  if (!request) {
    return <div>Request not found</div>;
  }

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await MagicToken.create({
    requestId: request._id,
    token,
    expiresAt,
  });

  const magicLink = `${process.env.NEXT_PUBLIC_API_BASE_URL}/magic/${token}`;

  try {
    await sendMagicLinkEmail(request.email, magicLink, request.clientName);
  } catch (error) {
    console.error("Error sending email:", error);
    return <div>Failed to send email.</div>;
  }

  redirect("/admin?emailSent=true");
}
