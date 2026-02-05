import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
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

// --- TYPE EXPORTS ---
export type HabitTag = typeof habitTags.$inferSelect;
export type NewHabitTag = typeof habitTags.$inferInsert;
