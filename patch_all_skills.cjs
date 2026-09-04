const fs = require('fs');
let code = fs.readFileSync('src/lib/pdfGenerator.ts', 'utf8');

const t1_target = `const itemsText = skillCat.items.join(', ');
          doc.setFont('times', 'normal');
          doc.setTextColor(30, 41, 59);

          const wrappedItems = doc.splitTextToSize(itemsText, contentWidth - catWidth);`;

const t1_replace = `const itemsText = skillCat.items.join(', ');
          if (!itemsText.trim()) return;
          doc.setFont('times', 'normal');
          doc.setTextColor(30, 41, 59);

          const wrappedItems = doc.splitTextToSize(itemsText.trim(), contentWidth - catWidth);`;

code = code.split(t1_target).join(t1_replace);

const t2_target = `const itemsText = skillCat.items.join(', ');
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);

          const wrappedItems = doc.splitTextToSize(itemsText, contentWidth - catWidth);`;

const t2_replace = `const itemsText = skillCat.items.join(', ');
          if (!itemsText.trim()) return;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);

          const wrappedItems = doc.splitTextToSize(itemsText.trim(), contentWidth - catWidth);`;

code = code.split(t2_target).join(t2_replace);

fs.writeFileSync('src/lib/pdfGenerator.ts', code);
