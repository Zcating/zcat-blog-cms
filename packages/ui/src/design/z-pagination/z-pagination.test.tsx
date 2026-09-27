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

  it('renders the control as soon as a second page exists, so the single page case below is the exception', () => {
    render(<ZPagination page={1} totalPages={2} />);

    expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders no paging control at all when every result fits on a single page', () => {
    const { container } = render(<ZPagination page={1} totalPages={1} />);

    expect(screen.queryByLabelText('Go to next page')).toBeNull();
    expect(screen.queryByLabelText('Go to previous page')).toBeNull();
    expect(screen.queryByText('1')).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders no paging control when there is nothing to page through', () => {
    const { container } = render(<ZPagination page={1} totalPages={0} />);

    expect(screen.queryByLabelText('Go to next page')).toBeNull();
    expect(screen.queryByLabelText('Go to previous page')).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders no paging control when the page count is not a usable number', () => {
    const { container } = render(
      <ZPagination page={1} totalPages={Number.NaN} />,
    );

    expect(screen.queryByLabelText('Go to next page')).toBeNull();
    expect(screen.queryByLabelText('Go to previous page')).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });
});
