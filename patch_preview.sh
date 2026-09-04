#!/bin/bash
# We'll use a Node script to insert a helper function before the component
node -e "
const fs = require('fs');
let code = fs.readFileSync('src/components/ResumePreviewPage.tsx', 'utf8');

const helper = \`
export const formatEducationDetails = (edu: any) => {
  let title = edu.degree || edu.level || '';
  const spec = edu.specialization || edu.fieldOfStudy || '';
  if (spec && title.toLowerCase().indexOf(spec.toLowerCase()) === -1) {
    // avoid 'in in' or 'MPC in MPC'
    if (title.toLowerCase().endsWith('in')) {
      title += ' ' + spec;
    } else {
      title += ' — ' + spec;
    }
  }

  // Handle 'in null' or 'null'
  title = title.replace(/in null/gi, '').replace(/null/gi, '').trim();

  let inst = [edu.institution, edu.board].filter(Boolean)[0] || '';
  let loc = edu.location || '';
  let subtitleParts = [inst, loc].filter(Boolean);
  let subtitle = subtitleParts.join(', ');

  let dates = [edu.startDate, edu.endDate].filter(Boolean).join(' – ') || edu.graduationYear || '';

  let scores = [];
  if (edu.cgpa && edu.cgpa !== 'null') scores.push(\\\`CGPA: \${edu.cgpa}\\\`);
  if (edu.percentage && edu.percentage !== 'null') scores.push(\\\`Percentage: \${edu.percentage}\\\`);
  if (edu.marksObtained && edu.marksObtained !== 'null') {
    if (edu.totalMarks && edu.totalMarks !== 'null') {
      scores.push(\\\`Marks: \${edu.marksObtained}/\${edu.totalMarks}\\\`);
    } else {
      scores.push(\\\`Marks: \${edu.marksObtained}\\\`);
    }
  }
  let scoreLine = scores.join(' | ');

  return { title, subtitle, dates, scoreLine };
};
\`;

if (!code.includes('formatEducationDetails')) {
  code = code.replace('export const ResumePreviewPage', helper + '\nexport const ResumePreviewPage');
  fs.writeFileSync('src/components/ResumePreviewPage.tsx', code);
}
"
