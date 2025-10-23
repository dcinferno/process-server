"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoginForm from "../../components/login/LoginForm";

function AuthCheckWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = decodeURIComponent(
    searchParams.get("callbackUrl") || "/"
  );
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          setIsAuthenticated(true);
          router.replace(callbackUrl); // Redirect if logged in
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [callbackUrl, router]);

  if (loading) {
    return <div>Loading login form...</div>;
  }

  // If NOT authenticated, show LoginForm with callbackUrl prop
  if (!isAuthenticated) {
    return <LoginForm callbackUrl={callbackUrl} />;
  }

  // While redirect happens, render nothing
  return null;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading login form...</div>}>
      <AuthCheckWrapper />
    </Suspense>
  );
}
