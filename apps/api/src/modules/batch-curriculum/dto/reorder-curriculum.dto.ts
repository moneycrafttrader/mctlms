import { IsArray, ValidateNested, IsUUID, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class ReorderItem {
  @IsUUID('4', { message: 'id must be a valid UUID.' })
  id!: string;

  @IsInt()
  sortOrder!: number;
}

export class ReorderCurriculumDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  items!: ReorderItem[];
}
