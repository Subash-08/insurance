import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import FileClaimWizard from "@/components/claims/FileClaimWizard";

export const metadata = { title: "File New Claim — InsureFlow" };

export default async function NewClaimPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">File New Claim</h1>
        <p className="text-sm text-gray-500 mt-1">Complete all steps to file a claim with us</p>
      </div>
      <FileClaimWizard />
    </div>
  );
}
