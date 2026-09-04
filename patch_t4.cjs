const fs = require('fs');
let code = fs.readFileSync('src/lib/pdfGenerator.ts', 'utf8');

// Fix Skills
const skillsTarget = `        validSkills.forEach(skillCat => {
          const catLabel = skillCat.category ? \`\${skillCat.category}: \` : 'Skills: ';
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          const catWidth = 100; // Fixed width for category
          
          const itemsText = skillCat.items.join(', ');
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);

          const wrappedItems = doc.splitTextToSize(itemsText, contentWidth - 85);
          checkNewPage(14 * Math.max(1, wrappedItems.length));

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(catLabel, margin, y);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
          doc.text(wrappedItems[0], margin + 85, y);
          y += 14;

          for (let i = 1; i < wrappedItems.length; i++) {
            checkNewPage(14);
            doc.text(wrappedItems[i], margin + 85, y);
            y += 14;
          }
          y += 3;
        });`;

const skillsReplacement = `        validSkills.forEach(skillCat => {
          const catLabel = skillCat.category ? \`\${skillCat.category}: \` : 'Skills: ';
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
        });`;

code = code.replace(skillsTarget, skillsReplacement);

// Fix Exp Bullets
const expTarget = `          exp.bullets.forEach(bullet => {
            const lines = doc.splitTextToSize(bullet, bulletContentWidth);
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
          });`;

const expReplacement = `          exp.bullets.forEach(bullet => {
            if (!bullet || !bullet.trim()) return;
            const lines = doc.splitTextToSize(bullet.trim(), bulletContentWidth);
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
          });`;

code = code.replace(expTarget, expReplacement);

// Fix Proj Desc
const projTarget = `          const lines = doc.splitTextToSize(proj.description, bulletContentWidth);
          checkNewPage(14 * Math.max(1, lines.length));
          
          doc.circle(bulletIndent + 3, y - 3.5, 1.5, 'F');
          
          doc.text(lines[0], textIndent, y);
          y += 14;

          for (let i = 1; i < lines.length; i++) {
            checkNewPage(14);
            doc.text(lines[i], textIndent, y);
            y += 14;
          }
          y += 4;`;

const projReplacement = `          if (proj.description.trim()) {
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
          }`;

code = code.replace(projTarget, projReplacement);

fs.writeFileSync('src/lib/pdfGenerator.ts', code);
