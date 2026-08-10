function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildNotificationHtml({
  message,
  bookingCode,
}) {
  const body = escapeHtml(message)
    .replace(/\r?\n/g, "<br />");

  const reference = escapeHtml(
    bookingCode || "-"
  );

  return `<!doctype html>
<html lang="id">
  <body style="margin:0;padding:0;background:#f7f5f2;font-family:Arial,Helvetica,sans-serif;color:#24211f;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f2;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-collapse:collapse;">
            <tr>
              <td style="padding:32px 36px 20px;border-bottom:1px solid #e8e2dc;">
                <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8a6a55;">Rafi Picture</div>
                <div style="margin-top:8px;font-size:24px;line-height:1.25;font-weight:600;">Booking Notification</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 36px;font-size:15px;line-height:1.75;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 36px;border-top:1px solid #e8e2dc;font-size:12px;line-height:1.6;color:#756e69;">
                Booking reference: <strong>${reference}</strong><br />
                Email ini dikirim oleh Rafi Picture.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
