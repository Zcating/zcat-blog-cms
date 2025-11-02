import React from 'react';
import { Button } from './button';
import { Input } from './input';
import { classnames, isFunction, isRange } from '../utils';

interface PaginationProps {
  className?: string;
  currentPage?: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

export function Pagination({
  className,
  currentPage = 1,
  totalPages = 5,
  onPageChange,
}: PaginationProps) {
  const [page, setPage] = React.useState(currentPage);

  const [targetPage, setTargetPage] = React.useState(currentPage.toString());

  const handlePageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTargetPage(event.target.value);
  };

  const handleBlur = () => {
    const value = Number(targetPage);
    if (isRange(value, 1, totalPages)) {
      return;
    }
    setTargetPage(page.toString());
  };

  const handleNextPage = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setTargetPage(nextPage.toString());
    if (isFunction(onPageChange)) {
      onPageChange(nextPage);
    }
  };
  const handlePrevPage = () => {
    const prevPage = page - 1;
    setPage(prevPage);
    setTargetPage(prevPage.toString());
    if (isFunction(onPageChange)) {
      onPageChange(prevPage);
    }
  };
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
