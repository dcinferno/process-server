"use client";

import { useEffect, useState } from "react";

function Stat({ label, value }) {
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

export default function PurchasesDashboard() {
  const [totals, setTotals] = useState({ revenue: 0, count: 0 });

  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [creatorFilter, setCreatorFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selected, setSelected] = useState(null);
  const [creators, setCreators] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const totalRevenue = purchases.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  const totalPayout = totalRevenue * 0.9;

  const avgOrder = purchases.length > 0 ? totalRevenue / purchases.length : 0;

  const fetchPurchases = async () => {
    setLoading(true);

    let url = "/api/purchases";
    const params = [];

    // FILTERS
    if (creatorFilter.trim()) {
      params.push(`creator=${encodeURIComponent(creatorFilter.trim())}`);
    }
    if (fromDate) params.push(`from=${fromDate}`);
    if (toDate) params.push(`to=${toDate}`);

    // PAGINATION
    params.push(`page=${page}`);
    params.push(`limit=20`);

    if (params.length > 0) {
      url += "?" + params.join("&");
    }

    const res = await fetch(url);
    const data = await res.json();

    setPurchases(data.purchases);
    setTotalPages(data.totalPages || 1);
    setTotals(data.totals || { revenue: 0, count: 0 });
    setLoading(false);
  };
  useEffect(() => {
    const unique = Array.from(
      new Set(purchases.map((p) => p.creatorName).filter(Boolean))
    ).sort();

    setCreators(unique);
  }, [purchases]);
  // Refresh data when filters OR page changes
  useEffect(() => {
    fetchPurchases();
  }, [creatorFilter, fromDate, toDate, page]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [creatorFilter, fromDate, toDate]);

  return (
    <div className="p-4 max-w-4xl mx-auto text-black bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Sales Dashboard</h1>
      {/* SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Stat label="Revenue" value={`$${totalRevenue.toFixed(2)}`} />
        <Stat label="Payout" value={`$${totalPayout.toFixed(2)}`} />
        <Stat label="Sales" value={purchases.length} />
        <Stat label="Avg Order" value={`$${avgOrder.toFixed(2)}`} />
      </div>

      {/* FILTERS */}
      <div className="mb-6 flex gap-3 flex-wrap items-center">
        <select
          value={creatorFilter}
          onChange={(e) => setCreatorFilter(e.target.value)}
          className="border rounded px-3 py-2 w-full sm:w-64 bg-white text-black"
        >
          <option value="">All creators</option>

          {creators.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border rounded px-3 py-2 bg-white text-black"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border rounded px-3 py-2 bg-white text-black"
        />

        <button
          onClick={() => fetchPurchases()}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Refresh
        </button>
      </div>

      {/* LOADING */}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden sm:block">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-3">Video</th>
                    <th className="p-3">Creator</th>
                    <th className="p-3">Buyer Email</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Payout</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr
                      key={p._id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelected(p)}
                    >
                      <td className="p-3">{p.videoTitle}</td>
                      <td className="p-3">{p.creatorName}</td>
                      <td className="p-3">{p.email}</td>
                      <td className="p-3">${p.amount?.toFixed(2)}</td>
                      <td className="p-3">${(p.amount * 0.9).toFixed(2)}</td>
                      <td className="p-3">
                        {new Date(p.purchasedAt || p.paidAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {purchases.length === 0 && (
                <p className="p-4 text-center text-gray-500">
                  No purchases found.
                </p>
              )}
            </div>
          </div>

          {/* MOBILE CARDS */}
          <div className="sm:hidden space-y-3">
            {purchases.map((p) => (
              <div
                key={p._id}
                onClick={() => setSelected(p)}
                className="border rounded-lg p-4 shadow bg-white cursor-pointer"
              >
                <div className="font-semibold text-lg">{p.videoTitle}</div>
                <div className="text-sm text-gray-600">{p.creatorName}</div>

                <div className="mt-2 text-blue-600 font-bold">
                  ${p.amount?.toFixed(2)}
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  {new Date(p.purchasedAt || p.paidAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className={`px-4 py-2 rounded border ${
                page === 1
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              ← Prev
            </button>

            <span className="font-medium">
              Page {page} / {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className={`px-4 py-2 rounded border ${
                page === totalPages
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              Next →
            </button>
          </div>
        </>
      )}

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-2 right-2 text-gray-600 text-xl"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">{selected.videoTitle}</h2>

            <div className="space-y-2 text-sm">
              <p>
                <strong>Creator:</strong> {selected.creatorName}
              </p>
              <p>
                <strong>Buyer Email:</strong> {selected.email}
              </p>
              <p>
                <strong>Amount:</strong> ${selected.amount?.toFixed(2)}
              </p>
              <p>
                <strong>Payout:</strong> ${(selected.amount * 0.9).toFixed(2)}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(selected.purchasedAt).toLocaleString()}
              </p>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="mt-6 w-full bg-blue-600 text-white py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
