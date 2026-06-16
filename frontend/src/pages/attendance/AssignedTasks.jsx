import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Building2, Users, Info, Clock, CheckCircle2, ChevronDown, ChevronUp, User, LayoutGrid, X, Play, Download } from 'lucide-react';
import { fetchJobs, fetchShortlistedCandidates } from '../../api/jobsApi';
import { fetchEmployees } from '../../api/employeesApi';

const AssignedTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [recruiterTasks, setRecruiterTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employeeIdMap, setEmployeeIdMap] = useState({});
  const [pipelineStats, setPipelineStats] = useState({
    shortlisted: 0,
    interviewing: 0,
    candidateApproved: 0
  });
  const [expandedRecruiters, setExpandedRecruiters] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalCandidates, setModalCandidates] = useState([]);

  const employee = JSON.parse(localStorage.getItem('employee_data') || '{}');
  const employeeName = employee.name || '';

  const isManager = (emp) => {
    if (!emp) return false;
    const nameNormalized = (emp.name || '').toLowerCase().trim();
    if (nameNormalized === 'sunmeet singh') return true;
    const designation = emp.designation || '';
    const normalized = designation.toLowerCase().trim().replace(/[\s\.-]+/g, '');
    return ['teamlead', 'assistantmanager', 'asstmanager', 'manager', 'seniormanager', 'srmanager', 'director'].includes(normalized);
  };

  const managerMode = isManager(employee);

  const completedRequirementsCount = tasks.filter(job => {
    const currentOpen = job.requirements
      ? job.requirements.reduce((sum, r) => sum + (r.number_of_open_positions || 0), 0)
      : job.numberOfCandidates || 0;
    return currentOpen === 0;
  }).length;

  const assignedRequirementsCount = tasks.length - completedRequirementsCount;

  const toggleExpand = (name) => {
    setExpandedRecruiters(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const openCandidatesModal = (title, candidates, type) => {
    const filtered = candidates.filter(cand => {
      const status = (cand.status || '').trim().toLowerCase();
      if (type === 'shortlisted') {
        return ['shortlisted', 'shortlist', 'matched', 'interview scheduled', 'interview selected', 'interview completed', 'interviewing', 'interview rejected', 'candidate approved', 'selected', 'joined', 'candidate rejected'].includes(status);
      } else if (type === 'interviewing') {
        return ['interview scheduled', 'interview selected', 'interview completed', 'interviewing', 'interview rejected', 'candidate approved', 'selected', 'joined'].includes(status);
      } else if (type === 'approved') {
        return ['candidate approved', 'selected', 'joined'].includes(status);
      }
      return false;
    });
    setModalCandidates(filtered);
    setModalTitle(title);
    setModalOpen(true);
  };



  const handleExportManagerExcel = () => {
    if (!recruiterTasks || recruiterTasks.length === 0) return;

    // Define CSV headers representing Excel export
    const headers = [
      'Employee ID',
      'Employee Name',
      'Organisation Name',
      'Job ID',
      'Job Name',
      'Total Open Positions',
      'Filled Positions'
    ];

    // Build rows
    const rows = [];
    recruiterTasks.forEach(rec => {
      const recNameLower = (rec.name || '').trim().toLowerCase();
      const empId = employeeIdMap[recNameLower] || '—';
      const empName = rec.name;

      rec.jobs.forEach(job => {
        const orgName = job.companyName || '—';
        const jobId = job.jobCode || `JOB${job.id}`;
        const jobName = job.jobTitle || '—';
        
        const currentOpen = job.requirements
          ? job.requirements.reduce((sum, r) => sum + (r.number_of_open_positions || 0), 0)
          : job.numberOfCandidates || 0;
          
        const filled = job.stats?.joined || 0;

        rows.push([
          empId,
          empName,
          orgName,
          jobId,
          jobName,
          currentOpen,
          filled
        ]);
      });
    });

    // Construct CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(value => {
        const stringVal = String(value || '');
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      }).join(','))
    ].join('\n');

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'recruiter_assignments_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchAssignedTasks = async () => {
    if (!employeeName) return;
    setLoading(true);
    setError('');
    try {
      if (managerMode) {
        // Fetch all employees to map recruiter names to employee IDs
        let empMap = {};
        try {
          const empRes = await fetchEmployees();
          const emps = empRes.data || [];
          emps.forEach(emp => {
            const fullName = `${emp.firstName} ${emp.lastName}`.trim().toLowerCase();
            empMap[fullName] = emp.employeeId;
          });
          setEmployeeIdMap(empMap);
        } catch (err) {
          console.error("Failed to fetch employees for lookup:", err);
        }

        // Manager Mode: Fetch jobs created by this manager
        const res = await fetchJobs({ createdBy: employeeName });
        const jobs = res.data || [];
        
        // Group jobs by recruiter (assignedTo)
        const recruiterGroups = {};
        jobs.forEach(job => {
          const recruiter = (job.assignedTo || '').trim();
          if (!recruiter) return;
          if (!recruiterGroups[recruiter]) {
            recruiterGroups[recruiter] = {
              name: recruiter,
              jobs: [],
              stats: {
                shortlisted: 0,
                interviewing: 0,
                candidateApproved: 0
              }
            };
          }
          recruiterGroups[recruiter].jobs.push(job);
        });

        const recruiterList = Object.values(recruiterGroups);

        // Fetch and aggregate candidate stats for each recruiter
        await Promise.all(recruiterList.map(async (rec) => {
          let totalShortlisted = 0;
          let totalInterviewing = 0;
          let totalApproved = 0;
          let recruiterCandidates = [];

          await Promise.all(rec.jobs.map(async (job) => {
            try {
              const candRes = await fetchShortlistedCandidates(job.id);
              const candidates = candRes.data || [];
              candidates.forEach(cand => {
                const candWithJob = {
                  ...cand,
                  jobId: job.id,
                  jobCode: job.jobCode,
                  companyName: job.companyName,
                  jobTitle: job.jobTitle
                };
                recruiterCandidates.push(candWithJob);

                const status = (cand.status || '').trim().toLowerCase();
                if (['shortlisted', 'shortlist', 'matched', 'interview scheduled', 'interview selected', 'interview completed', 'interviewing', 'interview rejected', 'candidate approved', 'selected', 'joined', 'candidate rejected'].includes(status)) {
                  totalShortlisted++;
                }
                if (['interview scheduled', 'interview selected', 'interview completed', 'interviewing', 'interview rejected', 'candidate approved', 'selected', 'joined'].includes(status)) {
                  totalInterviewing++;
                }
                if (['candidate approved', 'selected', 'joined'].includes(status)) {
                  totalApproved++;
                }
              });
            } catch (err) {
              console.error(`Failed to fetch candidates for job ${job.id}:`, err);
            }
          }));

          rec.stats = {
            shortlisted: totalShortlisted,
            interviewing: totalInterviewing,
            candidateApproved: totalApproved
          };
          rec.candidatesList = recruiterCandidates;
        }));

        setRecruiterTasks(recruiterList);
      } else {
        // Recruiter Mode: Fetch jobs assigned to this recruiter
        const res = await fetchJobs({ assignedTo: employeeName });
        const jobsList = res.data || [];

        let totalShortlisted = 0;
        let totalInterviewing = 0;
        let totalApproved = 0;

        const jobsWithStats = await Promise.all(jobsList.map(async (job) => {
          let jobShortlisted = 0;
          let jobInterviewing = 0;
          let jobApproved = 0;
          let jobJoined = 0;
          let jobCandidates = [];
          try {
            const candRes = await fetchShortlistedCandidates(job.id);
            const candidates = candRes.data || [];
            jobCandidates = candidates.map(cand => ({
              ...cand,
              jobId: job.id,
              jobCode: job.jobCode,
              companyName: job.companyName,
              jobTitle: job.jobTitle
            }));
            jobCandidates.forEach(cand => {
              const status = (cand.status || '').trim().toLowerCase();
              if (['shortlisted', 'shortlist', 'matched', 'interview scheduled', 'interview selected', 'interview completed', 'interviewing', 'interview rejected', 'candidate approved', 'selected', 'joined', 'candidate rejected'].includes(status)) {
                jobShortlisted++;
                totalShortlisted++;
              }
              if (['interview scheduled', 'interview selected', 'interview completed', 'interviewing', 'interview rejected', 'candidate approved', 'selected', 'joined'].includes(status)) {
                jobInterviewing++;
                totalInterviewing++;
              }
              if (['candidate approved', 'selected', 'joined'].includes(status)) {
                jobApproved++;
                totalApproved++;
              }
              if (status === 'joined') {
                jobJoined++;
              }
            });
          } catch (err) {
            console.error(`Failed to fetch candidates for job ${job.id}:`, err);
          }
          return {
            ...job,
            candidatesList: jobCandidates,
            stats: {
              shortlisted: jobShortlisted,
              interviewing: jobInterviewing,
              candidateApproved: jobApproved,
              joined: jobJoined
            }
          };
        }));

        setTasks(jobsWithStats);
        setPipelineStats({
          shortlisted: totalShortlisted,
          interviewing: totalInterviewing,
          candidateApproved: totalApproved
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch assigned tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedTasks();
  }, [employeeName, managerMode]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 animate-slide-down shadow-sm">
          <Info className="text-rose-500 shrink-0" size={20} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Recruiter View (Non-Manager) */}
      {!managerMode && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Assigned Job Requirements</p>
                <p className="text-2xl font-black text-blue-600">{assignedRequirementsCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-500">
                <Briefcase size={20} />
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Completed Job Requirements</p>
                <p className="text-2xl font-black text-emerald-600">{completedRequirementsCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-500">
                <CheckCircle2 size={20} />
              </div>
            </div>
          </div>

          {/* Candidate Pipeline Cards (Visible when not loading) */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Shortlisted', val: pipelineStats.shortlisted, color: 'purple', icon: Users, type: 'shortlisted' },
                { label: 'Interview Selected', val: pipelineStats.interviewing, color: 'indigo', icon: Clock, type: 'interviewing' },
                { label: 'Candidate Approved', val: pipelineStats.candidateApproved, color: 'emerald', icon: CheckCircle2, type: 'approved' },
              ].map(item => (
                <div 
                  key={item.label} 
                  onClick={() => openCandidatesModal(`${item.label} Candidates`, tasks.flatMap(j => j.candidatesList || []), item.type)}
                  className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200 active:scale-[0.98]"
                >
                  <div className="space-y-1">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{item.label}</p>
                    <p className={`text-2xl font-black text-${item.color}-600`}>{item.val}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-${item.color}-50 text-${item.color}-500`}>
                    <item.icon size={20} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading / Empty State */}
          {loading ? (
            <div className="bg-white p-12 rounded-xl border border-gray-100 flex flex-col items-center justify-center gap-2 shadow-sm min-h-[250px]">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-bold text-gray-400">Loading your tasks...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-gray-100 text-center shadow-sm">
              <Briefcase className="mx-auto text-gray-300 mb-3" size={36} />
              <p className="text-gray-700 font-bold text-base">No Assigned Jobs Found</p>
              <p className="text-gray-400 text-xs mt-1">There are no job requirements assigned to you matching your criteria.</p>
            </div>
          ) : (
            /* Assigned Jobs List for Recruiter */
            <div className="space-y-4 mt-6 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Briefcase className="text-blue-600" size={20} />
                My Job Tasks
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tasks.map((job) => {
                  const currentOpen = job.requirements
                    ? job.requirements.reduce((sum, r) => sum + (r.number_of_open_positions || 0), 0)
                    : job.numberOfCandidates || 0;
                  const joined = job.stats?.joined || 0;
                  const isCompleted = currentOpen === 0;

                  return (
                    <div key={job.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                      <div className="p-5 border-b border-gray-50 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-gray-800 text-base">{job.jobTitle}</h4>
                          <p className="text-xs text-gray-400 font-semibold mt-1 flex items-center gap-1.5">
                            <Building2 size={13} />
                            {job.companyName}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-100 font-semibold">
                            {job.jobCode}
                          </span>
                          {isCompleted && (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-5 bg-gray-50/50 grid grid-cols-3 gap-2 text-center border-b border-gray-50">
                        {[
                          { label: 'Shortlisted', val: job.stats?.shortlisted || 0, color: 'purple', type: 'shortlisted' },
                          { label: 'Interview Selected', val: job.stats?.interviewing || 0, color: 'indigo', type: 'interviewing' },
                          { label: 'Candidate Approved', val: job.stats?.candidateApproved || 0, color: 'emerald', type: 'approved' },
                        ].map(stat => (
                          <div 
                            key={stat.label} 
                            onClick={() => openCandidatesModal(`${stat.label} Candidates for ${job.jobTitle}`, job.candidatesList || [], stat.type)}
                            className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-2xs flex flex-col items-center cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200 active:scale-[0.98]"
                          >
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{stat.label}</span>
                            <span className={`text-lg font-black text-${stat.color}-600`}>{stat.val}</span>
                          </div>
                        ))}
                      </div>

                      <div className="p-5 space-y-2.5 bg-white text-xs text-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 font-semibold">Total Open Positions:</span>
                          <span className="font-bold text-gray-800">{currentOpen} Positions</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 font-semibold">Filled Positions:</span>
                          <span className="font-bold text-emerald-600">{joined} Joined</span>
                        </div>
                        {job.experience && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-semibold">Experience Required:</span>
                            <span className="font-medium text-gray-800">{job.experience}</span>
                          </div>
                        )}
                        {job.mandatorySkill && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-semibold">Core Skill:</span>
                            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px]">{job.mandatorySkill}</span>
                          </div>
                        )}
                        {job.createdBy && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-semibold">Assigned By:</span>
                            <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] border border-indigo-100">{job.createdBy}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-5 pt-0">
                        <button
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98]"
                        >
                          <Play size={12} fill="currentColor" />
                          Start Task
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Manager View (TL & Above) */}
      {managerMode && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Recruiter Assignments & History</h2>
              <p className="text-sm text-gray-500">Track pipeline status of employees you assigned jobs to.</p>
            </div>
            <div className="flex items-center gap-3">
              {recruiterTasks.length > 0 && (
                <button
                  onClick={handleExportManagerExcel}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-[0.98]"
                >
                  <Download size={14} />
                  Export Excel
                </button>
              )}
              <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-blue-100">
                <LayoutGrid size={14} />
                <span>{recruiterTasks.length} Assigned Recruiters</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white p-12 rounded-xl border border-gray-100 flex flex-col items-center justify-center gap-2 shadow-sm min-h-[250px]">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-bold text-gray-400">Loading recruiter pipelines...</span>
            </div>
          ) : recruiterTasks.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-gray-100 text-center shadow-sm">
              <Briefcase className="mx-auto text-gray-300 mb-3" size={36} />
              <p className="text-gray-700 font-bold text-base">No Assigned Jobs Found</p>
              <p className="text-gray-400 text-xs mt-1">You have not assigned any jobs to recruiters yet, or they have no active jobs.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recruiterTasks.map((rec) => {
                const isExpanded = !!expandedRecruiters[rec.name];
                return (
                  <div key={rec.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in hover:shadow-md transition-shadow">
                    
                    {/* Recruiter Card Header */}
                    <div className="p-5 flex items-center justify-between border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold">
                          <User size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-base">{rec.name}</h3>
                          <span className="text-xs text-gray-400 font-medium">{rec.jobs.length} Job{rec.jobs.length !== 1 ? 's' : ''} Assigned</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleExpand(rec.name)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <span>{isExpanded ? 'Hide Assigned Jobs' : 'View Assigned Jobs'}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>

                    <div className="p-5 bg-gray-50/50 grid grid-cols-3 gap-2 text-center border-b border-gray-50">
                      {[
                        { label: 'Shortlisted', val: rec.stats.shortlisted, color: 'purple', icon: Users, type: 'shortlisted' },
                        { label: 'Interview Selected', val: rec.stats.interviewing, color: 'indigo', icon: Clock, type: 'interviewing' },
                        { label: 'Candidate Approved', val: rec.stats.candidateApproved, color: 'emerald', icon: CheckCircle2, type: 'approved' },
                      ].map(stat => (
                        <div 
                          key={stat.label} 
                          onClick={() => openCandidatesModal(`${stat.label} Candidates for ${rec.name}`, rec.candidatesList || [], stat.type)}
                          className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs flex flex-col items-center cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200 active:scale-[0.98]"
                        >
                          <span className="text-xs text-gray-400 font-medium mb-1 truncate max-w-full">{stat.label}</span>
                          <span className={`text-xl font-black text-${stat.color}-600`}>{stat.val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Expandable Assigned Jobs List */}
                    {isExpanded && (
                      <div className="p-5 space-y-3 border-t border-gray-50 bg-white animate-slide-down">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Assigned Jobs Details</p>
                        <div className="space-y-3">
                          {rec.jobs.map(job => (
                            <div key={job.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-mono text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                  {job.jobCode}
                                </span>
                                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-100">
                                  {job.numberOfCandidates || 0} Open Position{job.numberOfCandidates !== 1 ? 's' : ''}
                                </span>
                              </div>
                              
                              <div className="flex flex-col">
                                <span className="font-extrabold text-gray-800 text-sm">{job.jobTitle}</span>
                                <span className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1">
                                  <Building2 size={12} className="text-gray-400" />
                                  {job.companyName}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Candidate List Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-800 text-base">{modalTitle}</h3>
                  <p className="text-xs text-gray-400 font-semibold">{modalCandidates.length} Candidate{modalCandidates.length !== 1 ? 's' : ''} found</p>
                </div>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {modalCandidates.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto text-gray-300 mb-3" size={36} />
                  <p className="text-gray-700 font-bold text-sm">No Candidates Found</p>
                  <p className="text-gray-400 text-xs mt-1">There are no candidates in this stage of the pipeline.</p>
                </div>
              ) : (
                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                        <th className="p-3">Candidate ID</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Job ID</th>
                        <th className="p-3">Organisation</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-600">
                      {modalCandidates.map((cand) => {
                        const isJoined = (cand.status || '').trim().toLowerCase() === 'joined';
                        return (
                          <tr key={cand.mapping_id} className={`hover:bg-gray-50/50 transition-colors ${isJoined ? 'opacity-45 grayscale bg-gray-50/50' : ''}`}>
                            <td className="p-3 font-mono font-semibold text-gray-800">
                              {cand.candidate_code || `CID${String(cand.candidate_id).padStart(4, '0')}`}
                            </td>
                            <td className="p-3 font-bold text-gray-700">{cand.name}</td>
                            <td className="p-3">
                              <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-semibold">
                                {cand.jobCode || `JOB${cand.jobId}`}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-gray-500">{cand.companyName || '—'}</td>
                            <td className="p-3">
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                cand.status.toLowerCase().includes('joined') 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : cand.status.toLowerCase().includes('approve')
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : cand.status.toLowerCase().includes('interview')
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                  : 'bg-purple-50 text-purple-700 border border-purple-100'
                              }`}>
                                {cand.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-800 text-white font-bold text-xs rounded-xl hover:bg-gray-900 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedTasks;
