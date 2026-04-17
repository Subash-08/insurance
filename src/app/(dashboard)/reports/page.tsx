import ReportsHub from "@/components/reports/ReportsHub";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports | InsureFlow",
  description: "Agency reporting and PDF exports",
};

export default function ReportsPage() {
  return <ReportsHub />;
}
