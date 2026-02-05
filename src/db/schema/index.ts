import { defineRelations } from 'drizzle-orm';

import { account, session, user, verification } from './better-auth.table.js';
import { entries } from './entries.table.js';
import { habitTags } from './habit-tags.table.js';
import { habits } from './habits.table.js';
import { tags } from './tags.table.js';

export * from './better-auth.table.js';
export * from './entries.table.js';
export * from './habit-tags.table.js';
export * from './habits.table.js';
export * from './tags.table.js';

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
