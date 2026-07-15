import React from 'react';

import { Outlet } from "react-router-dom";

import Dashboard from "./components/Dashboard";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

import { ReactQueryDevtools } from "react-query/devtools";
import { QueryClient, QueryClientProvider } from "react-query";
import { SelectedFilesProvider } from './contexts/SelectedFilesContext';
import { useState } from 'react';
const queryClient = new QueryClient();

export default function App() {

  const [selectedFiles, setSelectedFiles] = useState({}); // Keep track of the selected files

  return (
    <QueryClientProvider client={queryClient}>
      <SelectedFilesProvider value={{ selectedFiles, setSelectedFiles }}>
        <div className="App">
          <Box sx={{ display: "flex" }}>
            <Dashboard  />
            <Box
              component="main"
              sx={{
              backgroundColor: (theme) => 
                  theme.palette.mode === "light"
                  ? theme.palette.grey[100]
                  : theme.palette.grey[900],
              flexGrow: 1,
              height: "100vh",
              overflow: "auto",
              }}
            >
            <Toolbar />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
              <Outlet />
            </Container>
            </Box>
          </Box>
        </div>
        </SelectedFilesProvider>
    <ReactQueryDevtools initialIsOpen={false}/>
    </QueryClientProvider>
    
  );
}

