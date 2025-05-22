// src/types/index.ts
export * from './Topic';

export interface TopicManager {
  name?: string;
  email?: string;
  phone?: string;
}

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
  topicManagers?: TopicManager[];
  technologyAreas?: string[];
  modernizationPriorities?: string[];
  noOfPublishedQuestions?: number;
}

export interface Topic {
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
}