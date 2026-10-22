'use client';

// NOTE: module id: 87207
// Variable Mapping: o -> CategoryContext, e -> value (or category item), r -> children

import { createContext, useContext } from 'react'; // NOTE: module id: 271645

const CategoryContext = createContext([]);

export function CategoryProvider({ value, children }) {
  return <CategoryContext.Provider value={value || []}>{children}</CategoryContext.Provider>;
}

export function useCategories() {
  return useContext(CategoryContext);
}

export function useCategoryOptions() {
  const categories = useContext(CategoryContext);
  return categories.map((category) => ({
    value: category.slug,
    label: category.name,
  }));
}

export function useCategorySlugs() {
  const categories = useContext(CategoryContext);
  return categories.map((category) => category.slug);
}
