import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockCompressorInit = vi.hoisted(() => vi.fn());

vi.mock('compressorjs', () => ({
  default: vi.fn().mockImplementation(function (
    this: unknown,
    file: Blob,
    options: { success: (result: Blob) => void },
  ) {
    mockCompressorInit(file, options);
    setTimeout(
      () => options.success(new Blob(['compressed'], { type: file.type })),
      0,
    );
  }),
}));

const mockCreatePhoto = vi.hoisted(() => vi.fn());
const mockUpdatePhoto = vi.hoisted(() => vi.fn());
const mockDeletePhoto = vi.hoisted(() => vi.fn());
const mockUploadArticleImages = vi.hoisted(() => vi.fn());
const mockCreateArticle = vi.hoisted(() => vi.fn());
const mockUpdateArticle = vi.hoisted(() => vi.fn());
const mockUpdateUserInfo = vi.hoisted(() => vi.fn());
const mockGetUploadUrl = vi.hoisted(() => vi.fn());

vi.mock('@cms/api', () => ({
  PhotosApi: {
    createPhoto: mockCreatePhoto,
    updatePhoto: mockUpdatePhoto,
    deletePhoto: mockDeletePhoto,
  },
  ArticlesApi: {
    uploadArticleImages: mockUploadArticleImages,
    createArticle: mockCreateArticle,
    updateArticle: mockUpdateArticle,
  },
  UserApi: {
    updateUserInfo: mockUpdateUserInfo,
  },
  SystemSettingApi: {
    getUploadUrl: mockGetUploadUrl,
  },
}));

import { OssAction } from './oss.action';

describe('OssAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  describe('createPhoto', () => {
    it('uploads image and creates photo record', async () => {
      const mockBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      const mockCompressedBlob = new Blob(['compressed'], {
        type: 'image/jpeg',
      });

      mockCompressorInit.mockImplementation(function (
        _file: Blob,
        options: { success: (result: Blob) => void },
      ) {
        setTimeout(() => options.success(mockCompressedBlob), 0);
      });

      const fetchMock = vi.mocked(globalThis.fetch);
      fetchMock.mockResolvedValueOnce({
        blob: () => Promise.resolve(mockBlob),
      } as Response);

      mockGetUploadUrl
        .mockResolvedValueOnce({
          presignedUrl:
            'http://localhost:9000/photos-bucket/photos/123.jpg?presigned=abc',
        })
        .mockResolvedValueOnce({
          presignedUrl:
            'http://localhost:9000/photos-bucket/photos/123.thumbnail.jpg?presigned=def',
        });

      fetchMock
        .mockResolvedValueOnce({ ok: true } as Response)
        .mockResolvedValueOnce({ ok: true } as Response);

      mockCreatePhoto.mockResolvedValueOnce({
        id: 1,
        name: 'test photo',
        url: 'photos/123.jpg',
        thumbnailUrl: 'photos/123.thumbnail.jpg',
      });

      const result = await OssAction.createPhoto({
        name: 'test photo',
        image: 'blob:http://localhost/test-blob',
      });

      expect(result).toBeDefined();
      expect(result).toMatchObject({
        id: 1,
        name: 'test photo',
      });
      expect(mockGetUploadUrl).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenCalledTimes(3); // 1 blob fetch + 2 PUT
      expect(mockCreatePhoto).toHaveBeenCalledWith({
        name: 'test photo',
        url: expect.stringMatching(/^photos\/.*\.(jpg|jpeg)$/),
        thumbnailUrl: expect.stringMatching(
          /^photos\/.*\.thumbnail\.(jpg|jpeg)$/,
        ),
      });
    });
  });
});
