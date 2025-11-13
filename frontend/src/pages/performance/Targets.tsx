import React, { useState, useEffect } from "react";
import {
  getTargetsMaster,
  createTargetMaster,
  updateTargetMaster,
  deleteTargetMaster,
  getPlansMaster,
  createPlanMaster,
  updatePlanMaster,
  deletePlanMaster,
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
  status: "Active" | "Inactive";
  plans?: Record<string, number>;
  created_at?: string;
};

type Plan = {
  id: string;
  plan_name: string;
  status: "Active" | "Inactive";
};

type FormState = Partial<Target>;
type PlanFormState = Partial<Plan>;

const initialFormState: FormState = {
  target_description: "",
  monthly_plans_count: 0,
  smart_invest_plans_count: 0,
  flex_saver_plans_count: 0,
  deadline_days: 0,
  status: "Active",
};

const initialPlanFormState: PlanFormState = {
  plan_name: "",
  status: "Active",
};

const STATUS_COLORS = {
  Active: "bg-green-100 text-green-800 border-green-200",
  Inactive: "bg-red-100 text-red-800 border-red-200",
};

export default function TargetMaster() {
  const [activeTab, setActiveTab] = useState<"targets" | "plans">("targets");

  const [targets, setTargets] = useState<Target[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Target | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [openPlanForm, setOpenPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormState>(initialPlanFormState);

  const [planItems, setPlanItems] = useState<
    { planId: string; planName: string; count: number }[]
  >([]);

  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedPlanCount, setSelectedPlanCount] = useState<number>(0);

  useEffect(() => {
    fetchTargets();
    fetchPlans();
  }, []);

  async function fetchTargets() {
    try {
      const res = await getTargetsMaster();
      setTargets(res.data.data);
    } catch {
      toast.error("Failed to load targets");
    }
  }

  async function fetchPlans() {
    try {
      const res = await getPlansMaster();
      setPlans(res.data.data);
    } catch {
      toast.error("Failed to load plans");
    }
  }

  function handleChange(field: keyof FormState, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const plansPayload: Record<string, number> = {};
    planItems.forEach((p) => {
      if (p.count > 0) plansPayload[p.planId] = p.count;
    });

    const payload = {
      ...form,
      plans: plansPayload,
    };

    try {
      if (editing) {
        await updateTargetMaster(editing.id, payload);
        toast.success("Target updated");
      } else {
        await createTargetMaster(payload);
        toast.success("Target created");
      }
      fetchTargets();
      setOpenForm(false);
      setEditing(null);
      setForm(initialFormState);
      setPlanItems([]);
      setSelectedPlanCount(0);
      setSelectedPlanId("");
    } catch (err) {
      toast.error("Save failed");
    }
  }

  function handleEdit(target: Target) {
    setEditing(target);
    setForm({
      target_description: target.target_description,
      monthly_plans_count: target.monthly_plans_count,
      smart_invest_plans_count: target.smart_invest_plans_count,
      flex_saver_plans_count: target.flex_saver_plans_count,
      deadline_days: target.deadline_days,
      status: target.status,
    });

    const items: any[] = [];
    if (target.plans) {
      Object.entries(target.plans).forEach(([pid, cnt]) => {
        const p = plans.find((pl) => pl.id === pid);
        items.push({
          planId: pid,
          planName: p ? p.plan_name : pid,
          count: Number(cnt),
        });
      });
    }
    setPlanItems(items);
    setOpenForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this target?")) return;
    try {
      await deleteTargetMaster(id);
      toast.success("Deleted");
      fetchTargets();
    } catch {
      toast.error("Delete failed");
    }
  }

  function handlePlanChange(field: keyof PlanFormState, value: any) {
    setPlanForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handlePlanSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingPlan) {
        await updatePlanMaster(editingPlan.id, planForm);
        toast.success("Plan updated");
      } else {
        await createPlanMaster(planForm);
        toast.success("Plan created");
      }
      fetchPlans();
      setOpenPlanForm(false);
      setEditingPlan(null);
      setPlanForm(initialPlanFormState);
    } catch {
      toast.error("Save failed");
    }
  }

  function handleEditPlan(p: Plan) {
    setEditingPlan(p);
    setPlanForm(p);
    setOpenPlanForm(true);
  }

  async function handleDeletePlan(id: string) {
    if (!confirm("Delete this plan?")) return;
    try {
      await deletePlanMaster(id);
      toast.success("Plan deleted");
      fetchPlans();
    } catch {
      toast.error("Delete failed");
    }
  }

  function onAddPlanItem() {
    if (!selectedPlanId) {
      toast.error("Select a plan");
      return;
    }
    if (selectedPlanCount <= 0) {
      toast.error("Count must be positive");
      return;
    }

    setPlanItems((prev) => {
      const existing = prev.find((p) => p.planId === selectedPlanId);
      const plan = plans.find((p) => p.id === selectedPlanId);

      if (existing) {
        return prev.map((p) =>
          p.planId === selectedPlanId
            ? { ...p, count: p.count + selectedPlanCount }
            : p
        );
      }
      return [
        ...prev,
        {
          planId: selectedPlanId,
          planName: plan ? plan.plan_name : selectedPlanId,
          count: selectedPlanCount,
        },
      ];
    });

    setSelectedPlanId("");
    setSelectedPlanCount(0);
  }

  function onRemovePlanItem(id: string) {
    setPlanItems((prev) => prev.filter((p) => p.planId !== id));
  }

  const tabClass = (tab: string) =>
    `px-4 py-2 text-sm font-semibold cursor-pointer border-b-2 ${
      activeTab === tab
        ? "border-indigo-600 text-indigo-600"
        : "border-transparent text-gray-500 hover:text-indigo-600"
    }`;

  return (
    <div className="p-8 space-y-6">

      {/* Tabs */}
      <div className="flex gap-6 border-b pb-2 text-gray-600 text-sm">
        <div className={tabClass("targets")} onClick={() => setActiveTab("targets")}>
          Target Management
        </div>

        <div className={tabClass("plans")} onClick={() => setActiveTab("plans")}>
          Plans Management
        </div>
      </div>

      {/* TARGETS TAB */}
      {activeTab === "targets" && (
        <section>
          <div className="flex justify-between mt-6">
            <h2 className="text-2xl font-bold">Target Management</h2>
            <Button onClick={() => {
              setEditing(null);
              setForm(initialFormState);
              setPlanItems([]);
              setOpenForm(true);
            }}>Create New Target</Button>
          </div>

          <div className="bg-white border rounded-xl shadow-sm mt-6">
            <Table>
              <THead>
                <TR>
                  <TH>Description</TH>
                  <TH className="text-center">Plans</TH>
                  <TH className="text-center">Days</TH>
                  <TH className="text-center">Status</TH>
                  <TH className="text-center">Actions</TH>
                </TR>
              </THead>

              <TBody>
                {targets.map((t) => (
                  <TR key={t.id}>
                    <TD>
                      <div className="font-medium">{t.target_description}</div>
                    </TD>

                    <TD className="text-center">
                      {t.plans ?
                        Object.entries(t.plans).map(([pid, cnt]) => {
                          const p = plans.find((pl) => pl.id === pid);
                          return (
                            <div key={pid}>
                              {p ? p.plan_name : pid}: {cnt}
                            </div>
                          );
                        }) : "—"}
                    </TD>

                    <TD className="text-center">{t.deadline_days}</TD>

                    <TD className="text-center">
                      <span className={`px-2 py-1 text-xs rounded border ${STATUS_COLORS[t.status]}`}>
                        {t.status}
                      </span>
                    </TD>

                    <TD className="text-center">
                      <button onClick={() => handleEdit(t)}>✏️</button>
                      <button onClick={() => handleDelete(t.id)} className="ml-2">🗑️</button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </section>
      )}

      {/* PLANS TAB */}
      {activeTab === "plans" && (
        <section>
          <div className="flex justify-between mt-6">
            <h2 className="text-2xl font-bold">Plans Management</h2>
            <Button onClick={() => {
              setEditingPlan(null);
              setPlanForm(initialPlanFormState);
              setOpenPlanForm(true);
            }}>Create New Plan</Button>
          </div>

          <div className="bg-white border rounded-xl shadow-sm mt-6">
            <Table>
              <THead>
                <TR>
                  <TH>Plan Name</TH>
                  <TH className="text-center">Status</TH>
                  <TH className="text-center">Actions</TH>
                </TR>
              </THead>

              <TBody>
                {plans.map((p) => (
                  <TR key={p.id}>
                    <TD>{p.plan_name}</TD>
                    <TD className="text-center">
                      <span className={`px-2 py-1 text-xs rounded border ${STATUS_COLORS[p.status]}`}>
                        {p.status}
                      </span>
                    </TD>
                    <TD className="text-center">
                      <button onClick={() => handleEditPlan(p)}>✏️</button>
                      <button onClick={() => handleDeletePlan(p.id)} className="ml-2">🗑️</button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </section>
      )}

      {/* TARGET FORM */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} title={editing ? "Edit Target" : "Create Target"}>
        <form onSubmit={handleSubmit} className="space-y-6">

          <textarea
            className="w-full border rounded p-3"
            value={form.target_description}
            onChange={(e) => handleChange("target_description", e.target.value)}
            placeholder="Target Description"
            required
          />

          <input
            type="number"
            className="w-full border rounded p-2"
            value={form.deadline_days}
            onChange={(e) => handleChange("deadline_days", Number(e.target.value))}
            placeholder="Deadline Days"
            required
          />

          {/* Dynamic Plans */}
          <div className="border-t pt-3">
            <label className="font-medium">Add Plans</label>

            <div className="flex gap-3 mt-2">
              <select
                className="border rounded p-2 flex-1"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
              >
                <option value="">Select plan</option>
                {plans.filter(p => p.status === "Active").map((p) => (
                  <option key={p.id} value={p.id}>{p.plan_name}</option>
                ))}
              </select>

              <input
                type="number"
                className="border rounded p-2 w-32"
                placeholder="Count"
                value={selectedPlanCount}
                onChange={(e) => setSelectedPlanCount(Number(e.target.value))}
              />

              <Button type="button" onClick={onAddPlanItem}>Add</Button>
            </div>

            <div className="mt-3 space-y-2">
              {planItems.length === 0 && (
                <div className="text-gray-500 text-sm">No plans added.</div>
              )}

              {planItems.map((p) => (
                <div key={p.planId} className="flex justify-between border rounded p-2">
                  <div>{p.planName} — {p.count}</div>
                  <button type="button" onClick={() => onRemovePlanItem(p.planId)} className="text-red-500">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <select
            className="w-full border rounded p-2"
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <div className="flex justify-end gap-2">
            <Button type="button" onClick={() => setOpenForm(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 text-white">
              {editing ? "Update" : "Create"}
            </Button>
          </div>

        </form>
      </Dialog>

      {/* PLAN FORM */}
      <Dialog open={openPlanForm} onClose={() => setOpenPlanForm(false)} title={editingPlan ? "Edit Plan" : "Create Plan"}>
        <form onSubmit={handlePlanSubmit} className="space-y-4">

          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="Plan Name"
            value={planForm.plan_name}
            onChange={(e) => handlePlanChange("plan_name", e.target.value)}
            required
          />

          <select
            className="w-full border rounded p-2"
            value={planForm.status}
            onChange={(e) => handlePlanChange("status", e.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <Button type="submit">{editingPlan ? "Update Plan" : "Create Plan"}</Button>

        </form>
      </Dialog>

    </div>
  );
}
