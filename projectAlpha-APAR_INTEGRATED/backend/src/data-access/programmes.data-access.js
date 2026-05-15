import { Programme } from "../models/programme.model.js";
import { v4 as uuidv4 } from 'uuid';

/**
 * Programmes Data Access Layer
 * Updated to use separate Programme collection with type='standard'
 */

const set = async (data, loggedInUser = null) => {
  try {
    const {
      programme_id,
      programme_name,
      programme_code,
      department_id,
      level,
      duration_years,
      intake_capacity
    } = data;

    const newProgrammeId = programme_id || uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newProgramme = new Programme({
      programme_id: newProgrammeId,
      department_id,
      type: 'standard',
      programme_name,
      programme_code,
      level,
      duration_years,
      intake_capacity,
      metadata: {
        created_by: userId,
        change_log: [{
          action: 'created',
          user_id: userId,
          timestamp: new Date()
        }]
      }
    });

    const savedProgramme = await newProgramme.save();
    return savedProgramme.toObject();

  } catch (error) {
    console.error("Error inserting programme:", error);
    throw error;
  }
}

const get = async () => {
  try {
    // Get only standard programmes (not field_research)
    const programmes = await Programme.find({ type: 'standard' }).sort({ programme_name: 1 });
    return programmes.map(p => p.toObject());
  } catch (error) {
    console.error("Error fetching programmes:", error);
    throw error;
  }
}

const getByProgrammeId = async (programme_id) => {
  try {
    const programme = await Programme.findOne({ programme_id, type: 'standard' });
    return programme ? programme.toObject() : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const programmes = await Programme.find({ department_id, type: 'standard' }).sort({ programme_name: 1 });
    return programmes.map(p => p.toObject());
  } catch (error) {
    throw error;
  }
}

const getByLevel = async (level) => {
  try {
    const programmes = await Programme.find({ level, type: 'standard' }).sort({ programme_name: 1 });
    return programmes.map(p => p.toObject());
  } catch (error) {
    throw error;
  }
}

const update = async (programme_id, data, loggedInUser = null) => {
  try {
    const {
      programme_name,
      programme_code,
      level,
      department_id,
      duration_years,
      intake_capacity
    } = data;

    const updateFields = {};
    if (programme_name) updateFields.programme_name = programme_name;
    if (programme_code) updateFields.programme_code = programme_code;
    if (department_id) updateFields.department_id = department_id;
    if (level) updateFields.level = level;
    if (duration_years !== undefined) updateFields.duration_years = duration_years;
    if (intake_capacity !== undefined) updateFields.intake_capacity = intake_capacity;

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await Programme.findOneAndUpdate(
      { programme_id, type: 'standard' },
      {
        $set: updateFields,
        $push: {
          'metadata.change_log': {
            action: 'updated',
            user_id: userId,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    return { modifiedCount: result ? 1 : 0 };

  } catch (error) {
    console.error("Error updating programme:", error);
    throw error;
  }
}

const deleteProgramme = async (programme_id) => {
  try {
    await Programme.findOneAndDelete({ programme_id, type: 'standard' });
  } catch (error) {
    console.error("Error deleting programme:", error);
    throw error;
  }
}

export { set, get, getByProgrammeId, getByDepartmentId, getByLevel, update, deleteProgramme }