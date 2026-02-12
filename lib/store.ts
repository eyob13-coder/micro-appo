import { create } from 'zustand';

interface Lesson {
  id: string;
  type: 'summary' | 'mcq';
  content: string;
  options?: string[];
  correctAnswer?: number;
}

interface AppState {
  lessons: Lesson[];
  activeLessonIndex: number;
  setLessons: (lessons: Lesson[]) => void;
  nextLesson: () => void;
  prevLesson: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  lessons: [],
  activeLessonIndex: 0,
  setLessons: (lessons) => set({ lessons }),
  nextLesson: () => set((state) => ({ 
    activeLessonIndex: Math.min(state.activeLessonIndex + 1, state.lessons.length - 1) 
  })),
  prevLesson: () => set((state) => ({ 
    activeLessonIndex: Math.max(state.activeLessonIndex - 1, 0) 
  })),
}));
