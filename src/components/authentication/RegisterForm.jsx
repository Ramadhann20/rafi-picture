import { useState } from "react";

export default function RegisterForm({handleRegister}) {

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState(""); 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <form className="space-y-stack-md">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
            First Name
          </label>

          <input
            className="w-full auth-input font-body-md py-2"
            placeholder="Alex"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
            Last Name
          </label>

          <input
            className="w-full auth-input font-body-md py-2"
            placeholder="Sterling"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
          Email Address
        </label>

        <input
          className="w-full auth-input font-body-md py-2"
          placeholder="name@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
          Create Password
        </label>

        <input
          className="w-full auth-input font-body-md py-2"
          placeholder="Min. 8 characters"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div>
        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
          Confirm Password
        </label>

        <input
          className="w-full auth-input font-body-md py-2"
          placeholder="Min. 8 characters"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <button
        className="w-full bg-primary text-on-primary py-4 rounded-lg font-label-md text-label-md tracking-wider hover:bg-tertiary transition-all duration-300 active:scale-[0.98]"
        type="submit"
        onClick={(e) => {
          e.preventDefault();
          handleRegister(email, password, confirmPassword, firstName, lastName);
        }}
      >
        REGISTER ACCOUNT
      </button>
    </form>
  );
}