"use client";

import { useState } from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import AppIcon from "@/components/global/AppIcon";
import ProfilePhotoEditor from "@/components/profile/ProfilePhotoEditor";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useOverlay } from "@/context/ui/OverlayContext";

const menuConfig = [
  {
    labelKey: "adminDashboard",
    icon: "dashboard",
    href: "/admin/dashboard",
  },
  {
    labelKey: "adminSchedules",
    icon: "calendar_month",
    href: "/admin/schedules",
  },
  {
    labelKey: "adminCrewManagement",
    icon: "groups",
    href: "/admin/schedules/crews",
  },
  {
    labelKey: "adminOrders",
    icon: "shopping_bag",
    href: "/admin/orders",
  },
  {
    labelKey: "adminPackageManagement",
    icon: "inventory_2",
    href: "/admin/orders/packages",
  },
  {
    labelKey: "adminPayments",
    icon: "payments",
    href: "/admin/payments",
  },
];

function getInitials(value) {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "RP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Sidebar() {
  const { language, setLanguage, translate } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const {
    user,
    userDoc,
    authLoading,
    logout,
  } = useAuth();

  const {
    openOverlay,
    closeOverlay,
  } = useOverlay();

  const [collapsed, setCollapsed] =
    useState(false);

  const displayName =
    userDoc?.username ||
    userDoc?.fullName ||
    user?.displayName ||
    "Rafi Picture";

  const photoURL =
    userDoc?.photoURL ||
    user?.photoURL ||
    null;

  const isParentActive = (menu) => {
    return pathname === menu.href;
  };

  const getActiveChild = (menu) => {
    if (!menu.children) return null;

    return (
      menu.children.find(
        (child) =>
          pathname === child.href ||
          pathname.startsWith(
            `${child.href}/`,
          ),
      ) ?? null
    );
  };

  const isSubmenuOpen = (menu) => {
    if (!menu.children) return false;

    return (
      pathname === menu.href ||
      pathname.startsWith(
        `${menu.href}/`,
      )
    );
  };

  const handleParentClick = (menu) => {
    router.push(menu.href);
  };

  const handleChildClick = (href) => {
    router.push(href);
  };

  const handleOpenProfilePhoto = () => {
    if (!user) return;

    openOverlay({
      closeOnBackdrop: true,
      closeOnEscape: true,
      className: "p-3 sm:p-6",
      content: (
        <ProfilePhotoEditor
          user={user}
          currentPhotoURL={photoURL}
          displayName={displayName}
          onClose={closeOverlay}
        />
      ),
    });
  };

  const handleLogout = async () => {
    if (authLoading) return;

    try {
      await logout();
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error(
        "ADMIN SIDEBAR LOGOUT ERROR:",
        error,
      );
    }
  };

  return (
    <>
      <aside
        className={`
          fixed left-0 top-0 z-40
          flex h-screen flex-col
          border-r border-outline-variant
          bg-surface-container-low
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-20" : "w-64"}
        `}
      >
        {/* PROFILE */}
        <button
          type="button"
          onClick={handleOpenProfilePhoto}
          className={`flex items-center gap-3 border-b border-outline-variant px-4 py-5 text-left transition-colors hover:bg-surface-container ${collapsed ? "justify-center" : ""}`}
          title={translate("changePhoto")}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-high font-label-md text-label-md text-primary">
            {photoURL ? (
              <img
                src={photoURL}
                className="h-full w-full object-cover"
                alt={`Foto profil ${displayName}`}
              />
            ) : (
              getInitials(displayName)
            )}
          </div>

          <div
            className={`
              flex min-w-0 flex-col
              transition-all duration-300 ease-in-out
              ${
                collapsed
                  ? "w-0 translate-x-2 overflow-hidden opacity-0"
                  : "opacity-100"
              }
            `}
          >
            <span className="truncate whitespace-nowrap font-label-md">
              {displayName}
            </span>

            <span className="whitespace-nowrap text-xs text-on-surface-variant">
              {translate("adminStudio")} · {translate("changePhoto")}
            </span>
          </div>
        </button>

        {/* MENU */}
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {menuConfig.map((menu) => {
            const parentActive =
              isParentActive(menu);

            const activeChild =
              getActiveChild(menu);

            const submenuOpen =
              isSubmenuOpen(menu);

            return (
              <div key={menu.href}>
                <button
                  type="button"
                  onClick={() =>
                    handleParentClick(menu)
                  }
                  className={`
                    flex w-full items-center gap-3
                    rounded-lg px-3 py-3
                    transition-all duration-200
                    ${
                      parentActive
                        ? "bg-primary text-on-primary"
                        : "text-on-surface hover:bg-surface-container"
                    }
                    ${
                      collapsed
                        ? "justify-center"
                        : "justify-between"
                    }
                  `}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <AppIcon
                      name={menu.icon}
                      size={20}
                      className="shrink-0"
                    />

                    <span
                      className={`
                        whitespace-nowrap font-label-md
                        transition-all duration-200
                        ${
                          collapsed
                            ? "w-0 overflow-hidden opacity-0"
                            : "opacity-100"
                        }
                      `}
                    >
                      {translate(menu.labelKey)}
                    </span>
                  </div>

                  {!collapsed && menu.children && (
                    <AppIcon
                      name={
                        submenuOpen
                          ? "expand_less"
                          : "expand_more"
                      }
                      size={18}
                      className="shrink-0"
                    />
                  )}
                </button>

                {!collapsed &&
                  menu.children &&
                  submenuOpen && (
                    <div className="ml-6 mt-1 flex flex-col gap-1 overflow-hidden border-l border-outline-variant pl-3">
                      {menu.children.map(
                        (child) => {
                          const childActive =
                            activeChild?.href ===
                            child.href;

                          return (
                            <button
                              key={child.href}
                              type="button"
                              onClick={() =>
                                handleChildClick(
                                  child.href,
                                )
                              }
                              className={`
                                rounded-lg px-3 py-2
                                text-left transition-all
                                ${
                                  childActive
                                    ? "bg-primary text-on-primary"
                                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                                }
                              `}
                            >
                              <span className="font-label-sm">
                                {translate(child.labelKey)}
                              </span>
                            </button>
                          );
                        },
                      )}
                    </div>
                  )}
              </div>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="border-t border-outline-variant p-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={authLoading}
            className={`
              flex w-full items-center gap-3
              rounded-lg px-3 py-3
              text-on-surface
              transition-colors
              hover:bg-surface-container
              disabled:cursor-not-allowed
              disabled:opacity-50
              ${collapsed ? "justify-center" : ""}
            `}
          >
            <AppIcon
              name="logout"
              size={20}
              className="shrink-0"
            />

            <span
              className={`
                whitespace-nowrap font-label-md
                transition-all duration-200
                ${
                  collapsed
                    ? "w-0 overflow-hidden opacity-0"
                    : "opacity-100"
                }
              `}
            >
              {authLoading
                ? translate("loggingOut")
                : translate("logout")}
            </span>
          </button>
        </div>
      </aside>

      {/* TOGGLE */}
      <button
        type="button"
        aria-label={translate(collapsed ? "expandSidebar" : "collapseSidebar")}
        onClick={() =>
          setCollapsed(
            (current) => !current,
          )
        }
        className="
          fixed top-6 z-50
          flex h-10 w-8
          items-center justify-center
          rounded-r-full
          bg-black text-white
          shadow-lg
          transition-all duration-300
        "
        style={{
          left: collapsed
            ? "5rem"
            : "16rem",
        }}
      >
        <AppIcon
          name={
            collapsed
              ? "chevron_right"
              : "chevron_left"
          }
          size={20}
        />
      </button>

      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-low p-1 shadow-lg">
        <button
          type="button"
          onClick={() => setLanguage("id")}
          className={`rounded px-2 py-1 text-xs font-semibold ${language === "id" ? "bg-primary text-on-primary" : "text-on-surface-variant"}`}
        >
          ID
        </button>
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={`rounded px-2 py-1 text-xs font-semibold ${language === "en" ? "bg-primary text-on-primary" : "text-on-surface-variant"}`}
        >
          EN
        </button>
      </div>
    </>
  );
}
