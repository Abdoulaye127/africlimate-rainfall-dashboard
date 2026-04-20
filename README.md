# AfriClimate Rainfall Products Performance Dashboard

This project is an interactive **React** dashboard for evaluating the performance of satellite-based rainfall products over **Africa**.  
It uses data from a systematic review (1,299 records, 145 products, 18 countries) and provides maps, charts, and tables for exploring product performance.

---

## ✨ Main Features

- Summary cards for:
  - Total records
  - Number of products
  - Number of countries
  - Number of filtered records
  - Current performance metric
- Filter panel:
  - Multiple performance metrics (CC, RMSE, MAE, FAR, etc.)
  - Product filter
  - Country/Region filter
  - Text search (products, locations, countries)
- Interactive map of Africa:
  - Countries coloured by average performance
  - Tooltips with metric values
  - Click a country to filter all charts and the table
- Charts:
  - **Top 10 products** bar chart (supports multiple metrics)
  - **Country data distribution** bar chart
- Detailed data table:
  - Paginated, sortable view of filtered records
- Export options:
  - Export filtered data to CSV
  - Export map and charts as PNG images
- Light / dark mode toggle

---

## 🧱 Tech Stack

- **React** (Create React App / Vite-style structure)
- **Recharts** – charts and visualizations
- **React-Leaflet + Leaflet** – interactive map of Africa
- **Tailwind CSS** – styling
- **chroma-js** – colour scales
- **html2canvas** – export charts/map as PNG
- Custom React hooks:
  - `useDarkMode`
  - `useRainfallData`

---

## 📁 Project Structure (simplified)

```text
public/
  data/
    Systematic_Review.csv      # Main dataset from the systematic review
    africa_country.geojson     # Africa country boundaries for the map
    logo.jpeg                  # AfriClimate logo

src/
  assets/
    logo.jpeg

  components/
    Header.jsx / Header.js     # Top navigation and branding
    Footer.jsx / Footer.js     # Footer with links & contact
    ChartContainer.jsx         # Layout for charts
    RainfallTable.jsx          # Paginated detailed data table
    SearchBar.jsx              # Search input
    Loader.jsx                 # Loading indicator

  hooks/
    useDarkMode.js             # Dark mode hook
    useRainfallData.js         # Data loading + parsing logic

  pages/
    Dashboard.jsx              # Main dashboard page (map, charts, table)

  data/
    Systematic_Review.csv      # Optional copy for development
    africa_country.geojson

  utils/
    parseCSV.js                # CSV parsing helper
    formatData.js              # Helpers to shape/aggregate the data

  App.js / main.jsx            # App entry and routing
  styles/global.css            # Global styles
```

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js and npm installed  
  You can download Node.js from: https://nodejs.org

Check versions:

```bash
node -v
npm -v
```

---

### 2. Clone the repository

```bash
git clone https://github.com/Abdoulaye127/africlimate-rainfall-dashboard.git
cd africlimate-rainfall-dashboard
```

---

### 3. Install dependencies

```bash
npm install
```

This reads `package.json` and installs all required libraries.

---

### 4. Run the app in development mode

```bash
npm start
```

The app will start on:

```text
http://localhost:3000
```

If the browser does not open automatically, open it and go to that URL.

---

## 📊 Data Files

The dashboard expects the following files in `public/data/`:

- `Systematic_Review.csv`
- `africa_country.geojson`
- `logo.jpeg` (or update the paths in the code if you change this)

The app loads these via `fetch('/data/...')`, so the relative paths are important.

---

## 🧮 How the Dashboard Works (High Level)

1. **Data loading**  
   - `useRainfallData` fetches and parses `Systematic_Review.csv`.
   - Country names are inferred from the `Location` field (Ethiopia, Ghana, etc.) or marked as "Regional" for Africa-wide studies.

2. **Filtering & aggregation**  
   - Filters by metric, product, country, and search text.
   - Aggregates averages per product and per country for the selected metric(s).

3. **Visualization**  
   - Map: colour-coded average performance by country using `chroma-js`.
   - Charts: Recharts bar charts for top 10 products and country distributions.
   - Table: paginated list of individual records.

4. **Export**  
   - CSV: builds a CSV string from the filtered data and downloads it.
   - PNG: uses `html2canvas` to capture the map/charts as images.

---

## 🧪 Scripts

Common npm scripts:

```bash
npm start       # Run development server
npm run build   # Build for production
npm test        # Run tests (if configured)
```

---

## 📄 License

You can add a license here (MIT, Apache 2.0, etc.) if you wish.

---

## 👤 Author

- **Abdoulaye Diop**  
  AfriClimate AI - Rainfall Products Performance Dashboard
