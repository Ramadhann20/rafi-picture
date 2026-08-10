import { google } from "googleapis";

import {
  createAuthorizedGoogleOAuthClient,
} from "./googleOAuth";

export function getGmailClient() {
  const auth = createAuthorizedGoogleOAuthClient();

  return google.gmail({
    version: "v1",
    auth,
  });
}
