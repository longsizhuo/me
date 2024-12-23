import {Box, Card, CardContent, Container, Typography, Button, IconButton} from "@mui/material";
import React from "react";
import {useNavigate} from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const HelloAlgo = () => {
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
                            <a href="https://hello-algo.com/en/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'blue' }}>
                                Hello Algo
                            </a>
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                            Role: Core Contributor | Starred by 94.2K users.
                        </Typography>
                    </Box>
                    <Box mb={2}>
                        <Typography variant="body1">
                            <strong>Description:</strong>
                        </Typography>
                        <ul>
                            <li>
                                <Typography variant="body2">
                                    Summarized all the chapters of "Hello Algo," simplifying data structures and algorithms through visual animations for learners in multiple programming languages.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    Organized interactive Q&A segments and managed community interactions, advancing educational value and user engagement.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    Translated it into English to cater to an international and diverse audience.
                                </Typography>
                            </li>
                        </ul>
                    </Box>
                    <Box mt={2}>
                        <Typography variant="body1" component="h2" gutterBottom>
                            <strong>Achievements:</strong>
                        </Typography>
                        <ul>
                            <li>
                                <Typography variant="body2">
                                    Attracted 94.2K stars on GitHub, indicating widespread recognition and appreciation in the developer community.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    Sold over 50,000 copies of the physical book and received 99% positive reviews.
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
                                src="https://hello-algo.com/en/"
                                title="hello-algo"
                                style={{ width: '100%', height: '100%', border: 'none' }}
                            ></iframe>
                        </Box>
                    </CardContent>
                </Card>
            </Card>
        </Container>
    );
}

export default HelloAlgo