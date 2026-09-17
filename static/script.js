document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('resume');
    const fileNameDisplay = document.getElementById('file-name');
    const form = document.getElementById('analyze-form');
    const errorMsg = document.getElementById('error-message');
    const analyzeBtn = document.getElementById('analyze-btn');
    const btnText = document.querySelector('.btn-text');
    const loader = document.querySelector('.loader');
    
    const uploadSection = document.getElementById('upload-section');
    const resultsSection = document.getElementById('results-section');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');
    
    let lastAnalysisData = null;

    // Handle file input changes
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                showError('Please select a valid PDF file.');
                fileInput.value = '';
                fileNameDisplay.textContent = 'Click to browse or drag and drop';
                fileNameDisplay.parentElement.classList.remove('has-file');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                showError('File size exceeds 5MB limit.');
                fileInput.value = '';
                fileNameDisplay.textContent = 'Click to browse or drag and drop';
                fileNameDisplay.parentElement.classList.remove('has-file');
                return;
            }
            
            fileNameDisplay.textContent = file.name;
            fileNameDisplay.parentElement.classList.add('has-file');
            hideError();
        } else {
            fileNameDisplay.textContent = 'Click to browse or drag and drop';
            fileNameDisplay.parentElement.classList.remove('has-file');
        }
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        hideError();
        
        const formData = new FormData(form);
        
        if (!formData.get('resume').name) {
            showError('Please upload a resume PDF.');
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze resume');
            }
            
            lastAnalysisData = data;
            displayResults(data);
            
        } catch (err) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    });
    
    // Download report
    downloadBtn.addEventListener('click', async () => {
        if (!lastAnalysisData) return;
        
        downloadBtn.disabled = true;
        downloadBtn.textContent = 'Generating PDF...';
        
        try {
            const response = await fetch('/download-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(lastAnalysisData)
            });
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to generate report');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${lastAnalysisData.name.replace(/\s+/g, '_')}_Resume_Report.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch (err) {
            alert('Error generating report: ' + err.message);
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.textContent = 'Download PDF Report';
        }
    });
    
    // Reset form
    resetBtn.addEventListener('click', () => {
        resultsSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
        
        form.reset();
        fileNameDisplay.textContent = 'Click to browse or drag and drop';
        fileNameDisplay.parentElement.classList.remove('has-file');
        hideError();
        lastAnalysisData = null;
        window.scrollTo(0, 0);
    });

    function displayResults(data) {
        document.getElementById('res-name').textContent = data.name;
        document.getElementById('res-email').textContent = data.email;
        document.getElementById('res-role').textContent = data.role;
        
        // Score animation
        const scoreEl = document.getElementById('res-score');
        animateValue(scoreEl, 0, data.score, 1000);
        
        // Status badge
        const statusEl = document.getElementById('res-status');
        statusEl.textContent = data.status;
        statusEl.className = 'status-badge ' + getStatusClass(data.status);
        
        // Matched Skills
        const matchedContainer = document.getElementById('matched-skills');
        matchedContainer.innerHTML = '';
        if (data.matched.length > 0) {
            data.matched.forEach(skill => {
                const span = document.createElement('span');
                span.className = 'badge matched';
                span.textContent = skill;
                matchedContainer.appendChild(span);
            });
        } else {
            matchedContainer.innerHTML = '<span style="color:var(--text-secondary)">No skills matched.</span>';
        }
        
        // Missing Skills
        const missingContainer = document.getElementById('missing-skills');
        missingContainer.innerHTML = '';
        if (data.missing.length > 0) {
            data.missing.forEach(skill => {
                const span = document.createElement('span');
                span.className = 'badge missing';
                span.textContent = skill;
                missingContainer.appendChild(span);
            });
        } else {
            missingContainer.innerHTML = '<span style="color:var(--text-secondary)">All required skills met!</span>';
        }
        
        // Roadmap
        const learnList = document.getElementById('res-learn');
        learnList.innerHTML = '';
        data.learn.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            learnList.appendChild(li);
        });
        
        // Jobs
        const jobsList = document.getElementById('res-jobs');
        jobsList.innerHTML = '';
        data.jobs.forEach(job => {
            const li = document.createElement('li');
            li.textContent = job;
            jobsList.appendChild(li);
        });
        
        // Switch sections
        uploadSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        window.scrollTo(0, 0);
    }
    
    function getStatusClass(status) {
        if (status === 'Excellent Resume') return 'status-excellent';
        if (status === 'Good Resume') return 'status-good';
        return 'status-needs-improvement';
    }
    
    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
    }
    
    function hideError() {
        errorMsg.classList.add('hidden');
    }
    
    function setLoading(isLoading) {
        if (isLoading) {
            analyzeBtn.disabled = true;
            btnText.classList.add('hidden');
            loader.classList.remove('hidden');
        } else {
            analyzeBtn.disabled = false;
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
        }
    }
    
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end; // ensure exact value
            }
        };
        window.requestAnimationFrame(step);
    }
});
