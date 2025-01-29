from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from auth import AuthHandler
from config import DB
from models import UserInput,interviewFromData,Questions,Answer
from together import createQuestions

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

        data = {
            "user_data": interviewData.user_data,
            "job_description": interviewData.job_description,
            "creator": username,
            "job_name": interviewData.job_name,
            "questions": questions.model_dump()  
        }
        print(f"Inserting Data: {data}")

        response = DB.table('Interview').insert(data).execute()

        if hasattr(response, 'data') and response.data:
            return {
                "message": "Interview created successfully",
                "interview_id": response.data[0].get('id'),
            }
        else:
            raise Exception("Unexpected database response format.")

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


@app.get('/interviews/question/{id}')
async def startInterview(
    id: str,
    token: str = Depends(oauth2_scheme)
):
    try:
        payload = auth.decodeToken(token)
        _, username = payload['sub'].split('+')

        interview = DB.table('Interview').select('questions', 'answers').eq('id', id).execute()

        if not interview or not interview.data:
            raise HTTPException(status_code=404, detail="Interview not found")

        interview_data = interview.data[0]

        questions = interview_data.get('questions', {}).get('questions', [])
        answers = interview_data.get('answers', [])

        if not isinstance(questions, list):
            raise HTTPException(
                status_code=500, 
                detail="Invalid questions structure in the database."
            )

        if not isinstance(answers, list) and answers is not None:
            return {
                "error" : answers
            }
        if answers is None:
            return {
                "questionNumber" : 1,
                "question" : questions[0]
            }
        
        if len(answers) >= len(questions):
            return {
                "detail": "All questions have been answered.",
                "totalQuestions": len(questions),
                "answeredQuestions": len(answers)
            }

        questionNumber = len(answers)
        question = questions[questionNumber]

        return {
            "questionNumber": questionNumber + 1, 
            "question": question,
        }

    except HTTPException as e:
        raise e

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred: {str(e)}"
        )
        
        

@app.post('/interviews/answer/{id}')
async def addAnswer(
    id: str,
    answerData: Answer,
    token: str = Depends(oauth2_scheme)
):
    try:
        payload = auth.decodeToken(token)
        _, username = payload['sub'].split('+')

        interview = DB.table('Interview').select('answers').eq('id', id).execute()

        if not interview or not interview.data:
            raise HTTPException(status_code=404, detail="Interview not found")

        interview_data = interview.data[0]
        answers = interview_data.get('answers', None)

        if answers is None:
            answers = []

        if (len(answers) + 1)  != answerData.answerNum:
            raise HTTPException(
                status_code=401,
                detail=f"Unauthorized answer : number of ans : {len(answers)} adding answer {answerData.answerNum}"
            )

        answers.append(answerData.answerData)
        update_result = DB.table('Interview').update({'answers': answers}).eq('id', id).execute()

        return {
            "detail": "Answer added successfully.",
            "updatedAnswers": answers
        }

    except HTTPException as e:
        raise e

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred: {str(e)}"
        )
