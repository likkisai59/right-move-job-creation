import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

const SkillsInput = ({ value = [], onChange, placeholder = 'Type a skill and press Enter', error }) => {
  const [inputVal, setInputVal] = useState('');

  const addSkill = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    
    // Support comma-separated typing
    const newSkillsArr = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    const uniqueSkills = newSkillsArr.filter((s) => !value.includes(s));
    
    if (uniqueSkills.length > 0) {
      onChange([...value, ...uniqueSkills]);
    }
    setInputVal('');
  };

  const removeSkill = (skill) => {
    onChange(value.filter((s) => s !== skill));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
    if (e.key === 'Backspace' && !inputVal && value.length > 0) {
      removeSkill(value[value.length - 1]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
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
        <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addSkill}
            placeholder={value.length === 0 ? placeholder : 'Add more...'}
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400 py-0.5"
          />
          <button
            type="button"
            onClick={addSkill}
            disabled={!inputVal.trim()}
            className="shrink-0 px-2.5 py-1 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default SkillsInput;
