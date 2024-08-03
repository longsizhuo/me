// src/components/Avatar.js
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';

const MyAvatar = () => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                height: '100%',
                padding: '10px',
            }}
        >
            <Avatar
                alt="Sizhuo Long"
                src="path/to/your/photo.jpg"
                sx={{ width: 56, height: 56 }}
            />
        </Box>
    );
};

export default MyAvatar;
