import React, { useState, useEffect, useMemo } from "react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Dialog from "../../components/ui/Dialog";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import Select from "../../components/ui/Select";
import { toast } from "sonner";

type AssignedTarget = {
  id: string;
  employeeId: string;
  employeeName: string;
  targetId: string;
  targetDescription: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  status: "Assigned" | "In Progress" | "Completed" | "Overdue";
  remarks?: string;
};

type Target = {
  id: string;
  target_description: string;
  deadline_days: number;
  status: "Active" | "Inactive"; // for filtering
};

type Employee = {
  id: string;
  name: string;
};

// Mock data for employees and targets (simulate API fetch)
const mockEmployees: Employee[] = [
  { id: "e01", name: "Alice Johnson" },
  { id: "e02", name: "Bob Smith" },
  { id: "e03", name: "Charlie Brown" },
];

const mockTargets: Target[] = [
  { id: "t01", target_description: "Increase sales by 20%", deadline_days: 30, status: "Active" },
  { id: "t02", target_description: "Improve customer satisfaction", deadline_days: 45, status: "Active" },
  { id: "t03", target_description: "Reduce operational costs", deadline_days: 60, status: "Inactive" },
];

export default function AssignTarget() {
  const [assignedTargets, setAssignedTargets] = useState<AssignedTarget[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<AssignedTarget | null>(null);

  const [form, setForm] = useState<Partial<AssignedTarget>>({
    employeeId: "",
    targetId: "",
    startDate: "",
    endDate: "",
    status: "Assigned",
    remarks: "",
  });

  // Filter to show only active targets for selection
  const activeTargets = mockTargets.filter((t) => t.status === "Active");

  // Populate employee name and target description from selections
  useEffect(() => {
    if (form.employeeId) {
      const emp = mockEmployees.find((e) => e.id === form.employeeId);
      if (emp) setForm((f) => ({ ...f, employeeName: emp.name }));
    } else {
      setForm((f) => ({ ...f, employeeName: "" }));
    }
  }, [form.employeeId]);

  useEffect(() => {
    if (form.targetId) {
      const target = activeTargets.find((t) => t.id === form.targetId);
      if (target && form.startDate) {
        const start = new Date(form.startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + target.deadline_days);
        setForm((f) => ({
          ...f,
          targetDescription: target.target_description,
          endDate: end.toISOString().substring(0, 10),
        }));
      } else if (target) {
        setForm((f) => ({
          ...f,
          targetDescription: target.target_description,
          endDate: "",
        }));
      }
    } else {
      setForm((f) => ({ ...f, targetDescription: "", endDate: "" }));
    }
  }, [form.targetId, form.startDate, activeTargets]);

  // Handle form input changes
  function handleChange(field: keyof AssignedTarget, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Validate form inputs
  function validateForm(): boolean {
    if (!form.employeeId) {
      toast.error("Employee is required");
      return false;
    }
    if (!form.targetId) {
      toast.error("Target is required");
      return false;
    }
    if (!form.startDate) {
      toast.error("Start Date is required");
      return false;
    }
    const startDateObj = new Date(form.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDateObj < today) {
      toast.error("Start Date cannot be in the past");
      return false;
    }
    if (!form.status) {
      toast.error("Status is required");
      return false;
    }
    return true;
  }

  // Handle submit (add or update assigned target)
  function handleSubmit() {
    if (!validateForm()) return;

    if (editing) {
      setAssignedTargets((prev) =>
        prev.map((a) =>
          a.id === editing.id
            ? ({
                ...a,
                ...form,
              } as AssignedTarget)
            : a
        )
      );
      toast.success("Assigned target updated successfully");
    } else {
      const newAssignedTarget: AssignedTarget = {
        id: Date.now().toString(),
        employeeId: form.employeeId!,
        employeeName: form.employeeName || "",
        targetId: form.targetId!,
        targetDescription: form.targetDescription || "",
        startDate: form.startDate!,
        endDate: form.endDate || "",
        status: form.status as AssignedTarget["status"],
        remarks: form.remarks,
      };
      setAssignedTargets((prev) => [...prev, newAssignedTarget]);
      toast.success("Target assigned successfully");
    }

    setOpenForm(false);
    setEditing(null);
    setForm({
      employeeId: "",
      targetId: "",
      startDate: "",
      endDate: "",
      status: "Assigned",
      remarks: "",
    });
  }

  // Edit assigned target handler
  function handleEdit(assigned: AssignedTarget) {
    setEditing(assigned);
    setForm(assigned);
    setOpenForm(true);
  }

  // Delete assigned target handler
  function handleDelete(id: string) {
    if (window.confirm("Are you sure you want to delete this assigned target?")) {
      setAssignedTargets((prev) => prev.filter((a) => a.id !== id));
      toast.success("Assigned target deleted successfully");
    }
  }

  // Utility for color-coded status badge
  function getStatusBadgeColor(status: AssignedTarget["status"]) {
    const colors = {
      Completed: "bg-green-100 text-green-800 border-green-200",
      "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
      Assigned: "bg-purple-100 text-purple-800 border-purple-200",
      Overdue: "bg-red-100 text-red-800 border-red-200"
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
      counts[target.status]++;
    });
    return counts;
  }, [assignedTargets]);

  return (
    <div className="p-8 space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Targets</h1>
          <p className="mt-2 text-gray-600">Track and manage employee performance targets</p>
        </div>
        <Button
          onClick={() => setOpenForm(true)}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          Assign New Target
        </Button>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Completed Card */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-green-700">Completed</p>
              <p className="text-2xl font-bold text-green-700 mt-2">{statusCounts.Completed}</p>
            </div>
            <span className="text-2xl text-green-500">✓</span>
          </div>
        </div>

        {/* In Progress Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-blue-700">In Progress</p>
              <p className="text-2xl font-bold text-blue-700 mt-2">{statusCounts["In Progress"]}</p>
            </div>
            <span className="text-2xl text-blue-500">⏳</span>
          </div>
        </div>

        {/* Assigned Card */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-purple-700">Assigned</p>
              <p className="text-2xl font-bold text-purple-700 mt-2">{statusCounts.Assigned}</p>
            </div>
            <span className="text-2xl text-purple-500">📋</span>
          </div>
        </div>

        {/* Overdue Card */}
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
                  <TD style={{textAlign: 'center'}} className="py-8">
                    <div className="text-gray-500">No targets assigned yet</div>
                    <Button
                      onClick={() => setOpenForm(true)}
                      className="mt-4 text-indigo-600 hover:text-indigo-800"
                    >
                      Assign your first target
                    </Button>
                  </TD>
                </TR>
              ) : (
                assignedTargets.map((assigned) => (
                  <TR key={assigned.id} className="hover:bg-gray-50">
                    <TD>
                      <div className="font-medium text-gray-900">{assigned.employeeName}</div>
                    </TD>
                    <TD>
                      <div className="max-w-md">{assigned.targetDescription}</div>
                    </TD>
                    <TD>
                      <div className="text-sm text-gray-600">
                        {new Date(assigned.startDate).toLocaleDateString()} -{" "}
                        {new Date(assigned.endDate).toLocaleDateString()}
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
                        <button
                          onClick={() => handleEdit(assigned)}
                          className="p-1 text-gray-500 hover:text-indigo-600"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(assigned.id)}
                          className="p-1 text-gray-500 hover:text-red-600"
                        >
                          🗑️
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

      <Dialog
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
          setForm({
            employeeId: "",
            targetId: "",
            startDate: "",
            endDate: "",
            status: "Assigned",
            remarks: "",
          });
        }}
        title={editing ? "Edit Assigned Target" : "Assign New Target"}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="block font-medium text-gray-700">
                  Select Employee <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.employeeId || ""}
                  onChange={(e) => handleChange("employeeId", e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Choose an employee</option>
                  {mockEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block font-medium text-gray-700">
                  Select Target <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.targetId || ""}
                  onChange={(e) => handleChange("targetId", e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Choose a target</option>
                  {activeTargets.map((t) => (
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
                  value={form.startDate || ""}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={form.endDate || ""}
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
                  employeeId: "",
                  targetId: "",
                  startDate: "",
                  endDate: "",
                  status: "Assigned",
                  remarks: "",
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
              {editing ? "Update Target" : "Assign Target"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
