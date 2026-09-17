import { Body, Controller, Get, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UploadedFile as UploadedFileValue } from '../../common/interfaces/uploaded-file.interface';
import { FilesService } from '../files/files.service';
import { AVATAR_MAX_BYTES } from '../files/files.constants';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
  ) {}

  @Get('me')
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findMe(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMe(user.id, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: AVATAR_MAX_BYTES, files: 1 } }))
  async uploadAvatar(@CurrentUser() user: AuthenticatedUser, @UploadedFile() file?: UploadedFileValue) {
    const stored = await this.filesService.storeImage(file, AVATAR_MAX_BYTES, 'avatars');
    return this.usersService.updateAvatar(user.id, stored.url);
  }
}
