from pydantic import BaseModel
from typing import List
class UserInput(BaseModel):
    username: str
    email: str
    password: str


class interviewFromData(BaseModel):
    user_data : str
    job_description : str
    job_name : str
    
    
class Questions(BaseModel):
    questions : List[str]

class Answer(BaseModel):
    answerData : str
    answerNum : int
    
    
    