export default function RainfallTable({ currentTableRows, filteredData, tablePage, totalPages, setTablePage, selectedMetrics, darkMode }) {
  return (
    <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-lg">Detailed Data ({filteredData.length} records)</h2>
        <span className={`px-4 py-2 bg-blue-200 text-blue-700 rounded-full text-sm font-semibold ${darkMode && "bg-blue-800 text-blue-100"}`}>{selectedMetrics.join(', ')}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Country</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Location</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Metric</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentTableRows.map((row, idx) => (
              <tr key={idx} tabIndex={0} aria-label={`Row ${idx+1} ${row.Metric} ${row.Value}`}>
                <td className="px-4 py-3"><span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs font-semibold">{row.Country}</span></td>
                <td className="px-4 py-3 text-sm">{row.Location}</td>
                <td className="px-4 py-3 text-sm font-semibold text-blue-600">{row.Product}</td>
                <td className="px-4 py-3 text-sm">{row.Metric}</td>
                <td className="px-4 py-3 text-sm font-bold">{row.Value.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center mt-3">
          <button aria-label="Previous Table Page" onClick={() => setTablePage(p => Math.max(0, p - 1))} disabled={tablePage===0}
            className={`px-4 py-2 mr-2 rounded ${tablePage===0 ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 text-white'}`}>Previous</button>
          <div className="text-sm">{`Page ${tablePage+1} of ${totalPages}`}</div>
          <button aria-label="Next Table Page" onClick={() => setTablePage(p => Math.min(totalPages-1, p+1))} disabled={tablePage>=totalPages-1}
            className={`px-4 py-2 ml-2 rounded ${tablePage>=totalPages-1 ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 text-white'}`}>Next</button>
        </div>
      </div>
    </div>
  );
}
