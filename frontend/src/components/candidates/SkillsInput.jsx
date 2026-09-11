import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Search } from 'lucide-react';

const COMMON_SKILLS = [
  'React', 'Node.js', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', '.NET',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'SQL', 'PostgreSQL', 'MySQL',
  'MongoDB', 'Angular', 'Vue.js', 'Spring Boot', 'HTML5', 'CSS3', 'Tailwind CSS',
  'Git', 'CI/CD', 'REST API', 'GraphQL', 'Microservices', 'Linux', 'PHP',
  'Ruby on Rails', 'Swift', 'Kotlin', 'Flutter', 'React Native', 'Machine Learning',
  'Data Science', 'DevOps', 'Agile', 'Scrum', 'Figma', 'UI/UX Design',
  'Project Management', 'Business Analysis', 'QA Testing', 'Selenium', 'Redux'
];

const SkillsInput = ({ 
  value = [], 
  onChange, 
  draftValue = '', 
  onDraftChange, 
  placeholder = 'Type or search a skill...', 
  error 
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const addSkill = (skillToAdd) => {
    const raw = skillToAdd || draftValue;
    const trimmed = raw?.trim();
    if (!trimmed) return;
    
    // Support comma-separated typing
    const newSkillsArr = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    const uniqueSkills = newSkillsArr.filter((s) => !value.some(v => v.toLowerCase() === s.toLowerCase()));
    
    if (uniqueSkills.length > 0) {
      onChange([...value, ...uniqueSkills]);
    }
    onDraftChange('');
    setShowSuggestions(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const removeSkill = (skill) => {
    onChange(value.filter((s) => s !== skill));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
    if (e.key === 'Backspace' && !draftValue && value.length > 0) {
      removeSkill(value[value.length - 1]);
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = draftValue.trim()
    ? COMMON_SKILLS.filter(
        (s) =>
          s.toLowerCase().includes(draftValue.trim().toLowerCase()) &&
          !value.some((v) => v.toLowerCase() === s.toLowerCase())
      )
    : [];

  return (
    <div className="flex flex-col gap-1.5 relative" ref={containerRef}>
      <div
        className={[
          'flex flex-wrap items-center gap-2 p-2 rounded-lg border bg-white min-h-[44px]',
          'focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500',
          'transition-all duration-150',
          error ? 'border-red-400' : 'border-gray-200 hover:border-gray-300',
        ].join(' ')}
      >
        {/* Skill chips */}
        {value.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium chip-enter"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="ml-0.5 hover:text-blue-900 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {/* Text input */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
          <input
            ref={inputRef}
            type="text"
            value={draftValue}
            onChange={(e) => {
              onDraftChange(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : 'Add more...'}
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400 py-0.5"
          />
          <button
            type="button"
            onClick={() => addSkill()}
            disabled={!draftValue?.trim()}
            className="shrink-0 px-2.5 py-1 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto py-1">
          <div className="px-2 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Suggested Skills
          </div>
          {suggestions.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => addSkill(skill)}
              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between group transition-colors"
            >
              <span>{skill}</span>
              <Plus size={14} className="text-gray-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default SkillsInput;
