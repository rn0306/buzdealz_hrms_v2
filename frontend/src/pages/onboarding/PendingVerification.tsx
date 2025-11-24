import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import Input from "../../components/ui/Input";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";

type Candidate = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  source?: string;
  current_stage?: string;
  fname?: string;
  personalDetails?: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
  adharCardDetails?: {
    adharNumber?: string;
    adharName?: string;
  };
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
  educationDetails?: {
    highestQualification?: string;
    university?: string;
    passingYear?: string;
  };
  previousExperience?: {
    companyName?: string;
    role?: string;
    duration?: string;
  };
  otherDocuments?: string;
  joiningDate?: string | null;
  confirmationDate?: string | null;
  verificationStatus?: "Pending" | "VERIFIED" | "REJECTED";
  rejectComment?: string;

  // Internship fields (may come from PersonalDetail / user)
  work_type?: string;
  internship_duration_months?: number | null;
  internship_duration_days?: number | null;
  stipend?: number | null;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body_html: string;
};

// Helper: format Date -> yyyy-MM-dd
function formatDateYMD(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper: calculate internship end date from joining date + months/days
function calculateInternshipEndDate(
  joiningDateStr?: string,
  monthsStr?: string,
  daysStr?: string
): string {
  if (!joiningDateStr) return "";
  try {
    const joining = new Date(joiningDateStr);
    if (isNaN(joining.getTime())) return "";

    const months = monthsStr && monthsStr.trim() !== "" ? Number(monthsStr) : 0;
    const days = daysStr && daysStr.trim() !== "" ? Number(daysStr) : 0;

    const end = new Date(joining);
    if (months > 0) end.setMonth(end.getMonth() + months);
    if (days > 0) end.setDate(end.getDate() + days);

    return formatDateYMD(end);
  } catch {
    return "";
  }
}

export default function PendingVerification() {
  const [rows, setRows] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [openViewId, setOpenViewId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [confirmationDate, setConfirmationDate] = useState("");
  const [query, setQuery] = useState("");

  const [selectedCandidate, setSelectedCandidate] =
    useState<Candidate | null>(null);
  const [action, setAction] =
    useState<"VERIFIED" | "REJECTED" | null>(null);

  // Internship editable states
  const [internWorkType, setInternWorkType] = useState("");
  const [internMonths, setInternMonths] = useState("");
  const [internDays, setInternDays] = useState("");
  const [internStipend, setInternStipend] = useState("");

  // ✉ Mail dialog states
  const [openMailDialog, setOpenMailDialog] = useState(false);
  const [mailCandidate, setMailCandidate] = useState<Candidate | null>(null);
  const [sendingMail, setSendingMail] = useState(false);

  const [openOfferDialog, setOpenOfferDialog] = useState(false);
  const [offerUrl, setOfferUrl] = useState<string | null>(null);
  const [loadingOffer, setLoadingOffer] = useState(false);

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] =
    useState<string | null>(null);
  const [selectedEmailTemplate, setSelectedEmailTemplate] =
    useState<EmailTemplate | null>(null);

  const [attachOffer, setAttachOffer] = useState(true);

  // Filter results
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter((r) =>
      [r.full_name, r.email, r.phone, r.source, r.verificationStatus].some(
        (v) => (v || "").toString().toLowerCase().includes(q)
      )
    );
  }, [rows, query]);

  // Fetch candidates
  async function fetchRows() {
    setLoading(true);
    try {
      const res = await api.get("/api/personaldetails/filled");
      const normalizeVerification = (v: any) => {
        if (!v) return undefined;
        const s = String(v).trim().toUpperCase();
        if (s.includes("VERIFIED")) return "VERIFIED";
        if (s.includes("REJECT")) return "REJECTED";
        if (s.includes("PEND")) return "Pending";
        return v;
      };

      const normalized = (res.data || []).map((r: any) => {
        const user = r.user || {};
        return {
          id: user.id || r.user_id,
          full_name:
            `${user.fname || ""} ${user.mname || ""} ${user.lname || ""}`.trim() ||
            "-",
          fname: user.fname || "",
          email: user.email || "-",
          phone: user.phone || "-",
          source: r.source,
          verificationStatus: normalizeVerification(r.verification_status),
          joiningDate: user.joining_date || r.joining_date || null,
          confirmationDate: user.confirmation_date || r.confirmation_date || null,
          personalDetails: {
            fullName:
              `${user.fname || ""} ${user.mname || ""} ${user.lname || ""}`.trim() ||
              "-",
            email: user.email || "-",
            phone: user.phone || "-",
          },
          adharCardDetails: {
            adharNumber: r.adhar_card_no || "-",
            adharName: user.fname || "-",
          },
          bankDetails: {
            bankName: r.bank_name || "-",
            accountNumber: r.account_no || "-",
            ifscCode: r.ifsc_code || "-",
          },
          educationDetails: {
            highestQualification: r.highest_education || "-",
            university: r.university_name || "-",
            passingYear: r.passing_year || "-",
          },
          previousExperience: {
            companyName: r.last_company_name || "-",
            role: r.role_designation || "-",
            duration: r.duration || "-",
          },
          otherDocuments: r.other_documents_url || "-",

          // internship fields from backend (if present on personal detail / user)
          work_type: r.work_type || "",
          internship_duration_months:
            r.internship_duration_months !== undefined
              ? Number(r.internship_duration_months)
              : null,
          internship_duration_days:
            r.internship_duration_days !== undefined
              ? Number(r.internship_duration_days)
              : null,
          stipend:
            r.stipend !== undefined && r.stipend !== null
              ? Number(r.stipend)
              : null,
        } as Candidate;
      });

      setRows(normalized);
    } catch (err) {
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRows();
  }, []);

  // Format dates
  function formatToDateTimeLocal(d?: string | null) {
    if (!d) return "";
    try {
      if (d.includes("T")) return d.slice(0, 16);
      if (d.length === 10) return `${d}T00:00`;
      return new Date(d).toISOString().slice(0, 16);
    } catch {
      return "";
    }
  }

  // View candidate details
  function openView(candidate: Candidate) {
    setSelectedCandidate(candidate);
    setRejectComment(candidate.rejectComment || "");

    setJoiningDate(
      candidate.joiningDate ? String(candidate.joiningDate).slice(0, 10) : ""
    );
    setConfirmationDate(
      formatToDateTimeLocal(candidate.confirmationDate || null)
    );
    setOpenViewId(candidate.id);
    setAction(null);

    // internship local state
    setInternWorkType(candidate.work_type || "");
    setInternMonths(
      candidate.internship_duration_months != null
        ? String(candidate.internship_duration_months)
        : ""
    );
    setInternDays(
      candidate.internship_duration_days != null
        ? String(candidate.internship_duration_days)
        : ""
    );
    setInternStipend(
      candidate.stipend != null ? String(candidate.stipend) : ""
    );
  }

  function closeView() {
    setOpenViewId(null);
    setSelectedCandidate(null);
    setRejectComment("");
    setJoiningDate("");
    setConfirmationDate("");
    setAction(null);
    setInternWorkType("");
    setInternMonths("");
    setInternDays("");
    setInternStipend("");
  }

  // Save candidate verification
  async function handleSave() {
    if (!selectedCandidate) return;

    if (!action) {
      toast.error("Please select an action (Verify / Reject)");
      return;
    }

    const monthsNum =
      internMonths && internMonths.trim() !== ""
        ? Number(internMonths)
        : undefined;
    const daysNum =
      internDays && internDays.trim() !== ""
        ? Number(internDays)
        : undefined;
    const stipendNum =
      internStipend && internStipend.trim() !== ""
        ? Number(internStipend)
        : undefined;
    const internshipEndDate = calculateInternshipEndDate(
      joiningDate,
      internMonths,
      internDays
    );

    if (action === "REJECTED" && rejectComment.trim() === "") {
      toast.error("Please enter rejection reason");
      return;
    }

    if (action === "VERIFIED") {
      if (!joiningDate) {
        toast.error("Please select joining date");
        return;
      }
      if (!internWorkType.trim()) {
        toast.error("Please enter Work Type");
        return;
      }
      if (!stipendNum || stipendNum <= 0) {
        toast.error("Please enter stipend");
        return;
      }
    }

    try {
      let confirmationToSend: string | null = null;

      if (action === "VERIFIED") {
        if (confirmationDate && confirmationDate.includes("T")) {
          confirmationToSend = new Date(confirmationDate).toISOString();
        } else {
          confirmationToSend = new Date().toISOString();
        }
      }

      await api.post(
        `/api/onboarding/verify-and-update/${selectedCandidate.id}`,
        {
          verificationStatus: action,
          rejectComment: action === "REJECTED" ? rejectComment.trim() : "",
          joiningDate: action === "VERIFIED" ? joiningDate : null,
          confirmationDate: confirmationToSend,

          // internship fields
          work_type: internWorkType || null,
          internship_duration_months: monthsNum,
          internship_duration_days: daysNum,
          stipend: stipendNum,
          internship_end_date: internshipEndDate || null,
        }
      );

      toast.success("Updated successfully");
      closeView();
      fetchRows();
    } catch {
      toast.error("Failed to update");
    }
  }

  // Open mail dialog
  async function openMail(row: Candidate) {
    setMailCandidate(row);
    setOpenMailDialog(true);

    try {
      const res = await api.get("/api/email-templates");
      const templates = res.data?.data || [];
      setEmailTemplates(templates);
      setSelectedEmailTemplateId(null);
      setSelectedEmailTemplate(null);
    } catch {
      toast.error("Failed to load email templates");
    }
  }

  // Handle email template selection
  function handleEmailTemplateSelect(id: string) {
    setSelectedEmailTemplateId(id);
    const temp = emailTemplates.find((t) => t.id === id) || null;
    setSelectedEmailTemplate(temp);
  }

  // Send email (with or without offer letter)
  async function sendOfferFromDialog() {
    if (!mailCandidate) return;

    setSendingMail(true);
    try {
      if (attachOffer) {
        await api.post("/api/documents/send-offer-letter", {
          user_id: mailCandidate.id,
          email_template_id: selectedEmailTemplateId,
          recipient_email: mailCandidate.email,
          data: {
            full_name: mailCandidate.full_name,
            email: mailCandidate.email,
            phone: mailCandidate.phone,
            designation: "Intern",
            joining_date: mailCandidate.joiningDate || "",
          },
          attachOfferLetter: true,
        });
        toast.success("Offer Letter sent successfully");
      } else {
        await api.post("/api/email-templates/send", {
          template_id: selectedEmailTemplateId,
          recipient_email: mailCandidate.email,
          recipient_name: mailCandidate.full_name,
          data: {
            full_name: mailCandidate.full_name,
            email: mailCandidate.email,
            phone: mailCandidate.phone || "",
          },
        });
        toast.success("Email sent");
      }
      setOpenMailDialog(false);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to send email"
      );
    } finally {
      setSendingMail(false);
    }
  }

  // Open offer preview
  async function openOfferLetter(row: Candidate) {
    setLoadingOffer(true);
    setOfferUrl(null);

    try {
      const res = await api.get(`/api/onboarding/offer/${row.id}`);
      const url =
        res.data?.data?.offer_url ||
        res.data?.data?.offerUrl ||
        null;

      if (!url) {
        toast.error("Offer letter not generated yet.");
        setLoadingOffer(false);
        return;
      }

      setOfferUrl(url);
      setOpenOfferDialog(true);
    } catch (err) {
      toast.error("Failed to load offer letter");
    } finally {
      setLoadingOffer(false);
    }
  }

  const internshipEndDatePreview = calculateInternshipEndDate(
    joiningDate,
    internMonths,
    internDays
  );

  return (
    <section className="max-w-7xl mx-auto p-6 space-y-8 bg-gray-50 rounded-2xl shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Pending Verification
        </h1>

        <div className="flex items-center gap-3">
          <Input
            placeholder="Search candidates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="px-4 py-2 border"
          />
          <Button onClick={fetchRows} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <Table className="min-w-full">
          <THead className="bg-indigo-50">
            <TR>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Phone</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((r) => (
              <TR key={r.id}>
                <TD>{r.full_name}</TD>
                <TD>{r.email}</TD>
                <TD>{r.phone || "-"}</TD>
                <TD>{r.verificationStatus}</TD>
                <TD className="flex gap-2">
                  <Button onClick={() => openView(r)} variant="outline">
                    View
                  </Button>
                  <Button onClick={() => openMail(r)} variant="outline">
                    Send Mail
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openOfferLetter(r)}
                    className="inline-flex items-center gap-2 rounded-lg border border-green-600 px-3 py-1 text-green-600 hover:bg-green-100"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    View Offer
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      {/* CANDIDATE DETAILS + VERIFY DIALOG */}
      <Dialog
        open={!!openViewId}
        onClose={closeView}
        title={`Candidate: ${selectedCandidate?.full_name}`}
        className="max-w-5xl"
      >
        {selectedCandidate && (
          <form className="space-y-6 max-h-[80vh] overflow-y-auto px-2 sm:px-6 pb-6 text-gray-800">
            {/* Personal Details */}
            <section>
              <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">
                Personal Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <Input
                  readOnly
                  placeholder="Full Name"
                  value={
                    selectedCandidate.personalDetails?.fullName ||
                    selectedCandidate.full_name ||
                    "-"
                  }
                />
                <Input
                  readOnly
                  type="email"
                  placeholder="Email"
                  value={
                    selectedCandidate.personalDetails?.email ||
                    selectedCandidate.email ||
                    "-"
                  }
                />
                <Input
                  readOnly
                  placeholder="Phone"
                  value={
                    selectedCandidate.personalDetails?.phone ||
                    selectedCandidate.phone ||
                    "-"
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={joiningDate || ""}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmation Date
                  </label>
                  <input
                    type="datetime-local"
                    value={confirmationDate || ""}
                    onChange={(e) => setConfirmationDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-700"
                  />
                </div>
                <Input
                  readOnly
                  placeholder="Current Stage"
                  value={selectedCandidate.verificationStatus || "-"}
                />
              </div>
            </section>

            {/* Aadhaar Details */}
            <section>
              <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">
                Aadhaar Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Input
                  readOnly
                  placeholder="Aadhaar Number"
                  value={
                    selectedCandidate.adharCardDetails?.adharNumber || "-"
                  }
                />
                <Input
                  readOnly
                  placeholder="Name on Aadhaar"
                  value={
                    selectedCandidate.adharCardDetails?.adharName || "-"
                  }
                />
              </div>
            </section>

            {/* Bank Details */}
            <section>
              <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">
                Bank Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <Input
                  readOnly
                  placeholder="Bank Name"
                  value={selectedCandidate.bankDetails?.bankName || "-"}
                />
                <Input
                  readOnly
                  placeholder="Account Number"
                  value={
                    selectedCandidate.bankDetails?.accountNumber || "-"
                  }
                />
                <Input
                  readOnly
                  placeholder="IFSC Code"
                  value={selectedCandidate.bankDetails?.ifscCode || "-"}
                />
              </div>
            </section>

            {/* Education Details */}
            <section>
              <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">
                Education Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <Input
                  readOnly
                  placeholder="Highest Qualification"
                  value={
                    selectedCandidate.educationDetails
                      ?.highestQualification || "-"
                  }
                />
                <Input
                  readOnly
                  placeholder="University / Board"
                  value={
                    selectedCandidate.educationDetails?.university || "-"
                  }
                />
                <Input
                  readOnly
                  placeholder="Passing Year"
                  value={
                    selectedCandidate.educationDetails?.passingYear || "-"
                  }
                />
              </div>
            </section>

            {/* Experience Details */}
            <section>
              <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">
                Experience Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <Input
                  readOnly
                  placeholder="Company Name"
                  value={
                    selectedCandidate.previousExperience?.companyName ||
                    "-"
                  }
                />
                <Input
                  readOnly
                  placeholder="Role / Designation"
                  value={
                    selectedCandidate.previousExperience?.role || "-"
                  }
                />
                <Input
                  readOnly
                  placeholder="Duration"
                  value={
                    selectedCandidate.previousExperience?.duration || "-"
                  }
                />
              </div>
            </section>

            {/* Other Documents */}
            <section>
              <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">
                Other Documents
              </h2>
              <textarea
                readOnly
                rows={5}
                placeholder="Other document details or URLs"
                value={selectedCandidate.otherDocuments || "-"}
                className="w-full rounded-md border border-gray-300 px-4 py-3 mt-4 resize-y bg-gray-50 text-gray-700 focus:outline-none"
              />
            </section>

            {/* Internship Details (ALWAYS VISIBLE + EDITABLE) */}
            <section>
              <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">
                Internship Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Work Type"
                  placeholder="e.g., acquiring subscribers"
                  value={internWorkType}
                  onChange={(e) => setInternWorkType(e.target.value)}
                />
                <Input
                  label="Stipend (₹)"
                  type="number"
                  placeholder="Enter stipend amount"
                  value={internStipend}
                  onChange={(e) => setInternStipend(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <Input
                  label="Duration (Months)"
                  type="number"
                  placeholder="Months"
                  value={internMonths}
                  onChange={(e) => setInternMonths(e.target.value)}
                />
                <Input
                  label="Duration (Days)"
                  type="number"
                  placeholder="Days"
                  value={internDays}
                  onChange={(e) => setInternDays(e.target.value)}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calculated End Date
                  </label>
                  <div className="w-full rounded-md border border-gray-300 px-4 py-3 bg-gray-100 text-gray-700">
                    {internshipEndDatePreview || "Set joining date and duration"}
                  </div>
                </div>
              </div>
            </section>

            {/* Verification Section */}
            <section>
              <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">
                Verification Status
              </h2>
              <div className="flex items-center gap-3 mt-4">
                <span
                  className={`inline-block rounded-full px-4 py-1 text-sm font-semibold ${
                    selectedCandidate.verificationStatus === "VERIFIED"
                      ? "bg-green-200 text-green-800"
                      : selectedCandidate.verificationStatus === "REJECTED"
                      ? "bg-red-200 text-red-800"
                      : "bg-yellow-200 text-yellow-800"
                  }`}
                >
                  {selectedCandidate.verificationStatus || "Pending"}
                </span>
              </div>
              {selectedCandidate.verificationStatus === "REJECTED" &&
                selectedCandidate.rejectComment && (
                  <p className="mt-3 p-3 rounded-lg bg-red-100 text-red-700 whitespace-pre-wrap font-semibold">
                    Reject Comment: {selectedCandidate.rejectComment || "-"}
                  </p>
                )}
            </section>

            {/* Admin Action Section */}
            <section className="pt-6 border-t">
              <h2 className="text-lg font-semibold text-indigo-700 mb-4">
                Admin Action
              </h2>

              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-indigo-700">
                  Action
                </label>
                <select
                  value={action || ""}
                  onChange={(e) => {
                    const v = e.target.value as
                      | "VERIFIED"
                      | "REJECTED"
                      | "";
                    setAction(v || null);
                    if (v === "VERIFIED") {
                      if (!joiningDate)
                        setJoiningDate(
                          new Date().toISOString().slice(0, 10)
                        );
                      if (!confirmationDate)
                        setConfirmationDate(
                          new Date().toISOString().slice(0, 16)
                        );
                    }
                  }}
                  className="block w-full rounded-md border border-indigo-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-600"
                >
                  <option value="">-- Select action --</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="REJECTED">Reject</option>
                </select>
              </div>

              {action === "REJECTED" && (
                <div className="mb-6">
                  <label className="block mb-2 font-semibold text-indigo-700">
                    Reject Comment
                  </label>
                  <textarea
                    rows={4}
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    placeholder="Provide reason for rejection"
                    className="w-full rounded-md border border-indigo-300 px-4 py-3 text-lg resize-y focus:ring-2 focus:ring-indigo-400 focus:border-indigo-600"
                  />
                </div>
              )}

              <div className="flex justify-end gap-4 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={closeView}
                  className="rounded-lg px-6 py-3 text-indigo-600 font-semibold shadow hover:bg-indigo-50 transition"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={
                    action === null ||
                    (action === "REJECTED" && rejectComment.trim() === "")
                  }
                  className="rounded-lg px-6 py-3 font-semibold shadow-lg bg-gradient-to-r from-indigo-600 to-blue-700 text-white hover:from-indigo-700 hover:to-blue-800 transition"
                >
                  Save
                </Button>
              </div>
            </section>
          </form>
        )}
      </Dialog>

      {/* SEND MAIL DIALOG */}
      <Dialog
        open={openMailDialog}
        onClose={() => setOpenMailDialog(false)}
        title={`Send Mail to ${mailCandidate?.full_name}`}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Email Template Selection */}
          <div>
            <label className="font-medium text-sm">Email Template</label>
            <select
              className="w-full border rounded px-3 py-2 mt-1"
              value={selectedEmailTemplateId || ""}
              onChange={(e) => handleEmailTemplateSelect(e.target.value)}
            >
              <option value="">-- Select Template --</option>
              {emailTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Email Template Preview */}
          {selectedEmailTemplate && (
            <div className="border rounded-md p-4 bg-gray-50">
              <h3 className="font-semibold text-indigo-700">Subject:</h3>
              <p className="mb-3">
                {selectedEmailTemplate.subject
                  .replace(
                    "{{full_name}}",
                    mailCandidate?.full_name || ""
                  )
                  .replace(
                    "{{email}}",
                    mailCandidate?.email || ""
                  )}
              </p>

              <h3 className="font-semibold text-indigo-700">
                Body Preview:
              </h3>
              <div
                className="prose text-sm mt-2"
                dangerouslySetInnerHTML={{
                  __html: selectedEmailTemplate.body_html
                    .replace(
                      "{{full_name}}",
                      mailCandidate?.full_name || ""
                    )
                    .replace(
                      "{{email}}",
                      mailCandidate?.email || ""
                    )
                    .replace(
                      "{{password}}",
                      (mailCandidate?.fname?.toLowerCase() || "") +
                        "123$"
                    ),
                }}
              />
            </div>
          )}

          {/* Attach Offer Letter Checkbox */}
          <div className="flex items-center gap-3 border-t pt-3">
            <input
              id="attachOffer"
              type="checkbox"
              checked={attachOffer}
              onChange={(e) => setAttachOffer(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="attachOffer" className="text-sm">
              Attach Offer Letter (PDF)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpenMailDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={sendOfferFromDialog}
              disabled={sendingMail}
              className="bg-blue-600 text-white"
            >
              {sendingMail
                ? "Sending..."
                : attachOffer
                  ? "Send Offer Letter"
                  : "Send Email"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Offer Letter Preview Modal */}
      <Dialog
        open={openOfferDialog}
        onClose={() => setOpenOfferDialog(false)}
        title="Offer Letter Preview"
        className="max-w-4xl w-full"
      >
        <div className="space-y-4">
          {loadingOffer && (
            <p className="text-center text-gray-600 py-4">
              Loading Offer Letter...
            </p>
          )}

          {!loadingOffer && offerUrl && (
            <div
              className="border rounded-md overflow-hidden"
              style={{ height: "75vh" }}
            >
              <iframe
                src={offerUrl}
                className="w-full h-full"
                title="Offer Letter PDF"
              />
            </div>
          )}

          {!loadingOffer && !offerUrl && (
            <p className="text-center text-red-600 font-semibold">
              Offer Letter not available.
            </p>
          )}

          <div className="flex justify-end pt-3">
            <Button
              variant="outline"
              onClick={() => setOpenOfferDialog(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
