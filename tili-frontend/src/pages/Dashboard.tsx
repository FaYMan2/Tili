import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import { usernameAtom, isLoggedInAtom, servAddr } from "../utils/atom";
import CreateInterviewSheet from "@/components/CreateInterviewSheet";
import { Toaster, toast } from "sonner";

interface InterviewCard {
  id: number;
  created_at: string;
  job_name: string;
  result: number | null;
}

const Dashboard: React.FC = () => {
  const [username] = useAtom(usernameAtom);
  const [interviews, setInterviews] = useState<InterviewCard[] | null>(null);
  const [, setError] = useState<string | null>(null);
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
        const response = await fetch(`${servAddr}/interviews/${username}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setInterviews(data.interviews);
        } else {
          const errorData = await response.json();
          setError(errorData.detail || "Failed to fetch interviews.");
          if (response.status === 401) {
            localStorage.clear();
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

  const handleCreateInterview = async (jobName: string, resume: string | null, jobDescription: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await fetch(`${servAddr}/createInterview/${username}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_data: resume || "",
          job_description: jobDescription,
          job_name: jobName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Interview created successfully!", {
          description: `Interview ID: ${data.interview_id}`,
        });
      } else {
        if (response.status === 401) {
          const errorData = await response.json();
          if (errorData.detail === "Token has expired") {
            localStorage.clear();
            setIsLoggedIn(false);
            setUsername("");
            navigate("/login");
            return;
          }
        }

        const errorData = await response.json();
        toast.error("Failed to create interview", {
          description: errorData.detail || "An error occurred.",
        });
      }
    } catch (err) {
      toast.error("An error occurred", {
        description: "Failed to connect to the server.",
      });
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.3 } },
      }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12"
    >
      <Toaster position="top-right" richColors />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-10 gap-4">
        <h1 className="text-3xl sm:text-5xl font-bold text-white text-center sm:text-left">Dashboard</h1>
        <CreateInterviewSheet onCreate={handleCreateInterview} />
      </div>

      {/* Interviews Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 overflow-auto">
        {interviews?.map((interview) => (
          <motion.div
            key={interview.id}
            whileHover={{ y: -5 }}
            className="bg-white/10 p-5 sm:p-6 rounded-xl border border-white/20 shadow-lg hover:cursor-pointer transition-all"
            onClick={() =>
              interview.result === 1
                ? navigate(`/results/${interview.id}`)
                : navigate(`/interview/${interview.id}`)
            }
          >
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">{interview.job_name}</h3>
            <p className="text-gray-300 text-sm sm:text-base mb-2">
              <strong>Interview Date:</strong> {new Date(interview.created_at).toLocaleString()}
            </p>
            <p
              className={`font-semibold text-sm sm:text-lg ${
                interview.result === 1 ? "text-green-500" : "text-yellow-400"
              }`}
            >
              <strong>Status:</strong> {interview.result === 1 ? "Completed" : "Pending"}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Dashboard;
