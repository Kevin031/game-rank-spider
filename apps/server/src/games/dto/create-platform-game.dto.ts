import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

export enum Platform {
  TAPTAP = 'taptap',
  STEAM = 'steam',
}

export class TagDto {
  @ApiProperty({
    description: '标签ID',
    example: 1016945,
  })
  @IsNumber()
  id!: number;

  @ApiProperty({
    description: '标签名称',
    example: '放置',
  })
  @IsString()
  value!: string;

  @ApiProperty({
    description: '标签URI',
    example: 'taptap://taptap.com/library?tag=%E6%94%BE%E7%BD%AE',
  })
  @IsString()
  uri!: string;

  @ApiProperty({
    description: '标签Web URL',
    example: '/tag/%E6%94%BE%E7%BD%AE',
  })
  @IsString()
  web_url!: string;
}

export class CreatePlatformGameDto {
  @ApiProperty({
    description: '平台',
    example: 'taptap',
  })
  @IsNotEmpty()
  @IsEnum(Platform)
  platform!: Platform;

  @ApiProperty({
    description: '平台ID',
    example: '1234567890',
  })
  @IsNotEmpty()
  @IsString()
  platform_id!: string;

  @ApiProperty({
    description: '游戏描述',
    example: '塞尔达传说：荒野之息是一款动作冒险游戏...',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '游戏URL',
    example: 'https://example.com/game',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiProperty({
    description: '游戏Logo URL',
    example: 'https://example.com/logo.png',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  logo_url?: string;

  @ApiProperty({
    description: '游戏Banner URL',
    example: 'https://example.com/banner.png',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  banner_url?: string;

  @ApiProperty({
    description: '游戏标签',
    example: [
      {
        id: 1016945,
        value: '放置',
        uri: 'taptap://taptap.com/library?tag=%E6%94%BE%E7%BD%AE',
        web_url: '/tag/%E6%94%BE%E7%BD%AE',
      },
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TagDto)
  tags?: TagDto[];
}
