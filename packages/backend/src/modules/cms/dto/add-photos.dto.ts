import { IsArray, IsNumber } from 'class-validator';

export class AddPhotosDto {
  @IsNumber()
  albumId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  photoIds: number[];
}
