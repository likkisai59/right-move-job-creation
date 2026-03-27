import React from 'react';
import Card, { CardHeader } from '../common/Card';
import Badge from '../common/Badge';
import { formatDate, getInitials } from '../../utils/formatters';
import { Inbox } from 'lucide-react';

const RecentApplications = ({ applications = [] }) => {
  return (
    <Card>
      <CardHeader
        title="Recent Applications"
        subtitle="Latest candidate activity"
      />
      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
            <Inbox size={24} className="text-gray-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">No recent applications</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Applications will appear here once candidates are added
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-50">
          {applications.map((app) => (
            <div
              key={app.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0">
                {getInitials(app.candidateName)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {app.candidateName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {app.jobTitle} · {app.company}
                </p>
              </div>

              {/* Badge + date */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge status={app.status} />
                <span className="text-xs text-gray-400">{formatDate(app.date)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default RecentApplications;
