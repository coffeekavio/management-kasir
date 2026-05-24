'use client';

import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: number;
  trend?: 'up' | 'down';
}

export const StatCard = ({ title, value, icon, change, trend }: StatCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <ArrowUpRight size={16} className="text-green-500" />
              ) : (
                <ArrowDownRight size={16} className="text-red-500" />
              )}
              <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                {change}% dari bulan lalu
              </span>
            </div>
          )}
        </div>
        <div className="text-blue-400 opacity-20">{icon}</div>
      </div>
    </div>
  );
};
