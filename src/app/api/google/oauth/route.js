import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import {
  GMAIL_SEND_SCOPE,
  createGoogleOAuthClient,
  getGmailEnv,
} from "@/lib/email/googleOAuth";

export const runtime = "nodejs";

export async function GET() {
  // Endpoint ini hanya untuk developer mendapatkan refresh token.
  // Jangan buka flow setup OAuth secara publik di production.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        message:
          "Gmail OAuth setup endpoint dinonaktifkan di production.",
      },
      { status: 404 }
    );
  }

  try {
    const oauth2Client =
      createGoogleOAuthClient();

    const { senderEmail } =
      getGmailEnv();

    const state =
      randomBytes(32).toString("hex");

    const authorizationUrl =
      oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: true,
        scope: [GMAIL_SEND_SCOPE],
        state,
        login_hint: senderEmail,
      });

    const response =
      NextResponse.redirect(authorizationUrl);

    response.cookies.set(
      "gmail_oauth_state",
      state,
      {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 10 * 60,
        path: "/",
      }
    );

    return response;
  } catch (error) {
    console.error(
      "GMAIL OAUTH START ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Gagal memulai Gmail OAuth.",
        detail:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
