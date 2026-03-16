import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").unique().notNull(),
  email: text("email"),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "marketing", "user"] }).notNull().default("user"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

// Campaigns table
export const campaigns = sqliteTable("campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  eventType: text("event_type"),
  promotion: text("promotion"),
  iosLink: text("ios_link"),
  androidLink: text("android_link"),
  status: text("status", { enum: ["active", "paused", "ended"] }).notNull().default("active"),
  createdBy: text("created_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

// Campaign sources table
export const campaignSources = sqliteTable("campaign_sources", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id").references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  sourceType: text("source_type", {
    enum: ["facebook", "zalo", "message", "youtube", "instagram", "linkedin", "qr", "post", "news", "partner_app", "partner_website", "refer_code", "other"]
  }).notNull(),
  sourceName: text("source_name").notNull(),
  trackingUrl: text("tracking_url").unique().notNull(),
  targetUrl: text("target_url"),
  qrCodeUrl: text("qr_code_url"),
  cost: integer("cost"), // Chi phí cho nguồn này (VD: 5000000)
  costCurrency: text("cost_currency").default("VND"), // Đơn vị tiền tệ
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

// Clicks table
export const clicks = sqliteTable("clicks", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id").references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  sourceId: text("source_id").references(() => campaignSources.id, { onDelete: 'cascade' }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  fingerprint: text("fingerprint"), // visitorId từ FingerprintJS
  fingerprintData: text("fingerprint_data"), // JSON string của đối tượng components
  province: text("province"), // Sẽ được bổ sung sau qua Geo-IP
  deviceType: text("device_type", { enum: ["ios", "android", "desktop", "other"] }),
  clickedAt: integer("clicked_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

// Install tokens table
export const installTokens = sqliteTable("install_tokens", {
  id: text("id").primaryKey(),
  token: text("token").unique().notNull(),
  clickId: text("click_id").references(() => clicks.id, { onDelete: 'set null' }),
  campaignId: text("campaign_id").references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  sourceId: text("source_id").references(() => campaignSources.id, { onDelete: 'cascade' }).notNull(),
  fingerprint: text("fingerprint"), // JSON string
  deviceInfo: text("device_info"), // JSON string
  matched: integer("matched", { mode: "boolean" }).notNull().default(false),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
})

// Installs table
export const installs = sqliteTable("installs", {
  id: text("id").primaryKey(),
  installTokenId: text("install_token_id").references(() => installTokens.id, { onDelete: 'set null' }),
  campaignId: text("campaign_id").references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  sourceId: text("source_id").references(() => campaignSources.id, { onDelete: 'cascade' }).notNull(),
  deviceType: text("device_type", { enum: ["ios", "android"] }).notNull(),
  deviceInfo: text("device_info"), // JSON string
  province: text("province"),
  matched: integer("matched", { mode: "boolean" }).notNull().default(false),
  installedAt: integer("installed_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

// Activity logs table
export const activityLogs = sqliteTable("activity_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  details: text("details"), // JSON string
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

// Settings table
export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(),
  key: text("key").unique().notNull(),
  value: text("value"), // JSON string
  updatedBy: text("updated_by").references(() => users.id, { onDelete: 'set null' }),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  campaigns: many(campaigns),
  activityLogs: many(activityLogs),
}))

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [campaigns.createdBy],
    references: [users.id],
  }),
  sources: many(campaignSources),
  clicks: many(clicks),
  installs: many(installs),
}))

export const campaignSourcesRelations = relations(campaignSources, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [campaignSources.campaignId],
    references: [campaigns.id],
  }),
  clicks: many(clicks),
  installs: many(installs),
}))

export const clicksRelations = relations(clicks, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [clicks.campaignId],
    references: [campaigns.id],
  }),
  source: one(campaignSources, {
    fields: [clicks.sourceId],
    references: [campaignSources.id],
  }),
}))

export const installsRelations = relations(installs, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [installs.campaignId],
    references: [campaigns.id],
  }),
  source: one(campaignSources, {
    fields: [installs.sourceId],
    references: [campaignSources.id],
  }),
  installToken: one(installTokens, {
    fields: [installs.installTokenId],
    references: [installTokens.id],
  }),
}))

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Campaign = typeof campaigns.$inferSelect
export type NewCampaign = typeof campaigns.$inferInsert
export type CampaignSource = typeof campaignSources.$inferSelect
export type NewCampaignSource = typeof campaignSources.$inferInsert
export type Click = typeof clicks.$inferSelect
export type NewClick = typeof clicks.$inferInsert
export type InstallToken = typeof installTokens.$inferSelect
export type NewInstallToken = typeof installTokens.$inferInsert
export type Install = typeof installs.$inferSelect
export type NewInstall = typeof installs.$inferInsert
export type ActivityLog = typeof activityLogs.$inferSelect
export type NewActivityLog = typeof activityLogs.$inferInsert
export type Setting = typeof settings.$inferSelect
