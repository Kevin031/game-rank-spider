import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from './posts.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
  ) {}

  async create(post: Partial<PostEntity>): Promise<PostEntity> {
    return await this.postRepository.save(post);
  }

  async findAll(): Promise<PostEntity[]> {
    return await this.postRepository.find();
  }

  async findById(id: number): Promise<PostEntity> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new HttpException('文章不存在', HttpStatus.BAD_REQUEST);
    }
    return post;
  }

  async updateById(id: number, post: Partial<PostEntity>): Promise<PostEntity> {
    const oldPost = await this.postRepository.findOne({ where: { id } });
    if (!oldPost) {
      throw new HttpException('文章不存在', HttpStatus.BAD_REQUEST);
    }
    return await this.postRepository.save({ ...oldPost, ...post });
  }

  async deleteById(id: number): Promise<PostEntity> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new HttpException('文章不存在', HttpStatus.BAD_REQUEST);
    }
    return await this.postRepository.remove(post);
  }
}
