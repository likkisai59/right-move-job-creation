import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import FileUpload from '../common/FileUpload';
import SkillsInput from './SkillsInput';
import {
  NOTICE_PERIODS,
  EXPERIENCE_OPTIONS,
  EDUCATION_OPTIONS,
  COUNTRY_CODES,
  SOURCE_OPTIONS,
} from '../../utils/constants';
import { fetchBusinessUnits } from '../../api/businessUnitsApi';
import { checkDuplicateCandidate, parseResume } from '../../api/candidatesApi';
import { fetchRecruiters } from '../../api/employeesApi';
import { getCurrentUser } from '../../api/authApi';

const SectionTitle = ({ children }) => (
  <div className="mb-5">
    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2.5">
      {children}
    </h3>
  </div>
);

const DEFAULT_FORM_VALUES = {
  id: '',
  // Personal Details
  firstName: '',
  lastName: '',
  countryCode: '+91',
  email: '',
  alternativeEmail: '',
  phone: '',
  alternativePhone: '',
  currentLocation: '',
  highestQualification: '',
  // Employee Details
  businessUnit: '',
  currentCompany: '',
  currentDesignation: '',
  totalExperience: '',
  relevantExperience: '',
  skills: [],
  skills_draft: '',
  relevantExperienceBySkill: [],
  noticePeriod: '',
  lwd: '',
  employmentLocation: '',
  currentCTC: '',
  fixedCTC: '',
  variableCTC: '',
  expectedCTC: '',
  reasonForChange: '',
  source: '',
  comments: '',
  recruiterName: '',
  resumeFile: null,
};

// ── Determine if form is accessed via public/open link ────────────────────
// Convention: if URL contains /public/ or a query param ?public=1, treat as public
const isPublicForm = () => {
  return (
    window.location.pathname.includes('/public/') ||
    new URLSearchParams(window.location.search).get('public') === '1'
  );
};

const CandidateForm = ({ defaultValues, onSubmit, onCancel, loading = false }) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    getValues,
    watch,
    setError,
    clearErrors,
  } = useForm({
    defaultValues: { ...DEFAULT_FORM_VALUES, ...defaultValues },
    mode: 'onChange',
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control,
    name: 'relevantExperienceBySkill',
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [warnings, setWarnings] = useState({ name: false, phone: false, email: false });
  const [ctcError, setCtcError] = useState('');
  const [recruiterOptions, setRecruiterOptions] = useState([]);
  const [recruiterReadOnly, setRecruiterReadOnly] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState({ type: '', text: '' });
  const [parseConfidence, setParseConfidence] = useState(null);
  const publicForm = isPublicForm();
  const isEdit = window.location.pathname.includes('/edit');
  const personalDetailsRef = useRef(null);

  const totalExperience = watch('totalExperience');
  const noticePeriod = watch('noticePeriod');
  const currentCTC = watch('currentCTC');
  const fixedCTC = watch('fixedCTC');

  // ── Recruiter logic ────────────────────────────────────────────────────
  useEffect(() => {
    if (!publicForm) {
      // CASE 1: Logged-in recruiter — auto-fill from session only if creating a new candidate
      if (!isEdit) {
        const user = getCurrentUser();
        if (user) {
          const name = user.name || user.username || user.email || '';
          setValue('recruiterName', name);
        }
      }
      setRecruiterReadOnly(false);
    } else {
      // CASE 2: Public form — load recruiter dropdown from API
      fetchRecruiters()
        .then((options) => setRecruiterOptions(options))
        .catch(() => setRecruiterOptions([]));
    }
  }, [publicForm, setValue, isEdit]);

  // ── Fetch active business units ────────────────────────────────────────
  useEffect(() => {
    const loadBusinessUnits = async () => {
      try {
        const res = await fetchBusinessUnits({ active_only: true });
        if (res.success) {
          let options = res.data.map(bu => ({
            value: bu.name,
            label: bu.name
          }));
          
          if (defaultValues?.businessUnit) {
            const hasCurrent = options.some(opt => opt.value === defaultValues.businessUnit);
            if (!hasCurrent) {
              options.push({
                value: defaultValues.businessUnit,
                label: `${defaultValues.businessUnit} (Inactive)`
              });
            }
          }
          setBusinessUnits(options);
        }
      } catch (err) {
        console.error('Failed to load business units for form:', err);
      }
    };
    loadBusinessUnits();
  }, [defaultValues]);

  // ── Fresher logic ──────────────────────────────────────────────────────
  useEffect(() => {
    if (totalExperience === 'fresher') {
      setValue('relevantExperience', '0');
      setValue('relevantExperienceBySkill', []);
    }
  }, [totalExperience, setValue]);

  // ── Variable CTC auto-calculation ─────────────────────────────────────
  useEffect(() => {
    const curr = parseFloat(currentCTC) || 0;
    const fixed = parseFloat(fixedCTC) || 0;

    if (currentCTC && fixedCTC) {
      if (fixed > curr) {
        // Fixed > Current: show error, set variable to 0
        setCtcError('Fixed CTC cannot be greater than Current CTC');
        setValue('variableCTC', '0');
      } else {
        setCtcError('');
        setValue('variableCTC', String(parseFloat((curr - fixed).toFixed(2))));
      }
    } else {
      setCtcError('');
      setValue('variableCTC', '');
    }
  }, [currentCTC, fixedCTC, setValue]);

  // ── Reset on defaultValues change ─────────────────────────────────────
  useEffect(() => {
    if (defaultValues) {
      const newValues = { ...DEFAULT_FORM_VALUES, ...defaultValues };
      
      // Ensure recruiterName is not overwritten by empty defaultValues for internal users
      if (!publicForm) {
        const user = getCurrentUser();
        if (user) {
          // Only overwrite if defaultValues doesn't explicitly have a different recruiterName
          // (e.g. when editing an existing candidate, we want to keep the original recruiterName)
          if (!defaultValues.recruiterName) {
            newValues.recruiterName = user.name || user.username || user.email || '';
          }
        }
      }
      
      reset(newValues);
      setWarnings({ name: false, phone: false, email: false });
      setCtcError('');
    }
  }, [defaultValues, reset, publicForm]);

  // ── Duplicate check ───────────────────────────────────────────────────
  const handleCheckDuplicates = async (field) => {
    const values = getValues();
    const params = {};

    if (field === 'name') {
      const fullName = `${values.firstName || ''} ${values.lastName || ''}`.trim();
      if (!fullName) { setWarnings(prev => ({ ...prev, name: false })); return; }
      params.full_name = fullName;
    } else if (field === 'phone') {
      if (!values.phone) { setWarnings(prev => ({ ...prev, phone: false })); return; }
      params.phone_number = values.phone;
    } else if (field === 'email') {
      if (!values.email) { setWarnings(prev => ({ ...prev, email: false })); return; }
      params.email_address = values.email;
    }

    try {
      const results = await checkDuplicateCandidate(params);
      setWarnings(prev => ({
        ...prev,
        name: field === 'name' ? results.name_exists : prev.name,
        phone: field === 'phone' ? results.phone_exists : prev.phone,
        email: field === 'email' ? results.email_exists : prev.email,
      }));
      if (field === 'email' && results.email_exists) {
        setError('email', { type: 'manual', message: 'This email is already registered.' });
      }
      if (field === 'phone' && results.phone_exists) {
        setError('phone', { type: 'manual', message: 'This phone number is already registered.' });
      }
    } catch (err) {
      console.error('Duplicate check failed', err);
    }
  };

  // ── Form Submit ───────────────────────────────────────────────────────
  const handleFormSubmit = (data) => {
    // Block if duplicates detected
    if (warnings.email || warnings.phone) {
      if (warnings.email) setError('email', { type: 'manual', message: 'This email is already registered.' });
      if (warnings.phone) setError('phone', { type: 'manual', message: 'This phone number is already registered.' });
      return;
    }

    // Block if Fixed CTC > Current CTC
    if (ctcError) {
      setError('fixedCTC', { type: 'manual', message: ctcError });
      return;
    }

    const finalSkills = [...(data.skills || [])];
    const draftText = data.skills_draft?.trim();
    if (draftText) {
      draftText.split(',').map(s => s.trim()).filter(Boolean).forEach(skill => {
        if (!finalSkills.includes(skill)) finalSkills.push(skill);
      });
    }

    const submissionData = { ...data, skills: finalSkills };
    delete submissionData.skills_draft;
    onSubmit({ ...submissionData, resumeFile });
  };

  // ── Helper: Map experience string → dropdown value ───────────────────────
  const mapExperience = (rawExp) => {
    if (!rawExp) return '';
    const s = rawExp.toString().trim().toLowerCase();
    if (s === 'fresher' || s === '0' || s === '0 years') return 'fresher';
    // e.g. "25+" or "25+ years"
    if (s.includes('25+') || s.startsWith('25')) return '25+';
    const numMatch = s.match(/(\d+)/);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10);
      if (n === 0) return 'fresher';
      if (n >= 25) return '25+';
      return String(n); // "3", "12" etc — matches EXPERIENCE_OPTIONS values directly
    }
    return '';
  };

  // ── Helper: Normalize notice period string → dropdown value ───────────────
  const mapNoticePeriod = (raw) => {
    if (!raw) return '';
    const s = raw.toString().trim().toLowerCase();
    if (s.includes('immediate')) return 'Immediate';
    if (s.includes('serving') || s.includes('current')) return 'Currently Serving';
    if (s.includes('30') || s.includes('one month') || s.includes('1 month')) return '30 Days';
    if (s.includes('45')) return '45 Days';
    if (s.includes('60') || s.includes('two month') || s.includes('2 month')) return '60 Days';
    if (s.includes('90') || s.includes('three month') || s.includes('3 month')) return '90 Days';
    return '';
  };

  // ── Helper: Normalize qualification → dropdown value ─────────────────────
  const mapQualification = (raw) => {
    if (!raw) return '';
    const s = raw.toLowerCase();
    if (s.includes('phd') || s.includes('ph.d')) return 'PhD';
    if (s.includes('m.tech') || s.includes('mtech')) return 'M.Tech';
    if (s.includes('mca')) return 'MCA';
    if (s.includes('mba')) return 'MBA';
    if (s.includes('m.sc') || s.includes('msc')) return 'M.Sc';
    if (s.includes('b.tech') || s.includes('btech') || s.includes('b tech') || s.includes('b.e') || s.includes('be')) return 'B.Tech';
    if (s.includes('bca')) return 'BCA';
    if (s.includes('b.sc') || s.includes('bsc')) return 'B.Sc';
    if (s.includes('b.com') || s.includes('bcom')) return 'B.Com';
    if (s.includes('diploma')) return 'Diploma';
    if (s.includes('intermediate') || s.includes('12th')) return 'Intermediate';
    if (s.includes('ssc') || s.includes('10th')) return 'SSC';
    if (s.includes('degree')) return 'Degree';
    return ''; // leave blank if can't map — don't risk wrong value
  };

  // ── Helper: Clean phone number (remove country codes, spaces, dashes) ─────
  const cleanPhone = (raw) => {
    if (!raw) return '';
    // Remove common country code prefixes for India (+91, 0091, 091)
    let cleaned = raw.toString().trim();
    cleaned = cleaned.replace(/^(\+91|0091|091)\s*/,'');
    // Keep only digits and limit to 10 for Indian numbers
    cleaned = cleaned.replace(/\D/g, '');
    return cleaned.slice(-10); // take last 10 digits to handle any prefix leftovers
  };

  // ── Helper: Normalize & deduplicate skills ────────────────────────────────
  const mergeSkills = (existing, incoming, overwrite) => {
    const base = overwrite ? [] : [...(existing || [])];
    // Normalize: trim whitespace, handle "React.js" vs "Reactjs" etc.
    const normalize = (s) => s.trim().toLowerCase().replace(/[.\s]/g, '');
    const seen = new Set(base.map(normalize));
    const merged = [...base];
    (incoming || []).forEach(skill => {
      const sk = skill.trim();
      if (sk && !seen.has(normalize(sk))) {
        seen.add(normalize(sk));
        merged.push(sk);
      }
    });
    return merged;
  };

  // ── Helper: Smart location – extract just city name ────────────────────
  const extractCity = (rawLocation) => {
    if (!rawLocation) return '';
    // Take the first segment before a comma ("Hyderabad, Telangana" → "Hyderabad")
    return rawLocation.split(',')[0].trim();
  };

  // ── Auto Fill from Resume ────────────────────────────────────────────────
  const handleResumeUpload = async (file) => {
    // If there is already a resume file, ask for confirmation before replacing
    if (file && resumeFile) {
      const confirmReplace = window.confirm(
        `A resume "${resumeFile.name}" is already uploaded.\nDo you want to replace it?`
      );
      if (!confirmReplace) return; // user cancelled – do nothing
    }

    setResumeFile(file);
    if (!file) {
      setParseMessage({ type: '', text: '' });
      setParseConfidence(null);
      return;
    }

    setIsParsing(true);
    setParseMessage({ type: 'info', text: 'Parsing Resume... Auto-filling candidate details...' });

    try {
      const response = await parseResume(file);

      if (response && response.success && response.data) {
        const d = response.data;
        const currentVals = getValues();

        // ── Overwrite protection: check for field collisions ─────────────
        const collisionFields = [
          { key: 'firstName', val: d.first_name },
          { key: 'lastName', val: d.last_name },
          { key: 'email', val: d.email },
          { key: 'phone', val: d.phone },
        ];
        let shouldOverwrite = false;
        const hasCollision = collisionFields.some(
          f => f.val && currentVals[f.key] && currentVals[f.key] !== ''
        );
        if (hasCollision) {
          shouldOverwrite = window.confirm(
            'Resume contains data for fields you have already filled in.\nDo you want to overwrite them with the extracted resume details?'
          );
        }

        // ── Apply value helper: only writes if field is empty OR overwrite ─
        const apply = (field, value) => {
          if (value === undefined || value === null || value === '') return false;
          const cur = currentVals[field];
          if (shouldOverwrite || cur === undefined || cur === null || cur === '') {
            setValue(field, value, { shouldValidate: true, shouldDirty: true });
            return true;
          }
          return false;
        };

        // ── Track how many fields were successfully filled ────────────────
        let filled = 0;

        // Personal Details
        if (apply('firstName', d.first_name)) filled++;
        if (apply('lastName', d.last_name)) filled++;
        if (apply('email', d.email)) filled++;
        if (apply('alternativeEmail', d.alternative_email)) filled++;

        // Phone: strip country code before applying
        const cleanedPhone = cleanPhone(d.phone);
        if (apply('phone', cleanedPhone)) filled++;
        const cleanedAltPhone = cleanPhone(d.alternative_phone);
        if (apply('alternativePhone', cleanedAltPhone)) filled++;

        if (apply('currentLocation', extractCity(d.current_location))) filled++;

        // Qualification: map to dropdown value
        const mappedQual = mapQualification(d.highest_qualification);
        if (mappedQual && apply('highestQualification', mappedQual)) filled++;

        // Employee Details
        if (apply('currentCompany', d.current_company)) filled++;
        if (apply('currentDesignation', d.current_designation)) filled++;

        // Experience: normalize → dropdown value
        const mappedExp = mapExperience(d.total_experience);
        if (mappedExp && apply('totalExperience', mappedExp)) filled++;

        // Notice Period: normalize → dropdown value
        const mappedNotice = mapNoticePeriod(d.notice_period);
        if (mappedNotice && apply('noticePeriod', mappedNotice)) filled++;

        // CTC (numeric only)
        if (d.current_ctc) {
          const m = d.current_ctc.toString().match(/[\d.]+/);
          if (m && apply('currentCTC', m[0])) filled++;
        }
        if (d.expected_ctc) {
          const m = d.expected_ctc.toString().match(/[\d.]+/);
          if (m && apply('expectedCTC', m[0])) filled++;
        }

        // Skills: merge & deduplicate
        if (d.skills && Array.isArray(d.skills) && d.skills.length > 0) {
          const merged = mergeSkills(currentVals.skills, d.skills, shouldOverwrite);
          setValue('skills', merged, { shouldValidate: true, shouldDirty: true });
          filled++;
        }

        // Business Unit: auto-suggest based on parsed domain
        if (d.business_unit) {
          const validBUs = ['IT', 'ITES', 'BPO', 'Lateral', 'FLP', 'F&A'];
          if (validBUs.includes(d.business_unit)) {
            apply('businessUnit', d.business_unit);
          }
        }

        // Candidate Summary → auto-fill comments if empty
        if (d.candidate_summary && apply('comments', d.candidate_summary)) filled++;

        // Confidence tracking
        setParseConfidence(d.confidence ?? null);

        // ── Determine success/partial message ────────────────────────────
        const totalExtracted = Object.values(d).filter(v =>
          v && (typeof v === 'string' ? v.trim() !== '' : (Array.isArray(v) ? v.length > 0 : true))
        ).length;

        if (filled === 0) {
          setParseMessage({
            type: 'warning',
            text: 'Resume parsed but no new fields were filled. Please enter details manually.',
          });
        } else if (totalExtracted < 5) {
          setParseMessage({
            type: 'warning',
            text: 'Some fields could not be extracted. Please review manually.',
          });
        } else {
          setParseMessage({
            type: 'success',
            text: 'Resume parsed successfully',
          });
        }
        
        if (filled > 0 && personalDetailsRef.current) {
          setTimeout(() => {
            personalDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 500);
        }
      } else {
        throw new Error(response?.message || 'Parse response invalid');
      }
    } catch (err) {
      console.error('[Resume Auto-Fill] Failed:', err);
      setParseMessage({
        type: 'error',
        text: 'Resume parsing failed. Please enter details manually.',
      });
    } finally {
      setIsParsing(false);
    }
  };

  // LWD is shown when notice period is selected. Mandatory only for Immediate/Currently Serving.
  const showLWD = !!noticePeriod;
  const isLwdMandatory = noticePeriod === 'Immediate' || noticePeriod === 'Currently Serving';

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>

      {/* ── SECTION 1: Resume Upload ── */}
      <SectionTitle>Resume Upload</SectionTitle>
      <p className="text-sm text-gray-500 mb-4 -mt-3">Upload resume to auto-fill candidate details</p>
      <div className="mb-8">
        <FileUpload 
          onFileSelect={handleResumeUpload} 
          value={resumeFile} 
          title="Drag & drop your resume here"
          subtitle="or click to browse"
        />
        
        {/* Parsing Status Indication */}
        {parseMessage.text && (
          <div className={`mt-3 p-3 rounded-lg flex items-center justify-between gap-2 text-sm font-medium animate-fade-in ${
            parseMessage.type === 'info'    ? 'bg-blue-50 text-blue-700 border border-blue-100' :
            parseMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
            parseMessage.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
            'bg-red-50 text-red-700 border border-red-100'
          }`}>
            <div className="flex items-center gap-2">
              {parseMessage.type === 'info' && (
                <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin shrink-0" />
              )}
              {parseMessage.type === 'success' && <CheckCircle size={16} className="shrink-0" />}
              {parseMessage.type === 'warning' && <AlertTriangle size={16} className="shrink-0" />}
              {parseMessage.type === 'error' && <AlertTriangle size={16} className="shrink-0" />}
              {parseMessage.text}
            </div>
            {parseConfidence !== null && parseMessage.type !== 'info' && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                parseConfidence >= 70 ? 'bg-emerald-100 text-emerald-700' :
                parseConfidence >= 40 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-600'
              }`}>
                {parseConfidence}% accuracy
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── SECTION 2: Personal Details ── */}
      <div ref={personalDetailsRef} className="scroll-mt-6">
        <SectionTitle>Personal Details</SectionTitle>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

        {/* Candidate ID — Fully locked, system-generated */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            Candidate ID
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              <Lock size={9} /> Auto-Generated
            </span>
          </label>
          <input
            type="text"
            readOnly
            disabled
            tabIndex={-1}
            onKeyDown={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            className="w-full rounded-lg border border-gray-100 bg-gray-50 text-gray-500 text-sm px-3 py-2.5 cursor-not-allowed select-none"
            {...register('id')}
          />
        </div>

        {/* First Name */}
        <Input
          label="First Name"
          placeholder="Enter first name"
          required
          error={errors.firstName?.message}
          onKeyDown={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
          {...register('firstName', {
            required: 'First name is required',
            pattern: { value: /^[A-Za-z\s'-]+$/, message: 'Only alphabetic characters allowed' },
            validate: value => value.trim().length > 0 || 'Name cannot be empty',
            onBlur: () => handleCheckDuplicates('name'),
          })}
        />

        {/* Last Name */}
        <div>
          <Input
            label="Last Name"
            placeholder="Enter last name"
            required
            error={errors.lastName?.message}
            onKeyDown={(e) => { if (/[0-9]/.test(e.key)) e.preventDefault(); }}
            {...register('lastName', {
              required: 'Last name is required',
              pattern: { value: /^[A-Za-z\s'-]+$/, message: 'Only alphabetic characters allowed' },
              validate: value => value.trim().length > 0 || 'Name cannot be empty',
              onBlur: () => handleCheckDuplicates('name'),
            })}
          />
          {warnings.name && (
            <div className="mt-1.5 flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 animate-pulse">
              <AlertTriangle size={14} />
              <span className="text-[11px] font-medium leading-none">A candidate with a similar name already exists. Please verify.</span>
            </div>
          )}
        </div>

        {/* Email ID */}
        <div className="flex flex-col">
          <Input
            label="Email ID"
            type="email"
            placeholder="Enter email address"
            required
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, message: 'Enter a valid email address (e.g. user@example.com)' },
              onBlur: () => handleCheckDuplicates('email'),
            })}
          />
          {warnings.email && !errors.email && (
            <div className="mt-1.5 flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
              <AlertTriangle size={14} />
              <span className="text-[11px] font-medium leading-none">This email is already registered.</span>
            </div>
          )}
        </div>

        {/* Alternative Email ID (Optional) */}
        <Input
          label="Alternative Email ID"
          type="email"
          placeholder="Enter alternative email (optional)"
          error={errors.alternativeEmail?.message}
          {...register('alternativeEmail', {
            pattern: { value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, message: 'Enter a valid email address (e.g. user@example.com)' },
          })}
        />

        {/* Contact Number */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            Contact Number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <div className="w-28">
              <Select
                options={COUNTRY_CODES}
                error={errors.countryCode?.message}
                {...register('countryCode', { required: true })}
              />
            </div>
            <div className="flex-1">
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="Enter 10-digit phone number"
                maxLength={10}
                onKeyDown={(e) => { if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) e.preventDefault(); }}
                onPaste={(e) => { const paste = e.clipboardData.getData('text'); if (!/^\d+$/.test(paste)) e.preventDefault(); }}
                error={errors.phone?.message}
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: { value: /^\d{10}$/, message: 'Phone number must be exactly 10 digits' },
                  onBlur: () => handleCheckDuplicates('phone'),
                })}
              />
              {warnings.phone && !errors.phone && (
                <div className="mt-1.5 flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                  <AlertTriangle size={14} />
                  <span className="text-[11px] font-medium leading-none">This phone number is already registered.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alternative Contact Number (Optional) */}
        <Input
          label="Alternative Contact Number"
          type="tel"
          inputMode="numeric"
          placeholder="Enter alternative 10-digit phone (optional)"
          maxLength={10}
          onKeyDown={(e) => { if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) e.preventDefault(); }}
          onPaste={(e) => { const paste = e.clipboardData.getData('text'); if (!/^\d+$/.test(paste)) e.preventDefault(); }}
          error={errors.alternativePhone?.message}
          {...register('alternativePhone', {
            pattern: { value: /^\d{10}$/, message: 'Phone number must be exactly 10 digits' },
          })}
        />

        {/* Current Location */}
        <Input
          label="Current Location"
          placeholder="Enter current location"
          required
          error={errors.currentLocation?.message}
          {...register('currentLocation', { required: 'Current location is required' })}
        />

        {/* Highest Qualification */}
        <Select
          label="Highest Qualification"
          placeholder="Select qualification"
          required
          options={EDUCATION_OPTIONS}
          error={errors.highestQualification?.message}
          {...register('highestQualification', { required: 'Highest qualification is required' })}
        />

      </div>

      {/* ── SECTION 2: Employee Details ── */}
      <SectionTitle>Employee Details</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

        {/* Business Unit */}
        <Select
          label="Business Unit"
          placeholder="Select Business Unit"
          required
          options={businessUnits}
          error={errors.businessUnit?.message}
          {...register('businessUnit', { required: 'Business unit is required' })}
        />

        {/* Current Company */}
        <Input
          label="Current Company"
          placeholder="Enter current company"
          error={errors.currentCompany?.message}
          {...register('currentCompany', {
            pattern: { value: /^(?!\d+$)[A-Za-z0-9\s&.,'-]+$/, message: 'Company name cannot be purely numeric' }
          })}
        />

        {/* Current Designation */}
        <Input
          label="Current Designation"
          placeholder="Enter current designation"
          error={errors.currentDesignation?.message}
          {...register('currentDesignation')}
        />

        {/* Total Experience */}
        <Select
          label="Total Experience"
          placeholder="Select experience"
          required
          options={EXPERIENCE_OPTIONS}
          error={errors.totalExperience?.message}
          {...register('totalExperience', { required: 'Total experience is required' })}
        />

        {/* Relevant Experience (Years) */}
        <Input
          label="Relevant Experience (Years)"
          type="number"
          placeholder="e.g. 3"
          disabled={totalExperience === 'fresher'}
          error={errors.relevantExperience?.message}
          {...register('relevantExperience', {
            validate: value => {
              if (totalExperience === 'fresher' && parseFloat(value) > 0) {
                return 'Freshers cannot have relevant experience';
              }
              return true;
            },
            min: { value: 0, message: 'Cannot be negative' },
          })}
        />

        {/* Notice Period */}
        <Select
          label="Notice Period"
          placeholder="Select notice period"
          required
          options={NOTICE_PERIODS}
          error={errors.noticePeriod?.message}
          {...register('noticePeriod', { required: 'Notice period is required' })}
        />

        {/* LWD — Conditional: shown when notice period is selected */}
        {showLWD && (
          <Input
            label="LWD (Last Working Day)"
            type="date"
            min="1990-01-01"
            max="2035-12-31"
            required={isLwdMandatory}
            error={errors.lwd?.message}
            {...register('lwd', { required: isLwdMandatory ? 'Last working day is required' : false })}
          />
        )}

        {/* Employment Location (Optional) */}
        <Input
          label="Employment Location"
          placeholder="Enter employment location (optional)"
          error={errors.employmentLocation?.message}
          {...register('employmentLocation')}
        />

        {/* Current CTC */}
        <Input
          label="Current CTC (₹ LPA)"
          type="number"
          placeholder="e.g. 8.5"
          required
          error={errors.currentCTC?.message}
          {...register('currentCTC', {
            required: 'Current CTC is required',
            min: { value: 0, message: 'Cannot be negative' },
          })}
        />

        {/* Fixed CTC */}
        <div className="flex flex-col">
          <Input
            label="Fixed CTC (₹ LPA)"
            type="number"
            placeholder="e.g. 7.0"
            required
            error={errors.fixedCTC?.message || ctcError}
            {...register('fixedCTC', {
              required: 'Fixed CTC is required',
              min: { value: 0, message: 'Cannot be negative' },
            })}
          />
          {ctcError && !errors.fixedCTC && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertTriangle size={12} /> {ctcError}
            </p>
          )}
        </div>

        {/* Variable CTC (Read-only, auto-calculated) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Variable CTC (₹ LPA)</label>
          <input
            type="number"
            readOnly
            disabled
            tabIndex={-1}
            className="w-full rounded-lg border border-gray-100 bg-gray-50 text-gray-500 text-sm px-3 py-2.5 cursor-not-allowed"
            {...register('variableCTC')}
          />
          <p className="text-[11px] text-gray-400">Auto-calculated: Current CTC − Fixed CTC</p>
        </div>

        {/* Expected CTC */}
        <Input
          label="Expected CTC (₹ LPA)"
          type="number"
          placeholder="e.g. 12"
          required
          error={errors.expectedCTC?.message}
          {...register('expectedCTC', {
            required: 'Expected CTC is required',
            min: { value: 0, message: 'Cannot be negative' },
          })}
        />

        {/* Source */}
        <Select
          label="Source"
          placeholder="Select source"
          required
          options={SOURCE_OPTIONS}
          error={errors.source?.message}
          {...register('source', { required: 'Source is required' })}
        />

        {/* Recruiter Name — CASE 1: readonly auto-fill | CASE 2: public dropdown */}
        {!publicForm ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              Recruiter Name
              {recruiterReadOnly && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                  <Lock size={9} /> Auto-filled
                </span>
              )}
            </label>
            <input
              type="text"
              readOnly={recruiterReadOnly}
              placeholder="Enter recruiter name"
              className={`w-full rounded-lg border text-sm px-3 py-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                recruiterReadOnly
                  ? 'border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed'
                  : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
              }`}
              {...register('recruiterName')}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              Recruiter Name <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white text-sm text-gray-900 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all"
              {...register('recruiterName', { required: 'Please select a recruiter' })}
            >
              <option value="">Select recruiter...</option>
              {recruiterOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.recruiterName && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle size={12} /> {errors.recruiterName.message}
              </p>
            )}
          </div>
        )}

        {/* Reason for Job Change */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Reason for Job Change
          </label>
          <textarea
            placeholder="Enter reason for job change..."
            rows={3}
            className="w-full rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all resize-none"
            {...register('reasonForChange')}
          />
        </div>

        {/* Comments */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Comments
          </label>
          <textarea
            placeholder="Enter any additional comments..."
            rows={2}
            className="w-full rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all resize-none"
            {...register('comments')}
          />
        </div>

      </div>

      {/* ── SECTION 3: Relevant Experience by Skill ── */}
      <SectionTitle>Relevant Experience by Skill (Optional)</SectionTitle>
      <div className={`mb-8 ${totalExperience === 'fresher' ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">Add detailed experience for specific tools or skills.</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => appendExp({ skill: '', experience: '' })}
            icon={Plus}
            disabled={totalExperience === 'fresher'}
          >
            Add Skill
          </Button>
        </div>
        <div className="space-y-4">
          {expFields.map((field, index) => (
            <div key={field.id} className="p-5 bg-gray-50 rounded-xl border border-gray-200 relative flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1 w-full">
                <Input
                  label="Skill / Technology"
                  placeholder="e.g. React"
                  required
                  error={errors.relevantExperienceBySkill?.[index]?.skill?.message}
                  {...register(`relevantExperienceBySkill.${index}.skill`, { required: 'Skill is required' })}
                />
              </div>
              <div className="flex-1 w-full">
                <Input
                  label="Experience (in years)"
                  type="number"
                  placeholder="e.g. 3"
                  required
                  error={errors.relevantExperienceBySkill?.[index]?.experience?.message}
                  {...register(`relevantExperienceBySkill.${index}.experience`, {
                    required: 'Experience is required',
                    min: { value: 0, message: 'Must be 0 or greater' },
                  })}
                />
              </div>
              <button
                type="button"
                onClick={() => removeExp(index)}
                className="w-10 h-10 mt-6 shrink-0 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
                title="Remove skill"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 4: Other Skills ── */}
      <div className="mb-8">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1.5">
          Other Skills <span className="text-red-500">*</span>
        </label>
        <Controller
          name="skills"
          control={control}
          rules={{
            validate: (val) => {
              const draft = getValues('skills_draft')?.trim();
              return (val && val.length > 0) || (draft && draft.length > 0) || 'At least one skill is required';
            },
          }}
          render={({ field }) => (
            <SkillsInput
              value={field.value || []}
              onChange={field.onChange}
              draftValue={watch('skills_draft')}
              onDraftChange={(val) => setValue('skills_draft', val, { shouldValidate: true })}
              placeholder="Type a skill and press Enter"
              error={errors.skills?.message}
            />
          )}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-5 border-t border-gray-100">
        {onCancel && (
          <Button type="button" variant="secondary" size="lg" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" size="lg" loading={loading || isParsing}>
          Submit Application
        </Button>
      </div>
    </form>
  );
};

export default CandidateForm;
