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
        // The imported module has a default property in Vite
        setSchema(schemaData.default);
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