"use client";

import { useState, useEffect } from "react";
import AppShell, {
  UserProfileData,
  WorkspaceItem,
  ThemeMode,
  applyThemeToDOM,
  normalizeProfile,
  compressImageFile,
} from "@/components/AppShell";
import {
  User,
  Building2,
  Bell,
  Shield,
  Check,
  Edit3,
  Wallet,
  KeyRound,
  Smartphone,
  Palette,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  Plus,
  MapPin,
  Trash2,
  Camera,
  Upload,
} from "lucide-react";

const COUNTRIES = [
  "Nigeria",
  "Kenya",
  "Ghana",
  "South Africa",
  "Rwanda",
  "Egypt",
  "United Kingdom",
  "United States",
  "Canada",
  "Other / Global",
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "profile" | "workspace" | "appearance" | "notifications" | "security"
  >("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingWorkspace, setIsEditingWorkspace] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");

  // New Workspace inline form state inside Settings
  const [showAddWorkspace, setShowAddWorkspace] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandCategory, setNewBrandCategory] = useState("Product & Engineering");
  const [newBrandWallet, setNewBrandWallet] = useState("");
  const [newBrandLogo, setNewBrandLogo] = useState("");

  const [profile, setProfile] = useState<UserProfileData>(() =>
    normalizeProfile({
      fullName: "",
      email: "",
      title: "",
      country: "Nigeria",
      workspaceName: "",
      stellarAddress: "",
      currency: "USDC (Stellar)",
      onboarded: true,
    })
  );

  const workspaceList: WorkspaceItem[] = profile.workspaces ?? [];

  const [notifPrefs, setNotifPrefs] = useState({
    invoicePaid: true,
    clientViewed: true,
    weeklyDigest: false,
    stellarNetworkAlerts: true,
  });

  const reloadProfile = () => {
    const activeEmail = (localStorage.getItem("sapi_active_email") || "").toLowerCase().trim();
    const saved =
      (activeEmail && localStorage.getItem(`sapi_profile_${activeEmail}`)) ||
      localStorage.getItem("sapi_user_profile");
    if (saved) {
      setProfile(normalizeProfile(JSON.parse(saved), activeEmail));
    }
  };

  useEffect(() => {
    reloadProfile();

    const savedNotifs = localStorage.getItem("sapi_notif_prefs");
    if (savedNotifs) {
      setNotifPrefs(JSON.parse(savedNotifs));
    }

    const savedTheme = (localStorage.getItem("sapi_theme") as ThemeMode) || "light";
    setTheme(savedTheme);

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (
      tabParam === "profile" ||
      tabParam === "workspace" ||
      tabParam === "appearance" ||
      tabParam === "notifications" ||
      tabParam === "security"
    ) {
      setActiveTab(tabParam);
    }

    window.addEventListener("sapi_profile_updated", reloadProfile);
    return () => window.removeEventListener("sapi_profile_updated", reloadProfile);
  }, []);

  useEffect(() => {
    const syncTheme = () => {
      const current = (localStorage.getItem("sapi_theme") as ThemeMode) || "light";
      setTheme(current);
    };
    window.addEventListener("sapi_theme_updated", syncTheme);
    return () => window.removeEventListener("sapi_theme_updated", syncTheme);
  }, []);

  const triggerToast = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const persistProfile = (nextProfile: UserProfileData) => {
    const cleanEmail = nextProfile.email.toLowerCase().trim();
    const normalized = normalizeProfile(nextProfile, cleanEmail);
    setProfile(normalized);
    localStorage.setItem(`sapi_profile_${cleanEmail}`, JSON.stringify(normalized));
    localStorage.setItem("sapi_user_profile", JSON.stringify(normalized));
    window.dispatchEvent(new Event("sapi_profile_updated"));
    triggerToast();
  };

  const saveProfileChanges = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedWorkspaces = workspaceList.map((ws) =>
      ws.id === profile.activeWorkspaceId
        ? {
          ...ws,
          name: profile.workspaceName,
          logoUrl: profile.workspaceLogo || ws.logoUrl || "",
          stellarAddress: profile.stellarAddress,
          currency: profile.currency,
        }
        : ws
    );
    persistProfile({ ...profile, workspaces: updatedWorkspaces });
    setIsEditingProfile(false);
    setIsEditingWorkspace(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImageFile(file, 180);
    persistProfile({ ...profile, avatarUrl: dataUrl });
  };

  const handleActiveWorkspaceLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImageFile(file, 180);
    const updatedWorkspaces = workspaceList.map((ws) =>
      ws.id === profile.activeWorkspaceId ? { ...ws, logoUrl: dataUrl } : ws
    );
    persistProfile({
      ...profile,
      workspaceLogo: dataUrl,
      workspaces: updatedWorkspaces,
    });
  };

  const handleSelectWorkspace = (ws: WorkspaceItem) => {
    persistProfile({
      ...profile,
      activeWorkspaceId: ws.id,
      workspaceName: ws.name,
      workspaceLogo: ws.logoUrl || "",
      stellarAddress: ws.stellarAddress,
      currency: ws.currency,
    });
  };

  const handleAddWorkspaceInSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    const created: WorkspaceItem = {
      id: `ws_${Date.now()}`,
      name: newBrandName.trim(),
      category: newBrandCategory.trim() || "General",
      stellarAddress: newBrandWallet.trim(),
      currency: profile.currency || "USDC (Stellar)",
      logoUrl: newBrandLogo,
    };
    persistProfile({
      ...profile,
      activeWorkspaceId: created.id,
      workspaceName: created.name,
      workspaceLogo: created.logoUrl || "",
      stellarAddress: created.stellarAddress,
      workspaces: [...workspaceList, created],
    });
    setNewBrandName("");
    setNewBrandWallet("");
    setNewBrandLogo("");
    setShowAddWorkspace(false);
  };

  const handleDeleteWorkspace = (wsId: string) => {
    if (workspaceList.length <= 1) return;
    const remaining = workspaceList.filter((w) => w.id !== wsId);
    const nextActive =
      profile.activeWorkspaceId === wsId
        ? remaining[0]
        : remaining.find((w) => w.id === profile.activeWorkspaceId) || remaining[0];
    persistProfile({
      ...profile,
      activeWorkspaceId: nextActive.id,
      workspaceName: nextActive.name,
      workspaceLogo: nextActive.logoUrl || "",
      stellarAddress: nextActive.stellarAddress,
      currency: nextActive.currency,
      workspaces: remaining,
    });
  };

  const handleSelectTheme = (newMode: ThemeMode) => {
    setTheme(newMode);
    localStorage.setItem("sapi_theme", newMode);
    applyThemeToDOM(newMode);
    window.dispatchEvent(new Event("sapi_theme_updated"));
    triggerToast();
  };

  const toggleNotif = (key: keyof typeof notifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    localStorage.setItem("sapi_notif_prefs", JSON.stringify(updated));
    triggerToast();
  };

  const getInitials = (name: string) => {
    if (!name) return "SP";
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const tabs = [
    { id: "profile", label: "My Profile & Photo", icon: User },
    { id: "workspace", label: "Workspaces & Logos", icon: Building2 },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security & Access", icon: Shield },
  ] as const;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-[#686662] mt-1">
              Manage your personal avatar, country of residence, brand logos, and Stellar wallets.
            </p>
          </div>
          {savedToast && (
            <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm">
              <Check size={16} /> Preferences saved
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Tab Navigation */}
          <div className="w-full md:w-64 shrink-0 space-y-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all text-left cursor-pointer ${isActive
                      ? "bg-white border border-[#EAE8E4] shadow-sm text-[#C85228] font-bold"
                      : "text-[#575450] hover:bg-[#F3F2EE] hover:text-gray-900 font-medium"
                    }`}
                >
                  <Icon size={17} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Tab Content */}
          <div className="flex-1">
            {/* TAB 1: PROFILE, PHOTO & COUNTRY */}
            {activeTab === "profile" && (
              <div className="bg-white border border-[#EAE8E4] rounded-2xl p-6 shadow-sm space-y-6">
                {/* Functional Profile Picture Uploader */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE8E4]">
                  <div className="flex items-center gap-4">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.fullName}
                        className="w-16 h-16 rounded-full object-cover border border-[#EAE8E4]"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#FADCD0] text-[#C85228] flex items-center justify-center font-bold text-lg">
                        {getInitials(profile.fullName)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Profile Picture</h2>
                      <p className="text-xs text-[#686662] mt-0.5">
                        Displayed in your sidebar and workspace activity.
                      </p>
                      <div className="flex items-center gap-2 mt-2.5">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C85228] hover:bg-[#B0451F] text-white text-xs font-semibold cursor-pointer transition-colors">
                          <Camera size={13} />
                          <span>Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                        </label>
                        {profile.avatarUrl && (
                          <button
                            type="button"
                            onClick={() => persistProfile({ ...profile, avatarUrl: "" })}
                            className="px-3 py-1.5 rounded-lg border border-[#EAE8E4] text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#EAE8E4] hover:bg-[#FAF9F6] text-sm font-semibold text-gray-800 transition-colors self-start sm:self-center cursor-pointer"
                    >
                      <Edit3 size={15} /> Edit Details
                    </button>
                  )}
                </div>

                <form onSubmit={saveProfileChanges} className="space-y-4">
                  <div className="bg-[#F5F5F4] p-5 rounded-xl border border-[#E5E4DF] space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#686662] mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingProfile}
                        value={profile.fullName}
                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                        className="w-full bg-white disabled:bg-[#FAF9F6] border border-[#EAE8E4] rounded-lg px-3.5 py-2.5 text-base font-bold text-gray-900 focus:outline-none focus:border-[#C85228]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#686662] mb-1">
                          Country of Residence
                        </label>
                        <div className="relative">
                          <MapPin size={15} className="absolute left-3.5 top-3 text-[#686662]" />
                          <select
                            disabled={!isEditingProfile}
                            value={profile.country || "Nigeria"}
                            onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                            className="w-full bg-white disabled:bg-[#FAF9F6] border border-[#EAE8E4] rounded-lg pl-9 pr-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#C85228]"
                          >
                            {COUNTRIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#686662] mb-1">
                          Authr Account Email
                        </label>
                        <input
                          type="email"
                          disabled
                          value={profile.email}
                          className="w-full bg-[#FAF9F6] border border-[#EAE8E4] rounded-lg px-3.5 py-2.5 text-sm font-semibold text-gray-600 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#686662] mb-1">
                        Professional Headline
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingProfile}
                        value={profile.title}
                        onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                        className="w-full bg-white disabled:bg-[#FAF9F6] border border-[#EAE8E4] rounded-lg px-3.5 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:border-[#C85228]"
                      />
                    </div>
                  </div>

                  {isEditingProfile && (
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2.5 rounded-xl border border-[#EAE8E4] text-sm font-semibold text-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-[#C85228] hover:bg-[#B0451F] text-white text-sm font-semibold cursor-pointer"
                      >
                        Save Profile
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* TAB 2: MULTI-WORKSPACE MANAGER, BRAND LOGOS & STELLAR WALLETS */}
            {activeTab === "workspace" && (
              <div className="space-y-6">
                {/* Multi-Workspace Switcher Card */}
                <div className="bg-white border border-[#EAE8E4] rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-[#EAE8E4]">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Your Brand Workspaces ({workspaceList.length})
                      </h2>
                      <p className="text-xs text-[#686662] mt-0.5">
                        Click any workspace to switch to it, or create a new brand with its own logo.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddWorkspace(!showAddWorkspace)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C85228] hover:bg-[#B0451F] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Plus size={15} /> New Workspace
                    </button>
                  </div>

                  {showAddWorkspace && (
                    <form
                      onSubmit={handleAddWorkspaceInSettings}
                      className="mt-4 p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E4DF] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#C85228]">
                          Create Additional Brand Workspace
                        </p>
                        <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C85228] cursor-pointer hover:underline">
                          <Upload size={13} />
                          <span>{newBrandLogo ? "Logo selected ✓" : "Upload Brand Logo"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const dataUrl = await compressImageFile(file, 180);
                                setNewBrandLogo(dataUrl);
                              }
                            }}
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Workspace Name (e.g. Sapi Engineering)"
                          value={newBrandName}
                          onChange={(e) => setNewBrandName(e.target.value)}
                          className="bg-white border border-[#EAE8E4] rounded-lg px-3 py-2 text-sm text-gray-900"
                        />
                        <input
                          type="text"
                          placeholder="Category (e.g. Software Development)"
                          value={newBrandCategory}
                          onChange={(e) => setNewBrandCategory(e.target.value)}
                          className="bg-white border border-[#EAE8E4] rounded-lg px-3 py-2 text-sm text-gray-900"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Stellar USDC Wallet Address (G...)"
                        value={newBrandWallet}
                        onChange={(e) => setNewBrandWallet(e.target.value)}
                        className="w-full bg-white border border-[#EAE8E4] rounded-lg px-3 py-2 text-sm font-mono text-gray-900"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddWorkspace(false)}
                          className="px-3 py-1.5 rounded-lg border border-[#EAE8E4] text-xs font-semibold text-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-[#C85228] text-white text-xs font-semibold cursor-pointer"
                        >
                          Create & Activate
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {workspaceList.map((ws) => {
                      const isActive = ws.id === profile.activeWorkspaceId;
                      return (
                        <div
                          key={ws.id}
                          onClick={() => handleSelectWorkspace(ws)}
                          className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start justify-between ${isActive
                              ? "border-[#C85228] bg-[#FBECE5]/20"
                              : "border-[#EAE8E4] hover:border-gray-300"
                            }`}
                        >
                          <div className="flex items-start gap-3 overflow-hidden">
                            {ws.logoUrl ? (
                              <img
                                src={ws.logoUrl}
                                alt={ws.name}
                                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[#EAE8E4]"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-[#C85228] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {getInitials(ws.name)}
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-900 truncate">
                                  {ws.name}
                                </span>
                                {isActive && (
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#C85228] text-white">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#686662] mt-0.5 truncate">{ws.category}</p>
                              <p className="text-[11px] font-mono text-[#8C8985] mt-1.5 truncate">
                                {ws.stellarAddress
                                  ? `${ws.stellarAddress.slice(0, 8)}...${ws.stellarAddress.slice(-4)}`
                                  : "No Stellar wallet set"}
                              </p>
                            </div>
                          </div>

                          {workspaceList.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWorkspace(ws.id);
                              }}
                              title="Remove Workspace"
                              className="p-1.5 rounded-lg text-[#8C8985] hover:text-red-600 hover:bg-red-500/10"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Active Workspace Logo & Configuration Card */}
                <div className="bg-white border border-[#EAE8E4] rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE8E4]">
                    <div className="flex items-center gap-4">
                      {profile.workspaceLogo ? (
                        <img
                          src={profile.workspaceLogo}
                          alt={profile.workspaceName}
                          className="w-14 h-14 rounded-2xl object-cover border border-[#EAE8E4]"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-[#C85228] text-white flex items-center justify-center font-bold text-base">
                          {getInitials(profile.workspaceName)}
                        </div>
                      )}
                      <div>
                        <h2 className="text-base font-bold text-gray-900">
                          {profile.workspaceName} — Brand Logo
                        </h2>
                        <p className="text-xs text-[#686662] mt-0.5">
                          Appears in the top-right workspace switcher and on client invoices.
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C85228] hover:bg-[#B0451F] text-white text-xs font-semibold cursor-pointer transition-colors">
                            <Upload size={13} />
                            <span>Upload Brand Logo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleActiveWorkspaceLogoUpload}
                              className="hidden"
                            />
                          </label>
                          {profile.workspaceLogo && (
                            <button
                              type="button"
                              onClick={() => {
                                const updatedWorkspaces = workspaceList.map((ws) =>
                                  ws.id === profile.activeWorkspaceId ? { ...ws, logoUrl: "" } : ws
                                );
                                persistProfile({
                                  ...profile,
                                  workspaceLogo: "",
                                  workspaces: updatedWorkspaces,
                                });
                              }}
                              className="px-3 py-1.5 rounded-lg border border-[#EAE8E4] text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                              Remove Logo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isEditingWorkspace && (
                      <button
                        onClick={() => setIsEditingWorkspace(true)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#EAE8E4] hover:bg-[#FAF9F6] text-sm font-semibold text-gray-800 self-start sm:self-center cursor-pointer"
                      >
                        <Edit3 size={15} /> Edit Workspace
                      </button>
                    )}
                  </div>

                  <form onSubmit={saveProfileChanges} className="space-y-4">
                    <div className="bg-[#F5F5F4] p-5 rounded-xl border border-[#E5E4DF] space-y-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#686662] mb-1">
                          Workspace / Business Name
                        </label>
                        <input
                          type="text"
                          disabled={!isEditingWorkspace}
                          value={profile.workspaceName}
                          onChange={(e) => setProfile({ ...profile, workspaceName: e.target.value })}
                          className="w-full bg-white disabled:bg-[#FAF9F6] border border-[#EAE8E4] rounded-lg px-3.5 py-2.5 text-base font-bold text-gray-900 focus:outline-none focus:border-[#C85228]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#686662] mb-1">
                          Stellar USDC Receiving Wallet Address
                        </label>
                        <div className="relative">
                          <Wallet size={16} className="absolute left-3.5 top-3 text-[#686662]" />
                          <input
                            type="text"
                            disabled={!isEditingWorkspace}
                            placeholder="G..."
                            value={profile.stellarAddress}
                            onChange={(e) =>
                              setProfile({ ...profile, stellarAddress: e.target.value })
                            }
                            className="w-full bg-white disabled:bg-[#FAF9F6] border border-[#EAE8E4] rounded-lg pl-10 pr-3.5 py-2.5 text-sm font-mono text-gray-900 focus:outline-none focus:border-[#C85228]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#686662] mb-1">
                          Default Settlement Asset
                        </label>
                        <select
                          disabled={!isEditingWorkspace}
                          value={profile.currency}
                          onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                          className="w-full bg-white disabled:bg-[#FAF9F6] border border-[#EAE8E4] rounded-lg px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#C85228]"
                        >
                          <option value="USDC (Stellar)">USDC on Stellar Network</option>
                          <option value="XLM (Stellar)">Native XLM on Stellar</option>
                          <option value="USDC (Stellar) / NGN">USDC / NGN (Hybrid)</option>
                        </select>
                      </div>
                    </div>

                    {isEditingWorkspace && (
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingWorkspace(false)}
                          className="px-4 py-2.5 rounded-xl border border-[#EAE8E4] text-sm font-semibold text-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl bg-[#C85228] hover:bg-[#B0451F] text-white text-sm font-semibold cursor-pointer"
                        >
                          Save Workspace
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}

            {/* TAB 3: APPEARANCE */}
            {activeTab === "appearance" && (
              <div className="bg-white border border-[#EAE8E4] rounded-2xl p-6 shadow-sm space-y-6">
                <div className="pb-4 border-b border-[#EAE8E4] flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Interface Appearance</h2>
                    <p className="text-xs text-[#686662] mt-0.5">
                      Choose between our signature Warm Alabaster light mode, low-glare Obsidian dark mode, or automatic OS sync.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#FBECE5] text-[#C85228]">
                    <Sparkles size={12} /> Instant Sync
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Light Card */}
                  <button
                    type="button"
                    onClick={() => handleSelectTheme("light")}
                    className={`group p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${theme === "light"
                        ? "border-[#C85228] bg-[#FBECE5]/20 shadow-sm"
                        : "border-[#EAE8E4] hover:border-[#C85228]/40"
                      }`}
                  >
                    <div
                      style={{ backgroundColor: "#FAF9F6", borderColor: "#EAE8E4" }}
                      className="h-28 rounded-xl border overflow-hidden flex mb-3.5 shadow-inner"
                    >
                      <div
                        style={{ backgroundColor: "#F3F2EE", borderColor: "#EAE8E4" }}
                        className="w-1/4 border-r p-2 flex flex-col gap-1.5"
                      >
                        <div style={{ backgroundColor: "#C85228" }} className="w-4 h-4 rounded-md mb-1" />
                        <div style={{ backgroundColor: "#FBECE5" }} className="w-full h-2 rounded" />
                        <div style={{ backgroundColor: "#E5E4DF" }} className="w-4/5 h-2 rounded" />
                      </div>
                      <div className="flex-1 p-2.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <div style={{ backgroundColor: "#141312" }} className="w-12 h-2.5 rounded" />
                          <div style={{ backgroundColor: "#C85228" }} className="w-6 h-2.5 rounded" />
                        </div>
                        <div
                          style={{ backgroundColor: "#FFFFFF", borderColor: "#EAE8E4" }}
                          className="p-2 rounded-lg border space-y-1.5"
                        >
                          <div style={{ backgroundColor: "#141312" }} className="w-3/4 h-2 rounded" />
                          <div style={{ backgroundColor: "#E5E4DF" }} className="w-1/2 h-1.5 rounded" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sun size={16} className="text-[#C85228]" />
                        <span className="text-sm font-bold text-gray-900">Alabaster Light</span>
                      </div>
                      {theme === "light" && (
                        <span className="w-5 h-5 rounded-full bg-[#C85228] text-white flex items-center justify-center">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#686662] mt-1">Warm editorial paper & crisp ink</p>
                  </button>

                  {/* Dark Card */}
                  <button
                    type="button"
                    onClick={() => handleSelectTheme("dark")}
                    className={`group p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${theme === "dark"
                        ? "border-[#C85228] bg-[#FBECE5]/20 shadow-sm"
                        : "border-[#EAE8E4] hover:border-[#C85228]/40"
                      }`}
                  >
                    <div
                      style={{ backgroundColor: "#0F0E0D", borderColor: "#2A2724" }}
                      className="h-28 rounded-xl border overflow-hidden flex mb-3.5 shadow-inner"
                    >
                      <div
                        style={{ backgroundColor: "#171614", borderColor: "#2A2724" }}
                        className="w-1/4 border-r p-2 flex flex-col gap-1.5"
                      >
                        <div style={{ backgroundColor: "#E06338" }} className="w-4 h-4 rounded-md mb-1" />
                        <div style={{ backgroundColor: "rgba(200,82,40,0.3)" }} className="w-full h-2 rounded" />
                        <div style={{ backgroundColor: "#2A2724" }} className="w-4/5 h-2 rounded" />
                      </div>
                      <div className="flex-1 p-2.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <div style={{ backgroundColor: "#F5F3F0" }} className="w-12 h-2.5 rounded" />
                          <div style={{ backgroundColor: "#E06338" }} className="w-6 h-2.5 rounded" />
                        </div>
                        <div
                          style={{ backgroundColor: "#171614", borderColor: "#2A2724" }}
                          className="p-2 rounded-lg border space-y-1.5"
                        >
                          <div style={{ backgroundColor: "#F5F3F0" }} className="w-3/4 h-2 rounded" />
                          <div style={{ backgroundColor: "#36322E" }} className="w-1/2 h-1.5 rounded" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Moon size={16} className="text-[#C85228]" />
                        <span className="text-sm font-bold text-gray-900">Obsidian Dark</span>
                      </div>
                      {theme === "dark" && (
                        <span className="w-5 h-5 rounded-full bg-[#C85228] text-white flex items-center justify-center">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#686662] mt-1">Deep carbon slate for night sessions</p>
                  </button>

                  {/* System Card */}
                  <button
                    type="button"
                    onClick={() => handleSelectTheme("system")}
                    className={`group p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${theme === "system"
                        ? "border-[#C85228] bg-[#FBECE5]/20 shadow-sm"
                        : "border-[#EAE8E4] hover:border-[#C85228]/40"
                      }`}
                  >
                    <div
                      style={{ borderColor: "#EAE8E4" }}
                      className="h-28 rounded-xl border overflow-hidden flex mb-3.5 shadow-inner"
                    >
                      <div
                        style={{ backgroundColor: "#FAF9F6", borderColor: "#EAE8E4" }}
                        className="w-1/2 p-2.5 border-r flex flex-col justify-between"
                      >
                        <div style={{ backgroundColor: "#C85228" }} className="w-5 h-2 rounded" />
                        <div
                          style={{ backgroundColor: "#FFFFFF", borderColor: "#EAE8E4" }}
                          className="p-2 rounded border space-y-1"
                        >
                          <div style={{ backgroundColor: "#141312" }} className="w-full h-1.5 rounded" />
                          <div style={{ backgroundColor: "#E5E4DF" }} className="w-2/3 h-1.5 rounded" />
                        </div>
                      </div>
                      <div
                        style={{ backgroundColor: "#0F0E0D" }}
                        className="w-1/2 p-2.5 flex flex-col justify-between"
                      >
                        <div style={{ backgroundColor: "#E06338" }} className="w-5 h-2 rounded" />
                        <div
                          style={{ backgroundColor: "#171614", borderColor: "#2A2724" }}
                          className="p-2 rounded border space-y-1"
                        >
                          <div style={{ backgroundColor: "#F5F3F0" }} className="w-full h-1.5 rounded" />
                          <div style={{ backgroundColor: "#36322E" }} className="w-2/3 h-1.5 rounded" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Monitor size={16} className="text-[#C85228]" />
                        <span className="text-sm font-bold text-gray-900">System Default</span>
                      </div>
                      {theme === "system" && (
                        <span className="w-5 h-5 rounded-full bg-[#C85228] text-white flex items-center justify-center">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#686662] mt-1">Follows macOS / Windows schedule</p>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="bg-white border border-[#EAE8E4] rounded-2xl p-6 shadow-sm space-y-6">
                <div className="pb-4 border-b border-[#EAE8E4]">
                  <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
                  <p className="text-xs text-[#686662] mt-0.5">
                    Choose how Sapi alerts you when clients view or settle your invoices on-chain.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      key: "invoicePaid" as const,
                      title: "Instant Stellar Settlement Alerts",
                      desc: "Notify me immediately when Horizon confirms a matching invoice memo on-chain.",
                    },
                    {
                      key: "clientViewed" as const,
                      title: "Client Link Opened",
                      desc: "Alert me when a client opens their public /pay/[id] invoice link.",
                    },
                    {
                      key: "stellarNetworkAlerts" as const,
                      title: "Horizon Network Status",
                      desc: "Receive updates if Stellar RPC verification experiences latency.",
                    },
                    {
                      key: "weeklyDigest" as const,
                      title: "Weekly Revenue Summary",
                      desc: "Send a Monday morning digest of settled and pending invoices.",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 rounded-xl bg-[#F5F5F4] border border-[#E5E4DF]"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.title}</p>
                        <p className="text-xs text-[#686662] mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleNotif(item.key)}
                        className={`w-12 h-6 rounded-full transition-colors relative px-1 flex items-center cursor-pointer ${notifPrefs[item.key] ? "bg-[#C85228]" : "bg-gray-400"
                          }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${notifPrefs[item.key] ? "translate-x-6" : "translate-x-0"
                            }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: SECURITY */}
            {activeTab === "security" && (
              <div className="bg-white border border-[#EAE8E4] rounded-2xl p-6 shadow-sm space-y-6">
                <div className="pb-4 border-b border-[#EAE8E4]">
                  <h2 className="text-lg font-bold text-gray-900">Security & Identity Provider</h2>
                  <p className="text-xs text-[#686662] mt-0.5">
                    Your session is protected by Authr.space identity tokens and isolated per workspace.
                  </p>
                </div>

                <div className="bg-[#F5F5F4] p-5 rounded-xl border border-[#E5E4DF] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FBECE5] text-[#C85228] flex items-center justify-center">
                        <KeyRound size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Authr.space OAuth Session</p>
                        <p className="text-xs text-[#686662]">
                          Isolated to {profile.email} ({profile.country || "Nigeria"})
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700">
                      Active
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#E5E4DF]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#EAE8E4] text-gray-700 flex items-center justify-center">
                        <Smartphone size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Re-run Sapi Environment Setup</p>
                        <p className="text-xs text-[#686662]">
                          Test the post-Authr country, photo & workspace setup screen again.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const cleanEmail = profile.email.toLowerCase().trim();
                        const reset = { ...profile, onboarded: false };
                        localStorage.setItem(`sapi_profile_${cleanEmail}`, JSON.stringify(reset));
                        localStorage.setItem("sapi_user_profile", JSON.stringify(reset));
                        window.dispatchEvent(new Event("sapi_profile_updated"));
                      }}
                      className="px-3.5 py-2 rounded-xl border border-[#EAE8E4] bg-white hover:bg-gray-50 text-xs font-bold text-gray-800 cursor-pointer"
                    >
                      Re-run Setup
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}