import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import { join } from 'node:path';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { envValidationSchema } from './config/env.validation';
import { AuditLog, Category, Event, RefreshToken, Registration, Ticket, TicketType, User } from './database/entities';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { EventsModule } from './modules/events/events.module';
import { HealthModule } from './modules/health/health.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UsersModule } from './modules/users/users.module';

const entities = [User, RefreshToken, Category, Event, TicketType, Registration, Ticket, AuditLog];
const infrastructureImports = process.env.NODE_ENV === 'test'
  ? []
  : [BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.getOrThrow<string>('REDIS_HOST'),
          port: config.getOrThrow<number>('REDIS_PORT'),
        },
      }),
    })];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => process.env.NODE_ENV === 'test'
        ? { type: 'sqlite', database: ':memory:', entities, synchronize: true, dropSchema: true }
        : {
            type: 'postgres',
            host: config.getOrThrow<string>('DATABASE_HOST'),
            port: config.getOrThrow<number>('DATABASE_PORT'),
            username: config.getOrThrow<string>('DATABASE_USER'),
            password: config.getOrThrow<string>('DATABASE_PASSWORD'),
            database: config.getOrThrow<string>('DATABASE_NAME'),
            entities,
            synchronize: false,
            migrationsRun: true,
            migrations: [join(__dirname, 'database/migrations/*{.ts,.js}')],
          },
    }),
    ScheduleModule.forRoot(),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: { path: join(__dirname, 'i18n'), watch: process.env.NODE_ENV !== 'production' },
      resolvers: [AcceptLanguageResolver],
    }),
    ...infrastructureImports,
    AuthModule,
    UsersModule,
    EventsModule,
    RegistrationsModule,
    CategoriesModule,
    AdminModule,
    TasksModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
