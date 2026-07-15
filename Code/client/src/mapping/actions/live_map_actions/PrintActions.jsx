import { ActionButton } from "../../Styled";

import { useGoToMutation, useRobotStatusQuery } from "../../api";
import React from "react";
import { Grid, CircularProgress, Typography, styled, Box, Slider } from "@mui/material";

import axios from "axios";
import { useSelectedFiles } from "../../../contexts/SelectedFilesContext";
import { printerURL, getBackendURL } from "../../../config";

const PrintActionsContainer = styled(Box)(({ theme }) => {
    return {
        position: "absolute",
        pointerEvents: "none",
        bottom: theme.spacing(2),
        right: theme.spacing(2),
        zIndex: 1,
    };
});

//Actions for Printing
const PrintActions = (props) => {
    const {PrintObject, convertPixelCoordinatesToCMSpace, convertCMCoordinatesToPixelSpace, 
           placePrint,onRotate, onClear, onScale, onReachedLocation} = props;
    const { selectedFiles } = useSelectedFiles(); // Access selected files from context
    const filename = selectedFiles[0]; // Get the first selected file
    
    const [value, setValue] = React.useState(0);
    const [readyToPrint, setReadyToPrint] = React.useState(false);
    const [statusChanges, setStatusChanges] = React.useState(0);
    const [previousStatus, setPreviousStatus] = React.useState("");
    const [printAngle , setPrintAngle] = React.useState(0);
    const [printScale, setPrintScale] = React.useState(1);
    const [printPlaced, setPrintPlaced] = React.useState(false);
    let fileToPrint = filename; // The file to print

    const { data: status } = useRobotStatusQuery((state) => {
        if (previousStatus !== state.value) {
            setPreviousStatus(state.value);
            setStatusChanges(statusChanges + 1);
        } 
        if ( previousStatus !== state.value && statusChanges > 1 && state.value === "idle") {
            setReadyToPrint(true);
            //send start print request
            sendStartPrintRequest();
        }
        return state.value;
    });

    const sendStartPrintRequest = () => {
        
        console.log("Sending Start Print Request for file named" + fileToPrint);
        // add delay to ensure robot is completely still before printer movements
        axios.get(`${printerURL()}/rr_gcode?gcode=M32%20` + fileToPrint).then((response) => {
            console.log(response);
        }).catch((error) => {
            console.log(error);
        });
    }

    const handleChange = (event, newValue) => {
        setValue(newValue);
        setPrintAngle(newValue);
        onRotate(newValue);
    };

    const handleScaleChange = (event, newValue) => {
        setPrintScale(newValue);
        onScale(newValue);
    };
    const { mutate: goTo, isLoading: goToIsExecuting } = useGoToMutation({});

    const canGo = status === "idle" || status === "docked" || status === "paused" || status === "returning" || status === "error";

    const getText = value => `${value}`

    const handleClick = React.useCallback(() => {

        if (!canGo) {
            // "Cannot go to point while the robot is busy"
            console.log("Cannot go to point while the robot is busy");
            return;
        }

        const payload = {
            location : convertCMCoordinatesToPixelSpace({x: PrintObject.x0, y: PrintObject.y0}),
            file : filename,
            description : "Test Description",
            angle : printAngle,
            scale : printScale,
            //set current timestamp as the created_at time
            created_at : new Date().toISOString()
        }

        // Check to see if edits were made to file
        if (printScale !== 1 || (printAngle !== 0 || printAngle !== 360)) {
                // Modify the filename to reflect changes
            const fileExtension = filename.split('.').pop(); // Get the file extension
            const baseFilename = filename.replace(/\.[^/.]+$/, ""); // Remove the extension
            const modifiedFilename = `${baseFilename}_modified_scale${printScale}_rotate${printAngle}.${fileExtension}`;

            fileToPrint = modifiedFilename;
            console.log("Modified filename:", modifiedFilename);

            axios.post(`${getBackendURL()}/process-gcode`, {
                filename: filename,
                scale: printScale,
                rotation: printAngle
            }, { responseType: 'blob' })  // Expecting a blob as the response
                .then(response => {
                    console.log("Backend response received");
            
                    const formData = new FormData();
                    formData.append('file', new Blob([response.data], { type: 'application/octet-stream' }), `${modifiedFilename}`);
            
                    // Upload the modified GCode file to the 3D printer
                    axios.post(`${printerURL()}/rr_upload?name=/gcodes/${modifiedFilename}`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    })
                    .then(printerResponse => {
                        console.log("Printer response after backend processing:", printerResponse);
                    })
                    .catch(printerError => {
                        console.error("Error sending processed file to 3D printer:", printerError);
                    });
                })
                .catch(error => {
                    console.error("Error sending file details to backend server:", error);
                });
            
            } else {
                fileToPrint = filename;
            }

        setStatusChanges(statusChanges + 1);
        goTo(convertPixelCoordinatesToCMSpace({ x: PrintObject.x0, y: PrintObject.y0 }));
    }, [canGo, PrintObject, goTo, convertPixelCoordinatesToCMSpace], filename, printAngle, printScale);

    const handlePlacePrintClick = () => {
        if (selectedFiles.length > 0) {
            placePrint(); // Call the provided placePrint function with selected files
            setPrintPlaced(true);
        }
        // Since the button is disabled when there are no files, you technically don't need an else case.
    };
    
    const handleClearClick = () => {
        onClear();
        setPrintPlaced(false);
    };

   return (<PrintActionsContainer>
                <Grid container spacing={1} direction="row-reverse" alignItems={"right"}>
                <Grid item>
                        <ActionButton 
                            color="inherit" 
                            size="medium" 
                            variant="extended"
                            onClick={handlePlacePrintClick}
                            disabled={selectedFiles.length === 0} // Disable the button if there are no selected files
                        >
                            {selectedFiles.length > 0 ? "Place 3D Print" : "No Print Files Selected"}
                        </ActionButton>
                    </Grid>
                    <Grid item>
                    <ActionButton color="inherit" size="medium" variant="extended" onClick={handleClearClick}>
                            Clear
                        </ActionButton>
                    </Grid>
                    {printPlaced && (
                        <>
                        <Grid item>
                            <ActionButton disabled={goToIsExecuting || !canGo || !PrintObject} color='inherit' size="medium" variant="extended" onClick={handleClick}>
                                Print
                                {goToIsExecuting && (<CircularProgress color="inherit" size={18} style={{ marginLeft: 10 }}/>)}
                            </ActionButton>
                        </Grid>
                        <Grid item>
                                <ActionButton disabled={goToIsExecuting || !canGo || !PrintObject} color="inherit" size="large" variant="extended" >
                                    <Typography id="angle-slider" sx  = {{ marginRight : "10px" }}>
                                        Rotate
                                    </Typography>
                                    <Slider style={{width: 100}} valueLabelDisplay="on" getAriaValueText={getText} 
                                            color="primary" size="large"
                                            min={0} max={360}  onChange={handleChange}
                                            />
                                </ActionButton>
                        </Grid> 
                        <Grid item minWidth={"fit-content"}>
                            <ActionButton disabled={goToIsExecuting || !canGo || !PrintObject} color="inherit" size="large" variant="extended" >
                                <Typography id="scale-slider" sx  = {{ marginRight : "10px" }}>
                                    Scale
                                </Typography>
                                <Slider style={{width: 100}} valueLabelDisplay="on" getAriaValueText={getText} 
                                        color="primary" size="large" 
                                        min={0} max={2} step={0.01} value={printScale} onChange={handleScaleChange}
                                        />
                            </ActionButton>
                        </Grid> 
                        </>
                    )}
                </Grid>
        </PrintActionsContainer>
    );
};

export default PrintActions;
