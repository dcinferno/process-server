"use client";

import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="site-nav">
          <div className="nav-inner">
            <Link href="/" className="nav-brand">
              DSM Agent Web Services
            </Link>
            <div className="nav-links">
              <Link href="/">Home</Link>
              <Link href="/shop">Resources</Link>
              <Link href="/request">Request Service</Link>
            </div>
          </div>
        </nav>

        <div className="page-wrapper">{children}</div>

        <footer className="site-footer">
          <div className="footer-inner">
            <p className="footer-brand">DSM Agent Web Services</p>
            <p className="footer-tagline">
              Professional Process Serving — Greater Des Moines Area
            </p>
            <div className="footer-links">
              <Link href="/terms">Terms of Service</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/request">Contact Us</Link>
            </div>
            <p className="footer-copy">
              &copy; {new Date().getFullYear()} DSM Agent Web Services. All
              rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
