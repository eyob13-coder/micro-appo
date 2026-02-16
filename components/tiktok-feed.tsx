"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import type { TouchEvent } from "react";
import { Brain, CheckCircle2, ChevronDown, ChevronUp, Heart, Share2, Bookmark, MessageCircle, Play, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface MicroLesson {
  id: string;
  type: 'summary' | 'mcq' | 'video';
  content: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  videoUrl?: string;
}

const defaultMockLessons: MicroLesson[] = [
  {
    id: "1",
    type: "summary",
    content: "Dopamine isn't just about pleasure; it's about anticipation. When you learn in bite-sized chunks, your brain releases dopamine, making you want to continue.",
  },
  {
    id: "video-1",
    type: "video",
    content: "The Dopamine Loop in Learning",
    videoUrl: "https://www.youtube.com/embed/URUJD5NEXC8", // Already embed format for mock
  },
  {
    id: "2",
    type: "summary",
    content: "The Ebbinghaus Forgetting Curve shows we lose 70% of new info within 24 hours. Spaced repetition breaks this curve.",
  },
  {
    id: "3",
    type: "mcq",
    content: "According to the Forgetting Curve, how much information do we typically lose within 24 hours?",
    options: ["10%", "30%", "50%", "70%"],
    correctAnswer: 3,
    explanation: "Ebbinghaus discovered that memory decay is exponential. Without review, we lose about 70% of new material within the first day.",
  },
  {
    id: "4",
    type: "summary",
    content: "Active recall forces your brain to retrieve information from memory, strengthening neural pathways for long-term storage.",
  }
];

function getEmbedUrl(url: string | undefined): string {
  if (!url) return "";
  try {
    // Handle standard watch URLs: https://www.youtube.com/watch?v=VIDEO_ID
    if (url.includes("watch?v=")) {
      const videoId = url.split("watch?v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0`;
    }
    // Handle short URLs: https://youtu.be/VIDEO_ID
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0`;
    }
    // Handle existing embed URLs (just add params if missing)
    if (url.includes("youtube.com/embed/")) {
      if (!url.includes("?")) return `${url}?autoplay=0&controls=1&rel=0`;
      return url;
    }
    return url;
  } catch (e) {
    console.error("Failed to parse video URL:", url);
    return "";
  }
}

export const TikTokFeed = ({ initialLessons }: { initialLessons?: MicroLesson[] }) => {
  const [lessons, setLessons] = useState<MicroLesson[]>(initialLessons || []);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(!initialLessons);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatQue, setChatQue] = useState("");
  const [chatAnswer, setChatAnswer] = useState<{ q: string; a: string } | null>(null);
  const [asking, setAsking] = useState(false);

  const VideoRef = useRef<HTMLIFrameElement>(null);
  const viewedLessonIdsRef = useRef<Set<string>>(new Set());
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);
  const router = useRouter();

  const sendInteraction = async (
    lessonId: string,
    type: "like" | "save" | "view" | "skip" | "complete" | "mcq_correct" | "mcq_wrong",
    method: "POST" | "DELETE" = "POST"
  ) => {
    try {
      await fetch('/api/interact', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, type })
      });
    } catch (e) {
      // Keep UX smooth even if tracking fails.
      console.warn("Interaction tracking failed", e);
    }
  };

  useEffect(() => {
    // Trigger load more when user is 2 items away from end
    if (index >= lessons.length - 2 && !loadingMore && lessons.length > 0) {
      loadMoreLessons();
    }
  }, [index, lessons.length]);

  const loadMoreLessons = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch('/api/feed/more');
      if (res.ok) {
        const newLessons = await res.json();
        // Append new lessons (filter out duplicates based on ID just in case)
        if (Array.isArray(newLessons) && newLessons.length > 0) {
          setLessons(prev => {
            const existingIds = new Set(prev.map(l => l.id));
            const uniqueNew = newLessons.filter(l => !existingIds.has(l.id));
            return [...prev, ...uniqueNew];
          });
        }
      }
    } catch (err) {
      console.error("Failed to load more lessons", err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (initialLessons && initialLessons.length > 0) {
      setLessons(initialLessons);
      setLoading(false);
      return;
    }

    const fetchLessons = async () => {
      try {
        const response = await fetch('/api/feed');
        if (response.ok) {
          const data = await response.json();
          setLessons(data);
        } else {
          setLessons(defaultMockLessons);
        }
      } catch (error) {
        console.error("Failed to fetch lessons:", error);
        setLessons(defaultMockLessons);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [initialLessons]);

  useEffect(() => {
    const currentLesson = lessons[index];
    if (!currentLesson) return;

    if (!viewedLessonIdsRef.current.has(currentLesson.id)) {
      viewedLessonIdsRef.current.add(currentLesson.id);
      void sendInteraction(currentLesson.id, "view");
    }
  }, [index, lessons]);

  const next = () => {
    const currentLesson = lessons[index];
    if (currentLesson) {
      const isSkippedMcq = currentLesson.type === "mcq" && selectedOption === null;
      void sendInteraction(currentLesson.id, isSkippedMcq ? "skip" : "complete");
    }

    if (index < lessons.length - 1) {
      setIndex(i => i + 1);
      setSelectedOption(null);
      setLiked(false);
      setSaved(false);
      // Close chat on navigate
      setShowChat(false);
      setChatAnswer(null);
    }
  };

  const prev = () => {
    if (index > 0) {
      setIndex(i => i - 1);
      setSelectedOption(null);
      setLiked(false);
      setSaved(false);
      setShowChat(false);
      setChatAnswer(null);
    }
  };

  const handleAsk = async () => {
    if (!chatQue.trim() || asking) return;
    setAsking(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: chatQue, lessonContent: lessons[index].content })
      });
      const data = await res.json();
      if (data.answer) {
        setChatAnswer({ q: chatQue, a: data.answer });
        setChatQue("");
      }
    } catch (e) {
      console.error("Chat failed", e);
    } finally {
      setAsking(false);
    }
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (!touch) return;
    touchStartYRef.current = touch.clientY;
    touchStartTimeRef.current = Date.now();
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (!touch || touchStartYRef.current === null) return;

    const deltaY = touch.clientY - touchStartYRef.current;
    const elapsed = Math.max((Date.now() - (touchStartTimeRef.current ?? Date.now())) / 1000, 0.001);
    const velocityY = deltaY / elapsed;

    const swipeThreshold = 60;
    const velocityThreshold = 700;

    if (deltaY < -swipeThreshold || velocityY < -velocityThreshold) {
      next();
    } else if (deltaY > swipeThreshold || velocityY > velocityThreshold) {
      prev();
    }

    touchStartYRef.current = null;
    touchStartTimeRef.current = null;
  };

  if (loading) return <div className="text-white flex items-center justify-center h-full animate-pulse">Loading lessons...</div>;
  if (lessons.length === 0) return <div className="text-white flex items-center justify-center h-full">No lessons found.</div>;

  const lesson = lessons[index];

  // Show loading state if we ran out of lessons but are fetching more
  if (!lesson && loadingMore) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white space-y-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-zinc-400">Curating more content...</p>
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="relative w-full h-full md:h-[92vh] md:max-h-[940px] md:min-h-[760px] md:max-w-[900px] lg:max-w-[980px] mx-auto overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] flex flex-col">
      {/* Background with noise texture overlay for premium feel */}
      <div className="absolute inset-0 z-0 bg-zinc-950">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* CHAT OVERLAY */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute inset-0 z-50 bg-zinc-950/95 backdrop-blur-xl flex flex-col p-6 pt-12"
          >
            <button
              onClick={() => { setShowChat(false); setChatAnswer(null); }}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <MessageCircle className="text-blue-500" />
              Ask Tutor
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 custom-scrollbar">
              {chatAnswer ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-end">
                    <div className="bg-white/10 p-4 rounded-2xl rounded-tr-sm max-w-[85%]">
                      <p className="text-white/80 text-sm">{chatAnswer.q}</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl rounded-tl-sm max-w-[90%]">
                      <div className="flex items-center gap-2 mb-2 text-blue-400">
                        <Brain size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">AI Tutor</span>
                      </div>
                      <p className="text-white text-sm leading-relaxed">{chatAnswer.a}</p>
                    </div>
                  </div>
                  <div className="text-center pt-4">
                    <button
                      onClick={() => setChatAnswer(null)}
                      className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-4"
                    >
                      Ask another question
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/30 text-sm text-center px-8">
                  <Brain size={48} className="mb-4 opacity-20" />
                  <p>Ask a question about this lesson.</p>
                  <p className="text-xs mt-2 opacity-60">"What does this mean?" or "Give me an example"</p>
                </div>
              )}
            </div>

            {!chatAnswer && (
              <div className="relative mt-auto">
                <input
                  type="text"
                  value={chatQue}
                  onChange={(e) => setChatQue(e.target.value)}
                  placeholder="Type your question..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                  autoFocus
                />
                <button
                  onClick={handleAsk}
                  disabled={asking || !chatQue.trim()}
                  className="absolute right-2 top-2 p-1.5 rounded-lg bg-blue-500 text-white disabled:opacity-50 disabled:bg-white/10 hover:bg-blue-600 transition-colors"
                >
                  {asking ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex relative z-10 overflow-hidden">
        {/* Content Area */}
        <div
          className="flex-1 relative h-full"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: "pan-y" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, { offset, velocity }) => {
                const swipeThreshold = 50;
                const velocityThreshold = 500;
                if (offset.y < -swipeThreshold || velocity.y < -velocityThreshold) {
                  next();
                } else if (offset.y > swipeThreshold || velocity.y > velocityThreshold) {
                  prev();
                }
              }}
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 touch-none h-full"
            >
              {lesson.type === 'video' ? (
                <div className="absolute inset-0 bg-zinc-900 flex flex-col">
                  {/* Video Container - taking full height minus header/footer areas */}
                  <div className="relative flex-1 bg-black flex items-center justify-center">
                    {lesson.videoUrl && (
                      <iframe
                        ref={VideoRef}
                        className="w-full h-full object-cover"
                        src={getEmbedUrl(lesson.videoUrl)}
                        title={lesson.content}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent pointer-events-none" />
                  </div>

                  {/* Video Text Details */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 pointer-events-none">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <span className="inline-block px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest mb-3 border border-red-500/20 backdrop-blur-sm">
                        Watch & Learn
                      </span>
                      <h2 className="text-white font-bold text-2xl leading-tight drop-shadow-lg">
                        {lesson.content}
                      </h2>
                    </motion.div>
                  </div>
                </div>
              ) : lesson.type === 'summary' ? (
                <div className="space-y-8 max-w-sm relative z-10">
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30"
                  >
                    <Brain className="text-white" size={48} strokeWidth={1.5} />
                  </motion.div>
                  <div className="space-y-6">
                    <span className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                      Key Insight
                    </span>
                    <h2 className="text-3xl font-black tracking-tight text-white leading-tight">
                      {lesson.content}
                    </h2>
                    <div className="w-16 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto opacity-70" />
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-6 relative z-10 max-h-full overflow-y-auto py-4">
                  <div className="space-y-3">
                    <span className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em] bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      Knowledge Check
                    </span>
                    <h2 className="text-2xl font-black text-white leading-snug">{lesson.content}</h2>
                  </div>
                  <div className="grid gap-3 w-full">
                    {lesson.options?.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (selectedOption !== null) return;
                          setSelectedOption(i);
                          const outcome = i === lesson.correctAnswer ? "mcq_correct" : "mcq_wrong";
                          void sendInteraction(lesson.id, outcome);
                        }}
                        className={`group relative p-4 rounded-xl border-2 transition-all duration-200 text-left font-semibold text-sm ${selectedOption === i
                          ? i === lesson.correctAnswer
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                            : "bg-red-500/10 border-red-500 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                          : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-zinc-400 hover:text-white"
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-5 h-5 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center transition-colors ${selectedOption === i
                            ? i === lesson.correctAnswer ? "border-emerald-500 bg-emerald-500" : "border-red-500 bg-red-500"
                            : "border-white/20 group-hover:border-white/40"
                            }`}>
                            {selectedOption === i && <CheckCircle2 size={12} className="text-white" />}
                          </div>
                          <span className="flex-1 leading-relaxed">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Explanation Section */}
                  <AnimatePresence>
                    {selectedOption !== null && lesson.explanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-left">
                          <div className="flex items-center gap-2 mb-2 text-blue-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Feedback</span>
                          </div>
                          <p className="text-zinc-300 text-xs leading-relaxed font-medium">
                            {lesson.explanation}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Simple Progress Indicator */}
          <div className="absolute top-8 left-0 right-0 z-20 flex justify-center pointer-events-none">
            <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/5 shadow-xl">
              <span className="text-[10px] font-medium text-white/50 tracking-widest">
                LESSON <span className="text-white">{index + 1}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="w-16 flex flex-col items-center justify-end gap-6 py-8 z-30 mr-2">
          <button
            onClick={async () => {
              const newStatus = !liked;
              setLiked(newStatus);
              void sendInteraction(lesson.id, "like", newStatus ? "POST" : "DELETE");
            }}
            className="flex flex-col items-center gap-1.5 group"
          >
            <motion.div
              whileTap={{ scale: 0.8 }}
              className={`p-3 rounded-full backdrop-blur-md transition-all ${liked ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}
            >
              <Heart size={22} className={liked ? "fill-current" : ""} />
            </motion.div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 group-hover:text-white/50">Like</span>
          </button>

          <button
            onClick={() => setShowChat(true)}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="p-3 rounded-full bg-white/5 text-white/60 backdrop-blur-md hover:bg-white/10 hover:text-white transition-all">
              <MessageCircle size={22} className={showChat ? "text-blue-400" : ""} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 group-hover:text-white/50">Ask</span>
          </button>

          <button
            onClick={async () => {
              const newStatus = !saved;
              setSaved(newStatus);
              void sendInteraction(lesson.id, "save", newStatus ? "POST" : "DELETE");
            }}
            className="flex flex-col items-center gap-1.5 group"
          >
            <motion.div
              whileTap={{ scale: 0.8 }}
              className={`p-3 rounded-full backdrop-blur-md transition-all ${saved ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}
            >
              <Bookmark size={22} className={saved ? "fill-current" : ""} />
            </motion.div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 group-hover:text-white/50">Save</span>
          </button>

          <button
            onClick={() => {
              const text = `Check out this lesson: ${lesson.content}`;
              if (navigator.share) {
                navigator.share({ title: 'Micro Lesson', text, url: window.location.href });
              } else {
                navigator.clipboard.writeText(text);
              }
            }}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="p-3 rounded-full bg-white/5 text-white/60 backdrop-blur-md hover:bg-white/10 hover:text-white transition-all">
              <Share2 size={22} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 group-hover:text-white/50">Share</span>
          </button>

          <div className="w-8 h-px bg-white/10 my-1" />

          {/* Navigation Controls */}
          <div className="flex flex-col gap-2">
            <button
              onClick={prev}
              disabled={index === 0}
              className="p-2.5 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20 transition-all"
            >
              <ChevronUp size={20} />
            </button>
            <button
              onClick={next}
              disabled={index === lessons.length - 1 && !loadingMore}
              className="p-2.5 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20 transition-all"
            >
              <ChevronDown size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
