import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Topic, QuestionAnswer, DetailedTopic } from '../types';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box,
  Divider,
  Paper,
  Button,
  Chip,
  Link,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Download as DownloadIcon, Close as CloseIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

interface TopicDetailModalProps {
  open: boolean;
  onClose: () => void;
  topic: Topic | null;
}

interface TopicManager {
  name?: string;
  email?: string;
  phone?: string;
  title?: string;
}

interface ReferenceDocument {
  title: string;
  url: string;
}

interface TopicWithDetails extends Omit<DetailedTopic, 'referenceDocuments' | 'topicManagers'> {
  pdfUrl?: string;
  questions?: QuestionAnswer[];
  referenceDocuments?: ReferenceDocument[];
  topicManagers?: TopicManager[];
  technologyAreas?: string[];
  focusAreas?: string[];
  keywords?: string[];
  objective?: string;
  description?: string;
  phase1Description?: string;
  phase2Description?: string;
  phase3Description?: string;
  topicNumber?: string;
  program?: string;
  releaseDate?: string;
  topicTitle?: string;
  topicCode?: string;
}

const TopicDetailModal: React.FC<TopicDetailModalProps> = ({ open, onClose, topic }) => {
  // All hooks must be called unconditionally at the top level
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  // State hooks
  const [detailedTopic, setDetailedTopic] = useState<TopicWithDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [qaLoading, setQaLoading] = useState<boolean>(false);
  const [qaError, setQaError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | false>(false);
  
  // Memoized values and callbacks
  const displayTopic = useMemo(() => 
    topic ? (detailedTopic || topic) as TopicWithDetails : null,
    [topic, detailedTopic]
  );
  
  const hasQuestions = useMemo(() => 
    Boolean(displayTopic?.questions?.length),
    [displayTopic]
  );
  
  const handleQuestionClick = useCallback((questionNo: number) => {
    setExpandedQuestion(prev => prev === questionNo ? false : questionNo);
  }, []);

  const fetchQAData = useCallback(async (topicId: string) => {
    setQaLoading(true);
    setQaError(null);
    
    try {
      const response = await axios.get<QuestionAnswer[]>(
        `https://www.dodsbirsttr.mil/topics/api/public/topics/${topicId}/questions`
      );
      
      // Sort by questionNo in ascending order (oldest first)
      const sortedQuestions = [...response.data].sort((a, b) => (a.questionNo || 0) - (b.questionNo || 0));
      
      setDetailedTopic(prev => {
        if (!prev) return null;
        return {
          ...prev,
          questions: sortedQuestions
        };
      });
    } catch (err) {
      console.error('Error fetching Q&A:', err);
      setQaError('Failed to load Q&A. Please try again later.');
    } finally {
      setQaLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchTopicDetails = async () => {
      if (!topic?.topicId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const [detailsResponse] = await Promise.all([
          axios.get<DetailedTopic>(
            `https://www.dodsbirsttr.mil/topics/api/public/topics/${topic.topicId}/details`
          ),
        ]);
        
        // Safely extract PDF URL
        const referenceDocs = Array.isArray(detailsResponse.data.referenceDocuments) 
          ? detailsResponse.data.referenceDocuments 
          : [];
          
        const pdfDoc = referenceDocs.find(doc => 
          (doc?.title && typeof doc.title === 'string' && doc.title.toLowerCase().includes('pdf')) || 
          (doc?.url && typeof doc.url === 'string' && doc.url.toLowerCase().endsWith('.pdf'))
        );
        
        setDetailedTopic({
          ...topic,
          ...detailsResponse.data,
          referenceDocuments: referenceDocs,
          pdfUrl: pdfDoc?.url,
          questions: [] // Initialize empty questions array
        });

        // Fetch Q&A data
        fetchQAData(topic.topicId);
      } catch (err) {
        console.error('Error fetching topic details:', err);
        setError('Failed to load topic details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (open && topic) {
      fetchTopicDetails();
    } else {
      setExpandedQuestion(false);
      setDetailedTopic(null);
    }
  }, [open, topic, fetchQAData]);

  const renderChips = useCallback((items?: (string | undefined | null)[], chipColor: 'primary' | 'secondary' | 'default' = 'default') => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return <Typography variant="body2" color="text.secondary">Not specified</Typography>;
    }
    
    const validItems = items.filter((item): item is string => Boolean(item));
    
    if (validItems.length === 0) {
      return <Typography variant="body2" color="text.secondary">None specified</Typography>;
    }
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
        {validItems.map((item, index) => (
          <Chip 
            key={index} 
            label={item} 
            size="small" 
            color={chipColor}
            variant="outlined"
          />
        ))}
      </Box>
    );
  }, []);

  const renderList = useCallback((items?: (string | undefined | null)[]) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return <Typography variant="body2" color="text.secondary">Not specified</Typography>;
    }
    
    const validItems = items.filter((item): item is string => Boolean(item));
    
    if (validItems.length === 0) {
      return <Typography variant="body2" color="text.secondary">None specified</Typography>;
    }
    
    return (
      <List dense disablePadding>
        {validItems.map((item, index) => (
          <ListItem key={index} disableGutters>
            <ListItemText primary={item} />
          </ListItem>
        ))}
      </List>
    );
  }, []);

  const renderSection = useCallback((title: string, content: React.ReactNode) => (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="subtitle1" sx={{ 
        fontWeight: 600, 
        color: theme.palette.primary.main, 
        mb: 0.5,
        fontSize: '0.95rem'
      }}>
        {title}
      </Typography>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 1.5, 
          bgcolor: theme.palette.grey[50], 
          borderRadius: 1, 
          whiteSpace: 'pre-line',
          lineHeight: 1.5,
          fontSize: '0.9rem'
        }}
      >
        {content}
      </Paper>
    </Box>
  ), [theme]);

  // Function to clean content from HTML/JSON
  const cleanContent = useCallback((content: string | undefined): string => {
    if (!content) return '';
    
    let processedContent = content;
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(processedContent);
      if (typeof parsed === 'object' && parsed !== null) {
        // If it's an object with content/answer property, use that
        if ('content' in parsed) {
          processedContent = parsed.content;
        } else if ('answer' in parsed) {
          processedContent = parsed.answer;
        } else {
          // Otherwise stringify the object
          return Object.values(parsed)
            .filter(val => typeof val === 'string')
            .join(' ')
            .replace(/<[^>]*>/g, '');
        }
      }
    } catch (e) {
      // Not JSON, continue with HTML cleaning
    }
    
    // Handle YouTube links
    const youtubeRegex = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = processedContent.match(youtubeRegex);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Remove HTML tags and decode HTML entities
    const temp = document.createElement('div');
    temp.innerHTML = processedContent.replace(/<[^>]*>/g, ' ');
    return temp.textContent || temp.innerText || '';
  }, []);
  
  // Enhanced function to clean answer content and remove duplicate questions
  const cleanAnswerContent = useCallback((answerContent: string, originalQuestion?: string): string => {
    if (!answerContent) return '';
    
    let cleaned = cleanContent(answerContent);
    
    // If we have the original question, try to remove it from the answer
    if (originalQuestion) {
      const cleanQuestion = cleanContent(originalQuestion).trim();
      
      // Try different patterns to remove the question from the answer
      const patterns = [
        // Exact match at the beginning
        new RegExp(`^${cleanQuestion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'),
        // Question followed by common separators
        new RegExp(`^${cleanQuestion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[:\\-\\.]\\s*`, 'i'),
        // Question in quotes or parentheses
        new RegExp(`^["'\\(]?${cleanQuestion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'\\)]?\\s*[:\\-\\.]?\\s*`, 'i'),
      ];
      
      for (const pattern of patterns) {
        cleaned = cleaned.replace(pattern, '');
      }
    }
    
    // Remove common answer prefixes that might include the question
    const answerPrefixes = [
      /^Answer:\s*/i,
      /^Response:\s*/i,
      /^Reply:\s*/i,
      /^A:\s*/i,
      /^Question.*?Answer:\s*/i,
      /^Q:.*?A:\s*/i,
    ];
    
    for (const prefix of answerPrefixes) {
      cleaned = cleaned.replace(prefix, '');
    }
    
    return cleaned.trim();
  }, [cleanContent]);
  
  // Clean all text content
  const cleanText = useCallback((text: string | undefined): string => {
    if (!text) return '';
    // First remove paragraph tags and their content if they only contain whitespace
    let cleaned = text.replace(/<p[^>]*>\s*<\/p>/g, '') // Empty paragraphs
                     .replace(/<\/?p[^>]*>/g, '') // Remove remaining paragraph tags
                     .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
                     .trim();
    
    // Then apply the standard cleaning
    cleaned = cleanContent(cleaned)
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .replace(/([^\n])\n([^\n])/g, '$1 $2') // Replace single newlines with spaces
      .trim();
      
    return cleaned;
  }, [cleanContent]);

  // Helper function to handle PDF download
  const handleDownloadPdf = useCallback(() => {
    if (displayTopic?.pdfUrl) {
      window.open(displayTopic.pdfUrl, '_blank');
    }
  }, [displayTopic?.pdfUrl]);
  
  // Early return for no topic selected
  if (!topic) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Typography>No topic selected</Typography>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Loading state
  if (!displayTopic) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 2,
          height: fullScreen ? '100%' : '85vh',
          maxHeight: fullScreen ? '100%' : '90vh',
          margin: fullScreen ? 0 : '16px',
          width: fullScreen ? '100%' : 'calc(100% - 32px)',
          maxWidth: fullScreen ? '100%' : 'calc(100% - 32px)'
        }
      }}
    >
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          zIndex: 1,
          flexWrap: 'wrap',
          gap: 1
        }}
      >  
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ 
        p: 1.5,
        background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
        color: 'white',
        position: 'relative',
        zIndex: 1
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 0.5, wordBreak: 'break-word', fontSize: '1.1rem' }}>
              {cleanText(displayTopic.topicTitle) || 'No Title'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', '& > *': { fontSize: '0.8rem' } }}>
              <Typography variant="body2">
                <strong>Topic Code:</strong> {displayTopic.topicCode}
              </Typography>
              <Typography variant="body2">
                <strong>Program:</strong> {displayTopic.program || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Component:</strong> {displayTopic.component || 'N/A'}
              </Typography>
            </Box>
          </Box>
          {displayTopic.pdfUrl && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<DownloadIcon />}
              onClick={() => window.open(displayTopic.pdfUrl, '_blank')}
              size="small"
              sx={{ 
                backgroundColor: 'white',
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                }
              }}
            >
              Download PDF
            </Button>
          )}
        </Box>
      </Box>

      <DialogContent dividers sx={{ 
        p: 0,
        '&:last-child': { 
          paddingBottom: 0 
        },
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        '& > .MuiBox-root': {
          overflowY: 'auto',
          px: 2,
          py: 1
        },
        '& .MuiAccordion-root': {
          margin: '4px 0',
          '&:before': {
            display: 'none'
          },
          '&.Mui-expanded': {
            margin: '4px 0'
          }
        }
      }}>
        <Box sx={{ p: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box p={2} color="error.main">
              <Typography color="error">{error}</Typography>
            </Box>
          ) : (
            <>
              {/* TPOC Information */}
              {renderSection(
                'Topic Point of Contact',
                displayTopic.topicManagers?.length ? (
                  displayTopic.topicManagers.map((manager, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography><strong>Name:</strong> {manager.name || 'N/A'}</Typography>
                      <Typography><strong>Email:</strong> {manager.email || 'N/A'}</Typography>
                      <Typography><strong>Phone:</strong> {manager.phone || 'Not Provided'}</Typography>
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary">No contact information available</Typography>
                )
              )}

              <Divider sx={{ my: 3 }} />

              {/* Technology Areas & Focus Areas */}
              <Box display="flex" gap={3} sx={{ mb: 3 }}>
                <Box flex={1}>
                  {renderSection('Technology Areas', renderList(displayTopic.technologyAreas))}
                </Box>
                <Box flex={1}>
                  {renderSection('Focus Areas', renderList(displayTopic.focusAreas))}
                </Box>
              </Box>

              {/* Keywords */}
              {renderSection('Keywords', renderChips(displayTopic.keywords))}

              {/* Objective */}
              {renderSection(
                'Objective',
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {cleanText(displayTopic.objective) || 'No objective provided.'}
                </Typography>
              )}

              {/* Description */}
              {renderSection(
                'Description',
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {cleanText(displayTopic.description) || 'No description provided.'}
                </Typography>
              )}

              {/* Phase Descriptions */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1.5, color: theme.palette.primary.main, fontWeight: 600, fontSize: '1.05rem' }}>
                  Topic Details
                </Typography>
                <Box sx={{ '& > div': { mb: 1.5, '&:last-child': { mb: 0 } } }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>Phase 1</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {cleanText(displayTopic.phase1Description) || 'No description provided for Phase 1.'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>Phase 2</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {cleanText(displayTopic.phase2Description) || 'No description provided for Phase 2.'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>Phase 3</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {cleanText(displayTopic.phase3Description) || 'No description provided for Phase 3.'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Reference Documents */}
              {renderSection(
                'Reference Documents',
                displayTopic.referenceDocuments?.length ? (
                  <List dense>
                    {displayTopic.referenceDocuments.map((doc, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <Link href={doc.url} target="_blank" rel="noopener">
                          {doc.title}
                        </Link>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">No reference documents available</Typography>
                )
              )}

              {/* Questions & Answers Section */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.primary.main, 
                  mb: 1,
                  fontSize: '1rem'
                }}>
                  Questions & Answers
                  {displayTopic.numQuestions && displayTopic.numQuestions > 0 && (
                    <Typography component="span" sx={{ ml: 1, fontSize: '0.85rem', color: 'text.secondary' }}>
                      ({displayTopic.numQuestions} {displayTopic.numQuestions === 1 ? 'question' : 'questions'})
                    </Typography>
                  )}
                </Typography>
                <Paper elevation={0} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                  {qaLoading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : qaError ? (
                    <Box p={2} color="error.main">
                      <Typography color="error">{qaError}</Typography>
                    </Box>
                  ) : hasQuestions ? (
                    (displayTopic.questions || []).map((qa: QuestionAnswer) => (
                      <Accordion 
                        key={qa.questionNo}
                        expanded={expandedQuestion === qa.questionNo}
                        onChange={() => handleQuestionClick(qa.questionNo || 0)}
                        elevation={0}
                        sx={{
                          '&:not(:last-child)': {
                            borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
                          },
                          '&:before': {
                            display: 'none',
                          },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          aria-controls={`qa-${qa.questionNo}-content`}
                          id={`qa-${qa.questionNo}-header`}
                          sx={{
                            backgroundColor: expandedQuestion === qa.questionNo ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.02)',
                            },
                          }}
                        >
                          <Box sx={{ width: '100%' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography sx={{ fontWeight: 500 }}>
                                Question #{qa.questionNo}
                              </Typography>
                              <Chip 
                                label={qa.questionStatus || 'Pending'} 
                                size="small" 
                                sx={{
                                  backgroundColor: qa.questionStatus === 'Answered' ? 'success.main' : 'error.light',
                                  color: 'white',
                                  '& .MuiChip-label': {
                                    px: 1,
                                    py: 0.5,
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold'
                                  },
                                  minWidth: '80px',
                                  height: '20px'
                                }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Submitted on {qa.questionSubmittedOn ? format(new Date(qa.questionSubmittedOn), 'MMM d, yyyy') : 'N/A'}
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                              {cleanText(qa.question) || 'No question text available'}
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)', pt: 2 }}>
                          {qa.answers && qa.answers.length > 0 ? (
                            <>
                              {qa.answers.map((answer: { answer: string; answeredOn: string }, idx: number) => (
                                <Box key={idx} sx={{ mb: 2 }}>
                                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                      Official Response
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Answered on {answer.answeredOn ? format(new Date(answer.answeredOn), 'MMM d, yyyy') : 'N/A'}
                                    </Typography>
                                  </Box>
                                  <Paper 
                                    elevation={0} 
                                    sx={{ 
                                      p: 2, 
                                      backgroundColor: 'white',
                                      borderRadius: 1,
                                      border: '1px solid rgba(0, 0, 0, 0.04)'
                                    }}
                                  >
                                    {cleanAnswerContent(answer.answer, qa.question).startsWith('https://www.youtube.com/embed/') ? (
                                      <Box sx={{ mt: 2, position: 'relative', pb: '56.25%', height: 0, overflow: 'hidden' }}>
                                        <iframe
                                          src={cleanAnswerContent(answer.answer, qa.question)}
                                          style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            border: 'none'
                                          }}
                                          allowFullScreen
                                          title="YouTube video"
                                        />
                                      </Box>
                                    ) : (
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          whiteSpace: 'pre-line',
                                          '& ul, & ol': {
                                            pl: 2,
                                            my: 1,
                                            '& li': {
                                              mb: 0.5,
                                              '&:last-child': {
                                                mb: 0
                                              }
                                            }
                                          }
                                        }}
                                      >
                                        {cleanAnswerContent(answer.answer, qa.question) || 'No answer text available'}
                                      </Typography>
                                    )}
                                  </Paper>
                                </Box>
                              ))}
                            </>
                          ) : (
                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                              No official response yet.
                            </Typography>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    ))
                  ) : (
                    <Box p={3} textAlign="center">
                      <Typography color="text.secondary">
                        No questions have been published for this topic yet.
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TopicDetailModal;