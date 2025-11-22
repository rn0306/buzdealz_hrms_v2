import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { getUser } from "../../utils/auth";
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
  id?: string;
  code: string;
  name?: string;
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
  { icon: <User className="text-purple-500" size={24} />, title: "Verified Employees", accent: "border-purple-500 bg-purple-50", key: "verified" },
  { icon: <User className="text-yellow-500" size={24} />, title: "Joined This Week", accent: "border-yellow-500 bg-yellow-50", key: "joined" },
];

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

  // Extension/Termination state
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionInternId, setExtensionInternId] = useState<string | null>(null);
  // include old_end_date here
  const [extensionForm, setExtensionForm] = useState<{ reason: string; newEndDate: string; old_end_date?: string }>({ reason: "", newEndDate: "", old_end_date: "" });

  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [terminationInternId, setTerminationInternId] = useState<string | null>(null);
  const [terminationForm, setTerminationForm] = useState({ reason: "" });

  // Extension/Termination data
  const [extensions, setExtensions] = useState<any>({});
  const [terminations, setTerminations] = useState<any>({});

  // Add/Edit forms
  const [addForm, setAddForm] = useState<Partial<Intern>>({});
  const [editForm, setEditForm] = useState<Partial<Intern>>({});

  // Load interns and roles
  const [roles, setRoles] = useState<RoleType[]>([]);

  // Logged-in user
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  // optional loading flag for extension status update
  const [updatingExtensionId, setUpdatingExtensionId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [rolesRes, res] = await Promise.all([
          api.get('/api/roles'),
          api.get('/api/personaldetails')
        ]);

        const rolesData: RoleType[] = rolesRes.data?.data || [];
        if (mounted) setRoles(rolesData);

        const data = res.data || [];
        console.log('Fetched interns data:', data);
        const mapped: Intern[] = data.map((d: any) => {
          const user = d.user || {};
          const roleCode = rolesData.find(r => r.id === user.role_id)?.code || '';
          // parse legacy internship_duration to months/days if present
          let months = 0, days = 0;
          if (d.internship_duration_months !== undefined || d.internship_duration_days !== undefined) {
            months = d.internship_duration_months !== undefined ? Number(d.internship_duration_months) : 0;
            days = d.internship_duration_days !== undefined ? Number(d.internship_duration_days) : 0;
          } else if (d.internship_duration) {
            const parsed = parseDurationToParts(d.internship_duration);
            months = parsed.months;
            days = parsed.days;
          } else if (d.duration) {
            const parsed = parseDurationToParts(d.duration);
            months = parsed.months;
            days = parsed.days;
          }

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
            internship_duration_months: months,
            internship_duration_days: days,
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
            Role: { code: roleCode || 'INTERN' },
          };
        });

        if (mounted) setInterns(mapped);

        // Fetch extensions and terminations for each intern
        if (mounted && mapped.length > 0) {
          const extensionsData: any = {};
          const terminationsData: any = {};

          await Promise.all(
            mapped.map(async (intern) => {
              try {
                const extRes = await api.get(`/api/extensions/user/${intern.id}`);
                const termRes = await api.get(`/api/terminations/user/${intern.id}`);

                if (mounted) {
                  extensionsData[intern.id] = extRes.data?.data || [];
                  terminationsData[intern.id] = termRes.data?.data || null;
                }
              } catch (err) {
                // Silently fail for individual intern status fetches
              }
            })
          );

          if (mounted) {
            setExtensions(extensionsData);
            setTerminations(terminationsData);
          }
        }
      } catch (err) {
        if (mounted) setInterns([]);
      }
    }
    load();

    // load logged-in user
    let mountedUser = true;
    async function loadUser() {
      debugger
      try {
        const u = await getUser(); // Option A used
        if (mountedUser && u) {
          setLoggedInUser({
            ...u,
            role: u.role?.toUpperCase()    // <-- FIX APPLIED
          });
        }
      } catch (e) {
        // ignore
      }
    }
    loadUser();

    return () => { mounted = false; mountedUser = false; };
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

  // Calculate internship end date from joining date + duration months/days
  function calculateInternshipEndDate(joiningDateStr?: string, months?: number, days?: number) {
    if (!joiningDateStr) return '';
    try {
      const joining = new Date(joiningDateStr);
      if (isNaN(joining.getTime())) return '';

      const endDate = new Date(joining);
      if (months && months > 0) endDate.setMonth(endDate.getMonth() + months);
      if (days && days > 0) endDate.setDate(endDate.getDate() + days);

      // Normalize time zone issues by using UTC values if needed — format as YYYY-MM-DD
      const year = endDate.getFullYear();
      const month = String(endDate.getMonth() + 1).padStart(2, '0');
      const date = String(endDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${date}`;
    } catch {
      return '';
    }
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
          'adhar_card_no', 'pan_card_no', 'bank_name', 'account_no', 'branch_name', 'ifsc_code',
          'highest_education', 'university_name', 'passing_year', 'last_company_name', 'role_designation',
          'duration', 'other_documents_url', 'id_proof_url', 'verification_status', 'verified_by', 'verified_at', 'source', 'current_stage',
          'work_type', 'internship_duration', 'stipend'
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

      // Role update: if Role.code provided, convert to role_id using roles list
      if ((edited as any).Role?.code) {
        const roleObj = roles.find(r => r.code === (edited as any).Role.code);
        if (roleObj) payload.role_id = roleObj.id;
      }

      // Manager assignment
      if ((edited as any).manager_id !== undefined) payload.manager_id = (edited as any).manager_id;

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

  // Request internship extension
  async function handleRequestExtension() {
    if (!extensionInternId) return;
    if (!extensionForm.reason.trim()) {
      toast.error('Please provide a reason for extension');
      return;
    }
    if (!extensionForm.newEndDate) {
      toast.error('Please select a new end date');
      return;
    }

    try {
      // Compute old_end_date if not provided (safety)
      let oldEnd = extensionForm.old_end_date;
      if (!oldEnd) {
        const intern = interns.find(i => i.id === extensionInternId);
        oldEnd = calculateInternshipEndDate(intern?.join_date, intern?.internship_duration_months, intern?.internship_duration_days) || '';
      }

      const payload = {
        user_id: extensionInternId,
        reason: extensionForm.reason,
        old_end_date: oldEnd,
        new_end_date: extensionForm.newEndDate,
      };

      const res = await api.post('/api/extensions', payload);
      toast.success(res.data?.message || 'Extension requested successfully');

      // Refresh extensions for this intern
      const extRes = await api.get(`/api/extensions/user/${extensionInternId}`);
      setExtensions((prev: any) => ({
        ...prev,
        [extensionInternId]: extRes.data?.data || [],
      }));

      setShowExtensionModal(false);
      setExtensionInternId(null);
      setExtensionForm({ reason: "", newEndDate: "", old_end_date: "" });
    } catch (err: any) {
      console.error('Failed to request extension', err);
      toast.error(err?.response?.data?.error || 'Failed to request extension');
    }
  }

  // Terminate internship
  async function handleTerminateIntern() {
    if (!terminationInternId) return;
    if (!terminationForm.reason.trim()) {
      toast.error('Please provide a reason for termination');
      return;
    }

    try {
      const payload = {
        user_id: terminationInternId,
        reason: terminationForm.reason,
      };

      const res = await api.post('/api/terminations', payload);
      toast.success(res.data?.message || 'Internship terminated successfully');

      // Refresh termination status for this intern
      const termRes = await api.get(`/api/terminations/user/${terminationInternId}`);
      setTerminations((prev: any) => ({
        ...prev,
        [terminationInternId]: termRes.data?.data || null,
      }));

      setShowTerminationModal(false);
      setTerminationInternId(null);
      setTerminationForm({ reason: "" });
    } catch (err: any) {
      console.error('Failed to terminate intern', err);
      toast.error(err?.response?.data?.error || 'Failed to terminate intern');
    }
  }

  // Get latest extension status
  function getLatestExtensionStatus(internId: string) {
    const exts = extensions[internId] || [];
    if (exts.length === 0) return null;
    return exts[exts.length - 1];
  }

  // Get termination status
  function getTerminationStatus(internId: string) {
    return terminations[internId] || null;
  }

  // Role check: Admin or Recruiter can approve/reject
  const canApprove = loggedInUser?.role === "ADMIN" || loggedInUser?.role === "RECRUITER";

  // Approve/Reject functions
  async function updateExtensionStatus(extensionId: string, status: "Approved" | "Rejected", userIdFallback?: string) {
    if (!extensionId) return;
    try {
      setUpdatingExtensionId(extensionId);
      const res = await api.put(`/api/extensions/${extensionId}`, { status });
      toast.success(res.data?.message || `Extension ${status.toLowerCase()}`);

      // Determine user id to refresh extensions list
      const updated = res.data?.data || {};
      const uid = updated.user_id || userIdFallback || extensionInternId;

      if (uid) {
        const extRes = await api.get(`/api/extensions/user/${uid}`);
        setExtensions(prev => ({
          ...prev,
          [uid]: extRes.data?.data || [],
        }));
      }
    } catch (err: any) {
      console.error('Failed to update extension status', err);
      toast.error(err?.response?.data?.error || 'Failed to update extension status');
    } finally {
      setUpdatingExtensionId(null);
    }
  }

  const handleApproveExtension = (extId: string, userId?: string) => {
    if (!canApprove) {
      toast.error('You are not authorized to approve extensions');
      return;
    }
    updateExtensionStatus(extId, "Approved", userId);
  };

  const handleRejectExtension = (extId: string, userId?: string) => {
    if (!canApprove) {
      toast.error('You are not authorized to reject extensions');
      return;
    }
    updateExtensionStatus(extId, "Rejected", userId);
  };

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
              <TH>Joining Date</TH>
              <TH>End Date</TH>
              <TH>Work Type</TH>
              <TH>Manager</TH>
              <TH>Verification</TH>
              <TH>Extension</TH>
              <TH>Termination</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filteredInterns.map(intern => {
              const extStatus = getLatestExtensionStatus(intern.id);
              const termStatus = getTerminationStatus(intern.id);
              const endDate = calculateInternshipEndDate(intern.join_date, intern.internship_duration_months, intern.internship_duration_days);
              const managerName = interns.find(m => m.id === intern.manager_id)?.fname || '-';

              return (
                <TR key={intern.id}>
                  <TD>{intern.fname} {intern.lname}</TD>
                  <TD>{intern.email}</TD>
                  <TD>{intern.phone}</TD>
                  <TD>{intern.join_date ? new Date(intern.join_date).toLocaleDateString('en-IN') : '-'}</TD>
                  <TD>
                    {endDate ? (
                      <span className={new Date(endDate) < new Date() ? 'text-red-600 font-semibold' : ''}>
                        {new Date(endDate).toLocaleDateString('en-IN')}
                      </span>
                    ) : '-'}
                  </TD>
                  <TD>{intern.work_type || '-'}</TD>
                  <TD>{managerName}</TD>
                  <TD>{intern.personalDetail.verification_status}</TD>
                  <TD>
                    {extStatus ? (
                      <div className="flex flex-col gap-1">

                        {/* Status badge */}
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${extStatus.status?.toUpperCase() === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            extStatus.status?.toUpperCase() === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {extStatus.status?.toUpperCase()}
                        </span>

                        {/* APPROVE / REJECT buttons -> only Admin & Recruiter */}
                        {canApprove && extStatus.status?.toUpperCase() === "PENDING" && (
                          <div className="flex gap-2 mt-1">
                            <Button
                              size="xs"
                              className="bg-green-600 text-white"
                              onClick={() => handleApproveExtension(extStatus.id, extStatus.user_id)}
                              disabled={updatingExtensionId === extStatus.id}
                            >
                              Approve
                            </Button>

                            <Button
                              size="xs"
                              className="bg-red-600 text-white"
                              onClick={() => handleRejectExtension(extStatus.id, extStatus.user_id)}
                              disabled={updatingExtensionId === extStatus.id}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">None</span>
                    )}
                  </TD>
                  <TD>
                    {termStatus ? (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                        TERMINATED
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Active</span>
                    )}
                  </TD>
                  <TD>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setSelectedIntern(intern)}>
                        <Eye size={18} />
                      </Button>
                      <Button variant="outline" onClick={() => setShowEditModal(intern)}>
                        <Edit size={18} />
                      </Button>
                      {!termStatus && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => {
                              const oldEnd = calculateInternshipEndDate(
                                intern.join_date,
                                intern.internship_duration_months,
                                intern.internship_duration_days
                              );

                              setExtensionInternId(intern.id);
                              setExtensionForm({ reason: "", newEndDate: "", old_end_date: oldEnd });
                              setShowExtensionModal(true);
                            }}
                            title="Request Extension"
                          >
                            ⏱️
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setTerminationInternId(intern.id);
                              setTerminationForm({ reason: "" });
                              setShowTerminationModal(true);
                            }}
                            title="Terminate"
                            className="text-red-600"
                          >
                            ❌
                          </Button>
                        </>
                      )}
                    </div>
                  </TD>
                </TR>
              );
            })}
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
          <Select id="role-add" label="Role" required value={addForm.Role?.code || ""} onChange={e => setAddForm(f => ({ ...f, Role: { code: e.target.value } }))}>
            <option value="">Select Role</option>
            {roles.map((r: RoleType) => <option key={r.id || r.code} value={r.code}>{r.name || r.code}</option>)}
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
                    id="months-add"
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
                    id="days-add"
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
            <Select id="manager-add" label="Assign Manager" required value={addForm.manager_id || ""} onChange={e => setAddForm(f => ({ ...f, manager_id: e.target.value }))}>
              <option value="">Select Manager</option>
              {managerOptions.map(m => (
                <option key={m.id} value={m.id}>{m.fname} {m.lname}</option>
              ))}
            </Select>
          )}          <div className="flex justify-end gap-4 mt-4">
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
            <Select id="role-edit" label="Role" required value={editForm.Role?.code || ""} onChange={e => setEditForm(f => ({ ...f, Role: { code: e.target.value } }))}>
              <option value="">Select Role</option>
              {roles.map((r: RoleType) => <option key={r.id || r.code} value={r.code}>{r.name || r.code}</option>)}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Internship End Date</label>
                  <div className="w-full rounded-md border border-gray-300 px-4 py-3 bg-gray-100 text-gray-700 font-semibold">
                    {calculateInternshipEndDate(editForm.join_date, editForm.internship_duration_months, editForm.internship_duration_days) || 'Set joining date and duration'}
                  </div>
                </div>

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
              <Select id="manager-edit" label="Assign Manager" value={editForm.manager_id || ""} onChange={e => setEditForm(f => ({ ...f, manager_id: e.target.value }))}>
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

      {/* Extension Request Modal */}
      <Dialog open={showExtensionModal} onClose={() => setShowExtensionModal(false)} title="Request Internship Extension">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleRequestExtension();
          }}
        >
          <div className="text-sm">
            <label className="block mb-1 font-medium text-gray-700">Current End Date</label>
            <div className="rounded border px-3 py-2 bg-gray-50 text-sm">
              {extensionForm.old_end_date || (extensionInternId ? calculateInternshipEndDate(
                interns.find(i => i.id === extensionInternId)?.join_date,
                interns.find(i => i.id === extensionInternId)?.internship_duration_months,
                interns.find(i => i.id === extensionInternId)?.internship_duration_days
              ) : '—')}
            </div>
          </div>

          <textarea
            placeholder="Reason for extension"
            value={extensionForm.reason}
            onChange={(e) => setExtensionForm(f => ({ ...f, reason: e.target.value }))}
            className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            required
          />

          <Input
            type="date"
            label="New End Date"
            value={extensionForm.newEndDate}
            onChange={(e) => setExtensionForm(f => ({ ...f, newEndDate: e.target.value }))}
            required
          />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowExtensionModal(false)}>Cancel</Button>
            <Button onClick={handleRequestExtension}>Request Extension</Button>
          </div>
        </form>
      </Dialog>

      {/* Termination Modal */}
      <Dialog open={showTerminationModal} onClose={() => setShowTerminationModal(false)} title="Terminate Internship">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleTerminateIntern();
          }}
        >
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
            <strong>Warning:</strong> This action cannot be undone. The intern will be marked as terminated.
          </div>

          <textarea
            placeholder="Reason for termination"
            value={terminationForm.reason}
            onChange={(e) => setTerminationForm(f => ({ ...f, reason: e.target.value }))}
            className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            rows={4}
            required
          />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowTerminationModal(false)}>Cancel</Button>
            <Button
              onClick={handleTerminateIntern}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Terminate Internship
            </Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
};

export default ActiveInterns;
