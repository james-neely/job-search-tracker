import PDFDocument from "pdfkit";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { ResumeVersion } from "@/types";

function compact(parts: Array<string | null | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean) as string[];
}

function inchesToTwips(value: number) {
  return Math.round(value * 1440);
}

function inchesToPoints(value: number) {
  return value * 72;
}

interface SkillGroup {
  category: string;
  skills: string[];
}

function parseBulletLines(value: string | null | undefined) {
  if (!value?.trim()) return [];

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
}

function parseSkillsSection(skills: string | null | undefined): SkillGroup[] {
  if (!skills?.trim()) return [];

  const groups = skills
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        return {
          category: "Skills",
          skills: line.split(",").map((skill) => skill.trim()).filter(Boolean),
        };
      }

      const category = line.slice(0, separatorIndex).trim() || "Skills";
      const values = line
        .slice(separatorIndex + 1)
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      return {
        category,
        skills: values,
      };
    })
    .filter((group) => group.skills.length > 0);

  const mergedGroups = new Map<string, string[]>();
  for (const group of groups) {
    const existing = mergedGroups.get(group.category) ?? [];
    mergedGroups.set(group.category, [...existing, ...group.skills]);
  }

  return Array.from(mergedGroups.entries()).map(([category, values]) => ({
    category,
    skills: Array.from(new Set(values)),
  }));
}

function parseMonth(value: string | null | undefined) {
  if (!value) return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  if (Number.isNaN(year) || Number.isNaN(month)) return null;
  return new Date(year, month, 1);
}

function getSortDate(endDate: string | null | undefined, startDate: string | null | undefined) {
  return parseMonth(endDate) ?? parseMonth(startDate) ?? new Date(0);
}

function sortWorkExperience<T extends { startDate?: string | null; endDate?: string | null }>(entries: T[]) {
  return [...entries].sort(
    (left, right) =>
      getSortDate(right.endDate, right.startDate).getTime() -
      getSortDate(left.endDate, left.startDate).getTime()
  );
}

function getResumeExperienceYears(version: ResumeVersion) {
  const ranges = version.workExperience
    .map((entry) => {
      const start = parseMonth(entry.startDate);
      const end = parseMonth(entry.endDate) ?? new Date();
      if (!start || end < start) return null;
      return { start, end };
    })
    .filter(Boolean) as Array<{ start: Date; end: Date }>;

  if (ranges.length === 0) return 0;

  const earliestStart = ranges.reduce((earliest, range) =>
    range.start < earliest ? range.start : earliest
  , ranges[0].start);
  const latestEnd = ranges.reduce((latest, range) =>
    range.end > latest ? range.end : latest
  , ranges[0].end);

  return (latestEnd.getTime() - earliestStart.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

function shouldPlaceEducationLast(version: ResumeVersion) {
  return getResumeExperienceYears(version) >= 3;
}

function bodyTextRun(text: string, fontSize: number, bold = false) {
  return new TextRun({
    text,
    bold,
    size: Math.round(fontSize * 2),
    font: "Courier New",
  });
}

function sectionHeader(text: string, fontSize: number) {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: text.toUpperCase(), size: Math.round((fontSize + 3) * 2), font: "Courier New" })],
  });
}

function addSectionHeading(lines: string[], title: string) {
  lines.push(`## ${title.toUpperCase()}`);
  lines.push("");
}

export function renderResumeMarkdown(
  version: ResumeVersion,
  settings: Record<string, string>
): string {
  const lines: string[] = [];
  const workExperience = sortWorkExperience(version.workExperience);
  const educationLast = shouldPlaceEducationLast(version);
  const skillGroups = parseSkillsSection(version.skills);
  const name = settings.full_name?.trim() || "Your Name";
  const contact = compact([
    settings.email,
    settings.phone,
    settings.linkedin_url,
    settings.github_url,
    settings.portfolio_url || settings.website_url,
  ]);

  lines.push(`# ${name}`);
  if (contact.length > 0) {
    lines.push(contact.join(" | "));
  }

  lines.push("");
  lines.push(`_Resume Version: ${version.title}_`);
  lines.push("");
  if (version.summary?.trim()) {
    addSectionHeading(lines, "Summary");
    lines.push(version.summary.trim());
    lines.push("");
  }

  if (skillGroups.length > 0) {
    addSectionHeading(lines, "Skills");
    for (const group of skillGroups) {
      lines.push(`${group.category}: ${group.skills.join(", ")}`);
    }
    lines.push("");
  }

  const appendEducation = () => {
    addSectionHeading(lines, "Education");

    if (version.education.length === 0) {
      lines.push("_Add education entries to build this resume._");
    } else {
      for (const entry of version.education) {
        const header = compact([entry.schoolName, entry.degree]).join(" - ") || "Untitled Education";
        const dateRange = compact([entry.startDate, entry.endDate]).join(" to ");

        lines.push(`### ${header}`);
        if (entry.fieldOfStudy) {
          lines.push(entry.fieldOfStudy);
        }
        if (entry.gpa) {
          lines.push(`GPA: ${entry.gpa}`);
        }
        if (dateRange) {
          lines.push(dateRange);
        }
        if (entry.courses) {
          lines.push("");
          lines.push("Courses:");
          for (const bullet of parseBulletLines(entry.courses)) {
            lines.push(`- ${bullet}`);
          }
        }
        if (entry.awardsHonors) {
          lines.push("");
          lines.push("Awards & Honors:");
          for (const bullet of parseBulletLines(entry.awardsHonors)) {
            lines.push(`- ${bullet}`);
          }
        }
        if (entry.description) {
          lines.push("");
          for (const bullet of parseBulletLines(entry.description)) {
            lines.push(`- ${bullet}`);
          }
        }
        lines.push("");
      }
    }
  };

  if (workExperience.length > 0) {
    addSectionHeading(lines, "Work Experience");
    for (const entry of workExperience) {
      const dateRange = compact([entry.startDate, entry.endDate]).join(" to ");
      const header = compact([entry.roleTitle, entry.companyName, entry.location, dateRange]).join(" | ") || "Untitled Experience";
      const bullets = parseBulletLines(entry.bullets);
      lines.push(`### ${header}`);
      if (bullets.length > 0) {
        lines.push("");
        for (const bullet of bullets) {
          lines.push(`- ${bullet}`);
        }
      }
      lines.push("");
    }
  }

  if (version.projects.length > 0) {
    addSectionHeading(lines, "Projects");
    for (const entry of version.projects) {
      lines.push(`### ${entry.name || "Untitled Project"}`);
      if (entry.link) lines.push(entry.link);
      if (entry.technologies) lines.push(`Technologies: ${entry.technologies}`);
      if (entry.description) {
        lines.push("");
        lines.push(entry.description);
      }
      lines.push("");
    }
  }

  if (!educationLast) {
    appendEducation();
  }

  if (version.certifications.length > 0) {
    addSectionHeading(lines, "Certifications");
    for (const entry of version.certifications) {
      const meta = compact([entry.issuer, entry.issueDate, entry.credentialId ? `Credential ID: ${entry.credentialId}` : ""]).join(" | ");
      lines.push(`### ${entry.name || "Untitled Certification"}`);
      if (meta) lines.push(meta);
      lines.push("");
    }
  }

  if (educationLast) {
    appendEducation();
  }

  return lines.join("\n").trim();
}

export async function renderResumeDocx(
  version: ResumeVersion,
  settings: Record<string, string>
): Promise<Buffer> {
  const children: Paragraph[] = [];
  const workExperience = sortWorkExperience(version.workExperience);
  const educationLast = shouldPlaceEducationLast(version);
  const skillGroups = parseSkillsSection(version.skills);
  const name = settings.full_name?.trim() || "Your Name";
  const contact = compact([
    settings.email,
    settings.phone,
    settings.linkedin_url,
    settings.github_url,
    settings.portfolio_url || settings.website_url,
  ]);

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: name, bold: true, size: Math.round((version.fontSize + 8) * 2), font: "Courier New" })],
    })
  );

  if (contact.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [bodyTextRun(contact.join(" | "), Math.max(version.fontSize - 1, 8))],
      })
    );
  }

  if (version.summary?.trim()) {
    children.push(sectionHeader("SUMMARY", version.fontSize));
    children.push(new Paragraph({ children: [bodyTextRun(version.summary.trim(), version.fontSize)] }));
  }

  if (skillGroups.length > 0) {
    children.push(sectionHeader("SKILLS", version.fontSize));
    for (const group of skillGroups) {
      children.push(
        new Paragraph({
          children: [
            bodyTextRun(`${group.category}: `, version.fontSize, true),
            bodyTextRun(group.skills.join(", "), version.fontSize),
          ],
        })
      );
    }
  }

  const appendEducation = () => {
    children.push(sectionHeader("EDUCATION", version.fontSize));

    if (version.education.length === 0) {
      children.push(new Paragraph({ children: [bodyTextRun("Add education entries to build this resume.", version.fontSize)] }));
    } else {
      for (const entry of version.education) {
        const header = compact([entry.schoolName, entry.degree]).join(" - ") || "Untitled Education";
        const dateRange = compact([entry.startDate, entry.endDate]).join(" to ");

        children.push(
          new Paragraph({
            spacing: { before: 120 },
            children: [bodyTextRun(header, version.fontSize + 1, true)],
          })
        );

        if (entry.fieldOfStudy) {
          children.push(new Paragraph({ children: [bodyTextRun(entry.fieldOfStudy, version.fontSize)] }));
        }
        if (entry.gpa) {
          children.push(new Paragraph({ children: [bodyTextRun(`GPA: ${entry.gpa}`, version.fontSize)] }));
        }
        if (dateRange) {
          children.push(new Paragraph({ children: [bodyTextRun(dateRange, Math.max(version.fontSize - 1, 8))] }));
        }
        if (entry.courses) {
          children.push(new Paragraph({ children: [bodyTextRun("Courses:", version.fontSize, true)] }));
          for (const bullet of parseBulletLines(entry.courses)) {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                children: [bodyTextRun(bullet, version.fontSize)],
              })
            );
          }
        }
        if (entry.awardsHonors) {
          children.push(new Paragraph({ children: [bodyTextRun("Awards & Honors:", version.fontSize, true)] }));
          for (const bullet of parseBulletLines(entry.awardsHonors)) {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                children: [bodyTextRun(bullet, version.fontSize)],
              })
            );
          }
        }
        if (entry.description) {
          for (const bullet of parseBulletLines(entry.description)) {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                children: [bodyTextRun(bullet, version.fontSize)],
              })
            );
          }
        }
      }
    }
  };

  if (workExperience.length > 0) {
    children.push(sectionHeader("WORK EXPERIENCE", version.fontSize));
    for (const entry of workExperience) {
      const dateRange = compact([entry.startDate, entry.endDate]).join(" to ");
      const header = compact([entry.roleTitle, entry.companyName, entry.location, dateRange]).join(" | ") || "Untitled Experience";
      const bullets = parseBulletLines(entry.bullets);
      children.push(new Paragraph({ spacing: { before: 120 }, children: [bodyTextRun(header, version.fontSize + 1, true)] }));
      for (const bullet of bullets) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [bodyTextRun(bullet, version.fontSize)],
          })
        );
      }
    }
  }

  if (version.projects.length > 0) {
    children.push(sectionHeader("PROJECTS", version.fontSize));
    for (const entry of version.projects) {
      children.push(new Paragraph({ spacing: { before: 120 }, children: [bodyTextRun(entry.name || "Untitled Project", version.fontSize + 1, true)] }));
      if (entry.link) children.push(new Paragraph({ children: [bodyTextRun(entry.link, Math.max(version.fontSize - 1, 8))] }));
      if (entry.technologies) children.push(new Paragraph({ children: [bodyTextRun(`Technologies: ${entry.technologies}`, version.fontSize)] }));
      if (entry.description) children.push(new Paragraph({ children: [bodyTextRun(entry.description, version.fontSize)] }));
    }
  }

  if (!educationLast) {
    appendEducation();
  }

  if (version.certifications.length > 0) {
    children.push(sectionHeader("CERTIFICATIONS", version.fontSize));
    for (const entry of version.certifications) {
      const meta = compact([entry.issuer, entry.issueDate, entry.credentialId ? `Credential ID: ${entry.credentialId}` : ""]).join(" | ");
      children.push(new Paragraph({ spacing: { before: 120 }, children: [bodyTextRun(entry.name || "Untitled Certification", version.fontSize + 1, true)] }));
      if (meta) children.push(new Paragraph({ children: [bodyTextRun(meta, version.fontSize)] }));
    }
  }

  if (educationLast) {
    appendEducation();
  }

  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: inchesToTwips(version.margin),
              right: inchesToTwips(version.margin),
              bottom: inchesToTwips(version.margin),
              left: inchesToTwips(version.margin),
            },
          },
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(document));
}

export async function renderResumePdf(
  version: ResumeVersion,
  settings: Record<string, string>
): Promise<Buffer> {
  const workExperience = sortWorkExperience(version.workExperience);
  const educationLast = shouldPlaceEducationLast(version);
  const skillGroups = parseSkillsSection(version.skills);
  const name = settings.full_name?.trim() || "Your Name";
  const contact = compact([
    settings.email,
    settings.phone,
    settings.linkedin_url,
    settings.github_url,
    settings.portfolio_url || settings.website_url,
  ]);

  const doc = new PDFDocument({
    size: "LETTER",
    margins: {
      top: inchesToPoints(version.margin),
      right: inchesToPoints(version.margin),
      bottom: inchesToPoints(version.margin),
      left: inchesToPoints(version.margin),
    },
    font: "Courier",
  });

  const buffers: Buffer[] = [];
  doc.on("data", buffers.push.bind(buffers));
  // Keep PDF content as actual text objects so the exported file remains searchable/selectable.
  doc.registerFont("ocr-a", "Courier");
  doc.registerFont("ocr-b", "Courier-Bold");

  doc.font("ocr-b").fontSize(version.fontSize + 8).text(name, { align: "center" });
  if (contact.length > 0) {
    doc.moveDown(0.25);
    doc.font("ocr-a").fontSize(Math.max(version.fontSize - 1, 8)).text(contact.join(" | "), { align: "center" });
  }

  const addPdfSectionHeader = (title: string) => {
    doc.moveDown(1.5);
    doc.font("ocr-b").fontSize(version.fontSize + 3).text(title.toUpperCase());
    doc.moveDown(0.5);
  };

  if (version.summary?.trim()) {
    addPdfSectionHeader("SUMMARY");
    doc.font("ocr-a").fontSize(version.fontSize).text(version.summary.trim());
  }

  if (skillGroups.length > 0) {
    addPdfSectionHeader("SKILLS");
    for (const group of skillGroups) {
      doc
        .font("ocr-b")
        .fontSize(version.fontSize)
        .text(`${group.category}: `, { continued: true });
      doc
        .font("ocr-a")
        .fontSize(version.fontSize)
        .text(group.skills.join(", "));
    }
  }

  const appendEducation = () => {
    addPdfSectionHeader("EDUCATION");

    if (version.education.length === 0) {
      doc.font("ocr-a").fontSize(version.fontSize).text("Add education entries to build this resume.");
    } else {
      for (const entry of version.education) {
        const header = compact([entry.schoolName, entry.degree]).join(" - ") || "Untitled Education";
        const dateRange = compact([entry.startDate, entry.endDate]).join(" to ");

        doc.font("ocr-b").fontSize(version.fontSize + 1).text(header);
        if (entry.fieldOfStudy) {
          doc.font("ocr-a").fontSize(version.fontSize).text(entry.fieldOfStudy);
        }
        if (entry.gpa) {
          doc.font("ocr-a").fontSize(version.fontSize).text(`GPA: ${entry.gpa}`);
        }
        if (dateRange) {
          doc.font("ocr-a").fontSize(Math.max(version.fontSize - 1, 8)).fillColor("gray").text(dateRange);
          doc.fillColor("black");
        }
        if (entry.courses) {
          doc.font("ocr-b").fontSize(version.fontSize).text("Courses:");
          for (const bullet of parseBulletLines(entry.courses)) {
            doc.font("ocr-a").fontSize(version.fontSize).text(`- ${bullet}`, { indent: 12 });
          }
        }
        if (entry.awardsHonors) {
          doc.font("ocr-b").fontSize(version.fontSize).text("Awards & Honors:");
          for (const bullet of parseBulletLines(entry.awardsHonors)) {
            doc.font("ocr-a").fontSize(version.fontSize).text(`- ${bullet}`, { indent: 12 });
          }
        }
        if (entry.description) {
          for (const bullet of parseBulletLines(entry.description)) {
            doc.font("ocr-a").fontSize(version.fontSize).text(`- ${bullet}`, { indent: 12 });
          }
        }
        doc.moveDown(0.8);
      }
    }
  };

  if (workExperience.length > 0) {
    addPdfSectionHeader("WORK EXPERIENCE");
    for (const entry of workExperience) {
      const dateRange = compact([entry.startDate, entry.endDate]).join(" to ");
      const header = compact([entry.roleTitle, entry.companyName, entry.location, dateRange]).join(" | ") || "Untitled Experience";
      const bullets = parseBulletLines(entry.bullets);
      doc.font("ocr-b").fontSize(version.fontSize + 1).text(header);
      for (const bullet of bullets) {
        doc.font("ocr-a").fontSize(version.fontSize).text(`- ${bullet}`, {
          indent: 12,
        });
      }
      doc.moveDown(0.8);
    }
  }

  if (version.projects.length > 0) {
    addPdfSectionHeader("PROJECTS");
    for (const entry of version.projects) {
      doc.font("ocr-b").fontSize(version.fontSize + 1).text(entry.name || "Untitled Project");
      if (entry.link) doc.font("ocr-a").fontSize(Math.max(version.fontSize - 1, 8)).text(entry.link);
      if (entry.technologies) doc.font("ocr-a").fontSize(version.fontSize).text(`Technologies: ${entry.technologies}`);
      if (entry.description) doc.font("ocr-a").fontSize(version.fontSize).text(entry.description);
      doc.moveDown(0.8);
    }
  }

  if (!educationLast) {
    appendEducation();
  }

  if (version.certifications.length > 0) {
    addPdfSectionHeader("CERTIFICATIONS");
    for (const entry of version.certifications) {
      const meta = compact([entry.issuer, entry.issueDate, entry.credentialId ? `Credential ID: ${entry.credentialId}` : ""]).join(" | ");
      doc.font("ocr-b").fontSize(version.fontSize + 1).text(entry.name || "Untitled Certification");
      if (meta) doc.font("ocr-a").fontSize(version.fontSize).text(meta);
      doc.moveDown(0.8);
    }
  }

  if (educationLast) {
    appendEducation();
  }

  await new Promise<void>((resolve, reject) => {
    doc.on("end", resolve);
    doc.on("error", reject);
    doc.end();
  });

  return Buffer.concat(buffers);
}
