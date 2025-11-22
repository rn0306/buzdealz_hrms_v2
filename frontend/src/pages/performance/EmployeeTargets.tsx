import React, { useState, useEffect, useMemo } from "react";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { toast } from "sonner";
import { getUser } from "../../utils/auth";

import {
  getEmployeeTargets,
  createEmployeeTarget,
  updateEmployeeTarget,
  deleteEmployeeTarget,
  getActiveTargets,
  getActiveUsers,
  getPlansMaster
} from "../../lib/api";

type AssignedTarget = {
  id: string;
  user_id: string;
  target_id: string;
  assigned_by: string;
  start_date: string;
  end_date: string;
  monthly_target: number;
  smart_invest_target: number;
  flex_saver_target: number;
  remarks?: string;
  status: "Assigned" | "In Progress" | "Completed" | "Overdue";
  created_at?: string;

  // Nested objects returned by API
  user?: {
    id: string;
    fname?: string;
    lname?: string;
    email?: string;
  };
  target?: {
    id: string;
    target_description?: string;
    plans?: Record<string, number>; // planId -> count
    deadline_days?: number;
    created_by?: string;
    status?: "Active" | "Inactive";
    created_at?: string;
  };
  assigner?: {
    id: string;
    fname?: string;
    lname?: string;
  };
};

type Plan = {
  id: string;
  plan_name: string;
  status: "Active" | "Inactive";
};

type Target = {
  id: string;
  target_description: string;
  deadline_days: number;
  status: "Active" | "Inactive";
  monthly_plans_count?: number;
  smart_invest_plans_count?: number;
  flex_saver_plans_count?: number;
};

type Employee = {
  id: string;
  name: string;
  email: string;
};

export default function AssignTarget() {
  const [assignedTargets, setAssignedTargets] = useState<AssignedTarget[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansList, setPlansList] = useState<any[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<AssignedTarget | null>(null);
  const [loading, setLoading] = useState(false);

  // View modal state (for interns and anyone who wants to view)
  const [viewTarget, setViewTarget] = useState<AssignedTarget | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const [form, setForm] = useState<Partial<AssignedTarget>>({
    user_id: "",
    target_id: "",
    assigned_by: "",
    start_date: "",
    end_date: "",
    status: "Assigned",
    remarks: "",
    monthly_target: 0,
    smart_invest_target: 0,
    flex_saver_target: 0,
  });

  // Get current user and derive role-based flag
  const currentUser = useMemo(() => getUser(), []);
  const isIntern = useMemo(() => {
    // per your confirmation, role value for intern is "intern"
    return currentUser?.role === "intern";
  }, [currentUser]);

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
    fetchPlans();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [targetsRes, usersRes, assignedRes] = await Promise.all([
        getActiveTargets(),
        getActiveUsers(),
        getEmployeeTargets(),
      ]);
      // Backend returns RAW arrays
      setTargets(Array.isArray(targetsRes.data.data) ? targetsRes.data.data : []);
      setEmployees(Array.isArray(usersRes.data) ? usersRes.data : []);
      // assignedRes.data may be array of assigned target objects (with nested user/target/assigner)
      setAssignedTargets(Array.isArray(assignedRes.data) ? assignedRes.data : []);
    } catch (err: any) {
      console.error("fetchAllData error:", err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPlans() {
    try {
      const res = await getPlansMaster();
      setPlans(res.data.data);
      console.log(res)
    } catch {
      toast.error("Failed to load plans");
    }
  }

  // ---------------- PLAN NAME HELPER ----------------
  const getPlanName = (planId: string) => {
    return plans.find((p) => p.id === planId)?.plan_name || "Unknown Plan";
  };

  // Auto-calculate end date based on deadline_days
  useEffect(() => {
    if (form.target_id && form.start_date) {
      const target = targets.find((t) => t.id === form.target_id);
      if (target) {
        const start = new Date(form.start_date);
        const end = new Date(start);
        end.setDate(start.getDate() + target.deadline_days);
        setForm((f) => ({
          ...f,
          end_date: end.toISOString().substring(0, 10),
        }));
      }
    }
  }, [form.target_id, form.start_date, targets]);

  function handleChange(field: keyof AssignedTarget, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validateForm(): boolean {
    if (!form.user_id) {
      toast.error("Employee is required");
      return false;
    }
    if (!form.target_id) {
      toast.error("Target is required");
      return false;
    }
    if (!form.start_date) {
      toast.error("Start Date is required");
      return false;
    }
    if (!form.status) {
      toast.error("Status is required");
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editing) {
        await updateEmployeeTarget(editing.id, form);
        toast.success("Target assignment updated successfully");
      } else {
        await createEmployeeTarget(form);
        toast.success("Target assigned successfully");
      }
      await fetchAllData();
      setOpenForm(false);
      setEditing(null);
      setForm({
        user_id: "",
        target_id: "",
        assigned_by: "",
        start_date: "",
        end_date: "",
        status: "Assigned",
        remarks: "",
        monthly_target: 0,
        smart_invest_target: 0,
        flex_saver_target: 0,
      });
    } catch (err: any) {
      console.error("handleSubmit error:", err);
      toast.error("Failed to save target assignment");
    }
  }

  function handleEdit(assigned: AssignedTarget) {
    setEditing(assigned);
    setForm(assigned);
    setOpenForm(true);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this target assignment?")) return;
    try {
      await deleteEmployeeTarget(id);
      toast.success("Target assignment deleted successfully");
      await fetchAllData();
    } catch (err: any) {
      console.error("handleDelete error:", err);
      toast.error("Failed to delete target assignment");
    }
  }

  function handleView(assigned: AssignedTarget) {
    setViewTarget(assigned);
    setViewOpen(true);
  }

  function getStatusBadgeColor(status: AssignedTarget["status"]) {
    const colors = {
      Completed: "bg-green-100 text-green-800 border-green-200",
      "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
      Assigned: "bg-purple-100 text-purple-800 border-purple-200",
      Overdue: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status];
  }

  const statusCounts = useMemo(() => {
    const counts = {
      Completed: 0,
      "In Progress": 0,
      Assigned: 0,
      Overdue: 0,
    };
    assignedTargets.forEach((target) => {
      counts[target.status] = (counts as any)[target.status] + 1;
    });
    return counts;
  }, [assignedTargets]);

  // Helper to get employee name from ID or nested user
  const getEmployeeName = (assigned: AssignedTarget) => {
    if (assigned.user) {
      const fname = assigned.user.fname || "";
      const lname = assigned.user.lname || "";
      const full = `${fname}${lname ? ` ${lname}` : ""}`.trim();
      if (full) return full;
      if (assigned.user.email) return assigned.user.email;
    }
    // fallback to employees list (used for create/edit scenarios)
    const emp = employees.find((e) => e.id === assigned.user_id);
    return emp?.name || "Unknown";
  };

  const getTargetDescription = (assigned: AssignedTarget) => {
    if (assigned.target && assigned.target.target_description) {
      return assigned.target.target_description;
    }
    const t = targets.find((t) => t.id === assigned.target_id);
    return t?.target_description || "Unknown";
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Targets</h1>
          <p className="mt-2 text-gray-600">Track and manage employee performance targets</p>
        </div>

        {/* Assign New Target button - hidden for interns */}
        {!isIntern && (
          <Button
            onClick={() => {
              setEditing(null);
              setForm({
                user_id: "",
                target_id: "",
                assigned_by: "",
                start_date: "",
                end_date: "",
                status: "Assigned",
                remarks: "",
                monthly_target: 0,
                smart_invest_target: 0,
                flex_saver_target: 0,
              });
              setOpenForm(true);
            }}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            Assign New Target
          </Button>
        )}
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-green-700">Completed</p>
              <p className="text-2xl font-bold text-green-700 mt-2">{statusCounts.Completed}</p>
            </div>
            <span className="text-2xl text-green-500">✓</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-blue-700">In Progress</p>
              <p className="text-2xl font-bold text-blue-700 mt-2">{statusCounts["In Progress"]}</p>
            </div>
            <span className="text-2xl text-blue-500">⏳</span>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-purple-700">Assigned</p>
              <p className="text-2xl font-bold text-purple-700 mt-2">{statusCounts.Assigned}</p>
            </div>
            <span className="text-2xl text-purple-500">📋</span>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-red-700">Overdue</p>
              <p className="text-2xl font-bold text-red-700 mt-2">{statusCounts.Overdue}</p>
            </div>
            <span className="text-2xl text-red-500">⚠️</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Employee</TH>
                <TH>Target Description</TH>
                <TH>Timeline</TH>
                <TH>Status</TH>
                <TH className="text-center">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {assignedTargets.length === 0 ? (
                <TR>
                  <TD style={{ textAlign: "center" }} className="py-8" colSpan={5}>
                    <div className="text-gray-500">No targets assigned yet</div>
                    {!isIntern && (
                      <Button
                        onClick={() => {
                          setEditing(null);
                          setForm({
                            user_id: "",
                            target_id: "",
                            assigned_by: "",
                            start_date: "",
                            end_date: "",
                            status: "Assigned",
                            remarks: "",
                            monthly_target: 0,
                            smart_invest_target: 0,
                            flex_saver_target: 0,
                          });
                          setOpenForm(true);
                        }}
                        className="mt-4 text-indigo-600 hover:text-indigo-800"
                      >
                        Assign your first target
                      </Button>
                    )}
                  </TD>
                </TR>
              ) : (
                assignedTargets.map((assigned) => (
                  <TR key={assigned.id} className="hover:bg-gray-50">
                    <TD>
                      <div className="font-medium text-gray-900">{getEmployeeName(assigned)}</div>
                      <div className="text-sm text-gray-500">
                        {assigned.user?.email || employees.find((e) => e.id === assigned.user_id)?.email}
                      </div>
                    </TD>
                    <TD>
                      <div className="max-w-md">{getTargetDescription(assigned)}</div>
                    </TD>
                    <TD>
                      <div className="text-sm text-gray-600">
                        {new Date(assigned.start_date).toLocaleDateString()} -{" "}
                        {new Date(assigned.end_date).toLocaleDateString()}
                      </div>
                    </TD>
                    <TD>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                          assigned.status
                        )}`}
                      >
                        {assigned.status}
                      </span>
                    </TD>
                    <TD>
                      <div className="flex justify-center gap-2">
                        {/* For interns: only View eye icon */}
                        <button
                          onClick={() => handleView(assigned)}
                          title="View details"
                          className="p-1 text-gray-500 hover:text-indigo-600"
                        >
                          👁️
                        </button>

                        {/* For non-interns: show edit/delete as before */}
                        {!isIntern && (
                          <>
                            <button
                              onClick={() => handleEdit(assigned)}
                              className="p-1 text-gray-500 hover:text-indigo-600"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(assigned.id)}
                              className="p-1 text-gray-500 hover:text-red-600"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </div>
      </div>

      {/* Assign/Edit Dialog (hidden for interns via button; still present for non-interns) */}
      <Dialog
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
          setForm({
            user_id: "",
            target_id: "",
            assigned_by: "",
            start_date: "",
            end_date: "",
            status: "Assigned",
            remarks: "",
            monthly_target: 0,
            smart_invest_target: 0,
            flex_saver_target: 0,
          });
        }}
        title={editing ? "Edit Target Assignment" : "Assign New Target"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="block font-medium text-gray-700">
                  Select Employee <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.user_id || ""}
                  onChange={(e) => handleChange("user_id", e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Choose an employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block font-medium text-gray-700">
                  Select Target <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.target_id || ""}
                  onChange={(e) => handleChange("target_id", e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Choose a target</option>
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.target_description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-medium text-gray-700">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.start_date || ""}
                  onChange={(e) => handleChange("start_date", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={form.end_date || ""}
                  className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-gray-50"
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={form.status || "Assigned"}
                onChange={(e) => handleChange("status", e.target.value as AssignedTarget["status"])}
                required
                className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-gray-700">Remarks</label>
              <textarea
                value={form.remarks || ""}
                onChange={(e) => handleChange("remarks", e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Add any additional notes or comments..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpenForm(false);
                setEditing(null);
                setForm({
                  user_id: "",
                  target_id: "",
                  assigned_by: "",
                  start_date: "",
                  end_date: "",
                  status: "Assigned",
                  remarks: "",
                  monthly_target: 0,
                  smart_invest_target: 0,
                  flex_saver_target: 0,
                });
              }}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              {editing ? "Update Assignment" : "Assign Target"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* View Modal (used by interns and anyone who wants to view) */}
      <Dialog
        open={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewTarget(null);
        }}
        title="Assigned Target Details"
      >
        {viewTarget ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Employee</p>
              <p className="font-medium text-gray-900">{getEmployeeName(viewTarget)}</p>
              <p className="text-sm text-gray-500">{viewTarget.user?.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Assigned By</p>
              <p className="font-medium text-gray-900">
                {viewTarget.assigner ? `${viewTarget.assigner.fname || ""} ${viewTarget.assigner.lname || ""}`.trim() : "Unknown"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Target</p>
              <p className="font-medium text-gray-900">{getTargetDescription(viewTarget)}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium text-gray-900">{new Date(viewTarget.start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-medium text-gray-900">{new Date(viewTarget.end_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium text-gray-900">{viewTarget.status}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Remarks</p>
              <p className="font-medium text-gray-900">{viewTarget.remarks || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Plans</p>
              {viewTarget.target && viewTarget.target.plans && Object.keys(viewTarget.target.plans).length > 0 ? (
                <div className="mt-2 space-y-2">
                  {Object.entries(viewTarget.target.plans).map(([planId, count]) => (
                    <div key={planId} className="flex justify-between items-center border rounded-md p-2">
                      <div className="text-sm text-gray-700 break-all">
                        <span className="font-medium">Plan:</span> {getPlanName(planId)}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No plans available for this target</p>
              )}

            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={() => {
                  setViewOpen(false);
                  setViewTarget(null);
                }}
                className="px-4 py-2"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">No details to show</div>
        )}
      </Dialog>
    </div>
  );
}
