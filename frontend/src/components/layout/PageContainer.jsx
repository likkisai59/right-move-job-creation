import React, { useRef, useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const PageContainer = ({ title, subtitle, actions, children, className = '' }) => {
  const containerRef = useRef(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      setCanScrollUp(scrollTop > 0);
      setCanScrollDown(scrollTop < scrollHeight - clientHeight - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [children]);

  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollAmount = window.innerHeight * 0.7;
      containerRef.current.scrollBy({ top: direction === 'up' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div 
      ref={containerRef}
      onScroll={checkScroll}
      className={`flex-1 overflow-y-auto bg-gray-50 relative scroll-smooth ${className}`}
    >
      <div className="max-w-screen-xl mx-auto px-6 py-6 min-h-full">
        {(title || actions) && (
          <div className="flex items-start justify-between mb-6">
            <div>
              {title && <h1 className="text-xl font-semibold text-gray-900">{title}</h1>}
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 flex-wrap justify-end">{actions}</div>}
          </div>
        )}
        {children}
      </div>
      
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 transition-opacity">
        {canScrollUp && (
          <button onClick={() => scroll('up')} className="p-1.5 bg-white/90 backdrop-blur border rounded-full shadow-lg text-gray-500 hover:text-blue-600 opacity-60 hover:opacity-100 transition-all"><ArrowUp size={20} /></button>
        )}
        {canScrollDown && (
          <button onClick={() => scroll('down')} className="p-1.5 bg-white/90 backdrop-blur border rounded-full shadow-lg text-gray-500 hover:text-blue-600 opacity-60 hover:opacity-100 transition-all"><ArrowDown size={20} /></button>
        )}
      </div>
    </div>
  );
};

export default PageContainer;
