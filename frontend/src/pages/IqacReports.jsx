
import React, { useState, useEffect } from 'react';
import { resources } from '../config/tableConfig';
import { useIqacFilter } from '../context/IqacFilterContext.jsx';
import { filterRecordsByScope } from '../utils/iqacScopeFilter.js';
import { getLastAcademicYears } from '../utils/academicYears.js';
import { FiDownload, FiFileText, FiCalendar, FiClock, FiBriefcase } from 'react-icons/fi';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { dashboardService } from '../services/dashboard.service';

export default function IqacReports() {
  const { 
    academicYear: dashboardYear, 
    departmentId, 
    setDepartmentId,
    departmentLocked 
  } = useIqacFilter();
  
  const [reportType, setReportType] = useState('annually');
  const [academicYear, setAcademicYear] = useState(
    dashboardYear !== 'All' ? dashboardYear : '2023-24'
  );
  const [monthYear, setMonthYear] = useState('');
  const [monthYearDisplay, setMonthYearDisplay] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [departmentsList, setDepartmentsList] = useState([{ id: 'All', name: 'All Departments' }]);

  const academicYears = getLastAcademicYears(10);

  // Fetch the branches/departments list same as the dashboard
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await dashboardService.getStats(dashboardYear, departmentId);
        if (data?.filters?.departments?.length) {
          const deptOptions = data.filters.departments;
          const locked = Boolean(data.filters?.departmentLocked ?? data.scope?.departmentLocked);
          setDepartmentsList(
            locked
              ? deptOptions
              : [{ id: 'All', name: 'All Departments' }, ...deptOptions]
          );
        }
      } catch (error) {
        console.error('Failed to fetch departments list', error);
      }
    };
    fetchDepartments();
  }, [dashboardYear, departmentId]);

  const toStoredMonthYear = (value) => {
    if (!value) return '';
    const match = value.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      return `${match[2]}-${match[1]}`;
    }
    return value;
  };

  const toDisplayMonthYear = (value) => {
    if (!value) return '';
    const match = value.match(/^(\d{2})-(\d{4})$/);
    if (match) {
      return `${match[2]}-${match[1]}`;
    }
    return value;
  };

  const filterData = (data) => {
    if (!data || !Array.isArray(data)) return [];

    const scoped = filterRecordsByScope(data, {
      academicYear: reportType === 'annually' ? academicYear : 'All',
      departmentId
    });

    return scoped.filter(item => {
      if (reportType === 'annually') {
        return true;
      } else if (reportType === 'monthly') {
        if (!monthYear) return true;

        // Check month-year fields (stored as MM-YYYY)
        const monthYearFields = [
          'year', 'year_of_publication', 'year_of_sanction', 'year_of_consultancy',
          'year_of_training', 'year_of_qualifying', 'year_of_joining', 'year_of_signing',
          'year_of_award', 'year_of_introduction', 'year_of_installation', 'year_of_purchase'
        ];

        // Check top-level fields
        for (const field of monthYearFields) {
          if (item[field] && item[field] === monthYear) {
            return true;
          }
        }

        // Check nested objectList arrays for month-year fields
        const arrayFields = ['faculty_involved', 'students_involved', 'faculty_participants',
          'student_participants', 'external_participants', 'external_collaborators',
          'faculty_members', 'students', 'faculty_recipients', 'student_recipients',
          'external_recipients', 'recognitions'];
        
        for (const arrField of arrayFields) {
          if (Array.isArray(item[arrField])) {
            for (const nestedItem of item[arrField]) {
              for (const field of monthYearFields) {
                if (nestedItem[field] && nestedItem[field] === monthYear) {
                  return true;
                }
              }
            }
          }
        }

        // Also check date fields for records without month-year fields
        const dateFields = ['start_date', 'end_date', 'date_of_launching', 'date', 'createdAt'];
        const [selectedYear, selectedMonth] = monthYear.split('-').reverse(); // MM-YYYY to YYYY, MM
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
        return false;
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

  
const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const formatIqacValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value === 'true') return 'Yes';
    if (value === 'false') return 'No';
    if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value))) {
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
                        const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                        return `${label}: ${v}`;
                    })
                    .join(' | ');
                return `${index + 1}. ${details}`;
            }
            return `${index + 1}. ${String(item)}`;
        }).join('\n\n');
    }
    if (isPlainObject(value)) {
        return Object.entries(value)
            .filter(([k, v]) => v !== null && v !== undefined && v !== '' && !k.toLowerCase().includes('id'))
            .map(([k, v]) => {
                const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                return `${label}: ${v}`;
            })
            .join('\n');
    }
    return String(value);
};

    const handleGeneratePDF = async () => {
    const reportData = await generateReportData();
    if (!reportData) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const periodStr = reportType === 'annually' ? `Academic Year ${academicYear}` : `Month ${monthYearDisplay}`;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const addPageHeader = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(31, 41, 55); 
        doc.text("DELHI TECHNOLOGICAL UNIVERSITY", pageWidth / 2, 35, { align: 'center' });
        doc.setFontSize(12);
        doc.setTextColor(79, 70, 229); 
        doc.text(`IQAC Official Report: ${periodStr}`, pageWidth / 2, 53, { align: 'center' });
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(1);
        doc.line(40, 65, pageWidth - 40, 65);
        
        const str = "Page " + doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(156, 163, 175);
        doc.text(`Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`, 40, pageHeight - 20);
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
                  doc.text(`Record ${rowIndex + 1}`, 40, currentY);
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

    doc.save(`IQAC_Report_${periodStr.replace(/\s+/g, '_')}.pdf`);
    toast.success('PDF Report Generated Successfully');
  };

    const handleGenerateExcel = async () => {
    const reportData = await generateReportData();
    if (!reportData) return;

    const periodStr = reportType === 'annually' ? `Academic_Year_${academicYear}` : `Month_${monthYearDisplay}`;
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
      let sheetName = section.title.substring(0, 31).replace(/[\[\]*?:/\\]/g, '');
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, `IQAC_Report_${periodStr}.xlsx`);
    toast.success('Excel Report Generated Successfully');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FiFileText className="text-indigo-600" />
          IQAC Reports
        </h1>
        <p className="text-gray-500 mt-2">Generate official combined reports for all IQAC activities.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
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
                  value={monthYearDisplay}
                  onChange={(e) => {
                    setMonthYearDisplay(e.target.value);
                    setMonthYear(toStoredMonthYear(e.target.value));
                  }}
                  className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 text-lg px-4"
                />
              )}
            </div>

            {/* Branch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select Branch
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={departmentLocked}
                className="w-full h-14 rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 text-lg px-4 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {departmentsList.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.id === 'All' ? dept.name : `${dept.name} Branch`}
                  </option>
                ))}
              </select>
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