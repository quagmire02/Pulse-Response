"use client"

import styles from "./MedicineSidebar.module.css"

export default function MedicineSidebar({ categories, currentFilters, onFilterChange, isOpen, onClose }) {
  const handleCategoryChange = (e) => {
    onFilterChange({ category: e.target.value })
  }

  const handleAvailabilityChange = (e) => {
    onFilterChange({ is_available: e.target.value })
  }

  const handleSortChange = (e) => {
    onFilterChange({ sort_by_price: e.target.value })
  }

  const clearFilters = () => {
    onFilterChange({
      category: "",
      is_available: "",
      sort_by_price: "",
    })
  }

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose}></div>}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.header}>
          <h3>Filters</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.filterGroup}>
            <label htmlFor="category" className={styles.label}>
              Category
            </label>
            <select
              id="category"
              value={currentFilters.category}
              onChange={handleCategoryChange}
              className={styles.select}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="availability" className={styles.label}>
              Availability
            </label>
            <select
              id="availability"
              value={currentFilters.is_available}
              onChange={handleAvailabilityChange}
              className={styles.select}
            >
              <option value="">All Items</option>
              <option value="true">Available Only</option>
              <option value="false">Unavailable Only</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="sort" className={styles.label}>
              Sort by Price
            </label>
            <select
              id="sort"
              value={currentFilters.sort_by_price}
              onChange={handleSortChange}
              className={styles.select}
            >
              <option value="">Default</option>
              <option value="asc">Price: Low to High</option>
              <option value="desc">Price: High to Low</option>
            </select>
          </div>

          <button onClick={clearFilters} className={styles.clearButton}>
            Clear All Filters
          </button>
        </div>
      </aside>
    </>
  )
}
