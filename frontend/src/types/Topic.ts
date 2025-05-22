// frontend/src/types/Topic.ts

// Interfaces specific to Topic
export interface FilterOptions {
  programs: string[];
  components: string[];
  topic_statuses: string[];
  technology_areas: string[];
  modernization_priorities: string[];
  solicitations: string[];
}

export interface AppliedFilters {
  searchTerm?: string;
  program?: string;
  component?: string;
  topicStatus?: string;
  solicitation?: string;
  technologyArea?: string;
  modernizationPriority?: string;
}
