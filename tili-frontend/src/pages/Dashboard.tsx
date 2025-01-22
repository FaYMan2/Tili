import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import { usernameAtom, isLoggedInAtom, interviewsData } from "../utils/atom";
import CreateInterviewSheet from "@/components/CreateInterviewSheet";

interface Interview {
  id: number;
  created_at: string;
  job_name: string;
  result: number | null;
}

const Dashboard: React.FC = () => {
  const [username] = useAtom(usernameAtom);
  const [interviews, setInterviews] = useState<Interview[] | null>(null);
  const [, setError] = useState<string | null>(null);
  const [, setInterviewsData] = useAtom(interviewsData);
  const [, setIsLoggedIn] = useAtom(isLoggedInAtom);
  const [, setUsername] = useAtom(usernameAtom);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInterviews = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return;
      }
      if (!username) return;

      try {
        const response = await fetch(`http://127.0.0.1:8000/interviews/${username}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setInterviews(data.interviews);
          setInterviewsData(data.interviews);
        } else {
          const errorData = await response.json();
          setError(errorData.detail || "Failed to fetch interviews.");
          if (response.status === 401) {
            localStorage.removeItem("username");
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            setIsLoggedIn(false);
            setUsername("");
            navigate("/login");
          }
        }
      } catch (err) {
        setError("An error occurred while fetching interviews.");
      }
    };

    fetchInterviews();
  }, [username, navigate, setIsLoggedIn, setUsername]);

  const handleCreateInterview = async (jobName: string, resume: File | null, jobDescription: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const formData = new FormData();
    formData.append("job_name", jobName);
    if (resume) formData.append("resume", resume);
    formData.append("job_description", jobDescription);
    console.log(formData)

  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.3 } },
      }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-5xl font-bold text-white">Dashboard</h1>
        <CreateInterviewSheet onCreate={handleCreateInterview} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {interviews?.map((interview) => (
          <motion.div
            key={interview.id}
            whileHover={{ y: -5 }}
            className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-lg"
          >
            <h3 className="text-xl font-semibold text-white mb-2">{interview.job_name}</h3>
            <p className="text-gray-300 mb-2">
              <strong>Interview Date:</strong>{" "}
              {new Date(interview.created_at).toLocaleString()}
            </p>
            <p
              className={`font-semibold text-lg ${
                interview.result === 1
                  ? "text-green-500"
                  : interview.result === 2
                  ? "text-red-500"
                  : "text-yellow-400"
              }`}
            >
              <strong>Result:</strong>{" "}
              {interview.result === 1
                ? "Passed"
                : interview.result === 2
                ? "Failed"
                : "Pending"}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Dashboard;
