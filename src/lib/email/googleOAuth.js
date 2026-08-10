import { google } from "googleapis";

export const GMAIL_SEND_SCOPE =
  "https://www.googleapis.com/auth/gmail.send";

function requireEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `[Gmail] Environment variable ${name} belum diisi.`
    );
  }

  return value;
}

export function getGmailEnv() {
  return {
    clientId: requireEnv("GMAIL_CLIENT_ID"),
    clientSecret: requireEnv("GMAIL_CLIENT_SECRET"),
    redirectUri: requireEnv("GMAIL_REDIRECT_URI"),
    senderEmail: requireEnv("GMAIL_SENDER_EMAIL"),
  };
}

export function createGoogleOAuthClient() {
  const {
    clientId,
    clientSecret,
    redirectUri,
  } = getGmailEnv();

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

export function createAuthorizedGoogleOAuthClient() {
  const oauth2Client = createGoogleOAuthClient();

  const refreshToken =
    process.env.GMAIL_REFRESH_TOKEN?.trim();

  if (!refreshToken) {
    throw new Error(
      "[Gmail] GMAIL_REFRESH_TOKEN belum tersedia. Jalankan /api/google/oauth terlebih dahulu."
    );
  }

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return oauth2Client;
}
