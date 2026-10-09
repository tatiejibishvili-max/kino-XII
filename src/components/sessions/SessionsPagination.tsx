interface SessionsPaginationProps {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}

export default function SessionsPagination({ page, totalPages, onPage }: SessionsPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="sessions-pagination" aria-label="Sessions pages">
      <button type="button" className="page-button" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        ‹
      </button>
      {pages.map((number) => (
        <button
          key={number}
          type="button"
          className="page-button"
          aria-label={`Page ${number}`}
          aria-current={number === page ? "page" : undefined}
          onClick={() => onPage(number)}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        className="page-button"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        ›
      </button>
    </nav>
  );
}
