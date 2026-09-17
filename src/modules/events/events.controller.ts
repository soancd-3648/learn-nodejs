import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UploadedFile as UploadedFileValue } from '../../common/interfaces/uploaded-file.interface';
import { FilesService } from '../files/files.service';
import { EVENT_COVER_MAX_BYTES } from '../files/files.constants';
import { CreateEventDto } from './dto/create-event.dto';
import { SearchEventsDto } from './dto/search-events.dto';
import { SearchRegistrationsDto } from './dto/search-registrations.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly filesService: FilesService,
  ) {}

  @Public()
  @Get()
  search(@Query() query: SearchEventsDto) {
    return this.eventsService.search(query);
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.eventsService.findBySlug(slug);
  }

  @Roles(Role.Organizer, Role.Admin)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEventDto) {
    return this.eventsService.create(user.id, dto);
  }

  @Roles(Role.Organizer, Role.Admin)
  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, user.id, dto);
  }

  @Roles(Role.Organizer, Role.Admin)
  @Post(':id/publish')
  publish(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.eventsService.publish(id, user.id);
  }

  @Roles(Role.Organizer, Role.Admin)
  @Post(':id/cover')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: EVENT_COVER_MAX_BYTES, files: 1 } }))
  async uploadCover(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @UploadedFile() file?: UploadedFileValue,
  ) {
    const stored = await this.filesService.storeImage(file, EVENT_COVER_MAX_BYTES, 'events');
    return this.eventsService.setCover(id, user.id, stored.url);
  }

  @Roles(Role.Organizer, Role.Admin)
  @Get(':id/registrations')
  registrations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: SearchRegistrationsDto,
  ) {
    return this.eventsService.registrations(id, user.id, query);
  }
}
