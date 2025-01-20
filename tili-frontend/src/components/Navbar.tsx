import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { useAtom } from "jotai";
import { isLoggedInAtom, usernameAtom } from "../utils/atom";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useAtom(isLoggedInAtom);
  const [username, setUsername] = useAtom(usernameAtom);

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    setIsLoggedIn(false);
    setUsername("");
  };

  return (
    <nav className="bg-black/50 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold text-white">Tili AI</span>
            </Link>
          </motion.div>

          <div className="flex space-x-4">
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="bg-blue-500 text-white h-10 w-10 rounded-full flex items-center justify-center font-semibold text-lg">
                    {username.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-white hover:bg-white/10 px-4 py-2 rounded-md transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:bg-white/10 px-4 py-2 rounded-md transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-md transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
