import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import ClaimsClient from "@/components/claims/ClaimsClient";

export const metadata = { title: "Claims — InsureFlow" };

export default async function ClaimsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="space-y-6">
      <ClaimsClient />
    </div>
  );
}
