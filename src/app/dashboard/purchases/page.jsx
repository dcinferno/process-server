"use client";

import { useEffect, useState } from "react";

export default function PurchasesDashboard() {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [creatorFilter, setCreatorFilter] = useState("");

  const fetchPurchases = async () => {
    setLoading(true);
    let url = "/api/purchases";

    if (creatorFilter.trim()) {
      url += `?creator=${encodeURIComponent(creatorFilter.trim())}`;
    }

    const res = await fetch(url);
    const data = await res.json();
    setPurchases(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPurchases();
  }, [creatorFilter]);

  return (
    <div className="p-6 max-w-4xl mx-auto text-black bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Sales Dashboard</h1>

      {/* FILTER */}
      <div className="mb-6 flex gap-3">
        <input
          placeholder="Filter by creator name..."
          value={creatorFilter}
          onChange={(e) => setCreatorFilter(e.target.value)}
          className="border rounded px-3 py-2 w-64 text-black bg-white"
        />
        <button
          onClick={() => fetchPurchases()}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden text-black">
          <table className="w-full text-left text-black">
            <thead className="bg-gray-100 border-b text-black">
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
                <tr key={p._id} className="border-b">
                  <td className="p-3">{p.videoTitle}</td>
                  <td className="p-3">{p.creatorName}</td>
                  <td className="p-3">{p.email}</td>
                  <td className="p-3">${p?.amount?.toFixed(2) ?? "Unknown"}</td>
                  <td className="p-3">
                    {p?.amount?.toFixed(2) * 0.9 ?? "Unknown"}
                  </td>
                  <td className="p-3">
                    {new Date(p.purchasedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {purchases.length === 0 && (
            <p className="p-4 text-center text-gray-500">No purchases found.</p>
          )}
        </div>
      )}
    </div>
  );
}
