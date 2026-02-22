import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { statusHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const history = await db
    .select()
    .from(statusHistory)
    .where(eq(statusHistory.applicationId, Number(id)))
    .orderBy(desc(statusHistory.changedAt));
  return NextResponse.json(history);
}
