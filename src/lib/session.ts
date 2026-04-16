import { getServerSession } from "next-auth/next";
import { getToken } from "next-auth/jwt";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { authOptions } from "./auth";
import { IUserSession } from "@/types/auth";

export async function getRequiredSession(req?: NextRequest): Promise<any> {
  let sessionResult: any = null;

  if (req) {
    const token = await getToken({ req });
    if (token) {
      sessionResult = {
        user: {
          id: token.id as string,
          name: token.name as string,
          email: token.email as string,
          role: token.role as any,
          status: token.status as any,
          designation: token.designation as string,
          image: token.picture
        }
      };
    }
  } else {
    sessionResult = await getServerSession(authOptions);
  }

  if (!sessionResult?.user) {
    if (req) throw new Error("Unauthorized");
    redirect("/login");
  }

  if (sessionResult.user.status !== "active") {
    if (req) throw new Error("Account not active");
    redirect("/pending-approval");
  }

  return sessionResult;
}

export async function getSessionRole(): Promise<'owner' | 'employee' | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as IUserSession)?.role || null;
}

export async function requireOwner(): Promise<any> {
  const session = await getRequiredSession();
  if (session.user.role !== "owner") {
    redirect("/dashboard");
  }
  return session.user;
}

export function buildDataFilter(session: { id: string, role: string }): { agencyId?: string, agentId?: string } {
  // In a multi-agency system, we'd include agencyId: session.agencyId. But prompt specified:
  if (session.role === "owner") {
    return {};
  }
  return { agentId: session.id };
}
