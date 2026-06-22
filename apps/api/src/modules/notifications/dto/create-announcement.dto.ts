import { IsString, IsOptional, IsBoolean, IsUUID, IsIn, MinLength, MaxLength } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters.' })
  @MaxLength(200, { message: 'Title cannot exceed 200 characters.' })
  title!: string;

  @IsString()
  @MinLength(1, { message: 'Message cannot be empty.' })
  @MaxLength(5000, { message: 'Message cannot exceed 5000 characters.' })
  message!: string;

  @IsIn(['all', 'course', 'batch'], { message: 'targetType must be all, course, or batch.' })
  targetType!: 'all' | 'course' | 'batch';

  @IsOptional()
  @IsUUID('4', { message: 'targetId must be a valid UUID.' })
  targetId?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
