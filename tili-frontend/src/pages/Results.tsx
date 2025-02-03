import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Zap, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAtom } from 'jotai';
import { usernameAtom,isLoggedInAtom } from '@/utils/atom';

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const ResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [username,setUsername] = useAtom(usernameAtom);
  const [,setIsLoggedIn] = useAtom(isLoggedInAtom)

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`http://localhost:8000/result/${username}/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        // If interview is not completed (status 402), navigate to interview page
        if (response.status === 402) {
          const errorData = await response.json();
          if (errorData.detail === "Interview not completed") {
            navigate(`/interview/${id}`);
            return;
          }
        }

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
          throw new Error("Failed to fetch results");
        }

        const data = await response.json();
        setResults(data);
        const answered = data.filter((r: any) => r.answer).length;
        setScore(Math.round((answered / data.length) * 100));
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [id, username, navigate]);

  const getAnswerStatus = (answer: string | null) => {
    if (!answer) return 'skipped';
    return answer.length > 10 ? 'strong' : 'weak';
  };

  const renderStatusIcon = (status: string) => {
    if (status === 'skipped')
      return <AlertCircle className="w-6 h-6 text-red-400" />;
    if (status === 'strong')
      return <CheckCircle className="w-6 h-6 text-green-400" />;
    return <Zap className="w-6 h-6 text-yellow-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[calc(100vh-4rem)] bg-gray-900 p-8"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Return to Dashboard
          </motion.button>

          <motion.div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
            <div className="relative px-6 py-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Score: {score}%
              </span>
            </div>
          </motion.div>
        </motion.div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center h-64"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </motion.div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {results.map((result, index) => {
              const status = getAnswerStatus(result.answer);
              return (
                <AccordionItem key={index} value={`item-${index}`} className="border border-white/10 rounded-lg bg-white/5">
                  <AccordionTrigger className="flex items-center justify-between p-4 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-opacity-20">
                        {renderStatusIcon(status)}
                      </div>
                      <span className="text-xl font-semibold text-gray-100">
                        {result.question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4">
                    {result.answer && (
                      <div className="mb-4 p-4 bg-black/20 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-400 mb-2">Your Answer</h4>
                        <p className="text-gray-300 whitespace-pre-wrap">{result.answer}</p>
                      </div>
                    )}

                    <div className="p-4 bg-black/20 rounded-lg text-gray-100">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h2: ({ node, ...props }) => (
                            <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2" {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc pl-6 space-y-2 text-gray-100" {...props} />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong className="text-blue-400" {...props} />
                          ),
                          code: ({ node, ...props }) => (
                            <code className="bg-white/10 px-2 py-1 rounded text-sm text-gray-100" {...props} />
                          ),
                        }}
                      >
                        {result.review}
                      </ReactMarkdown>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </motion.div>
  );
};

export default ResultsPage;
