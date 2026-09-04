const fs = require('fs');
let code = fs.readFileSync('src/components/CreateResumePage.tsx', 'utf8');

const target = `  const handleExtractText = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a PDF file first.');
      return;
    }`;

const replacement = `  const handleExtractText = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a PDF file first.');
      return;
    }
    
    // Nginx ingress has a 1MB payload limit. Prevent proxy HTML fallback errors.
    if (selectedFile.size > 1024 * 1024 * 3) {
      setErrorMessage('File size exceeds the 3MB limit. Please upload a smaller PDF to prevent server timeouts.');
      return;
    }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/CreateResumePage.tsx', code);
