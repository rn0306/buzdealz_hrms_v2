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
  date_of_birth?: string;
  verification_status?: string;
  onboarding_token?: string;
  resume_url?: string | null;
};

type FormState = Partial<Candidate> & { resume_file?: File | null };

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
  const [form, setForm] = useState<FormState>({
    full_name: "",
    email: "",
    phone: "",
    resume_file: null,
  });

  const [openDeleteId, setOpenDeleteId] = useState<string | null>(null);

  // Mail Dialog
  const [openMailDialog, setOpenMailDialog] = useState(false);
  const [mailCandidate, setMailCandidate] = useState<Candidate | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [sendingMail, setSendingMail] = useState(false);

  // Resume Preview
  const [openResumeDialog, setOpenResumeDialog] = useState(false);
  const [resumePreviewUrl, setResumePreviewUrl] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter((r) =>
      [r.full_name, r.email, r.phone].some((v) =>
        (v || "").toLowerCase().includes(q)
      )
    );
  }, [rows, query]);

  async function fetchRows() {
    setLoading(true);
    try {
      const res = await api.get("/api/candidates");
      const normalized: Candidate[] = (res.data || []).map((r: any) => ({
        ...r,
        full_name:
          r.full_name ||
          `${(r.fname || "").trim()} ${(r.lname || "").trim()}`.trim(),
        resume_url: r.resume_url || r.personalDetail?.resume_url || null,
        verification_status:
          r.verification_status ||
          r.personalDetail?.verification_status ||
          r.verification_status,
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
    setForm({
      full_name: "",
      email: "",
      phone: "",
      date_of_birth: "",
      resume_file: null,
    });
    setOpenForm(true);
  }

  function openEdit(row: Candidate) {
    setEditing(row);
    setForm({
      ...row,
      resume_file: null, // Reset file input
    });
    setOpenForm(true);
  }

  // Upload Resume → S3
  async function uploadResumeToS3(file: File): Promise<string> {
    try {
      const res = await api.get("/api/onboarding/presign-resume", {
        params: { fileType: file.type },
      });

      const { uploadUrl, fileUrl } = res.data;

      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      return fileUrl;
    } catch (err) {
      toast.error("Resume upload failed");
      throw err;
    }
  }

  // Final Form Submit
  async function submitForm(e: React.FormEvent) {
    e.preventDefault();

    try {
      let resumeUrl = form.resume_url || null;

      // If NEW resume uploaded
      if (form.resume_file) {
        // PDF check
        if (form.resume_file.type !== "application/pdf") {
          toast.error("Only PDF files allowed");
          return;
        }

        // Size check
        if (form.resume_file.size > 2 * 1024 * 1024) {
          toast.error("File must be under 2MB");
          return;
        }

        resumeUrl = await uploadResumeToS3(form.resume_file);
      }

      if (!editing) {
        // CREATE
        const payload = {
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          date_of_birth: form.date_of_birth,
          resume_url: resumeUrl,
        };

        await api.post("/api/onboarding/create-candidate", payload);
        toast.success("Candidate created");
      } else {
        // EDIT — Sending new resume URL (delete handled by backend)
        const payload = {
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          date_of_birth: form.date_of_birth,
          verification_status: form.verification_status,
          resume_url: resumeUrl,
        };

        await api.put(`/api/candidates/${editing.id}`, payload);
        toast.success("Candidate updated");
      }

      setOpenForm(false);
      fetchRows();
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
      fetchRows();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Delete failed");
    }
  }

  // Mail dialog
  async function openMail(row: Candidate) {
    setMailCandidate(row);
    setOpenMailDialog(true);
    try {
      const res = await api.get("/api/email-templates");
      setTemplates(res.data.data || []);
    } catch {
      toast.error("Failed to load templates");
    }
  }

  function handleTemplateChange(id: string) {
    setSelectedTemplateId(id);
    setSelectedTemplate(templates.find((x) => x.id === id) || null);
  }

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

  // Resume preview
  function handleViewResume(url?: string | null) {
    if (!url) {
      toast.error("No resume available");
      return;
    }
    setResumePreviewUrl(url);
    setOpenResumeDialog(true);
  }

  const statusOptions = ["PENDING", "Shortlisted", "Rejected", "On Hold"];

  return (
    <div className="p-6 space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Recruitment Candidate
          </span>
        </h1>

        <div className="flex items-center gap-3 ml-auto">
          <Input
            placeholder="Search candidates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-lg border px-4 py-2"
          />

          <Button variant="outline" onClick={fetchRows} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>

          <Button onClick={openCreate}>Add Candidate</Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Phone</TH>
              <TH>DOB</TH>
              <TH>Status</TH>
              <TH>Resume</TH>
              <TH className="text-center">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.length === 0 ? (
              <TR>
                <TD colSpan={7} className="py-8 text-center text-gray-500">
                  No candidates found
                </TD>
              </TR>
            ) : (
              filtered.map((r) => (
                <TR key={r.id}>
                  <TD>{r.full_name}</TD>
                  <TD>{r.email}</TD>
                  <TD>{r.phone || "-"}</TD>
                  <TD>{r.date_of_birth || "-"}</TD>
                  <TD>{r.verification_status || "-"}</TD>

                  <TD>
                    {r.resume_url ? (
                      <button
                        className="text-indigo-600 hover:underline"
                        onClick={() => handleViewResume(r.resume_url)}
                      >
                        View Resume
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">No Resume</span>
                    )}
                  </TD>

                  <TD>
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(r)}>✏️</button>
                      <button onClick={() => setOpenDeleteId(r.id)}>🗑️</button>
                      <button onClick={() => openMail(r)}>✉️</button>
                    </div>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </div>

      {/* FORM DIALOG */}
      <Dialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={editing ? "Edit Candidate" : "Add Candidate"}
      >
        <form onSubmit={submitForm} className="space-y-4">
          <div>
            <label>Full Name</label>
            <Input
              required
              value={form.full_name || ""}
              onChange={(e) =>
                setForm({ ...form, full_name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Email</label>
              <Input
                type="email"
                required
                value={form.email || ""}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />
            </div>

            <div>
              <label>Phone</label>
              <Input
                value={form.phone || ""}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Date of Birth</label>
              <Input
                type="date"
                value={form.date_of_birth || ""}
                onChange={(e) =>
                  setForm({ ...form, date_of_birth: e.target.value })
                }
              />
            </div>

            {/* Resume upload both on create + edit */}
            <div>
              <label>Resume (PDF, max 2MB)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (!file) {
                    setForm({ ...form, resume_file: null });
                    return;
                  }

                  if (file.type !== "application/pdf") {
                    toast.error("Only PDF files allowed");
                    e.target.value = "";
                    return;
                  }

                  if (file.size > 2 * 1024 * 1024) {
                    toast.error("File must be less than 2MB");
                    e.target.value = "";
                    return;
                  }

                  setForm({ ...form, resume_file: file });
                }}
                className="block w-full border rounded px-3 py-2"
              />

              {/* Show existing resume ONLY in edit mode */}
              {editing && form.resume_url && (
                <p className="mt-2 text-sm">
                  Current:{" "}
                  <button
                    type="button"
                    className="text-indigo-600 hover:underline"
                    onClick={() => handleViewResume(form.resume_url!)}
                  >
                    View Existing Resume
                  </button>
                </p>
              )}
            </div>
          </div>

          {editing && (
            <div>
              <label>Verification Status</label>
              <select
                value={form.verification_status || "PENDING"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    verification_status: e.target.value,
                  })
                }
                className="w-full border px-3 py-2 rounded"
              >
                {statusOptions.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save" : "Create"}</Button>
          </div>
        </form>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog
        open={!!openDeleteId}
        onClose={() => setOpenDeleteId(null)}
        title="Delete Candidate"
      >
        <p>Are you sure you want to delete this candidate?</p>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => setOpenDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Dialog>

      {/* SEND MAIL */}
      <Dialog
        open={openMailDialog}
        onClose={() => setOpenMailDialog(false)}
        title={`Send Mail to ${mailCandidate?.full_name}`}
      >
        <div className="space-y-4">
          <div>
            <label>Select Template</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">-- Select --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTemplate && mailCandidate && (
            <div className="p-3 border rounded bg-gray-50">
              <h3 className="font-semibold">Subject:</h3>
              <p className="mb-2">
                {selectedTemplate.subject.replace(
                  "{{full_name}}",
                  mailCandidate.full_name
                )}
              </p>

              <h3 className="font-semibold">Preview:</h3>
              <div
                className="text-sm"
                dangerouslySetInnerHTML={{
                  __html: selectedTemplate.body_html.replace(
                    "{{full_name}}",
                    mailCandidate.full_name
                  ),
                }}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" onClick={() => setOpenMailDialog(false)}>
              Cancel
            </Button>
            <Button onClick={sendMailToCandidate} disabled={sendingMail}>
              {sendingMail ? "Sending..." : "Send Mail"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* RESUME PREVIEW */}
      <Dialog
        open={openResumeDialog}
        onClose={() => setOpenResumeDialog(false)}
        title="Resume Preview"
      >
        {resumePreviewUrl ? (
          <iframe
            src={resumePreviewUrl}
            className="w-full h-[70vh] rounded border"
            title="Resume"
          />
        ) : (
          <p>No Resume Available</p>
        )}
      </Dialog>
    </div>
  );
}
