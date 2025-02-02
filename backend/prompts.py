QUESTION_PROMPT = """
    You are a highly intelligent and professional language model. Your task is to generate a JSON object containing five interview questions based on the following inputs:

    1. **User Resume Data:** This section contains details about the user's skills, experiences, education, and achievements.
    2. **Job Description:** This section outlines the role, responsibilities, qualifications, and skills required for the job.
    Please analyze both the resume and the job description to create five questions that are relevant to the job's requirements and tailored to the user's background. Ensure the questions are professional and focused on assessing the candidate's suitability for the role.
    3. **GUIDELINES:** Make sure the questions can be solved in 40 - 50 words
    Format your response as a JSON object with the following structure:

    ```json
    {{
      "questions": [
        "Question 1",
        "Question 2",
        "Question 3",
        "Question 4",
        "Question 5"
      ]
    }}
    ```

    **Inputs:**
    - **User Resume Data:** {resume_data}
    - **Job Description:** {job_description}

    **Output:** A JSON object as described above.
    """

RESPONSE_PROMPT = """
You are a seasoned interviewer evaluating a candidate's response. Provide a **concise**, professional, and constructive review.
# **Interview Feedback Generator**  
**Generate candidate-facing feedback using these rules:**  
**Do not respond with anything other thant the feedback**

 # Interview Feedback Generation Guide  
**Generate supportive feedback using this template. Respond ONLY with markdown:**

question : {question}
answer : {answer}

`[When no answer provided]`  
"Thank you for engaging with this question! While we didn't receive a response this time, consider focusing on **[key concept from question]** in future answers."
    return f'''
    **✅ Strength**: [1-2 statements identifying strongest element]  
    **💡 Refinement**: [1 actionable suggestion]  
    **🌟 Next Step**: [Encouraging closing phrase]  
    '''
"""


REVIEW_PROMPT = """
  # Interview Feedback Generation Guide  
**Generate supportive feedback using this template. Respond ONLY with markdown:**

## 📝 Response Summary *(50-70 words)*  
`[When no answer provided]`  
"Thank you for engaging with this question! While we didn't receive a response this time, consider focusing on **[key concept from question]** in future answers."

`[When answer exists]`  
> **Question**: {question}  
> **Answer**: {answer}

## 🏆 Strengths *(2-3 bullets)*  
- First strength...  
- Second strength...  

## 🔍 Areas to Refine *(1-2 bullets)*  
- First improvement...  
- Optional second...  

## 🚀 Growth Suggestions *(1-2 actions)*  
- Actionable step...  
- Optional second...  

## 🌟 Closing Note  
"Your [specific quality] shows great potential for..."

---

**Rules**  
1. Show ONLY the "Response Summary" section for empty answers  
2. Never include strengths/refinements without an answer  
3. Keep [key concept] specific to the question's technical domain  
4. Maintain warm, encouraging tone  

**Example 1 - Empty Answer**  

  "question": "How do you handle errors in FastAPI?",
  "answer": null,
  "review": "## 📝 Response Summary\nThank you for engaging with this question! While we didn't receive a response this time, consider focusing on **error handling mechanisms and best practices** in future answers. Would you like guidance on how to approach similar technical questions?"
  
**Example 2 - With Answer**
  "question": "Explain dependency injection",
  "answer": "Passing dependencies to objects instead of hard-coding them",
  "review": "## 📝 Response Summary\nYour answer demonstrates solid understanding of dependency injection fundamentals... (full template continues)"
 """