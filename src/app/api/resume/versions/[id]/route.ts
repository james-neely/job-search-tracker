import { NextRequest, NextResponse } from "next/server";
import { getResumeVersion, updateResumeVersion } from "@/db/queries/resume-versions";
import { getAllSettings, upsertSetting } from "@/db/queries/settings";
import { renderResumeMarkdown } from "@/lib/resume-builder";

type RouteParams = { params: Promise<{ id: string }> };

function normalizeGpa(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return "";
  }

  const clamped = Math.min(4, Math.max(0, parsed));
  return clamped.toFixed(2);
}

function normalizeEducation(entries: unknown[]) {
  return entries.map((entry) => {
    const value = typeof entry === "object" && entry !== null ? entry as Record<string, unknown> : {};
    return {
      schoolName: typeof value.schoolName === "string" ? value.schoolName : "",
      degree: typeof value.degree === "string" ? value.degree : "",
      fieldOfStudy: typeof value.fieldOfStudy === "string" ? value.fieldOfStudy : "",
      gpa: normalizeGpa(value.gpa),
      courses: typeof value.courses === "string" ? value.courses : "",
      awardsHonors: typeof value.awardsHonors === "string" ? value.awardsHonors : "",
      startDate: typeof value.startDate === "string" ? value.startDate : "",
      endDate: typeof value.endDate === "string" ? value.endDate : "",
      description: typeof value.description === "string" ? value.description : "",
    };
  });
}

function normalizeWorkExperience(entries: unknown[]) {
  return entries.map((entry) => {
    const value = typeof entry === "object" && entry !== null ? entry as Record<string, unknown> : {};
    return {
      companyName: typeof value.companyName === "string" ? value.companyName : "",
      roleTitle: typeof value.roleTitle === "string" ? value.roleTitle : "",
      location: typeof value.location === "string" ? value.location : "",
      startDate: typeof value.startDate === "string" ? value.startDate : "",
      endDate: typeof value.endDate === "string" ? value.endDate : "",
      bullets: typeof value.bullets === "string" ? value.bullets : "",
    };
  });
}

function normalizeProjects(entries: unknown[]) {
  return entries.map((entry) => {
    const value = typeof entry === "object" && entry !== null ? entry as Record<string, unknown> : {};
    return {
      name: typeof value.name === "string" ? value.name : "",
      link: typeof value.link === "string" ? value.link : "",
      technologies: typeof value.technologies === "string" ? value.technologies : "",
      description: typeof value.description === "string" ? value.description : "",
    };
  });
}

function normalizeCertifications(entries: unknown[]) {
  return entries.map((entry) => {
    const value = typeof entry === "object" && entry !== null ? entry as Record<string, unknown> : {};
    return {
      name: typeof value.name === "string" ? value.name : "",
      issuer: typeof value.issuer === "string" ? value.issuer : "",
      issueDate: typeof value.issueDate === "string" ? value.issueDate : "",
      credentialId: typeof value.credentialId === "string" ? value.credentialId : "",
    };
  });
}

function normalizeNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function normalizeMargin(value: unknown) {
  const allowedMargins = [0.25, 0.5, 0.75, 1, 1.25, 1.5];
  const parsed = typeof value === "number" ? value : Number(value);
  return allowedMargins.includes(parsed) ? parsed : 0.75;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const version = await getResumeVersion(id);

  if (!version) {
    return NextResponse.json({ error: "Resume version not found" }, { status: 404 });
  }

  return NextResponse.json(version);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Untitled Resume";
  const summary = typeof body.summary === "string" ? body.summary : "";
  const skills = typeof body.skills === "string" ? body.skills : "";
  const education = Array.isArray(body.education) ? normalizeEducation(body.education) : [];
  const workExperience = Array.isArray(body.workExperience) ? normalizeWorkExperience(body.workExperience) : [];
  const projects = Array.isArray(body.projects) ? normalizeProjects(body.projects) : [];
  const certifications = Array.isArray(body.certifications) ? normalizeCertifications(body.certifications) : [];
  const fontSize = normalizeNumber(body.fontSize, 11, 8, 16);
  const margin = normalizeMargin(body.margin);

  const version = await updateResumeVersion(id, {
    title,
    summary,
    skills,
    fontSize,
    margin,
    education,
    workExperience,
    projects,
    certifications,
  });

  if (!version) {
    return NextResponse.json({ error: "Resume version not found" }, { status: 404 });
  }

  const settingsMap: Record<string, string> = {};
  for (const setting of await getAllSettings()) {
    settingsMap[setting.key] = setting.value;
  }

  await upsertSetting("active_resume_version_id", version.id);
  await upsertSetting("resume_text", renderResumeMarkdown(version, settingsMap));

  return NextResponse.json(version);
}
