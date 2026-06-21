import { IsString, IsUUID, IsOptional, IsNumber, IsIn } from 'class-validator';

export class ReportEventDto {
  @IsUUID()
  recordingId: string;

  @IsIn(['play', 'pause', 'seek', 'ended', 'heartbeat'])
  eventType: 'play' | 'pause' | 'seek' | 'ended' | 'heartbeat';

  @IsOptional()
  @IsNumber()
  positionSeconds?: number;

  @IsOptional()
  @IsUUID()
  playbackSessionId?: string;
}
