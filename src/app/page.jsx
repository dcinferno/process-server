"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [sections, setSections] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    fetch("/api/sections")
      .then((res) => res.json())
      .then((data) => setSections(data))
      .catch(console.error);
  }, []);

  const togglePanel = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className="main-container">
      <h1>Agent Web Services - DSM</h1>

      <div className="sections-row">
        {sections.map((section, index) => (
          <div key={index} className="section-panel">
            <button
              className="section-header"
              onClick={() => togglePanel(index)}
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
    </main>
  );
}
