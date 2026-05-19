import { useState } from "react";
import {
  X, Sparkles, Loader2, AlertCircle, Users, CheckCircle,
  TrendingUp, Star, ChevronDown, ChevronUp, UserPlus, RefreshCw
} from "lucide-react";
import { matchCandidatesToJob } from "../utils/geminiAI";

const MATCH_COLORS = {
  Excellent: { bg: "bg-green-100", text: "text-green-700", badge: "bg-green-500", bar: "bg-green-500" },
  Good: { bg: "bg-blue-100", text: "text-blue-700", badge: "bg-blue-500", bar: "bg-blue-500" },
  Fair: { bg: "bg-yellow-100", text: "text-yellow-700", badge: "bg-yellow-500", bar: "bg-yellow-400" },
  Poor: { bg: "bg-red-100", text: "text-red-700", badge: "bg-red-400", bar: "bg-red-400" },
};

function ScoreBar({ score }) {
  const level = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Poor";
  const colors = MATCH_COLORS[level];
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-bold text-gray-800 w-10 text-right">{score}%</span>
    </div>
  );
}

function CandidateMatchCard({ match, candidate, onShortlist, isShortlisted }) {
  const [expanded, setExpanded] = useState(false);
  const level = match.matchLevel || (
    match.matchScore >= 80 ? "Excellent" : match.matchScore >= 60 ? "Good" : match.matchScore >= 40 ? "Fair" : "Poor"
  );
  const colors = MATCH_COLORS[level] || MATCH_COLORS.Fair;

  const initials = (candidate?.name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`rounded-xl border transition-all ${isShortlisted ? "border-green-300 bg-green-50/30" : "border-gray-200 bg-white"}`}>
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {candidate?.name || "Unknown"}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {candidate?.currentTitle || candidate?.position || "—"} •{" "}
                  {candidate?.currentCompany || candidate?.company || "—"}
                </p>
              </div>
              <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-lg ${colors.bg} ${colors.text}`}>
                {level}
              </span>
            </div>

            {/* Score Bar */}
            <div className="mt-2">
              <ScoreBar score={match.matchScore} />
            </div>
          </div>
        </div>

        {/* Quick Info Row */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {match.matchedSkills?.slice(0, 4).map((s) => (
            <span key={s} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium">
              ✓ {s}
            </span>
          ))}
          {match.missingSkills?.slice(0, 2).map((s) => (
            <span key={s} className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-md">
              ✗ {s}
            </span>
          ))}
        </div>

        {/* Recommendation */}
        {match.recommendation && (
          <p className="mt-2 text-xs text-gray-600 italic line-clamp-2">
            "{match.recommendation}"
          </p>
        )}

        {/* Actions Row */}
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? "Less details" : "More details"}
          </button>

          <button
            onClick={() => onShortlist(match.candidateId)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              isShortlisted
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isShortlisted ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                Shortlisted
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                Shortlist
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 space-y-3">
          {match.strengths?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">💪 Strengths</p>
              <ul className="space-y-1">
                {match.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {match.concerns?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">⚠️ Concerns</p>
              <ul className="space-y-1">
                {match.concerns.map((c, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                    <span className="text-yellow-500 mt-0.5">•</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {candidate?.experience && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">📅 Experience</p>
              <p className="text-xs text-gray-700">{candidate.experience} years</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MatchingCandidatesModal({ isOpen, onClose, job, candidates = [] }) {
  const [matchResults, setMatchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shortlisted, setShortlisted] = useState(new Set());
  const [hasRun, setHasRun] = useState(false);
  const [filter, setFilter] = useState("All");

  const runMatching = async () => {
    if (!job || candidates.length === 0) {
      setError("No candidates available to match.");
      return;
    }
    setLoading(true);
    setError("");
    setMatchResults([]);

    try {
      const results = await matchCandidatesToJob(job, candidates);

      // Sort by matchScore desc
      const sorted = [...results].sort((a, b) => b.matchScore - a.matchScore);
      setMatchResults(sorted);
      setHasRun(true);
    } catch (err) {
      setError(err.message || "Matching failed. Check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleShortlist = (candidateId) => {
    setShortlisted((prev) => {
      const next = new Set(prev);
      if (next.has(candidateId)) next.delete(candidateId);
      else next.add(candidateId);
      return next;
    });
  };

  const getCandidateById = (id) =>
    candidates.find((c) => (c._id || c.id) === id);

  const filterOptions = ["All", "Excellent", "Good", "Fair", "Poor"];

  const filteredResults = matchResults.filter((r) => {
    if (filter === "All") return true;
    const level = r.matchLevel || (
      r.matchScore >= 80 ? "Excellent" : r.matchScore >= 60 ? "Good" : r.matchScore >= 40 ? "Fair" : "Poor"
    );
    return level === filter;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Candidate Matching</h2>
              <p className="text-xs text-gray-500">
                {job?.title || "Job"} • {candidates.length} candidates in pool
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Job Info Bar */}
        {job && (
          <div className="px-6 py-3 bg-blue-600/5 border-b border-blue-100 flex flex-wrap gap-3">
            {job.department && (
              <span className="text-xs text-gray-600">🏢 {job.department}</span>
            )}
            {(job.experienceRequired || job.experience) && (
              <span className="text-xs text-gray-600">📅 {job.experienceRequired || job.experience} yrs exp</span>
            )}
            {job.location && (
              <span className="text-xs text-gray-600">📍 {job.location}</span>
            )}
            {job.skills && (
              <span className="text-xs text-gray-600">
                🛠 {Array.isArray(job.skills) ? job.skills.slice(0, 3).join(", ") : job.skills}
              </span>
            )}
          </div>
        )}

        {/* Stats Row (after matching) */}
        {hasRun && matchResults.length > 0 && !loading && (
          <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
            {["Excellent", "Good", "Fair", "Poor"].map((level) => {
              const count = matchResults.filter((r) => {
                const l = r.matchLevel || (r.matchScore >= 80 ? "Excellent" : r.matchScore >= 60 ? "Good" : r.matchScore >= 40 ? "Fair" : "Poor");
                return l === level;
              }).length;
              const colors = MATCH_COLORS[level];
              return (
                <div key={level} className="text-center py-3">
                  <p className={`text-xl font-bold ${colors.text}`}>{count}</p>
                  <p className="text-xs text-gray-500">{level}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Initial State */}
          {!hasRun && !loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-5 text-center">
              <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">
                  Find Best Matching Candidates
                </h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  AI will analyze all {candidates.length} candidates in the system and score them against this job's requirements.
                </p>
              </div>

              {/* Job Skills Preview */}
              {job?.skills && (
                <div className="bg-gray-50 rounded-xl p-4 w-full max-w-md text-left">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Matching against:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(job.skills) ? job.skills : [job.skills]).map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={runMatching}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Start AI Matching
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-10 h-10 text-blue-600" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-gray-800 mb-1">AI Analyzing Candidates</h3>
                <p className="text-sm text-gray-500">Comparing {candidates.length} profiles against job requirements...</p>
              </div>
              <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-pulse w-2/3" />
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex items-start gap-2.5 bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100 mb-4">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Results */}
          {hasRun && !loading && matchResults.length > 0 && (
            <div className="space-y-4">
              {/* Filter + Re-run */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {filterOptions.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`text-xs px-3 py-1 rounded-lg font-medium transition-all ${
                        filter === f
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <button
                  onClick={runMatching}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 font-medium transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-run
                </button>
              </div>

              {/* Candidate Cards */}
              <div className="space-y-3">
                {filteredResults.map((match) => {
                  const candidate = getCandidateById(match.candidateId);
                  return (
                    <CandidateMatchCard
                      key={match.candidateId}
                      match={match}
                      candidate={candidate}
                      onShortlist={toggleShortlist}
                      isShortlisted={shortlisted.has(match.candidateId)}
                    />
                  );
                })}
              </div>

              {filteredResults.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No candidates in "{filter}" category.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {shortlisted.size > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-green-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
              <Star className="w-4 h-4" />
              {shortlisted.size} candidate{shortlisted.size > 1 ? "s" : ""} shortlisted
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}