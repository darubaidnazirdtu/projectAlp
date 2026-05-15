import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { Faculty } from '../models/faculty.model.js';

let io = null;

const isMongoObjectId = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);

/**
 * Resolve Mongo ObjectId (User/Faculty) to readable ID (user_id / faculty_id).
 * Falls back to the input if it cannot be resolved.
 */
const resolveToReadableId = async (input_id) => {
    if (!isMongoObjectId(input_id)) return input_id;

    try {
        const user = await User.findById(input_id);
        if (user && user.user_id) {
            console.log(`[SOCKET] Resolved Mongo ID ${input_id} to User ID ${user.user_id}`);
            return user.user_id;
        }
        const faculty = await Faculty.findById(input_id);
        if (faculty && faculty.faculty_id) {
            console.log(`[SOCKET] Resolved Mongo ID ${input_id} to Faculty ID ${faculty.faculty_id}`);
            return faculty.faculty_id;
        }
    } catch (e) {
        console.error('Socket ID resolution error:', e);
    }
    return input_id;
};

/**
 * Emit to an APAR room using the provided ID, and (if needed) also the resolved readable ID.
 * This fixes cases where clients join rooms using resolved IDs but emitters use Mongo IDs (or vice-versa).
 */
const emitToAparRooms = (eventName, faculty_id, academic_year, payload) => {
    if (!io) return;

    const normalizedAy = normalizeAy(academic_year);
    const primaryRoom = `apar-${faculty_id}-${normalizedAy}`;
    io.to(primaryRoom).emit(eventName, payload);

    // If faculty_id looks like a Mongo ID, also emit to the resolved readable-ID room.
    if (isMongoObjectId(faculty_id)) {
        resolveToReadableId(faculty_id)
            .then((resolvedId) => {
                if (resolvedId && resolvedId !== faculty_id) {
                    const resolvedRoom = `apar-${resolvedId}-${normalizedAy}`;
                    io.to(resolvedRoom).emit(eventName, payload);
                }
            })
            .catch((e) => console.error('emitToAparRooms resolution error:', e));
    }
};

/**
 * Normalize Academic Year format (e.g. "2024-2025" -> "2024-25")
 */
const normalizeAy = (ay) => {
    if (!ay) return '';
    if (ay.includes('-')) {
        const parts = ay.split('-');
        if (parts[1].length === 4) {
            return `${parts[0]}-${parts[1].substring(2)}`;
        }
    }
    return ay;
};

/**
 * Initialize Socket.IO server
 * @param {http.Server} httpServer - HTTP server instance
 */
export const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.ORIGIN || "http://localhost:5173",
            credentials: true
        }
    });

    // Middleware for authentication (optional)
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
                socket.userId = decoded.id;
                socket.facultyId = decoded.userId || decoded.faculty_id;
            } catch (err) {
                console.log('Socket auth failed:', err.message);
            }
        }
        next();
    });

    /**
     * Normalize Academic Year format (e.g. "2024-2025" -> "2024-25")
     * This ensures consistency between frontend and backend room names
     */


    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Join APAR room for specific faculty/academic year
        socket.on('join_apar_room', async ({ faculty_id, ay }) => {
            const resolvedFacultyId = await resolveToReadableId(faculty_id);
            const normalizedAy = normalizeAy(ay);
            const roomName = `apar-${resolvedFacultyId}-${normalizedAy}`;
            socket.join(roomName);
            console.log(`Socket ${socket.id} joined APAR room: ${roomName}`);

            socket.emit('room_joined', { roomName, faculty_id: resolvedFacultyId, ay: normalizedAy });
        });

        // Leave APAR room
        socket.on('leave_apar_room', async ({ faculty_id, ay }) => {
            const resolvedFacultyId = await resolveToReadableId(faculty_id);
            const normalizedAy = normalizeAy(ay);
            const roomName = `apar-${resolvedFacultyId}-${normalizedAy}`;
            socket.leave(roomName);
            console.log(`Socket ${socket.id} left room: ${roomName}`);
        });

        // Join IQAC admin monitoring room for a given AY (optional feature)
        socket.on('join_iqac_admin_room', ({ ay }) => {
            const normalizedAy = normalizeAy(ay);
            const roomName = `iqac-admin-${normalizedAy}`;
            socket.join(roomName);
            console.log(`Socket ${socket.id} joined IQAC monitoring room: ${roomName}`);
            socket.emit('room_joined', { roomName, ay: normalizedAy });
        });

        // Join Personal Notification Room
        socket.on('join_notifications', async ({ userId, role }) => {
            if (userId) {
                // Resolve to readable ID if it looks like a Mongo ID
                let resolvedId = userId;
                if (/^[0-9a-fA-F]{24}$/.test(userId)) {
                    try {
                        const user = await User.findById(userId);
                        if (user && user.user_id) resolvedId = user.user_id;
                        else {
                            const faculty = await Faculty.findById(userId);
                            if (faculty && faculty.faculty_id) resolvedId = faculty.faculty_id;
                        }
                        console.log(`[SOCKET] Resolved ${userId} -> ${resolvedId}`);
                    } catch (e) {
                        console.error("Socket ID resolution error:", e);
                    }
                }

                const roomName = `user-${resolvedId}`;
                socket.join(roomName);
                console.log(`User ${resolvedId} joined notification room: ${roomName}`);
            }

            const normalizedRole = role ? role.toLowerCase() : '';

            if (normalizedRole.includes('iqac')) {
                socket.join('IQAC_HEAD');
                console.log(`IQAC Head joined role notification room`);
            }

            if (normalizedRole.includes('hod')) {
                socket.join('HOD');
                console.log(`Department HOD joined role notification room`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    console.log('✅ Socket.IO initialized');
    return io;
};

/**
 * Get Socket.IO instance
 */
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized. Call initializeSocket() first.');
    }
    return io;
};

/**
 * Emit new entry event to APAR room
 * @param {string} faculty_id - Faculty ID
 * @param {string} academic_year - Academic year
 * @param {object} data - New entry data
 */
export const emitNewEntry = (faculty_id, academic_year, data) => {
    if (!io) {
        console.warn('Socket.IO not initialized, skipping emit');
        return;
    }

    const payload = {
        ...data,
        timestamp: new Date()
    };
    emitToAparRooms('new_entry', faculty_id, academic_year, payload);
    console.log(`📡 Emitted new_entry for faculty=${faculty_id}, ay=${normalizeAy(academic_year)}`);
};

/**
 * Emit bulk entries to APAR room
 */
export const emitBulkEntries = (faculty_id, academic_year, entries) => {
    if (!io || !entries || entries.length === 0) return;

    const payload = {
        entries,
        count: entries.length,
        timestamp: new Date()
    };
    emitToAparRooms('bulk_entries', faculty_id, academic_year, payload);
    console.log(`📡 Emitted bulk_entries(count=${entries.length}) for faculty=${faculty_id}, ay=${normalizeAy(academic_year)}`);
};

/**
 * Emit update entry event to APAR room
 */
export const emitUpdateEntry = (faculty_id, academic_year, data) => {
    if (!io) return;

    const payload = {
        ...data,
        timestamp: new Date()
    };
    emitToAparRooms('update_entry', faculty_id, academic_year, payload);
    console.log(`📡 Emitted update_entry for faculty=${faculty_id}, ay=${normalizeAy(academic_year)}`);
};

/**
 * Emit delete entry event to APAR room
 */
export const emitDeleteEntry = (faculty_id, academic_year, data) => {
    if (!io) return;

    const payload = {
        ...data,
        timestamp: new Date()
    };
    emitToAparRooms('delete_entry', faculty_id, academic_year, payload);
    console.log(`📡 Emitted delete_entry for faculty=${faculty_id}, ay=${normalizeAy(academic_year)}`);
};

/**
 * Emit a generic “IQAC synced your APAR data” event to APAR rooms.
 * Used when IQAC writes data that should immediately refresh the faculty APAR form.
 */
export const emitAparDataUpdated = (faculty_id, academic_year, data = {}) => {
    if (!io) return;
    const payload = {
        ...data,
        timestamp: new Date()
    };
    emitToAparRooms('apar_data_updated', faculty_id, academic_year, payload);
    console.log(`📡 Emitted apar_data_updated for faculty=${faculty_id}, ay=${normalizeAy(academic_year)}`);
};

/**
 * REVERSE FLOW: APAR → IQAC
 * Emit notification to IQAC admin dashboard when faculty updates APAR
 */
export const emitAparUpdateToIqac = (faculty_id, faculty_name, academic_year, updateType, count) => {
    if (!io) return;

    // Broadcast to IQAC admin room (all admins monitoring)
    const normalizedAy = normalizeAy(academic_year);
    const iqacRoom = `iqac-admin-${normalizedAy}`;
    io.to(iqacRoom).emit('apar_update', {
        faculty_id,
        faculty_name,
        academic_year: normalizedAy,
        updateType, // 'saved_draft' | 'submitted' | 'updated'
        count, // number of entries changed
        timestamp: new Date()
    });

    console.log(`📡 APAR update notification sent to IQAC admins: ${faculty_name} (${updateType})`);
};

/**
 * Allow IQAC admins to join monitoring room
 */
export const joinIqacAdminRoom = (socket, academic_year) => {
    const normalizedAy = normalizeAy(academic_year);
    const roomName = `iqac-admin-${normalizedAy}`;
    socket.join(roomName);
    console.log(`Admin joined IQAC monitoring room: ${roomName}`);
    return roomName;
};

/**
 * Notify faculty when colleague submits shared entry
 */
export const emitCrossFacultyUpdate = (faculty_id, academic_year, data) => {
    if (!io) return;

    const payload = {
        ...data,
        timestamp: new Date()
    };
    emitToAparRooms('cross_faculty_update', faculty_id, academic_year, payload);
    console.log(`📡 Cross-faculty update sent to faculty=${faculty_id}, ay=${normalizeAy(academic_year)}: ${data.action}`);
};

/**
 * Emit generic notification to a user
 */
export const emitNotification = (userId, notification) => {
    if (!io) return;

    // Resolve user ID logic if needed, but assuming userId is the resolved ID (e.g. "FAC_PAWAN")
    // If it could be Mongo ID, we might need resolving, but the callers usually have the readable ID.
    // Let's assume readable ID for now as that's what rooms use.

    // We also support Mongo ID rooms just in case? No, 'join_notifications' usually resolves.
    // But let's stick to the convention used in 'join_notifications': `user-${resolvedId}`

    const roomName = `user-${userId}`;
    io.to(roomName).emit('notification', notification);
    console.log(`📡 Notification sent to ${roomName}: ${notification.title}`);
};
