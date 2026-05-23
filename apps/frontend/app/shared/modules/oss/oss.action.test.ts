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

  describe('updateUserInfo', () => {
    it('uploads avatar and updates user info when avatar is a blob URL', async () => {
      const mockBlob = new Blob(['fake-avatar'], { type: 'image/jpeg' });
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
      fetchMock
        .mockResolvedValueOnce({
          blob: () => Promise.resolve(mockBlob),
        } as Response)
        .mockResolvedValueOnce({ ok: true } as Response);

      mockGetUploadUrl.mockResolvedValueOnce({
        presignedUrl: 'http://localhost:9000/user/abc.jpg?signed=123',
      });

      mockUpdateUserInfo.mockResolvedValueOnce({
        name: 'Updated',
        contact: { email: 'a@b.com', github: 'u' },
        occupation: '',
        avatar: 'user/abc.jpg',
        aboutMe: '',
        abstract: '',
      });

      const result = await OssAction.updateUserInfo({
        name: 'Updated',
        contact: { email: 'a@b.com', github: 'u' },
        avatar: 'blob:http://localhost/test-avatar',
      });

      expect(result).toBeDefined();
      expect(result.avatar).toBe('user/abc.jpg');
      expect(mockGetUploadUrl).toHaveBeenCalledTimes(1);
      expect(mockUpdateUserInfo).toHaveBeenCalledWith({
        name: 'Updated',
        contact: { email: 'a@b.com', github: 'u' },
        avatar: expect.stringMatching(/^user\/.*\.(jpg|jpeg)$/),
      });
    });

    it('skips upload and calls api directly when avatar is not a blob URL', async () => {
      mockUpdateUserInfo.mockResolvedValueOnce({
        name: 'Updated',
        contact: { email: 'a@b.com', github: 'u' },
        occupation: '',
        avatar: '',
        aboutMe: '',
        abstract: '',
      });

      const result = await OssAction.updateUserInfo({
        name: 'Updated',
        contact: { email: 'a@b.com', github: 'u' },
        avatar: 'existing-key.jpg',
      });

      expect(result).toBeDefined();
      expect(mockGetUploadUrl).not.toHaveBeenCalled();
      expect(mockUpdateUserInfo).toHaveBeenCalledWith({
        name: 'Updated',
        contact: { email: 'a@b.com', github: 'u' },
        avatar: undefined,
      });
    });

    it('throws when upload fails', async () => {
      const mockBlob = new Blob(['fake-avatar'], { type: 'image/jpeg' });
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
      fetchMock
        .mockResolvedValueOnce({
          blob: () => Promise.resolve(mockBlob),
        } as Response)
        .mockResolvedValueOnce({ ok: false, status: 500 } as Response);

      mockGetUploadUrl.mockResolvedValueOnce({
        presignedUrl: 'http://localhost:9000/user/abc.jpg?signed=123',
      });

      await expect(
        OssAction.updateUserInfo({
          name: 'Test',
          contact: { email: 'a@b.com', github: 'u' },
          avatar: 'blob:http://localhost/test-avatar',
        }),
      ).rejects.toThrow('Upload failed: 500');
    });
  });
});
