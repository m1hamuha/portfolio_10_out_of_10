import { signOut } from "next-auth/react";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await signOut({ callbackUrl: "/login" });
  return NextResponse.redirect(new URL("/login", req.url));
}
