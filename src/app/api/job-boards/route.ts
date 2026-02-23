import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobBoards } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const boards = await db
    .select()
    .from(jobBoards)
    .orderBy(asc(jobBoards.name));
  return NextResponse.json(boards);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const board = await db
    .insert(jobBoards)
    .values({ name: body.name, url: body.url })
    .returning();
  return NextResponse.json(board[0], { status: 201 });
}
