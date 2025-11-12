import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Dialog from "../../components/ui/Dialog";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { User, Check, X, Eye, Edit, Power, UserCog, Plus, Search } from "lucide-react";

// --- Types ---
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
  department?: string;
  join_date?: string;
  personalDetail: {
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
  };
  Role: {
    code: string;
  };
}

type Employee = Intern; // Used for managers

// --- Constants ---
const SUMMARY_CARD_CONFIG = [
  { icon: <User className="text-blue-500" size={24} />, title: "Total Interns", accent: "border-blue-500 bg-blue-50", key: "total" },
  { icon: <Check className="text-green-500" size={24} />, title: "Managers", accent: "border-green-500 bg-green-50", key: "managers" },
  { icon: <Eye className="text-purple-500" size={24} />, title: "Verified Employees", accent: "border-purple-500 bg-purple-50", key: "verified" },
  { icon: <UserCog className="text-yellow-500" size={24} />, title: "Joined This Week", accent: "border-yellow-500 bg-yellow-50", key: "joined" },
];

const ROLES = ["INTERN", "MANAGER", "RECRUITER"];
const DEPARTMENTS = ["Engineering", "HR", "Marketing", "Sales"];
// verification-related statuses removed from filters per request
const MOCK_INTERN_DATA: Intern[] = [
  {
    id: "8468378a-05f0-4117-8bba-c0d993652ff5",
    manager_id: null,
    role_id: "a86af16e-085d-4596-a376-414e46a9e8d1",
    email: "rahulnarwane78@gmail.com",
    recruiter_id: "7f6497e8-172c-4b42-8cec-aecbc7073bfd",
    fname: "Rahul",
    mname: null,
    lname: "Narwane",
    phone: "7755975177",
    department: "Engineering",
    join_date: "2024-05-02",
    personalDetail: {
      adhar_card_no: "123412341234",
      pan_card_no: "dfghj4567df",
      bank_name: "SBI",
      account_no: "345678",
      ifsc_code: "SBIN345678",
      highest_education: "BCA",
      university_name: "pune",
      passing_year: "2022",
      last_company_name: "RNT",
      role_designation: "Java",
      duration: "3",
      source: "Portal",
      current_stage: "Shortlisted",
      verification_status: "PENDING",
    },
    Role: { code: "INTERN" },
  },
  // Example manager
  {
    id: "1",
    manager_id: null,
    role_id: "manager_role",
    email: "manager1@email.com",
    recruiter_id: "",
    fname: "Harsha",
    mname: null,
    lname: "Manager",
    phone: "0000000000",
    department: "Engineering",
    join_date: "2022-01-01",
    personalDetail: {
      adhar_card_no: "",
      pan_card_no: "",
      bank_name: "",
      account_no: "",
      ifsc_code: "",
      highest_education: "MBA",
      university_name: "IIM",
      passing_year: "2020",
      last_company_name: "",
      role_designation: "Management",
      duration: "",
      source: "",
      current_stage: "Active",
      verification_status: "VERIFIED",
    },
    Role: { code: "MANAGER" }
  }
];

// --- Component ---
const ActiveInterns: React.FC = () => {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Intern | null>(null);

  useEffect(() => {
    // Fetch verified interns from backend
    let mounted = true;
    async function load() {
      try {
        const res = await api.get('/api/personaldetails', { params: { verification_status: 'VERIFIED', limit: 200 } });
        const data = res.data || [];
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
            department: d.department || undefined,
            join_date: user.joining_date || d.joining_date || undefined,
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
            Role: { code: (user.role_id ? 'INTERN' : 'INTERN') }
          } as Intern;
        });
        if (mounted) setInterns(mapped.length ? mapped : MOCK_INTERN_DATA);
      } catch (err: any) {
        console.error('Failed to load verified interns', err);
        // fallback to mock data
        if (mounted) setInterns(MOCK_INTERN_DATA);
      }
    }
    load();
    return () => { mounted = false };
  }, []);

  // Get manager options from employees data
  const managerOptions = useMemo(() =>
    interns.filter(emp => emp.Role.code === "MANAGER"), [interns]);

  // Filtered rows
  const filteredInterns = useMemo(() => {
    return interns.filter((intern) => {
      const fullName = `${intern.fname} ${intern.lname}`.toLowerCase();
      const matchesSearch =
        fullName.includes(search.toLowerCase()) ||
        intern.email.toLowerCase().includes(search.toLowerCase()) ||
        intern.phone.includes(search);

      const matchesRole = roleFilter === "" || intern.Role.code === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [interns, search, roleFilter]);

  // Summary cards
  const stats = useMemo(() => {
      let managers = 0, verified = 0, joined = 0;
      const WEEK_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
      const now = Date.now();

      interns.forEach((i) => {
        if (i.Role.code === "MANAGER") managers++;
        // count verified employees based on personalDetail.verification_status
        if (i.personalDetail && String(i.personalDetail.verification_status).toUpperCase() === 'VERIFIED') verified++;
        // joined this week: join_date within last 7 days
        if (i.join_date) {
          const jd = new Date(i.join_date).getTime();
          if (!isNaN(jd) && (now - jd) <= WEEK_MS) joined++;
        }
      });

      return { total: interns.length, managers, verified, joined };
    }, [interns]);

  // --- Handlers ---
  function handleAddIntern(newIntern: Partial<Intern>) {
    const newEntry: Intern = {
      ...newIntern,
      id: Math.random().toString(),
      personalDetail: MOCK_INTERN_DATA[0].personalDetail,
      recruiter_id: "",
      role_id: "",
      mname: null,
      Role: { code: newIntern.Role?.code || "INTERN" }
    } as Intern;
    setInterns(list => [...list, newEntry]);
    console.log("New intern:", newEntry);
    setShowAddModal(false);
  }

  function handleEditIntern(edited: Partial<Intern>, original: Intern) {
    const updated: Intern = { ...original, ...edited, Role: { code: edited.Role?.code || original.Role.code } };
    setInterns(list => list.map(i => i.id === original.id ? updated : i));
    console.log("Updated intern:", updated);
    setShowEditModal(null);
  }

  // Form State Hooks for add/edit
  const [addForm, setAddForm] = useState<Partial<Intern>>({});
  useEffect(() => {
    if (showAddModal)
      setAddForm({ fname: "", lname: "", email: "", phone: "", Role: { code: "" }, department: "", manager_id: "", join_date: "" });
  }, [showAddModal]);

  const [editForm, setEditForm] = useState<Partial<Intern>>({});
  useEffect(() => {
    if (showEditModal && showEditModal !== null) {
      setEditForm({
        ...showEditModal,
        Role: { code: showEditModal.Role.code },
        manager_id: showEditModal.manager_id || ""
      });
    }
  }, [showEditModal]);

  // --- JSX ---
  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Title + Add button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Active Interns</h1>
          <p className="text-gray-500 mt-1">Review, monitor and verify interns in real time.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <Button variant="default" onClick={() => setShowAddModal(true)}>
            <Plus className="inline mr-1" size={18} />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {SUMMARY_CARD_CONFIG.map(card => (
          <div key={card.key} className={`rounded-xl shadow-sm border-l-4 ${card.accent} p-4 flex items-center`}>
            {card.icon}
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-600">{card.title}</div>
              <div className="text-2xl font-bold">{stats[card.key as keyof typeof stats]}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-3 mb-4">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              id="search"
              type="text"
              className="pl-9 w-full"
              placeholder="Search interns by name, email, or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select id="role-filter" label="Role" className="min-w-[160px]" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
          <Select id="dept-filter" label="Department" className="min-w-[160px]" value={""} onChange={() => {}}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>
      </div>

      {/* Interns Table */}
      <div className="rounded-xl shadow-sm bg-white p-6">
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Phone</TH>
              <TH>Education</TH>
              <TH>Role</TH>
              <TH>Current Stage</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filteredInterns.map(intern => (
              <TR key={intern.id} className="hover:bg-gray-50 transition">
                <TD>{intern.fname} {intern.lname}</TD>
                <TD>{intern.email}</TD>
                <TD>{intern.phone}</TD>
                <TD>{intern.personalDetail.highest_education}</TD>
                <TD>{intern.Role.code}</TD>
                <TD>{intern.personalDetail.current_stage}</TD>
                <TD>
                  <div className="flex gap-2">
                    <Button className="p-2 rounded-full" variant="outline" onClick={() => setSelectedIntern(intern)}>
                      <Eye size={18} />
                    </Button>
                    <Button className="p-2 rounded-full" variant="outline" onClick={() => setShowEditModal(intern)}>
                      <Edit size={18} />
                    </Button>
                    <Button
                      className="p-2 rounded-full"
                      variant="outline"
                      onClick={() => setInterns(list => list.filter(i => i.id !== intern.id))}
                    >
                      <Power size={18} className="text-red-500" />
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
            {filteredInterns.length === 0 && (
              <TR>
                <TD colSpan={7} className="text-center text-gray-400">
                  No interns found.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Employee">
        <form
          className="flex flex-col gap-4"
          onSubmit={e => {
            e.preventDefault();
            handleAddIntern(addForm);
          }}
        >
          <div className="flex gap-3">
            <Input label="First Name" id="add-first" value={addForm.fname || ""} onChange={e => setAddForm(f => ({ ...f, fname: e.target.value }))} required />
            <Input label="Last Name" id="add-last" value={addForm.lname || ""} onChange={e => setAddForm(f => ({ ...f, lname: e.target.value }))} required />
          </div>
          <Input label="Email" value={addForm.email || ""} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} required />
          <Input label="Phone" value={addForm.phone || ""} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} required />
          <Select id="add-role" label="Role" value={addForm.Role?.code || ""} onChange={e => setAddForm(f => ({ ...f, Role: { code: e.target.value } }))} required>
            <option value="">Select Role</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
          <Select id="add-dept" label="Department" value={addForm.department || ""} onChange={e => setAddForm(f => ({ ...f, department: e.target.value }))} required>
            <option value="">Select Department</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Input
            label="Join Date"
            type="date"
            value={addForm.join_date || ""}
            onChange={e => setAddForm(f => ({ ...f, join_date: e.target.value }))}
            required
          />
          <Select
            id="add-manager"
            label="Assign Manager"
            value={addForm.manager_id || ""}
            onChange={e => setAddForm(f => ({ ...f, manager_id: e.target.value }))}
          >
            <option value="">None</option>
            {managerOptions.map(m => (
              <option key={m.id} value={m.id}>
                {m.fname} {m.lname}
              </option>
            ))}
          </Select>
          <div className="flex gap-4 justify-end mt-4">
            <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={!!showEditModal} onClose={() => setShowEditModal(null)} title="Edit Employee">
        {showEditModal && (
          <form
            className="flex flex-col gap-4"
            onSubmit={e => {
              e.preventDefault();
              handleEditIntern(editForm, showEditModal);
            }}
          >
            <div className="flex gap-3">
              <Input label="First Name" id="edit-first" value={editForm.fname || ""} onChange={e => setEditForm(f => ({ ...f, fname: e.target.value }))} required />
              <Input label="Last Name" id="edit-last" value={editForm.lname || ""} onChange={e => setEditForm(f => ({ ...f, lname: e.target.value }))} required />
            </div>
            <Input label="Email" value={editForm.email || ""} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} required />
            <Input label="Phone" value={editForm.phone || ""} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} required />
            <Select id="edit-role" label="Role" value={editForm.Role?.code || ""} onChange={e => setEditForm(f => ({ ...f, Role: { code: e.target.value } }))} required>
              <option value="">Select Role</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
            <Select id="edit-dept" label="Department" value={editForm.department || ""} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} required>
              <option value="">Select Department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
            <Input
              label="Join Date"
              type="date"
              value={editForm.join_date || ""}
              onChange={e => setEditForm(f => ({ ...f, join_date: e.target.value }))}
              required
            />
            <Select
              id="edit-manager"
              label="Assign Manager"
              value={editForm.manager_id || ""}
              onChange={e => setEditForm(f => ({ ...f, manager_id: e.target.value }))}
            >
              <option value="">None</option>
              {managerOptions.map(m => (
                <option key={m.id} value={m.id}>
                  {m.fname} {m.lname}
                </option>
              ))}
            </Select>
            <div className="flex gap-4 justify-end mt-4">
              <Button variant="outline" type="button" onClick={() => setShowEditModal(null)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={!!selectedIntern}
        onClose={() => setSelectedIntern(null)}
        title={selectedIntern ? `${selectedIntern.fname} ${selectedIntern.lname} Details` : ""}
      >
        {selectedIntern && (
          <div className="flex flex-col gap-2 text-sm">
            <div>
              <span className="font-semibold">Full Name:</span> {selectedIntern.fname} {selectedIntern.lname}
            </div>
            <div>
              <span className="font-semibold">Email:</span> {selectedIntern.email}
            </div>
            <div>
              <span className="font-semibold">Phone:</span> {selectedIntern.phone}
            </div>
            <div>
              <span className="font-semibold">Manager:</span> {selectedIntern.manager_id
                ? (() => {
                  const mgr = interns.find(emp => emp.id === selectedIntern.manager_id);
                  return mgr ? `${mgr.fname} ${mgr.lname}` : "—";
                })()
                : "—"}
            </div>
            <div>
              <span className="font-semibold">Education:</span> {selectedIntern.personalDetail.highest_education}
            </div>
            {/* ...rest of details as needed */}
            {/* Verification status removed from details view per request */}
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ActiveInterns;
