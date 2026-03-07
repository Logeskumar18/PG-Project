// Utility to download a DOM node as PDF using html2pdf.js
// Usage: import downloadPDF from './downloadPDF';
// downloadPDF(domNode, filename)
import html2pdf from 'html2pdf.js';

export default function downloadPDF(domNode, filename = 'marksheet.pdf') {
  const opt = {
    margin:       0.5,
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(domNode).save();
}
