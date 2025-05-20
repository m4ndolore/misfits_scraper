import * as React from "react";
import { Topic } from "../types/Topic";

type Props = {
  topics?: Topic[];
  sortColumn?: keyof Topic | null;
  sortDirection?: "asc" | "desc";
  onSort: (column: keyof Topic) => void;
  fontSize: string;
  // INSERTION: Callback to notify parent component of selected topic codes
  onSelectionChange?: (selectedTopicCodes: Set<string>) => void;
};

const TopicsTable: React.FC<Props> = ({
  topics,
  sortColumn,
  sortDirection,
  onSort,
  fontSize,
  // INSERTION: Destructure the new prop
  onSelectionChange,
}) => {
  console.log('TopicsTable - topics prop:', topics); // Debug log
  
  const fontSizeStyle = {
    fontSize: fontSize === "small" ? "10pt" : fontSize === "large" ? "14pt" : "12pt",
  };

  // --- INSERTION: State for selected topic codes ---
  const [selectedTopicCodes, setSelectedTopicCodes] = React.useState<Set<string>>(new Set());
  // --- END INSERTION ---

  // --- INSERTION: Effect to clear selections when topics list changes ---
  React.useEffect(() => {
    // Only reset selections if we have topics and the topic codes have actually changed
    const currentTopicCodes = new Set(topics?.map(t => t.topicCode) || []);
    const hasChanged = selectedTopicCodes.size > 0 && 
      (selectedTopicCodes.size !== currentTopicCodes.size || 
       !Array.from(selectedTopicCodes).every(code => currentTopicCodes.has(code)));
    
    if (hasChanged) {
      const newSelection = new Set<string>();
      setSelectedTopicCodes(newSelection);
      onSelectionChange?.(newSelection);
    }
  }, [topics]); // Only depend on topics
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
    setSelectedTopicCodes(newSelectedTopicCodes);
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
    setSelectedTopicCodes(newSelectedTopicCodes);
    if (onSelectionChange) {
      onSelectionChange(newSelectedTopicCodes);
    }
  };
  // --- END INSERTION ---

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
          </tr>
        </thead>
        <tbody>
          {topics.map((topic) => (
            <tr 
              key={topic.topicCode} 
              className={`${selectedTopicCodes.has(topic.topicCode) ? 'table-active' : ''}`}
            >
              {/* Checkbox for individual row selection */}
              <td className="text-center">
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
              
              <td className="text-nowrap">{topic.topicCode}</td>
              <td>{topic.topicTitle}</td>
              <td>
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
              <td>{topic.component || <span className="text-muted">N/A</span>}</td>
              <td>{topic.program || <span className="text-muted">N/A</span>}</td>
              <td>
                {topic.topicStatus ? (
                  <span className={`badge bg-${topic.topicStatus.toLowerCase() === 'open' ? 'success' : 'secondary'}`}>
                    {topic.topicStatus}
                  </span>
                ) : (
                  <span className="text-muted">N/A</span>
                )}
              </td>
              <td>{topic.solicitationTitle || <span className="text-muted">N/A</span>}</td>
              <td>{topic.topicManagers?.[0]?.name || <span className="text-muted">N/A</span>}</td>
              <td>
                {topic.topicManagers?.[0]?.email ? (
                  <a href={`mailto:${topic.topicManagers[0].email}`} className="text-decoration-none">
                    {topic.topicManagers[0].email}
                  </a>
                ) : (
                  <span className="text-muted">N/A</span>
                )}
              </td>
              <td>
                {topic.topicManagers?.[0]?.phone ? (
                  <a href={`tel:${topic.topicManagers[0].phone.replace(/[^\d+]/g, '')}`} className="text-decoration-none">
                    {topic.topicManagers[0].phone}
                  </a>
                ) : (
                  <span className="text-muted">N/A</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopicsTable;
