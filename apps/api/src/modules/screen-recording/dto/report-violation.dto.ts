import { IsIn, IsOptional, IsString, IsObject, IsUUID } from 'class-validator';

export class ReportViolationDto {
  @IsString()
  @IsIn(['recording', 'live_session', 'test'])
  contextType: 'recording' | 'live_session' | 'test';

  @IsOptional()
  @IsUUID()
  contextId?: string;

  @IsString()
  @IsIn([
    'visibilitychange_hidden',
    'window_blur',
    'window_focus_lost',
    'printscreen_key',
    'devtools_open',
    'get_display_media',
    'multiple_displays',
  ])
  detectionType:
    | 'visibilitychange_hidden'
    | 'window_blur'
    | 'window_focus_lost'
    | 'printscreen_key'
    | 'devtools_open'
    | 'get_display_media'
    | 'multiple_displays';

  @IsOptional()
  @IsObject()
  details?: Record<string, any>;
}
