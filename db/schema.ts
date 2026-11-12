import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const galleryOrders = sqliteTable("gallery_orders", {
  galleryId: text("gallery_id").primaryKey(),
  photoOrderJson: text("photo_order_json").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const projectTaskDescriptions = sqliteTable("project_task_descriptions", {
  projectId: text("project_id").primaryKey(),
  description: text("description").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export {};
