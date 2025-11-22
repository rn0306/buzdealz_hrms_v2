import React, { useEffect, useMemo, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { toast } from "sonner";
import { api } from "../../lib/api";
import Button from "../../components/ui/Button";

// Shared types
type BaseTemplate = {
  id: string;
  name: string;
  category: string;
  subject?: string;
  body_html: string;
  placeholders?: string[];
  is_active?: boolean;
  updatedAt?: string;
};

type EmailTemplate = BaseTemplate & {
  subject: string;
};
type DocumentTemplate = BaseTemplate;

// Placeholders for templates
const placeholderChips = [
  "{{full_name}}",
  "{{joining_date}}",
  "{{email}}",
  "{{designation}}",
  "{{onboarding_link}}",
];

// Status color mapping for HRMS-like badge
const STATUS_COLORS = {
  Active: "bg-green-100 text-green-800 border-green-200",
  Inactive: "bg-red-100 text-red-800 border-red-200",
};

export default function TemplateManager() {
  // Main tab state
  const [activeTab, setActiveTab] = useState<"email" | "document">("email");

  // Email Template state
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [editingEmail, setEditingEmail] = useState<EmailTemplate | null>(null);

  // Document Template state
  const [docTemplates, setDocTemplates] = useState<DocumentTemplate[]>([]);
  const [showDocForm, setShowDocForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentTemplate | null>(null);

  // Search and filter states
  const [emailSearch, setEmailSearch] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [docSearch, setDocSearch] = useState("");
  const [docFilter, setDocFilter] = useState("");

  // Document PDF preview states
  const [docPdfUrl, setDocPdfUrl] = useState<string | null>(null);
  const [sendingDoc, setSendingDoc] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [showDocPreview, setShowDocPreview] = useState(false);

  useEffect(() => {
    fetchEmailTemplates();
    fetchDocTemplates();
  }, []);

  async function fetchEmailTemplates() {
    try {
      const res = await api.get("/api/email-templates");
      setEmailTemplates(res.data.data || []);
    } catch (err: any) {
      toast.error("Failed to load email templates");
    }
  }

  async function fetchDocTemplates() {
    try {
      const res = await api.get("/api/document-templates");
      setDocTemplates(res.data.data || []);
    } catch (err: any) {
      toast.error("Failed to load document templates");
    }
  }

  // --- Email Template CRUD ---
  function onEditEmail(template: EmailTemplate) {
    setEditingEmail(template);
    setShowEmailForm(true);
  }
  function onNewEmail() {
    setEditingEmail({
      id: "",
      name: "",
      category: "",
      subject: "",
      body_html: "",
      placeholders: [],
      is_active: true,
    });
    setShowEmailForm(true);
  }
  async function onSaveEmail(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: editingEmail?.name || "",
      category: editingEmail?.category || "",
      subject: editingEmail?.subject || "",
      body_html: editingEmail?.body_html || "",
      placeholders: placeholderChips,
      is_active: editingEmail?.is_active ?? true,
    };
    try {
      if (editingEmail?.id) {
        await api.put(`/api/email-templates/${editingEmail.id}`, payload);
        toast.success("Email template updated");
      } else {
        await api.post("/api/email-templates", payload);
        toast.success("Email template created");
      }
      setShowEmailForm(false);
      setEditingEmail(null);
      fetchEmailTemplates();
    } catch (err: any) {
      toast.error("Save failed");
    }
  }
  async function onDeleteEmail(id: string) {
    if (!window.confirm("Delete this email template?")) return;
    try {
      await api.delete(`/api/email-templates/${id}`);
      toast.success("Deleted");
      fetchEmailTemplates();
    } catch {
      toast.error("Delete failed");
    }
  }

  // --- Document Template CRUD ---
  function onEditDoc(template: DocumentTemplate) {
    setEditingDoc(template);
    setShowDocForm(true);
  }
  function onNewDoc() {
    setEditingDoc({
      id: "",
      name: "",
      category: "",
      body_html: "",
      placeholders: [],
      is_active: true,
      updatedAt: undefined,
    });
    setShowDocForm(true);
  }
  async function onSaveDoc(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: editingDoc?.name || "",
      category: editingDoc?.category || "",
      body_html: editingDoc?.body_html || "",
      placeholders: placeholderChips,
      is_active: editingDoc?.is_active ?? true,
    };
    try {
      if (editingDoc?.id) {
        await api.put(`/api/document-templates/${editingDoc.id}`, payload);
        toast.success("Document template updated");
      } else {
        await api.post("/api/document-templates", payload);
        toast.success("Document template created");
      }
      setShowDocForm(false);
      setEditingDoc(null);
      fetchDocTemplates();
    } catch (err: any) {
      toast.error("Save failed");
    }
  }
  async function onDeleteDoc(id: string) {
    if (!window.confirm("Delete this document template?")) return;
    try {
      await api.delete(`/api/document-templates/${id}`);
      toast.success("Deleted");
      fetchDocTemplates();
    } catch {
      toast.error("Delete failed");
    }
  }

  // --- Document PDF Preview/Attach/Send ---
  async function previewDocPdf(template: DocumentTemplate) {
    try {
      const res = await api.post(
        "/api/documents/generate",
        { template_id: template.id, data: {} },
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(res.data);
      setDocPdfUrl(url);
      setShowDocPreview(true);
    } catch (err: any) {
      toast.error("Failed to generate PDF");
    }
  }

  async function downloadDocPdf(template: DocumentTemplate) {
    try {
      const res = await api.post(
        "/api/documents/generate",
        { template_id: template.id, data: {} },
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${template.name || "document"}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error("Failed to download PDF");
    }
  }

  async function sendDocumentByEmail(template: DocumentTemplate) {
    const recipient = window.prompt("Enter recipient email (e.g. user@example.com):");
    if (!recipient) return;
    setSendingDoc(true);
    try {
      await api.post("/api/documents/send", {
        template_id: template.id,
        recipient_email: recipient,
        subject: template.name,
        data: {},
      });
      toast.success("Document sent successfully");
      setShowDocPreview(false);
    } catch (err: any) {
      toast.error("Failed to send document");
    } finally {
      setSendingDoc(false);
    }
  }

  // --- Filtering ---
  const emailCategories = useMemo(
    () => Array.from(new Set(emailTemplates.map((t) => t.category || ""))),
    [emailTemplates]
  );
  const docCategories = useMemo(
    () => Array.from(new Set(docTemplates.map((t) => t.category || ""))),
    [docTemplates]
  );
  const filteredEmails = useMemo(() => {
    const q = emailSearch.toLowerCase();
    return emailTemplates.filter(
      (t) =>
        (t.name?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.subject?.toLowerCase().includes(q)) &&
        (emailFilter ? t.category === emailFilter : true)
    );
  }, [emailTemplates, emailSearch, emailFilter]);
  const filteredDocs = useMemo(() => {
    const q = docSearch.toLowerCase();
    return docTemplates.filter(
      (t) =>
        (t.name?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q)) &&
        (docFilter ? t.category === docFilter : true)
    );
  }, [docTemplates, docSearch, docFilter]);

  // Table head style
  const tableHead = "px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider";
  const actionsTd = "px-6 py-4 whitespace-nowrap text-center space-x-2";

  // Tab style
  const tabClass = (tab: string) =>
    `px-4 py-2 text-sm font-semibold cursor-pointer border-b-2 ${
      activeTab === tab
        ? "border-indigo-600 text-indigo-600"
        : "border-transparent text-gray-500 hover:text-indigo-600"
    }`;

  return (
    <div className="p-8 space-y-6 min-h-screen bg-gray-50">
      {/* Top Tabs */}
      <div className="flex gap-6 border-b pb-2 text-gray-600 text-sm">
        <div className={tabClass("email")} onClick={() => setActiveTab("email")}>
          Email Template Management
        </div>
        <div className={tabClass("document")} onClick={() => setActiveTab("document")}>
          Document Template Management
        </div>
      </div>

      {/* EMAIL TAB */}
      {activeTab === "email" && (
        <section>
          <div className="flex justify-between mt-6">
            <h2 className="text-2xl font-bold">Email Template Management</h2>
            <Button onClick={onNewEmail}>Create New Email Template</Button>
          </div>
          <div className="flex gap-4 justify-end mt-4">
            <input
              type="text"
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
              placeholder="Search email templates..."
              className="px-4 py-2 border rounded-xl"
            />
            <select
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              className="px-4 py-2 border rounded-xl"
            >
              <option value="">All Categories</option>
              {emailCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-white border rounded-xl shadow-sm mt-6">
            <table className="min-w-full divide-y divide-gray-200 rounded-xl">
              <thead className="bg-gradient-to-r from-blue-100 to-blue-200">
                <tr>
                  <th className={tableHead}>Template Name</th>
                  <th className={tableHead}>Category</th>
                  <th className={tableHead}>Status</th>
                  <th className={tableHead}>Updated Date</th>
                  <th className={`${tableHead} text-center`}>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmails.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                      No email templates found.
                    </td>
                  </tr>
                )}
                {filteredEmails.map((template) => (
                  <tr key={template.id} className="hover:bg-blue-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">{template.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{template.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded border ${
                          template.is_active ? STATUS_COLORS.Active : STATUS_COLORS.Inactive
                        }`}
                      >
                        {template.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : "-"}
                    </td>
                    <td className={actionsTd}>
                      <button
                        onClick={() => {
                          setEditingEmail(template);
                          setShowEmailPreview(true);
                        }}
                        title="Preview"
                      >✏️</button>
                      <button
                        onClick={() => onEditEmail(template)}
                        title="Edit"
                        className="ml-2"
                      >📝</button>
                      <button
                        onClick={() => onDeleteEmail(template.id)}
                        title="Delete"
                        className="ml-2"
                      >🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* DOCUMENT TAB */}
      {activeTab === "document" && (
        <section>
          <div className="flex justify-between mt-6">
            <h2 className="text-2xl font-bold">Document Template Management</h2>
            <Button onClick={onNewDoc}>Create New Document Template</Button>
          </div>
          <div className="flex gap-4 justify-end mt-4">
            <input
              type="text"
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              placeholder="Search document templates..."
              className="px-4 py-2 border rounded-xl"
            />
            <select
              value={docFilter}
              onChange={(e) => setDocFilter(e.target.value)}
              className="px-4 py-2 border rounded-xl"
            >
              <option value="">All Categories</option>
              {docCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-white border rounded-xl shadow-sm mt-6">
            <table className="min-w-full divide-y divide-gray-200 rounded-xl">
              <thead className="bg-gradient-to-r from-blue-100 to-blue-200">
                <tr>
                  <th className={tableHead}>Template Name</th>
                  <th className={tableHead}>Category</th>
                  <th className={tableHead}>Status</th>
                  <th className={tableHead}>Updated Date</th>
                  <th className={`${tableHead} text-center`}>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                      No document templates found.
                    </td>
                  </tr>
                )}
                {filteredDocs.map((template) => (
                  <tr key={template.id} className="hover:bg-blue-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">{template.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{template.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded border ${
                          template.is_active ? STATUS_COLORS.Active : STATUS_COLORS.Inactive
                        }`}
                      >
                        {template.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : "-"}
                    </td>
                    <td className={actionsTd}>
                      <button
                        onClick={() => {
                          setEditingDoc(template);
                          setShowDocPreview(true);
                        }}
                        title="Preview"
                      >✏️</button>
                      <button
                        onClick={() => onEditDoc(template)}
                        title="Edit"
                        className="ml-2"
                      >📝</button>
                      <button
                        onClick={() => onDeleteDoc(template.id)}
                        title="Delete"
                        className="ml-2"
                      >🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* EMAIL EDITOR MODAL */}
      {showEmailForm && editingEmail && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-100 p-8">
            <div className="text-2xl font-semibold mb-4">{editingEmail.id ? "Edit Email Template" : "Create New Email Template"}</div>
            <form onSubmit={onSaveEmail} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                  <input type="text" value={editingEmail.name} onChange={e => setEditingEmail({ ...editingEmail, name: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <input type="text" value={editingEmail.category} onChange={e => setEditingEmail({ ...editingEmail, category: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                <input type="text" value={editingEmail.subject} onChange={e => setEditingEmail({ ...editingEmail, subject: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Body (HTML)</label>
                <ReactQuill theme="snow" value={editingEmail.body_html} onChange={content => setEditingEmail({ ...editingEmail, body_html: content })} className="bg-white" style={{ height: "200px" }} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Available Placeholders</label>
                <div className="flex flex-wrap gap-2">
                  {placeholderChips.map(ph => (
                    <span key={ph} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-medium">
                      {ph}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowEmailForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 text-white">
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMAIL PREVIEW MODAL */}
      {showEmailPreview && editingEmail && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-6">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6 border border-gray-100">
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">Preview: {editingEmail.name}</h2>
            <div className="border rounded-lg p-4 bg-gray-50" dangerouslySetInnerHTML={{ __html: editingEmail.body_html }} />
            <div className="flex justify-end mt-6">
              <Button type="button" onClick={() => setShowEmailPreview(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT EDITOR MODAL */}
      {showDocForm && editingDoc && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-100 p-8">
            <div className="text-2xl font-semibold mb-4">{editingDoc.id ? "Edit Document Template" : "Create New Document Template"}</div>
            <form onSubmit={onSaveDoc} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                  <input type="text" value={editingDoc.name} onChange={e => setEditingDoc({ ...editingDoc, name: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <input type="text" value={editingDoc.category} onChange={e => setEditingDoc({ ...editingDoc, category: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-gray-300" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Body (HTML)</label>
                <ReactQuill theme="snow" value={editingDoc.body_html} onChange={content => setEditingDoc({ ...editingDoc, body_html: content })} className="bg-white" style={{ height: "200px" }} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Available Placeholders</label>
                <div className="flex flex-wrap gap-2">
                  {placeholderChips.map(ph => (
                    <span key={ph} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-medium">
                      {ph}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowDocForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 text-white">
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {showDocPreview && editingDoc && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-6">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6 border border-gray-100">
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">Preview: {editingDoc.name}</h2>
            <div className="border rounded-lg p-4 bg-gray-50" dangerouslySetInnerHTML={{ __html: editingDoc.body_html }} />
            <div className="flex justify-end mt-6 gap-3">
              {docPdfUrl ? (
                <>
                  <a href={docPdfUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800">
                    Open PDF
                  </a>
                  <Button type="button" onClick={() => downloadDocPdf(editingDoc)} className="bg-green-600 text-white">
                    Download PDF
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => previewDocPdf(editingDoc)} className="bg-indigo-600 text-white">
                  Generate PDF
                </Button>
              )}
              <Button type="button" onClick={() => setShowDocPreview(false)} className="bg-blue-600 text-white">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PDF IFRAME PREVIEW */}
      {docPdfUrl && (
        <div className="fixed inset-0 z-40 p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDocPdfUrl(null)} />
          <div className="relative max-w-5xl mx-auto mt-12 bg-white rounded-lg overflow-hidden shadow-lg" style={{ height: "80vh" }}>
            <div className="flex justify-between items-center p-3 border-b">
              <div className="text-lg font-semibold">PDF Preview</div>
              <div className="flex gap-2">
                <a href={docPdfUrl} target="_blank" rel="noreferrer" className="px-3 py-1 bg-gray-100 rounded">
                  Open
                </a>
                <Button type="button" onClick={() => downloadDocPdf(editingDoc!)} className="bg-green-600 text-white rounded">
                  Download
                </Button>
                <Button
                  type="button"
                  onClick={() => sendDocumentByEmail(editingDoc!)}
                  className="bg-teal-600 text-white rounded"
                  disabled={sendingDoc}
                >
                  {sendingDoc ? "Sending..." : "Send"}
                </Button>
                <Button type="button" onClick={() => setDocPdfUrl(null)} className="bg-red-100 rounded">
                  Close
                </Button>
              </div>
            </div>
            <iframe src={docPdfUrl} className="w-full h-full" title="PDF Preview" />
          </div>
        </div>
      )}
    </div>
  );
}
