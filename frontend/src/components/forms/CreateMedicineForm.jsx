"use client";
import { useFormStatus } from "react-dom";
import { useState } from "react";
import { SubmitButton } from "@/components/buttons/buttons";
import styles from "./CreateMedicineForm.module.css";

function FormContent({ categories, errors, successMessage }) {
  const { pending } = useFormStatus();
  const [fileName, setFileName] = useState("No file chosen");
  const [categoryInputs, setCategoryInputs] = useState([
    { id: Date.now(), value: "" },
  ]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName("No file chosen");
    }
  };

  const handleAddCategory = () => {
    setCategoryInputs([
      ...categoryInputs,
      { id: Date.now(), value: "" },
    ]);
  };

  const handleRemoveCategory = (id) => {
    if (categoryInputs.length > 1) {
      setCategoryInputs(categoryInputs.filter((input) => input.id !== id));
    }
  };

  const handleCategoryChange = (id, event) => {
    const newInputs = categoryInputs.map((input) => {
      if (input.id === id) {
        return { ...input, value: event.target.value };
      }
      return input;
    });
    setCategoryInputs(newInputs);
  };

  return (
    <>
      {successMessage && <div className={styles.success}>{successMessage}</div>}

      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.label}>
          Medicine Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
          placeholder="Enter medicine name"
          required
          disabled={pending}
        />
        {errors.name && <span className={styles.errorText}>{errors.name}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="generic_name" className={styles.label}>
          Generic Name *
        </label>
        <input
          type="text"
          id="generic_name"
          name="generic_name"
          className={`${styles.input} ${errors.generic_name ? styles.inputError : ""}`}
          placeholder="Enter generic name (e.g. Paracetamol)"
          required
          disabled={pending}
        />
        {errors.generic_name && <span className={styles.errorText}>{errors.generic_name}</span>}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Category *</label>
        {categoryInputs.map((input, index) => (
          <div key={input.id} className={styles.dynamicField}>
            <select
              id={`category-${input.id}`}
              name="category_ids[]"
              className={`${styles.select} ${errors.category ? styles.inputError : ""}`}
              required
              disabled={pending}
              value={input.value}
              onChange={(e) => handleCategoryChange(input.id, e)}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {categoryInputs.length > 1 && (
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => handleRemoveCategory(input.id)}
                disabled={pending}
              >
                -
              </button>
            )}
            {index === categoryInputs.length - 1 && (
              <button
                type="button"
                className={styles.addButton}
                onClick={handleAddCategory}
                disabled={pending}
              >
                +
              </button>
            )}
          </div>
        ))}
        {errors.category && (
          <span className={styles.errorText}>{errors.category}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.label}>
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          className={`${styles.textarea} ${
            errors.description ? styles.inputError : ""
          }`}
          placeholder="Enter medicine description"
          rows={4}
          required
          disabled={pending}
        />
        {errors.description && (
          <span className={styles.errorText}>{errors.description}</span>
        )}
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="price" className={styles.label}>
            Price *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            step="0.01"
            min="0"
            className={`${styles.input} ${
              errors.price ? styles.inputError : ""
            }`}
            placeholder="0.00"
            required
            disabled={pending}
          />
          {errors.price && (
            <span className={styles.errorText}>{errors.price}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="stock" className={styles.label}>
            Stock *
          </label>
          <input
            type="number"
            id="stock"
            name="stock"
            min="0"
            className={`${styles.input} ${
              errors.stock ? styles.inputError : ""
            }`}
            placeholder="0"
            required
            disabled={pending}
          />
          {errors.stock && (
            <span className={styles.errorText}>{errors.stock}</span>
          )}
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="dosage" className={styles.label}>
            Dosage *
          </label>
          <input
            type="text"
            id="dosage"
            name="dosage"
            className={`${styles.input} ${errors.dosage ? styles.inputError : ""}`}
            placeholder="Enter dosage"
            required
            disabled={pending}
          />
          {errors.dosage && <span className={styles.errorText}>{errors.dosage}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="brand" className={styles.label}>
            Brand *
          </label>
          <input
            type="text"
            id="brand"
            name="brand"
            className={`${styles.input} ${errors.brand ? styles.inputError : ""}`}
            placeholder="Enter medicine Brand"
            required
            disabled={pending}
          />
          {errors.brand && <span className={styles.errorText}>{errors.brand}</span>}
        </div>
      </div>

      <div className={styles.formGroup}>
        <div className={styles.Medicineinputgroup}>
          <label htmlFor="image" className={styles.Medicinelabel}>Medicine Image</label>
          

          <input
              type="file"
              id="image"
              name="image_url"
              accept="image/*"
              onChange={handleFileChange}
              className={styles.Medicinehidden}
          />

          <div className={styles.Medicinefileupload}>
              <label htmlFor="image" className={styles.Medicinebutton}>
                  Choose File
              </label>
              
              <span id="fileNameDisplay" className={styles.Medicinefilename}>{fileName}</span>
          </div>
        </div>
        {errors.image && <span className={styles.errorText}>{errors.image}</span>}
      </div>

      {errors.error && <div className={styles.error}>{errors.error}</div>}

      <div className={styles.actions}>
        <SubmitButton loading={pending}>Create Medicine</SubmitButton>
      </div>
    </>
  );
}

export default function CreateMedicineForm({
  onSubmit,
  categories,
  loading,
  errors,
  successMessage,
}) {
  const handleSubmit = async (formData) => {
    await onSubmit(formData);
  };

  return (
    <form action={handleSubmit} className={styles.form}>
      <FormContent
        categories={categories}
        errors={errors}
        successMessage={successMessage}
      />
    </form>
  );
}
