import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

export const paths = {
  projectRoot: PROJECT_ROOT,
  scripts: path.join(PROJECT_ROOT, 'scripts'),
  data: path.join(PROJECT_ROOT, 'data'),
  layouts: path.join(PROJECT_ROOT, 'data', 'layouts'),
  api: path.join(PROJECT_ROOT, 'apps', 'api'),
  web: path.join(PROJECT_ROOT, 'apps', 'web'),
  shared: path.join(PROJECT_ROOT, 'packages', 'shared'),
  prisma: path.join(PROJECT_ROOT, 'apps', 'api', 'prisma'),
  prismaSchema: path.join(PROJECT_ROOT, 'apps', 'api', 'prisma', 'schema.prisma'),
};

