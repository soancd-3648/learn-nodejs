import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Role } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AdminService } from './admin.service';
import { CategoryDto } from './dto/category.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Roles(Role.Admin)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  findUsers(@Query() query: PaginationQueryDto) {
    return this.adminService.findUsers(query);
  }

  @Patch('users/:id')
  updateUser(@CurrentUser() actor: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(actor.id, id, dto);
  }

  @Post('categories')
  createCategory(@CurrentUser() actor: AuthenticatedUser, @Body() dto: CategoryDto) {
    return this.adminService.createCategory(actor.id, dto);
  }

  @Patch('categories/:id')
  updateCategory(@CurrentUser() actor: AuthenticatedUser, @Param('id') id: string, @Body() dto: CategoryDto) {
    return this.adminService.updateCategory(actor.id, id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('categories/:id')
  deleteCategory(@CurrentUser() actor: AuthenticatedUser, @Param('id') id: string) {
    return this.adminService.deleteCategory(actor.id, id);
  }

  @Get('audit-logs')
  auditLogs(@Query() query: PaginationQueryDto) {
    return this.adminService.auditLogs(query);
  }
}
