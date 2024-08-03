import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';

const GitHubCard = () => {
    const [repos, setRepos] = useState([]);

    useEffect(() => {
        const fetchRepos = async () => {
            try {
                const response = await axios.get('https://api.github.com/users/longsizhuo/repos');
                setRepos(response.data);
            } catch (error) {
                console.error('Error fetching GitHub repos:', error);
            }
        };

        fetchRepos();
    }, []);

    return (
        <Box sx={{ padding: '20px' }}>
            <Typography variant="h4" gutterBottom>
                My GitHub Repos
            </Typography>
            <Grid container spacing={2}>
                {repos.slice(0, 6).map((repo) => (
                    <Grid item xs={12} sm={6} md={4} key={repo.id}>
                        <Card>
                            <CardMedia>
                                <Avatar
                                    alt={repo.owner.login}
                                    src={repo.owner.avatar_url}
                                    sx={{ width: 56, height: 56, margin: 'auto', marginTop: '10px' }}
                                />
                            </CardMedia>
                            <CardContent>
                                <Typography variant="h6" component="div">
                                    {repo.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {repo.description}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Stars: {repo.stargazers_count} | Forks: {repo.forks_count}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default GitHubCard;
