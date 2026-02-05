import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema
} from 'drizzle-zod';
import { z } from 'zod';

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  color: varchar('color', { length: 7 }).default('#6B7280'), // hex color
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull()
});

// --- CONFIG ---
export const tagConfig = {
  name: z.string().min(1, 'Tag name required').max(50).trim(),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color')
};

// --- ZOD SCHEMAS ---
export const insertTagSchema = createInsertSchema(tags, {
  name: () => tagConfig.name,
  color: () => tagConfig.color.optional()
});

export const selectTagSchema = createSelectSchema(tags);

export const updateTagSchema = createUpdateSchema(tags, {
  name: () => tagConfig.name,
  color: () => tagConfig.color
}).pick({
  name: true,
  color: true
});

// --- TYPE EXPORTS ---
export type Tag = z.infer<typeof selectTagSchema>;
export type NewTag = z.infer<typeof insertTagSchema>;
