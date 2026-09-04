const fs = require('fs');

let code = fs.readFileSync('src/lib/pdfGenerator.ts', 'utf8');

console.log("Bullets matched:", code.match(/const wrappedBullet = doc\.splitTextToSize\(bullet\.trim\(\), contentWidth - (\d+)\);\s*const bulletHeight = [^;]+;\s*checkNewPage\(bulletHeight\);\s*doc\.text\('[^']+', margin \+ (\d+), y\);\s*doc\.text\(wrappedBullet, margin \+ (\d+), y\);\s*y \+= bulletHeight;/g)?.length);

console.log("Contact center matched:", code.match(/const contactLine = contactParts\.join\('[^']+'\);\s*if \(contactLine\) \{\s*const wrappedContact = doc\.splitTextToSize\(contactLine, contentWidth\);\s*doc\.text\(wrappedContact, pageWidth \/ 2, y, \{ align: 'center' \}\);\s*y \+= \(wrappedContact\.length \* 12\) \+ \d+;\s*\} else \{\s*y \+= \d+;\s*\}/g)?.length);

console.log("Contact left matched:", code.match(/const contactLine = contactParts\.join\('[^']+'\);\s*if \(contactLine\) \{\s*const wrappedContact = doc\.splitTextToSize\(contactLine, contentWidth\);\s*doc\.text\(wrappedContact, margin, y\);\s*y \+= \(wrappedContact\.length \* 12\) \+ \d+;\s*\} else \{\s*y \+= \d+;\s*\}/g)?.length);

console.log("RM Pro bullets matched:", code.match(/const lines = doc\.splitTextToSize\(bullet\.trim\(\), bulletContentWidth\);\s*if \(lines\.length > 0\) \{\s*checkNewPage\(14 \* Math\.max\(1, lines\.length\)\);\s*doc\.circle\(bulletIndent \+ 3, y - 3\.5, 1\.5, 'F'\);\s*doc\.text\(lines\[0\], textIndent, y\);\s*y \+= 14;\s*for \(let i = 1; i < lines\.length; i\+\+\) \{\s*checkNewPage\(14\);\s*doc\.text\(lines\[i\], textIndent, y\);\s*y \+= 14;\s*\}\s*y \+= 4;\s*\}/g)?.length);

