import { DepartmentResource } from "../models/departmentResource.model.js";
import { v4 as uuidv4 } from 'uuid';

/**
 * Department Professional Schemes Data Access Layer
 * Updated to use DepartmentResource collection with type='scheme'
 */

const set = async (data, loggedInUser = null) => {
  try {
    const {
      department_id,
      name_of_scheme,
      type_of_scheme,
      name_of_organisation,
      funding_agency,
      sanction_number,
      principal_investigator,
      co_investigators,
      year_of_sanction,
      academic_year,
      funds_amount,
      duration_start_date,
      end_date,
      status,
      outcome,
      remarks,
      link
    } = data;

    const scheme_id = uuidv4();
    const userId = loggedInUser?.userId || loggedInUser?.id || null;

    const newResource = new DepartmentResource({
      resource_id: scheme_id,
      scheme_id,
      department_id,
      type: 'scheme',
      name_of_scheme,
      type_of_scheme,
      name_of_organisation,
      funding_agency,
      sanction_number,
      principal_investigator,
      co_investigators,
      year_of_sanction,
      academic_year,
      funds_amount,
      duration_start_date,
      end_date,
      status,
      outcome,
      remarks,
      link,
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
    return transformScheme(saved.toObject());

  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  }
}

const transformScheme = (resource) => ({
  scheme_id: resource.scheme_id || resource.resource_id,
  department_id: resource.department_id,
  name_of_scheme: resource.name_of_scheme,
  type_of_scheme: resource.type_of_scheme,
  name_of_organisation: resource.name_of_organisation,
  funding_agency: resource.funding_agency,
  sanction_number: resource.sanction_number,
  principal_investigator: resource.principal_investigator,
  co_investigators: resource.co_investigators,
  year_of_sanction: resource.year_of_sanction,
  academic_year: resource.academic_year,
  funds_amount: resource.funds_amount,
  duration_start_date: resource.duration_start_date,
  end_date: resource.end_date,
  status: resource.status,
  outcome: resource.outcome,
  remarks: resource.remarks,
  link: resource.link,
  metadata: resource.metadata || {}
});

const get = async () => {
  try {
    const resources = await DepartmentResource.find({ type: 'scheme' }).sort({ year_of_sanction: -1 });
    return resources.map(r => transformScheme(r.toObject()));
  } catch (error) {
    throw error;
  }
}

const getBySchemeId = async (scheme_id) => {
  try {
    const resource = await DepartmentResource.findOne({ scheme_id, type: 'scheme' });
    return resource ? transformScheme(resource.toObject()) : null;
  } catch (error) {
    throw error;
  }
}

const getByDepartmentId = async (department_id) => {
  try {
    const resources = await DepartmentResource.find({ department_id, type: 'scheme' }).sort({ year_of_sanction: -1 });
    return resources.map(r => transformScheme(r.toObject()));
  } catch (error) {
    throw error;
  }
}

const update = async (scheme_id, data, loggedInUser = null) => {
  try {
    const updateFields = {};
    if (data.department_id) updateFields.department_id = data.department_id;
    if (data.name_of_scheme) updateFields.name_of_scheme = data.name_of_scheme;
    if (data.type_of_scheme) updateFields.type_of_scheme = data.type_of_scheme;
    if (data.name_of_organisation) updateFields.name_of_organisation = data.name_of_organisation;
    if (data.funding_agency) updateFields.funding_agency = data.funding_agency;
    if (data.sanction_number) updateFields.sanction_number = data.sanction_number;
    if (data.principal_investigator) updateFields.principal_investigator = data.principal_investigator;
    if (data.co_investigators) {
      let coInv = data.co_investigators;
      if (typeof coInv === 'string') {
        try { coInv = JSON.parse(coInv); } catch (e) { coInv = []; }
      }
      if (Array.isArray(coInv)) {
        updateFields.co_investigators = coInv;
      }
    }
    if (data.year_of_sanction) updateFields.year_of_sanction = data.year_of_sanction;
    if (data.academic_year) updateFields.academic_year = data.academic_year;
    if (data.funds_amount !== undefined) updateFields.funds_amount = data.funds_amount;
    if (data.duration_start_date) updateFields.duration_start_date = data.duration_start_date;
    if (data.end_date) updateFields.end_date = data.end_date;
    if (data.status) updateFields.status = data.status;
    if (data.outcome) updateFields.outcome = data.outcome;
    if (data.remarks) updateFields.remarks = data.remarks;
    if (data.link) updateFields.link = data.link;

    const userId = loggedInUser?.userId || loggedInUser?.id || null;
    updateFields['metadata.updated_at'] = new Date();

    const result = await DepartmentResource.findOneAndUpdate(
      { scheme_id, type: 'scheme' },
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
    throw error;
  }
}

const deleteScheme = async (scheme_id) => {
  try {
    await DepartmentResource.findOneAndDelete({ scheme_id, type: 'scheme' });
  } catch (error) {
    throw error;
  }
}

export { set, get, getBySchemeId, getByDepartmentId, update, deleteScheme }