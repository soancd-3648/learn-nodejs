import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Role } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CheckInDto } from './dto/check-in.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { RegistrationsService } from './registrations.service';

@Controller()
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Roles(Role.Attendee, Role.Admin)
  @Post('events/:eventId/registrations')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('eventId') eventId: string,
    @Body() dto: CreateRegistrationDto,
  ) {
    return this.registrationsService.create(eventId, user.id, dto);
  }

  @Get('registrations/me')
  findMine(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.registrationsService.findMine(user.id, query.page, query.limit);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('registrations/:id')
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.registrationsService.cancel(id, user.id);
  }

  @Roles(Role.Organizer, Role.Admin)
  @Post('tickets/check-in')
  checkIn(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckInDto) {
    return this.registrationsService.checkIn(user.id, dto);
  }
}
