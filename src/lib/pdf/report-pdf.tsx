import React from "react";
import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { pdfStyles as styles, reportColors } from "./base-pdf-styles";

export function formatRs(paise: number) {
  return "Rs. " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(paise / 100);
}

export function formatDate(date: string | Date | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(date));
}

// ── Shared Components ────────────────────────────────────────────────────────
const ReportHeader = ({ title, dateRange, agencyInfo }: any) => (
  <View style={styles.headerRow}>
    <View style={styles.agencyDetails}>
      {agencyInfo?.logoBase64 && (
        <Image src={agencyInfo.logoBase64} style={{ width: 40, height: 40, marginBottom: 4 }} />
      )}
      <Text style={styles.agencyName}>{agencyInfo?.name || "InsureFlow Agency"}</Text>
      <Text style={{ fontSize: 9, color: reportColors.secondary }}>{agencyInfo?.address || "Insurance Advisors"}</Text>
    </View>
    <View style={styles.reportDetails}>
      <Text style={styles.reportTitle}>{title}</Text>
      {dateRange && <Text style={{ fontSize: 9, color: reportColors.secondary, marginTop: 4 }}>Period: {dateRange}</Text>}
      <Text style={styles.generatedDate}>Generated on: {formatDate(new Date())}</Text>
      <Text style={styles.generatedDate}>By: {agencyInfo?.generatedBy || "System"}</Text>
    </View>
  </View>
);

const ReportFooter = () => (
  <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
    `Page ${pageNumber} of ${totalPages}  •  Confidential — InsureFlow`
  )} fixed />
);

// ── 1. Expiry Report ──────────────────────────────────────────────────────────
export const ExpiryReportDocument = ({ data, dateRange, agencyInfo }: any) => {
  const totalSum = data.reduce((acc: number, cur: any) => acc + (cur.sumAssured || 0), 0);
  const totalPremium = data.reduce((acc: number, cur: any) => acc + (cur.totalPremium || 0), 0);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <ReportHeader title="Policy Expiry Report" dateRange={dateRange} agencyInfo={agencyInfo} />
        
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Policies Expiring</Text>
            <Text style={styles.summaryValue}>{data.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Sum Assured</Text>
            <Text style={styles.summaryValue}>{formatRs(totalSum)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Annual Premium</Text>
            <Text style={styles.summaryValue}>{formatRs(totalPremium)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>Client Name</Text>
            <Text style={styles.tableCellHeader}>Phone</Text>
            <Text style={styles.tableCellHeader}>Policy No.</Text>
            <Text style={styles.tableCellHeader}>Insurer</Text>
            <Text style={styles.tableCellHeader}>Type</Text>
            <Text style={[styles.tableCellHeader, styles.tableCellMoney]}>Premium (Rs.)</Text>
            <Text style={styles.tableCellHeader}>Expiry/Maturity</Text>
            <Text style={[styles.tableCellHeader, styles.tableCellCenter]}>Days Left</Text>
          </View>
          
          {data.length === 0 ? (
            <View style={[styles.tableRow, { padding: 10 }]}><Text style={[styles.tableCell, { borderRightWidth: 0, textAlign: 'center' }]}>No records found.</Text></View>
          ) : (
            data.map((row: any, i: number) => {
               const daysLeft = Math.floor((new Date(row.endDate).getTime() - Date.now()) / 86400000);
               return (
                <View key={i} style={[styles.tableRow, i % 2 === 0 ? {} : styles.tableCellAlt]} wrap={false}>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>{row.clientName}</Text>
                  <Text style={styles.tableCell}>{row.phone}</Text>
                  <Text style={styles.tableCell}>{row.policyNumber}</Text>
                  <Text style={styles.tableCell}>{row.insurer}</Text>
                  <Text style={styles.tableCell}>{row.type}</Text>
                  <Text style={[styles.tableCell, styles.tableCellMoney]}>{formatRs(row.totalPremium)}</Text>
                  <Text style={styles.tableCell}>{formatDate(row.endDate)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellCenter, daysLeft < 15 ? styles.textDanger : {}]}>{daysLeft}</Text>
                </View>
               );
            })
          )}
        </View>
        <ReportFooter />
      </Page>
    </Document>
  );
};

// ── 2. Premium Collection Report ─────────────────────────────────────────────
export const PremiumCollectionDocument = ({ data, dateRange, agencyInfo }: any) => {
  const totalAmount = data.reduce((acc: number, cur: any) => acc + (cur.amount || 0), 0);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <ReportHeader title="Premium Collection Report" dateRange={dateRange} agencyInfo={agencyInfo} />
        
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Collected</Text>
            <Text style={styles.summaryValue}>{formatRs(totalAmount)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>No. of Payments</Text>
            <Text style={styles.summaryValue}>{data.length}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableCellHeader}>Date Paid</Text>
            <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>Client Name</Text>
            <Text style={styles.tableCellHeader}>Policy No.</Text>
            <Text style={styles.tableCellHeader}>Insurer</Text>
            <Text style={styles.tableCellHeader}>Mode</Text>
            <Text style={styles.tableCellHeader}>Receipt No.</Text>
            <Text style={[styles.tableCellHeader, styles.tableCellMoney]}>Amount (Rs.)</Text>
          </View>
          
          {data.length === 0 ? (
             <View style={[styles.tableRow, { padding: 10 }]}><Text style={[styles.tableCell, { borderRightWidth: 0, textAlign: 'center' }]}>No records found.</Text></View>
          ) : (
            data.map((row: any, i: number) => (
              <View key={i} style={[styles.tableRow, i % 2 === 0 ? {} : styles.tableCellAlt]} wrap={false}>
                <Text style={styles.tableCell}>{formatDate(row.paidDate)}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{row.clientName}</Text>
                <Text style={styles.tableCell}>{row.policyNumber}</Text>
                <Text style={styles.tableCell}>{row.insurer}</Text>
                <Text style={styles.tableCell}>{row.mode}</Text>
                <Text style={styles.tableCell}>{row.receiptNumber || '—'}</Text>
                <Text style={[styles.tableCell, styles.tableCellMoney, { fontWeight: 700 }]}>{formatRs(row.amount)}</Text>
              </View>
            ))
          )}
          
          {data.length > 0 && (
            <View style={styles.totalsRow} wrap={false}>
               <Text style={[styles.totalsCellHeader, { flex: 6.5 }]}>Grand Total</Text>
               <Text style={styles.totalsCellValue}>{formatRs(totalAmount)}</Text>
            </View>
          )}
        </View>
        <ReportFooter />
      </Page>
    </Document>
  );
};

// ── 3. Lapse Risk Report ─────────────────────────────────────────────────────
export const LapseRiskDocument = ({ data, agencyInfo }: any) => {
  const totalRiskPremium = data.reduce((acc: number, cur: any) => acc + (cur.amount || 0), 0);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <ReportHeader title="Lapse Risk Report" dateRange="As of Today" agencyInfo={agencyInfo} />
        
        <View style={[styles.summaryBox, { borderColor: reportColors.danger, backgroundColor: '#FEF2F2' }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, styles.textDanger]}>CRITICAL ALERTS</Text>
            <Text style={[styles.summaryValue, styles.textDanger]}>{data.length} High-Risk Policies</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, styles.textDanger]}>Total At-Risk Premium</Text>
            <Text style={[styles.summaryValue, styles.textDanger]}>{formatRs(totalRiskPremium)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>Client Name</Text>
            <Text style={styles.tableCellHeader}>Phone</Text>
            <Text style={styles.tableCellHeader}>Policy No.</Text>
            <Text style={styles.tableCellHeader}>Insurer</Text>
            <Text style={[styles.tableCellHeader, styles.tableCellMoney]}>Premium Due</Text>
            <Text style={styles.tableCellHeader}>Due Date</Text>
            <Text style={[styles.tableCellHeader, styles.tableCellCenter]}>Days Overdue</Text>
            <Text style={styles.tableCellHeader}>Agent Contact</Text>
          </View>
          
          {data.length === 0 ? (
            <View style={[styles.tableRow, { padding: 10 }]}><Text style={[styles.tableCell, { borderRightWidth: 0, textAlign: 'center' }]}>No high-risk policies.</Text></View>
          ) : (
            data.map((row: any, i: number) => {
              const bgClass = row.daysOverdue >= 30 ? '#FEF2F2' : row.daysOverdue >= 15 ? '#FFFBEB' : '#F0FDF4';
              const textClass = row.daysOverdue >= 30 ? reportColors.danger : row.daysOverdue >= 15 ? reportColors.warning : reportColors.textDef;
              
              return (
                <View key={i} style={[styles.tableRow, { backgroundColor: bgClass }]} wrap={false}>
                  <Text style={[styles.tableCell, { flex: 1.5, color: textClass }]}>{row.clientName}</Text>
                  <Text style={[styles.tableCell, { color: textClass }]}>{row.phone}</Text>
                  <Text style={[styles.tableCell, { color: textClass }]}>{row.policyNumber}</Text>
                  <Text style={[styles.tableCell, { color: textClass }]}>{row.insurer}</Text>
                  <Text style={[styles.tableCell, styles.tableCellMoney, { color: textClass, fontWeight: 700 }]}>{formatRs(row.amount)}</Text>
                  <Text style={[styles.tableCell, { color: textClass }]}>{formatDate(row.dueDate)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellCenter, { color: textClass, fontWeight: 700 }]}>{row.daysOverdue}</Text>
                  <Text style={[styles.tableCell, { color: textClass }]}>{row.agentName}</Text>
                </View>
              );
            })
          )}
        </View>
        <ReportFooter />
      </Page>
    </Document>
  );
};

// ── 4. General Table Fallback Document ────────────────────────────────────────
// Serves Pending Premiums & Commission simple lists
export const GenericTableDocument = ({ data, title, dateRange, columns, summaryStats, agencyInfo }: any) => {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <ReportHeader title={title} dateRange={dateRange} agencyInfo={agencyInfo} />
        
        {summaryStats && summaryStats.length > 0 && (
          <View style={styles.summaryBox}>
            {summaryStats.map((stat: any, i: number) => (
              <View key={i} style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{stat.label}</Text>
                <Text style={styles.summaryValue}>{stat.isMoney ? formatRs(stat.value) : stat.value}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            {columns.map((col: any, i: number) => (
              <Text key={i} style={[styles.tableCellHeader, col.flex ? { flex: col.flex } : {}, col.money ? styles.tableCellMoney : {}]}>
                {col.header}
              </Text>
            ))}
          </View>
          
          {data.length === 0 ? (
            <View style={[styles.tableRow, { padding: 10 }]}><Text style={[styles.tableCell, { borderRightWidth: 0, textAlign: 'center' }]}>No records found.</Text></View>
          ) : (
            data.map((row: any, i: number) => (
              <View key={i} style={[styles.tableRow, i % 2 === 0 ? {} : styles.tableCellAlt]} wrap={false}>
                {columns.map((col: any, j: number) => (
                  <Text key={j} style={[styles.tableCell, col.flex ? { flex: col.flex } : {}, col.money ? styles.tableCellMoney : {}]}>
                     {col.money ? formatRs(row[col.key]) : col.isDate ? formatDate(row[col.key]) : row[col.key] || '—'}
                  </Text>
                ))}
              </View>
            ))
          )}
        </View>
        <ReportFooter />
      </Page>
    </Document>
  );
};
