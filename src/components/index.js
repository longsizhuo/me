import { EarthCanvas, BallCanvas, ComputersCanvas, StarsCanvas } from './canvas';
import Hero from "./Hero";
import Navbar from "./Navbar";
import About from "./About";
import Tech from "./Tech";
import Experience from "./Experience";
import Works from "./Works";
import Feedbacks from "./Feedbacks";
import Contact from "./Contact";
import ContactAdvanced from "./ContactAdvanced";
import CanvasLoader from "./Loader";
import { GlobalLottieBackground } from "./GlobalLottieBackground";
import Album from "./Album";
import { SectionWrapper } from "../hoc";
import { VideoToAscii as VideoToAsciiBase } from "@me/video-to-ascii";

const VideoToAscii = SectionWrapper(VideoToAsciiBase, "video-to-ascii");

export {
  Album,
  Hero,
  Navbar,
  About,
  Tech,
  Experience,
  Works,
  Feedbacks,
  Contact,
  ContactAdvanced,
  CanvasLoader,
  EarthCanvas, 
  BallCanvas, 
  ComputersCanvas, 
  StarsCanvas,
  GlobalLottieBackground,
  VideoToAscii
};
