import {
  MdAdd,
  MdAdminPanelSettings,
  MdArrowBack,
  MdArrowForward,
  MdBlock,
  MdCalendarMonth,
  MdCheck,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdDashboard,
  MdDelete,
  MdDownload,
  MdEdit,
  MdFilterList,
  MdHelp,
  MdHelpOutline,
  MdLock,
  MdLogout,
  MdMail,
  MdMoreVert,
  MdPayments,
  MdPerson,
  MdPersonAdd,
  MdPhotoCamera,
  MdReceiptLong,
  MdSearch,
  MdSettings,
  MdShoppingBag,
  MdVerified,
  MdVerifiedUser,
  MdVideocam,
  MdVisibility,
  MdVisibilityOff,
  MdZoomIn,

  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";

const iconRegistry = {
  add: MdAdd,
  arrow_back: MdArrowBack,
  arrow_forward: MdArrowForward,
  block: MdBlock,
  calendar_month: MdCalendarMonth,
  check: MdCheck,
  chevron_left: MdChevronLeft,
  chevron_right: MdChevronRight,
  close: MdClose,
  dashboard: MdDashboard,
  delete: MdDelete,
  download: MdDownload,
  edit: MdEdit,
  filter_list: MdFilterList,
  help: MdHelp,
  help_outline: MdHelpOutline,
  lock: MdLock,
  lock_person: MdAdminPanelSettings,
  logout: MdLogout,
  mail: MdMail,
  more_vert: MdMoreVert,
  payments: MdPayments,
  person: MdPerson,
  person_add: MdPersonAdd,
  photo_camera: MdPhotoCamera,
  receipt: MdReceiptLong,
  search: MdSearch,
  settings: MdSettings,
  shopping_bag: MdShoppingBag,
  verified: MdVerified,
  verified_user: MdVerifiedUser,
  videocam: MdVideocam,
  visibility: MdVisibility,
  visibility_off: MdVisibilityOff,
  zoom_in: MdZoomIn,
  expand_more: MdExpandMore,
  expand_less: MdExpandLess,
};

export default function AppIcon({ name, size = 20, className = "", title }) {
  const Icon = iconRegistry[name];

  if (!Icon) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[AppIcon] Icon "${name}" belum terdaftar.`);
    }

    return null;
  }

  return (
    <Icon
      size={size}
      className={className}
      aria-hidden={title ? undefined : "true"}
      aria-label={title}
      focusable="false"
    />
  );
}
