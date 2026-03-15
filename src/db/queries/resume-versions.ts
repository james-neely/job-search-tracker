import { db } from "@/db";
import {
  resumeVersions,
  resumeEducationEntries,
  resumeGeneratedDocuments,
  resumeWorkExperiences,
  resumeProjects,
  resumeCertifications,
} from "@/db/schema";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface ResumeEducationInput {
  schoolName: string;
  degree: string;
  fieldOfStudy: string;
  gpa: string;
  courses: string;
  awardsHonors: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ResumeWorkExperienceInput {
  companyName: string;
  roleTitle: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string;
}

export interface ResumeProjectInput {
  name: string;
  link: string;
  technologies: string;
  description: string;
}

export interface ResumeCertificationInput {
  name: string;
  issuer: string;
  issueDate: string;
  credentialId: string;
}

export interface ResumeVersionWithDetails {
  id: string;
  title: string;
  summary: string | null;
  skills: string | null;
  isMain: boolean;
  applicationId: number | null;
  parentVersionId: string | null;
  parentTitle: string | null;
  fontSize: number;
  margin: number;
  createdAt: string;
  updatedAt: string;
  education: Array<{
    id: number;
    sortOrder: number;
    schoolName: string;
    degree: string;
    fieldOfStudy: string;
    gpa: string | null;
    courses: string | null;
    awardsHonors: string | null;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
    createdAt: string;
  }>;
  workExperience: Array<{
    id: number;
    sortOrder: number;
    companyName: string;
    roleTitle: string;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
    bullets: string | null;
    createdAt: string;
  }>;
  projects: Array<{
    id: number;
    sortOrder: number;
    name: string;
    link: string | null;
    technologies: string | null;
    description: string | null;
    createdAt: string;
  }>;
  certifications: Array<{
    id: number;
    sortOrder: number;
    name: string;
    issuer: string | null;
    issueDate: string | null;
    credentialId: string | null;
    createdAt: string;
  }>;
  documents: Array<{
    id: number;
    format: string;
    label: string;
    filePath: string;
    createdAt: string;
  }>;
}

async function getResumeVersionRowByPublicId(publicId: string) {
  const rows = await db
    .select()
    .from(resumeVersions)
    .where(eq(resumeVersions.publicId, publicId))
    .limit(1);

  return rows[0] ?? null;
}

export async function listResumeVersions(): Promise<ResumeVersionWithDetails[]> {
  const versions = await db
    .select({
      id: resumeVersions.id,
      publicId: resumeVersions.publicId,
      title: resumeVersions.title,
      summary: resumeVersions.summary,
      skills: resumeVersions.skills,
      isMain: resumeVersions.isMain,
      applicationId: resumeVersions.applicationId,
      parentVersionId: resumeVersions.parentVersionId,
      fontSize: resumeVersions.fontSize,
      marginTop: resumeVersions.marginTop,
      createdAt: resumeVersions.createdAt,
      updatedAt: resumeVersions.updatedAt,
    })
    .from(resumeVersions)
    .orderBy(desc(resumeVersions.isMain), desc(resumeVersions.updatedAt), desc(resumeVersions.id));

  if (versions.length === 0) {
    return [];
  }

  const versionIds = versions.map((version) => version.id);
  const [educationEntries, workExperiences, projects, certifications, documents, parents] = await Promise.all([
    db
      .select()
      .from(resumeEducationEntries)
      .where(inArray(resumeEducationEntries.resumeVersionId, versionIds))
      .orderBy(
        asc(resumeEducationEntries.resumeVersionId),
        asc(resumeEducationEntries.sortOrder),
        asc(resumeEducationEntries.id)
      ),
    db
      .select()
      .from(resumeWorkExperiences)
      .where(inArray(resumeWorkExperiences.resumeVersionId, versionIds))
      .orderBy(
        asc(resumeWorkExperiences.resumeVersionId),
        asc(resumeWorkExperiences.sortOrder),
        asc(resumeWorkExperiences.id)
      ),
    db
      .select()
      .from(resumeProjects)
      .where(inArray(resumeProjects.resumeVersionId, versionIds))
      .orderBy(
        asc(resumeProjects.resumeVersionId),
        asc(resumeProjects.sortOrder),
        asc(resumeProjects.id)
      ),
    db
      .select()
      .from(resumeCertifications)
      .where(inArray(resumeCertifications.resumeVersionId, versionIds))
      .orderBy(
        asc(resumeCertifications.resumeVersionId),
        asc(resumeCertifications.sortOrder),
        asc(resumeCertifications.id)
      ),
    db
      .select()
      .from(resumeGeneratedDocuments)
      .where(inArray(resumeGeneratedDocuments.resumeVersionId, versionIds))
      .orderBy(desc(resumeGeneratedDocuments.createdAt), desc(resumeGeneratedDocuments.id)),
    db.select().from(resumeVersions),
  ]);

  const parentTitles = new Map(parents.map((parent) => [parent.id, parent.title]));
  const parentPublicIds = new Map(parents.map((parent) => [parent.id, parent.publicId]));
  const educationByVersion = new Map<number, ResumeVersionWithDetails["education"]>();
  const workExperienceByVersion = new Map<number, ResumeVersionWithDetails["workExperience"]>();
  const projectsByVersion = new Map<number, ResumeVersionWithDetails["projects"]>();
  const certificationsByVersion = new Map<number, ResumeVersionWithDetails["certifications"]>();
  const documentsByVersion = new Map<number, ResumeVersionWithDetails["documents"]>();

  for (const entry of educationEntries) {
    const list = educationByVersion.get(entry.resumeVersionId) ?? [];
    list.push(entry);
    educationByVersion.set(entry.resumeVersionId, list);
  }

  for (const entry of workExperiences) {
    const list = workExperienceByVersion.get(entry.resumeVersionId) ?? [];
    list.push(entry);
    workExperienceByVersion.set(entry.resumeVersionId, list);
  }

  for (const entry of projects) {
    const list = projectsByVersion.get(entry.resumeVersionId) ?? [];
    list.push(entry);
    projectsByVersion.set(entry.resumeVersionId, list);
  }

  for (const entry of certifications) {
    const list = certificationsByVersion.get(entry.resumeVersionId) ?? [];
    list.push(entry);
    certificationsByVersion.set(entry.resumeVersionId, list);
  }

  for (const document of documents) {
    const list = documentsByVersion.get(document.resumeVersionId) ?? [];
    list.push(document);
    documentsByVersion.set(document.resumeVersionId, list);
  }

  return versions.map((version) => ({
    id: version.publicId,
    title: version.title,
    summary: version.summary,
    skills: version.skills,
    isMain: version.isMain,
    applicationId: version.applicationId,
    parentVersionId: version.parentVersionId ? (parentPublicIds.get(version.parentVersionId) ?? null) : null,
    parentTitle: version.parentVersionId ? (parentTitles.get(version.parentVersionId) ?? null) : null,
    fontSize: version.fontSize,
    margin: version.marginTop,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
    education: educationByVersion.get(version.id) ?? [],
    workExperience: workExperienceByVersion.get(version.id) ?? [],
    projects: projectsByVersion.get(version.id) ?? [],
    certifications: certificationsByVersion.get(version.id) ?? [],
    documents: documentsByVersion.get(version.id) ?? [],
  }));
}

export async function getResumeVersion(versionId: string): Promise<ResumeVersionWithDetails | null> {
  const versions = await listResumeVersions();
  return versions.find((version) => version.id === versionId) ?? null;
}

export async function createResumeVersion(
  title: string,
  parentVersionId?: string | null,
  options?: { applicationId?: number | null }
) {
  let parentConfig: Pick<
    ResumeVersionWithDetails,
    "fontSize" | "margin" | "summary" | "skills"
  > | null = null;
  let parentRowId: number | null = null;

  if (parentVersionId) {
    const parent = await getResumeVersionRowByPublicId(parentVersionId);
    parentConfig = parent ? {
      summary: parent.summary,
      skills: parent.skills,
      fontSize: parent.fontSize,
      margin: parent.marginTop,
    } : null;
    parentRowId = parent?.id ?? null;
  }

  const inserted = await db
    .insert(resumeVersions)
    .values({
      publicId: uuidv4(),
      title,
      summary: parentConfig?.summary ?? null,
      skills: parentConfig?.skills ?? null,
      isMain: false,
      applicationId: options?.applicationId ?? null,
      parentVersionId: parentRowId,
      fontSize: parentConfig?.fontSize ?? 11,
      marginTop: parentConfig?.margin ?? 0.75,
      marginRight: parentConfig?.margin ?? 0.75,
      marginBottom: parentConfig?.margin ?? 0.75,
      marginLeft: parentConfig?.margin ?? 0.75,
    })
    .returning();

  const version = inserted[0];

  if (parentRowId) {
    const parentEducation = await db
      .select()
      .from(resumeEducationEntries)
      .where(eq(resumeEducationEntries.resumeVersionId, parentRowId))
      .orderBy(asc(resumeEducationEntries.sortOrder), asc(resumeEducationEntries.id));

    if (parentEducation.length > 0) {
      await db.insert(resumeEducationEntries).values(
        parentEducation.map((entry, index) => ({
          resumeVersionId: version.id,
          sortOrder: index,
          schoolName: entry.schoolName,
          degree: entry.degree,
          fieldOfStudy: entry.fieldOfStudy,
          gpa: entry.gpa,
          courses: entry.courses,
          awardsHonors: entry.awardsHonors,
          startDate: entry.startDate,
          endDate: entry.endDate,
          description: entry.description,
        }))
      );
    }

    const [parentWorkExperiences, parentProjects, parentCertifications] = await Promise.all([
      db
        .select()
        .from(resumeWorkExperiences)
        .where(eq(resumeWorkExperiences.resumeVersionId, parentRowId))
        .orderBy(asc(resumeWorkExperiences.sortOrder), asc(resumeWorkExperiences.id)),
      db
        .select()
        .from(resumeProjects)
        .where(eq(resumeProjects.resumeVersionId, parentRowId))
        .orderBy(asc(resumeProjects.sortOrder), asc(resumeProjects.id)),
      db
        .select()
        .from(resumeCertifications)
        .where(eq(resumeCertifications.resumeVersionId, parentRowId))
        .orderBy(asc(resumeCertifications.sortOrder), asc(resumeCertifications.id)),
    ]);

    if (parentWorkExperiences.length > 0) {
      await db.insert(resumeWorkExperiences).values(
        parentWorkExperiences.map((entry, index) => ({
          resumeVersionId: version.id,
          sortOrder: index,
          companyName: entry.companyName,
          roleTitle: entry.roleTitle,
          location: entry.location,
          startDate: entry.startDate,
          endDate: entry.endDate,
          bullets: entry.bullets,
        }))
      );
    }

    if (parentProjects.length > 0) {
      await db.insert(resumeProjects).values(
        parentProjects.map((entry, index) => ({
          resumeVersionId: version.id,
          sortOrder: index,
          name: entry.name,
          link: entry.link,
          technologies: entry.technologies,
          description: entry.description,
        }))
      );
    }

    if (parentCertifications.length > 0) {
      await db.insert(resumeCertifications).values(
        parentCertifications.map((entry, index) => ({
          resumeVersionId: version.id,
          sortOrder: index,
          name: entry.name,
          issuer: entry.issuer,
          issueDate: entry.issueDate,
          credentialId: entry.credentialId,
        }))
      );
    }
  }

  return getResumeVersion(version.publicId);
}

export async function updateResumeVersion(
  versionId: string,
  data: {
    title: string;
    summary: string;
    skills: string;
    fontSize: number;
    margin: number;
    education: ResumeEducationInput[];
    workExperience: ResumeWorkExperienceInput[];
    projects: ResumeProjectInput[];
    certifications: ResumeCertificationInput[];
  }
) {
  const versionRow = await getResumeVersionRowByPublicId(versionId);
  if (!versionRow) {
    return null;
  }

  await db
    .update(resumeVersions)
    .set({
      title: data.title,
      summary: data.summary || null,
      skills: data.skills || null,
      fontSize: data.fontSize,
      marginTop: data.margin,
      marginRight: data.margin,
      marginBottom: data.margin,
      marginLeft: data.margin,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(resumeVersions.id, versionRow.id));

  await db.delete(resumeEducationEntries).where(eq(resumeEducationEntries.resumeVersionId, versionRow.id));
  await db.delete(resumeWorkExperiences).where(eq(resumeWorkExperiences.resumeVersionId, versionRow.id));
  await db.delete(resumeProjects).where(eq(resumeProjects.resumeVersionId, versionRow.id));
  await db.delete(resumeCertifications).where(eq(resumeCertifications.resumeVersionId, versionRow.id));

  if (data.education.length > 0) {
    await db.insert(resumeEducationEntries).values(
      data.education.map((entry, index) => ({
        resumeVersionId: versionRow.id,
        sortOrder: index,
        schoolName: entry.schoolName,
        degree: entry.degree,
        fieldOfStudy: entry.fieldOfStudy,
        gpa: entry.gpa || null,
        courses: entry.courses || null,
        awardsHonors: entry.awardsHonors || null,
        startDate: entry.startDate || null,
        endDate: entry.endDate || null,
        description: entry.description || null,
      }))
    );
  }

  if (data.workExperience.length > 0) {
    await db.insert(resumeWorkExperiences).values(
      data.workExperience.map((entry, index) => ({
        resumeVersionId: versionRow.id,
        sortOrder: index,
        companyName: entry.companyName,
        roleTitle: entry.roleTitle,
        location: entry.location || null,
        startDate: entry.startDate || null,
        endDate: entry.endDate || null,
        bullets: entry.bullets || null,
      }))
    );
  }

  if (data.projects.length > 0) {
    await db.insert(resumeProjects).values(
      data.projects.map((entry, index) => ({
        resumeVersionId: versionRow.id,
        sortOrder: index,
        name: entry.name,
        link: entry.link || null,
        technologies: entry.technologies || null,
        description: entry.description || null,
      }))
    );
  }

  if (data.certifications.length > 0) {
    await db.insert(resumeCertifications).values(
      data.certifications.map((entry, index) => ({
        resumeVersionId: versionRow.id,
        sortOrder: index,
        name: entry.name,
        issuer: entry.issuer || null,
        issueDate: entry.issueDate || null,
        credentialId: entry.credentialId || null,
      }))
    );
  }

  await db
    .update(resumeVersions)
    .set({ updatedAt: sql`(datetime('now'))` })
    .where(eq(resumeVersions.id, versionRow.id));

  return getResumeVersion(versionId);
}

export async function getMainResumeVersion(): Promise<ResumeVersionWithDetails | null> {
  const versions = await listResumeVersions();
  return versions.find((version) => version.isMain) ?? null;
}

export async function setMainResumeVersion(versionId: string) {
  const versionRow = await getResumeVersionRowByPublicId(versionId);
  if (!versionRow) {
    return null;
  }

  await db.update(resumeVersions).set({ isMain: false });
  await db
    .update(resumeVersions)
    .set({
      isMain: true,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(resumeVersions.id, versionRow.id));

  return getResumeVersion(versionId);
}

export async function addGeneratedResumeDocument(
  resumeVersionId: string,
  format: string,
  label: string,
  filePath: string
) {
  const versionRow = await getResumeVersionRowByPublicId(resumeVersionId);
  if (!versionRow) {
    return null;
  }

  const inserted = await db
    .insert(resumeGeneratedDocuments)
    .values({ resumeVersionId: versionRow.id, format, label, filePath })
    .returning();

  await db
    .update(resumeVersions)
    .set({ updatedAt: sql`(datetime('now'))` })
    .where(eq(resumeVersions.id, versionRow.id));

  return inserted[0] ?? null;
}

export async function getGeneratedResumeDocument(documentId: number) {
  const rows = await db
    .select()
    .from(resumeGeneratedDocuments)
    .where(eq(resumeGeneratedDocuments.id, documentId))
    .limit(1);

  return rows[0] ?? null;
}

export async function deleteGeneratedResumeDocument(documentId: number) {
  await db.delete(resumeGeneratedDocuments).where(eq(resumeGeneratedDocuments.id, documentId));
}
