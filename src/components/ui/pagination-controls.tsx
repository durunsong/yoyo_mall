/**
 * 分页控制组件
 * 提供完整的分页导航，包括页码按钮
 */

'use client';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean; // 是否显示首页/末页按钮
  maxVisiblePages?: number; // 最多显示多少个页码按钮
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisiblePages = 7,
}: PaginationControlsProps) {
  // 如果只有一页或没有页面，不显示分页
  if (totalPages <= 1) {
    return null;
  }

  // 生成要显示的页码数组
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];

    // 如果总页数小于等于最大可见页数，显示所有页码
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // 计算显示范围
    const halfVisible = Math.floor((maxVisiblePages - 3) / 2); // 减去首页、末页和一个省略号的位置
    let startPage = Math.max(2, currentPage - halfVisible);
    let endPage = Math.min(totalPages - 1, currentPage + halfVisible);

    // 调整范围以保持一致的页码数量
    if (currentPage <= halfVisible + 2) {
      endPage = Math.min(totalPages - 1, maxVisiblePages - 2);
    } else if (currentPage >= totalPages - halfVisible - 1) {
      startPage = Math.max(2, totalPages - maxVisiblePages + 3);
    }

    // 始终显示第一页
    pages.push(1);

    // 如果起始页不是第二页，显示省略号
    if (startPage > 2) {
      pages.push('ellipsis');
    }

    // 显示中间页码
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // 如果结束页不是倒数第二页，显示省略号
    if (endPage < totalPages - 1) {
      pages.push('ellipsis');
    }

    // 始终显示最后一页
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <Pagination>
      <PaginationContent>
        {/* 上一页按钮 */}
        <PaginationItem>
          <PaginationPrevious
            onClick={() => {
              if (currentPage > 1) {
                onPageChange(currentPage - 1);
              }
            }}
            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>

        {/* 页码按钮 */}
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          return (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {/* 下一页按钮 */}
        <PaginationItem>
          <PaginationNext
            onClick={() => {
              if (currentPage < totalPages) {
                onPageChange(currentPage + 1);
              }
            }}
            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

