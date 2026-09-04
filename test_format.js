const formatEducationDetails = (edu) => {
  let title = edu.degree || edu.level || '';
  const spec = edu.specialization || edu.fieldOfStudy || '';
  
  if (spec && title.toLowerCase().indexOf(spec.toLowerCase()) === -1) {
    if (title.toLowerCase().endsWith('in')) {
      title += ' ' + spec;
    } else if (title) {
      title += ' — ' + spec;
    } else {
      title = spec;
    }
  }

  // Handle "12th Grade in MPC in MPC"
  title = title.replace(/\s+in\s+(.+?)\s+in\s+\1/i, ' — $1');

  // Handle 'in null' or 'null'
  title = title.replace(/\s*in\s*null/gi, '').replace(/null/gi, '').trim();
  // Handle duplicate strings like "MPC - MPC" or "MPC — MPC"
  const titleParts = title.split('—').map(s => s.trim());
  if (titleParts.length === 2 && titleParts[0].toLowerCase() === titleParts[1].toLowerCase()) {
    title = titleParts[0];
  }

  let inst = [edu.institution, edu.board].filter(Boolean)[0] || '';
  let loc = edu.location || '';
  let subtitleParts = [inst, loc].filter(Boolean);
  let subtitle = subtitleParts.join(', ');

  let dates = [edu.startDate, edu.endDate].filter(Boolean).join(' – ') || edu.graduationYear || '';

  let scores = [];
  if (edu.cgpa && String(edu.cgpa) !== 'null') scores.push(`CGPA: ${edu.cgpa}`);
  if (edu.percentage && String(edu.percentage) !== 'null') scores.push(`Percentage: ${edu.percentage}`);
  if (edu.marksObtained && String(edu.marksObtained) !== 'null') {
    if (edu.totalMarks && String(edu.totalMarks) !== 'null') {
      scores.push(`Marks: ${edu.marksObtained}/${edu.totalMarks}`);
    } else {
      scores.push(`Marks: ${edu.marksObtained}`);
    }
  }
  let scoreLine = scores.join(' | ');

  return { title, subtitle, dates, scoreLine };
};

console.log(formatEducationDetails({degree: "12th Grade in MPC in MPC", specialization: "MPC"}));
console.log(formatEducationDetails({degree: "12th Grade in null"}));
console.log(formatEducationDetails({degree: "Bachelor of Technology", specialization: "Electronics and Communication Engineering", cgpa: "8.2/10", institution: "Audisankara College", graduationYear: "2026"}));
