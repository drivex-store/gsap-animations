'use client';

// NOTE: module id: 637161
// Variable Mapping: o -> ListSizeContext, e -> value, r -> children

import { createContext, useContext } from 'react'; // NOTE: module id: 271645

const ListSizeContext = createContext(null);

export function ListSizeProvider({ value, children }) {
  return (
    <ListSizeContext.Provider value={value}>
      {children}
    </ListSizeContext.Provider>
  );
}

export function useListSize() {
  return useContext(ListSizeContext);
}
