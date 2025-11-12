import React, { useState, useEffect } from "react";
import {
  getTargetsMaster,
  createTargetMaster,
  updateTargetMaster,
  deleteTargetMaster,
} from "../../lib/api";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { toast } from "sonner";

type Target = {
  id: string;
  target_description: string;
  monthly_plans_count: number;
  smart_invest_plans_count: number;
  flex_saver_plans_count: number;
  deadline_days: number;
  status: 'Active' | 'Inactive';
};

type FormState = Partial<Target>;

const initialFormState: FormState = {
  target_description: "",
  monthly_plans_count: 0,
  smart_invest_plans_count: 0,
  flex_saver_plans_count: 0,
  deadline_days: 0,
  status: 'Active',
};

const STATUS_COLORS = {
  Active: 'bg-green-100 text-green-800 border-green-200',
  Inactive: 'bg-red-100 text-red-800 border-red-200',
};


export default function TargetMaster() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Target | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTargets();
  }, []);

  async function fetchTargets() {
    setLoading(true);
    try {
      const res = await getTargetsMaster();
      setTargets(res.data);
    } catch (err: any) {
      toast.error("Failed to fetch targets");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: keyof FormState, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validateForm(): boolean {
    if (!form.target_description?.trim()) {
      toast.error("Target Description is required");
      return false;
    }
    if (!Number.isInteger(form.monthly_plans_count) || form.monthly_plans_count! < 0) {
      toast.error("Monthly Plans Count must be a positive integer");
      return false;
    }
    if (!Number.isInteger(form.smart_invest_plans_count) || form.smart_invest_plans_count! < 0) {
      toast.error("Smart Invest Plans Count must be a positive integer");
      return false;
    }
    if (!Number.isInteger(form.flex_saver_plans_count) || form.flex_saver_plans_count! < 0) {
      toast.error("Flex Saver Plans Count must be a positive integer");
      return false;
    }
    if (!Number.isInteger(form.deadline_days) || form.deadline_days! <= 0) {
      toast.error("Deadlines (Days) must be a positive integer");
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
        await updateTargetMaster(editing.id, form);
        toast.success("Target updated successfully");
      } else {
        await createTargetMaster(form);
        toast.success("Target added successfully");
      }
      fetchTargets();
      setOpenForm(false);
      setEditing(null);
      setForm(initialFormState);
    } catch (err: any) {
      toast.error("Failed to save target");
    }
  }

  function handleEdit(target: Target) {
    setEditing(target);
    setForm(target);
    setOpenForm(true);
  }

  async function handleDelete(targetId: string) {
    if (window.confirm("Are you sure you want to delete this target?")) {
      try {
        await deleteTargetMaster(targetId);
        toast.success("Target deleted successfully");
        fetchTargets();
      } catch (err: any) {
        toast.error("Failed to delete target");
      }
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Target Management
        </h1>
        <Button
          onClick={() => setOpenForm(true)}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          Create New Target
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Target Description</TH>
                <TH className="text-center">Monthly Plans</TH>
                <TH className="text-center">Smart Invest</TH>
                <TH className="text-center">Flex Saver</TH>
                <TH className="text-center">Days</TH>
                <TH className="text-center">Status</TH>
                <TH className="text-center">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TR>
                  <TD align="center" className="py-8" style={{textAlign: 'center'}} colSpan={7}>
                    <div className="text-gray-500">Loading targets...</div>
                  </TD>
                </TR>
              ) : targets.length === 0 ? (
                <TR>
                  <TD align="center" className="py-8" style={{textAlign: 'center'}} colSpan={7}>
                    <div className="text-gray-500">No targets found</div>
                    <Button
                      onClick={() => setOpenForm(true)}
                      className="mt-4 text-indigo-600 hover:text-indigo-800"
                    >
                      Add your first target
                    </Button>
                  </TD>
                </TR>
              ) : (
                targets.map((target) => (
                  <TR key={target.id} className="hover:bg-gray-50">
                    <TD className="max-w-md">
                      <div className="font-medium text-gray-900">{target.target_description}</div>
                    </TD>
                    <TD className="text-center font-medium text-gray-900">{target.monthly_plans_count}</TD>
                    <TD className="text-center font-medium text-gray-900">{target.smart_invest_plans_count}</TD>
                    <TD className="text-center font-medium text-gray-900">{target.flex_saver_plans_count}</TD>
                    <TD className="text-center font-medium text-gray-900">{target.deadline_days}</TD>
                    <TD className="text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[target.status]}`}>
                        {target.status}
                      </span>
                    </TD>
                    <TD>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(target)}
                          className="p-1 text-gray-500 hover:text-indigo-600"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(target.id)}
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
          setForm(initialFormState);
        }}
        title={editing ? "Edit Target" : "Create New Target"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block font-medium text-gray-700">
              Target Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.target_description || ''}
              onChange={(e) => handleChange("target_description", e.target.value)}
              className="w-full min-h-[100px] rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter target description..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Monthly Plans Count <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.monthly_plans_count || ''}
                onChange={(e) => handleChange("monthly_plans_count", parseInt(e.target.value))}
                className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                min={0}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Smart Invest Plans <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.smart_invest_plans_count || ''}
                onChange={(e) => handleChange("smart_invest_plans_count", parseInt(e.target.value))}
                className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                min={0}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Flex Saver Plans <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.flex_saver_plans_count || ''}
                onChange={(e) => handleChange("flex_saver_plans_count", parseInt(e.target.value))}
                className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                min={0}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Days to Complete <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.deadline_days || ''}
                onChange={(e) => handleChange("deadline_days", parseInt(e.target.value))}
                className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                min={1}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-medium text-gray-700">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={form.status || 'Active'}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpenForm(false);
                setEditing(null);
                setForm(initialFormState);
              }}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              {editing ? "Update Target" : "Create Target"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
