import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import type { z } from 'zod';
import { habits } from './habits.table.js';
import { tags } from './tags.table.js';

export const habitTags = pgTable(
  'habit_tags',
  {
    habitId: uuid('habit_id')
      .references(() => habits.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  (t) => [primaryKey({ columns: [t.habitId, t.tagId] })]
);

export const insertHabitTagSchema = createInsertSchema(habitTags).omit({
  createdAt: true
});

export const selectHabitTagSchema = createSelectSchema(habitTags);

// --- TYPE EXPORTS ---
export type HabitTag = z.infer<typeof selectHabitTagSchema>;
export type NewHabitTag = z.infer<typeof insertHabitTagSchema>;
