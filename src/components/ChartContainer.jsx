import React, { useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { TrendingUp, MapPin, Download } from "lucide-react";
import chroma from "chroma-js";
import html2canvas from "html2canvas";
import "leaflet/dist/leaflet.css";

const PRODUCT_COLORS = chroma.scale([
  "#2E8BFD",
  "#09E5B6",
  "#FEBA00",
  "#FE767A",
  "#B07FFF"
]).colors(20);

function exportPngFromRef(ref, filename = "chart.png") {
  if (ref.current) {
    html2canvas(ref.current, { backgroundColor: null, useCORS: true, scale: 2 }).then(canvas => {
      const link = document.createElement("a");
      link.download = filename;
      link.href = canvas.toDataURL();
      link.click();
    });
  }
}

export default function ChartContainer({
  data,
  geoData,
  filteredData,
  availableMetrics,
  selectedMetrics,
  handleMetricChange,
  selectedProduct,
  selectedCountry,
  setSelectedProduct,
  setSelectedCountry,
  darkMode,
  showMap,
  setShowMap,
  top10Products,
  countryStats,
  countryValueMap,
  mapColorScale
}) {
  // Chart container refs for PNG export
  const productBarRef = useRef();
  const countryBarRef = useRef();
  const mapRef = useRef();

  // Click handler logic (can be moved out if using a hook)
  const handleProductBarClick = prod => {
    if (!prod) return;
    setSelectedProduct(prod === selectedProduct ? "All" : prod);
  };
  const handleCountryBarClick = ctry => {
    if (!ctry) return;
    setSelectedCountry(ctry === selectedCountry ? "All" : ctry);
  };

  return (
    <>
      {/* Metrics Filter Multi-Select */}
      <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {availableMetrics.map((m, i) => (
          <button
            key={m}
            type="button"
            onClick={() => handleMetricChange(m)}
            className={`px-3 py-1 rounded-full font-bold flex items-center space-x-2 border-2 transition-all text-xs outline-none
              ${selectedMetrics.includes(m)
                ? "bg-gradient-to-r from-blue-600 to-teal-400 border-blue-900 text-white scale-105 drop-shadow"
                : "bg-blue-50 border-blue-200 text-blue-700 opacity-80 hover:bg-blue-200 hover:border-blue-400 hover:text-blue-900"
              }
              focus:ring-2 focus:ring-offset-2 focus:ring-blue-400`}
            tabIndex={0}
            aria-pressed={selectedMetrics.includes(m)}
            aria-label={m}
          >
            <span 
              className="inline-block w-3 h-3 rounded-full mr-2"
              style={{ background: PRODUCT_COLORS[i % PRODUCT_COLORS.length], border: "1.5px solid #fff", verticalAlign: "middle" }}
            />
            <span>{m}</span>
            <span className="bg-white text-xs rounded px-2 py-1 ml-2 shadow font-semibold"
              style={{ color: PRODUCT_COLORS[i % PRODUCT_COLORS.length] }}>
              {data.filter(d => d.Metric === m).length}
            </span>
          </button>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top 10 Product Chart */}
        <div className={`rounded-xl shadow-lg p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-blue-600" size={21} />
            <h2 className="font-bold text-lg">Top 10 Products - {selectedMetrics.join(", ")}</h2>
            <button
              onClick={() => exportPngFromRef(productBarRef, "top10product.png")}
              className="ml-4 px-3 py-1.5 bg-blue-200 hover:bg-blue-400 rounded-full text-xs transition font-bold text-blue-800"
            >
              Save as PNG
            </button>
          </div>
          <div ref={productBarRef}>
            <ResponsiveContainer width="100%" height={390}>
              <BarChart
                data={top10Products}
                layout="vertical"
                margin={{ left: 100, right: 30, top: 20, bottom: 20 }}
                barCategoryGap="20%"
              >
                <XAxis type="number" stroke={darkMode ? "#babffc" : "#475569"} />
                <YAxis type="category" dataKey="product" width={115} tick={{ fontSize: 14, fill: "#0ea5e9" }} />
                <Legend />
                <Tooltip cursor={{ fill: darkMode ? "#222" : "#e0e7ef" }} contentStyle={{ borderRadius: "9px" }} />
                {selectedMetrics.map((m, idx) => (
                  <Bar
                    key={m}
                    dataKey={m}
                    name={m}
                    isAnimationActive={true}
                    radius={[0, 8, 8, 0]}
                    onClick={bar => handleProductBarClick(bar.product)}
                  >
                    {top10Products.map((entry, baridx) => (
                      <Cell key={baridx} fill={PRODUCT_COLORS[(baridx + idx) % PRODUCT_COLORS.length]} />
                    ))}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Country Data Distribution Chart */}
        <div className={`rounded-xl shadow-lg p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="text-green-600" size={21} />
            <h2 className="font-bold text-lg">Country Data Distribution ({selectedMetrics.join(", ")})</h2>
            <button
              onClick={() => exportPngFromRef(countryBarRef, "countrydist.png")}
              className="ml-4 px-3 py-1.5 bg-teal-200 hover:bg-teal-400 rounded-full text-xs transition font-bold text-teal-800"
            >
              Save as PNG
            </button>
          </div>
          <div ref={countryBarRef}>
            <ResponsiveContainer width="100%" height={390}>
              <BarChart
                data={countryStats}
                layout="vertical"
                margin={{ left: 100, top: 20, bottom: 20 }}
                barCategoryGap="20%"
              >
                <XAxis type="number" stroke={darkMode ? "#babffc" : "#475569"} />
                <YAxis dataKey="country" type="category" width={110} tick={{ fontSize: 13, fill: "#059669" }} />
                <Legend />
                <Tooltip cursor={{ fill: darkMode ? "#222" : "#fefce8" }} />
                {selectedMetrics.map((m, idx) => (
                  <Bar
                    key={m}
                    dataKey={m}
                    name={m}
                    isAnimationActive={true}
                    onClick={bar => handleCountryBarClick(bar.country)}
                  >
                    {countryStats.map((c, baridx) =>
                      <Cell key={c.country} fill={chroma.scale(['#67e8f9','#3b82f6','#fb7185','#f59e42'])(baridx/countryStats.length).hex()} />
                    )}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Map Section */}
      {showMap && geoData && (
        <div className={`rounded-xl shadow-lg p-6 mb-8 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <MapPin className="text-indigo-600" size={22} />
            Interactive Map – {selectedMetrics.join(", ")}
            <button
              onClick={() => exportPngFromRef(mapRef, "africlimate_map.png")}
              className="ml-4 px-3 py-1.5 bg-blue-200 hover:bg-blue-400 rounded-full text-xs transition font-bold text-blue-800"
            >
              Save as PNG
            </button>
          </h2>
          <div className="rounded-lg overflow-hidden border-2 border-indigo-200" style={{ height: "350px" }} ref={mapRef}>
            <MapContainer
              attributionControl={!darkMode}
              style={{ height: "100%", width: "100%" }}
              bounds={[[-35, -20], [38, 55]]}
              zoom={3}
              center={[8, 20]}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution="© OpenStreetMap contributors"
                url={
                  darkMode
                    ? "https://tiles.stadiamaps.com/tiles/alidade_dark/{z}/{x}/{y}{r}.png"
                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                }
              />
              <GeoJSON
                data={geoData}
                style={feature => {
                  const avg = countryValueMap[feature.properties.ADMIN] ?? null;
                  const fill = avg == null ? "#f3f4f6" : mapColorScale(avg).hex();
                  return { fillColor: fill, weight: 1.5, color: "#2563eb", fillOpacity: 0.7 };
                }}
                onEachFeature={(feature, layer) => {
                  const cname = feature.properties.ADMIN;
                  const avg = countryValueMap[cname];
                  let content = `<b style='font-size:1.1em'>${cname}</b>`;
                  selectedMetrics.forEach(m => {
                    content += `<br/>${m}: <span style='font-weight:bold; font-size:1.2em; color:#1d4ed8;'>${avg !== undefined ? avg.toFixed(2) : 'No data'}</span>`;
                  });
                  layer.bindTooltip(content, { sticky: true, direction: "auto" });
                  layer.on("click", () => handleCountryBarClick(cname));
                }}
              />
            </MapContainer>
          </div>
        </div>
      )}
      {/* Toggle for map - as a button */}
      <div className="flex flex-wrap gap-4 items-center mt-6">
        <button
          onClick={() => setShowMap(!showMap)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded transition shadow ${showMap ? (darkMode ? "bg-teal-700 text-white" : "bg-purple-700 text-white") : (darkMode ? "bg-blue-700 text-teal-200" : "bg-purple-100 text-blue-700")}`}
        >
          <MapPin size={17} />
          {showMap ? "Hide Map" : "Show Map"}
        </button>
      </div>
    </>
  );
}
