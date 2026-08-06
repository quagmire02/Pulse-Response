"use client"

import styles from "./Pagination.module.css"

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const handlePageClick = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page)
    }
  }

  const renderPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // Previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageClick(currentPage - 1)}
          className={styles.pageButton}
          aria-label="Previous page"
        >
          ‹
        </button>,
      )
    }

    // First page if not visible
    if (startPage > 1) {
      pages.push(
        <button key={1} onClick={() => handlePageClick(1)} className={styles.pageButton}>
          1
        </button>,
      )
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className={styles.ellipsis}>
            ...
          </span>,
        )
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageClick(i)}
          className={`${styles.pageButton} ${i === currentPage ? styles.active : ""}`}
        >
          {i}
        </button>,
      )
    }

    // Last page if not visible
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className={styles.ellipsis}>
            ...
          </span>,
        )
      }
      pages.push(
        <button key={totalPages} onClick={() => handlePageClick(totalPages)} className={styles.pageButton}>
          {totalPages}
        </button>,
      )
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageClick(currentPage + 1)}
          className={styles.pageButton}
          aria-label="Next page"
        >
          ›
        </button>,
      )
    }

    return pages
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={styles.pagination}>
      <div className={styles.pageNumbers}>{renderPageNumbers()}</div>
      <div className={styles.pageInfo}>
        Page {currentPage} of {totalPages}
      </div>
    </div>
  )
}
