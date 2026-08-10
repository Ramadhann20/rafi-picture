import {
  adminAuth,
  adminDb,
} from "@/lib/firebase-admin";

export class AdminRequestError extends Error {
  constructor(
    message,
    status = 400,
  ) {
    super(message);
    this.name =
      "AdminRequestError";
    this.status =
      status;
  }
}

function getBearerToken(
  request,
) {
  const authorization =
    request.headers.get(
      "authorization",
    ) || "";

  if (
    !authorization.startsWith(
      "Bearer ",
    )
  ) {
    return "";
  }

  return authorization
    .slice(7)
    .trim();
}

export async function requireAdminRequest(
  request,
) {
  const token =
    getBearerToken(
      request,
    );

  if (!token) {
    throw new AdminRequestError(
      "Sesi admin tidak tersedia.",
      401,
    );
  }

  let decodedToken;

  try {
    decodedToken =
      await adminAuth.verifyIdToken(
        token,
      );
  } catch {
    throw new AdminRequestError(
      "Sesi admin tidak valid atau sudah berakhir.",
      401,
    );
  }

  const snapshot =
    await adminDb
      .collection("Users")
      .doc(decodedToken.uid)
      .get();

  const user =
    snapshot.exists
      ? snapshot.data()
      : null;

  if (
    user?.role !== "admin"
  ) {
    throw new AdminRequestError(
      "Akses hanya tersedia untuk admin.",
      403,
    );
  }

  return {
    uid:
      decodedToken.uid,
    user,
  };
}
