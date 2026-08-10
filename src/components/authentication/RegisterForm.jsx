"use client";

import { useState } from "react";

export default function RegisterForm({
  handleRegister,
  loading = false,
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    await handleRegister(
      email,
      password,
      confirmPassword,
      firstName,
      lastName
    );
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label
            className="block font-label-sm text-label-sm text-on-surface-variant"
            htmlFor="register-first-name"
          >
            First Name
          </label>

          <input
            id="register-first-name"
            className="auth-input h-10 w-full rounded-xl border border-outline-variant/50 bg-surface px-3 py-0 font-body-md transition-colors focus:border-primary focus:outline-none"
            placeholder="Alex"
            type="text"
            autoComplete="given-name"
            required
            disabled={loading}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label
            className="block font-label-sm text-label-sm text-on-surface-variant"
            htmlFor="register-last-name"
          >
            Last Name
          </label>

          <input
            id="register-last-name"
            className="auth-input h-10 w-full rounded-xl border border-outline-variant/50 bg-surface px-3 py-0 font-body-md transition-colors focus:border-primary focus:outline-none"
            placeholder="Sterling"
            type="text"
            autoComplete="family-name"
            required
            disabled={loading}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          className="block font-label-sm text-label-sm text-on-surface-variant"
          htmlFor="register-email"
        >
          Email Address
        </label>

        <input
          id="register-email"
          className="auth-input h-10 w-full rounded-xl border border-outline-variant/50 bg-surface px-3 py-0 font-body-md transition-colors focus:border-primary focus:outline-none"
          placeholder="name@example.com"
          type="email"
          autoComplete="email"
          required
          disabled={loading}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label
          className="block font-label-sm text-label-sm text-on-surface-variant"
          htmlFor="register-password"
        >
          Create Password
        </label>

        <input
          id="register-password"
          className="auth-input h-10 w-full rounded-xl border border-outline-variant/50 bg-surface px-3 py-0 font-body-md transition-colors focus:border-primary focus:outline-none"
          placeholder="Min. 8 characters"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={loading}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label
          className="block font-label-sm text-label-sm text-on-surface-variant"
          htmlFor="register-confirm-password"
        >
          Confirm Password
        </label>

        <input
          id="register-confirm-password"
          className="auth-input h-10 w-full rounded-xl border border-outline-variant/50 bg-surface px-3 py-0 font-body-md transition-colors focus:border-primary focus:outline-none"
          placeholder="Repeat password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={loading}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </div>

      <button
        className="flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 font-label-md text-label-md font-semibold tracking-wide text-on-primary transition-all duration-200 hover:bg-tertiary active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={loading}
      >
        {loading ? "Sending Verification Code..." : "Create Account"}
      </button>
    </form>
  );
}
