# EventHub API

NestJS backend cho hệ thống quản lý sự kiện và đăng ký vé. Requirement chi tiết nằm ở sheet `12. EventHub` trong [workbook dự án](https://docs.google.com/spreadsheets/d/1m4NMX9oGUpUFbsivkiHsBZC36kQbhkM8UzLo_Uy2bbA/edit#gid=2036145347).

## Thành phần chính

- NestJS 12, TypeORM, PostgreSQL; migration không dùng `synchronize` ở runtime.
- JWT access/refresh rotation, Passport, RBAC `ADMIN` / `ORGANIZER` / `ATTENDEE`.
- Event, ticket inventory, đăng ký idempotent, transaction và pessimistic lock.
- Upload ảnh bằng Multer với giới hạn loại/kích thước; storage được tách thành service.
- Mail bất đồng bộ qua `@nestjs/bull` + Redis, retry exponential.
- Cron nhắc sự kiện qua `@nestjs/schedule`.
- i18n Việt/Anh, Swagger, health check, seeder CLI và Vitest e2e.

## Chạy local

```bash
cp .env.example .env
docker compose up -d
npm install
npm run migration:run
npm run seed
npm run start:dev
```

- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/docs`
- Mailpit: `http://localhost:8025`
- Tài khoản seed mặc định: `admin@eventhub.local` / `Admin123!`

## Kiểm tra

```bash
npm run build
npm run lint
npm test
npm run test:e2e
```

## Seeder CLI

```bash
SEED_ADMIN_EMAIL=mentor@example.com SEED_ADMIN_PASSWORD='StrongPassword!' npm run seed
```
