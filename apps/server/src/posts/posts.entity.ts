import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('posts')
export class PostEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50 })
  title!: string;

  @Column({ length: 20 })
  author!: string;

  @Column('text')
  content!: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  create_time!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  update_time!: Date;

  constructor(partial: Partial<PostEntity> = {}) {
    Object.assign(this, partial);
  }
}
