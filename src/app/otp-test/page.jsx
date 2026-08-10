"use client";

import { useEffect, useState } from "react";

export default function OtpTestPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [step, setStep] = useState("email");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  async function readJson(response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  async function handleSendOtp(event) {
    event?.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message || `Request gagal (${response.status})`
        );
      }

      setStep("otp");
      setOtp("");
      setCountdown(Number(data?.resendAfter || 60));
      setMessage(
        data?.message || "Kode OTP berhasil dikirim ke email."
      );
    } catch (err) {
      setError(err?.message || "Gagal mengirim OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
        }),
      });

      const data = await readJson(response);

      if (!response.ok) {
        let detail = data?.message || `Verifikasi gagal (${response.status})`;

        if (typeof data?.remainingAttempts === "number") {
          detail += ` Sisa percobaan: ${data.remainingAttempts}.`;
        }

        throw new Error(detail);
      }

      setMessage(
        data?.message || "Email berhasil diverifikasi."
      );
    } catch (err) {
      setError(err?.message || "Gagal memverifikasi OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0 || loading) return;
    await handleSendOtp();
  }

  function resetTest() {
    setStep("email");
    setOtp("");
    setMessage("");
    setError("");
    setCountdown(0);
  }

  return (
    <main className="min-h-screen bg-[#f7f3ee] px-4 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
          <div className="mb-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Rafi Picture
            </p>

            <h1 className="text-2xl font-semibold tracking-tight">
              OTP Interface Test
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Test kirim dan verifikasi OTP langsung dari browser.
            </p>
          </div>

          {message ? (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@email.com"
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-black/15 bg-white px-4 outline-none transition focus:border-black/40 focus:ring-4 focus:ring-black/5"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-zinc-950 px-4 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="rounded-2xl bg-zinc-50 px-4 py-3">
                <p className="text-xs text-zinc-500">
                  Verification code sent to
                </p>
                <p className="mt-1 break-all text-sm font-medium">
                  {email}
                </p>
              </div>

              <div>
                <label
                  htmlFor="otp"
                  className="mb-2 block text-sm font-medium"
                >
                  6-digit OTP
                </label>

                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                  className="h-14 w-full rounded-xl border border-black/15 bg-white px-4 text-center text-2xl font-semibold tracking-[0.45em] outline-none transition focus:border-black/40 focus:ring-4 focus:ring-black/5"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="h-12 w-full rounded-xl bg-zinc-950 px-4 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <div className="flex items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={resetTest}
                  className="font-medium text-zinc-500 hover:text-zinc-900"
                >
                  Change email
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || loading}
                  className="font-medium text-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-400"
                >
                  {countdown > 0
                    ? `Resend in ${countdown}s`
                    : "Resend OTP"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs leading-5 text-zinc-500">
          Halaman ini hanya untuk testing development. Setelah backend OTP
          beres, flow-nya akan dipindahkan ke Register Form.
        </p>
      </div>
    </main>
  );
}
