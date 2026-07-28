export const downloadCSV = (data, filename, toast) => {
  if (!data || data.length === 0) {
    // Check if toast is provided, otherwise fallback to alert just in case
    if (toast && toast.push) {
      toast.push("There is no data to export!", { type: 'error' });
    } else {
      alert("There is no data to export!");
    }
    return;
  }


  const headers = Object.keys(data[0]);
  
  // 2.Convert data in CSV format
  const csvRows = [];
  csvRows.push(headers.join(',')); // first line for headers
  
  for (const row of data) {
    const values = headers.map(header => {
      // Handle null and undefined values safely
      const val = row[header] !== null && row[header] !== undefined ? row[header] : "";
      

      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const csvString = csvRows.join('\n');
  
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Optional: Show a success toast when download starts!
  if (toast && toast.push) {
    toast.push("Tasks exported to CSV successfully!", { type: 'success' });
  }
};