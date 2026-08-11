import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

import {
  RAFI_PICTURE_INVOICE_CONFIG,
} from "./invoiceConfig";

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;

const COLORS = Object.freeze({
  ink: rgb(
    0.12,
    0.12,
    0.12,
  ),

  muted: rgb(
    0.34,
    0.36,
    0.38,
  ),

  line: rgb(
    0.38,
    0.40,
    0.42,
  ),

  blue: rgb(
    0.29,
    0.59,
    0.76,
  ),

  navy: rgb(
    0.17,
    0.25,
    0.32,
  ),

  panel: rgb(
    0.95,
    0.95,
    0.95,
  ),

  white: rgb(
    1,
    1,
    1,
  ),
});

function clamp(
  value,
  min,
  max,
) {
  return Math.min(
    Math.max(
      Number(value) || 0,
      min,
    ),
    max,
  );
}

function toDate(value) {
  if (!value) return null;

  if (
    typeof value?.toDate ===
    "function"
  ) {
    return value.toDate();
  }

  if (
    typeof value === "object" &&
    Number.isFinite(
      Number(value?._seconds),
    )
  ) {
    return new Date(
      Number(value._seconds) *
        1000,
    );
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    const [
      year,
      month,
      day,
    ] = value
      .split("-")
      .map(Number);

    return new Date(
      year,
      month - 1,
      day,
    );
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return Number.isNaN(
    date.getTime(),
  )
    ? null
    : date;
}

function formatSlashDate(value) {
  const date =
    toDate(value);

  if (!date) return "-";

  const day = String(
    date.getDate(),
  ).padStart(
    2,
    "0",
  );

  const month = String(
    date.getMonth() + 1,
  ).padStart(
    2,
    "0",
  );

  return `${day}/${month}/${date.getFullYear()}`;
}

function formatFooterDate(
  value,
) {
  const date =
    toDate(value);

  if (!date) return "-";

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agt",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  return `${date.getDate()} ${
    monthNames[
      date.getMonth()
    ]
  }, ${date.getFullYear()}`;
}

function formatPlainAmount(
  value,
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    Number(value) || 0,
  );
}

function formatRupiah(
  value,
) {
  return `Rp ${formatPlainAmount(
    value,
  )}`;
}

function sanitizePdfText(
  value,
) {
  return String(
    value ?? "",
  )
    .replace(
      /[\u2010-\u2015]/g,
      "-",
    )
    .replace(
      /[\u2018\u2019]/g,
      "'",
    )
    .replace(
      /[\u201c\u201d]/g,
      '"',
    )
    .replace(
      /\u2022/g,
      "-",
    )
    .replace(
      /\u00a0/g,
      " ",
    )
    /*
     * Standard Helvetica pada pdf-lib memakai WinAnsi.
     * Karakter di luar rentang tersebut dinormalisasi agar satu
     * input user tidak menggagalkan seluruh proses invoice.
     */
    .replace(
      /[^\x20-\x7E\xA0-\xFF]/g,
      "?",
    );
}

function getBillingName(
  booking,
) {
  const fullName =
    String(
      booking?.client
        ?.fullName || "",
    ).trim();

  const partnerName =
    String(
      booking?.client
        ?.partnerName || "",
    ).trim();

  if (
    booking?.package
      ?.bookingSubjectType ===
      "couple" &&
    partnerName
  ) {
    return `${fullName} dan ${partnerName}`;
  }

  return (
    fullName ||
    "Client"
  );
}

function measure(
  font,
  text,
  size,
) {
  return font.widthOfTextAtSize(
    sanitizePdfText(
      text,
    ),
    size,
  );
}

function drawRightText(
  page,
  text,
  {
    right,
    y,
    font,
    size,
    color = COLORS.ink,
  },
) {
  const safeText =
    sanitizePdfText(
      text,
    );

  page.drawText(
    safeText,
    {
      x:
        right -
        measure(
          font,
          safeText,
          size,
        ),
      y,
      size,
      font,
      color,
    },
  );
}

function splitWords(
  text,
) {
  return sanitizePdfText(
    text,
  )
    .split(/\s+/)
    .filter(Boolean);
}

function wrapText(
  text,
  font,
  size,
  maxWidth,
) {
  const words =
    splitWords(text);

  if (
    words.length === 0
  ) {
    return [""];
  }

  const lines = [];
  let current = "";

  for (
    const word of words
  ) {
    const candidate =
      current
        ? `${current} ${word}`
        : word;

    if (
      measure(
        font,
        candidate,
        size,
      ) <= maxWidth
    ) {
      current =
        candidate;

      continue;
    }

    if (current) {
      lines.push(
        current,
      );
    }

    current = word;
  }

  if (current) {
    lines.push(
      current,
    );
  }

  return lines;
}

function drawWrappedText(
  page,
  text,
  {
    x,
    y,
    maxWidth,
    font,
    size,
    lineHeight =
      size * 1.25,
    color = COLORS.ink,
    maxLines = 10,
  },
) {
  const lines =
    wrapText(
      text,
      font,
      size,
      maxWidth,
    ).slice(
      0,
      maxLines,
    );

  lines.forEach(
    (
      line,
      index,
    ) => {
      page.drawText(
        line,
        {
          x,
          y:
            y -
            index *
              lineHeight,
          size,
          font,
          color,
        },
      );
    },
  );

  return (
    y -
    lines.length *
      lineHeight
  );
}

function drawSectionTitle(
  page,
  {
    title,
    x,
    y,
    width,
    font,
  },
) {
  page.drawText(
    sanitizePdfText(
      title,
    ),
    {
      x,
      y,
      size: 14,
      font,
      color:
        COLORS.blue,
    },
  );

  page.drawLine({
    start: {
      x,
      y: y - 14,
    },
    end: {
      x:
        x + width,
      y: y - 14,
    },
    thickness: 1.2,
    color:
      COLORS.line,
  });
}

function drawBullet(
  page,
  text,
  {
    x,
    y,
    font,
    italicFont,
    size = 9.5,
    maxWidth,
  },
) {
  page.drawText(
    "-",
    {
      x,
      y,
      size,
      font,
      color:
        COLORS.ink,
    },
  );

  const italicWord =
    "Income Tax";

  const containsItalic =
    text.includes(
      italicWord,
    );

  if (
    !containsItalic
  ) {
    return drawWrappedText(
      page,
      text,
      {
        x: x + 12,
        y,
        maxWidth:
          maxWidth - 12,
        font,
        size,
        lineHeight: 12,
      },
    );
  }

  const [
    before,
    after,
  ] = text.split(
    italicWord,
  );

  page.drawText(
    sanitizePdfText(
      before,
    ),
    {
      x: x + 12,
      y,
      size,
      font,
      color:
        COLORS.ink,
    },
  );

  const beforeWidth =
    measure(
      font,
      before,
      size,
    );

  page.drawText(
    italicWord,
    {
      x:
        x +
        12 +
        beforeWidth,
      y,
      size,
      font:
        italicFont,
      color:
        COLORS.ink,
    },
  );

  if (after) {
    page.drawText(
      sanitizePdfText(
        after,
      ),
      {
        x:
          x +
          12 +
          beforeWidth +
          measure(
            italicFont,
            italicWord,
            size,
          ),
        y,
        size,
        font,
        color:
          COLORS.ink,
      },
    );
  }

  return y - 12;
}

export async function generateDepositInvoicePdf({
  booking,
  invoice,
  invoiceNumber,
  invoiceDate =
    new Date(),
  totalPaid = 0,
}) {
  if (!booking?.id) {
    throw new Error(
      "[PDF] Booking ID tidak tersedia.",
    );
  }

  const amount =
    Math.max(
      Number(
        invoice?.amount,
      ) || 0,
      0,
    );

  if (amount <= 0) {
    throw new Error(
      "[PDF] Nominal DP tidak valid.",
    );
  }

  const penaltyAmount =
    Math.max(
      Number(
        invoice?.penalty
          ?.appliedAmount ??
          invoice?.penaltyAmount,
      ) || 0,
      0,
    );

  const principalAmount =
    Math.max(
      Number(
        invoice?.principalAmount ??
          invoice?.baseAmount,
      ) ||
        amount -
          penaltyAmount,
      0,
    );

  const bookingTotal =
    Math.max(
      Number(
        invoice?.bookingTotal ??
          invoice?.packageTotal,
      ) ||
        Number(
          booking?.package
            ?.price,
        ) ||
        0,
      0,
    );

  const paid =
    clamp(
      totalPaid,
      0,
      amount,
    );

  const amountDue =
    Math.max(
      0,
      amount - paid,
    );

  const pdfDoc =
    await PDFDocument.create();

  pdfDoc.setTitle(
    `Invoice Down Payment ${invoiceNumber}`,
  );

  pdfDoc.setAuthor(
    RAFI_PICTURE_INVOICE_CONFIG
      .company.name,
  );

  pdfDoc.setSubject(
    `Down payment invoice for ${
      booking.bookingCode ||
      booking.id
    }`,
  );

  const regular =
    await pdfDoc.embedFont(
      StandardFonts.Helvetica,
    );

  const bold =
    await pdfDoc.embedFont(
      StandardFonts.HelveticaBold,
    );

  const italic =
    await pdfDoc.embedFont(
      StandardFonts.HelveticaOblique,
    );

  const page =
    pdfDoc.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);

  const left = 20;
  const right =
    PAGE_WIDTH - 20;

  const contentWidth =
    right - left;

  /*
   * Brand / logo area.
   * Untuk sekarang direplikasi secara tipografi.
   * Jika nanti tersedia PNG logo resmi, generator ini dapat
   * di-upgrade tanpa mengubah flow preview/finalization.
   */
  page.drawText(
    "RAFI PICTURE",
    {
      x: 65,
      y: 523,
      size: 11.5,
      font: bold,
      color:
        COLORS.ink,
    },
  );

  page.drawText(
    "keep our love in a photograph",
    {
      x: 65,
      y: 514,
      size: 5.5,
      font: regular,
      color:
        COLORS.muted,
    },
  );

  page.drawText(
    "Invoice Down Payment",
    {
      x: 548,
      y: 535,
      size: 20,
      font: regular,
      color:
        COLORS.blue,
    },
  );

  const metaLabelRight =
    666;

  const metaValueRight =
    822;

  const metaRows = [
    [
      "No. Invoice Down Payment",
      invoiceNumber,
    ],
    [
      "Invoice Date",
      formatSlashDate(
        invoiceDate,
      ),
    ],
    [
      "Due Date",
      formatSlashDate(
        invoice?.dueAt,
      ),
    ],
  ];

  metaRows.forEach(
    (
      [
        label,
        value,
      ],
      index,
    ) => {
      const y =
        502 -
        index * 15;

      drawRightText(
        page,
        label,
        {
          right:
            metaLabelRight,
          y,
          font: bold,
          size: 9.5,
        },
      );

      drawRightText(
        page,
        value,
        {
          right:
            metaValueRight,
          y,
          font: bold,
          size: 9.5,
        },
      );
    },
  );

  const columnGap = 84;
  const sectionWidth =
    (contentWidth -
      columnGap) /
    2;

  const leftSectionX =
    left;

  const rightSectionX =
    left +
    sectionWidth +
    columnGap;

  drawSectionTitle(
    page,
    {
      title:
        "Our Information",
      x:
        leftSectionX,
      y: 444,
      width:
        sectionWidth,
      font: regular,
    },
  );

  drawSectionTitle(
    page,
    {
      title:
        "Billing For",
      x:
        rightSectionX,
      y: 444,
      width:
        sectionWidth,
      font: regular,
    },
  );

  const company =
    RAFI_PICTURE_INVOICE_CONFIG
      .company;

  page.drawText(
    company.name,
    {
      x:
        leftSectionX,
      y: 399,
      size: 11.5,
      font: bold,
      color:
        COLORS.blue,
    },
  );

  let companyY = 373;

  company.addressLines.forEach(
    (line) => {
      page.drawText(
        sanitizePdfText(
          line,
        ),
        {
          x:
            leftSectionX,
          y:
            companyY,
          size: 9.5,
          font: regular,
          color:
            COLORS.muted,
        },
      );

      companyY -= 12;
    },
  );

  page.drawText(
    `Phone: ${company.phone}`,
    {
      x:
        leftSectionX,
      y:
        companyY - 1,
      size: 9.5,
      font: regular,
      color:
        COLORS.muted,
    },
  );

  page.drawText(
    `Email: ${company.email}`,
    {
      x:
        leftSectionX,
      y:
        companyY - 13,
      size: 9.5,
      font: regular,
      color:
        COLORS.muted,
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
        rightSectionX,
      y: 399,
      size: 11.5,
      font: bold,
      color:
        COLORS.blue,
    },
  );

  page.drawText(
    `Phone: ${
      booking?.client
        ?.phone || "-"
    }`,
    {
      x:
        rightSectionX,
      y: 373,
      size: 9.5,
      font: regular,
      color:
        COLORS.muted,
    },
  );

  page.drawText(
    `Email: ${
      booking?.client
        ?.email || "-"
    }`,
    {
      x:
        rightSectionX,
      y: 359,
      size: 9.5,
      font: regular,
      color:
        COLORS.muted,
    },
  );

  const tableX = left;
  const tableY = 310;
  const tableWidth =
    contentWidth;
  const headerHeight = 24;
  const rowHeight =
    penaltyAmount > 0
      ? 48
      : 27;
  const referenceHeight = 23;
  const splitX =
    tableX +
    tableWidth * 0.60;

  page.drawRectangle({
    x:
      tableX,
    y:
      tableY,
    width:
      tableWidth,
    height:
      headerHeight,
    color:
      COLORS.navy,
  });

  page.drawText(
    "Description",
    {
      x:
        tableX + 11,
      y:
        tableY + 7,
      size: 9.5,
      font: bold,
      color:
        COLORS.white,
    },
  );

  page.drawText(
    "Amount",
    {
      x:
        splitX + 10,
      y:
        tableY + 7,
      size: 9.5,
      font: bold,
      color:
        COLORS.white,
    },
  );

  page.drawRectangle({
    x:
      tableX,
    y:
      tableY -
      rowHeight -
      2,
    width:
      tableWidth,
    height:
      rowHeight,
    color:
      COLORS.panel,
  });

  page.drawLine({
    start: {
      x:
        splitX,
      y:
        tableY -
        rowHeight -
        2,
    },
    end: {
      x:
        splitX,
      y:
        tableY,
    },
    thickness: 1,
    color:
      COLORS.white,
  });

  const packageName =
    booking?.package
      ?.name ||
    "Booking Package";

  drawWrappedText(
    page,
    `Down Payment for ${packageName}`,
    {
      x:
        tableX + 11,
      y:
        tableY - 18,
      maxWidth:
        splitX -
        tableX -
        22,
      font: regular,
      size: 9.5,
      lineHeight: 10.5,
      maxLines: 2,
    },
  );

  drawRightText(
    page,
    formatPlainAmount(
      principalAmount,
    ),
    {
      right:
        right - 10,
      y:
        tableY - 18,
      font: regular,
      size: 9.5,
    },
  );

  if (penaltyAmount > 0) {
    page.drawText(
      "Late Payment Fee",
      {
        x:
          tableX + 11,
        y:
          tableY - 39,
        size: 9.5,
        font: bold,
        color:
          COLORS.ink,
      },
    );

    drawRightText(
      page,
      formatPlainAmount(
        penaltyAmount,
      ),
      {
        right:
          right - 10,
        y:
          tableY - 39,
        font: bold,
        size: 9.5,
      },
    );
  }

  page.drawRectangle({
    x:
      tableX,
    y:
      tableY -
      rowHeight -
      referenceHeight -
      5,
    width:
      tableWidth,
    height:
      referenceHeight,
    color:
      COLORS.panel,
  });

  const reference =
    booking.bookingCode ||
    booking.id;

  page.drawText(
    "Document Reference:",
    {
      x:
        tableX + 4,
      y:
        tableY -
        rowHeight -
        referenceHeight +
        1,
      size: 9.5,
      font: bold,
      color:
        COLORS.ink,
    },
  );

  const referenceLabelWidth =
    measure(
      bold,
      "Document Reference:",
      9.5,
    );

  drawWrappedText(
    page,
    `${reference} - ${formatRupiah(
      bookingTotal,
    )}`,
    {
      x:
        tableX +
        8 +
        referenceLabelWidth,
      y:
        tableY -
        rowHeight -
        referenceHeight +
        1,
      maxWidth:
        tableWidth -
        referenceLabelWidth -
        20,
      font: regular,
      size: 9.5,
      lineHeight: 10.5,
      maxLines: 1,
    },
  );

  const totalsLabelRight =
    635;

  const totalsValueRight =
    right;

  const totalsTopY = 226;

  const totals = [
    [
      "Total",
      formatRupiah(
        amount,
      ),
    ],
    [
      "Total Paid",
      formatRupiah(
        paid,
      ),
    ],
    [
      "Amount Due:",
      formatRupiah(
        amountDue,
      ),
    ],
  ];

  totals.forEach(
    (
      [
        label,
        value,
      ],
      index,
    ) => {
      const y =
        totalsTopY -
        index * 16;

      page.drawText(
        label,
        {
          x: 432,
          y,
          size: 9.5,
          font: bold,
          color:
            COLORS.ink,
        },
      );

      drawRightText(
        page,
        value,
        {
          right:
            totalsValueRight,
          y,
          font: regular,
          size: 9.5,
        },
      );
    },
  );

  page.drawText(
    "Notes",
    {
      x: left,
      y: 171,
      size: 12,
      font: bold,
      color:
        COLORS.ink,
    },
  );

  page.drawLine({
    start: {
      x: left,
      y: 160,
    },
    end: {
      x: 420,
      y: 160,
    },
    thickness: 1.2,
    color:
      COLORS.line,
  });

  let notesY = 140;

  const customNote =
    String(
      invoice?.note || "",
    ).trim();

  const notes = [
    ...(
      customNote &&
      customNote !==
        "30% booking deposit"
        ? [
            customNote,
          ]
        : []
    ),
    ...RAFI_PICTURE_INVOICE_CONFIG.notes,
  ];

  notes.forEach(
    (note) => {
      notesY =
        drawBullet(
          page,
          note,
          {
            x:
              left + 30,
            y:
              notesY,
            font:
              regular,
            italicFont:
              italic,
            size: 9.5,
            maxWidth: 350,
          },
        );
    },
  );

  page.drawText(
    "Terms and Condition",
    {
      x: left,
      y: 81,
      size: 12,
      font: bold,
      color:
        COLORS.ink,
    },
  );

  page.drawLine({
    start: {
      x: left,
      y: 69,
    },
    end: {
      x: 420,
      y: 69,
    },
    thickness: 1.2,
    color:
      COLORS.line,
  });

  const bank =
    RAFI_PICTURE_INVOICE_CONFIG
      .bank;

  page.drawText(
    `Transfer payment to ${bank.bankName}`,
    {
      x: left,
      y: 50,
      size: 9.5,
      font: regular,
      color:
        COLORS.muted,
    },
  );

  page.drawText(
    bank.accountNumber,
    {
      x: left,
      y: 36,
      size: 9.5,
      font: bold,
      color:
        COLORS.ink,
    },
  );

  page.drawText(
    bank.accountName,
    {
      x: left,
      y: 22,
      size: 9.5,
      font: regular,
      color:
        COLORS.ink,
    },
  );

  drawRightText(
    page,
    formatFooterDate(
      invoiceDate,
    ),
    {
      right: 674,
      y: 128,
      font: bold,
      size: 10.5,
      color:
        COLORS.ink,
    },
  );

  /*
   * Signature graphic sengaja belum direplikasi.
   * Area tanda tangan tetap disisakan agar nanti dapat
   * menggunakan PNG signature resmi.
   */
  page.drawText(
    "Rafi Picture",
    {
      x: 585,
      y: 45,
      size: 10.5,
      font: bold,
      color:
        COLORS.muted,
    },
  );

  /*
   * useObjectStreams:false membuat output lebih konservatif untuk
   * browser PDF viewer dan juga lebih mudah didiagnosis.
   */
  const bytes =
    await pdfDoc.save({
      useObjectStreams: false,
    });

  return Buffer.from(
    bytes,
  );
}
