import React, { useState, useMemo, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ChartContainer from '../components/ChartContainer';
import RainfallTable from '../components/RainfallTable';
import Loader from '../components/Loader';
import useRainfallData from '../hooks/useRainfallData';

export default function Dashboard() {
  const {
    loading,
    error,
    data,
    geoData,
    ...dashboardState // all logic returned by custom hook
  } = useRainfallData();

  if (loading) return <Loader />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <ChartContainer
          data={data}
          geoData={geoData}
          {...dashboardState}
        />
        <RainfallTable
          currentTableRows={dashboardState.currentTableRows}
          filteredData={dashboardState.filteredData}
          tablePage={dashboardState.tablePage}
          totalPages={dashboardState.totalPages}
          setTablePage={dashboardState.setTablePage}
          selectedMetrics={dashboardState.selectedMetrics}
          darkMode={dashboardState.darkMode}
        />
      </main>
      <Footer />
    </div>
  );
}
