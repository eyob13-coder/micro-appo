"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Zap, Brain, Rocket, Upload, ChevronRight, CheckCircle2, Twitter, Github, MessageCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { TikTokFeed } from '@/components/tiktok-feed';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
// @ts-ignore
import Autoplay from "embla-carousel-autoplay";

const LandingPage = () => {
  const [showFeed, setShowFeed] = useState(false);

  if (showFeed) {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="fixed top-6 left-6 right-6 flex justify-between items-center z-50">
          <button 
            onClick={() => setShowFeed(false)}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            ← Back Home
          </button>
          <ThemeToggle />
        </div>
        <TikTokFeed />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-blue-100 dark:selection:bg-blue-900">
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
              <span className="font-black text-2xl tracking-tighter">MicroLearn</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              {[
                { name: 'Method', href: '#method' },
                { name: 'Features', href: '#features' },
                { name: 'Testimonials', href: '#testimonials' }
              ].map((item) => (
                <a key={item.name} href={item.href} className="text-sm font-bold text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-widest">
                  {item.name}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button 
                onClick={() => window.location.href = '/auth'}
                className="hidden sm:block text-sm font-black px-6 py-2.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:scale-105 transition-transform active:scale-95 shadow-md shadow-zinc-500/10"
              >
                GET STARTED
              </button>
            </div>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 45, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-400/20 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [0, -45, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-400/20 rounded-full blur-[120px]"
          />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8 text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
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
              Don&apos;t Study. <br />
              <span className="italic font-serif font-light text-blue-600 dark:text-blue-400">Consume</span> Wisdom.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed font-medium"
            >
              The world&apos;s first TikTok-style study app. Turn your boring lectures and PDFs into addictive, bite-sized micro-lessons.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
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
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf';
                  input.onchange = async (e: any) => {
                    const file = e.target.files[0];
                    if (file) {
                      const formData = new FormData();
                      formData.append('file', file);
                      setShowFeed(true);
                      await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                      });
                    }
                  };
                  input.click();
                }}
                className="w-full sm:w-auto flex items-center gap-3 px-8 py-5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 font-bold text-lg bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:border-blue-500 transition-colors cursor-pointer group"
              >
                <Upload size={22} className="text-zinc-400 group-hover:text-blue-500 transition-colors" />
                <span>Upload PDF</span>
              </div>
            </motion.div>
          </div>

          <motion.div
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
                    img: "/hero-1.jpg", 
                    title: "Quantum Physics Explained", 
                    subtitle: "4 slides to mastery" 
                  },
                  { 
                    img: "/hero-2.jpg", 
                    title: "Neuroscience Basics", 
                    subtitle: "Learn while you scroll" 
                  },
                  { 
                    img: "/hero-3.jpg", 
                    title: "Global Economics", 
                    subtitle: "Bite-sized macro insights" 
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
                        <span className="font-bold text-sm">MicroLearn AI</span>
                      </div>
                      <h3 className="text-2xl font-bold">{slide.title}</h3>
                      <p className="text-zinc-200 text-sm font-medium">{slide.subtitle}</p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            
            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -left-10 p-6 rounded-3xl bg-white dark:bg-zinc-800 shadow-2xl border border-zinc-100 dark:border-zinc-700 z-20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Daily Goal</p>
                  <p className="font-black text-zinc-900 dark:text-white">Reached! 🔥</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Method Section */}
      <section id="method" className="py-32 bg-zinc-50 dark:bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
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
      <section id="features" className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Engineered for Focus</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">We didn&apos;t just build an app; we built a new way to interact with information.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="text-blue-500" />,
                title: "AI Snippets",
                desc: "Dense textbooks broken down into atomic, digestible facts. No filler, just pure knowledge.",
                gradient: "from-blue-500/20 to-transparent"
              },
              {
                icon: <Zap className="text-amber-500" />,
                title: "Infinite Scroll",
                desc: "Learn through a familiar TikTok-style interface optimized for dopamine-driven retention.",
                gradient: "from-amber-500/20 to-transparent"
              },
              {
                icon: <Rocket className="text-emerald-500" />,
                title: "Active Recall",
                desc: "Embedded MCQs every few slides to solidify your memory using neural-spaced repetition.",
                gradient: "from-emerald-500/20 to-transparent"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="group p-8 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative z-10 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-700 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold">{feature.title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-lg">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-32 bg-white dark:bg-zinc-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-20 text-center space-y-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tighter"
          >
            Loved by <span className="text-blue-600 dark:text-blue-400">Thousands</span> of Scholars.
          </motion.h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xl font-medium max-w-2xl mx-auto">
            See how MicroLearn is changing the game for students around the world.
          </p>
        </div>

        <div className="space-y-12">
          {/* First Row - Forward */}
          <div className="flex whitespace-nowrap overflow-hidden">
            <style jsx>{`
              @keyframes scroll-forward {
                from { transform: translateX(0); }
                to { transform: translateX(-1500px); }
              }
              .animate-scroll-forward {
                animation: scroll-forward 40s linear infinite;
              }
              .pause-on-hover:hover {
                animation-play-state: paused !important;
              }
            `}</style>
            <div className="flex gap-8 px-4 animate-scroll-forward pause-on-hover">
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
            <style jsx>{`
              @keyframes scroll-reverse {
                from { transform: translateX(-1500px); }
                to { transform: translateX(0); }
              }
              .animate-scroll-reverse {
                animation: scroll-reverse 45s linear infinite;
              }
              .pause-on-hover:hover {
                animation-play-state: paused !important;
              }
            `}</style>
            <div className="flex gap-8 px-4 animate-scroll-reverse pause-on-hover">
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
      <section className="py-20 border-y border-zinc-100 dark:border-zinc-900 overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/50">
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
      <footer className="pt-32 pb-16 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-1 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Zap className="text-white fill-white" size={16} />
                </div>
                <span className="font-black text-xl tracking-tighter">MicroLearn</span>
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
              © 2026 MicroLearn AI Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-zinc-400">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
