# MobiPrint: A Mobile 3D Printer for Environment-Scale Design and Fabrication

By Daniel Campos Zamora, Liang He, and Jon E. Froehlich — [Makeability Lab](https://makeabilitylab.cs.washington.edu/), University of Washington

![image](https://github.com/user-attachments/assets/8df9789b-8f38-495b-b8b1-70772fc27920)
**Figure.** MobiPrint is a custom-built robotic 3D printer that autonomously maps, navigates, and prints 3D objects directly in indoor environments. MobiPrint provides a multi-stage fabrication pipeline: (1) the robotic 3D printer maps an indoor space using LiDAR scanning and obstacle detection; (2) a custom design tool converts the map into an interactive CAD canvas for editing and placing models in the physical world; (3) the MobiPrint robot prints the object directly on the ground at the defined location, as demonstrated in the far-right figure showing a cane holder printed on the floor to prevent it from falling over.

3D printing is transforming our ability to customize and create physical objects for varying applications in engineering, accessibility, and art. However, this technology is still limited to confined working areas and dedicated print beds, thereby detaching design and fabrication from real-world environments. MobiPrint is a prototype mobile fabrication system that combines elements from robotics, architecture, and Human-Computer Interaction (HCI) to enable environment-scale design and fabrication in ad-hoc indoor environments. MobiPrint consists of a robotic 3D printer and an accompanying design tool that maps an indoor space and converts it into a canvas for users to modify and arrange objects to be printed directly onto the ground.

MobiPrint was published at [UIST 2024](https://doi.org/10.1145/3654777.3676459).

## Citation

Please cite as:

```
@inproceedings{10.1145/3654777.3676459,
author = {Campos Zamora, Daniel and He, Liang and Froehlich, Jon E.},
title = {MobiPrint: A Mobile 3D Printer for Environment-Scale Design and Fabrication},
year = {2024},
isbn = {9798400706288},
publisher = {Association for Computing Machinery},
address = {New York, NY, USA},
url = {https://doi.org/10.1145/3654777.3676459},
doi = {10.1145/3654777.3676459},
booktitle = {Proceedings of the 37th Annual ACM Symposium on User Interface Software and Technology},
articleno = {38},
numpages = {10},
keywords = {3D Printing, Environment-Scale Fabrication, Mobile Fabrication},
location = {Pittsburgh, PA, USA},
series = {UIST '24}
}
```

## System Overview

MobiPrint consists of three software components plus a slicer profile, all in this repository:

| Component | Location | Role |
|---|---|---|
| **Design tool (client)** | `Code/client/` | React web app: live map canvas, model library, print placement/editing, and manual robot/printer controls |
| **Backend server** | `Code/backend/` | Flask app: stores the model library and rescales/rotates pre-sliced gcode on demand |
| **Robot firmware** | (on the robot) | [Valetudo](https://valetudo.cloud/) provides cloud-free mapping, navigation, and a REST/SSE API the design tool talks to directly |
| **Slicer profile** | `PrusaSlicer/` | PrusaSlicer config bundle that produces gcode compatible with MobiPrint's transform pipeline |

The design tool talks to three services over your local network: the robot (Valetudo API), the printer (Duet/RepRapFirmware HTTP API), and the backend.

## Requirements

1. **Python 3.11+** (backend)
2. **Node.js 18+** and npm (design tool)
3. **A LiDAR robot vacuum running [Valetudo](https://valetudo.cloud/)** (API v2), reachable on your local network
4. **A Duet-controlled 3D printer** running RepRapFirmware with its HTTP interface enabled, mounted on the robot
5. **[PrusaSlicer](https://www.prusa3d.com/page/prusaslicer_424/)** if you want to slice your own models

> **Hardware:** Build instructions for the MobiPrint robot itself (printer mount, robot modifications, wiring) are documented separately. <!-- TODO: add link to hardware guide -->

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/makeabilitylab/MobiPrint.git
cd MobiPrint
```

### 2. Start the backend

```bash
cd Code/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
flask --app backend run
```

The backend runs at `http://127.0.0.1:5000`. On first start it creates a SQLite database and preloads the default models from `Code/backend/static/default_models/`.

*To reset the model library, stop the server and delete `Code/instance/database.db` — it is rebuilt on the next start.*

### 3. Start the design tool

In a second terminal:

```bash
cd Code/client
npm install
npm start
```

The design tool opens at `http://localhost:3000`.

### 4. Connect your hardware

Open the **Connect** page in the design tool and enter:

- your **printer's IP address** (Duet),
- your **robot's IP address** (Valetudo),
- the **backend URL** (default `http://127.0.0.1:5000`).

Each field has a **Connect** button that tests the address before saving it (the robot test also reports the robot's model name). Saved addresses persist in your browser. Alternatively, set build-time defaults via `REACT_APP_ROBOT_IP`, `REACT_APP_PRINTER_IP`, and `REACT_APP_BACKEND_URL` in `Code/client/.env`.


## How to Use MobiPrint

### Mapping the space

Drive the robot through the space (or start a mapping pass from the **Map** page) so Valetudo builds a LiDAR map. The design tool renders the map live, including the robot's position and path.

### Choosing models

The **Library** page lists all models with thumbnails. Select one or more models to print, or click **Add Model** to upload your own pre-sliced `.gcode` file — it is stored in the backend library and copied to the printer's SD storage.

### Placing and editing a print

On the **Plan** page, click **Place 3D Print** and position the print object on the map at the location where it should be fabricated. Use the sliders to **rotate** (0–360°) and **scale** the model — the backend regenerates the gcode around the model's first-layer centroid so the print lands exactly where you placed it, and the transformed file is uploaded to the printer automatically.

### Printing

Click **Print**. The robot navigates to the target location; once it arrives and reports idle, the print starts automatically.

### Manual control

The **Printer Controls** page provides a G-code console, homing buttons, XYZ jogging, and an **emergency stop** (`M112`). For direct robot control beyond what the map offers, use Valetudo's own web interface at the robot's IP address.

## Slicing Your Own Models

MobiPrint transforms *pre-sliced gcode* rather than re-slicing models, so uploaded files must be sliced with the provided profile:

1. Open PrusaSlicer and import `PrusaSlicer/PrusaSlicer_config_bundle.ini` (File → Import → Import Config Bundle).
2. Slice your model with this profile. It configures MobiPrint's bed shape and, critically:
   - **0.3 mm layer height** — the scale/rotate transform assumes this value,
   - **first-layer centroid comments** (`firstLayerCenterX/Y`) — used as the pivot for scaling and rotation,
   - **embedded PNG thumbnails** — used for the library previews.
3. Export the `.gcode` and upload it via the Library page.

Files sliced without this profile are rejected by the backend with an error explaining what is missing, rather than producing a geometrically wrong print.

## Notes and Limitations

- **This is a research prototype**, provided as-is. Anyone running MobiPrint should be experienced with 3D printing and comfortable operating web-connected hardware and software, and assumes all risks of fabricating objects and running the design tool in their own environment.
- The robot and printer APIs match the firmware versions used in the prototype; substantially newer Valetudo or RepRapFirmware releases may need adjustments in `Code/client/src/mapping/api/`.
- If a live map view was open while you changed the robot's address on the Connect page, refresh the page.

## License

This project is licensed under the [MIT License](LICENSE).
