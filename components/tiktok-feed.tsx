"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useEffect } from "react";
import { Brain, CheckCircle2, ChevronDown, ChevronUp, Heart, Share2, Bookmark, MessageCircle } from "lucide-react";
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
    videoUrl: "https://www.youtube.com/embed/URUJD5NEXC8?autoplay=1&mute=1&controls=0&loop=1",
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

export const TikTokFeed = ({ initialLessons }: { initialLessons?: MicroLesson[] }) => {
  const [lessons, setLessons] = useState<MicroLesson[]>(initialLessons || []);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(!initialLessons);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();

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
        // Append new lessons (ensure unique IDs if possible, but for now just append)
        if (Array.isArray(newLessons) && newLessons.length > 0) {
          setLessons(prev => [...prev, ...newLessons]);
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
          // Fallback to mock data if API is not yet implemented
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

  const next = () => {
    setIndex((i) => Math.min(i + 1, lessons.length - 1));
    setSelectedOption(null);
  };
  const prev = () => {
    setIndex((i) => Math.max(i - 1, 0));
    setSelectedOption(null);
  };

  if (loading) return <div className="text-white flex items-center justify-center h-full">Loading lessons...</div>;
  if (lessons.length === 0) return <div className="text-white flex items-center justify-center h-full">No lessons found.</div>;

  const lesson = lessons[index];

  // Show loading state if we ran out of lessons but are fetching more
  if (!lesson && loadingMore) {
    return <div className="text-white flex items-center justify-center h-full">Generating more lessons...</div>;
  }

  if (!lesson) return null;

  return (
    <div className="relative w-full h-full md:h-auto md:aspect-[9/16] max-h-[85vh] w-full max-w-md mx-auto overflow-hidden rounded-[2.5rem] border border-white/20 bg-zinc-950 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex flex-col">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-500/10 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-500/10 rounded-full blur-[100px]"
        />
      </div>

      <div className="flex-1 flex relative z-10">
        {/* Content Area */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="absolute inset-0 flex flex-col justify-center items-center text-center p-8"
            >
              {lesson.type === 'video' ? (
                <div className="absolute inset-0 bg-black">
                  <iframe
                    className="w-full h-full object-cover opacity-80"
                    src={lesson.videoUrl}
                    title={lesson.content}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                  <div className="absolute bottom-12 left-0 right-0 p-8 text-left">
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="inline-block px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold mb-3 uppercase tracking-widest"
                    >
                      Featured Video
                    </motion.span>
                    <p className="text-white font-black text-2xl leading-tight drop-shadow-2xl">{lesson.content}</p>
                  </div>
                </div>
              ) : lesson.type === 'summary' ? (
                <div className="space-y-8 max-w-sm">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20"
                  >
                    <Brain className="text-white" size={40} />
                  </motion.div>
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black tracking-tight text-white leading-tight">
                      {lesson.content}
                    </h2>
                    <div className="w-12 h-1.5 bg-blue-500 rounded-full mx-auto opacity-50" />
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-8">
                  <div className="space-y-3">
                    <span className="text-blue-500 font-black text-xs uppercase tracking-[0.2em]">Knowledge Check</span>
                    <h2 className="text-2xl font-black text-white leading-tight">{lesson.content}</h2>
                  </div>
                  <div className="grid gap-3 w-full">
                    {lesson.options?.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedOption(i)}
                        className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 text-left font-bold ${selectedOption === i
                          ? i === lesson.correctAnswer
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                            : "bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                          : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-zinc-400 hover:text-white"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">{option}</span>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedOption === i
                            ? i === lesson.correctAnswer ? "border-emerald-500 bg-emerald-500" : "border-red-500 bg-red-500"
                            : "border-white/20"
                            }`}>
                            {selectedOption === i && (
                              <CheckCircle2 size={14} className="text-white" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Explanation Section */}
                  <AnimatePresence>
                    {selectedOption !== null && lesson.explanation && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-2xl bg-white/5 border border-white/10 text-left"
                      >
                        <p className="text-xs font-black uppercase tracking-widest text-blue-400 mb-2">Deep Dive</p>
                        <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                          {lesson.explanation}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Progress Bar */}
          <div className="absolute top-8 left-8 right-8 flex gap-2 z-20">
            {lessons.map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: i <= index ? "100%" : "0%" }}
                  className={`h-full ${i === index ? "bg-blue-500" : "bg-white/40"}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="w-20 flex flex-col items-center justify-end gap-6 py-12 z-30">
          <button
            onClick={async () => {
              const newStatus = !liked;
              setLiked(newStatus);
              try {
                const res = await fetch('/api/interact', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ lessonId: lesson.id, type: 'like' })
                });
                if (res.status === 401) router.push('/auth');
              } catch (e) { setLiked(!newStatus); }
            }}
            className="flex flex-col items-center gap-1.5 group"
          >
            <motion.div
              whileTap={{ scale: 0.8 }}
              className={`p-3.5 rounded-full backdrop-blur-md transition-all ${liked ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/5 text-white/70 hover:bg-white/10"}`}
            >
              <Heart size={26} className={liked ? "fill-current" : ""} />
            </motion.div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/70">Like</span>
          </button>

          <button className="flex flex-col items-center gap-1.5 group">
            <div className="p-3.5 rounded-full bg-white/5 text-white/70 backdrop-blur-md hover:bg-white/10 transition-all">
              <MessageCircle size={26} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/70">Ask</span>
          </button>

          <button
            onClick={async () => {
              const newStatus = !saved;
              setSaved(newStatus);
              try {
                const res = await fetch('/api/interact', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ lessonId: lesson.id, type: 'save' })
                });
                if (res.status === 401) router.push('/auth');
              } catch (e) { setSaved(!newStatus); }
            }}
            className="flex flex-col items-center gap-1.5 group"
          >
            <motion.div
              whileTap={{ scale: 0.8 }}
              className={`p-3.5 rounded-full backdrop-blur-md transition-all ${saved ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-white/5 text-white/70 hover:bg-white/10"}`}
            >
              <Bookmark size={26} className={saved ? "fill-current" : ""} />
            </motion.div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/70">Save</span>
          </button>

          <button
            onClick={() => {
              const text = `Check out this lesson: ${lesson.content}`;
              if (navigator.share) {
                navigator.share({ title: 'Micro Lesson', text, url: window.location.href });
              } else {
                navigator.clipboard.writeText(text);
                alert('Copied link to clipboard!');
              }
            }}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="p-3.5 rounded-full bg-white/5 text-white/70 backdrop-blur-md hover:bg-white/10 transition-all">
              <Share2 size={26} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/70">Share</span>
          </button>

          <div className="w-10 h-px bg-white/10 my-2" />

          <div className="flex flex-col gap-3">
            <button
              onClick={prev}
              disabled={index === 0}
              className="p-3 rounded-2xl bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-20 transition-all"
            >
              <ChevronUp size={24} />
            </button>
            <button
              onClick={next}
              disabled={index === lessons.length - 1}
              className="p-3 rounded-2xl bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-20 transition-all"
            >
              <ChevronDown size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
