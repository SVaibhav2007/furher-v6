document.getElementById("resumeForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const fileInput = document.getElementById("resumeInput").files[0];
    if (!fileInput) {
        alert("Please upload a file.");
        return;
    }

    const formData = new FormData();
    formData.append("resume", fileInput);

    try {
        const response = await fetch("/upload", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        if (data.analysis) {
            document.getElementById("result").innerHTML = `
                <h3>Resume Analysis Result</h3>
                <p><strong>Accuracy:</strong> ${data.analysis.accuracy}</p>
                <p><strong>Found Keywords:</strong> ${data.analysis.foundKeywords.join(", ")}</p>
                <p><strong>Missing Keywords:</strong> ${data.analysis.missingKeywords.join(", ")}</p>
            `;
        } else {
            document.getElementById("result").innerHTML = `<p>Error analyzing resume.</p>`;
        }
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("result").innerHTML = `<p>Failed to analyze resume.</p>`;
    }
});
