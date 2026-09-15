import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  AlertCircle,
  Building,
  Mail,
  Phone,
  DollarSign,
  UserCheck,
  ChevronRight,
  X,
} from 'lucide-react';
import { api } from '../../config/api.ts';
import { Enquiry } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const EnquiriesView: React.FC = () => {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

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
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'IN_REVIEW':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'QUOTED':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'CLOSED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
            B2B Enquiries, Tenders & RFQs
          </h1>
          <p className="text-xs text-slate-400">
            Inbound major infrastructure inquiries, EPC commercial tender proposals, and engineering review
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded bg-slate-800 px-3 py-1.5 font-mono text-xs text-slate-300 border border-slate-700">
            Total Pipeline: {enquiries.length} requests
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-[#0c121e]/90 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by RFP Reference, company name, or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900/90 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
        >
          <option value="">All Pipeline Stages</option>
          <option value="NEW">NEW</option>
          <option value="IN_REVIEW">IN REVIEW</option>
          <option value="QUOTED">QUOTED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {/* Split Pane: Enquiries List on Left, Active Details & Notes on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Enquiries List */}
        <div className="space-y-3 lg:col-span-5">
          {filteredEnquiries.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-8 text-center text-xs text-slate-500">
              No inquiries found matching criteria.
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
                      ? 'border-amber-500/50 bg-[#101828] shadow-lg ring-1 ring-amber-500/20'
                      : 'border-slate-800 bg-[#0c121e]/90 hover:border-slate-700 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-semibold text-amber-400">
                        {enq.referenceNumber}
                      </span>
                      <h2 className="font-heading text-sm font-bold text-white mt-0.5">
                        {enq.company}
                      </h2>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider ${getStatusBadge(
                        enq.status
                      )}`}
                    >
                      {enq.status}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs text-slate-300 line-clamp-1">{enq.subject}</p>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
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

        {/* Right: Detailed Dossier & Notes */}
        <div className="lg:col-span-7">
          {selectedEnquiry ? (
            <div className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-6 shadow">
              {/* Dossier Header */}
              <div className="flex flex-col justify-between gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {selectedEnquiry.referenceNumber}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-slate-400 font-mono">
                      Type: {selectedEnquiry.type}
                    </span>
                  </div>
                  <h2 className="font-heading text-lg font-bold text-white mt-1">
                    {selectedEnquiry.company}
                  </h2>
                </div>

                {/* Pipeline Status Trigger */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Status:</span>
                  <select
                    value={selectedEnquiry.status}
                    onChange={(e) =>
                      handleStatusChange(selectedEnquiry.id, e.target.value as any)
                    }
                    className="rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 font-semibold focus:border-amber-500 focus:outline-none"
                  >
                    <option value="NEW">NEW</option>
                    <option value="IN_REVIEW">IN REVIEW</option>
                    <option value="QUOTED">QUOTED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              {/* Contact and Commercial Info */}
              <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 sm:grid-cols-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Contact</span>
                  <div className="mt-0.5 font-medium text-slate-200">
                    {selectedEnquiry.contactName}
                  </div>
                  <div className="text-[11px] text-slate-400">{selectedEnquiry.email}</div>
                  <div className="text-[11px] text-slate-400">{selectedEnquiry.phone}</div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    Estimated Budget
                  </span>
                  <div className="mt-0.5 font-mono font-bold text-amber-400 text-sm">
                    {selectedEnquiry.projectBudgetEstimate || 'Pending Engineering Scoping'}
                  </div>
                  <div className="text-[10px] text-slate-500">Priority: {selectedEnquiry.priority}</div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    Assigned Lead
                  </span>
                  <div className="mt-0.5 text-slate-200">
                    {selectedEnquiry.assignedTo || 'Unassigned'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Updated: {new Date(selectedEnquiry.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Message Payload */}
              <div className="mt-4">
                <span className="text-xs font-semibold text-slate-300">
                  Subject: {selectedEnquiry.subject}
                </span>
                <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs leading-relaxed text-slate-300 whitespace-pre-line">
                  {selectedEnquiry.message}
                </div>
              </div>

              {/* Internal Engineering Collaboration Thread */}
              <div className="mt-6 border-t border-slate-800 pt-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
                  Internal Engineering & Tenders Discussion ({selectedEnquiry.internalNotes?.length || 0})
                </span>

                <div className="mt-3 space-y-2 max-h-56 overflow-y-auto">
                  {selectedEnquiry.internalNotes?.length === 0 ? (
                    <div className="text-xs text-slate-500 italic">
                      No internal notes recorded for this enquiry yet.
                    </div>
                  ) : (
                    selectedEnquiry.internalNotes?.map((note) => (
                      <div
                        key={note.id}
                        className="rounded border border-slate-800/80 bg-slate-900/60 p-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-amber-300">{note.author}</span>
                          <span className="text-slate-500 font-mono">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-200">{note.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Note Input */}
                <form onSubmit={handleAddNote} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Add engineering comment or tender calculation note..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="flex-1 rounded-md border border-slate-700 bg-slate-900 py-1.5 px-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingNote}
                    className="flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Post Note</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-12 text-center text-xs text-slate-500">
              Select an enquiry from the left panel to review technical details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
