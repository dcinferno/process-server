"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [sections, setSections] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); // Toggle form visibility
  const [slidePage, setSlidePage] = useState(false); // Trigger page sliding effect

  useEffect(() => {
    fetch("/api/sections")
      .then((res) => res.json())
      .then((data) => {
        setSections(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Scroll to the form when it is shown
  useEffect(() => {
    if (showForm) {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
      setSlidePage(true); // Trigger the page slide effect
    }
  }, [showForm]);

  if (loading) {
    return (
      <div className="splash-screen">
        <h1 className="splash-title">🔹 DSM - Agent Web Services 🔹</h1>
      </div>
    );
  }

  return (
    <main className="main-container">
      <div className={`page-content ${slidePage ? "slide-up" : ""}`}>
        <h1>Agent Web Services - DSM</h1>

        <div className="sections-row">
          {sections.map((section, index) => (
            <div key={index} className="section-panel">
              <button
                className="section-header"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                {section.title}
                <span className={`arrow ${openIndex === index ? "open" : ""}`}>
                  &#9660;
                </span>
              </button>

              {openIndex === index && (
                <div
                  className="section-content"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              )}
            </div>
          ))}
        </div>

        {/* 👉 Show form button */}
        <Link href="/request">
          <button className="request-button">Request Services</button>
        </Link>
      </div>
    </main>
  );
}
