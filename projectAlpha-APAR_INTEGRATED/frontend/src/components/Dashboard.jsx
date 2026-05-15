import React, { useMemo, useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FiUsers, FiBriefcase, FiPlusSquare, FiX, FiCheckCircle, 
  FiActivity, FiBookOpen, FiFileText, FiAward, FiTrendingUp, 
  FiClock, FiCalendar, FiCheck
} from 'react-icons/fi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Label, LabelList
} from 'recharts';
import { resources, resourceMap } from '../config/tableConfig';
import { canAccessForm, canAccessTable } from '../config/rolePermissions.js';
import { selectRole } from '../store/slices/authSlice.js';
import { dashboardService } from '../services/dashboard.service';
import TablePage from './TablePage';

const barData = [
  { name: 'CSE', pass: 94 }, { name: 'IT', pass: 92 }, { name: 'ECE', pass: 88 },
  { name: 'EE', pass: 85 }, { name: 'ME', pass: 82 }, { name: 'CE', pass: 89 },
  { name: 'AI/ML', pass: 96 }, { name: 'Data Sci', pass: 95 }, { name: 'BioTech', pass: 91 }
];

const feedbackData = [
  { name: 'Teaching Learning', value: 4.35, color: '#2563eb' },
  { name: 'Curriculum', value: 4.10, color: '#10b981' },
  { name: 'Infrastructure', value: 4.05, color: '#f59e0b' },
  { name: 'Support Services', value: 4.15, color: '#8b5cf6' }
];

const qualityData = [
  { name: 'Completed', value: 16, color: '#10b981' },
  { name: 'In Progress', value: 12, color: '#3b82f6' },
  { name: 'Planned', value: 6, color: '#f59e0b' }
];

const infraData = [
  { name: 'Score', value: 4.28, color: '#2dd4bf' },
  { name: 'Remaining', value: 0.72, color: '#f1f5f9' }
];

const StatCard = ({ icon, label, value, subtext, trend, trendUp, color, onClick, isActive, hideArrow }) => {
  const colorClasses = {
    blue: 'bg-blue-600 text-white',
    green: 'bg-emerald-500 text-white',
    purple: 'bg-purple-600 text-white',
    orange: 'bg-orange-500 text-white',
    teal: 'bg-teal-400 text-white',
  };

  return (
    <div 
      onClick={onClick}
      className={
        'p-5 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between transition-all duration-300 hover:shadow-md ' + 
        (onClick ? 'cursor-pointer ' : '') + 
        (isActive ? 'ring-2 ring-indigo-500 shadow-md scale-[1.02]' : '')
      }
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className={'p-3 rounded-full ' + (colorClasses[color] || colorClasses.blue)}>
          {React.cloneElement(icon, { size: 22 })}
        </div>
        <div>
          <div className="text-sm text-gray-500 font-medium">{label}</div>
          <div className="text-[28px] leading-none font-bold text-gray-800">{value}</div>
        </div>
      </div>
      <div className="text-xs font-medium text-gray-500 flex items-center">
        {trend && (
          <span className={'mr-2 flex items-center ' + (trendUp ? 'text-emerald-500' : 'text-red-500')}>
            {!hideArrow && (trendUp ? '↑' : '↓')} {trend}
          </span>
        )}
        {subtext && <span>{subtext}</span>}
      </div>
    </div>
  );
};

const WidgetBlock = ({ title, children, className = "" }) => (
  <div className={'bg-white rounded-xl shadow-sm border border-gray-100 p-5 ' + className}>
    <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
    {children}
  </div>
);

const QuickLink = ({ to, icon, label }) => (
  <Link
    to={to}
    className="flex items-center p-3 bg-white rounded-lg hover:bg-indigo-50 transition-colors border border-gray-100 shadow-sm"
  >
    <div className="p-2 mr-3 rounded-md bg-slate-100 text-slate-600">
      {React.cloneElement(icon, { size: 18 })}
    </div>
    <span className="font-semibold text-sm text-gray-700">{label}</span>
  </Link>
);

export default function Dashboard() {
  const role = useSelector(selectRole);
  const [stats, setStats] = useState({ students: 12543, faculty: 612, departments: 78 });
  const [activeTable, setActiveTable] = useState(null);
  const tableRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        if (data && (data.students > 0 || data.faculty > 0)) {
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };
    if (role) fetchStats();
  }, [role]);

  const quickActions = useMemo(() => {
    if (!role) return [];
    return resources.filter((resource) => Boolean(resource.addPath) && canAccessForm(role, resource.id));
  }, [role]);

  const handleCardClick = (tableId) => {
    if (activeTable === tableId) {
      setActiveTable(null);
    } else {
      const config = resourceMap.get(tableId);
      if (config && canAccessTable(role, config.id || tableId)) {
        setActiveTable(tableId);
        setTimeout(() => {
          tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else if (!config) {
         // Silently handle clicking non-table cards like APAR
      } else {
        alert("You do not have permission to view " + tableId);
      }
    }
  };

  const activeConfig = activeTable ? resourceMap.get(activeTable) : null;

  return (
    <div className="pb-16 max-w-[1600px] mx-auto bg-[#fafafa] font-sans">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
      </div>

      {/* Top Row Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        <StatCard 
          icon={<FiBookOpen />} label="Total Programs" value={stats.departments || 78} color="blue" 
          subtext="UG: 56 PG: 20 PhD: 2" isActive={activeTable === 'departments'} 
          onClick={() => handleCardClick('departments')}
        />
        <StatCard 
          icon={<FiUsers />} label="Total Students" value={stats.students.toLocaleString()} color="green" 
          trend="6.8%" trendUp={true} subtext="from 2025-26" isActive={activeTable === 'students'} 
          onClick={() => handleCardClick('students')}
        />
        <StatCard 
          icon={<FiBriefcase />} label="Total Faculty" value={stats.faculty.toLocaleString()} color="purple" 
          trend="4.5%" trendUp={true} subtext="from 2025-26" isActive={activeTable === 'faculty'} 
          onClick={() => handleCardClick('faculty')}
        />
        <StatCard 
          icon={<FiFileText />} label="Quality Initiatives" value="34" color="orange" 
          trend="13%" trendUp={true} subtext="from 2025-26"
        />
        <StatCard 
          icon={<FiCheckCircle />} label="Total APAR Submitted" value="15" color="teal" 
          trend="" hideArrow={true} subtext="On 30/12/2025"
        />
      </div>

      {/* Interjected Active Table View */}
      {activeTable && activeConfig && (
        <div ref={tableRef} className="mb-6 bg-white rounded-xl shadow-xl overflow-hidden border border-indigo-100 transition-all duration-500 ease-in-out">
          <div className="bg-indigo-50/50 px-6 py-3 border-b border-indigo-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              Showing detailed view for {activeConfig.id.charAt(0).toUpperCase() + activeConfig.id.slice(1)}
            </h2>
            <button 
              onClick={() => setActiveTable(null)}
              className="p-1.5 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-red-500 shadow-sm border border-transparent hover:border-gray-200"
            >
              <FiX size={20} />
            </button>
          </div>
          <div className="p-6 overflow-x-auto max-h-[600px] overflow-y-auto">
            <TablePage key={activeTable} config={activeConfig} />
          </div>
        </div>
      )}

      {/* Middle Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Bar Chart */}
        <WidgetBlock title="Academic Performance (Program-wise Pass Percentage)">
          <div className="h-60 w-full relative -ml-4">
             <div className="absolute left-4 top-0 text-[10px] text-gray-400 rotate-[-90deg] origin-left translate-y-24">Pass Percentage (%)</div>
             <div className="absolute right-0 top-0 text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 bg-white shadow-sm">2025-24 ⌄</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 30, right: 10, left: 10, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={{stroke: '#e2e8f0'}} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={{stroke: '#e2e8f0'}} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="pass" fill="#3b82f6" radius={[2, 2, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={'cell-'+index} fill="#4285F4" />
                  ))}
                  <LabelList dataKey="pass" position="top" formatter={(val) => `${val}%`} style={{ fontSize: '10px', fill: '#4b5563', fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </WidgetBlock>

        {/* Feedback Donut */}
        <WidgetBlock title="Feedback Analysis (Overall)">
          <div className="h-60 flex items-center justify-between gap-4">
            <div className="flex-1 h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={feedbackData} innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                    {feedbackData.map((entry, index) => (
                      <Cell key={'cell-'+index} fill={entry.color} />
                    ))}
                    <Label 
                      value="4.21" position="center" className="text-3xl font-bold fill-slate-800" dy={-5}
                    />
                    <Label 
                      value="Out of 5" position="center" className="text-[10px] fill-slate-500 font-medium" dy={15}
                    />
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="flex flex-col gap-3 text-[11px] shrink-0 justify-center">
              {feedbackData.map(item => (
                <div key={item.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-slate-600 truncate w-24">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-700">{item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </WidgetBlock>

        {/* Quality Initiatives Donut */}
        <WidgetBlock title="Quality Initiatives Status">
          <div className="h-60 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={qualityData} innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                  {qualityData.map((entry, index) => (
                    <Cell key={'cell-'+index} fill={entry.color} />
                  ))}
                  <Label 
                    value="34" position="center" className="text-3xl font-bold fill-slate-800" dy={-5}
                  />
                  <Label 
                    value="Total" position="center" className="text-[10px] fill-slate-500 font-medium" dy={15}
                  />
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-4 text-[11px]">
              {qualityData.map(item => (
                <div key={item.name} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800 ml-4">{item.value} ({Math.round(item.value/34*100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </WidgetBlock>
      </div>

      {/* Bottom Row Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5 items-stretch">
        {/* Research & Innovation */}
        <WidgetBlock title="Research & Innovation" className="flex flex-col">
          <div className="grid grid-cols-2 gap-3 flex-grow">
            <div className="flex flex-col items-center justify-center p-2 border border-blue-50 rounded-lg text-center shadow-sm">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-md mb-2"><FiFileText size={16}/></div>
              <div className="text-[10px] text-gray-500 mb-0.5 font-medium">Research Papers<br/>Published</div>
              <div className="text-lg font-bold text-gray-800">245</div>
              <div className="text-[10px] text-emerald-500 font-medium mt-1">↑ 15%</div>
            </div>
            <div className="flex flex-col items-center justify-center p-2 border border-blue-50 rounded-lg text-center shadow-sm">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-md mb-2"><FiBookOpen size={16}/></div>
              <div className="text-[10px] text-gray-500 mb-0.5 font-medium">Books/Chapters<br/>Published</div>
              <div className="text-lg font-bold text-gray-800">36</div>
              <div className="text-[10px] text-emerald-500 font-medium mt-1">↑ 9%</div>
            </div>
            <div className="flex flex-col items-center justify-center p-2 border border-blue-50 rounded-lg text-center shadow-sm">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-md mb-2"><FiAward size={16}/></div>
              <div className="text-[10px] text-gray-500 mb-0.5 font-medium">Patents<br/>Filed</div>
              <div className="text-lg font-bold text-gray-800">12</div>
              <div className="text-[10px] text-emerald-500 font-medium mt-1">↑ 20%</div>
            </div>
            <div className="flex flex-col items-center justify-center p-2 border border-blue-50 rounded-lg text-center shadow-sm">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-md mb-2"><FiCheckCircle size={16}/></div>
              <div className="text-[10px] text-gray-500 mb-0.5 font-medium">Patents<br/>Granted</div>
              <div className="text-lg font-bold text-gray-800">5</div>
              <div className="text-[10px] text-emerald-500 font-medium mt-1">↑ 10%</div>
            </div>
            <div className="flex flex-col items-center justify-center p-2 border border-blue-50 rounded-lg text-center shadow-sm col-span-2">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-md mb-2"><FiTrendingUp size={16}/></div>
              <div className="text-[10px] text-gray-500 mb-0.5 font-medium">Research Grants<br/>(Min.)</div>
              <div className="text-lg font-bold text-gray-800">₹ 5.6 Cr</div>
              <div className="text-[10px] text-emerald-500 font-medium mt-1">↑ 18%</div>
            </div>
          </div>
        </WidgetBlock>

        {/* Student Support */}
        <WidgetBlock title="Student Support & Progression" className="flex flex-col">
          <div className="flex flex-col justify-between flex-grow space-y-3 px-2 py-1">
            {[
              { icon: <FiUsers/>, label: 'Placements', val: '82.6%', color: 'text-slate-500 bg-slate-100' },
              { icon: <FiBookOpen/>, label: 'Higher Studies', val: '14.3%', color: 'text-slate-500 bg-slate-100' },
              { icon: <FiActivity/>, label: 'Entrepreneurship', val: '3.1%', color: 'text-slate-500 bg-slate-100' },
              { icon: <FiAward/>, label: 'Competitive Exams', val: '6.8%', color: 'text-slate-500 bg-slate-100' }
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={'p-1.5 rounded bg-slate-100 text-slate-600'}>
                    {React.cloneElement(item.icon, { size: 12 })}
                  </div>
                  <span className="text-xs font-medium text-slate-600">{item.label}</span>
                </div>
                <span className="font-semibold text-slate-800 text-sm">{item.val}</span>
              </div>
            ))}
          </div>
        </WidgetBlock>

        {/* Infrastructure Adequacy */}
        <WidgetBlock title="Infrastructure Adequacy" className="flex flex-col">
          <div className="flex flex-col items-center justify-center flex-grow w-full pt-4">
            <div className="w-full h-[140px] relative mt-2 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={infraData} cx="50%" cy="100%" startAngle={180} endAngle={0} 
                    innerRadius={75} outerRadius={105} paddingAngle={0} dataKey="value" stroke="none"
                  >
                    {infraData.map((entry, index) => (
                      <Cell key={'cell-'+index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Gauge needle center dot */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-slate-800 rounded-full z-20"></div>
              {/* Gauge pointer */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-[90px] bg-slate-800 rounded-t-full z-10 origin-bottom" style={{transform: 'rotate(60deg)'}}></div>

              {/* Value display */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <span className="text-3xl font-extrabold text-slate-800 bg-white/70 px-2 rounded-md">4.28</span>
                <span className="text-xs text-slate-500 font-semibold absolute -bottom-5">Out of 5</span>
              </div>
              
              {/* Labels */}
              <div className="absolute bottom-0 left-[15%] text-sm font-bold text-slate-600">1</div>
              <div className="absolute bottom-0 right-[15%] text-sm font-bold text-slate-600">5</div>
            </div>
          </div>
        </WidgetBlock>
      </div>

      {/* Lowest Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* APAR Progress */}
        <WidgetBlock title="APAR Progress" className="lg:col-span-2">
          <div className="flex items-start justify-between px-2 sm:px-6 h-[120px] relative py-6">
            {/* Background line */}
            <div className="absolute top-[34px] left-[10%] right-[10%] h-1 bg-gray-200 z-0"></div>
            <div className="absolute top-[34px] left-[10%] w-[60%] h-1 bg-emerald-500 z-0"></div>

            {[
              { label: 'Data Collection', status: 'Completed', icon: <FiCheck/>, color: 'bg-emerald-500 text-white border-2 border-emerald-500', textCol: 'text-emerald-500' },
              { label: 'Data Validation', status: 'Completed', icon: <FiCheck/>, color: 'bg-emerald-500 text-white border-2 border-emerald-500', textCol: 'text-emerald-500' },
              { label: 'Report Drafting', status: 'Completed', icon: <FiCheck/>, color: 'bg-emerald-500 text-white border-2 border-emerald-500', textCol: 'text-emerald-500' },
              { label: 'Final Review', status: 'In Progress', icon: <span className="font-bold text-sm">4</span>, color: 'bg-blue-500 text-white shadow-[0_0_0_3px_#bfdbfe]', textCol: 'text-blue-500' },
              { label: 'Submitted', status: 'Pending', icon: <FiFileText/>, color: 'bg-slate-200 text-slate-400 border-2 border-slate-200', textCol: 'text-slate-400' }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center z-10 w-24">
                <div className={'w-6 h-6 rounded-full flex items-center justify-center mb-2 ' + step.color}>
                  {React.cloneElement(step.icon, { size: 12 })}
                </div>
                <div className="text-[11px] font-semibold text-slate-700 text-center leading-tight mb-1">{step.label}</div>
                <div className={'text-[10px] bg-white ' + step.textCol}>{step.status}</div>
              </div>
            ))}
          </div>
        </WidgetBlock>

        {/* Recent Activities */}
        <WidgetBlock title="Recent Activities">
          <div className="flex flex-col justify-center space-y-4 h-[120px] pt-1">
            {[
              { title: 'Workshop on NAAC Assessment & Accreditation', date: '20 Jan 2026', icon: <FiActivity/>, color: 'bg-purple-100 text-purple-600' },
              { title: 'Student Satisfaction Survey Completed', date: '15 Jan 2026', icon: <FiCheckCircle/>, color: 'bg-emerald-100 text-emerald-600' },
              { title: 'IQAC Meeting Held', date: '10 Jan 2026', icon: <FiCalendar/>, color: 'bg-orange-100 text-orange-600' },
              { title: 'Best Practice Documented', date: '05 Jan 2026', icon: <FiBookOpen/>, color: 'bg-blue-100 text-blue-600' }
            ].map((act, i) => (
               <div key={i} className="flex items-center gap-3">
                 <div className={'p-1.5 rounded text-xs ' + act.color}>
                   {React.cloneElement(act.icon, { size: 12 })}
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="text-[11px] font-medium text-slate-700 truncate" title={act.title}>{act.title}</h4>
                 </div>
                 <div className="text-[10px] text-slate-400 whitespace-nowrap">{act.date}</div>
               </div>
            ))}
          </div>
        </WidgetBlock>
      </div>

      {/* Quick Actions (Data Management / Form Access) */}
      <div className="mt-8 mb-4 flex items-center justify-between">
         <h2 className="text-base font-semibold text-gray-800">Quick Form Actions</h2>
      </div>
      {quickActions.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {quickActions.map((resource) => (
            <QuickLink
              key={resource.id}
              to={resource.addPath}
              icon={<resource.icon />}
              label={resource.addLabel}
            />
          ))}
        </div>
      ) : (
        <div className="rounded border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
          No quick actions available.
        </div>
      )}
    </div>
  );
}