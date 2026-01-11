import { z } from 'zod';

export const neon = {
  databaseUrl: () =>
    z
      .url({
        message: 'DATABASE_URL must be a valid URL'
      })
      .trim()
      .superRefine((value, ctx) => {
        const issues: {
          code: 'custom';
          message: string;
        }[] = [];

        let url: URL;

        try {
          url = new URL(value);
        } catch {
          issues.push({
            code: 'custom',
            message: 'DATABASE_URL is not a valid URL'
          });

          for (const issue of issues) {
            ctx.addIssue(issue);
          }
          return;
        }

        if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
          issues.push({
            code: 'custom',
            message: 'DATABASE_URL must use postgres or postgresql protocol'
          });
        }

        if (!url.username || !url.password) {
          issues.push({
            code: 'custom',
            message: 'DATABASE_URL must include username and password'
          });
        }

        const dbName = url.pathname.replace(/^\/+/, '');
        if (!dbName) {
          issues.push({
            code: 'custom',
            message: 'DATABASE_URL must include a database name'
          });
        }

        if (!url.hostname.endsWith('.neon.tech')) {
          issues.push({
            code: 'custom',
            message:
              'DATABASE_URL must be a Neon database (*.neon.tech, pooled or direct)'
          });
        }

        if (url.searchParams.get('sslmode') !== 'require') {
          issues.push({
            code: 'custom',
            message: 'DATABASE_URL must include sslmode=require'
          });
        }

        for (const issue of issues) {
          ctx.addIssue(issue);
        }
      })
};
