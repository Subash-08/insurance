import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as styles, reportColors } from "./base-pdf-styles";
import { formatDate, formatRs } from "./report-pdf";

export const ClientPortfolioDocument = ({ client, policies, agencyInfo }: any) => {
  const activePolicies = policies.filter((p: any) => p.status === "active");
  const totalPremium = activePolicies.reduce((acc: number, p: any) => acc + (p.premiumAmount || 0), 0);
  const totalSumAssured = activePolicies.reduce((acc: number, p: any) => acc + (p.sumAssured || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.agencyDetails}>
            <Text style={styles.agencyName}>{agencyInfo?.name || "InsureFlow Agency"}</Text>
            <Text style={{ fontSize: 9, color: reportColors.secondary }}>Independent Insurance Advisors</Text>
          </View>
          <View style={styles.reportDetails}>
            <Text style={styles.reportTitle}>Client Portfolio Report</Text>
            <Text style={styles.generatedDate}>Prepared for: {client.fullName}</Text>
            <Text style={styles.generatedDate}>Date: {formatDate(new Date())}</Text>
          </View>
        </View>

        {/* Client details box */}
        <View style={[styles.summaryBox, { justifyContent: 'flex-start', flexWrap: 'wrap', gap: 20 }]}>
          <View style={[styles.summaryItem, { alignItems: 'flex-start' }]}>
            <Text style={styles.summaryLabel}>Client Name</Text>
            <Text style={[styles.summaryValue, { color: reportColors.textDef }]}>{client.fullName}</Text>
          </View>
          <View style={[styles.summaryItem, { alignItems: 'flex-start' }]}>
            <Text style={styles.summaryLabel}>Phone / Email</Text>
            <Text style={[styles.summaryValue, { color: reportColors.textDef }]}>{client.phone} {client.email ? ` / ${client.email}` : ''}</Text>
          </View>
          <View style={[styles.summaryItem, { alignItems: 'flex-start' }]}>
            <Text style={styles.summaryLabel}>PAN Number</Text>
            <Text style={[styles.summaryValue, { color: reportColors.textDef }]}>{client.panNumber || '—'}</Text>
          </View>
        </View>

        {/* Portfolio Summary */}
        <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: reportColors.primary }}>Portfolio Summary</Text>
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Active Policies</Text>
            <Text style={styles.summaryValue}>{activePolicies.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Sum Assured</Text>
            <Text style={styles.summaryValue}>{formatRs(totalSumAssured)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Annual Premium</Text>
            <Text style={styles.summaryValue}>{formatRs(totalPremium)}</Text>
          </View>
        </View>

        {/* Active Policies Table */}
        <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, marginTop: 10, color: reportColors.textDef }}>Active Policies Detail</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>Insurer</Text>
            <Text style={styles.tableCellHeader}>Policy No.</Text>
            <Text style={styles.tableCellHeader}>Type</Text>
            <Text style={[styles.tableCellHeader, styles.tableCellMoney]}>Sum Assured</Text>
            <Text style={[styles.tableCellHeader, styles.tableCellMoney]}>Premium</Text>
            <Text style={styles.tableCellHeader}>Expiry</Text>
          </View>
          
          {activePolicies.length === 0 ? (
            <View style={[styles.tableRow, { padding: 10 }]}><Text style={[styles.tableCell, { borderRightWidth: 0, textAlign: 'center' }]}>No active policies.</Text></View>
          ) : (
            activePolicies.map((p: any, i: number) => (
              <View key={i} style={[styles.tableRow, i % 2 === 0 ? {} : styles.tableCellAlt]} wrap={false}>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{p.insurerId?.name || p.insurer}</Text>
                <Text style={styles.tableCell}>{p.policyNumber}</Text>
                <Text style={styles.tableCell}>{p.type}</Text>
                <Text style={[styles.tableCell, styles.tableCellMoney]}>{formatRs(p.sumAssured)}</Text>
                <Text style={[styles.tableCell, styles.tableCellMoney, { fontWeight: 700 }]}>{formatRs(p.premiumAmount)}</Text>
                <Text style={styles.tableCell}>{formatDate(p.expiryDate || p.maturityDate)}</Text>
              </View>
            ))
          )}
        </View>
        
        {/* Important Notes */}
        <View style={{ marginTop: 30, padding: 15, backgroundColor: reportColors.background, borderRadius: 4 }}>
          <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 6, color: reportColors.secondary }}>Important Notes:</Text>
          <Text style={{ fontSize: 9, lineHeight: 1.5, color: reportColors.secondary }}>
            1. This report is a summary generated by InsureFlow on behalf of the agency.{'\n'}
            2. Please report any discrepancies in policy details immediately.{'\n'}
            3. Ensure premiums are paid before the due date to keep policies active and avoid late fees.{'\n'}
            4. For claims or service requests, please contact your agent directly.
          </Text>
        </View>

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}  •  Prepared by ${client.agentId?.name || agencyInfo?.generatedBy}`
        )} fixed />
      </Page>
    </Document>
  );
};
