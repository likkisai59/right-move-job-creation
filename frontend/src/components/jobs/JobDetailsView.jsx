import React from 'react';
import { 
  Building2, 
  MapPin, 
  MonitorPlay, 
  Banknote, 
  Briefcase,
  Calendar,
  Clock,
  UserCircle,
  FileText,
  Mail,
  GraduationCap,
  Sparkles,
  Layers
} from 'lucide-react';
import Card from '../common/Card';
import { formatDate } from '../../utils/formatters';

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex gap-3 items-start">
    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value || 'N/A'}</p>
    </div>
  </div>
);

const JobDetailsView = ({ job }) => {
  if (!job) return null;

  const reqs = job.requirements || [];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* ── Global Job Information ── */}
      <Card className="p-6 border border-gray-100 shadow-sm bg-gradient-to-r from-blue-50/50 to-transparent">
        <h2 className="text-sm font-bold text-blue-900 mb-5 flex items-center gap-2 uppercase tracking-wider">
          <Building2 className="w-5 h-5 text-blue-600" />
          Global Job Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <InfoItem icon={Building2} label="Organization / Client" value={job.companyName} />
          <InfoItem icon={Layers} label="Business Unit" value={job.businessUnit} />
          <InfoItem icon={Calendar} label="Requisition Date" value={formatDate(job.date)} />
          <InfoItem icon={UserCircle} label="Internal SPOC" value={job.internalSpoc} />
          <InfoItem icon={UserCircle} label="External SPOC" value={job.externalSpoc} />
          <InfoItem icon={Mail} label="External SPOC Email" value={job.externalSpocEmailId} />
        </div>
      </Card>

      {/* ── Role Specific Requirements ── */}
      <div className="space-y-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-1">
          Role Requirements ({reqs.length})
        </h2>
        
        {reqs.map((req, idx) => (
          <Card key={req.id || idx} className="border border-gray-200 shadow-sm overflow-hidden">
            
            {/* Role Header */}
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{req.job_title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      req.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                      req.status === 'CLOSED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {req.status || 'UNKNOWN'}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                      {req.number_of_open_positions} Openings
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Core Details Column */}
                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Core Details</h4>
                  <div className="space-y-5">
                    <InfoItem icon={Banknote} label="Budget (LPA)" value={req.budget} />
                    <InfoItem icon={MonitorPlay} label="Work Mode" value={req.workMode} />
                    <InfoItem icon={Clock} label="Shifts" value={req.shifts} />
                    <InfoItem icon={MapPin} label="Location" value={req.location} />
                  </div>
                </div>

                {/* Skills & Experience Column */}
                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Skills & Experience</h4>
                  <div className="space-y-5">
                    <InfoItem icon={Sparkles} label="Overall Experience" value={req.experience ? `${req.experience} Years` : null} />
                    <div className="flex gap-4">
                      <div className="flex-1"><InfoItem icon={Sparkles} label="Min Exp" value={req.min_experience ? `${req.min_experience} Yrs` : '0'} /></div>
                      <div className="flex-1"><InfoItem icon={Sparkles} label="Max Exp" value={req.max_experience ? `${req.max_experience} Yrs` : 'N/A'} /></div>
                    </div>
                    <InfoItem icon={Sparkles} label="Mandatory Skill" value={req.mandatorySkill} />
                    <InfoItem icon={Sparkles} label="Required Skills" value={req.required_skills} />
                    <InfoItem icon={GraduationCap} label="Qualification" value={req.qualification} />
                    <InfoItem icon={Calendar} label="Notice Period" value={req.noticePeriod} />
                  </div>
                </div>

                {/* Description Column */}
                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Job Description</h4>
                  
                  {req.jobDescription ? (
                    <a 
                      href={`http://localhost:8000${req.jobDescription}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-indigo-900">View Attachment</p>
                        <p className="text-xs font-medium text-indigo-600">Click to download or open JD</p>
                      </div>
                    </a>
                  ) : (
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center gap-3 text-gray-500">
                      <FileText className="w-5 h-5 opacity-50" />
                      <span className="text-sm font-medium">No description file uploaded.</span>
                    </div>
                  )}

                  {/* If there is text description instead of file, render it too (fallback) */}
                  {job.description && (
                     <div className="mt-4 p-4 rounded-xl bg-gray-50 text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto border border-gray-100">
                       {job.description}
                     </div>
                  )}
                </div>

              </div>
            </div>
          </Card>
        ))}

        {reqs.length === 0 && (
          <div className="text-center p-8 text-gray-500 bg-white rounded-xl border border-gray-200">
            No specific role requirements found for this job.
          </div>
        )}
      </div>

    </div>
  );
};

export default JobDetailsView;
