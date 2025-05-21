// src/utils/filterUtils.ts
import { FilterSchema } from '../types';

export const toSearchParam = (filters: {
  components?: string[];
  programs?: string[];
  modernizationPriorities?: string[];
  technologyAreas?: string[];
  topicStatuses?: string[];
  searchText?: string;
}) => {
  return {
    searchText: filters.searchText || null,
    component: filters.components?.length ? filters.components : null,
    program: filters.programs?.length ? filters.programs : null,
    programYear: null,
    solicitationCycleNames: ["openTopics"],  // Required for TPOC data
    releaseNumbers: [],
    topicReleaseStatus: [591, 592],  // Required for TPOC data
    modernizationPriorities: filters.modernizationPriorities?.map(Number) || [],
    technologyAreaIds: filters.technologyAreas?.map(Number) || [],
    sortBy: "finalTopicCode,asc",
  };
};