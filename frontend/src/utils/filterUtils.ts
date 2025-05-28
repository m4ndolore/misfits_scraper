// src/utils/filterUtils.ts
import { FilterSchema } from '../types';

// Topic status codes mapping:
// 591 - Open
// 592 - Pre-release (only one that typically provides TPOC data)
// 593 - Closed

// Modernization Priorities mapping (text label to numeric ID)
const MODERNIZATION_PRIORITY_MAP: Record<string, number> = {
  "5G": 13,
  "Advanced Computing and Software": 22,
  "Advanced Infrastructure & Advanced Manufacturing": 37,
  "Advanced Materials": 26,
  "Artificial Intelligence/ Machine Learning": 12,
  "Autonomy": 11,
  "Biotechnology": 1,
  "Combat Casualty Care": 32,
  "Control and Communications": 9,
  "Cybersecurity": 7,
  "Directed Energy": 6,
  "Directed Energy (DE)": 28,
  "Emerging Threat Reduction": 33,
  "FutureG": 20,
  "General Warfighting Requirements (GWR)": 14,
  "Human-Machine Interfaces": 27,
  "Hypersonics": 5,
  "Integrated Network Systems-of-Systems": 24,
  "Integrated Sensing and Cyber": 23,
  "Microelectronics": 4,
  "Military Infectious Diseases": 34,
  "Military Operational Medicine": 35,
  "Mission Readiness & Disaster Preparedness": 36,
  "Network Command": 8,
  "None": 15,
  "Nuclear": 10,
  "Quantum Science": 29,
  "Quantum Sciences": 3,
  "Renewable Energy Generation and Storage": 25,
  "Space": 2,
  "Space Technology": 30,
  "Sustainment & Logistics": 31,
  "Trusted AI and Autonomy": 21
};

// Technology Areas mapping (text label to numeric ID)
const TECHNOLOGY_AREA_MAP: Record<string, number> = {
  "Air Platform": 1,
  "Battlespace": 2,
  "Bio Medical": 3,
  "Chem Bio Defense": 4,
  "Electronics": 5,
  "Ground Sea": 6,
  "Human Systems": 7,
  "Information Systems": 8,
  "Materials": 9,
  "Nuclear": 10,
  "Sensors": 11,
  "Space Platforms": 12,
  "Weapons": 13,
  "None": 14
};

export const toSearchParam = (filters: {
  components?: string[];
  programs?: string[];
  modernizationPriorities?: string[];
  technologyAreas?: string[];
  topicStatuses?: string[];
  searchText?: string;
}) => {
  console.log('Raw filters object received by toSearchParam:', filters);
  
  // Create base query parameters
  const params = {
    searchText: filters.searchText || null,
    component: filters.components?.length ? filters.components : null,
    program: filters.programs?.length ? filters.programs : null,
    programYear: null,
    releaseNumbers: [],
    // Convert modernization priority text labels to their corresponding numeric IDs
    modernizationPriorities: filters.modernizationPriorities?.length 
      ? filters.modernizationPriorities.map(label => MODERNIZATION_PRIORITY_MAP[label]).filter(id => id !== undefined)
      : [],
    // Convert technology area text labels to their corresponding numeric IDs
    technologyAreaIds: filters.technologyAreas?.length
      ? filters.technologyAreas.map(label => TECHNOLOGY_AREA_MAP[label]).filter(id => id !== undefined)
      : [],
    sortBy: "finalTopicCode,asc",
    // Initialize topicReleaseStatus property
    topicReleaseStatus: [] as number[],
  };

  // Process topic status filters
  if (filters.topicStatuses && filters.topicStatuses.length > 0) {
    console.log('Processing topic status filters:', filters.topicStatuses);
    
    // Handle numeric codes as strings (e.g., ['592'])
    const areNumericCodes = filters.topicStatuses.every(s => !isNaN(Number(s)));
    
    if (areNumericCodes) {
      // If they're already numeric codes, convert strings to numbers
      console.log('Input contains numeric codes, using directly:', filters.topicStatuses);
      params.topicReleaseStatus = filters.topicStatuses.map(Number);
    } else {
      // If they're status strings, map them to codes
      console.log('Input contains status strings, mapping to codes');
      const statusMap: Record<string, number> = {
        'open': 591,
        'pre-release': 592,
        'closed': 593
      };
      
      const statusCodes = filters.topicStatuses
        .map(status => {
          const code = statusMap[status.toLowerCase()];
          console.log(`Mapping status ${status} to code ${code}`);
          return code;
        })
        .filter(code => code !== undefined);
      
      if (statusCodes.length > 0) {
        console.log('Using mapped status codes:', statusCodes);
        params.topicReleaseStatus = statusCodes;
      } else {
        console.log('No valid status codes found, using defaults');
        // Default to include all status types
        params.topicReleaseStatus = [591, 592, 593];
      }
    }
  } else {
    console.log('No status filters specified, using defaults');
    // Default to include all status types
    params.topicReleaseStatus = [591, 592, 593];
  }
  
  return params;
};