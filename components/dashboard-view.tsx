"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Brain, Video, FileText, Zap, Crown, Upload, BookOpen, TrendingUp, Sparkles } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { UploadButton } from "@/components/upload-button";

type SavedInteractionItem = {
  id: string;
  createdAt: string;
  lesson: {
    type: "summary" | "mcq" | "video";
    content: string;
  };
};

type DashboardViewProps = {
  user: {
    name?: string | null;
    image?: string | null;
  };
  isPro: boolean;
  uploadCount: number;
  limit: number;
  totalLessons: number;
  accuracyText: string;
  completionText: string;
  reviewTopicsText: string;
  difficultyLevel: string;
  savedInteractions: SavedInteractionItem[];
};

export function DashboardView({
  user,
  isPro,
  uploadCount,
  limit,
  totalLessons,
  accuracyText,
  completionText,
  reviewTopicsText,
  difficultyLevel,
  savedInteractions,
}: DashboardViewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const firstName = user.name?.trim().split(/\s+/)[0] || "User";

  useLayoutEffect(() => {
    if (!rootRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.from("[data-dash-nav]", {
        opacity: 0,
        y: -20,
        duration: 0.6,
        ease: "power3.out",
      });

      gsap.from("[data-dash-hero]", {
        opacity: 0,
        y: 28,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.from("[data-dash-stat]", {
        opacity: 0,
        y: 20,
        stagger: 0.06,
        duration: 0.6,
        delay: 0.2,
        ease: "power3.out",
      });

      gsap.utils.toArray<HTMLElement>("[data-dash-section]").forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top 82%",
          onEnter: () => {
            gsap.fromTo(
              section,
              { opacity: 0, y: 38 },
              { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", overwrite: "auto" }
            );
          },
        });
      });

      gsap.to("[data-dash-orb-a]", {
        y: -18,
        x: 8,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to("[data-dash-orb-b]", {
        y: 12,
        x: -10,
        duration: 6.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <nav
        data-dash-nav
        className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Zap className="text-white fill-white" size={20} />
              </div>
              <span className="font-black text-xl tracking-tighter group-hover:text-blue-400 transition-colors">Swipr</span>
            </Link>
            <div className="hidden md:flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 px-2 py-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              <Link href="/dashboard" className="px-3 py-1 rounded-full hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <Link href="/planner" className="px-3 py-1 rounded-full hover:text-blue-600 transition-colors">
                Planner
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/planner"
              className="md:hidden px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 hover:text-blue-600 transition-colors"
            >
              Planner
            </Link>
            <div className="flex items-center gap-3 pl-1.5 pr-1.5 sm:pr-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || ""}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black">
                  {(user.name || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[90px] sm:max-w-[120px] block">
                {firstName}
              </span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div
          data-dash-hero
          className="relative overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#e0f2fe_0%,#eef2ff_40%,#fef3c7_100%)] dark:bg-[linear-gradient(120deg,#1e293b_0%,#1f2937_45%,#312e81_100%)] border border-blue-200 dark:border-blue-500/10 p-8 md:p-10"
        >
          <div data-dash-orb-a className="absolute top-0 right-0 w-64 h-64 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-[100px]" />
          <div data-dash-orb-b className="absolute bottom-0 left-0 w-48 h-48 bg-amber-200/30 dark:bg-indigo-500/10 rounded-full blur-[80px]" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
                  Welcome back, <span className="text-blue-600 dark:text-blue-400">{firstName}</span>
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-lg">Your learning command center is live.</p>
              </div>
              <UploadButton />
            </div>
          </div>
        </div>

        <div data-dash-section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            data-dash-stat
            className={`relative overflow-hidden rounded-2xl p-5 border ${isPro ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/5 border-amber-300 dark:border-amber-500/20" : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Plan</span>
              {isPro ? <Crown size={18} className="text-amber-600 dark:text-amber-500" /> : <Sparkles size={18} className="text-zinc-400 dark:text-zinc-600" />}
            </div>
            <p className={`text-2xl font-black ${isPro ? "text-amber-600 dark:text-amber-400" : "text-zinc-900 dark:text-white"}`}>{isPro ? "Pro" : "Free"}</p>
            <p className="text-xs text-zinc-500 mt-1">{isPro ? "Unlimited everything" : "Basic access"}</p>
          </div>

          <div data-dash-stat className="relative overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Uploads</span>
              <Upload size={18} className="text-blue-600 dark:text-blue-500" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{isPro ? uploadCount : `${uploadCount}/${limit}`}</p>
            {!isPro && (
              <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${uploadCount >= limit ? "bg-red-500" : "bg-blue-600 dark:bg-blue-500"}`}
                  style={{ width: `${Math.min((uploadCount / limit) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          <div data-dash-stat className="relative overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Saved</span>
              <BookOpen size={18} className="text-emerald-600 dark:text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{savedInteractions.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Lessons bookmarked</p>
          </div>

          <div data-dash-stat className="relative overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Generated</span>
              <TrendingUp size={18} className="text-purple-600 dark:text-purple-500" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{totalLessons}</p>
            <p className="text-xs text-zinc-500 mt-1">Total lessons</p>
          </div>

          <div data-dash-stat className="relative overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">MCQ Accuracy</span>
              <Brain size={18} className="text-emerald-600 dark:text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{accuracyText}</p>
            <p className="text-xs text-zinc-500 mt-1">Correct answer rate</p>
          </div>

          <div data-dash-stat className="relative overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Completion</span>
              <TrendingUp size={18} className="text-blue-600 dark:text-blue-500" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{completionText}</p>
            <p className="text-xs text-zinc-500 mt-1">Viewed to completed lessons</p>
          </div>

          <div data-dash-stat className="relative overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Current Level</span>
              <Sparkles size={18} className="text-indigo-600 dark:text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white capitalize">{difficultyLevel}</p>
            <p className="text-xs text-zinc-500 mt-1">Adaptive difficulty target</p>
          </div>

          <div data-dash-stat className="relative overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-5 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Review Focus</span>
              <BookOpen size={18} className="text-amber-600 dark:text-amber-500" />
            </div>
            <p className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-3">{reviewTopicsText}</p>
            <p className="text-xs text-zinc-500 mt-2">Topics queued for spaced repetition</p>
          </div>
        </div>

        {!isPro && (
          <div data-dash-section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 p-[1px]">
            <div className="rounded-2xl bg-white dark:bg-zinc-950/90 backdrop-blur-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                  <Crown size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">Upgrade to Pro</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">Unlimited PDF uploads, priority AI processing, and exclusive features.</p>
                </div>
              </div>
              <form action="/api/stripe/checkout" method="POST">
                <button
                  type="submit"
                  className="shrink-0 px-8 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-black rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97] shadow-xl shadow-blue-500/20 text-sm uppercase tracking-wider"
                >
                  Upgrade - $9.99/mo
                </button>
              </form>
            </div>
          </div>
        )}

        <div data-dash-section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">Saved Lessons</h2>
              <span className="px-2.5 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400">{savedInteractions.length}</span>
            </div>
          </div>

          {savedInteractions.length === 0 ? (
            <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/30 rounded-3xl border border-zinc-200 dark:border-zinc-800/50 border-dashed">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-200 dark:bg-zinc-800/50 flex items-center justify-center mb-4">
                <Brain size={32} className="text-zinc-400 dark:text-zinc-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-600 dark:text-zinc-400">No saved lessons yet</h3>
              <p className="text-zinc-500 dark:text-zinc-600 mt-2 text-sm max-w-sm mx-auto">Start learning and tap the bookmark icon on any lesson to save it here!</p>
              <Link href="/" className="inline-flex items-center gap-2 mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition text-sm text-white">
                <Zap size={16} /> Start Learning
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedInteractions.map((interaction) => (
                <div
                  key={interaction.id}
                  data-dash-stat
                  className="group p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-black/20 hover:-translate-y-0.5 duration-200"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${interaction.lesson.type === "video" ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/10" : interaction.lesson.type === "mcq" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/10" : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/10"}`}>
                        {interaction.lesson.type === "video" && <Video size={12} />}
                        {interaction.lesson.type === "mcq" && <Brain size={12} />}
                        {interaction.lesson.type === "summary" && <FileText size={12} />}
                        {interaction.lesson.type}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-600 font-medium">
                        {new Date(interaction.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>

                    <p className="text-sm font-medium leading-relaxed line-clamp-3 text-zinc-700 dark:text-zinc-300">{interaction.lesson.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
