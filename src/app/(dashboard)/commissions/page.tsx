import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import CommissionsClient from "./CommissionsClient";

export const metadata = {
  title: "Revenue Reconciliation — InsureFlow",
};

export default async function CommissionsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  // Only owners deal with cross-agency premium/commission reconciliations
  if (session.user.role !== "owner") {
    redirect("/dashboard");
  }

  return <CommissionsClient />;
}
