import { jsPDF } from 'jspdf';
import { OptimizedResume, ResumeTemplateId } from '../types';



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

export const formatEducationDetails = (edu: any) => {
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

  title = title.replace(/\s*in\s*null/gi, '').replace(/null/gi, '').trim();
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

export function generateAtsPdf(rawResume: OptimizedResume, templateIdOverride?: ResumeTemplateId): void {
  const resume = cleanResumeData(rawResume) as OptimizedResume;
  const activeTemplate: ResumeTemplateId = templateIdOverride || resume.templateId || 'ats-classic';

  const doc = new jsPDF({
    unit: 'pt',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40; // ~0.55 inch standard margin
  const contentWidth = pageWidth - margin * 2;
  const bottomMarginLimit = pageHeight - margin;
  let y = 45;

  function checkNewPage(neededSpace: number) {
    if (y + neededSpace > bottomMarginLimit) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  }

  function renderContactItems(align: 'center' | 'left', doc: jsPDF, items: { text: string, url?: string }[], yStart: number, margin: number, contentWidth: number, pageWidth: number): number {
    if (items.length === 0) return yStart;
    const separator = '   |   ';
    const sepWidth = doc.getTextWidth(separator);
    let currentLine = [];
    let currentLineWidth = 0;
    const lines = [];
    
    for (let i = 0; i < items.length; i++) {
      const itemWidth = doc.getTextWidth(items[i].text);
      const addedWidth = currentLine.length === 0 ? itemWidth : sepWidth + itemWidth;
      
      if (currentLineWidth + addedWidth > contentWidth) {
        if (currentLine.length > 0) {
          lines.push({ items: currentLine, width: currentLineWidth });
        }
        currentLine = [items[i]];
        currentLineWidth = itemWidth;
      } else {
        currentLine.push(items[i]);
        currentLineWidth += addedWidth;
      }
    }
    if (currentLine.length > 0) {
      lines.push({ items: currentLine, width: currentLineWidth });
    }

    let currentY = yStart;
    for (const line of lines) {
      let x = align === 'center' ? (pageWidth - line.width) / 2 : margin;
      for (let i = 0; i < line.items.length; i++) {
        const item = line.items[i];
        if (item.url) {
          doc.textWithLink(item.text, x, currentY, { url: item.url });
          const origLw = doc.getLineWidth();
          doc.setLineWidth(0.5);
          doc.line(x, currentY + 1.5, x + doc.getTextWidth(item.text), currentY + 1.5);
          doc.setLineWidth(origLw);
        } else {
          doc.text(item.text, x, currentY);
        }
        x += doc.getTextWidth(item.text);
        if (i < line.items.length - 1) {
          doc.text(separator, x, currentY);
          x += sepWidth;
        }
      }
      currentY += 14;
    }
    return currentY;
  }


  const contact = resume.contactInfo || (resume as any).personal || {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedIn: '',
    portfolio: ''
  };

  const contactItems: { text: string, url?: string }[] = [];
  if (contact.email) contactItems.push({ text: contact.email });
  if (contact.phone) contactItems.push({ text: contact.phone });
  if (contact.location) contactItems.push({ text: contact.location });
  if (contact.linkedIn) contactItems.push({ text: 'LinkedIn', url: contact.linkedIn });
  if (contact.portfolio) contactItems.push({ text: 'Portfolio', url: contact.portfolio });
  if ((contact as any).github) contactItems.push({ text: 'GitHub', url: (contact as any).github });

  const expList = resume.experience || (resume as any).workExperience || [];

  // =========================================================================
  // TEMPLATE 1: ATS CLASSIC (Serif font, Centered Header, Traditional Style)
  // =========================================================================
  if (activeTemplate === 'ats-classic') {
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);

    const nameText = (contact.name || 'CANDIDATE NAME').toUpperCase();
    doc.text(nameText, pageWidth / 2, y, { align: 'center' });
    y += 22;

    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    y = renderContactItems('center', doc, contactItems, y, margin, contentWidth, pageWidth);
    y += 2;

    doc.setLineWidth(0.75);
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.line(margin, y, margin + contentWidth, y);
    y += 16;

    function drawClassicSectionHeader(title: string) {
      checkNewPage(32);
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(title.toUpperCase(), margin, y);
      y += 4;
      doc.setLineWidth(0.75);
      doc.setDrawColor(148, 163, 184);
      doc.line(margin, y, margin + contentWidth, y);
      y += 14;
    }

    // 1. Summary
    if (resume.summary && resume.summary.trim()) {
      drawClassicSectionHeader('SUMMARY');
      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);

      const summaryLines = doc.splitTextToSize(resume.summary.trim(), contentWidth);
      for (let i = 0; i < summaryLines.length; i++) {
        checkNewPage(13);
        doc.text(summaryLines[i], margin, y);
        y += 13;
      }
      y += 10;
    }

    // 2. Skills
    if (resume.skills && resume.skills.length > 0) {
      const validSkills = resume.skills.filter(s => s && s.items && s.items.length > 0);
      if (validSkills.length > 0) {
        drawClassicSectionHeader('SKILLS');
        doc.setFontSize(9.5);

        validSkills.forEach(skillCat => {
          const catLabel = skillCat.category ? `${skillCat.category}: ` : 'Skills: ';
          doc.setFont('times', 'bold');
          doc.setTextColor(15, 23, 42);
          const catWidth = doc.getTextWidth(catLabel);

          const itemsText = skillCat.items.join(', ');
          if (!itemsText.trim()) return;
          doc.setFont('times', 'normal');
          doc.setTextColor(30, 41, 59);

          const wrappedItems = doc.splitTextToSize(itemsText.trim(), contentWidth - catWidth);
          checkNewPage(14 * Math.max(1, wrappedItems.length));

          doc.setFont('times', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(catLabel, margin, y);

          doc.setFont('times', 'normal');
          doc.setTextColor(30, 41, 59);
          doc.text(wrappedItems[0], margin + catWidth, y);
          y += 13;

          for (let i = 1; i < wrappedItems.length; i++) {
            checkNewPage(13);
            doc.text(wrappedItems[i], margin, y);
            y += 13;
          }
          y += 3;
        });
        y += 8;
      }
    }

    // 3. Experience
    if (expList.length > 0) {
      drawClassicSectionHeader('EXPERIENCE');

      expList.forEach((exp) => {
        checkNewPage(28);

        doc.setFont('times', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text(exp.jobTitle || 'Role Title', margin, y);

        const datesText = [exp.startDate, exp.endDate].filter(Boolean).join(' – ');
        if (datesText) {
          doc.setFont('times', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(71, 85, 105);
          doc.text(datesText, margin + contentWidth, y, { align: 'right' });
        }
        y += 13;

        checkNewPage(14);
        doc.setFont('times', 'italic');
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85);
        const companyLoc = [exp.company, exp.location].filter(Boolean).join('  |  ');
        doc.text(companyLoc || 'Company', margin, y);
        y += 14;

        doc.setFont('times', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);

        if (Array.isArray(exp.bullets)) {
          exp.bullets.forEach((bullet: string) => {
            if (!bullet || !bullet.trim()) return;

            const lines = doc.splitTextToSize(bullet.trim(), contentWidth - 14);
            if (lines.length > 0) {
              checkNewPage(14 * Math.max(1, lines.length));
              doc.text('•', margin + 2, y);
              for (let i = 0; i < lines.length; i++) {
                doc.text(lines[i], margin + 14, y);
                y += 14;
              }
              y += 4;
            }
          });
        }
        y += 8;
      });
      y += 4;
    }

    // 4. Projects
    if (resume.projects && resume.projects.length > 0) {
      drawClassicSectionHeader('PROJECTS');

      resume.projects.forEach(proj => {
        checkNewPage(24);

        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        const titleLines = doc.splitTextToSize(proj.title || 'Project', contentWidth);
        checkNewPage(14 * Math.max(1, titleLines.length));
        for (let i = 0; i < titleLines.length; i++) {
          doc.text(titleLines[i], margin, y);
          y += 14;
        }
        
        if (proj.technologiesUsed && proj.technologiesUsed.length > 0) {
          doc.setFont('times', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(71, 85, 105);
          const techStr = `(${proj.technologiesUsed.join(', ')})`;
          const techLines = doc.splitTextToSize(techStr, contentWidth);
          checkNewPage(13 * Math.max(1, techLines.length));
          for (let i = 0; i < techLines.length; i++) {
            doc.text(techLines[i], margin, y);
            y += 13;
          }
        }

        if (proj.description && proj.description.trim()) {
          doc.setFont('times', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(30, 41, 59);
          const wrappedDesc = doc.splitTextToSize(proj.description.trim(), contentWidth);
          checkNewPage(wrappedDesc.length * 12 + 4);
          doc.text(wrappedDesc, margin, y);
          y += (wrappedDesc.length * 12) + 6;
        } else {
          y += 4;
        }
      });
      y += 4;
    }

    // 5. Education
    if (resume.education && resume.education.length > 0) {
      drawClassicSectionHeader('EDUCATION');

      resume.education.forEach(edu => {
        checkNewPage(24);

        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);

        const degreeText = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
        doc.text(degreeText || 'Degree', margin, y);

        if (edu.graduationYear) {
          doc.setFont('times', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(71, 85, 105);
          doc.text(edu.graduationYear, margin + contentWidth, y, { align: 'right' });
        }
        y += 13;

        if (edu.institution) {
          doc.setFont('times', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(edu.institution, margin, y);
          y += 14;
        } else {
          y += 4;
        }
      });
      y += 4;
    }

    // 6. Certifications
    if (resume.certifications && resume.certifications.length > 0) {
      drawClassicSectionHeader('CERTIFICATIONS');

      resume.certifications.forEach(cert => {
        checkNewPage(18);

        doc.setFont('times', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(cert.name || 'Certification', margin, y);

        const subInfo = [cert.issuer, cert.year].filter(Boolean).join(' – ');
        if (subInfo) {
          doc.setFont('times', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(71, 85, 105);
          doc.text(subInfo, margin + contentWidth, y, { align: 'right' });
        }
        y += 14;
      });
    }
  }

  // =========================================================================
  // TEMPLATE 2: MODERN PROFESSIONAL (Left Header, Crisp Navy Dividers)
  // =========================================================================
  else if (activeTemplate === 'modern-professional') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900

    const nameText = (contact.name || 'CANDIDATE NAME').toUpperCase();
    doc.text(nameText, margin, y);
    y += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);

    y = renderContactItems('left', doc, contactItems, y, margin, contentWidth, pageWidth);
    y += 2;

    doc.setLineWidth(1.5);
    doc.setDrawColor(15, 23, 42);
    doc.line(margin, y, margin + contentWidth, y);
    y += 16;

    function drawModernSectionHeader(title: string) {
      checkNewPage(32);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(title.toUpperCase(), margin, y);
      y += 4;
      doc.setLineWidth(1);
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, y, margin + contentWidth, y);
      y += 14;
    }

    // 1. Summary
    if (resume.summary && resume.summary.trim()) {
      drawModernSectionHeader('SUMMARY');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);

      const summaryLines = doc.splitTextToSize(resume.summary.trim(), contentWidth);
      for (let i = 0; i < summaryLines.length; i++) {
        checkNewPage(13);
        doc.text(summaryLines[i], margin, y);
        y += 13;
      }
      y += 10;
    }

    // 2. Skills
    if (resume.skills && resume.skills.length > 0) {
      const validSkills = resume.skills.filter(s => s && s.items && s.items.length > 0);
      if (validSkills.length > 0) {
        drawModernSectionHeader('SKILLS');
        doc.setFontSize(9.5);

        validSkills.forEach(skillCat => {
          const catLabel = skillCat.category ? `${skillCat.category}: ` : 'Skills: ';
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          const catWidth = doc.getTextWidth(catLabel);

          const itemsText = skillCat.items.join(', ');
          if (!itemsText.trim()) return;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);

          const wrappedItems = doc.splitTextToSize(itemsText.trim(), contentWidth - catWidth);
          checkNewPage(14 * Math.max(1, wrappedItems.length));

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(catLabel, margin, y);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
          doc.text(wrappedItems[0], margin + catWidth, y);
          y += 13;

          for (let i = 1; i < wrappedItems.length; i++) {
            checkNewPage(13);
            doc.text(wrappedItems[i], margin, y);
            y += 13;
          }
          y += 3;
        });
        y += 8;
      }
    }

    // 3. Experience
    if (expList.length > 0) {
      drawModernSectionHeader('EXPERIENCE');

      expList.forEach((exp) => {
        checkNewPage(28);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text(exp.jobTitle || 'Role Title', margin, y);

        const datesText = [exp.startDate, exp.endDate].filter(Boolean).join(' – ');
        if (datesText) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(71, 85, 105);
          doc.text(datesText, margin + contentWidth, y, { align: 'right' });
        }
        y += 13;

        checkNewPage(14);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85);
        const companyLoc = [exp.company, exp.location].filter(Boolean).join('  |  ');
        doc.text(companyLoc || 'Company', margin, y);
        y += 14;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);

        if (Array.isArray(exp.bullets)) {
          exp.bullets.forEach((bullet: string) => {
            if (!bullet || !bullet.trim()) return;

            const lines = doc.splitTextToSize(bullet.trim(), contentWidth - 14);
            if (lines.length > 0) {
              checkNewPage(14 * Math.max(1, lines.length));
              doc.text('•', margin + 2, y);
              for (let i = 0; i < lines.length; i++) {
                doc.text(lines[i], margin + 14, y);
                y += 14;
              }
              y += 4;
            }
          });
        }
        y += 8;
      });
      y += 4;
    }

    // 4. Projects
    if (resume.projects && resume.projects.length > 0) {
      drawModernSectionHeader('PROJECTS');

      resume.projects.forEach(proj => {
        checkNewPage(24);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        const titleLines = doc.splitTextToSize(proj.title || 'Project', contentWidth);
        checkNewPage(14 * Math.max(1, titleLines.length));
        for (let i = 0; i < titleLines.length; i++) {
          doc.text(titleLines[i], margin, y);
          y += 14;
        }
        
        if (proj.technologiesUsed && proj.technologiesUsed.length > 0) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(71, 85, 105);
          const techStr = `(${proj.technologiesUsed.join(', ')})`;
          const techLines = doc.splitTextToSize(techStr, contentWidth);
          checkNewPage(13 * Math.max(1, techLines.length));
          for (let i = 0; i < techLines.length; i++) {
            doc.text(techLines[i], margin, y);
            y += 13;
          }
        }

        if (proj.description && proj.description.trim()) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(30, 41, 59);
          const wrappedDesc = doc.splitTextToSize(proj.description.trim(), contentWidth);
          checkNewPage(wrappedDesc.length * 12 + 4);
          doc.text(wrappedDesc, margin, y);
          y += (wrappedDesc.length * 12) + 6;
        } else {
          y += 4;
        }
      });
      y += 4;
    }

    // 5. Education
    if (resume.education && resume.education.length > 0) {
      drawModernSectionHeader('EDUCATION');

      resume.education.forEach(edu => {
        checkNewPage(24);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);

        const degreeText = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
        doc.text(degreeText || 'Degree', margin, y);

        if (edu.graduationYear) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(71, 85, 105);
          doc.text(edu.graduationYear, margin + contentWidth, y, { align: 'right' });
        }
        y += 13;

        if (edu.institution) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(edu.institution, margin, y);
          y += 14;
        } else {
          y += 4;
        }
      });
      y += 4;
    }

    // 6. Certifications
    if (resume.certifications && resume.certifications.length > 0) {
      drawModernSectionHeader('CERTIFICATIONS');

      resume.certifications.forEach(cert => {
        checkNewPage(18);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(cert.name || 'Certification', margin, y);

        const subInfo = [cert.issuer, cert.year].filter(Boolean).join(' – ');
        if (subInfo) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(71, 85, 105);
          doc.text(subInfo, margin + contentWidth, y, { align: 'right' });
        }
        y += 14;
      });
    }
  }

  // =========================================================================
  // TEMPLATE 3: TECHNICAL / ENGINEERING (Tech Skills & Stack Upfront)
  // =========================================================================
  else if (activeTemplate === 'technical') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);

    const nameText = (contact.name || 'CANDIDATE NAME').toUpperCase();
    doc.text(nameText, margin, y);
    y += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);

    y = renderContactItems('left', doc, contactItems, y, margin, contentWidth, pageWidth);
    y += 2;

    doc.setLineWidth(1.5);
    doc.setDrawColor(30, 41, 59);
    doc.line(margin, y, margin + contentWidth, y);
    y += 16;

    function drawTechSectionHeader(title: string) {
      checkNewPage(32);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(title.toUpperCase(), margin, y);
      y += 4;
      doc.setLineWidth(1);
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, y, margin + contentWidth, y);
      y += 14;
    }

    // 1. Summary
    if (resume.summary && resume.summary.trim()) {
      drawTechSectionHeader('SUMMARY');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);

      const summaryLines = doc.splitTextToSize(resume.summary.trim(), contentWidth);
      for (let i = 0; i < summaryLines.length; i++) {
        checkNewPage(13);
        doc.text(summaryLines[i], margin, y);
        y += 13;
      }
      y += 10;
    }

    // 2. TECHNICAL SKILLS (SURFACED RIGHT AFTER SUMMARY FOR TECH ROLES)
    if (resume.skills && resume.skills.length > 0) {
      const validSkills = resume.skills.filter(s => s && s.items && s.items.length > 0);
      if (validSkills.length > 0) {
        drawTechSectionHeader('TECHNICAL SKILLS');
        doc.setFontSize(9.5);

        validSkills.forEach(skillCat => {
          const catLabel = skillCat.category ? `${skillCat.category}: ` : 'Core Stack: ';
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          const catWidth = doc.getTextWidth(catLabel);

          const itemsText = skillCat.items.join(', ');
          if (!itemsText.trim()) return;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);

          const wrappedItems = doc.splitTextToSize(itemsText.trim(), contentWidth - catWidth);
          checkNewPage(14 * Math.max(1, wrappedItems.length));

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(catLabel, margin, y);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
          doc.text(wrappedItems[0], margin + catWidth, y);
          y += 13;

          for (let i = 1; i < wrappedItems.length; i++) {
            checkNewPage(13);
            doc.text(wrappedItems[i], margin, y);
            y += 13;
          }
          y += 3;
        });
        y += 8;
      }
    }

    // 3. EXPERIENCE
    if (expList.length > 0) {
      drawTechSectionHeader('PROFESSIONAL EXPERIENCE');

      expList.forEach((exp) => {
        checkNewPage(28);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text(exp.jobTitle || 'Role Title', margin, y);

        const datesText = [exp.startDate, exp.endDate].filter(Boolean).join(' – ');
        if (datesText) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(71, 85, 105);
          doc.text(datesText, margin + contentWidth, y, { align: 'right' });
        }
        y += 13;

        checkNewPage(14);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85);
        const companyLoc = [exp.company, exp.location].filter(Boolean).join('  |  ');
        doc.text(companyLoc || 'Company', margin, y);
        y += 14;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);

        if (Array.isArray(exp.bullets)) {
          exp.bullets.forEach((bullet: string) => {
            if (!bullet || !bullet.trim()) return;

            const lines = doc.splitTextToSize(bullet.trim(), contentWidth - 14);
            if (lines.length > 0) {
              checkNewPage(14 * Math.max(1, lines.length));
              doc.text('•', margin + 2, y);
              for (let i = 0; i < lines.length; i++) {
                doc.text(lines[i], margin + 14, y);
                y += 14;
              }
              y += 4;
            }
          });
        }
        y += 8;
      });
      y += 4;
    }

    // 4. TECHNICAL PROJECTS WITH STACK HIGHLIGHTS
    if (resume.projects && resume.projects.length > 0) {
      drawTechSectionHeader('TECHNICAL PROJECTS');

      resume.projects.forEach(proj => {
        checkNewPage(24);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        const titleLines = doc.splitTextToSize(proj.title || 'Project', contentWidth);
        checkNewPage(14 * Math.max(1, titleLines.length));
        for (let i = 0; i < titleLines.length; i++) {
          doc.text(titleLines[i], margin, y);
          y += 14;
        }
        
        if (proj.technologiesUsed && proj.technologiesUsed.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(71, 85, 105);
          const techStr = `[Tech Stack: ${proj.technologiesUsed.join(', ')}]`;
          const techLines = doc.splitTextToSize(techStr, contentWidth);
          checkNewPage(13 * Math.max(1, techLines.length));
          for (let i = 0; i < techLines.length; i++) {
            doc.text(techLines[i], margin, y);
            y += 13;
          }
        }

        if (proj.description && proj.description.trim()) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(30, 41, 59);
          const wrappedDesc = doc.splitTextToSize(proj.description.trim(), contentWidth);
          checkNewPage(wrappedDesc.length * 12 + 4);
          doc.text(wrappedDesc, margin, y);
          y += (wrappedDesc.length * 12) + 6;
        } else {
          y += 4;
        }
      });
      y += 4;
    }

    // 5. EDUCATION
    if (resume.education && resume.education.length > 0) {
      drawTechSectionHeader('EDUCATION');

      resume.education.forEach(edu => {
        checkNewPage(24);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);

        const degreeText = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
        doc.text(degreeText || 'Degree', margin, y);

        if (edu.graduationYear) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(71, 85, 105);
          doc.text(edu.graduationYear, margin + contentWidth, y, { align: 'right' });
        }
        y += 13;

        if (edu.institution) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(edu.institution, margin, y);
          y += 14;
        } else {
          y += 4;
        }
      });
      y += 4;
    }

    // 6. CERTIFICATIONS
    if (resume.certifications && resume.certifications.length > 0) {
      drawTechSectionHeader('CERTIFICATIONS');

      resume.certifications.forEach(cert => {
        checkNewPage(18);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(cert.name || 'Certification', margin, y);

        const subInfo = [cert.issuer, cert.year].filter(Boolean).join(' – ');
        if (subInfo) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(71, 85, 105);
          doc.text(subInfo, margin + contentWidth, y, { align: 'right' });
        }
        y += 14;
      });
    }
  }

  // TEMPLATE 4: ResumeMatch Professional (Sans-serif, Centered Header, High Contrast Dividers)
  // =========================================================================
  else if (activeTemplate === 'resumematch-professional') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900

    const nameText = (contact.name || 'CANDIDATE NAME').toUpperCase();
    doc.text(nameText, pageWidth / 2, y, { align: 'center' });
    y += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    y = renderContactItems('center', doc, contactItems, y, margin, contentWidth, pageWidth);
    y += 2;

    const drawRMProfessionalSectionHeader = (title: string) => {
      checkNewPage(32);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(title.toUpperCase(), margin, y);
      y += 4;
      doc.setLineWidth(1.2);
      doc.setDrawColor(15, 23, 42);
      doc.line(margin, y, margin + contentWidth, y);
      y += 14;
    };

    // 1. Summary
    if (resume.summary && resume.summary.trim()) {
      drawRMProfessionalSectionHeader('SUMMARY');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);

      const summaryLines = doc.splitTextToSize(resume.summary.trim(), contentWidth);
      for (let i = 0; i < summaryLines.length; i++) {
        checkNewPage(14);
        doc.text(summaryLines[i], margin, y);
        y += 14;
      }
      y += 12;
    }

    // 2. Skills
    if (resume.skills && resume.skills.length > 0) {
      const validSkills = resume.skills.filter(s => s && s.items && s.items.length > 0);
      if (validSkills.length > 0) {
        drawRMProfessionalSectionHeader('TECHNICAL SKILLS');
        doc.setFontSize(9.5);

        validSkills.forEach(skillCat => {
          const catLabel = skillCat.category ? `${skillCat.category}: ` : 'Skills: ';
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          const catWidth = doc.getTextWidth(catLabel) + 5;
          
          const itemsText = skillCat.items.join(', ');
          if (!itemsText.trim()) return;

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);

          const wrappedItems = doc.splitTextToSize(itemsText.trim(), contentWidth - catWidth);
          if (wrappedItems.length > 0) {
            checkNewPage(14 * Math.max(1, wrappedItems.length));

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(catLabel, margin, y);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59);
            doc.text(wrappedItems[0], margin + catWidth, y);
            y += 14;

            for (let i = 1; i < wrappedItems.length; i++) {
              checkNewPage(14);
              doc.text(wrappedItems[i], margin + catWidth, y);
              y += 14;
            }
            y += 3;
          }
        });
        y += 8;
      }
    }

    // 3. Experience
    if (expList.length > 0) {
      drawRMProfessionalSectionHeader('PROFESSIONAL EXPERIENCE');

      expList.forEach((exp) => {
        checkNewPage(36);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(exp.jobTitle || 'Job Title', margin, y);

        const dates = [exp.startDate, exp.endDate].filter(Boolean).join(' – ');
        if (dates) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(dates, margin + contentWidth, y, { align: 'right' });
        }
        y += 14;

        const subInfo = [exp.company, exp.location].filter(Boolean).join(' | ');
        if (subInfo) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(subInfo, margin, y);
          y += 16;
        } else {
          y += 6;
        }

        if (exp.bullets && exp.bullets.length > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
          const bulletIndent = margin + 12;
          const textIndent = bulletIndent + 10;
          const bulletContentWidth = contentWidth - 22;

          exp.bullets.forEach(bullet => {
            if (!bullet || !bullet.trim()) return;
            const lines = doc.splitTextToSize(bullet.trim(), bulletContentWidth);
            if (lines.length > 0) {
              checkNewPage(14 * Math.max(1, lines.length));
              doc.circle(bulletIndent + 3, y - 3.5, 1.5, 'F');
              for (let i = 0; i < lines.length; i++) {
                doc.text(lines[i], textIndent, y);
                y += 14;
              }
              y += 4;
            }
          });
        }
        y += 8;
      });
    }

    // 4. Projects
    if (resume.projects && resume.projects.length > 0) {
      drawRMProfessionalSectionHeader('PROJECTS');

      resume.projects.forEach(proj => {
        checkNewPage(32);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        
        const titleLines = doc.splitTextToSize(proj.title || 'Project', contentWidth);
        checkNewPage(14 * Math.max(1, titleLines.length));
        for (let i = 0; i < titleLines.length; i++) {
          doc.text(titleLines[i], margin, y);
          y += 14;
        }
        
        if (proj.technologiesUsed && proj.technologiesUsed.length > 0) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9.5);
          doc.setTextColor(71, 85, 105);
          const techStr = proj.technologiesUsed.join(', ');
          const techLines = doc.splitTextToSize(techStr, contentWidth);
          checkNewPage(13 * Math.max(1, techLines.length));
          for (let i = 0; i < techLines.length; i++) {
            doc.text(techLines[i], margin, y);
            y += 13;
          }
        }

        if (proj.description) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
          
          const bulletIndent = margin + 12;
          const textIndent = bulletIndent + 10;
          const bulletContentWidth = contentWidth - 22;
          
          if (proj.description.trim()) {
            const lines = doc.splitTextToSize(proj.description.trim(), bulletContentWidth);
            if (lines.length > 0) {
              checkNewPage(14 * Math.max(1, lines.length));
              
              doc.circle(bulletIndent + 3, y - 3.5, 1.5, 'F');
              
              doc.text(lines[0], textIndent, y);
              y += 14;

              for (let i = 1; i < lines.length; i++) {
                checkNewPage(14);
                doc.text(lines[i], textIndent, y);
                y += 14;
              }
              y += 4;
            }
          }
        }
        y += 8;
      });
    }

    // 5. Education
    if (resume.education && resume.education.length > 0) {
      drawRMProfessionalSectionHeader('EDUCATION');

      resume.education.forEach(edu => {
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
      });
      y += 2;
    }

    // 6. Certifications
    if (resume.certifications && resume.certifications.length > 0) {
      drawRMProfessionalSectionHeader('CERTIFICATIONS');

      resume.certifications.forEach(cert => {
        checkNewPage(20);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        
        let certLine = cert.name || 'Certification';
        if (cert.issuer) {
          certLine += ` – ${cert.issuer}`;
        }
        
        doc.text(certLine, margin, y);

        if (cert.year) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          doc.text(cert.year, margin + contentWidth, y, { align: 'right' });
        }
        y += 14;
      });
    }
  }

  // Save PDF
  const rawName = contact.name || 'Candidate';
  const sanitizedName = rawName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${sanitizedName}_${activeTemplate.toUpperCase()}_Resume.pdf`;

  doc.save(filename);
}
