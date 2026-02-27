"use client";

import { Suspense, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import Link from "next/link";

const AuthPageContent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL") || "/dashboard";

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === "object" && err !== null && "message" in err) {
      const maybeMessage = (err as { message?: unknown }).message;
      if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) {
        return maybeMessage;
      }
    }
    return fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name,
        });
        if (error) throw error;
      } else {
        const { error } = await authClient.signIn.email({
          email,
          password,
        });
        if (error) throw error;
      }
      router.push(callbackURL);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Authentication failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Google Sign In failed"));
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(120%_120%_at_0%_0%,#1d4ed8_0%,#0a0a0a_40%,#020617_100%)] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.16)_1px,transparent_0)] [background-size:24px_24px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-8 px-4 py-8 md:grid-cols-2 md:px-8"
      >
        <div className="hidden md:block">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
              <Sparkles size={14} />
              AI Learning OS
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-black tracking-tight leading-[0.95]">
                Learn Like a
                <br />
                <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                  Scroll Addict
                </span>
              </h1>
              <p className="max-w-md text-zinc-300">
                Upload your PDFs and turn them into short, addictive lessons with built-in recall checks.
              </p>
            </div>
            <div className="grid max-w-md gap-3">
              {[
                "Bite-sized summaries generated from your material",
                "MCQs mixed in for active recall and retention",
                "Feed-style flow designed for momentum",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 backdrop-blur-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-zinc-900/60 p-6 shadow-[0_24px_64px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-8">
          <div className="space-y-4 text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/20">
              <Sparkles className="text-white" size={24} />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tight">{isSignUp ? "Create Account" : "Welcome Back"}</h2>
              <p className="text-sm text-zinc-400">
                {isSignUp ? "Start your AI micro-learning journey." : "Sign in to continue your learning streak."}
              </p>
            </div>
            <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-zinc-950/70 p-1">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`rounded-lg py-2 text-sm font-bold transition-colors ${!isSignUp ? "bg-blue-500 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`rounded-lg py-2 text-sm font-bold transition-colors ${isSignUp ? "bg-blue-500 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-medium text-red-300">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white py-4 font-bold text-zinc-950 shadow-lg shadow-white/10 transition-all hover:bg-zinc-100 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-zinc-800" />
            <span className="mx-4 flex-shrink-0 text-xs font-bold uppercase tracking-widest text-zinc-500">Or continue with email</span>
            <div className="flex-grow border-t border-zinc-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="John Doe"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="hello@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="animate-spin" size={20} />}
              {isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-medium text-blue-400 hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>

          <Link href="/" className="block text-center text-sm text-zinc-500 transition-colors hover:text-zinc-300">
            &larr; Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <AuthPageContent />
    </Suspense>
  );
}

