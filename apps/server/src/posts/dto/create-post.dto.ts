import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ description: '标题' })
  @IsNotEmpty({ message: '缺少标题' })
  readonly title!: string;

  @ApiProperty({ description: '作者' })
  @IsNotEmpty({ message: '缺少作者信息' })
  readonly author!: string;

  @ApiProperty({ description: '内容', required: false })
  readonly content?: string;
}
