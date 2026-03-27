import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color = 'blue', trend }) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-600 text-white',
      text: 'text-blue-600',
    },
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'bg-emerald-600 text-white',
      text: 'text-emerald-600',
    },
    violet: {
      bg: 'bg-violet-50',
      icon: 'bg-violet-600 text-white',
      text: 'text-violet-600',
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'bg-amber-500 text-white',
      text: 'text-amber-600',
    },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow duration-200">
      <div className={`w-11 h-11 rounded-xl ${c.icon} flex items-center justify-center shrink-0`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {trend && (
          <p
            className={`text-xs mt-1 font-medium ${
              trend.up ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {trend.up ? '↑' : '↓'} {trend.label}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
