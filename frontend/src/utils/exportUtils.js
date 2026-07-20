export const downloadCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert("Export karne ke liye koi data nahi hai!");
    return;
  }

  // 1. Headers nikalna (JSON ke keys)
  const headers = Object.keys(data[0]);
  
  // 2. Data ko CSV format (comma separated) mein convert karna
  const csvRows = [];
  csvRows.push(headers.join(',')); // Pehli line headers ki
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Agar value string hai aur usme comma hai, toh usko quotes mein wrap karein
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const csvString = csvRows.join('\n');
  
  // 3. Blob banakar file download karwana
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};