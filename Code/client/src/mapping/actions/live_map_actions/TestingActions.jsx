import { ActionButton } from "../../Styled";
import { useGoToMutation, useRobotStatusQuery } from "../../api";
import React from "react";
import { CircularProgress, Grid } from "@mui/material";
import { useLongPress } from "use-long-press";

//Actions for Testing mode

const TestingActions = (props) => {
    const {testingGrids, testPoint, convertPixelCoordinatesToCMSpace, onClear, onMakeGrid, generateTestPoint, onReachedLocation, onRunTestSequence} = props;
    const [statusChanges, setStatusChanges] = React.useState(0);
    const [previousStatus, setPreviousStatus] = React.useState("");
    
    const { data: status } = useRobotStatusQuery((state) => {
        if (previousStatus !== state.value) {
            setPreviousStatus(state.value);
            setStatusChanges(statusChanges + 1);
        } 
        if ( previousStatus !== state.value && statusChanges > 1 && state.value === "idle") {
            onReachedLocation();
        }
        return state.value;
    });

    const { mutate: goTo, isLoading: goToIsExecuting } = useGoToMutation({
        // onSuccess: onClear,
    });
    const canGo = status === "idle" || status === "docked" || status === "paused" || status === "returning" || status === "error";

    const handleClick = React.useCallback(() => {
        if (!canGo || !testPoint) {
            // "Cannot go to point while the robot is busy or no test point is generated"
            return;
        }
        goTo(convertPixelCoordinatesToCMSpace({ x: testPoint.x0, y: testPoint.y0 }));
    }, [canGo, testPoint, goTo, convertPixelCoordinatesToCMSpace]);
    const handleLongClick = React.useCallback(() => {
        if (!testPoint) {
            return;
        }
    }, [testPoint, convertPixelCoordinatesToCMSpace]);
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
                <ActionButton color="inherit" size="medium" variant="extended" onClick={onClear}>
                        Clear Grid
                    </ActionButton>
                </Grid>
                <Grid item>
                    <ActionButton color="inherit" size="medium" variant="extended" onClick={onMakeGrid}>
                        Make Grid
                    </ActionButton>
                </Grid>
                <Grid item>
                    <ActionButton disabled={testingGrids.length === 0} color="inherit" size="medium" variant="extended" onClick={generateTestPoint}>
                        Generate Test Point
                    </ActionButton>
                </Grid>
                <Grid item>
                    <ActionButton disabled={goToIsExecuting || !canGo || !testPoint} color="inherit" size="medium" variant="extended" {...setupClickHandlers()}>
                        Run Test Sequence
                        {goToIsExecuting && (<CircularProgress color="inherit" size={18} style={{ marginLeft: 10 }}/>)}
                    </ActionButton>
                </Grid>

            </Grid>
            </>
    );
};

export default TestingActions;