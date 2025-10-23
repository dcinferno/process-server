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
    fetch("/api/sections")
      .then((res) => res.json())
      .then((data) => {
        setSections(data);
        setIsDataLoaded(true);
      })
      .catch((err) => {
        console.error(err);
        setIsDataLoaded(true);
      });

    const timer = setTimeout(() => {
      setIsTimerDone(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const loading = !isDataLoaded || !isTimerDone;
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <h1 className="text-3xl font-bold">🔹 DSM - Agent Web Services 🔹</h1>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50 p-6 max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-2 text-center">
          Agent Web Services - DSM
        </h1>
        <h2 className="text-center text-lg mb-8 text-gray-700">
          Your Trusted Partner for Process Serving in Greater Des Moines Area
        </h2>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={index} className="border rounded shadow-sm bg-white">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left px-4 py-3 flex justify-between items-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {section.title}
                <span
                  className={`transform transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                >
                  &#9660;
                </span>
              </button>

              {openIndex === index && (
                <div
                  className="px-4 py-3 border-t text-gray-800"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link href="/request">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded shadow transition">
              Request Services
            </button>
          </Link>
        </div>
      </main>

      {/* Process Server Login Button + Tooltip */}

      <div
        className="
          static mx-auto my-8 w-max bg-blue-600 text-white p-3 rounded-full shadow-lg cursor-pointer
          flex items-center justify-center space-x-2
          md:fixed md:bottom-6 md:right-6 md:my-0 md:w-auto md:rounded-full md:p-3
          md:shadow-lg
          max-w-xs
        "
        onClick={() => router.push("/process-server")}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Process Server Login"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ")
            router.push("/process-server");
        }}
      >
        <FaUserShield size={24} />
        {/* Show text only on md+ */}
        <span className="hidden md:inline font-semibold ml-2">
          Process Server Login
        </span>
      </div>

      {showTooltip && (
        <div
          role="tooltip"
          className="
            static mx-auto mb-6 text-center text-xs bg-gray-900 text-white px-3 py-1 rounded shadow-lg
            md:fixed md:bottom-16 md:right-6 md:mx-0
          "
        >
          Process Server Login
        </div>
      )}
    </>
  );
}
