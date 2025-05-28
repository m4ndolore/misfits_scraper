import * as React from "react";
import { Topic } from "../types";
import TopicDetailModal from './TopicDetailModal';

type Props = {
  topics?: Topic[];
  selectedTopicCodes: Set<string>;
  onTopicSelect: (topicCode: string, isSelected: boolean) => void;
  onSelectAll: (isSelected: boolean) => void;
  fontSize: string;
  sortColumn?: keyof Topic | null;
  sortDirection?: "asc" | "desc";
  onSort: (column: keyof Topic) => void;
  // INSERTION: Callback to notify parent component of selected topic codes
  onSelectionChange?: (selectedTopicCodes: Set<string>) => void;
  onDownloadPdf?: (topicCode: string) => void;
  downloadingPdf?: string | null; // Keep for backward compatibility
  isTopicDownloading?: (topicCode: string) => boolean; // New prop for download manager
};

const TopicsTable: React.FC<Props> = ({
  topics,
  selectedTopicCodes, // Use this from props
  onTopicSelect, // We still need this for compatibility
  onSelectAll, // We still need this for compatibility  
  sortColumn,
  sortDirection,
  onSort,
  fontSize,
  onSelectionChange,
  onDownloadPdf,
  downloadingPdf,
  isTopicDownloading,
}) => {
  console.log('TopicsTable - topics prop:', topics); // Debug log
  console.log('TopicsTable - selectedTopicCodes prop:', selectedTopicCodes); // Debug log
  
  const fontSizeStyle = {
    fontSize: fontSize === "small" ? "10pt" : fontSize === "large" ? "14pt" : "12pt",
  };

  // Remove local state since we're using props
  // const [selectedTopicCodes, setSelectedTopicCodes] = React.useState<Set<string>>(new Set());

  // --- INSERTION: Effect to notify parent of selection changes when topics change ---
  React.useEffect(() => {
    // When topics change, filter selectedTopicCodes to only include current topic codes
    const currentTopicCodes = new Set(topics?.map(t => t.topicCode) || []);
    const filteredSelection = new Set(
      Array.from(selectedTopicCodes).filter(code => currentTopicCodes.has(code))
    );
    
    // Only update if the filtered selection is different
    if (filteredSelection.size !== selectedTopicCodes.size) {
      onSelectionChange?.(filteredSelection);
    }
  }, [topics, selectedTopicCodes, onSelectionChange]);
  // --- END INSERTION ---

  // --- INSERTION: Determine if all current topics are selected ---
  const areAllCurrentTopicsSelected = React.useMemo(() => {
    if (!topics || topics.length === 0) {
      return false;
    }
    return topics.every(topic => selectedTopicCodes.has(topic.topicCode));
  }, [topics, selectedTopicCodes]);
  // --- END INSERTION ---

  // --- INSERTION: Handler for "Select All" checkbox change ---
  const handleSelectAllChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSelectedTopicCodes = new Set<string>();
    if (event.target.checked && topics) {
      topics.forEach(topic => newSelectedTopicCodes.add(topic.topicCode));
    }
    
    // Primary handler - this is what we rely on
    if (onSelectionChange) {
      onSelectionChange(newSelectedTopicCodes);
    }
  };
  // --- END INSERTION ---

  // --- INSERTION: Handler for individual topic row checkbox change ---
  const handleRowSelectChange = (topicCode: string, isSelected: boolean) => {
    const newSelectedTopicCodes = new Set(selectedTopicCodes);
    if (isSelected) {
      newSelectedTopicCodes.add(topicCode);
    } else {
      newSelectedTopicCodes.delete(topicCode);
    }
    
    // Primary handler - this is what we rely on
    if (onSelectionChange) {
      onSelectionChange(newSelectedTopicCodes);
    }
  };
  // --- END INSERTION ---

  // Helper function to check if topic is downloading - supports both old and new approach
  const checkIsDownloading = (topicCode: string): boolean => {
    if (isTopicDownloading) {
      return isTopicDownloading(topicCode);
    }
    // Fallback to old approach for backward compatibility
    return downloadingPdf === topicCode;
  };

  const [selectedTopic, setSelectedTopic] = React.useState<Topic | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleRowClick = (topic: Topic) => {
    setSelectedTopic(topic);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTopic(null);
  };

  if (!Array.isArray(topics) || topics.length === 0) {
    return (
      <div className="alert alert-info" style={fontSizeStyle}>
        <div className="d-flex align-items-center">
          <i className="bi bi-info-circle-fill me-2"></i>
          <span>No topics found. Try adjusting your search or filters.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="table-responsive">
        <table style={fontSizeStyle} className="table table-striped table-bordered table-hover">
        <thead className="table-dark">
          <tr>
            {/* Checkbox for "Select All" */}
            <th style={{ width: '50px' }}>
              <div className="form-check d-flex justify-content-center">
                <input
                  type="checkbox"
                  className="form-check-input"
                  aria-label="Select all topics on this page"
                  checked={areAllCurrentTopicsSelected}
                  onChange={handleSelectAllChange}
                  disabled={!topics || topics.length === 0}
                />
              </div>
            </th>
            
            {/* Sortable columns */}
            <th onClick={() => onSort("topicCode")} className="cursor-pointer">
              Topic Code
              {sortColumn === "topicCode" && (
                <i className={`ms-1 bi bi-caret-${sortDirection === "asc" ? "up" : "down"}-fill`}></i>
              )}
            </th>
            
            <th onClick={() => onSort("topicTitle")} className="cursor-pointer">
              Topic Title
              {sortColumn === "topicTitle" && (
                <i className={`ms-1 bi bi-caret-${sortDirection === "asc" ? "up" : "down"}-fill`}></i>
              )}
            </th>
            
            <th 
              onClick={() => onSort("numQuestions")} 
              className="cursor-pointer"
            >
              Questions
              {sortColumn === "numQuestions" && (
                <i className={`ms-1 bi bi-caret-${sortDirection === "asc" ? "up" : "down"}-fill`}></i>
              )}
            </th>
            
            <th>Phase</th>
            
            <th onClick={() => onSort("component")} className="cursor-pointer">
              Component
              {sortColumn === "component" && (
                <i className={`ms-1 bi bi-caret-${sortDirection === "asc" ? "up" : "down"}-fill`}></i>
              )}
            </th>
            
            <th onClick={() => onSort("program")} className="cursor-pointer">
              Program
              {sortColumn === "program" && (
                <i className={`ms-1 bi bi-caret-${sortDirection === "asc" ? "up" : "down"}-fill`}></i>
              )}
            </th>
            
            <th onClick={() => onSort("topicStatus")} className="cursor-pointer">
              Status
              {sortColumn === "topicStatus" && (
                <i className={`ms-1 bi bi-caret-${sortDirection === "asc" ? "up" : "down"}-fill`}></i>
              )}
            </th>
            
            <th>Solicitation</th>
            <th>TPOC Name</th>
            <th>TPOC Email</th>
            <th>TPOC Phone</th>
            
            {/* Add Download column header if download function is provided */}
            {onDownloadPdf && (
              <th style={{ width: '80px' }} className="text-center">
                <i className="bi bi-download" title="Download PDFs"></i>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {topics.map((topic) => (
            <tr 
              key={topic.topicCode} 
              className={`${selectedTopicCodes.has(topic.topicCode) ? 'table-active' : ''}`}
            >
              {/* Checkbox for individual row selection */}
              <td 
                className="text-center"
                onClick={(e) => e.stopPropagation()} // Prevent row click when clicking checkbox
              >
                <div className="form-check d-flex justify-content-center">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    aria-label={`Select topic ${topic.topicTitle}`}
                    checked={selectedTopicCodes.has(topic.topicCode)}
                    onChange={(e) => handleRowSelectChange(topic.topicCode, e.target.checked)}
                  />
                </div>
              </td>
              
              <td 
                className="text-nowrap"
                onClick={() => handleRowClick(topic)}
                style={{ cursor: 'pointer' }}
              >
                {topic.topicCode}
              </td>
              
              <td 
                onClick={() => handleRowClick(topic)}
                style={{ cursor: 'pointer', color: '#1976d2', textDecoration: 'underline' }}
              >
                {topic.topicTitle}
              </td>
              
              <td 
                onClick={() => handleRowClick(topic)}
                style={{ cursor: 'pointer' }}
              >
                {topic.numQuestions}
              </td>
              
              <td 
                onClick={() => handleRowClick(topic)}
                style={{ cursor: 'pointer' }}
              >
                {(() => {
                  try {
                    // Ensure topic.phaseHierarchy is a string before parsing
                    const phaseHierarchyString = typeof topic.phaseHierarchy === 'string' ? topic.phaseHierarchy : null;
                    if (!phaseHierarchyString) return <span className="text-muted">N/A</span>;

                    const parsed = JSON.parse(phaseHierarchyString);
                    const phases = parsed?.config?.map((phase: any) => phase.displayValue) || [];
                    
                    return phases.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1">
                        {phases.map((phase: string, index: number) => (
                          <span key={index} className="badge bg-primary">
                            {phase}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted">N/A</span>
                    );
                  } catch {
                    return <span className="text-muted">N/A</span>;
                  }
                })()}
              </td>
              
              <td 
                onClick={() => handleRowClick(topic)}
                style={{ cursor: 'pointer' }}
              >
                {topic.component || <span className="text-muted">N/A</span>}
              </td>
              
              <td 
                onClick={() => handleRowClick(topic)}
                style={{ cursor: 'pointer' }}
              >
                {topic.program || <span className="text-muted">N/A</span>}
              </td>
              
              <td 
                onClick={() => handleRowClick(topic)}
                style={{ cursor: 'pointer' }}
              >
                {topic.topicStatus ? (
                  <span className={`badge bg-${topic.topicStatus.toLowerCase() === 'open' ? 'success' : 'secondary'}`}>
                    {topic.topicStatus}
                  </span>
                ) : (
                  <span className="text-muted">N/A</span>
                )}
              </td>
              
              <td 
                onClick={() => handleRowClick(topic)}
                style={{ cursor: 'pointer' }}
              >
                {topic.solicitationTitle || <span className="text-muted">N/A</span>}
              </td>
              
              <td 
                onClick={() => handleRowClick(topic)}
                style={{ cursor: 'pointer' }}
              >
                {topic.topicManagers?.[0]?.name || <span className="text-muted">Not Provided</span>}
              </td>
              
              <td onClick={(e) => e.stopPropagation()}> {/* Prevent row click for email links */}
                {topic.topicManagers?.[0]?.email ? (
                  <a href={`mailto:${topic.topicManagers[0].email}`} className="text-decoration-none">
                    {topic.topicManagers[0].email}
                  </a>
                ) : (
                  <span className="text-muted">Not Provided</span>
                )}
              </td>
              
              <td onClick={(e) => e.stopPropagation()}> {/* Prevent row click for phone links */}
                {topic.topicManagers?.[0]?.phone ? (
                  <a href={`tel:${topic.topicManagers[0].phone.replace(/[^\d+]/g, '')}`} className="text-decoration-none">
                    {topic.topicManagers[0].phone}
                  </a>
                ) : (
                  <span className="text-muted">Not Provided</span>
                )}
              </td>
              
              {/* Download button cell */}
              {onDownloadPdf && (
                <td 
                  className="text-center"
                  onClick={(e) => e.stopPropagation()} // Prevent row click when clicking download
                >
                  <button 
                    onClick={() => onDownloadPdf(topic.topicCode)}
                    disabled={checkIsDownloading(topic.topicCode)}
                    className={`btn btn-sm ${checkIsDownloading(topic.topicCode) ? 'btn-secondary' : 'btn-outline-primary'}`}
                    title={checkIsDownloading(topic.topicCode) ? 'Download in progress...' : 'Download PDF'}
                  >
                    {checkIsDownloading(topic.topicCode) ? (
                      <>
                        <i className="bi bi-hourglass-split"></i>
                        <span className="d-none d-md-inline ms-1">...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-download"></i>
                        <span className="d-none d-md-inline ms-1">PDF</span>
                      </>
                    )}
                  </button>
                </td>
              )}    
            </tr>
          ))}
        </tbody>
        </table>
      </div>
      <TopicDetailModal
        open={isModalOpen}
        onClose={handleCloseModal}
        topic={selectedTopic}
      />
    </div>
  );
};

export default TopicsTable;