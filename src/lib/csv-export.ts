export function downloadCSV(filename: string, headers: string[], rows: string[][]): void {
  const content = generateCSVContent(headers, rows);
  
  // UTF-8 BOM for Excel
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateCSVContent(headers: string[], rows: string[][]): string {
  const escapeCell = (cell: string | number) => {
    if (cell == null) return '""';
    const cellStr = String(cell);
    // If it contains comma, quotes, or newlines, wrap in quotes and escape internal quotes
    if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
      return `"${cellStr.replace(/"/g, '""')}"`;
    }
    return cellStr;
  };

  const headerRow = headers.map(escapeCell).join(",");
  const dataRows = rows.map((row) => row.map(escapeCell).join(","));

  return [headerRow, ...dataRows].join("\n");
}

export const REPORT_COLUMNS = {
  expiry: [
    "Client Name",
    "Phone",
    "Policy No.",
    "Insurer",
    "Type",
    "Sum Assured (Rs.)",
    "Annual Premium (Rs.)",
    "Expiry Date",
    "Days Left",
    "Agent Name",
  ],
  premium_collection: [
    "Date",
    "Client Name",
    "Client Phone",
    "Policy No.",
    "Insurer",
    "Policy Type",
    "Payment Mode",
    "Receipt No.",
    "Amount (Rs.)",
    "Agent Name",
  ],
  pending_premiums: [
    "Client Name",
    "Phone",
    "Policy No.",
    "Insurer",
    "Due Date",
    "Days Overdue",
    "Amount (Rs.)",
    "Agent Name",
  ],
  commission: [
    "Month",
    "Policy No.",
    "Client",
    "Insurer",
    "Policy Type",
    "Premium (Rs.)",
    "Rate (%)",
    "Commission (Rs.)",
    "Status",
    "Agent Name",
  ],
  lapse_risk: [
    "Client Name",
    "Phone",
    "Policy No.",
    "Insurer",
    "Type",
    "Sum Assured (Rs.)",
    "Premium (Rs.)",
    "Due Date",
    "Days Overdue",
    "Agent Name",
  ],
};
