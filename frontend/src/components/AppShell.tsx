"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  Users,
  CreditCard,
  Settings,
  CircleHelp,
  PanelLeft,
  Search,
  Bell,
  ChevronDown,
} from "lucide-react";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutGrid },
    { label: "Invoice", href: "/invoices", icon: FileText },
    { label: "Clients", href: "/clients", icon: Users },
    { label: "Payments", href: "/invoices", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen flex bg-[#FAF9F6] text-gray-900 font-sans antialiased">
      {/* Left Sidebar */}
      <aside className="w-60 bg-[#FAF9F6] border-r border-[#EAE8E4] flex flex-col justify-between min-h-screen shrink-0 sticky top-0 h-screen">
        <div>
          {/* Top Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-[#EAE8E4]">
            <Link href="/" className="flex items-center gap-2.5 group">
              {/* SAPI Orange Logo Icon */}
              <div className="w-6 h-6 rounded-md bg-[#C85228] flex flex-col justify-center gap-[2.5px] px-1.5 py-1 text-white shadow-xs">
                <span className="h-[2px] w-full bg-white rounded-full block"></span>
                <span className="h-[2px] w-2/3 bg-white rounded-full block"></span>
                <span className="h-[2px] w-full bg-white rounded-full block"></span>
              </div>
              <span className="text-base font-bold tracking-tight text-gray-900">SAPI</span>
            </Link>
            <button
              type="button"
              aria-label="Toggle sidebar"
              className="p-1 rounded-md text-gray-500 hover:text-gray-800 hover:bg-[#F3F2EE] transition-colors"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-[#FBECE5] text-[#C85228] font-medium rounded-lg"
                      : "text-gray-600 hover:text-gray-900 hover:bg-[#F3F2EE] font-medium rounded-lg"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-[#C85228]" : "text-gray-500"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div>
          <div className="p-3 space-y-1">
            <Link
              href="/settings"
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === "/settings"
                  ? "bg-[#FBECE5] text-[#C85228]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-[#F3F2EE]"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0 text-gray-500" />
              <span>Settings</span>
            </Link>
            <Link
              href="/help"
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === "/help"
                  ? "bg-[#FBECE5] text-[#C85228]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-[#F3F2EE]"
              }`}
            >
              <CircleHelp className="w-4 h-4 shrink-0 text-gray-500" />
              <span>Help Center</span>
            </Link>
          </div>

          {/* User Profile Bar */}
          <div className="border-t border-[#EAE8E4] p-3">
            <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#F3F2EE] cursor-pointer transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#FADCD0] text-[#C85228] font-semibold text-xs flex items-center justify-center shrink-0">
                  JO
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-semibold text-gray-900 truncate leading-tight">
                    Jude Ogbuagalaba
                  </p>
                  <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">
                    jude@sapi.com
                  </p>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-[#FAF9F6] border-b border-[#EAE8E4] px-8 flex items-center justify-between sticky top-0 z-10">
          {/* Search Input */}
          <div className="relative w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-[#F3F2EE] border border-[#E5E4DF] rounded-lg pl-9 pr-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#C85228] transition-colors"
            />
          </div>

          {/* Right actions: Bell + Business Switcher */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Notifications"
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-[#F3F2EE] transition-colors"
            >
              <Bell className="w-4 h-4" />
            </button>

            <div className="bg-[#F3F2EE] border border-[#E5E4DF] px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-[#ECEBE6] transition-colors">
              <span className="w-5 h-5 rounded bg-[#F8DDD1] text-[#C85228] text-xs font-bold flex items-center justify-center">
                L
              </span>
              <span className="text-sm font-medium text-gray-800">Business Name</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
