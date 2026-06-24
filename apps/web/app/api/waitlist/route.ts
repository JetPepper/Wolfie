import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const waitlistColumns = [
  "Created At",
  "Updated At",
  "Full Name",
  "Email Address",
  "Trading Experience",
  "Interest",
  "Submission Count",
  "Source",
  "User Agent"
] as const;

type WaitlistColumn = (typeof waitlistColumns)[number];
type WaitlistRow = Record<WaitlistColumn, string | number>;
type RawSubmission = Record<string, unknown>;

type NormalizedSubmission = {
  fullName: string;
  emailAddress: string;
  tradingExperience: string;
  interest: string;
  source: string;
  userAgent: string;
  submittedAt: Date;
};

type WorkbookResult = {
  filename: string;
  path: string;
  rowCount: number;
  updatedExisting: boolean;
  row: WaitlistRow;
};

type EmailResult =
  | { sent: true; provider: "resend" | "file"; destination: string }
  | { sent: false; provider: "resend"; error: string };

export async function POST(request: Request) {
  let raw: RawSubmission;

  try {
    raw = (await request.json()) as RawSubmission;
  } catch {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  const submission = normalizeSubmission(raw, request);
  const validationError = validateSubmission(submission);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  let workbookResult: WorkbookResult;
  try {
    workbookResult = writeWaitlistWorkbook(submission);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown XLSX error";
    console.error("Waitlist XLSX write failed", message);
    return NextResponse.json({ error: `Waitlist XLSX write failed: ${message}` }, { status: 500 });
  }

  let email: EmailResult;
  try {
    email = await sendWaitlistEmail(workbookResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    console.error("Waitlist email failed", message);
    email = { sent: false, provider: "resend", error: message };
  }

  return NextResponse.json({
    ok: true,
    xlsx: {
      filename: workbookResult.filename,
      rowCount: workbookResult.rowCount,
      updatedExisting: workbookResult.updatedExisting
    },
    email
  });
}

function normalizeSubmission(raw: RawSubmission, request: Request): NormalizedSubmission {
  return {
    fullName: firstString(raw.fullName, raw.name, raw["wl-name"]),
    emailAddress: firstString(raw.emailAddress, raw.email, raw["wl-email"]).toLowerCase(),
    tradingExperience: firstString(raw.tradingExperience, raw.experience, raw.userType, raw["wl-exp"]),
    interest: firstString(raw.interest, raw["wl-int"]),
    source: firstString(raw.source, "uploaded-landing-page"),
    userAgent: request.headers.get("user-agent") || "",
    submittedAt: new Date()
  };
}

function validateSubmission(submission: NormalizedSubmission) {
  if (!submission.fullName) return "Name is required.";
  if (!submission.emailAddress) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.emailAddress)) {
    return "Enter a valid email address.";
  }
  if (!submission.tradingExperience) return "Trading experience is required.";
  if (!submission.interest) return "Interest is required.";
  return null;
}

function writeWaitlistWorkbook(submission: NormalizedSubmission): WorkbookResult {
  const workbookPath = getWorkbookPath();
  mkdirSync(path.dirname(workbookPath), { recursive: true });

  const existingRows = readWaitlistRows(workbookPath);
  const submittedAt = submission.submittedAt.toISOString();
  const existingIndex = existingRows.findIndex(
    (row) => String(row["Email Address"]).toLowerCase() === submission.emailAddress
  );

  const nextRow: WaitlistRow = {
    "Created At": existingIndex >= 0 ? existingRows[existingIndex]["Created At"] || submittedAt : submittedAt,
    "Updated At": submittedAt,
    "Full Name": submission.fullName,
    "Email Address": submission.emailAddress,
    "Trading Experience": submission.tradingExperience,
    Interest: submission.interest,
    "Submission Count":
      existingIndex >= 0 ? Number(existingRows[existingIndex]["Submission Count"] || 1) + 1 : 1,
    Source: submission.source,
    "User Agent": submission.userAgent
  };

  const rows = [...existingRows];
  if (existingIndex >= 0) {
    rows[existingIndex] = nextRow;
  } else {
    rows.push(nextRow);
  }

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...waitlistColumns] });
  XLSX.utils.book_append_sheet(workbook, worksheet, "Waitlist");
  const workbookBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
  writeFileSync(workbookPath, workbookBuffer);

  return {
    filename: path.basename(workbookPath),
    path: workbookPath,
    rowCount: rows.length,
    updatedExisting: existingIndex >= 0,
    row: nextRow
  };
}

function readWaitlistRows(workbookPath: string): WaitlistRow[] {
  if (!existsSync(workbookPath)) return [];

  const workbook = XLSX.read(readFileSync(workbookPath), { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });
  return rows.map((row) => {
    const normalized = Object.fromEntries(
      waitlistColumns.map((column) => [column, row[column] ?? ""])
    ) as WaitlistRow;
    normalized["Submission Count"] = Number(normalized["Submission Count"] || 1);
    return normalized;
  });
}

async function sendWaitlistEmail(workbookResult: WorkbookResult): Promise<EmailResult> {
  const destination = getEmailDestination();
  const subject = "New Wolfie Waitlist Submission";
  const text = waitlistColumns
    .map((column) => `${column}: ${String(workbookResult.row[column] || "-")}`)
    .join("\n");
  const htmlRows = waitlistColumns
    .map(
      (column) =>
        `<tr><th style="text-align:left;padding:8px 12px;border:1px solid #333744;">${escapeHtml(
          column
        )}</th><td style="padding:8px 12px;border:1px solid #333744;">${escapeHtml(
          String(workbookResult.row[column] || "-")
        )}</td></tr>`
    )
    .join("");
  const attachment = {
    filename: workbookResult.filename,
    content: readFileSync(workbookResult.path).toString("base64")
  };

  if (process.env.WOLFIE_WAITLIST_EMAIL_MODE === "file") {
    const emailPath =
      process.env.WOLFIE_WAITLIST_EMAIL_PATH ||
      path.resolve(path.dirname(workbookResult.path), "wolfie-waitlist-email.json");
    mkdirSync(path.dirname(emailPath), { recursive: true });
    writeFileSync(
      emailPath,
      JSON.stringify(
        {
          provider: "file",
          createdAt: new Date().toISOString(),
          to: destination,
          subject,
          text,
          html: `<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">${htmlRows}</table>`,
          attachments: [attachment]
        },
        null,
        2
      )
    );
    return { sent: true, provider: "file", destination: emailPath };
  }

  const missing = ["RESEND_API_KEY", "WOLFIE_WAITLIST_FROM"].filter((key) => !process.env[key]);
  if (missing.length > 0) {
    return {
      sent: false,
      provider: "resend",
      error: `Email provider credentials are missing: ${missing.join(", ")}.`
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.WOLFIE_WAITLIST_FROM,
      to: destination,
      subject,
      text,
      html: `<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">${htmlRows}</table>`,
      attachments: [attachment]
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    return {
      sent: false,
      provider: "resend",
      error: `Email provider request failed with status ${response.status}: ${detail}`
    };
  }

  return { sent: true, provider: "resend", destination: destination.join(", ") };
}

function getWorkbookPath() {
  return process.env.WOLFIE_WAITLIST_XLSX_PATH
    ? path.resolve(process.env.WOLFIE_WAITLIST_XLSX_PATH)
    : path.resolve(process.cwd(), "../../data/wolfie-waitlist.xlsx");
}

function getEmailDestination() {
  return (process.env.WOLFIE_WAITLIST_TO || "support@wolfietrade.com")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
