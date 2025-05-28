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

// Download Manager Types
interface Download {
  id: string;
  topicCode: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress: number;
  filename: string | null;
  error: string | null;
  startTime: Date;
}

// Main App component
interface AppContentProps {
  selectedTopicCodes: Set<string>;
  onTopicsChange: (topics: Topic[]) => void;
  topics: Topic[];
}

const AppContent: React.FC<AppContentProps> = ({
  selectedTopicCodes: initialSelectedTopicCodes,
  onTopicsChange,
  topics,
}: AppContentProps) => {
  const { schema, isLoading } = useFilterContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  // Initialize with Open and Pre-release status filters by default
  const [filters, setFilters] = useState<Record<string, string[]>>({
    topicStatuses: ['591', '592'] // 591 = Open, 592 = Pre-release
  });
  // Initialize applied filters with the same default values
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({
    topicStatuses: ['591', '592'] // 591 = Open, 592 = Pre-release
  });
  const [selectedPdfIds, setSelectedPdfIds] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<keyof Topic | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Local state for selected topics
  const [selectedTopicCodes, setSelectedTopicCodes] = useState<Set<string>>(initialSelectedTopicCodes);
  
  // Download Manager State
  const [downloads, setDownloads] = useState<Download[]>([]);

  console.log('AppContent - selectedTopicCodes state:', selectedTopicCodes); // Debug log

  const exportToCSV = useCallback(() => {
    if (!topics || topics.length === 0) {
      alert("No topics available to export.");
      return;
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
      
      // Debug: Log raw API topic data with status values
      console.log('Raw API topic data with status values:', apiTopics.map(t => ({
        topicCode: t.topicCode,
        topicStatus: t.topicStatus
      })));
      
      const transformedTopics: Topic[] = apiTopics.map(topic => {
        // Debug: Log individual topic status before transformation
        console.log(`Topic ${topic.topicCode} status before transform:`, topic.topicStatus);
        
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
      
      // Debug: Log transformed topics with their status values
      console.log('Transformed topics with status values:', transformedTopics.map(t => ({
        topicCode: t.topicCode,
        topicStatus: t.topicStatus
      })));

      const totalCount = res.data.total || 0;
      onTopicsChange(transformedTopics);
      setTotalResults(totalCount);
      setTotalPages(Math.ceil(totalCount / rowsPerPage));
    } catch (error) {
      console.error('Error fetching topics:', error);
      onTopicsChange([]);
      setTotalResults(0);
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
    console.log('App - handleSelectionChange called with:', selected); // Debug log
    // This is now the single source of truth for selection state
    setSelectedTopicCodes(selected);
    
    const ids = new Set(
      topics
        .filter((t) => selected.has(t.topicCode))
        .map((t) => t.topicId)
    );
    setSelectedPdfIds(ids);
  }, [topics]);

  // Bulk Download Function
  const handleBulkDownload = async () => {
    if (selectedTopicCodes.size === 0) {
      alert('Please select topics to download PDFs for.');
      return;
    }

    const selectedTopics = Array.from(selectedTopicCodes);
    
    // Start downloads for all selected topics
    for (const topicCode of selectedTopics) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between downloads
      startDownload(topicCode);
    }
  };

  // Download Manager Functions
  const startDownload = async (topicCode: string) => {
    const downloadId = Date.now().toString();
    
    console.log('Starting download for topic code:', topicCode);
    
    const newDownload: Download = {
      id: downloadId,
      topicCode,
      status: 'pending',
      progress: 0,
      filename: null,
      error: null,
      startTime: new Date()
    };
    
    setDownloads(prev => [newDownload, ...prev]);

    try {
      // Update to downloading status
      setDownloads(prev => prev.map(d => 
        d.id === downloadId 
          ? { ...d, status: 'downloading' }
          : d
      ));

      // Start both downloads simultaneously
      const [officialPdfResult, detailsPdfResult] = await Promise.allSettled([
        downloadOfficialPdf(topicCode),
        downloadTopicDetailsPdf(topicCode)
      ]);

      // Check results
      let hasError = false;
      let errorMessage = '';

      if (officialPdfResult.status === 'rejected') {
        hasError = true;
        errorMessage += `Official PDF: ${officialPdfResult.reason}. `;
      }

      if (detailsPdfResult.status === 'rejected') {
        hasError = true;
        errorMessage += `Details PDF: ${detailsPdfResult.reason}. `;
      }

      if (hasError) {
        throw new Error(errorMessage.trim());
      }

      // Update to completed status
      setDownloads(prev => prev.map(d => 
        d.id === downloadId 
          ? { 
              ...d, 
              status: 'completed', 
              filename: `${topicCode}_official.pdf & ${topicCode}_details.pdf`,
              progress: 100 
            }
          : d
      ));

      // Auto-remove completed downloads after 10 seconds
      setTimeout(() => {
        setDownloads(prev => prev.filter(d => d.id !== downloadId));
      }, 10000);

    } catch (error: unknown) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      setDownloads(prev => prev.map(d => 
        d.id === downloadId 
          ? { 
              ...d, 
              status: 'error', 
              error: errorMessage 
            }
          : d
      ));
    }
  };

  // API base URL - use relative URLs since frontend and backend are on same domain
  const API_BASE_URL = '';  // Empty string for same-origin requests

  // Download official PDF function
  const downloadOfficialPdf = async (topicCode: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/download-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/pdf',
      },
      mode: 'cors',
      body: JSON.stringify({ topicCode }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to download official PDF';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        console.error('Could not parse error response:', e);
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    
    if (!blob || blob.size === 0) {
      throw new Error('Received empty official PDF file');
    }

    // Create download link for official PDF
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topic_${topicCode}_official.pdf`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  // Download topic details PDF function
  const downloadTopicDetailsPdf = async (topicCode: string): Promise<void> => {
    try {
      console.log('Starting details PDF generation for:', topicCode);
      
      // Find the topic in our current topics list
      const topic = topics.find(t => t.topicCode === topicCode);
      if (!topic) {
        throw new Error(`Topic ${topicCode} not found in current results`);
      }

      console.log('Found topic:', topic.topicTitle);

      // Fetch detailed topic information including Q&A
      console.log('Fetching detailed topic data...');
      const [detailsResponse, qaResponse] = await Promise.allSettled([
        axios.get(`https://www.dodsbirsttr.mil/topics/api/public/topics/${topic.topicId}/details`),
        axios.get(`https://www.dodsbirsttr.mil/topics/api/public/topics/${topic.topicId}/questions`)
      ]);

      let topicDetails = topic;
      let questions: any[] = [];

      if (detailsResponse.status === 'fulfilled') {
        topicDetails = { ...topic, ...detailsResponse.value.data };
        console.log('Topic details fetched successfully');
      } else {
        console.warn('Failed to fetch topic details:', detailsResponse.reason);
      }

      if (qaResponse.status === 'fulfilled') {
        questions = qaResponse.value.data || [];
        // Sort by questionNo in ascending order
        questions.sort((a, b) => (a.questionNo || 0) - (b.questionNo || 0));
        console.log('Q&A data fetched successfully, questions:', questions.length);
      } else {
        console.warn('Failed to fetch Q&A data:', qaResponse.reason);
      }

      console.log('Sending data to PDF generator...');
      console.log('Topic data keys:', Object.keys(topicDetails));
      console.log('Questions count:', questions.length);

      // Send to backend to generate PDF
      const response = await fetch(`${API_BASE_URL}/api/generate-topic-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf',
        },
        mode: 'cors',
        body: JSON.stringify({ 
          topic: topicDetails,
          questions: questions
        }),
      });

      console.log('PDF generator response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Failed to generate topic details PDF';
        let errorDetails = null;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData.details || errorData.stack || null;
          console.error('PDF generation error details:', errorData);
        } catch (e) {
          console.error('Could not parse error response:', e);
          const textResponse = await response.text();
          console.error('Raw error response:', textResponse);
        }
        
        throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
      }

      const blob = await response.blob();
      console.log('PDF blob received, size:', blob.size);
      
      if (!blob || blob.size === 0) {
        throw new Error('Received empty details PDF file');
      }

      // Create download link for details PDF
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `topic_${topicCode}_details.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);

      console.log('Details PDF download initiated successfully');

    } catch (error) {
      console.error('Error generating topic details PDF:', error);
      throw new Error(`Failed to generate details PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const removeDownload = (downloadId: string) => {
    setDownloads(prev => prev.filter(d => d.id !== downloadId));
  };

  const getStatusIcon = (status: Download['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'downloading': return '⬇️';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getElapsedTime = (startTime: Date) => {
    const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    return elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
  };

  const handleDownloadPdf = (topicCode: string) => {
    startDownload(topicCode);
  };

  const handleSort = (column: keyof Topic) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Check if topic is currently downloading
  const isTopicDownloading = (topicCode: string) => {
    return downloads.some(d => d.topicCode === topicCode && d.status === 'downloading');
  };

  if (isLoading) {
    return <div className="text-center p-5">Loading filters...</div>;
  }

  return (
    <div className="container-fluid p-0">      
      {/* Sticky Header - Fixed Bootstrap classes */}
      <header className="bg-primary text-white py-3 position-sticky top-0" style={{ zIndex: 1030 }}>
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
                
                {/* Bulk Download Button */}
                <button
                  onClick={handleBulkDownload}
                  disabled={selectedTopicCodes.size === 0}
                  className={`btn btn-success btn-sm ${selectedTopicCodes.size === 0 ? 'opacity-50' : ''}`}
                  title={selectedTopicCodes.size === 0 ? 'Select topics to download PDFs' : `Download PDFs for ${selectedTopicCodes.size} selected topics`}
                >
                  <i className="bi bi-download me-1"></i>
                  Bulk PDFs ({selectedTopicCodes.size})
                </button>
                
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

        {/* Download Queue */}
        {downloads.length > 0 && (
          <div className="mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-download me-2"></i>
                  Downloads ({downloads.length})
                </h5>
              </div>
              <div className="card-body p-0">
                {downloads.map((download) => (
                  <div key={download.id} className="d-flex align-items-center justify-content-between p-3 border-bottom">
                    <div className="d-flex align-items-center">
                      <span className="me-2 fs-5">{getStatusIcon(download.status)}</span>
                      <div>
                        <div className="fw-medium">Topic {download.topicCode}</div>
                        <div className="small text-muted">
                          {download.status === 'pending' && 'Preparing downloads...'}
                          {download.status === 'downloading' && `Downloading official PDF + details PDF... (${getElapsedTime(download.startTime)})`}
                          {download.status === 'completed' && `✅ Both files downloaded: ${download.filename}`}
                          {download.status === 'error' && `❌ Error: ${download.error}`}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center">
                      {download.status === 'downloading' && (
                        <div className="progress me-3" style={{width: '120px', height: '6px'}}>
                          <div 
                            className="progress-bar progress-bar-striped progress-bar-animated"
                            style={{ width: '60%' }}
                          ></div>
                        </div>
                      )}
                      
                      {(download.status === 'completed' || download.status === 'error') && (
                        <button
                          onClick={() => removeDownload(download.id)}
                          className="btn btn-sm btn-outline-secondary"
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mt-4 mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <span className="text-primary font-weight-bold">{totalResults}</span> {totalResults === 1 ? 'result' : 'results'} found
            </h5>
          </div>
        </div>

        {/* Results Table & Pagination */}
        <div className="mt-2">
          <TopicsTable
            topics={topics}
            selectedTopicCodes={selectedTopicCodes}  
            onTopicSelect={() => {}} // Dummy handler       
            onSelectAll={() => {}} // Dummy handler           
            fontSize={fontSize}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            onSelectionChange={handleSelectionChange}
            onDownloadPdf={handleDownloadPdf}
            downloadingPdf={null} // We'll manage this through the downloads array now
            isTopicDownloading={isTopicDownloading} // Pass this new function
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

      {/* Toast Notifications */}
      <div className="position-fixed top-0 end-0 p-3" style={{zIndex: 1055}}>
        {downloads
          .filter(d => d.status === 'completed')
          .slice(0, 3)
          .map((download) => (
            <div
              key={download.id}
              className="toast show mb-2"
              role="alert"
            >
              <div className="toast-header bg-success text-white">
                <i className="bi bi-check-circle-fill me-2"></i>
                <strong className="me-auto">Download Complete</strong>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => removeDownload(download.id)}
                ></button>
              </div>
              <div className="toast-body">
                Topic {download.topicCode}: Official PDF + Details PDF downloaded successfully!
              </div>
            </div>
          ))}

        {downloads
          .filter(d => d.status === 'error')
          .slice(0, 2)
          .map((download) => (
            <div
              key={download.id}
              className="toast show mb-2"
              role="alert"
            >
              <div className="toast-header bg-danger text-white">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <strong className="me-auto">Download Failed</strong>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => removeDownload(download.id)}
                ></button>
              </div>
              <div className="toast-body">
                {download.error}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// Wrap your app with FilterProvider
const App = () => {
  const [selectedTopicCodes, setSelectedTopicCodes] = useState<Set<string>>(new Set());
  const [topics, setTopics] = useState<Topic[]>([]);

  return (
    <FilterProvider>
      <AppContent 
        selectedTopicCodes={selectedTopicCodes}
        onTopicsChange={setTopics}
        topics={topics}
      />
    </FilterProvider>
  );
};

export default App;