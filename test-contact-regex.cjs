const fs = require('fs');
let code = fs.readFileSync('src/lib/pdfGenerator.ts', 'utf8');

const matches = code.match(/const contactLine = contactParts\.join\('[^']+'\);\s*if \(contactLine\) \{\s*const wrappedContact = doc\.splitTextToSize\(contactLine, contentWidth\);\s*doc\.text\(wrappedContact, (margin|pageWidth \/ 2), y(?:, \{ align: 'center' \})?\);\s*y \+= \(wrappedContact\.length \* 12\) \+ \d+;\s*\} else \{\s*y \+= \d+;\s*\}/g);

console.log("Contact matches:", matches ? matches.length : 0);

