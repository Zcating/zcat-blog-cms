import * as Shadcn from "@blog/components/ui/pagination";

/**
 * 统一封装的分页组件：
 * - 基于 shadcn/ui 的 Pagination 组件族实现
 * - 支持页码省略号（ellipsis）展示
 * - 支持两种用法：
 *   1) 纯链接：仅传 getHref，让 <a href> 自然跳转
 *   2) 受控跳转：传 onPageChange；组件会阻止默认跳转并回调页码
 */
export interface ZPaginationProps {
  /**
   * 额外样式类名，会透传到最外层 Pagination 容器
   */
  className?: string;
  /**
   * 当前页码（从 1 开始）
   */
  currentPage: number;
  /**
   * 总页数（从 1 开始）
   */
  totalPages: number;
  /**
   * 根据页码生成链接地址，用于渲染 href
   */
  getHref?: (page: number) => string;
  /**
   * 页码改变回调；传入时组件会 e.preventDefault() 并调用该回调
   */
  onPageChange?: (page: number) => void;
}

/**
 * 生成要渲染的页码序列（包含省略号标记）。
 * 规则：
 * - 总页数 <= 7：展示全部
 * - 否则：展示首尾页 + 当前页附近页 + 头部/尾部补齐，并在断档处插入 ellipsis
 */
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

/**
 * 将当前页码归一化到合法范围：
 * - 非法值返回 1
 * - 超出范围则 clamp 到 [1, totalPages]
 */
function safePage(page: number, totalPages: number) {
  if (!Number.isFinite(page) || page <= 0) return 1;
  if (!Number.isFinite(totalPages) || totalPages <= 0) return 1;
  return Math.min(totalPages, Math.max(1, page));
}

/**
 * ZPagination：渲染分页栏（上一页 / 页码 / 下一页）
 */
export function ZPagination({
  className,
  currentPage,
  totalPages,
  getHref,
  onPageChange,
}: ZPaginationProps) {
  /**
   * 单页无需渲染分页
   */
  if (totalPages <= 1) return null;

  /**
   * 基础页码计算
   */
  const page = safePage(currentPage, totalPages);
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);
  const isFirst = page === 1;
  const isLast = page === totalPages;

  /**
   * 生成链接；不提供时给一个占位，避免 <a> 缺少 href
   */
  const hrefOf = (p: number) =>
    typeof getHref === "function" ? getHref(p) : "#";

  /**
   * 触发页码跳转回调（如果提供）
   */
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
              /**
               * 如果由外部接管跳转，则阻止默认跳转
               */
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
                  /**
                   * 如果由外部接管跳转，则阻止默认跳转
                   */
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
              /**
               * 如果由外部接管跳转，则阻止默认跳转
               */
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
