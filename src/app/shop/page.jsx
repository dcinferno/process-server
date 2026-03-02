"use client";

import Link from "next/link";

const PRODUCTS = [
  {
    id: "affidavit-template-pack",
    name: "Affidavit of Service Template Pack",
    description:
      "Five pre-formatted, court-ready Iowa affidavit of service forms. Covers personal service, substituted service, certified mail, and non-service returns. Instantly downloadable PDF and Word formats.",
    price: 10,
    badge: null,
  },
  {
    id: "iowa-process-serving-guide",
    name: "Iowa Process Serving Reference Guide",
    description:
      "A comprehensive 28-page reference guide covering Iowa Rules of Civil Procedure as they relate to service of process. Includes statutes, timelines, county courthouse contacts, and common pitfalls.",
    price: 20,
    badge: "Popular",
  },
  {
    id: "skip-tracing-checklist",
    name: "Skip Tracing Checklist for Process Servers",
    description:
      "A professional checklist and workflow guide for locating evasive subjects. Covers public records searches, social media verification, DMV lookups, and documentation best practices.",
    price: 25,
    badge: null,
  },
  {
    id: "iowa-court-forms-collection",
    name: "Iowa Court Forms Collection",
    description:
      "A curated bundle of 12 commonly used Iowa district court forms, including summons templates, motion forms, and filing checklists for Polk, Dallas, and Warren counties.",
    price: 35,
    badge: "Best Value",
  },
  {
    id: "professional-ps-toolkit",
    name: "Professional Process Server Toolkit",
    description:
      "Everything you need to run a compliant process serving operation in Iowa — affidavit templates, reference guide, skip tracing checklist, court forms collection, and a billing rate worksheet.",
    price: 50,
    badge: "Bundle",
  },
];

export default function ShopPage() {
  return (
    <main className="shop-container">
      <div className="shop-header">
        <h1>Digital Resources</h1>
        <p>
          Templates, guides, and reference materials for legal professionals and
          process servers in Iowa. Submit a request for any product and we will
          follow up to complete your order.
        </p>
      </div>

      <div className="product-grid">
        {PRODUCTS.map((product) => (
          <div key={product.id} className="product-card">
            {product.badge && (
              <span className="product-badge">{product.badge}</span>
            )}
            <h2 className="product-name">{product.name}</h2>
            <p className="product-description">{product.description}</p>
            <div className="product-footer">
              <span className="product-price">${product.price}.00</span>
              <Link href="/request">
                <button className="buy-button">Submit Request</button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="shop-note">
        <h3>How It Works</h3>
        <p>
          Submit a request with your contact information and the product you are
          interested in. We will reach out shortly to confirm your order and
          process payment. Digital files are delivered by email upon completion.
        </p>
      </div>
    </main>
  );
}
