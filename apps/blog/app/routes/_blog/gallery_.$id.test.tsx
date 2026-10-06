import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getGalleryDetailMock } = vi.hoisted(() => ({
  getGalleryDetailMock: vi.fn(),
}));

vi.mock('@blog/server/gallery', async () => {
  const actual = await vi.importActual<typeof import('@blog/server/gallery')>(
    '@blog/server/gallery',
  );
  return {
    ...actual,
    getGalleryDetail: (...args: unknown[]) => getGalleryDetailMock(...args),
  };
});

// --- import after mocks ---

import { ApiErrorException, envelopeToApiError } from '@blog/server/errors';
import { ResponseValidationError } from '@blog/server/result';

import { Route, loader } from './gallery_.$id';

function apiErrorFromEnvelope(body: unknown): ApiErrorException {
  const apiError = envelopeToApiError(body);
  if (!apiError) throw new Error('envelope carried no error');
  return new ApiErrorException(apiError);
}

const GALLERY_DETAIL = {
  id: 3,
  name: '旅行',
  description: '在路上',
  cover: {
    id: 30,
    name: 'cover.jpg',
    url: 'photos/30.jpg',
    signedUrl: 'https://bucket.example/30.jpg?sig=1',
    signedThumbnailUrl: 'https://bucket.example/30.thumbnail.jpg?sig=1',
    thumbnailUrl: 'photos/30-thumb.jpg',
    albumId: 3,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  photos: [
    {
      id: 30,
      name: 'cover.jpg',
      url: 'photos/30.jpg',
      signedUrl: 'https://bucket.example/30.jpg?sig=1',
      signedThumbnailUrl: 'https://bucket.example/30.thumbnail.jpg?sig=1',
      thumbnailUrl: 'photos/30-thumb.jpg',
      albumId: 3,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 31,
      name: 'street.jpg',
      url: 'photos/31.jpg',
      signedUrl: 'https://bucket.example/31.jpg?sig=1',
      signedThumbnailUrl: 'https://bucket.example/31.thumbnail.jpg?sig=1',
      thumbnailUrl: 'photos/31-thumb.jpg',
      albumId: 3,
      createdAt: '2026-01-03T00:00:00.000Z',
      updatedAt: '2026-01-03T00:00:00.000Z',
    },
  ],
};

describe('route loader: /_blog/gallery/$id', () => {
  beforeEach(() => {
    getGalleryDetailMock.mockReset();
    getGalleryDetailMock.mockResolvedValue(GALLERY_DETAIL);
  });

  it('forwards the raw URL id segment as a string, without coercing it to a number', async () => {
    const result = await loader({ params: { id: '3' } });

    expect(getGalleryDetailMock).toHaveBeenCalledTimes(1);
    expect(getGalleryDetailMock.mock.calls[0]?.[0]).toEqual({
      data: { id: '3' },
    });
    expect(result.gallery).toEqual(GALLERY_DETAIL);
  });

  it('rejects an id outside the id contract without calling the backend', async () => {
    await expect(loader({ params: { id: '3/4' } })).rejects.toMatchObject({
      isNotFound: true,
    });
    expect(getGalleryDetailMock).not.toHaveBeenCalled();
  });

  it('rejects a missing id parameter without calling the backend', async () => {
    await expect(loader({ params: {} })).rejects.toMatchObject({
      isNotFound: true,
    });
    expect(getGalleryDetailMock).not.toHaveBeenCalled();
  });

  it('wires both boundaries, so a backend failure cannot fall through to the root error screen', () => {
    expect(Route.options.notFoundComponent).toBeTypeOf('function');
    expect(Route.options.errorComponent).toBeTypeOf('function');
  });

  it('renders the 相册不存在 copy from the not-found boundary', () => {
    const NotFound = Route.options.notFoundComponent;
    if (!NotFound) throw new Error('route has no notFoundComponent');

    render(<NotFound isNotFound={true} routeId={Route.id} />);

    expect(screen.getByText('相册不存在')).toBeInTheDocument();
  });

  it('turns the missing-album envelope the backend actually sends into a not-found, so the friendly screen is served with 404', async () => {
    getGalleryDetailMock.mockRejectedValue(
      apiErrorFromEnvelope({ code: 'ERR0007', message: '相册不存在' }),
    );

    const error = await loader({ params: { id: '999' } }).catch(
      (thrown: unknown) => thrown,
    );

    expect(error).toMatchObject({ isNotFound: true });
    expect(error).not.toBeInstanceOf(ApiErrorException);
    expect(getGalleryDetailMock).toHaveBeenCalledTimes(1);
  });

  it('still serves a not-found after the backend rewords its message, because the code decides', async () => {
    getGalleryDetailMock.mockRejectedValue(
      apiErrorFromEnvelope({ code: 'ERR0007', message: '该相册已被移除' }),
    );

    const error = await loader({ params: { id: '999' } }).catch(
      (thrown: unknown) => thrown,
    );

    expect(error).toMatchObject({ isNotFound: true });
  });

  it('keeps a denied token as an error, because not-allowed is not does-not-exist', async () => {
    getGalleryDetailMock.mockRejectedValue(
      apiErrorFromEnvelope({ code: 'ERR0002', message: '登录验证错误' }),
    );

    const error = await loader({ params: { id: '999' } }).catch(
      (thrown: unknown) => thrown,
    );

    expect(error).toBeInstanceOf(ApiErrorException);
    expect(error).not.toMatchObject({ isNotFound: true });
  });

  it('leaves a database fault as an error, so a transport fault is not masked as a 404', async () => {
    getGalleryDetailMock.mockRejectedValue(
      apiErrorFromEnvelope({ code: 'ERR0003', message: '数据库异常' }),
    );

    const error = await loader({ params: { id: '999' } }).catch(
      (thrown: unknown) => thrown,
    );

    expect(error).toBeInstanceOf(ApiErrorException);
    expect(error).not.toMatchObject({ isNotFound: true });
  });

  it('leaves a malformed album payload as an error, so a transport fault is not masked as a 404', async () => {
    getGalleryDetailMock.mockRejectedValue(
      new ResponseValidationError(
        'Response envelope failed schema validation',
        { code: '0000', message: 'success', data: { id: '999' } },
        [{ path: 'data.description', message: 'Invalid input' }],
      ),
    );

    const error = await loader({ params: { id: '999' } }).catch(
      (thrown: unknown) => thrown,
    );

    expect(error).toBeInstanceOf(ResponseValidationError);
    expect(error).not.toMatchObject({ isNotFound: true });
  });
});
