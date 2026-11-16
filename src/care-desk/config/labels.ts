export const defaultWidgetLabels = {
  widgetOpen: "Help",
  widgetClose: "Close",
  widgetFormTitle: "How can we help?",
  widgetFormHint: "We usually reply within a day.",
  widgetSuccessTitle: "All set!",
  widgetSuccessHint: "We've got your request.",
  widgetLoginTitle: "Sign in required",
  widgetLoginHint: "Your session has expired.",
  widgetLoginBody: "Please sign in to contact support.",
  widgetSuccessHeading: "Request submitted",
  widgetSuccessBody:
    "Your request {number} has been received. Our team will contact you soon.",
  widgetSubmitAnother: "Submit another",
  widgetCategoryLabel: "Category",
  widgetSubjectLabel: "Subject",
  widgetSubjectPlaceholder: "Short summary of the issue",
  widgetDescriptionLabel: "Description",
  widgetDescriptionPlaceholder: "Describe your problem in detail...",
  widgetSubmit: "Submit request",
  widgetSending: "Sending...",
  widgetRetry: "Retry",
  widgetErrCategoriesLoad: "Couldn't load categories.",
  widgetErrGeneric: "Something went wrong. Please try again.",
  widgetErrCategoryRequired: "Please choose a category.",
  widgetErrCategoryUnavailable:
    "That category is no longer available. Please choose another one.",
  widgetErrSubjectRequired: "Please enter the subject",
  widgetErrSubjectTooLong: "Subject is too long",
  widgetErrDescriptionRequired: "Please enter the description",
  widgetErrDescriptionTooLong: "Description is too long",
};

export type WidgetLabels = { [K in keyof typeof defaultWidgetLabels]: string };

export const defaultDashboardLabels = {
  navTickets: "Tickets",
  navOverview: "Overview",
  navSettings: "Settings",
  navProfile: "Profile",
  navSignOut: "Sign Out",
  navOpenSidebar: "Open sidebar",
  navCloseSidebar: "Close sidebar",
  navSidebarAria: "Sidebar",
  navBackToPortal: "Back to site",

  ticketsTitle: "All tickets",
  ticketsSearchPlaceholder: "Search tickets...",
  ticketsFilterStatusAll: "Status: All",
  ticketsFilterPriorityAll: "Priority: All",
  ticketsFilterCategoryAll: "Category: All",
  ticketsFilterAssignedAll: "Assigned: All",
  ticketsEmpty: "No tickets.",
  ticketsAccessDenied: "You don't have operator access to Care Desk.",

  detailBackToTickets: "← Back to tickets",
  detailNotFound: "Ticket not found.",
  detailOpenedAt: "Opened {date}",
  detailNotesTitle: "Notes & actions",
  detailNotesEmpty:
    'No notes yet. Log your contact actions here (e.g. "called 28 Jul, left voicemail").',
  detailNoteSentToRequester: "Sent to requester",
  detailNotePlaceholder: "Add a note or action...",
  detailAddNote: "Add note",
  detailReadOnlyHint:
    "Only the assigned operator or an admin can update this ticket.",
  detailProfilePhone: "Phone",
  detailTriageTitle: "Triage",
  detailStatusCommentLabel: "Comment to the requester (sent by email)",
  detailSend: "Send",
  detailCommentRequired: "A comment is required to send the change.",
  detailNoCategory: "No category",
  detailAssigneeAdminOnly: "Only admins can change the assignee",
  detailNoDueDate: "No due date",
  detailDownloadRecord: "Download full record",

  overviewExportExcel: "Export Excel",
  overviewStatOpened: "Opened",
  overviewStatResolved: "Resolved",
  overviewStatClosed: "Closed",
  overviewStatAvgResolution: "Avg resolution",
  overviewByStatus: "By status",
  overviewByPriority: "By priority",
  overviewByCategory: "By category",
  overviewByOperator: "By operator",
  overviewNoAssigned: "No assigned tickets in this period.",
  overviewNoData: "No data.",

  settingsDescription:
    "Care Desk is an internal support system. Employees submit requests through the in-app widget without leaving the page. Each request becomes a numbered ticket, routed to a category and given a priority, then worked through open, pending, resolved and closed. Operators can add internal notes, set due dates, and export any date range to a spreadsheet. Available in {count} languages.",
  settingsLocalesTitle: "Locales",
  settingsDefaultBadge: "default",
  settingsBrandingTitle: "Branding",
  settingsPrimaryColor: "Primary color",
  settingsFontFamily: "Font family",

  categoriesTitle: "Categories",
  categoriesEmpty: "No categories yet.",
  categoriesEmptyManage: "No categories yet. Add one below.",
  categoriesShownInWidget: "Shown in widget",
  categoriesHiddenFromWidget: "Hidden from widget",
  categoriesActionShow: "Show in widget",
  categoriesActionHide: "Hide from widget",
  categoriesShowInWidgetAria: "Show {name} in widget",
  categoriesArchive: "Archive",
  categoriesArchiving: "Archiving...",
  categoriesArchiveAria: "Archive {name}",
  categoriesNewPlaceholder: "New category",
  categoriesNewAria: "New category name",
  categoriesAdd: "Add",
  categoriesAdding: "Adding...",
  categoriesHintManage:
    "New categories start hidden from the widget. Hidden categories can still be set by operators. Archived categories stay on existing tickets but can no longer be chosen.",
  categoriesHintReadOnly: "Only admins can change categories.",
  categoriesErrLoad: "Could not load categories",
  categoriesErrUpdate: "Could not update categories",
  categoriesErrExists: "A category with this name already exists.",

  accountTitle: "Account",
  accountEmail: "Email",
  accountPhone: "Phone",
  accountRole: "Role",
  accountDepartment: "Department",
  accountPosition: "Position",
  accountLastSignIn: "Last sign-in",
  accountMyWork: "My work",
  accountOpenNow: "Open now",
  accountMyTicketsTitle: "My open and pending tickets",
  accountColUpdated: "Updated",
  accountNothingAssigned: "Nothing assigned to you right now.",

  statusOpen: "Open",
  statusPending: "Pending",
  statusResolved: "Resolved",
  statusClosed: "Closed",

  priorityLow: "Low",
  priorityMedium: "Medium",
  priorityHigh: "High",
  priorityUrgent: "Urgent",

  commonLoading: "Loading...",
  commonCancel: "Cancel",
  commonStatus: "Status",
  commonPriority: "Priority",
  commonCategory: "Category",
  commonAssignedTo: "Assigned to",
  commonTicketId: "Ticket ID",
  commonSubject: "Subject",
  commonDueDate: "Due date",
  commonContact: "Contact",
  commonUnassigned: "Unassigned",
  commonOperatorInactive: "{name} (inactive)",
  commonCategoryArchived: "{name} (archived)",
  commonOperator: "Operator",
  commonOperatorAccessRequired: "Operator access required.",
  commonFrom: "From",
  commonTo: "To",
  commonHandled: "Handled",
  commonAvgFirstAction: "Avg first action",
  commonUserFallback: "User",
  commonPickDate: "Pick a date",
  commonPrevMonth: "Previous month",
  commonNextMonth: "Next month",
  commonClear: "Clear",
  commonToday: "Today",

  errRequestFailed: "Request failed",
  errWithStatus: "{message} ({status})",
};

export type DashboardLabels = {
  [K in keyof typeof defaultDashboardLabels]: string;
};

const PLACEHOLDER_RE = /\{(\w+)\}/g;

function placeholdersOf(template: string): string[] {
  return Array.from(template.matchAll(PLACEHOLDER_RE), (m) => m[1]);
}

export function resolveLabels<T extends Record<string, string>>(
  defaults: T,
  source: unknown,
): T {
  const src =
    source !== null && typeof source === "object"
      ? (source as Record<string, unknown>)
      : {};
  const out: Record<string, string> = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const value = src[key];
    if (typeof value !== "string" || value.trim() === "") continue;
    const required = placeholdersOf(defaults[key]);
    if (required.some((p) => !value.includes(`{${p}}`))) continue;
    out[key] = value;
  }
  return out as T;
}

export function fmt(
  template: string,
  vars: Record<string, string | number | null | undefined>,
): string {
  return template.replace(PLACEHOLDER_RE, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) && vars[key] != null
      ? String(vars[key])
      : match,
  );
}
