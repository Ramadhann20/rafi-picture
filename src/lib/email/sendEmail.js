import { getGmailClient } from "./gmail";

function sanitizeHeader(value) {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim();
}

function encodeHeader(value) {
  const safeValue = sanitizeHeader(value);

  return `=?UTF-8?B?${Buffer.from(
    safeValue,
    "utf8"
  ).toString("base64")}?=`;
}

function normalizeRecipients(value) {
  const recipients = Array.isArray(value)
    ? value
    : [value];

  const normalized = recipients
    .map((item) => sanitizeHeader(item))
    .filter(Boolean);

  if (!normalized.length) {
    throw new Error(
      "[Gmail] Minimal satu alamat penerima diperlukan."
    );
  }

  return normalized.join(", ");
}

function wrapBase64(value) {
  return value.match(/.{1,76}/g)?.join("\r\n") || "";
}

function encodeBody(value) {
  return wrapBase64(
    Buffer.from(
      String(value ?? ""),
      "utf8"
    ).toString("base64")
  );
}

function normalizeAttachment(attachment) {
  if (!attachment) return null;

  const filename = sanitizeHeader(
    attachment.filename || "attachment.pdf"
  ).replace(/"/g, "");

  const contentType =
    sanitizeHeader(
      attachment.contentType || "application/pdf"
    ) || "application/pdf";

  const content = Buffer.isBuffer(attachment.content)
    ? attachment.content
    : Buffer.from(attachment.content ?? "");

  if (!content.length) {
    throw new Error(
      "[Gmail] Attachment tidak memiliki isi file."
    );
  }

  return {
    filename: filename || "attachment.pdf",
    contentType,
    content,
  };
}

function createAlternativePart({
  textBody,
  htmlBody,
  boundary,
}) {
  return [
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    textBody,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    htmlBody,
    "",
    `--${boundary}--`,
  ].join("\r\n");
}

function createMimeMessage({
  to,
  subject,
  html,
  text,
  fromName,
  attachment = null,
}) {
  const senderEmail =
    process.env.GMAIL_SENDER_EMAIL?.trim();

  if (!senderEmail) {
    throw new Error(
      "[Gmail] GMAIL_SENDER_EMAIL belum diisi."
    );
  }

  const safeFromName =
    sanitizeHeader(fromName || "Rafi Picture");

  const safeSender =
    sanitizeHeader(senderEmail);

  const alternativeBoundary =
    `rafi_picture_alt_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;

  const plainText =
    text ||
    String(html ?? "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const textBody = encodeBody(plainText);
  const htmlBody = encodeBody(
    html || `<p>${plainText}</p>`
  );

  const headers = [
    `From: ${encodeHeader(safeFromName)} <${safeSender}>`,
    `To: ${normalizeRecipients(to)}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
  ];

  const alternativePart =
    createAlternativePart({
      textBody,
      htmlBody,
      boundary: alternativeBoundary,
    });

  const normalizedAttachment =
    normalizeAttachment(attachment);

  let message;

  // IMPORTANT:
  // Tanpa attachment, format tetap sama seperti service OTP/email lama:
  // multipart/alternative -> text + html.
  if (!normalizedAttachment) {
    message = [
      ...headers,
      alternativePart,
    ].join("\r\n");
  } else {
    const mixedBoundary =
      `rafi_picture_mixed_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}`;

    const attachmentBody = wrapBase64(
      normalizedAttachment.content.toString("base64")
    );

    message = [
      ...headers,
      `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
      "",
      `--${mixedBoundary}`,
      alternativePart,
      "",
      `--${mixedBoundary}`,
      `Content-Type: ${normalizedAttachment.contentType}; name="${normalizedAttachment.filename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${normalizedAttachment.filename}"`,
      "",
      attachmentBody,
      "",
      `--${mixedBoundary}--`,
    ].join("\r\n");
  }

  return Buffer.from(
    message,
    "utf8"
  ).toString("base64url");
}

export async function sendEmail({
  to,
  subject,
  html,
  text = "",
  fromName = "Rafi Picture",
  attachment = null,
}) {
  if (!subject?.trim()) {
    throw new Error(
      "[Gmail] Subject email tidak boleh kosong."
    );
  }

  if (!html?.trim() && !text?.trim()) {
    throw new Error(
      "[Gmail] Isi email tidak boleh kosong."
    );
  }

  const gmail = getGmailClient();

  const raw = createMimeMessage({
    to,
    subject,
    html,
    text,
    fromName,
    attachment,
  });

  const response =
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw,
      },
    });

  return {
    id: response.data.id ?? null,
    threadId: response.data.threadId ?? null,
  };
}
