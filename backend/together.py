from config import TOGETHER_API_KEY
from langchain_together import ChatTogether
import os
from prompts import QUESTION_PROMPT
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

if __name__ == "__main__":
    print("executing ... ")
    print(f"LLM: {llm}")
    questions = createQuestions(resumeText='Suvarna vats, PYTHON DEVELOPER with proffeciency in AI tools and langchain'
                                ,JobDescription='AI engineer - 1 \n\n should be outstanding in python , langchain and FastAPI')
    
    