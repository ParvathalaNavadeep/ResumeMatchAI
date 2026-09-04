const fs = require('fs');
let code = fs.readFileSync('src/components/ResumePreviewPage.tsx', 'utf8');

const targetContent = `                {optimizedResume.education.map((edu, idx) => (
                  <div key={idx} className="flex items-baseline justify-between">
                    <div>
                      <strong className="text-slate-900">{edu.degree} {edu.fieldOfStudy ? \`in \${edu.fieldOfStudy}\` : ''}</strong>
                      <div className="text-slate-700">{edu.institution}</div>
                    </div>
                    {edu.graduationYear && <span className="font-semibold text-slate-700">{edu.graduationYear}</span>}
                  </div>
                ))}`;

const replacementContent = `                {optimizedResume.education.map((edu, idx) => {
                  const ed = formatEducationDetails(edu);
                  return (
                  <div key={idx} className="mb-2">
                    <div className="flex items-baseline justify-between">
                      <strong className="text-slate-900">{ed.title}</strong>
                      {ed.dates && <span className="font-semibold text-slate-700">{ed.dates}</span>}
                    </div>
                    {ed.subtitle && <div className="text-slate-700">{ed.subtitle}</div>}
                    {ed.scoreLine && <div className="text-slate-700 font-medium italic mt-0.5">{ed.scoreLine}</div>}
                  </div>
                  );
                })}`;

code = code.split(targetContent).join(replacementContent);

fs.writeFileSync('src/components/ResumePreviewPage.tsx', code);
