import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { PhotoAlbum } from '../../table/photo-album.entity';

import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/cms/photo-albums')
@UseGuards(JwtAuthGuard)
export class PhotoAlbumController {
  constructor(
    @InjectRepository(PhotoAlbum)
    private photoAlbumRepository: Repository<PhotoAlbum>,
  ) {}

  @Get()
  async findAll(): Promise<PhotoAlbum[]> {
    return this.photoAlbumRepository.find();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PhotoAlbum | null> {
    return this.photoAlbumRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['photos'],
    });
  }

  @Post()
  async create(@Body() photoAlbum: PhotoAlbum): Promise<PhotoAlbum | null> {
    return this.photoAlbumRepository.save(photoAlbum);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() photoAlbum: PhotoAlbum,
  ): Promise<PhotoAlbum | null> {
    await this.photoAlbumRepository.update(id, photoAlbum);
    return this.photoAlbumRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['photos'],
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.photoAlbumRepository.delete(id);
  }
}
