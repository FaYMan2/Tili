from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import logging
from auth import AuthHandler
from config import DB
from models import UserInput, interviewFromData, Questions, Answer, InterviewData, interviewQuestions, ReviewResult
from together import createQuestions, createResponse, createReviews

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
auth = AuthHandler()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

def get_authenticated_user(token: str):
    """Helper function to authenticate user and extract username."""
    try:
        payload = auth.decodeToken(token)
        email, username = payload['sub'].split('+')
        return email, username
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_user_from_db(email: str):
    """Fetch user details from database."""
    user = DB.table("User").select("*").eq("Email", email).execute()
    if not user.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user.data[0]

@app.get("/")
async def main():
    return {"message": "TILI API"}

@app.post("/signup")
async def signup(user: UserInput):
    try:
        hashed_password = auth.getPwdHash(user.password)
        new_user = {"username": user.username, "Email": user.email, "hashed_pwd": hashed_password}
        response = DB.table('User').insert(new_user).execute()
        if hasattr(response, 'data'):
            user_data = response.data[0]
            return {"message": "User created successfully", "user_data": user_data}
        else:
            raise Exception("Unexpected response format from the database.")
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user_data = get_user_from_db(form_data.username)
    if not auth.verifyPwd(form_data.password, user_data["hashed_pwd"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = auth.createAccessToken({"sub": f'{user_data["Email"]}+{user_data["username"]}'})
    refresh_token = auth.createRefreshToken({"sub": f'{user_data["Email"]}+{user_data["username"]}'})
    return {"access_token": access_token, "refresh_token": refresh_token, "username": user_data['username'], "token_type": "bearer"}

@app.post("/refresh")
async def refresh_token(refresh_token: str):
    payload = auth.decodeToken(refresh_token)
    new_access_token = auth.createAccessToken({"sub": payload["sub"]})
    return {"access_token": new_access_token, "token_type": "bearer"}

@app.get("/interviews/{username}")
async def get_interviews(username: str, token: str = Depends(oauth2_scheme)):
    _, auth_username = get_authenticated_user(token)
    if auth_username != username:
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        interviews = DB.table("Interview").select("*").eq("creator", username).execute()
        if not interviews.data:
            raise HTTPException(status_code=404, detail="No interviews found for this user.")
        return {"username": username, "interviews": interviews.data}
    except Exception as e:
        logger.error(f"Error fetching interviews: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/createInterview/{username}")
async def createInterview(username: str, interviewData: interviewFromData, token: str = Depends(oauth2_scheme)):
    _, auth_username = get_authenticated_user(token)
    if auth_username != username:
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        questions: Questions = await createQuestions(resumeText=interviewData.user_data, JobDescription=interviewData.job_description)
        questionData = {"data": [{"question": q, "answer": None} for q in questions.questions]}
        
        data = {"user_data": interviewData.user_data, "job_description": interviewData.job_description, "creator": username, "job_name": interviewData.job_name, "questions": questionData}
        logger.info(f"Creating interview for {username}")
        response = DB.table('Interview').insert(data).execute()
        
        if hasattr(response, 'data') and response.data:
            return {"message": "Interview created successfully", "interview_id": response.data[0].get('id')}
        else:
            raise Exception("Unexpected database response format.")
    except Exception as e:
        logger.error(f"Error creating interview: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get('/interviews/question/{username}/{id}')
async def startInterview(username: str, id: str, token: str = Depends(oauth2_scheme)):
    _, auth_username = get_authenticated_user(token)
    if auth_username != username:
        raise HTTPException(status_code=403, detail="Access denied")
    
    data = DB.table('Interview').select('creator', 'questions').eq('id', id).execute()
    if not data.data:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    interview = data.data[0]
    questionsArr = interview.get('questions', {}).get('data', [])
    for qIdx, ques in enumerate(questionsArr):
        if ques.get('answer') is None:
            return {"question": ques.get('question'), "question_index": qIdx + 1}
    return {"message": "All questions have been answered"}


@app.get("/result/{username}/{id}")
async def getResults(
    username: str,
    id: str,
    token: str = Depends(oauth2_scheme)
):
    try:
        payload = auth.decodeToken(token)
        _, payloadUsername = payload['sub'].split('+')
        if payloadUsername != username:
            raise HTTPException(status_code=403, detail="Access denied")
        
        interviewResponse = DB.table('Interview').select('questions', 'creator','reviews').eq('id', id).execute()
        
        if not interviewResponse.data:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        interview = interviewResponse.data[0]
        creator = interview.get('creator')
        if creator != username:
            raise HTTPException(status_code=403, detail="Access denied")
        
        questions_data = interview.get('questions', {})
        questions_arr = questions_data.get('data', [])
        reviews = interview.get('reviews')
        
        if reviews is not None:
            return reviews
        
        input_data = InterviewData(data=[interviewQuestions(**q) for q in questions_arr])
        
        review_results = await createReviews(input_data)
        
        reviews_list = [result.model_dump() for result in review_results]
        
        review_response = DB.table('Interview').update({"reviews": reviews_list}).eq('id', id).execute()
        
        return review_response.data[0].get('reviews')
    
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.logger.error(f"Error processing answer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")