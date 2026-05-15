import React, { useState } from 'react';
import { resources } from '../config/tableConfig';
import { FiDownload, FiFileText, FiCalendar, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function IqacReports() {
  const [reportType, setReportType] = useState('annually');
  const [academicYear, setAcademicYear] = useState('2023-24');
  const [monthYear, setMonthYear] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const academicYears = ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25', '2025-26', '2026-27'];

  const filterData = (data) => {
    if (!data || !Array.isArray(data)) return [];

    return data.filter(item => {
      if (reportType === 'annually') {
        // Fallback checks for year
        if (item.academic_year) return item.academic_year === academicYear;
        if (item.year) return String(item.year) === academicYear.split('-')[0];
        if (item.year_of_publication) return String(item.year_of_publication) === academicYear.split('-')[0];
        if (item.start_date) return new Date(item.start_date).getFullYear() === parseInt(academicYear.split('-')[0]);
        if (item.createdAt) return new Date(item.createdAt).getFullYear() === parseInt(academicYear.split('-')[0]);
        return false;
      } else if (reportType === 'monthly') {
        if (!monthYear) return true;
        const [selectedYear, selectedMonth] = monthYear.split('-');
        
        // Find a date field
        const dateFields = ['start_date', 'end_date', 'date_of_launching', 'date', 'createdAt'];
        let recordDate = null;
        for (const field of dateFields) {
          if (item[field]) {
            recordDate = new Date(item[field]);
            break;
          }
        }
        if (!recordDate && item.updatedAt) recordDate = new Date(item.updatedAt);
        
        if (recordDate) {
          return recordDate.getFullYear() === parseInt(selectedYear) && 
                 (recordDate.getMonth() + 1) === parseInt(selectedMonth);
        }
        return false; // If no date field, exclude from monthly
      }
      return true;
    });
  };

  const generateReportData = async () => {
    if (reportType === 'monthly' && !monthYear) {
      toast.error('Please select a month and year');
      return null;
    }

    setIsGenerating(true);
    const reportData = [];

    for (const resource of resources) {
      try {
        const response = await resource.fetchData();
        const data = response?.data?.data || response?.data || response;
        
        const filtered = filterData(data);
        reportData.push({
          title: resource.title,
          columns: resource.columns,
          data: filtered
        });
      } catch (error) {
        console.error(`Failed to fetch data for ${resource.title}:`, error);
      }
    }

    setIsGenerating(false);
    return reportData;
  };

  const handleGeneratePDF = async () => {
    const reportData = await generateReportData();
    if (!reportData) return;

    const doc = new jsPDF();
    const periodStr = reportType === 'annually' ? `Academic Year ${academicYear}` : `Month ${monthYear}`;
    
    // Title Page
    doc.setFontSize(22);
    doc.text('DTU IQAC Official Report', 105, 40, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`Combined Summarized Report - ${periodStr}`, 105, 50, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 60, { align: 'center' });

    // Summary Table on Title Page
    doc.setFontSize(14);
    doc.text('Summary', 14, 80);
    
    const summaryBody = reportData.map(r => [r.title, r.data.length.toString()]);
    doc.autoTable({
      startY: 85,
      head: [['Category', 'Total Records']],
      body: summaryBody,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] } // Indigo 600
    });

    // Detailed Sections
    reportData.forEach((section) => {
      if (section.data.length === 0) return; // Skip empty sections

      doc.addPage();
      doc.setFontSize(16);
      doc.text(section.title, 14, 20);
      doc.setFontSize(10);
      doc.text(`Total Records: ${section.data.length}`, 14, 28);

      // Take first 5 columns for PDF readability
      const displayColumns = section.columns.slice(0, 5);
      const head = [displayColumns.map(c => c.header)];
      const body = section.data.map(row => {
        return displayColumns.map(col => {
          const val = row[col.accessor];
          if (val === null || val === undefined) return 'N/A';
          if (typeof val === 'object') return 'Object Data';
          return String(val);
        });
      });

      doc.autoTable({
        startY: 35,
        head,
        body,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8, cellPadding: 2 }
      });
    });

    doc.save(`IQAC_Report_${periodStr.replace(/\s+/g, '_')}.pdf`);
    toast.success('PDF Report Generated Successfully');
  };

  const handleGenerateExcel = async () => {
    const reportData = await generateReportData();
    if (!reportData) return;

    const periodStr = reportType === 'annually' ? `Academic_Year_${academicYear}` : `Month_${monthYear}`;
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [['Category', 'Total Records']];
    reportData.forEach(r => summaryData.push([r.title, r.data.length]));
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary Overview');

    // Detailed Sheets
    reportData.forEach(section => {
      if (section.data.length === 0) return;
      
      const headers = section.columns.map(c => c.header);
      const body = section.data.map(row => {
        return section.columns.map(col => {
            const val = row[col.accessor];
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') return JSON.stringify(val);
            return String(val);
        });
      });
      
      const ws = XLSX.utils.aoa_to_sheet([headers, ...body]);
      
      // Sheet names must be <= 31 chars
      let sheetName = section.title.substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, `IQAC_Report_${periodStr}.xlsx`);
    toast.success('Excel Report Generated Successfully');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FiFileText className="text-indigo-600" />
          IQAC Reports
        </h1>
        <p className="text-gray-500 mt-2">Generate official combined reports for all IQAC activities.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Report Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Report Type</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setReportType('annually')}
                  className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    reportType === 'annually'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-indigo-200 text-gray-600'
                  }`}
                >
                  <FiCalendar className="w-6 h-6 mb-2" />
                  <span className="font-semibold">Annually</span>
                </button>
                <button
                  onClick={() => setReportType('monthly')}
                  className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    reportType === 'monthly'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-indigo-200 text-gray-600'
                  }`}
                >
                  <FiClock className="w-6 h-6 mb-2" />
                  <span className="font-semibold">Monthly</span>
                </button>
              </div>
            </div>

            {/* Period Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select {reportType === 'annually' ? 'Academic Year' : 'Month & Year'}
              </label>
              
              {reportType === 'annually' ? (
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 text-lg px-4"
                >
                  {academicYears.map(ay => (
                    <option key={ay} value={ay}>{ay}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="month"
                  value={monthYear}
                  onChange={(e) => setMonthYear(e.target.value)}
                  className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 text-lg px-4"
                />
              )}
            </div>

          </div>
        </div>
        
        <div className="bg-gray-50 p-6 md:p-8 border-t border-gray-100 flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={handleGenerateExcel}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <FiDownload />
            {isGenerating ? 'Fetching Data...' : 'Download Excel'}
          </button>
          
          {/*<button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md shadow-indigo-200"
          >
            <FiDownload />
            {isGenerating ? 'Fetching Data...' : 'Generate Official PDF'}
          </button>*/}
        </div>
      </div>
    </div>
  );
}
