import type { Database } from '../db/reactor.js';
import { getAuth } from '../lib/auth.instance.js';
import type { Bindings } from '../lib/env.js';

export const sendMagicLink = async (
  db: Database,
  env: Bindings,
  email: string,
  headers: Headers
) => {
  const auth = getAuth(db, env);

  await auth.api.signInMagicLink({
    body: {
      email,
      callbackURL: `${env.BETTER_AUTH_URL}/api/users/me`
    },
    headers
  });
};
