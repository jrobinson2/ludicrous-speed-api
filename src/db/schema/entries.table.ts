import {
  date,
  pgTable,
  text,
  timestamp,
  unique,
  uuid
} from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema
} from 'drizzle-zod';
import { z } from 'zod';
import { habits } from './habits.table.js';

export const entries = pgTable(
  'entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    habitId: uuid('habit_id')
      .references(() => habits.id, { onDelete: 'cascade' })
      .notNull(),
    completionDate: date('completion_date').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  (t) => [unique('unique_habit_day_entry').on(t.habitId, t.completionDate)]
);

// --- CONFIG ---
export const entryConfig = {
  note: z.string().max(1000, 'Note is too long').optional().nullable(),
  completionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
};

// --- ZOD SCHEMAS ---
export const insertEntrySchema = createInsertSchema(entries, {
  note: () => entryConfig.note,
  completionDate: () => entryConfig.completionDate
});

export const selectEntrySchema = createSelectSchema(entries);

export const updateEntrySchema = createUpdateSchema(entries, {
  note: () => entryConfig.note,
  completionDate: () => entryConfig.completionDate
}).pick({
  note: true,
  completionDate: true
});

// --- TYPE EXPORTS ---
export type Entry = z.infer<typeof selectEntrySchema>;
export type NewEntry = z.infer<typeof insertEntrySchema>;
