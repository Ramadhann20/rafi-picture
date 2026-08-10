import {
  PDFDocument,
  StandardFonts,
} from "pdf-lib";

import {
  RAFI_PICTURE_INVOICE_CONFIG,
} from "./invoiceConfig";

import {
  PDF_COLORS,
  amountToEnglishWords,
  drawRightText,
  drawWrappedText,
  formatEnglishDate,
  formatPlainAmount,
  getBillingName,
  sanitizePdfText,
} from "./pdfCommon";

const PAGE_WIDTH =
  841.89;

const PAGE_HEIGHT =
  595.28;

export async function generatePaymentReceiptPdf({
  booking,
  receipt,
  invoice,
  receiptNumber,
  receiptDate =
    new Date(),
}) {
  const pdfDoc =
    await PDFDocument.create();

  pdfDoc.setTitle(
    `Receipt ${receiptNumber}`,
  );

  pdfDoc.setAuthor(
    RAFI_PICTURE_INVOICE_CONFIG
      .company.name,
  );

  pdfDoc.setSubject(
    "Rafi Picture Full Payment Receipt",
  );

  const page =
    pdfDoc.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);

  const regular =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica,
    );

  const bold =
    await pdfDoc.embedFont(
      StandardFonts.HelveticaBold,
    );

  const company =
    RAFI_PICTURE_INVOICE_CONFIG
      .company;

  const totalPaid =
    Math.max(
      Number(
        receipt?.amount ??
          receipt?.totalPaid ??
          invoice?.bookingTotal ??
          invoice?.packageTotal,
      ) || 0,
      0,
    );

  /*
   * Header kiri: logo wordmark sederhana + company details.
   */
  page.drawText(
    "RAFI PICTURE",
    {
      x: 45,
      y: 528,
      size: 11,
      font: bold,
      color:
        PDF_COLORS.ink,
    },
  );

  page.drawText(
    "keep our love in a photograph",
    {
      x: 45,
      y: 518,
      size: 5.5,
      font: regular,
      color:
        PDF_COLORS.muted,
    },
  );

  let companyY = 558;

  page.drawText(
    company.name,
    {
      x: 130,
      y: companyY,
      size: 9,
      font: bold,
      color:
        PDF_COLORS.ink,
    },
  );

  companyY -= 13;

  for (
    const line of
    company.addressLines
  ) {
    page.drawText(
      sanitizePdfText(
        line,
      ),
      {
        x: 130,
        y: companyY,
        size: 8,
        font: regular,
        color:
          PDF_COLORS.ink,
      },
    );

    companyY -= 12;
  }

  page.drawText(
    `Phone: ${company.phone}`,
    {
      x: 130,
      y: companyY,
      size: 8,
      font: regular,
      color:
        PDF_COLORS.ink,
    },
  );

  companyY -= 12;

  page.drawText(
    `Email: ${company.email}`,
    {
      x: 130,
      y: companyY,
      size: 8,
      font: regular,
      color:
        PDF_COLORS.ink,
    },
  );

  /*
   * Header kanan.
   */
  drawRightText(
    page,
    "RECEIPT",
    {
      right: 795,
      y: 538,
      font: bold,
      size: 18,
      color:
        PDF_COLORS.ink,
    },
  );

  drawRightText(
    page,
    `Payment No.  ${receiptNumber}`,
    {
      right: 795,
      y: 510,
      font: regular,
      size: 8,
      color:
        PDF_COLORS.ink,
    },
  );

  drawRightText(
    page,
    `Invoice No.  ${
      invoice?.invoiceNumber ||
      "-"
    }`,
    {
      right: 795,
      y: 496,
      font: regular,
      size: 8,
      color:
        PDF_COLORS.ink,
    },
  );

  page.drawLine({
    start: {
      x: 24,
      y: 460,
    },
    end: {
      x: 817,
      y: 460,
    },
    thickness: 0.7,
    color:
      PDF_COLORS.line,
  });

  /*
   * Receipt fields
   */
  const labelX = 25;
  const valueX = 210;
  const valueRight = 817;

  page.drawText(
    "Received From",
    {
      x: labelX,
      y: 430,
      size: 9,
      font: bold,
      color:
        PDF_COLORS.ink,
    },
  );

  page.drawText(
    sanitizePdfText(
      getBillingName(
        booking,
      ),
    ),
    {
      x: valueX,
      y: 430,
      size: 9,
      font: regular,
      color:
        PDF_COLORS.ink,
    },
  );

  page.drawLine({
    start: {
      x: valueX - 12,
      y: 413,
    },
    end: {
      x: valueRight,
      y: 413,
    },
    thickness: 0.5,
    color:
      PDF_COLORS.line,
  });

  page.drawText(
    "Amount of money",
    {
      x: labelX,
      y: 383,
      size: 9,
      font: bold,
      color:
        PDF_COLORS.ink,
    },
  );

  drawWrappedText(
    page,
    amountToEnglishWords(
      totalPaid,
    ),
    {
      x: valueX,
      y: 383,
      font: regular,
      size: 9,
      maxWidth: 580,
      lineHeight: 12,
      maxLines: 2,
      color:
        PDF_COLORS.ink,
    },
  );

  page.drawLine({
    start: {
      x: valueX - 12,
      y: 364,
    },
    end: {
      x: valueRight,
      y: 364,
    },
    thickness: 0.5,
    color:
      PDF_COLORS.line,
  });

  page.drawText(
    "For Payment",
    {
      x: labelX,
      y: 334,
      size: 9,
      font: bold,
      color:
        PDF_COLORS.ink,
    },
  );

  const packageName =
    booking?.package?.name ||
    "Rafi Picture Package";

  const eventDate =
    booking?.event
      ?.preferredDate;

  const description =
    `Full Payment for ${packageName}${
      eventDate
        ? `, ${formatEnglishDate(
            eventDate,
          )}`
        : ""
    }`;

  drawWrappedText(
    page,
    description,
    {
      x: valueX,
      y: 334,
      font: regular,
      size: 9,
      maxWidth: 580,
      lineHeight: 12,
      maxLines: 2,
      color:
        PDF_COLORS.ink,
    },
  );

  page.drawLine({
    start: {
      x: valueX - 12,
      y: 315,
    },
    end: {
      x: valueRight,
      y: 315,
    },
    thickness: 0.5,
    color:
      PDF_COLORS.line,
  });

  page.drawLine({
    start: {
      x: 24,
      y: 292,
    },
    end: {
      x: 817,
      y: 292,
    },
    thickness: 0.7,
    color:
      PDF_COLORS.line,
  });

  /*
   * TOTAL = 100% booking payment.
   * Bukan hanya nominal transfer pelunasan.
   */
  page.drawText(
    "Amount Rp",
    {
      x: 25,
      y: 240,
      size: 15,
      font: bold,
      color:
        PDF_COLORS.ink,
    },
  );

  page.drawRectangle({
    x: 165,
    y: 225,
    width: 235,
    height: 36,
    color:
      PDF_COLORS.panel,
  });

  page.drawText(
    formatPlainAmount(
      totalPaid,
    ),
    {
      x: 180,
      y: 238,
      size: 15,
      font: bold,
      color:
        PDF_COLORS.ink,
    },
  );

  drawRightText(
    page,
    formatEnglishDate(
      receiptDate,
    ),
    {
      right: 715,
      y: 243,
      font: regular,
      size: 10,
      color:
        PDF_COLORS.ink,
    },
  );

  drawRightText(
    page,
    "Rafi Picture",
    {
      right: 715,
      y: 226,
      font: bold,
      size: 10,
      color:
        PDF_COLORS.ink,
    },
  );

  const bytes =
    await pdfDoc.save({
      useObjectStreams:
        false,
    });

  return Buffer.from(
    bytes,
  );
}
