import React, { useEffect, useState, useMemo, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiPlus, FiFilter, FiX, FiCalendar, FiArrowRight,
  FiColumns, FiArrowUp, FiArrowDown, FiCheck, FiEye, FiEyeOff,
  FiRotateCcw, FiDownload, FiMenu, FiFileText, FiEdit2, FiTrash2
} from 'react-icons/fi';
import { toast } from 'sonner';
import * as Services from '../services';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table as DocxTable, TableCell, TableRow, WidthType, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TableSkeleton from './TableSkeleton';
import { AuditLogButton } from './AuditLogModal';
import { checkDuplicateIqac } from '../services/iqac-duplicate.service';
import DuplicateVerificationModal from './DuplicateVerificationModal';
import {
  duplicateDetectionConfig,
  isDuplicateDetectionEnabled,
  calculateAcademicYear,
  extractFacultyId
} from '../config/duplicateDetectionConfig';
import { useSelector } from 'react-redux';
import { selectRole } from '../store/slices/authSlice';
import { ROLES } from '../config/rolePermissions';

const getNestedValue = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj);

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString();
};

const Popover = ({ anchorEl, onClose, title, items }) => {
  const [style, setStyle] = useState({});
  const popoverRef = useRef(null);

  useLayoutEffect(() => {
    if (anchorEl && popoverRef.current) {
      const updatePosition = () => {
        const rect = anchorEl.getBoundingClientRect();
        const popRect = popoverRef.current.getBoundingClientRect();

        let top = rect.bottom + window.scrollY + 6;
        let left = rect.left + window.scrollX;

        // Check vertical overflow
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        // If not enough space below (buffer 10px) and there is more space above (or at least fits)
        if (spaceBelow < popRect.height + 10 && spaceAbove > popRect.height + 10) {
          top = rect.top + window.scrollY - popRect.height - 6;
        }

        // Check horizontal overflow (simplified)
        if (rect.left + popRect.width > window.innerWidth) {
          left = window.innerWidth - popRect.width - 20;
        }

        setStyle({ top, left });
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [anchorEl, items]);

  if (!anchorEl) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-transparent" onClick={onClose} />
      <div
        ref={popoverRef}
        className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-100 max-w-sm min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
        style={style.top ? style : { visibility: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-3 py-2 border-b border-gray-50 bg-gray-50/50">
          <h3 className="font-semibold text-gray-700 text-xs uppercase tracking-wide">{title}</h3>
        </div>
        <div className="p-1 max-h-[300px] overflow-y-auto">
          <ul className="space-y-0.5">
            {items.map((item, idx) => (
              <li key={idx} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded flex items-start leading-relaxed">
                <span className="mr-2 text-indigo-400 opacity-60 select-none">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>,
    document.body
  );
};

const CellRenderer = ({ col, item }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  let cellValue = getNestedValue(item, col.accessor);

  if (col.transform) {
    cellValue = col.transform(cellValue);
  }

  if (col.render) {
    return col.render(cellValue, item);
  }

  if (col.accessor === 'geo_tag_location_link') {
    return cellValue ? (
      <a href={cellValue} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">
        View Location
      </a>
    ) : '—';
  }

  switch (col.type) {
    case 'date':
      return formatDate(cellValue);
    case 'hyperlink':
      return cellValue ? (
        <a href={cellValue} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">
          View
        </a>
      ) : '—';

    case 'list':
    case 'objectList':
      if (typeof cellValue === 'string') return cellValue || '—';

      if (Array.isArray(cellValue) && cellValue.length > 0) {
        const displayItems = cellValue.map(val => {
          if (typeof val === 'object' && val !== null) {
            let str = val.name || val.faculty_id || val.student_id || val.id || JSON.stringify(val);
            if (val.role) str = `${str} (${val.role})`;
            return str;
          }
          return val;
        });

        const TRUNCATE_LIMIT = 2;
        const shouldTruncate = displayItems.length > TRUNCATE_LIMIT;
        const shownItems = shouldTruncate ? displayItems.slice(0, TRUNCATE_LIMIT) : displayItems;
        const remainingCount = displayItems.length - TRUNCATE_LIMIT;

        return (
          <>
            <div className="flex flex-col items-center gap-1">
              {shownItems.map((val, index) => (
                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                  {val}
                </span>
              ))}
              {shouldTruncate && (
                <button
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  className="text-xs text-indigo-600 font-medium hover:text-indigo-800 hover:underline mt-0.5 flex items-center gap-1 group"
                >
                  <span>+{remainingCount} more</span>
                  <FiArrowDown className="w-3 h-3 transition-transform group-hover:translate-y-0.5" />
                </button>
              )}
            </div>
            <Popover
              anchorEl={anchorEl}
              onClose={() => setAnchorEl(null)}
              title={col.header}
              items={displayItems}
            />
          </>
        );
      }
      return <span className="text-gray-400">—</span>;

    case 'boolean':
      return cellValue ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
          Yes
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-800">
          No
        </span>
      );
    case 'currency':
      const symbol = 'Rs.';
      const amount = parseFloat(cellValue);
      if (isNaN(amount)) return cellValue ?? '—';
      return <span className="font-mono text-gray-700">{symbol} {amount.toLocaleString()}</span>;
    case 'auditLog':
      return <AuditLogButton metadata={cellValue} />;
    default:
      return cellValue ?? '—';
  }
};

const SortableColumnRow = ({ col, id, onToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform ? { ...transform, x: 0 } : null),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-white rounded-lg border ${col.isVisible ? 'border-gray-200 shadow-sm' : 'border-gray-100 bg-gray-50 opacity-75'}`}
    >
      <div className="flex items-center space-x-3 overflow-hidden">
        <button
          onClick={() => onToggle(col)}
          className={`p-1.5 rounded-md transition-colors ${col.isVisible ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}
        >
          {col.isVisible ? <FiCheck size={16} /> : <FiX size={16} />}
        </button>
        <span className={`text-sm font-medium ${col.isVisible ? 'text-gray-700' : 'text-gray-400 decoration-slate-400'}`}>
          {col.header}
        </span>
      </div>

      <div
        {...attributes}
        {...listeners}
        className="p-1.5 text-gray-400 hover:text-indigo-600 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded"
      >
        <FiMenu size={16} />
      </div>
    </div>
  );
};

const ColumnManager = ({ columns, defaultColumns, setColumns, onClose }) => {
  const [localColumns, setLocalColumns] = useState(columns);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setLocalColumns((items) => {
        const oldIndex = items.findIndex(item => item.accessor === active.id);
        const newIndex = items.findIndex(item => item.accessor === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleVisibility = (column) => {
    setLocalColumns(prev => prev.map(c =>
      c.accessor === column.accessor ? { ...c, isVisible: !c.isVisible } : c
    ));
  };

  const handleApply = () => {
    setColumns(localColumns);
    onClose();
  };

  const handleReset = () => {
    if (defaultColumns) {
      setLocalColumns(defaultColumns.map(col => ({ ...col, isVisible: true })));
    }
  };

  return (
    <div
      className="absolute top-full right-0 mt-2 z-50 w-80 bg-white rounded-xl shadow-xl border border-gray-200 ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">Manage Columns</h3>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
          <FiX size={18} />
        </button>
      </div>

      <div className="p-4 overflow-y-auto max-h-[60vh] bg-gray-50/50">
        <p className="text-xs text-gray-500 mb-3 px-1">
          Uncheck to hide. Drag to reorder.
        </p>
        <div className="space-y-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localColumns.map(c => c.accessor)}
              strategy={rectSortingStrategy}
            >
              {localColumns.map((col) => (
                <SortableColumnRow
                  key={col.accessor}
                  id={col.accessor}
                  col={col}
                  onToggle={toggleVisibility}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Footer Section Updated */}
      <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-white rounded-b-xl">
        <button
          onClick={handleReset}
          className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Reset to default order and visibility"
        >
          <FiRotateCcw size={14} />
          <span>Reset</span>
        </button>

        <div className="flex space-x-2">
          <button
            onClick={handleApply}
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 shadow-sm"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

const FilterSection = ({ columns, pendingFilters, setPendingFilters, onApply, onClear, onClose }) => {
  const handleInputChange = (accessor, value) => {
    setPendingFilters(prev => ({
      ...prev,
      [accessor]: { ...prev[accessor], value }
    }));
  };

  const handleRangeChange = (accessor, key, value) => {
    setPendingFilters(prev => ({
      ...prev,
      [accessor]: { ...prev[accessor], [key]: value }
    }));
  };

  const handleSelectChange = (accessor, value) => {
    setPendingFilters(prev => ({
      ...prev,
      [accessor]: { ...prev[accessor], value: value === 'all' ? undefined : value === 'true' }
    }));
  };

  const renderFilterInput = (col) => {
    const filter = pendingFilters[col.accessor] || {};

    if (col.type === 'date') {
      const isRangeMode = filter.isRange === true || (filter.max !== undefined && filter.max !== '');
      const toggleRange = () => {
        if (isRangeMode) {
          setPendingFilters(prev => ({
            ...prev,
            [col.accessor]: { ...prev[col.accessor], max: '', isRange: false }
          }));
        } else {
          setPendingFilters(prev => ({
            ...prev,
            [col.accessor]: { ...prev[col.accessor], isRange: true }
          }));
        }
      };

      return (
        <div key={col.accessor} className="space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiCalendar className="text-gray-400" />
            </div>
            <input
              type="date"
              placeholder="Select date"
              value={filter.min || ''}
              onChange={(e) => handleRangeChange(col.accessor, 'min', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
          {isRangeMode ? (
            <div className="flex items-center space-x-2 animate-in slide-in-from-top-2 duration-200">
              <FiArrowRight className="text-gray-400 shrink-0" />
              <div className="relative w-full">
                <input
                  type="date"
                  placeholder="End date"
                  value={filter.max || ''}
                  onChange={(e) => handleRangeChange(col.accessor, 'max', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <button
                onClick={toggleRange}
                title="Remove range"
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={toggleRange}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center hover:underline ml-1"
            >
              + Add end date (Range)
            </button>
          )}
        </div>
      );
    }

    if (col.type === 'currency' || typeof getNestedValue(filter, 'value') === 'number') {
      return (
        <div key={col.accessor} className="flex items-center space-x-2">
          <input
            type="number"
            placeholder="Min"
            value={filter.min || ''}
            onChange={(e) => handleRangeChange(col.accessor, 'min', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filter.max || ''}
            onChange={(e) => handleRangeChange(col.accessor, 'max', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
      );
    }

    if (col.type === 'hyperlink' || col.accessor === 'geo_tag_location_link') return null;

    if (col.type === 'boolean') {
      const currentValue = filter.value === true ? 'true' : (filter.value === false ? 'false' : 'all');
      return (
        <select
          key={col.accessor}
          value={currentValue}
          onChange={(e) => handleSelectChange(col.accessor, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        >
          <option value="all">All</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }

    return (
      <input
        key={col.accessor}
        type="text"
        placeholder={`Filter by ${col.header}...`}
        value={filter.value || ''}
        onChange={(e) => handleInputChange(col.accessor, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
      />
    );
  };

  const filterableColumns = columns.filter(col => col.type !== 'hyperlink' && col.accessor !== 'geo_tag_location_link');

  return (
    <div
      className="absolute top-full right-0 mt-2 z-50 w-[800px] bg-white rounded-xl shadow-xl border border-gray-200 ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">Filter Records</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
        >
          <FiX size={18} />
        </button>
      </div>

      <div className="p-6 overflow-y-auto bg-white max-h-[60vh]">
        <div className="grid grid-cols-2 gap-5">
          {filterableColumns.map(col => (
            <div key={col.accessor}>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                {col.header}
              </label>
              {renderFilterInput(col)}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 px-6 py-4 flex justify-between space-x-3 border-t border-gray-100 rounded-b-xl">
        <button
          onClick={onClear}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-all"
        >
          Clear All
        </button>
        <button
          onClick={() => { onApply(); onClose(); }}
          className="px-3 py-2 bg-indigo-600 border border-transparent rounded-lg text-xs font-medium text-white hover:bg-indigo-700 shadow-sm hover:shadow-md focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-all"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};



export default function TablePage({ config }) {
  const {
    title,
    addPath,
    fetchData,
    columns,
    keyAccessor,
    updateFunctionName,
    deleteFunctionName,
    serviceName
  } = config;

  const navigate = useNavigate();
  const role = useSelector(selectRole);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [columnConfig, setColumnConfig] = useState([]);

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isColumnManagerVisible, setIsColumnManagerVisible] = useState(false);

  const [filters, setFilters] = useState({});
  const [pendingFilters, setPendingFilters] = useState({});
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    if (columns && columns.length > 0) {
      // Filter out unwanted columns (table_name, ID)
      const filteredCols = columns.filter(col => {
        const lowerAcc = (col.accessor || '').toLowerCase();
        const lowerHead = (col.header || '').toLowerCase();

        // Exclude 'table_name'
        //  if (lowerAcc === 'table_name' || lowerHead === 'table_name') return false;

        //  // Exclude ID columns (accessor 'id'/'_id', or Header '... ID'/'ID')
        //  if (lowerAcc === 'id' || lowerAcc === '_id') return false;
        //  if (lowerHead === 'id') return false;

        return true;
      });

      // Add Actions column if it doesn't exist AND if update/delete functions are configured AND user is NOT HOD
      const isHOD = role === ROLES.DEPARTMENT_HOD;
      if (!filteredCols.find(c => c.accessor === 'actions') && (config.updateFunctionName || config.deleteFunctionName) && !isHOD) {
        filteredCols.push({
          header: 'Actions',
          accessor: 'actions',
          isVisible: true,
          isAction: true // Flag to identify action column
        });
      }

      setColumnConfig(filteredCols.map(col => ({ ...col, isVisible: true })));
    }
  }, [columns, config.updateFunctionName, config.deleteFunctionName, role]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        if (fetchData) {
          const data = await fetchData();
          if (mounted) {
            setItems(data || []);
            setError(null);
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('Error loading data:', err);
          setError('Failed to load data. Please try again.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => { mounted = false; };
  }, [fetchData, title]);


  const handleDeleteItem = (id) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    const id = itemToDelete;

    try {
      const service = Services[serviceName];
      if (!service || !service[deleteFunctionName]) {
        throw new Error(`Delete function ${deleteFunctionName} not found in ${serviceName}`);
      }

      await service[deleteFunctionName](id);
      toast.success('Item deleted successfully');

      // Refresh data
      setItems(prev => prev.filter(item => getNestedValue(item, keyAccessor) !== id));

    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete item');
    } finally {
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleEditItem = (id) => {
    navigate(`${addPath}?edit=true&id=${id}`);
  };

  const filteredItems = useMemo(() => {
    if (Object.keys(filters).length === 0) {
      return items;
    }
    return items.filter(item => {
      return Object.entries(filters).every(([accessor, filter]) => {
        const itemValue = getNestedValue(item, accessor);
        if (typeof filter.value === 'boolean') {
          return itemValue === filter.value;
        }
        if (filter.value) {
          return String(itemValue).toLowerCase().includes(String(filter.value).toLowerCase());
        }
        if (filter.min || filter.max) {
          const colType = columns.find(c => c.accessor === accessor)?.type;
          if (colType === 'date') {
            const itemDate = new Date(itemValue).getTime();
            if (isNaN(itemDate)) return false;
            const minDate = filter.min ? new Date(filter.min).getTime() : -Infinity;
            const maxDate = filter.max ? new Date(filter.max).getTime() : Infinity;
            return itemDate >= minDate && itemDate <= maxDate;
          }
          const itemNum = parseFloat(itemValue);
          if (isNaN(itemNum)) return false;
          const minNum = filter.min ? parseFloat(filter.min) : -Infinity;
          const maxNum = filter.max ? parseFloat(filter.max) : Infinity;
          return itemNum >= minNum && itemNum <= maxNum;
        }
        return true;
      });
    });
  }, [items, filters, columns]);

  const handleApplyFilters = () => {
    setFilters(pendingFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    setPendingFilters({});
  };

  const toggleFilterBar = () => {
    if (!isFilterVisible) {
      setPendingFilters(filters);
    }
    setIsFilterVisible(prev => !prev);
    if (isColumnManagerVisible) setIsColumnManagerVisible(false);
  };

  const toggleColumnManager = () => {
    setIsColumnManagerVisible(prev => !prev);
    if (isFilterVisible) setIsFilterVisible(false);
  };

  const visibleColumns = useMemo(() => {
    return columnConfig.filter(col => col.isVisible);
  }, [columnConfig]);

  const getHelperRowData = (item) => {
    return visibleColumns.map(col => {
      let rawValue = getNestedValue(item, col.accessor);
      if (col.transform) {
        rawValue = col.transform(rawValue);
      }
      let displayValue = rawValue;
      if (rawValue === null || rawValue === undefined) {
        displayValue = '';
      } else if (col.type === 'date') {
        displayValue = new Date(rawValue).toLocaleDateString();
        if (displayValue === 'Invalid Date') displayValue = rawValue;
      } else if (col.type === 'boolean') {
        displayValue = rawValue ? 'Yes' : 'No';
      } else if (col.type === 'list' || col.type === 'objectList') {
        if (Array.isArray(rawValue)) {
          displayValue = rawValue.map(v => {
            if (typeof v === 'object' && v !== null) {
              return v.name || v.id || JSON.stringify(v);
            }
            return v;
          }).join(', ');
        }
      } else if (col.type === 'currency') {
        if (col.type === 'currency' && !isNaN(rawValue)) {
          return rawValue;
        }
      }
      return displayValue;
    });
  };

  const handleExportExcel = () => {
    if (!filteredItems || filteredItems.length === 0) {
      toast.error("No data to export");
      return;
    }
    try {
      const dataToExport = filteredItems.map(item => {
        const rowData = {};
        const helperData = getHelperRowData(item);
        visibleColumns.forEach((col, index) => {
          rowData[col.header] = helperData[index];
        });
        return rowData;
      });
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const maxWidths = visibleColumns.map(col => ({ wch: col.header.length + 10 }));
      worksheet['!cols'] = maxWidths;
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("Excel downloaded successfully");
      setIsExportMenuOpen(false);
    } catch (err) {
      console.error("Export failed", err);
      toast.error("Failed to export Excel file");
    }
  };

  return (
    <div className="bg-gray-50 min-h-[80vh] relative">





      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{title}</h1>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">

            {/* Export Menu */}
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                disabled={loading || filteredItems.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload />
                <span>Export</span>
              </button>
              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black/5 border border-gray-100">
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    <FiDownload className="mr-2" /> Excel
                  </button>

                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={toggleColumnManager}
                className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${isColumnManagerVisible
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <FiColumns />
                <span>Columns</span>
              </button>
              {isColumnManagerVisible && (
                <ColumnManager
                  columns={columnConfig}
                  defaultColumns={config.columns}
                  setColumns={setColumnConfig}
                  onClose={() => setIsColumnManagerVisible(false)}
                />
              )}
            </div>

            <div className="relative">
              <button
                onClick={toggleFilterBar}
                className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${Object.keys(filters).length > 0
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <FiFilter />
                <span>Filter {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}</span>
              </button>
              {isFilterVisible && (
                <FilterSection
                  columns={columnConfig}
                  pendingFilters={pendingFilters}
                  setPendingFilters={setPendingFilters}
                  onApply={handleApplyFilters}
                  onClear={handleClearFilters}
                  onClose={() => setIsFilterVisible(false)}
                />
              )}
            </div>

            {addPath && (
              <Link
                to={addPath}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
              >
                <FiPlus />
                <span>Add {title}</span>
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <TableSkeleton columns={visibleColumns.length || 6} />
        ) : error ? (
          <div className="text-center p-10 bg-red-50 text-red-700 rounded-lg shadow-sm border border-red-100">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 audit-table-container">
            <div className="overflow-x-auto relative">
              <table className="min-w-full text-sm text-center text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {visibleColumns.map((col) => (
                      <th key={col.header} className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{col.header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredItems.map((item, index) => (
                    <tr key={getNestedValue(item, keyAccessor) || index} className="hover:bg-gray-50 transition-colors">
                      {visibleColumns.map((col) => {
                        return (
                          <td key={col.accessor} className="px-4 py-4 whitespace-nowrap text-sm text-center">
                            {col.isAction ? (
                              <div className="flex justify-center gap-2">
                                {updateFunctionName && (
                                  <button
                                    onClick={() => handleEditItem(getNestedValue(item, keyAccessor))}
                                    className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                                    title="Edit"
                                  >
                                    <FiEdit2 size={16} />
                                  </button>
                                )}
                                {deleteFunctionName && (
                                  <button
                                    onClick={() => handleDeleteItem(getNestedValue(item, keyAccessor))}
                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                    title="Delete"
                                  >
                                    <FiTrash2 size={16} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <CellRenderer col={col} item={item} />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={visibleColumns.length || 1} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <FiFilter className="w-8 h-8 text-gray-300 mb-2" />
                          <p>No {title} found{Object.keys(filters).length > 0 ? ' matching your filters' : ''}.</p>
                          {Object.keys(filters).length > 0 && (
                            <button onClick={handleClearFilters} className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium">Clear filters</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Deletion</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md hover:shadow-lg transition-all font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}