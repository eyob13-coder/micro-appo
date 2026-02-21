export type DefaultLesson = {
  id: string;
  type: "summary" | "mcq" | "video";
  content: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  videoUrl?: string;
};

export const DEFAULT_LESSONS: DefaultLesson[] = [
  {
    id: "1",
    type: "summary",
    content:
      "Dopamine isn't just about pleasure; it's about anticipation. When you learn in bite-sized chunks, your brain releases dopamine, making you want to continue.",
  },
  {
    id: "video-1",
    type: "video",
    content: "The Dopamine Loop in Learning",
    videoUrl: "https://www.youtube.com/embed/URUJD5NEXC8",
  },
  {
    id: "2",
    type: "summary",
    content:
      "The Ebbinghaus Forgetting Curve shows we lose 70% of new info within 24 hours. Spaced repetition breaks this curve.",
  },
  {
    id: "3",
    type: "mcq",
    content:
      "According to the Forgetting Curve, how much information do we typically lose within 24 hours?",
    options: ["10%", "30%", "50%", "70%"],
    correctAnswer: 3,
    explanation:
      "Ebbinghaus discovered that memory decay is exponential. Without review, we lose about 70% of new material within the first day.",
  },
  {
    id: "4",
    type: "summary",
    content:
      "Active recall forces your brain to retrieve information from memory, strengthening neural pathways for long-term storage.",
  },
];
