import { useState, useEffect, useCallback } from "react"

// TypeScript interfaces matching your backend data structure
interface SBIROpportunity {
  topicCode: string
  topicId: string
  topicTitle: string
  component: string
  program: string
  topicStatus: string
  solicitationTitle: string
  objective?: string
  description?: string
  topicManagers: Array<{
    name: string
    email: string
    phone: string
  }>
  numQuestions?: number
  questions?: any[]
  topicEndDate?: number | string
  topicStartDate?: number | string
  noOfPublishedQuestions?: number
}

interface Download {
  id: string
  topicCode: string
  status: 'pending' | 'downloading' | 'completed' | 'error'
  progress: number
  filename: string | null
  error: string | null
  startTime: Date
  officialPdfStatus?: 'pending' | 'downloading' | 'completed' | 'error'
  detailsPdfStatus?: 'pending' | 'downloading' | 'completed' | 'error'
}

interface AdvancedFilters {
  topicStatuses: string[]
  sbirSttr: string[]
  modernizationPriority: string[]
  technologyAreas: string[]
  components: string[] // Array of component codes like "ARMY", "NAVY", etc.
}

export default function EnhancedSBIRTool() {
  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [opportunities, setOpportunities] = useState<SBIROpportunity[]>([])
  const [filteredOpportunities, setFilteredOpportunities] = useState<SBIROpportunity[]>([])
  const [loading, setLoading] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [page, setPage] = useState(0)
  const [activeFilter, setActiveFilter] = useState("all")
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())
  const [downloads, setDownloads] = useState<Download[]>([])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    topicStatuses: ['591', '592'], // Default to Open and Pre-release
    sbirSttr: ['SBIR', 'STTR'],
    modernizationPriority: [],
    technologyAreas: [],
    components: [] // Empty array for components filter
  })
  const [selectedTopicForAnalytics, setSelectedTopicForAnalytics] = useState<SBIROpportunity | null>(null)
  const [downloadingTopics, setDownloadingTopics] = useState<Set<string>>(new Set())
  const [showQAModal, setShowQAModal] = useState(false)
  const [selectedTopicQuestions, setSelectedTopicQuestions] = useState<any[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  // Your existing Express backend URL
  const API_BASE_URL = 'http://localhost:3000'

  const filters = [
    { key: "all", label: "All Agencies", color: "#4a9eff" },
    { key: "ARMY", label: "Army", color: "#ff6b6b", components: ["ARMY"] },
    { key: "NAVY", label: "Navy", color: "#4ecdc4", components: ["NAVY"] },
    { key: "USAF", label: "Air Force", color: "#45b7d1", components: ["USAF"] },
    { key: "SOCOM", label: "SOCOM", color: "#f39c12", components: ["SOCOM"] },
    { key: "DARPA", label: "DARPA", color: "#9b59b6", components: ["DARPA"] },
    { key: "DLA", label: "DLA", color: "#e74c3c", components: ["DLA"] },
    { key: "DHA", label: "DHA", color: "#2ecc71", components: ["DHA"] },
    { key: "MDA", label: "MDA", color: "#1abc9c", components: ["MDA"] },
    { key: "ai", label: "AI/ML", color: "#9b59b6" },
    { key: "cyber", label: "Cybersec", color: "#e74c3c" },
    { key: "energy", label: "Energy", color: "#2ecc71" }
  ]

  // Status color coding
  const getStatusColor = (status: string) => {
    const statusLower = (status || '').toLowerCase()
    if (statusLower.includes('open') || status === '591') return "#28a745" // Green
    if (statusLower.includes('pre-release') || status === '592') return "#ffc107" // Yellow/Orange
    if (statusLower.includes('closed') || status === '593') return "#dc3545" // Red
    return "#6c757d" // Gray for unknown
  }

  const getStatusLabel = (status: string) => {
    const statusLower = (status || '').toLowerCase()
    if (statusLower.includes('open') || status === '591') return "🟢 OPEN"
    if (statusLower.includes('pre-release') || status === '592') return "🟡 PRE-RELEASE"
    if (statusLower.includes('closed') || status === '593') return "🔴 CLOSED"
    return `⚪ ${status || 'UNKNOWN'}`
  }

  // Helper function to convert filters to match the expected API format
  const toSearchParam = (filters: {
    searchText?: string;
    components?: string[];
    modernizationPriority?: string[];
    technologyAreas?: string[];
    topicStatuses?: string[];
    sbirSttr?: string[];
  }) => {
    // Create the correctly formatted search parameter object
    const formattedParams: any = {
      searchText: filters.searchText || null,
      component: filters.components && filters.components.length > 0 ? filters.components : null,
      programYear: null,
      //solicitationCycleNames: ["openTopics"],
      releaseNumbers: [],
      topicReleaseStatus: filters.topicStatuses ? 
        filters.topicStatuses.map(status => parseInt(status, 10)) : 
        [591, 592], // Default to Open and Pre-release
      modernizationPriorities: filters.modernizationPriority || [],
      sortBy: "finalTopicCode,asc",
      technologyAreaIds: filters.technologyAreas || [],
      program: filters.sbirSttr && filters.sbirSttr.length === 1 ? filters.sbirSttr[0] : null
    };
    
    console.log('Raw filters object received by toSearchParam:', filters);
    console.log('Formatted search parameters:', formattedParams);
    return formattedParams;
  }

  // Connect to your existing DoD API search with corrected filtering logic
  const fetchOpportunities = useCallback(async (searchText?: string) => {
    setLoading(true)
    try {
      // Build search parameters based on the correct API format
      const filterParams: any = {}
      
      // Add search text if provided
      const searchValue = searchText !== undefined ? searchText : searchTerm;
      if (searchValue && searchValue.trim()) {
        filterParams.searchText = searchValue.trim()
      } else {
        filterParams.searchText = null
      }
      
      // Add component filter - prioritize advanced filter components over activeFilter
      if (advancedFilters.components.length > 0) {
        filterParams.components = [...advancedFilters.components]
      } else if (activeFilter !== "all") {
        // Find the filter configuration to get components
        const selectedFilter = filters.find(f => f.key === activeFilter)
        if (selectedFilter?.components) {
          filterParams.components = selectedFilter.components
        }
      }
      
      // Add topic status filters
      if (advancedFilters.topicStatuses.length > 0) {
        filterParams.topicStatuses = [...advancedFilters.topicStatuses]
      }

      // Add other filter parameters
      if (advancedFilters.modernizationPriority.length > 0) {
        filterParams.modernizationPriority = [...advancedFilters.modernizationPriority]
      }

      if (advancedFilters.technologyAreas.length > 0) {
        filterParams.technologyAreas = [...advancedFilters.technologyAreas]
      }

      // Add SBIR/STTR filter if specified
      if (advancedFilters.sbirSttr.length > 0) {
        filterParams.sbirSttr = [...advancedFilters.sbirSttr]
      }

      // Use the toSearchParam function to process the filters into the correct format
      const processedParams = toSearchParam(filterParams)
      
      console.log('🔍 Final Search Parameters:', JSON.stringify(processedParams, null, 2))

      const encodedParams = encodeURIComponent(JSON.stringify(processedParams))
      const url = `https://www.dodsbirsttr.mil/topics/api/public/topics/search?searchParam=${encodedParams}&size=${25}&page=${page}`
      
      console.log('🌐 API Call URL:', url)
      console.log('📋 Decoded searchParam:', JSON.stringify(processedParams, null, 2))
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      console.log('📥 API Response Status:', response.status)
      console.log('📊 Total Results:', data.total)
      console.log('📋 Results Returned:', data.data?.length || 0)
      
      if (data.data && data.data.length > 0) {
        // Log status breakdown to verify filtering is working
        const statusBreakdown = data.data.reduce((acc: any, opp: any) => {
          const status = opp.topicStatus || 'Unknown'
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {})
        console.log('📊 Status Distribution:', statusBreakdown)
        
        // Only fetch Q&A for first few topics to improve performance
        const enhancedData = data.data.map((opp: any, index: number) => ({
          ...opp,
          numQuestions: opp.noOfPublishedQuestions || 0,
          questions: [] // Initialize empty, will be loaded on demand
        }))
        
        setOpportunities(enhancedData)
        setTotalResults(data.total || 0)
        applyClientSideFilters(enhancedData, activeFilter)
      } else {
        console.log('⚠️ No data returned from API')
        setOpportunities([])
        setFilteredOpportunities([])
        setTotalResults(0)
      }
    } catch (error) {
      console.error('❌ Error fetching opportunities:', error)
      setOpportunities([])
      setFilteredOpportunities([])
      setTotalResults(0)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, page, activeFilter, advancedFilters.topicStatuses])

  // Client-side filtering to match Mandalorian UI behavior
  const applyClientSideFilters = (data: SBIROpportunity[], filter: string) => {
    let filtered = data

    if (filter !== "all") {
      filtered = data.filter(opp => {
        const title = (opp.topicTitle || '').toLowerCase()
        const desc = (opp.description || opp.objective || '').toLowerCase()
        const component = (opp.component || '').toUpperCase()
        
        // Get the selected filter
        const selectedFilter = filters.find(f => f.key === filter)
        
        // If it's a component category filter
        if (selectedFilter?.components) {
          return selectedFilter.components.includes(component)
        }
        
        // Handle modernization topic filters
        switch (filter) {
          case 'ai':
            return title.includes('ai') || title.includes('artificial intelligence') || 
                   desc.includes('ai') || desc.includes('machine learning')
          case 'cyber':
            return title.includes('cyber') || desc.includes('cyber') || 
                   title.includes('security') || desc.includes('security')
          case 'energy':
            return title.includes('energy') || desc.includes('energy') || 
                   title.includes('power') || desc.includes('power')
          default:
            return true
        }
      })
    }

    setFilteredOpportunities(filtered)
  }

  useEffect(() => {
    // Fetch when component mounts, filters change, or page changes
    fetchOpportunities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, advancedFilters, page])

  // Sync advanced filters components with quick selection when components change
  useEffect(() => {
    // Only sync if we're not already in a component-based quick filter
    const currentFilter = filters.find(f => f.key === activeFilter)
    const currentComponents = currentFilter?.components || []
    
    // Check if current quick filter matches current advanced filter components
    const componentsMatch = currentComponents.length === advancedFilters.components.length &&
                           currentComponents.every(c => advancedFilters.components.includes(c))
    
    if (!componentsMatch) {
      // Find matching quick filter for current advanced filter components
      if (advancedFilters.components.length === 0) {
        if (activeFilter !== "all") setActiveFilter("all")
      } else if (advancedFilters.components.length === 1) {
        const matchingFilter = filters.find(f => 
          f.components && f.components.length === 1 && f.components[0] === advancedFilters.components[0]
        )
        if (matchingFilter && activeFilter !== matchingFilter.key) {
          setActiveFilter(matchingFilter.key)
        } else if (!matchingFilter && activeFilter !== "all") {
          setActiveFilter("all")
        }
      } else {
        // Multiple components - default to "all" if not already
        if (activeFilter !== "all") setActiveFilter("all")
      }
    }
  }, [advancedFilters.components, activeFilter, filters])

  // Transform your data to match Mandalorian UI format
  const transformOpportunityData = (opp: SBIROpportunity) => ({
    id: opp.topicId,
    topicCode: opp.topicCode,
    title: opp.topicTitle || "No Title Available",
    agency: `${opp.component || 'DoD'} - ${opp.program || 'Unknown Program'}`,
    deadline: extractDeadline(opp),
    description: opp.objective || opp.description || "No description available",
    priority: determinePriority(opp.topicStatus),
    tags: extractTags(opp),
    status: opp.topicStatus,
    managers: opp.topicManagers || [],
    numQuestions: opp.numQuestions || 0
  })

  // Helper functions
  const determinePriority = (status: string) => {
    // Priority Logic Explanation:
    // CRITICAL = Open opportunities (immediate action required)
    // HIGH = Pre-release opportunities (prepare for opening)  
    // MEDIUM = Closed or other statuses (lower immediate priority)
    const statusLower = (status || '').toLowerCase()
    if (statusLower.includes('open') || status === '591') return 'critical'
    if (statusLower.includes('pre-release') || status === '592') return 'high'
    return 'medium'
  }

  const extractTags = (opp: SBIROpportunity) => {
    const tags = []
    const title = (opp.topicTitle || '').toLowerCase()
    const desc = (opp.description || opp.objective || '').toLowerCase()
    
    if (opp.component) tags.push(opp.component.toLowerCase().replace(/\s+/g, ''))
    if (title.includes('ai') || desc.includes('ai')) tags.push('ai')
    if (title.includes('cyber') || desc.includes('cyber')) tags.push('cyber')
    if (title.includes('quantum') || desc.includes('quantum')) tags.push('quantum')
    if (title.includes('energy') || desc.includes('energy')) tags.push('energy')
    
    return tags
  }

  const extractDeadline = (opp: SBIROpportunity) => {
    // Check if we have end date (deadline)
    if (opp.topicEndDate) {
      const endDate = new Date(Number(opp.topicEndDate))
      const now = new Date()
      
      // Format the date nicely
      const formattedDate = endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      
      // Calculate days remaining
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      // If the topic hasn't started yet, show the start date too
      if (opp.topicStartDate) {
        const startDate = new Date(Number(opp.topicStartDate))
        if (startDate > now) {
          const formattedStartDate = startDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
          return `Opens: ${formattedStartDate}, Closes: ${formattedDate}`
        }
      }
      
      // Add days remaining if it's in the future
      if (daysRemaining > 0) {
        return `${formattedDate} (${daysRemaining} days left)`
      } else if (daysRemaining === 0) {
        return `${formattedDate} (Due today!)`
      } else {
        return `Closed on ${formattedDate}`
      }
    } else if (opp.topicStartDate) {
      // If no end date but we have start date
      const startDate = new Date(Number(opp.topicStartDate))
      const formattedDate = startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      
      const now = new Date()
      if (startDate > now) {
        return `Opens: ${formattedDate}`
      } else {
        return `Opened: ${formattedDate}`
      }
    }
    
    // Fallback if no dates are available
    return "Check Solicitation"
  }

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case "critical": return "#ff4757"
      case "high": return "#ffc107" 
      case "medium": return "#28a745"
      default: return "#6c757d"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch(priority) {
      case "critical": return "🔴 CRITICAL"
      case "high": return "🟡 HIGH"
      case "medium": return "🟢 MEDIUM" 
      default: return "⚪ STANDARD"
    }
  }

  // Re-enable the official PDF download with better error handling
  const downloadOfficialPDF = async (topicCode: string): Promise<void> => {
    console.log('📋 Attempting official PDF download for:', topicCode)
    
    const response = await fetch(`${API_BASE_URL}/api/download-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicCode }),
    })

    console.log('📤 POST request sent to:', `${API_BASE_URL}/api/download-pdf`)
    console.log('📋 Request body:', JSON.stringify({ topicCode }))
    console.log('📥 Response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ Official PDF download failed:', errorData)
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to download official PDF`)
    }

    const blob = await response.blob()
    console.log('📦 Received blob size:', blob.size)
    
    if (!blob || blob.size === 0) {
      throw new Error('Received empty official PDF file')
    }

    // Create download
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `topic_${topicCode}_official.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    console.log('✅ Official PDF download completed')
  }

  const downloadDetailsPDF = async (topicCode: string): Promise<void> => {
    // Find the topic to get full data
    const topic = opportunities.find(t => t.topicCode === topicCode)
    if (!topic) throw new Error(`Topic ${topicCode} not found`)

    console.log('📋 Generating details PDF for topic:', topicCode)
    console.log('📊 Topic has questions:', topic.questions?.length || 0)

    // Fetch detailed topic information if not already loaded
    let topicDetails = topic
    let questions = topic.questions || []

    try {
      // Fetch detailed topic information and Q&A
      console.log('🔍 Fetching detailed topic data and Q&A...')
      const [detailsResponse, qaResponse] = await Promise.allSettled([
        fetch(`https://www.dodsbirsttr.mil/topics/api/public/topics/${topic.topicId}/details`),
        fetch(`https://www.dodsbirsttr.mil/topics/api/public/topics/${topic.topicId}/questions`)
      ])

      if (detailsResponse.status === 'fulfilled' && detailsResponse.value.ok) {
        const details = await detailsResponse.value.json()
        topicDetails = { ...topic, ...details }
        console.log('✅ Topic details fetched successfully')
      } else {
        console.warn('⚠️ Failed to fetch topic details:', detailsResponse.status === 'fulfilled' ? detailsResponse.value.status : detailsResponse.reason)
      }

      if (qaResponse.status === 'fulfilled' && qaResponse.value.ok) {
        const qaData = await qaResponse.value.json()
        questions = Array.isArray(qaData) ? qaData : []
        questions.sort((a, b) => (a.questionNo || 0) - (b.questionNo || 0))
        console.log('✅ Q&A data fetched successfully, questions:', questions.length)
      } else {
        console.warn('⚠️ Failed to fetch Q&A data:', qaResponse.status === 'fulfilled' ? qaResponse.value.status : qaResponse.reason)
      }

      console.log('📤 Sending to PDF generator...')
      console.log('📋 Topic data keys:', Object.keys(topicDetails))
      console.log('💬 Questions count:', questions.length)

      // Send to your backend for PDF generation
      const response = await fetch(`${API_BASE_URL}/api/generate-topic-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: topicDetails,
          questions: questions
        }),
      })

      console.log('📄 PDF generator response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ PDF generation failed:', errorData)
        throw new Error(errorData.error || 'Failed to generate details PDF')
      }

      const blob = await response.blob()
      console.log('📦 PDF blob received, size:', blob.size)
      
      if (!blob || blob.size === 0) {
        throw new Error('Received empty details PDF file')
      }

      // Create download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `topic_${topicCode}_details.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      console.log('✅ Details PDF download initiated successfully')

    } catch (error) {
      console.error('❌ Error generating topic details PDF:', error)
      throw new Error(`Failed to generate details PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Restore both PDF downloads
  const startDownload = async (topicCode: string) => {
    // Immediate UI feedback
    setDownloadingTopics(prev => new Set([...prev, topicCode]))
    
    const downloadId = Date.now().toString()
    
    const newDownload: Download = {
      id: downloadId,
      topicCode,
      status: 'pending',
      progress: 0,
      filename: null,
      error: null,
      startTime: new Date()
    }
    
    setDownloads(prev => [newDownload, ...prev])

    try {
      setDownloads(prev => prev.map(d => 
        d.id === downloadId ? { 
          ...d, 
          status: 'downloading',
          officialPdfStatus: 'downloading',
          detailsPdfStatus: 'pending'
        } : d
      ))

      console.log('🚀 Starting downloads for topic:', topicCode)

      // Download official PDF first
      let officialResult
      try {
        await downloadOfficialPDF(topicCode)
        officialResult = { status: 'fulfilled' }
        setDownloads(prev => prev.map(d => 
          d.id === downloadId ? { ...d, officialPdfStatus: 'completed' } : d
        ))
      } catch (error) {
        officialResult = { status: 'rejected', reason: error }
        setDownloads(prev => prev.map(d => 
          d.id === downloadId ? { ...d, officialPdfStatus: 'error' } : d
        ))
      }

      // Update to show details PDF is now downloading
      setDownloads(prev => prev.map(d => 
        d.id === downloadId ? { ...d, detailsPdfStatus: 'downloading' } : d
      ))

      // Download details PDF
      let detailsResult
      try {
        await downloadDetailsPDF(topicCode)
        detailsResult = { status: 'fulfilled' }
        setDownloads(prev => prev.map(d => 
          d.id === downloadId ? { ...d, detailsPdfStatus: 'completed' } : d
        ))
      } catch (error) {
        detailsResult = { status: 'rejected', reason: error }
        setDownloads(prev => prev.map(d => 
          d.id === downloadId ? { ...d, detailsPdfStatus: 'error' } : d
        ))
      }

      let successCount = 0
      let errorMessages: string[] = []

      if (officialResult.status === 'fulfilled') {
        successCount++
        console.log('✅ Official PDF download succeeded')
      } else {
        errorMessages.push(`Official PDF: ${officialResult.reason}`)
        console.error('❌ Official PDF failed:', officialResult.reason)
      }

      if (detailsResult.status === 'fulfilled') {
        successCount++
        console.log('✅ Details PDF download succeeded')
      } else {
        errorMessages.push(`Details PDF: ${detailsResult.reason}`)
        console.error('❌ Details PDF failed:', detailsResult.reason)
      }

      if (successCount === 0) {
        throw new Error(errorMessages.join('. '))
      }

      // Success (at least one PDF downloaded)
      const filename = successCount === 2 
        ? `${topicCode}_official.pdf & ${topicCode}_details.pdf`
        : successCount === 1 && officialResult.status === 'fulfilled'
        ? `${topicCode}_official.pdf`
        : `${topicCode}_details.pdf`

      setDownloads(prev => prev.map(d => 
        d.id === downloadId 
          ? { 
              ...d, 
              status: 'completed', 
              filename,
              progress: 100,
              error: errorMessages.length > 0 ? `Partial success: ${errorMessages.join('. ')}` : null
            }
          : d
      ))

      // Auto-remove after 10 seconds
      setTimeout(() => {
        setDownloads(prev => prev.filter(d => d.id !== downloadId))
      }, 10000)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('❌ All downloads failed:', errorMessage)
      
      setDownloads(prev => prev.map(d => 
        d.id === downloadId 
          ? { ...d, status: 'error', error: errorMessage }
          : d
      ))
    } finally {
      // Remove from downloading set
      setDownloadingTopics(prev => {
        const newSet = new Set(prev)
        newSet.delete(topicCode)
        return newSet
      })
    }
  }

  const handleSearch = () => {
    setPage(0)
    // Pass the current searchTerm to fetchOpportunities
    fetchOpportunities(searchTerm)
  }

  const handleFilterChange = (filterKey: string) => {
    setActiveFilter(filterKey)
    setPage(0)
    
    // Sync with advanced filters
    const selectedFilter = filters.find(f => f.key === filterKey)
    if (selectedFilter?.components) {
      // Update advanced filters to match the quick selection
      setAdvancedFilters(prev => ({
        ...prev,
        components: selectedFilter.components
      }))
    } else if (filterKey === "all") {
      // Clear advanced filter components when "All Agencies" is selected
      setAdvancedFilters(prev => ({
        ...prev,
        components: []
      }))
    }
    // For topic-based filters (ai, cyber, energy), don't modify components
  }

  const generatePDF = () => {
    if (selectedTopics.size === 0) {
      alert('⚠️ Select opportunities to export tactical intelligence briefing')
      return
    }

    const selectedArray = Array.from(selectedTopics)
    alert(`🎯 INTEL PACKAGE INITIATED\n\nProcessing ${selectedArray.length} opportunities...\n\nInitiating simultaneous PDF generation for:\n${selectedArray.join(', ')}\n\nYou'll receive tactical analysis packages within minutes.`)
    
    // Start downloads for all selected
    selectedArray.forEach(topicCode => {
      setTimeout(() => startDownload(topicCode), Math.random() * 1000) // Stagger slightly
    })
  }

  const toggleSelection = (topicCode: string) => {
    const newSelected = new Set(selectedTopics)
    if (newSelected.has(topicCode)) {
      newSelected.delete(topicCode)
    } else {
      newSelected.add(topicCode)
    }
    setSelectedTopics(newSelected)
  }

  const selectAll = () => {
    if (selectedTopics.size === filteredOpportunities.length) {
      setSelectedTopics(new Set())
    } else {
      setSelectedTopics(new Set(filteredOpportunities.map(opp => opp.topicCode)))
    }
  }

  const showAnalytics = (opp: SBIROpportunity) => {
    setSelectedTopicForAnalytics(opp)
  }

  // Helper function to clean and display text content properly
  const cleanContent = (content: any): string => {
    if (!content) return 'No content available'
    
    let processed = content
    
    // Handle JSON objects or strings that might be JSON
    if (typeof processed === 'string' && (processed.startsWith('{') || processed.startsWith('['))) {
      try {
        const parsedJson = JSON.parse(processed)
        processed = parsedJson
      } catch (e) {
        // Not valid JSON, keep as is
      }
    }
    
    // Handle JSON objects
    if (typeof processed === 'object' && processed !== null) {
      // If it's an object, try to extract meaningful text
      if (processed.content) {
        processed = processed.content
      } else if (processed.answer) {
        processed = processed.answer
      } else if (processed.text) {
        processed = processed.text
      } else if (Array.isArray(processed) && processed.length) {
        // It might be an array
        processed = processed.join(' ')
      } else {
        // Check for common API response patterns
        const possibleTextFields = ['body', 'message', 'description', 'value', 'data']
        for (const field of possibleTextFields) {
          if (processed[field]) {
            processed = processed[field]
            break
          }
        }
        
        // If still an object, extract values instead of stringifying the whole object
        if (typeof processed === 'object' && processed !== null) {
          // Just extract all values and join them
          const values = Object.values(processed)
            .filter(val => typeof val === 'string' || typeof val === 'number')
          
          if (values.length > 0) {
            processed = values.join(' ')
          } else {
            // If we couldn't extract any values, use the full string but without formatting
            processed = JSON.stringify(processed)
          }
        }
      }
    }
    
    // Convert to string if not already
    processed = String(processed)
    
    // Remove HTML tags and decode entities
    processed = processed
      .replace(/<[^>]*>/g, ' ')           // Remove HTML tags
      .replace(/&nbsp;/g, ' ')           // Replace &nbsp; with space
      .replace(/&amp;/g, '&')            // Decode &amp;
      .replace(/&lt;/g, '<')             // Decode &lt;
      .replace(/&gt;/g, '>')             // Decode &gt;
      .replace(/&quot;/g, '"')           // Decode &quot;
      .replace(/&#39;/g, "'")            // Decode &#39;
      .replace(/\s+/g, ' ')              // Replace multiple spaces with single space
      .trim()                            // Remove leading/trailing whitespace
    
    return processed || 'No content available'
  }

  const closeAnalytics = () => {
    setSelectedTopicForAnalytics(null)
    setShowQAModal(false)
    setSelectedTopicQuestions([])
  }

  const showQADetails = async (topic: SBIROpportunity) => {
    setLoadingQuestions(true)
    setShowQAModal(true)
    
    try {
      // Fetch fresh Q&A data
      const response = await fetch(`https://www.dodsbirsttr.mil/topics/api/public/topics/${topic.topicId}/questions`)
      if (response.ok) {
        const qaData = await response.json()
        const questions = Array.isArray(qaData) ? qaData : []
        questions.sort((a: any, b: any) => (a.questionNo || 0) - (b.questionNo || 0))
        setSelectedTopicQuestions(questions)
        console.log('✅ Loaded Q&A details:', questions.length, 'questions')
      } else {
        console.warn('⚠️ Failed to fetch Q&A details:', response.status)
        setSelectedTopicQuestions([])
      }
    } catch (error) {
      console.error('❌ Error fetching Q&A details:', error)
      setSelectedTopicQuestions([])
    } finally {
      setLoadingQuestions(false)
    }
  }

  // Helper function to get component labels
  const getComponentLabel = (code: string): string => {
    const componentMap: {[key: string]: string} = {
      'ARMY': 'Army',
      'DLA': 'Defense Logistics Agency',
      'NAVY': 'Navy',
      'CBD': 'Chemical Biological Defense',
      'DMEA': 'Defense Microelectronics Activity',
      'OSD': 'Office of Secretary of Defense',
      'DARPA': 'DARPA',
      'DTRA': 'Defense Threat Reduction Agency',
      'SOCOM': 'Special Operations Command',
      'USAF': 'Air Force',
      'MDA': 'Missile Defense Agency',
      'DHA': 'Defense Health Agency'
    }
    return componentMap[code] || code
  }

  return (
    <div style={{
      background: '#000000',
      minHeight: '100vh',
      padding: '0'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)',
        borderRadius: '20px',
        padding: '40px',
        margin: '20px',
        boxShadow: `
          0 20px 40px rgba(0, 0, 0, 0.8),
          inset 0 1px 0 rgba(255, 255, 255, 0.1),
          0 0 60px rgba(192, 192, 192, 0.05)
        `,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Tactical Grid Background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(192, 192, 192, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(74, 158, 255, 0.03) 0%, transparent 50%),
            linear-gradient(90deg, transparent 98%, rgba(192, 192, 192, 0.03) 100%),
            linear-gradient(0deg, transparent 98%, rgba(192, 192, 192, 0.03) 100%)
          `,
          backgroundSize: '50px 50px, 80px 80px, 25px 25px, 25px 25px',
          zIndex: 1
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Header */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '40px',
            borderBottom: '1px solid #333333',
            paddingBottom: '32px'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#c0c0c0',
              marginBottom: '12px'
            }}>
              ⚡ TACTICAL INTELLIGENCE
            </div>
            <h3 style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'transparent',
              background: 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 50%, #a8a8a8 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              SBIR Command Center
            </h3>
            <p style={{ 
              color: '#a0a0a0',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '8px'
            }}>
              powered by <span style={{ color: '#4a9eff', fontWeight: 600 }}>Merge Combinator</span>
            </p>
            <p style={{ 
              color: '#a0a0a0',
              fontSize: '16px',
              fontWeight: 500
            }}>
              Mission-critical opportunities at your fingertips • {totalResults} active opportunities
            </p>
          </div>

          {/* Search Bar */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '32px',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Search SBIR opportunities..."
              style={{
                flex: 1,
                padding: '18px 24px',
                border: '2px solid #333333',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                color: '#ffffff',
                fontSize: '16px',
                minWidth: '300px',
                fontWeight: 500
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)',
                color: '#000000',
                padding: '18px 32px',
                borderRadius: '12px',
                border: '1px solid #808080',
                fontWeight: 700,
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '⏳ Scanning...' : '⚡ Execute'}
            </button>
            <button
              onClick={generatePDF}
              disabled={selectedTopics.size === 0}
              style={{
                background: selectedTopics.size > 0 ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : 'transparent',
                border: `2px solid ${selectedTopics.size > 0 ? '#28a745' : '#666666'}`,
                color: selectedTopics.size > 0 ? '#ffffff' : '#666666',
                padding: '18px 32px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                cursor: selectedTopics.size > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              📄 Export Intel ({selectedTopics.size})
            </button>
          </div>

          {/* Advanced Filters Toggle */}
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={{
                background: showAdvancedFilters ? 'linear-gradient(135deg, #4a9eff 0%, #357abd 100%)' : 'transparent',
                border: '2px solid #4a9eff',
                color: showAdvancedFilters ? '#ffffff' : '#4a9eff',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                transition: 'all 0.3s ease'
              }}
            >
              🔧 Advanced Filters {showAdvancedFilters ? '▲' : '▼'}
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div style={{
              background: 'rgba(26, 26, 26, 0.8)',
              border: '1px solid #333333',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '32px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '24px'
              }}>
                {/* Topic Status Filter */}
                <div>
                  <div style={{
                    color: '#c0c0c0',
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    📋 Topic Status
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { value: '591', label: 'Open', color: '#28a745' },
                      { value: '592', label: 'Pre-Release', color: '#ffc107' },
                      { value: '593', label: 'Closed', color: '#dc3545' }
                    ].map(status => (
                      <label key={status.value} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#a0a0a0',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={advancedFilters.topicStatuses.includes(status.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAdvancedFilters(prev => ({
                                ...prev,
                                topicStatuses: [...prev.topicStatuses, status.value]
                              }))
                            } else {
                              setAdvancedFilters(prev => ({
                                ...prev,
                                topicStatuses: prev.topicStatuses.filter(s => s !== status.value)
                              }))
                            }
                          }}
                          style={{ marginRight: '8px' }}
                        />
                        <span style={{ 
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: status.color,
                          display: 'inline-block',
                          marginRight: '8px'
                        }} />
                        {status.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Component Filter */}
                <div>
                  <div style={{
                    color: '#c0c0c0',
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    🏛️ Components
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    paddingRight: '8px'
                  }}>
                    {[
                      { value: 'ARMY', label: 'Army' },
                      { value: 'DLA', label: 'Defense Logistics Agency' },
                      { value: 'NAVY', label: 'Navy' },
                      { value: 'CBD', label: 'Chemical Biological Defense' },
                      { value: 'DMEA', label: 'Defense Microelectronics Activity' },
                      { value: 'OSD', label: 'Office of Secretary of Defense' },
                      { value: 'DARPA', label: 'DARPA' },
                      { value: 'DTRA', label: 'Defense Threat Reduction Agency' },
                      { value: 'SOCOM', label: 'Special Operations Command' },
                      { value: 'USAF', label: 'Air Force' },
                      { value: 'MDA', label: 'Missile Defense Agency' },
                      { value: 'DHA', label: 'Defense Health Agency' }
                    ].map(component => (
                      <label key={component.value} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#a0a0a0',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={advancedFilters.components.includes(component.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAdvancedFilters(prev => ({
                                ...prev,
                                components: [...prev.components, component.value]
                              }))
                            } else {
                              setAdvancedFilters(prev => ({
                                ...prev,
                                components: prev.components.filter(c => c !== component.value)
                              }))
                            }
                          }}
                          style={{ marginRight: '8px' }}
                        />
                        {component.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* SBIR/STTR Filter */}
                <div>
                  <div style={{
                    color: '#c0c0c0',
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    🎯 Program Type
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['SBIR', 'STTR'].map(type => (
                      <label key={type} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#a0a0a0',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={advancedFilters.sbirSttr.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAdvancedFilters(prev => ({
                                ...prev,
                                sbirSttr: [...prev.sbirSttr, type]
                              }))
                            } else {
                              setAdvancedFilters(prev => ({
                                ...prev,
                                sbirSttr: prev.sbirSttr.filter(s => s !== type)
                              }))
                            }
                          }}
                          style={{ marginRight: '8px' }}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Apply Filters Button */}
                <div style={{
                  display: 'flex',
                  alignItems: 'end',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <button
                    onClick={() => {
                      console.log('🔧 Applying Advanced Filters:', advancedFilters) // Debug log
                      setPage(0)
                      
                      // Sync with quick selection buttons
                      if (advancedFilters.components.length === 0) {
                        setActiveFilter("all")
                      } else if (advancedFilters.components.length === 1) {
                        // If exactly one component is selected, try to match it to a quick filter
                        const matchingFilter = filters.find(f => 
                          f.components && f.components.length === 1 && f.components[0] === advancedFilters.components[0]
                        )
                        if (matchingFilter) {
                          setActiveFilter(matchingFilter.key)
                        } else {
                          setActiveFilter("all") // Default if no exact match
                        }
                      } else {
                        // Multiple components selected, keep current or default to "all"
                        setActiveFilter("all")
                      }
                      
                      fetchOpportunities()
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                      color: '#ffffff',
                      padding: '14px 28px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    🔍 Apply Filters
                  </button>
                  
                  {/* Reset Filters Button */}
                  <button
                    onClick={() => {
                      setAdvancedFilters({
                        topicStatuses: ['591', '592'], // Reset to default
                        sbirSttr: ['SBIR', 'STTR'],
                        modernizationPriority: [],
                        technologyAreas: [],
                        components: [] // Reset components to empty array
                      })
                      setPage(0)
                      // Reset quick selection to "All Agencies"
                      setActiveFilter("all")
                      // Don't fetch immediately - let user click Apply
                    }}
                    style={{
                      background: 'transparent',
                      color: '#c0c0c0',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: '1px solid #666666',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Selection Controls */}
          {filteredOpportunities.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              padding: '12px 20px',
              background: 'rgba(26, 26, 26, 0.5)',
              borderRadius: '8px',
              border: '1px solid #333333'
            }}>
              <button
                onClick={selectAll}
                style={{
                  background: 'transparent',
                  border: '1px solid #c0c0c0',
                  color: '#c0c0c0',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer'
                }}
              >
                {selectedTopics.size === filteredOpportunities.length ? '☑️ Deselect All' : '☐ Select All'}
              </button>
              <div style={{ color: '#a0a0a0', fontSize: '14px' }}>
                {selectedTopics.size} of {filteredOpportunities.length} selected
              </div>
            </div>
          )}

          {/* Filters */}
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '40px',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(26, 26, 26, 0.5)',
            borderRadius: '16px',
            border: '1px solid #333333'
          }}>
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => handleFilterChange(filter.key)}
                style={{
                  background: activeFilter === filter.key 
                    ? `linear-gradient(135deg, ${filter.color}dd 0%, ${filter.color} 100%)`
                    : 'rgba(42, 42, 42, 0.8)',
                  color: activeFilter === filter.key ? '#ffffff' : '#a0a0a0',
                  padding: '10px 20px',
                  borderRadius: '25px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeFilter === filter.key 
                    ? `2px solid ${filter.color}` 
                    : '1px solid #444444',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  transition: 'all 0.3s ease',
                  boxShadow: activeFilter === filter.key 
                    ? `0 0 20px ${filter.color}40` 
                    : 'none',
                  position: 'relative'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#c0c0c0',
              fontSize: '18px'
            }}>
              <div style={{ marginBottom: '20px', fontSize: '48px' }}>⚡</div>
              <div>Scanning DoD SBIR/STTR Database...</div>
              <div style={{ color: '#666666', fontSize: '14px', marginTop: '8px' }}>
                Analyzing opportunities across all agencies
              </div>
            </div>
          )}

{/* Download Queue */}
{downloads.length > 0 && (
            <div style={{
              marginTop: '32px',
              padding: '24px',
              background: 'rgba(26, 26, 26, 0.8)',
              borderRadius: '16px',
              border: '1px solid #333333'
            }}>
              <div style={{
                color: '#c0c0c0',
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                🔄 Active Downloads ({downloads.length})
              </div>
              {downloads.map((download) => (
                <div
                  key={download.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    marginBottom: '8px',
                    background: 'rgba(15, 15, 15, 0.5)',
                    borderRadius: '8px',
                    border: '1px solid #444444'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '20px' }}>
                      {download.status === 'pending' && '⏳'}
                      {download.status === 'downloading' && '⬇️'}
                      {download.status === 'completed' && '✅'}
                      {download.status === 'error' && '❌'}
                    </div>
                    <div>
                      <div style={{ color: '#e8e8e8', fontWeight: 600 }}>
                        Topic {download.topicCode}
                      </div>
                      <div style={{ color: '#a0a0a0', fontSize: '12px' }}>
                        {download.status === 'pending' && 'Preparing downloads...'}
                        {download.status === 'downloading' && (
                          <div>
                            <div style={{ marginBottom: '4px' }}>
                              {download.officialPdfStatus === 'downloading' && '⏳ Downloading official PDF...'}
                              {download.officialPdfStatus === 'completed' && '✅ Official PDF downloaded'}
                              {download.officialPdfStatus === 'error' && '❌ Official PDF failed'}
                            </div>
                            <div>
                              {download.detailsPdfStatus === 'pending' && '⏳ Details PDF waiting...'}
                              {download.detailsPdfStatus === 'downloading' && '⏳ Generating details PDF (this may take 30-60 seconds)...'}
                              {download.detailsPdfStatus === 'completed' && '✅ Details PDF generated'}
                              {download.detailsPdfStatus === 'error' && '❌ Details PDF failed'}
                            </div>
                            {download.startTime && (
                              <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
                                Elapsed: {Math.round((Date.now() - download.startTime).valueOf() / 1000)}s
                              </div>
                            )}
                          </div>
                        )}
                        {download.status === 'completed' && `✅ Downloads complete: ${download.filename}`}
                        {download.status === 'error' && `❌ Error: ${download.error}`}
                      </div>
                    </div>
                  </div>
                  
                  {download.status === 'downloading' && (
                    <div style={{
                      width: '120px',
                      height: '6px',
                      background: '#333333',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: '60%',
                        height: '100%',
                        background: 'linear-gradient(90deg, #4a9eff, #357abd)',
                        animation: 'pulse 1.5s ease-in-out infinite alternate'
                      }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Results */}
          {!loading && (
            <div style={{ 
              display: 'grid', 
              gap: '24px',
              maxHeight: '800px',
              overflowY: 'auto',
              paddingRight: '8px'
            }}>
              {filteredOpportunities.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#666666',
                  fontSize: '18px'
                }}>
                  <div style={{ marginBottom: '20px', fontSize: '48px' }}>🎯</div>
                  {searchTerm || activeFilter !== 'all' ? (
                    <>
                      <div>No opportunities match your current parameters.</div>
                      <div style={{ fontSize: '14px', color: '#888888', marginTop: '8px' }}>
                        Try adjusting your search terms or filters.
                      </div>
                    </>
                  ) : (
                    <>
                      <div>Ready to scan for opportunities.</div>
                      <div style={{ fontSize: '14px', color: '#888888', marginTop: '8px' }}>
                        Execute search to discover mission-critical SBIR opportunities.
                      </div>
                    </>
                  )}
                </div>
              ) : (
                filteredOpportunities.map((opp) => {
                  const transformed = transformOpportunityData(opp)
                  const isSelected = selectedTopics.has(opp.topicCode)
                  const isDownloading = downloadingTopics.has(opp.topicCode)
                  
                  return (
                    <div
                      key={opp.topicId}
                      style={{
                        background: isSelected 
                          ? 'linear-gradient(135deg, #1a3a1a 0%, #2a4a2a 100%)'
                          : 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                        border: `1px solid ${isSelected ? '#4a9eff' : '#333333'}`,
                        borderRadius: '16px',
                        padding: '28px',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => toggleSelection(opp.topicCode)}
                    >
                      {/* Selection Indicator */}
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        border: `2px solid ${isSelected ? '#4a9eff' : '#666666'}`,
                        background: isSelected ? '#4a9eff' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#ffffff'
                      }}>
                        {isSelected ? '✓' : ''}
                      </div>

                      {/* Priority Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: getPriorityColor(transformed.priority),
                        color: '#ffffff',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {getPriorityLabel(transformed.priority)}
                      </div>

                      <div style={{
                        fontWeight: 700,
                        color: '#e8e8e8',
                        fontSize: '20px',
                        marginBottom: '12px',
                        lineHeight: '1.3',
                        paddingLeft: '40px',
                        paddingRight: '100px'
                      }}>
                        {transformed.title}
                      </div>
                      
                      <div style={{
                        color: '#4a9eff',
                        fontSize: '14px',
                        fontWeight: 600,
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        paddingLeft: '40px'
                      }}>
                        🏛️ {transformed.agency}
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        gap: '20px',
                        marginBottom: '16px',
                        paddingLeft: '40px',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{
                          color: '#ff6b6b',
                          fontSize: '14px',
                          fontWeight: 600
                        }}>
                          ⏰ Deadline: {transformed.deadline}
                        </div>
                        
                        <div style={{
                          color: '#ffd700',
                          fontSize: '14px',
                          fontWeight: 600
                        }}>
                          💬 Q&A: {transformed.numQuestions} questions
                        </div>
                        
                        <div style={{
                          color: getStatusColor(transformed.status),
                          fontSize: '14px',
                          fontWeight: 600
                        }}>
                          {getStatusLabel(transformed.status)}
                        </div>
                      </div>
                      
                      <p style={{
                        color: '#b0b0b0',
                        lineHeight: 1.6,
                        fontSize: '15px',
                        paddingLeft: '40px',
                        marginBottom: '20px'
                      }}>
                        {transformed.description.length > 300 
                          ? transformed.description.substring(0, 300) + '...'
                          : transformed.description
                        }
                      </p>

                      {/* Topic Managers */}
                      {transformed.managers.length > 0 && (
                        <div style={{
                          paddingLeft: '40px',
                          marginBottom: '20px',
                          padding: '12px 40px 12px 40px',
                          background: 'rgba(15, 15, 15, 0.5)',
                          borderRadius: '8px',
                          border: '1px solid #333333'
                        }}>
                          <div style={{
                            color: '#c0c0c0',
                            fontSize: '12px',
                            fontWeight: 600,
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                          }}>
                            📞 Point of Contact
                          </div>
                          {transformed.managers.slice(0, 1).map((manager, idx) => (
                            <div key={idx} style={{
                              display: 'flex',
                              gap: '20px',
                              flexWrap: 'wrap',
                              fontSize: '13px'
                            }}>
                              <div style={{ color: '#a0a0a0' }}>
                                <strong style={{ color: '#c0c0c0' }}>Name:</strong> {manager.name || 'N/A'}
                              </div>
                              <div style={{ color: '#a0a0a0' }}>
                                <strong style={{ color: '#c0c0c0' }}>Email:</strong> {manager.email || 'N/A'}
                              </div>
                              <div style={{ color: '#a0a0a0' }}>
                                <strong style={{ color: '#c0c0c0' }}>Phone:</strong> {manager.phone || 'N/A'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div style={{
                        marginTop: '20px',
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                        paddingLeft: '40px'
                      }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            startDownload(opp.topicCode)
                          }}
                          disabled={isDownloading}
                          style={{
                            background: isDownloading 
                              ? 'linear-gradient(135deg, #666666 0%, #888888 100%)'
                              : 'linear-gradient(135deg, #4a9eff 0%, #357abd 100%)',
                            color: '#ffffff',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: isDownloading ? 'not-allowed' : 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            position: 'relative',
                            opacity: isDownloading ? 0.8 : 1
                          }}
                        >
                          {isDownloading ? (
                            <>
                              <span style={{
                                display: 'inline-block',
                                width: '12px',
                                height: '12px',
                                border: '2px solid #ffffff',
                                borderTop: '2px solid transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                marginRight: '8px'
                              }} />
                              Processing...
                            </>
                          ) : (
                            '📋 Download PDFs'
                          )}
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            showAnalytics(opp)
                          }}
                          style={{
                            background: 'transparent',
                            color: '#c0c0c0',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: '1px solid #666666',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#c0c0c0'
                            e.currentTarget.style.color = '#000000'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = '#c0c0c0'
                          }}
                        >
                          📊 View Analytics
                        </button>
                        <div style={{
                          color: '#888888',
                          fontSize: '11px',
                          alignSelf: 'center',
                          marginLeft: 'auto'
                        }}>
                          Topic Code: {opp.topicCode}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          

          {/* Summary Stats */}
          <div style={{
            marginTop: '32px',
            padding: '24px',
            background: 'rgba(26, 26, 26, 0.5)',
            borderRadius: '12px',
            border: '1px solid #333333',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{
              color: '#c0c0c0',
              fontSize: '14px',
              fontWeight: 600
            }}>
              📊 Showing {filteredOpportunities.length} of {totalResults} opportunities (Page {page + 1} of {Math.ceil(totalResults / 25)})
            </div>
            <div style={{
              color: '#a0a0a0',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              🔄 Live data from DoD SBIR/STTR • Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Analytics Modal */}
        {selectedTopicForAnalytics && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
              borderRadius: '16px',
              padding: '40px',
              maxWidth: '800px',
              maxHeight: '80vh',
              overflow: 'auto',
              border: '2px solid #333333',
              position: 'relative'
            }}>
              {/* Close Button */}
              <button
                onClick={closeAnalytics}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'transparent',
                  border: 'none',
                  color: '#c0c0c0',
                  fontSize: '24px',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>

              {/* Header */}
              <div style={{
                textAlign: 'center',
                marginBottom: '32px',
                paddingRight: '40px'
              }}>
                <h2 style={{
                  color: 'transparent',
                  background: 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 50%, #a8a8a8 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '24px',
                  fontWeight: 700,
                  marginBottom: '8px'
                }}>
                  📊 Topic Analytics
                </h2>
                <div style={{
                  color: '#4a9eff',
                  fontSize: '16px',
                  fontWeight: 600
                }}>
                  {selectedTopicForAnalytics.topicCode}
                </div>
              </div>

              {/* Content */}
              <div style={{
                display: 'grid',
                gap: '24px'
              }}>
                {/* Basic Info */}
                <div style={{
                  background: 'rgba(15, 15, 15, 0.5)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #333333'
                }}>
                  <h3 style={{
                    color: '#c0c0c0',
                    fontSize: '16px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    📋 Basic Information
                  </h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <strong style={{ color: '#e8e8e8' }}>Title:</strong>
                      <div style={{ color: '#a0a0a0', marginTop: '4px' }}>
                        {selectedTopicForAnalytics.topicTitle}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#e8e8e8' }}>Agency:</strong>
                      <div style={{ color: '#a0a0a0', marginTop: '4px' }}>
                        {selectedTopicForAnalytics.component} - {selectedTopicForAnalytics.program}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#e8e8e8' }}>Status:</strong>
                      <div style={{ 
                        color: getStatusColor(selectedTopicForAnalytics.topicStatus),
                        marginTop: '4px',
                        fontWeight: 600
                      }}>
                        {getStatusLabel(selectedTopicForAnalytics.topicStatus)}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#e8e8e8' }}>Questions Published:</strong>
                      <div style={{ 
                        color: '#a0a0a0', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        {selectedTopicForAnalytics.numQuestions || 0} questions
                        {(selectedTopicForAnalytics.numQuestions || 0) > 0 && (
                          <button
                            onClick={() => showQADetails(selectedTopicForAnalytics)}
                            style={{
                              background: 'linear-gradient(135deg, #4a9eff 0%, #357abd 100%)',
                              color: '#ffffff',
                              padding: '4px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}
                          >
                            📋 View Q&A
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {(selectedTopicForAnalytics.objective || selectedTopicForAnalytics.description) && (
                  <div style={{
                    background: 'rgba(15, 15, 15, 0.5)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #333333'
                  }}>
                    <h3 style={{
                      color: '#c0c0c0',
                      fontSize: '16px',
                      fontWeight: 600,
                      marginBottom: '16px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      🎯 Objective
                    </h3>
                    <div style={{
                      color: '#a0a0a0',
                      lineHeight: 1.6
                    }}>
                      {selectedTopicForAnalytics.objective || selectedTopicForAnalytics.description}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                {selectedTopicForAnalytics.topicManagers && selectedTopicForAnalytics.topicManagers.length > 0 && (
                  <div style={{
                    background: 'rgba(15, 15, 15, 0.5)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #333333'
                  }}>
                    <h3 style={{
                      color: '#c0c0c0',
                      fontSize: '16px',
                      fontWeight: 600,
                      marginBottom: '16px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      📞 Points of Contact
                    </h3>
                    {selectedTopicForAnalytics.topicManagers.map((manager, idx) => (
                      <div key={idx} style={{
                        marginBottom: idx < selectedTopicForAnalytics.topicManagers!.length - 1 ? '16px' : '0',
                        padding: '12px',
                        background: 'rgba(26, 26, 26, 0.5)',
                        borderRadius: '8px',
                        border: '1px solid #444444'
                      }}>
                        <div style={{ color: '#e8e8e8', fontWeight: 600, marginBottom: '8px' }}>
                          {manager.name || 'Name not provided'}
                        </div>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '14px' }}>
                          <div style={{ color: '#a0a0a0' }}>
                            <strong style={{ color: '#c0c0c0' }}>Email:</strong> {manager.email || 'Not provided'}
                          </div>
                          <div style={{ color: '#a0a0a0' }}>
                            <strong style={{ color: '#c0c0c0' }}>Phone:</strong> {manager.phone || 'Not provided'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  justifyContent: 'center',
                  marginTop: '24px'
                }}>
                  <button
                    onClick={() => {
                      closeAnalytics()
                      startDownload(selectedTopicForAnalytics.topicCode)
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #4a9eff 0%, #357abd 100%)',
                      color: '#ffffff',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    📋 Download PDFs
                  </button>
                  <button
                    onClick={closeAnalytics}
                    style={{
                      background: 'transparent',
                      border: '2px solid #666666',
                      color: '#c0c0c0',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Q&A Modal */}
        {showQAModal && selectedTopicForAnalytics && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            padding: '20px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
              borderRadius: '16px',
              padding: '40px',
              maxWidth: '1000px',
              maxHeight: '85vh',
              overflow: 'auto',
              border: '2px solid #333333',
              position: 'relative',
              width: '100%'
            }}>
              {/* Close Button */}
              <button
                onClick={() => setShowQAModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'transparent',
                  border: 'none',
                  color: '#c0c0c0',
                  fontSize: '24px',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>

              {/* Header */}
              <div style={{
                textAlign: 'center',
                marginBottom: '32px',
                paddingRight: '40px'
              }}>
                <h2 style={{
                  color: 'transparent',
                  background: 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 50%, #a8a8a8 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '24px',
                  fontWeight: 700,
                  marginBottom: '8px'
                }}>
                  💬 Questions & Answers
                </h2>
                <div style={{
                  color: '#4a9eff',
                  fontSize: '16px',
                  fontWeight: 600,
                  marginBottom: '8px'
                }}>
                  {selectedTopicForAnalytics.topicCode}
                </div>
                <div style={{
                  color: '#a0a0a0',
                  fontSize: '14px'
                }}>
                  {selectedTopicForAnalytics.topicTitle}
                </div>
              </div>

              {/* Loading State */}
              {loadingQuestions && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#c0c0c0'
                }}>
                  <div style={{ marginBottom: '16px', fontSize: '32px' }}>⏳</div>
                  <div>Loading questions and answers...</div>
                </div>
              )}

              {/* Q&A Content */}
              {!loadingQuestions && (
                <div style={{ display: 'grid', gap: '24px' }}>
                  {selectedTopicQuestions.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: '#666666'
                    }}>
                      <div style={{ marginBottom: '16px', fontSize: '48px' }}>💭</div>
                      <div style={{ fontSize: '18px', marginBottom: '8px' }}>No questions published yet</div>
                      <div style={{ fontSize: '14px' }}>
                        Questions and answers will appear here once they are published by the agency.
                      </div>
                    </div>
                  ) : (
                    selectedTopicQuestions.map((qa, index) => (
                      <div
                        key={index}
                        style={{
                          background: 'rgba(15, 15, 15, 0.5)',
                          borderRadius: '12px',
                          padding: '24px',
                          border: '1px solid #333333'
                        }}
                      >
                        {/* Question Header */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '16px',
                          paddingBottom: '12px',
                          borderBottom: '1px solid #444444'
                        }}>
                          <div style={{
                            color: '#4a9eff',
                            fontSize: '16px',
                            fontWeight: 600
                          }}>
                            Question #{qa.questionNo || index + 1}
                          </div>
                          <div style={{
                            display: 'flex',
                            gap: '16px',
                            alignItems: 'center'
                          }}>
                            {qa.questionSubmittedOn && (
                              <div style={{
                                color: '#888888',
                                fontSize: '12px'
                              }}>
                                Submitted: {new Date(qa.questionSubmittedOn).toLocaleDateString()}
                              </div>
                            )}
                            <div style={{
                              background: qa.questionStatus === 'Answered' ? '#28a745' : '#dc3545',
                              color: '#ffffff',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}>
                              {qa.questionStatus || 'Pending'}
                            </div>
                          </div>
                        </div>

                        {/* Question Text */}
                        <div style={{
                          marginBottom: '16px'
                        }}>
                          <div style={{
                            color: '#c0c0c0',
                            fontSize: '14px',
                            fontWeight: 600,
                            marginBottom: '8px'
                          }}>
                            Question:
                          </div>
                          <div style={{
                            color: '#e8e8e8',
                            lineHeight: 1.6,
                            fontSize: '15px'
                          }}>
                            {cleanContent(qa.question)}
                          </div>
                        </div>

                        {/* Answers */}
                        {qa.answers && qa.answers.length > 0 ? (
                          qa.answers.map((answer: any, answerIndex: number) => (
                            <div
                              key={answerIndex}
                              style={{
                                background: 'rgba(74, 158, 255, 0.1)',
                                border: '1px solid #4a9eff',
                                borderRadius: '8px',
                                padding: '16px',
                                marginTop: '12px'
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '12px'
                              }}>
                                <div style={{
                                  color: '#4a9eff',
                                  fontSize: '14px',
                                  fontWeight: 600
                                }}>
                                  Official Response
                                </div>
                                {answer.answeredOn && (
                                  <div style={{
                                    color: '#888888',
                                    fontSize: '12px'
                                  }}>
                                    Answered: {new Date(answer.answeredOn).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              <div style={{
                                color: '#e8e8e8',
                                lineHeight: 1.6,
                                fontSize: '15px'
                              }}>
                                {cleanContent(answer.answer)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{
                            background: 'rgba(108, 117, 125, 0.1)',
                            border: '1px solid #6c757d',
                            borderRadius: '8px',
                            padding: '16px',
                            marginTop: '12px',
                            textAlign: 'center',
                            color: '#888888',
                            fontStyle: 'italic'
                          }}>
                            No official response yet.
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid #333333'
              }}>
                <button
                  onClick={() => setShowQAModal(false)}
                  style={{
                    background: 'transparent',
                    border: '2px solid #666666',
                    color: '#c0c0c0',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <style>
          {`
            @keyframes pulse {
              0% { opacity: 1; }
              100% { opacity: 0.5; }
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
      
      {/* Pagination Controls */}
      {totalResults > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          margin: '20px 0',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setPage(0)}
            disabled={page === 0}
            style={{
              padding: '8px 12px',
              border: '1px solid #4a9eff',
              background: 'transparent',
              color: page === 0 ? '#666' : '#4a9eff',
              borderRadius: '4px',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              opacity: page === 0 ? 0.5 : 1
            }}
          >
            « First
          </button>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: '8px 12px',
              border: '1px solid #4a9eff',
              background: 'transparent',
              color: page === 0 ? '#666' : '#4a9eff',
              borderRadius: '4px',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              opacity: page === 0 ? 0.5 : 1
            }}
          >
            ‹ Previous
          </button>
          
          {/* Page numbers */}
          {Array.from({ length: Math.min(5, Math.ceil(totalResults / 25)) }, (_, i) => {
            // Show pages around current page
            let pageNum = page - 2 + i;
            if (page < 3) pageNum = i; // First few pages
            else if (page > Math.ceil(totalResults / 25) - 4) // Last few pages
              pageNum = Math.max(0, Math.ceil(totalResults / 25) - 5) + i;
              
            if (pageNum < 0 || pageNum >= Math.ceil(totalResults / 25)) return null;
            
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #4a9eff',
                  background: page === pageNum ? '#4a9eff' : 'transparent',
                  color: page === pageNum ? '#fff' : '#4a9eff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: page === pageNum ? 'bold' : 'normal'
                }}
              >
                {pageNum + 1}
              </button>
            );
          })}
          
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(totalResults / 25) - 1, p + 1))}
            disabled={page >= Math.ceil(totalResults / 25) - 1}
            style={{
              padding: '8px 12px',
              border: '1px solid #4a9eff',
              background: 'transparent',
              color: page >= Math.ceil(totalResults / 25) - 1 ? '#666' : '#4a9eff',
              borderRadius: '4px',
              cursor: page >= Math.ceil(totalResults / 25) - 1 ? 'not-allowed' : 'pointer',
              opacity: page >= Math.ceil(totalResults / 25) - 1 ? 0.5 : 1
            }}
          >
            Next ›
          </button>
          <button
            onClick={() => setPage(Math.ceil(totalResults / 25) - 1)}
            disabled={page >= Math.ceil(totalResults / 25) - 1}
            style={{
              padding: '8px 12px',
              border: '1px solid #4a9eff',
          background: 'transparent',
          color: page >= Math.ceil(totalResults / 25) - 1 ? '#666' : '#4a9eff',
          borderRadius: '4px',
          cursor: page >= Math.ceil(totalResults / 25) - 1 ? 'not-allowed' : 'pointer',
          opacity: page >= Math.ceil(totalResults / 25) - 1 ? 0.5 : 1
        }}
      >
        Last »
      </button>
    </div>
  )}
    </div>
  )
}