import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  try {
    await adminDb.collection("Users").limit(1).get();

    return Response.json({
      success: true,
      message: "Firebase Admin connected successfully",
    });
  } catch (error) {
    console.error("Firebase Admin test error:", error);

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}