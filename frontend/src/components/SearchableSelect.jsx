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
  onOptionChange,
  required = false,
  label,
  disabled = false,
  className = '',
  excludeValues = [],
  optionsOverride = [],
}) => {
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);

  const config = entityConfig[entityType];

  if (!config) {
    console.error(`Unknown entity type: ${entityType}`);
    return <div className="text-red-500">Unknown entity type: {entityType}</div>;
  }

  // Fetch all options on mount or use override if provided
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const override = Array.isArray(optionsOverride) ? optionsOverride : [];
        if (override.length > 0) {
          const normalized = override.map((opt) => {
            if (typeof opt === 'string') return { value: String(opt).trim(), label: String(opt) };
            return { value: String(opt?.value ?? '').trim(), label: opt?.label ?? String(opt?.value ?? '') };
          });
          setOptions(normalized);
          // Select current value if present
          if (value !== undefined && value !== null && value !== '') {
            const valStr = String(value).trim();
            const selected = normalized.find((o) => o.value === valStr);
            setSelectedOption(selected || null);
          }
          return;
        }

        const response = await config.service();
        console.log(`[SearchableSelect] ${entityType} raw response:`, response);

        let data = [];
        if (Array.isArray(response)) {
          data = response;
        } else if (Array.isArray(response?.data)) {
          data = response.data;
        } else if (Array.isArray(response?.data?.data)) {
          data = response.data.data;
        } else if (Array.isArray(response?.rows)) {
          data = response.rows;
        }
        console.log(`[SearchableSelect] ${entityType} processed data:`, data);

        if (!Array.isArray(data)) {
          console.error(`[SearchableSelect] Expected array for ${entityType}, got:`, typeof data);
          setOptions([]);
          return;
        }

        const formattedOptions = data.map((item) => {
          const value = String(item[config.valueKey] ?? '').trim();
          const nameOnly = String(item[config.labelKey] ?? item[config.valueKey] ?? 'Unknown');
          const idThenName = `${item[config.valueKey]} - ${item[config.labelKey] || 'Unknown'}`;
          return {
            value,
            label: entityType === 'course' ? nameOnly : idThenName,
            data: item,
          };
        });

        console.log(`[SearchableSelect] ${entityType} formatted options:`, formattedOptions);
        setOptions(formattedOptions);

        if (value !== undefined && value !== null && value !== '') {
          const valStr = String(value).trim();
          const selected = formattedOptions.find((opt) => opt.value === valStr);
          setSelectedOption(selected || null);
        }
      } catch (error) {
        console.error(`Error fetching ${entityType} options:`, error);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [entityType, JSON.stringify(optionsOverride)]);

  // Update selected option when value prop changes
  useEffect(() => {
    if ((value !== undefined && value !== null && value !== '') && options.length > 0) {
      const valStr = String(value).trim();
      const selected = options.find((opt) => opt.value === valStr);
      setSelectedOption(selected || null);
    } else if (value === undefined || value === null || value === '') {
      setSelectedOption(null);
    }
  }, [value, options]);

  // Filter out excluded values (already-added entities) from the dropdown
  const filteredOptions = excludeValues.length > 0
    ? (() => {
        const excludeSet = new Set((excludeValues || []).map(v => String(v).trim()));
        return options.filter(opt => !excludeSet.has(opt.value));
      })()
    : options;

  // Handle selection change
  const handleChange = (selectedOpt) => {
    setSelectedOption(selectedOpt);
    onChange(selectedOpt ? selectedOpt.value : '', selectedOpt || null);
    if (onOptionChange) {
      onOptionChange(selectedOpt || null);
    }
  };

  return (
    <div className={className}>
      {/* Hidden input to participate in native form validation when using custom select */}
      {required && (
        <input
          aria-hidden
          tabIndex={-1}
          value={value || ''}
          required
          readOnly
          onChange={() => {}}
          style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
        />
      )}
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
