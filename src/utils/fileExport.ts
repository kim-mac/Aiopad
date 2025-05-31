import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph } from 'docx';

export const exportAsPDF = (title: string, content: string) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(title, 20, 20);
  
  // Add content
  doc.setFontSize(12);
  const splitText = doc.splitTextToSize(content, 170);
  doc.text(splitText, 20, 30);
  
  // Save the PDF
  doc.save(`${title}.pdf`);
};

export const exportAsWord = async (title: string, content: string) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: title,
          heading: 'Heading1'
        }),
        new Paragraph({
          text: content
        })
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.docx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const exportAsTXT = (title: string, content: string) => {
  const element = document.createElement('a');
  const file = new Blob([`${title}\n\n${content}`], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  element.download = `${title}.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(element.href);
}; 