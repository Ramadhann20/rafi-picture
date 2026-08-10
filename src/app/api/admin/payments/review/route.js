import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  NextResponse,
} from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebase-admin";

export const runtime =
  "nodejs";

function jsonError(
  message,
  status = 400,
) {
  return NextResponse.json(
    {
      ok: false,
      message,
    },
    {
      status,
    },
  );
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

function normalizePaymentStatus(
  status,
) {
  const normalized =
    String(
      status ??
        "pending_verification",
    ).toLowerCase();

  const map = {
    pending:
      "pending_verification",
    submitted:
      "pending_verification",
    waiting_verification:
      "pending_verification",
    waiting_confirmation:
      "pending_verification",

    paid:
      "verified",
    confirmed:
      "verified",
    completed:
      "verified",

    declined:
      "rejected",
    failed:
      "rejected",
  };

  return (
    map[normalized] ??
    normalized
  );
}

function getLocationLabel(
  location,
) {
  if (
    typeof location ===
    "string"
  ) {
    return (
      location.trim() ||
      null
    );
  }

  return (
    String(
      location?.venueName ??
        location?.addressLabel ??
        "",
    ).trim() ||
    null
  );
}

function getNumber(
  value,
  fallback = 0,
) {
  const numeric =
    Number(value);

  return Number.isFinite(
    numeric,
  )
    ? numeric
    : fallback;
}

async function requireAdmin(
  request,
) {
  const idToken =
    getBearerToken(
      request,
    );

  if (!idToken) {
    throw Object.assign(
      new Error(
        "Admin session is not available.",
      ),
      {
        status: 401,
      },
    );
  }

  let decodedToken;

  try {
    decodedToken =
      await adminAuth
        .verifyIdToken(
          idToken,
        );
  } catch {
    throw Object.assign(
      new Error(
        "Admin session is invalid or expired.",
      ),
      {
        status: 401,
      },
    );
  }

  const adminSnapshot =
    await adminDb
      .collection("Users")
      .doc(decodedToken.uid)
      .get();

  const adminUser =
    adminSnapshot.exists
      ? adminSnapshot.data()
      : null;

  if (
    adminUser?.role !==
    "admin"
  ) {
    throw Object.assign(
      new Error(
        "Admin access is required.",
      ),
      {
        status: 403,
      },
    );
  }

  return {
    uid:
      decodedToken.uid,
    profile:
      adminUser,
  };
}

export async function POST(
  request,
) {
  try {
    const admin =
      await requireAdmin(
        request,
      );

    const payload =
      await request.json();

    const paymentId =
      String(
        payload?.paymentId ??
        "",
      ).trim();

    const action =
      String(
        payload?.action ??
        "",
      )
        .trim()
        .toLowerCase();

    if (!paymentId) {
      return jsonError(
        "Payment ID is required.",
      );
    }

    if (
      ![
        "approve",
        "reject",
      ].includes(action)
    ) {
      return jsonError(
        "Payment action is not valid.",
      );
    }

    const paymentRef =
      adminDb
        .collection("Payments")
        .doc(paymentId);

    const paymentSnapshot =
      await paymentRef.get();

    if (
      !paymentSnapshot.exists
    ) {
      return jsonError(
        "Payment was not found.",
        404,
      );
    }

    const payment =
      paymentSnapshot.data();

    const paymentStatus =
      normalizePaymentStatus(
        payment?.status ??
          payment
            ?.verificationStatus,
      );

    if (
      paymentStatus !==
      "pending_verification"
    ) {
      return jsonError(
        "This payment has already been reviewed.",
        409,
      );
    }

    const bookingId =
      String(
        payment?.bookingId ??
        "",
      ).trim();

    const invoiceId =
      String(
        payment?.invoiceId ??
        "",
      ).trim();

    if (
      !bookingId ||
      !invoiceId
    ) {
      return jsonError(
        "Payment is not linked to a valid booking and invoice.",
        409,
      );
    }

    const bookingRef =
      adminDb
        .collection("Bookings")
        .doc(bookingId);

    const invoiceRef =
      adminDb
        .collection("Invoices")
        .doc(invoiceId);

    const [
      bookingSnapshot,
      invoiceSnapshot,
      scheduleSnapshot,
    ] = await Promise.all([
      bookingRef.get(),
      invoiceRef.get(),
      adminDb
        .collection("Schedules")
        .where(
          "bookingId",
          "==",
          bookingId,
        )
        .get(),
    ]);

    if (
      !bookingSnapshot.exists
    ) {
      return jsonError(
        "Booking was not found.",
        404,
      );
    }

    if (
      !invoiceSnapshot.exists
    ) {
      return jsonError(
        "Invoice was not found.",
        404,
      );
    }

    const booking =
      bookingSnapshot.data();

    const invoice =
      invoiceSnapshot.data();

    if (
      invoice?.bookingId !==
      bookingId
    ) {
      return jsonError(
        "Invoice does not belong to this booking.",
        409,
      );
    }

    if (
      payment?.invoiceId !==
      invoiceId
    ) {
      return jsonError(
        "Payment invoice reference is invalid.",
        409,
      );
    }

    const timestamp =
      FieldValue.serverTimestamp();

    const reviewedBy = {
      uid:
        admin.uid,
      name:
        admin.profile?.displayName ??
        admin.profile?.fullName ??
        admin.profile?.name ??
        null,
      email:
        admin.profile?.email ??
        null,
    };

    const batch =
      adminDb.batch();

    if (
      action === "reject"
    ) {
      batch.update(
        paymentRef,
        {
          status:
            "rejected",

          verificationStatus:
            "rejected",

          rejectedAt:
            timestamp,

          reviewedAt:
            timestamp,

          reviewedBy,

          updatedAt:
            timestamp,
        },
      );

      batch.update(
        invoiceRef,
        {
          status:
            "issued",

          updatedAt:
            timestamp,
        },
      );

      batch.update(
        bookingRef,
        {
          status:
            "approved",

          paymentStatus:
            "rejected",

          latestPaymentId:
            null,

          paymentProofSubmittedAt:
            null,

          paymentRejectedAt:
            timestamp,

          updatedAt:
            timestamp,
        },
      );

      await batch.commit();

      return NextResponse.json({
        ok: true,
        message:
          "Payment rejected. Client can upload a new proof.",
        data: {
          paymentId,
          bookingId,
          invoiceId,
          paymentStatus:
            "rejected",
          bookingStatus:
            "approved",
          invoiceStatus:
            "issued",
        },
      });
    }

    const paymentAmount =
      Math.max(
        getNumber(
          payment?.amount,
        ),
        0,
      );

    if (
      paymentAmount <= 0
    ) {
      return jsonError(
        "Payment amount is invalid.",
        409,
      );
    }

    const invoiceAmount =
      Math.max(
        getNumber(
          invoice?.amount,
          paymentAmount,
        ),
        0,
      );

    const currentTotalPaid =
      Math.max(
        getNumber(
          invoice?.totalPaid,
        ),
        0,
      );

    const nextTotalPaid =
      Math.min(
        invoiceAmount,
        currentTotalPaid +
          paymentAmount,
      );

    const amountDue =
      Math.max(
        0,
        invoiceAmount -
          nextTotalPaid,
      );

    const invoiceStatus =
      amountDue <= 0
        ? "paid"
        : "issued";

    batch.update(
      paymentRef,
      {
        status:
          "verified",

        verificationStatus:
          "verified",

        verifiedAt:
          timestamp,

        reviewedAt:
          timestamp,

        reviewedBy,

        updatedAt:
          timestamp,
      },
    );

    batch.update(
      invoiceRef,
      {
        status:
          invoiceStatus,

        totalPaid:
          nextTotalPaid,

        amountDue,

        paidAt:
          amountDue <= 0
            ? timestamp
            : null,

        updatedAt:
          timestamp,
      },
    );

    batch.update(
      bookingRef,
      {
        status:
          "in_progress",

        paymentStatus:
          "verified",

        paymentVerifiedAt:
          timestamp,

        updatedAt:
          timestamp,
      },
    );

    const event =
      booking?.event ?? {};

    const selectedPackage =
      booking?.package ?? {};

    const activeScheduleDoc =
      scheduleSnapshot.docs.find(
        (document) => {
          const schedule =
            document.data();

          return (
            schedule?.status !==
              "cancelled" &&
            schedule
              ?.scheduleStatus !==
              "cancelled"
          );
        },
      );

    const schedulePayload = {
      bookingId,
      bookingCode:
        booking?.bookingCode ??
        null,

      clientId:
        booking?.client?.uid ??
        null,

      clientName:
        booking?.client?.fullName ??
        null,

      paymentId,
      invoiceId,

      packageId:
        selectedPackage?.id ??
        null,

      packageName:
        selectedPackage?.name ??
        null,

      date:
        event?.preferredDate ??
        null,

      eventDate:
        event?.preferredDate ??
        null,

      startTime:
        event?.startTime ??
        null,

      endTime:
        event?.endTime ??
        null,

      endTimeDayOffset:
        Number(
          event
            ?.endTimeDayOffset ??
            0,
        ) || 0,

      location:
        event?.location ??
        null,

      venueName:
        getLocationLabel(
          event?.location,
        ),

      scheduleStatus:
        "booked",

      status:
        "booked",

      source:
        "payment_verification",

      updatedAt:
        timestamp,
    };

    if (
      activeScheduleDoc
    ) {
      batch.update(
        activeScheduleDoc.ref,
        schedulePayload,
      );
    } else {
      const scheduleRef =
        adminDb
          .collection(
            "Schedules",
          )
          .doc();

      batch.set(
        scheduleRef,
        {
          ...schedulePayload,

          createdAt:
            timestamp,
        },
      );
    }

    await batch.commit();

    return NextResponse.json({
      ok: true,
      message:
        "Payment successfully verified.",
      data: {
        paymentId,
        bookingId,
        invoiceId,

        paymentStatus:
          "verified",

        invoiceStatus,

        invoiceTotalPaid:
          nextTotalPaid,

        invoiceAmountDue:
          amountDue,

        bookingStatus:
          "in_progress",

        scheduleStatus:
          "booked",
      },
    });
  } catch (error) {
    console.error(
      "ADMIN PAYMENT REVIEW ERROR:",
      error,
    );

    return jsonError(
      error?.message ||
        "Payment review failed.",
      Number(
        error?.status,
      ) || 500,
    );
  }
}
