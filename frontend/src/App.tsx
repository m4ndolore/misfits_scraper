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

// Test component to verify Bootstrap is working
const BootstrapTest = () => (
  <div className="container mt-4">
    <div className="card" style={{ maxWidth: '24rem', margin: '0 auto' }}>
      <div className="card-body">
        <div className="d-flex align-items-center">
          <div className="me-3">
            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              <span className="fw-bold">BS</span>
            </div>
          </div>
          <div>
            <h5 className="card-title mb-1">Bootstrap</h5>
            <p className="card-text text-muted mb-0">You have a new message!</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

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
    return <div className="text-center p-5">Loading filters...</div>;
  }

  return (
    <div className="container-fluid p-0">
      <BootstrapTest />
      
      {/* Header */}
      <header className="bg-primary text-white py-4">
        <div className="container">
          <div className="d-flex justify-content-between align-items-start">
            <div className="flex-grow-1">
              <h1 className="display-5 fw-bold mb-2">
                Misfit powered by <br />
                <span className="text-warning">The Merge Combinator</span>
              </h1>
              <h2 className="h4 fw-light mb-3">
                The GCH SIBR/STTR Wizard
              </h2>
              <h3 className="display-6 text-danger">Bootstrap is Working!</h3>
            </div>
            <div className="d-flex flex-column align-items-end">
              <FontSizeToggle currentSize={fontSize} onChange={setFontSize} />
              <span className="text-white">Toggle font size</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-4">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="input-group">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search topics..."
              className="form-control"
            />
            <button
              type="submit"
              className="btn btn-warning"
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
        <div className="mt-4">
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