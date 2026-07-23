import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/** 返回当前登录用户 ID，未登录返回 null */
export async function GET() {
  const { userId } = await auth();
  return NextResponse.json({ userId: userId ?? null });
}
