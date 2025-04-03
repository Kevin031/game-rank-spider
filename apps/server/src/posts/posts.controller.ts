import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePostDto } from './dto/create-post.dto';
import { PostEntity } from './posts.entity';
import { PostsService } from './posts.service';

@ApiTags('文章')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({ summary: '获取文章列表' })
  @Get()
  async getPosts() {
    return await this.postsService.findAll();
  }

  @ApiOperation({ summary: '创建文章' })
  @Post()
  async create(@Body() post: CreatePostDto) {
    return await this.postsService.create(post);
  }

  @ApiOperation({ summary: '更新文章' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() post: PostEntity) {
    return await this.postsService.updateById(Number(id), post);
  }

  @ApiOperation({ summary: '删除文章' })
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.postsService.deleteById(Number(id));
  }

  @ApiOperation({ summary: '根据id获取文章' })
  @Get(':id')
  async getPostById(@Param('id') id: string) {
    return await this.postsService.findById(Number(id));
  }
}
