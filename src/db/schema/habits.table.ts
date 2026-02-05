import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema
} from 'drizzle-zod';
import { z } from 'zod';
import { user } from './better-auth.table.js';

export const habits = pgTable('habits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  frequency: varchar('frequency', { length: 20 }).notNull(), // daily, weekly, monthly
  targetCount: integer('target_count').default(1),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull()
});

// --- CONFIG ---
export const habitConfig = {
  name: z.string().min(2, 'Name is too short').max(100),
  description: z.string().max(500).optional().nullable(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  targetCount: z.number().int().min(1).max(1000)
};

// --- ZOD SCHEMAS ---
export const insertHabitSchema = createInsertSchema(habits, {
  name: () => habitConfig.name,
  description: () => habitConfig.description,
  frequency: () => habitConfig.frequency,
  targetCount: () => habitConfig.targetCount
}).omit({
  userId: true
});

export const selectHabitSchema = createSelectSchema(habits);

export const updateHabitSchema = createUpdateSchema(habits, {
  name: () => habitConfig.name,
  description: () => habitConfig.description,
  frequency: () => habitConfig.frequency,
  targetCount: () => habitConfig.targetCount
}).pick({
  name: true,
  description: true,
  frequency: true,
  targetCount: true,
  isActive: true
});

// --- TYPE EXPORTS ---
export type Habit = z.infer<typeof selectHabitSchema>;
export type NewHabit = z.infer<typeof insertHabitSchema>;
