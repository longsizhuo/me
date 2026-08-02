import About from "./About";
import Album from "./Album";
import ContactAdvanced from "./ContactAdvanced";
import { ErrorBoundary } from "./ErrorBoundary";
import Experience from "./Experience";
import { GlobalLottieBackground } from "./GlobalLottieBackground";
import Hero from "./Hero";
import Navbar from "./Navbar";
import Works from "./Works";

// ponytail: EarthCanvas/StarsCanvas intentionally NOT re-exported here.
// This barrel is imported eagerly from App.tsx; anything routed through it
// lands in the entry chunk. Both canvases are loaded via React.lazy pointing
// at ./canvas/Earth and ./canvas/Stars directly (see App.tsx / ContactAdvanced.tsx)
// so three.js never enters this import graph.
export {
  About,
  Album,
  ContactAdvanced,
  ErrorBoundary,
  Experience,
  GlobalLottieBackground,
  Hero,
  Navbar,
  Works,
};
