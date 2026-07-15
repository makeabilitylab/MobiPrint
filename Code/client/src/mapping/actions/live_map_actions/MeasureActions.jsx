
import React from "react";
import { Grid } from "@mui/material";
import { ActionButton } from "../../Styled";
import { useLongPress } from "use-long-press";

const MeasureActions = (props) => {
    const {onMakeMeasureLine, convertPixelCoordinatesToCMSpace, convertCMCoordinatesToPixelSpace} = props;
    const [statusChanges, setStatusChanges] = React.useState(0);
    const [previousStatus, setPreviousStatus] = React.useState("");
    
    const handleClick = React.useCallback(() => {
        // if (!canGo || !goToTarget) {
        //     return;
        // }
        return; 
        //keep track of status changes
        // setStatusChanges(statusChanges + 1);
        // goTo(convertPixelCoordinatesToCMSpace({ x: goToTarget.x0, y: goToTarget.y0 }));
    }, [convertPixelCoordinatesToCMSpace]);
    const handleLongClick = React.useCallback(() => {
        // if (!goToTarget) {
        //     return;
        // }
    }, [convertPixelCoordinatesToCMSpace]);
    const setupClickHandlers = useLongPress(handleLongClick, {
        onCancel: (event) => {
            handleClick();
        },
        threshold: 500,
        captureEvent: true,
        cancelOnMovement: true,
    });
    return (<>
            <Grid container spacing={1} direction="row-reverse" flexWrap="wrap-reverse">
                <Grid item>
                    {/* <ActionButton disabled={goToIsExecuting || !canGo || !goToTarget} color="inherit" size="medium" variant="extended" {...setupClickHandlers()}>
                        Go To Location
                        {goToIsExecuting && (<CircularProgress color="inherit" size={18} style={{ marginLeft: 10 }}/>)}
                    </ActionButton> */}
                    <ActionButton color="inherit" size ="medium" variant="extended" onClick={onMakeMeasureLine}>
                        Measure
                    </ActionButton>
                </Grid>
            </Grid>
        </>);
};
export default MeasureActions;
