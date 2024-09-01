import React, { useState, useEffect } from 'react';
import { ImageList, ImageListItem, Box, Grow } from '@mui/material';

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
        // 用于依次显示每张图片的动画
        visibleImages.forEach((_, index) => {
            setTimeout(() => {
                setCheckedStates((prevStates) => {
                    const newStates = [...prevStates];
                    newStates[index] = true; // 依次显示图片
                    return newStates;
                });
            }, index * 500); // 依次延迟500ms
        });

        // 每5秒切换一次图片
        const interval = setInterval(() => {
            setCheckedStates(new Array(10).fill(false)); // 先隐藏所有图片

            setTimeout(() => {
                setVisibleImages((prevImages) => {
                    const nextStartIndex = allItemData.indexOf(prevImages[prevImages.length - 1]) + 1;
                    const newImages = [
                        ...prevImages.slice(1),
                        allItemData[nextStartIndex % allItemData.length]
                    ];
                    return newImages;
                });

                new Array(10).fill(null).forEach((_, index) => {
                    setTimeout(() => {
                        setCheckedStates((prevStates) => {
                            const newStates = [...prevStates];
                            newStates[index] = true; // 再依次显示新的图片
                            return newStates;
                        });
                    }, index * 500); // 同样依次延迟500ms
                });
            }, 500); // 在隐藏图片后延迟500ms再开始显示
        }, 5000); // 每5秒轮换一次

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
                    timeout={1000} // 动画持续时间
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
