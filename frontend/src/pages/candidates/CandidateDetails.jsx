import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCandidateById } from '../../api/candidatesApi';
import { Mail, Phone, MapPin, Building2, GraduationCap, Briefcase, FileText, ChevronLeft, IndianRupee, Clock, Zap } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

const DetailItem = ({ icon: Icon, label, value, iconColor = "text-gray-600" }) => (
  <div className="flex items-center gap-4 group p-2 rounded-xl hover:bg-gray-50/50 transition-all duration-200">
    <div className={`w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center ${iconColor} shadow-sm group-hover:scale-110 transition-transform`}>
      <Icon size={20} strokeWidth={2.5} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-1">
        {label}
      </p>
      <p className="text-[14px] text-gray-900 break-words font-semibold leading-tight tracking-tight">
        {value || '—'}
      </p>
    </div>
  </div>
);

const SectionHeader = ({ title, icon: Icon, color = "bg-blue-500" }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className={`w-2 h-6 ${color} rounded-full shadow-sm`}></div>
    <div className="flex items-center gap-2">
      {Icon && <Icon size={16} className="text-gray-400" />}
      <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-[0.2em] opacity-95">
        {title}
      </h3>
    </div>
  </div>
);

const CandidateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCandidate = async () => {
      try {
        setLoading(true);
        const { data } = await fetchCandidateById(id);
        setCandidate(data);


      } catch (error) {
        console.error('Failed to load candidate details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadCandidate();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 h-full bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-xl max-w-lg mx-auto my-20">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Zap size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Candidate Not Found</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">The candidate profile you are looking for might have been moved or removed from our records.</p>
        <Button onClick={() => navigate('/candidates')} className="w-full py-4 rounded-2xl shadow-lg">
          Back to Talent Pool
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 flex-1 overflow-y-auto bg-gray-50/40">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-5 md:p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate('/candidates')}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                {candidate.firstName} {candidate.lastName}
              </h1>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-blue-100/50">
                {candidate.candidateCode}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                <Clock size={14} className="text-gray-400" />
                <span>Applied on {candidate.appliedDate || '—'}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block"></div>
              <Badge color="purple" label={candidate.businessCategory || 'IT'} className="font-bold py-1 px-3" />
              

            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8 items-start">
        {/* Left Column: Personal & Resume (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Personal Details Card */}
          <div className="bg-white rounded-[2rem] p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <SectionHeader title="Personal Details" color="bg-blue-500" />
            <div className="space-y-3">
              <DetailItem icon={Mail} label="Email Address" value={candidate.email} iconColor="text-blue-600" />
              <DetailItem icon={Phone} label="Contact Number" value={`${candidate.countryCode} ${candidate.phone}`} iconColor="text-indigo-600" />
              <DetailItem icon={MapPin} label="Current Residence" value={candidate.currentLocation} iconColor="text-rose-600" />
            </div>
          </div>

          {/* Resume Card - Balanced and Compact */}
          <div className="bg-white rounded-[2rem] p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <SectionHeader title="Resume" color="bg-emerald-500" />
            <div className="p-5 rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center text-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-sm ${candidate.resumeUrl ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-300'}`}>
                <FileText size={28} />
              </div>
              <p 
                className="text-sm font-bold text-gray-900 mb-1 max-w-[180px] truncate cursor-help"
                title={candidate.resumeFileName || 'No resume uploaded'}
              >
                {candidate.resumeFileName || 'No resume uploaded'}
              </p>
              {candidate.resumeUrl ? (
                <button 
                  onClick={() => window.open(`http://localhost:8000${candidate.resumeUrl}`, '_blank')}
                  className="mt-3 px-6 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95"
                >
                  View File
                </button>
              ) : (
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-2">Awaiting Upload</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Professional Experience (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2rem] p-7 md:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <SectionHeader title="Professional Summary" color="bg-indigo-500" />
            
            {/* Core Experience Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <DetailItem icon={Building2} label="Current / Last Company" value={candidate.currentCompany} iconColor="text-indigo-600" />
              <DetailItem icon={Briefcase} label="Total Work Experience" value={candidate.totalExperience} iconColor="text-amber-600" />
              <DetailItem icon={GraduationCap} label="Educational Qualification" value={candidate.highestEducation} iconColor="text-purple-600" />
              <DetailItem 
                icon={Zap} 
                label="Relevant Experience" 
                value={candidate.relevantExperience ? `${candidate.relevantExperience} Years` : '—'} 
                iconColor="text-emerald-600"
              />
            </div>

            {/* Skills Tags - Modern Pills */}
            <div className="mb-8 bg-gray-50/40 p-5 rounded-3xl border border-gray-50/50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Skills & Core Expertise
              </p>
              <div className="flex flex-wrap gap-2">
                {(candidate.skills || []).map((skill, idx) => (
                  <span 
                    key={idx} 
                    className="px-4 py-2 rounded-xl bg-white text-blue-700 text-xs font-bold border border-blue-100/50 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-default"
                  >
                    {skill}
                  </span>
                ))}
                {(!candidate.skills || candidate.skills.length === 0) && (
                  <p className="text-sm text-gray-400 italic">No skills listed</p>
                )}
              </div>
            </div>

            {/* Detailed Skill Breakout */}
            {candidate.relevantExperienceBySkill && candidate.relevantExperienceBySkill.length > 0 && (
              <div className="mb-8 p-5 rounded-3xl border border-gray-50 bg-white shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Skill-wise Experience
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {candidate.relevantExperienceBySkill.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-gray-50/30 hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-bold text-gray-800 truncate pr-2">{item.skill}</span>
                      <span className="text-[11px] font-black text-blue-600 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100/30 whitespace-nowrap shadow-sm">
                        {item.experience}Y
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compensation & Notice - Balanced Grid */}
            <div className="bg-gray-900 rounded-[2rem] p-7 md:p-8 text-white grid grid-cols-1 sm:grid-cols-3 gap-6 relative overflow-hidden shadow-xl items-center text-center sm:text-left">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-2 flex items-center justify-center sm:justify-start gap-2">
                  <IndianRupee size={12} />
                  Current CTC
                </p>
                <p className="text-2xl font-black">₹{candidate.currentCTC || '0'} <span className="text-[10px] font-bold text-gray-500 uppercase ml-1">LPA</span></p>
              </div>
              <div className="relative z-10 border-t border-b sm:border-t-0 sm:border-b-0 sm:border-l sm:border-r border-gray-800 py-4 sm:py-0 sm:px-6">
                <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mb-2 flex items-center justify-center sm:justify-start gap-2">
                  <Zap size={12} />
                  Expected CTC
                </p>
                <p className="text-2xl font-black">₹{candidate.expectedCTC || '0'} <span className="text-[10px] font-bold text-gray-500 uppercase ml-1">LPA</span></p>
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-amber-300 uppercase tracking-widest mb-2 flex items-center justify-center sm:justify-start gap-2">
                  <Clock size={12} />
                  Notice Period
                </p>
                <div className="inline-block">
                  <Badge color="yellow" label={candidate.noticePeriod || 'Immediate'} className="font-black text-[10px] py-1.5 px-4 tracking-tighter shadow-sm border-amber-500/20" />
                </div>
              </div>
            </div>

            {/* Reason for job change Area */}
            {candidate.reasonForChange && (
              <div className="mt-8 bg-amber-50/20 p-5 rounded-3xl border border-amber-100/30">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Zap size={12} />
                  Career Motivation
                </p>
                <p className="text-sm text-gray-700 leading-relaxed font-medium italic">
                  "{candidate.reasonForChange}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetails;
