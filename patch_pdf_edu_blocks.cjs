const fs = require('fs');
let code = fs.readFileSync('src/lib/pdfGenerator.ts', 'utf8');

// Replace block for ATS Classic (Template 1)
const t1_target = `      resume.education.forEach(edu => {
        checkNewPage(24);

        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);

        const degreeText = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
        doc.text(degreeText || 'Degree', margin, y);

        if (edu.graduationYear) {
          doc.setFont('times', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(edu.graduationYear, margin + contentWidth, y, { align: 'right' });
        }
        y += 14;

        const instText = [edu.institution, edu.location].filter(Boolean).join(' | ');
        if (instText) {
          doc.setFont('times', 'italic');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(instText, margin, y);
          y += 16;
        } else {
          y += 6;
        }
      });`;
      
const t1_replacement = `      resume.education.forEach(edu => {
        const ed = formatEducationDetails(edu);
        checkNewPage(28);

        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);

        doc.text(ed.title || 'Degree', margin, y);

        if (ed.dates) {
          doc.setFont('times', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(ed.dates, margin + contentWidth, y, { align: 'right' });
        }
        y += 14;

        if (ed.subtitle) {
          doc.setFont('times', 'italic');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(ed.subtitle, margin, y);
          y += 14;
        } else {
          y += 4;
        }
        
        if (ed.scoreLine) {
          doc.setFont('times', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(71, 85, 105);
          doc.text(ed.scoreLine, margin, y);
          y += 12;
        }
        y += 2;
      });`;

// Replace block for Modern Professional (Template 2)
const t2_target = `      resume.education.forEach(edu => {
        checkNewPage(24);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);

        const degreeText = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
        doc.text(degreeText || 'Degree', margin, y);

        if (edu.graduationYear) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(edu.graduationYear, margin + contentWidth, y, { align: 'right' });
        }
        y += 14;

        const instText = [edu.institution, edu.location].filter(Boolean).join(' | ');
        if (instText) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(instText, margin, y);
          y += 16;
        } else {
          y += 6;
        }
      });`;
      
const t2_replacement = `      resume.education.forEach(edu => {
        const ed = formatEducationDetails(edu);
        checkNewPage(28);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);

        doc.text(ed.title || 'Degree', margin, y);

        if (ed.dates) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(ed.dates, margin + contentWidth, y, { align: 'right' });
        }
        y += 14;

        if (ed.subtitle) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(ed.subtitle, margin, y);
          y += 14;
        } else {
          y += 4;
        }
        
        if (ed.scoreLine) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(71, 85, 105);
          doc.text(ed.scoreLine, margin, y);
          y += 12;
        }
        y += 2;
      });`;

// Replace block for Technical (Template 3)
const t3_target = `      resume.education.forEach(edu => {
        checkNewPage(24);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);

        const degreeText = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
        doc.text(degreeText || 'Degree', margin, y);

        if (edu.graduationYear) {
          doc.setFont('courier', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(edu.graduationYear, margin + contentWidth, y, { align: 'right' });
        }
        y += 14;

        const instText = [edu.institution, edu.location].filter(Boolean).join(' | ');
        if (instText) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(instText, margin, y);
          y += 16;
        } else {
          y += 6;
        }
      });`;
      
const t3_replacement = `      resume.education.forEach(edu => {
        const ed = formatEducationDetails(edu);
        checkNewPage(28);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);

        doc.text(ed.title || 'Degree', margin, y);

        if (ed.dates) {
          doc.setFont('courier', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(ed.dates, margin + contentWidth, y, { align: 'right' });
        }
        y += 14;

        if (ed.subtitle) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(ed.subtitle, margin, y);
          y += 14;
        } else {
          y += 4;
        }
        
        if (ed.scoreLine) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(71, 85, 105);
          doc.text(ed.scoreLine, margin, y);
          y += 12;
        }
        y += 2;
      });`;


// Replace block for ResumeMatch Professional (Template 4)
const t4_target = `      resume.education.forEach(edu => {
        checkNewPage(32);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        const degText = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
        doc.text(degText || 'Degree', margin, y);

        if (edu.graduationYear) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(edu.graduationYear, margin + contentWidth, y, { align: 'right' });
        }
        y += 14;

        if (edu.institution) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(edu.institution, margin, y);
          y += 16;
        } else {
          y += 6;
        }
      });`;

const t4_replacement = `      resume.education.forEach(edu => {
        const ed = formatEducationDetails(edu);
        checkNewPage(32);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        
        doc.text(ed.title || 'Degree', margin, y);

        if (ed.dates) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(ed.dates, margin + contentWidth, y, { align: 'right' });
        }
        y += 14;

        if (ed.subtitle) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(ed.subtitle, margin, y);
          y += 14;
        } else {
          y += 4;
        }
        
        if (ed.scoreLine) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text(ed.scoreLine, margin, y);
          y += 12;
        }
        y += 2;
      });`;

code = code.replace(t1_target, t1_replacement);
code = code.replace(t2_target, t2_replacement);
code = code.replace(t3_target, t3_replacement);
code = code.replace(t4_target, t4_replacement);

fs.writeFileSync('src/lib/pdfGenerator.ts', code);
