import { defineRelations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { account, session, user, verification } from './better-auth.table.js';
import { entries } from './entries.table.js';
import { habitTags } from './habit-tags.table.js';
import { habits } from './habits.table.js';
import { tags } from './tags.table.js';

// RELATIONS (V2)
export const relations = defineRelations(
  {
    user,
    session,
    account,
    verification,
    habits,
    entries,
    tags,
    habitTags
  },
  (r) => ({
    user: {
      habits: r.many.habits({ from: r.user.id, to: r.habits.userId }),
      sessions: r.many.session({ from: r.user.id, to: r.session.userId }),
      accounts: r.many.account({ from: r.user.id, to: r.account.userId })
    },
    session: {
      user: r.one.user({ from: r.session.userId, to: r.user.id })
    },
    account: {
      user: r.one.user({ from: r.account.userId, to: r.user.id })
    },
    verification: {},
    habits: {
      user: r.one.user({ from: r.habits.userId, to: r.user.id }),
      entries: r.many.entries({ from: r.habits.id, to: r.entries.habitId }),
      habitTags: r.many.habitTags({
        from: r.habits.id,
        to: r.habitTags.habitId
      })
    },
    entries: {
      habit: r.one.habits({ from: r.entries.habitId, to: r.habits.id })
    },
    tags: {
      habitTags: r.many.habitTags({ from: r.tags.id, to: r.habitTags.tagId })
    },
    habitTags: {
      habit: r.one.habits({ from: r.habitTags.habitId, to: r.habits.id }),
      tag: r.one.tags({ from: r.habitTags.tagId, to: r.tags.id })
    }
  })
);

// This is what the getDb, getAuth and seed functions will use
export const schema = {
  user,
  session,
  account,
  verification,
  habits,
  entries,
  tags,
  habitTags,
  relations
};

// INDIVIDUAL TABLE EXPORTS (For direct use if needed)
export {
  user,
  session,
  account,
  verification,
  habits,
  entries,
  tags,
  habitTags
};

// --- ZOD SCHEMAS ---
export const insertHabitSchema = createInsertSchema(habits);
export const selectHabitSchema = createSelectSchema(habits);
export const insertEntrySchema = createInsertSchema(entries);
export const selectEntrySchema = createSelectSchema(entries);
export const insertTagSchema = createInsertSchema(tags);
export const selectTagSchema = createSelectSchema(tags);

// --- TYPE EXPORTS ---
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type HabitTag = typeof habitTags.$inferSelect;
export type NewHabitTag = typeof habitTags.$inferInsert;
