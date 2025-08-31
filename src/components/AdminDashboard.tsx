'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Download, Eye, Calendar, User, Target } from 'lucide-react'

interface Submission {
  id: number
  timestamp: string
  sessionId: string
  currentRoles: string
  learnerType: string
  skillStage: string
  varkPreferences: any
  recommendations: string[]
  nextSteps: string[]
  learnerProfile: string
  rawData: any
  analysis: any
}

interface AdminData {
  submissions: Submission[]
  total: number
  lastUpdated: string
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/submissions', {
        headers: {
          'Authorization': 'Bearer admin-token-123'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch submissions')
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = data?.submissions.filter(submission => {
    const matchesSearch = 
      (submission.learnerType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (submission.sessionId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (submission.learnerProfile || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' || submission.learnerType === filterType
    
    return matchesSearch && matchesFilter
  }) || []

  const exportToCSV = () => {
    if (!data?.submissions) return
    
    const headers = [
      'ID', 'Timestamp', 'Session ID', 'Current Roles', 'Learner Type', 'Skill Stage',
      'Goal Setting', 'New Approaches', 'Reflection', 'AI Tools Confidence', 'Resilience',
      'Career Vision', 'Success Description', 'Learning Challenge', 'Outcome Driven',
      'Time Barrier', 'Current Frustrations', 'Visual', 'Audio', 'Reading/Writing', 'Kinesthetic',
      'Concrete Benefits', 'Short Term Application', 'Learner Profile'
    ]
    
    const csvContent = [
      headers.join(','),
      ...data.submissions.map(sub => [
        sub.id,
        sub.timestamp,
        sub.sessionId,
        Array.isArray(sub.rawData?.currentRoles) ? sub.rawData.currentRoles.join('; ') : (sub.currentRoles || 'None selected'),
        sub.learnerType,
        sub.skillStage,
        sub.rawData?.goalSettingConfidence || 'N/A',
        sub.rawData?.newApproachesFrequency || 'N/A',
        sub.rawData?.reflectionFrequency || 'N/A',
        sub.rawData?.aiToolsConfidence || 'N/A',
        sub.rawData?.resilienceLevel || 'N/A',
        sub.rawData?.clearCareerVision || 'N/A',
        sub.rawData?.successDescription || 'N/A',
        sub.rawData?.learningForChallenge || 'N/A',
        sub.rawData?.outcomeDrivenLearning || 'N/A',
        sub.rawData?.timeBarrier || 'N/A',
        `"${(sub.rawData?.currentFrustrations || 'Not provided').replace(/"/g, '""')}"`,
        sub.varkPreferences?.visual || 'N/A',
        sub.varkPreferences?.audio || 'N/A',
        sub.varkPreferences?.readingWriting || 'N/A',
        sub.varkPreferences?.kinesthetic || 'N/A',
        `"${(sub.rawData?.concreteBenefits || 'Not provided').replace(/"/g, '""')}"`,
        `"${(sub.rawData?.shortTermApplication || 'Not provided').replace(/"/g, '""')}"`,
        `"${(sub.learnerProfile || 'Not available').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `intake-submissions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchSubmissions}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            {data?.total} total submissions • Last updated: {new Date(data?.lastUpdated || '').toLocaleString()}
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="activist">Activist</option>
                  <option value="reflector">Reflector</option>
                  <option value="theorist">Theorist</option>
                  <option value="pragmatist">Pragmatist</option>
                </select>
              </div>
            </div>

            {/* Export */}
            <button
              onClick={exportToCSV}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    Current Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    Self-Regulation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    Motivation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    Learning Style
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            Session {submission.sessionId.slice(-8)}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(submission.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {Array.isArray(submission.rawData?.currentRoles) 
                          ? submission.rawData.currentRoles.join(', ') 
                          : submission.currentRoles || 'None selected'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Goals: {submission.rawData?.goalSettingConfidence || 'N/A'}/5</div>
                        <div>Resilience: {submission.rawData?.resilienceLevel || 'N/A'}/5</div>
                        <div>AI Tools: {submission.rawData?.aiToolsConfidence || 'N/A'}/5</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Vision: {submission.rawData?.clearCareerVision || 'N/A'}/5</div>
                        <div>Challenge: {submission.rawData?.learningForChallenge || 'N/A'}/5</div>
                        <div>Outcome: {submission.rawData?.outcomeDrivenLearning || 'N/A'}/5</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {submission.learnerType}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Skill: {submission.skillStage}/5
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
            <p className="text-gray-500">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No submissions have been made yet'
              }
            </p>
          </div>
        )}
      </div>

      {/* Print-Ready Report Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6 print:mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  TeachMeAI IMPACT Analysis Report
                </h2>
                <div className="flex gap-2 print:hidden">
                  <button
                    onClick={() => window.print()}
                    className="btn-secondary text-sm"
                  >
                    Print Report
                  </button>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="space-y-8 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible">
                {/* Header Info */}
                <div className="border-b pb-4 print:pb-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Session:</span>
                      <span className="ml-2 font-mono">{selectedSubmission.sessionId.slice(-8)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Date:</span>
                      <span className="ml-2">{new Date(selectedSubmission.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Learner Type:</span>
                      <span className="ml-2 capitalize font-medium text-blue-600">{selectedSubmission.learnerType}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Skill Level:</span>
                      <span className="ml-2 font-medium">{selectedSubmission.skillStage}/5</span>
                    </div>
                  </div>
                </div>

                {/* IMPACT Analysis Sections */}
                {(() => {
                  // Try to get analysis from either analysis field or parse from learnerProfile
                  let analysisData = selectedSubmission.analysis
                  if ((!analysisData || Object.keys(analysisData).length === 0) && selectedSubmission.learnerProfile?.startsWith('{')) {
                    try {
                      analysisData = JSON.parse(selectedSubmission.learnerProfile)
                    } catch (e) {
                      analysisData = {}
                    }
                  }
                  
                  if (!analysisData || Object.keys(analysisData).length === 0) return null
                  
                  return (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900 border-b-2 border-blue-500 pb-2">
                        IMPACT Framework Analysis
                      </h3>
                      
                      {analysisData.Identify && (
                        <div className="bg-blue-50 p-4 rounded-lg print:bg-white print:border print:border-blue-200">
                          <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2 print:bg-blue-800">I</span>
                            Identify - Assessment
                          </h4>
                          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {String(analysisData.Identify).split('\n').map((line, i) => (
                              <p key={i} className={line.startsWith('*') || line.startsWith('-') ? 'ml-4 mb-1' : 'mb-2'}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysisData.Motivate && (
                        <div className="bg-green-50 p-4 rounded-lg print:bg-white print:border print:border-green-200">
                          <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                            <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2 print:bg-green-800">M</span>
                            Motivate - Learner Profile
                          </h4>
                          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {String(analysisData.Motivate).split('\n').map((line, i) => (
                              <p key={i} className={line.startsWith('*') || line.startsWith('-') ? 'ml-4 mb-1' : 'mb-2'}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysisData.Plan && (
                        <div className="bg-purple-50 p-4 rounded-lg print:bg-white print:border print:border-purple-200">
                          <h4 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                            <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2 print:bg-purple-800">P</span>
                            Plan - Learning Opportunities
                          </h4>
                          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {String(analysisData.Plan).split('\n').map((line, i) => (
                              <p key={i} className={line.startsWith('*') || line.startsWith('-') ? 'ml-4 mb-1' : 'mb-2'}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysisData.Act && (
                        <div className="bg-orange-50 p-4 rounded-lg print:bg-white print:border print:border-orange-200">
                          <h4 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                            <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2 print:bg-orange-800">A</span>
                            Act - Priority Actions
                          </h4>
                          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {String(analysisData.Act).split('\n').map((line, i) => (
                              <p key={i} className={line.startsWith('*') || line.startsWith('-') ? 'ml-4 mb-1' : 'mb-2'}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysisData.Check && (
                        <div className="bg-yellow-50 p-4 rounded-lg print:bg-white print:border print:border-yellow-200">
                          <h4 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
                            <span className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2 print:bg-yellow-800">C</span>
                            Check - Progress & Adjustment
                          </h4>
                          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {String(analysisData.Check).split('\n').map((line, i) => (
                              <p key={i} className={line.startsWith('*') || line.startsWith('-') ? 'ml-4 mb-1' : 'mb-2'}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysisData.Transform && (
                        <div className="bg-red-50 p-4 rounded-lg print:bg-white print:border print:border-red-200">
                          <h4 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                            <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2 print:bg-red-800">T</span>
                            Transform - Future Roadmap
                          </h4>
                          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {String(analysisData.Transform).split('\n').map((line, i) => (
                              <p key={i} className={line.startsWith('*') || line.startsWith('-') ? 'ml-4 mb-1' : 'mb-2'}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Recommendations Section */}
                {(() => {
                  let recommendations = selectedSubmission.recommendations
                  if ((!recommendations || recommendations.length === 0) && selectedSubmission.learnerProfile?.startsWith('{')) {
                    try {
                      const parsed = JSON.parse(selectedSubmission.learnerProfile)
                      recommendations = parsed.recommendations || []
                    } catch (e) {
                      recommendations = []
                    }
                  }
                  
                  if (!recommendations || recommendations.length === 0) return null
                  
                  return (
                    <div className="bg-gray-50 p-4 rounded-lg print:bg-white print:border print:border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        📋 Key Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0 print:bg-blue-800">
                              {index + 1}
                            </span>
                            <span className="text-gray-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })()}

                {/* Next Steps Section */}
                {(() => {
                  let nextSteps = selectedSubmission.nextSteps
                  if ((!nextSteps || nextSteps.length === 0) && selectedSubmission.learnerProfile?.startsWith('{')) {
                    try {
                      const parsed = JSON.parse(selectedSubmission.learnerProfile)
                      nextSteps = parsed.nextSteps || []
                    } catch (e) {
                      nextSteps = []
                    }
                  }
                  
                  if (!nextSteps || nextSteps.length === 0) return null
                  
                  return (
                    <div className="bg-green-50 p-4 rounded-lg print:bg-white print:border print:border-green-200">
                      <h3 className="text-lg font-semibold text-green-800 mb-3">
                        🎯 Immediate Next Steps
                      </h3>
                      <ul className="space-y-2">
                        {nextSteps.map((step, index) => (
                          <li key={index} className="flex items-start">
                            <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0 print:bg-green-800">
                              {index + 1}
                            </span>
                            <span className="text-gray-700">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })()}

                {/* Learner Profile Summary */}
                {selectedSubmission.learnerProfile && (
                  <div className="bg-blue-50 p-4 rounded-lg print:bg-white print:border print:border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">
                      👤 Learner Profile Summary
                    </h3>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {(() => {
                        // Check if learnerProfile is a JSON string that needs parsing
                        if (selectedSubmission.learnerProfile.startsWith('{')) {
                          try {
                            const parsed = JSON.parse(selectedSubmission.learnerProfile)
                            return (
                              <div className="space-y-4">
                                {Object.entries(parsed).map(([key, value]) => {
                                  if (key === 'learnerProfile' || key === 'recommendations' || key === 'nextSteps') {
                                    return null // Skip these as they're displayed elsewhere
                                  }
                                  return (
                                    <div key={key} className="border-l-4 border-blue-300 pl-4">
                                      <h4 className="font-semibold text-blue-700 mb-2 capitalize">
                                        {key === 'Identify' && '🎯 Identify - Assessment'}
                                        {key === 'Motivate' && '💪 Motivate - Learner Profile'}
                                        {key === 'Plan' && '📋 Plan - Learning Opportunities'}
                                        {key === 'Act' && '⚡ Act - Priority Actions'}
                                        {key === 'Check' && '✅ Check - Progress & Adjustment'}
                                        {key === 'Transform' && '🚀 Transform - Future Roadmap'}
                                      </h4>
                                      <div className="text-gray-700 leading-relaxed">
                                        {String(value).split('\n').map((line, i) => (
                                          <p key={i} className={line.startsWith('*') ? 'ml-4' : 'mb-2'}>
                                            {line}
                                          </p>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          } catch (e) {
                            return selectedSubmission.learnerProfile
                          }
                        }
                        return selectedSubmission.learnerProfile
                      })()} 
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="border-t pt-4 text-center text-sm text-gray-500 print:pt-2">
                  <p>Generated by TeachMeAI IMPACT Assistant • {new Date(selectedSubmission.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}