import { pgTable, text, timestamp, boolean, jsonb, integer, pgEnum } from "drizzle-orm/pg-core";

// --- BETTER AUTH TABLES ---

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  phone: text("phone"),
  status: text("status").default("pending").notNull(),
  role: text("role").default("none").notNull(), // LEGACY FIELD - DO NOT REMOVE
  roleId: text("role_id"), // NEW FK FIELD
  // --- PROFILE UNIFICATION FIELDS ---
  profileImageKey: text("profile_image_key"),    // R2 object key
  department: text("department"),
  quote: text("quote"),
  responsibility: text("responsibility"),
  isPublic: boolean("is_public").default(false).notNull(),
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
  isPublic: boolean("is_public").default(true).notNull(),
  status: text("status").default("upcoming").notNull(), // upcoming | ongoing | completed
  media: jsonb("media").default('[]'),              // URLs to photos/videos
  internalNotes: text("internalNotes"),              // Member coordination notes
  registrationType: text("registration_type").default('internal').notNull(), // internal | external
  maxParticipants: integer("max_participants").default(50).notNull(),
  enableVolunteer: boolean("enable_volunteer").default(false).notNull(),
  volunteerLimit: integer("volunteer_limit").default(0).notNull(),
  backupVolunteerLimit: integer("backup_volunteer_limit").default(0).notNull(),
  speakerDetails: jsonb("speaker_details"), // { name, designation, organization }
  ...timestamps
});

export const event_registrations = pgTable("event_registrations", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id), // Nullable for public registrations
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: text("name"),   // For public registrations
  email: text("email"), // For public registrations
  isVolunteer: boolean("is_volunteer").default(false).notNull(),
  isBackupVolunteer: boolean("is_backup_volunteer").default(false).notNull(),
  ...timestamps
});

export const event_volunteers = pgTable("event_volunteers", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  isBackup: boolean("is_backup").default(false).notNull(),
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
  team: jsonb("team").default('[]').notNull(),        // LEGACY - JSON ProjectMember[]
  updates: jsonb("updates").default('[]'),            // ProjectUpdate[]
  ...timestamps
});

export const projectMemberRoleEnum = pgEnum("project_member_role", ["member", "lead"]);

export const project_members = pgTable("project_members", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: projectMemberRoleEnum("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const taskStatusEnum = pgEnum("task_status", ["todo", "inProgress", "review", "done"]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high"]);

export const project_tasks = pgTable("project_tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("todo"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  deadline: text("deadline"),
  isBlocked: boolean("is_blocked").default(false).notNull(),
  ...timestamps,
});

export const project_task_assignments = pgTable("project_task_assignments", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => project_tasks.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

export const project_task_comments = pgTable("project_task_comments", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => project_tasks.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const project_task_attachments = pgTable("project_task_attachments", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => project_tasks.id, { onDelete: "cascade" }),
  fileId: text("file_id").notNull().references(() => project_files.id, { onDelete: "cascade" }), // Relates to project_files table below if exists or just standard file ID. Currently linking text ID.
  attachedAt: timestamp("attached_at").defaultNow().notNull(),
});

export const project_files = pgTable("project_files", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull().default("file"),           // "file" | "folder"
  parentId: text("parent_id"),                            // null = root, else folder id
  fileSize: text("file_size"),                            // e.g. "2.4 MB"
  mimeType: text("mime_type"),
  url: text("url"),                                       // R2 URL when available
  uploadedBy: text("uploaded_by").notNull().default("Unknown"),
  ...timestamps,
});

export const project_timeline = pgTable("project_timeline", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(), // using text so it can store long markdown
  date: text("date").notNull(),               // string purely for simple YYYY-MM-DD visual sort for now, or ISO
  typeTag: text("type_tag").notNull().default("Update"), // 'Milestone' | 'Update' | 'Issue' | 'Success'
  attachedFiles: jsonb("attached_files").default('[]').notNull(),
  ...timestamps,
});

export const project_discussion = pgTable("project_discussion", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  authorAvatar: text("author_avatar").notNull(),
  text: text("text").notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  replyToId: text("reply_to_id"), // Optional self-reference. Drizzle recursive relations usually require extra relation config, but basic text ID is fine.
  ...timestamps,
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

export const observationStatusEnum = pgEnum("observation_status", [
  "Draft", "Submitted", "Under_Review", "Core_Approved", "Admin_Approved", "Published", "Rejected"
]);

export const observations = pgTable("observations", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  observerId: text("observer_id").notNull(),
  category: text("category").notNull(), // Deep Sky / Planetary / Lunar
  celestialTarget: text("celestial_target").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  capturedAt: timestamp("captured_at").notNull(),
  
  // Image URL Variants
  imageOriginalUrl: text("image_original_url"),
  imageCompressedUrl: text("image_compressed_url"),
  imageThumbnailUrl: text("image_thumbnail_url"),

  // Technical Fields
  equipment: text("equipment"),
  exposureTime: text("exposure_time"),
  iso: text("iso"),
  focalLength: text("focal_length"),
  filtersUsed: text("filters_used"),
  bortleScale: text("bortle_scale"),
  framesCount: integer("frames_count"),
  processingSoftware: text("processing_software"),

  // Approval Tracking System
  status: observationStatusEnum("status").default("Draft").notNull(),
  assignedReviewers: jsonb("assigned_reviewers").default('[]').notNull(), // text array
  approvals: jsonb("approvals").default('[]').notNull(), // text array
  rejections: jsonb("rejections").default('[]').notNull(), // text array
  adminDecision: text("admin_decision"), // "approved" | "rejected" | null
  rejectionReason: text("rejection_reason"),
  
  // Meta
  versionNumber: integer("version_number").default(1).notNull(),
  reportsCount: integer("reports_count").default(0).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  ...timestamps
});

export const observation_versions = pgTable("observation_versions", {
  id: text("id").primaryKey(),
  observationId: text("observation_id").notNull(),
  versionNumber: integer("version_number").notNull(),
  editedBy: text("edited_by").notNull(), // userId of whoever made the change
  changes: jsonb("changes").notNull(), // diff or full payload
  ...timestamps
});

export const observation_reports = pgTable("observation_reports", {
  id: text("id").primaryKey(),
  observationId: text("observation_id").notNull(),
  reporterId: text("reporter_id"), // Nullable if anonymous reports allowed, but lets use user id if logged in
  reason: text("reason").notNull(),
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
  dept: text("dept"),
  imageUrl: text("image_url"),
  bio: text("bio"),
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

// Activity log — tracks all major actions across a project
export const project_activity = pgTable("project_activity", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  actorName: text("actor_name").notNull().default("System"),
  action: text("action").notNull(),          // "created_task" | "completed_task" | "moved_task" | "deleted_task" | "uploaded_file" | "added_comment" | "added_timeline" | "sent_message"
  entityType: text("entity_type").notNull(), // "task" | "file" | "comment" | "timeline" | "discussion"
  entityId: text("entity_id"),
  entityTitle: text("entity_title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// A generic settings table matching Firestore's dynamic documents
export const settingsTable = pgTable("settings", {
  id: text("id").primaryKey(),
  data: jsonb("data").notNull().default('{}'),
  ...timestamps
});

export const system_settings = pgTable("system_settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const files = pgTable("files", {
  id: text("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: text("file_type").notNull(),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }),
  eventId: text("event_id").references(() => events.id, { onDelete: "cascade" }),
  uploadedBy: text("uploaded_by").notNull().references(() => users.id),
  version: integer("version").default(1).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  status: text("status").default("active").notNull(), // "active" or "deleted"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- RBAC TABLES ---

export const roles = pgTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  ...timestamps
});

export const permissions = pgTable("permissions", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  description: text("description"),
});

export const role_permissions = pgTable("role_permissions", {
  id: text("id").primaryKey(),
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: text("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
});

// ==============================================================================
// BLOCK B: APPROVALS & GOVERNANCE (PHASE 6)
// ==============================================================================

export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected"]);
export const approvalVoteActionEnum = pgEnum("approval_vote_action", ["approve", "reject"]);

export const approvals = pgTable("approvals", {
  id: text("id").primaryKey(),
  targetAction: text("target_action").notNull(), // e.g. 'DELETE_PROJECT', 'ESCALATE_ROLE'
  targetEntityId: text("target_entity_id").notNull(), 
  requestedBy: text("requested_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: approvalStatusEnum("status").notNull().default("pending"),
  payload: jsonb("payload"), // Flexible data needed to execute the action if approved
  ...timestamps
});

export const approval_votes = pgTable("approval_votes", {
  id: text("id").primaryKey(),
  approvalId: text("approval_id").notNull().references(() => approvals.id, { onDelete: "cascade" }),
  voterId: text("voter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vote: approvalVoteActionEnum("vote").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==============================================================================
// BLOCK B: AUDIT LOGS (PHASE 8)
// ==============================================================================

export const audit_logs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }), // The user performing the action
  action: text("action").notNull(), // e.g., 'UPLOAD_SECURITY_DOC', 'APPROVE_MEMBER'
  targetEntity: text("target_entity").notNull(), // e.g., 'file', 'user'
  entityId: text("entity_id").notNull(),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==============================================================================
// BLOCK B: NOTIFICATIONS (PHASE 9)
// ==============================================================================

export const notificationTypeEnum = pgEnum("notification_type", ["mention", "task_assigned", "approval_request", "system"]);

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull().default("system"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
