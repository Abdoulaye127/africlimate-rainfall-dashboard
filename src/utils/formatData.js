// Format a number with locale and fixed decimals (e.g. 2.13 or 1,555.22)
export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '';
  return Number(num).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Get a color for a metric, product, or country, given a palette array
export function getMetricColor(metric, colorList) {
  if (!metric || !colorList?.length) return "#888";
  const index = (
    typeof metric === "string"
      ? metric.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
      : 0
  ) % colorList.length;
  return colorList[index];
}

// Optionally: Capitalize first letter for labels
export function capitalize(s) {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Shorten large numbers (e.g. 1534000 -> 1.5M)
export function formatShortNumber(num) {
  if (num === null || num === undefined) return '';
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + "B";
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "k";
  return num.toString();
}
