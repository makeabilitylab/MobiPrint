import React from "react";
import { Box, Button, CircularProgress, styled, Typography } from "@mui/material";
import LiveMap from "./LiveMap";
import "./ValetudoMap.css";
import { Capability, useMapSegmentationPropertiesQuery, useRobotMapQuery } from "./api";
import { useCapabilitiesSupported } from "./CapabilitiesProvider";

import CapabilitiesProvider from "./CapabilitiesProvider";
import { createTheme } from "@mui/material";
import { SnackbarProvider } from "notistack";
const Container = styled(Box)({
  flex: "1",
  height: "100%",
  display: "flex",
  flexFlow: "column",
  justifyContent: "center",
  alignItems: "center"
});

const ValetudoMap = (props) => {

  // const [paletteMode, setPaletteMode] = useLocalStorage("palette-mode", prefersDarkMode ? "dark" : "light");
    const theme = createTheme({
            palette: {
                mode: 'light',
            },
    });
    
    //, [paletteMode]);

  const { data: mapData, isLoading: mapIsLoading, isError: mapLoadError, refetch: refetchMap } = useRobotMapQuery();
  const [goToLocationCapabilitySupported, mapSegmentationCapabilitySupported, zoneCleaningCapabilitySupported] = useCapabilitiesSupported(Capability.GoToLocation, Capability.MapSegmentation, Capability.ZoneCleaning, Capability.Locate);
  const { data: mapSegmentationProperties, isLoading: mapSegmentationPropertiesLoading } = useMapSegmentationPropertiesQuery(mapSegmentationCapabilitySupported);
  // theme = useTheme();
  if (mapLoadError) {
      return (<Container>
              <Typography color="error">Error loading map data</Typography>
              <Box m={1}/>
              <Button color="primary" variant="contained" onClick={() => {
              return refetchMap();
          }}>
                  Retry
              </Button>

          </Container>);
  }
  if ((!mapData && mapIsLoading) ||
      (mapSegmentationCapabilitySupported && !mapSegmentationProperties && mapSegmentationPropertiesLoading)) {
      return (<Container>
              <CircularProgress />
          </Container>);
  }
  if (!mapData) {
      return (<Container>
              <Typography align="center">No map data</Typography>;
          </Container>);
  }
  return (
    <div className="ValetudoMap"> 
       <header className="ValetudoMap-header"></header>
       <SnackbarProvider maxSnack={3} autoHideDuration={5000}>
     
            <CapabilitiesProvider theme={ theme }>
                
                    <LiveMap rawMap={mapData} theme={theme} trackSegmentSelectionOrder={mapSegmentationProperties ? mapSegmentationProperties.customOrderSupport : false} supportedCapabilities={{
                    //Not sure why these capabilities are reversed
                    [Capability.MapSegmentation]: !mapSegmentationCapabilitySupported,
                    [Capability.ZoneCleaning]: !zoneCleaningCapabilitySupported,
                    [Capability.GoToLocation]: !goToLocationCapabilitySupported
                }}/>
               
            </CapabilitiesProvider>
        </SnackbarProvider>
    </div>

)};

export default ValetudoMap;