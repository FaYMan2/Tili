# Use an official Python runtime as a parent image
FROM python:3.11

# Set the working directory
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the FastAPI app files
COPY . .

# Set environment variables (optional, override with docker-compose or CLI)
ENV APP_ENV=production \
    PORT=8080

# Expose port 8080
EXPOSE 8080

# Run the FastAPI app using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]