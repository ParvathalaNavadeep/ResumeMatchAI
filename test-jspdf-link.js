const { jsPDF } = require('jspdf');
const doc = new jsPDF();
console.log(typeof doc.textWithLink);
