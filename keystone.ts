import { xlog } from './utils/logging';
//import { Maps } from './utils/func';
import { config } from '@keystone-6/core';
import { statelessSessions } from '@keystone-6/core/session';
import { createAuth } from '@keystone-6/auth';
import { lists, extendGraphqlSchema } from './schema';
import { permissions } from './schema/access';
import cuid from 'cuid';

const dbUrl =
  `${process.env.DATABASE_URL}` ||
  `postgres://${process.env?.POSTGRES_USER}:${process.env?.POSTGRES_PASSWORD}@${process.env?.POSTGRES_HOST}/${process.env?.POSTGRES_DB}`;

export const keystoneHost = process.env?.KEYSTONE_HOST || 'localhost';

const sessionSecret = cuid() + cuid();

export const keystoneNextjsBuildApiKey =
  process.env.KEYSTONE_NEXTJS_BUILD_API_KEY ||
  'keystone.ts:_NextjsBuildApiKey_says_change_me__im_just_for_testing_purposes';

export const frontEndPort = process.env?.FRONT_END_PORT || '8000';

//log().info('isFront end: ').info(isFrontEnd()).info("Env: ").info(process.env.PLATFORM);

//mapString(processIsFrontEnd)(c => asciiLogger(c))
//mapString('frontend')(c => asciiLogger(c))

// Unless I'm missing something, its tricky to clone typescript objects
// Fortunately theres a workaround for monad like objects, create a new one
// using a class factory, in this case, logclos.
// The resulting object is non-clonable, without entanglement, so is in the CMC, and not the CCC.
// Since objects are so hard to clone it ts, this is not a big issue, indeed, ts seems better suited to the CMC

//xlog makes a log trivial: this one is to check the URL is being properly decoded.
xlog()
  .info(`Database url: ${dbUrl}`)
  .success(dbUrl)
  .info(`Keystone host`)
  .success(keystoneHost);

const auth = createAuth({
  identityField: 'email',
  secretField: 'password',
  listKey: 'User',
  sessionData: `id name role {
    canManageContent
    canManageUsers
  }`,
  initFirstItem: {
    fields: ['name', 'email', 'password'],
    itemData: {
      role: {
        create: {
          name: 'Super User',
          canManageContent: true,
          canManageUsers: true,
        },
      },
    },
  },
});

export default auth.withAuth(
  config({
    db: {
      url: dbUrl,
      provider: 'postgresql',
      useMigrations: true,
    },
    ui: { isAccessAllowed: permissions.canUseAdminUI },
    lists,
    session: statelessSessions({
      secret: sessionSecret,
    }),
    extendGraphqlSchema,
  })
);
