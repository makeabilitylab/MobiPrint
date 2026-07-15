import axios from "axios";

import { printerURL, getBackendURL } from "../../config";
//////// PRINTER API //////////
// https://github.com/Duet3D/RepRapFirmware/wiki/HTTP-requests
// Printer address is configurable on the Connect page (see src/config.js)

export const printerAPI = axios.create({
    baseURL: printerURL(),
  });

export const startPrint = (printFile) => {
  return printerAPI.get("/rr_gcode?gcode=M32%20" + printFile).catch((error) => {
    console.error("Failed to start print:", error);
  });
}

//////// BACKEND API //////////

export const mobiPrintAPI = axios.create({
    baseURL: getBackendURL(),
  });

//Get print files from backend server
export const fetchPrintFiles = async () => {
    return mobiPrintAPI.get("/get-files").then((response) => {
      return response.data;
    });
  }

export const addPrintFile = () => {
    return mobiPrintAPI.post("/add-file", {
      name: "Test",
      description: "Test Description"
    }).catch((error) => {
      console.error("Failed to add print file:", error);
    });
 }

 export const addPrintCommand = ( commandDetails ) => {
  return mobiPrintAPI.post("/add-print-command", commandDetails).catch((error) => {
    console.error("Failed to add print command:", error);
  });
}
