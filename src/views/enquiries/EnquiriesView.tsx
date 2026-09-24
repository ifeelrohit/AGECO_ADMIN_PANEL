import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  MessageSquare,
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle2,
  ChevronDown,
  Layers,
  Filter,
} from 'lucide-react';
import { api } from '../../config/api.ts';
import { Enquiry } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  exportEnquiriesToExcel,
  exportEnquiriesToPdf,
  exportSingleEnquiryToPdf,
} from '../../utils/exportEnquiries.ts';

export const EnquiriesView: React.FC = () => {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showNotification = (msg: string) => {
    setExportNotice(msg);
    setTimeout(() => {
      setExportNotice(null);
    }, 4000);
  };

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await api.get<Enquiry[]>('/enquiries');
      if (res.success && res.data) {
        setEnquiries(res.data);
        if (!selectedEnquiry && res.data.length > 0) {
          setSelectedEnquiry(res.data[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleStatusChange = async (enquiryId: string, newStatus: Enquiry['status']) => {
    try {
      const res = await api.put<Enquiry>(`/enquiries/${enquiryId}/status`, {
        status: newStatus,
      });
      if (res.success && res.data) {
        setEnquiries((prev) =>
          prev.map((e) => (e.id === enquiryId ? res.data! : e))
        );
        if (selectedEnquiry?.id === enquiryId) {
          setSelectedEnquiry(res.data);
        }
      }
    } catch (err) {
      console.error('Failed to change status', err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry || !newNoteText.trim()) return;

    setIsSubmittingNote(true);
    try {
      const res = await api.post<Enquiry>(`/enquiries/${selectedEnquiry.id}/notes`, {
        text: newNoteText,
      });
      if (res.success && res.data) {
        setEnquiries((prev) =>
          prev.map((e) => (e.id === selectedEnquiry.id ? res.data! : e))
        );
        setSelectedEnquiry(res.data);
        setNewNoteText('');
      }
    } catch (err) {
      console.error('Failed to add note', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const filteredEnquiries = enquiries.filter((e) => {
    const matchesQuery =
      !searchQuery ||
      e.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.contactName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || e.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const getStatusBadge = (status: Enquiry['status']) => {
    switch (status) {
      case 'NEW':
        return 'bg-amber-100 text-amber-800';
      case 'IN_REVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'QUOTED':
        return 'bg-purple-100 text-purple-800';
      case 'CLOSED':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const handleExportExcel = (mode: 'all' | 'filtered' = 'filtered') => {
    const dataToExport = mode === 'all' ? enquiries : filteredEnquiries;
    if (dataToExport.length === 0) {
      showNotification('No enquiries available to export.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const filename = `Ageco_Enquiries_${mode === 'all' ? 'All' : 'Filtered'}_${today}.xlsx`;
    exportEnquiriesToExcel(dataToExport, filename);
    showNotification(`Exported ${dataToExport.length} enquiries to Excel (.xlsx) successfully.`);
    setIsExportDropdownOpen(false);
  };

  const handleExportPdf = (mode: 'all' | 'filtered' = 'filtered') => {
    const dataToExport = mode === 'all' ? enquiries : filteredEnquiries;
    if (dataToExport.length === 0) {
      showNotification('No enquiries available to export.');
      return;
    }
    exportEnquiriesToPdf(dataToExport, {
      query: searchQuery,
      status: statusFilter,
    });
    showNotification(`Exported ${dataToExport.length} enquiries to PDF report successfully.`);
    setIsExportDropdownOpen(false);
  };

  const handleExportSelectedPdf = () => {
    if (!selectedEnquiry) return;
    exportSingleEnquiryToPdf(selectedEnquiry);
    showNotification(`Exported enquiry ${selectedEnquiry.referenceNumber} dossier as PDF.`);
  };

  const isFiltered = Boolean(searchQuery.trim() || statusFilter);

  return (
    <div className="space-y-6">
      {/* Toast / Notification Banner */}
      {exportNotice && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{exportNotice}</span>
          </div>
          <button
            onClick={() => setExportNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-semibold text-xs ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Enquiries
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage customer enquiries, technical RFQs, and commercial quotations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Excel Export */}
          <button
            type="button"
            onClick={() => handleExportExcel('filtered')}
            disabled={filteredEnquiries.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-600/50 transition shadow-sm disabled:opacity-50 disabled:pointer-events-none"
            title={`Export ${isFiltered ? 'filtered' : 'all'} enquiries to Excel`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {/* Quick PDF Export */}
          <button
            type="button"
            onClick={() => handleExportPdf('filtered')}
            disabled={filteredEnquiries.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-600/30 bg-rose-50/80 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 hover:border-rose-600/50 transition shadow-sm disabled:opacity-50 disabled:pointer-events-none"
            title={`Export ${isFiltered ? 'filtered' : 'all'} enquiries to PDF Report`}
          >
            <FileText className="h-3.5 w-3.5 text-rose-600" />
            <span>Export PDF</span>
          </button>

          {/* Export Options Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              type="button"
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
              title="More export options"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-30">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5 mb-1">
                  Export Options
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleExportExcel('filtered')}
                    className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Excel (Current View)</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {filteredEnquiries.length} rows
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportExcel('all')}
                    className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Excel (All Enquiries)</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {enquiries.length} rows
                    </span>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    type="button"
                    onClick={() => handleExportPdf('filtered')}
                    className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-rose-600" />
                      <span>PDF Report (Current View)</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {filteredEnquiries.length} rows
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportPdf('all')}
                    className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition text-left"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-rose-600" />
                      <span>PDF Report (All Enquiries)</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {enquiries.length} rows
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
            Total: {enquiries.length}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-4 sm:flex-row sm:items-center shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search enquiries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-orange-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="QUOTED">Quoted</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Split Pane */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: List */}
        <div className="space-y-3 lg:col-span-5">
          {filteredEnquiries.length === 0 ? (
            <div className="rounded-xl border border-slate-200/90 bg-white p-8 text-center text-xs text-slate-400">
              No enquiries found.
            </div>
          ) : (
            filteredEnquiries.map((enq) => {
              const isSelected = selectedEnquiry?.id === enq.id;
              return (
                <div
                  key={enq.id}
                  onClick={() => setSelectedEnquiry(enq)}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/20 shadow-sm'
                      : 'border-slate-200/90 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-semibold text-orange-600">
                        {enq.referenceNumber}
                      </span>
                      <h2 className="text-sm font-bold text-slate-900 mt-0.5">
                        {enq.company}
                      </h2>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusBadge(
                        enq.status
                      )}`}
                    >
                      {enq.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-600 line-clamp-1">{enq.subject}</p>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                    <span>Contact: {enq.contactName}</span>
                    <span className="font-mono">
                      {new Date(enq.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Details & Notes */}
        <div className="lg:col-span-7">
          {selectedEnquiry ? (
            <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-5">
              {/* Header */}
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-orange-600">
                      {selectedEnquiry.referenceNumber}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500">
                      {selectedEnquiry.type}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                    {selectedEnquiry.company}
                  </h2>
                </div>

                {/* Actions & Status selector */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportSelectedPdf}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
                    title="Download this enquiry dossier as a PDF document"
                  >
                    <FileText className="h-3.5 w-3.5 text-rose-600" />
                    <span>Download PDF</span>
                  </button>

                  <div className="hidden sm:block h-4 w-px bg-slate-200"></div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">Status:</span>
                    <select
                      value={selectedEnquiry.status}
                      onChange={(e) =>
                        handleStatusChange(selectedEnquiry.id, e.target.value as any)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 font-semibold focus:border-orange-500 focus:outline-none"
                    >
                      <option value="NEW">New</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="QUOTED">Quoted</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact info grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
                <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Contact</span>
                  <div className="mt-1 font-semibold text-slate-800">
                    {selectedEnquiry.contactName}
                  </div>
                  <div className="text-[11px] text-slate-500">{selectedEnquiry.email}</div>
                  <div className="text-[11px] text-slate-500">{selectedEnquiry.phone}</div>
                </div>

                <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Budget Estimate</span>
                  <div className="mt-1 font-mono font-bold text-slate-800 text-sm">
                    {selectedEnquiry.projectBudgetEstimate || 'Pending'}
                  </div>
                  <div className="text-[10px] text-slate-500">Priority: {selectedEnquiry.priority}</div>
                </div>

                <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Assigned To</span>
                  <div className="mt-1 font-semibold text-slate-800">
                    {selectedEnquiry.assignedTo || 'Unassigned'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Updated: {new Date(selectedEnquiry.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <span className="text-xs font-semibold text-slate-800">
                  Subject: {selectedEnquiry.subject}
                </span>
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                  {selectedEnquiry.message}
                </div>
              </div>

              {/* Internal Notes */}
              <div className="border-t border-slate-100 pt-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-orange-500" />
                  Notes ({selectedEnquiry.internalNotes?.length || 0})
                </span>

                <div className="mt-3 space-y-2 max-h-56 overflow-y-auto">
                  {selectedEnquiry.internalNotes?.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">
                      No internal notes recorded.
                    </div>
                  ) : (
                    selectedEnquiry.internalNotes?.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-800">{note.author}</span>
                          <span className="text-slate-400 font-mono">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-600">{note.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Note Input */}
                <form onSubmit={handleAddNote} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Add a note..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingNote}
                    className="flex items-center gap-1 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Add Note</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/90 bg-white p-12 text-center text-xs text-slate-400">
              Select an enquiry to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
