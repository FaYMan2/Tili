import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import { usernameAtom, isLoggedInAtom, interviewsData } from "../utils/atom";
import CreateInterviewSheet from "@/components/CreateInterviewSheet";
import { Toaster, toast } from "sonner";  
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

  const handleCreateInterview = async (jobName: string, resume: string | null, jobDescription: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    console.log(jobDescription)
    try {
      const response = await fetch(`http://127.0.0.1:8000/createInterview/${username}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_data: resume || "", // Pass resume or empty string
          job_description: jobDescription,
          job_name: jobName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Interview created successfully!", {
          description: `Interview ID: ${data.interview_id}`,
        });
        // Optionally, refresh the interviews list
      } else {
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
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <Toaster position="top-right" richColors /> {/* Add Toaster component */}
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