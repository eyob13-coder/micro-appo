"use client";

import React, { useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Zap, Brain, Rocket, Upload, ChevronRight, CheckCircle2, Twitter, Github, MessageCircle, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { TikTokFeed } from '@/components/tiktok-feed';
import { authClient } from '@/lib/auth-client';
import { useSearchParams } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
// @ts-ignore
import Autoplay from "embla-carousel-autoplay";

const LandingPage = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const [showFeed, setShowFeed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedLessons, setUploadedLessons] = useState<any[] | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { data: session } = authClient.useSession();
  const searchParams = useSearchParams();

  // State validation to prevent hydration mismatch
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!mounted) return;
    if (searchParams.get("showFeed") !== "true") return;

    setShowFeed(true);
    const rawLessons =
      sessionStorage.getItem("swipr_uploaded_lessons") ||
      sessionStorage.getItem("microlearn_uploaded_lessons");
    if (!rawLessons) return;

    try {
      const parsed = JSON.parse(rawLessons);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setUploadedLessons(parsed);
      }
    } catch (e) {
      console.warn("Failed to parse uploaded lessons from sessionStorage", e);
    } finally {
      sessionStorage.removeItem("swipr_uploaded_lessons");
      sessionStorage.removeItem("microlearn_uploaded_lessons");
    }
  }, [mounted, searchParams]);

  useLayoutEffect(() => {
    if (!mounted || !pageRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const heroIntro = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroIntro
        .from("[data-gsap-hero-chip]", { opacity: 0, y: 26, duration: 0.7 })
        .from("[data-gsap-hero-word]", { opacity: 0, yPercent: 120, duration: 0.85, stagger: 0.045 }, "-=0.2")
        .from("[data-gsap-hero-subtitle]", { opacity: 0, y: 24, duration: 0.65 }, "-=0.35")
        .from("[data-gsap-hero-actions]", { opacity: 0, y: 28, duration: 0.65 }, "-=0.3")
        .from("[data-gsap-hero-visual]", { opacity: 0, y: 48, scale: 0.94, duration: 1 }, "-=0.65");

      gsap.to("[data-gsap-float-b]", {
        y: -12,
        duration: 4.6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      const methodFlowA = document.querySelector<HTMLElement>("[data-gsap-method-flow-a]");
      const methodFlowB = document.querySelector<HTMLElement>("[data-gsap-method-flow-b]");
      const methodFlowC = document.querySelector<HTMLElement>("[data-gsap-method-flow-c]");

      if (methodFlowA) {
        gsap.to(methodFlowA, {
          xPercent: 8,
          yPercent: -10,
          duration: 12,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      if (methodFlowB) {
        gsap.to(methodFlowB, {
          xPercent: -10,
          yPercent: 8,
          duration: 15,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      if (methodFlowC) {
        gsap.to(methodFlowC, {
          xPercent: 6,
          yPercent: 6,
          duration: 18,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      gsap.utils.toArray<HTMLElement>("[data-gsap-section]").forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top 82%",
          onEnter: () => {
            gsap.fromTo(
              section,
              { opacity: 0, y: 68 },
              { opacity: 1, y: 0, duration: 1, ease: "power3.out", overwrite: "auto" }
            );
          },
          onEnterBack: () => {
            gsap.fromTo(
              section,
              { opacity: 0, y: 40 },
              { opacity: 1, y: 0, duration: 0.75, ease: "power3.out", overwrite: "auto" }
            );
          },
        });
      });

      const scrollRoot = pageRef.current as HTMLElement;

      gsap.to("[data-gsap-orb-a]", {
        yPercent: 18,
        xPercent: -10,
        ease: "none",
        scrollTrigger: {
          trigger: scrollRoot,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      gsap.to("[data-gsap-orb-b]", {
        yPercent: -14,
        xPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: scrollRoot,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2,
        },
      });

      ScrollTrigger.create({
        trigger: "[data-gsap-features-scroller]",
        start: "top 75%",
        onEnter: () => {
          gsap.fromTo(
            "[data-gsap-feature-card]",
            { opacity: 0, y: 40, scale: 0.96 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.9,
              stagger: 0.1,
              ease: "power3.out",
              overwrite: "auto",
            }
          );
        },
        onEnterBack: () => {
          gsap.fromTo(
            "[data-gsap-feature-card]",
            { opacity: 0, y: 24, scale: 0.98 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.65,
              stagger: 0.08,
              ease: "power3.out",
              overwrite: "auto",
            }
          );
        },
      });

      const section = document.querySelector<HTMLElement>("[data-gsap-features-scroller]");
      const track = document.querySelector<HTMLElement>("[data-gsap-feature-track]");
      if (section && track) {
        const getDistance = () => Math.max(0, track.scrollWidth - section.clientWidth);
        const getMaxShift = () => {
          const distance = getDistance();
          const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
          return isMobile ? Math.min(distance, 420) : Math.min(distance, 220);
        };

        gsap.to(track, {
          x: () => -getMaxShift(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            end: "bottom top",
            scrub: 0.75,
            invalidateOnRefresh: true,
          },
        });
      }

      gsap.to("[data-gsap-testi-row-1]", {
        x: -1500,
        duration: 35,
        ease: "none",
        repeat: -1,
      });

      gsap.fromTo(
        "[data-gsap-testi-row-2]",
        { x: -1500 },
        { x: 0, duration: 38, ease: "none", repeat: -1 }
      );
    }, pageRef);

    return () => {
      ctx.revert();
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div ref={pageRef} className="relative min-h-screen bg-black/90 selection:bg-blue-500/30">
      <motion.div
        animate={showFeed || isProcessing ? { scale: 0.92, opacity: 0.4, filter: "blur(10px)", borderRadius: "30px" } : { scale: 1, opacity: 1, filter: "blur(0px)", borderRadius: "0px" }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="origin-top bg-white dark:bg-zinc-950 min-h-screen shadow-2xl overflow-hidden origin-center"
      >
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-[100] transition-all duration-300">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center justify-between bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 px-6 py-3 rounded-full shadow-lg shadow-zinc-500/5"
            >
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Zap className="text-white fill-white" size={20} />
                </div>
                <span className="font-black text-2xl tracking-tighter">Swipr</span>
              </div>

              <div className="hidden md:flex items-center gap-8">
                {[
                  { name: 'Method', id: 'method' },
                  { name: 'Features', id: 'features' },
                  { name: 'Testimonials', id: 'testimonials' }
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="text-sm font-bold text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-widest"
                  >
                    {item.name}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                {session?.user ? (
                  <a
                    href="/dashboard"
                    className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all border border-zinc-200/50 dark:border-zinc-700/50 group"
                  >
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || ""}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/30"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black">
                        {(session.user.name || session.user.email || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-[120px]">
                      {session.user.name || "Dashboard"}
                    </span>
                  </a>
                ) : (
                  <button
                    onClick={() => window.location.href = '/auth'}
                    className="block text-sm font-black px-6 py-2.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:scale-105 transition-transform active:scale-95 shadow-md shadow-zinc-500/10"
                  >
                    GET STARTED
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </nav>

        {/* Hero Section */}
        <section data-gsap-section data-gsap-panel data-gsap-hero-section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-[90vh] flex items-center">
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <motion.div
              data-gsap-orb-a
              className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-400/20 rounded-full blur-[120px]"
            />
            <motion.div
              data-gsap-orb-b
              className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-400/20 rounded-full blur-[120px]"
            />
          </div>
          <div data-gsap-hero-mask className="absolute inset-0 z-[1] bg-gradient-to-b from-white/70 via-white/20 to-transparent dark:from-zinc-900/70 dark:via-zinc-900/20 dark:to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
            <div data-gsap-hero-copy className="space-y-8 text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                data-gsap-hero-chip
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/5 dark:bg-zinc-100/5 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-sm font-bold shadow-sm"
              >
                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                Revolutionizing Education
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-7xl md:text-8xl font-black tracking-tighter leading-[0.9] text-zinc-950 dark:text-white"
              >
                <span className="inline-flex flex-wrap gap-x-3">
                  {["Don't", "Study."].map((word) => (
                    <span key={word} data-gsap-hero-word className="inline-block">
                      {word}
                    </span>
                  ))}
                </span>
                <br />
                <span className="inline-flex flex-wrap gap-x-3">
                  {["Consume", "Wisdom."].map((word) => (
                    <span
                      key={word}
                      data-gsap-hero-word
                      className={`inline-block ${word === "Consume" ? "italic font-serif font-light text-blue-600 dark:text-blue-400" : ""}`}
                    >
                      {word}
                    </span>
                  ))}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                data-gsap-hero-subtitle
                className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed font-medium"
              >
                The world&apos;s first TikTok-style study app. Turn your boring lectures and PDFs into addictive, bite-sized micro-lessons.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                data-gsap-hero-actions
                className="flex flex-col sm:flex-row items-center gap-4"
              >
                <button
                  onClick={() => setShowFeed(true)}
                  className="group w-full sm:w-auto px-10 py-5 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.05] active:scale-[0.98] transition-all shadow-2xl shadow-zinc-500/20"
                >
                  Start Now <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </button>
                <div
                  onClick={() => {
                    // Auth guard: redirect to login if not authenticated
                    if (!session?.user) {
                      window.location.href = '/auth?callbackURL=/';
                      return;
                    }
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf';
                    input.onchange = async (e: any) => {
                      const file = e.target.files[0];
                      if (file) {
                        setIsProcessing(true);
                        setUploadError(null);
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          const res = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData
                          });
                          const data = await res.json();
                          if (res.ok && data.lessons) {
                            setUploadedLessons(data.lessons);
                            setShowFeed(true);
                          } else if (data.requireGoogleAuth) {
                            setUploadError('Please sign in with Google first.');
                            setTimeout(() => window.location.href = '/auth?callbackURL=/', 1500);
                          } else if (data.limitReached) {
                            setUploadError('Free limit reached (3 uploads). Upgrade to Pro!');
                          } else if (data.fileTooLarge) {
                            const max = data.maxFileSizeMb ? `${data.maxFileSizeMb}MB` : 'your plan limit';
                            setUploadError(`File size too large. Max limit is ${max}.`);
                          } else {
                            setUploadError(data.error || 'Failed to process PDF');
                          }
                        } catch (err) {
                          setUploadError('Network error. Please try again.');
                        } finally {
                          setIsProcessing(false);
                        }
                      }
                    };
                    input.click();
                  }}
                  className="w-full sm:w-auto flex items-center gap-3 px-8 py-5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 font-bold text-lg bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:border-blue-500 transition-colors cursor-pointer group"
                >
                  <Upload size={22} className="text-zinc-400 group-hover:text-blue-500 transition-colors" />
                  <span>Upload PDF</span>
                </div>
                {uploadError && (
                  <p className="text-red-500 text-sm font-bold mt-2">{uploadError}</p>
                )}
              </motion.div>
            </div>

            <motion.div
              data-gsap-hero-visual
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <Carousel
                opts={{ loop: true }}
                plugins={[Autoplay({ delay: 4000 })]}
                className="relative z-10 rounded-[2.5rem] overflow-hidden border-8 border-white dark:border-zinc-900 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] aspect-[4/5] bg-zinc-100 dark:bg-zinc-800"
              >
                <CarouselContent>
                  {[
                    {
                      img: "/hero-micro-1.svg",
                      title: "AI Micro-Lessons",
                      subtitle: "Swipe-sized concepts, built for retention"
                    },
                    {
                      img: "/hero-micro-2.svg",
                      title: "Feed-First Learning",
                      subtitle: "Summaries, MCQs, and videos in one stream"
                    },
                    {
                      img: "/hero-micro-3.svg",
                      title: "Adaptive Momentum",
                      subtitle: "Your path adjusts to every interaction"
                    }
                  ].map((slide, index) => (
                    <CarouselItem key={index} className="relative aspect-[4/5]">
                      <img
                        src={slide.img}
                        alt={slide.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
                      <div className="absolute bottom-8 left-8 right-8 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <Zap size={16} />
                          </div>
                          <span className="font-bold text-sm">Swipr AI</span>
                        </div>
                        <h3 className="text-2xl font-bold">{slide.title}</h3>
                        <p className="text-zinc-200 text-sm font-medium">{slide.subtitle}</p>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>

              {/* Floating Achievement Badge */}
              <motion.div
                data-gsap-float-b
                className="absolute -bottom-6 -right-6 p-4 rounded-2xl bg-white dark:bg-zinc-800 shadow-2xl border border-zinc-100 dark:border-zinc-700 z-20"
              >
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Brain size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">AI Powered</p>
                    <p className="font-black text-zinc-900 dark:text-white text-sm">Smart Learning</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Method Section */}
        <section id="method" data-gsap-section data-gsap-panel className="relative py-32 overflow-hidden bg-[linear-gradient(120deg,#f8fafc_0%,#eef2ff_45%,#e0f2fe_100%)] dark:bg-[linear-gradient(120deg,#0b1220_0%,#111827_45%,#0b2236_100%)]">
          <div className="absolute inset-0 pointer-events-none">
            <div
              data-gsap-method-flow-a
              className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-blue-400/25 dark:bg-blue-500/15 blur-3xl"
            />
            <div
              data-gsap-method-flow-b
              className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-cyan-300/20 dark:bg-cyan-500/10 blur-3xl"
            />
            <div
              data-gsap-method-flow-c
              className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-indigo-300/25 dark:bg-indigo-500/12 blur-3xl"
            />
            <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.08)_1px,transparent_0)] dark:[background-image:radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.14)_1px,transparent_0)] [background-size:26px_26px]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                Science-Backed <br />
                <span className="text-blue-600">Micro-Learning.</span>
              </h2>
              <p className="text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                We apply the principles of spaced repetition and active recall to ensure maximum retention. By breaking down complex topics into atomic units, your brain processes information faster and remembers it longer.
              </p>
              <ul className="space-y-4">
                {[
                  "Atomic content units for focus",
                  "Spaced repetition algorithms",
                  "Active recall through MCQs",
                  "Visual-first learning experience"
                ].map((point, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold text-zinc-700 dark:text-zinc-300">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                      <CheckCircle2 size={14} />
                    </div>
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 aspect-video bg-zinc-100 dark:bg-zinc-800 group"
            >
              <img
                src="/methodology.png"
                alt="Learning Methodology"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 to-transparent" />
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          data-gsap-section
          data-gsap-panel
          data-gsap-features-scroller
          className="py-32 relative overflow-hidden bg-[linear-gradient(120deg,#fff7ed_0%,#fefce8_45%,#ecfeff_100%)] dark:bg-[linear-gradient(120deg,#111827_0%,#0f172a_45%,#042f2e_100%)]"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 left-1/4 h-64 w-64 rounded-full bg-orange-300/30 dark:bg-orange-500/10 blur-3xl" />
            <div className="absolute top-1/3 -left-20 h-72 w-72 rounded-full bg-amber-300/25 dark:bg-amber-500/10 blur-3xl" />
            <div className="absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-cyan-300/25 dark:bg-cyan-500/10 blur-3xl" />
            <div className="absolute inset-0 opacity-35 [background-image:repeating-linear-gradient(115deg,rgba(15,23,42,0.06)_0,rgba(15,23,42,0.06)_1px,transparent_1px,transparent_20px)] dark:[background-image:repeating-linear-gradient(115deg,rgba(148,163,184,0.12)_0,rgba(148,163,184,0.12)_1px,transparent_1px,transparent_22px)]" />
          </div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">Engineered for Focus</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-lg">We didn&apos;t just build an app; we built a new way to interact with information.</p>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-orange-50 dark:from-zinc-900 to-transparent z-20" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-cyan-50 dark:from-teal-950/60 to-transparent z-20" />
              <div className="overflow-x-auto lg:overflow-visible pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [touch-action:auto]">
                <div data-gsap-feature-track className="flex gap-6 md:gap-8 w-max px-1 md:px-2">
                  {[
                    {
                      icon: <Brain className="text-blue-500" />,
                      title: "AI Snippets",
                      desc: "Dense textbooks become atomic takeaways with sequencing tuned to your attention rhythm.",
                      gradient: "from-blue-500/20 to-cyan-500/5"
                    },
                    {
                      icon: <Zap className="text-amber-500" />,
                      title: "Infinite Scroll",
                      desc: "A feed-native learning loop designed for flow: low friction, high retention, no dead time.",
                      gradient: "from-amber-500/20 to-orange-500/5"
                    },
                    {
                      icon: <Rocket className="text-emerald-500" />,
                      title: "Active Recall",
                      desc: "MCQs are injected at the right cadence so recall becomes automatic before forgetting hits.",
                      gradient: "from-emerald-500/20 to-teal-500/5"
                    },
                    {
                      icon: <BookOpen className="text-indigo-500" />,
                      title: "Adaptive Path",
                      desc: "Difficulty and topic mix shift in real-time based on skips, saves, completion, and answer quality.",
                      gradient: "from-indigo-500/20 to-blue-500/5"
                    }
                  ].map((feature, i) => (
                    <motion.div
                      data-gsap-feature-card
                      key={i}
                      whileHover={{ y: -10 }}
                      className="group relative w-[82vw] sm:w-[66vw] lg:w-[38vw] xl:w-[32vw] min-h-[360px] md:min-h-[420px] p-8 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-2xl transition-all overflow-hidden snap-center"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-70`} />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_50%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_50%)]" />
                      <div className="relative z-10 h-full flex flex-col justify-between space-y-6">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-700 group-hover:scale-110 transition-transform">
                          {feature.icon}
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-3xl font-black tracking-tight">{feature.title}</h3>
                          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-lg">
                            {feature.desc}
                          </p>
                        </div>
                        <div className="w-12 h-1 rounded-full bg-zinc-900/70 dark:bg-white/70" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" data-gsap-section data-gsap-panel className="py-32 bg-white dark:bg-zinc-950 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 mb-20 text-center space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black tracking-tighter"
            >
              Built for <span className="text-blue-600 dark:text-blue-400">Modern</span> Learners.
            </motion.h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xl font-medium max-w-2xl mx-auto">
              See how Swipr is designed to change how people study.
            </p>
          </div>

          <div className="space-y-12">
            {/* First Row - Forward */}
            <div className="flex whitespace-nowrap overflow-hidden">
              <div data-gsap-testi-row-1 className="flex gap-8 px-4">
                {[
                  { name: "Sarah J.", role: "Med Student", text: "Finally, I can study my anatomy notes while waiting for coffee. Life-changing!", img: "/student-testimonial_1.jpg" },
                  { name: "Alex M.", role: "Law Student", text: "The AI extracts the most complex legal concepts into digestible bites. Incredible.", img: "/student-testimonial_2.jpg" },
                  { name: "David K.", role: "Engineering", text: "Quantum physics used to be a nightmare. Now it feels like a casual scroll.", img: "/student-testimonial_3.jpg" },
                  { name: "Sarah J.", role: "Med Student", text: "Finally, I can study my anatomy notes while waiting for coffee. Life-changing!", img: "/student-testimonial_1.jpg" },
                  { name: "Alex M.", role: "Law Student", text: "The AI extracts the most complex legal concepts into digestible bites. Incredible.", img: "/student-testimonial_2.jpg" },
                  { name: "David K.", role: "Engineering", text: "Quantum physics used to be a nightmare. Now it feels like a casual scroll.", img: "/student-testimonial_3.jpg" }
                ].map((t, i) => (
                  <div key={i} className="w-[450px] p-8 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center gap-6 shadow-sm hover:shadow-xl transition-shadow group-hover/row1:[animation-play-state:paused] whitespace-normal overflow-hidden">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-4 border-white dark:border-zinc-800 shadow-lg">
                      <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-base font-bold italic leading-relaxed text-zinc-800 dark:text-zinc-200 line-clamp-3 break-words">"{t.text}"</p>
                      <div className="min-w-0">
                        <h4 className="font-black text-blue-600 dark:text-blue-400 truncate">{t.name}</h4>
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 truncate">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Second Row - Reverse */}
            <div className="flex whitespace-nowrap overflow-hidden">
              <div data-gsap-testi-row-2 className="flex gap-8 px-4">
                {[
                  { name: "Elena R.", role: "PhD Candidate", text: "The dopamine hit of scrolling mixed with active recall? Genius stuff.", img: "/student-testimonial_2.jpg" },
                  { name: "Marcus L.", role: "Business Major", text: "I finished my entire semester review in one afternoon. Unbelievable.", img: "/student-testimonial_3.jpg" },
                  { name: "Jordan P.", role: "CompSci", text: "Best AI integration I've seen in education. Clean, fast, and effective.", img: "/student-testimonial_1.jpg" },
                  { name: "Elena R.", role: "PhD Candidate", text: "The dopamine hit of scrolling mixed with active recall? Genius stuff.", img: "/student-testimonial_2.jpg" },
                  { name: "Marcus L.", role: "Business Major", text: "I finished my entire semester review in one afternoon. Unbelievable.", img: "/student-testimonial_3.jpg" },
                  { name: "Jordan P.", role: "CompSci", text: "Best AI integration I've seen in education. Clean, fast, and effective.", img: "/student-testimonial_1.jpg" }
                ].map((t, i) => (
                  <div key={i} className="w-[450px] p-8 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center gap-6 shadow-sm hover:shadow-xl transition-shadow group-hover/row2:[animation-play-state:paused] whitespace-normal overflow-hidden">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-4 border-white dark:border-zinc-800 shadow-lg">
                      <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-base font-bold italic leading-relaxed text-zinc-800 dark:text-zinc-200 line-clamp-3 break-words">"{t.text}"</p>
                      <div className="min-w-0">
                        <h4 className="font-black text-purple-600 dark:text-purple-400 truncate">{t.name}</h4>
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 truncate">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Organizations Marquee Section */}
        <section data-gsap-section data-gsap-panel className="py-20 border-y border-zinc-100 dark:border-zinc-900 overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="max-w-7xl mx-auto px-6 mb-12">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400 text-center">Powering students at world-class institutions</p>
          </div>

          <div className="space-y-8">
            {/* Forward Marquee */}
            <div className="flex whitespace-nowrap">
              <motion.div
                animate={{ x: [0, -1000] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="flex gap-12 items-center text-4xl md:text-5xl font-black text-zinc-200 dark:text-zinc-800 uppercase italic tracking-tighter select-none"
              >
                {Array(10).fill(0).map((_, i) => (
                  <div key={i} className="flex gap-12">
                    <span>Stanford</span>
                    <span className="text-blue-500/30">●</span>
                    <span>Harvard</span>
                    <span className="text-blue-500/30">●</span>
                    <span>MIT</span>
                    <span className="text-blue-500/30">●</span>
                    <span>Oxford</span>
                    <span className="text-blue-500/30">●</span>
                    <span>Cambridge</span>
                    <span className="text-blue-500/30">●</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Reverse Marquee */}
            <div className="flex whitespace-nowrap">
              <motion.div
                animate={{ x: [-1000, 0] }}
                transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                className="flex gap-12 items-center text-4xl md:text-5xl font-black text-zinc-200 dark:text-zinc-800 uppercase italic tracking-tighter select-none"
              >
                {Array(10).fill(0).map((_, i) => (
                  <div key={i} className="flex gap-12">
                    <span>ETH Zurich</span>
                    <span className="text-purple-500/30">●</span>
                    <span>Berkeley</span>
                    <span className="text-purple-500/30">●</span>
                    <span>UCL London</span>
                    <span className="text-purple-500/30">●</span>
                    <span>Yale</span>
                    <span className="text-purple-500/30">●</span>
                    <span>Princeton</span>
                    <span className="text-purple-500/30">●</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer data-gsap-panel className="pt-32 pb-16 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
              <div className="col-span-1 md:col-span-1 space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Zap className="text-white fill-white" size={16} />
                  </div>
                  <span className="font-black text-xl tracking-tighter">Swipr</span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                  Revolutionizing how the world learns, one 60-second bite at a time. Designed for the modern attention span.
                </p>
                <div className="flex gap-4">
                  {[
                    { id: 'twitter', icon: <Twitter size={18} /> },
                    { id: 'github', icon: <Github size={18} /> },
                    { id: 'discord', icon: <MessageCircle size={18} /> }
                  ].map((social) => (
                    <div key={social.id} className="w-10 h-10 rounded-full bg-zinc-200/50 dark:bg-zinc-800/50 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all cursor-pointer">
                      {social.icon}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="font-black uppercase tracking-widest text-sm">Product</h4>
                <ul className="space-y-4 text-zinc-500 dark:text-zinc-400 font-bold">
                  <li><a href="#" className="hover:text-blue-600 transition-colors">AI Generator</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Micro-Feed</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Study Planner</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Flashcards</a></li>
                </ul>
              </div>

              <div className="space-y-6">
                <h4 className="font-black uppercase tracking-widest text-sm">Company</h4>
                <ul className="space-y-4 text-zinc-500 dark:text-zinc-400 font-bold">
                  <li><a href="#" className="hover:text-blue-600 transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Press Kit</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Contact</a></li>
                </ul>
              </div>

              <div className="space-y-6">
                <h4 className="font-black uppercase tracking-widest text-sm">Legal</h4>
                <ul className="space-y-4 text-zinc-500 dark:text-zinc-400 font-bold">
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Cookie Policy</a></li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-zinc-100 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-zinc-400 text-sm font-bold tracking-tight">
                © 2026 Swipr AI Inc. All rights reserved.
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">All systems operational</span>
              </div>
            </div>
          </div>
        </footer>
      </motion.div>

      {/* Loading Overlay */}
      <AnimatePresence mode="wait">
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-center space-y-6 p-8 rounded-3xl bg-zinc-900/50 border border-white/10"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
                <Loader2 className="text-white animate-spin" size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-white">AI is reading your PDF...</h2>
                <p className="text-zinc-400 font-medium">Generating bite-sized micro-lessons</p>
              </div>
              <div className="flex gap-2 justify-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2 h-2 rounded-full bg-blue-500"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed Overlay */}
      <AnimatePresence>
        {showFeed && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="fixed inset-0 z-[60] flex items-center justify-center"
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => { setShowFeed(false); setUploadedLessons(null); }}
            />
            <div className="w-full h-full md:w-[500px] md:h-[95%] relative z-10 flex flex-col justify-center">
              <TikTokFeed initialLessons={uploadedLessons || undefined} />
              <button
                onClick={() => { setShowFeed(false); setUploadedLessons(null); }}
                className="absolute top-4 right-4 md:-right-16 md:top-8 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/10"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
