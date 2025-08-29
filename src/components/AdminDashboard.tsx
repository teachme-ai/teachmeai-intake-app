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
      // In production, you'd use a proper admin token
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
      submission.learnerType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.learnerProfile.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' || submission.learnerType === filterType
    
    return matchesSearch && matchesFilter
  }) || []

  const exportToCSV = () => {
    if (!data?.submissions) return
    
    const headers = ['ID', 'Timestamp', 'Session ID', 'Current Roles', 'Learner Type', 'Skill Stage', 'Learner Profile']
    const csvContent = [
      headers.join(','),
      ...data.submissions.map(sub => [
        sub.id,
        sub.timestamp,
        sub.sessionId,
        sub.currentRoles || 'None selected',
        sub.learnerType,
        sub.skillStage,
        sub.learnerProfile
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `intake-submissions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectunkURL(url)
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
                    Learner Profile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    Recommendations
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
                        {submission.currentRoles || 'None selected'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {submission.learnerType}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Skill Level: {submission.skillStage}/5
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {submission.recommendations?.slice(0, 2).map((rec, index) => (
                          <div key={index} className="flex items-center gap-1 mb-1">
                            <Target className="h-3 w-3 text-green-500" />
                            <span className="truncate max-w-xs">{rec}</span>
                          </div>
                        ))}
                        {submission.recommendations?.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{submission.recommendations.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
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

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Submission Details
                </h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Basic Info</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Session ID:</span>
                      <p className="font-mono">{selectedSubmission.sessionId}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Timestamp:</span>
                      <p>{new Date(selectedSubmission.timestamp).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Learner Type:</span>
                      <p className="capitalize">{selectedSubmission.learnerType}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Skill Stage:</span>
                      <p>{selectedSubmission.skillStage}/5</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">VARK Preferences</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Object.entries(selectedSubmission.varkPreferences).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-gray-500 capitalize">{key}:</span>
                        <p>{value}/5</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">AI Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Learner Profile:</span>
                      <p>{selectedSubmission.learnerProfile}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Recommendations:</span>
                      <ul className="list-disc list-inside ml-2">
                        {selectedSubmission.recommendations?.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-gray-500">Next Steps:</span>
                      <ul className="list-disc list-inside ml-2">
                        {selectedSubmission.nextSteps?.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
