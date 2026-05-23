import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ZPagination } from './z-pagination';

describe('ZPagination', () => {
  it('renders page numbers', () => {
    render(<ZPagination page={1} totalPages={5} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('marks current page as active', () => {
    render(<ZPagination page={3} totalPages={5} />);

    const link = screen.getByText('3');
    expect(link.closest('[data-active="true"]')).toBeInTheDocument();
  });

  it('renders previous and next buttons', () => {
    render(<ZPagination page={3} totalPages={5} />);

    expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
  });

  it('previous button is disabled on first page', () => {
    render(<ZPagination page={1} totalPages={5} />);

    const prev = screen.getByLabelText('Go to previous page');
    expect(prev.closest('a')).toHaveClass('pointer-events-none opacity-50');
  });

  it('next button is disabled on last page', () => {
    render(<ZPagination page={5} totalPages={5} />);

    const next = screen.getByLabelText('Go to next page');
    expect(next.closest('a')).toHaveClass('pointer-events-none opacity-50');
  });

  it('calls onPageChange when a page is clicked', async () => {
    const onPageChange = vi.fn();
    render(<ZPagination page={1} totalPages={5} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByText('3'));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange when next is clicked', async () => {
    const onPageChange = vi.fn();
    render(<ZPagination page={1} totalPages={5} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByLabelText('Go to next page'));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when previous is clicked', async () => {
    const onPageChange = vi.fn();
    render(<ZPagination page={3} totalPages={5} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByLabelText('Go to previous page'));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
