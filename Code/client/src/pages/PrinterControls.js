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

    // Send a single gcode command to the Duet printer; logs only failures
    const sendPrinterGCode = (gcode, description) => {
        return fetch(`${printerIP}/rr_gcode?gcode=${gcode}`, { method: 'GET' })
            .then((response) => {
                if (response.status !== 200) {
                    console.error(`Failed to ${description} (HTTP ${response.status})`);
                }
            }, (error) => {
                console.error(`Failed to ${description}:`, error);
            });
    }

    const sendGCode = (event) => {
        event.preventDefault();
        sendPrinterGCode(event.target.gcode.value, "send G-Code");
    }

    const setAbsoluteMovement = () => sendPrinterGCode("G90", "set absolute movement");

    const setRelativeMovement = () => sendPrinterGCode("G91", "set relative movement");

    const handleJogButtonClick = (event, axis, distance) => {
        //Set to Relative Positioning
        setRelativeMovement();
        //Send Jog Command
        sendPrinterGCode(`G0 ${axis}${distance}`, `jog ${axis} ${distance}`);
        //Set Back to Absolute Positioning
        setAbsoluteMovement();
    }

    const handleEmergencyStop = () => sendPrinterGCode("M112", "emergency stop");

    const homeAxis = (event, axis) => sendPrinterGCode(`G28 ${axis}`, `home ${axis}`);

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

