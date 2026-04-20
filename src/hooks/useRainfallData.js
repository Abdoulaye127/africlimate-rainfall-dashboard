import { useState, useEffect, useMemo, useRef } from "react";
import chroma from "chroma-js";

// Utility: basic CSV parsing
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].includes('\t')
    ? lines[0].split('\t').map(h => h.trim())
    : lines[0].split(',').map(h => h.trim());
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.includes('\t') ? line.split('\t') : line.split(',');
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim().replace(/^"|"$/g, '') || '';
    });
    out.push(row);
  }
  return out;
}

// Utility: consistent color for a metric or value
function getMetricColor(metric, colorList) {
  const index = metric ? metric.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colorList.length : 0;
  return colorList[index];
}

const ROWS_PER_PAGE = 5;
const PRODUCT_COLORS = chroma.scale([
  "#2E8BFD",
  "#09E5B6",
  "#FEBA00",
  "#FE767A",
  "#B07FFF"
]).colors(20);

function useDarkMode() {
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return [dark, setDark];
}

export default function useRainfallData() {
  // Raw data state
  const [data, setData] = useState([]);
  const [geoData, setGeoData] = useState(null);
  // UI/UIX state
  const [selectedMetrics, setSelectedMetrics] = useState(['CC']);
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tablePage, setTablePage] = useState(0);
  const [darkMode, setDarkMode] = useDarkMode();

  // For PNG export of charts/maps
  const productBarRef = useRef();
  const countryBarRef = useRef();
  const mapRef = useRef();

  // DATA LOADING
  useEffect(() => {
    const loadCSV = async () => {
      try {
        setLoading(true); setError(null);
        const response = await fetch('/data/Systematic_Review.csv');
        if (!response.ok) throw new Error('CSV file not found at /data/Systematic_Review.csv');
        const csvText = await response.text();
        // Parse CSV, clean, and compute derived fields
        const pre = parseCSV(csvText);
        const countries = [
          'Ethiopia','Ghana','Uganda','Burkina Faso','Kenya','Tanzania','Niger','Nigeria','Sudan','South Africa','Zambia',
          'Zimbabwe','Tunisia','Algeria','Benin','Djibouti','Mali','Senegal','Congo','Gabon','Cameroon','Rwanda','Burundi',
          'Somalia','Mozambique','Angola','Chad','Madagascar','Namibia','Botswana','Malawi'
        ];
        const parsed = pre.map(row => {
          // Country extraction logic from your code
          let country = 'Unknown';
          let location = row.Location || '';
          for (const c of countries) {
            if (location.includes(c)) { country = c; break; }
          }
          if (location.toLowerCase().includes('africa') && country === 'Unknown') country = 'Regional';
          const valueStr = row.Value || '0';
          const value = parseFloat(valueStr.replace(/[^\d.-]/g, ''));
          return {
            PaperId: row['Paper ID'] || '',
            Location: row.Location || '',
            Product: row.Product ? row.Product.trim() : '',
            Metric: row.Metric ? row.Metric.trim() : '',
            Value: value,
            Country: country,
            Comment: row.Comment || '',
            Year: row.Year ? Number(row.Year) : null
          };
        }).filter(row => row.Product && row.Metric && !isNaN(row.Value));
        if (parsed.length === 0) throw new Error('No valid data found in CSV file');
        setData(parsed);
        setLoading(false);
      } catch (err) {
        setError(err.message); setLoading(false);
      }
    };
    loadCSV();
  }, []);

  useEffect(() => {
    const loadGeoJSON = async () => {
      try {
        const response = await fetch('/data/africa_country.geojson');
        if (response.ok) {
          const geoJson = await response.json();
          setGeoData(geoJson);
        }
      } catch(e){}
    };
    loadGeoJSON();
  }, []);

  // FILTER & METRIC/PRODUCT/COUNTRY SETUP
  const availableMetrics = useMemo(()=>{
    return [...new Set(data.map(d => d.Metric))].filter(Boolean).sort();
  },[data]);

  const uniqueProducts = useMemo(() => ['All', ...Array.from(new Set(data.map(d => d.Product)).values()).filter(Boolean).sort()], [data]);

  const uniqueCountries = useMemo(() => ['All', ...Array.from(new Set(data.map(d => d.Country)).values()).filter(Boolean).sort()], [data]);

  // FILTERED DATA
  const filteredData = useMemo(() =>
    data.filter(d =>
      (selectedMetrics.length === 0 || selectedMetrics.includes(d.Metric)) &&
      (selectedProduct === 'All' || d.Product === selectedProduct) &&
      (selectedCountry === 'All' || d.Country === selectedCountry) &&
      (d.Product?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.Location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.Country?.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [data, selectedMetrics, selectedProduct, selectedCountry, searchQuery]
  );

  // PAGINATION
  const totalPages = useMemo(()=>Math.ceil(filteredData.length / ROWS_PER_PAGE),[filteredData]);
  const currentTableRows = useMemo(()=>filteredData.slice(tablePage * ROWS_PER_PAGE, (tablePage + 1) * ROWS_PER_PAGE), [filteredData, tablePage]);
  useEffect(() => { setTablePage(0); }, [filteredData, selectedMetrics, selectedProduct, selectedCountry, searchQuery]);

  // MULTI-METRIC PRODUCT RANKING (CHARTS)
  const top10Products = useMemo(()=> {
    const stats = {};
    selectedMetrics.forEach(metric =>
      data.filter(d=>d.Metric===metric).forEach(d => {
        if (!stats[d.Product]) stats[d.Product] = {};
        if (!stats[d.Product][metric]) stats[d.Product][metric] = { sum:0, count:0 };
        stats[d.Product][metric].sum += d.Value;
        stats[d.Product][metric].count += 1;
      })
    );
    const products = Object.keys(stats);
    const firstMetric = selectedMetrics[0];
    const lowerIsBetter = ['RMSE', 'MAE', 'FAR'].includes(firstMetric);
    const ranked = products.map(p => ({
      product: p,
      ...Object.fromEntries(selectedMetrics.map(m =>
        [m, stats[p][m] ? stats[p][m].sum / stats[p][m].count : null]
      ))
    }));
    ranked.sort((a, b) =>
      lowerIsBetter
        ? (a[firstMetric]??Infinity)-(b[firstMetric]??Infinity)
        : (b[firstMetric]??-Infinity)-(a[firstMetric]??-Infinity)
    );
    return ranked.slice(0, 10);
  },[data, selectedMetrics]);

  // COUNTRY STATS
  const countryStats = useMemo(() => {
    const stats = {};
    selectedMetrics.forEach(metric =>
      data.filter(d=>d.Metric===metric).forEach(d => {
        if (!stats[d.Country]) stats[d.Country] = {};
        if (!stats[d.Country][metric]) stats[d.Country][metric]={sum:0, count:0};
        stats[d.Country][metric].sum += d.Value;
        stats[d.Country][metric].count += 1;
      }));
    return Object.entries(stats).map(([country, v])=>({
      country,
      ...Object.fromEntries(selectedMetrics.map(m=>[
        m, v[m]?v[m].sum/v[m].count:null
      ])),
      count:v[selectedMetrics[0]]?.count||0
    })).sort((a,b)=>b.count-a.count).slice(0,15);
  },[data,selectedMetrics]);

  // MAP DATA
  const countryValueMap = useMemo(() => {
    let dict = {};
    countryStats.forEach(stat => dict[stat.country]=stat[selectedMetrics[0]]);
    return dict;
  }, [countryStats,selectedMetrics]);
  const mapColorScale = useMemo(() => {
    const vals = Object.values(countryValueMap).filter(v => v != null);
    if (!vals.length) return chroma.scale(['#f1f5f9','#0284c7','#facc15','#ef4444']).domain([0,1]);
    const domain = [Math.min(...vals), Math.max(...vals)];
    return chroma.scale(['#dbeafe','#1e40af','#facc15','#f87171']).domain(domain);
  }, [countryValueMap]);

  // HANDLERS
  const handleMetricChange = m => {
    setSelectedMetrics(metrics =>
      metrics.includes(m)
        ? metrics.length === 1 ? metrics : metrics.filter(mm=>mm!==m)
        : [...metrics, m]
    );
  };

  // Download CSV (call from ChartContainer)
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

  return {
    data,
    geoData,
    loading,
    error,
    darkMode,
    setDarkMode,
    availableMetrics,
    selectedMetrics,
    setSelectedMetrics,
    handleMetricChange,
    uniqueProducts,
    selectedProduct,
    setSelectedProduct,
    uniqueCountries,
    selectedCountry,
    setSelectedCountry,
    searchQuery,
    setSearchQuery,
    showMap,
    setShowMap,
    filteredData,
    top10Products,
    countryStats,
    countryValueMap,
    mapColorScale,
    productBarRef,
    countryBarRef,
    mapRef,
    tablePage,
    setTablePage,
    totalPages,
    currentTableRows,
    downloadCSV,
    ROWS_PER_PAGE,
    PRODUCT_COLORS
  };
}
