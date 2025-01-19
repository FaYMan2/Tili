import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MenuIcon } from "@heroicons/react/outline";

const Navbar: React.FC = () => {
  return (
    <motion.nav
      className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white shadow-lg"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <motion.h1
          className="text-2xl font-bold tracking-wide"
          whileHover={{ scale: 1.1 }}
        >
          <Link to="/">Tili AI</Link>
        </motion.h1>
        <div className="hidden md:flex gap-6">
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <Link to="/login" className="hover:underline">
            Login
          </Link>
          <Link to="/signup" className="hover:underline">
            Sign Up
          </Link>
        </div>
        <MenuIcon className="md:hidden h-6 w-6 cursor-pointer" />
      </div>
    </motion.nav>
  );
};

export default Navbar;
