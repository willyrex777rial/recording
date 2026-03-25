import { Document, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy!', err);
    return false;
  }
};

export const downloadTXT = (text, filename = 'transcript.txt') => {
  const element = document.createElement("a");
  const file = new Blob([text], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element); // Required for this to work in FireFox
  element.click();
  document.body.removeChild(element);
};

export const downloadDOCX = async (text, filename = 'transcript.docx') => {
  // Split text by paragraphs, preserving empty lines or line breaks
  const paragraphs = text.split('\n').map(line => {
    return new Paragraph({
      children: [
        new TextRun({
          text: line,
          font: "Arial",
          size: 24, // Half-points (12pt)
        }),
      ],
      spacing: {
        after: 200, // Twips
      },
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  try {
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.href = url;
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  } catch (err) {
    console.error("Error generating DOCX:", err);
  }
};

export const downloadPDF = (text, filename = 'transcript.pdf') => {
  const doc = new jsPDF();

  // Set font
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxLineWidth = pageWidth - margin * 2;
  const lineHeight = 7;

  let cursorY = margin;

  // Split text by newlines
  const lines = text.split('\n');

  lines.forEach(line => {
    // Check if line needs to wrap
    const wrappedText = doc.splitTextToSize(line, maxLineWidth);

    // Add lines to PDF, handling page breaks
    wrappedText.forEach(wrappedLine => {
        if (cursorY + lineHeight > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            cursorY = margin;
        }
        doc.text(wrappedLine, margin, cursorY);
        cursorY += lineHeight;
    });
    // Add extra space for paragraph breaks (empty lines)
    if(line === '') {
        cursorY += lineHeight / 2;
    }
  });

  doc.save(filename);
};
