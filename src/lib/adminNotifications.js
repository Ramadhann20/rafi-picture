import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  adminDb,
} from "@/lib/firebase-admin";

import {
  sendEmail,
} from "@/lib/email/sendEmail";

const COLLECTION =
  "AdminNotifications";

function sanitizeId(
  value,
) {
  return String(
    value || "event",
  )
    .replace(
      /[^a-zA-Z0-9_-]+/g,
      "-",
    )
    .replace(
      /-+/g,
      "-",
    )
    .replace(
      /^-|-$/g,
      "",
    )
    .slice(
      0,
      140,
    ) || "event";
}

function getAdminName(
  admin,
) {
  return (
    admin?.displayName ||
    admin?.fullName ||
    admin?.name ||
    admin?.username ||
    "Admin"
  );
}

function buildEmailHtml({
  adminName,
  title,
  message,
}) {
  const safe = (value) =>
    String(
      value ?? "",
    )
      .replace(
        /&/g,
        "&amp;",
      )
      .replace(
        /</g,
        "&lt;",
      )
      .replace(
        />/g,
        "&gt;",
      )
      .replace(
        /"/g,
        "&quot;",
      )
      .replace(
        /'/g,
        "&#039;",
      );

  return `<!doctype html>
<html lang="id">
  <body style="margin:0;background:#f7f5f2;font-family:Arial,Helvetica,sans-serif;color:#24211f;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:28px 16px;background:#f7f5f2;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:620px;background:#ffffff;">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid #e8e2dc;">
                <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a6a55;">Rafi Picture • Admin Notification</div>
                <div style="margin-top:8px;font-size:22px;font-weight:600;line-height:1.3;">${safe(title)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;font-size:15px;line-height:1.7;">
                Halo ${safe(adminName)},<br /><br />
                ${safe(message).replace(/\r?\n/g, "<br />")}
                <br /><br />
                Silakan buka dashboard admin Rafi Picture untuk melakukan review.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Membuat in-app notification Firestore per user role=admin
 * dan sekaligus mengirim email ke email admin tersebut.
 *
 * eventKey HARUS deterministic supaya retry endpoint tidak
 * mengirim email duplicate.
 */
export async function notifyAdmins({
  eventKey,
  type,
  title,
  message,
  bookingId = null,
  bookingCode = null,
  paymentId = null,
  invoiceId = null,
  invoiceType = null,
  route = null,
  metadata = {},
}) {
  const adminsSnapshot =
    await adminDb
      .collection(
        "Users",
      )
      .where(
        "role",
        "==",
        "admin",
      )
      .get();

  const admins =
    adminsSnapshot.docs.map(
      (document) => ({
        uid:
          document.id,
        ...document.data(),
      }),
    );

  const results = [];

  for (
    const admin of
    admins
  ) {
    const notificationId =
      `${sanitizeId(
        eventKey,
      )}_${sanitizeId(
        admin.uid,
      )}`;

    const notificationRef =
      adminDb
        .collection(
          COLLECTION,
        )
        .doc(
          notificationId,
        );

    const existingSnapshot =
      await notificationRef.get();

    const existing =
      existingSnapshot.exists
        ? existingSnapshot.data()
        : null;

    if (
      !existingSnapshot.exists
    ) {
      await notificationRef.set({
        recipientUid:
          admin.uid,

        recipientRole:
          "admin",

        type,
        title,
        message,

        bookingId,
        bookingCode,
        paymentId,
        invoiceId,
        invoiceType,

        route,

        metadata,

        read:
          false,

        createdAt:
          FieldValue
            .serverTimestamp(),

        updatedAt:
          FieldValue
            .serverTimestamp(),

        email: {
          status:
            admin?.email
              ? "pending"
              : "skipped",
          recipient:
            admin?.email ||
            null,
          sentAt:
            null,
          error:
            null,
        },
      });
    }

    /*
     * Retry endpoint tidak mengirim ulang email yang sudah sukses.
     */
    if (
      existing?.email
        ?.status ===
        "sent"
    ) {
      results.push({
        uid:
          admin.uid,
        email:
          admin?.email ||
          null,
        status:
          "already_sent",
      });

      continue;
    }

    if (!admin?.email) {
      results.push({
        uid:
          admin.uid,
        email:
          null,
        status:
          "no_email",
      });

      continue;
    }

    try {
      const emailResult =
        await sendEmail({
          to:
            admin.email,

          subject:
            `[Rafi Picture] ${title}`,

          text:
`${message}

Silakan buka dashboard admin Rafi Picture untuk melakukan review.`,

          html:
            buildEmailHtml({
              adminName:
                getAdminName(
                  admin,
                ),
              title,
              message,
            }),
        });

      await notificationRef.set(
        {
          email: {
            status:
              "sent",
            recipient:
              admin.email,
            messageId:
              emailResult
                ?.id ??
              null,
            threadId:
              emailResult
                ?.threadId ??
              null,
            sentAt:
              FieldValue
                .serverTimestamp(),
            error:
              null,
          },

          updatedAt:
            FieldValue
              .serverTimestamp(),
        },
        {
          merge:
            true,
        },
      );

      results.push({
        uid:
          admin.uid,
        email:
          admin.email,
        status:
          "sent",
      });
    } catch (error) {
      console.error(
        "ADMIN NOTIFICATION EMAIL ERROR:",
        admin.uid,
        error,
      );

      await notificationRef.set(
        {
          email: {
            status:
              "failed",
            recipient:
              admin.email,
            sentAt:
              null,
            error:
              error?.message ||
              "Email gagal dikirim.",
          },

          updatedAt:
            FieldValue
              .serverTimestamp(),
        },
        {
          merge:
            true,
        },
      );

      results.push({
        uid:
          admin.uid,
        email:
          admin.email,
        status:
          "failed",
        error:
          error?.message ||
          null,
      });
    }
  }

  return {
    adminCount:
      admins.length,
    results,
  };
}
