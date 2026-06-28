import { useState } from "react";

export default function LoginForm({handleLogin}) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form className="space-y-stack-md">
      <div>
        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
          Email Address
        </label>

        <input
          className="w-full auth-input font-body-md py-2 focus:placeholder-transparent"
          placeholder="name@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block font-label-sm text-label-sm text-on-surface-variant">
            Password
          </label>

          <a
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors underline underline-offset-4"
            href="#"
          >
            Forgot Password?
          </a>
        </div>

        <input
          className="w-full auth-input font-body-md py-2"
          placeholder="••••••••"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          className="w-4 h-4 rounded-sm border-outline text-primary focus:ring-0"
          id="remember"
          type="checkbox"
        />

        <label
          className="font-label-sm text-label-sm text-on-surface-variant"
          htmlFor="remember"
        >
          Keep me signed in
        </label>
      </div>

      <button
        className="w-full bg-primary text-on-primary py-4 rounded-lg font-label-md text-label-md tracking-wider hover:bg-tertiary transition-all duration-300 active:scale-[0.98]"
        type="submit"
        onClick={(e) => {
          e.preventDefault();
          handleLogin(email, password);
        }}
      >
      Sign In
      </button>
    </form>
  );
}