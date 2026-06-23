import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { DeviceService } from './device.service';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@lms/shared-types';

@Controller('devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Roles(UserRole.STUDENT)
  @Get()
  async listDevices(
    @CurrentUser() user: { id: string },
  ) {
    const devices = await this.deviceService.getUserDevices(user.id);
    return devices;
  }

  @Roles(UserRole.STUDENT)
  @Patch(':id')
  async updateDevice(
    @Param('id') id: string,
    @Body() dto: UpdateDeviceDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.deviceService.updateDevice(id, user.id, dto);
  }

  @Roles(UserRole.STUDENT)
  @Delete(':id')
  async deleteDevice(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.deviceService.deleteDevice(id, user.id);
    return { message: 'Device removed and session invalidated' };
  }
}
