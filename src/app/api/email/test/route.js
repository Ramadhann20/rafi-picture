import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email/sendEmail";

export const runtime = "nodejs";

export async function GET(request) {
  // Test route developer saja.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        message:
          "Email test endpoint dinonaktifkan di production.",
      },
      { status: 404 }
    );
  }

  try {
    const requestUrl =
      new URL(request.url);

    const recipient =
      requestUrl.searchParams.get("to")?.trim() ||
      process.env.GMAIL_SENDER_EMAIL?.trim();

    if (!recipient) {
      return NextResponse.json(
        {
          message:
            "Alamat penerima tidak tersedia. Isi ?to=email@example.com atau GMAIL_SENDER_EMAIL.",
        },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      to: recipient,
      subject:
        "Rafi Picture - Email Service Test",
      text:
        "Email service Rafi Picture berhasil terhubung ke Gmail API.",
      html: `
        <div
          style="
            max-width:560px;
            margin:0 auto;
            padding:32px;
            font-family:Arial,sans-serif;
            color:#28231f;
          "
        >
          <p
            style="
              margin:0 0 8px;
              font-size:12px;
              letter-spacing:.16em;
              text-transform:uppercase;
              color:#85786e;
            "
          >
            Rafi Picture
          </p>

          <h1
            style="
              margin:0 0 16px;
              font-size:24px;
            "
          >
            Email service connected
          </h1>

          <p
            style="
              margin:0;
              line-height:1.7;
              color:#625950;
            "
          >
            Gmail API berhasil mengirim email
            dari aplikasi Rafi Picture.
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message:
        `Test email berhasil dikirim ke ${recipient}.`,
      data: result,
    });
  } catch (error) {
    console.error(
      "EMAIL TEST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Test email gagal dikirim.",
        detail:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
