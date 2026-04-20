export default function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].includes('\t') ?
    lines[0].split('\t').map(h => h.trim()):
    lines[0].split(',').map(h => h.trim());
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.includes('\t')? line.split('\t'): line.split(',');
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim().replace(/^"|"$/g, '') || '';
    });
    out.push(row);
  }
  return out;
}
