from config import TOGETHER_API_KEY
from langchain_together import ChatTogether
import os
from prompts import QUESTION_PROMPT,RESPONSE_PROMPT
from models import Questions

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


async def main():
    question = "Can you explain the difference between a process and a thread?"
    answer = "A process is an independent execution unit, whereas a thread is a lightweight subunit of a process."
    
    print("Streaming response:\n")
    async for chunk in createResponse(question, answer):
        print(chunk, end="", flush=True)


        
if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
    
    