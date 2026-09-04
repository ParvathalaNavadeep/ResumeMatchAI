const { PDFParse } = require('pdf-parse');
const fs = require('fs');
async function run() {
  const buf = fs.readFileSync('test.pdf');
  const parser = new PDFParse({ data: buf });
  console.log(await parser.getText());
}
run();
