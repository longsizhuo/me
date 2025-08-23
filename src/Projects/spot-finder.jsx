import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Box,
  Card,
  CardContent,
  Container,
  IconButton,
  Typography,
} from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import PhotoGalleryDialog from "../components/PhotoGalleryDialog";

const SpotFinder = () => {
  const navigate = useNavigate();

  // USYD Coding Fest 2024 照片数据
  // 使用 public 目录中的绝对路径，因为文件名包含空格
  const codingFestPhotos = [
    {
      src: "/USYDCodingFest/Coding Fest 2024 AWARDS_-516.jpg",
      alt: "USYD Coding Fest 2024 Awards",
      caption: "Coding Fest 2024 Awards",
      subtitle: "Outstanding Project Idea Award Champion",
    },
    {
      src: "/USYDCodingFest/Coding Fest 2024 AWARDS_-99.jpg",
      alt: "USYD Coding Fest 2024 Awards Ceremony",
      caption: "Awards Ceremony",
      subtitle: "Celebrating Innovation",
    },
    {
      src: "/USYDCodingFest/Coding Fest 2024 AWARDS_-238.jpg",
      alt: "USYD Coding Fest Visiting Other Teams' Projects",
      caption: "Project Exploration",
      subtitle: "Interacting and Exchanging with Other Teams",
    },
    {
      src: "/USYDCodingFest/Coding Fest 2024 STUDENTS_-48.jpg",
      alt: "USYD Coding Fest 2024 Students",
      caption: "Student Participants",
      subtitle: "Collaborative Learning",
    },
    {
      src: "/USYDCodingFest/Coding Fest 2024 STUDENTS_-17.jpg",
      alt: "USYD Coding Fest 2024 Team",
      caption: "Team Collaboration",
      subtitle: "Building Together",
    },
    {
      src: "/USYDCodingFest/Coding Fest 2024 STUDENTS_-124.jpg",
      alt: "USYD Coding Fest 2024 Innovation",
      caption: "Innovation Showcase",
      subtitle: "Future of Technology",
    },
  ];

  const handleReturn = () => {
    navigate(-1); // This navigates back to the previous page
  };
  return (
    <Container style={{ marginTop: "20px", maxWidth: "100%" }}>
      <IconButton
        color="primary"
        aria-label="add to shopping cart"
        onClick={handleReturn}
      >
        <ArrowBackIcon />
      </IconButton>
      <Card style={{ marginBottom: "20px" }}>
        <CardContent>
          <Box mb={2}>
            <Typography variant="h4" component="h1" gutterBottom>
              <a
                href="https://longsizhuo.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "blue" }}
              >
                Spot Finder
              </a>
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Role: Scrum Master | Clicks: 5k+
            </Typography>
          </Box>
          <Box mb={2}>
            <Typography variant="body1">
              Led a team to devise an urban parking space time-sharing rental
              system, addressing parking problems for travelers and increasing
              income for parking space owners.
            </Typography>
          </Box>
          <Box mt={4}>
            <Typography variant="h6" component="h2" gutterBottom>
              Achievements:
            </Typography>
            <ul>
              <li>
                <Typography variant="body2">
                  Achieved a project score of 95/100; selected for USYD Coding
                  Fest and UNSW Incubator Peter Farrell Cup.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Won the Outstanding Project Idea Award Champion in the USYD
                  Coding Fest 2024.
                </Typography>
              </li>
            </ul>
          </Box>
        </CardContent>
      </Card>

      <Card style={{ marginBottom: "20px" }}>
        <CardContent>
          <Typography variant="h5" component="h3" gutterBottom>
            Live Preview of SpotFinder
          </Typography>
          <Box
            sx={{
              height: "400px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
              border: "1px solid #ccc",
            }}
          >
            <iframe
              src="https://longsizhuo.com"
              title="longsizhuo.com"
              style={{ width: "100%", height: "100%", border: "none" }}
            ></iframe>
          </Box>
        </CardContent>
      </Card>

      <PhotoGalleryDialog
        title="Pictures of USYD Coding Fest 2024"
        buttonText="View Photos"
        description="Memories from winning the Outstanding Project Idea Award Champion"
        photos={codingFestPhotos}
        maxWidth="xl"
        fullWidth={true}
      />
    </Container>
  );
};

export default SpotFinder;
