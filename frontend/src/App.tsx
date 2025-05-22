// src/App.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from "axios";
import { FilterProvider, useFilterContext } from "./contexts/FilterContext";
import { toSearchParam } from "./utils/filterUtils";
import { ApiTopicForFetch, Topic } from "./types";
import TopicsTable from "./components/TopicsTable";
import PaginationControls from "./components/PaginationControls";
import FilterPanel from "./components/FilterPanel";
import FontSizeToggle from "./components/FontSizeToggle";
import { FontSize } from "./types/FontSize";

// Main App component

interface AppContentProps {
  onTopicSelect: (topicCode: string, isSelected: boolean) => void;
  onSelectAll: (isSelected: boolean) => void;
  selectedTopicCodes: Set<string>;
  onTopicsChange: (topics: Topic[]) => void;
  topics: Topic[];
}

const AppContent: React.FC<AppContentProps> = ({
  onTopicSelect,
  onSelectAll,
  selectedTopicCodes, 
  onTopicsChange,
  topics,
}: AppContentProps) => {
  const { schema, isLoading } = useFilterContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [fontSize, setFontSize] = useState<FontSize>('medium'); // or 'small' or 'large'
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [selectedPdfIds, setSelectedPdfIds] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<keyof Topic | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  
  const exportToCSV = useCallback(() => {
    if (!topics || topics.length === 0) {
      alert("No topics available to export.");
      return;
    }

    // Debug: Log the first topic's manager structure
    if (topics.length > 0 && topics[0].topicManagers) {
      console.log('First topic managers:', topics[0].topicManagers);
      if (topics[0].topicManagers.length > 0) {
        console.log('First manager object:', topics[0].topicManagers[0]);
        console.log('Manager keys:', Object.keys(topics[0].topicManagers[0]));
      }
    }

    const headers = [
      "Topic Code", "Topic ID", "Title", "Phase", "Component", "Program", 
      "Status", "Solicitation", "TPOC Name", "TPOC Email", "TPOC Phone"
    ];

    const sanitizeCell = (cellData: any): string => {
      if (cellData === undefined || cellData === null) return '""';
      const str = String(cellData);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const getManagerField = (manager: any, field: string): any => {
      if (!manager) return '';
      // Try different possible field names
      return manager[field] || 
             manager[field.toLowerCase()] || 
             manager[field.toUpperCase()] || '';
    };

    const rows = topics.map((topic) => {
      let phaseDisplay = "N/A";
      try {
        if (topic.phaseHierarchy && typeof topic.phaseHierarchy === 'string') {
          const parsedPhase = JSON.parse(topic.phaseHierarchy);
          phaseDisplay = parsedPhase?.config?.map((phase: any) => phase.displayValue).join(", ") || "N/A";
        }
      } catch { /* Keep N/A */ }

      const manager = topic.topicManagers?.[0] || {};

      return [
        sanitizeCell(topic.topicCode),
        sanitizeCell(topic.topicId),
        sanitizeCell(topic.topicTitle),
        sanitizeCell(phaseDisplay),
        sanitizeCell(topic.component),
        sanitizeCell(topic.program),
        sanitizeCell(topic.topicStatus),
        sanitizeCell(topic.solicitationTitle),
        sanitizeCell(manager.name || ''),
        sanitizeCell(manager.email || ''),
        sanitizeCell(manager.phone || ''),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'topics.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [topics]);

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
      
      // Debug: Log the first API topic to see its structure
      if (apiTopics.length > 0) {
        console.log('First API topic raw data:', JSON.parse(JSON.stringify(apiTopics[0])));
      }
      
      const transformedTopics: Topic[] = apiTopics.map(topic => {
        // Debug: Log manager data before transformation
        console.log('Topic managers before transform:', topic.topicManagers);
        
        return {
          topicCode: topic.topicCode,
          topicId: topic.topicId,
          topicTitle: topic.topicTitle || "N/A",
          numQuestions: topic.noOfPublishedQuestions || 0,
          phaseHierarchy: topic.phaseHierarchy || "",
          component: topic.component || "N/A",
          program: topic.program || "N/A",
          topicStatus: topic.topicStatus || "N/A",
          solicitationTitle: topic.solicitationTitle || "N/A",
          topicManagers: topic.topicManagers || [],
        };
      });

      console.log('Transformed Topics:', transformedTopics);
      
      onTopicsChange(transformedTopics);
      setTotalPages(Math.ceil((res.data.total || 0) / rowsPerPage));
    } catch (error) {
      console.error('Error fetching topics:', error);
      onTopicsChange([]);
      setTotalPages(1);
    }
  }, [appliedFilters, searchTerm, rowsPerPage, page, onTopicsChange]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics, page, rowsPerPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchTopics();
  };

  const handleSelectionChange = useCallback((selected: Set<string>) => {
    // Update selection state for each topic
    topics.forEach(topic => {
      const isSelected = selected.has(topic.topicCode);
      onTopicSelect(topic.topicCode, isSelected);
    });
    
    // Update PDF IDs based on selected topic codes
    const ids = new Set(
      topics
        .filter((t) => selected.has(t.topicCode))
        .map((t) => t.topicId)
    );
    setSelectedPdfIds(ids);
  }, [topics, onTopicSelect]);

  const handleDownloadPdf = async (topicCode: string) => {
    console.log('Attempting to download PDF for topic code:', topicCode);
    try {
      setDownloadingPdf(topicCode);
      const response = await fetch('http://localhost:3001/api/download-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ topicCode }),  // Using topicCode directly
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download PDF');
      }
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `topic_${topicCode}.pdf`;  // Using topicCode in filename
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
  
    } catch (error: unknown) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Error downloading PDF: ${errorMessage}`);
    } finally {
      setDownloadingPdf(null);
    }
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
      {/* Header */}
      <header className="bg-primary text-white py-3">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
              <h4 className="h5 fw-bold mb-1">
                Misfit powered by <span className="text-warning">The Merge Combinator</span>
              </h4>
              <h1 className="h3 fw-light mb-0">The GCH SIBR/STTR Wizard</h1>
            </div>
            <div className="col-md-6">
              <div className="d-flex justify-content-center justify-content-md-end align-items-center flex-wrap gap-2">
                <button
                  onClick={exportToCSV}
                  className="btn btn-warning btn-sm"
                >
                  <i className="bi bi-file-earmark-spreadsheet me-1"></i> Export CSV
                </button>
                {/* <button
                  onClick={handleDownloadPdfs}
                  disabled={selectedPdfIds.size === 0}
                  className="btn btn-success btn-sm"
                >
                  <i className="bi bi-file-earmark-pdf me-1"></i> PDFs ({selectedPdfIds.size})
                </button> */}
                  {/* <button 
                      onClick={() => handleDownloadPdf(topic.topicId)}
                    disabled={downloadingPdf === topic.topicId}
                    className="btn btn-success btn-sm"
                  >
                    <i className="bi bi-file-earmark-pdf me-1"></i>
                    {downloadingPdf === topic.topicId ? 'Downloading...' : 'Download PDF'}
                  </button> */}
                <div className="d-flex align-items-center ms-2">
                  <div className="vr me-2" style={{height: '24px'}}></div>
                  <div className="d-flex flex-column align-items-center">
                    <FontSizeToggle currentSize={fontSize} onChange={setFontSize} />
                    <span className="text-white-50 small">Font Size</span>
                  </div>
                </div>
              </div>
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
              selectedTopicCodes={selectedTopicCodes}  
              onTopicSelect={onTopicSelect}       
              onSelectAll={onSelectAll}           
              fontSize={fontSize}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              onSelectionChange={handleSelectionChange}
              onDownloadPdf={handleDownloadPdf}
              downloadingPdf={downloadingPdf}
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
const App = () => {
  const [selectedTopicCodes, setSelectedTopicCodes] = useState<Set<string>>(new Set());
  const [topics, setTopics] = useState<Topic[]>([]);

  const handleTopicSelect = (topicCode: string, isSelected: boolean) => {
    const newSelected = new Set(selectedTopicCodes);
    if (isSelected) {
      newSelected.add(topicCode);
    } else {
      newSelected.delete(topicCode);
    }
    setSelectedTopicCodes(newSelected);
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected && topics) {
      const allCodes = new Set(topics.map(topic => topic.topicCode));
      setSelectedTopicCodes(allCodes);
    } else {
      setSelectedTopicCodes(new Set());
    }
  };

  return (
    <FilterProvider>
      <AppContent 
        onTopicSelect={handleTopicSelect}
        onSelectAll={handleSelectAll}
        selectedTopicCodes={selectedTopicCodes}
        onTopicsChange={setTopics}
        topics={topics}
      />
    </FilterProvider>
  );
};

export default App;