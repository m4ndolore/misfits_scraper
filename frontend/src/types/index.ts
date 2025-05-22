// src/types/index.ts
export interface FilterOption {
    value: string;
    label: string;
  }
  
  export interface FilterSchema {
    components: FilterOption[];
    programs: FilterOption[];
    topicStatuses: FilterOption[];
    modernizationPriorities: FilterOption[];
    technologyAreas: FilterOption[];
    solicitations: FilterOption[];
  }
  
  export interface ApiTopicForFetch {
    topicCode: string;
    topicId: string;
    topicTitle?: string;
    phaseHierarchy?: string;
    component?: string;
    program?: string;
    topicStatus?: string;
    solicitationTitle?: string;
    topicManagers?: any[];
    technologyAreas?: string[];
    modernizationPriorities?: string[];
    noOfPublishedQuestions?: number;  
  }
  
  export interface Topic {
    topicCode: string;
    topicId: string;
    topicTitle: string;
    phaseHierarchy: string;
    component: string;
    program: string;
    topicStatus: string;
    solicitationTitle: string;
    topicManagers: any[];
    numQuestions?: number;
  }