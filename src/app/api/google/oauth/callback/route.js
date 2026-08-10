import { NextResponse } from "next/server";

import {
  createGoogleOAuthClient,
} from "@/lib/email/googleOAuth";

export const runtime = "nodejs";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function htmlPage(content) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    />
    <title>Rafi Picture Gmail OAuth</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f6f3ee;
        color: #28231f;
        font-family: Arial, sans-serif;
      }

      main {
        width: min(680px, calc(100% - 40px));
        background: white;
        border: 1px solid #ded7cf;
        border-radius: 18px;
        padding: 28px;
        box-shadow: 0 16px 50px rgba(0,0,0,.08);
      }

      h1 {
        margin-top: 0;
        font-size: 24px;
      }

      code {
        display: block;
        padding: 16px;
        border-radius: 10px;
        background: #171717;
        color: #f6f6f6;
        overflow-wrap: anywhere;
        user-select: all;
      }

      p {
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <main>${content}</main>
  </body>
</html>`;
}

export async function GET(request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        message:
          "Gmail OAuth callback dinonaktifkan di production.",
      },
      { status: 404 }
    );
  }

  const requestUrl =
    new URL(request.url);

  const oauthError =
    requestUrl.searchParams.get("error");

  if (oauthError) {
    return new NextResponse(
      htmlPage(`
        <h1>Authorization dibatalkan</h1>
        <p>Google mengembalikan error:</p>
        <code>${escapeHtml(oauthError)}</code>
      `),
      {
        status: 400,
        headers: {
          "Content-Type":
            "text/html; charset=utf-8",
        },
      }
    );
  }

  const code =
    requestUrl.searchParams.get("code");

  const state =
    requestUrl.searchParams.get("state");

  const expectedState =
    request.cookies.get(
      "gmail_oauth_state"
    )?.value;

  if (
    !state ||
    !expectedState ||
    state !== expectedState
  ) {
    return NextResponse.json(
      {
        message:
          "OAuth state tidak valid atau sudah kedaluwarsa. Ulangi dari /api/google/oauth.",
      },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      {
        message:
          "Authorization code tidak ditemukan.",
      },
      { status: 400 }
    );
  }

  try {
    const oauth2Client =
      createGoogleOAuthClient();

    const { tokens } =
      await oauth2Client.getToken(code);

    const refreshToken =
      tokens.refresh_token;

    if (!refreshToken) {
      return new NextResponse(
        htmlPage(`
          <h1>Refresh token tidak diberikan</h1>
          <p>
            Ulangi authorization dari
            <strong>/api/google/oauth</strong>.
            Pastikan akun sender merupakan Test User
            bila OAuth app masih berstatus Testing.
          </p>
          <p>
            Jika akun ini pernah memberi consent,
            cabut akses aplikasi dari Google Account
            lalu coba lagi.
          </p>
        `),
        {
          status: 400,
          headers: {
            "Content-Type":
              "text/html; charset=utf-8",
          },
        }
      );
    }

    const response =
      new NextResponse(
        htmlPage(`
          <h1>Gmail berhasil terhubung</h1>
          <p>
            Copy refresh token berikut ke
            <strong>.env.local</strong>:
          </p>
          <code>${escapeHtml(
            refreshToken
          )}</code>
          <p>
            Tambahkan sebagai:
            <strong>GMAIL_REFRESH_TOKEN</strong>
          </p>
          <p>
            Setelah itu restart
            <strong>npm run dev</strong>.
          </p>
        `),
        {
          status: 200,
          headers: {
            "Content-Type":
              "text/html; charset=utf-8",
            "Cache-Control": "no-store",
          },
        }
      );

    response.cookies.delete(
      "gmail_oauth_state"
    );

    return response;
  } catch (error) {
    console.error(
      "GMAIL OAUTH CALLBACK ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Gagal menukar authorization code dengan token.",
        detail:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
