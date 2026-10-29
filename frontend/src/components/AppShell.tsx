"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthrClient } from "@authrspace/sdk";
import {
  Bell,
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Globe,
  ArrowRight,
  Wallet,
  Building2,
  User,
  Sun,
  Moon,
  Monitor,
  Palette,
  Plus,
  Check,
  MapPin,
  Loader2,
  X,
  Camera,
  Upload,
} from "lucide-react";
import Link from "next/link";

const authr = new AuthrClient({
  clientId: process.env.NEXT_PUBLIC_AUTHR_CLIENT_ID || "",
});

export type ThemeMode = "light" | "dark" | "system";

export interface WorkspaceItem {
  id: string;
  name: string;
  category: string;
  stellarAddress: string;
  currency: string;
  logoUrl?: string;
}

export interface UserProfileData {
  fullName: string;
  email: string;
  title: string;
  workspaceName: string;
  stellarAddress: string;
  currency: string;
  onboarded: boolean;
  country?: string;
  avatarUrl?: string;
  workspaceLogo?: string;
  activeWorkspaceId?: string;
  workspaces?: WorkspaceItem[];
}

const COUNTRIES = [
  { name: "Nigeria", currency: "USDC (Stellar) / NGN" },
  { name: "Kenya", currency: "USDC (Stellar) / KES" },
  { name: "Ghana", currency: "USDC (Stellar) / GHS" },
  { name: "South Africa", currency: "USDC (Stellar) / ZAR" },
  { name: "Rwanda", currency: "USDC (Stellar) / RWF" },
  { name: "Egypt", currency: "USDC (Stellar) / EGP" },
  { name: "United Kingdom", currency: "USDC (Stellar) / GBP" },
  { name: "United States", currency: "USDC (Stellar) / USD" },
  { name: "Canada", currency: "USDC (Stellar) / CAD" },
  { name: "Other / Global", currency: "USDC (Stellar)" },
];

const EMPTY_PROFILE = (email = "", name = ""): UserProfileData => ({
  fullName: name,
  email: email,
  title: "Product Designer & Engineer",
  country: "Nigeria",
  avatarUrl: "",
  workspaceName: "",
  workspaceLogo: "",
  stellarAddress: "",
  currency: "USDC (Stellar)",
  activeWorkspaceId: "ws_default",
  workspaces: [],
  onboarded: false,
});

export function compressImageFile(file: File, maxSize = 180): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(e.target?.result || ""));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxSize, maxSize);
        resolve(canvas.toDataURL("image/webp", 0.86));
      };
      img.onerror = reject;
      img.src = String(e.target?.result || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function applyThemeToDOM(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = mode === "dark" || (mode === "system" && prefersDark);

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function normalizeProfile(
  raw: Partial<UserProfileData>,
  fallbackEmail = ""
): UserProfileData {
  const email = (raw.email || fallbackEmail).toLowerCase().trim();
  const existingWorkspaces: WorkspaceItem[] =
    Array.isArray(raw.workspaces) && raw.workspaces.length > 0
      ? raw.workspaces
      : raw.workspaceName
        ? [
          {
            id: "ws_1",
            name: raw.workspaceName,
            category: raw.title || "Creative & Engineering",
            stellarAddress: raw.stellarAddress || "",
            currency: raw.currency || "USDC (Stellar)",
            logoUrl: raw.workspaceLogo || "",
          },
        ]
        : [];

  const activeId =
    raw.activeWorkspaceId && existingWorkspaces.some((w) => w.id === raw.activeWorkspaceId)
      ? raw.activeWorkspaceId
      : existingWorkspaces[0]?.id || "ws_1";

  const activeWs = existingWorkspaces.find((w) => w.id === activeId) || existingWorkspaces[0];

  return {
    fullName: raw.fullName || "",
    email,
    title: raw.title || "Product Designer & Engineer",
    country: raw.country || "Nigeria",
    avatarUrl: raw.avatarUrl || "",
    workspaceName: activeWs?.name || raw.workspaceName || "",
    workspaceLogo: activeWs?.logoUrl ?? raw.workspaceLogo ?? "",
    stellarAddress: activeWs?.stellarAddress ?? raw.stellarAddress ?? "",
    currency: activeWs?.currency || raw.currency || "USDC (Stellar)",
    activeWorkspaceId: activeId,
    workspaces: existingWorkspaces,
    onboarded: Boolean(raw.onboarded && existingWorkspaces.length > 0),
  };
}

// Only called on Sign Out so it never interferes with authr.signIn()
function clearAuthrStorageOnLogout() {
  if (typeof window === "undefined") return;
  try {
    const sdkAny = authr as unknown as {
      signOut?: () => void;
      logout?: () => void;
    };
    sdkAny.signOut?.();
    sdkAny.logout?.();
  } catch {
    // ignore
  }

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i) || "";
    const lower = k.toLowerCase();
    if (
      !k.startsWith("sapi_profile_") &&
      !k.startsWith("sapi_theme") &&
      !k.startsWith("sapi_notif_") &&
      (lower.includes("authr") || lower.includes("token") || lower.includes("session"))
    ) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authrOpened, setAuthrOpened] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");

  const [profile, setProfile] = useState<UserProfileData>(EMPTY_PROFILE());

  // New Workspace Modal State
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsCategory, setNewWsCategory] = useState("Tech & Engineering");
  const [newWsWallet, setNewWsWallet] = useState("");
  const [newWsLogo, setNewWsLogo] = useState("");

  // Dropdown States
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Stellar Network Connected",
      desc: "Horizon mainnet/testnet verification is active.",
      time: "Just now",
      unread: true,
    },
    {
      id: 2,
      title: "Multi-Workspace Engine Ready",
      desc: "Upload custom logos and switch between brands anytime.",
      time: "2m ago",
      unread: true,
    },
  ]);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const authPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const persistAndBroadcastProfile = (updated: UserProfileData) => {
    const cleanEmail = updated.email.toLowerCase().trim();
    const normalized = normalizeProfile(updated, cleanEmail);
    setProfile(normalized);
    if (cleanEmail) {
      localStorage.setItem("sapi_active_email", cleanEmail);
      localStorage.setItem(`sapi_profile_${cleanEmail}`, JSON.stringify(normalized));
    }
    localStorage.setItem("sapi_user_profile", JSON.stringify(normalized));
    window.dispatchEvent(new Event("sapi_profile_updated"));
  };

  const loadAccountState = () => {
    const authFlag = localStorage.getItem("sapi_auth") === "true";
    const activeEmail = (localStorage.getItem("sapi_active_email") || "").toLowerCase().trim();

    setIsAuthenticated(authFlag && !!activeEmail);

    if (authFlag && activeEmail) {
      const accountKey = `sapi_profile_${activeEmail}`;
      const savedForThisEmail = localStorage.getItem(accountKey);

      if (savedForThisEmail) {
        try {
          const parsed = normalizeProfile(JSON.parse(savedForThisEmail), activeEmail);
          setProfile(parsed);
          localStorage.setItem("sapi_user_profile", JSON.stringify(parsed));
        } catch {
          setProfile(EMPTY_PROFILE(activeEmail));
        }
      } else {
        const fresh = EMPTY_PROFILE(activeEmail);
        setProfile(fresh);
        localStorage.setItem("sapi_user_profile", JSON.stringify(fresh));
      }
    }

    const savedTheme = (localStorage.getItem("sapi_theme") as ThemeMode) || "light";
    setTheme(savedTheme);
    applyThemeToDOM(savedTheme);
  };

  const extractAuthrIdentity = (): { email: string; name: string } | null => {
    try {
      interface AuthrUserPayload {
        email?: string;
        name?: string;
        fullName?: string;
      }
      const sdkAny = authr as unknown as {
        getUser?: () => AuthrUserPayload;
        getSession?: () => { user?: AuthrUserPayload };
        user?: AuthrUserPayload;
      };
      const u: AuthrUserPayload | undefined =
        sdkAny.getUser?.() || sdkAny.getSession?.()?.user || sdkAny.user;

      if (u?.email) {
        return {
          email: u.email.toLowerCase().trim(),
          name: u.name || u.fullName || "",
        };
      }

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || "";
        if (k.toLowerCase().includes("authr") && !k.startsWith("sapi_")) {
          const val = localStorage.getItem(k) || "";
          if (val.includes("@")) {
            try {
              const parsed = JSON.parse(val);
              const foundEmail = parsed?.email || parsed?.user?.email;
              const foundName =
                parsed?.name ||
                parsed?.fullName ||
                parsed?.user?.name ||
                parsed?.user?.fullName ||
                "";
              if (foundEmail) {
                return {
                  email: String(foundEmail).toLowerCase().trim(),
                  name: String(foundName),
                };
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } catch {
      // ignore
    }
    return null;
  };

  const finalizeAuthrLogin = (email: string, name = "") => {
    if (authPollRef.current) {
      clearInterval(authPollRef.current);
      authPollRef.current = null;
    }

    const cleanEmail = email.toLowerCase().trim();
    localStorage.setItem("sapi_active_email", cleanEmail);
    localStorage.setItem("sapi_auth", "true");

    const existingAccountData = localStorage.getItem(`sapi_profile_${cleanEmail}`);
    if (existingAccountData) {
      const parsed = normalizeProfile(JSON.parse(existingAccountData), cleanEmail);
      setProfile(parsed);
      localStorage.setItem("sapi_user_profile", JSON.stringify(parsed));
    } else {
      const freshProfile = EMPTY_PROFILE(cleanEmail, name);
      setProfile(freshProfile);
      localStorage.setItem("sapi_user_profile", JSON.stringify(freshProfile));
    }

    setAuthrOpened(false);
    setIsAuthenticated(true);
  };

  useEffect(() => {
    setIsClient(true);
    loadAccountState();

    const handleUpdate = () => loadAccountState();
    window.addEventListener("sapi_profile_updated", handleUpdate);
    window.addEventListener("sapi_theme_updated", handleUpdate);

    // Listen for postMessage events from the Authr popup/iframe
    const handleWindowMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data && typeof data === "object") {
        const email =
          data.email ||
          data.user?.email ||
          data.payload?.email ||
          data.payload?.user?.email;
        const name =
          data.name ||
          data.user?.name ||
          data.payload?.name ||
          data.payload?.user?.name ||
          "";
        if (typeof email === "string" && email.includes("@")) {
          finalizeAuthrLogin(email, name);
        }
      }
    };
    window.addEventListener("message", handleWindowMessage);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      const currentMode = (localStorage.getItem("sapi_theme") as ThemeMode) || "light";
      if (currentMode === "system") applyThemeToDOM("system");
    };
    mediaQuery.addEventListener("change", handleSystemChange);

    return () => {
      window.removeEventListener("sapi_profile_updated", handleUpdate);
      window.removeEventListener("sapi_theme_updated", handleUpdate);
      window.removeEventListener("message", handleWindowMessage);
      mediaQuery.removeEventListener("change", handleSystemChange);
      if (authPollRef.current) clearInterval(authPollRef.current);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(event.target as Node)) {
        setIsWorkspaceOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTheme = (newMode: ThemeMode) => {
    setTheme(newMode);
    localStorage.setItem("sapi_theme", newMode);
    applyThemeToDOM(newMode);
    window.dispatchEvent(new Event("sapi_theme_updated"));
  };

  // Fires authr.signIn() IMMEDIATELY and synchronously so the Authr popup always mounts!
  const handleLaunchAuthr = () => {
    try {
      const maybePromise = (authr as unknown as { signIn: () => unknown }).signIn();
      setAuthrOpened(true);

      // If Authr returns a Promise that resolves when the user finishes signing in:
      if (maybePromise && typeof (maybePromise as Promise<unknown>).then === "function") {
        (maybePromise as Promise<unknown>)
          .then((res) => {
            const r = res as
              | { email?: string; name?: string; user?: { email?: string; name?: string } }
              | undefined;
            const resolvedEmail = r?.email || r?.user?.email;
            const resolvedName = r?.name || r?.user?.name || "";
            if (resolvedEmail) {
              finalizeAuthrLogin(resolvedEmail, resolvedName);
            }
          })
          .catch((err) => {
            console.warn("Authr signIn promise rejected:", err);
          });
      }

      // Also poll SDK state in case Authr writes user session to SDK/storage without resolving a promise
      if (authPollRef.current) clearInterval(authPollRef.current);
      authPollRef.current = setInterval(() => {
        const identity = extractAuthrIdentity();
        if (identity?.email) {
          finalizeAuthrLogin(identity.email, identity.name);
        }
      }, 800);
    } catch (err) {
      console.error("Failed to launch Authr:", err);
      setAuthrOpened(true);
    }
  };

  const handleSignOut = () => {
    if (authPollRef.current) clearInterval(authPollRef.current);
    clearAuthrStorageOnLogout();
    localStorage.removeItem("sapi_auth");
    localStorage.removeItem("sapi_active_email");
    localStorage.removeItem("sapi_user_profile");
    setProfile(EMPTY_PROFILE());
    setIsAuthenticated(false);
    setAuthrOpened(false);
    setIsProfileOpen(false);
    router.push("/");
  };

  const handleCompleteSapiSetup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = (profile.email || "creator@sapi.space").toLowerCase().trim();
    const firstWorkspace: WorkspaceItem = {
      id: `ws_${Date.now()}`,
      name:
        profile.workspaceName.trim() ||
        `${(profile.fullName || "My").split(" ")[0]}'s Workspace`,
      category: profile.title || "Creative & Engineering",
      stellarAddress: profile.stellarAddress.trim(),
      currency: profile.currency || "USDC (Stellar)",
      logoUrl: profile.workspaceLogo || "",
    };

    const updated: UserProfileData = {
      ...profile,
      email: cleanEmail,
      fullName: profile.fullName.trim() || cleanEmail.split("@")[0],
      workspaceName: firstWorkspace.name,
      workspaceLogo: firstWorkspace.logoUrl,
      stellarAddress: firstWorkspace.stellarAddress,
      currency: firstWorkspace.currency,
      activeWorkspaceId: firstWorkspace.id,
      workspaces: [firstWorkspace],
      onboarded: true,
    };

    persistAndBroadcastProfile(updated);
  };

  const workspaceList = profile.workspaces ?? [];
  const activeWorkspaceObj =
    workspaceList.find((w) => w.id === profile.activeWorkspaceId) || workspaceList[0];

  const handleSwitchWorkspace = (wsId: string) => {
    const target = workspaceList.find((w) => w.id === wsId);
    if (!target) return;

    const updated: UserProfileData = {
      ...profile,
      activeWorkspaceId: target.id,
      workspaceName: target.name,
      workspaceLogo: target.logoUrl || "",
      stellarAddress: target.stellarAddress,
      currency: target.currency,
    };
    persistAndBroadcastProfile(updated);
    setIsWorkspaceOpen(false);
  };

  const handleCreateNewWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    const newWs: WorkspaceItem = {
      id: `ws_${Date.now()}`,
      name: newWsName.trim(),
      category: newWsCategory.trim() || "General",
      stellarAddress: newWsWallet.trim(),
      currency: profile.currency || "USDC (Stellar)",
      logoUrl: newWsLogo,
    };

    const updated: UserProfileData = {
      ...profile,
      activeWorkspaceId: newWs.id,
      workspaceName: newWs.name,
      workspaceLogo: newWs.logoUrl || "",
      stellarAddress: newWs.stellarAddress,
      workspaces: [...workspaceList, newWs],
    };

    persistAndBroadcastProfile(updated);
    setNewWsName("");
    setNewWsWallet("");
    setNewWsLogo("");
    setIsNewWorkspaceModalOpen(false);
    setIsWorkspaceOpen(false);
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

  const unreadCount = notifications.filter((n) => n.unread).length;

  if (!isClient) return null;

  // ---------------------------------------------------------------------------
  // 1. SPLIT-SCREEN LOGIN (Direct Authr Modal Trigger)
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col lg:flex-row">
        {/* Left Branding Panel */}
        <div className="lg:w-1/2 bg-[#181615] text-white p-10 lg:p-16 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#C85228]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#C85228]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 relative z-10">
            <img
              src="/logo.svg"
              alt="Sapi Logo"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
              className="w-9 h-9 object-contain"
            />
            <span className="font-bold text-xl tracking-wider text-white">SAPI</span>
          </div>

          <div className="my-12 relative z-10 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-[#FADCD0] mb-6">
              <Sparkles size={13} /> Powered by Stellar USDC Settlement
            </div>
            <h1 className="text-3xl lg:text-5xl font-bold tracking-tight leading-[1.15] mb-6 text-white">
              Borderless invoicing for African creators & engineers.
            </h1>
            <p className="text-[#A09D98] text-base leading-relaxed mb-8">
              Generate high-craft invoices across multiple brands, share verifiable client payment links, and settle cross-border payments directly into your Stellar wallet.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
              <div className="flex items-start gap-3">
                <ShieldCheck className="text-[#C85228] shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-semibold text-white">Multi-Brand Workspaces</p>
                  <p className="text-xs text-[#8C8985]">Run multiple studios under one login</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="text-[#C85228] shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-semibold text-white">Instant Settlement</p>
                  <p className="text-xs text-[#8C8985]">Automated Horizon memo matching</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-[#8C8985] flex items-center justify-between relative z-10">
            <span>© 2026 Sapi Financial Technologies</span>
            <span>Identity by Authr.space</span>
          </div>
        </div>

        {/* Right Auth Panel — Direct Authr Trigger */}
        <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-20">
          <div className="max-w-sm w-full">
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Enter your workspace
              </h2>
              <p className="text-sm text-[#686662] mt-2 leading-relaxed">
                Authenticate with Authr to access your invoices, clients, and Stellar settlement ledger.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLaunchAuthr}
              className="w-full bg-[#C85228] hover:bg-[#B0451F] active:scale-[0.99] text-white font-semibold py-3.5 px-5 rounded-xl transition-all flex items-center justify-between shadow-sm cursor-pointer"
            >
              <span>Continue with Authr</span>
              <ArrowRight size={17} />
            </button>

            {/* Only appears after the user clicks Continue with Authr in case the popup is decoupled */}
            {authrOpened && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const email = String(fd.get("confirmedEmail") || "").trim();
                  const name = String(fd.get("confirmedName") || "").trim();
                  if (email) finalizeAuthrLogin(email, name);
                }}
                className="mt-6 pt-6 border-t border-[#EAE8E4] space-y-3"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-[#686662]">
                  <Loader2 size={14} className="text-[#C85228] animate-spin shrink-0" />
                  <span>Authr modal active — enter your Authr email once signed in:</span>
                </div>
                <input
                  name="confirmedEmail"
                  type="email"
                  required
                  placeholder="Your Authr email address..."
                  defaultValue={extractAuthrIdentity()?.email || ""}
                  className="w-full bg-white border border-[#E5E4DF] rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#C85228]"
                />
                <button
                  type="submit"
                  className="w-full bg-[#181615] hover:bg-[#2A2724] text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                >
                  Proceed to Workspace →
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. FIRST-TIME SAPI SETUP (Country, Avatar, Brand Logo & Workspace)
  // ---------------------------------------------------------------------------
  if (!profile.onboarded) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
        <div className="bg-white border border-[#EAE8E4] rounded-2xl max-w-lg w-full p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.svg"
                alt="Sapi"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
                className="w-6 h-6 object-contain"
              />
              <span className="text-xs font-bold uppercase tracking-wider text-[#C85228]">
                Workspace Initialization
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs text-[#686662] hover:text-gray-900 underline cursor-pointer"
            >
              Use another account
            </button>
          </div>

          <form onSubmit={handleCompleteSapiSetup} className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Set up your Sapi environment
              </h2>
              <p className="text-sm text-[#686662] mt-1">
                Signed in as <span className="font-semibold text-gray-900">{profile.email}</span>. Configure your country, profile photo, and first workspace brand.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E4DF] cursor-pointer hover:border-[#C85228] transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#FADCD0] text-[#C85228] flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={16} />
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-gray-900 truncate">Profile Photo</p>
                  <p className="text-[11px] text-[#686662] truncate">
                    {profile.avatarUrl ? "Change photo" : "Upload avatar"}
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const dataUrl = await compressImageFile(file, 180);
                      setProfile((prev) => ({ ...prev, avatarUrl: dataUrl }));
                    }
                  }}
                />
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E4DF] cursor-pointer hover:border-[#C85228] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#FBECE5] text-[#C85228] flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                  {profile.workspaceLogo ? (
                    <img src={profile.workspaceLogo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload size={16} />
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-gray-900 truncate">Brand Logo</p>
                  <p className="text-[11px] text-[#686662] truncate">
                    {profile.workspaceLogo ? "Change logo" : "Upload logo"}
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const dataUrl = await compressImageFile(file, 180);
                      setProfile((prev) => ({ ...prev, workspaceLogo: dataUrl }));
                    }
                  }}
                />
              </label>
            </div>

            <div className="bg-[#F5F5F4] p-4 rounded-xl border border-[#E5E4DF] space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#686662] mb-1.5">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-[#8C8985]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chidera Okafor"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className="w-full bg-white border border-[#EAE8E4] rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#C85228]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#686662] mb-1.5">
                  Country of Residence *
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-3 text-[#8C8985]" />
                  <select
                    value={profile.country || "Nigeria"}
                    onChange={(e) => {
                      const selected = COUNTRIES.find((c) => c.name === e.target.value);
                      setProfile({
                        ...profile,
                        country: e.target.value,
                        currency: selected?.currency || "USDC (Stellar)",
                      });
                    }}
                    className="w-full bg-white border border-[#EAE8E4] rounded-lg pl-10 pr-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#C85228]"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#686662] mb-1.5">
                  Primary Workspace / Brand Name *
                </label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3.5 top-3 text-[#8C8985]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Moltisanti Creative"
                    value={profile.workspaceName}
                    onChange={(e) => setProfile({ ...profile, workspaceName: e.target.value })}
                    className="w-full bg-white border border-[#EAE8E4] rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#C85228]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#686662] mb-1.5">
                  Stellar USDC Settlement Wallet (Optional)
                </label>
                <div className="relative">
                  <Wallet size={16} className="absolute left-3.5 top-3 text-[#8C8985]" />
                  <input
                    type="text"
                    placeholder="GABCD... (Can also be configured in Settings)"
                    value={profile.stellarAddress}
                    onChange={(e) => setProfile({ ...profile, stellarAddress: e.target.value })}
                    className="w-full bg-white border border-[#EAE8E4] rounded-lg pl-10 pr-3.5 py-2.5 text-sm font-mono text-gray-900 focus:outline-none focus:border-[#C85228]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#C85228] hover:bg-[#B0451F] text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Launch Workspace</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. MAIN AUTHENTICATED APPLICATION SHELL
  // ---------------------------------------------------------------------------
  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, active: pathname === "/" },
    { name: "Invoice", href: "/invoices", icon: FileText, active: pathname.startsWith("/invoices") },
    { name: "Clients", href: "/clients", icon: Users, active: pathname.startsWith("/clients") },
    { name: "Payments", href: "/payments", icon: CreditCard, active: pathname.startsWith("/payments") },
  ];

  const activeWsLogo = activeWorkspaceObj?.logoUrl || profile.workspaceLogo || "";

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex transition-colors duration-200">
      <aside className="w-64 bg-[#FAF9F6] border-r border-[#EAE8E4] flex flex-col justify-between shrink-0 transition-colors duration-200">
        <div>
          <div className="h-16 px-5 flex items-center gap-3 border-b border-[#EAE8E4]">
            <img
              src="/logo.svg"
              alt="Sapi"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
              className="w-8 h-8 object-contain transition-transform duration-300 hover:scale-105"
            />
            <span className="font-bold text-lg tracking-wide text-gray-900">SAPI</span>
          </div>

          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${item.active
                      ? "bg-[#FBECE5] text-[#C85228] font-semibold"
                      : "text-[#575450] hover:bg-[#F3F2EE] hover:text-gray-900 font-medium"
                    }`}
                >
                  <IconComponent
                    size={18}
                    className={`transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-0.5 group-hover:scale-110 ${item.active ? "text-[#C85228]" : "text-[#686662] group-hover:text-[#C85228]"
                      }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-[#EAE8E4]">
          <div className="space-y-1 mb-3">
            <Link
              href="/settings"
              className={`group flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-xl text-sm transition-all ${pathname.startsWith("/settings")
                  ? "bg-[#FBECE5] text-[#C85228] font-semibold"
                  : "text-[#575450] hover:bg-[#F3F2EE] hover:text-gray-900 font-medium"
                }`}
            >
              <Settings
                size={18}
                className="transition-transform duration-300 group-hover:rotate-45 group-hover:text-[#C85228]"
              />
              <span>Settings</span>
            </Link>
            <Link
              href="/settings?tab=appearance"
              className="group flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-xl text-sm text-[#575450] hover:bg-[#F3F2EE] hover:text-gray-900 font-medium transition-all"
            >
              <Palette
                size={18}
                className="transition-transform duration-300 group-hover:scale-110 group-hover:text-[#C85228]"
              />
              <span>Appearance</span>
            </Link>
            <Link
              href="/settings?tab=security"
              className="group flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-xl text-sm text-[#575450] hover:bg-[#F3F2EE] hover:text-gray-900 font-medium transition-all"
            >
              <HelpCircle
                size={18}
                className="transition-transform duration-300 group-hover:scale-110 group-hover:text-[#C85228]"
              />
              <span>Help & Security</span>
            </Link>
          </div>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-[#F3F2EE] transition-colors border border-transparent hover:border-[#E5E4DF] cursor-pointer"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#EAE8E4]"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#FADCD0] text-[#C85228] flex items-center justify-center font-bold text-xs shrink-0">
                    {getInitials(profile.fullName)}
                  </div>
                )}
                <div className="overflow-hidden text-left">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {profile.fullName || "Freelancer"}
                  </p>
                  <p className="text-xs text-[#686662] truncate">
                    {profile.country || "Nigeria"} • {workspaceList.length}{" "}
                    {workspaceList.length === 1 ? "Brand" : "Brands"}
                  </p>
                </div>
              </div>
              <ChevronDown
                size={15}
                className={`text-[#686662] shrink-0 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {isProfileOpen && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-[#EAE8E4] rounded-xl shadow-lg py-1.5 z-50">
                <div className="px-3.5 py-2 border-b border-[#EAE8E4]">
                  <p className="text-xs font-semibold text-gray-900 truncate">{profile.fullName}</p>
                  <p className="text-[11px] text-[#686662] truncate">{profile.email}</p>
                </div>
                <Link
                  href="/settings?tab=profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-[#FAF9F6] font-medium"
                >
                  <User size={15} /> Profile & Photo
                </Link>
                <Link
                  href="/settings?tab=workspace"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-[#FAF9F6] font-medium"
                >
                  <Building2 size={15} /> Workspaces ({workspaceList.length})
                </Link>
                <Link
                  href="/settings?tab=appearance"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2 text-sm text-gray-700 hover:bg-[#FAF9F6] font-medium"
                >
                  <span className="flex items-center gap-2.5">
                    <Palette size={15} /> Appearance
                  </span>
                  <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#F3F2EE] text-[#C85228]">
                    {theme}
                  </span>
                </Link>
                <div className="my-1 border-t border-[#EAE8E4]" />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-500/10 w-full text-left font-medium cursor-pointer"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-[#FAF9F6] border-b border-[#EAE8E4] px-8 flex items-center justify-between shrink-0 relative transition-colors duration-200">
          <input
            type="text"
            placeholder="Search invoices, clients, or tx hashes..."
            className="w-80 bg-[#F3F2EE] border border-[#E5E4DF] rounded-xl px-3.5 py-2 text-sm text-gray-900 placeholder:text-[#686662] focus:outline-none focus:border-[#C85228] transition-all"
          />

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#F3F2EE] p-1 rounded-xl border border-[#E5E4DF]">
              {(
                [
                  { id: "light", icon: Sun, label: "Light" },
                  { id: "dark", icon: Moon, label: "Dark" },
                  { id: "system", icon: Monitor, label: "Auto" },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const isActive = theme === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTheme(item.id)}
                    title={`${item.label} Theme`}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${isActive
                        ? "bg-white text-[#C85228] shadow-sm"
                        : "text-[#686662] hover:text-gray-900"
                      }`}
                  >
                    <Icon size={13} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-xl text-[#575450] hover:text-gray-900 hover:bg-[#F3F2EE] transition-colors cursor-pointer"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C85228]" />
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute top-full mt-2 right-0 w-80 bg-white border border-[#EAE8E4] rounded-2xl shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#EAE8E4] flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                      Notifications ({unreadCount})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setNotifications(notifications.map((n) => ({ ...n, unread: false })))
                      }
                      className="text-xs text-[#C85228] hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-[#EAE8E4]">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 flex items-start gap-3 ${n.unread ? "bg-[#FAF9F6]" : "bg-white"
                          }`}
                      >
                        <CheckCircle2 size={16} className="text-[#C85228] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-gray-900">{n.title}</p>
                          <p className="text-xs text-[#686662] mt-0.5">{n.desc}</p>
                          <p className="text-[10px] text-[#8C8985] mt-1">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={workspaceRef}>
              <button
                type="button"
                onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
                className="h-10 bg-[#F3F2EE] pl-1.5 pr-3 rounded-xl flex items-center gap-2.5 border border-[#E5E4DF] hover:bg-[#EAE8E4] active:scale-[0.99] transition-all cursor-pointer"
              >
                {activeWsLogo ? (
                  <img
                    src={activeWsLogo}
                    alt={profile.workspaceName}
                    className="w-7 h-7 rounded-lg object-cover shrink-0 border border-black/5"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-[#C85228] text-white flex items-center justify-center font-bold text-[11px] tracking-tight leading-none shrink-0 shadow-2xs">
                    {getInitials(profile.workspaceName || "WS")}
                  </div>
                )}
                <span className="text-sm font-semibold text-gray-900 max-w-[160px] truncate">
                  {profile.workspaceName || "My Workspace"}
                </span>
                <ChevronDown
                  size={15}
                  className={`text-[#686662] shrink-0 transition-transform duration-200 ${isWorkspaceOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {isWorkspaceOpen && (
                <div className="absolute top-full mt-2 right-0 w-72 bg-white border border-[#EAE8E4] rounded-2xl shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#EAE8E4] flex items-center justify-between">
                    <p className="text-[10px] text-[#686662] font-bold uppercase tracking-wider">
                      Your Workspaces ({workspaceList.length})
                    </p>
                    <span className="text-[10px] text-[#C85228] font-semibold">
                      {profile.country || "Nigeria"}
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto py-1 divide-y divide-[#EAE8E4]/50">
                    {workspaceList.map((ws) => {
                      const isCurrent = ws.id === profile.activeWorkspaceId;
                      return (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => handleSwitchWorkspace(ws.id)}
                          className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition-colors cursor-pointer ${isCurrent ? "bg-[#FBECE5]/40" : "hover:bg-[#FAF9F6]"
                            }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {ws.logoUrl ? (
                              <img
                                src={ws.logoUrl}
                                alt={ws.name}
                                className="w-8 h-8 rounded-lg object-cover shrink-0 border border-[#EAE8E4]"
                              />
                            ) : (
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs tracking-tight shrink-0 ${isCurrent
                                    ? "bg-[#C85228] text-white"
                                    : "bg-[#F3F2EE] text-gray-700"
                                  }`}
                              >
                                {getInitials(ws.name)}
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {ws.name}
                              </p>
                              <p className="text-[11px] text-[#686662] truncate">
                                {ws.category}
                              </p>
                            </div>
                          </div>
                          {isCurrent && <Check size={15} className="text-[#C85228] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1 mt-1 border-t border-[#EAE8E4] px-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsWorkspaceOpen(false);
                        setIsNewWorkspaceModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#C85228] hover:bg-[#FBECE5]/50 transition-colors cursor-pointer"
                    >
                      <Plus size={15} /> Create New Workspace
                    </button>
                    <Link
                      href="/settings?tab=workspace"
                      onClick={() => setIsWorkspaceOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-[#FAF9F6]"
                    >
                      <Building2 size={14} /> Manage Brand Logos & Wallets
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-8 overflow-y-auto h-[calc(100vh-4rem)]">{children}</div>
      </main>

      {isNewWorkspaceModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#EAE8E4] rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE8E4]">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create New Workspace</h3>
                <p className="text-xs text-[#686662]">
                  Add a separate brand with its own logo, invoices, and Stellar wallet.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewWorkspaceModalOpen(false)}
                className="p-1.5 rounded-lg text-[#686662] hover:bg-[#F3F2EE]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateNewWorkspace} className="mt-5 space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F5F4] border border-[#E5E4DF] cursor-pointer hover:border-[#C85228] transition-colors">
                <div className="w-11 h-11 rounded-xl bg-[#FBECE5] text-[#C85228] flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                  {newWsLogo ? (
                    <img src={newWsLogo} alt="New Brand Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload size={18} />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Upload Workspace Logo</p>
                  <p className="text-[11px] text-[#686662]">
                    {newWsLogo ? "Logo ready — click to change" : "PNG, JPG, or SVG square icon"}
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const dataUrl = await compressImageFile(file, 180);
                      setNewWsLogo(dataUrl);
                    }
                  }}
                />
              </label>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#686662] mb-1">
                  Brand / Workspace Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Software Labs"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#EAE8E4] rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#C85228]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#686662] mb-1">
                  Category / Focus
                </label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineering, Design Consultancy"
                  value={newWsCategory}
                  onChange={(e) => setNewWsCategory(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#EAE8E4] rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#C85228]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#686662] mb-1">
                  Dedicated Stellar USDC Wallet (Optional)
                </label>
                <input
                  type="text"
                  placeholder="GABCD... (Leave blank to set later)"
                  value={newWsWallet}
                  onChange={(e) => setNewWsWallet(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#EAE8E4] rounded-xl px-3.5 py-2.5 text-sm font-mono text-gray-900 focus:outline-none focus:border-[#C85228]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EAE8E4]">
                <button
                  type="button"
                  onClick={() => setIsNewWorkspaceModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EAE8E4] text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#C85228] hover:bg-[#B0451F] text-white text-xs font-semibold cursor-pointer"
                >
                  Create & Switch Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}