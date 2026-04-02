export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  userId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  date: string;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  totalScore: number;
  weeklyScore: number;
  monthlyScore: number;
}

// Mock Data
export const MOCK_QUIZZES: Quiz[] = [
  {
    id: "q1",
    title: "Solar System Basics",
    description: "A beginner-friendly quiz about our cosmic neighborhood.",
    difficulty: "Easy",
    questions: [
      {
        id: "qq1",
        text: "What is the largest planet in our solar system?",
        options: ["Earth", "Mars", "Jupiter", "Saturn"],
        correctOptionIndex: 2,
      },
      {
        id: "qq2",
        text: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Mercury"],
        correctOptionIndex: 1,
      },
      {
        id: "qq3",
        text: "How many moons does Earth have?",
        options: ["0", "1", "2", "3"],
        correctOptionIndex: 1,
      },
      {
        id: "qq4",
        text: "Which planet is closest to the Sun?",
        options: ["Mercury", "Venus", "Earth", "Mars"],
        correctOptionIndex: 0,
      },
      {
        id: "qq5",
        text: "Which planet has the most prominent ring system?",
        options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
        correctOptionIndex: 1,
      },
    ],
  },
  {
    id: "q2",
    title: "Deep Sky Objects",
    description: "Test your knowledge on galaxies, nebulae, and beyond.",
    difficulty: "Medium",
    questions: [
      {
        id: "qq6",
        text: "What type of galaxy is the Milky Way?",
        options: ["Elliptical", "Spiral", "Irregular", "Lenticular"],
        correctOptionIndex: 1,
      },
      {
        id: "qq7",
        text: "What is the closest major galaxy to the Milky Way?",
        options: ["Triangulum Galaxy", "Andromeda Galaxy", "Large Magellanic Cloud", "Sombrero Galaxy"],
        correctOptionIndex: 1,
      },
    ],
  },
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { userId: "u1", name: "Shashank", totalScore: 120, weeklyScore: 30, monthlyScore: 80 },
  { userId: "u2", name: "Jordan Orion", totalScore: 115, weeklyScore: 25, monthlyScore: 75 },
  { userId: "u3", name: "Taylor Vega", totalScore: 90, weeklyScore: 40, monthlyScore: 60 },
  { userId: "u4", name: "Morgan Star", totalScore: 85, weeklyScore: 10, monthlyScore: 40 },
  { userId: "u5", name: "Sam Eclipse", totalScore: 70, weeklyScore: 15, monthlyScore: 35 },
];

export const MOCK_ATTEMPTS: QuizAttempt[] = [
  { userId: "u1", quizId: "q1", score: 5, totalQuestions: 5, date: "2026-03-20" },
  { userId: "u1", quizId: "q2", score: 2, totalQuestions: 2, date: "2026-03-21" },
];
