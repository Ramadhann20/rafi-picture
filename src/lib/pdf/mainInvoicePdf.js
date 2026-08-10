import {
  PDFDocument,
  StandardFonts,
} from "pdf-lib";

import {
  RAFI_PICTURE_INVOICE_CONFIG,
} from "./invoiceConfig";

import {
  PDF_COLORS,
  drawRightText,
  drawWrappedText,
  formatRupiahPdf,
  formatSlashDate,
  getBillingName,
  sanitizePdfText,
} from "./pdfCommon";

const PAGE_WIDTH =
  595.28;

const PAGE_HEIGHT =
  841.89;

function getPackageFeatures(
  booking,
) {
  const features =
    Array.isArray(
      booking?.package
        ?.features,
    )
      ? booking.package
          .features
      : [];

  return features
    .map(
      (feature) =>
        String(
          feature || "",
        ).trim(),
    )
    .filter(Boolean)
    .slice(0, 7);
}

function getBookingAmounts(
  booking,
  invoice,
) {
  const packageAmount =
    Math.max(
      Number(
        invoice?.packageAmount ??
          booking?.package
            ?.price,
      ) || 0,
      0,
    );

  const travelCharge =
    Math.max(
      Number(
        invoice?.travelCharge ??
          booking?.event
            ?.location
            ?.distanceCharge
            ?.amount,
      ) || 0,
      0,
    );

  const bookingTotal =
    Math.max(
      Number(
        invoice?.bookingTotal ??
          invoice?.packageTotal,
      ) ||
        packageAmount +
          travelCharge,
      0,
    );

  const depositPaid =
    Math.max(
      Number(
        invoice?.depositPaid,
      ) || 0,
      0,
    );

  const amountDue =
    Math.max(
      Number(
        invoice?.amountDue ??
          invoice?.amount,
      ) ||
        bookingTotal -
          depositPaid,
      0,
    );

  return {
    packageAmount,
    travelCharge,
    bookingTotal,
    depositPaid,
    amountDue,
  };
}

export async function generateMainInvoicePdf({
  booking,
  invoice,
  invoiceNumber,
  invoiceDate =
    new Date(),
  depositInvoice = null,
}) {
  const pdfDoc =
    await PDFDocument.create();

  pdfDoc.setTitle(
    `Invoice ${invoiceNumber}`,
  );

  pdfDoc.setAuthor(
    RAFI_PICTURE_INVOICE_CONFIG
      .company.name,
  );

  pdfDoc.setSubject(
    "Rafi Picture Final Invoice",
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

  const {
    packageAmount,
    travelCharge,
    bookingTotal,
    depositPaid,
    amountDue,
  } = getBookingAmounts(
    booking,
    invoice,
  );

  const company =
    RAFI_PICTURE_INVOICE_CONFIG
      .company;

  const bank =
    RAFI_PICTURE_INVOICE_CONFIG
      .bank;

  const left = 36;
  const right =
    PAGE_WIDTH - 36;

  /*
   * Header
   */
  page.drawText(
    "RAFI PICTURE",
    {
      x: 72,
      y: 754,
      size: 13,
      font: bold,
      color:
        PDF_COLORS.ink,
    },
  );

  page.drawText(
    "keep our love in a photograph",
    {
      x: 72,
      y: 743,
      size: 6.5,
      font: regular,
      color:
        PDF_COLORS.muted,
    },
  );

  drawRightText(
    page,
    "Invoice",
    {
      right:
        right - 10,
      y: 760,
      font: bold,
      size: 20,
      color:
        PDF_COLORS.blue,
    },
  );

  const metaLabelRight =
    right - 126;

  const metaValueRight =
    right - 8;

  [
    [
      "Referensi",
      invoiceNumber,
    ],
    [
      "Tanggal",
      formatSlashDate(
        invoiceDate,
      ),
    ],
    [
      "Tgl. Jatuh Tempo",
      formatSlashDate(
        invoice?.dueAt,
      ),
    ],
  ].forEach(
    (
      [
        label,
        value,
      ],
      index,
    ) => {
      const y =
        732 -
        index * 15;

      drawRightText(
        page,
        label,
        {
          right:
            metaLabelRight,
          y,
          font: regular,
          size: 9,
          color:
            PDF_COLORS.navy,
        },
      );

      drawRightText(
        page,
        value,
        {
          right:
            metaValueRight,
          y,
          font: regular,
          size: 9,
          color:
            PDF_COLORS.navy,
        },
      );
    },
  );

  /*
   * Company + billing
   */
  const columnTop = 662;
  const leftColumnX = 36;
  const rightColumnX = 300;
  const columnWidth = 238;

  page.drawText(
    "Info Perusahaan",
    {
      x:
        leftColumnX,
      y:
        columnTop,
      size: 9,
      font: bold,
      color:
        PDF_COLORS.navy,
    },
  );

  page.drawText(
    "Tagihan Untuk",
    {
      x:
        rightColumnX,
      y:
        columnTop,
      size: 9,
      font: bold,
      color:
        PDF_COLORS.navy,
    },
  );

  page.drawLine({
    start: {
      x:
        leftColumnX,
      y:
        columnTop - 14,
    },
    end: {
      x:
        leftColumnX +
        columnWidth,
      y:
        columnTop - 14,
    },
    thickness: 1.2,
    color:
      PDF_COLORS.line,
  });

  page.drawLine({
    start: {
      x:
        rightColumnX,
      y:
        columnTop - 14,
    },
    end: {
      x:
        rightColumnX +
        columnWidth,
      y:
        columnTop - 14,
    },
    thickness: 1.2,
    color:
      PDF_COLORS.line,
  });

  page.drawText(
    company.name,
    {
      x:
        leftColumnX,
      y:
        columnTop - 39,
      size: 9,
      font: bold,
      color:
        PDF_COLORS.blue,
    },
  );

  let companyY =
    columnTop - 64;

  for (
    const line of
    company.addressLines
  ) {
    page.drawText(
      sanitizePdfText(
        line,
      ),
      {
        x:
          leftColumnX,
        y:
          companyY,
        size: 8.2,
        font: regular,
        color:
          PDF_COLORS.muted,
      },
    );

    companyY -= 11;
  }

  page.drawText(
    `Telp: ${company.phone}`,
    {
      x:
        leftColumnX,
      y:
        companyY,
      size: 8.2,
      font: regular,
      color:
        PDF_COLORS.muted,
    },
  );

  companyY -= 11;

  page.drawText(
    `Email: ${company.email}`,
    {
      x:
        leftColumnX,
      y:
        companyY,
      size: 8.2,
      font: regular,
      color:
        PDF_COLORS.muted,
    },
  );

  const billingName =
    getBillingName(
      booking,
    );

  page.drawText(
    sanitizePdfText(
      billingName,
    ),
    {
      x:
        rightColumnX,
      y:
        columnTop - 39,
      size: 9,
      font: bold,
      color:
        PDF_COLORS.blue,
    },
  );

  page.drawText(
    `Telp: ${
      booking?.client
        ?.phone || "-"
    }`,
    {
      x:
        rightColumnX,
      y:
        columnTop - 64,
      size: 8.2,
      font: regular,
      color:
        PDF_COLORS.muted,
    },
  );

  page.drawText(
    `Email: ${
      booking?.client
        ?.email || "-"
    }`,
    {
      x:
        rightColumnX,
      y:
        columnTop - 76,
      size: 8.2,
      font: regular,
      color:
        PDF_COLORS.muted,
    },
  );

  /*
   * Product table
   */
  const tableX = 36;
  const tableY = 405;
  const tableWidth = 523;
  const headerHeight = 27;
  const bodyHeight = 104;

  page.drawRectangle({
    x:
      tableX,
    y:
      tableY +
      bodyHeight,
    width:
      tableWidth,
    height:
      headerHeight,
    color:
      PDF_COLORS.navy,
  });

  page.drawRectangle({
    x:
      tableX,
    y:
      tableY,
    width:
      tableWidth,
    height:
      bodyHeight,
    color:
      PDF_COLORS.panel,
  });

  const columns = [
    {
      x:
        tableX + 8,
      label:
        "Produk",
      width: 130,
    },
    {
      x:
        tableX + 142,
      label:
        "Deskripsi",
      width: 132,
    },
    {
      x:
        tableX + 293,
      label:
        "Qty",
      width: 45,
    },
    {
      x:
        tableX + 360,
      label:
        "Harga",
      width: 76,
    },
    {
      x:
        tableX + 459,
      label:
        "Jumlah",
      width: 56,
    },
  ];

  columns.forEach(
    (column) => {
      page.drawText(
        column.label,
        {
          x:
            column.x,
          y:
            tableY +
            bodyHeight +
            9,
          size: 7.5,
          font: bold,
          color:
            PDF_COLORS.white,
        },
      );
    },
  );

  [
    tableX + 132,
    tableX + 286,
    tableX + 345,
    tableX + 447,
  ].forEach(
    (x) => {
      page.drawLine({
        start: {
          x,
          y:
            tableY,
        },
        end: {
          x,
          y:
            tableY +
            bodyHeight,
        },
        thickness:
          0.8,
        color:
          PDF_COLORS.white,
      });
    },
  );

  drawWrappedText(
    page,
    booking?.package
      ?.name ||
      "Package Service",
    {
      x:
        tableX + 8,
      y:
        tableY +
        52,
      font: regular,
      size: 8,
      maxWidth:
        116,
      lineHeight:
        10,
      maxLines:
        3,
      color:
        PDF_COLORS.muted,
    },
  );

  const features =
    getPackageFeatures(
      booking,
    );

  const featureLines =
    features.length
      ? features.map(
          (item) =>
            `- ${item}`,
        )
      : [
          `- Duration up to ${
            booking?.package
              ?.durationHours ||
            "-"
          } hours`,
          "- Photography service",
        ];

  if (
    travelCharge > 0
  ) {
    featureLines.push(
      `- Travel Charge ${formatRupiahPdf(
        travelCharge,
      )}`,
    );
  }

  let featureY =
    tableY +
    bodyHeight -
    16;

  for (
    const feature of
    featureLines.slice(
      0,
      8,
    )
  ) {
    const result =
      drawWrappedText(
        page,
        feature,
        {
          x:
            tableX +
            142,
          y:
            featureY,
          font: regular,
          size: 7.4,
          maxWidth:
            136,
          lineHeight:
            9,
          maxLines:
            2,
          color:
            PDF_COLORS.muted,
        },
      );

    featureY =
      result.bottomY -
      10;

    if (
      featureY <
      tableY + 8
    ) {
      break;
    }
  }

  page.drawText(
    "1",
    {
      x:
        tableX +
        306,
      y:
        tableY +
        52,
      size: 8,
      font: regular,
      color:
        PDF_COLORS.muted,
    },
  );

  drawRightText(
    page,
    formatPlainAmountCompat(
      bookingTotal,
    ),
    {
      right:
        tableX +
        437,
      y:
        tableY +
        52,
      font: regular,
      size: 8,
      color:
        PDF_COLORS.muted,
    },
  );

  drawRightText(
    page,
    formatPlainAmountCompat(
      bookingTotal,
    ),
    {
      right:
        tableX +
        tableWidth -
        8,
      y:
        tableY +
        52,
      font: regular,
      size: 8,
      color:
        PDF_COLORS.muted,
    },
  );

  /*
   * Totals
   */
  const totalsLabelRight =
    410;

  const totalsValueRight =
    right - 8;

  const totals = [
    [
      "Subtotal",
      bookingTotal,
      false,
    ],
    [
      "Total",
      bookingTotal,
      true,
    ],
    [
      "DP Terbayar",
      -depositPaid,
      true,
    ],
  ];

  totals.forEach(
    (
      [
        label,
        value,
        strong,
      ],
      index,
    ) => {
      const y =
        372 -
        index * 18;

      drawRightText(
        page,
        label,
        {
          right:
            totalsLabelRight,
          y,
          font:
            strong
              ? bold
              : regular,
          size: 8.4,
          color:
            PDF_COLORS.muted,
        },
      );

      drawRightText(
        page,
        value < 0
          ? `Rp (${formatPlainAmountCompat(
              Math.abs(
                value,
              ),
            )})`
          : formatRupiahPdf(
              value,
            ),
        {
          right:
            totalsValueRight,
          y,
          font: regular,
          size: 8.4,
          color:
            PDF_COLORS.muted,
        },
      );
    },
  );

  /*
   * DP reference panel
   */
  page.drawText(
    "Down Payment",
    {
      x: 339,
      y: 315,
      size: 8.3,
      font: bold,
      color:
        PDF_COLORS.muted,
    },
  );

  page.drawRectangle({
    x: 292,
    y: 267,
    width: 257,
    height: 40,
    color:
      PDF_COLORS.paleBlue,
  });

  page.drawText(
    "No. Down Payment",
    {
      x: 329,
      y: 291,
      size: 7.8,
      font: regular,
      color:
        PDF_COLORS.muted,
    },
  );

  page.drawText(
    "Tgl Jatuh Tempo",
    {
      x: 411,
      y: 291,
      size: 7.8,
      font: regular,
      color:
        PDF_COLORS.muted,
    },
  );

  drawRightText(
    page,
    "Nominal",
    {
      right: 539,
      y: 291,
      font: regular,
      size: 7.8,
      color:
        PDF_COLORS.muted,
    },
  );

  page.drawText(
    sanitizePdfText(
      depositInvoice
        ?.invoiceNumber ||
        "-",
    ),
    {
      x: 315,
      y: 274,
      size: 7.6,
      font: regular,
      color:
        PDF_COLORS.muted,
    },
  );

  page.drawText(
    formatSlashDate(
      depositInvoice
        ?.dueAt,
    ),
    {
      x: 411,
      y: 274,
      size: 7.6,
      font: regular,
      color:
        PDF_COLORS.muted,
    },
  );

  drawRightText(
    page,
    formatRupiahPdf(
      depositPaid,
    ),
    {
      right: 539,
      y: 274,
      font: bold,
      size: 7.6,
      color:
        PDF_COLORS.muted,
    },
  );

  page.drawLine({
    start: {
      x: 292,
      y: 254,
    },
    end: {
      x: 549,
      y: 254,
    },
    thickness: 0.7,
    color:
      PDF_COLORS.ink,
  });

  drawRightText(
    page,
    "Jumlah Tertagih:",
    {
      right: 420,
      y: 240,
      font: bold,
      size: 8.4,
      color:
        PDF_COLORS.muted,
    },
  );

  drawRightText(
    page,
    formatRupiahPdf(
      amountDue,
    ),
    {
      right: 549,
      y: 240,
      font: bold,
      size: 8.4,
      color:
        PDF_COLORS.muted,
    },
  );

  /*
   * Notes + terms
   */
  page.drawText(
    "Keterangan",
    {
      x: 43,
      y: 318,
      size: 8.4,
      font: bold,
      color:
        PDF_COLORS.navy,
    },
  );

  page.drawLine({
    start: {
      x: 43,
      y: 304,
    },
    end: {
      x: 264,
      y: 304,
    },
    thickness: 1.2,
    color:
      PDF_COLORS.line,
  });

  let notesY = 286;

  for (
    const note of
    RAFI_PICTURE_INVOICE_CONFIG
      .notes
  ) {
    drawWrappedText(
      page,
      `- ${note}`,
      {
        x: 59,
        y: notesY,
        font: regular,
        size: 7.5,
        maxWidth: 205,
        lineHeight: 9,
        maxLines: 2,
        color:
          PDF_COLORS.ink,
      },
    );

    notesY -= 12;
  }

  if (
    invoice?.note
  ) {
    drawWrappedText(
      page,
      `- ${invoice.note}`,
      {
        x: 59,
        y: notesY,
        font: regular,
        size: 7.5,
        maxWidth: 205,
        lineHeight: 9,
        maxLines: 2,
        color:
          PDF_COLORS.ink,
      },
    );
  }

  page.drawText(
    "Syarat & Ketentuan",
    {
      x: 43,
      y: 214,
      size: 8.4,
      font: bold,
      color:
        PDF_COLORS.navy,
    },
  );

  page.drawLine({
    start: {
      x: 43,
      y: 199,
    },
    end: {
      x: 264,
      y: 199,
    },
    thickness: 1.2,
    color:
      PDF_COLORS.line,
  });

  page.drawText(
    `Transfer payment to ${bank.bankName}`,
    {
      x: 43,
      y: 178,
      size: 7.7,
      font: regular,
      color:
        PDF_COLORS.ink,
    },
  );

  page.drawText(
    bank.accountNumber,
    {
      x: 43,
      y: 160,
      size: 8.1,
      font: bold,
      color:
        PDF_COLORS.ink,
    },
  );

  page.drawText(
    bank.accountName,
    {
      x: 43,
      y: 141,
      size: 7.7,
      font: regular,
      color:
        PDF_COLORS.ink,
    },
  );

  drawRightText(
    page,
    formatSlashDate(
      invoiceDate,
    ),
    {
      right: 446,
      y: 210,
      font: bold,
      size: 8,
      color:
        PDF_COLORS.muted,
    },
  );

  page.drawText(
    "Rafi Picture",
    {
      x: 392,
      y: 118,
      size: 8.2,
      font: bold,
      color:
        PDF_COLORS.muted,
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

function formatPlainAmountCompat(
  value,
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        2,
    },
  ).format(
    Number(value) || 0,
  );
}
