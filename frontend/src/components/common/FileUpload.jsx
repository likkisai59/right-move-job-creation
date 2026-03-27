import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';
import { ALLOWED_RESUME_TYPES, MAX_RESUME_SIZE_MB } from '../../utils/constants';

const FileUpload = ({ onFileSelect, accept, maxSizeMB = MAX_RESUME_SIZE_MB, value }) => {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');

  const validateFile = (file) => {
    const allowedTypes = accept
      ? accept.split(',').map((t) => t.trim())
      : ALLOWED_RESUME_TYPES;

    const isValidType =
      allowedTypes.some((t) => file.type === t) ||
      file.name.match(/\.(pdf|doc|docx)$/i);

    if (!isValidType) {
      setError('Only PDF, DOC, or DOCX files are allowed.');
      return false;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must not exceed ${maxSizeMB}MB.`);
      return false;
    }

    setError('');
    return true;
  };

  const handleFile = (file) => {
    if (!file) return;
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    []
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onFileSelect(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClick = () => {
    if (!value) inputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={[
          'relative rounded-xl border-2 border-dashed transition-all duration-200',
          'flex flex-col items-center justify-center p-8 min-h-[140px]',
          isDragOver
            ? 'border-blue-500 bg-blue-50 scale-[1.01]'
            : value
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40',
          !value ? 'cursor-pointer' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={handleInputChange}
        />

        {value ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle size={24} className="text-emerald-600" />
            </div>
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700 max-w-[260px] truncate">
                {value.name || value}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 mt-1"
            >
              <X size={12} />
              Remove file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div
              className={[
                'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                isDragOver ? 'bg-blue-100' : 'bg-gray-100',
              ].join(' ')}
            >
              <Upload
                size={22}
                className={isDragOver ? 'text-blue-600' : 'text-gray-400'}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Drag & drop your resume here
              </p>
              <p className="text-xs text-gray-400 mt-1">
                or click to browse · PDF, DOC, DOCX (Max {maxSizeMB}MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
