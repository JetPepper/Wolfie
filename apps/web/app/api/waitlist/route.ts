import { NextResponse } from "next/server";

export const runtime = "nodejs";

type WaitlistSubmission = {
  fullName: string;
  emailAddress: string;
  phoneNumber?: string;
  preferredContact?: string;
  heardAboutWolfie?: string;
  userType?: string;
  interest?: string;
  optionalNotes?: string;
};

const columns = [
  "Submitted At",
  "Full Name",
  "Email Address",
  "Phone Number",
  "Preferred Contact",
  "Heard About Wolfie",
  "User Type",
  "Interest",
  "Optional Notes"
];

export async function POST(request: Request) {
  let data: WaitlistSubmission;

  try {
    data = (await request.json()) as WaitlistSubmission;
  } catch {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  const fullName = String(data.fullName || "").trim();
  const emailAddress = String(data.emailAddress || "").trim();

  if (!fullName) {
    return NextResponse.json({ error: "Full Name is required." }, { status: 400 });
  }

  if (!emailAddress) {
    return NextResponse.json({ error: "Email Address is required." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
    return NextResponse.json({ error: "Enter a valid Email Address." }, { status: 400 });
  }

  const submittedAt = new Date();
  const values = [
    submittedAt.toISOString(),
    fullName,
    emailAddress,
    data.phoneNumber || "",
    data.preferredContact || "",
    data.heardAboutWolfie || "",
    data.userType || "",
    data.interest || "",
    data.optionalNotes || ""
  ];

  try {
    await sendWaitlistEmail({
      submittedAt,
      rows: Object.fromEntries(columns.map((column, index) => [column, values[index]])),
      csv: [columns, values].map(formatCsvRow).join("\n")
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    console.error("Waitlist email failed", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

async function sendWaitlistEmail({
  submittedAt,
  rows,
  csv
}: {
  submittedAt: Date;
  rows: Record<string, string>;
  csv: string;
}) {
  const missing = ["RESEND_API_KEY", "WOLFIE_WAITLIST_FROM"].filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Email provider credentials are missing: ${missing.join(", ")}.`);
  }

  const filename = `wolfie-waitlist-submission-${formatTimestamp(submittedAt)}.csv`;
  const plainText = Object.entries(rows)
    .map(([key, value]) => `${key}: ${value || "-"}`)
    .join("\n");
  const htmlRows = Object.entries(rows)
    .map(
      ([key, value]) =>
        `<tr><th style="text-align:left;padding:8px 12px;border:1px solid #d9c08a;">${escapeHtml(
          key
        )}</th><td style="padding:8px 12px;border:1px solid #d9c08a;">${escapeHtml(value || "-")}</td></tr>`
    )
    .join("");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.WOLFIE_WAITLIST_FROM,
      to: ["support@wolfietrade.com"],
      subject: "New Wolfie Waitlist Submission",
      text: plainText,
      html: `<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">${htmlRows}</table>`,
      attachments: [
        {
          filename,
          content: Buffer.from(csv, "utf8").toString("base64")
        }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Email provider request failed with status ${response.status}: ${detail}`);
  }
}

function formatCsvRow(row: string[]) {
  return row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",");
}

function formatTimestamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(
    date.getHours()
  )}${pad(date.getMinutes())}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
