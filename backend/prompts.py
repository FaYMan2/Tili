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

