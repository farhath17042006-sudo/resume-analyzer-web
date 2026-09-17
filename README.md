# AI Resume Analyzer & Career Recommendation System (Web Version)

A modern, responsive web application built with Flask and Vanilla JS to analyze resumes, identify skill gaps, and provide career roadmaps.

## Features

- **Resume Parsing:** Upload PDF resumes and automatically extract text.
- **Skill Matching:** Compare resume content against required skills for selected tech roles.
- **Dynamic Scoring:** Real-time resume match percentage and status (Excellent, Good, Needs Improvement).
- **Career Roadmaps:** Receive customized learning roadmaps and job recommendations.
- **PDF Reports:** Download detailed analysis reports instantly as PDFs.

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Python, Flask
- **PDF Processing:** PyPDF2
- **PDF Generation:** ReportLab
- **Server:** Gunicorn

## Local Testing

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run the application:
   ```bash
   python app.py
   ```
3. Open `http://localhost:5000` in your web browser.

## Deployment to Render

1. Create a new Web Service on Render.
2. Connect this repository.
3. Use the following settings:
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`

*Developed by Farhath*
