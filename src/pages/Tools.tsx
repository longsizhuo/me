import { VideoToAscii } from "char-anime";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { styles } from "../styles";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Tools = () => {
  const { t } = useTranslation();

  const tools = [
    {
      id: "video-to-ascii",
      name: t("tools.videoToAscii.name"),
      description: t("tools.videoToAscii.description"),
      component: <VideoToAscii />,
    },
  ];

  return (
    <div className="relative z-0 bg-primary min-h-screen flex flex-col">
      <Navbar />
      <div className="px-4 sm:px-8 pt-28 pb-10 max-w-[1400px] mx-auto flex-1 w-full">
        <Link
          to="/"
          className="text-secondary hover:text-white text-[14px] transition-colors"
        >
          {t("tools.back")}
        </Link>

        <h1 className={`${styles.sectionHeadText} text-white mt-4`}>
          {t("tools.title")}
        </h1>
        <p className={`${styles.sectionSubText} mt-2`}>
          {t("tools.subtitle")}
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
              <div className="bg-tertiary rounded-2xl p-4 w-full">
                {tool.component}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Tools;
