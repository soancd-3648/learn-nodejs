import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AuditAction } from '../src/common/enums/audit-action.enum';
import { UserStatus } from '../src/common/enums/user-status.enum';
import { AuditLog, User } from '../src/database/entities';

describe('EventHub API (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let auditLogsRepository: Repository<AuditLog>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    usersRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    auditLogsRepository = moduleRef.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
  });

  afterAll(async () => app.close());

  it('registers, activates and logs in a user', async () => {
    const registration = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'student@example.com', password: 'Secure123!', fullName: 'Student User' })
      .expect(201);

    expect(registration.body.status).toBe(UserStatus.PendingVerification);
    await usersRepository.update(registration.body.userId as string, {
      status: UserStatus.Active,
      verifiedAt: new Date(),
    });

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student@example.com', password: 'Secure123!' })
      .expect(200);

    expect(login.body.accessToken).toEqual(expect.any(String));
    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`)
      .expect(200)
      .expect(({ body }) => expect(body.email).toBe('student@example.com'));

    await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`)
      .send({ fullName: 'Updated Student' })
      .expect(200);

    const auditLog = await auditLogsRepository.findOneBy({
      actorUserId: registration.body.userId as string,
      action: AuditAction.UserProfileUpdated,
    });
    expect(auditLog?.targetId).toBe(registration.body.userId);
  });

  it('rejects invalid input and serves public health/events endpoints', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/register').send({ email: 'bad' }).expect(400);
    await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    await request(app.getHttpServer()).get('/api/v1/events').expect(200);
  });
});
