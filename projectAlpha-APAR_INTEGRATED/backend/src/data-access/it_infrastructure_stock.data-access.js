import { DepartmentResource } from "../models/departmentResource.model.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { triggerAparAutoSyncMultiple } from '../utils/apar-auto-sync.js';

/**
 * IT Infrastructure Stock Data Access Layer
 * Updated to use DepartmentResource collection with type='it_stock'
 */

const set = async (data, loggedInUser = null) => {
  try {
    const {
      department_id,
      lab_name,
      faculty_id,
      no_of_desktops,
      no_of_servers,
      no_of_workstations,
      no_of_hpcs,
      total_storage_tb,
      internet_bandwidth_mbps,
      software_list,
      total_cost,
      funding_source,
      year_of_installation,
      year_of_purchase,
      condition_status,
      usage_purpose,
      academic_year,
      remarks
    } = data;

    const stock_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newResource = new DepartmentResource({
      resource_id: stock_id,
      stock_id,
      department_id,
      type: 'it_stock',
      lab_name,
      faculty_id,
      no_of_desktops,
      no_of_servers,
      no_of_workstations,
      no_of_hpcs,
      total_storage_tb,
      internet_bandwidth_mbps,
      software_list,
      total_cost,
      funding_source,
      year_of_installation,
      year_of_purchase,
      condition_status,
      usage_purpose,
      academic_year,
      remarks,
      metadata: {
        created_by: userId,
        change_log: [{
          action: 'created',
          user_id: userId,
          timestamp: new Date()
        }]
      }
    });

    const saved = await newResource.save();

    // Trigger auto-sync
    if (faculty_id) {
      triggerAparAutoSyncMultiple([faculty_id], academic_year, {
        type: 'it_stock',
        ...transformStock(saved.toObject())
      }).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return transformStock(saved.toObject());

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const transformStock = (resource) => ({
  stock_id: resource.stock_id || resource.resource_id,
  department_id: resource.department_id,
  lab_name: resource.lab_name,
  faculty_id: resource.faculty_id,
  no_of_desktops: resource.no_of_desktops,
  no_of_servers: resource.no_of_servers,
  no_of_workstations: resource.no_of_workstations,
  no_of_hpcs: resource.no_of_hpcs,
  total_storage_tb: resource.total_storage_tb,
  internet_bandwidth_mbps: resource.internet_bandwidth_mbps,
  software_list: resource.software_list,
  total_cost: resource.total_cost,
  funding_source: resource.funding_source,
  year_of_installation: resource.year_of_installation,
  year_of_purchase: resource.year_of_purchase,
  condition_status: resource.condition_status,
  usage_purpose: resource.usage_purpose,
  academic_year: resource.academic_year,
  remarks: resource.remarks,
  metadata: resource.metadata || {}
});

const get = async () => {
  try {
    const resources = await DepartmentResource.find({ type: 'it_stock' }).sort({ lab_name: 1 });
    return resources.map(r => transformStock(r.toObject()));
  } catch (error) {
    throw error;
  }
}

const getByStockId = async (stock_id) => {
  try {
    const resource = await DepartmentResource.findOne({ stock_id, type: 'it_stock' });
    return resource ? transformStock(resource.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const resources = await DepartmentResource.find({ department_id, type: 'it_stock' }).sort({ lab_name: 1 });
    return resources.map(r => transformStock(r.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (stock_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.lab_name) updateFields.lab_name = data.lab_name;
    if (data.faculty_id) updateFields.faculty_id = data.faculty_id;
    if (data.no_of_desktops !== undefined) updateFields.no_of_desktops = data.no_of_desktops;
    if (data.no_of_servers !== undefined) updateFields.no_of_servers = data.no_of_servers;
    if (data.no_of_workstations !== undefined) updateFields.no_of_workstations = data.no_of_workstations;
    if (data.no_of_hpcs !== undefined) updateFields.no_of_hpcs = data.no_of_hpcs;
    if (data.total_storage_tb) updateFields.total_storage_tb = data.total_storage_tb;
    if (data.internet_bandwidth_mbps) updateFields.internet_bandwidth_mbps = data.internet_bandwidth_mbps;
    if (data.software_list) updateFields.software_list = data.software_list;
    if (data.total_cost !== undefined) updateFields.total_cost = data.total_cost;
    if (data.funding_source) updateFields.funding_source = data.funding_source;
    if (data.year_of_installation) updateFields.year_of_installation = data.year_of_installation;
    if (data.year_of_purchase) updateFields.year_of_purchase = data.year_of_purchase;
    if (data.condition_status) updateFields.condition_status = data.condition_status;
    if (data.usage_purpose) updateFields.usage_purpose = data.usage_purpose;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.remarks) updateFields.remarks = data.remarks;

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await DepartmentResource.findOneAndUpdate(
      { stock_id, type: 'it_stock' },
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

    // Trigger auto-sync
    if (result && result.faculty_id) {
      triggerAparAutoSyncMultiple([result.faculty_id], result.academic_year, {
        type: 'it_stock',
        action: 'updated',
        ...transformStock(result.toObject())
      }).catch(err =>
        console.error('Auto-sync trigger failed:', err)
      );
    }

    return { modifiedCount: result ? 1 : 0 };
  } catch (error) {
    throw error;
  }
}

const deleteStock = async (id) => {
  try {
    const query = { type: 'it_stock' };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ stock_id: id }, { resource_id: id }, { _id: id }];
    } else {
      query.$or = [{ stock_id: id }, { resource_id: id }];
    }

    const resource = await DepartmentResource.findOne(query);
    if (!resource) {
      console.warn(`[DELETE STOCK] Record not found for ID: ${id}`);
      throw new Error(`IT Stock/Infrastructure record not found for ID: ${id}`);
    }

    const entryData = { type: 'it_stock', action: 'deleted', ...transformStock(resource.toObject()) };

    await DepartmentResource.findOneAndDelete(query);

    if (resource.faculty_id) {
      triggerAparAutoSyncMultiple([resource.faculty_id], resource.academic_year, entryData).catch(err =>
        console.error('Auto-sync delete trigger failed:', err)
      );
    }
  } catch (error) {
    throw error;
  }
}

export { set, get, getByStockId, getByDepartmentId, update, deleteStock }