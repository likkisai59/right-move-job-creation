import React, { useEffect, useRef } from 'react';
import Card, { CardHeader } from '../common/Card';
import { getPipelineBarColor } from '../../utils/formatters';

const PipelineBar = ({ stage, percentage, count, colorClass }) => {
  const barRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (barRef.current) {
        barRef.current.style.width = `${percentage}%`;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-20 shrink-0">{stage}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out`}
          style={{ width: '0%' }}
        />
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-sm font-semibold text-gray-800">{count}</span>
        <span className="text-xs text-gray-400">({percentage}%)</span>
      </div>
    </div>
  );
};

const PipelineCard = ({ data = [] }) => {
  return (
    <Card>
      <CardHeader
        title="Hiring Pipeline"
        subtitle="Current candidates by stage"
      />
      <div className="flex flex-col gap-4">
        {data.map((item, i) => (
          <PipelineBar
            key={item.stage}
            stage={item.stage}
            percentage={item.percentage}
            count={item.count}
            colorClass={getPipelineBarColor(i)}
          />
        ))}
      </div>
    </Card>
  );
};

export default PipelineCard;
