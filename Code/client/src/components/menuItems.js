import * as React from "react";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import MapIcon from '@mui/icons-material/Map';
import ElectricalServicesIcon from "@mui/icons-material/ElectricalServices";
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PermDataSettingIcon from '@mui/icons-material/PermDataSetting';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import FolderIcon from '@mui/icons-material/Folder';
import { Link } from 'react-router-dom';
export const mainMenuItems = (
  <React.Fragment>
    <ListItemButton>
      <ListItemIcon>
        <ElectricalServicesIcon />
      </ListItemIcon>
      <ListItemText>
            <Link to={`/Connect`}>Connect</Link>
        </ListItemText>
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <MapIcon />
      </ListItemIcon>
      <ListItemText>
            <Link to={`/Map`}>Map</Link>
        </ListItemText>
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <FolderIcon />
      </ListItemIcon>
      <ListItemText>
            <Link to={`/Library`}>Library</Link>
        </ListItemText>
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <PendingActionsIcon />
      </ListItemIcon>
      <ListItemText>
            <Link to={`/Plan`}>Plan</Link>
        </ListItemText>
    </ListItemButton>

  </React.Fragment>
);

// export const secondaryMenuItems = (
//     <React.Fragment>
//       <ListItemButton href="/printerControls">
//         <ListItemIcon>
//           <PermDataSettingIcon />
//         </ListItemIcon>
//         <ListItemText primary="Printer Controls" />
//       </ListItemButton>
//       <ListItemButton href="/robotControls">
//         <ListItemIcon>
//           <ManageAccountsIcon />
//         </ListItemIcon>
//         <ListItemText primary="Robot Controls" />
//       </ListItemButton>
//     </React.Fragment>
//   );

export const secondaryMenuItems = (
    <React.Fragment>
      <ListItemButton>
        <ListItemIcon>
          <PermDataSettingIcon />
        </ListItemIcon>
        <ListItemText>
            <Link to={`/printerControls`}>Printer Controls</Link>
        </ListItemText>
      </ListItemButton>
      <ListItemButton>
        <ListItemIcon>
          <ManageAccountsIcon />
        </ListItemIcon>
        <ListItemText>
            <Link to={`/robotControls`}>Robot Controls</Link>
        </ListItemText>
      </ListItemButton>
    </React.Fragment>
  );
