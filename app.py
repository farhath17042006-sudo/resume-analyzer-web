import os
import io
from flask import Flask, render_template, request, jsonify, send_file
from PyPDF2 import PdfReader
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Basic security settings for upload
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5 MB max
ALLOWED_EXTENSIONS = {'pdf'}

roles = {
    "Python Developer": {
        "skills": ["python", "sql", "flask", "django", "api", "oops", "git"],
        "learn": ["Microservices", "Spring Security", "System Design"],
        "jobs": ["Django Developer", "Backend Engineer", "Automation Engineer", "Data Engineer"]
    },
    "Java Developer": {
        "skills": ["java", "spring boot", "jdbc", "sql", "hibernate", "oops", "collections"],
        "learn": ["Microservices", "Spring Security", "System Design"],
        "jobs": ["Spring Boot Developer", "Backend Java Developer", "Software Engineer"]
    },
    "Frontend Developer": {
        "skills": ["html", "css", "javascript", "react", "bootstrap", "ui", "responsive design"],
        "learn": ["React Projects", "Animations", "UI/UX"],
        "jobs": ["React Developer", "UI Developer", "Web Designer"]
    },
    "Backend Developer": {
        "skills": ["java", "python", "sql", "api", "mongodb", "nodejs"],
        "learn": ["REST APIs", "Cloud", "Database Optimization"],
        "jobs": ["API Developer", "Node.js Developer", "System Engineer"]
    },
    "Full Stack Developer": {
        "skills": ["html", "css", "javascript", "react", "java", "spring boot", "sql"],
        "learn": ["Deployment", "Cloud Hosting", "Frontend + Backend Integration"],
        "jobs": ["Full Stack Engineer", "MERN Developer", "Software Engineer"]
    }
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html', roles=list(roles.keys()))

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'resume' not in request.files:
        return jsonify({'error': 'No resume uploaded'}), 400
        
    file = request.files['resume']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Please upload a PDF.'}), 400

    name = request.form.get('name', '').strip()
    email = request.form.get('email', '').strip()
    role = request.form.get('role', '').strip()
    
    if not name or not email or not role or role not in roles:
        return jsonify({'error': 'Missing or invalid candidate information.'}), 400
        
    try:
        reader = PdfReader(file)
        resume_text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                resume_text += page_text.lower()
                
        required_skills = roles[role]["skills"]
        matched = []
        missing = []
        
        for skill in required_skills:
            if skill.lower() in resume_text:
                matched.append(skill)
            else:
                missing.append(skill)
                
        score = 0
        if len(required_skills) > 0:
            score = (len(matched) / len(required_skills)) * 100
            
        if score >= 80:
            status = "Excellent Resume"
        elif score >= 50:
            status = "Good Resume"
        else:
            status = "Needs Improvement"
            
        return jsonify({
            'success': True,
            'name': name,
            'email': email,
            'role': role,
            'score': round(score, 2),
            'status': status,
            'required': required_skills,
            'matched': matched,
            'missing': missing,
            'learn': roles[role]["learn"],
            'jobs': roles[role]["jobs"]
        })

    except Exception as e:
        return jsonify({'error': f'Failed to process PDF: {str(e)}'}), 500

@app.route('/download-report', methods=['POST'])
def download_report():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        
        y = 800
        c.setFont("Helvetica-Bold", 18)
        c.drawString(150, y, "AI Resume Analysis Report")
        
        y -= 40
        c.setFont("Helvetica", 12)
        
        c.drawString(50, y, f"Name : {data.get('name', 'N/A')}")
        y -= 20
        c.drawString(50, y, f"Email : {data.get('email', 'N/A')}")
        y -= 20
        c.drawString(50, y, f"Role : {data.get('role', 'N/A')}")
        y -= 20
        c.drawString(50, y, f"Score : {data.get('score', 0)}%")
        y -= 20
        c.drawString(50, y, f"Status : {data.get('status', 'N/A')}")
        
        y -= 30
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y, "Missing Skills")
        y -= 20
        c.setFont("Helvetica", 12)
        missing_skills = data.get('missing', [])
        if missing_skills:
            for skill in missing_skills:
                c.drawString(70, y, f"- {skill}")
                y -= 15
        else:
            c.drawString(70, y, "None!")
            y -= 15
            
        y -= 15
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y, "Learning Roadmap")
        y -= 20
        c.setFont("Helvetica", 12)
        for learn in data.get('learn', []):
            c.drawString(70, y, f"- {learn}")
            y -= 15
            
        y -= 15
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y, "Job Recommendations")
        y -= 20
        c.setFont("Helvetica", 12)
        for job in data.get('jobs', []):
            c.drawString(70, y, f"- {job}")
            y -= 15

        c.save()
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name="resume_analysis_report.pdf",
            mimetype="application/pdf"
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
