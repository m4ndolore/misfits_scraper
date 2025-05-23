// src/types/index.ts
export * from './Topic';

export interface TopicManager {
  name?: string;
  email?: string;
  phone?: string;
}

export interface FilterOption {
<<<<<<< Updated upstream
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
=======
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
  topicManagers?: TopicManager[];
  technologyAreas?: string[];
  modernizationPriorities?: string[];
  noOfPublishedQuestions?: number;
}

export interface TopicDetail {
  technologyAreas?: string[];
  focusAreas?: string[];
  keywords?: string[];
  objective?: string;
  description?: string;
  phase1Description?: string;
  phase2Description?: string;
  phase3Description?: string;
  referenceDocuments?: Array<{
    title: string;
    url: string;
  }>;
}

export interface QuestionAnswer {
  questionNo: number;
  question: string;
  answers: {
    answer: string;
    answeredOn: string;
  }[];
  questionStatus: string;
  questionSubmittedOn: string;
}

export interface DetailedTopic extends Topic {
  pdfUrl?: string;
  questions?: QuestionAnswer[];
  [key: string]: any;
}

export interface Topic extends TopicDetail {
  topicCode: string;
  topicId: string;
  topicTitle?: string;
  phaseHierarchy?: string;
  component?: string;
  program?: string;
  topicStatus?: string;
  solicitationTitle?: string;
  topicManagers?: TopicManager[];
  numQuestions?: number;
  pdfUrl?: string;
}
>>>>>>> Stashed changes
