const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target_schema = `  "education": [
    {
      "id": "edu_1",
      "degree": "string",
      "institution": "string",
      "graduationYear": "string",
      "fieldOfStudy": "string"
    }
  ]`;

const replacement_schema = `  "education": [
    {
      "id": "edu_1",
      "level": "string (e.g. 10th / Secondary, 12th / Intermediate, Undergraduate, etc)",
      "degree": "string (e.g. Bachelor of Technology)",
      "specialization": "string (e.g. Electronics and Communication Engineering)",
      "fieldOfStudy": "string (alias for specialization)",
      "institution": "string (e.g. Audisankara College)",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "graduationYear": "string",
      "cgpa": "string (ONLY if candidate explicitly provided)",
      "percentage": "string (ONLY if candidate explicitly provided)",
      "marksObtained": "string (ONLY if candidate explicitly provided)",
      "totalMarks": "string",
      "board": "string"
    }
  ]`;

code = code.replace(target_schema, replacement_schema);

const proj_target = `      "title": "string",
      "description": "string",
      "technologiesUsed": ["array of candidate's real project technologies"],`;

const proj_replacement = `      "title": "string (Consistent Title Case formatting, e.g. ResumeMatch AI)",
      "description": "string (Concise description without inventing metrics)",
      "technologiesUsed": ["array of candidate's real project technologies"],`;

code = code.replace(proj_target, proj_replacement);

fs.writeFileSync('server.ts', code);
