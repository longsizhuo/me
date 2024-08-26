import React from 'react';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const Profile = () => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
            }}
        >
            <Box>
                <Typography variant="h1">Sizhuo Long</Typography>
                <Typography variant="body1">
                    <strong>Email:</strong> longsizhuo@gmail.com<br/>
                    <strong>GitHub:</strong> <a href="https://github.com/longsizhuo">github.com/longsizhuo</a> <br/>
                    <strong>Blog:</strong> <a href="https://longsizhuo.github.io">longsizhuo.github.io</a> <br/>
                    <strong>LinkedIn:</strong> <a href="https://linkedin.com/in/longsizhuo">linkedin.com/in/longsizhuo</a>
                </Typography>
            </Box>
            <Card sx={{ maxWidth: 200, maxHeight: 300, marginLeft: '20px' }}>
                <CardMedia
                    component="img"
                    alt="Sizhuo Long"
                    image="/IMG_2862.png" // 确保图片路径正确
                    title="Sizhuo Long"
                    sx={{ width: '100%', height: '100%' }}
                />
            </Card>
        </Box>
    );
};

export default Profile;
