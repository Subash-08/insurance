import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PremiumsClient from "@/components/premiums/PremiumsClient";
import PageHeader from "@/components/shared/PageHeader";
import { formatCurrency } from "@/lib/utils";
import dbConnect from "@/lib/mongodb";
import Premium from "@/models/Premium";

async function getInitialStats(userId: string, role: string) {
  await dbConnect();

  const filter: any = {};
  if (role !== "owner") {
    filter.agentId = userId;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Directly aggregating overdue total for the subtitle
  const overdueStats = await Premium.aggregate([
    {
      $match: {
        ...filter,
        dueDate: { $lt: today },
        status: { $in: ["due", "overdue", "partially_paid", "ecs_pending"] }
      }
    },
    {
      $group: {
        _id: null,
        totalBalance: { $sum: "$balanceAmount" }
      }
    }
  ]);

  const overdueTotal = overdueStats[0]?.totalBalance || 0;
  return overdueTotal;
}

export default async function PremiumsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const overdueTotal = await getInitialStats(session.user.id, session.user.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Premium Tracker"
        subtitle={
          overdueTotal > 0
            ? <span className="text-red-600 font-medium">Total Overdue: {formatCurrency(overdueTotal / 100)}</span>
            : "All premiums are up to date"
        }
      />
      <PremiumsClient />
    </div>
  );
}
