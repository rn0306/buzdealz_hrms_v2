import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Dialog from "../../components/ui/Dialog";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { toast } from "sonner";

type Candidate = {
  id: string;
  full_name: string;
  fname?: string;
  lname?: string;
  email: string;
  phone?: string;
  source?: string;
  current_stage?: string;
};

type FormState = Partial<Candidate> & { resume_url?: string };

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body_html: string;
};

export default function Candidates() {
  const [rows, setRows] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [form, setForm] = useState<FormState>({ full_name: "", email: "" });
  const [openDeleteId, setOpenDeleteId] = useState<string | null>(null);

  // ✉️ Mail Dialog States
  const [openMailDialog, setOpenMailDialog] = useState(false);
  const [mailCandidate, setMailCandidate] = useState<Candidate | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [sendingMail, setSendingMail] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter((r) =>
      [r.full_name, r.email, r.phone, r.source].some((v) =>
        (v || "").toLowerCase().includes(q)
      )
    );
  }, [rows, query]);

  async function fetchRows() {
    setLoading(true);
    try {
      const res = await api.get("/api/candidates");
      const normalized = (res.data || []).map((r: any) => ({
        ...r,
        full_name:
          r.full_name || `${(r.fname || "").trim()} ${(r.lname || "").trim()}`.trim(),
        current_stage:
          r.current_stage || r.personalDetail?.current_stage || r.current_stage,
        source: r.source || r.personalDetail?.source || r.source,
      }));
      setRows(normalized);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRows();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ full_name: "", email: "", phone: "", source: "Portal", resume_url: "" });
    setOpenForm(true);
  }

  function openEdit(row: Candidate) {
    setEditing(row);
    setForm({ ...row });
    setOpenForm(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        if (form.current_stage !== undefined) {
          try {
            await api.put(`/api/personaldetails/${editing.id}`, {
              current_stage: form.current_stage,
            });
          } catch (err: any) {
            toast.warning(
              "Candidate updated but failed to update stage: " +
                (err?.response?.data?.error || err.message || "")
            );
          }
        }
        toast.success("Candidate updated");
      } else {
        const payload = {
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          resume_url: form.resume_url,
          source: form.source || "Portal",
        };
        await api.post("/api/onboarding/create-candidate", payload);
        toast.success("Candidate created");
      }
      setOpenForm(false);
      await fetchRows();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Operation failed");
    }
  }

  async function confirmDelete() {
    if (!openDeleteId) return;
    try {
      await api.delete(`/api/candidates/${openDeleteId}`);
      toast.success("Candidate deleted");
      setOpenDeleteId(null);
      await fetchRows();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Delete failed");
    }
  }

  const statusOptions = ["New", "Shortlisted", "Rejected", "On Hold"];

  // 📨 Open mail dialog
  async function openMail(row: Candidate) {
    setMailCandidate(row);
    setOpenMailDialog(true);
    setSelectedTemplateId("");
    setSelectedTemplate(null);
    try {
      const res = await api.get("/api/email-templates");
      setTemplates(res.data.data || []);
    } catch (err: any) {
      toast.error("Failed to load templates");
    }
  }

  // 📨 Handle template change
  function handleTemplateChange(id: string) {
    setSelectedTemplateId(id);
    const t = templates.find((x) => x.id === id) || null;
    setSelectedTemplate(t);
  }

  // 📨 Send mail API call
  async function sendMailToCandidate() {
    if (!mailCandidate || !selectedTemplate) {
      toast.error("Please select a template");
      return;
    }
    setSendingMail(true);
    try {
      await api.post("/api/email-templates/send", {
        template_id: selectedTemplate.id,
        recipient_email: mailCandidate.email,
        recipient_name: mailCandidate.full_name,
        data: {
          full_name: mailCandidate.full_name,
          email: mailCandidate.email,
          phone: mailCandidate.phone || "",
          password: mailCandidate.fname?.toLocaleLowerCase() + "123$" || "",
        },
      });

      toast.success(`Mail sent to ${mailCandidate.full_name}`);
      setOpenMailDialog(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send email");
    } finally {
      setSendingMail(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recruitment Candidates</h1>
          <p className="mt-2 text-gray-600">Manage all your recruitment candidates here</p>
        </div>
        <Button
          onClick={openCreate}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          Add Candidate
        </Button>
      </div>

      {/* Search + Refresh */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search candidates..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <Button
          variant="outline"
          onClick={fetchRows}
          disabled={loading}
          className="px-4 py-2 rounded-lg border border-gray-300 shadow-sm hover:bg-gray-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Phone</TH>
                <TH>Stage</TH>
                <TH className="text-center">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="py-8 text-center text-gray-500">
                    No candidates found
                  </TD>
                </TR>
              ) : (
                filtered.map((r) => (
                  <TR key={r.id} className="hover:bg-gray-50 transition">
                    <TD>{r.full_name}</TD>
                    <TD>{r.email}</TD>
                    <TD>{r.phone || "-"}</TD>
                    <TD>{r.current_stage || "-"}</TD>
                    <TD>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEdit(r)}
                          className="p-1 text-gray-500 hover:text-indigo-600"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setOpenDeleteId(r.id)}
                          className="p-1 text-gray-500 hover:text-red-600"
                        >
                          🗑️
                        </button>
                        <button
                          onClick={() => openMail(r)}
                          className="p-1 text-gray-500 hover:text-blue-600"
                        >
                          ✉️
                        </button>
                      </div>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={editing ? "Edit Candidate" : "Add Candidate"}
      >
        <form onSubmit={submitForm} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block font-medium text-gray-700">Full Name</label>
              <Input
                value={form.full_name || ""}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
                className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700">Email</label>
              <Input
                type="email"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium text-gray-700">Phone</label>
                <Input
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700">Source</label>
                <Input
                  value={form.source || ""}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {!editing && (
              <div>
                <label className="block font-medium text-gray-700">Resume URL</label>
                <Input
                  value={form.resume_url || ""}
                  onChange={(e) => setForm({ ...form, resume_url: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {editing && (
              <div>
                <label className="block font-medium text-gray-700">Status</label>
                <select
                  value={form.current_stage || "New"}
                  onChange={(e) => setForm({ ...form, current_stage: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenForm(false)}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              {editing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!openDeleteId}
        onClose={() => setOpenDeleteId(null)}
        title="Delete Candidate"
      >
        <p className="text-sm text-gray-700">
          Are you sure you want to delete this candidate? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setOpenDeleteId(null)}
            className="px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            Delete
          </Button>
        </div>
      </Dialog>

      {/* 📨 Send Mail Dialog */}
      <Dialog
        open={openMailDialog}
        onClose={() => setOpenMailDialog(false)}
        title={`Send Mail to ${mailCandidate?.full_name || ""}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Select Email Template
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- Select Template --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTemplate && (
            <div className="p-3 border rounded-lg bg-gray-50">
              <h3 className="font-semibold text-indigo-700 mb-1">Subject:</h3>
              <p className="text-gray-800 mb-2">
                {selectedTemplate.subject.replace(
                  "{{full_name}}",
                  mailCandidate?.full_name || ""
                )}
              </p>
              <h3 className="font-semibold text-indigo-700 mb-1">Body Preview:</h3>
              <div
                className="text-sm text-gray-700"
                dangerouslySetInnerHTML={{
                  __html: selectedTemplate.body_html
                    .replace("{{full_name}}", mailCandidate?.full_name || "")
                    .replace("{{email}}", mailCandidate?.email || "")
                    .replace(
                      "{{password}}",
                      mailCandidate?.fname?.toLocaleLowerCase() + "123$" || ""
                    ),
                }}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpenMailDialog(false)}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={sendMailToCandidate}
              disabled={sendingMail}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              {sendingMail ? "Sending..." : "Send Mail"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
