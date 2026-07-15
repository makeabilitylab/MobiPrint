import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import CameraIcon from '@mui/icons-material/PhotoCamera';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { Fab } from '@mui/material';
import RedoIcon from '@mui/icons-material/Redo';
import Link from '@mui/material/Link';
import { useState, useEffect } from 'react';
import { useTheme, createTheme, ThemeProvider } from '@mui/material/styles';
import { useAddPrintFileMutation, usePrintFilesQuery } from '../mapping/api/mobiprinthooks';
import axios from "axios";
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { useSelectedFiles } from '../contexts/SelectedFilesContext';
import { printerURL, getBackendURL } from '../config';


//New floating action button to advance to the next page which is the planning page
const NextButton = styled(Fab)(({ theme }) => {
  return {
    variant: "extended", 
    position: "absolute",
    bottom: theme.spacing(2),
    right: theme.spacing(2), 
    backgroundColor: "disabled",
  };
});

const StyledRedoIcon = styled(RedoIcon)(({ theme }) => {
  return {
    color: theme.palette.common.white,
  };
});

export default function Library() {

  const {data: files, isLoading, isError}  = usePrintFilesQuery(); // Retrieve all files from the database
  const { mutate: addPrintFile } = useAddPrintFileMutation(); // Add a file to the database
  const navigate = useNavigate(); // Initialize the navigate function 
  const { selectedFiles, setSelectedFiles } = useSelectedFiles(); // Use the context to manage selected files
  const fileInputRef = React.useRef(null); // Create a reference to the file input element

  // const { selectedFiles } = useSelectedFiles();


  // Check if no files have been selected to disable the Next button
  const isNextButtonDisabled = selectedFiles.length === 0;
  const theme = useTheme();

   // Function to handle navigation to the Plan page
  const handleNavigateToPlan = () => {
    navigate('/plan', { state: { selectedFiles } }); // Use the path you defined in your router setup
  };
  

  // Function to handle file selection toggle
  const toggleFileSelection = (fileName) => {
    setSelectedFiles((currentSelectedFiles) =>
      currentSelectedFiles.includes(fileName)
        ? currentSelectedFiles.filter((id) => id !== fileName)
        : [...currentSelectedFiles, fileName]
    );
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append('file', file); // 'file' is the key expected on the server side
  
    try {
      // Upload to the backend server
      try {
        const backendResponse = await axios.post(`${getBackendURL()}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('File upload to backend successful:', backendResponse.data);
      } catch (error) {
        console.error('Error uploading file to backend server:', error.response ? error.response.data : error.message);
      }
  
      // Upload to the 3D printer
      const printerFormData = new FormData();
      printerFormData.append('file', file);
  
      try {
        const printerResponse = await axios.post(`${printerURL()}/rr_upload?name=/gcodes/` + file.name, printerFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('File upload to printer successful:', printerResponse.data);
  
        if (printerResponse.data.err === 0) {
          console.log('File uploaded to 3D printer successfully.');
        } else {
          console.error('Error from printer response:', printerResponse.data.err);
        }
      } catch (error) {
        console.error('Error uploading file to 3D printer:', error.response ? error.response.data : error.message);
      }
  
    } catch (error) {
      console.error('Unexpected error during file upload:', error);
    }
  };
  

// // Function to handle file selection and upload
//   const handleFileChange = async (event) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     const formData = new FormData();
//     formData.append('file', file); // 'file' is the key expected on the server side

//     try {
//       const response = await axios.post('http://127.0.0.1:5000/upload', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });
//       console.log('File upload successful:', response.data);
//       // Additional logic after successful upload (e.g., update state, notify user)
//     } catch (error) {
//       console.error('Error uploading file:', error);
//       // Handle errors here (e.g., notify user of failure)
//     }
//   };
  //   // Toggle file selection
  // const toggleFileSelection = (fileId) => {
  //     setSelectedFiles((currentSelectedFiles) =>
  //       console.log("Selected FIles in Library: ", currentSelectedFiles),
  //       currentSelectedFiles.includes(fileId)
  //         ? currentSelectedFiles.filter((id) => id !== fileId) // Remove the file if it's already selected
  //         : [...currentSelectedFiles, fileId] // Add the file if it's not already selected
  //     );
  // };

  const handleAddModelClick = () => {
    if (fileInputRef.current){
      fileInputRef.current.click();
    }
    console.log("Add Model Clicked");
  }

  if (isLoading) {
    return <div>Loading...</div>
  }
  if (isError) {
    return <div>Error</div>
  }
  if (!files || files.length === 0) {
    return <div>No files found in database</div>
  }

  // print out the file name and thumbnail path for each file
  console.log("Files: ", files);

  return (

      <Container>
        <main>
          {/* Hero unit */}
          <Box
            sx={{
              // bgcolor: 'background.paper',
              pt: 8,
              pb: 6,
            }}
          >
            <Container maxWidth="sm">
              <Typography
                component="h1"
                variant="h2"
                align="center"
                color="text.primary"
                gutterBottom
              >
                3D Files Library
              </Typography>
              <Typography variant="h5" align="center" color="text.secondary" paragraph>
                Select the Models you woud like to print
              </Typography>
              <Stack
                sx={{ pt: 4 }}
                direction="row"
                spacing={2}
                justifyContent="center"
              >
                <input
                  type="file"
                  style={{ display: 'none' }}  // Hide the file input
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".gcode"  // Accept only .gcode files
                />
                <Button variant="contained" onClick={handleAddModelClick}>Add Model</Button> 
              </Stack>
            </Container>
          </Box>
          <Container sx={{ py: 8 }} maxWidth="md">
            {/* End hero unit */}
            <Grid container spacing={4}>
              {files.map((file) => (
                <Grid item key={file.id} xs={12} sm={6} md={4}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: selectedFiles.includes(file.name)
                        ? `4px solid ${theme.palette.primary.main}`
                        : "none",
                    }}
                  >
                    {/* <CardMedia
                      component="div"
                      sx={{ pt: '56.25%'}}
                      image="https://source.unsplash.com/random?wallpapers"
                    /> */}
                    <CardMedia
                      component="img" // Change from "div" to "img" to ensure the image is displayed.
                      sx={{ }} // Adjust the height as needed.
                      image={`${getBackendURL()}${file.thumbnail_path}`} // thumbnail_path is server-relative
                      alt={`Thumbnail for ${file.name}`}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h5" component="h2">
                        {file.name}
                      </Typography>
                      {/* <Typography>
                      {file.description || "No description available."}
                      </Typography> */}
                    </CardContent>
                    <CardActions>
                    <Button size="small" onClick={() => toggleFileSelection(file.name)}>
                        {selectedFiles.includes(file.name) ? "Deselect" : "Select"}
                      </Button>
                      {/* <Button size="small">View</Button> */}
                      <Button size="small">Delete</Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
          <NextButton 
            style={{
              backgroundColor: isNextButtonDisabled ? undefined : theme.palette.success.light,
            }}
            disabled={isNextButtonDisabled} aria-label='Print Files'
            onClick={handleNavigateToPlan} 
          >
            <StyledRedoIcon/>
          </NextButton>
        </main>

      </Container>
  );
}