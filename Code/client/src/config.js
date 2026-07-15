// Central endpoint configuration for the three services MobiPrint talks to:
// the Valetudo robot, the Duet 3D printer, and the Flask backend.
//
// Resolution order:
//   1. Value saved from the Connect page (localStorage, per-browser)
//   2. REACT_APP_* env var (set at build time, e.g. in a .env file)
//   3. Hardcoded lab default
//
// Robot and printer are stored as bare hosts (IP or hostname, no protocol);
// the backend is stored as a full origin URL.

const KEYS = {
    robotIP: "mobiprint.robotIP",
    printerIP: "mobiprint.printerIP",
    backendURL: "mobiprint.backendURL",
};

const DEFAULTS = {
    robotIP: process.env.REACT_APP_ROBOT_IP || "192.168.1.18",
    printerIP: process.env.REACT_APP_PRINTER_IP || "192.168.1.19",
    backendURL: process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:5000",
};

const get = (key) => localStorage.getItem(KEYS[key]) || DEFAULTS[key];

export const getRobotIP = () => get("robotIP");
export const getPrinterIP = () => get("printerIP");
export const getBackendURL = () => get("backendURL");

export const setRobotIP = (host) => localStorage.setItem(KEYS.robotIP, host);
export const setPrinterIP = (host) => localStorage.setItem(KEYS.printerIP, host);
export const setBackendURL = (url) => localStorage.setItem(KEYS.backendURL, url);

// Full base URLs used by the API layers
export const robotAPIBase = () => `http://${getRobotIP()}/api/v2`;
export const printerURL = () => `http://${getPrinterIP()}`;
