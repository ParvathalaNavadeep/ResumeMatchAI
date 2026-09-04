const fs = require('fs');

const updateFormat = (filename) => {
  let code = fs.readFileSync(filename, 'utf8');
  if (code.includes('replace(/\\\\s\\+in\\\\s\\+\\(.\\+\\?\\)\\\\s\\+in\\\\s\\+\\\\1/i')) {
    return;
  }
  const target = "  // Handle 'in null' or 'null'";
  const replacement = "  // Handle duplicated 'in MPC in MPC'\n  title = title.replace(/\\s+in\\s+(.+?)\\s+in\\s+\\1/i, ' — $1');\n  title = title.replace(/(.+?)\\s+in\\s+\\1/i, '$1');\n\n" + target;
  code = code.replace(target, replacement);
  fs.writeFileSync(filename, code);
}

updateFormat('src/components/ResumePreviewPage.tsx');
updateFormat('src/lib/pdfGenerator.ts');
