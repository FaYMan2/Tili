from config import TOGETHER_API_KEY
from langchain_together import ChatTogether
import os
from prompts import QUESTION_PROMPT,RESPONSE_PROMPT,REVIEW_PROMPT
from models import Questions,InterviewData,interviewQuestions,ReviewResult  
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import logging
from typing import List


if "TOGETHER_API_KEY" not in os.environ:    
    os.environ['TOGETHER_API_KEY'] = TOGETHER_API_KEY

llm = ChatTogether(
    model= 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    temperature=0.5,
    max_tokens= None,
    timeout= None,
    max_retries=2,
    api_key=TOGETHER_API_KEY
)

async def createQuestions(resumeText : str, JobDescription : str) -> Questions:
    questionPrompt = QUESTION_PROMPT.format(
        resume_data = resumeText,
        job_description = JobDescription
    )
    structuredLLM = llm.with_structured_output(Questions)
    questions : Questions = await structuredLLM.ainvoke(questionPrompt)
    return questions


async def createResponse(question : str, answer : str):
    try:
        response_prompt = RESPONSE_PROMPT.format(
            question = question,
            answer = answer
        )
        async for chunk in llm.astream(response_prompt):
                yield chunk.content
                
    except Exception as e:
        yield f"An error occurred while generating the response: {str(e)}"




logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

RETRY_POLICY = retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((TimeoutError, ConnectionError))
)



async def createReviews(interview: InterviewData) -> List[ReviewResult]:

    semaphore = asyncio.Semaphore(5)  
    
    @RETRY_POLICY
    async def process_question(d: interviewQuestions) -> ReviewResult:
        async with semaphore:
            result = ReviewResult(
                question=d.question,
                answer=d.answer,
                review=None,
                error=None,
                attempts=0
            )
            
            try:
                review_prompt = REVIEW_PROMPT.format(
                    question=d.question,
                    answer=d.answer or "[No answer provided]"
                )
                
                response = await llm.ainvoke(review_prompt)
                result.review = response.content
                return result
                
            except Exception as e:
                result.error = f"{type(e).__name__}: {str(e)}"
                logger.error(
                    f"Failed processing question: {d.question[:50]}... - {result.error}"
                )
                return result

    tasks = [process_question(d) for d in interview.data]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    final_results = []
    for idx, res in enumerate(results):
        if isinstance(res, Exception):
            original_question = interview.data[idx].question
            final_results.append(ReviewResult(
                question=original_question,
                answer=interview.data[idx].answer,
                review=None,
                error=f"Processing failed: {str(res)}"
            ))
        else:
            final_results.append(res)
    
    return final_results



async def main():
    test_data = InterviewData(
        data=[
            interviewQuestions(
                question="How do you optimize API performance in FastAPI?",
                answer="Optimize FastAPI performance by using async functions for non-blocking I/O, database connection pooling (e.g., SQLAlchemy with asyncpg), caching (Redis, Memcached), gzip compression, pagination for large datasets, CDN for static assets, response model validation, load balancing, and profiling bottlenecks using tools like py-spy or cProfile."
            ),
            interviewQuestions(
                question="Explain Python concurrency",
                answer="GIL"
            )
        ]
    )
    
    reviews = await createReviews(test_data)
    
    # Print results
    for i, review in enumerate(reviews, 1):
        print(f"Review for Question {i}:")
        print(review)
        print("\n" + "-"*50 + "\n")

if __name__ == "__main__":
    asyncio.run(main())