import React, { useEffect, useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { useSelector } from 'react-redux';
import { FiClock, FiEdit3, FiFileText, FiLoader, FiX } from 'react-icons/fi';
import AparShellHeader from '../../components/AparShellHeader.jsx';
import { iqacApprovalService } from '../../services/iqacApproval.service.js';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) {
    if (!value.length) return '-';
    return value.map((item) => {
      if (item && typeof item === 'object') {
        return item.faculty_id || item.student_id || item.name || Object.values(item).filter(Boolean).join(' ');
      }
      return item;
    }).filter(Boolean).join(', ') || '-';
  }
  if (typeof value === 'object') return '-';
  return String(value);
};

import { resourceMap } from '../../config/tableConfig.js';
import DynamicForm from '../../components/DynamicForm.jsx';

const hiddenPayloadFields = new Set(['metadata', 'external_contributors', 'external_authors', 'external_inventors', 'external_participants', 'external_recipients']);

const detailRows = (payload = {}) => {
  return Object.entries(payload)
    .filter(([key, value]) => !hiddenPayloadFields.has(key) && (typeof value !== 'object' || Array.isArray(value)))
    .slice(0, 8)
    .map(([key, value]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
      value: formatValue(value)
    }));
};

const statusClass = (status) => {
  switch (status) {
    case 'approved': return 'bg-emerald-100 text-emerald-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'failed': return 'bg-orange-100 text-orange-800';
    default: return 'bg-yellow-100 text-yellow-800';
  }
};

export default function IqacApprovals() {
  const user = useSelector((state) => state.aparAuth.user);
  const facultyId = user?.userId || user?.teacherId || user?.faculty_id || user?.id;
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState(null);
  const [comment, setComment] = useState('');
  const [payloadDraft, setPayloadDraft] = useState({});
  const [payloadError, setPayloadError] = useState('');
  const [saving, setSaving] = useState(false);

  const pendingApprovals = useMemo(
    () => approvals.filter((approval) => approval.status === 'pending'),
    [approvals]
  );

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const data = await iqacApprovalService.getMyApprovals();
      setApprovals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch IQAC approvals', error);
      toast.error('Failed to load approval requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const myDecision = (approval) => approval.approvals?.find((entry) => entry.faculty_id === facultyId);

  const openDecision = (approval, action) => {
    setDecision({ approval, action });
    setComment('');
    setPayloadError('');
    // Deep clone the payload so DynamicForm can edit it directly as an object
    setPayloadDraft(action === 'approve' ? JSON.parse(JSON.stringify(approval.payload || {})) : {});
  };

  const handlePayloadChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPayloadDraft((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (payloadError) setPayloadError('');
  };

  const submitDecision = async () => {
    if (!decision) return;
    if (decision.action === 'reject' && !comment.trim()) {
      toast.error('Please add a reason before rejecting');
      return;
    }

    let correctedPayload = null;
    if (decision.action === 'approve') {
      correctedPayload = { ...payloadDraft };
    }

    try {
      setSaving(true);
      await iqacApprovalService.decideApproval(decision.approval._id, decision.action, comment, correctedPayload);
      toast.success(decision.action === 'approve' ? 'Corrections accepted' : 'Request rejected');
      setDecision(null);
      setComment('');
      setPayloadDraft({});
      setPayloadError('');
      await fetchApprovals();
    } catch (error) {
      console.error('Approval decision failed', error);
      toast.error(error?.response?.data?.message || 'Failed to submit decision');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="apar-page-bg min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <Toaster richColors position="top-right" />
      <div className="mx-auto max-w-5xl">
        <AparShellHeader
          title="IQAC Faculty Approvals"
          subtitle="Review IQAC entries linked to your work before they are saved permanently"
          backTo="/apar/dashboard"
          backLabel="Dashboard"
        />

        <div className="mb-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
              <FiClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{pendingApprovals.length} pending approval request(s)</p>
              <p className="text-xs text-gray-500">Approved requests are saved into the IQAC tables after all associated faculty approve.</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl bg-white p-10 text-gray-500 shadow-sm">
            <FiLoader className="mr-2 h-5 w-5 animate-spin" />
            Loading approval requests...
          </div>
        ) : approvals.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <FiFileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-900">No approval requests</h3>
            <p className="mt-1 text-sm text-gray-500">New IQAC entries linked to you will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((approval) => {
              const mine = myDecision(approval);
              const canRespond = approval.status === 'pending' && mine?.status === 'pending';
              return (
                <div key={approval._id} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClass(approval.status)}`}>
                          {approval.status}
                        </span>
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                          {approval.resource_title}
                        </span>
                      </div>
                      <h2 className="mt-3 text-xl font-bold text-gray-900">{approval.title}</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Submitted by {approval.created_by?.name || approval.created_by?.user_id || 'IQAC'} on {formatDate(approval.createdAt)}
                      </p>
                    </div>
                    {canRespond && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => openDecision(approval, 'reject')}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                        >
                          <FiX className="h-4 w-4" />
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => openDecision(approval, 'approve')}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                        >
                          <FiEdit3 className="h-4 w-4" />
                          Correct & Accept
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {detailRows(approval.payload).map((row) => (
                      <div key={row.label} className="rounded-xl bg-gray-50 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{row.label}</p>
                        <p className="mt-1 text-sm font-semibold text-gray-800">{row.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {(approval.approvals || []).map((entry) => (
                      <span key={entry.faculty_id} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(entry.status)}`}>
                        {entry.faculty_id}: {entry.status}
                      </span>
                    ))}
                  </div>
                  {approval.finalization_error && (
                    <p className="mt-4 rounded-lg bg-orange-50 p-3 text-sm font-medium text-orange-800">{approval.finalization_error}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {decision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">
              {decision.action === 'approve' ? 'Correct & Accept IQAC Entry' : 'Reject IQAC Entry'}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {decision.action === 'approve'
                ? 'Update any incorrect fields below. The corrected entry will be saved after all assigned faculty accept it.'
                : 'Rejecting will stop this entry from being saved permanently.'}
            </p>
            {decision.action === 'approve' && (
              <div className="mt-4 max-h-[55vh] overflow-y-auto pr-1">
                {resourceMap.get(decision.approval.resource_id) ? (
                  <DynamicForm
                    resource={resourceMap.get(decision.approval.resource_id)}
                    formData={payloadDraft}
                    onChange={handlePayloadChange}
                    hideFileUploads={true}
                  />
                ) : (
                  <p className="text-sm text-red-500">Resource configuration not found for this entry.</p>
                )}
                {payloadError && (
                  <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">
                    {payloadError}
                  </p>
                )}
              </div>
            )}
            {decision.action === 'reject' && (
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                className="mt-4 min-h-[100px] w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                placeholder="Reason for rejection"
              />
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDecision(null)}
                disabled={saving}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDecision}
                disabled={saving}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60 ${decision.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {saving ? 'Submitting...' : decision.action === 'approve' ? 'Accept Corrections' : 'Reject Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
