const fs = require('fs');

let code = fs.readFileSync('src/lib/pdfGenerator.ts', 'utf8');

const t1Matches = code.match(/doc\.text\(proj\.title \|\| 'Project', margin, y\);\s*if \(proj\.technologiesUsed && proj\.technologiesUsed\.length > 0\) \{\s*doc\.setFont\('[^']+', 'italic'\);\s*doc\.setFontSize\(\d+\);\s*doc\.setTextColor\(\d+, \d+, \d+\);\s*const titleWidth = doc\.getTextWidth\(\(proj\.title \|\| 'Project'\) \+ ' '\);\s*const techStr = `\(\$\{proj\.technologiesUsed\.join\([^)]+\)\}\)`;\s*doc\.text\(techStr, margin \+ titleWidth, y\);\s*\}\s*y \+= \d+;/g);

console.log("Template 1-3 projects matched:", t1Matches?.length);

const rmProProj = code.match(/const titleLine = proj\.title \|\| 'Project';\s*doc\.text\(titleLine, margin, y\);\s*const titleWidth = doc\.getTextWidth\(titleLine\);\s*if \(proj\.technologiesUsed && proj\.technologiesUsed\.length > 0\) \{\s*doc\.setFont\('helvetica', 'italic'\);\s*doc\.setFontSize\(9\.5\);\s*doc\.setTextColor\(71, 85, 105\);\s*const techText = `\| \$\{proj\.technologiesUsed\.join\([^)]+\)\}`;\s*doc\.text\(techText, margin \+ titleWidth \+ 6, y\);\s*\}\s*y \+= 14;/g);

console.log("RM Pro projects matched:", rmProProj?.length);

