import { NextRequest, NextResponse } from "next/server";
import {
  listApplications,
  createApplication,
} from "@/db/queries/applications";
import { db } from "@/db";
import { statusHistory } from "@/db/schema";
import type { ApplicationStatus } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filters = {
    status: (params.get("status") as ApplicationStatus) || undefined,
    search: params.get("search") || undefined,
    sortBy: params.get("sortBy") || undefined,
    sortOrder: (params.get("sortOrder") as "asc" | "desc") || undefined,
  };

  const apps = await listApplications(filters);
  return NextResponse.json(apps);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const app = await createApplication(body);

  await db.insert(statusHistory).values({
    applicationId: app.id,
    fromStatus: null,
    toStatus: app.status,
  });

  return NextResponse.json(app, { status: 201 });
}
