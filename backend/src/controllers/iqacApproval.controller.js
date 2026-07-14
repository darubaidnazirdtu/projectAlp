import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { IqacApproval } from '../models/iqacApproval.model.js';
import { Faculty } from '../models/faculty.model.js';
import { getApprovalResource } from '../config/iqacApprovalRegistry.js';
import { createNotification } from './notification.controller.js';

const APPROVAL_CREATOR_ROLES = new Set(['IQAC Head', 'Department HOD']);
const FACULTY_ID_KEYS = new Set(['faculty_id', 'supervisor_id', 'co_supervisor_id']);
const FACULTY_ARRAY_KEYS = new Set(['faculty_ids']);

const normalizeId = (value) => {
  const text = String(value || '').trim();
  return text || null;
};

const parsePayload = (body = {}) => {
  if (body.payload) {
    if (typeof body.payload === 'string') {
      try {
        return JSON.parse(body.payload);
      } catch {
        throw new ApiError(400, 'Invalid approval payload JSON');
      }
    }
    return body.payload;
  }

  if (body.data) {
    if (typeof body.data === 'string') {
      try {
        return JSON.parse(body.data);
      } catch {
        throw new ApiError(400, 'Invalid approval data JSON');
      }
    }
    return body.data;
  }

  const { resource_id, resourceId, ...payload } = body;
  return payload;
};

export const extractFacultyIdsFromPayload = (payload) => {
  const ids = new Set();

  const collectId = (value) => {
    const id = normalizeId(value);
    if (id) ids.add(id);
  };

  const walk = (value, key = '', ancestors = []) => {
    if (value === null || value === undefined) return;

    if (FACULTY_ID_KEYS.has(key)) {
      collectId(value);
      return;
    }

    if (key === 'member_id' && ancestors.includes('committee_members')) {
      collectId(value);
      return;
    }

    if (Array.isArray(value)) {
      if (FACULTY_ARRAY_KEYS.has(key)) {
        value.forEach((item) => {
          if (typeof item === 'string' || typeof item === 'number') {
            collectId(item);
          } else if (item && typeof item === 'object') {
            collectId(item.faculty_id);
          }
        });
      }
      value.forEach((item) => walk(item, key, ancestors));
      return;
    }

    if (typeof value === 'object') {
      Object.entries(value).forEach(([childKey, childValue]) => {
        walk(childValue, childKey, [...ancestors, key].filter(Boolean));
      });
    }
  };

  walk(payload);
  return [...ids];
};

const getRecordTitle = (payload = {}) => {
  const fields = [
    'title',
    'patent_title',
    'title_of_activity',
    'title_of_book',
    'title_of_chapter',
    'title_research',
    'name_of_project',
    'program_title',
    'program_name',
    'name_of_award',
    'name_of_module',
    'course_name',
    'thesis_title',
    'professional_body_name',
    'organisation_name',
    'name_of_scheme',
    'title_of_event',
    'name_of_event',
    'lab_name'
  ];

  for (const field of fields) {
    const value = payload[field];
    if (value !== null && value !== undefined && String(value).trim()) {
      return String(value).trim();
    }
  }

  return 'Untitled record';
};

const buildApprovalResponse = (approval) => {
  const obj = approval?.toObject ? approval.toObject() : approval;
  return {
    ...obj,
    pending_count: obj.approvals?.filter((entry) => entry.status === 'pending').length || 0,
    approved_count: obj.approvals?.filter((entry) => entry.status === 'approved').length || 0,
    rejected_count: obj.approvals?.filter((entry) => entry.status === 'rejected').length || 0
  };
};

const attachUploadedFiles = async (payload, files = []) => {
  const nextPayload = { ...payload };

  for (const file of files || []) {
    if (!file?.path || !file?.fieldname) continue;
    const uploaded = await uploadOnCloudinary(file.path);
    nextPayload[file.fieldname] = uploaded.secure_url || uploaded.url;
  }

  return nextPayload;
};

const notifyApprovalRequest = async (approval) => {
  await Promise.all(approval.faculty_ids.map((facultyId) => createNotification({
    recipient: facultyId,
    sender: approval.created_by?.user_id || 'System',
    type: 'IQAC_APPROVAL_REQUEST',
    title: 'IQAC Entry Needs Your Approval',
    message: `${approval.created_by?.name || approval.created_by?.user_id || 'A coordinator'} added "${approval.title}" in ${approval.resource_title}. Approve it before it is saved permanently.`,
    link: '/apar/iqac-approvals',
    metadata: {
      approvalId: approval._id,
      resourceId: approval.resource_id,
      displayType: approval.resource_title,
      entryType: approval.resource_id,
      details: {
        title: approval.title,
        submittedBy: approval.created_by?.name || approval.created_by?.user_id,
        status: approval.status
      }
    }
  })));
};

const notifyCreator = async (approval, title, message) => {
  const recipient = approval.created_by?.user_id;
  if (!recipient) return;

  await createNotification({
    recipient,
    sender: 'IQAC Approval',
    type: 'IQAC_APPROVAL_DECISION',
    title,
    message,
    link: '/app',
    metadata: {
      approvalId: approval._id,
      resourceId: approval.resource_id,
      displayType: approval.resource_title,
      entryType: approval.resource_id,
      details: {
        title: approval.title,
        status: approval.status,
        permanentRecordId: approval.permanent_record_id
      }
    }
  });
};

const finalizeApproval = async (approval) => {
  const resource = getApprovalResource(approval.resource_id);
  if (!resource) {
    throw new ApiError(400, `Approval finalizer is not configured for ${approval.resource_id}`);
  }

  const creator = {
    id: approval.created_by?.user_id || null,
    userId: approval.created_by?.user_id || null,
    role: approval.created_by?.role || 'IQAC Head'
  };

  const created = await resource.create(approval.payload, creator);
  const permanentRecordId =
    created?.[resource.keyAccessor] ||
    created?.id ||
    created?._id?.toString?.() ||
    null;

  approval.status = 'approved';
  approval.permanent_record_id = permanentRecordId;
  approval.finalized_at = new Date();
  approval.finalization_error = undefined;
  await approval.save();

  await notifyCreator(
    approval,
    'IQAC Entry Approved',
    `"${approval.title}" was approved by all faculty and saved permanently.`
  );
};

export const createIqacApproval = asyncHandler(async (req, res) => {
  const resourceId = req.body.resource_id || req.body.resourceId;
  const resource = getApprovalResource(resourceId);

  if (!resource) {
    throw new ApiError(400, `Faculty approval is not configured for ${resourceId || 'this resource'}`);
  }

  if (!APPROVAL_CREATOR_ROLES.has(req.user?.role)) {
    throw new ApiError(403, 'Only IQAC Head or Department HOD can request faculty approval');
  }

  const payloadWithFiles = await attachUploadedFiles(parsePayload(req.body), req.files || []);
  const facultyIds = extractFacultyIdsFromPayload(payloadWithFiles);

  if (facultyIds.length === 0) {
    throw new ApiError(400, 'At least one associated faculty member is required for approval');
  }

  const facultyRecords = await Faculty.find({ faculty_id: { $in: facultyIds } }).select('faculty_id').lean();
  const existingFacultyIds = new Set(facultyRecords.map((faculty) => faculty.faculty_id));
  const missingFaculty = facultyIds.filter((facultyId) => !existingFacultyIds.has(facultyId));

  if (missingFaculty.length > 0) {
    throw new ApiError(400, `Faculty not found: ${missingFaculty.join(', ')}`);
  }

  const approval = await IqacApproval.create({
    resource_id: resourceId,
    resource_title: resource.title,
    title: getRecordTitle(payloadWithFiles),
    payload: payloadWithFiles,
    faculty_ids: facultyIds,
    approvals: facultyIds.map((facultyId) => ({ faculty_id: facultyId, status: 'pending' })),
    created_by: {
      user_id: req.user?.userId || req.user?.id,
      name: req.user?.name || req.user?.email || req.user?.userId,
      role: req.user?.role,
      department_id: req.user?.departmentId || payloadWithFiles.department_id
    }
  });

  await notifyApprovalRequest(approval);

  return res.status(201).json(new ApiResponse(201, buildApprovalResponse(approval), 'Approval request sent to faculty'));
});

export const getMyIqacApprovals = asyncHandler(async (req, res) => {
  const facultyId = req.user?.userId || req.user?.faculty_id || req.user?.id;
  if (!facultyId) {
    throw new ApiError(401, 'Unable to resolve faculty ID');
  }

  const approvals = await IqacApproval.find({
    faculty_ids: facultyId,
    status: { $in: ['pending', 'approved', 'rejected', 'failed'] }
  }).sort({ createdAt: -1 }).limit(200);

  return res.status(200).json(new ApiResponse(200, approvals.map(buildApprovalResponse), 'Faculty approvals fetched'));
});

export const getCreatedIqacApprovals = asyncHandler(async (req, res) => {
  if (!APPROVAL_CREATOR_ROLES.has(req.user?.role)) {
    throw new ApiError(403, 'Only IQAC Head or Department HOD can view submitted approval requests');
  }

  const query = {};
  if (req.user.role === 'Department HOD') {
    query.$or = [
      { 'created_by.user_id': req.user?.userId || req.user?.id },
      { 'created_by.department_id': req.user?.departmentId },
      { 'payload.department_id': req.user?.departmentId }
    ];
  }

  const approvals = await IqacApproval.find(query).sort({ createdAt: -1 }).limit(300);
  return res.status(200).json(new ApiResponse(200, approvals.map(buildApprovalResponse), 'Approval requests fetched'));
});

export const decideIqacApproval = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, comment, corrected_payload, correctedPayload } = req.body || {};
  const normalizedAction = action === 'accept_with_changes' ? 'approve' : action;
  const corrected = corrected_payload || correctedPayload;
  const facultyId = req.user?.userId || req.user?.faculty_id || req.user?.id;

  if (!['approve', 'reject'].includes(normalizedAction)) {
    throw new ApiError(400, 'Action must be approve or reject');
  }

  if (
    normalizedAction === 'approve'
    && corrected !== undefined
    && (!corrected || typeof corrected !== 'object' || Array.isArray(corrected))
  ) {
    throw new ApiError(400, 'Corrected approval payload must be an object');
  }

  const approval = await IqacApproval.findById(id);
  if (!approval) {
    throw new ApiError(404, 'Approval request not found');
  }

  if (approval.status !== 'pending') {
    throw new ApiError(400, 'This approval request is already closed');
  }

  const entry = approval.approvals.find((item) => item.faculty_id === facultyId);
  if (!entry) {
    throw new ApiError(403, 'This approval request is not assigned to you');
  }

  if (entry.status !== 'pending') {
    throw new ApiError(400, 'You have already responded to this approval request');
  }

  entry.status = normalizedAction === 'approve' ? 'approved' : 'rejected';
  entry.comment = comment || '';
  entry.acted_at = new Date();

  if (normalizedAction === 'approve' && corrected) {
    approval.payload = corrected;
    approval.title = getRecordTitle(corrected);
    if (!entry.comment) {
      entry.comment = 'Accepted with faculty corrections';
    }
    approval.markModified('payload');
    approval.markModified('approvals');
  }

  if (normalizedAction === 'reject') {
    approval.status = 'rejected';
    approval.finalized_at = new Date();
    await notifyCreator(
      approval,
      'IQAC Entry Rejected',
      `"${approval.title}" was rejected by ${facultyId}${comment ? `: ${comment}` : '.'}`
    );
    // Delete permanently as requested
    await IqacApproval.findByIdAndDelete(id);
    return res.status(200).json(new ApiResponse(200, buildApprovalResponse(approval), 'Approval request rejected and deleted permanently'));
  }

  await approval.save();

  const allApproved = approval.approvals.every((item) => item.status === 'approved');
  if (allApproved) {
    try {
      await finalizeApproval(approval);
    } catch (error) {
      approval.status = 'failed';
      approval.finalization_error = error.message || 'Failed to save approved IQAC record';
      approval.finalized_at = new Date();
      await approval.save();
      await notifyCreator(
        approval,
        'IQAC Entry Approval Failed',
        `"${approval.title}" was approved but could not be saved permanently: ${approval.finalization_error}`
      );
      throw error;
    }
  }

  const updated = await IqacApproval.findById(id);
  return res.status(200).json(new ApiResponse(200, buildApprovalResponse(updated), 'Approval recorded'));
});
