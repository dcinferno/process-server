"use client";

import { useState, useEffect } from "react";
import "./globals.css"; // or wherever your CSS lives

export default function RootLayout({ children }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setShowSplash(true);
    setTimeout(() => setShowSplash(false), 2000);
  }, []);

  return (
    <html lang="en">
      <body>
        {showSplash ? (
          <div className="splash-screen">
            <h1 className="splash-title">🔹 DSM - Agent Web Services 🔹</h1>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
