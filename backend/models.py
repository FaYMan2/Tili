from pydantic import BaseModel
from typing import List,Optional
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
    question : str
    
    class Config:
      alias_generator = lambda x: x  
      allow_population_by_field_name = True
    
class interviewQuestions(BaseModel):
    question : str
    answer : str | None
      
class InterviewData(BaseModel):
    data : list[interviewQuestions]
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        
class ReviewResult(BaseModel):
    question: str
    answer: Optional[str]
    review: Optional[str]
    error: Optional[str]
    attempts: int = 0 
    
    
    
    