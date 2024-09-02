import React, { useState, useEffect } from 'react';
import { ImageList, ImageListItem, Grow } from '@mui/material';

// 动态导入图片
const images = import.meta.glob('../public/USYDCodingFest/*.{jpg,png,gif}', { eager: true });

const allItemData = Object.keys(images).map((key) => {
    return {
        img: images[key].default,
        title: key.split('/').pop().split('.')[0], // 使用文件名作为标题
    };
});

const shuffledItemData = allItemData.sort(() => Math.random() - 0.5);

export default function SpotFinderImages() {
    const [visibleImages, setVisibleImages] = useState(shuffledItemData.slice(0, 8));
    const [checkedStates, setCheckedStates] = useState(new Array(8).fill(false));

    useEffect(() => {
        const showImagesSequentially = () => {
            visibleImages.forEach((_, index) => {
                setTimeout(() => {
                    setCheckedStates((prevStates) => {
                        const newStates = [...prevStates];
                        newStates[index] = true;
                        return newStates;
                    });
                }, index * 500);
            });
        };

        showImagesSequentially();

        const interval = setInterval(() => {
            visibleImages.forEach((_, index) => {
                setTimeout(() => {
                    setCheckedStates((prevStates) => {
                        const newStates = [...prevStates];
                        newStates[index] = false; // 隐藏每个图片
                        return newStates;
                    });
                }, index * 300); // 延迟300ms逐步隐藏
            });

            setTimeout(() => {
                setVisibleImages((prevImages) => {
                    const nextStartIndex = allItemData.indexOf(prevImages[prevImages.length - 1]) + 1;
                    let newImages;
                    newImages = [
                        ...prevImages.slice(1),
                        allItemData[nextStartIndex % allItemData.length]
                    ];
                    return newImages;
                });
                showImagesSequentially();
            }, 300 * visibleImages.length); // 在隐藏图片后延迟再开始显示
        }, 5000);

        return () => {
            clearInterval(interval);
        };
    }, [visibleImages]);

    return (
        <ImageList
            sx={{ width: '100%', height: 'auto' }}
            variant="woven"
            cols={4}
            rowHeight={121}
        >
            {visibleImages.map((item, index) => (
                <Grow
                    in={checkedStates[index]}
                    timeout={1000}
                    key={index}
                >
                    <ImageListItem cols={1} rows={1}>
                        <img
                            src={item.img}
                            alt={item.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </ImageListItem>
                </Grow>
            ))}
        </ImageList>
    );
}
