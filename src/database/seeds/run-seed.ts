import bcrypt from 'bcrypt';
import dataSource from '../data-source';
import { Role } from '../../common/enums/role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';
import { Category, User } from '../entities';

async function run(): Promise<void> {
  await dataSource.initialize();
  const categoriesRepository = dataSource.getRepository(Category);
  const usersRepository = dataSource.getRepository(User);

  await categoriesRepository.upsert([
    { name: 'Technology', slug: 'technology' },
    { name: 'Business', slug: 'business' },
    { name: 'Community', slug: 'community' },
  ], ['slug']);

  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@eventhub.local';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';
  const existing = await usersRepository.findOneBy({ email });
  if (!existing) {
    await usersRepository.save(usersRepository.create({
      email,
      fullName: 'EventHub Admin',
      passwordHash: await bcrypt.hash(password, 12),
      roles: [Role.Admin, Role.Organizer],
      status: UserStatus.Active,
      verifiedAt: new Date(),
    }));
  }
  await dataSource.destroy();
  console.info(`Seed completed. Admin: ${email}`);
}

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
