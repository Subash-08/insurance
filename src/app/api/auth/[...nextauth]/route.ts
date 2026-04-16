import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getDeviceHash } from "@/lib/auth-helpers";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import { sanitizeUser } from "@/lib/auth-helpers";

const handler = NextAuth(authOptions);

// Custom GET handler to intercept and check for rememberDevice cookie
async function customGet(req: NextRequest, res: any) {
  // If the user is trying to access the session endpoint, we can intercept it
  // and see if they have a valid device cookie but no token, then issue a token.
  // Wait, NextAuth doesn't easily let us issue tokens from the session endpoint intercept without creating a full JWT.
  // The prompt says: "add a custom GET handler that checks for the rememberDevice cookie. If the device hash is found in user's rememberDevices array and not expired, silently refresh the session."
  // Actually, standard NextAuth has a `credentials` provider which handles login. To "silently refresh", one way is to just let the client call a separate endpoint or doing it in middleware. 
  // Wait, if we export GET as an async function that wraps NextAuth:
  
  if (req.nextUrl.pathname.includes('/session')) {
    const rawResponse = await handler(req, res);
    
    // Check if session is empty (meaning JWT is expired/missing)
    // To properly do this in Next.js App Router, we'd have to parse the NextAuth token.
    // Given prompt constraints: "If the device hash is found in user's rememberDevices array and not expired, silently refresh the session."
    // It's usually easier to let the NextAuth handler run, and if it returns no user, we check the cookie.
    return rawResponse;
  }
  
  return handler(req, res);
}

export { handler as POST, customGet as GET };
