import { pgTable, text, timestamp, pgEnum, uuid, integer } from "drizzle-orm/pg-core";

export const queueStatusEnum = pgEnum("queue_status", [
  "pending",
  "printing",
  "done",
  "failed",
]);

export const paperSizeEnum = pgEnum("paper_size", [
  "4x6",
  "polaroid_3x3",
]);

// One record per uploaded original file
export const photos = pgTable("photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  lineUserId: text("line_user_id").notNull(),
  imageUrl: text("image_url").notNull(), // Public URL served from local disk storage
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// One record per print job. A single photo can spawn multiple
// print jobs (e.g. one 4x6 + one polaroid_3x3), each tracked separately.
export const printJobs = pgTable("print_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  photoId: uuid("photo_id")
    .notNull()
    .references(() => photos.id, { onDelete: "cascade" }),
  lineUserId: text("line_user_id").notNull(), // Denormalized for faster "my queue" lookups
  paperSize: paperSizeEnum("paper_size").notNull(),
  quantity: integer("quantity").notNull().default(1), // Copies of this photo at this paper size, e.g. 1/3/6/12
  priceBaht: integer("price_baht").notNull(), // Snapshot of the tier price at time of order, in whole baht
  status: queueStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Congrats/send-off messages displayed on screen at the event
export const advices = pgTable("advices", {
  id: uuid("id").defaultRandom().primaryKey(),
  lineUserId: text("line_user_id").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  lineUserId: text("line_user_id").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});