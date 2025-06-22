import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  JoinTable,
  ManyToMany,
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

  @ManyToOne(() => UserInfo, (userInfo) => userInfo.articles)
  createByUser: UserInfo;

  @ManyToMany(() => ArticleTag, (articleTag) => articleTag.articles)
  @JoinTable({
    // 此关系的联结表的表名
    name: 'article_and_article_tags',
    joinColumn: {
      name: 'articleId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'articleTagId',
      referencedColumnName: 'id',
    },
  })
  tags: ArticleTag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
