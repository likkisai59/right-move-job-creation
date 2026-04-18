import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Search, 
  ArrowUpDown,
  Filter,
  Check
} from 'lucide-react';
import Badge from '../common/Badge';

const MatchingCandidatesTable = ({ 
  candidates = [], 
  onShortlist, 
  onReject, 
  processingId,
  tab = 'matching',
  onBulkShortlist
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [minMatch, setMinMatch] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: 'match_score', direction: 'desc' });
  const [selectedCandidates, setSelectedCandidates] = useState([]);

  // Toggle selection
  const toggleSelect = (id) => {
    setSelectedCandidates(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCandidates.length === sortedCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(sortedCandidates.map(c => c.candidate_id || c.id));
    }
  };

  // Filter Logic
  const filteredCandidates = candidates.filter(c => {
    const matchesName = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = skillFilter === '' || c.skills.some(s => s.toLowerCase().includes(skillFilter.toLowerCase()));
    const matchesMatch = c.match_score >= minMatch;
    return matchesName && matchesSkill && matchesMatch;
  });

  // Sort Logic
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* Table Filters */}
      <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by name..."
              className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Filter by skill..."
              className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-48"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {tab === 'matching' && selectedCandidates.length > 0 && (
            <button
              onClick={() => onBulkShortlist(selectedCandidates)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
            >
              <CheckCircle2 size={14} />
              Bulk Shortlist ({selectedCandidates.length})
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Min Match: {minMatch}%</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minMatch}
              onChange={(e) => setMinMatch(parseInt(e.target.value))}
              className="w-32 accent-blue-600"
            />
          </div>
          <div className="text-xs font-medium text-gray-400">
            Showing <span className="text-gray-900 font-bold">{sortedCandidates.length}</span> candidates
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              {tab === 'matching' && (
                <th className="px-6 py-4 border-b border-gray-100 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedCandidates.length === sortedCandidates.length && sortedCandidates.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
              )}
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Skills</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Experience</th>
              <th 
                className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => requestSort('match_score')}
              >
                <div className="flex items-center gap-1.5">
                  Match %
                  <ArrowUpDown size={12} className={sortConfig.key === 'match_score' ? 'text-blue-600' : 'text-gray-300'} />
                </div>
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedCandidates.length > 0 ? (
              sortedCandidates.map((c) => (
                <tr key={c.candidate_id || c.id} className={`hover:bg-blue-50/30 transition-colors group ${selectedCandidates.includes(c.candidate_id || c.id) ? 'bg-blue-50/50' : ''}`}>
                   {tab === 'matching' && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedCandidates.includes(c.candidate_id || c.id)}
                        onChange={() => toggleSelect(c.candidate_id || c.id)}
                        disabled={c.status === 'shortlisted' || c.status === 'rejected'}
                      />
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm ${
                        c.status === 'shortlisted' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {c.name.charAt(0)}
                      </div>
                      <div className="font-bold text-gray-900">{c.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {(c.skills || []).slice(0, 3).map(skill => (
                        <span key={skill} className="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-tight">
                          {skill}
                        </span>
                      ))}
                      {c.skills && c.skills.length > 3 && (
                        <span className="text-[10px] text-gray-400 font-bold ml-1">+{c.skills.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-700">{c.experience} Years</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 w-32">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-extra-bold ${getScoreColor(c.match_score).split(' ')[0]}`}>
                          {c.match_score}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${getScoreBadge(c.match_score)}`}
                          style={{ width: `${c.match_score}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      c.status === 'shortlisted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      c.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {c.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button
                        onClick={() => navigate(`/candidates/${c.candidate_id || c.id}`)}
                        title="View Profile"
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Eye size={18} />
                      </button>

                      {c.status !== 'shortlisted' && c.status !== 'rejected' ? (
                        <>
                          <button
                            onClick={() => onReject(c.candidate_id || c.id)}
                            disabled={processingId === (c.candidate_id || c.id)}
                            title="Reject"
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
                          >
                            <XCircle size={18} />
                          </button>
                          <button
                            onClick={() => onShortlist(c.candidate_id || c.id)}
                            disabled={processingId === (c.candidate_id || c.id)}
                            title="Shortlist"
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-50"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        </>
                      ) : (
                        <div className="w-20 text-center">
                          {c.status === 'shortlisted' ? (
                            <div className="text-emerald-500 font-bold text-xs flex items-center justify-end gap-1">
                              <Check size={14} strokeWidth={3} /> Shortlisted
                            </div>
                          ) : (
                            <div className="text-rose-500 font-bold text-xs">Rejected</div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                   <div className="flex flex-col items-center gap-2">
                     <Search className="text-gray-300" size={40} />
                     <p className="text-gray-500 font-medium">No relevant candidates found for this job</p>
                     <p className="text-gray-400 text-xs">Try adjusting the job requirements or adding more candidates to the pool.</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatchingCandidatesTable;
