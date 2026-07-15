import { useGoToMutation, useRobotStatusQuery } from "../../api";
import React from "react";
import { CircularProgress, Grid, Typography } from "@mui/material";
import { ActionButton } from "../../Styled";
import { useLongPress } from "use-long-press";

const GoToActions = (props) => {
    const { goToTarget, convertPixelCoordinatesToCMSpace, onClear } = props;

    const [statusChanges, setStatusChanges] = React.useState(0);
    const [previousStatus, setPreviousStatus] = React.useState("");

    const { data: status } = useRobotStatusQuery((state) => {
        if (previousStatus !== state.value) {
            setPreviousStatus(state.value);
            setStatusChanges(statusChanges + 1);
        } 
        if ( previousStatus !== state.value && statusChanges > 1 && state.value === "idle") {
            console.log("Destination Reached");
        }
        return state.value;
    });
    
    const { mutate: goTo, isLoading: goToIsExecuting } = useGoToMutation({
        onSuccess: onClear,
        
    });
    const canGo = status === "idle" || status === "docked" || status === "paused" || status === "returning" || status === "error";
    const handleClick = React.useCallback(() => {
        if (!canGo || !goToTarget) {
            return;
        }
        //keep track of status changes
        setStatusChanges(statusChanges + 1);
        goTo(convertPixelCoordinatesToCMSpace({ x: goToTarget.x0, y: goToTarget.y0 }));
    }, [canGo, goToTarget, goTo, convertPixelCoordinatesToCMSpace]);
    const handleLongClick = React.useCallback(() => {
        if (!goToTarget) {
            return;
        }
    }, [goToTarget, convertPixelCoordinatesToCMSpace]);
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
                    <ActionButton disabled={goToIsExecuting || !canGo || !goToTarget} color="inherit" size="medium" variant="extended" {...setupClickHandlers()}>
                        Go To Location
                        {goToIsExecuting && (<CircularProgress color="inherit" size={18} style={{ marginLeft: 10 }}/>)}
                    </ActionButton>
                </Grid>
                <Grid item>
                    <ActionButton color="inherit" size="medium" variant="extended" onClick={onClear}>
                        Clear
                    </ActionButton>
                </Grid>
                {!canGo &&
            <Grid item>
                        <Typography variant="caption" color="textSecondary">
                            Cannot go to point while the robot is busy
                        </Typography>
                    </Grid>}
            </Grid>
        </>);
};
export default GoToActions;
