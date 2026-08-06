"use client";

import { useState, useEffect } from "react";
import {
  getCategoriesAction,
  deleteCategoryAction,
  createCategoryAction,
} from "@/actions/categoryActions";
import { useParams, useRouter } from "next/navigation";
import CategoryCard from "@/components/cards/CategoryCard";
import { CreateCategoryButton } from "@/components/buttons/buttons";
import DeleteGenModal from "@/components/modals/DeleteGenModal";
import CreateCategoryModal from "@/components/modals/CreateCategoryModal";
import styles from "./page.module.css";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getCategoriesAction();

      if (result.error) {
        setError(result.error);
      } else {
        setCategories(result.data || []);
      }
    } catch (err) {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setDeleting(true);
    try {
      const result = await deleteCategoryAction(categoryToDelete.id);

      if (result.error) {
        setError(result.error);
      } else {
        setShowDeleteModal(false);
        setCategoryToDelete(null);
        // Reload categories after successful deletion
        loadCategories();
      }
    } catch (err) {
      setError("Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  const handleCreateClick = () => {
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (formData) => {
    setCreating(true);
    setError(null);

    try {
      const result = await createCategoryAction(formData);

      if (result.error) {
        setError(result.error);
        return false;
      } else {
        setShowCreateModal(false);
        // Reload categories after successful creation
        loadCategories();
        return true;
      }
    } catch (err) {
      setError("Failed to create category");
      return false;
    } finally {
      setCreating(false);
    }
  };

  const handleCreateCancel = () => {
    setShowCreateModal(false);
    setError(null);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>
            ← Back
          </button>
          <h1 className={styles.title}>Categories Management</h1>
          <CreateCategoryButton onClick={handleCreateClick} />
        </div>

        {error && (
          <div className={styles.error}>
            {typeof error === "object" ? JSON.stringify(error) : error}
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>Loading categories...</div>
        ) : (
          <div className={styles.categoryGrid}>
            {categories.length > 0 ? (
              categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onDelete={() => handleDeleteClick(category)}
                />
              ))
            ) : (
              <div className={styles.noResults}>No categories found</div>
            )}
          </div>
        )}
      </main>

      {showDeleteModal && (
        <DeleteGenModal
          isOpen={showDeleteModal}
          title="Delete Category"
          message={`Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          loading={deleting}
        />
      )}

      {showCreateModal && (
        <CreateCategoryModal
          isOpen={showCreateModal}
          onSubmit={handleCreateSubmit}
          onCancel={handleCreateCancel}
          loading={creating}
          error={error}
        />
      )}
    </div>
  );
}
