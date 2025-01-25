from config import TOGETHER_API_KEY
from langchain_together import ChatTogether
import os


if "TOGETHER_API_KEY" not in os.environ:    
    os.environ['TOGETHER_API_KEY'] = TOGETHER_API_KEY

llm = ChatTogether(
    model= 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    temperature=0.5,
    max_tokens= None,
    timeout= None,
    max_retries=2
)

def createQuestions(resumeText : str, JobDescription : str,questionCount : int) -> dict:
    pass


if __name__ == "__main__":
    print("executing ... ")
    messages = [
    (
        "system",
        "You are a helpful assistant that translates English to French. Translate the user sentence.",
    ),
        ("human", "I love programming."),
    ]
    ai_msg = llm.invoke(messages)
    print("doneee")
    print(ai_msg)