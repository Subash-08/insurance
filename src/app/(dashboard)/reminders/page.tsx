import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import RemindersClient from "@/components/reminders/RemindersClient";

export const metadata = { title: "Reminders & Automation — InsureFlow" };

export default async function RemindersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <RemindersClient userRole={session.user.role} />;
}
