import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

type HandlerFn = (
  req: NextRequest,
  ctx: { params: Record<string, string> },
  session: any
) => Promise<NextResponse>;

/**
 * Wraps API route handlers with:
 * - Session check (401 if not authenticated)
 * - Unique requestId on every response for log tracing
 * - Standardized error catching — never exposes stack in production
 * - Consistent response shape: { success, data?, message, requestId }
 */
export function withApiHandler(handler: HandlerFn, requireAuth = true) {
  return async (req: NextRequest, ctx: { params: Record<string, string> }) => {
    const requestId = crypto.randomUUID();

    try {
      let session = null;
      if (requireAuth) {
        session = await getServerSession(authOptions);
        if (!session) {
          return NextResponse.json(
            { success: false, message: "Unauthorized", requestId },
            { status: 401 }
          );
        }
      }

      const response = await handler(req, ctx, session);

      // Inject requestId into successful JSON responses
      try {
        const body = await response.clone().json();
        return NextResponse.json(
          { ...body, requestId },
          { status: response.status, headers: response.headers }
        );
      } catch {
        // Response is not JSON (e.g. streaming) — return as-is
        return response;
      }
    } catch (error: any) {
      console.error(`[API_ERROR] requestId=${requestId}`, error);

      const isDev = process.env.NODE_ENV === "development";
      return NextResponse.json(
        {
          success: false,
          message: isDev ? error.message : "Internal server error",
          code: error.code,
          requestId,
        },
        { status: 500 }
      );
    }
  };
}
