import { prismaService, ossService } from '../../../services';

type PhotoWithUrls = {
  url: string;
  thumbnailUrl: string;
};

function transformPhoto<T extends PhotoWithUrls>(
  photo: T,
): Omit<T, 'url' | 'thumbnailUrl'> & PhotoWithUrls {
  return {
    ...photo,
    url: ossService.getPrivateUrl(photo.url),
    thumbnailUrl: ossService.getPrivateUrl(photo.thumbnailUrl),
  };
}

export class PhotoService {
  async findAll(albumId: number | undefined, page: number, pageSize: number) {
    if (albumId !== undefined && albumId <= 0) {
      return {
        data: [],
        page,
        pageSize,
        totalPages: 0,
        total: 0,
      };
    }

    const where = albumId !== undefined ? { albumId } : {};

    const [photos, total] = await Promise.all([
      prismaService.photo.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prismaService.photo.count({ where }),
    ]);

    return {
      data: photos.map((photo) => transformPhoto(photo)),
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      total,
    };
  }

  async findEmptyAlbum() {
    const photos = await prismaService.photo.findMany({
      where: { albumId: null },
    });

    return photos.map((photo) => transformPhoto(photo));
  }

  async findById(id: number) {
    const photo = await prismaService.photo.findUnique({
      where: { id },
    });

    if (!photo) {
      return null;
    }

    return transformPhoto(photo);
  }

  async create(data: {
    name?: string;
    url?: string;
    thumbnailUrl?: string;
    albumId?: number | null;
  }) {
    const photo = await prismaService.photo.create({
      data: {
        name: data.name ?? '',
        url: data.url || '',
        thumbnailUrl: data.thumbnailUrl || '',
        albumId: data.albumId,
      },
    });

    return transformPhoto(photo);
  }

  async update(
    id: number,
    data: {
      name?: string;
      url?: string;
      thumbnailUrl?: string;
      albumId?: number | null;
    },
  ) {
    const photo = await prismaService.photo.update({
      where: { id },
      data: {
        name: data.name,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        albumId: data.albumId,
      },
    });

    return transformPhoto(photo);
  }

  async updateWithAlbum(
    id: number,
    albumId: number,
    data: {
      name?: string;
      url?: string;
      thumbnailUrl?: string;
      isCover?: boolean;
    },
  ) {
    if (data.isCover) {
      await prismaService.photoAlbum.update({
        where: { id: albumId },
        data: { coverId: id },
      });
    }

    const updatedPhoto = await prismaService.photo.update({
      where: { id },
      data: {
        name: data.name,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        albumId,
      },
    });

    return {
      ...transformPhoto(updatedPhoto),
      albumId,
      isCover: data.isCover,
    };
  }

  async delete(id: number) {
    const photo = await prismaService.photo.findUnique({
      where: { id },
    });

    if (!photo) {
      return false;
    }

    await Promise.allSettled([
      ossService.deleteFile(photo.url),
      ossService.deleteFile(photo.thumbnailUrl),
    ]);

    await prismaService.photo.delete({
      where: { id },
    });

    return true;
  }
}

export const photoService = new PhotoService();
