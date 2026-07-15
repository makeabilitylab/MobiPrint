import React from 'react';
import ReactDOM from 'react-dom/client';
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import './index.css';
import App from './App';
import Connect from "./pages/Connect";
import PrinterControls from "./pages/PrinterControls";
import RobotControls from "./pages/RobotControls";
import Library from "./pages/Library";
import Plan from "./pages/Plan";
import Map from "./pages/Map";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
const root = ReactDOM.createRoot(document.getElementById('root'));
const defaultTheme = createTheme();

const router = createBrowserRouter([
  { path: "/", 
    element: <App />, 
    children: [
        { path: "/Connect", element: <Connect /> },
        { path: "/Map", element: <Map />},
        { path: "/Plan", element: <Plan /> },
        { path: "/Library", element: <Library /> },
        { path: "/printerControls", element: <PrinterControls /> },
        { path: "/robotControls", element: <RobotControls /> },
    ],
    },
  ]);

root.render(
  <ThemeProvider theme={defaultTheme}>
    <CssBaseline />
      <RouterProvider router={router} />
  </ThemeProvider>
);