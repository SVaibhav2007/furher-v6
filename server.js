const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Multer storage config for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Ensure uploads folder exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Keywords & skills for CSE resume analysis
const cseKeywords = [
  "Programming", "Data Structures", "Algorithms", "Operating Systems", "Machine Learning",
  "Artificial Intelligence", "Database Management", "SQL", "NoSQL", "Cloud Computing",
  "Web Development", "React", "Node.js", "Python", "Java", "JavaScript", "C++", "Cybersecurity",
  "Networking", "Computer Vision", "Software Engineering", "API Development", "Git", "Linux"
];

// Function to analyze the resume text
function analyzeResume(text) {
  let foundKeywords = [];
  let missingKeywords = [];

  cseKeywords.forEach((keyword) => {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  });

  let accuracy = (foundKeywords.length / cseKeywords.length) * 100;
  
  return {
    accuracy: accuracy.toFixed(2) + "%",
    foundKeywords,
    missingKeywords,
  };
}

// Route to upload and analyze resume
app.post("/upload", upload.single("resume"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = path.join(__dirname, "uploads", req.file.filename);
  const dataBuffer = fs.readFileSync(filePath);

  try {
    const data = await pdfParse(dataBuffer);
    const analysis = analyzeResume(data.text);
    
    // Delete file after analysis (Optional)
    fs.unlinkSync(filePath);

    res.json({
      message: "Resume analyzed successfully",
      analysis,
    });
  } catch (error) {
    res.status(500).json({ message: "Error processing file", error });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
