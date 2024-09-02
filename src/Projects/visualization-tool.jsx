import {useNavigate} from "react-router-dom";
import {Box, Card, CardContent, Container, IconButton, Typography} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import React from "react";

const visualization = () => {
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
                            <a href="https://longsizhuo.shinyapps.io/long/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'blue' }}>
                                Dimensionality Reduction Clustering Visualization Tool (Chinese.ver)
                            </a>
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                            Role: Project Architect | Fully copyright and Patent
                        </Typography>
                    </Box>
                    <Box mb={2}>
                        <Typography variant="body1">
                            <strong>Description:</strong>
                        </Typography>
                        <ul>
                            <li>
                                <Typography variant="body2">
                                    Developed an innovative web-based tool in <strong>R</strong>, aimed at simplifying analysis of single-cell
                                    RNA-seq data through intuitive visualization of dimensionality reduction and clustering
                                    techniques.
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    Prioritized user experience in tool’s design, providing a seamless analytical process to empower
                                    users to uncover insights from high-dimensional biological data sets.
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
                                    Recognized Computer software copyright certificate (No. 7903259) by the National
                                    Copyright Administration of China.                                </Typography>
                            </li>
                        </ul>
                    </Box>
                </CardContent>


                <Card style={{ marginBottom: '20px' }}>
                    <CardContent>
                        <Typography variant="h5" component="h3" gutterBottom>
                            Live Preview of Tool
                        </Typography>
                        <Box sx={{ height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', border: '1px solid #ccc' }}>
                            <iframe
                                src="https://longsizhuo.shinyapps.io/long/"
                                title="shinyapps"
                                style={{ width: '100%', height: '100%', border: 'none' }}
                            ></iframe>
                        </Box>
                    </CardContent>
                </Card>
            </Card>
        </Container>
    );
}

export default visualization