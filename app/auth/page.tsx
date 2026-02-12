"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Github, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
    baseURL: typeof window !== "undefined" ? window.location.origin : ""
});

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSocialLogin = async (provider: 'github' | 'google') => {
    setIsLoading(true);
    try {
        await authClient.signIn.social({
            provider,
            callbackURL: "/"
        });
    } catch (error) {
        console.error("Login failed:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        await authClient.signIn.email({
            email,
            password: "password123", // Simplified for MVP/Demo
            callbackURL: "/"
        });
    } catch (error) {
        console.error("Email login failed:", error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-400/10 rounded-full blur-[120px]" />
      </div>

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-bold">
        <ArrowLeft size={20} /> Back to home
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex w-12 h-12 bg-blue-600 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/20 mb-2">
            <Zap className="text-white fill-white" size={24} />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Join MicroLearn</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">
            Align your learning with your attention span.
          </p>
        </div>

        <div className="grid gap-4">
          <button 
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-black text-lg hover:border-blue-500/50 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={24} /> : (
                <div className="w-6 h-6 bg-red-500 rounded-sm flex items-center justify-center text-white text-[10px] font-black">G</div>
            )}
            Continue with Google
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-sm uppercase">
              <span className="bg-white dark:bg-zinc-950 px-4 text-zinc-500 font-bold">Or use email</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <input 
              type="email" 
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 focus:border-blue-500 outline-none transition-all font-bold"
              required
            />
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-black text-lg hover:border-blue-500/50 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Mail size={24} className="text-zinc-400" />} 
              Sign up with Email
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 font-bold">
          By continuing, you agree to our <br />
          <Link href="#" className="underline hover:text-blue-600 transition-colors">Terms of Service</Link> and <Link href="#" className="underline hover:text-blue-600 transition-colors">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
