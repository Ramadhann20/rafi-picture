import {
  rgb,
} from "pdf-lib";

export const PDF_COLORS = Object.freeze({
  ink: rgb(0.12, 0.12, 0.12),
  muted: rgb(0.34, 0.36, 0.38),
  line: rgb(0.38, 0.40, 0.42),
  blue: rgb(0.16, 0.50, 0.72),
  navy: rgb(0.17, 0.25, 0.32),
  panel: rgb(0.95, 0.95, 0.95),
  paleBlue: rgb(0.79, 0.89, 0.95),
  white: rgb(1, 1, 1),
});

export function toPdfDate(value) {
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

export function formatSlashDate(
  value,
) {
  const date =
    toPdfDate(value);

  if (!date) return "-";

  const day =
    String(
      date.getDate(),
    ).padStart(2, "0");

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, "0");

  return `${day}/${month}/${date.getFullYear()}`;
}

export function formatEnglishDate(
  value,
) {
  const date =
    toPdfDate(value);

  if (!date) return "-";

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatPlainAmount(
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

export function formatRupiahPdf(
  value,
) {
  return `Rp ${formatPlainAmount(
    value,
  )}`;
}

export function sanitizePdfText(
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
    .replace(
      /[^\x20-\x7E\xA0-\xFF]/g,
      "?",
    );
}

export function getBillingName(
  booking,
) {
  const fullName =
    String(
      booking?.client?.fullName ||
        "",
    ).trim();

  const partnerName =
    String(
      booking?.client?.partnerName ||
        "",
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

export function getVenueName(
  booking,
) {
  const location =
    booking?.event?.location;

  if (
    typeof location ===
    "string"
  ) {
    return (
      location.trim() ||
      "-"
    );
  }

  return (
    String(
      location?.venueName ??
        location?.addressLabel ??
        "",
    ).trim() ||
    "-"
  );
}

export function measurePdfText(
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

export function drawRightText(
  page,
  text,
  {
    right,
    y,
    font,
    size,
    color = PDF_COLORS.ink,
  },
) {
  const safe =
    sanitizePdfText(
      text,
    );

  page.drawText(
    safe,
    {
      x:
        right -
        measurePdfText(
          font,
          safe,
          size,
        ),
      y,
      size,
      font,
      color,
    },
  );
}

export function wrapPdfText(
  text,
  {
    font,
    size,
    maxWidth,
  },
) {
  const words =
    sanitizePdfText(
      text,
    )
      .split(/\s+/)
      .filter(Boolean);

  const lines = [];
  let current = "";

  for (
    const word of words
  ) {
    const next =
      current
        ? `${current} ${word}`
        : word;

    if (
      !current ||
      measurePdfText(
        font,
        next,
        size,
      ) <= maxWidth
    ) {
      current = next;
      continue;
    }

    lines.push(current);
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

export function drawWrappedText(
  page,
  text,
  {
    x,
    y,
    font,
    size,
    maxWidth,
    lineHeight = size * 1.35,
    color = PDF_COLORS.ink,
    maxLines = 20,
  },
) {
  const lines =
    wrapPdfText(
      text,
      {
        font,
        size,
        maxWidth,
      },
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
          font,
          size,
          color,
        },
      );
    },
  );

  return {
    lines,
    bottomY:
      y -
      Math.max(
        0,
        lines.length - 1,
      ) *
        lineHeight,
  };
}

const SMALL_NUMBERS = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function underThousandToWords(
  value,
) {
  let number =
    Math.floor(
      Number(value) || 0,
    );

  const parts = [];

  if (
    number >= 100
  ) {
    parts.push(
      SMALL_NUMBERS[
        Math.floor(
          number / 100,
        )
      ],
      "Hundred",
    );

    number %= 100;
  }

  if (
    number >= 20
  ) {
    parts.push(
      TENS[
        Math.floor(
          number / 10,
        )
      ],
    );

    number %= 10;

    if (number > 0) {
      parts.push(
        SMALL_NUMBERS[
          number
        ],
      );
    }
  } else if (
    number > 0 ||
    parts.length === 0
  ) {
    parts.push(
      SMALL_NUMBERS[
        number
      ],
    );
  }

  return parts.join(" ");
}

export function amountToEnglishWords(
  value,
) {
  let number =
    Math.max(
      0,
      Math.floor(
        Number(value) || 0,
      ),
    );

  if (number === 0) {
    return "Zero Rupiah";
  }

  const groups = [
    {
      value:
        1_000_000_000,
      label:
        "Billion",
    },
    {
      value:
        1_000_000,
      label:
        "Million",
    },
    {
      value:
        1_000,
      label:
        "Thousand",
    },
  ];

  const parts = [];

  for (
    const group of groups
  ) {
    if (
      number >=
      group.value
    ) {
      const count =
        Math.floor(
          number /
            group.value,
        );

      parts.push(
        underThousandToWords(
          count,
        ),
        group.label,
      );

      number %=
        group.value;
    }
  }

  if (number > 0) {
    parts.push(
      underThousandToWords(
        number,
      ),
    );
  }

  return `${parts.join(" ")} Rupiah`;
}
