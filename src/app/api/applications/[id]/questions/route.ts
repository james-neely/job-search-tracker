import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applicationQuestions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const questions = await db
    .select()
    .from(applicationQuestions)
    .where(eq(applicationQuestions.applicationId, Number(id)));
  return NextResponse.json(questions);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const question = await db
    .insert(applicationQuestions)
    .values({
      applicationId: Number(id),
      question: body.question,
      answer: body.answer ?? "",
    })
    .returning();
  return NextResponse.json(question[0], { status: 201 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const questionId = request.nextUrl.searchParams.get("questionId");
  if (!questionId) {
    return NextResponse.json({ error: "questionId required" }, { status: 400 });
  }
  const body = await request.json();
  const updated = await db
    .update(applicationQuestions)
    .set({ question: body.question, answer: body.answer })
    .where(
      and(
        eq(applicationQuestions.id, Number(questionId)),
        eq(applicationQuestions.applicationId, Number(id))
      )
    )
    .returning();
  return NextResponse.json(updated[0]);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const questionId = request.nextUrl.searchParams.get("questionId");
  if (!questionId) {
    return NextResponse.json({ error: "questionId required" }, { status: 400 });
  }
  await db
    .delete(applicationQuestions)
    .where(
      and(
        eq(applicationQuestions.id, Number(questionId)),
        eq(applicationQuestions.applicationId, Number(id))
      )
    );
  return NextResponse.json({ success: true });
}
