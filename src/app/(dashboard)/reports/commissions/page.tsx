import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import CommissionReportsClient from "./CommissionReportsClient";

export const metadata = {
  title: "Commission Analytics — InsureFlow",
};

export default async function CommissionReportsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  // Only owners can view financial analytics
  if (session.user.role !== "owner") {
    redirect("/dashboard");
  }

  return <CommissionReportsClient />;
}
