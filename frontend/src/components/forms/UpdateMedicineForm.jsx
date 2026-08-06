"use client"
import { useFormStatus } from "react-dom"
import { useState } from "react";
import {SubmitButton} from "@/components/buttons/buttons"
import styles from "./UpdateMedicineForm.module.css"

function FormContent({ medicine, categories, errors, successMessage }) {
  const { pending } = useFormStatus()
  const [fileName, setFileName] = useState("No file chosen");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName("No file chosen");
    }
  }

  return (
    <>
      {successMessage && <div className={styles.success}>{successMessage}</div>}

      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.label}>
          Medicine Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={medicine.name}
          className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
          placeholder="Enter medicine name"
          disabled={pending}
        />
        {errors.name && <span className={styles.errorText}>{errors.name}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="category" className={styles.label}>
          Category
        </label>
        <select
          id="category"
          name="category_ids[]"
          defaultValue={medicine.categories?.[0]?.id}
          className={`${styles.select} ${errors.category_ids ? styles.inputError : ""}`}
          disabled={pending}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.category_ids && <span className={styles.errorText}>{errors.category_ids}</span>}
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="brand" className={styles.label}>Brand</label>
          <input
            type="text"
            id="brand"
            name="brand"
            defaultValue={medicine.brand}
            className={`${styles.input} ${errors.brand ? styles.inputError : ""}`}
            placeholder="Enter brand name"
            disabled={pending}
          />
          {errors.brand && <span className={styles.errorText}>{errors.brand}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="dosage" className={styles.label}>Dosage</label>
          <input
            type="text"
            id="dosage"
            name="dosage"
            defaultValue={medicine.dosage}
            className={`${styles.input} ${errors.dosage ? styles.inputError : ""}`}
            placeholder="e.g. 500mg"
            disabled={pending}
          />
          {errors.dosage && <span className={styles.errorText}>{errors.dosage}</span>}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.label}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={medicine.description}
          className={`${styles.textarea} ${errors.description ? styles.inputError : ""}`}
          placeholder="Enter medicine description"
          rows={4}
          disabled={pending}
        />
        {errors.description && <span className={styles.errorText}>{errors.description}</span>}
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="price" className={styles.label}>
            Price
          </label>
          <input
            type="number"
            id="price"
            name="price"
            step="0.01"
            min="0"
            defaultValue={medicine.price}
            className={`${styles.input} ${errors.price ? styles.inputError : ""}`}
            placeholder="0.00"
            disabled={pending}
          />
          {errors.price && <span className={styles.errorText}>{errors.price}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="stock" className={styles.label}>
            Stock
          </label>
          <input
            type="number"
            id="stock"
            name="stock"
            min="0"
            defaultValue={medicine.stock}
            className={`${styles.input} ${errors.stock ? styles.inputError : ""}`}
            placeholder="0"
            disabled={pending}
          />
          {errors.stock && <span className={styles.errorText}>{errors.stock}</span>}
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
        <SubmitButton loading={pending}>Update Medicine</SubmitButton>
      </div>
    </>
  )
}

export default function UpdateMedicineForm({ onSubmit, medicine, categories, loading, errors, successMessage }) {
  const handleSubmit = async (formData) => {
    await onSubmit(formData)
  }

  return (
    <form action={handleSubmit} className={styles.form}>
      <FormContent medicine={medicine} categories={categories} errors={errors} successMessage={successMessage} />
    </form>
  )
}

