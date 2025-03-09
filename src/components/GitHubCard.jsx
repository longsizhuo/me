import React, { useEffect, useState } from 'react';
import { graphql } from '@octokit/graphql';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';

const GITHUB_TOKEN = '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'; // 请将此替换为你的GitHub Token

const GitHubCard = () => {
    const [pinnedRepos, setPinnedRepos] = useState([]);

    useEffect(() => {
        const fetchPinnedRepos = async () => {
            const graphqlWithAuth = graphql.defaults({
                headers: {
                    authorization: `token ${GITHUB_TOKEN}`,
                },
            });

            try {
                const { user } = await graphqlWithAuth(`
                    {
                        user(login: "longsizhuo") {
                            pinnedItems(first: 3, types: REPOSITORY) {
                                nodes {
                                    ... on Repository {
                                        id
                                        name
                                        description
                                        stargazerCount
                                        forkCount
                                        owner {
                                            login
                                            avatarUrl
                                        }
                                    }
                                }
                            }
                        }
                    }
                `);
                setPinnedRepos(user.pinnedItems.nodes);
            } catch (error) {
                console.error('Error fetching pinned repos:', error);
            }
        };

        fetchPinnedRepos().then(r =>
            console.log(r)
        );
    }, []);

    return (
        <Box>
            <h2 style={{color: '#333'}}>First 3 Contributed</h2>
            <Grid container spacing={2}>
            {pinnedRepos.map((repo) => (
                    <Grid item xs={12} sm={6} md={4} key={repo.id}>
                        <Card sx={{ maxWidth: "auto", minHeight: 250 }}> {/* 调整卡片大小 */}
                            <CardMedia>
                                <Avatar
                                    alt={repo.owner.login}
                                    src={repo.owner.avatarUrl}
                                    sx={{ width: 48, height: 48, margin: 'auto', marginTop: '10px' }}
                                />
                            </CardMedia>
                            <CardContent>
                                <Typography variant="subtitle1" component="div">
                                    {repo.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {repo.description}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Stars: {repo.stargazerCount} | Forks: {repo.forkCount}
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
