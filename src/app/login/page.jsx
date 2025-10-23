// app/login/page.jsx
"use client";

import { Suspense } from "react";
import LoginForm from "../../components/login/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading login form...</div>}>
      <LoginForm />
    </Suspense>
  );
}
