import React from 'react';
import { FiCheck, FiClock, FiAlertCircle } from 'react-icons/fi';

const Step = ({ title, status, timestamp, isLast }) => {
    let colorClass = 'bg-gray-200 text-gray-400';
    let icon = <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />;
    let lineColor = 'bg-gray-200';
    let borderColor = 'border-gray-200';

    // Status mapping logic
    if (status === 'completed') {
        colorClass = 'bg-green-100 text-green-700';
        borderColor = 'border-green-200';
        icon = <FiCheck className="w-5 h-5" />;
        lineColor = 'bg-green-500';
    } else if (status === 'query') {
        colorClass = 'bg-yellow-100 text-yellow-700';
        borderColor = 'border-yellow-200';
        icon = <FiAlertCircle className="w-5 h-5" />;
        lineColor = 'bg-yellow-400';
    } else if (status === 'pending') {
        // Blue for "Not Filed" / "Draft"
        colorClass = 'bg-blue-50 text-blue-700';
        borderColor = 'border-blue-200';
        icon = <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />;
        lineColor = 'bg-gray-200'; // Line to next step is gray
    }

    return (
        <li className={`relative flex-1 ${isLast ? '' : 'mb-6 sm:mb-0'}`}>
            {!isLast && (
                <div className="hidden sm:block absolute top-5 left-1/2 w-full h-0.5" aria-hidden="true">
                    <div className={`h-full ${lineColor} transition-colors duration-500`}></div>
                </div>
            )}
            <div className="relative flex flex-col items-center group">
                <span className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${borderColor} ${colorClass} transition-colors duration-300 z-10`}>
                    {icon}
                </span>
                <div className="mt-3 flex flex-col items-center">
                    <h3 className={`text-sm font-semibold ${status === 'disabled' ? 'text-gray-400' : 'text-gray-900'}`}>{title}</h3>
                    {timestamp && (
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                            <FiClock className="mr-1 h-3 w-3" />
                            <time dateTime={timestamp}>{new Date(timestamp).toLocaleString()}</time>
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
};

export default function AparTimeline({ status, timeline }) {
    // logic to determine step statuses
    const getStepStatus = (stepIndex) => {
        // Step 1: Submission
        if (stepIndex === 1) {
            if (['Submitted', 'Verified', 'Reviewed', 'Forwarded by Reporting officer', 'Accepted by Reviewing officer', 'Query Raised', 'Forwarded'].some(s => s === status || (status && status.includes('Forwarded')) || (status && status.includes('Accepted')))) return 'completed';
            if (['Draft', 'Not Filed'].includes(status)) return 'pending'; // or active
            return 'pending';
        }

        // Step 2: Reporting Officer
        if (stepIndex === 2) {
            if (status === 'Draft' || status === 'Not Filed') return 'disabled';
            if (status === 'Submitted') return 'pending'; // Waiting for action
            if (status === 'Query Raised') return 'query'; // Ambiguous if query raised by reporting or reviewing? Usually check timeline.reporting_reviewed_at if present? 
            // If status is 'Forwarded by Reporting officer' or 'Accepted...' -> completed
            if (status && (status.includes('Forwarded') || status.includes('Accepted') || status === 'Verified' || status === 'Reviewed')) return 'completed';
            if (timeline?.reporting_reviewed_at) return 'completed'; // Fallback if status changed later
            return 'disabled';
        }

        // Step 3: Reviewing Officer
        if (stepIndex === 3) {
            if (status && status.includes('Accepted')) return 'completed';
            if (status === 'Forwarded by Reporting officer') return 'pending';
            // If Query from Reviewing?
            if (timeline?.reviewing_reviewed_at) return 'completed';
            return 'disabled';
        }
        return 'disabled';
    };

    const steps = [
        { title: 'Self Appraisal Submitted', status: getStepStatus(1), timestamp: timeline?.submitted_at },
        { title: 'Reporting Officer Assessment', status: getStepStatus(2), timestamp: timeline?.reporting_reviewed_at },
        { title: 'Reviewing Officer Remarks', status: getStepStatus(3), timestamp: timeline?.reviewing_reviewed_at },
    ];

    return (
        <div className="w-full py-6 px-4">
            <ol className="flex items-center w-full justify-between">
                {steps.map((step, index) => (
                    <Step
                        key={index}
                        title={step.title}
                        status={step.status}
                        timestamp={step.timestamp}
                        isLast={index === steps.length - 1}
                    />
                ))}
            </ol>
        </div>
    );
}
