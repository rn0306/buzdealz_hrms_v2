import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Dialog from "../../components/ui/Dialog";
import { toast } from 'sonner';
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { User, Check, Eye, Edit, Search } from "lucide-react";

// --- Types ---
interface PersonalDetail {
  adhar_card_no: string;
  pan_card_no: string;
  bank_name: string;
  account_no: string;
  ifsc_code: string;
  highest_education: string;
  university_name: string;
  passing_year: string;
  last_company_name: string;
  role_designation: string;
  duration: string;
  source: string;
  current_stage: string;
  verification_status: "VERIFIED" | "PENDING" | "REJECTED";
}

interface RoleType {
  code: string;
}

interface Intern {
  id: string;
  manager_id: string | null;
  role_id: string;
  email: string;
  recruiter_id: string;
  fname: string;
  mname: string | null;
  lname: string;
  phone: string;
  join_date?: string;

  // NEW INTERN-ONLY FIELDS (stored separately)
  work_type?: string;
  internship_duration_months?: number;   // NEW: months part
  internship_duration_days?: number;     // NEW: days part
  stipend?: number;

  personalDetail: PersonalDetail;
  Role: RoleType;
}

type Employee = Intern;

const SUMMARY_CARD_CONFIG = [
  { icon: <User className="text-blue-500" size={24} />, title: "Total Interns", accent: "border-blue-500 bg-blue-50", key: "total" },
  { icon: <Check className="text-green-500" size={24} />, title: "Managers", accent: "border-green-500 bg-green-50", key: "managers" },
  { icon: <Eye className="text-purple-500" size={24} />, title: "Verified Employees", accent: "border-purple-500 bg-purple-50", key: "verified" },
  { icon: <User className="text-yellow-500" size={24} />, title: "Joined This Week", accent: "border-yellow-500 bg-yellow-50", key: "joined" },
];

const ROLES = ["INTERN", "MANAGER", "RECRUITER"];

// utility to parse a legacy duration string like "2 months 15 days" or "2 months" or "15 days"
function parseDurationToParts(duration?: string | null) {
  let months = 0;
  let days = 0;
  if (!duration) return { months, days };
  const monthMatch = duration.match(/(\d+)\s*month/);
  const dayMatch = duration.match(/(\d+)\s*day/);
  if (monthMatch) months = Number(monthMatch[1]);
  if (dayMatch) days = Number(dayMatch[1]);
  // fallback: if the string is numeric assume days
  if (!monthMatch && !dayMatch) {
    const numeric = parseInt(duration, 10);
    if (!isNaN(numeric)) {
      days = numeric;
    }
  }
  return { months, days };
}

const ActiveInterns: React.FC = () => {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Intern | null>(null);

  // Add/Edit forms
  const [addForm, setAddForm] = useState<Partial<Intern>>({});
  const [editForm, setEditForm] = useState<Partial<Intern>>({});

  // Load interns
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await api.get('/api/personaldetails');
        const data = res.data || [];
        console.log('Fetched interns data:', data);
        const mapped: Intern[] = data.map((d: any) => {
          const user = d.user || {};
          return {
            id: user.id || d.user_id || String(Math.random()),
            manager_id: user.manager_id || null,
            role_id: user.role_id || '',
            email: user.email || '',
            recruiter_id: user.recruiter_id || '',
            fname: user.fname || '',
            mname: user.mname || null,
            lname: user.lname || '',
            phone: user.phone || '',
            join_date: user.joining_date || d.joining_date,

            // NEW (default values set from parsed legacy or empty)
            work_type: d.work_type || "",
            internship_duration_months: d.internship_duration_months !== undefined ? Number(d.internship_duration_months) : 0,
            internship_duration_days: d.internship_duration_days !== undefined ? Number(d.internship_duration_days) : 0,
            stipend: d.stipend !== undefined ? Number(d.stipend) : undefined,

            personalDetail: {
              adhar_card_no: d.adhar_card_no || '',
              pan_card_no: d.pan_card_no || '',
              bank_name: d.bank_name || '',
              account_no: d.account_no || '',
              ifsc_code: d.ifsc_code || '',
              highest_education: d.highest_education || '',
              university_name: d.university_name || '',
              passing_year: d.passing_year || '',
              last_company_name: d.last_company_name || '',
              role_designation: d.role_designation || '',
              duration: d.duration || '',
              source: d.source || '',
              current_stage: d.current_stage || '',
              verification_status: d.verification_status || 'PENDING',
            },
            Role: { code: user.role_id ? 'INTERN' : 'INTERN' },
          };
        });

        if (mounted) setInterns(mapped);
      } catch (err) {
        if (mounted) setInterns([]);
      }
    }
    load();
    return () => { mounted = false };
  }, []);

  const managerOptions = useMemo(() =>
    interns.filter(emp => emp.Role.code === "MANAGER"), [interns]
  );

  const filteredInterns = useMemo(() => {
    return interns.filter((intern) => {
      const fullName = `${intern.fname} ${intern.lname}`.toLowerCase();
      return (
        fullName.includes(search.toLowerCase()) ||
        intern.email.toLowerCase().includes(search.toLowerCase()) ||
        intern.phone.includes(search)
      );
    });
  }, [interns, search]);

  // initialize addForm whenever Add Modal opens
  useEffect(() => {
    if (showAddModal)
      setAddForm({
        fname: "",
        lname: "",
        email: "",
        phone: "",
        Role: { code: "" },
        manager_id: "",
        join_date: "",
        work_type: "",
        internship_duration_months: 0,
        internship_duration_days: 0,
        stipend: undefined,
      });
  }, [showAddModal]);

  // initialize editForm when edit modal opens
  useEffect(() => {
    if (showEditModal) {
      setEditForm({
        ...showEditModal,
        Role: { code: showEditModal.Role.code },
        manager_id: showEditModal.manager_id || "",
        internship_duration_months: showEditModal.internship_duration_months ?? 0,
        internship_duration_days: showEditModal.internship_duration_days ?? 0,
      });
    }
  }, [showEditModal]);

  const shouldShowManagerDropdown = (role: string | undefined) => role === "INTERN";
  const shouldShowInternExtraFields = (role: string | undefined) => role === "INTERN";

  // helper to build a human readable duration string from months/days
  function buildDurationString(months?: number | null, days?: number | null) {
    const m = months ?? 0;
    const d = days ?? 0;
    const parts: string[] = [];
    if (m > 0) parts.push(`${m} month${m > 1 ? 's' : ''}`);
    if (d > 0) parts.push(`${d} day${d > 1 ? 's' : ''}`);
    return parts.length ? parts.join(' ') : '';
  }

  async function handleEditIntern(edited: Partial<Intern>, original: Intern) {
    try {
      const payload: any = {};

      // user fields
      if (edited.fname || edited.lname) payload.full_name = `${edited.fname || original.fname} ${edited.lname || original.lname}`.trim();
      if (edited.email !== undefined) payload.email = edited.email;
      if (edited.phone !== undefined) payload.phone = edited.phone;
      if (edited.join_date !== undefined) payload.joining_date = edited.join_date;

      // personalDetail fields
      if (edited.personalDetail) {
        const pd = edited.personalDetail as Partial<Intern['personalDetail']>;
        const allowed = [
          'adhar_card_no','pan_card_no','bank_name','account_no','branch_name','ifsc_code',
          'highest_education','university_name','passing_year','last_company_name','role_designation',
          'duration','other_documents_url','id_proof_url','verification_status','verified_by','verified_at','source','current_stage',
          'work_type','internship_duration','stipend'
        ];
        for (const k of allowed) {
          if ((pd as any)[k] !== undefined) payload[k] = (pd as any)[k];
        }
      }

      // intern-specific fields: months/days/stipend/work_type
      if ((edited as any).work_type !== undefined) payload.work_type = (edited as any).work_type;
      if ((edited as any).internship_duration_months !== undefined) payload.internship_duration_months = Number((edited as any).internship_duration_months);
      if ((edited as any).internship_duration_days !== undefined) payload.internship_duration_days = Number((edited as any).internship_duration_days);

      // for backward compatibility include a human readable internship_duration string
      if ((edited as any).internship_duration_months !== undefined || (edited as any).internship_duration_days !== undefined) {
        payload.internship_duration = buildDurationString((edited as any).internship_duration_months, (edited as any).internship_duration_days);
      }

      if ((edited as any).stipend !== undefined) payload.stipend = Number((edited as any).stipend);

      const res = await api.put(`/api/personaldetails/${original.id}`, payload);

      const updatedUser = res.data?.user || {};
      const updatedDetail = res.data?.personalDetail || {};

      const updatedIntern: Intern = {
        ...original,
        fname: updatedUser.fname || original.fname,
        lname: updatedUser.lname || original.lname,
        email: updatedUser.email || original.email,
        phone: updatedUser.phone || original.phone,
        join_date: updatedUser.joining_date || original.join_date,
        personalDetail: {
          ...original.personalDetail,
          ...updatedDetail,
          verification_status: updatedDetail.verification_status || original.personalDetail.verification_status,
        },
        Role: { code: edited.Role?.code || original.Role.code },
        work_type: (edited as any).work_type ?? original.work_type,
        internship_duration_months: (edited as any).internship_duration_months ?? original.internship_duration_months,
        internship_duration_days: (edited as any).internship_duration_days ?? original.internship_duration_days,
        stipend: (edited as any).stipend ?? original.stipend,
      } as Intern;

      setInterns(list => list.map(i => i.id === original.id ? updatedIntern : i));
      toast.success(res.data?.message || 'Profile updated');
      setShowEditModal(null);
    } catch (err: any) {
      console.error('Failed to update intern', err);
      toast.error(err?.response?.data?.error || 'Failed to update intern');
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">

      {/* Title */}
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Active Interns
          </span>
        </h1>
      </div>

      {/* Search */}
      <div className="flex justify-end mb-4">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            id="search"
            type="text"
            className="pl-9 w-full"
            placeholder="Search interns..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl shadow-sm bg-white p-6">
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Phone</TH>
              <TH>Education</TH>
              <TH>Role</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filteredInterns.map(intern => (
              <TR key={intern.id}>
                <TD>{intern.fname} {intern.lname}</TD>
                <TD>{intern.email}</TD>
                <TD>{intern.phone}</TD>
                <TD>{intern.personalDetail.highest_education}</TD>
                <TD>{intern.Role.code}</TD>
                <TD>{intern.personalDetail.verification_status}</TD>
                <TD>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedIntern(intern)}>
                      <Eye size={18} />
                    </Button>
                    <Button variant="outline" onClick={() => setShowEditModal(intern)}>
                      <Edit size={18} />
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      {/* Add Modal */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Employee">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="flex gap-3">
            <Input label="First Name" required value={addForm.fname || ""} onChange={e => setAddForm(f => ({ ...f, fname: e.target.value }))} />
            <Input label="Last Name" required value={addForm.lname || ""} onChange={e => setAddForm(f => ({ ...f, lname: e.target.value }))} />
          </div>

          <Input label="Email" required value={addForm.email || ""} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Phone" required value={addForm.phone || ""} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} />

          {/* Role */}
          <Select label="Role" required value={addForm.Role?.code || ""} onChange={e => setAddForm(f => ({ ...f, Role: { code: e.target.value } }))}>
            <option value="">Select Role</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>

          {/* Join Date */}
          <Input type="date" label="Join Date" required value={addForm.join_date || ""} onChange={e => setAddForm(f => ({ ...f, join_date: e.target.value }))} />

          {/* INTERN-ONLY EXTRA FIELDS */}
          {shouldShowInternExtraFields(addForm.Role?.code) && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-2 text-gray-700">Intern Details</h3>

              <Input
                label="Work Type"
                placeholder="e.g., acquiring subscribers"
                required
                value={addForm.work_type || ""}
                onChange={(e) => setAddForm(f => ({ ...f, work_type: e.target.value }))}
              />

              {/* NEW: Duration split into months + days */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <Select
                    label="Months"
                    value={String(addForm.internship_duration_months ?? 0)}
                    onChange={(e) => setAddForm(f => ({ ...f, internship_duration_months: Number(e.target.value) }))}
                  >
                    {Array.from({ length: 25 }).map((_, idx) => (
                      <option key={idx} value={idx}>{idx} {idx === 1 ? 'month' : 'months'}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex-1">
                  <Select
                    label="Days"
                    value={String(addForm.internship_duration_days ?? 0)}
                    onChange={(e) => setAddForm(f => ({ ...f, internship_duration_days: Number(e.target.value) }))}
                  >
                    {Array.from({ length: 31 }).map((_, idx) => (
                      <option key={idx} value={idx}>{idx} {idx === 1 ? 'day' : 'days'}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <Input
                label="Stipend (₹)"
                type="number"
                required
                placeholder="Enter stipend amount"
                value={addForm.stipend ?? ""}
                onChange={(e) => setAddForm(f => ({ ...f, stipend: Number(e.target.value) }))}
              />
            </div>
          )}

          {/* Manager Dropdown */}
          {shouldShowManagerDropdown(addForm.Role?.code) && (
            <Select label="Assign Manager" required value={addForm.manager_id || ""} onChange={e => setAddForm(f => ({ ...f, manager_id: e.target.value }))}>
              <option value="">Select Manager</option>
              {managerOptions.map(m => (
                <option key={m.id} value={m.id}>{m.fname} {m.lname}</option>
              ))}
            </Select>
          )}

          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!showEditModal} onClose={() => setShowEditModal(null)} title="Edit Employee">
        {showEditModal && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              // ensure editForm has the fields we want to send
              handleEditIntern(editForm, showEditModal);
            }}
          >
            <div className="flex gap-3">
              <Input label="First Name" required value={editForm.fname || ""} onChange={e => setEditForm(f => ({ ...f, fname: e.target.value }))} />
              <Input label="Last Name" required value={editForm.lname || ""} onChange={e => setEditForm(f => ({ ...f, lname: e.target.value }))} />
            </div>

            <Input label="Email" required value={editForm.email || ""} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="Phone" required value={editForm.phone || ""} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />

            {/* Role */}
            <Select label="Role" required value={editForm.Role?.code || ""} onChange={e => setEditForm(f => ({ ...f, Role: { code: e.target.value } }))}>
              <option value="">Select Role</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>

            {/* Join Date */}
            <Input type="date" label="Join Date" value={editForm.join_date || ""} onChange={e => setEditForm(f => ({ ...f, join_date: e.target.value }))} />

            {/* INTERN-ONLY EXTRA FIELDS */}
            {shouldShowInternExtraFields(editForm.Role?.code) && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-2 text-gray-700">Intern Details</h3>

                <Input
                  label="Work Type"
                  placeholder="e.g., acquiring subscribers"
                  required
                  value={editForm.work_type || ""}
                  onChange={(e) => setEditForm(f => ({ ...f, work_type: e.target.value }))}
                />

               <Input
                  label="internship Duration (Months)"
                  placeholder="Enter internship duration in months"
                  value={editForm.internship_duration_months ?? ""}
                  onChange={(e) => setEditForm(f => ({ ...f, internship_duration_months: Number(e.target.value) }))}
                />

                <Input
                  label="internship Duration (Days)"
                  placeholder="Enter internship duration in days"
                  value={editForm.internship_duration_days ?? ""}
                  onChange={(e) => setEditForm(f => ({ ...f, internship_duration_days: Number(e.target.value) }))}
                />

                <Input
                  label="Stipend (₹)"
                  required
                  placeholder="Enter stipend amount"
                  value={editForm.stipend ?? ""}
                  onChange={(e) => setEditForm(f => ({ ...f, stipend: Number(e.target.value) }))}
                />
              </div>
            )}

            {shouldShowManagerDropdown(editForm.Role?.code) && (
              <Select label="Assign Manager" value={editForm.manager_id || ""} onChange={e => setEditForm(f => ({ ...f, manager_id: e.target.value }))}>
                <option value="">Select Manager</option>
                {managerOptions.map(m => (
                  <option key={m.id} value={m.id}>{m.fname} {m.lname}</option>
                ))}
              </Select>
            )}

            <div className="flex justify-end gap-4 mt-4">
              <Button variant="outline" type="button" onClick={() => setShowEditModal(null)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Details Modal */}
      <Dialog
        open={!!selectedIntern}
        onClose={() => setSelectedIntern(null)}
        title={selectedIntern ? `${selectedIntern.fname} ${selectedIntern.lname} Details` : ""}
      >
        {selectedIntern && (
          <div className="flex flex-col gap-2 text-sm">
            <div><strong>Full Name:</strong> {selectedIntern.fname} {selectedIntern.lname}</div>
            <div><strong>Email:</strong> {selectedIntern.email}</div>
            <div><strong>Phone:</strong> {selectedIntern.phone}</div>

            {selectedIntern.work_type && (
              <div><strong>Work Type:</strong> {selectedIntern.work_type}</div>
            )}

            {(selectedIntern.internship_duration_months || selectedIntern.internship_duration_days) ? (
              <div>
                <strong>Duration:</strong>{" "}
                {buildDurationString(selectedIntern.internship_duration_months, selectedIntern.internship_duration_days)}
              </div>
            ) : null}

            {selectedIntern.stipend !== undefined && (
              <div><strong>Stipend:</strong> ₹{selectedIntern.stipend}</div>
            )}

            <div><strong>Education:</strong> {selectedIntern.personalDetail.highest_education}</div>
          </div>
        )}
      </Dialog>

    </div>
  );
};

export default ActiveInterns;
