import { seed } from 'drizzle-seed';
import { getDb } from './reactor.js';
import * as schema from './schema/index.js';

async function run() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error('❌ [Ludicrous Seed]: DATABASE_URL is not defined');
    process.exit(1);
  }

  const db = getDb(url);

  console.log('🚀 Launching Seed at Ludicrous Speed...');

  /**
   * 1. CLEANUP PHASE
   */
  console.log('🧹 Cleaning up old data...');
  const tables = [
    schema.habitTags,
    schema.entries,
    schema.habits,
    schema.tags,
    schema.session,
    schema.account,
    schema.verification,
    schema.user
  ];

  for (const table of tables) {
    await db.delete(table);
  }

  /**
   * 2. SEEDING PHASE
   */
  console.log('🌱 Generating fresh data...');

  await seed(db, schema).refine((f) => ({
    user: {
      count: 3,
      columns: {
        id: f.valuesFromArray({
          values: ['user-1', 'user-2', 'user-3'],
          isUnique: true
        }),
        name: f.valuesFromArray({
          values: ['Test Pilot', 'Beta Tester', 'Gamma Ray']
        }),
        email: f.valuesFromArray({
          values: ['test@example.com', 'beta@v.ai', 'gamma@v.ai'],
          isUnique: true
        }),
        // In 0.3.1, for a constant boolean, use .default()
        emailVerified: f.default({ defaultValue: true })
      }
    },
    tags: {
      count: 5,
      columns: {
        name: f.valuesFromArray({
          values: ['Health', 'Work', 'Mindfulness', 'Fitness', 'Finance'],
          isUnique: true
        }),
        color: f.valuesFromArray({
          values: ['#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B']
        })
      }
    },
    habits: {
      count: 6,
      columns: {
        name: f.valuesFromArray({
          values: [
            'Drink Water',
            'Morning Run',
            'Read 10 Pages',
            'Journal',
            'Code',
            'Meditate'
          ]
        }),
        // 0.3.1 uses sentencesCount for loremIpsum
        description: f.loremIpsum({ sentencesCount: 1 }),
        frequency: f.valuesFromArray({
          values: ['daily', 'weekly', 'monthly']
        }),
        targetCount: f.int({ minValue: 1, maxValue: 5 }),
        isActive: f.boolean()
      }
    },
    entries: {
      count: 60,
      columns: {
        completion_date: f.date({
          minDate: new Date('2025-01-01'),
          maxDate: new Date()
        }),
        note: f.loremIpsum({ sentencesCount: 1 })
      }
    },
    habitTags: {
      count: 12
    }
  }));

  console.log('🏁 Mission Accomplished. Database is primed.');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
