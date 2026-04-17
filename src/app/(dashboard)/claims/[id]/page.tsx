import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ClaimDetailClient from "@/components/claims/ClaimDetailClient";

export const metadata = { title: "Claim Detail — InsureFlow" };

export default async function ClaimDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <ClaimDetailClient
      claimId={params.id}
      userRole={session.user.role}
      userId={session.user.id}
    />
  );
}
