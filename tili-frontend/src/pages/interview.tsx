import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { motion } from "framer-motion";
import { usernameAtom,isLoggedInAtom,servAddr } from "@/utils/atom";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";

interface Question {
  questionNumber: number;
  question: string;
}

const Interview: React.FC = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestionData] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username,setUsername] = useAtom(usernameAtom);
  const [,setIsLoggedIn] = useAtom(isLoggedInAtom)

  const [timer, setTimer] = useState(10);
  const [currentPhase, setCurrentPhase] = useState<"reading" | "writing">("reading");
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStreamComplete, setIsStreamComplete] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const fetchQuestion = async (id: string) => {
    const token = localStorage.getItem("access_token");
    try {
      setIsLoading(true);
      const response = await fetch(
        `${servAddr}/interviews/question/${username}/${id}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.status == 401){
        const errorData = await response.json()
        if (errorData.detail === "Token has expired") {
          setIsLoggedIn(false)
          setUsername("")
          navigate("/login")
          return;
        }
      }

      if (!response.ok) throw new Error("Failed to fetch question");
      const data = await response.json();
      
      if (data.message === "All questions have been answered") {
        navigate(`/results/${interviewId}`);
        return;
      }

      if (data.detail) {
        setError(data.detail);
        setQuestionData(null);
      } else {
        setQuestionData({
          questionNumber: data.question_index,
          question: data.question,
        });
        setError(null);
        setCurrentPhase("reading");
        setTimer(10);
        setAnswer("");
        setStreamedText("");
        setIsStreamComplete(false);
      }
    } catch (error) {
      console.error("Error fetching question:", error);
      setError("An error occurred while fetching the question.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("access_token");
    setIsSubmitting(true);
    setIsStreaming(true);
    setIsStreamComplete(false);
    setStreamedText("");

    try {
      const response = await fetch(
        `${servAddr}/interviews/answer/${username}/${interviewId}`,
        {
          method: "POST",
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            answerData: answer,
            answerNum: question?.questionNumber ? question.questionNumber - 1 : 0,
            question: question?.question
          }),
        }
      );

      if (response.status == 401){
        const errorData = await response.json()
        if (errorData.detail === "Token has expired") {
          setIsLoggedIn(false)
          setUsername("")
          navigate("/login")
          return;
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to submit answer");
      }
      if (!response.body) throw new Error("No response body");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setStreamedText(prev => prev + chunk);
      }

      setIsStreamComplete(true);
    } catch (error) {
      console.error("Submission error:", error);
      setError(error instanceof Error ? error.message : "Failed to submit answer");
    } finally {
      setIsSubmitting(false);
      setIsStreaming(false);
    }
  };

  const handleProceed = async () => {
    if (question?.questionNumber === 5) {
      navigate(`/results/${interviewId}`);
    } else if (interviewId) {
      await fetchQuestion(interviewId);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (question && !isLoading) {
      if (currentPhase === "reading" && timer > 0) {
        interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      } else if (currentPhase === "reading" && timer <= 0) {
        setCurrentPhase("writing");
        setTimer(90);
      }

      if (currentPhase === "writing" && timer > 0) {
        interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      } else if (currentPhase === "writing" && timer <= 0) {
        handleSubmit();
      }
    }

    return () => clearInterval(interval);
  }, [currentPhase, timer, question, isLoading]);

  const startInterview = () => {
    setShowGuidelines(false);
    if (interviewId) fetchQuestion(interviewId);
  };

  const wordCount = answer.split(/\s+/).filter(word => word.length > 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      {showGuidelines ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-xl"
        >
          <motion.h1
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
          >
            Interview Guidelines
          </motion.h1>
          
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="list-none text-left mx-auto max-w-2xl space-y-4"
          >
            {[
              "The interview consists of 5 questions based on your resume and the job description.",
              "Each question has 10 seconds of reading time followed by 2 minutes of writing time.",
              "Answers must be within 60 words in English."
            ].map((item, index) => (
              <motion.li
                key={index}
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                className="text-lg text-gray-300 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10"
              >
                <span className="mr-2 text-blue-400">▹</span>{item}
              </motion.li>
            ))}
          </motion.ul>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all"
            onClick={startInterview}
          >
            Start Interview →
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 shadow-xl"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-300">Loading question...</p>
            </div>
          ) : error ? (
            <div className="text-center p-8">
              <div className="text-red-400 text-4xl mb-4">⚠️</div>
              <p className="text-red-400 text-xl">{error}</p>
            </div>
          ) : question ? (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-blue-400">
                  Question {question.questionNumber}/5
                </h2>
                <div className="w-16 h-16">
                  <CircularProgressbar
                    value={timer}
                    maxValue={currentPhase === "reading" ? 10 : 90}
                    text={formatTime(timer)}
                    styles={{
                      path: { 
                        stroke: currentPhase === "reading" ? '#3B82F6' : '#8B5CF6',
                      },
                      text: { 
                        fill: '#fff', 
                        fontSize: '24px',
                      },
                    }}
                  />
                </div>
              </div>
              
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="text-xl text-gray-300 bg-white/5 p-6 rounded-xl border border-white/10"
              >
                {question.question}
              </motion.div>

              <div className="mt-8 space-y-4">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={currentPhase === "reading" || isSubmitting || isStreamComplete}
                  className={`w-full h-48 bg-white/5 border rounded-xl p-4 text-gray-300 focus:outline-none transition-all ${
                    currentPhase === "reading" || isStreamComplete
                      ? "border-white/10 cursor-not-allowed opacity-50" 
                      : "border-blue-500/30 focus:ring-2 focus:ring-blue-500"
                  }`}
                  placeholder={
                    currentPhase === "reading" 
                      ? "Input will be enabled in 10 seconds..." 
                      : "Type your answer here (max 60 words)..."
                  }
                />
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${
                    wordCount > 60 ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {wordCount}/60 words
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isStreamComplete ? handleProceed : handleSubmit}
                    disabled={
                      isStreamComplete 
                        ? false 
                        : currentPhase === "reading" || isSubmitting || isStreaming || wordCount > 60
                    }
                    className={`bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-colors ${
                      (isStreamComplete 
                        ? false 
                        : currentPhase === "reading" || isSubmitting || isStreaming || wordCount > 60)
                      ? "cursor-not-allowed opacity-50" 
                      : "hover:bg-blue-600"
                    }`}
                  >
                    {isStreaming ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </span>
                    ) : isStreamComplete ? (
                      question?.questionNumber === 5 ? "Finish Interview" : "Proceed to Next Question"
                    ) : question?.questionNumber === 5 ? (
                      "Finish Interview"
                    ) : (
                      "Submit Answer"
                    )}
                  </motion.button>
                </div>

                {streamedText && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10"
              >
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Analysis:</h3>
                <div className="text-gray-300 whitespace-pre-wrap">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({className, children, ...props}) {
                        return (
                          <code className={clsx(className, "bg-white/10 px-1 rounded")} {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {streamedText}
                  </ReactMarkdown>
                  {isStreaming && (
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="ml-2"
                    >
                      ▌
                    </motion.span>
                  )}
                </div>
              </motion.div>
)}
              </div>
            </div>
          ) : (
            <p className="text-gray-300 text-center">No question found.</p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Interview;