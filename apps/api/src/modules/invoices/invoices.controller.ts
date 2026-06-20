import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvoicesService } from './invoices.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@lms/shared-types';

@Controller('invoices')
@Roles(UserRole.ADMIN)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get(':id/download')
  async download(@Param('id') id: string) {
    return this.invoicesService.getDownloadUrl(id);
  }

  @Post('bulk-generate')
  @UseInterceptors(FileInterceptor('file'))
  async bulkGenerate(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.invoicesService.bulkGenerate(user.id, file);
  }
}
