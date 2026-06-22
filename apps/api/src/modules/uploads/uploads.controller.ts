import { Controller, Post, UseInterceptors, UploadedFile, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseService } from '../../common/services/supabase.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('uploads')
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  @Post('question-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadQuestionImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ) {
    if (!file) throw new Error('No file provided');

    const ext = file.originalname.split('.').pop() ?? 'png';
    const fileName = `q-${user.id}-${Date.now()}.${ext}`;
    const storagePath = `question-answers/${fileName}`;

    const { error: uploadError } = await this.supabaseService.client
      .storage
      .from('uploads')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      this.logger.error(`Upload failed: ${uploadError.message}`);
      throw new Error('Failed to upload image');
    }

    const { data: signedUrl } = await this.supabaseService.client
      .storage
      .from('uploads')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 30);

    return { url: signedUrl?.signedUrl ?? '', fileName };
  }
}
