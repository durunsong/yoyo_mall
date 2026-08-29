import packageJson from '../../../package.json';

describe('deployment build scripts', () => {
  it('keeps the production build independent from database migrations', () => {
    expect(packageJson.scripts.build).toBe('prisma generate && next build');
    expect(packageJson.scripts['db:migrate:deploy']).toBe('prisma migrate deploy');
  });
});
