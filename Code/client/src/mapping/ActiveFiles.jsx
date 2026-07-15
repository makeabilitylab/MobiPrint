// components/ActiveFilesList.js
import React from 'react';
import { useSelectedFiles } from '../contexts/SelectedFilesContext';
import { Box, Grid, Paper, Typography } from "@mui/material";
const ActiveFilesList = () => {
  const { selectedFiles } = useSelectedFiles();
  console.log("Selected Files: ", selectedFiles);

  return (
    // "console.log("Selected Files: ", selectedFile),"

    //iterate through the selected files and display them in console
    
    <Paper>
        <Box p={1}   pointerEvents = "none">
            <Grid container spacing={2} direction="column">
                <Grid item container>
                    <Grid item> 
                        <Typography variant="overline">Active Files</Typography>
                        <ul>
                            {selectedFiles.map((file) => (
                                <li>
                                    <Typography variant="overline" color="textSecondary"  key={file[0]}>{file}</Typography>
                                </li>                        
                            ))}

                        </ul>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    </Paper>
  );
};

export default ActiveFilesList;
