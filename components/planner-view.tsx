"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  PauseCircle,
  Plus,
  Sparkles,
  Target,
  Timer,
  Zap,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils";

const FOCUS_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type FocusDay = (typeof FOCUS_DAYS)[number];

type StudyPlan = {
  id: string;
  title: string;
  timezone: string;
  weeklyTargetMinutes: number;
  focusDays: string[];
  startDate: string;
  endDate: string | null;
  status: string;
};

type StudyTask = {
  id: string;
  planId: string;
  title: string;
  topic: string | null;
  notes: string | null;
  estimatedMinutes: number | null;
  dueDate: string | null;
  priority: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
};

type StudySession = {
  id: string;
  planId: string;
  taskId: string | null;
  title: string;
  topic: string | null;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  status: string;
  energy: string | null;
  notes: string | null;
  completedAt: string | null;
};

type PlannerViewProps = {
  user: {
    name?: string | null;
    image?: string | null;
  };
  initialPlan: StudyPlan | null;
  initialTasks: StudyTask[];
  initialSessions: StudySession[];
};

const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatDateInput = (date: Date) => toDateKey(date);

const formatDateTimeInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatTime = (value: string) => {
  const date = new Date(value);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

export const PlannerView = ({ user, initialPlan, initialTasks, initialSessions }: PlannerViewProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const firstName = user.name?.trim().split(/\s+/)[0] || "User";

  const [plan, setPlan] = useState<StudyPlan | null>(initialPlan);
  const [tasks, setTasks] = useState<StudyTask[]>(initialTasks);
  const [sessions, setSessions] = useState<StudySession[]>(initialSessions);

  const [planTitle, setPlanTitle] = useState(initialPlan?.title ?? "Spring Momentum Plan");
  const [planWeeklyMinutes, setPlanWeeklyMinutes] = useState(initialPlan?.weeklyTargetMinutes ?? 420);
  const [planStartDate, setPlanStartDate] = useState(() => {
    if (initialPlan?.startDate) return initialPlan.startDate.slice(0, 10);
    return formatDateInput(new Date());
  });
  const [planEndDate, setPlanEndDate] = useState(() => initialPlan?.endDate?.slice(0, 10) ?? "");
  const [planFocusDays, setPlanFocusDays] = useState<FocusDay[]>(() => {
    if (initialPlan?.focusDays?.length) {
      return initialPlan.focusDays.filter((day): day is FocusDay => (FOCUS_DAYS as readonly string[]).includes(day));
    }
    return ["Mon", "Tue", "Wed", "Thu", "Fri"];
  });
  const [planTimezone, setPlanTimezone] = useState(initialPlan?.timezone ?? "UTC");
  const [isEditingPlan, setIsEditingPlan] = useState(!initialPlan);
  const [planBusy, setPlanBusy] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskTopic, setTaskTopic] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskEstimate, setTaskEstimate] = useState("");
  const [taskPriority, setTaskPriority] = useState("2");
  const [taskBusy, setTaskBusy] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionTopic, setSessionTopic] = useState("");
  const [sessionStart, setSessionStart] = useState(() => formatDateTimeInput(new Date(Date.now() + 60 * 60 * 1000)));
  const [sessionDuration, setSessionDuration] = useState("45");
  const [sessionTaskId, setSessionTaskId] = useState<string>("");
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const planLocked = !plan;

  useLayoutEffect(() => {
    if (!rootRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.from("[data-planner-hero]", {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.utils.toArray<HTMLElement>("[data-planner-section]").forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top 82%",
          onEnter: () => {
            gsap.fromTo(
              section,
              { opacity: 0, y: 40 },
              { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", overwrite: "auto" }
            );
          },
        });
      });

      gsap.to("[data-orb-a]", {
        y: -16,
        x: 10,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to("[data-orb-b]", {
        y: 12,
        x: -12,
        duration: 7.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (plan) return;
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setPlanTimezone(detected);
    } catch {
      // Ignore timezone detection failures.
    }
  }, [plan]);

  const stats = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);

    const plannedMinutes = sessions
      .filter((session) => {
        const start = new Date(session.startAt);
        return start >= now && start <= weekEnd && session.status !== "skipped";
      })
      .reduce((sum, session) => sum + session.durationMinutes, 0);

    const completedMinutes = sessions
      .filter((session) => {
        const start = new Date(session.startAt);
        return session.status === "completed" && start >= weekStart && start <= now;
      })
      .reduce((sum, session) => sum + session.durationMinutes, 0);

    const dueSoon = tasks.filter((task) => {
      if (!task.dueDate || task.status === "completed") return false;
      const due = new Date(task.dueDate);
      return due >= now && due <= weekEnd;
    }).length;

    const backlog = tasks.filter((task) => task.status === "backlog").length;

    const completedDays = new Set(
      sessions
        .filter((session) => session.status === "completed")
        .map((session) => toDateKey(new Date(session.startAt)))
    );

    let streak = 0;
    for (let i = 0; i < 30; i += 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      if (completedDays.has(toDateKey(date))) {
        streak += 1;
      } else {
        break;
      }
    }

    const nextSession = sessions
      .filter((session) => session.status === "scheduled" && new Date(session.startAt) >= now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];

    return {
      plannedMinutes,
      completedMinutes,
      dueSoon,
      backlog,
      streak,
      nextSession,
    };
  }, [sessions, tasks]);

  const sessionsByDay = useMemo(() => {
    const grouped = new Map<string, StudySession[]>();
    const sorted = [...sessions].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    for (const session of sorted) {
      const key = toDateKey(new Date(session.startAt));
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)?.push(session);
    }

    return grouped;
  }, [sessions]);

  const handleToggleFocusDay = (day: FocusDay) => {
    setPlanFocusDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((item) => item !== day);
      }
      return [...prev, day];
    });
  };

  const handleSavePlan = async () => {
    setPlanBusy(true);
    setPlanError(null);

    try {
      const payload = {
        title: planTitle.trim(),
        timezone: planTimezone,
        weeklyTargetMinutes: Number(planWeeklyMinutes),
        focusDays: planFocusDays,
        startDate: new Date(planStartDate).toISOString(),
        endDate: planEndDate ? new Date(planEndDate).toISOString() : null,
      };

      const response = await fetch("/api/planner", {
        method: plan ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan ? { id: plan.id, ...payload } : payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save plan");
      }

      const nextPlan = result.plan ?? result;
      setPlan(nextPlan);
      if (nextPlan) {
        setPlanTitle(nextPlan.title ?? planTitle);
        setPlanWeeklyMinutes(nextPlan.weeklyTargetMinutes ?? planWeeklyMinutes);
        setPlanStartDate(nextPlan.startDate ? nextPlan.startDate.slice(0, 10) : planStartDate);
        setPlanEndDate(nextPlan.endDate ? nextPlan.endDate.slice(0, 10) : "");
        const normalizedFocusDays = Array.isArray(nextPlan.focusDays)
          ? nextPlan.focusDays.filter((day: string): day is FocusDay => (FOCUS_DAYS as readonly string[]).includes(day))
          : planFocusDays;
        setPlanFocusDays(normalizedFocusDays.length > 0 ? normalizedFocusDays : planFocusDays);
        setPlanTimezone(nextPlan.timezone ?? planTimezone);
      }
      setIsEditingPlan(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save plan";
      setPlanError(message);
    } finally {
      setPlanBusy(false);
    }
  };

  const handleCreateTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    if (!plan) {
      setTaskError("Create a plan before adding tasks.");
      return;
    }

    setTaskBusy(true);
    setTaskError(null);

    try {
      const payload = {
        title: taskTitle.trim(),
        topic: taskTopic.trim() || undefined,
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
        estimatedMinutes: taskEstimate ? Number(taskEstimate) : undefined,
        priority: Number(taskPriority),
      };

      const response = await fetch("/api/planner/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to add task");
      }

      setTasks((prev) => [result.task, ...prev]);
      setTaskTitle("");
      setTaskTopic("");
      setTaskDueDate("");
      setTaskEstimate("");
      setTaskPriority("2");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add task";
      setTaskError(message);
    } finally {
      setTaskBusy(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      const response = await fetch("/api/planner/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update task");
      }

      setTasks((prev) => prev.map((task) => (task.id === taskId ? result.task : task)));
    } catch (error) {
      console.warn("Task update failed", error);
    }
  };

  const handleCreateSession = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sessionTitle.trim()) return;
    if (!plan) {
      setSessionError("Create a plan before scheduling sessions.");
      return;
    }

    setSessionBusy(true);
    setSessionError(null);

    try {
      const payload = {
        title: sessionTitle.trim(),
        topic: sessionTopic.trim() || undefined,
        startAt: new Date(sessionStart).toISOString(),
        durationMinutes: Number(sessionDuration),
        taskId: sessionTaskId || undefined,
      };

      const response = await fetch("/api/planner/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to add session");
      }

      setSessions((prev) => [...prev, result.session].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()));
      setSessionTitle("");
      setSessionTopic("");
      setSessionDuration("45");
      setSessionTaskId("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add session";
      setSessionError(message);
    } finally {
      setSessionBusy(false);
    }
  };

  const handleUpdateSessionStatus = async (sessionId: string, status: string) => {
    try {
      const response = await fetch("/api/planner/sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId, status }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update session");
      }

      setSessions((prev) => prev.map((session) => (session.id === sessionId ? result.session : session)));
    } catch (error) {
      console.warn("Session update failed", error);
    }
  };

  return (
    <div ref={rootRef} className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <nav className="sticky top-0 z-40 border-b border-zinc-200/60 bg-white/80 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden">
                <img src="/swipr-logo.png" alt="Swipr" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-black tracking-tight group-hover:text-blue-500 transition-colors">Swipr</span>
            </Link>
            <div className="hidden items-center gap-2 rounded-full border border-zinc-200/70 bg-zinc-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:text-zinc-400 md:flex">
              Study Planner
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-zinc-200/70 bg-zinc-50 px-2 py-1 dark:border-zinc-800/70 dark:bg-zinc-900/60 sm:flex">
              {user.image ? (
                <img src={user.image} alt={user.name || ""} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-black text-white">
                  {(user.name || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{firstName}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl space-y-10 px-6 py-8">
        <section
          data-planner-hero
          className="relative overflow-hidden rounded-3xl border border-blue-100 bg-[linear-gradient(120deg,#ecfeff_0%,#eef2ff_45%,#fef3c7_100%)] p-8 shadow-[0_24px_64px_-40px_rgba(15,23,42,0.3)] dark:border-blue-500/10 dark:bg-[linear-gradient(120deg,#0f172a_0%,#111827_55%,#312e81_100%)]"
        >
          <div data-orb-a className="absolute right-0 top-0 h-64 w-64 rounded-full bg-cyan-200/40 blur-[110px] dark:bg-blue-500/10" />
          <div data-orb-b className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-amber-200/40 blur-[100px] dark:bg-indigo-500/10" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/20 dark:bg-zinc-900/70 dark:text-blue-300">
                <Sparkles size={14} />
                2026 Study OS
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white md:text-4xl">
                  {plan ? plan.title : "Launch Your Study System"}
                </h1>
                <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400 md:text-lg">
                  Orchestrate focus blocks, task pipelines, and session velocity in one place.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white/70 px-5 py-3 text-sm font-bold text-zinc-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300"
              >
                <Layers size={16} />
                Dashboard
              </Link>
              <button
                onClick={() => setIsEditingPlan((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500"
              >
                <Target size={16} />
                {plan ? (isEditingPlan ? "Close Plan Editor" : "Tune Plan") : "Create Plan"}
              </button>
            </div>
          </div>
        </section>

        <section data-planner-section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Weekly Target</span>
              <Target size={18} className="text-blue-600" />
            </div>
            <p className="mt-3 text-2xl font-black text-zinc-900 dark:text-white">
              {formatMinutes(plan?.weeklyTargetMinutes ?? 420)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">Focus days: {planFocusDays.join(", ")}</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Planned This Week</span>
              <Calendar size={18} className="text-indigo-600" />
            </div>
            <p className="mt-3 text-2xl font-black text-zinc-900 dark:text-white">{formatMinutes(stats.plannedMinutes)}</p>
            <p className="mt-1 text-xs text-zinc-500">Backlog: {stats.backlog} tasks</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Completed (7d)</span>
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <p className="mt-3 text-2xl font-black text-zinc-900 dark:text-white">{formatMinutes(stats.completedMinutes)}</p>
            <p className="mt-1 text-xs text-zinc-500">Due soon: {stats.dueSoon}</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Streak</span>
              <Flame size={18} className="text-amber-500" />
            </div>
            <p className="mt-3 text-2xl font-black text-zinc-900 dark:text-white">{stats.streak} days</p>
            <p className="mt-1 text-xs text-zinc-500">
              Next: {stats.nextSession ? formatDateLabel(new Date(stats.nextSession.startAt)) : "Schedule a session"}
            </p>
          </div>
        </section>

        {isEditingPlan && (
          <section data-planner-section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm dark:border-blue-500/10 dark:bg-zinc-900/60">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-zinc-900 dark:text-white">Plan Setup</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Define your weekly rhythm and focus days.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                  <Timer size={14} />
                  {plan ? "Active" : "Draft"}
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Plan Title</label>
                  <input
                    value={planTitle}
                    onChange={(event) => setPlanTitle(event.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Weekly Target (minutes)</label>
                  <input
                    type="number"
                    min={60}
                    max={3000}
                    value={planWeeklyMinutes}
                    onChange={(event) => setPlanWeeklyMinutes(Number(event.target.value))}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Focus Days</label>
                  <div className="flex flex-wrap gap-2">
                    {FOCUS_DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleFocusDay(day)}
                        className={cn(
                          "rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] transition",
                          planFocusDays.includes(day)
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-zinc-200 bg-white text-zinc-500 hover:border-blue-300 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Start Date</label>
                    <input
                      type="date"
                      value={planStartDate}
                      onChange={(event) => setPlanStartDate(event.target.value)}
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">End Date (optional)</label>
                    <input
                      type="date"
                      value={planEndDate}
                      onChange={(event) => setPlanEndDate(event.target.value)}
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Timezone</label>
                  <input
                    value={planTimezone}
                    onChange={(event) => setPlanTimezone(event.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>

                {planError && <p className="text-sm font-semibold text-red-500">{planError}</p>}

                <button
                  onClick={handleSavePlan}
                  disabled={planBusy || planFocusDays.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500 disabled:opacity-60"
                >
                  <Target size={16} />
                  {plan ? "Update Plan" : "Launch Plan"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">Plan Snapshot</h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Keep this card visible during weekly reviews.
              </p>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Timezone</span>
                    <span className="font-semibold">{planTimezone}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Active Range</span>
                    <span className="font-semibold">
                      {planStartDate} {planEndDate ? `→ ${planEndDate}` : "→ ongoing"}
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Next Session</span>
                    <span className="font-semibold">
                      {stats.nextSession ? formatDateLabel(new Date(stats.nextSession.startAt)) : "None"}
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
                  Keep your backlog under 12 tasks for maximum momentum.
                </div>
              </div>
            </div>
          </section>
        )}

        <section data-planner-section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-white">New Task</h2>
                <p className="text-sm text-zinc-500">Break work into focused, shippable units.</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Plus size={18} />
              </div>
            </div>

            <form onSubmit={handleCreateTask} className="mt-6 space-y-4">
              <input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Ex: Master probability distributions"
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <input
                value={taskTopic}
                onChange={(event) => setTaskTopic(event.target.value)}
                placeholder="Topic or course tag"
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(event) => setTaskDueDate(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
                <input
                  type="number"
                  min={10}
                  max={600}
                  value={taskEstimate}
                  onChange={(event) => setTaskEstimate(event.target.value)}
                  placeholder="Minutes"
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
              <select
                value={taskPriority}
                onChange={(event) => setTaskPriority(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="1">Priority 1 - High</option>
                <option value="2">Priority 2 - Medium</option>
                <option value="3">Priority 3 - Low</option>
              </select>
              {!plan && <p className="text-xs font-semibold text-amber-500">Create a plan to unlock tasks.</p>}
              {taskError && <p className="text-sm font-semibold text-red-500">{taskError}</p>}
              <button
                type="submit"
                disabled={taskBusy || planLocked}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500 disabled:opacity-60"
              >
                <Plus size={16} />
                Add Task
              </button>
            </form>
          </div>

          <div className="lg:col-span-3 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-white">Task Pipeline</h2>
                <p className="text-sm text-zinc-500">Move tasks into sessions or close them out.</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60">
                {tasks.length} total
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40">
                  No tasks yet. Create one to start shaping your week.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-blue-200 dark:border-zinc-800 dark:bg-zinc-950/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{task.title}</p>
                        <p className="text-xs text-zinc-500">
                          {task.topic ? `${task.topic} • ` : ""}Priority {task.priority}
                          {task.dueDate ? ` • Due ${new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]",
                          task.status === "completed"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : task.status === "in_progress"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400"
                        )}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, "in_progress")}
                        className="rounded-full border border-blue-200 px-3 py-1 text-xs font-bold text-blue-600 transition hover:border-blue-400 hover:text-blue-700 dark:border-blue-500/30 dark:text-blue-300"
                      >
                        Start
                      </button>
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, "scheduled")}
                        className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-bold text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                      >
                        Schedule
                      </button>
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, "completed")}
                        className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section data-planner-section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-white">Schedule Session</h2>
                <p className="text-sm text-zinc-500">Lock in deep focus blocks.</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Clock size={18} />
              </div>
            </div>

            <form onSubmit={handleCreateSession} className="mt-6 space-y-4">
              <input
                value={sessionTitle}
                onChange={(event) => setSessionTitle(event.target.value)}
                placeholder="Ex: Calculus review sprint"
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <input
                value={sessionTopic}
                onChange={(event) => setSessionTopic(event.target.value)}
                placeholder="Topic or goal"
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <input
                type="datetime-local"
                value={sessionStart}
                onChange={(event) => setSessionStart(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <input
                type="number"
                min={15}
                max={480}
                value={sessionDuration}
                onChange={(event) => setSessionDuration(event.target.value)}
                placeholder="Duration (minutes)"
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <select
                value={sessionTaskId}
                onChange={(event) => setSessionTaskId(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="">Link to task (optional)</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
              {!plan && <p className="text-xs font-semibold text-amber-500">Create a plan to start scheduling.</p>}
              {sessionError && <p className="text-sm font-semibold text-red-500">{sessionError}</p>}
              <button
                type="submit"
                disabled={sessionBusy || planLocked}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500 disabled:opacity-60"
              >
                <Clock size={16} />
                Schedule Session
              </button>
            </form>
          </div>

          <div className="lg:col-span-3 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-white">Session Timeline</h2>
                <p className="text-sm text-zinc-500">Run the day like a studio schedule.</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60">
                {sessions.length} sessions
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {sessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40">
                  No sessions scheduled yet. Lock in your first focus block.
                </div>
              ) : (
                Array.from(sessionsByDay.entries()).map(([day, daySessions]) => {
                  const dayDate = new Date(day + "T00:00:00");
                  return (
                    <div key={day} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">
                          {formatDateLabel(dayDate)}
                        </h3>
                        <span className="text-xs text-zinc-400">{daySessions.length} sessions</span>
                      </div>
                      {daySessions.map((sessionItem) => (
                        <div
                          key={sessionItem.id}
                          className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 dark:border-zinc-800 dark:bg-zinc-950/40"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-zinc-900 dark:text-white">{sessionItem.title}</p>
                              <p className="text-xs text-zinc-500">
                                {formatTime(sessionItem.startAt)} • {formatMinutes(sessionItem.durationMinutes)}
                                {sessionItem.topic ? ` • ${sessionItem.topic}` : ""}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]",
                                sessionItem.status === "completed"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                  : sessionItem.status === "skipped"
                                    ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400"
                                    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                              )}
                            >
                              {sessionItem.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleUpdateSessionStatus(sessionItem.id, "completed")}
                              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300"
                            >
                              <CheckCircle2 size={12} />
                              Complete
                            </button>
                            <button
                              onClick={() => handleUpdateSessionStatus(sessionItem.id, "skipped")}
                              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-xs font-bold text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                            >
                              <PauseCircle size={12} />
                              Skip
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
