import { Box, CircularProgress, Grid, LinearProgress, linearProgressClasses, Paper, styled, Typography } from "@mui/material";
import { green, red, yellow } from "@mui/material/colors";
import React from "react";
import { RobotAttributeClass, useRobotAttributeQuery, useRobotStatusQuery } from "./api";
import ActiveFilesList from "./ActiveFiles";

const batteryLevelColors = {
    red: red[500],
    yellow: yellow[700],
    green: green[500],
};

const getBatteryColor = (level) => {
    if (level > 60) {
        return "green";
    }

    if (level > 20) {
        return "yellow";
    }

    return "red";
};

const  RobotStatusContainer = styled(Box)(({ theme }) => {
    return {
        position: "absolute",
        pointerEvents: "none",
        top: theme.spacing(2),
        left: theme.spacing(2),
        //add margin on the bottom
        // margin : theme.spacing(1),
        // width: "fit-content",
        zIndex: 1,
    };
})

const BatteryProgress = styled(LinearProgress)(({ theme, value }) => ({
    marginTop: -theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    [`&.${linearProgressClasses.colorPrimary}`]: {
        backgroundColor: theme.palette.grey[theme.palette.mode === "light" ? 200 : 700],
    },
    [`& .${linearProgressClasses.bar}`]: {
        backgroundColor: getBatteryColor(value ?? 0),
    },
}));

const RobotStatus = () => {
    const {
        data: status,
        isPending: isStatusPending,
        isError: isStatusError,
    } = useRobotStatusQuery();

    
    // list of possible print states
    const printStates = ["idle", "paused", "ready", "printing", "error"]
    

    const {
        data: batteries,
        isPending: isBatteryPending,
        isError: isBatteryError,
    } = useRobotAttributeQuery(RobotAttributeClass.BatteryState);

    const isPending = isStatusPending || isBatteryPending;

    const stateDetails = React.useMemo(() => {
        if (isStatusError) {
            return <Typography color="error">Error loading robot state</Typography>;
        }

        if (isPending) {
            return (
                <Grid item>
                    <CircularProgress color="inherit" size="1rem" />
                </Grid>
            );
        }

        if (status === undefined) {
            return null;
        }
        return (
            <Typography variant="overline" color="textSecondary">
                {status.value}
                {status.flag !== "none" ? <> &ndash; {status.flag}</> : ""}
            </Typography>
        );
    }, [isStatusError, status, isPending]);

    const batteriesDetails = React.useMemo(() => {
        if (isBatteryError) {
            return <Typography color="error">Error loading battery state</Typography>;
        }

        if (batteries === undefined) {
            return null;
        }

        if (batteries.length === 0) {
            return <Typography color="textSecondary">No batteries found</Typography>;
        }

        return batteries.map((battery, index) => (
            <Grid container key={index.toString()} direction="column" spacing={1}>
                <Grid item>
                    <Box display="flex" alignItems="center" minWidth={100}>
                        <Box width="100%" mr={1}>
                            <BatteryProgress value={battery.level} variant="determinate" />
                        </Box>
                        <Typography
                            variant="overline"
                            style={{
                                color: batteryLevelColors[getBatteryColor(battery.level)],
                            }}
                        >
                            {Math.round(battery.level)}%
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        ));
    }, [batteries, isBatteryError]);

    return (
        <RobotStatusContainer>
            <Paper>
                <Box p={1}>
                    <Grid container spacing={2} direction="column">
                        <Grid item container>
                            <Grid item xs="auto" container direction="column" sx={{paddingLeft:"8px", paddingRight:"8px"}}>
                                <Grid item>
                                    <Typography variant="subtitle2">State</Typography>
                                </Grid>
                                <Grid
                                    item
                                    style={{
                                        maxHeight: "2rem",
                                        overflow: "visible",
                                        wordBreak: "break-all"
                                    }}
                                >
                                    {stateDetails}
                                </Grid>
                            </Grid>
                            {batteries !== undefined && batteries.length >= 0 && (
                                <Grid item xs="auto" container direction="column" sx={{paddingRight:"8px"}}>
                                    <Grid item>
                                        <Typography variant="subtitle2">Battery</Typography>
                                    </Grid>
                                    <Grid item>{batteriesDetails}</Grid>
                                </Grid>
                            )}
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
            <ActiveFilesList/>
        </RobotStatusContainer>
        ); 
}

export default RobotStatus;