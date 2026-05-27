import React from 'react';
import { relationTypes } from '../constants';

export function Legend() {
  return (
    <div className="absolute right-4 top-4 bg-white p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-3">Légende</h3>
      <div className="space-y-2">
        {relationTypes.map(type => (
          <div key={type.type} className="flex items-center gap-2">
            <type.icon size={20} color={type.color} />
            <span>{type.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}