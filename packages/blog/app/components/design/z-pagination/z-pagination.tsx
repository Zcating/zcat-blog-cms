import * as Shadcn from "@blog/components/ui/pagination";

export interface ZPaginationProps {
  className?: string;
  currentPage: number;
  totalPages: number;
  getHref?: (page: number) => string;
  onPageChange?: (page: number) => void;
}

function getPageItems(
  totalPages: number,
  currentPage: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalPages]);
  for (let p = currentPage - 1; p <= currentPage + 1; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }

  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }

  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const items: Array<number | "ellipsis"> = [];
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i]!;
    const prev = sorted[i - 1];
    if (i > 0 && prev != null && p - prev > 1) {
      items.push("ellipsis");
    }
    items.push(p);
  }

  return items;
}

function safePage(page: number, totalPages: number) {
  if (!Number.isFinite(page) || page <= 0) return 1;
  if (!Number.isFinite(totalPages) || totalPages <= 0) return 1;
  return Math.min(totalPages, Math.max(1, page));
}

export function ZPagination({
  className,
  currentPage,
  totalPages,
  getHref,
  onPageChange,
}: ZPaginationProps) {
  if (totalPages <= 1) return null;

  const page = safePage(currentPage, totalPages);
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);
  const isFirst = page === 1;
  const isLast = page === totalPages;

  const hrefOf = (p: number) =>
    typeof getHref === "function" ? getHref(p) : "#";
  const jump = (p: number) => {
    if (typeof onPageChange !== "function") return;
    onPageChange(p);
  };

  return (
    <Shadcn.Pagination className={className}>
      <Shadcn.PaginationContent>
        <Shadcn.PaginationItem>
          <Shadcn.PaginationPrevious
            href={hrefOf(prevPage)}
            onClick={(e) => {
              if (typeof onPageChange === "function") e.preventDefault();
              if (isFirst) return;
              jump(prevPage);
            }}
            className={isFirst ? "pointer-events-none opacity-50" : ""}
          />
        </Shadcn.PaginationItem>

        {getPageItems(totalPages, page).map((item, index) => {
          if (item === "ellipsis") {
            return (
              <Shadcn.PaginationItem key={`ellipsis-${index.toString()}`}>
                <Shadcn.PaginationEllipsis />
              </Shadcn.PaginationItem>
            );
          }

          const p = item;
          const isActive = p === page;
          return (
            <Shadcn.PaginationItem key={p.toString()}>
              <Shadcn.PaginationLink
                href={hrefOf(p)}
                isActive={isActive}
                onClick={(e) => {
                  if (typeof onPageChange === "function") e.preventDefault();
                  if (isActive) return;
                  jump(p);
                }}
              >
                {p}
              </Shadcn.PaginationLink>
            </Shadcn.PaginationItem>
          );
        })}

        <Shadcn.PaginationItem>
          <Shadcn.PaginationNext
            href={hrefOf(nextPage)}
            onClick={(e) => {
              if (typeof onPageChange === "function") e.preventDefault();
              if (isLast) return;
              jump(nextPage);
            }}
            className={isLast ? "pointer-events-none opacity-50" : ""}
          />
        </Shadcn.PaginationItem>
      </Shadcn.PaginationContent>
    </Shadcn.Pagination>
  );
}
