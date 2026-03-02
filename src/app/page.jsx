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
      <div className="splash-screen">
        <h1 className="splash-title">DSM Agent Web Services</h1>
      </div>
    );
  }

  return (
    <>
      <main className="main-container">
        {/* Hero */}
        <div className="hero-section">
          <h1>Agent Web Services — DSM</h1>
          <h2>
            Your Trusted Partner for Process Serving in the Greater Des Moines
            Area
          </h2>
          <p className="hero-sub">
            Fast, reliable, and court-compliant document delivery for attorneys,
            law firms, and individuals throughout Central Iowa.
          </p>
          <div className="hero-buttons">
            <Link href="/request">
              <button className="request-button">Request Service</button>
            </Link>
            <Link href="/shop">
              <button className="shop-button">Browse Resources</button>
            </Link>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="why-section">
          <h2 className="section-title">Why Choose Us?</h2>
          <div className="why-grid">
            <div className="why-card">
              <span className="why-icon">⚡</span>
              <h3>Same-Day Service</h3>
              <p>Urgent documents served the same day you submit your request.</p>
            </div>
            <div className="why-card">
              <span className="why-icon">📋</span>
              <h3>Court-Ready Affidavits</h3>
              <p>
                All affidavits of service are formatted and filed to Iowa court
                standards.
              </p>
            </div>
            <div className="why-card">
              <span className="why-icon">🗺️</span>
              <h3>Central Iowa Coverage</h3>
              <p>
                Serving Polk, Dallas, Warren, Madison, and surrounding counties.
              </p>
            </div>
            <div className="why-card">
              <span className="why-icon">🔒</span>
              <h3>Secure & Confidential</h3>
              <p>All cases handled with complete discretion and professionalism.</p>
            </div>
          </div>
        </div>

        {/* Services sections from DB */}
        {sections.length > 0 && (
          <div className="services-section">
            <h2 className="section-title">Our Services</h2>
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
          </div>
        )}

        {/* Digital Resources promo */}
        <div className="resources-promo">
          <h2 className="section-title">Digital Resources</h2>
          <p className="resources-sub">
            Templates, guides, and reference materials for legal professionals
            and process servers.
          </p>
          <div className="promo-cards">
            <div className="promo-card">
              <h3>Affidavit Templates</h3>
              <p>Court-ready Iowa affidavit of service forms — from $10</p>
            </div>
            <div className="promo-card">
              <h3>Reference Guides</h3>
              <p>Step-by-step process serving guides for legal pros — from $20</p>
            </div>
            <div className="promo-card">
              <h3>Form Bundles</h3>
              <p>Complete Iowa legal form packages — from $35</p>
            </div>
          </div>
          <Link href="/shop">
            <button className="request-button" style={{ marginTop: "1.5rem" }}>
              View All Resources
            </button>
          </Link>
        </div>

        {/* Pricing Overview */}
        <div className="pricing-section">
          <h2 className="section-title">Service Pricing</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Regular</h3>
              <p className="price">$40</p>
              <p>3–5 business days</p>
              <p>Standard service area</p>
            </div>
            <div className="pricing-card featured">
              <h3>Rush</h3>
              <p className="price">$60</p>
              <p>1–2 business days</p>
              <p>Priority handling</p>
            </div>
            <div className="pricing-card">
              <h3>Same Day</h3>
              <p className="price">$150</p>
              <p>Served today (ASAP)</p>
              <p>Urgent cases</p>
            </div>
          </div>
          <Link href="/request">
            <button className="request-button" style={{ marginTop: "1.5rem" }}>
              Request Service Now
            </button>
          </Link>
        </div>
      </main>

      {/* Process Server Login */}
      <button
        aria-label="Process Server Login"
        onClick={() => router.push("/login?callbackUrl=/process-server")}
        className="
  bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400
  fixed bottom-6 right-6 z-50"
      >
        <FaUserShield size={24} />
      </button>
    </>
  );
}
