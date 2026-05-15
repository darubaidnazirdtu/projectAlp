import { asyncHandler } from '../utils/async-handler.js'
import { ApiResponse } from '../utils/api-response.js'
import { ApiError } from '../utils/api-error.js'
import { getAssigned, getCombinedForFaculty } from '../data-access/apar_reporting.data-access.js'
import { findUsersByOfficerMapping } from '../data-access/users.data-access.js'

const listAssigned = asyncHandler(async (req, res) => {
  // if (!req.user) throw new ApiError(401, 'Authentication required')
  const ay = req.query.ay
  if (!ay) throw new ApiError(400, 'ay query parameter required')

  const reportingOfficerId = req.user.userId || req.user.faculty_id || req.user.id
  if (!reportingOfficerId) throw new ApiError(400, 'Reporting officer identifier not found')

  // Fetch assigned officers from MongoDB
  const assignedUsers = await findUsersByOfficerMapping(reportingOfficerId, 'reporting');
  const assignedUserIds = assignedUsers.map(u => u.user_id);

  if (!assignedUserIds.length) {
    return res.status(200).json(new ApiResponse(200, [], 'no assigned officers found'));
  }

  const rows = await getAssigned(assignedUserIds, ay)
  res.status(200).json(new ApiResponse(200, rows || [], 'assigned officers fetched'))
})

const getFacultyCombined = asyncHandler(async (req, res) => {
  const { graded_id, ay } = req.params
  if (!graded_id || !ay) throw new ApiError(400, 'graded_id and ay are required')
  // if (!req.user) throw new ApiError(401, 'Authentication required')

  // Optionally ensure the requesting reporting officer is allowed to view this graded_id
  // check mapping
  const combined = await getCombinedForFaculty(graded_id, ay)
  if (!combined) throw new ApiError(404, 'No graded form found for the provided faculty and year')

  res.status(200).json(new ApiResponse(200, combined, 'faculty combined data fetched'))
})

export { listAssigned, getFacultyCombined }
