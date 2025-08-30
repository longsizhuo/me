import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import type { PhotoGalleryDialogProps } from "./TYPE";

/**
 * PhotoGalleryDialog - 通用照片展示组件
 *
 * @param {Object} props
 * @param {string} props.title - 照片集标题
 * @param {string} props.buttonText - 按钮文本
 * @param {Array} props.photos - 照片数组，支持两种格式：
 *   - 简单格式: ["/path/to/image1.jpg", "/path/to/image2.jpg"]
 *   - 详细格式: [{src: "/path/to/image.jpg", alt: "描述", caption: "标题", subtitle: "副标题"}]
 * @param {string} props.description - 照片集描述（可选）
 * @param {string} props.maxWidth - Dialog 最大宽度，可选值: xs, sm, md, lg, xl
 * @param {boolean} props.fullWidth - 是否全宽显示
 *
 * @example
 * // 简单使用
 * <PhotoGalleryDialog
 *   title="My Photos"
 *   photos={["/path1.jpg", "/path2.jpg"]}
 * />
 *
 * @example
 * // 详细使用
 * <PhotoGalleryDialog
 *   title="Project Gallery"
 *   description="Project development process"
 *   buttonText="Show Images"
 *   photos={[
 *     {src: "/path1.jpg", alt: "Step 1", caption: "Planning", subtitle: "Initial design"},
 *     {src: "/path2.jpg", alt: "Step 2", caption: "Development", subtitle: "Coding phase"}
 *   ]}
 *   maxWidth="xl"
 * />
 */
const PhotoGalleryDialog = ({
  title = "Photo Gallery",
  buttonText = "View Photos",
  photos = [],
  description = "",
  maxWidth = "lg",
  fullWidth = true,
}: PhotoGalleryDialogProps) => {
  const [openGallery, setOpenGallery] = useState(false);

  const handleOpenGallery = () => {
    setOpenGallery(true);
  };

  const handleCloseGallery = () => {
    setOpenGallery(false);
  };

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h5" component="h3" gutterBottom>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {description}
            </Typography>
          )}
          <Button variant="outlined" onClick={handleOpenGallery}>
            {buttonText}
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={openGallery}
        onClose={handleCloseGallery}
        maxWidth={maxWidth}
        fullWidth={fullWidth}
      >
        <DialogContent>
          {photos.length > 0 ? (
            <Box sx={{ width: "100%", height: "auto" }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                {title}
              </Typography>
              <ImageList
                sx={{ width: "100%", height: "auto" }}
                cols={3}
                rowHeight={200}
                gap={8}
              >
                {photos.map((photo, index) => (
                  <ImageListItem key={index}>
                    <img
                      src={photo.src || photo}
                      alt={photo.alt || `${title} ${index + 1}`}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                    {photo.caption && (
                      <ImageListItemBar
                        title={photo.caption}
                        subtitle={photo.subtitle}
                        sx={{
                          background: "rgba(0,0,0,0.7)",
                          color: "white",
                          borderBottomLeftRadius: "8px",
                          borderBottomRightRadius: "8px",
                        }}
                      />
                    )}
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
                color: "text.secondary",
              }}
            >
              <Typography variant="body1">No photos available</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PhotoGalleryDialog;
