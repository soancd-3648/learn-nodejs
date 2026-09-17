import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { AuditTargetType } from '../../common/enums/audit-target-type.enum';
import { AuditLog } from '../../database/entities';

interface RecordAuditLogParams {
  actorUserId: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private readonly auditLogsRepository: Repository<AuditLog>) {}

  record(params: RecordAuditLogParams, manager?: EntityManager): Promise<AuditLog> {
    const repository = manager?.getRepository(AuditLog) ?? this.auditLogsRepository;
    return repository.save(repository.create({
      ...params,
      targetId: params.targetId ?? null,
      details: params.details ?? null,
    }));
  }
}
