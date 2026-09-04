const fs = require('fs');
let code = fs.readFileSync('src/lib/pdfGenerator.ts', 'utf8');

const helperCode = `
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
`;

code = code.replace(/function checkNewPage\(neededSpace: number\) \{[\s\S]*?return false;\s*\}/, match => match + '\n' + helperCode);

code = code.replace(
  /const contactParts: string\[\] = \[\];[\s\S]*?if \(contact\.portfolio\) contactParts\.push\(contact\.portfolio\);/g,
  `const contactItems: { text: string, url?: string }[] = [];
  if (contact.email) contactItems.push({ text: contact.email });
  if (contact.phone) contactItems.push({ text: contact.phone });
  if (contact.location) contactItems.push({ text: contact.location });
  if (contact.linkedIn) contactItems.push({ text: 'LinkedIn', url: contact.linkedIn });
  if (contact.portfolio) contactItems.push({ text: 'Portfolio', url: contact.portfolio });
  if ((contact as any).github) contactItems.push({ text: 'GitHub', url: (contact as any).github });`
);

code = code.replace(
  /const contactLine = contactParts\.join\('[^']+'\);\s*if \(contactLine\) \{\s*const wrappedContact = doc\.splitTextToSize\(contactLine, contentWidth\);\s*doc\.text\(wrappedContact, (margin|pageWidth \/ 2), y(?:, \{ align: 'center' \})?\);\s*y \+= \(wrappedContact\.length \* 12\) \+ \d+;\s*\} else \{\s*y \+= \d+;\s*\}/g,
  (match, p1) => {
    if (p1 === "margin") {
      return `y = renderContactItems('left', doc, contactItems, y, margin, contentWidth, pageWidth);\n    y += 2;`;
    } else {
      return `y = renderContactItems('center', doc, contactItems, y, margin, contentWidth, pageWidth);\n    y += 2;`;
    }
  }
);

code = code.replace(
  /const wrappedBullet = doc\.splitTextToSize\(bullet\.trim\(\), contentWidth - (\d+)\);\s*const bulletHeight = [^;]+;\s*checkNewPage\(bulletHeight\);\s*doc\.text\('[^']+', margin \+ (\d+), y\);\s*doc\.text\(wrappedBullet, margin \+ (\d+), y\);\s*y \+= bulletHeight;/g,
  (match, p1, p2, p3) => {
    return `const lines = doc.splitTextToSize(bullet.trim(), contentWidth - ${p3});
            if (lines.length > 0) {
              checkNewPage(14 * Math.max(1, lines.length));
              doc.text('•', margin + ${p2}, y);
              for (let i = 0; i < lines.length; i++) {
                doc.text(lines[i], margin + ${p3}, y);
                y += 14;
              }
              y += 4;
            }`;
  }
);

code = code.replace(
  /const lines = doc\.splitTextToSize\(bullet\.trim\(\), bulletContentWidth\);\s*if \(lines\.length > 0\) \{\s*checkNewPage\(14 \* Math\.max\(1, lines\.length\)\);\s*doc\.circle\(bulletIndent \+ 3, y - 3\.5, 1\.5, 'F'\);\s*doc\.text\(lines\[0\], textIndent, y\);\s*y \+= 14;\s*for \(let i = 1; i < lines\.length; i\+\+\) \{\s*checkNewPage\(14\);\s*doc\.text\(lines\[i\], textIndent, y\);\s*y \+= 14;\s*\}\s*y \+= 4;\s*\}/g,
  `const lines = doc.splitTextToSize(bullet.trim(), bulletContentWidth);
            if (lines.length > 0) {
              checkNewPage(14 * Math.max(1, lines.length));
              doc.circle(bulletIndent + 3, y - 3.5, 1.5, 'F');
              for (let i = 0; i < lines.length; i++) {
                doc.text(lines[i], textIndent, y);
                y += 14;
              }
              y += 4;
            }`
);

code = code.replace(
  /doc\.text\(proj\.title \|\| 'Project', margin, y\);\s*if \(proj\.technologiesUsed && proj\.technologiesUsed\.length > 0\) \{\s*doc\.setFont\(([^,]+),\s*'([^']+)'\);\s*doc\.setFontSize\((\d+)\);\s*doc\.setTextColor\(([^)]+)\);\s*const titleWidth = doc\.getTextWidth\([^\n]+\);\s*const techStr = `([^`]+)`;\s*doc\.text\(techStr, margin \+ titleWidth, y\);\s*\}\s*y \+= 13;/g,
  (match, pFont, pStyle, pSize, pColor, pTech) => {
    return `const titleLines = doc.splitTextToSize(proj.title || 'Project', contentWidth);
        checkNewPage(14 * Math.max(1, titleLines.length));
        for (let i = 0; i < titleLines.length; i++) {
          doc.text(titleLines[i], margin, y);
          y += 14;
        }
        
        if (proj.technologiesUsed && proj.technologiesUsed.length > 0) {
          doc.setFont(${pFont}, '${pStyle}');
          doc.setFontSize(${pSize});
          doc.setTextColor(${pColor});
          const techStr = \`${pTech}\`;
          const techLines = doc.splitTextToSize(techStr, contentWidth);
          checkNewPage(13 * Math.max(1, techLines.length));
          for (let i = 0; i < techLines.length; i++) {
            doc.text(techLines[i], margin, y);
            y += 13;
          }
        }`;
  }
);

code = code.replace(
  /const titleLine = proj\.title \|\| 'Project';\s*doc\.text\(titleLine, margin, y\);\s*const titleWidth = doc\.getTextWidth\(titleLine\);\s*if \(proj\.technologiesUsed && proj\.technologiesUsed\.length > 0\) \{\s*doc\.setFont\('helvetica', 'italic'\);\s*doc\.setFontSize\(9\.5\);\s*doc\.setTextColor\(71, 85, 105\);\s*const techText = `\| \$\{proj\.technologiesUsed\.join\([^)]+\)\}`;\s*doc\.text\(techText, margin \+ titleWidth \+ 6, y\);\s*\}\s*y \+= 14;/g,
  `const titleLines = doc.splitTextToSize(proj.title || 'Project', contentWidth);
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
        }`
);

fs.writeFileSync('src/lib/pdfGenerator.ts', code, 'utf8');
console.log("Refactoring complete");
