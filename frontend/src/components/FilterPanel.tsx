// src/components/FilterPanel.tsx
import React from 'react';
import Select from 'react-select';
import { FilterSchema } from '../types';

type FilterPanelProps = {
  schema: FilterSchema;
  selectedFilters: Record<string, string[]>;
  onFilterChange: (name: string, values: string[]) => void;
  onApply: () => void;
  fontSize: string;
};

const FilterPanel: React.FC<FilterPanelProps> = ({
  schema,
  selectedFilters,
  onFilterChange,
  onApply,
  fontSize,
}) => {
  return (
    <div className="p-4" style={{ fontSize }}>
      <h3 className="text-lg font-semibold mb-4">Filters</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block mb-2">Components</label>
          <Select
            isMulti
            options={schema.components}
            value={schema.components.filter(option => 
              selectedFilters.components?.includes(option.value) || false
            )}
            onChange={(selected) => 
              onFilterChange('components', selected ? selected.map(s => s.value) : [])
            }
            className="text-black"
          />
        </div>

        <div>
          <label className="block mb-2">Programs</label>
          <Select
            isMulti
            options={schema.programs}
            value={schema.programs.filter(option => 
              selectedFilters.programs?.includes(option.value) || false
            )}
            onChange={(selected) => 
              onFilterChange('programs', selected ? selected.map(s => s.value) : [])
            }
            className="text-black"
          />
        </div>

        <div>
          <label className="block mb-2">Modernization Priorities</label>
          <Select
            isMulti
            options={schema.modernizationPriorities}
            value={schema.modernizationPriorities.filter(option => 
              selectedFilters.modernizationPriorities?.includes(option.value) || false
            )}
            onChange={(selected) => 
              onFilterChange('modernizationPriorities', selected ? selected.map(s => s.value) : [])
            }
            className="text-black"
          />
        </div>

        <div>
          <label className="block mb-2">Topic Status</label>
          <Select
            isMulti
            options={schema.topicStatuses}
            value={schema.topicStatuses.filter(option => 
              selectedFilters.topicStatuses?.includes(option.value) || false
            )}
            onChange={(selected) => 
              onFilterChange('topicStatuses', selected ? selected.map(s => s.value) : [])
            }
            className="text-black"
          />
        </div>
      </div>

      <button 
        onClick={onApply} 
        className="mt-4 bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600"
      >
        Apply Filters
      </button>
    </div>
  );
};

export default FilterPanel;