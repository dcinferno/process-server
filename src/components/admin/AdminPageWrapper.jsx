"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function AdminPageWrapper({ children }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("emailSent")) {
      alert("Magic link email sent successfully!");
      // Remove the query param without reloading the page
      router.replace("/admin", { scroll: false });
    }
  }, [searchParams, router]);

  return <>{children}</>;
}
