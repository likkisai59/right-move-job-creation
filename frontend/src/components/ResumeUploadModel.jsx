import { useState, useRef, useCallback } from "react";
import { X, Upload, FileText, Loader2, CheckCircle, AlertCircle, Sparkles, ChevronRight } from "lucide-react";
import { extractTextFromPDF } from "../utils/pdfExtractor";
import { parseResume } from "../utils/geminiAI";

const STEPS = {
  UPLOAD: "upload",
  PARSING: "parsing",
  REVIEW: "review",
  DONE: "done",
};

export default function ResumeUploadModal({ isOpen, onClose, onProfileExtracted }) {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [parsedData, setParsedData] = useState(null);
  const [progress, setProgress] = useState("");
  const fileInputRef = useRef(null);

  const handleFile = useCallback(async (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB.");
      return;
    }

    setError("");
    setFile(selectedFile);
    setStep(STEPS.PARSING);

    try {
      setProgress("📄 Reading PDF...");
      const text = await extractTextFromPDF(selectedFile);

      if (!text || text.length < 50) {
        throw new Error("Could not extract text from PDF. Make sure it's not a scanned image.");
      }

      setProgress("🤖 AI analyzing resume...");
      const data = await parseResume(text);

      setParsedData(data);
      setStep(STEPS.REVIEW);
    } catch (err) {
      setError(err.message || "Failed to process resume. Please try again.");
      setStep(STEPS.UPLOAD);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    handleFile(dropped);
  }, [handleFile]);

  const handleConfirm = () => {
    if (parsedData) {
      onProfileExtracted(parsedData);
      onClose();
      resetState();
    }
  };

  const resetState = () => {
    setStep(STEPS.UPLOAD);
    setFile(null);
    setError("");
    setParsedData(null);
    setProgress("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Resume Parser</h2>
              <p className="text-xs text-gray-500">Upload PDF → AI extracts profile automatically</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4 flex items-center gap-2">
          {[
            { key: STEPS.UPLOAD, label: "Upload" },
            { key: STEPS.PARSING, label: "AI Parse" },
            { key: STEPS.REVIEW, label: "Review" },
          ].map((s, i, arr) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full transition-all
                ${step === s.key
                  ? "bg-blue-600 text-white"
                  : step === STEPS.REVIEW && s.key === STEPS.UPLOAD
                  ? "bg-green-100 text-green-700"
                  : step === STEPS.REVIEW && s.key === STEPS.PARSING
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-400"
                }`}
              >
                {s.label}
              </div>
              {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* UPLOAD STEP */}
          {step === STEPS.UPLOAD && (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
                  ${dragOver
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-400 hover:bg-blue-50/50"
                  }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">
                  Drop resume PDF here
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  or click to browse files
                </p>
                <div className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <FileText className="w-4 h-4" />
                  Choose PDF File
                </div>
                <p className="text-xs text-gray-400 mt-3">Max 10MB • PDF only</p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />

              {/* Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">✨ AI will extract:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {["Name & Contact", "Skills & Tools", "Work Experience", "Education", "Current Role", "Professional Summary"].map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PARSING STEP */}
          {step === STEPS.PARSING && (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-blue-600" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-gray-800 mb-1">Processing Resume</h3>
                <p className="text-sm text-gray-500">{progress}</p>
                {file && (
                  <p className="text-xs text-gray-400 mt-2">📄 {file.name}</p>
                )}
              </div>
              <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {/* REVIEW STEP */}
          {step === STEPS.REVIEW && parsedData && (
            <div className="space-y-4">
              {/* Success Banner */}
              <div className="flex items-center gap-2.5 bg-green-50 text-green-700 text-sm p-3 rounded-xl border border-green-100">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Resume parsed successfully! Review extracted data below.</span>
              </div>

              {/* Basic Info */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {parsedData.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{parsedData.name || "—"}</h3>
                    <p className="text-sm text-blue-700 font-medium">{parsedData.currentTitle || "—"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{parsedData.currentCompany || ""} • {parsedData.location || ""}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {parsedData.email && <span className="text-xs text-gray-500">✉️ {parsedData.email}</span>}
                      {parsedData.phone && <span className="text-xs text-gray-500">📞 {parsedData.phone}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {parsedData.summary && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Summary</p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">{parsedData.summary}</p>
                </div>
              )}

              {/* Skills */}
              {parsedData.skills?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Skills ({parsedData.skills.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.skills.map((skill) => (
                      <span key={skill} className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {parsedData.experience?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Experience • {parsedData.experienceYears || "?"} years
                  </p>
                  <div className="space-y-3">
                    {parsedData.experience.slice(0, 3).map((exp, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-1 rounded-full bg-blue-300 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{exp.title}</p>
                          <p className="text-xs text-gray-500">{exp.company} • {exp.duration}</p>
                          {exp.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {parsedData.education?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Education</p>
                  <div className="space-y-2">
                    {parsedData.education.map((edu, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                        <div className="w-1 rounded-full bg-purple-300 shrink-0 self-stretch" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{edu.degree}</p>
                          <p className="text-xs text-gray-500">{edu.institution} {edu.year ? `• ${edu.year}` : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === STEPS.REVIEW && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
            <button
              onClick={resetState}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              ← Upload Different File
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Use This Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}