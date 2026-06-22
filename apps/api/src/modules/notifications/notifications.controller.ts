import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('admin/announcements')
  @Roles(UserRole.ADMIN)
  createAnnouncement(
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.createAnnouncement(dto, user.id);
  }

  @Patch('admin/announcements/:id')
  @Roles(UserRole.ADMIN)
  updateAnnouncement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.notificationsService.updateAnnouncement(id, dto);
  }

  @Get('admin/announcements')
  @Roles(UserRole.ADMIN)
  getAnnouncements() {
    return this.notificationsService.getAnnouncements();
  }

  @Get('student/notifications')
  @Roles(UserRole.STUDENT)
  getMyNotifications(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getMyNotifications(user.id);
  }

  @Get('student/notifications/unread-count')
  @Roles(UserRole.STUDENT)
  getUnreadCount(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Post('student/notifications/:id/read')
  @Roles(UserRole.STUDENT)
  markAsRead(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Post('student/notifications/read-all')
  @Roles(UserRole.STUDENT)
  markAllAsRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
