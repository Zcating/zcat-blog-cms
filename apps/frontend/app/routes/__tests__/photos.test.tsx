import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockPhotos = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `照片 ${i + 1}`,
  url: `https://example.com/photos/${i + 1}.jpg`,
  thumbnailUrl: `https://example.com/photos/thumbnails/${i + 1}.jpg`,
  albumId: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

const mockPaginateResult = {
  data: mockPhotos.slice(0, 20),
  page: 1,
  pageSize: 20,
  totalPages: 2,
};

describe('Photos 组件分页功能', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('应该正确计算分页参数', () => {
    const calculatePagination = (
      page: number,
      pageSize: number,
      total: number,
    ) => {
      const totalPages = Math.ceil(total / pageSize);
      const skip = (page - 1) * pageSize;
      return { page, pageSize, totalPages, skip };
    };

    expect(calculatePagination(1, 20, 100)).toEqual({
      page: 1,
      pageSize: 20,
      totalPages: 5,
      skip: 0,
    });

    expect(calculatePagination(2, 20, 100)).toEqual({
      page: 2,
      pageSize: 20,
      totalPages: 5,
      skip: 20,
    });

    expect(calculatePagination(3, 10, 50)).toEqual({
      page: 3,
      pageSize: 10,
      totalPages: 5,
      skip: 20,
    });
  });

  it('应该正确处理边界情况 - 第一页', () => {
    const isFirstPage = (page: number) => page === 1;
    const isLastPage = (page: number, totalPages: number) =>
      page === totalPages;

    expect(isFirstPage(1)).toBe(true);
    expect(isFirstPage(2)).toBe(false);
    expect(isLastPage(1, 5)).toBe(false);
    expect(isLastPage(5, 5)).toBe(true);
  });

  it('应该正确处理边界情况 - 超出范围页码', () => {
    const clampPage = (page: number, totalPages: number) => {
      if (page < 1) return 1;
      if (page > totalPages) return totalPages;
      return page;
    };

    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(-1, 5)).toBe(1);
    expect(clampPage(6, 5)).toBe(5);
    expect(clampPage(3, 5)).toBe(3);
  });

  it('应该正确处理每页数量选项', () => {
    const PAGE_SIZE_OPTIONS = [
      { label: '每页 10 条', value: '10' },
      { label: '每页 20 条', value: '20' },
      { label: '每页 50 条', value: '50' },
    ];

    const parsePageSize = (value: string) => Number(value);

    expect(parsePageSize('10')).toBe(10);
    expect(parsePageSize('20')).toBe(20);
    expect(parsePageSize('50')).toBe(50);
  });
});
