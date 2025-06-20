import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

import { ArticleTag } from './article-tag.entity';
import { UserInfo } from './user-info.entity';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  excerpt: string;

  @Column()
  contentUrl: string;

  @ManyToOne(() => UserInfo)
  createByUser: UserInfo;

  @OneToMany(() => ArticleTag, (articleTag) => articleTag.articles)
  @JoinColumn()
  tags: ArticleTag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
