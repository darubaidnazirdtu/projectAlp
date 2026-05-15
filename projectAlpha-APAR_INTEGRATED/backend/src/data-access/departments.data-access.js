import { Department } from "../models/department.model.js";

const set = async (data, loggedInUser = null) => {
  try {
    const {
      department_id,
      department_name,
      head_of_department,
      contact_email,
      contact_phone,
      location,
      recognitions
    } = data;

    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newDepartment = new Department({
      department_id: department_id,
      department_name: department_name,
      head_of_department: head_of_department,
      contact_email: contact_email,
      contact_phone: contact_phone,
      location: location,
      recognitions: recognitions || [],
      metadata: {
        created_by: userId,
        change_log: [{
          action: 'created',
          user_id: userId,
          timestamp: new Date()
        }]
      }
    });

    await newDepartment.save();
    return newDepartment;

  } catch (error) {
    console.error("Error inserting department data:", error);
    throw error;
  }
}

const get = async () => {
  try {
    return await Department.find({}).sort({ department_name: 1 });
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    return await Department.findOne({ department_id: department_id });
  } catch (error) {
    throw error;
  }
}

const update = async (department_id, data, loggedInUser = null) => {
  try {
    const {
      department_id: new_department_id,
      department_name,
      head_of_department,
      contact_email,
      contact_phone,
      location,
      recognitions
    } = data;

    const updateFields = {};

    // Allow updating department_id if provided
    if (new_department_id && new_department_id !== department_id) {
      // Check if the new ID already exists
      const existing = await Department.findOne({ department_id: new_department_id });
      if (existing) {
        throw new Error(`Department ID "${new_department_id}" already exists.`);
      }
      updateFields.department_id = new_department_id;
    }

    if (department_name) updateFields.department_name = department_name;
    if (head_of_department) updateFields.head_of_department = head_of_department;
    if (contact_email) updateFields.contact_email = contact_email;
    if (contact_phone) updateFields.contact_phone = contact_phone;
    if (location) updateFields.location = location;
    if (recognitions) updateFields.recognitions = recognitions;

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await Department.findOneAndUpdate(
      { department_id: department_id },
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

    return result;

  } catch (error) {
    console.error("Error updating department data:", error);
    throw error;
  }
}

const deleteDepartment = async (department_id) => {
  try {
    await Department.deleteOne({ department_id: department_id });
  } catch (error) {
    console.error("Error deleting department data:", error);
    throw error;
  }
}

export { set, get, getByDepartmentId, update, deleteDepartment }