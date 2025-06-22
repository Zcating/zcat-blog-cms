import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
  JoinTable,
} from 'typeorm';

import { Photo } from './photo.entity';

@Entity()
export class PhotoAlbum {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToOne(() => Photo)
  @JoinColumn()
  cover: Photo;

  @OneToMany(() => Photo, (photo) => photo.album)
  @JoinTable({
    name: 'photo_album_and_photos',
    joinColumn: {
      name: 'photoAlbumId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'photoId',
      referencedColumnName: 'id',
    },
  })
  photos: Photo[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
