import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateRankingDto {
  @IsNotEmpty()
  @IsString()
  rank_type!: string;

  @IsNotEmpty()
  @IsDate()
  rank_date!: Date;

  @IsNumber()
  position?: number;

  @IsNumber()
  fans_count?: number;

  @IsNumber()
  hits_total?: number;

  @IsNumber()
  hits_total_val?: number;

  @IsNumber()
  wish_count?: number;
}
