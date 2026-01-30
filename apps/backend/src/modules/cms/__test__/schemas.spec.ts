import {
  AddPhotosDtoSchema,
  CreateAlbumPhotoDtoSchema,
  CreateArticleDtoSchema,
  CreateArticleTagDtoSchema,
  CreatePageStatisticsDtoSchema,
  CreatePhotoAlbumDtoSchema,
  CreatePhotoDtoSchema,
  SetCoverDtoSchema,
  StatisticQueryDtoSchema,
  UpdateAlbumDtoSchema,
  UpdateAlbumPhotoDtoSchema,
  UpdateArticleDtoSchema,
  UpdateArticleTagDtoSchema,
  UpdatePhotoDtoSchema,
} from '../schemas';
import {
  OssConfigSchema,
  SystemSettingDtoSchema,
  SystemSettingUpdateDtoSchema,
} from '../schemas/system-setting.schema';

describe('cms schemas', () => {
  describe('article.schema', () => {
    it('CreateArticleDtoSchema 通过最小合法值', () => {
      const result = CreateArticleDtoSchema.parse({
        title: 't',
        excerpt: 'e',
        content: 'c',
      });
      expect(result).toEqual({
        title: 't',
        excerpt: 'e',
        content: 'c',
      });
    });

    it('CreateArticleDtoSchema 会将 tagIds 强制转换为 number[]', () => {
      const result = CreateArticleDtoSchema.parse({
        title: 't',
        excerpt: 'e',
        content: 'c',
        tagIds: ['1', 2],
      });
      expect(result.tagIds).toEqual([1, 2]);
    });

    it('CreateArticleDtoSchema 空标题不通过', () => {
      const parsed = CreateArticleDtoSchema.safeParse({
        title: '',
        excerpt: 'e',
        content: 'c',
      });
      expect(parsed.success).toBe(false);
    });

    it('UpdateArticleDtoSchema id 必须为正整数', () => {
      expect(
        UpdateArticleDtoSchema.safeParse({
          id: 0,
        }).success,
      ).toBe(false);

      expect(
        UpdateArticleDtoSchema.safeParse({
          id: -1,
        }).success,
      ).toBe(false);

      expect(
        UpdateArticleDtoSchema.safeParse({
          id: '1',
        }).success,
      ).toBe(true);
    });
  });

  describe('article-tag.schema', () => {
    it('CreateArticleTagDtoSchema 通过最小合法值', () => {
      expect(
        CreateArticleTagDtoSchema.parse({
          name: 'tag',
        }),
      ).toEqual({ name: 'tag' });
    });

    it('CreateArticleTagDtoSchema 空名称不通过', () => {
      const parsed = CreateArticleTagDtoSchema.safeParse({ name: '' });
      expect(parsed.success).toBe(false);
    });

    it('UpdateArticleTagDtoSchema 允许空对象', () => {
      expect(UpdateArticleTagDtoSchema.parse({})).toEqual({});
    });
  });

  describe('album.schema', () => {
    it('CreatePhotoAlbumDtoSchema 默认值与 coverId 预处理', () => {
      const a = CreatePhotoAlbumDtoSchema.parse({ name: 'a' });
      expect(a).toEqual({ name: 'a', description: '', coverId: null });

      const b = CreatePhotoAlbumDtoSchema.parse({
        name: 'a',
        coverId: '',
      });
      expect(b.coverId).toBeNull();
    });

    it('UpdateAlbumDtoSchema available 支持 true/false 字符串', () => {
      const parsed = UpdateAlbumDtoSchema.parse({
        id: '1',
        available: 'true',
      });
      expect(parsed).toEqual({ id: 1, available: true });
    });

    it('UpdateAlbumDtoSchema photoIds 会强制转换为 number[]', () => {
      const parsed = UpdateAlbumDtoSchema.parse({
        id: 1,
        photoIds: ['1', 2],
      });
      expect(parsed.photoIds).toEqual([1, 2]);
    });

    it('UpdateAlbumPhotoDtoSchema isCover 支持 true/false 字符串', () => {
      const parsed = UpdateAlbumPhotoDtoSchema.parse({
        id: '1',
        name: 'p',
        isCover: 'false',
        albumId: '2',
      });
      expect(parsed).toEqual({ id: 1, name: 'p', isCover: false, albumId: 2 });
    });

    it('CreateAlbumPhotoDtoSchema albumId 必须为正整数', () => {
      expect(
        CreateAlbumPhotoDtoSchema.safeParse({
          albumId: 0,
          name: 'n',
          url: 'u',
          thumbnailUrl: 't',
        }).success,
      ).toBe(false);
    });

    it('SetCoverDtoSchema albumId/photoId 必须为正整数', () => {
      expect(
        SetCoverDtoSchema.safeParse({
          albumId: 1,
          photoId: 1,
        }).success,
      ).toBe(true);

      expect(
        SetCoverDtoSchema.safeParse({
          albumId: 0,
          photoId: 1,
        }).success,
      ).toBe(false);
    });
  });

  describe('photo.schema', () => {
    it('CreatePhotoDtoSchema isCover 支持 true/false 字符串', () => {
      const parsed = CreatePhotoDtoSchema.parse({
        name: 'n',
        isCover: 'false',
        url: 'u',
        thumbnailUrl: 't',
      });
      expect(parsed.isCover).toBe(false);
    });

    it('CreatePhotoDtoSchema name 超长不通过', () => {
      const parsed = CreatePhotoDtoSchema.safeParse({
        name: 'a'.repeat(33),
        url: 'u',
        thumbnailUrl: 't',
      });
      expect(parsed.success).toBe(false);
    });

    it('AddPhotosDtoSchema albumId 必须为正整数', () => {
      expect(
        AddPhotosDtoSchema.safeParse({
          albumId: 0,
          photoIds: [1],
        }).success,
      ).toBe(false);
    });

    it('UpdatePhotoDtoSchema id 必须为正整数', () => {
      expect(
        UpdatePhotoDtoSchema.safeParse({
          id: -1,
        }).success,
      ).toBe(false);
    });
  });

  describe('statistic.schema', () => {
    it('StatisticQueryDtoSchema page/limit 有默认值', () => {
      const parsed = StatisticQueryDtoSchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(10);
    });

    it('StatisticQueryDtoSchema 支持 page/limit 的字符串数字与空字符串', () => {
      const a = StatisticQueryDtoSchema.parse({ page: '2', limit: '5' });
      expect(a.page).toBe(2);
      expect(a.limit).toBe(5);

      const b = StatisticQueryDtoSchema.parse({ page: '', limit: '' });
      expect(b.page).toBe(1);
      expect(b.limit).toBe(10);
    });

    it('StatisticQueryDtoSchema startDate/endDate 格式错误不通过', () => {
      expect(
        StatisticQueryDtoSchema.safeParse({
          startDate: 'not-a-date',
        }).success,
      ).toBe(false);
    });

    it('CreatePageStatisticsDtoSchema pagePath 必填', () => {
      expect(
        CreatePageStatisticsDtoSchema.safeParse({
          pagePath: '',
        }).success,
      ).toBe(false);
    });
  });

  describe('system-setting.schema', () => {
    it('OssConfigSchema 必须包含 accessKey/secretKey', () => {
      expect(
        OssConfigSchema.safeParse({
          accessKey: 'a',
          secretKey: 's',
        }).success,
      ).toBe(true);

      expect(
        OssConfigSchema.safeParse({
          accessKey: 'a',
        }).success,
      ).toBe(false);
    });

    it('SystemSettingDtoSchema ossConfig 必填', () => {
      expect(
        SystemSettingDtoSchema.safeParse({
          ossConfig: { accessKey: 'a', secretKey: 's' },
        }).success,
      ).toBe(true);

      expect(SystemSettingDtoSchema.safeParse({}).success).toBe(false);
    });

    it('SystemSettingUpdateDtoSchema ossConfig 可选', () => {
      expect(SystemSettingUpdateDtoSchema.parse({})).toEqual({});
    });
  });
});
