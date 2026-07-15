// contexts/SelectedFilesContext.js
import React, { createContext, useContext, useState } from 'react';

const SelectedFilesContext = createContext();

export const SelectedFilesProvider = ({ children }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  // Provider logic
  return (
    <SelectedFilesContext.Provider value={{ selectedFiles, setSelectedFiles }}>
      {children}
    </SelectedFilesContext.Provider>
  );
};

export const useSelectedFiles = () => useContext(SelectedFilesContext);
