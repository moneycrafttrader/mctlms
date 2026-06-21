import { IsUUID, IsOptional, IsString } from 'class-validator';

export class RequestJoinDto {
  @IsUUID()
  sessionId: string;
}

export class JoinTokenResponse {
  token: string;
  expiresInSeconds: number;
}

export class JoinUrlResponse {
  joinUrl: string;
  meetingNumber?: string;
  sessionId: string;
}
