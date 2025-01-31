document.getElementById("resumeForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const department = document.getElementById("department").value;
    const files = document.getElementById("resumeInput").files;
    
    if (!department) {
        alert("Please select a department.");
        return;
    }
    
    if (files.length === 0) {
        alert("Please upload at least one resume.");
        return;
    }

    const formData = new FormData();
    formData.append("department", department);
    for (let file of files) formData.append("resumes", file);

    try {
        const response = await fetch("/upload", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        let resultHTML = `<h3>Analysis Results</h3>`;

        if (data.results) {
            data.results.forEach(res => {
                resultHTML += `
                    <div>
                        <p><strong>${res.filename}</strong></p>
                        <p><strong>Accuracy:</strong> ${res.analysis.accuracy}</p>
                        <p><strong>Keywords Found:</strong></p>
                        <ul>
                            ${res.analysis.found.map(keyword => `<li>${keyword}</li>`).join('')}
                        </ul>
                        <p><strong>Missing Keywords:</strong></p>
                        <ul>
                            ${res.analysis.missing.map(keyword => `<li>${keyword}</li>`).join('')}
                        </ul>
                    </div>
                    <hr>
                `;
            });
        } else {
            resultHTML += `<p>Error analyzing resumes.</p>`;
        }

        document.getElementById("result").innerHTML = resultHTML;
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("result").innerHTML = `<p>Failed to analyze resumes.</p>`;
    }
});
