import {
  MdAccessTime,
  MdAdd,
  MdAdminPanelSettings,
  MdArrowBack,
  MdArrowForward,
  MdAutoAwesome,
  MdBlock,
  MdCalendarMonth,
  MdCancel,
  MdCheck,
  MdCheckCircle,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdConfirmationNumber,
  MdDashboard,
  MdDelete,
  MdDownload,
  MdEdit,
  MdEvent,
  MdExpandLess,
  MdExpandMore,
  MdFilterList,
  MdGroups,
  MdHelp,
  MdHelpOutline,
  MdHourglassTop,
  MdInfoOutline,
  MdLocationOn,
  MdLock,
  MdLogout,
  MdMail,
  MdMoreVert,
  MdPayments,
  MdPendingActions,
  MdPerson,
  MdPersonAdd,
  MdPhotoCamera,
  MdReceiptLong,
  MdSchedule,
  MdSearch,
  MdSettings,
  MdShoppingBag,
  MdTaskAlt,
  MdVerified,
  MdVerifiedUser,
  MdVideocam,
  MdVisibility,
  MdVisibilityOff,
  MdZoomIn,
} from "react-icons/md";

const iconRegistry = {
  access_time: MdAccessTime,
  add: MdAdd,
  arrow_back: MdArrowBack,
  arrow_forward: MdArrowForward,
  auto_awesome: MdAutoAwesome,
  block: MdBlock,
  calendar_month: MdCalendarMonth,
  cancel: MdCancel,
  check: MdCheck,
  check_circle: MdCheckCircle,
  chevron_left: MdChevronLeft,
  chevron_right: MdChevronRight,
  close: MdClose,
  confirmation_number:
    MdConfirmationNumber,
  dashboard: MdDashboard,
  delete: MdDelete,
  download: MdDownload,
  edit: MdEdit,
  event: MdEvent,
  expand_less: MdExpandLess,
  expand_more: MdExpandMore,
  filter_list: MdFilterList,
  groups: MdGroups,
  help: MdHelp,
  help_outline: MdHelpOutline,
  hourglass_top: MdHourglassTop,
  info: MdInfoOutline,
  info_outline: MdInfoOutline,
  location_on: MdLocationOn,
  lock: MdLock,
  lock_person:
    MdAdminPanelSettings,
  logout: MdLogout,
  mail: MdMail,
  more_vert: MdMoreVert,
  payments: MdPayments,
  pending_actions:
    MdPendingActions,
  person: MdPerson,
  person_add: MdPersonAdd,
  photo_camera: MdPhotoCamera,
  receipt: MdReceiptLong,
  receipt_long: MdReceiptLong,
  schedule: MdSchedule,
  search: MdSearch,
  settings: MdSettings,
  shopping_bag: MdShoppingBag,
  task_alt: MdTaskAlt,
  verified: MdVerified,
  verified_user: MdVerifiedUser,
  videocam: MdVideocam,
  visibility: MdVisibility,
  visibility_off: MdVisibilityOff,
  zoom_in: MdZoomIn,
};

export default function AppIcon({
  name,
  size = 20,
  className = "",
  title,
}) {
  const Icon =
    iconRegistry[name];

  if (!Icon) {
    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.warn(
        `[AppIcon] Icon "${name}" belum terdaftar.`,
      );
    }

    return null;
  }

  return (
    <Icon
      size={size}
      className={className}
      aria-hidden={
        title
          ? undefined
          : "true"
      }
      aria-label={title}
      focusable="false"
    />
  );
}
