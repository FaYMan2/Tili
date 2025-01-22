import { motion } from 'framer-motion';
import { Brain, MessageSquare, LineChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isLoggedInAtom } from '../utils/atom';

const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <motion.div variants={itemVariants} className="text-center mb-16">
        <h1 className="text-5xl font-bold text-white mb-6">Welcome to Tili AI</h1>
        <p className="text-xl text-gray-300 mb-8">
          Your AI-powered interviewer for mock interviews and preparation.
        </p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            to={!isLoggedInAtom ? "/signup" : "/dashboard"}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-600 transition-colors inline-block shadow-lg shadow-blue-500/20"
          >
            Get Started
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {[
          {
            icon: <MessageSquare className="h-8 w-8" />,
            title: "Mock Interviews",
            description: "Practice real-world scenarios."
          },
          {
            icon: <Brain className="h-8 w-8" />,
            title: "Detailed Feedback",
            description: "Improve with our AI insights."
          },
          {
            icon: <LineChart className="h-8 w-8" />,
            title: "Career Growth",
            description: "Level up your interview skills."
          }
        ].map((feature, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-lg"
          >
            <div className="text-blue-500 mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
            <p className="text-gray-300">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default Home