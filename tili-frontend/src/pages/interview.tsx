import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

interface Question {
    questionNumber: number;
    question: string;
}

const Interview: React.FC = () => {
    const { interviewId } = useParams();
    const [question, setQuestionData] = useState<Question | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showGuidelines, setShowGuidelines] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchQuestion = async (id: string) => {
      const token = localStorage.getItem("access_token");
        try {
            setIsLoading(true);
            const response = await fetch(`http://localhost:8000/interviews/question/${id}`, {
                method: "GET",
                headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });
              
            if (!response.ok) {
                throw new Error("Failed to fetch question");
            }
            const data = await response.json();

            if (data.detail) {
                setError(data.detail);
                setQuestionData(null);
            } else {
                setQuestionData({
                    questionNumber: data.questionNumber,
                    question: data.question,
                });
                setError(null);
            }
        } catch (error) {
            console.error("Error fetching question:", error);
            setError("An error occurred while fetching the question.");
        } finally {
            setIsLoading(false);
        }
    };

    const startInterview = () => {
        setShowGuidelines(false);
        fetchQuestion(interviewId as string);
    };

    useEffect(() => {
        if (!showGuidelines && question === null && !error) {
            fetchQuestion(interviewId as string);
        }
    }, [showGuidelines, interviewId, question, error]);

    return (
        <div className="p-4">
            {showGuidelines ? (
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Interview Guidelines</h1>
                    <ul className="list-disc text-left mx-auto max-w-lg">
                        <li>
                            The interview consists of 5 questions all based on the
                            interviewee's resume and given Job description.
                        </li>
                        <li>
                            Each question has 10 seconds of reading time followed by 2 minutes of
                            writing time.
                        </li>
                        <li>
                            Make sure to answer the questions within 60 words in English.
                        </li>
                    </ul>
                    <button
                        className="bg-blue-500 text-white px-4 py-2 mt-6 rounded hover:bg-blue-600"
                        onClick={startInterview}
                    >
                        Start Interview
                    </button>
                </div>
            ) : (
                <div>
                    {isLoading ? (
                        <p>Loading question...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : question ? (
                        <div>
                            <h2 className="text-xl font-bold">
                                Question {question.questionNumber}:
                            </h2>
                            <p className="mt-2">{question.question}</p>
                            {/* Add timer or answer submission logic here */}
                        </div>
                    ) : (
                        <p>No question found.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Interview;
