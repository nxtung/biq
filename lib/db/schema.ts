import { pgTable, text, integer, pgEnum, boolean, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Enums
export const USER_ROLES = ['admin', 'marketing', 'user'] as const;
export const userRoleEnum = pgEnum('user_role', USER_ROLES);
export const CAMPAIGN_STATUSES = ['active', 'paused', 'ended'] as const;
export const campaignStatusEnum = pgEnum('campaign_status', CAMPAIGN_STATUSES);
export const SOURCE_TYPES = ["facebook", "zalo", "message", "youtube", "instagram", "linkedin", "qr", "post", "news", "partner_app", "partner_website", "refer_code", "other"] as const;
export const sourceTypesEnum = pgEnum('source_type', SOURCE_TYPES);
export const CLICK_DEVICE_TYPES = ["ios", "android", "desktop", "other"] as const;
export const clickDeviceTypeEnum = pgEnum('click_device_type', CLICK_DEVICE_TYPES);
export const INSTALL_DEVICE_TYPES = ["ios", "android"] as const;
export const installDeviceTypeEnum = pgEnum('install_device_type', INSTALL_DEVICE_TYPES);

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").unique().notNull(),
  email: text("email"),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
})

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  eventType: text("event_type"),
  promotion: text("promotion"),
  iosLink: text("ios_link"),
  androidLink: text("android_link"),
  status: campaignStatusEnum("status").notNull().default("active"),
  createdBy: text("created_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
})

// Campaign sources table
export const campaignSources = pgTable("campaign_sources", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id").references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  sourceType: sourceTypesEnum("source_type").notNull(),
  sourceName: text("source_name").notNull(),
  trackingUrl: text("tracking_url").unique().notNull(),
  targetUrl: text("target_url"),
  qrCodeUrl: text("qr_code_url"),
  cost: integer("cost"), // Chi phí cho nguồn này (VD: 5000000)
  costCurrency: text("cost_currency").default("VND"), // Đơn vị tiền tệ
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
})

// Clicks table
export const clicks = pgTable("clicks", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id").references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  sourceId: text("source_id").references(() => campaignSources.id, { onDelete: 'cascade' }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  fingerprint: text("fingerprint"), // visitorId từ FingerprintJS
  fingerprintData: text("fingerprint_data"), // JSON string của đối tượng components
  province: text("province"), // Sẽ được bổ sung sau qua Geo-IP
  deviceType: clickDeviceTypeEnum("device_type"),
  clickedAt: timestamp("clicked_at").notNull().defaultNow(),
})

// Install tokens table
export const installTokens = pgTable("install_tokens", {
  id: text("id").primaryKey(),
  token: text("token").unique().notNull(),
  clickId: text("click_id").references(() => clicks.id, { onDelete: 'set null' }),
  campaignId: text("campaign_id").references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  sourceId: text("source_id").references(() => campaignSources.id, { onDelete: 'cascade' }).notNull(),
  fingerprint: text("fingerprint"), // JSON string
  deviceInfo: text("device_info"), // JSON string
  matched: boolean("matched").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
})

// Installs table
export const installs = pgTable("installs", {
  id: text("id").primaryKey(),
  installTokenId: text("install_token_id").references(() => installTokens.id, { onDelete: 'set null' }),
  campaignId: text("campaign_id").references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  sourceId: text("source_id").references(() => campaignSources.id, { onDelete: 'cascade' }).notNull(),
  deviceType: installDeviceTypeEnum("device_type").notNull(),
  deviceInfo: text("device_info"), // JSON string
  province: text("province"),
  matched: boolean("matched").notNull().default(false),
  installedAt: timestamp("installed_at").notNull().defaultNow(),
})

// Activity logs table
export const activityLogs = pgTable("activity_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: 'set null' }),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  details: text("details"), // JSON string
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Settings table
export const settings = pgTable("settings", {
  id: text("id").primaryKey(),
  key: text("key").unique().notNull(),
  value: text("value"), // JSON string
  updatedBy: text("updated_by").references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
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
