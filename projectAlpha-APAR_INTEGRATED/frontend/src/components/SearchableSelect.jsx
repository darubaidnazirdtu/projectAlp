import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import * as Services from '../services';

// Entity configuration - maps entity types to their service and display properties
const entityConfig = {
  department: {
    service: () => Services.DepartmentService.getDepartments(),
    valueKey: 'department_id',
    labelKey: 'department_name',
    searchKeys: ['department_id', 'department_name'],
    placeholder: 'Search departments...',
  },
  faculty: {
    service: () => Services.FacultyService.getFacultyDetails(),
    valueKey: 'faculty_id',
    labelKey: 'name',
    searchKeys: ['faculty_id', 'name', 'email'],
    placeholder: 'Search faculty...',
  },
  student: {
    service: () => Services.StudentService.getStudentDetails(),
    valueKey: 'student_id',
    labelKey: 'name',
    searchKeys: ['student_id', 'name', 'enrollment_no'],
    placeholder: 'Search students...',
  },
  course: {
    service: () => Services.CourseService.getCourses(),
    valueKey: 'course_id',
    labelKey: 'course_name',
    searchKeys: ['course_id', 'course_name', 'course_code'],
    placeholder: 'Search courses...',
  },
};

// Custom styles to match the existing form styling
const customStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: '48px',
    backgroundColor: '#f3f4f6',
    borderRadius: '0.5rem',
    border: 'none',
    boxShadow: state.isFocused ? '0 0 0 2px #6366f1' : 'none',
    '&:hover': {
      border: 'none',
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '0 16px',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#9ca3af',
  }),
  input: (provided) => ({
    ...provided,
    margin: 0,
    padding: 0,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? '#6366f1'
      : state.isFocused
        ? '#e0e7ff'
        : 'white',
    color: state.isSelected ? 'white' : '#374151',
    padding: '12px 16px',
    cursor: 'pointer',
  }),
  menu: (provided) => ({
    ...provided,
    width: 'max-content',
    minWidth: '100%',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    zIndex: 50,
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#374151',
  }),
  noOptionsMessage: (provided) => ({
    ...provided,
    color: '#6b7280',
  }),
  loadingMessage: (provided) => ({
    ...provided,
    color: '#6b7280',
  }),
};

const SearchableSelect = ({
  entityType,
  value,
  onChange,
  required = false,
  label,
  disabled = false,
  className = '',
  excludeValues = [],
}) => {
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);

  const config = entityConfig[entityType];

  if (!config) {
    console.error(`Unknown entity type: ${entityType}`);
    return <div className="text-red-500">Unknown entity type: {entityType}</div>;
  }

  // Fetch all options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        const response = await config.service();
        console.log(`[SearchableSelect] ${entityType} raw response:`, response);

        const data = response?.data || response || [];
        console.log(`[SearchableSelect] ${entityType} processed data:`, data);

        if (!Array.isArray(data)) {
          console.error(`[SearchableSelect] Expected array for ${entityType}, got:`, typeof data);
          setOptions([]);
          return;
        }

        const formattedOptions = data.map((item) => ({
          value: item[config.valueKey],
          label: `${item[config.valueKey]} - ${item[config.labelKey] || 'Unknown'}`,
          data: item,
        }));

        console.log(`[SearchableSelect] ${entityType} formatted options:`, formattedOptions);
        setOptions(formattedOptions);

        // Set selected option if value exists
        if (value) {
          const selected = formattedOptions.find((opt) => opt.value === value);
          setSelectedOption(selected || null);
        }
      } catch (error) {
        console.error(`Error fetching ${entityType} options:`, error);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, [entityType]);

  // Update selected option when value prop changes
  useEffect(() => {
    if (value && options.length > 0) {
      const selected = options.find((opt) => opt.value === value);
      setSelectedOption(selected || null);
    } else if (!value) {
      setSelectedOption(null);
    }
  }, [value, options]);

  // Filter out excluded values (already-added entities) from the dropdown
  const filteredOptions = excludeValues.length > 0
    ? options.filter(opt => !excludeValues.includes(opt.value))
    : options;

  // Handle selection change
  const handleChange = (selectedOpt) => {
    setSelectedOption(selectedOpt);
    onChange(selectedOpt ? selectedOpt.value : '');
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold mb-2 text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Select
        options={filteredOptions}
        value={selectedOption}
        onChange={handleChange}
        placeholder={config.placeholder}
        isClearable
        isDisabled={disabled}
        isLoading={isLoading}
        styles={customStyles}
        noOptionsMessage={({ inputValue }) =>
          inputValue ? 'No matches found' : 'No options available'
        }
        loadingMessage={() => 'Loading...'}
      />
    </div>
  );
};

export default SearchableSelect;
