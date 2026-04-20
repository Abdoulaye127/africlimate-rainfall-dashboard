import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell, LineChart, Line } from 'recharts';
import { Search, Filter, TrendingUp, MapPin, Download, BarChart3, AlertCircle, Moon, Sun } from 'lucide-react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import Switch from "react-switch";
import chroma from 'chroma-js';
import html2canvas from 'html2canvas';
import 'leaflet/dist/leaflet.css';
import Header from './components/Header';
import Footer from './components/Footer';

const ROWS_PER_PAGE = 5;
const PRODUCT_COLORS = chroma.scale(['#2E8BFD','#09E5B6','#FEBA00','#FE767A','#B07FFF']).colors(20);

function useDarkMode() {
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return [dark, setDark];
}

function exportPngFromRef(ref, filename='chart.png') {
  if (ref.current) {
    html2canvas(ref.current, {backgroundColor:null, useCORS:true, scale:2})
      .then(canvas => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL();
        link.click();
      });
  }
}

export default function App() {
  const [data, setData] = useState([]);
  const [geoData, setGeoData] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState(['CC']);
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tablePage, setTablePage] = useState(0);
  const [darkMode, setDarkMode] = useDarkMode();

  const productBarRef = useRef();
  const countryBarRef = useRef();
  const mapRef = useRef();

  // initial CSV load
  useEffect(() => {
    const loadCSV = async () => {
      try {
        setLoading(true); setError(null);
        const response = await fetch('/data/Systematic_Review.csv');
        if (!response.ok) throw new Error('CSV file not found at /data/Systematic_Review.csv');
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) throw new Error('CSV file is empty or invalid');
        const headers = lines[0].includes('\t') ? lines[0].split('\t').map(h => h.trim()) : lines[0].split(',').map(h => h.trim());
        const parsed = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const values = line.includes('\t') ? line.split('\t') : line.split(',');
          const row = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx]?.trim().replace(/^"|"$/g, '') || '';
          });
          const location = row.Location || '';
          let country = 'Unknown';
          const countries = ['Ethiopia', 'Ghana', 'Uganda', 'Burkina Faso', 'Kenya', 'Tanzania', 'Niger', 'Nigeria', 'Sudan', 'South Africa', 'Zambia', 'Zimbabwe', 'Tunisia', 'Algeria', 'Benin', 'Djibouti', 'Mali', 'Senegal', 'Congo', 'Gabon', 'Cameroon', 'Rwanda', 'Burundi', 'Somalia', 'Mozambique', 'Angola', 'Chad', 'Madagascar', 'Namibia', 'Botswana', 'Malawi'];
          for (const c of countries) { if (location.includes(c)) { country = c; break; } }
          if (location.toLowerCase().includes('africa') && country === 'Unknown') country = 'Regional';
          const valueStr = row.Value || '0';
          const value = parseFloat(valueStr.replace(/[^\d.-]/g, ''));
          if (row.Product && row.Metric && !isNaN(value)) {
            parsed.push({
              PaperId: row['Paper ID'] || '',
              Location: row.Location || '',
              Product: row.Product.trim(),
              Metric: row.Metric.trim(),
              Value: value,
              Country: country,
              Comment: row.Comment || '',
              // For line charts/time series:
              Year: row.Year ? Number(row.Year) : null
            });
          }
        }
        if (parsed.length === 0) throw new Error('No valid data found in CSV file');
        setData(parsed);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    loadCSV();
  }, []);

  // load geojson map
  useEffect(() => {
    const loadGeoJSON = async () => {
      try {
        const response = await fetch('/data/africa_country.geojson');
        if (response.ok) {
          const geoJson = await response.json();
          setGeoData(geoJson);
        }
      } catch {}
    };
    loadGeoJSON();
  }, []);

  // Available metrics (from data)
  const availableMetrics = useMemo(() => [...new Set(data.map(d => d.Metric))].filter(Boolean).sort(), [data]);
  const uniqueProducts = useMemo(() => ['All', ...Array.from(new Set(data.map(d => d.Product)).values()).filter(Boolean).sort()], [data]);
  const uniqueCountries = useMemo(() => ['All', ...Array.from(new Set(data.map(d => d.Country)).values()).filter(Boolean).sort()], [data]);

  // Filtering
  const filteredData = useMemo(() => {
    return data.filter(d => {
      const matchesMetrics = selectedMetrics.length === 0 || selectedMetrics.includes(d.Metric);
      const matchesProduct = selectedProduct === 'All' || d.Product === selectedProduct;
      const matchesCountry = selectedCountry === 'All' || d.Country === selectedCountry;
      const matchesSearch =
        d.Product?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.Location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.Country?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesMetrics && matchesProduct && matchesCountry && matchesSearch;
    });
  }, [data, selectedMetrics, selectedProduct, selectedCountry, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
  const currentTableRows = filteredData.slice(tablePage * ROWS_PER_PAGE, (tablePage + 1) * ROWS_PER_PAGE);

  useEffect(() => { setTablePage(0); }, [filteredData, selectedMetrics, selectedProduct, selectedCountry, searchQuery]);

  // Top 10 products: allow multi-metric overlays
  const top10Products = useMemo(() => {
    // averages per product, per selected metric
    const stats = {};
    selectedMetrics.forEach(metric => {
      data.filter(d => d.Metric === metric).forEach(d => {
        if (!stats[d.Product]) stats[d.Product] = { };
        if (!stats[d.Product][metric]) stats[d.Product][metric] = {sum:0, count:0};
        stats[d.Product][metric].sum += d.Value;
        stats[d.Product][metric].count += 1;
      });
    });
    // just top products by first selected metric
    const products = Object.keys(stats);
    const firstMetric = selectedMetrics[0];
    const lowerIsBetter = ['RMSE', 'MAE', 'FAR'].includes(firstMetric);
    const ranked = products.map(p => ({
      product: p,
      ...Object.fromEntries(selectedMetrics.map(m=>[
        m, stats[p][m] ? stats[p][m].sum / stats[p][m].count : null
      ]))
    })).sort((a, b) => lowerIsBetter ?
      (a[firstMetric] ?? Infinity) - (b[firstMetric] ?? Infinity) :
      (b[firstMetric] ?? -Infinity) - (a[firstMetric] ?? -Infinity)
    );
    return ranked.slice(0, 10);
  }, [data, selectedMetrics]);

  // Country stat average for current metrics, for map/chart drilldown
  const countryStats = useMemo(() => {
    const stats = {};
    selectedMetrics.forEach(metric => {
      data.filter(d => d.Metric === metric).forEach(d => {
        if (!stats[d.Country]) stats[d.Country] = {};
        if (!stats[d.Country][metric]) stats[d.Country][metric] = {sum:0, count:0};
        stats[d.Country][metric].sum += d.Value;
        stats[d.Country][metric].count += 1;
      });
    });
    return Object.entries(stats).map(([country, v]) => ({
      country,
      ...Object.fromEntries(selectedMetrics.map(m=>[
        m, v[m] ? v[m].sum / v[m].count : null
      ])),
      count: Object.values(v)[0]?.count || 0
    })).sort((a, b)=>b.count-a.count).slice(0, 15);
  }, [data, selectedMetrics]);

  // Map coloring for metric
  const countryValueMap = useMemo(() => {
    let dict = {};
    countryStats.forEach(stat => {
      dict[stat.country] = stat[selectedMetrics[0]];
    });
    return dict;
  }, [countryStats, selectedMetrics]);

  const mapColorScale = useMemo(() => {
    const vals = Object.values(countryValueMap).filter(v => v != null);
    if (!vals.length) return chroma.scale(['#f1f5f9','#0284c7','#facc15','#ef4444']).domain([0,1]);
    const domain = [Math.min(...vals), Math.max(...vals)];
    return chroma.scale(['#dbeafe','#1e40af','#facc15','#f87171']).domain(domain);
  }, [countryValueMap]);

  // Chart/Map click drilldown
  const handleProductBarClick = prod => {
    if (!prod) return;
    setSelectedProduct(prod === selectedProduct ? 'All' : prod);
  };
  const handleCountryBarClick = ctry => {
    if (!ctry) return;
    setSelectedCountry(ctry === selectedCountry ? 'All' : ctry);
  };

  // Download CSV
  const downloadCSV = () => {
    const headers = 'Paper ID,Location,Product,Metric,Value,Country\n';
    const csv = headers + filteredData.map(d =>
      `${d.PaperId},"${d.Location}",${d.Product},${d.Metric},${d.Value},${d.Country}`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rainfall_data_${selectedMetrics.join('_')}_${Date.now()}.csv`;
    a.click();
  };

  // Multi-metric selection
  const handleMetricChange = m => {
    setSelectedMetrics(metrics =>
      metrics.includes(m)
        ? metrics.length === 1 ? metrics : metrics.filter(mm=>mm!==m)
        : [...metrics, m]
    );
  };

  // Accessibility: add aria-labels, focus, higher color contrast for dark
  // -- Charts and controls in this layout are naturally accessible,
  // -- add aria-labels as needed in control elements below

  if (loading)
    return (<div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <BarChart3 className="text-blue-700 animate-spin" size={48} aria-label="Loading spinner" />
    </div>);
  if (error)
    return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg"><AlertCircle size={40} className="text-red-400" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Data</h2>
        <p className="text-gray-800 mb-4">{error}</p>
      </div>
    </div>);
  return (
    <div className={darkMode ? 'dark min-h-screen flex flex-col' : 'min-h-screen flex flex-col'}>
      <Header />
      <main className={`max-w-7xl mx-auto px-4 py-8 flex-1 w-full ${darkMode ? 'bg-gradient-to-br from-gray-900 to-blue-900 text-white' : 'bg-gradient-to-br from-gray-50 to-blue-50 text-gray-900'}`}>
        {/* Title, Theme Toggle */}
        <div className="flex justify-between items-center mb-7">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Rainfall Products Performance Dashboard
            </h1>
            <p className={darkMode ? "text-blue-200" : "text-blue-800"}>
              Africa Region – Systematic Review Analysis
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg">{darkMode ? <Moon /> : <Sun />}</span>
            <Switch
              aria-label="Toggle dark mode"
              onChange={()=>setDarkMode(dark=>!dark)}
              checked={darkMode}
              uncheckedIcon={false}
              checkedIcon={false}
              onColor="#1e293b"
              offColor="#bae6fd"
              offHandleColor="#2563eb"
              onHandleColor="#fde68a"
              height={22}
              width={44}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className={`rounded-xl p-6 shadow-lg border-l-4 font-semibold ${darkMode ? 'bg-gray-800 border-blue-500 text-blue-300' : 'bg-white border-blue-500 text-blue-600'}`}>Total Records<div className="text-3xl font-bold">{data.length}</div></div>
          <div className={`rounded-xl p-6 shadow-lg border-l-4 font-semibold ${darkMode ? 'bg-gray-800 border-green-500 text-green-200' : 'bg-white border-green-500 text-green-600'}`}>Products<div className="text-3xl font-bold">{uniqueProducts.length - 1}</div></div>
          <div className={`rounded-xl p-6 shadow-lg border-l-4 font-semibold ${darkMode ? 'bg-gray-800 border-purple-500 text-purple-200' : 'bg-white border-purple-500 text-purple-600'}`}>Countries<div className="text-3xl font-bold">{uniqueCountries.length - 1}</div></div>
          <div className={`rounded-xl p-6 shadow-lg border-l-4 font-semibold ${darkMode ? 'bg-gray-800 border-orange-500 text-orange-200' : 'bg-white border-orange-500 text-orange-500'}`}>Filtered<div className="text-3xl font-bold">{filteredData.length}</div></div>
          <div className={`rounded-xl p-6 shadow-lg border-l-4 font-semibold ${darkMode ? 'bg-gray-800 border-pink-500 text-pink-200' : 'bg-white border-pink-500 text-pink-600'}`}>Metric<div className="text-3xl font-bold">{selectedMetrics.join(', ')}</div></div>
        </div>

        {/* Filters, multi-metric custom controls */}
        <div className={`rounded-xl shadow-lg p-6 mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2"><Filter className={darkMode ? 'text-teal-300' : 'text-blue-600'} size={22}/><h2 className="font-extrabold text-lg">Filters & Compare Metrics</h2></div>
            <button onClick={downloadCSV} className={`flex items-center gap-1 px-4 py-2 rounded-lg shadow ${darkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-900'}`}>
              <Download size={19}/> Export Data
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Performance Metrics</label>
              <div className="flex flex-wrap gap-2">
              {availableMetrics.map(m=>(
                <button
                  key={m}
                  type="button"
                  onClick={()=>handleMetricChange(m)}
                  className={`px-3 py-1 rounded-full font-bold transition border-2 text-xs
                    ${selectedMetrics.includes(m)
                      ? 'bg-blue-600 border-blue-700 text-white shadow'
                      : 'bg-blue-50 border-blue-200 text-blue-700'}
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400`}
                  aria-pressed={selectedMetrics.includes(m)}>
                  {m}
                </button>
              ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Product</label>
              <select value={selectedProduct} aria-label="Select Product" onChange={e=>setSelectedProduct(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                {uniqueProducts.map((p)=>(<option key={p}>{p}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Country/Region</label>
              <select value={selectedCountry} aria-label="Select Country" onChange={e=>setSelectedCountry(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                {uniqueCountries.map((c)=>(<option key={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Search</label>
              <div className="relative">
                <input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                  placeholder="Search products, locations..." aria-label="Search" className="w-full pl-10 p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition"/>
                <Search className="absolute left-3 top-3.5 text-gray-400" size={18}/>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-center mt-6">
            <button onClick={()=>setShowMap(!showMap)} className={`flex items-center gap-2 px-5 py-2.5 rounded transition shadow ${showMap ? (darkMode ? 'bg-teal-700 text-white' : 'bg-purple-700 text-white') : (darkMode ? 'bg-blue-700 text-teal-200' : 'bg-purple-100 text-blue-700')}`}>
              <MapPin size={17}/>{showMap ? 'Hide Map' : 'Show Map'}
            </button>
          </div>
        </div>

        {/* Map Section */}
        {showMap && geoData && (
          <div className={`rounded-xl shadow-lg p-6 mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><MapPin className="text-indigo-600" size={22}/>
              Interactive Map – {selectedMetrics.join(', ')}
              <button onClick={()=>exportPngFromRef(mapRef, 'africlimate_map.png')}
                className="ml-4 px-3 py-1.5 bg-blue-200 hover:bg-blue-400 rounded-full text-xs transition font-bold text-blue-800">
                Save as PNG
              </button>
            </h2>
            <div className="rounded-lg overflow-hidden border-2 border-indigo-200" style={{height:'350px'}} ref={mapRef}>
              <MapContainer attributionControl={!darkMode}
                style={{ height: "100%", width:"100%" }}
                bounds={[[-35, -20], [38, 55]]} zoom={3} center={[8, 20]} scrollWheelZoom={true}>
                <TileLayer attribution="© OpenStreetMap contributors"
                  url={darkMode
                    ? "https://tiles.stadiamaps.com/tiles/alidade_dark/{z}/{x}/{y}{r}.png"
                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                />
                <GeoJSON data={geoData} style={feature => {
                  const avg = countryValueMap[feature.properties.ADMIN] ?? null;
                  const fill = avg==null ? "#f3f4f6" : mapColorScale(avg).hex();
                  return { fillColor: fill, weight: 1.5, color: "#2563eb", fillOpacity: 0.7 };
                }}
                onEachFeature={(feature, layer) => {
                  const cname = feature.properties.ADMIN;
                  const avg = countryValueMap[cname];
                  let content = `<b style='font-size:1.1em'>${cname}</b>`;
                  selectedMetrics.forEach(m=>{
                    content+=`<br/>${m}: <span style='font-weight:bold; font-size:1.2em; color:#1d4ed8;'>${avg!==undefined?avg.toFixed(2):'No data'}</span>`;
                  });
                  layer.bindTooltip(content, {sticky:true, direction:"auto"});
                  layer.on('click', ()=>handleCountryBarClick(cname));
                }}
                />
              </MapContainer>
            </div>
          </div>
        )}

        {/* Chart/Bar Section (Top Products) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top 10 Products: multi-metric horizontal bar chart */}
          <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-blue-600" size={21}/>
              <h2 className="font-bold text-lg">Top 10 Products - {selectedMetrics.join(', ')}</h2>
              <button onClick={()=>exportPngFromRef(productBarRef, 'top10product.png')}
                className="ml-4 px-3 py-1.5 bg-blue-200 hover:bg-blue-400 rounded-full text-xs transition font-bold text-blue-800">
                Save as PNG
              </button>
            </div>
            <div ref={productBarRef}>
              <ResponsiveContainer width="100%" height={390}>
                <BarChart
                  data={top10Products}
                  layout="vertical"
                  margin={{ left: 100, right: 30, top:20, bottom:20 }}
                  barCategoryGap="20%"
                >
                  <XAxis type="number" stroke={darkMode?"#babffc":"#475569"}/>
                  <YAxis type="category" dataKey="product" width={115} tick={{fontSize:14, fill:"#0ea5e9"}}/>
                  <Legend/>
                  <Tooltip cursor={{fill:darkMode?"#222": "#e0e7ef"}} contentStyle={{borderRadius:"9px"}}/>
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
                        <Cell key={baridx} fill={PRODUCT_COLORS[(baridx+idx)%PRODUCT_COLORS.length]} />
                      ))}
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Country Distribution: multi-metric vertical bar chart */}
          <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-green-600" size={21} />
              <h2 className="font-bold text-lg">Country Data Distribution ({selectedMetrics.join(', ')})</h2>
              <button onClick={()=>exportPngFromRef(countryBarRef, 'countrydist.png')}
                className="ml-4 px-3 py-1.5 bg-teal-200 hover:bg-teal-400 rounded-full text-xs transition font-bold text-teal-800">
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
                  <XAxis type="number" stroke={darkMode?"#babffc":"#475569"} />
                  <YAxis dataKey="country" type="category" width={110} tick={{ fontSize:13, fill:"#059669" }}/>
                  <Legend />
                  <Tooltip cursor={{fill:darkMode?"#222": "#fefce8"}} />
                  {selectedMetrics.map((m, idx)=>(
                    <Bar
                      key={m}
                      dataKey={m}
                      name={m}
                      isAnimationActive={true}
                      onClick={bar => handleCountryBarClick(bar.country)}
                    >
                      {countryStats.map((c, baridx)=>
                        <Cell key={c.country} fill={chroma.scale(['#67e8f9','#3b82f6','#fb7185','#f59e42'])(baridx/countryStats.length).hex()} />)}
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Data table paginated */}
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
      </main>
      <Footer />
    </div>
  );
}
