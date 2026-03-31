import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCandidateById } from '../../api/candidatesApi';
import { Mail, Phone, MapPin, Building2, GraduationCap, Briefcase, FileText, ChevronLeft } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 mt-0.5">
      <Icon size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-sm text-gray-900 break-words font-medium">
        {value || '—'}
      </p>
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
        console.log('Candidate data loaded:', data);
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
      <div className="flex items-center justify-center flex-1 h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-gray-100 m-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Candidate Not Found</h2>
        <p className="text-gray-500 mb-6">The candidate you're looking for was not found or has been removed.</p>
        <Button onClick={() => navigate('/candidates')}>
          Back to Candidates
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto bg-gray-50/30">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/candidates')}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-500 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {candidate.firstName} {candidate.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded leading-none uppercase">
                {candidate.candidateCode}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span className="text-sm text-gray-500">
                Applied on {candidate.appliedDate || '—'}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
                {candidate.businessCategory || 'IT'}
              </span>
              {candidate.mappedJobId && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700">
                    Mapped Job ID: {candidate.mappedJobId}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        {/* Left Column: Personal & Contact */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-50 pb-3 flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
               Personal Details
            </h3>
            <div className="space-y-6">
              <DetailItem icon={Mail} label="Email Address" value={candidate.email} />
              <DetailItem icon={Phone} label="Phone Number" value={`${candidate.countryCode} ${candidate.phone}`} />
              <DetailItem icon={MapPin} label="Current Location" value={candidate.currentLocation} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-50 pb-3 flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
               Resume & Attachments
            </h3>
            <div className="p-4 rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center text-center">
              <FileText size={32} className={`${candidate.resumeUrl ? 'text-blue-500' : 'text-gray-300'} mb-3`} />
              <p className="text-sm font-medium text-gray-900 mb-1 truncate w-full px-2">
                {candidate.resumeFileName || 'No resume uploaded'}
              </p>
              {candidate.resumeUrl && (
                <button 
                  onClick={() => window.open(`http://localhost:8000${candidate.resumeUrl}`, '_blank')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest mt-2 flex items-center gap-1.5"
                >
                  View Resume
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Professional Experience & Others */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-8 border-b border-gray-50 pb-4 flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
               Professional Summary
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 mb-10">
              <DetailItem icon={Building2} label="Current / Last Company" value={candidate.currentCompany} />
              <DetailItem icon={Briefcase} label="Total Experience" value={candidate.totalExperience} />
              <DetailItem icon={GraduationCap} label="Highest Education" value={candidate.highestEducation} />
              <DetailItem 
                icon={Briefcase} 
                label="Relevant Experience" 
                value={candidate.relevantExperience ? `${candidate.relevantExperience} Years` : '—'} 
              />
            </div>

            <div className="mb-10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Skills & Core Expertise</p>
              <div className="flex flex-wrap gap-2.5">
                {(candidate.skills || []).map((skill, idx) => (
                  <span 
                    key={idx} 
                    className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100/50"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {candidate.relevantExperienceBySkill && candidate.relevantExperienceBySkill.length > 0 && (
              <div className="mb-10">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Detailed Skill Experience</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {candidate.relevantExperienceBySkill.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                      <span className="font-semibold text-gray-900">{item.skill}</span>
                      <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                        {item.experience} yr{item.experience > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-50 pt-8">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current CTC</p>
                <p className="text-lg font-bold text-gray-900">₹{candidate.currentCTC || '—'} LPA</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Expected CTC</p>
                <p className="text-lg font-bold text-gray-900">₹{candidate.expectedCTC || '—'} LPA</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Notice Period</p>
                <Badge color="yellow" label={candidate.noticePeriod || '—'} />
              </div>
            </div>

            {candidate.reasonForChange && (
              <div className="mt-8 border-t border-gray-50 pt-8">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Reason for job change</p>
                <p className="text-sm text-gray-600 leading-relaxed italic">
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
