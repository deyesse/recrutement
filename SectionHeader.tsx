import React from 'react';

interface SectionHeaderProps {
  number: string;
  title: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ number, title }) => {
  return (
    <div className="flex items-center gap-3 mb-6 pb-2 border-b-2 border-primary-100">
      <span className="bg-primary-600 text-white font-bold px-3 py-1 rounded text-sm">
        {number}
      </span>
      <h2 className="text-xl font-bold text-primary-900">{title}</h2>
    </div>
  );
};