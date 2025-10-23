"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaUserShield } from "react-icons/fa";

export default function HomePage() {
  const router = useRouter();
  const [sections, setSections] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isTimerDone, setIsTimerDone] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

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
    <>
      <main className="main-container">
        <div className={"page-content"}>
          <h1>Agent Web Services - DSM</h1>
          <h2>
            Your Trusted Partner for Process Serving in Greater Des Moines Area
          </h2>
          <div className="sections-row">
            {sections.map((section, index) => (
              <div key={index} className="section-panel">
                <button
                  className="section-header"
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                >
                  {section.title}
                  <span
                    className={`arrow ${openIndex === index ? "open" : ""}`}
                  >
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

          {/* Request Services Button */}
          <Link href="/request">
            <button className="request-button">Request Services</button>
          </Link>
        </div>
      </main>

      {/* Process Server Login Button */}
      <button
        aria-label="Process Server Login"
        onClick={() => router.push("/process-server")}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="
          bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400
          fixed bottom-6 right-6 z-50
          md:fixed
          static md:fixed
        "
        // Explanation:
        // On mobile (default): `static` (so it's inline and user scrolls to see it)
        // On md+ screens: `fixed bottom-6 right-6`
      >
        <FaUserShield size={24} />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="
            bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg
            fixed bottom-16 right-6
            md:fixed
            static md:fixed
          "
          role="tooltip"
          style={{ maxWidth: "160px" }}
        >
          Process Server Login
        </div>
      )}
    </>
  );
}
