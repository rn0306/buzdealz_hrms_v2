import React, { useState, useMemo, useEffect } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { toast } from 'sonner'
import { api } from '../../lib/api' // ✅ use same instance as your other pages

const placeholderChips = [
  '{{full_name}}',
  '{{joining_date}}',
  '{{email}}',
  '{{designation}}',
  '{{onboarding_link}}',
]

type EmailTemplate = {
  id: string
  name: string
  category: string
  subject: string
  body_html: string
  placeholders?: string[]
  is_active?: boolean
  updatedAt?: string
}

const EmailTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [showEditorModal, setShowEditorModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // ✅ Fetch templates on mount
  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    setLoading(true)
    try {
      const res = await api.get('/api/email-templates')
      setTemplates(res.data.data || [])
    } catch (err: any) {
      console.error('Failed to fetch templates:', err)
      toast.error(err?.response?.data?.message || 'Failed to load email templates')
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      return (
        (t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.subject?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (categoryFilter ? t.category === categoryFilter : true)
      )
    })
  }, [templates, searchTerm, categoryFilter])

  const categories = Array.from(new Set(templates.map((t) => t.category)))

  function openNewTemplateModal() {
    setEditingTemplate({
      id: '',
      name: '',
      category: '',
      subject: '',
      body_html: '',
      placeholders: [],
      is_active: true,
    })
    setShowEditorModal(true)
  }

  async function saveTemplate() {
    if (!editingTemplate) return

    const payload = {
      name: editingTemplate.name,
      category: editingTemplate.category,
      subject: editingTemplate.subject,
      body_html: editingTemplate.body_html,
      placeholders: placeholderChips,
      is_active: editingTemplate.is_active ?? true,
    }

    try {
      if (editingTemplate.id) {
        await api.put(`/api/email-templates/${editingTemplate.id}`, payload)
        toast.success('Template updated successfully')
      } else {
        await api.post('/api/email-templates', payload)
        toast.success('Template created successfully')
      }
      setShowEditorModal(false)
      fetchTemplates()
    } catch (err: any) {
      console.error('Error saving template:', err)
      toast.error(err?.response?.data?.message || 'Failed to save template')
    }
  }

  async function deleteTemplate(id: string) {
    if (!window.confirm('Are you sure you want to delete this template?')) return
    try {
      await api.delete(`/api/email-templates/${id}`)
      toast.success('Template deleted successfully')
      fetchTemplates()
    } catch (err: any) {
      console.error('Error deleting template:', err)
      toast.error(err?.response?.data?.message || 'Failed to delete template')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-blue-50 p-6 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Email Templates</h1>
        <button
          onClick={openNewTemplateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-md transition-all"
        >
          + New Template
        </button>
      </div>

      {/* Search and filter */}
      <div className="flex justify-end mb-4 space-x-4">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-300 shadow-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-300 shadow-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow-sm rounded-xl">
        <table className="min-w-full divide-y divide-gray-200 rounded-xl">
          <thead className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-t-xl">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                Template Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                Updated Date
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-blue-900 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  Loading templates...
                </td>
              </tr>
            )}
            {!loading && filteredTemplates.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                  No templates found.
                </td>
              </tr>
            )}
            {filteredTemplates.map((template) => (
              <tr
                key={template.id}
                className="hover:shadow-md hover:bg-blue-50 transition cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">{template.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{template.category}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      template.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {template.updatedAt
                    ? new Date(template.updatedAt).toLocaleDateString()
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center space-x-3">
                  <button
                    onClick={() => {
                      setEditingTemplate(template)
                      setShowPreviewModal(true)
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => {
                      setEditingTemplate(template)
                      setShowEditorModal(true)
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✨ Editor Modal */}
      {showEditorModal && editingTemplate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-6 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white p-5 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-xl font-semibold tracking-wide">
                {editingTemplate.id ? 'Edit Email Template' : 'Create New Email Template'}
              </h2>
              <button
                onClick={() => setShowEditorModal(false)}
                className="text-white/80 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, name: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Welcome Email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.category}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, category: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Onboarding"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.subject}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, subject: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Welcome to the Company!"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email Body (HTML)
                </label>
                <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={editingTemplate.body_html}
                    onChange={(content) =>
                      setEditingTemplate({ ...editingTemplate, body_html: content })
                    }
                    className="bg-white"
                    style={{ height: '200px' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Available Placeholders
                </label>
                <div className="flex flex-wrap gap-2">
                  {placeholderChips.map((ph) => (
                    <span
                      key={ph}
                      className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {ph}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t mt-6">
                <button
                  onClick={() => setShowEditorModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTemplate}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md hover:opacity-90 transition-all"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && editingTemplate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-6 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6 border border-gray-100">
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">
              Preview: {editingTemplate.name}
            </h2>
            <div
              className="border rounded-lg p-4 bg-gray-50"
              dangerouslySetInnerHTML={{ __html: editingTemplate.body_html }}
            />
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmailTemplateManager
