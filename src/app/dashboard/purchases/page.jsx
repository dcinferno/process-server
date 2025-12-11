{
  /* FILTER */
}
<div className="mb-6 flex flex-wrap gap-3">
  {/* CREATOR FILTER */}
  <input
    placeholder="Filter by creator name..."
    value={creatorFilter}
    onChange={(e) => setCreatorFilter(e.target.value)}
    className="border rounded px-3 py-2 w-full sm:w-64 text-black bg-white"
  />

  {/* FROM DATE */}
  <input
    type="date"
    value={fromDate}
    onChange={(e) => setFromDate(e.target.value)}
    className="border rounded px-3 py-2 text-black bg-white"
  />

  {/* TO DATE */}
  <input
    type="date"
    value={toDate}
    onChange={(e) => setToDate(e.target.value)}
    className="border rounded px-3 py-2 text-black bg-white"
  />

  <button
    onClick={() => fetchPurchases()}
    className="bg-blue-600 text-white px-4 py-2 rounded"
  >
    Refresh
  </button>
</div>;
