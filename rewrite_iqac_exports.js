const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'frontend', 'src', 'pages', 'IqacReports.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

const iqacFormatUtil = `
const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const formatIqacValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value === 'true') return 'Yes';
    if (value === 'false') return 'No';
    if (value instanceof Date || (typeof value === 'string' && /^\\d{4}-\\d{2}-\\d{2}T/.test(value))) {
        try {
            return new Date(value).toLocaleDateString('en-GB');
        } catch(e) {
            return value;
        }
    }
    if (Array.isArray(value)) {
        if (!value.length) return 'None';
        return value.map((item, index) => {
            if (isPlainObject(item)) {
                // Flatten the object keys
                const details = Object.entries(item)
                    .filter(([k, v]) => v !== null && v !== undefined && v !== '' && !k.toLowerCase().includes('id'))
                    .map(([k, v]) => {
                        const label = k.replace(/_/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase());
                        return \`\${label}: \${v}\`;
                    })
                    .join(' | ');
                return \`\${index + 1}. \${details}\`;
            }
            return \`\${index + 1}. \${String(item)}\`;
        }).join('\\n\\n');
    }
    if (isPlainObject(value)) {
        return Object.entries(value)
            .filter(([k, v]) => v !== null && v !== undefined && v !== '' && !k.toLowerCase().includes('id'))
            .map(([k, v]) => {
                const label = k.replace(/_/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase());
                return \`\${label}: \${v}\`;
            })
            .join('\\n');
    }
    return String(value);
};
`;

const handleGeneratePDFRegex = /const handleGeneratePDF = async \(\) => \{[\s\S]*?toast\.success\('PDF Report Generated Successfully'\);\s*\};/;
const newHandleGeneratePDF = `  const handleGeneratePDF = async () => {
    const reportData = await generateReportData();
    if (!reportData) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const periodStr = reportType === 'annually' ? \`Academic Year \${academicYear}\` : \`Month \${monthYearDisplay}\`;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const addPageHeader = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(31, 41, 55); 
        doc.text("DELHI TECHNOLOGICAL UNIVERSITY", pageWidth / 2, 35, { align: 'center' });
        doc.setFontSize(12);
        doc.setTextColor(79, 70, 229); 
        doc.text(\`IQAC Official Report: \${periodStr}\`, pageWidth / 2, 53, { align: 'center' });
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(1);
        doc.line(40, 65, pageWidth - 40, 65);
        
        const str = "Page " + doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(156, 163, 175);
        doc.text(\`Generated on \${new Date().toLocaleDateString('en-GB')} at \${new Date().toLocaleTimeString('en-GB')}\`, 40, pageHeight - 20);
        doc.text(str, pageWidth - 40 - doc.getTextWidth(str), pageHeight - 20);
    };

    addPageHeader();

    // Summary Table
    let currentY = 85;
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(31, 41, 55);
    doc.text('EXECUTIVE SUMMARY', 40, currentY);
    currentY += 16;
    
    const summaryBody = reportData.map(r => [r.title, r.data.length.toString()]);
    doc.autoTable({
      startY: currentY,
      head: [['Category', 'Total Records']],
      body: summaryBody,
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 10.5, cellPadding: 7, textColor: [31, 41, 55], lineColor: [209, 213, 219], lineWidth: 0.5 },
      headStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold', halign: 'left', fontSize: 11 },
      margin: { top: 85, right: 40, bottom: 50, left: 40 },
      didDrawPage: addPageHeader
    });

    currentY = doc.lastAutoTable.finalY + 30;

    // Detailed Sections
    reportData.forEach((section, index) => {
      if (section.data.length === 0) return;

      doc.addPage();
      currentY = 85;

      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(31, 41, 55);
      doc.text(section.title.toUpperCase(), 40, currentY);
      currentY += 16;

      const columns = section.columns.map(c => c.header);
      const isWide = columns.length > 5;

      if (isWide) {
          // Transpose data
          section.data.forEach((row, rowIndex) => {
              const body = [];
              section.columns.forEach(col => {
                  const val = formatIqacValue(row[col.accessor]);
                  if (val !== 'N/A' && val !== 'None') {
                      body.push([col.header, val]);
                  }
              });

              if (body.length > 0) {
                  if (rowIndex > 0 && currentY > pageHeight - 100) {
                      doc.addPage();
                      currentY = 85;
                  }
                  
                  doc.setFontSize(11);
                  doc.setFont("helvetica", "bold");
                  doc.setTextColor(79, 70, 229);
                  doc.text(\`Record \${rowIndex + 1}\`, 40, currentY);
                  currentY += 10;

                  doc.autoTable({
                      startY: currentY,
                      head: [['Field', 'Value']],
                      body: body,
                      theme: 'striped',
                      styles: { font: 'helvetica', fontSize: 10.5, cellPadding: 7, overflow: 'linebreak', textColor: [31, 41, 55], lineColor: [209, 213, 219], lineWidth: 0.5 },
                      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left', fontSize: 11 },
                      alternateRowStyles: { fillColor: [249, 250, 251] },
                      margin: { top: 85, right: 40, bottom: 50, left: 40 },
                      didDrawPage: addPageHeader
                  });
                  currentY = doc.lastAutoTable.finalY + 25;
              }
          });
      } else {
          // Standard table
          const head = [columns];
          const body = section.data.map(row => {
            return section.columns.map(col => formatIqacValue(row[col.accessor]));
          });

          doc.autoTable({
            startY: currentY,
            head,
            body,
            theme: 'striped',
            styles: { font: 'helvetica', fontSize: 10.5, cellPadding: 7, overflow: 'linebreak', textColor: [31, 41, 55], lineColor: [209, 213, 219], lineWidth: 0.5 },
            headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left', fontSize: 11 },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            margin: { top: 85, right: 40, bottom: 50, left: 40 },
            didDrawPage: addPageHeader
          });
          currentY = doc.lastAutoTable.finalY + 30;
      }
    });

    doc.save(\`IQAC_Report_\${periodStr.replace(/\\s+/g, '_')}.pdf\`);
    toast.success('PDF Report Generated Successfully');
  };`;

const handleGenerateExcelRegex = /const handleGenerateExcel = async \(\) => \{[\s\S]*?toast\.success\('Excel Report Generated Successfully'\);\s*\};/;
const newHandleGenerateExcel = `  const handleGenerateExcel = async () => {
    const reportData = await generateReportData();
    if (!reportData) return;

    const periodStr = reportType === 'annually' ? \`Academic_Year_\${academicYear}\` : \`Month_\${monthYearDisplay}\`;
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [['Category', 'Total Records']];
    reportData.forEach(r => summaryData.push([r.title, r.data.length]));
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Auto-size Summary columns
    wsSummary['!cols'] = [{ wch: 40 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary Overview');

    // Detailed Sheets
    reportData.forEach(section => {
      if (section.data.length === 0) return;
      
      const headers = section.columns.map(c => c.header);
      const body = section.data.map(row => {
        return section.columns.map(col => formatIqacValue(row[col.accessor]));
      });
      
      const ws = XLSX.utils.aoa_to_sheet([headers, ...body]);
      
      // Auto-size columns based on header length (fallback 15)
      ws['!cols'] = headers.map(h => ({ wch: Math.max(15, h.length + 5) }));

      // Sheet names must be <= 31 chars
      let sheetName = section.title.substring(0, 31).replace(/[\\[\\]*?:\/\\\\]/g, '');
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, \`IQAC_Report_\${periodStr}.xlsx\`);
    toast.success('Excel Report Generated Successfully');
  };`;

// Insert the utility function just before handleGeneratePDF
content = content.replace(/const handleGeneratePDF = async \(\) => \{/, iqacFormatUtil + '\n  const handleGeneratePDF = async () => {');

// Replace the functions
content = content.replace(handleGeneratePDFRegex, newHandleGeneratePDF);
content = content.replace(handleGenerateExcelRegex, newHandleGenerateExcel);

fs.writeFileSync(targetPath, content, 'utf8');
console.log("Successfully rebuilt IQAC Excel and PDF export.");
