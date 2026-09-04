const fs = require('fs');

const cleanerCode = `
export const cleanString = (val: any): any => {
  if (typeof val === 'string') {
    const lower = val.trim().toLowerCase();
    if (['null', 'undefined', 'nan', 'n/a', 'none', '[object object]'].includes(lower)) return undefined;
    if (val.trim() === '') return undefined;
    return val;
  }
  return val;
};

export const cleanResumeData = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(cleanResumeData).filter(item => item !== undefined && item !== null);
  } else if (obj !== null && typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      const val = cleanResumeData(obj[key]);
      if (val !== undefined && val !== null) {
        cleaned[key] = val;
      }
    }
    return cleaned;
  }
  return cleanString(obj);
};
`;

let code1 = fs.readFileSync('src/components/ResumePreviewPage.tsx', 'utf8');
if (!code1.includes('cleanResumeData')) {
  code1 = code1.replace('export const formatEducationDetails', cleanerCode + '\nexport const formatEducationDetails');
  code1 = code1.replace('export const ResumePreviewPage: React.FC<ResumePreviewPageProps> = ({', 'export const ResumePreviewPage: React.FC<ResumePreviewPageProps> = ({');
  // Wait, I should apply it inside the component:
  code1 = code1.replace('  optimizedResume,', '  optimizedResume: rawResume,');
  code1 = code1.replace('const [copied, setCopied] = useState(false);', 'const optimizedResume = cleanResumeData(rawResume);\n  const [copied, setCopied] = useState(false);');
  fs.writeFileSync('src/components/ResumePreviewPage.tsx', code1);
}

let code2 = fs.readFileSync('src/lib/pdfGenerator.ts', 'utf8');
if (!code2.includes('cleanResumeData')) {
  code2 = code2.replace('export const formatEducationDetails', cleanerCode + '\nexport const formatEducationDetails');
  code2 = code2.replace('export function generateAtsPdf(resume: OptimizedResume', 'export function generateAtsPdf(rawResume: OptimizedResume');
  code2 = code2.replace("const activeTemplate: ResumeTemplateId = templateIdOverride || resume.templateId || 'ats-classic';", "const resume = cleanResumeData(rawResume) as OptimizedResume;\n  const activeTemplate: ResumeTemplateId = templateIdOverride || resume.templateId || 'ats-classic';");
  fs.writeFileSync('src/lib/pdfGenerator.ts', code2);
}
