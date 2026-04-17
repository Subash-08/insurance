import { StyleSheet, Font } from '@react-pdf/renderer';

// Register Helvetica since it supports basic characters, but for ₹ symbol
// we generally fall back to standard 'Rs.' in simple PDF renders or ensure standard fonts.
// Note: React-PDF has standard 14 fonts built-in. We'll use Helvetica.
// For ₹ to render correctly out of the box in @react-pdf/renderer without custom TTF,
// it often fails. A common hack is to use 'Rs.' or fetch a font. We'll stick to basic for now 
// and if users report ₹ missing, we'll patch a TTF URL.
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 700 }
  ]
});

export const reportColors = {
  primary: '#1D4ED8',    // blue-700
  secondary: '#64748B',  // slate-500
  danger: '#DC2626',     // red-600
  success: '#16A34A',    // green-600
  warning: '#D97706',    // amber-600
  border: '#E2E8F0',     // slate-200
  background: '#F8FAFC', // slate-50
  textDef: '#1E293B',    // slate-800
};

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: reportColors.textDef,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: reportColors.border,
    paddingBottom: 15,
    marginBottom: 20,
  },
  agencyDetails: {
    flexDirection: 'column',
    gap: 4,
  },
  agencyName: {
    fontSize: 18,
    fontWeight: 700,
    color: reportColors.primary,
  },
  reportDetails: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: reportColors.secondary,
  },
  generatedDate: {
    fontSize: 9,
    color: reportColors.secondary,
  },
  summaryBox: {
    backgroundColor: '#EFF6FF', // blue-50
    borderWidth: 1,
    borderColor: reportColors.primary,
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    fontSize: 9,
    color: reportColors.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 700,
    color: reportColors.primary,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: reportColors.border,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9', // slate-100
  },
  tableCellHeader: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    fontWeight: 700,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: reportColors.border,
    color: reportColors.secondary,
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: reportColors.border,
  },
  tableCellAlt: {
    backgroundColor: reportColors.background,
  },
  tableCellMoney: {
    textAlign: 'right',
  },
  tableCellCenter: {
    textAlign: 'center',
  },
  totalsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },
  totalsCellHeader: {
    flex: 1,
    padding: 6,
    fontSize: 10,
    fontWeight: 700,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: reportColors.border,
    textAlign: 'right',
  },
  totalsCellValue: {
    flex: 1,
    padding: 6,
    fontSize: 10,
    fontWeight: 700,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: reportColors.border,
    color: reportColors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 8,
    color: reportColors.secondary,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: reportColors.border,
    paddingTop: 10,
  },
  textDanger: { color: reportColors.danger },
  textWarning: { color: reportColors.warning },
  textSuccess: { color: reportColors.success },
  textMuted: { color: reportColors.secondary },
});
