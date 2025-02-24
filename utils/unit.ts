import { Maps } from './func';

export const u = {} as const;

export type U = typeof u;

export const cr = '\n';

// The typical modeling of side effects in functional environments
// Silently drop the return value of the side effect, which has no effect
// on the constant environment, and call the continuation with the initial environment,
// as though nothing happened.
export const sideEffect =
  <T, SR>(side: Maps<T, SR>) =>
  (env: T) => {
    side(env);
    return env;
  };
