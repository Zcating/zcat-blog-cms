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

import { Photo } from '../../table/photo.entity';

import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('cms/photos')
@UseGuards(JwtAuthGuard)
export class PhotoController {
  constructor(
    @InjectRepository(Photo)
    private photoRepository: Repository<Photo>,
  ) {}

  @Get()
  async findAll(): Promise<Photo[]> {
    return this.photoRepository.find();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Photo | null> {
    return this.photoRepository.findOne({ where: { id: parseInt(id) } });
  }

  @Post()
  async create(@Body() photo: Photo): Promise<Photo> {
    return this.photoRepository.save(photo);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() photo: Photo,
  ): Promise<Photo | null> {
    await this.photoRepository.update(id, photo);
    return this.photoRepository.findOne({ where: { id: parseInt(id) } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.photoRepository.delete(id);
  }
}
