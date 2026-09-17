import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { AuditLog, Category, Event, RefreshToken, Registration, Ticket, TicketType, User } from './entities';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'eventhub',
  password: process.env.DATABASE_PASSWORD ?? 'eventhub',
  database: process.env.DATABASE_NAME ?? 'eventhub',
  entities: [User, RefreshToken, Category, Event, TicketType, Registration, Ticket, AuditLog],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
