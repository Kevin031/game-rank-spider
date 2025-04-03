import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateGameDto {
  @ApiProperty({
    description: '游戏标题',
    example: '塞尔达传说：荒野之息',
  })
  @IsNotEmpty({
    message: '游戏名称不能为空',
  })
  readonly title!: string;

  @ApiProperty({
    description: '游戏描述',
    example: '塞尔达传说：荒野之息是一款动作冒险游戏...',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiProperty({
    description: '游戏Logo URL',
    example: 'https://example.com/logo.png',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  readonly logo_url?: string;

  @ApiProperty({
    description: '游戏Banner URL',
    example: 'https://example.com/banner.png',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  readonly banner_url?: string;
}
