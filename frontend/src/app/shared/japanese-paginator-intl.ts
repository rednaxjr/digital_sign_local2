import { MatPaginatorIntl } from '@angular/material/paginator';

/**
 * Custom MatPaginatorIntl that localizes every Angular Material paginator
 * to Japanese. Registered globally in app.config.ts so all paginator
 * instances pick it up consistently.
 */
export function japanesePaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();

  // Replaces "Items per page:"
  intl.itemsPerPageLabel = '表示件数';
  intl.nextPageLabel = '次のページ';
  intl.previousPageLabel = '前のページ';
  intl.firstPageLabel = '最初のページ';
  intl.lastPageLabel = '最後のページ';

  intl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return `0 / ${length}`;
    }
    const start = page * pageSize;
    const end = Math.min(start + pageSize, length);
    return `${start + 1} – ${end} / ${length} 件`;
  };

  return intl;
}
