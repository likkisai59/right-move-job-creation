import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, RefreshCw } from 'lucide-react';
import Button from '../common/Button';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Create Job Requirement',
      icon: Plus,
      onClick: () => navigate('/jobs/create'),
      variant: 'primary',
    },
    {
      label: 'Add Candidate',
      icon: Users,
      onClick: () => navigate('/candidates/create'),
      variant: 'secondary',
    },
    {
      label: 'Update Job',
      icon: RefreshCw,
      onClick: () => navigate('/jobs'),
      variant: 'secondary',
    },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {actions.map(({ label, icon, onClick, variant }) => (
        <Button
          key={label}
          variant={variant}
          icon={icon}
          onClick={onClick}
          size="md"
        >
          {label}
        </Button>
      ))}
    </div>
  );
};

export default QuickActions;
