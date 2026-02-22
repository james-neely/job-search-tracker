import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { companyLinks } from "@/db/schema";
import { eq, and } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const links = await db
    .select()
    .from(companyLinks)
    .where(eq(companyLinks.applicationId, Number(id)));
  return NextResponse.json(links);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const link = await db
    .insert(companyLinks)
    .values({ applicationId: Number(id), label: body.label, url: body.url })
    .returning();
  return NextResponse.json(link[0], { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const linkId = request.nextUrl.searchParams.get("linkId");
  if (!linkId) {
    return NextResponse.json({ error: "linkId required" }, { status: 400 });
  }
  await db
    .delete(companyLinks)
    .where(
      and(
        eq(companyLinks.id, Number(linkId)),
        eq(companyLinks.applicationId, Number(id))
      )
    );
  return NextResponse.json({ success: true });
}
