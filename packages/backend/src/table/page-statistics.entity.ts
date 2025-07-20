import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity()
@Index(['pagePath', 'visitDate'], { unique: false })
export class PageStatistics {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    comment: '页面路径',
  })
  pagePath: string;

  @Column({
    comment: '页面标题',
    nullable: true,
  })
  pageTitle?: string;

  @Column({
    comment: '访问次数',
    default: 0,
  })
  visitCount: number;

  @Column({
    comment: '独立访客数',
    default: 0,
  })
  uniqueVisitors: number;

  @Column({
    type: 'date',
    comment: '访问日期',
  })
  visitDate: Date;

  @Column({
    comment: '访客IP地址',
    nullable: true,
  })
  visitorIp?: string;

  @Column({
    comment: '用户代理',
    type: 'text',
    nullable: true,
  })
  userAgent?: string;

  @Column({
    comment: '来源页面',
    nullable: true,
  })
  referrer?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
