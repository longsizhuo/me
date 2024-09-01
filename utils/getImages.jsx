import React from 'react';
import {ImageList, ImageListItem} from "@mui/material";
import Box from "@mui/material/Box";

// 动态导入图片
const images = import.meta.glob('../public/USYDCodingFest/*.{jpg,png,gif}', { eager: true });

const itemData = Object.keys(images).map((key) => {
    return {
        img: images[key].default,
        title: key.split('/').pop().split('.')[0], // 使用文件名作为标题
    };
});

export default function SpotFinderImages() {
    return (
        <ImageList
            sx={{ width: '100%', height: 'auto' }}
            variant="quilted"
            cols={4}
            rowHeight={121}
            >
                {itemData.map((item) => (
                    <ImageListItem key={item.img} cols={item.cols || 1} rows={item.rows || 1}>
                        <img
                            srcSet={`${item.img}?w=248&fit=crop&auto=format&dpr=2 2x`}
                            src={`${item.img}?w=248&fit=crop&auto=format`}
                            alt={item.title}
                            loading="lazy"
                        />
                    </ImageListItem>
                ))}
        </ImageList>
    );
}