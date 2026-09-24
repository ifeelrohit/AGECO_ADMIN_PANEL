import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Enquiry } from '../types/index.ts';

/**
 * Format enquiry type into human readable string
 */
export function formatEnquiryType(type: Enquiry['type']): string {
  switch (type) {
    case 'RFP_RFQ':
      return 'RFP / RFQ';
    case 'TECHNICAL_SPECIFICATION':
      return 'Technical Spec';
    case 'SPARE_PARTS':
      return 'Spare Parts';
    case 'EPC_CONSULTATION':
      return 'EPC Consultation';
    default:
      return type || 'General';
  }
}

/**
 * Format date string safely
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format date-time string safely
 */
export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Export array of enquiries to an Excel (.xlsx) file
 */
export function exportEnquiriesToExcel(
  enquiries: Enquiry[],
  filename = `Ageco_Enquiries_${new Date().toISOString().split('T')[0]}.xlsx`
): void {
  if (!enquiries || enquiries.length === 0) {
    alert('No enquiry records available to export.');
    return;
  }

  // Map data to structured, professional tabular columns
  const rows = enquiries.map((item, index) => {
    const notesSummary = (item.internalNotes || [])
      .map(
        (n) =>
          `[${formatDate(n.createdAt)} - ${n.author || 'Staff'}]: ${n.text}`
      )
      .join(' | ');

    return {
      '#': index + 1,
      'Reference No.': item.referenceNumber || 'N/A',
      'Status': (item.status || 'NEW').replace('_', ' '),
      'Priority': item.priority || 'MEDIUM',
      'Enquiry Type': formatEnquiryType(item.type),
      'Company Name': item.company || '-',
      'Contact Person': item.contactName || '-',
      'Email': item.email || '-',
      'Phone': item.phone || '-',
      'Subject': item.subject || '-',
      'Budget Estimate': item.projectBudgetEstimate || 'Not Specified',
      'Assigned To': item.assignedTo || 'Unassigned',
      'Date Received': formatDateTime(item.createdAt),
      'Last Updated': formatDateTime(item.updatedAt),
      'Full Message / Requirements': item.message || '',
      'Internal Notes': notesSummary || 'No notes',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for comfortable reading
  worksheet['!cols'] = [
    { wch: 5 },   // #
    { wch: 16 },  // Reference No.
    { wch: 14 },  // Status
    { wch: 12 },  // Priority
    { wch: 22 },  // Enquiry Type
    { wch: 28 },  // Company Name
    { wch: 22 },  // Contact Person
    { wch: 26 },  // Email
    { wch: 18 },  // Phone
    { wch: 32 },  // Subject
    { wch: 18 },  // Budget Estimate
    { wch: 20 },  // Assigned To
    { wch: 20 },  // Date Received
    { wch: 20 },  // Last Updated
    { wch: 45 },  // Message
    { wch: 45 },  // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Enquiries');
  XLSX.writeFile(workbook, filename);
}

/**
 * Export array of enquiries to a landscape PDF report
 */
export function exportEnquiriesToPdf(
  enquiries: Enquiry[],
  filterContext?: { query?: string; status?: string }
): void {
  if (!enquiries || enquiries.length === 0) {
    alert('No enquiry records available to export.');
    return;
  }

  // Create A4 Landscape PDF
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const currentDateStr = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Top header banner background
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 54, 'F');

  // Orange accent bar
  doc.setFillColor(249, 115, 22); // Orange-500
  doc.rect(0, 54, pageWidth, 4, 'F');

  // Brand Name and Report Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('AGECO POWER & INDUSTRIAL SYSTEMS', 36, 32);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text('Customer Enquiries & Quotation Requests Register', 36, 46);

  // Top right metadata
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${currentDateStr}`, pageWidth - 36, 28, { align: 'right' });
  doc.text(`Total Records: ${enquiries.length}`, pageWidth - 36, 42, { align: 'right' });

  // Summary Metrics Bar
  const counts = {
    new: enquiries.filter((e) => e.status === 'NEW').length,
    inReview: enquiries.filter((e) => e.status === 'IN_REVIEW').length,
    quoted: enquiries.filter((e) => e.status === 'QUOTED').length,
    closed: enquiries.filter((e) => e.status === 'CLOSED').length,
  };

  let filterText = 'Filters: All Records';
  if (filterContext?.status) {
    filterText = `Filter: Status = ${filterContext.status.replace('_', ' ')}`;
  }
  if (filterContext?.query) {
    filterText += ` | Search: "${filterContext.query}"`;
  }

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(filterText, 36, 74);

  // Status counters summary pill string
  const summaryStr = `Status Breakdown:  New (${counts.new})   |   In Review (${counts.inReview})   |   Quoted (${counts.quoted})   |   Closed (${counts.closed})`;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(summaryStr, pageWidth - 36, 74, { align: 'right' });

  // Table Columns & Rows
  const tableHeaders = [
    'Ref #',
    'Date',
    'Company',
    'Contact',
    'Type',
    'Priority',
    'Budget',
    'Status',
    'Assigned To',
  ];

  const tableData = enquiries.map((item) => [
    item.referenceNumber || 'N/A',
    formatDate(item.createdAt),
    item.company || '-',
    item.contactName || '-',
    formatEnquiryType(item.type),
    item.priority || 'MED',
    item.projectBudgetEstimate || 'Pending',
    (item.status || 'NEW').replace('_', ' '),
    item.assignedTo || 'Unassigned',
  ]);

  autoTable(doc, {
    startY: 85,
    head: [tableHeaders],
    body: tableData,
    margin: { left: 36, right: 36, bottom: 40 },
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 6,
      textColor: [30, 41, 59],
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold', textColor: [234, 88, 12] }, // Ref # orange
      1: { cellWidth: 65 }, // Date
      2: { cellWidth: 130, fontStyle: 'bold' }, // Company
      3: { cellWidth: 100 }, // Contact
      4: { cellWidth: 90 }, // Type
      5: { cellWidth: 60 }, // Priority
      6: { cellWidth: 75 }, // Budget
      7: { cellWidth: 75, fontStyle: 'bold' }, // Status
      8: { cellWidth: 95 }, // Assigned
    },
    didDrawPage: (data) => {
      // Footer
      const str = `Page ${data.pageNumber}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'CONFIDENTIAL - FOR INTERNAL AGECO OPERATIONS ONLY',
        36,
        doc.internal.pageSize.getHeight() - 18
      );
      doc.text(
        str,
        pageWidth - 36,
        doc.internal.pageSize.getHeight() - 18,
        { align: 'right' }
      );
    },
  });

  const filename = `Ageco_Enquiries_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Export a single enquiry as a detailed PDF Dossier / Request Sheet
 */
export function exportSingleEnquiryToPdf(enquiry: Enquiry): void {
  if (!enquiry) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top header banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 60, 'F');
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 60, pageWidth, 4, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('AGECO INDUSTRIAL & POWER SYSTEMS', 36, 32);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text('Enquiry Dossier & Commercial Specification Sheet', 36, 48);

  // Ref # Box top right
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(254, 215, 170); // Light orange
  doc.text(enquiry.referenceNumber, pageWidth - 36, 36, { align: 'right' });

  // Status & Date Subheader
  let y = 84;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Submitted: ${formatDateTime(enquiry.createdAt)}  |  Last Updated: ${formatDateTime(enquiry.updatedAt)}`,
    36,
    y
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Status: ${enquiry.status.replace('_', ' ')}`, pageWidth - 36, y, {
    align: 'right',
  });

  y += 18;

  // Box 1: Company & Contact Information
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(36, y, pageWidth - 72, 85, 4, 4, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Client & Contact Details', 48, y + 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text(`Company:`, 48, y + 36);
  doc.setFont('helvetica', 'bold');
  doc.text(enquiry.company, 110, y + 36);

  doc.setFont('helvetica', 'normal');
  doc.text(`Contact:`, 48, y + 52);
  doc.setFont('helvetica', 'bold');
  doc.text(enquiry.contactName, 110, y + 52);

  doc.setFont('helvetica', 'normal');
  doc.text(`Email:`, 48, y + 68);
  doc.setFont('helvetica', 'bold');
  doc.text(enquiry.email, 110, y + 68);

  // Right column of box 1
  const midX = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'normal');
  doc.text(`Phone:`, midX, y + 36);
  doc.setFont('helvetica', 'bold');
  doc.text(enquiry.phone || 'N/A', midX + 50, y + 36);

  doc.setFont('helvetica', 'normal');
  doc.text(`Assigned To:`, midX, y + 52);
  doc.setFont('helvetica', 'bold');
  doc.text(enquiry.assignedTo || 'Unassigned', midX + 70, y + 52);

  doc.setFont('helvetica', 'normal');
  doc.text(`Priority:`, midX, y + 68);
  doc.setFont('helvetica', 'bold');
  doc.text(enquiry.priority || 'MEDIUM', midX + 50, y + 68);

  y += 100;

  // Box 2: Scope & Budget Classification
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(36, y, pageWidth - 72, 55, 4, 4, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Enquiry Classification & Financial Scope', 48, y + 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Category / Type:`, 48, y + 36);
  doc.setFont('helvetica', 'bold');
  doc.text(formatEnquiryType(enquiry.type), 135, y + 36);

  doc.setFont('helvetica', 'normal');
  doc.text(`Budget Estimate:`, midX, y + 36);
  doc.setFont('helvetica', 'bold');
  doc.text(enquiry.projectBudgetEstimate || 'Pending Quotation', midX + 85, y + 36);

  y += 70;

  // Box 3: Subject & Requirements Message
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Subject: ${enquiry.subject}`, 36, y);

  y += 12;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(36, y, pageWidth - 72, 110, 4, 4, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const splitMessage = doc.splitTextToSize(enquiry.message || 'No message provided', pageWidth - 96);
  doc.text(splitMessage, 48, y + 18);

  y += 125;

  // Box 4: Internal Notes Log Table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Internal Team Notes & Timeline (${enquiry.internalNotes?.length || 0})`, 36, y);

  const notesData = (enquiry.internalNotes || []).map((note, idx) => [
    (idx + 1).toString(),
    formatDateTime(note.createdAt),
    note.author || 'Staff',
    note.text,
  ]);

  if (notesData.length === 0) {
    notesData.push(['-', '-', 'System', 'No internal notes recorded for this enquiry yet.']);
  }

  autoTable(doc, {
    startY: y + 8,
    head: [['#', 'Date & Time', 'Team Member', 'Note / Action Log']],
    body: notesData,
    margin: { left: 36, right: 36, bottom: 40 },
    theme: 'grid',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 110 },
      2: { cellWidth: 90, fontStyle: 'bold' },
      3: { cellWidth: 'auto' },
    },
    didDrawPage: (data) => {
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `AGECO INDUSTRIAL SYSTEMS - ENQUIRY ${enquiry.referenceNumber}`,
        36,
        doc.internal.pageSize.getHeight() - 18
      );
      doc.text(
        `Page ${data.pageNumber}`,
        pageWidth - 36,
        doc.internal.pageSize.getHeight() - 18,
        { align: 'right' }
      );
    },
  });

  doc.save(`Ageco_Enquiry_${enquiry.referenceNumber}.pdf`);
}
