import React from 'react';

import { classnames, isFunction, isRange } from '../utils';

import { Button } from './button';
import { Input } from './input';

interface PaginationProps {
  className?: string;
  currentPage?: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

/**
 * 分页组件
 * @param {PaginationProps} props
 * @param {string} props.className - 分页组件的类名
 * @param {number} props.currentPage - 当前页码
 * @param {number} props.totalPages - 总页数
 * @param {function} props.onPageChange - 页码改变时的回调函数
 * @returns
 */
export function Pagination({
  className,
  currentPage = 1,
  totalPages = 5,
  onPageChange,
}: PaginationProps) {
  /**
   * 当前页码，用于分页跳转
   */
  const [page, setPage] = React.useState(currentPage);

  /**
   * 目标页码，用于输入框输入
   */
  const [targetPage, setTargetPage] = React.useState(currentPage.toString());

  /**
   * 处理页码改变事件
   * @param {React.ChangeEvent<HTMLInputElement>} event - 输入框改变事件
   */
  const handlePageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTargetPage(event.target.value);
  };

  /**
   * 处理输入框失去焦点事件
   * @returns
   */
  const handleBlur = () => {
    const value = Number(targetPage);
    if (isRange(value, 1, totalPages)) {
      return;
    }
    setTargetPage(page.toString());
  };

  /**
   * 处理下一页按钮点击事件
   */
  const handleNextPage = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setTargetPage(nextPage.toString());
    if (isFunction(onPageChange)) {
      onPageChange(nextPage);
    }
  };

  /**
   * 处理上一页按钮点击事件
   */
  const handlePrevPage = () => {
    const prevPage = page - 1;
    setPage(prevPage);
    setTargetPage(prevPage.toString());
    if (isFunction(onPageChange)) {
      onPageChange(prevPage);
    }
  };

  /**
   * 处理跳转按钮点击事件
   */
  const handleGoToPage = () => {
    if (isFunction(onPageChange)) {
      onPageChange(page);
    }
  };

  return (
    <div className={classnames('join flex items-center', className)}>
      <Button
        className="join-item"
        size="sm"
        onClick={handlePrevPage}
        disabled={page === 1}
      >
        &lt;
      </Button>
      <Button
        className="join-item"
        size="sm"
        onClick={handleNextPage}
        disabled={page === totalPages}
      >
        &gt;
      </Button>
      <div className="mx-2">
        {page} / {totalPages}
      </div>
      <Input
        className="join-item min-w-12 w-20 max-w-40 text-center"
        size="sm"
        appearance="ghost"
        value={targetPage}
        onChange={handlePageChange}
        onBlur={handleBlur}
      />
      <Button className="join-item" size="sm" onClick={handleGoToPage}>
        Go
      </Button>
    </div>
  );
}
