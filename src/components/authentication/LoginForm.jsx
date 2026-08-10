"use client";

import { useState } from "react";

export default function LoginForm({ handleLogin, loading = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    await handleLogin(email, password);
  };

  return (
    <form className="space-y-3.5" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label
          className="block font-label-sm text-label-sm text-on-surface-variant"
          htmlFor="login-email"
        >
          Email Address
        </label>

        <input
          id="login-email"
          className="auth-input h-11 w-full rounded-xl border border-outline-variant/50 bg-surface px-3.5 py-0 font-body-md transition-colors focus:border-primary focus:placeholder-transparent focus:outline-none"
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
        <div className="flex items-center justify-between">
          <label
            className="block font-label-sm text-label-sm text-on-surface-variant"
            htmlFor="login-password"
          >
            Password
          </label>

          <a
            className="font-label-sm text-label-sm text-primary/80 underline-offset-4 transition-colors hover:text-primary hover:underline"
            href="#"
          >
            Forgot Password?
          </a>
        </div>

        <input
          id="login-password"
          className="auth-input h-11 w-full rounded-xl border border-outline-variant/50 bg-surface px-3.5 py-0 font-body-md transition-colors focus:border-primary focus:outline-none"
          placeholder="••••••••"
          type="password"
          autoComplete="current-password"
          required
          disabled={loading}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          className="h-4 w-4 rounded border-outline text-primary focus:ring-primary/20"
          id="remember"
          type="checkbox"
          disabled={loading}
        />

        <label
          className="font-label-sm text-label-sm text-on-surface-variant"
          htmlFor="remember"
        >
          Keep me signed in
        </label>
      </div>

      <button
        className="flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 font-label-md text-label-md font-semibold tracking-wide text-on-primary transition-all duration-200 hover:bg-tertiary active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={loading}
      >
        {loading ? "Signing In..." : "Sign In"}
      </button>
    </form>
  );
}
