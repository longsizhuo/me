import { Link } from "react-router-dom";
import { styles } from "../styles";
import Navbar from "../components/Navbar";

const NotFound = () => (
  <div className="relative z-0 bg-primary min-h-screen flex flex-col">
    <Navbar />
    <div className={`${styles.paddingX} flex-1 flex flex-col items-center justify-center text-center`}>
      <h1 className="text-white font-black text-[120px] sm:text-[180px] leading-none select-none">
        404
      </h1>
      <p className="text-secondary text-[20px] mt-4 max-w-md">
        This page doesn't exist — maybe it wandered off to find some hot cocoa.
      </p>
      <Link
        to="/"
        className="mt-8 px-8 py-3 bg-tertiary text-white font-semibold rounded-xl hover:bg-secondary hover:text-black transition-colors duration-200"
      >
        Go Home
      </Link>
    </div>
  </div>
);

export default NotFound;
