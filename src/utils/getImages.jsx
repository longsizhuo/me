import React, { useState, useEffect } from 'react';
import { ImageList, ImageListItem, Grow } from '@mui/material';

export default function SpotFinderImages() {
    const [allImages, setAllImages] = useState([]);
    const [visibleImages, setVisibleImages] = useState([]);
    const [checkedStates, setCheckedStates] = useState([]);

    useEffect(() => {
        const loadImages = async () => {
            const modules = import.meta.glob('../public/USYDCodingFest/*.{jpg,png,gif}');
            const loadedImages = await Promise.all(
                Object.keys(modules).map(async (key) => {
                    const module = await modules[key]();
                    return {
                        img: module.default,
                        title: key.split('/').pop().split('.')[0],
                    };
                })
            );
            const shuffled = loadedImages.sort(() => Math.random() - 0.5);
            setAllImages(shuffled);
            setVisibleImages(shuffled.slice(0, 8));
            setCheckedStates(new Array(8).fill(false));
        };
        loadImages();
    }, []);

    useEffect(() => {
        if (visibleImages.length === 0) return;

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
                        newStates[index] = false;
                        return newStates;
                    });
                }, index * 300);
            });

            setTimeout(() => {
                setVisibleImages((prevImages) => {
                    const nextStartIndex = allImages.indexOf(prevImages[prevImages.length - 1]) + 1;
                    return [
                        ...prevImages.slice(1),
                        allImages[nextStartIndex % allImages.length],
                    ];
                });
                showImagesSequentially();
            }, 300 * visibleImages.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [visibleImages, allImages]);

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
                            loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </ImageListItem>
                </Grow>
            ))}
        </ImageList>
    );
}
