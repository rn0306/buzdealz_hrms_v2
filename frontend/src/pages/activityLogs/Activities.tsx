import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { getUser } from "../../utils/auth";
import { toast } from "sonner";

/*************************************************
 * ActivityLogModule.tsx (Role-Based + Name Support)
 *
 * ROLES SUPPORTED:
 *  - ADMIN
 *  - MANAGER
 *  - RECRUITER (restricted same as Manager — view only)
 *  - INTERN
 *
 * Backend now returns:
 *  log.user = { id, fname, lname, fullName }
 *************************************************/

// -------------------- Types --------------------
interface ActivityLog {
  id: string;
  user_id: string;
  log_date: string;
  description: string;
  hours_spent: number;
  notes?: string | null;
  user?: {
    id: string;
    fname: string;
    lname: string;
    fullName: string;
  };
}

type Role = "ADMIN" | "MANAGER" | "RECRUITER" | "INTERN";

// -------------------- Helpers --------------------
const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
};

const truncate = (s?: string | null, l = 80) =>
  s ? (s.length > l ? s.slice(0, l - 1) + "…" : s) : "—";

// -------------------- Modal Wrapper --------------------
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl p-4">{children}</div>
    </div>
  );
}

// -------------------- Form Modal (Create / Edit) --------------------
function FormModal({
  initial,
  onClose,
  onSave,
  canEdit,
}: {
  initial: Partial<ActivityLog>;
  onClose: () => void;
  onSave: (payload: Partial<ActivityLog>) => Promise<void>;
  canEdit: boolean;
}) {
  const [form, setForm] = useState<Partial<ActivityLog>>({
    log_date: new Date().toISOString().slice(0, 10),
    description: "",
    hours_spent: 0,
    notes: "",
    ...initial,
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!canEdit) return toast.error("You don't have permission to edit logs");

    if (!form.description || !form.description.trim()) {
      return toast.error("Description is required");
    }

    setSaving(true);

    try {
      await onSave(form);
      toast.success(form.id ? "Log updated" : "Log submitted");
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save log");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {form.id ? "Edit Activity Log" : "Submit Activity Log"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Keep the description concise and clear.
            </p>
          </div>

          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs text-gray-600">Date</label>
            <input
              type="date"
              disabled={!canEdit}
              value={form.log_date}
              onChange={(e) => setForm({ ...form, log_date: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">Description</label>
            <textarea
              disabled={!canEdit}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full min-h-[120px] border border-gray-300 rounded-md px-3 py-2 resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">Hours Spent</label>
            <input
              disabled={!canEdit}
              type="number"
              step="0.25"
              min={0}
              value={form.hours_spent ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  hours_spent: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              className="mt-1 w-40 border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">Notes (optional)</label>
            <textarea
              disabled={!canEdit}
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 w-full min-h-[60px] border border-gray-300 rounded-md px-3 py-2 resize-none"
            />
          </div>

          {canEdit && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                {saving ? "Saving..." : "Save"}
              </button>

              <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// -------------------- View Modal --------------------
function ViewModal({ log, onClose }: { log: ActivityLog | null; onClose: () => void }) {
  if (!log) return null;

  return (
    <Modal onClose={onClose}>
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex justify-between">
          <h3 className="text-lg font-semibold">Activity Log Details</h3>
          <button onClick={onClose}>Close</button>
        </div>

        <div className="mt-3 space-y-3 text-gray-800">
          {log.user && (
            <p>
              <strong>User:</strong> {log.user.fullName}
            </p>
          )}
          <p>
            <strong>Date:</strong> {formatDate(log.log_date)}
          </p>
          <p>
            <strong>Description:</strong> {log.description}
          </p>
          <p>
            <strong>Hours:</strong> {log.hours_spent}
          </p>
          <p>
            <strong>Notes:</strong> {log.notes || "—"}
          </p>
        </div>
      </div>
    </Modal>
  );
}
// -------------------- Dashboard Card --------------------
function DashboardActivityCard({
  onOpenForm,
  role,
}: {
  onOpenForm: () => void;
  role: Role;
}) {
  const user = React.useMemo(() => getUser(), []);
  const [loading, setLoading] = useState(true);
  const [todayLog, setTodayLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    (async () => {
      try {
        const res = await api.get(`/api/activity-logs/${today}`);
        if (!mounted) return;
        setTodayLog(res.data || null);
      } catch {
        // 404 = not submitted → show dashboard card
        if (!mounted) return;
        setTodayLog(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  // Only INTERN sees the dashboard reminder
  if (role !== "INTERN") return null;
  if (loading) return null;
  if (todayLog) return null;

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold text-gray-800">Today's Activity Log</h3>
      <p className="text-sm text-gray-500 mt-1">You haven't submitted today's log.</p>

      <div className="mt-4 flex items-center justify-between">
        <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
          Not Submitted
        </span>
        <button
          onClick={onOpenForm}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Submit Now
        </button>
      </div>
    </div>
  );
}

// -------------------- ACTIVITY LOG PAGE --------------------
function ActivityLogPage() {
  const session = React.useMemo(() => getUser(), []);
  const role = (session?.role || "").toUpperCase() as Role;

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewLog, setViewLog] = useState<ActivityLog | null>(null);
  const [editLog, setEditLog] = useState<ActivityLog | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [formInitial, setFormInitial] = useState<Partial<ActivityLog>>({});

  // -------------- FETCH LOGS (Role‐based automatically handled by backend) -------------
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await api.get("/api/activity-logs");
        if (!mounted) return;
        setLogs(res.data || []);
      } catch (err) {
        toast.error("Failed to load logs");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ------------------ Create Log (Intern Only) ------------------
  const openCreate = () => {
    if (role !== "INTERN") return toast.error("Only interns can create logs");

    setFormInitial({
      log_date: new Date().toISOString().slice(0, 10),
      description: "",
      hours_spent: 0,
      notes: "",
    });
    setEditLog(null);
    setShowForm(true);
  };

  // ------------------ Edit Log (Intern & Admin Only) ------------------
  const openEdit = (log: ActivityLog) => {
    if (role !== "INTERN" && role !== "ADMIN") {
      return toast.error("You do not have permission to edit logs");
    }

    setFormInitial(log);
    setEditLog(log);
    setShowForm(true);
  };

  // ------------------ Create / Update API ------------------
  const handleSave = async (payload: Partial<ActivityLog>) => {
    if (editLog) {
      // UPDATE
      if (role !== "INTERN" && role !== "ADMIN") {
        return toast.error("You cannot update logs");
      }

      const id = payload.id!;
      const res = await api.put(`/api/activity-logs/${id}`, {
        description: payload.description,
        hours_spent: payload.hours_spent,
        notes: payload.notes,
      });

      const updated = res.data?.data ?? res.data;

      setLogs((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      return;
    }

    // CREATE
    if (role !== "INTERN") {
      return toast.error("Only interns can create logs");
    }

    const res = await api.post("/api/activity-logs", {
      log_date: payload.log_date,
      description: payload.description,
      hours_spent: payload.hours_spent,
      notes: payload.notes,
    });

    const created = res.data?.data ?? res.data;
    setLogs((prev) => [created, ...prev]);
  };

  const empty = !loading && logs.length === 0;
  // ------------------ UI ------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-semibold text-gray-800">Activity Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Track and manage daily work updates</p>
      </div>

      {/* DASHBOARD CARD (Intern Only) */}
      <DashboardActivityCard onOpenForm={openCreate} role={role} />

      {/* LOG TABLE */}
      <div className="rounded-xl bg-white shadow-md border border-gray-200 p-6 w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Previous Logs</h2>

          {role === "INTERN" && (
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              + New Log
            </button>
          )}
        </div>

        <div className="mt-4 w-full">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-12 bg-gray-200 rounded-lg" />
              ))}
            </div>
          ) : empty ? (
            <div className="rounded-md border border-dashed border-gray-200 p-6 text-center">
              <div className="text-gray-600">No logs found</div>
              {role === "INTERN" && (
                <div className="mt-3 text-sm text-gray-400">Click "New Log" to submit your first activity log.</div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-left">
                <thead>
                  <tr className="text-sm text-gray-600 border-b border-gray-200">

                    {/* NAME COLUMN for ADMIN / MANAGER / RECRUITER */}
                    {role !== "INTERN" && (
                      <th className="py-3 px-4 font-medium">Name</th>
                    )}

                    <th className="py-3 px-4 font-medium">Date</th>
                    <th className="py-3 px-4 font-medium">Description</th>
                    <th className="py-3 px-4 font-medium">Hours</th>
                    <th className="py-3 px-4 font-medium">Notes</th>
                    <th className="py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody className="text-gray-700 text-sm">
                  {logs.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100">

                      {/* SHOW USER NAME FOR ADMIN / MANAGER / RECRUITER */}
                      {role !== "INTERN" && (
                        <td className="py-3 px-4 font-medium">
                          {row.user?.fullName || "—"}
                        </td>
                      )}

                      <td className="py-3 px-4">{formatDate(row.log_date)}</td>

                      <td className="py-3 px-4 max-w-[280px]">
                        {truncate(row.description, 120)}
                      </td>

                      <td className="py-3 px-4">{row.hours_spent}</td>

                      <td className="py-3 px-4 max-w-[200px]">
                        {truncate(row.notes, 80)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewLog(row)}
                            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg"
                          >
                            View
                          </button>

                          {/* EDIT BUTTON VISIBLE ONLY FOR INTERN & ADMIN */}
                          {(role === "INTERN" || role === "ADMIN") && (
                            <button
                              onClick={() => openEdit(row)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showForm && (
        <FormModal
          initial={formInitial}
          onClose={() => {
            setShowForm(false);
            setEditLog(null);
            setFormInitial({});
          }}
          onSave={handleSave}
          canEdit={role === "INTERN" || role === "ADMIN"}
        />
      )}

      <ViewModal log={viewLog} onClose={() => setViewLog(null)} />
    </div>
  );
}
// -------------------- EXPORT WRAPPER --------------------
export default function ActivityLogModule() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <ActivityLogPage />
      </div>
    </div>
  );
}
