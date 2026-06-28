"use client";

import { useState } from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import AppIcon from "@/components/global/AppIcon";

const menuConfig = [
  {
    label: "Dashboard",
    icon: "dashboard",
    href: "/admin/dashboard",
  },
  {
    label: "Jadwal",
    icon: "calendar_month",
    href: "/admin/schedules",
    children: [
      {
        label: "Manajemen Kru",
        href: "/admin/schedules/crews",
      },
    ],
  },
  {
    label: "Pesanan",
    icon: "shopping_bag",
    href: "/admin/orders",
    children: [
      {
        label: "Manajemen Paket",
        href: "/admin/orders/packages",
      },
    ],
  },
  {
    label: "Pembayaran",
    icon: "payments",
    href: "/admin/payments",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] =
    useState(false);

  /*
   * Parent hanya aktif ketika URL sama persis
   * dengan href parent.
   */
  const isParentActive = (menu) => {
    return pathname === menu.href;
  };

  /*
   * Mengecek apakah salah satu child sedang aktif.
   * startsWith dipakai agar sub-page di bawah child
   * juga tetap dianggap aktif.
   */
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

  /*
   * Submenu tetap terbuka ketika:
   * - parent aktif;
   * - salah satu child aktif;
   * - URL masih berada di area parent.
   */
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
        <div className="flex items-center gap-3 border-b border-outline-variant px-4 py-5">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface-container">
            <img
              src="https://i.pravatar.cc/100"
              className="h-full w-full object-cover"
              alt="Rafi Picture profile"
            />
          </div>

          <div
            className={`
              flex flex-col
              transition-all duration-300 ease-in-out
              ${
                collapsed
                  ? "w-0 translate-x-2 overflow-hidden opacity-0"
                  : "opacity-100"
              }
            `}
          >
            <span className="whitespace-nowrap font-label-md">
              Rafi Picture
            </span>

            <span className="whitespace-nowrap text-xs text-on-surface-variant">
              Admin Studio
            </span>
          </div>
        </div>

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
                {/* PARENT */}
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
                      {menu.label}
                    </span>
                  </div>

                  {!collapsed &&
                    menu.children && (
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

                {/* CHILDREN */}
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
                              key={
                                child.href
                              }
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
                                {
                                  child.label
                                }
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
            className={`
              flex w-full items-center gap-3
              rounded-lg px-3 py-3
              text-on-surface
              transition-colors
              hover:bg-surface-container
              ${
                collapsed
                  ? "justify-center"
                  : ""
              }
            `}
          >
            <AppIcon
              name="logout"
              size={20}
              className="shrink-0"
            />

            <span
              className={`
                font-label-md
                transition-all duration-200
                ${
                  collapsed
                    ? "w-0 overflow-hidden opacity-0"
                    : "opacity-100"
                }
              `}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* TOGGLE */}
      <button
        type="button"
        aria-label={
          collapsed
            ? "Expand sidebar"
            : "Collapse sidebar"
        }
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
    </>
  );
}

