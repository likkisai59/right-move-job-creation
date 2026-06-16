import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, RefreshCw } from 'lucide-react';
import Button from '../common/Button';
import { checkPermission } from '../../api/authApi';

const QuickActions = () => {
  const navigate = useNavigate();

  const allActions = [
    {
      label: 'Create Job Requirement',
      icon: Plus,
      onClick: () => navigate('/jobs/create'),
      variant: 'primary',
      permission: 'add_job'
    },
    {
      label: 'Add Candidate',
      icon: Users,
      onClick: () => navigate('/candidates/create'),
      variant: 'secondary',
      permission: 'add_candidate'
    },
    {
      label: 'Update Job',
      icon: RefreshCw,
      onClick: () => navigate('/jobs'),
      variant: 'secondary',
    },
  ];

  const actions = allActions.filter(act => !act.permission || checkPermission(act.permission));

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
