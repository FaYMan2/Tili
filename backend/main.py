from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from auth import AuthHandler
from config import DB
from models import UserInput,interviewFromData,Questions,Answer
from together import createQuestions,createResponse
from fastapi.responses import StreamingResponse
from fastapi import logger

app = FastAPI()
auth = AuthHandler()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

    
app.add_middleware(
    CORSMiddleware,
    allow_origins = ['*'],
    allow_credentials = True,
    allow_methods = ['*'],
    allow_headers = ['*'],
)

@app.get("/")
async def main():
    return {"message" : "TILI API"}


    
@app.post("/signup")
async def signup(user: UserInput):
    try:
        hashed_password = auth.getPwdHash(user.password)
        
        new_user = {
            "username": user.username,
            "Email": user.email,
            "hashed_pwd": hashed_password,
        }
        response = DB.table('User').insert(new_user).execute()
        if hasattr(response, 'data'):
            user_data = response.data[0]
            return {
                "message": "User created successfully",
                "user_data": {
                    "email": user_data.get('Email'),
                    "userId": user_data.get('id'),
                    "userName": user_data.get('username'),
                }
            }
        else:
            raise Exception("Unexpected response format from the database.")
    except Exception as e:
        if "duplicate key value violates unique constraint" in str(e):
            raise HTTPException(
                status_code=400,
                detail="A user with this email already exists."
            )
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = DB.table("User").select("*").eq("Email", form_data.username).execute()
    if not user.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_data = user.data[0]
    if not auth.verifyPwd(form_data.password, user_data["hashed_pwd"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = auth.createAccessToken({"sub": f'{user_data["Email"]}+{user_data['username']}'})
    refresh_token = auth.createRefreshToken({"sub": f'{user_data["Email"]}+{user_data['username']}'})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "username" : user_data['username'],
        "token_type": "bearer",
    }

@app.post("/refresh")
async def refresh_token(refresh_token: str):
    payload = auth.decodeToken(refresh_token)
    new_access_token = auth.createAccessToken({"sub": payload["sub"]})
    return {"access_token": new_access_token, "token_type": "bearer"}

@app.get("/protected")
async def protected_route(token: str = Depends(oauth2_scheme)):
    payload = auth.decodeToken(token)
    return {"message": f"Hello {payload['sub']}"}


@app.get("/interviews/{username}")
async def get_interviews(username: str, token: str = Depends(oauth2_scheme)):
    payload = auth.decodeToken(token)
    if payload['sub'].split('+')[1] != username:
        raise HTTPException(status_code=403, detail=f"Access denied {payload['sub']} and {username}")
    try:
        interviews = DB.table("Interview").select("*").eq("creator", username).execute()
        if not interviews.data:
            raise HTTPException(status_code=404, detail="No interviews found for this user.")

        return {
            "username": username,
            "interviews": interviews.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
    
    
@app.post("/createInterview/{username}")
async def createInterview(
    username: str,
    interviewData: interviewFromData,
    token: str = Depends(oauth2_scheme)
):
    try:
        payload = auth.decodeToken(token)
        _, payloadUsername = payload['sub'].split('+')

        if payloadUsername != username:
            raise HTTPException(status_code=403, detail="Access denied")

        questions: Questions = await createQuestions(
            resumeText=interviewData.user_data,
            JobDescription=interviewData.job_description
        )

        questionData = {"data" : [{"question" : q, "answer" : ""} for q in questions.questions] }
        
        data = {
            "user_data": interviewData.user_data,
            "job_description": interviewData.job_description,
            "creator": username,
            "job_name": interviewData.job_name,
            "questions": questionData
        }
        print(f"Inserting Data: {data}")

        response = DB.table('Interview').insert(data).execute()

        if hasattr(response, 'data') and response.data:
            return {
                "message": "Interview created successfully",
                "interview_id": response.data[0].get('id'),
            }
        else:
            raise Exception("Unexpected database     response format.")

    except Exception as e:
        if "foreign key constraint" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail="Invalid creator username. Ensure the creator exists in the related table."
            )

        raise HTTPException(
            status_code=500,
            detail=f"An error occurred: {str(e)}"
        )


@app.get('/interviews/question/{username}/{id}')
async def startInterview(
    username: str,
    id: str,
    token: str = Depends(oauth2_scheme)
):
    try:
        payload = auth.decodeToken(token)
        _, payloadUsername = payload['sub'].split('+')

        if payloadUsername != username:
            raise HTTPException(status_code=403, detail="Access denied")

        data = DB.table('Interview').select('creator', 'questions').eq('id', id).execute()

        if not data.data:
            raise HTTPException(status_code=404, detail="Interview not found")

        interview = data.data[0]
        creator = interview.get('creator')
        questionData = interview.get('questions')

        if creator != username:
            raise HTTPException(status_code=403, detail="Access denied")

        questionsArr = questionData.get('data', []) if questionData else []

        if not questionsArr:
            raise HTTPException(status_code=404, detail="No questions available")

        for qIdx, ques in enumerate(questionsArr):
            if ques.get('answer') is None:
                return {
                    "question": ques.get('question'),
                    "question_index": qIdx + 1
                }

        return {"message": "All questions have been answered"}

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
        

@app.post('/interviews/answer/{username}/{id}')
async def addAnswer(
    username: str,
    id: str,
    answer_data: Answer,
    token: str = Depends(oauth2_scheme)
):
    try:
        payload = auth.decodeToken(token)
        _, payloadUsername = payload['sub'].split('+')
        if payloadUsername != username:
            raise HTTPException(status_code=403, detail="Access denied")
        
        interview_response = DB.table('Interview').select('creator,questions').eq('id', id).execute()
        if not interview_response.data:
            raise HTTPException(status_code=404, detail="Interview not found")

        interview = interview_response.data[0]
        creator = interview.get('creator')

        if creator != username:
            raise HTTPException(status_code=403, detail="Access denied")
        
        questions_data = interview.get('questions', {})
        questions_arr = questions_data.get('data', [])

        if answer_data.answerNum >= len(questions_arr) or answer_data.answerNum < 0:
            raise HTTPException(status_code=400, detail="Invalid question index")

        question_entry = questions_arr[answer_data.answerNum]
        
        if question_entry.get('answer') is not None:
            raise HTTPException(status_code=400, detail="Question already answered")
        
        if question_entry.get('question') != answer_data.question:
            raise HTTPException(status_code=400, detail="Question text mismatch")
        
        question_entry['answer'] = answer_data.answerData
        questions_data['data'] = questions_arr

        update_response = DB.table('Interview').update({'questions': questions_data}).eq('id', id).execute()
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to update answer")
        
        
        return StreamingResponse(
            content=createResponse(answer=answer_data.answerData,
                                    question=answer_data.question
                                ))

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.logger.error(f"Error processing answer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
        
