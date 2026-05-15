import React, { useState } from 'react';
import { FiArrowLeft, FiUploadCloud, FiBookOpen, FiUserCheck, FiTarget, FiLoader } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import { feedbackService } from '../services/feedback.service.js';
import { toast } from 'sonner';

const ANALYSIS_TYPES = {
    FACULTY: {
        id: 'faculty',
        title: 'Faculty Feedback',
        description: 'Analyze student feedback on faculty performance, teaching methodology, and interaction.',
        icon: FiUserCheck,
        color: 'indigo'
    },
    COURSE: {
        id: 'course',
        title: 'Course Feedback',
        description: 'Evaluate insights on course content, difficulty, and relevance from student surveys.',
        icon: FiBookOpen,
        color: 'emerald'
    },
    PROGRAM: {
        id: 'program',
        title: 'Program Feedback',
        description: 'Assess overall degree program satisfaction from alumni, employers, and students.',
        icon: FiTarget,
        color: 'purple'
    }
};

export default function FeedbackAnalysis() {
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleAnalyze = async () => {
        if (!file) {
            toast.error('Please select a file first');
            return;
        }

        setLoading(true);
        setAnalysisResult(null);

        try {
            let response;
            if (selectedType === 'faculty') {
                response = await feedbackService.analyzeFacultyFeedback(file);
            } else if (selectedType === 'course') {
                response = await feedbackService.analyzeCourseFeedback(file);
            } else if (selectedType === 'program') {
                response = await feedbackService.analyzeProgramFeedback(file);
            }

            if (response && response.analysis) {
                setAnalysisResult(response.analysis);
                toast.success('Analysis completed successfully');
            }
        } catch (error) {
            console.error('Analysis failed:', error);
            // Error handling is partly done by the global interceptor, but we can show specific message
            toast.error('Failed to analyze feedback. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetSelection = () => {
        setSelectedType(null);
        setFile(null);
        setAnalysisResult(null);
    };



    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12 relative">
            <div className="absolute top-4 left-4 z-20">
                <button
                    onClick={() => selectedType ? resetSelection() : navigate('/')}
                    className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors bg-white px-3 py-2 rounded-md shadow-sm border border-gray-200"
                >
                    <span className="mr-1">←</span> {selectedType ? 'Back to Selection' : 'Back to Home'}
                </button>
            </div>
            
            <div className="max-w-7xl mx-auto pt-8">
                <header className="mb-10 text-center">
                    <img src="/dtu_logo.jpeg" alt="DTU Logo" className="h-20 w-auto object-contain mx-auto mb-6" />
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                        {selectedType ? ANALYSIS_TYPES[selectedType.toUpperCase()].title : 'Feedback Analysis'}
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">
                        {selectedType
                            ? 'Upload your data file to generate AI-powered insights.'
                            : 'Select a category to begin your analysis using advanced AI algorithms.'}
                    </p>
                </header>

                {!selectedType ? (
                    <div className="grid gap-8 md:grid-cols-3">
                        {Object.values(ANALYSIS_TYPES).map((type) => {
                            const Icon = type.icon;
                            // Dynamic color classes need to be safe-listed or standard tailwind classes
                            // Using standard colors mapping for simplicity
                            const colorClasses = {
                                indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
                                emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
                                purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
                            };

                            return (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedType(type.id)}
                                    className="group flex flex-col p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left"
                                >
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${colorClasses[type.color]}`}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{type.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {type.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
                        {/* Upload Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                                    <FiUploadCloud />
                                </div>
                                Upload Data
                            </h3>

                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:bg-gray-50 transition-colors relative">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center pointer-events-none">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${file ? 'bg-green-100' : 'bg-gray-100'}`}>
                                        <FiUploadCloud className={`w-8 h-8 ${file ? 'text-green-600' : 'text-gray-400'}`} />
                                    </div>
                                    <p className="text-xl font-semibold text-gray-900 mb-2">
                                        {file ? file.name : 'Drop your Excel/CSV file here'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {file ? 'Click to change file' : 'or click to browse supported formats (.xlsx, .xls, .csv)'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={!file || loading}
                                className={`mt-8 w-full flex items-center justify-center py-4 px-6 rounded-xl text-white font-bold text-lg tracking-wide transition-all shadow-md transform hover:scale-[1.01]
                                    ${!file || loading
                                        ? 'bg-gray-300 cursor-not-allowed shadow-none hover:scale-100'
                                        : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-200'}`}
                            >
                                {loading ? (
                                    <>
                                        <FiLoader className="animate-spin mr-3 w-6 h-6" />
                                        Analyzing Data...
                                    </>
                                ) : (
                                    'Run AI Analysis'
                                )}
                            </button>

                            {/* Info Note */}
                            <div className="mt-6 flex items-start p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <FiBookOpen className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                                <p className="text-sm text-blue-800">
                                    <strong>Tip:</strong> Ensure your Excel file has clear column headers. Our AI looks for patterns, sentiment, and key insights to generate the report.
                                </p>
                            </div>
                        </div>

                        {/* Results Section */}
                        {analysisResult && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
                                <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200 flex items-center justify-between">
                                    <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                                        <FiTarget className="mr-3 text-indigo-600" />
                                        Analysis Report
                                    </h3>
                                    <span className="px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold uppercase tracking-wide border border-indigo-200">
                                        AI Generated
                                    </span>
                                </div>
                                <div className="p-8 md:p-10">
                                    <div className="prose max-w-none text-gray-800">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h1: ({ node, ...props }) => <h1 className="text-3xl font-extrabold text-gray-900 border-b-2 border-indigo-100 pb-3 mb-6 mt-8 first:mt-0" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-indigo-500 pl-4 mb-5 mt-8 bg-gray-50 py-2 rounded-r-lg" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-indigo-900 mb-4 mt-6" {...props} />,
                                                h4: ({ node, ...props }) => <h4 className="text-lg font-bold text-gray-700 mb-3 mt-4" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-4 text-gray-700 text-lg leading-relaxed" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700 text-lg" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-6 space-y-2 text-gray-700 text-lg" {...props} />,
                                                li: ({ node, ...props }) => <li className="pl-2" {...props} />,
                                                table: ({ node, ...props }) => (
                                                    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm my-8">
                                                        <table className="min-w-full divide-y divide-gray-200" {...props} />
                                                    </div>
                                                ),
                                                thead: ({ node, ...props }) => <thead className="bg-indigo-50 text-indigo-900" {...props} />,
                                                tbody: ({ node, ...props }) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
                                                tr: ({ node, ...props }) => <tr className="hover:bg-gray-50 transition-colors group" {...props} />,
                                                th: ({ node, ...props }) => <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider text-indigo-800 border-r border-indigo-100 last:border-r-0" {...props} />,
                                                td: ({ node, children, ...props }) => <td className="px-6 py-4 text-sm text-gray-700 border-r border-gray-100 last:border-r-0 leading-relaxed font-medium group-hover:text-gray-900" {...props} >{children}</td>,
                                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-300 bg-indigo-50/50 py-4 px-6 rounded-r-xl italic text-gray-700 my-6" {...props} />,
                                                code: ({ node, inline, ...props }) => inline
                                                    ? <code className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono font-bold" {...props} />
                                                    : <pre className="bg-gray-900 text-white p-4 rounded-xl overflow-x-auto my-6 shadow-inner"><code {...props} /></pre>,
                                                strong: ({ node, ...props }) => <strong className="font-extrabold text-gray-900" {...props} />,
                                                em: ({ node, ...props }) => <em className="text-gray-800 italic" {...props} />
                                            }}
                                        >
                                            {analysisResult}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
