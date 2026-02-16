"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const { data, error } = await authClient.signUp.email({
          email,
          password,
          name,
        });
        if (error) throw error;
      } else {
        const { data, error } = await authClient.signIn.email({
          email,
          password,
        });
        if (error) throw error;
      }
      router.push(callbackURL);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
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
        callbackURL
      });
    } catch (err: any) {
      setError(err.message || "Google Sign In failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 mb-4">
            <Sparkles className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">{isSignUp ? "Create Account" : "Welcome Back"}</h1>
          <p className="text-zinc-400">
            {isSignUp ? "Join to save your learning progress" : "Sign in to access your dashboard"}
          </p>
        </div>

        <div className="space-y-4 bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 backdrop-blur-sm">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-4 bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl transition-all shadow-lg shadow-white/10 disabled:opacity-50 flex items-center justify-center gap-3"
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

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink-0 mx-4 text-zinc-500 text-xs uppercase font-bold tracking-widest">Or continue with email</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                className="w-full px-4 py-3 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
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
                className="w-full px-4 py-3 bg-zinc-950 rounded-xl border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin" size={20} />}
              {isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-500 hover:underline font-medium"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>

        <Link href="/" className="block text-center text-sm text-zinc-600 hover:text-zinc-400 transition-colors">
          ← Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
