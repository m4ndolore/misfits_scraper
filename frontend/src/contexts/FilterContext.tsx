// src/contexts/FilterContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FilterSchema, FilterOption } from '../types';

interface FilterContextType {
  schema: FilterSchema;
  isLoading: boolean;
  error: Error | null;
}

const defaultSchema: FilterSchema = {
  components: [],
  programs: [],
  topicStatuses: [],
  modernizationPriorities: [],
  technologyAreas: [],
  solicitations: [],
};

const FilterContext = createContext<FilterContextType>({
  schema: defaultSchema,
  isLoading: true,
  error: null,
});

export const useFilterContext = () => useContext(FilterContext);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [schema, setSchema] = useState<FilterSchema>(defaultSchema);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadSchema = async () => {
      try {
        // In Vite, JSON imports are already parsed as objects
        const schemaData = await import('../api_filter_schema.json');
        
        // The imported data might be in schemaData.default or directly in schemaData
        const rawData = schemaData.default || schemaData;
        
        // Transform the raw data to match FilterSchema
        const transformedData: FilterSchema = {
          components: [],
          programs: [],
          topicStatuses: [],
          modernizationPriorities: [],
          technologyAreas: [],
          solicitations: []
        };
        
        // Safely transform each field if it exists
        if (Array.isArray(rawData.components)) {
          transformedData.components = rawData.components.map((item: string) => ({
            value: item,
            label: item
          }));
        }
        
        if (Array.isArray(rawData.programs)) {
          transformedData.programs = rawData.programs.map((item: string) => ({
            value: item,
            label: item
          }));
        }
        
        if (rawData.topicReleaseStatus && typeof rawData.topicReleaseStatus === 'object') {
          transformedData.topicStatuses = Object.entries(rawData.topicReleaseStatus).map(([value, label]) => ({
            value,
            label: String(label)
          }));
        }
        
        if (Array.isArray(rawData.modernizationPriorities)) {
          transformedData.modernizationPriorities = rawData.modernizationPriorities.map((item: string) => ({
            value: item,
            label: item
          }));
        }
        
        setSchema(transformedData);
      } catch (err) {
        console.error('Failed to load filter schema:', err);
        setError(err instanceof Error ? err : new Error('Failed to load filter schema'));
      } finally {
        setIsLoading(false);
      }
    };

    loadSchema();
  }, []);

  return (
    <FilterContext.Provider value={{ schema, isLoading, error }}>
      {children}
    </FilterContext.Provider>
  );
};