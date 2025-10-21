"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [sections, setSections] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isTimerDone, setIsTimerDone] = useState(false);
  useEffect(() => {
    // Fetch data
    fetch("/api/sections")
      .then((res) => res.json())
      .then((data) => {
        setSections(data);
        setIsDataLoaded(true);
      })
      .catch((err) => {
        console.error(err);
        setIsDataLoaded(true); // still proceed even if there's an error
      });

    // Minimum splash screen duration
    const timer = setTimeout(() => {
      setIsTimerDone(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const loading = !isDataLoaded || !isTimerDone;
  if (loading) {
    return (
      <div className="splash-screen">
        <h1 className="splash-title">🔹 DSM - Agent Web Services 🔹</h1>
      </div>
    );
  }

  return (
    <main className="main-container">
      <div className={"page-content"}>
        <h1>Agent Web Services - DSM</h1>
        <h2>Your Trusted Partner for Process Serving</h2>
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
