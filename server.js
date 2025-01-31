const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const mammoth = require("mammoth");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// Ensure 'uploads' folder exists
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// Department-wise keywords
const departmentKeywords = {
  "CSE": ["Programming", "Data Structures", "Machine Learning", "Web Development", "AI", "Java", "Python"],
  "AI/ML": ["Deep Learning", "Neural Networks", "TensorFlow", "Data Science", "Python", "Computer Vision"],
  "MBA": ["Finance", "Marketing", "Management", "Leadership", "Business Strategy", "Economics"],
  "Agriculture": ["Soil Science", "Crop Production", "Agri-Tech", "Fertilizers", "Organic Farming"]
};

// Resume Analysis Function
function analyzeResume(text, department) {
  const keywords = departmentKeywords[department] || [];
  let found = [];
  let missing = [];

  keywords.forEach(keyword => text.includes(keyword) ? found.push(keyword) : missing.push(keyword));

  let accuracy = (found.length / keywords.length) * 100;

  return { accuracy: accuracy.toFixed(2) + "%", found, missing };
}

// Function to extract text from DOCX
async function extractTextFromDocx(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || "";
  } catch (error) {
    console.error("Error processing DOCX:", error);
    return "";
  }
}

// Upload Route
app.post("/upload", upload.array("resumes"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    console.log("No files uploaded");
    return res.status(400).json({ message: "No files uploaded" });
  }

  const department = req.body.department;
  if (!department || !departmentKeywords[department]) {
    console.log("Invalid department selected:", department);
    return res.status(400).json({ message: "Invalid department selected" });
  }

  console.log(`Department selected: ${department}`);
  console.log(`Number of files uploaded: ${req.files.length}`);

  let results = [];

  for (let file of req.files) {
    const filePath = path.join(__dirname, "uploads", file.filename);
    let resumeText = "";

    console.log(`Processing file: ${file.originalname} (MIME type: ${file.mimetype})`);

    try {
      if (file.mimetype === "application/pdf") {
        console.log("Extracting text from PDF...");
        const data = await pdfParse(fs.readFileSync(filePath));
        resumeText = data.text;
      } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        console.log("Extracting text from DOCX...");
        resumeText = await extractTextFromDocx(filePath);
      } else {
        console.log("Unsupported file type:", file.mimetype);
        results.push({ filename: file.originalname, error: "Unsupported file type" });
        continue;
      }

      if (!resumeText) {
        console.log("Failed to extract text from file:", file.originalname);
        results.push({ filename: file.originalname, error: "Failed to extract text" });
        continue;
      }

      const analysis = analyzeResume(resumeText, department);
      results.push({ filename: file.originalname, analysis });
    } catch (error) {
      console.log(`Error processing file ${file.originalname}:`, error);
      results.push({ filename: file.originalname, error: "Error processing file" });
    } finally {
      fs.unlinkSync(filePath); // Delete file after processing
    }
  }

  res.json({ message: "Analysis complete", results });
});

// Start Server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
