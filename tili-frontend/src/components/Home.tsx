import React from "react";
import { motion } from "framer-motion";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100">
      <motion.div
        className="text-center py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <h1 className="text-4xl font-extrabold text-purple-700">
          Welcome to Tili AI
        </h1>
        <p className="mt-4 text-lg text-gray-700">
          Your AI-powered interviewer for mock interviews and preparation.
        </p>
        <motion.button
          className="mt-6 px-6 py-3 bg-purple-500 text-white rounded-lg shadow-lg hover:bg-purple-600"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Get Started
        </motion.button>
      </motion.div>
      <motion.div
        className="container mx-auto mt-10 grid grid-cols-1 md:grid-cols-3 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <div className="p-6 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold text-gray-800">Mock Interviews</h2>
          <p className="text-gray-600 mt-2">Practice real-world scenarios.</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold text-gray-800">Detailed Feedback</h2>
          <p className="text-gray-600 mt-2">Improve with our AI insights.</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold text-gray-800">Career Growth</h2>
          <p className="text-gray-600 mt-2">Level up your interview skills.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
