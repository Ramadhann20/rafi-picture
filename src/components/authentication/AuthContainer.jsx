"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "../../context/AuthContext";

import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function AuthContainer() {

  const router = useRouter();

   const { user, login, register, loading} = useAuth();

    // Auto redirect kalau sudah login (ini akan kepakai setelah register sukses juga)
    useEffect(() => {
      if (loading) return;
      if (!user) return;
      router.push("/");
    }, [user, loading, router]);

   const handleLogin = async (email, password) => {
        try {
            await login(email, password);
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    const handleRegister = async (email, password, confirmPassword, firstName, lastName) => {
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      await register({ email, password, username: firstName + " " + lastName });
      // Jangan router.push("/login")
      // Karena register() kamu sudah auto-login via Firebase Auth.
      // useEffect di atas akan redirect.
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };


  const [authMode, setAuthMode] = useState("login");

  const isLogin = authMode === "login";

  return (
    <div className="w-full max-w-sm fade-in">
      <div className="mb-stack-lg">
        <h3 className="font-headline-lg text-headline-lg text-primary mb-2">
          {isLogin ? "Welcome Back" : "Join the Studio"}
        </h3>

        <p className="font-body-md text-on-surface-variant">
          {isLogin
            ? "Sign in to your client dashboard to view your collections."
            : "Create an account to start your journey with Rafi Picture."}
        </p>
      </div>

      <div className="flex border-b border-outline-variant/30 mb-stack-md">
        <button
          type="button"
          onClick={() => setAuthMode("login")}
          className={`flex-1 pb-4 font-label-md text-label-md border-b-2 transition-all ${
            isLogin
              ? "text-primary border-primary"
              : "text-on-surface-variant border-transparent hover:text-primary"
          }`}
        >
          Sign In
        </button>

        <button
          type="button"
          onClick={() => setAuthMode("register")}
          className={`flex-1 pb-4 font-label-md text-label-md border-b-2 transition-all ${
            !isLogin
              ? "text-primary border-primary"
              : "text-on-surface-variant border-transparent hover:text-primary"
          }`}
        >
          Create Account
        </button>
      </div>

      {isLogin ? <LoginForm handleLogin={handleLogin} /> : <RegisterForm handleRegister={handleRegister} />}

      <div className="flex items-center my-stack-md">
        <div className="grow h-px bg-outline-variant/30" />
        <span className="px-4 font-label-sm text-label-sm text-on-surface-variant">
          OR CONTINUE WITH
        </span>
        <div className="grow h-px bg-outline-variant/30" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-stack-lg">
        <button
          type="button"
          className="flex items-center justify-center space-x-2 py-3 border border-outline-variant/50 rounded-lg hover:bg-secondary-container/20 transition-all group"
        >
          <span className="font-label-md text-label-md">Google</span>
        </button>

        <button
          type="button"
          className="flex items-center justify-center space-x-2 py-3 border border-outline-variant/50 rounded-lg hover:bg-secondary-container/20 transition-all group"
        >
          <span className="font-label-md text-label-md">Facebook</span>
        </button>
      </div>

      <div className="text-center">
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          By continuing, you agree to our{" "}
          <a className="text-primary underline underline-offset-2" href="#">
            Terms of Service
          </a>{" "}
          and{" "}
          <a className="text-primary underline underline-offset-2" href="#">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}