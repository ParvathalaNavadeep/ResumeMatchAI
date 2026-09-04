const fs = require('fs');
let code = fs.readFileSync('src/components/CreateResumePage.tsx', 'utf8');

const target = `  if (contentType.includes('application/json')) {
    json = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => '');
    console.error(\`Non-JSON response from \${url}:\`, text.slice(0, 200));
  }`;

const replacement = `  if (contentType.includes('application/json')) {
    json = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => '');
    console.error(\`Non-JSON response from \${url}:\`, text.slice(0, 200));
    
    // Detect AI Studio Ingress HTML error fallback (413 Payload Too Large or 504 Timeout)
    if (text.toLowerCase().includes('<!doctype html>')) {
      if (url.includes('extract-pdf')) {
         throw new Error('Upload blocked by server proxy (file may be too large, >1MB, or request timed out). Please try a smaller PDF.');
      } else {
         throw new Error('Server proxy timeout or unavailable endpoint. Please try again.');
      }
    }
  }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/CreateResumePage.tsx', code);
