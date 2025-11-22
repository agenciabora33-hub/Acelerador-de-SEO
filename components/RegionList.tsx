import React from 'react';
import { RegionData } from '../types';
import { MapPin } from 'lucide-react';

interface RegionListProps {
  regions: RegionData[];
}

const RegionList: React.FC<RegionListProps> = ({ regions }) => {
  const maxVal = Math.max(...regions.map((r) => r.volume));

  return (
    <div className="space-y-4">
      {regions.map((region, index) => (
        <div key={index} className="relative">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-500" />
              <span className="font-medium text-slate-700">{region.name}</span>
            </div>
            <span className="text-sm text-slate-500 font-mono">{region.volume.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-brand-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${(region.volume / maxVal) * 100}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RegionList;