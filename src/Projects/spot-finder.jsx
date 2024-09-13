import React from 'react';
import {Container, Typography, Card, CardContent, Box, IconButton} from '@mui/material';
import SpotFinderImages from '../utils/getImages.jsx';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {useNavigate} from "react-router-dom";

const SpotFinder = () => {
    const navigate = useNavigate();

    const handleReturn = () => {
        navigate(-1); // This navigates back to the previous page
    };
    return (
        <Container style={{ marginTop: '20px', maxWidth: '100%' }}>
            <IconButton color="primary" aria-label="add to shopping cart" onClick={handleReturn}>
                <ArrowBackIcon />
            </IconButton>
            <Card style={{ marginBottom: '20px' }}>
                <CardContent>
                    <Box mb={2}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            <a href="https://longsizhuo.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'blue' }}>
                                Spot Finder
                            </a>
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                            Role: Scrum Master | Clicks: 5k+
                        </Typography>
                    </Box>
                    <Box mb={2}>
                        <Typography variant="body1">
                            Led a team to devise an urban parking space time-sharing rental system, addressing parking problems for travelers and increasing income for parking space owners.
                        </Typography>
                    </Box>
                    <Box mt={4}>
                        <Typography variant="h6" component="h2" gutterBottom>
                            Achievements:
                        </Typography>
                        <ul>
                            <li>
                                <Typography variant="body2">
                                    Achieved a project score of 95/100; selected for USYD Coding Fest and UNSW Incubator Peter Farrell Cup.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    Won the Outstanding Project Idea Award Champion in the USYD Coding Fest 2024.
                                </Typography>
                            </li>
                        </ul>
                    </Box>
                </CardContent>


            <Card style={{ marginBottom: '20px' }}>
                <CardContent>
                    <Typography variant="h5" component="h3" gutterBottom>
                        Live Preview of SpotFinder
                    </Typography>
                    <Box sx={{ height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', border: '1px solid #ccc' }}>
                        <iframe
                            src="https://longsizhuo.com"
                            title="longsizhuo.com"
                            style={{ width: '100%', height: '100%', border: 'none' }}
                        ></iframe>
                    </Box>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <Typography variant="h5" component="h3" gutterBottom>
                        Pictures of USYD Coding Fest 2024
                    </Typography>
                    <SpotFinderImages />
                </CardContent>
            </Card>
            </Card>
        </Container>
    );
}

export default SpotFinder;
