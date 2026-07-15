import axios from "axios";
import ReconnectingEventSource from "reconnecting-eventsource";
import { printerURL, getBackendURL } from "../../config";


//////// PRINTER API //////////
// https://github.com/Duet3D/RepRapFirmware/wiki/HTTP-requests
// Printer address is configurable on the Connect page (see src/config.js)


export const printerAPI = axios.create({
    baseURL: printerURL(),
    withCredentials: true,
  });

export const startPrint = (printFile) => {
  // console.log("Sending Print Directly to Printer: ", printFile);
  return printerAPI.get("/rr_gcode?gcode=M32%20" + printFile).then((response) => {
    console.log(response);
  }).catch((error) => {
    console.log(error);
  });
}

//////// BACKEND API //////////

export const mobiPrintAPI = axios.create({
    baseURL: getBackendURL(),
    withCredentials: true,

  });


//Get print files from backend server
export const fetchPrintFiles = async () => {
    return mobiPrintAPI.get("/get-files").then((response) => {
      // console.log(response);
      return response.data;
    });
  } 

export const addPrintFile = () => {
    console.log("addPrintFile");
    return mobiPrintAPI.post("/add-file", {
      name: "Test",
      description: "Test Description"
    }).then((response) => {
      // console.log(response);
      // return response.data;
    }).catch((error) => {
      console.log(error);
    });
 }

 export const addPrintCommand = ( commandDetails ) => {
  console.log("commandDetails: ", commandDetails);
  return mobiPrintAPI.post("/add-print-command", commandDetails).then((response) => {
    console.log(response);
    // return response.data;
  }).catch((error) => {
    console.log(error);
  });
}


