# Personal Site Notes

These notes explain the folder structure and major components of the site. They are a reminder for myself and anyone curious about how the project works. Contributions are not expected.

## Tech Stack
- [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- Tailwind CSS for utility styles; Material UI for prebuilt components
- Three.js via [@react-three/fiber](https://github.com/pmndrs/react-three-fiber) for 3D scenes
- EmailJS and a small API handle the contact form

## Directory Overview
### src/components
- `Hero.jsx` – landing section with animated canvas and intro text
- `About.jsx` – short bio, skills and interests
- `Experience.jsx` – chronological timeline of work and study
- `Projects.jsx` – teaser cards for highlighted projects with an overlay for details
- `Tech.jsx` – grid of technology logos
- `Works.jsx` – portfolio case studies
- `Contact.jsx` / `ContactAdvanced.jsx` – contact forms. The advanced version sends email via EmailJS *and* posts to the API for persistence
- `canvas/` – reusable three.js scenes such as stars and rotating balls
- other components are named after their sections (e.g., Navbar, Footer)

### Other src folders
- `config/` – API base URL and EmailJS configuration
- `constants/` – navigation links, services list and other static data
- `hoc/` – higher‑order helpers like `SectionWrapper` that add animations and anchors
- `hook/` – custom React hooks (e.g., `useCharMetrics` for text animation)
- `utils/` – assorted utilities and animation helpers

## Implementation Notes
Each page section is wrapped by `SectionWrapper`, providing intersection-based reveal animations and in-page anchors. Three.js scenes are rendered by components under `canvas/` using `@react-three/fiber`. The contact forms use EmailJS; when the backend is available they also save submissions via REST.

## Development
- `npm run dev` – start the development server
- `npm run build` – build production assets
- The API base URL defaults to `http://localhost:8181` in dev and `https://me.longsizhuo.com` in production. Override it with `.env.local` containing `VITE_API_BASE_URL`.

## Deployment
The project builds to static files suitable for any static host. The optional backend for contact form submissions should be reachable at the configured API base URL.
