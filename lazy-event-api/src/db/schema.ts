import { pgTable, text, timestamp, pgEnum, uuid } from "drizzle-orm/pg-core";

export const queueStatusEnum = pgEnum("queue_status", [
  "pending",
  "printing",
  "done",
  "failed",
]);

export const photoQueue = pgTable("photo_queue", {
  id: uuid("id").defaultRandom().primaryKey(),
  lineUserId: text("line_user_id").notNull(),
  imageUrl: text("image_url").notNull(), // R2/S3 URL of the uploaded original
  status: queueStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  lineUserId: text("line_user_id").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});