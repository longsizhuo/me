import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { styles } from "../styles";
import { navLinks } from "../constants";
import { menu, close } from "../assets";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [active, setActive] = useState("");
  const [toggle, setToggle] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const toggleLang = () => {
    const newLang = i18n.language === "en" ? "zh" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("lang", newLang);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`${styles.paddingX} w-full flex items-center py-5 fixed top-0 z-20 ${
        scrolled ? "bg-primary/80 backdrop-blur-md border-b border-white/5" : "bg-transparent"
      }`}
    >
      <div className="w-full flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2"
            onClick={() => {
              setActive("");
              window.scrollTo(0, 0);
            }}
          >
            <p className="text-white text-[18px] font-bold cursor-pointer flex">
              Sizhuo Long &nbsp;
              <span className="sm:block hidden"> | Full-stack</span>
            </p>
          </Link>
          <button
            onClick={toggleLang}
            className="text-secondary hover:text-white text-[13px] font-medium border border-secondary/30 hover:border-white/50 px-2 py-0.5 rounded transition-colors"
            title={i18n.language === "en" ? "切换到中文" : "Switch to English"}
          >
            {i18n.language === "en" ? "中文" : "EN"}
          </button>
        </div>

        {/* Desktop nav */}
        <ul className="list-none hidden sm:flex flex-row gap-4 lg:gap-6 items-center">
          {isHome &&
            navLinks.map((nav) => (
              <li
                key={nav.id}
                className={`${
                  active === nav.title ? "text-white" : "text-secondary"
                } hover:text-white text-[14px] lg:text-[15px] font-medium cursor-pointer transition-colors`}
                onClick={() => setActive(nav.title)}
              >
                <a href={`#${nav.id}`}>{t(`nav.${nav.id}`)}</a>
              </li>
            ))}
          <li>
            <Link
              to="/tools"
              className={`${
                location.pathname === "/tools" ? "text-white" : "text-secondary"
              } hover:text-white text-[14px] lg:text-[15px] font-medium cursor-pointer transition-colors`}
            >
              {t("nav.tools")}
            </Link>
          </li>
        </ul>

        {/* Mobile nav */}
        <div className="sm:hidden flex flex-1 justify-end items-center">
          <button
            onClick={() => setToggle(!toggle)}
            aria-label={toggle ? "Close menu" : "Open menu"}
            className="bg-transparent border-none p-0"
          >
            <img
              src={toggle ? close : menu}
              alt=""
              className="w-[28px] h-[28px] object-contain"
            />
          </button>

          <div
            className={`${
              !toggle ? "hidden" : "flex"
            } p-6 black-gradient absolute top-20 right-0 mx-4 my-2 min-w-[140px] z-10 rounded-xl`}
          >
            <ul className="list-none flex justify-end items-start flex-1 flex-col gap-4">
              {isHome &&
                navLinks.map((nav) => (
                  <li
                    key={nav.id}
                    className={`font-poppins font-medium cursor-pointer text-[16px] ${
                      active === nav.title ? "text-white" : "text-secondary"
                    }`}
                    onClick={() => {
                      setToggle(false);
                      setActive(nav.title);
                    }}
                  >
                    <a href={`#${nav.id}`}>{t(`nav.${nav.id}`)}</a>
                  </li>
                ))}
              <li
                className="font-poppins font-medium cursor-pointer text-[16px] text-secondary"
                onClick={() => setToggle(false)}
              >
                <Link to="/tools">{t("nav.tools")}</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
