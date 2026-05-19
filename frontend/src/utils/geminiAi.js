// Gemini AI utility - Resume Parsing & Candidate Matching
// Uses Google Gemini 1.5 Flash API (Free Tier)

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

/**
 * Call Gemini API
 */
async function callGemini(systemPrompt, userMessage, maxTokens = 2048) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY not set in .env file");

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userMessage}` }],
        },
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Gemini API error");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini API");
  return text;
}

/**
 * Parse resume text and extract structured candidate profile
 * @param {string} resumeText - Raw text extracted from PDF
 * @returns {Object} Parsed candidate profile
 */
export async function parseResume(resumeText) {
  const systemPrompt = `You are an expert HR recruiter and resume parser.
Extract structured information from the resume text provided.
Respond ONLY with valid JSON, no markdown backticks, no explanation, no preamble.
Return exactly this JSON structure:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number or null",
  "location": "City, Country or null",
  "currentTitle": "Current Job Title",
  "currentCompany": "Current Company or null",
  "experienceYears": 5,
  "summary": "2-3 sentence professional summary",
  "skills": ["skill1", "skill2", "skill3"],
  "languages": ["English", "Hindi"],
  "education": [
    {
      "degree": "B.Tech Computer Science",
      "institution": "University Name",
      "year": "2019"
    }
  ],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2020 - Present",
      "description": "Brief description of responsibilities"
    }
  ]
}`;

  const text = await callGemini(systemPrompt, `Parse this resume:\n\n${resumeText}`);

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    throw new Error("Failed to parse resume data from AI response. Please try again.");
  }
}

/**
 * Match candidates against a job requirement
 * @param {Object} job - Job object with title, description, skills, etc.
 * @param {Array} candidates - Array of candidate objects
 * @returns {Array} Candidates with match scores and analysis
 */
export async function matchCandidatesToJob(job, candidates) {
  if (!candidates || candidates.length === 0) return [];

  const systemPrompt = `You are an expert technical recruiter.
Analyze how well each candidate matches the given job requirement.
Respond ONLY with a valid JSON array, no markdown backticks, no explanation, no preamble.
For each candidate, return an object with exactly these fields:
{
  "candidateId": "the exact id provided",
  "matchScore": 85,
  "matchLevel": "Excellent",
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3"],
  "strengths": ["strength point 1", "strength point 2"],
  "concerns": ["concern point 1"],
  "recommendation": "One sentence hiring recommendation"
}
matchLevel must be one of: "Excellent" (80-100), "Good" (60-79), "Fair" (40-59), "Poor" (0-39)`;

  const jobInfo = `
JOB TITLE: ${job.title}
DEPARTMENT: ${job.department || "Not specified"}
EXPERIENCE REQUIRED: ${job.experienceRequired || job.experience || "Not specified"} years
REQUIRED SKILLS: ${Array.isArray(job.skills) ? job.skills.join(", ") : job.skills || "Not specified"}
JOB DESCRIPTION: ${job.description || "Not specified"}
LOCATION: ${job.location || "Not specified"}
`;

  const candidatesInfo = candidates
    .map(
      (c, i) => `
CANDIDATE ${i + 1}:
ID: ${c._id || c.id}
Name: ${c.name}
Current Title: ${c.currentTitle || c.position || "Not specified"}
Experience: ${c.experience || c.experienceYears || "Not specified"} years
Skills: ${Array.isArray(c.skills) ? c.skills.join(", ") : c.skills || "Not specified"}
Current Company: ${c.currentCompany || c.company || "Not specified"}
Location: ${c.location || "Not specified"}
Education: ${c.education || "Not specified"}
`
    )
    .join("\n---\n");

  const userMessage = `Match these candidates to the job and return JSON array:\n\nJOB:\n${jobInfo}\n\nCANDIDATES:\n${candidatesInfo}`;

  const text = await callGemini(systemPrompt, userMessage, 3000);

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    throw new Error("Failed to parse matching results from AI. Please try again.");
  }
}