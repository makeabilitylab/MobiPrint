import React from 'react'
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { printerURL } from '../config';



export default function PrinterControls() {

    const printerIP = printerURL();

    const sendGCode = (event) => {
        event.preventDefault();
        fetch(`${printerIP}/rr_gcode?gcode=${event.target.gcode.value}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            console.log(response)
            if (response.status === 200) {
                console.log("Sent G-Code");
            } else {
                //handle load failure
                console.log("Failed to send G-Code");
            }
        }, (error) => {
            console.log(error);
        });
    }

    const setAbsoluteMovement = () => {
        fetch(`${printerIP}/rr_gcode?gcode=G90`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
            }).then((response) => {
                console.log(response)
                if (response.status === 200) {
                    //on success, set printerIP in App.js
                    console.log("Set absolute movement");
                } else {
                    //handle load failure
                    console.log("Failed to set absolute movement");
                }
            }, (error) => {
                console.log(error);
            });
        };

    const setRelativeMovement = () => {
        fetch(`${printerIP}/rr_gcode?gcode=G91`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
                }   
            }).then((response) => {
                console.log(response)
                if (response.status === 200) {
                    //on success, set printerIP in App.js
                    console.log("Set relative movement");
                } else {
                    //handle load failure   
                    console.log("Failed to set relative movement");
                } 
            }, (error) => {
                console.log(error);
            });
        };

    const handleJogButtonClick = (event, axis, distance) => {
        //Set to Relative Positioning 
        setRelativeMovement();
        //Send Jog Command
        fetch(`${printerIP}/rr_gcode?gcode=G0 ${axis}${distance}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            console.log(response)
            if (response.status === 200) {
                //on success, set printerIP in App.js
                console.log("Jogging " + axis + " " + distance);
            } else {
                //handle load failure
                console.log("Failed to Jog " + axis + " " + distance);
            }
        });
        //Set Back to Absolute Positioning
        setAbsoluteMovement();
    }
    
    const handleEmergencyStop = () => {
        fetch(`${printerIP}/rr_gcode?gcode=M112`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            console.log(response)
            if (response.status === 200) {
                console.log("Emergency Stop");
            } else {
                //handle load failure
                console.log("Failed to Emergency Stop");
            }
        });
    }
    
    const homeAxis = (event, axis) => {
        console.log("Homing " + axis);
        fetch(`${printerIP}/rr_gcode?gcode=G28 ${axis}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            console.log(response)
            if (response.status === 200) {
                //on success, set printerIP in App.js
                console.log("Homing " + axis);
            } else {
                //handle load failure
                console.log("Failed to Home " + axis);
            }
        });
    }

  return (
    
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              {/* GCode Console */}
              <Grid item xs={12} md={8} lg={6}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 240,
                  }}
                >
                  <Typography variant="h5" gutterBottom> G-Code Console</Typography>
                    <Box component="form" onSubmit={sendGCode} sx={{ mt: 1 }}>
                    <Stack direction="row" spacing={2}>
                        <TextField fullWidth size="small" id="filled-basic" label="Send G-Code" variant="filled" name="gcode" />
                        <Button type='submit' variant="contained" endIcon={<SendIcon />}>
                            Send
                        </Button>
                    </Stack>
                    </Box>
                </Paper>
              </Grid>
              {/* Homing Controls */}
              <Grid item xs={12} md={4} lg={6}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 400,
                  }}
                >
                  <Typography variant="h5" gutterBottom> Manual Controls</Typography>
                    <Grid container spacing={2} justifyContent="flex-start" alignItems="center">
                            <Grid item xs={6}>
                                <Button variant="contained" fullWidth onClick={(e) => homeAxis(e, "XYZ")} >Home All</Button>
                            </Grid>
                            <Grid item xs={6}>
                                <Button variant="contained" fullWidth onClick={(e) => homeAxis(e, "X")} >Home X</Button>
                            </Grid>
                            <Grid item xs={6}>
                                <Button variant="contained" fullWidth onClick={(e) => homeAxis(e, "Y")} >Home Y</Button>
                            </Grid>
                            <Grid item xs={6}>
                                <Button variant="contained" fullWidth onClick={(e) => homeAxis(e, "Z")}>Home Z</Button>
                            </Grid>
                            <Grid item xs={12}>
                                <Button variant="contained" color="error" fullWidth onClick={(e) => handleEmergencyStop()} >Emergency Stop</Button>
                            </Grid>
                            <Grid item xs={12}>
                                <Stack
                                    sx={{ p: 1 }}
                                    direction="row"
                                    spacing={1}
                                    justifyContent="flex-start"
                                    >
                                        <Button variant="outlined" onClick={(e) => handleJogButtonClick(e, "X", "-10")}>X-10</Button>
                                        <Button variant="outlined" onClick={(e) => handleJogButtonClick(e, "X", "-1")}>X-1</Button>
                                        <Button variant="outlined" onClick={(e) => handleJogButtonClick(e, "X", "1")}>X+1</Button>
                                        <Button variant="outlined" onClick={(e) => handleJogButtonClick(e, "X", "10")}>X+10</Button>
                                </Stack>
                            </Grid>
                            <Grid item xs={12}>
                                <Stack
                                    sx={{ p: 1 }}
                                    direction="row"
                                    spacing={1}
                                    justifyContent="flex-start"
                                    >
                                        <Button variant="outlined" onClick={(e) => handleJogButtonClick(e, "Y", "-10")}>Y-10</Button>
                                        <Button variant="outlined" onClick={(e) => handleJogButtonClick(e, "Y", "-1")}>Y-1</Button>
                                        <Button variant="outlined" onClick={(e) => handleJogButtonClick(e, "Y", "1")} >Y+1</Button>
                                        <Button variant="outlined" onClick={(e) => handleJogButtonClick(e, "Y", "10")}>Y+10</Button>
                                </Stack>
                            </Grid>
                            <Grid item xs={12}>
                                <Stack
                                    sx={{ p: 1 }}
                                    direction="row"
                                    spacing={1}
                                    justifyContent="flex-start"
                                    >
                                        <Button variant="outlined" onClick={(e) => handleJogButtonClick(e, "Z", "-10")}>Z-10</Button>
                                        <Button variant="outlined" onClick={(e) => handleJogButtonClick(e, "Z", "-1")}>Z-1</Button>
                                        <Button variant="outlined" onClick={(e) => handleJogButtonClick(e, "Z", "1")}>Z+1</Button>
                                        <Button variant="outlined" onClick={(e) => handleJogButtonClick(e, "Z", "10")}>Z+10</Button>
                                </Stack>
                            </Grid>
                        </Grid>
                </Paper>
              </Grid>
              {/* Other Debugging */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h5" gutterBottom> Other Debugging</Typography>
                </Paper>
              </Grid>
            </Grid>
        </Container>
  )
}

