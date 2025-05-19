// src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from "axios";
import { FilterProvider, useFilterContext } from "./contexts/FilterContext";
import { toSearchParam } from "./utils/filterUtils";
import { ApiTopicForFetch, Topic } from "./types";
import TopicsTable from "./components/TopicsTable";
import PaginationControls from "./components/PaginationControls";
import FilterPanel from "./components/FilterPanel";
import FontSizeToggle from "./components/FontSizeToggle";
import { FontSize } from "./types/FontSize";
import "./App.css";

// Main App component
const AppContent = () => {
  const { schema, isLoading } = useFilterContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [fontSize, setFontSize] = useState<FontSize>('medium'); // or 'small' or 'large'
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [selectedTopicCodes, setSelectedTopicCodes] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<keyof Topic | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fetchTopics = useCallback(async () => {
    try {
      const searchParams = toSearchParam({
        ...appliedFilters,
        searchText: searchTerm,
      });

      const encodedParams = encodeURIComponent(JSON.stringify(searchParams));
      const url = `https://www.dodsbirsttr.mil/topics/api/public/topics/search?searchParam=${encodedParams}&size=${rowsPerPage}&page=${page}`;
      
      const res = await axios.get<{ content: ApiTopicForFetch[], totalElements: number }>(url);
      const apiTopics = res.data.content || [];
      
      const transformedTopics: Topic[] = apiTopics.map(topic => ({
        topicCode: topic.topicCode,
        topicId: topic.topicId,
        topicTitle: topic.topicTitle || "N/A",
        phaseHierarchy: topic.phaseHierarchy || "",
        component: topic.component || "N/A",
        program: topic.program || "N/A",
        topicStatus: topic.topicStatus || "N/A",
        solicitationTitle: topic.solicitationTitle || "N/A",
        topicManagers: topic.topicManagers || [],
      }));

      setTopics(transformedTopics);
      setTotalPages(Math.ceil((res.data.totalElements || 0) / rowsPerPage));
    } catch (error) {
      console.error('Error fetching topics:', error);
      setTopics([]);
      setTotalPages(1);
    }
  }, [appliedFilters, searchTerm, page, rowsPerPage]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchTopics();
  };

  const handleSelectionChange = (selected: Set<string>) => {
    setSelectedTopicCodes(selected);
    // You can add any additional logic here when selection changes
  };

  const handleSort = (column: keyof Topic) => {
    // If the same column is clicked, toggle the sort direction
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, set to ascending by default
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
    return <div>Loading filters...</div>;
  }

  return (
    <div className="min-h-screen bg-[#355e93] text-white">
      <div className="flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold">Misfit Scraper</h1>
        <FontSizeToggle currentSize={fontSize} onChange={setFontSize} />
      </div>

      <form onSubmit={handleSearch} className="p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search topics..."
            className="flex-1 p-2 border rounded text-black"
          />
          <button 
            type="submit" 
            className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600"
          >
            Search
          </button>
        </div>
      </form>

      <FilterPanel
        schema={schema}
        selectedFilters={filters}
        onFilterChange={(name: string, values: string[]) => {
          setFilters(prev => ({ ...prev, [name]: values }));
        }}
        onApply={() => {
          setAppliedFilters({...filters});
          setPage(0);
        }}
        fontSize={fontSize}
      />

      <div className="p-4">
        <TopicsTable
          topics={topics}
          onSelectionChange={handleSelectionChange}
          fontSize={fontSize}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
        
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="mt-4" fontSize={fontSize}        />
      </div>
    </div>
  );
};

// Wrap your app with FilterProvider
const App = () => (
  <FilterProvider>
    <AppContent />
  </FilterProvider>
);

export default App;