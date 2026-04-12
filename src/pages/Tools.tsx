import { VideoToAscii } from "char-anime";
import { Link } from "react-router-dom";
import { styles } from "../styles";

const tools = [
  {
    id: "video-to-ascii",
    name: "Video to ASCII",
    description: "Convert video into real-time ASCII art animation in the browser.",
    component: <VideoToAscii />,
  },
];

const Tools = () => {
  return (
    <div className="relative z-0 bg-primary min-h-screen">
      <div className={`${styles.paddingX} pt-28 pb-10 max-w-7xl mx-auto`}>
        <Link
          to="/"
          className="text-secondary hover:text-white text-[14px] transition-colors"
        >
          &larr; Back to Home
        </Link>

        <h1 className={`${styles.sectionHeadText} text-white mt-4`}>
          Tools.
        </h1>
        <p className={`${styles.sectionSubText} mt-2`}>
          Fun little tools I built for myself and others
        </p>

        <div className="mt-12 flex flex-col gap-16">
          {tools.map((tool) => (
            <div key={tool.id} id={tool.id}>
              <h2 className="text-white font-bold text-[28px] mb-2">
                {tool.name}
              </h2>
              <p className="text-secondary text-[16px] mb-6">
                {tool.description}
              </p>
              <div className="bg-tertiary rounded-2xl p-6">
                {tool.component}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tools;
