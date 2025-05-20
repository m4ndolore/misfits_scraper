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
      
      const res = await axios.get<{ data: ApiTopicForFetch[], total: number }>(url);
      const apiTopics = res.data.data || [];
      
      console.log('API Response:', res.data); // Debug log
      
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

      console.log('Transformed Topics:', transformedTopics); // Debug log
      
      setTopics(transformedTopics);
      setTotalPages(Math.ceil((res.data.total || 0) / rowsPerPage));
    } catch (error) {
      console.error('Error fetching topics:', error);
      setTopics([]);
      setTotalPages(1);
    }
  }, [appliedFilters, searchTerm, rowsPerPage, page]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics, page, rowsPerPage]);

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
    {/* Header */}
    <header className="bg-[#1e3a5f] px-6 py-8 shadow-md text-white">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-5xl font-extrabold leading-tight text-white">
            Misfit powered by
            <br />
            <span className="text-yellow-400 font-bold">The Merge Combinator</span>
          </h1>
          <h2 className="text-xl mt-2 text-gray-200 font-normal">The GCH SIBR/STTR Wizard</h2>
        </div>
        <div className="self-start md:self-center">
          <FontSizeToggle currentSize={fontSize} onChange={setFontSize} />
        </div>
      </div>
    </header>

    {/* Main Content */}
    <main className="p-4 space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch}>
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

      {/* Filter Panel */}
      <FilterPanel
        schema={schema}
        selectedFilters={filters}
        onFilterChange={(name: string, values: string[]) => {
          setFilters(prev => ({ ...prev, [name]: values }));
        }}
        onApply={() => {
          setAppliedFilters({ ...filters });
          setPage(0);
        }}
        fontSize={fontSize}
      />

      {/* Results Table & Pagination */}
      <div>
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
          className="mt-4"
          fontSize={fontSize}
        />
      </div>
    </main>
    </div>
  );
}

// Wrap your app with FilterProvider
const App = () => (
  <FilterProvider>
    <AppContent />
  </FilterProvider>
);

export default App;