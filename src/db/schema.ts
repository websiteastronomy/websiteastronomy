import { pgTable, text, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";

// --- BETTER AUTH TABLES ---

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => users.id),
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// --- DOMAIN TABLES ---

// Base timestamps for all models
const timestamps = {
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
};

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  fullDescription: text("fullDescription"),
  date: text("date").notNull(), // ISO String used by app
  location: text("location").notNull(),
  type: text("type").notNull(),
  registrationLink: text("registrationLink"),
  bannerImage: text("bannerImage"),
  isPublished: boolean("isPublished").default(false).notNull(),
  media: jsonb("media").default('[]'),              // URLs to photos/videos
  internalNotes: text("internalNotes"),              // Member coordination notes
  ...timestamps
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  fullDescription: text("fullDescription"),
  objective: text("objective"),
  status: text("status").notNull(),
  startDate: text("startDate"),
  endDate: text("endDate"),
  lastUpdated: text("lastUpdated"),
  teamSize: integer("teamSize").default(0).notNull(),
  coverImage: text("coverImage").notNull(),          // was imageUrl
  githubUrl: text("githubUrl"),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  progress: integer("progress").default(0).notNull(),
  tags: jsonb("tags").default('[]').notNull(),        // string[]
  team: jsonb("team").default('[]').notNull(),        // ProjectMember[]
  updates: jsonb("updates").default('[]'),            // ProjectUpdate[]
  ...timestamps
});

export const articles = pgTable("articles", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  date: text("date").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  coverImage: text("coverImage").notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  tags: jsonb("tags").default('[]').notNull(),        // string[]
  ...timestamps
});

export const quizzes = pgTable("quizzes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(),
  estimatedMinutes: integer("estimatedMinutes").default(10).notNull(),
  points: integer("points").default(100).notNull(),
  questions: jsonb("questions").notNull().default('[]'),
  ...timestamps
});

// Quiz attempts for leaderboard
export const quiz_attempts = pgTable("quiz_attempts", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  userName: text("userName"),
  quizId: text("quizId").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("totalQuestions").notNull(),
  date: text("date").notNull(),
  ...timestamps
});

export const media = pgTable("media", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  photographer: text("photographer"),
  ...timestamps
});

export const observations = pgTable("observations", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(),
  location: text("location").notNull(),
  observerName: text("observerName").notNull(),
  equipment: text("equipment"),
  images: jsonb("images").notNull().default('[]'),
  notes: text("notes"),
  isApproved: boolean("isApproved").default(false).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  settings: jsonb("settings").default('{}'),
  ...timestamps
});

export const outreach = pgTable("outreach", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  date: text("date").notNull(),
  location: text("location").notNull(),
  images: jsonb("images").notNull().default('[]'),
  description: text("description").notNull(),
  isApproved: boolean("isApproved").default(false).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  stats: jsonb("stats").default('{}'),
  ...timestamps
});

export const members = pgTable("members", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  ...timestamps
});

export const achievements = pgTable("achievements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dateEarned: text("dateEarned"),
  userId: text("userId").references(() => users.id),
  ...timestamps
});

// A generic settings table matching Firestore's dynamic documents
export const settingsTable = pgTable("settings", {
  id: text("id").primaryKey(),
  data: jsonb("data").notNull().default('{}'),
  ...timestamps
});
