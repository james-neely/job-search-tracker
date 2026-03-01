import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { db } from "@/db";
import { applications, documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { join } from "path";
import fs from "fs";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  console.log("PDF generation: Starting for application", id);
  console.log("Working directory:", process.cwd());
  console.log("NODE_PATH:", process.env.NODE_PATH);

  try {
    const { font = "ocr-a", text } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "No cover letter text provided" }, { status: 400 });
    }

    // Get the application for the header
    const application = await db
      .select()
      .from(applications)
      .where(eq(applications.id, Number(id)))
      .limit(1);

    if (!application[0]) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Validate font
    if (!["ocr-a", "ocr-b"].includes(font)) {
      return NextResponse.json({ error: "Invalid font selection" }, { status: 400 });
    }

    console.log("PDF generation: Creating PDF document");

    // Create PDF document with explicit font settings
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 50,
      font: "Courier", // Use Courier as default font to avoid path issues
    });

    console.log("PDF generation: PDF document created successfully");

    // Collect PDF buffer
    const buffers: Buffer[] = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {});

    // Use Courier fonts for machine-readable, monospaced text
    // (Actual OCR-A/OCR-B fonts are not readily available in compatible TTF format)
    console.log("PDF generation: Registering fonts");
    doc.registerFont("ocr-a", "Courier");
    doc.registerFont("ocr-b", "Courier-Bold");
    console.log("PDF generation: Fonts registered successfully");

    // Header
    try {
      doc
        .fontSize(14)
        .font("Courier-Bold") // Use Courier-Bold instead of Helvetica-Bold
        .text(`${application[0].companyName} - ${application[0].jobTitle}`, { align: "center" })
        .moveDown(2);
    } catch (headerError) {
      console.error("Header error:", headerError);
      throw new Error("Failed to add header to PDF");
    }

    // Cover letter content in OCR font
    try {
      doc
        .fontSize(10)
        .font(font === "ocr-b" ? "ocr-b" : "ocr-a")
        .text(text, {
          align: "left",
          lineGap: 2,
        });
    } catch (contentError) {
      console.error("Content error:", contentError);
      throw new Error("Failed to add content to PDF");
    }

    await new Promise<void>((resolve, reject) => {
      doc.on("end", resolve);
      doc.on("error", reject);
      doc.end();
    });

    const pdfBuffer = Buffer.concat(buffers);

    // Save PDF file
    const filename = `cover-letter-${Date.now()}.pdf`;
    const filepath = join(process.cwd(), "data", "uploads", filename);

    try {
      await fs.promises.writeFile(filepath, pdfBuffer);
    } catch (fileError) {
      console.error("File write error:", fileError);
      const errorMessage = fileError instanceof Error ? fileError.message : String(fileError);
      throw new Error(`Failed to save PDF file: ${errorMessage}`);
    }

    // Create document record
    let docRecord;
    try {
      docRecord = await db
        .insert(documents)
        .values({
          applicationId: Number(id),
          label: `Generated Cover Letter PDF (${font === "ocr-a" ? "Courier" : "Courier Bold"})`,
          filePath: filename,
          isUrl: false,
        })
        .returning();
    } catch (dbError) {
      console.error("Database error:", dbError);
      // Clean up the file if DB insert fails
      try {
        await fs.promises.unlink(filepath);
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      throw new Error(`Failed to save document record: ${errorMessage}`);
    }

    return NextResponse.json({
      success: true,
      document: docRecord[0],
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("PDF generation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}