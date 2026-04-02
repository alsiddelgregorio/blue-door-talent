/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  ArrowRight, 
  Menu, 
  X, 
  Instagram, 
  Linkedin, 
  Twitter, 
  Mail, 
  MapPin, 
  Phone, 
  LogOut, 
  User, 
  Lock,
  Briefcase,
  UserPlus,
  MessageSquare,
  Zap,
  Clock,
  TrendingUp,
  Search,
  Building2,
  Copy,
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  ArrowLeft,
  ExternalLink,
  Trash2,
  Pencil,
  Check,
  Save,
  ChevronRight,
  ChevronDown,
  HardHat,
  Map,
  Target,
  FileText,
  Star,
  Database,
  PlusCircle,
  Home,
  Users,
  History,
  ChevronLeft,
  Filter,
  Upload,
  Download,
  AlertCircle,
  Eye,
  EyeOff,
  FilePlus,
  BarChart as BarChartIcon
} from "lucide-react";
import Papa from "papaparse";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GENERAL_CONTRACTORS, SPECIALTY_CONTRACTORS } from "./data/construction";
import { RESIDENTIAL_SERVICES } from "./data/residential";

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?" 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title?: string; 
  message?: string; 
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-3 p-4 bg-gray-50/50 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
};
import { 
  signOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  User as FirebaseUser
} from "firebase/auth";
import { Toaster, toast } from "sonner";
import { auth } from "./firebase";
import { cn } from "./lib/utils";
import { BOOLEAN_STRINGS, COMPANIES } from "./data/sourcing";
import { 
  SEED_WEEKS, 
  SEED_PLACEMENTS, 
  SEED_JO, 
  SEED_TP, 
  SEED_JL, 
  SEED_WIR, 
  SEED_L10 
} from "./data/dashboard";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Cell
} from 'recharts';

const GOALS = {
  meetings: 1000,
  subs: 370,
  int1: 200,
  int2: 85,
  place: 44,
  orders: 75,
  touch: 330,
  leads: 86,
  posts: 52,
  followers: 2600,
  revenue: 400000
};

const WGOALS = {
  meetings: 20,
  subs: 7,
  int1: 4,
  int2: 2,
  place: 1,
  orders: 1.5,
  touch: 6,
  leads: 2,
  posts: 1,
  followers: 50,
  revenue: 8000
};

const todayStr = () => new Date().toISOString().split('T')[0];
const getMonday = (d: string) => {
  const date = new Date(d + 'T00:00:00');
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0];
};
const fmtS = (d?: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];
const fmtLong = (d?: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
const fmtShortMonth = (d: Date | string) => {
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const isCurrentMonth = (d: Date) => {
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};
const pct = (v: number, g: number) => Math.min(Math.round((v / g) * 100), 100);

const WeeklyLogView = ({ weeks, setWeeks }: { weeks: any[], setWeeks: any }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    date: todayStr(),
    meetings: 0,
    subs: 0,
    int1: 0,
    int2: 0,
    posts: 0,
    postLinks: "",
    followers: 0
  });

  const prevFollowers = useMemo(() => {
    const sorted = [...weeks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    // Filter out the current editing entry if any
    const filtered = editingId ? sorted.filter(w => w.id !== editingId) : sorted;
    const prev = filtered.find(w => new Date(w.date) < new Date(formData.date));
    return prev ? prev.followers : 0;
  }, [formData.date, weeks, editingId]);

  const growth = formData.followers - prevFollowers;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mondayDate = getMonday(formData.date);
    const newEntry = { ...formData, date: mondayDate, id: editingId || Date.now() };
    
    if (editingId) {
      setWeeks(weeks.map(w => w.id === editingId ? newEntry : w));
      setEditingId(null);
      toast.success("Weekly log updated!");
    } else {
      setWeeks([newEntry, ...weeks]);
      toast.success("Weekly log saved!");
    }
    
    setFormData({
      date: todayStr(),
      meetings: 0,
      subs: 0,
      int1: 0,
      int2: 0,
      posts: 0,
      postLinks: "",
      followers: 0
    });
  };

  const handleEdit = (w: any) => {
    setEditingId(w.id);
    setFormData({
      date: w.date,
      meetings: w.meetings,
      subs: w.subs,
      int1: w.int1,
      int2: w.int2,
      posts: w.posts,
      postLinks: w.postLinks,
      followers: w.followers
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemove = (id: number) => {
    setRemovingId(id);
  };

  const confirmRemove = () => {
    if (removingId) {
      setWeeks(weeks.filter(w => w.id !== removingId));
      toast.success("Entry removed!");
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-bold text-navy">Weekly Activity Log</h1>
      
      <div className="bg-surf border border-navy/10 rounded-2xl p-8 shadow-sm">
        <h2 className="text-sm font-bold text-navy mb-6">{editingId ? "Edit Activity Week" : "Log Activity Week"}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[160px] space-y-1.5">
              <label className="text-[9px] font-bold text-tx-sec uppercase tracking-widest">Week (Monday)</label>
              <input 
                type="date" 
                required
                value={formData.date || ""}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-navy/20 rounded-md outline-none focus:border-navy text-tx-main text-xs" 
              />
            </div>
            <div className="w-28 space-y-1.5">
              <label className="text-[9px] font-bold text-tx-sec uppercase tracking-widest">Meetings</label>
              <input 
                type="number" 
                value={formData.meetings || 0}
                onChange={e => setFormData({...formData, meetings: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 bg-white border border-navy/20 rounded-md outline-none focus:border-navy text-tx-main text-xs" 
              />
            </div>
            <div className="w-32 space-y-1.5">
              <label className="text-[9px] font-bold text-tx-sec uppercase tracking-widest">Submissions</label>
              <input 
                type="number" 
                value={formData.subs || 0}
                onChange={e => setFormData({...formData, subs: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 bg-white border border-navy/20 rounded-md outline-none focus:border-navy text-tx-main text-xs" 
              />
            </div>
            <div className="w-32 space-y-1.5">
              <label className="text-[9px] font-bold text-tx-sec uppercase tracking-widest">1st Interviews</label>
              <input 
                type="number" 
                value={formData.int1 || 0}
                onChange={e => setFormData({...formData, int1: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 bg-white border border-navy/20 rounded-md outline-none focus:border-navy text-tx-main text-xs" 
              />
            </div>
            <div className="w-32 space-y-1.5">
              <label className="text-[9px] font-bold text-tx-sec uppercase tracking-widest">2nd Interviews</label>
              <input 
                type="number" 
                value={formData.int2 || 0}
                onChange={e => setFormData({...formData, int2: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 bg-white border border-navy/20 rounded-md outline-none focus:border-navy text-tx-main text-xs" 
              />
            </div>
            <div className="w-32 space-y-1.5">
              <label className="text-[9px] font-bold text-tx-sec uppercase tracking-widest">LinkedIn Posts</label>
              <input 
                type="number" 
                value={formData.posts || 0}
                onChange={e => setFormData({...formData, posts: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 bg-white border border-navy/20 rounded-md outline-none focus:border-navy text-tx-main text-xs" 
              />
            </div>
          </div>
          
          <div className="flex flex-col space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-tx-sec uppercase tracking-widest">LinkedIn Links</label>
                <input 
                  type="text" 
                  placeholder="Comma separated links..."
                  value={formData.postLinks || ""}
                  onChange={e => setFormData({...formData, postLinks: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-navy/20 rounded-md outline-none focus:border-navy text-tx-main text-xs" 
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-tx-sec uppercase tracking-widest">Current Followers</label>
                  <input 
                    type="number" 
                    value={formData.followers || 0}
                    onChange={e => setFormData({...formData, followers: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-white border border-navy/20 rounded-md outline-none focus:border-navy text-tx-main text-xs" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-tx-sec uppercase tracking-widest">Prev. Week</label>
                  <div className="w-full px-3 py-2 bg-surf-2 border border-navy/10 rounded-md text-tx-main text-xs font-bold truncate">
                    {prevFollowers.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-tx-sec uppercase tracking-widest">Growth</label>
                  <div className={cn(
                    "w-full px-3 py-2 border rounded-md text-xs font-bold truncate",
                    growth >= 50 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
                  )}>
                    {growth > 0 ? '+' : ''}{growth.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="w-36 bg-navy text-white py-2 rounded-md font-bold hover:opacity-90 transition-all text-[11px] shadow-sm uppercase tracking-wider">
                {editingId ? "Update Week" : "Submit Week"}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      date: todayStr(),
                      meetings: 0,
                      subs: 0,
                      int1: 0,
                      int2: 0,
                      posts: 0,
                      postLinks: "",
                      followers: 0
                    });
                  }}
                  className="w-36 bg-surf-2 text-navy py-2 rounded-md font-bold hover:bg-navy/5 transition-all text-[11px] shadow-sm uppercase tracking-wider border border-navy/10"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className="bg-surf border border-navy/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-navy/5">
          <h3 className="text-lg font-serif font-bold text-navy">Activity History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surf-2">
              <tr>
                <th className="p-4 text-left text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Week</th>
                <th className="p-4 text-center text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Meetings</th>
                <th className="p-4 text-center text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Subs</th>
                <th className="p-4 text-center text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Int 1</th>
                <th className="p-4 text-center text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Int 2</th>
                <th className="p-4 text-center text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Posts</th>
                <th className="p-4 text-center text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Growth</th>
                <th className="p-4 text-left text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Links</th>
                <th className="p-4 text-center text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {weeks.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(w => {
                const wPrev = weeks.filter(x => x.id !== w.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).find(x => new Date(x.date) < new Date(w.date));
                const wGrowth = w.followers - (wPrev ? wPrev.followers : 0);
                return (
                  <tr key={w.id} className="hover:bg-surf-2 transition-colors">
                    <td className="p-4 font-serif font-bold text-navy">{fmtLong(w.date)}</td>
                    <td className="p-4 text-center text-tx-sec">{w.meetings}</td>
                    <td className="p-4 text-center text-tx-sec">{w.subs}</td>
                    <td className="p-4 text-center text-tx-sec">{w.int1}</td>
                    <td className="p-4 text-center text-tx-sec">{w.int2}</td>
                    <td className="p-4 text-center text-tx-sec">{w.posts}</td>
                    <td className={cn(
                      "p-4 text-center font-bold",
                      wGrowth >= 50 ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {wGrowth > 0 ? '+' : ''}{wGrowth}
                    </td>
                    <td className="p-4 text-left text-[11px] text-tx-muted truncate max-w-[150px]" title={w.postLinks}>{w.postLinks}</td>
                    <td className="p-4 text-center space-x-2">
                      <button onClick={() => handleEdit(w)} className="text-brand-blue hover:text-navy transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleRemove(w.id)} className="text-rose-600 hover:text-rose-800 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={removingId !== null}
        onClose={() => setRemovingId(null)}
        onConfirm={confirmRemove}
        title="Remove Entry"
        message="Are you sure you want to remove this weekly log entry?"
      />
    </div>
  );
};

const LogPlacementView = ({ placements, setPlacements }: { placements: any[], setPlacements: any }) => {
  const [formData, setFormData] = useState({
    name: "",
    client: "",
    position: "",
    revenue: 0,
    tier: "Tier 1",
    start: todayStr()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPlacements([{ ...formData, id: Date.now() }, ...placements]);
    setFormData({
      name: "",
      client: "",
      position: "",
      revenue: 0,
      tier: "Tier 1",
      start: todayStr()
    });
    toast.success("Placement logged!");
  };

  return (
    <div className="space-y-10">
      <div className="max-w-2xl mx-auto">
        <div className="bg-surf border border-navy/10 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-serif font-bold text-navy mb-6">Log New Placement</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-tx-sec uppercase tracking-widest">Candidate Name</label>
              <input 
                type="text" 
                required
                value={formData.name || ""}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-navy/5 border border-navy/10 rounded-lg outline-none focus:border-light-blue text-tx-main text-sm" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-tx-sec uppercase tracking-widest">Client Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.client || ""}
                  onChange={e => setFormData({...formData, client: e.target.value})}
                  className="w-full px-4 py-2.5 bg-navy/5 border border-navy/10 rounded-lg outline-none focus:border-light-blue text-tx-main text-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-tx-sec uppercase tracking-widest">Position</label>
                <input 
                  type="text" 
                  required
                  value={formData.position || ""}
                  onChange={e => setFormData({...formData, position: e.target.value})}
                  className="w-full px-4 py-2.5 bg-navy/5 border border-navy/10 rounded-lg outline-none focus:border-light-blue text-tx-main text-sm" 
              />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-tx-sec uppercase tracking-widest">Revenue</label>
                <input 
                  type="number" 
                  required
                  value={formData.revenue || 0}
                  onChange={e => setFormData({...formData, revenue: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2.5 bg-navy/5 border border-navy/10 rounded-lg outline-none focus:border-light-blue text-tx-main text-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-tx-sec uppercase tracking-widest">Tier</label>
                <select 
                  value={formData.tier || "Tier 1"}
                  onChange={e => setFormData({...formData, tier: e.target.value})}
                  className="w-full px-4 py-2.5 bg-navy/5 border border-navy/10 rounded-lg outline-none focus:border-light-blue text-tx-main text-sm"
                >
                  <option value="Tier 1">Tier 1</option>
                  <option value="Tier 2">Tier 2</option>
                  <option value="Tier 3">Tier 3</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-tx-sec uppercase tracking-widest">Start Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.start || ""}
                  onChange={e => setFormData({...formData, start: e.target.value})}
                  className="w-full px-4 py-2.5 bg-navy/5 border border-navy/10 rounded-lg outline-none focus:border-light-blue text-tx-main text-sm" 
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-brand-blue text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition-all uppercase tracking-widest text-xs shadow-md">
              Log Placement
            </button>
          </form>
        </div>
      </div>

      <div className="bg-surf border border-navy/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-navy/5">
          <h3 className="text-lg font-serif font-bold text-navy">Recent Placements</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surf-2">
              <tr>
                <th className="p-4 text-left text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Candidate</th>
                <th className="p-4 text-left text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Client</th>
                <th className="p-4 text-left text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Tier</th>
                <th className="p-4 text-right text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {placements.slice(0, 5).map(p => (
                <tr key={p.id} className="hover:bg-surf-2 transition-colors">
                  <td className="p-4 font-serif font-bold text-navy">{p.name}</td>
                  <td className="p-4 text-tx-sec">{p.client}</td>
                  <td className="p-4 text-tx-sec">{p.tier}</td>
                  <td className="p-4 text-right font-mono font-bold text-brand-blue">${p.revenue?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const get2026WeeksByMonth = () => {
  const months: Record<string, string[]> = {};
  MONTHS.forEach(m => months[m] = []);
  
  let current = new Date('2026-01-05T00:00:00'); // First Monday of Jan 2026
  const end = new Date('2026-12-31T23:59:59');
  
  while (current <= end) {
    const monthName = MONTHS[current.getMonth()];
    months[monthName].push(new Date(current).toISOString().split('T')[0]);
    current.setDate(current.getDate() + 7);
  }
  return months;
};

const MonthlyTrackerView = ({ title, data, setData, goal, isJobOrder = false }: { title: string, data: any[], setData: any, goal: number, isJobOrder?: boolean }) => {
  const [activeMonth, setActiveMonth] = useState(MONTHS[new Date().getMonth()]);
  const [addingToWeek, setAddingToWeek] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [tierValue, setTierValue] = useState("Tier 1");
  
  const weeksByMonth = useMemo(() => get2026WeeksByMonth(), []);
  
  const getActualForMonth = (month: string) => {
    const monthIdx = MONTHS.indexOf(month);
    return data.filter(d => new Date(d.date + 'T00:00:00').getMonth() === monthIdx).length;
  };

  const getEntriesForWeek = (weekDate: string) => {
    return data.filter(d => d.date === weekDate);
  };

  const handleSave = () => {
    if (!inputValue.trim() || !addingToWeek) return;
    
    if (editingEntry) {
      let client = editingEntry.client;
      let position = inputValue;
      
      if (isJobOrder && inputValue.includes(" — ")) {
        const [c, p] = inputValue.split(" — ");
        client = c.trim();
        position = p.trim();
      }

      setData(data.map(d => d.id === editingEntry.id ? { ...d, client, position, tier: isJobOrder ? tierValue : undefined } : d));
      setEditingEntry(null);
    } else {
      let client = isJobOrder ? "New Client" : "Manual Entry";
      let position = inputValue;

      if (isJobOrder && inputValue.includes(" — ")) {
        const [c, p] = inputValue.split(" — ");
        client = c.trim();
        position = p.trim();
      }

      const newEntry = {
        id: Date.now(),
        client,
        position,
        date: addingToWeek,
        tier: isJobOrder ? tierValue : undefined,
        status: isJobOrder ? "Active" : undefined
      };
      setData([newEntry, ...data]);
      toast.success(`${title.slice(0, -1)} added successfully!`);
    }
    setInputValue("");
    // Keep addingToWeek set to stay on the same week as requested
  };

  const handleDelete = (id: number) => {
    setData(data.filter(d => d.id !== id));
  };

  const handleEdit = (entry: any) => {
    setAddingToWeek(entry.date);
    setEditingEntry(entry);
    if (isJobOrder && entry.client && entry.position) {
      setInputValue(`${entry.client} — ${entry.position}`);
    } else {
      setInputValue(entry.position);
    }
    if (isJobOrder && entry.tier) setTierValue(entry.tier);
  };

  const totalActual = data.length;
  const totalProgress = Math.round((totalActual / goal) * 100);
  const remaining = Math.max(0, goal - totalActual);

  return (
    <div className="space-y-6">
      {/* Header & Progress */}
      <div className="bg-surf border border-navy/10 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-serif font-bold text-navy">{activeMonth} 2026 — {title}</h2>
            <p className="text-[10px] text-tx-muted mt-1 uppercase tracking-widest">
              {isJobOrder ? "Click entry to edit · Press Enter to save" : "Click + to add · Click entry to edit · Press Enter to stay on week"}
            </p>
          </div>
          <button className="px-4 py-2 border border-navy/10 rounded-lg text-[11px] font-bold text-navy hover:bg-navy/5 transition-colors uppercase tracking-widest">
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="flex gap-8">
            <div className="text-center md:text-left">
              <p className="text-[9px] font-bold text-tx-muted uppercase tracking-[0.2em] mb-1">Goal</p>
              <p className="text-3xl font-serif font-bold text-navy">{goal}</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-[9px] font-bold text-tx-muted uppercase tracking-[0.2em] mb-1">Actual</p>
              <p className="text-3xl font-serif font-bold text-navy">{totalActual}</p>
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="flex justify-between items-end mb-2">
              <p className="text-[9px] font-bold text-tx-muted uppercase tracking-[0.2em]">Progress</p>
              <p className="text-xl font-serif font-bold text-brand-blue">{totalProgress}%</p>
            </div>
            <div className="h-2 w-full bg-navy/5 rounded-full overflow-hidden border border-navy/5 relative">
              <div className="h-full bg-brand-blue transition-all duration-1000" style={{ width: `${Math.min(totalProgress, 100)}%` }} />
            </div>
            <p className="text-[10px] text-navy font-bold mt-2 uppercase tracking-widest">{remaining} remaining</p>
          </div>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex flex-wrap gap-2">
        {MONTHS.map(m => (
          <button
            key={m}
            onClick={() => {
              setActiveMonth(m);
              setAddingToWeek(null);
              setEditingEntry(null);
              setInputValue("");
            }}
            className={cn(
              "px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest border transition-all",
              activeMonth === m 
                ? "bg-navy text-white border-navy shadow-md" 
                : "bg-surf text-tx-muted border-navy/10 hover:border-navy/30"
            )}
          >
            {m.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence mode="wait">
        {addingToWeek && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-surf border border-navy/10 rounded-2xl p-6 shadow-md"
          >
            <div className="text-[10px] font-bold text-navy uppercase tracking-widest mb-4">
              {editingEntry ? "Edit" : "Add"} {title.slice(0, -1)} — {fmtS(addingToWeek)}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-bold text-tx-muted uppercase tracking-widest flex items-center gap-1">
                  {isJobOrder ? "Job Details" : "Contact"} <Star className="w-2 h-2 text-brand-blue fill-brand-blue" />
                </label>
                {isJobOrder && (
                  <label className="text-[9px] font-bold text-tx-muted uppercase tracking-widest">Tier</label>
                )}
              </div>
              <div className="flex gap-3">
                <input
                  autoFocus
                  type="text"
                  value={inputValue || ""}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') {
                      setAddingToWeek(null);
                      setEditingEntry(null);
                      setInputValue("");
                    }
                  }}
                  placeholder={isJobOrder ? "Client Name — Position" : "Name (Company) — notes..."}
                  className="flex-1 bg-surf border border-navy/10 rounded-xl px-4 py-3 text-sm focus:border-brand-blue outline-none transition-all"
                />
                {isJobOrder && (
                  <select
                    value={tierValue || "Tier 1"}
                    onChange={(e) => setTierValue(e.target.value)}
                    className="bg-surf border border-navy/10 rounded-xl px-4 py-3 text-sm focus:border-brand-blue outline-none transition-all"
                  >
                    <option value="Tier 1">Tier 1</option>
                    <option value="Tier 2">Tier 2</option>
                    <option value="Tier 3">Tier 3</option>
                  </select>
                )}
                <button 
                  onClick={handleSave}
                  className="px-6 py-3 bg-navy text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-brand-blue transition-colors"
                >
                  Save
                </button>
                <button 
                  onClick={() => {
                    setAddingToWeek(null);
                    setEditingEntry(null);
                    setInputValue("");
                  }}
                  className="px-6 py-3 border border-navy/10 text-tx-muted text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-navy/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="bg-surf border border-navy/10 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-navy text-white">
              <th className="p-4 text-left text-[10px] font-bold uppercase tracking-widest border-r border-white/10 w-24">Week</th>
              <th className="p-4 text-left text-[10px] font-bold uppercase tracking-widest">
                {title.toUpperCase()} (UP TO 10/WEEK)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {weeksByMonth[activeMonth].map(week => {
              const entries = getEntriesForWeek(week);
              return (
                <tr key={week} className="hover:bg-surf-2 transition-colors group">
                  <td className="p-4 text-navy font-bold border-r border-navy/5 bg-surf-2/30">{fmtS(week)}</td>
                  <td className="p-0">
                    <div className="grid grid-cols-10 h-full min-h-[60px]">
                      {[...Array(10)].map((_, i) => {
                        const entry = entries[i];
                        return (
                          <div 
                            key={i} 
                            className={cn(
                              "border-r border-navy/5 p-2 relative group/cell min-h-[60px] flex items-center justify-center transition-all",
                              i === 9 ? "border-r-0" : "",
                              entry ? "bg-brand-blue/5" : "hover:bg-brand-blue/5"
                            )}
                          >
                            {entry ? (
                              <div 
                                onClick={() => handleEdit(entry)}
                                className="w-full h-full flex flex-col justify-center cursor-pointer"
                              >
                                  {isJobOrder && entry.client && (
                                    <p className="text-[9px] text-navy font-bold leading-tight line-clamp-1 mb-0.5">{entry.client}</p>
                                  )}
                                  <p className={cn(
                                    "text-navy leading-tight line-clamp-2",
                                    isJobOrder ? "text-[8px] font-medium" : "text-[10px] font-medium"
                                  )}>
                                    {entry.position}
                                  </p>
                                {entry.tier && (
                                  <p className="text-[8px] text-brand-blue font-bold uppercase mt-0.5">{entry.tier}</p>
                                )}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(entry.id);
                                  }}
                                  className="absolute top-1 right-1 opacity-0 group-hover/cell:opacity-100 text-navy hover:text-brand-blue transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              !isJobOrder && (
                                <button 
                                  onClick={() => {
                                    setAddingToWeek(week);
                                    setEditingEntry(null);
                                    setInputValue("");
                                  }}
                                  className="text-navy/10 group-hover/cell:text-brand-blue transition-colors"
                                >
                                  <PlusCircle className="w-5 h-5" strokeWidth={1.5} />
                                </button>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TouchpointsView = ({ touchpoints, setTouchpoints, goals }: { touchpoints: any[], setTouchpoints: any, goals: any }) => {
  return <MonthlyTrackerView title="Touchpoints" data={touchpoints} setData={setTouchpoints} goal={goals.touch} />;
};

const JobLeadsView = ({ jobLeads, setJobLeads, goals }: { jobLeads: any[], setJobLeads: any, goals: any }) => {
  return <MonthlyTrackerView title="Job Leads" data={jobLeads} setData={setJobLeads} goal={goals.leads} />;
};

const GoalsView = ({ goals, setGoals }: { goals: any, setGoals: any }) => {
  const [editGoals, setEditGoals] = useState(goals);

  const handleSave = () => {
    setGoals(editGoals);
    toast.success("Goals updated successfully!", {
      description: "Your recruitment targets have been synchronized across the dashboard.",
      duration: 3000,
    });
  };

  const fields = [
    { key: 'meetings', label: 'Candidate Meetings' },
    { key: 'subs', label: 'Submissions' },
    { key: 'int1', label: '1st Interviews' },
    { key: 'int2', label: '2nd Interviews' },
    { key: 'place', label: 'Placements' },
    { key: 'orders', label: 'Job Orders' },
    { key: 'touch', label: 'Touchpoints' },
    { key: 'leads', label: 'Job Leads' },
    { key: 'posts', label: 'LinkedIn Posts' },
    { key: 'followers', label: 'Follower Growth' },
    { key: 'revenue', label: 'Revenue ($)' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif font-bold text-navy">Goals</h1>
        <button 
          onClick={handleSave}
          className="bg-brand-blue text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-light-blue transition-colors shadow-md"
        >
          Save Goals
        </button>
      </div>

      <div className="bg-surf border border-navy/10 rounded-2xl p-8 shadow-sm">
        <h3 className="text-[10px] font-bold text-brand-blue uppercase tracking-[0.2em] mb-8">2026 Annual Goals</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {fields.map(f => (
            <div key={f.key} className="space-y-2">
              <label className="text-[10px] font-bold text-tx-sec uppercase tracking-widest">{f.label}</label>
              <input 
                type="number" 
                value={editGoals[f.key] || 0}
                onChange={e => setEditGoals({ ...editGoals, [f.key]: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-navy/5 border border-navy/10 rounded-lg outline-none focus:border-brand-blue text-tx-main text-sm font-medium"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const WIRView = ({ wirEntries, setWirEntries }: { wirEntries: any[], setWirEntries: any }) => {
  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    wirEntries.forEach(entry => {
      const monday = getMonday(entry.date);
      if (!groups[monday]) groups[monday] = [];
      groups[monday].push(entry);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [wirEntries]);

  return (
    <div className="space-y-8">
      {grouped.map(([monday, entries]) => (
        <div key={monday} className="bg-surf border border-navy/10 rounded-2xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8 border-b border-navy/5 pb-4">
            <h3 className="text-xl font-serif font-bold text-navy">Week of {fmtLong(monday)}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-green-600 uppercase tracking-[0.3em]">Successes</h4>
              <ul className="space-y-3">
                {entries.filter(e => e.type === 'Success').map(e => (
                  <li key={e.id} className="text-sm text-tx-sec leading-relaxed p-3 bg-green-50 rounded-lg border border-green-100">{e.content}</li>
                ))}
                {entries.filter(e => e.type === 'Success').length === 0 && <li className="text-xs text-tx-muted italic">No successes recorded</li>}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-[0.3em]">Challenges</h4>
              <ul className="space-y-3">
                {entries.filter(e => e.type === 'Challenge').map(e => (
                  <li key={e.id} className="text-sm text-tx-sec leading-relaxed p-3 bg-red-50 rounded-lg border border-red-100">{e.content}</li>
                ))}
                {entries.filter(e => e.type === 'Challenge').length === 0 && <li className="text-xs text-tx-muted italic">No challenges recorded</li>}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const L10RatingsView = ({ l10Ratings, setL10Ratings }: { l10Ratings: any[], setL10Ratings: any }) => {
  const grouped = useMemo(() => {
    const groups: Record<string, number[]> = {};
    l10Ratings.forEach(r => {
      const monday = getMonday(r.date);
      if (!groups[monday]) groups[monday] = [];
      groups[monday].push(r.score);
    });
    return Object.entries(groups).map(([monday, scores]) => ({
      date: monday,
      score: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    })).sort((a, b) => b.date.localeCompare(a.date));
  }, [l10Ratings]);

  return (
    <div className="bg-surf border border-navy/10 rounded-2xl overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-surf-2">
          <tr>
            <th className="p-5 text-left text-[10px] font-bold text-brand-blue uppercase tracking-[0.2em] border-b border-navy/5">Week (Monday)</th>
            <th className="p-5 text-left text-[10px] font-bold text-brand-blue uppercase tracking-[0.2em] border-b border-navy/5">Rating</th>
            <th className="p-5 text-left text-[10px] font-bold text-brand-blue uppercase tracking-[0.2em] border-b border-navy/5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy/5">
          {grouped.map(r => (
            <tr key={r.date} className="hover:bg-surf-2 transition-colors">
              <td className="p-5 font-serif font-bold text-navy">{fmtLong(r.date)}</td>
              <td className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-sm border border-brand-blue/20">
                    {r.score}
                  </div>
                  <div className="flex-1 h-1.5 bg-surf-3 rounded-full overflow-hidden max-w-[100px]">
                    <div className="h-full bg-brand-blue" style={{ width: `${r.score * 10}%` }} />
                  </div>
                </div>
              </td>
              <td className="p-5">
                <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border", 
                  r.score >= 8 ? "bg-blue-100 text-blue-700 border-blue-200" : 
                  r.score >= 5 ? "bg-slate-100 text-slate-700 border-slate-200" : 
                  "bg-navy text-white border-navy"
                )}>
                  {r.score >= 8 ? "Excellent" : r.score >= 5 ? "Average" : "Poor"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface BooleanEntry {
  id: string;
  category: string;
  industry: string;
  client: string;
  title: string;
  booleanTitle: string;
  keywords: string;
}

const MOCK_BOOLEAN_ENTRIES: BooleanEntry[] = [
  {
    id: '1',
    category: 'Placements',
    industry: 'Residential Services',
    client: 'Ahlum & Arbor',
    title: 'Director of Operations',
    booleanTitle: '(("general manager" OR "Branch manager" OR "director" OR "region" OR "GM" OR "regional") OR (("manager" OR "director") AND ("operations" OR "operation"))) ',
    keywords: '—'
  },
  {
    id: '2',
    category: 'Placements',
    industry: 'Residential Services',
    client: 'Blue Cardinal',
    title: 'Regional Director of Operations',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '3',
    category: 'Placements',
    industry: 'Residential Services',
    client: 'Bonney',
    title: 'CEO',
    booleanTitle: '("Chief" OR "President" OR "Region" OR "Regional" OR "Division" OR "Divisional" OR "Market" OR "COO" OR "CEO" OR "VP")',
    keywords: '—'
  },
  {
    id: '4',
    category: 'Placements',
    industry: 'Construction',
    client: 'Dune Companies',
    title: 'Project Manager',
    booleanTitle: '("project manager" OR "assistant project manager" OR "construction manager")',
    keywords: '—'
  },
  {
    id: '5',
    category: 'Placements',
    industry: 'Residential Services',
    client: 'Eco Plumbers',
    title: 'Cincinnati Operations Manager',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '6',
    category: 'Placements',
    industry: 'Residential Services',
    client: 'Eco Plumbers',
    title: 'HVAC Trade Line Manager',
    booleanTitle: '("general manager" OR "director" OR "region" OR "division" OR "GM" OR "manager")',
    keywords: '—'
  },
  {
    id: '7',
    category: 'Placements',
    industry: 'Residential Services',
    client: 'Eco Plumbers',
    title: 'VP Central Region',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '8',
    category: 'Placements',
    industry: 'Residential Services',
    client: 'Eco Plumbers',
    title: 'VP of Operations',
    booleanTitle: '("President" OR "VP" OR "SVP" OR "Regional" OR "Region" OR "General Manager" OR "GM" OR "COO" OR "Chief Operating Officer" OR "division" OR "divisional" OR "director")',
    keywords: '—'
  },
  {
    id: '9',
    category: 'Placements',
    industry: 'Residential Services',
    client: 'Eco Plumbers',
    title: 'VP of Sales',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '10',
    category: 'Placements',
    industry: 'Residential Services',
    client: 'Eco Plumbers',
    title: 'Director of HR',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '11',
    category: 'Placements',
    industry: 'Construction',
    client: 'Edwards Companies',
    title: 'Project Manager',
    booleanTitle: '("Construction Manager" OR "Project Manager" OR "Site Manager")',
    keywords: '—'
  },
  {
    id: '12',
    category: 'Placements',
    industry: 'Construction',
    client: 'Edwards Companies',
    title: 'Structural Superitendent',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '13',
    category: 'Placements',
    industry: 'Real Estate',
    client: 'Elford',
    title: 'Property Manager',
    booleanTitle: '("Property Manager" OR "Assistant Property Manager")',
    keywords: '—'
  },
  {
    id: '14',
    category: 'Placements',
    industry: 'Residential Services',
    client: 'Harts',
    title: 'President',
    booleanTitle: '("President" OR "VP" OR "SVP" OR "Regional" OR "Region" OR "General Manager" OR "GM" OR "COO" OR "Chief Operating Officer")',
    keywords: '—'
  },
  {
    id: '15',
    category: 'Placements',
    industry: 'Construction',
    client: 'Head Inc',
    title: 'Assistant Project Manager',
    booleanTitle: '("project engineer" OR "assistant project manager" OR "project manager" OR "APM" OR "PM")',
    keywords: '—'
  },
  {
    id: '16',
    category: 'Placements',
    industry: 'Real Estate',
    client: 'Huber Equity Group',
    title: 'Area Director',
    booleanTitle: '("President" OR "VP" OR "SVP" OR "Regional" OR "Region" OR "General Manager" OR "GM" OR "COO" OR "Chief Operating Officer" OR "division" OR "divisional")',
    keywords: '—'
  },
  {
    id: '17',
    category: 'Placements',
    industry: 'Construction',
    client: 'InDecca',
    title: 'Traveling Superintendent',
    booleanTitle: '(("Superintendent" OR "Supervisor" OR "manager") AND ("Interior Renovation" OR "Tenant Improvement") AND ("Travel" OR "Traveling"))',
    keywords: '—'
  },
  {
    id: '18',
    category: 'Placements',
    industry: 'Construction',
    client: 'Luby Equipment',
    title: 'HR Director',
    booleanTitle: '(("manager" OR "director" OR "generalist" OR "business partner") AND ("HR" OR "human resources" OR "talent" OR "people"))',
    keywords: '—'
  },
  {
    id: '19',
    category: 'Placements',
    industry: 'Residential Services',
    client: 'MABLE',
    title: 'General Manager - Nashville',
    booleanTitle: '("branch" OR "operations" OR "service" OR "manager" OR "General Manager" OR "GM")',
    keywords: '("plumbing" OR "HVAC" OR "electric" OR "gutters" OR "roofing" OR "siding" OR "windows" OR "landscaping" OR "pest control" OR "painting" OR "flooring")'
  },
  {
    id: '20',
    category: 'Placements',
    industry: 'Residential Services',
    client: 'MABLE',
    title: 'VP of Marketing',
    booleanTitle: '(("marketing" OR "brand" OR "digital") AND ("director" OR "VP" OR "president" OR "manager" OR "Regional" OR "head"))',
    keywords: '—'
  },
  {
    id: '21',
    category: 'Placements',
    industry: 'Construction',
    client: 'MCAA',
    title: 'Executive Director',
    booleanTitle: '—',
    keywords: '("Labor Relations" OR "Collective Bargaining" OR "Union Negotiation" OR "Union Contracts" OR "Arbitration" OR "Mediation")'
  },
  {
    id: '22',
    category: 'Placements',
    industry: 'Construction',
    client: 'McGraw Kokosing',
    title: 'Assistant Vice President',
    booleanTitle: '("Project Executive" OR "PX" OR "Vice President" OR "VP" OR "Division" OR "Divisional" OR "Region" OR "Regional" OR "Director")',
    keywords: '—'
  },
  {
    id: '23',
    category: 'Placements',
    industry: 'Construction',
    client: 'Miles-McCllelan',
    title: 'Business Development Director',
    booleanTitle: '"business development" OR "sales"',
    keywords: '—'
  },
  {
    id: '24',
    category: 'Placements',
    industry: 'Real Estate',
    client: 'NACO',
    title: 'Acquisition and Entitlement Manager',
    booleanTitle: '"land"',
    keywords: '(("Land" AND "real estate") AND ("acquisition" OR "acquisitions" OR "entitlement" OR "entitlements" OR "development" OR "zoning"))'
  },
  {
    id: '25',
    category: 'Placements',
    industry: 'Real Estate',
    client: 'NACO',
    title: 'Development Analyst',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '26',
    category: 'Placements',
    industry: 'Construction',
    client: 'Nth Degree',
    title: 'Director of Construction',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '27',
    category: 'Placements',
    industry: 'Real Estate',
    client: 'Passov',
    title: 'Marketing Lead',
    booleanTitle: '("marketing" OR "social media" OR "communications" OR "digital")',
    keywords: '—'
  },
  {
    id: '28',
    category: 'Placements',
    industry: 'Real Estate',
    client: 'RiverWest Partners',
    title: 'Area Manager',
    booleanTitle: '(("manager" AND ("general" OR "regional" OR "district") OR "GM")',
    keywords: '("campground" or "rv park" or "national park" or "state park" or "outdoor recreation" or "camping" or "KOA" or "kampgrounds" OR "kampground" or "jellystone" or "good sam")'
  },
  {
    id: '29',
    category: 'Placements',
    industry: 'Real Estate',
    client: 'RiverWest Partners',
    title: 'General Manager - Berkshire',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '30',
    category: 'Placements',
    industry: 'Real Estate',
    client: 'RiverWest Partners',
    title: 'General Manager - Kozy Campground',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '31',
    category: 'Placements',
    industry: 'Real Estate',
    client: 'RiverWest Partners',
    title: 'General Manager - Pine Creek',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '32',
    category: 'Placements',
    industry: 'Real Estate',
    client: 'ROI Realty',
    title: 'Senior Property Manager',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '33',
    category: 'Placements',
    industry: 'Residential Services',
    client: 'RotoCo',
    title: 'Lancaster Branch Manager',
    booleanTitle: '("branch" OR "operations" OR "service" OR "manager" OR "General Manager" OR "GM")',
    keywords: '—'
  },
  {
    id: '34',
    category: 'Placements',
    industry: 'Residential Services',
    client: 'RotoCo',
    title: 'VP of Sales',
    booleanTitle: '(("sales") AND ("manager" OR "director" OR "Vice President" OR "VP" OR "division" OR "divisional" OR "region" OR "regional" OR "territory"))',
    keywords: '—'
  },
  {
    id: '35',
    category: 'Placements',
    industry: 'Residential Services',
    client: 'Salem Stones',
    title: 'Operations Manager',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '36',
    category: 'Placements',
    industry: 'Construction',
    client: 'Sauer',
    title: 'Project Manager - Jim Miller',
    booleanTitle: '("Assistant Project Manager" OR "Project Manager")',
    keywords: '—'
  },
  {
    id: '37',
    category: 'Placements',
    industry: 'Construction',
    client: 'Sauer',
    title: 'APM - Landon Waddell',
    booleanTitle: '("Project Engineer" "Assistant Project Manager")',
    keywords: '—'
  },
  {
    id: '38',
    category: 'Placements',
    industry: 'Construction',
    client: 'Sauer',
    title: 'APM - Tripp Lowery',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '39',
    category: 'Placements',
    industry: 'Construction',
    client: 'Sauer',
    title: 'APM Zeid Sabbah',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '40',
    category: 'Placements',
    industry: 'Construction',
    client: 'Sauer',
    title: 'Project Manager - Seif Alawabdeh',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '41',
    category: 'Placements',
    industry: 'Construction',
    client: 'Sauer',
    title: 'QA/QC/APM - Alex Ruth',
    booleanTitle: '("quality" OR "commissioning")',
    keywords: '—'
  },
  {
    id: '42',
    category: 'Placements',
    industry: 'Construction',
    client: 'Torgerson\'s',
    title: 'VP of Sales',
    booleanTitle: '("Director" OR "VP" OR "president" OR "Branch" OR "division" OR "divisional" OR "regional" OR "region" OR "market" OR "General Manager" OR "sales manager")',
    keywords: '(("Caterpillar" OR "CAT" OR "John Deere" OR "Deere" OR "CNH" OR "Case IH" OR "New Holland" OR "Komatsu" OR "Volvo Construction" OR "Hitachi" OR "Liebherr" OR "Bobcat" OR "Doosan" OR "DEVELON" OR "Sany" OR "XCMG" OR "Hyundai Construction" OR "JCB" OR "Kubota" OR "AGCO" OR "Terex" OR "Sandvik" OR "Paladin Attachments" OR "Genie" OR "JLG" OR "Vermeer" OR "Toro Company" OR "Astec" OR "Sennebogen" OR "LiuGong" OR "Link-Belt" OR "Kobelco" OR "Leeboy" OR "Ritchie Bros" OR "tractor" OR "forestry" OR "construction equipment" OR "heavy equipment") AND (("Montana" OR "Wyoming" OR "Washington" OR "Idaho") AND "sales"))'
  },
  {
    id: '43',
    category: 'Placements',
    industry: 'Construction',
    client: 'TRS',
    title: 'Estimator',
    booleanTitle: '"Project Manager" OR "Estimator" OR "Construction Manager" OR "Superintendent"',
    keywords: '—'
  },
  {
    id: '44',
    category: 'Placements',
    industry: 'Construction',
    client: 'Southeastern Equipment',
    title: 'CFO',
    booleanTitle: '(("president" OR "Director" OR "VP") AND ("finance" OR "financial" OR "FP&A"))',
    keywords: '—'
  },
  {
    id: '45',
    category: 'Placements',
    industry: 'Construction',
    client: 'Southeastern Equipment',
    title: 'VP of Sales',
    booleanTitle: '("Director" OR "VP" OR "president" OR "Branch" OR "division" OR "divisional" OR "regional" OR "region" OR "market" OR "territory" OR "General Manager")',
    keywords: '—'
  },
  {
    id: '46',
    category: 'Placements',
    industry: 'Construction',
    client: 'Vicory Machine & Fab',
    title: 'VP of Operations',
    booleanTitle: '("director" OR "general manager" OR "president" OR "GM" OR "VP" OR "region" OR "regional" OR "area" OR "division" OR "divisional")',
    keywords: '("industrial services" OR "rigging" OR "millwright" OR "fabrication" OR "Machine" OR "Machining" OR "maintenance" OR "manufacturing" OR "Job shop" OR "plant" OR "ISO" OR "AS9100")'
  },
  {
    id: '47',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'MABLE',
    title: 'Director of Sales',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '48',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'ACS',
    title: 'Director of Plumbing',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '49',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'ACS',
    title: 'General Manager',
    booleanTitle: '("branch" OR "operations" OR "service" OR "manager" OR "General Manager" OR "GM")',
    keywords: '("heating" OR "cooling" OR "plumbing" OR "HVAC" OR "home services" OR "Electrical" OR "electric")'
  },
  {
    id: '50',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'AFB Floors',
    title: 'Director of Sales',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '51',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'AFB Floors',
    title: 'Regional Manager',
    booleanTitle: '("Manager" OR "Regional" OR "Region" OR "territory" OR "Director" OR "general manager" OR "GM" OR "market" OR "Branch")',
    keywords: '("Market Expansion" OR "Greenfield" OR "New Locations" OR "New Market" OR "market research")'
  },
  {
    id: '52',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'Anderson Concrete',
    title: '',
    booleanTitle: '"General Foreman" OR "Quality" OR "Project Manager" OR "Assistant Project Manager" OR "Production Manager"',
    keywords: '(("Concrete" OR "Ready Mix" OR "Precast" OR "Cement" OR "Aggregates" OR "Aggregate") AND ("quality" OR "technician" OR "ACI" OR "testing" OR "standards"))'
  },
  {
    id: '53',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'Blue Cardinal',
    title: 'COO',
    booleanTitle: '("Chief" OR "President" OR "Region" OR "Regional" OR "Division" OR "Divisional" OR "Market" OR "COO" OR "CEO" OR "VP")',
    keywords: '—'
  },
  {
    id: '54',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'Blue Cardinal',
    title: 'Sales Manager, General Manager, Regional Director',
    booleanTitle: '"Regional" OR "Region" OR "Division"',
    keywords: '—'
  },
  {
    id: '55',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'Bonney',
    title: 'General Manager',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '56',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'Call Dad',
    title: 'Sales Director',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '57',
    category: 'Hold/Closed',
    industry: 'Real Estate',
    client: 'CityScapes',
    title: 'Director of Marketing',
    booleanTitle: '(("marketing" OR "Director" OR "President") AND ("Marketing" OR "Brand" OR "Communications"))',
    keywords: '—'
  },
  {
    id: '58',
    category: 'Hold/Closed',
    industry: 'Real Estate',
    client: 'Colliers',
    title: 'Director of Real Estate Services',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '59',
    category: 'Hold/Closed',
    industry: 'Real Estate',
    client: 'CollisionRight',
    title: '',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '60',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'Contractors Inc.',
    title: 'Executive VP',
    booleanTitle: '("Chief Executive Officer" OR "CEO" OR "President" OR "Chief Operating Officer" OR "COO" OR "Executive Vice President" OR "EVP" OR "Division Manager" OR "Business Unit" OR "SVP" OR "Senior Vice President" OR "Regional Manager")',
    keywords: '—'
  },
  {
    id: '61',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'Contractors Inc.',
    title: 'General Manager - Atlanta',
    booleanTitle: '("branch manager" OR "operations manager" OR "service manager" OR "General Manager" OR "GM")',
    keywords: '—'
  },
  {
    id: '62',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'Eco Plumbers',
    title: 'General Manager - Indianapolis',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '63',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'Eco Plumbers',
    title: 'HVAC Manager',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '64',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'Eco Plumbers',
    title: 'HVAC Trade Line Manager',
    booleanTitle: '("general manager" OR "director" OR "region" OR "regional" OR "GM" OR "operations manager" OR "trade line" OR "HVAC Manager")',
    keywords: '—'
  },
  {
    id: '65',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'Eco Plumbers',
    title: 'Internal Operations Directors',
    booleanTitle: '(("Call Center" OR "Contact Center" OR "Customer Service" OR "Dispatch") AND ("manager" OR "director" OR "supervisor"))',
    keywords: '—'
  },
  {
    id: '66',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'Eco Plumbers',
    title: 'Plumbing Manager',
    booleanTitle: '"plumbing" AND ("manager" OR "supervisor" OR "coach" OR "trainer" OR "team" OR "Director")',
    keywords: '—'
  },
  {
    id: '67',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'Eco Plumbers',
    title: 'Electrical Manager',
    booleanTitle: '(("lead" OR "manager" OR "supervisor" OR "director") AND ("electric" OR "electrical"))',
    keywords: '—'
  },
  {
    id: '68',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'Edwards',
    title: 'Contract Administrator',
    booleanTitle: '"Contracts Administrator" OR "Project Administrator" OR "Project Coordinator" OR "Project Administration"',
    keywords: '—'
  },
  {
    id: '69',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'Edwards',
    title: 'Project Manager - Delray 2.0',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '70',
    category: 'Hold/Closed',
    industry: 'Real Estate',
    client: 'Element8',
    title: 'Director of Asset Management',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '71',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'EXXCEL',
    title: 'Senior Site Superintendent',
    booleanTitle: '"Superintendent"',
    keywords: '(("Construction" AND ("Industrial" OR "Warehouse" OR "Manufacturing" OR "Data Center" OR "Distribution"))'
  },
  {
    id: '72',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'EXXCEL',
    title: 'VP of Sales',
    booleanTitle: '(("Director" OR "VP" OR "president" OR "Chief" OR "SVP" OR "Regional") OR ("business development" OR "sales"))',
    keywords: '("Industrial" OR "Warehouse" OR "Manufacturing" OR "Data Center" OR "Distribution")'
  },
  {
    id: '73',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'Fix-It',
    title: 'Controller',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '74',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'Fix-It',
    title: 'General Manager',
    booleanTitle: '(("branch" OR "operations" OR "service" OR "manager" OR "General Manager" OR "GM"))',
    keywords: '("plumbing" OR "HVAC" OR "electric" OR "gutters" OR "roofing" OR "siding" OR "windows" OR "landscaping" OR "pest control" OR "painting" OR "flooring" OR "foundation repair" OR "home services")'
  },
  {
    id: '75',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'GeoTex',
    title: 'Estimator',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '76',
    category: 'Hold/Closed',
    industry: 'Real Estate',
    client: 'Hallmark',
    title: 'CFO',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '77',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'Harts',
    title: 'VP of Marketing',
    booleanTitle: '(("marketing" OR "brand" OR "digital") AND ("director" OR "VP" OR "president" OR "manager" OR "Regional" OR "head"))',
    keywords: '—'
  },
  {
    id: '78',
    category: 'Hold/Closed',
    industry: 'Real Estate',
    client: 'Huber Equity Group',
    title: 'Director of Investments',
    booleanTitle: '("associate" OR "manager" OR "director" OR "analyst")',
    keywords: '("multi" OR "multi-family" OR "apartment" OR "apartments" OR "units")'
  },
  {
    id: '79',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'H-M',
    title: 'Senior PM-Operations Manager',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '80',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'InDecca',
    title: 'Director of Preconstruction',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '81',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'Kokosing',
    title: 'Assistant Safety Director',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '82',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'Kokosing',
    title: 'Market Leader',
    booleanTitle: '("director" OR "president" OR "VP" OR "project executive" OR "General Manager" OR "GM")',
    keywords: '—'
  },
  {
    id: '83',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'Kokosing',
    title: 'PX / Project Executive',
    booleanTitle: '("Project Executive" OR "PX" OR "Senior Project Manager" OR "Construction Executive" OR "Project Director")',
    keywords: '(("Data Center" OR "Data Centers" OR "Advanced Manufacturing" OR "Semiconductor" OR "Chip Manufacturing" OR "Cleanroom" OR "Cleanrooms" OR "High-Tech Facilities" OR "Battery Plant" OR "Battery Plants" OR "EV Manufacturing" OR "Pharmaceutical Manufacturing" OR "Biotech Facilities" OR "Mission Critical Facilities" OR "Hyperscale Data Centers" OR "Fab" OR "Fabrication Facilities" OR "Foundry")'
  },
  {
    id: '84',
    category: 'Hold/Closed',
    industry: 'Real Estate',
    client: 'LINK Property Management',
    title: 'Regional Manager',
    booleanTitle: '"Regional Property Manager" OR "Senior Property Manager" OR "Senior Community Manager"',
    keywords: '—'
  },
  {
    id: '85',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'Luby Equipment',
    title: 'HR Manager',
    booleanTitle: '(("human resources" OR "HR") AND ("manager" OR "business partner" OR "generalist" OR "senior"))',
    keywords: '—'
  },
  {
    id: '86',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'MABLE',
    title: 'CEO',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '87',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'MABLE',
    title: 'Sales Manager',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '88',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'O\'Rourke',
    title: 'Estimator',
    booleanTitle: '"estimating" OR "estimator" OR "preconstruction"',
    keywords: '("construction" OR "Building construction" OR "real estate" OR "Subcontractor" OR "Demolition" OR "civil" OR "Site Work" OR "Site Development" OR "Environmental Abatement")'
  },
  {
    id: '89',
    category: 'Hold/Closed',
    industry: 'Real Estate',
    client: 'Passov',
    title: 'Director of Marketing',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '90',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'Reeis',
    title: 'Plumbing Manager',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '91',
    category: 'Hold/Closed',
    industry: 'Real Estate',
    client: 'RiverWest',
    title: 'Area Manager',
    booleanTitle: '("Manager" OR "GM" OR "Operations" OR "General Manager" OR "Region" OR "Regional" OR "division")',
    keywords: '(("campground" or "rv park" or "national park" or "state park" or "outdoor recreation" or "camping" or "KOA" or "kampgrounds" OR "kampground" or "jellystone" or "cabins" OR "glamping" OR "lodge" OR "campgrounds") AND ("Ohio" OR "Indiana"))'
  },
  {
    id: '92',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'Robertson',
    title: 'Project Manager',
    booleanTitle: '("Project Manager" OR "Senior Project Manager" OR "Construction Manager" OR "PM")',
    keywords: '—'
  },
  {
    id: '93',
    category: 'Hold/Closed',
    industry: 'Real Estate',
    client: 'Rockbridge',
    title: 'RE Accountant',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '94',
    category: 'Hold/Closed',
    industry: 'Real Estate',
    client: 'Rockbridge',
    title: 'Senior FP&A Analyst',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '95',
    category: 'Hold/Closed',
    industry: 'Real Estate',
    client: 'Rockbridge',
    title: 'People & Culture Business Partner',
    booleanTitle: '("manager" OR "director" OR "generalist" OR "business partner") AND ("HR" OR "human resources" OR "talent" OR "people")',
    keywords: '—'
  },
  {
    id: '96',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'RotoCo',
    title: 'Director of Ops Support',
    booleanTitle: '("director" OR "division" OR "divisional" OR "region" OR "regional" OR "General Manager" OR "GM" OR "Operations Manager")',
    keywords: '("Plumbing" OR "Restoration")'
  },
  {
    id: '97',
    category: 'Hold/Closed',
    industry: 'Residential Services',
    client: 'RotoCo',
    title: 'Manteca Branch Manager',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '98',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'Sauer',
    title: 'Site Safety Manager',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '99',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'Sauer',
    title: 'BIM VDC Manager',
    booleanTitle: '—',
    keywords: '("BIM" OR "VDC" OR "CAD" OR "CADD")'
  },
  {
    id: '100',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'Sauer',
    title: 'Operations Manager',
    booleanTitle: '("Operations Manager" OR "operations director" OR "project executive" OR "senior project manager" OR "construction manager" OR "construction director" OR "director of project management" OR "General Manager")',
    keywords: '("mechanical" OR "HVAC" OR "plumbing")'
  },
  {
    id: '101',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'Southeastern Equipment',
    title: 'Director of Procurement',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '102',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'Southeastern Equipment',
    title: 'Director of Sales Support',
    booleanTitle: '(("Sales" OR "Commercial" OR "customer" OR "business development" OR "product") AND ("support" OR "enablement" OR "operations" OR "Technical") AND ("manager" OR "director"))',
    keywords: '—'
  },
  {
    id: '103',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'Southeastern Equipment',
    title: 'Regional Sales Manager',
    booleanTitle: '("Branch" OR "regional" OR "region" OR "market" OR "territory" OR "General Manager" OR "GM" OR "manager")',
    keywords: '—'
  },
  {
    id: '104',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'SHYFT',
    title: 'Director of Construction',
    booleanTitle: '(("Manager" OR "Director" OR "Executive" OR "Vice President") AND ("Project" OR "Construction" OR "Preconstruction"))',
    keywords: '—'
  },
  {
    id: '105',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'SHYFT',
    title: 'Superintendent',
    booleanTitle: '"Superintendent" OR "project manager"',
    keywords: '—'
  },
  {
    id: '106',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'Tenby',
    title: 'Director of Estimating & Preconstruction',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '107',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'Torgerson\'s',
    title: 'General Manager',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '108',
    category: 'Hold/Closed',
    industry: 'Construction',
    client: 'Victory',
    title: 'Millwright Director',
    booleanTitle: '("Manager" OR "Superintendent" OR "Division" OR "Director" OR "Supervisor" OR "Region" OR "Regional" OR "Branch" OR "Market" OR "Divisional" OR "Territory" OR "President")',
    keywords: '—'
  },
  {
    id: '109',
    category: 'Hold/Closed',
    industry: 'Real Estate',
    client: 'Wynn Developers',
    title: 'Director of Investments',
    booleanTitle: '("Investments" OR "investment" OR "acquisition" OR "acquisitions" OR "finance" OR "development")',
    keywords: '—'
  },
  {
    id: '110',
    category: 'Active Searches',
    industry: 'Residential Services',
    client: 'Canopy',
    title: 'Regional President, West Coast',
    booleanTitle: '("VP" OR "director" OR "Regional" OR "Region" OR "General Manager" OR "GM" OR "District" OR "Area" OR "division" OR "divisional")',
    keywords: '("plumbing" OR "cooling" OR "heating" OR "air conditioning" OR "HVAC" OR "electric" OR "gutters" OR "roofing" OR "siding" OR "windows" OR "landscaping" OR "pest control" OR "painting" OR "flooring" OR "tree" OR "arborist" OR "landscape" OR "horticulture")'
  },
  {
    id: '111',
    category: 'Active Searches',
    industry: 'Construction',
    client: 'Edwards',
    title: 'Senior Estimator',
    booleanTitle: '("estimating" OR "estimator")',
    keywords: '—'
  },
  {
    id: '112',
    category: 'Active Searches',
    industry: 'Real Estate',
    client: 'Element8',
    title: 'Investment Analyst',
    booleanTitle: '(("investment" OR "development" OR "acquisition" OR "financial") AND ("analyst" OR "associate"))',
    keywords: '—'
  },
  {
    id: '113',
    category: 'Active Searches',
    industry: 'Construction',
    client: 'IKPS',
    title: 'VP of Field Ops',
    booleanTitle: '("Manager" OR "Director" OR "President" OR "General Manager" OR "Regional Manager" OR "Area Manager" OR "Field")',
    keywords: '("Ohio" AND ("natural gas" OR "pipeline" OR "oil") AND "Construction")'
  },
  {
    id: '114',
    category: 'Active Searches',
    industry: 'Residential Services',
    client: 'Lighthouse',
    title: 'Regional President, NSW Aus',
    booleanTitle: '("general manager" OR "regional" OR "region" OR "director" OR "area" OR GM")',
    keywords: '"Heating" OR "Cooling" OR "Plumbing"'
  },
  {
    id: '115',
    category: 'Active Searches',
    industry: 'Residential Services',
    client: 'Mr. Roof',
    title: 'Sales Manager',
    booleanTitle: '(("sales") AND ("manager" OR "director" OR "division" OR "divisional" OR "region" OR "regional" OR "territory" OR "supervisor"))',
    keywords: '—'
  },
  {
    id: '116',
    category: 'Active Searches',
    industry: 'Real Estate',
    client: 'RiverWest',
    title: 'Development Manager',
    booleanTitle: '("associate" OR "manager" OR "director" OR "project manager")',
    keywords: '("developer" OR "development")'
  },
  {
    id: '117',
    category: 'Active Searches',
    industry: 'Real Estate',
    client: 'RiverWest',
    title: 'General Manager - Berkshire',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '118',
    category: 'Active Searches',
    industry: 'Real Estate',
    client: 'RiverWest',
    title: 'VP - Outdoor Hospitality',
    booleanTitle: '("director" OR "president" OR "Area" OR "region" OR "Regional" OR "general manager" OR "GM)',
    keywords: '("campground" OR "amusement park" OR "camping" OR "hospitality" OR "hotel")'
  },
  {
    id: '119',
    category: 'Active Searches',
    industry: 'Residential Services',
    client: 'RotoCo',
    title: 'Director of Ops Support (NEW)',
    booleanTitle: '(("operations" AND ("manager" OR "regional" OR "director" OR "supervisor" OR "region" OR "area"))',
    keywords: '("heating" OR "cooling" OR "plumbing" OR "HVAC" OR "electrical" OR "home services" OR "pest control")'
  },
  {
    id: '120',
    category: 'Active Searches',
    industry: 'Construction',
    client: 'Sauer',
    title: 'Operations Manager IPG',
    booleanTitle: '("senior project manager" OR "general manager" OR "operations manager" OR "director" OR "service manager" OR "project manager")',
    keywords: '(("mechanical" OR "HVAC") AND ("renovation" OR "replacement" OR "retrofit" OR "special projects" OR "SPD"))'
  },
  {
    id: '121',
    category: 'Active Searches',
    industry: 'Construction',
    client: 'TRS',
    title: 'Estimator (Cincinnati)',
    booleanTitle: '—',
    keywords: '—'
  },
  {
    id: '122',
    category: 'Active Searches',
    industry: 'Residential Services',
    client: 'Lighthouse',
    title: 'Head of Integrations',
    booleanTitle: '("Vice President" OR "VP" OR "Director" OR "manager")',
    keywords: '(("ServiceTitan" OR "Service Titan") AND ("post-acquisition" OR "post acquisition" OR integration OR integrations OR "M&A" OR "mergers and acquisitions" OR "acquisition integration" OR "roll-up" OR "roll up" OR consolidation))'
  },
  {
    id: '123',
    category: 'Active Searches',
    industry: 'Construction',
    client: 'Southeastern Equipment',
    title: 'CFO',
    booleanTitle: '(("Chief" OR "President" OR "Vice President" OR "VP" OR "SVP") AND ("Accounting" OR "finance" OR "financial"))',
    keywords: '("Caterpillar" OR "CAT" OR "John Deere" OR "Deere" OR "CNH" OR "Case IH" OR "New Holland" OR "Komatsu" OR "Volvo Construction" OR "Hitachi" OR "Liebherr" OR "Bobcat" OR "Doosan" OR "DEVELON" OR "Sany" OR "XCMG" OR "Hyundai Construction" OR "JCB" OR "Kubota" OR "AGCO" OR "Terex" OR "Sandvik" OR "Paladin Attachments" OR "Genie" OR "JLG" OR "Vermeer" OR "Toro Company" OR "Astec" OR "Sennebogen" OR "LiuGong" OR "Link-Belt" OR "Kobelco" OR "Leeboy" OR "Ritchie Bros" OR "tractor" OR "forestry" OR "construction equipment" OR "heavy equipment")'
  },
  {
    id: '124',
    category: 'Active Searches',
    industry: 'Construction',
    client: 'Sauer',
    title: 'APM-PM-SPM',
    booleanTitle: '("project engineer" OR "assistant project manager" OR "APM" OR "project manager" OR "PM" OR "senior project manager" OR "SPM" OR "Project" OR "project executive")',
    keywords: '("mechanical construction" OR "mechanical" OR "MEP" OR "commercial HVAC" OR "mission-critical" OR "data center" OR "electrical")'
  }
];

const BooleanView = ({ entries, setEntries }: { entries: BooleanEntry[], setEntries: React.Dispatch<React.SetStateAction<BooleanEntry[]>> }) => {
  const [formData, setFormData] = useState({
    category: 'Active Searches',
    industry: '',
    client: '',
    title: '',
    booleanTitle: '',
    keywords: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [selectedClient, setSelectedClient] = useState('All Clients');
  const [selectedTitle, setSelectedTitle] = useState('All Titles');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<BooleanEntry | null>(null);

  const handleCopy = (text: string, id: string) => {
    if (text === '—') return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = () => {
    if (!formData.client || !formData.title) {
      toast.error("Client and Title are required");
      return;
    }
    const newEntry: BooleanEntry = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData
    };
    setEntries([newEntry, ...entries]);
    setFormData({
      category: 'Active Searches',
      industry: '',
      client: '',
      title: '',
      booleanTitle: '',
      keywords: ''
    });
    toast.success("Entry saved");
  };

  const handleClear = () => {
    setFormData({
      category: 'Active Searches',
      industry: '',
      client: '',
      title: '',
      booleanTitle: '',
      keywords: ''
    });
  };

  const handleRemove = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
    toast.success("Entry removed");
  };

  const handleEdit = (item: BooleanEntry) => {
    setEditingId(item.id);
    setEditFormData({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  const handleUpdate = () => {
    if (!editFormData) return;
    if (!editFormData.client || !editFormData.title) {
      toast.error("Client and Title are required");
      return;
    }
    setEntries(entries.map(e => e.id === editingId ? editFormData : e));
    setEditingId(null);
    setEditFormData(null);
    toast.success("Entry updated");
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = Object.values(entry).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesCategory = selectedCategory === 'All Categories' || entry.category === selectedCategory;
      const matchesIndustry = selectedIndustry === 'All Industries' || entry.industry === selectedIndustry;
      const matchesClient = selectedClient === 'All Clients' || entry.client === selectedClient;
      const matchesTitle = selectedTitle === 'All Titles' || entry.title === selectedTitle;
      return matchesSearch && matchesCategory && matchesIndustry && matchesClient && matchesTitle;
    });
  }, [entries, searchTerm, selectedCategory, selectedIndustry, selectedClient, selectedTitle]);

  const totalPages = Math.ceil(filteredEntries.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedIndustry, selectedClient, selectedTitle, pageSize]);

  const categories = ['All Categories', 'Active Searches', 'Placements', 'Hold/Closed'];
  const industries = ['All Industries', 'Residential Services', 'Construction', 'Real Estate'];
  
  const uniqueClients = useMemo(() => {
    const clients = Array.from(new Set(entries.map(e => e.client))).sort();
    return ['All Clients', ...clients];
  }, [entries]);

  const uniqueTitles = useMemo(() => {
    const titles = Array.from(new Set(entries.map(e => e.title))).sort();
    return ['All Titles', ...titles];
  }, [entries]);

  return (
    <div className="flex flex-col gap-6 p-6 bg-surf min-h-screen">
      <h2 className="text-xl font-bold text-navy">Boolean Keywords</h2>
      
      {/* Add Entry Form */}
      <div className="bg-white rounded-xl border border-navy/10 p-6 shadow-sm">
        <h3 className="text-[14px] font-bold text-navy mb-4">Add Boolean Entry</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-tx-muted uppercase tracking-wider">Category</label>
            <select 
              className="w-full px-3 py-2 bg-white border border-navy/10 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              <option>Active Searches</option>
              <option>Placements</option>
              <option>Hold/Closed</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-tx-muted uppercase tracking-wider">Industry</label>
            <select 
              className="w-full px-3 py-2 bg-white border border-navy/10 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              value={formData.industry}
              onChange={e => setFormData({...formData, industry: e.target.value})}
            >
              <option value="">Select Industry</option>
              <option>Residential Services</option>
              <option>Construction</option>
              <option>Real Estate</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-tx-muted uppercase tracking-wider">Client</label>
            <input 
              type="text"
              placeholder="Company"
              className="w-full px-3 py-2 bg-white border border-navy/10 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              value={formData.client}
              onChange={e => setFormData({...formData, client: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-tx-muted uppercase tracking-wider">Title</label>
            <input 
              type="text"
              placeholder="Position"
              className="w-full px-3 py-2 bg-white border border-navy/10 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-tx-muted uppercase tracking-wider">Boolean Title String</label>
            <textarea 
              className="w-full px-3 py-2 bg-white border border-navy/10 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20 min-h-[38px] resize-y"
              value={formData.booleanTitle}
              onChange={e => setFormData({...formData, booleanTitle: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-tx-muted uppercase tracking-wider">Boolean Keywords</label>
            <textarea 
              className="w-full px-3 py-2 bg-white border border-navy/10 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20 min-h-[38px] resize-y"
              value={formData.keywords}
              onChange={e => setFormData({...formData, keywords: e.target.value})}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-navy text-white rounded-lg text-[14px] font-medium hover:bg-navy/90 transition-colors shadow-sm"
          >
            Save
          </button>
          <button 
            onClick={handleClear}
            className="px-6 py-2 bg-white border border-navy/10 text-navy rounded-lg text-[14px] font-medium hover:bg-navy/5 transition-colors shadow-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tx-muted" />
          <input 
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-navy/10 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 bg-white border border-navy/10 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select 
          className="px-4 py-2 bg-white border border-navy/10 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          value={selectedIndustry}
          onChange={e => setSelectedIndustry(e.target.value)}
        >
          {industries.map(ind => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
        <select 
          className="px-4 py-2 bg-white border border-navy/10 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          value={selectedClient}
          onChange={e => setSelectedClient(e.target.value)}
        >
          {uniqueClients.map(client => (
            <option key={client} value={client}>{client}</option>
          ))}
        </select>
        <select 
          className="px-4 py-2 bg-white border border-navy/10 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          value={selectedTitle}
          onChange={e => setSelectedTitle(e.target.value)}
        >
          {uniqueTitles.map(title => (
            <option key={title} value={title}>{title}</option>
          ))}
        </select>
        <span className="text-[13px] text-tx-muted">{filteredEntries.length} entries</span>
        <button 
          onClick={() => {
            setSearchTerm('');
            setSelectedCategory('All Categories');
            setSelectedIndustry('All Industries');
            setSelectedClient('All Clients');
            setSelectedTitle('All Titles');
          }}
          className="px-4 py-2 bg-white border border-navy/10 text-navy rounded-lg text-[14px] font-medium hover:bg-navy/5 transition-colors"
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-navy/5 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-navy/[0.02] border-b border-navy/5">
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider">Category</th>
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider">Industry</th>
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider">Client</th>
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider">Title</th>
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider">Boolean Title</th>
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider">Keywords</th>
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {paginatedEntries.map((item) => (
              <tr key={item.id} className={cn(
                "hover:bg-navy/[0.01] transition-colors group",
                editingId === item.id && "bg-brand-blue/[0.02]"
              )}>
                <td className="p-4">
                  {editingId === item.id ? (
                    <select 
                      className="w-full px-2 py-1 bg-white border border-navy/10 rounded text-[12px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                      value={editFormData?.category}
                      onChange={e => setEditFormData(prev => prev ? {...prev, category: e.target.value} : null)}
                    >
                      <option>Active Searches</option>
                      <option>Placements</option>
                      <option>Hold/Closed</option>
                    </select>
                  ) : (
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                      item.category === 'Placements' ? "bg-[#E6F4EA] text-[#1E8E3E]" : 
                      item.category === 'Hold/Closed' ? "bg-gray-100 text-gray-600" : "bg-[#E8F0FE] text-[#1967D2]"
                    )}>
                      {item.category}
                    </span>
                  )}
                </td>
                <td className="p-4 text-[13px] text-tx-muted">
                  {editingId === item.id ? (
                    <select 
                      className="w-full px-2 py-1 bg-white border border-navy/10 rounded text-[12px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                      value={editFormData?.industry}
                      onChange={e => setEditFormData(prev => prev ? {...prev, industry: e.target.value} : null)}
                    >
                      <option value="">Select Industry</option>
                      <option>Residential Services</option>
                      <option>Construction</option>
                      <option>Real Estate</option>
                    </select>
                  ) : item.industry}
                </td>
                <td className="p-4 text-[13px] font-bold text-navy">
                  {editingId === item.id ? (
                    <input 
                      type="text"
                      className="w-full px-2 py-1 bg-white border border-navy/10 rounded text-[12px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                      value={editFormData?.client}
                      onChange={e => setEditFormData(prev => prev ? {...prev, client: e.target.value} : null)}
                    />
                  ) : item.client}
                </td>
                <td className="p-4 text-[13px] text-tx-muted">
                  {editingId === item.id ? (
                    <input 
                      type="text"
                      className="w-full px-2 py-1 bg-white border border-navy/10 rounded text-[12px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                      value={editFormData?.title}
                      onChange={e => setEditFormData(prev => prev ? {...prev, title: e.target.value} : null)}
                    />
                  ) : item.title}
                </td>
                <td className="p-4 text-[13px] text-tx-muted max-w-[250px] whitespace-normal">
                  {editingId === item.id ? (
                    <textarea 
                      className="w-full px-2 py-1 bg-white border border-navy/10 rounded text-[12px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20 min-h-[38px]"
                      value={editFormData?.booleanTitle}
                      onChange={e => setEditFormData(prev => prev ? {...prev, booleanTitle: e.target.value} : null)}
                    />
                  ) : (
                    <div className="flex items-start gap-2">
                      <span className="break-words leading-relaxed block w-full">{item.booleanTitle}</span>
                      {item.booleanTitle !== '—' && (
                        <button 
                          onClick={() => handleCopy(item.booleanTitle, item.id)}
                          className="p-1 hover:bg-navy/5 rounded transition-colors flex-shrink-0"
                          title="Copy Boolean Title"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <FileText className="w-3.5 h-3.5 text-tx-muted group-hover:text-brand-blue" />}
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="p-4 text-[13px] text-tx-muted max-w-[300px] whitespace-normal">
                  {editingId === item.id ? (
                    <textarea 
                      className="w-full px-2 py-1 bg-white border border-navy/10 rounded text-[12px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20 min-h-[38px]"
                      value={editFormData?.keywords}
                      onChange={e => setEditFormData(prev => prev ? {...prev, keywords: e.target.value} : null)}
                    />
                  ) : (
                    <div className="flex items-start gap-2">
                      <span className="break-words leading-relaxed block w-full">{item.keywords}</span>
                      {item.keywords && (
                        <button 
                          onClick={() => handleCopy(item.keywords, item.id + '-kw')}
                          className="p-1 hover:bg-navy/5 rounded transition-colors flex-shrink-0"
                          title="Copy Keywords"
                        >
                          {copiedId === item.id + '-kw' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-tx-muted group-hover:text-brand-blue" />}
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="p-4 text-right">
                  {editingId === item.id ? (
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={handleUpdate}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Save Changes"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={handleCancelEdit}
                        className="p-1.5 text-tx-muted hover:bg-navy/5 rounded transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-tx-muted hover:text-brand-blue hover:bg-brand-blue/5 rounded transition-colors"
                        title="Edit Entry"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleRemove(item.id)}
                        className="p-1.5 text-tx-muted hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="text-[13px] text-tx-muted">
            Showing <span className="font-medium text-navy">{filteredEntries.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-medium text-navy">{Math.min(startIndex + pageSize, filteredEntries.length)}</span> of <span className="font-medium text-navy">{filteredEntries.length}</span> entries
          </div>
          <div className="flex items-center gap-2 text-[13px] text-tx-muted border-l border-navy/10 pl-4">
            <select 
              className="bg-transparent border-none focus:outline-none font-medium text-navy cursor-pointer"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-9 h-9 flex items-center justify-center text-[13px] font-medium text-navy bg-white border border-navy/10 rounded-lg hover:bg-navy/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1 px-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    "w-9 h-9 flex items-center justify-center text-[13px] font-medium rounded-lg transition-all",
                    currentPage === pageNum 
                      ? "bg-navy text-white shadow-sm" 
                      : "text-tx-sec hover:bg-navy/5"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="w-9 h-9 flex items-center justify-center text-[13px] font-medium text-navy bg-white border border-navy/10 rounded-lg hover:bg-navy/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const getGrade = (score: number) => {
  if (score >= 200) return 'A';
  if (score >= 150) return 'B';
  if (score >= 100) return 'C';
  return 'D';
};

const SCORECARD_CATEGORIES = [
  { id: 'fillability', label: 'Fillability', question: 'How confident are you in finding suitable candidates?', options: [
    { label: 'Easy - you filled similar jobs / same location in past month', score: 20, grade: 'A' },
    { label: 'Average - you filled similar jobs / same location in past 3 months', score: 10, grade: 'B' },
    { label: 'Difficult - your market knowledge is out of date', score: 0, grade: 'C' },
    { label: 'Extremely Difficult - We\'ve never filled this type of position before', score: -10, grade: 'D' }
  ]},
  { id: 'urgency', label: 'Urgency', question: 'How high a priority is filling this job quickly?', options: [
    { label: 'Extremely - client can and will hire immeditately', score: 20, grade: 'A' },
    { label: 'Critical hire, budget and headcount approved', score: 10, grade: 'B' },
    { label: 'Average', score: 0, grade: 'C' },
    { label: 'No urgency - willing to wait for the "perfect" candidate', score: -10, grade: 'D' }
  ]},
  { id: 'commitment', label: 'Commitment/Exclusivity', question: 'How much competition do you have for filling the position?', options: [
    { label: 'Retained/Engaged', score: 20, grade: 'A' },
    { label: 'Exclusive + Interview Dates', score: 10, grade: 'B' },
    { label: 'Client will also search', score: 0, grade: 'C' },
    { label: 'Multiple agencies', score: -10, grade: 'D' }
  ]},
  { id: 'salary', label: 'Salary/Package', question: 'How attractive is the compensation?', options: [
    { label: 'Above market rate', score: 20, grade: 'A' },
    { label: 'Competitive/realistic', score: 10, grade: 'B' },
    { label: 'Low to mid range', score: 0, grade: 'C' },
    { label: 'Below market rate / unrealistic', score: -10, grade: 'D' }
  ]},
  { id: 'cooperation', label: 'Client Cooperation', question: 'How involved and accessible is the hiring manager?', options: [
    { label: 'Full access to all stakeholders, hiring manager will take / return your calls', score: 20, grade: 'A' },
    { label: 'Some / limited access to hiring manager, strong relationship with senior HR/TA person', score: 10, grade: 'B' },
    { label: 'No access to hiring manager, HR/TA contact seems junior / lacks influence', score: 0, grade: 'C' },
    { label: 'VMS / portal', score: -10, grade: 'D' }
  ]},
  { id: 'difficulty', label: 'Difficulty', question: 'How much work is involved in filling this job?', options: [
    { label: 'You already know one or more qualified candidates', score: 20, grade: 'A' },
    { label: 'Database search / you have these candidates in your network', score: 10, grade: 'B' },
    { label: 'Headhunting / original research required', score: 0, grade: 'C' },
    { label: 'Needle in a haystack / Low probabiliy of success', score: -10, grade: 'D' }
  ]},
  { id: 'understanding', label: 'Understanding of Job', question: 'How complete is the brief?', options: [
    { label: 'Fully qualified', score: 20, grade: 'A' },
    { label: 'Part qualified', score: 10, grade: 'B' },
    { label: 'Job Spec', score: 0, grade: 'C' },
    { label: 'Title, Location, Salary only', score: -10, grade: 'D' }
  ]},
  { id: 'terms', label: 'Terms / Fee Agreement', question: 'The client will pay the fee and pay on time', options: [
    { label: 'Signed fee agreement / favourable', score: 20, grade: 'A' },
    { label: 'Signed fee agreement / some concessions', score: 10, grade: 'B' },
    { label: 'Terms sent, verbally agreed but not signed', score: 0, grade: 'C' },
    { label: 'Nothing agreed', score: -10, grade: 'D' }
  ]},
  { id: 'fee', label: 'Fee Percentage', question: 'How good is the fee level?', options: [
    { label: 'Full fee (30%+)', score: 20, grade: 'A' },
    { label: 'Good fee (25%+)', score: 10, grade: 'B' },
    { label: 'Average fee (20%+)', score: 0, grade: 'C' },
    { label: 'Low fee (<20%)', score: -10, grade: 'D' }
  ]},
  { id: 'relationship', label: 'Relationship', question: 'What is the trading history with this client?', options: [
    { label: 'Long term, repeat client - we\'ve made multiple placements', score: 20, grade: 'A' },
    { label: 'We\'ve made at least one successful placement with this client', score: 10, grade: 'B' },
    { label: 'New client', score: 0, grade: 'C' },
    { label: 'We\'ve been unsuccessful with this client in the past / poor ratios', score: -10, grade: 'D' }
  ]},
  { id: 'employer', label: 'Employer', question: 'How attractive is this company?', options: [
    { label: 'Top tier company, market leader, good employer, easy to sell', score: 20, grade: 'A' },
    { label: 'Mid range company or fast-growing with a great EVP', score: 10, grade: 'B' },
    { label: 'Average or unknown', score: 0, grade: 'C' },
    { label: 'Weak employer brand, negative Glassdoor reviews, poor reputation', score: -10, grade: 'D' }
  ]},
  { id: 'opportunity', label: 'Opportunity', question: 'How attractive is this job?', options: [
    { label: 'Excellent job, easy to sell', score: 20, grade: 'A' },
    { label: 'Great job for the right person', score: 10, grade: 'B' },
    { label: 'Average job', score: 0, grade: 'C' },
    { label: 'Unattractive job or location', score: -10, grade: 'D' }
  ]},
  { id: 'process', label: 'Process/Hiring Cycle', question: 'How efficient is the client\'s hiring process?', options: [
    { label: 'Excellent - speedy interview and decision-making process', score: 20, grade: 'A' },
    { label: 'Good - client understands the need to move quickly', score: 10, grade: 'B' },
    { label: 'Average / Room for improvement', score: 0, grade: 'C' },
    { label: 'Poor - client takes forever and loses candidates', score: -10, grade: 'D' }
  ]}
];

const JobOrderScorecard = ({ launch, onUpdate, onBack }: { launch: any, onUpdate: (updates: any) => void, onBack: () => void }) => {
  const scorecard = launch.scorecard || {};
  
  const handleSelect = (categoryId: string, score: number) => {
    onUpdate({
      scorecard: {
        ...scorecard,
        [categoryId]: score
      }
    });
  };

  const totalScore = (Object.values(scorecard) as number[]).reduce((sum: number, val: number) => sum + (val || 0), 0);
  const isComplete = SCORECARD_CATEGORIES.every(cat => scorecard[cat.id] !== undefined);
  const grade = getGrade(totalScore);

  const handleSubmit = () => {
    onUpdate({
      admin: {
        ...launch.admin,
        jobScorecard: true
      }
    });
    onBack();
  };

  return (
    <div className="space-y-6 relative">
      <div className="sticky top-0 z-50 bg-app-bg/95 backdrop-blur-md pb-4 pt-2 -mx-6 px-6 border-b border-navy/10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-navy/5 rounded-lg text-tx-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-serif font-bold text-navy">Job Order Scorecard</h1>
              <p className="text-sm text-tx-muted">{launch.jobTitle} @ {launch.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-navy text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-6">
              <div className="flex items-center gap-4 border-r border-white/10 pr-6">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Total Score</div>
                  <div className="text-3xl font-serif font-bold">{totalScore}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Grade</div>
                  <div className={cn(
                    "text-3xl font-serif font-bold",
                    grade === 'A' ? "text-emerald-400" : 
                    grade === 'B' ? "text-blue-400" : 
                    grade === 'C' ? "text-amber-400" : "text-rose-400"
                  )}>{grade}</div>
                </div>
              </div>
              {isComplete && (
                <button
                  onClick={handleSubmit}
                  className="bg-brand-blue hover:bg-brand-blue/90 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Submit Scorecard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {SCORECARD_CATEGORIES.map(category => (
          <div key={category.id} className="bg-surf border border-navy/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-navy/5 bg-navy/[0.02]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-navy uppercase tracking-wider">{category.label}</h3>
                {scorecard[category.id] !== undefined && (
                  <span className="text-brand-blue font-bold text-lg">
                    {category.options.find(o => o.score === scorecard[category.id])?.grade}
                  </span>
                )}
              </div>
              <p className="text-xs text-tx-muted mt-1">{category.question}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-navy/5">
              {category.options.map(option => (
                <button
                  key={option.grade}
                  onClick={() => handleSelect(category.id, option.score)}
                  className={cn(
                    "p-4 text-left transition-all hover:bg-navy/[0.02]",
                    scorecard[category.id] === option.score ? "bg-brand-blue/5 ring-1 ring-inset ring-brand-blue/30" : ""
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                      scorecard[category.id] === option.score ? "bg-brand-blue text-white" : "bg-navy/5 text-tx-muted"
                    )}>
                      {option.grade}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold",
                      option.score > 0 ? "text-emerald-600" : option.score < 0 ? "text-rose-600" : "text-tx-muted"
                    )}>
                      {option.score > 0 ? `+${option.score}` : option.score}
                    </span>
                  </div>
                  <p className={cn(
                    "text-[12px] leading-relaxed",
                    scorecard[category.id] === option.score ? "text-navy font-medium" : "text-tx-sec"
                  )}>
                    {option.label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SearchLaunchView = ({ launches, setLaunches, setBooleanEntries, setJobOrders }: { 
  launches: any[], 
  setLaunches: (l: any[]) => void, 
  setBooleanEntries: React.Dispatch<React.SetStateAction<BooleanEntry[]>>,
  setJobOrders: React.Dispatch<React.SetStateAction<any[]>>
}) => {
  const [selectedLaunchId, setSelectedLaunchId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newLaunchData, setNewLaunchData] = useState({ company: "", jobTitle: "", category: "Residential Services", tier: "Tier 1" });
  const [subView, setSubView] = useState<'main' | 'scorecard'>('main');

  const selectedLaunch = useMemo(() => 
    launches.find(l => l.id === selectedLaunchId), 
    [launches, selectedLaunchId]
  );

  useEffect(() => {
    if (selectedLaunchId) {
      setSubView('main');
    }
  }, [selectedLaunchId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [subView, selectedLaunchId]);

  const handleCreateLaunch = () => {
    if (!newLaunchData.company || !newLaunchData.jobTitle) {
      toast.error("Please enter both company and job title");
      return;
    }

    const newLaunch = {
      id: Date.now().toString(),
      company: newLaunchData.company,
      jobTitle: newLaunchData.jobTitle,
      category: newLaunchData.category,
      tier: newLaunchData.tier,
      status: 'Active',
      createdAt: new Date().toISOString(),
      admin: {
        internalMeeting: false,
        clientUpdateCalls: false,
        jobScorecard: false,
        loxoAdded: false,
        liProject: false,
        phoneScript: false,
        evalCriteria: false,
        outreachMessages: false,
        jobDescription: false,
      },
      research: {
        personas: { booleanTitle: "", geography: "", companies: Array(10).fill(""), keywords: "", yearsExp: "" },
        bdtList: { booleanTitle: "", geography: "", companies: Array(10).fill(""), keywords: "", yearsExp: "" },
        industryFilter: { booleanTitle: "", geography: "", keywords: "", yearsExp: "", industry: "", companySize: "" },
        keywordsFocus: { booleanTitle: "", geography: "", keywords: "", yearsExp: "", industry: "", companySize: "" },
        loxoPrior: Array(3).fill(""),
        indeedPosting: false,
        indeedQuery: false,
        liConnections: Array(10).fill(""),
      },
      enrichment: {
        apollo: false,
        loxoTagging: false,
        updateEmails: false,
        reviewPipeline: false,
      },
      outreach: {
        day1Text: false,
        day1LI: false,
        day2InMail: false,
        day4Email1: false,
        day8Email2: false,
        dayExtra: false,
      },
      scorecard: {}
    };

    // Create Job Order automatically
    const getMonday = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff)).toISOString().split('T')[0];
    };

    const newJobOrder = {
      id: Date.now() + 1,
      no: "New",
      tier: newLaunchData.tier,
      client: newLaunch.company,
      position: newLaunch.jobTitle,
      date: getMonday(new Date()),
      status: "Active"
    };

    setLaunches([...launches, newLaunch]);
    setJobOrders(prev => [newJobOrder, ...prev]);
    setNewLaunchData({ company: "", jobTitle: "", category: "Residential Services", tier: "Tier 1" });
    setIsCreating(false);
    setSelectedLaunchId(newLaunch.id);
    toast.success("Search launch created and Job Order recorded!");
  };

  const updateLaunch = (id: string, updates: any) => {
    setLaunches(launches.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const toggleCheck = (id: string, section: string, field: string) => {
    const launch = launches.find(l => l.id === id);
    if (!launch) return;
    
    const isChecking = !launch[section][field];
    const updatedSection = { ...launch[section], [field]: isChecking };
    updateLaunch(id, { [section]: updatedSection });

    if (field === 'jobScorecard' && isChecking) {
      setSubView('scorecard');
    }
  };

  const updateResearchField = (id: string, subSection: string, field: string, value: any) => {
    const launch = launches.find(l => l.id === id);
    if (!launch) return;

    const updatedResearch = {
      ...launch.research,
      [subSection]: typeof launch.research[subSection] === 'object' && !Array.isArray(launch.research[subSection])
        ? { ...launch.research[subSection], [field]: value }
        : value
    };
    updateLaunch(id, { research: updatedResearch });
  };

  const updateResearchArray = (id: string, subSection: string, index: number, value: string) => {
    const launch = launches.find(l => l.id === id);
    if (!launch) return;

    const newArray = [...launch.research[subSection]];
    newArray[index] = value;
    updateResearchField(id, subSection, "", newArray);
  };

  const updateNestedResearchArray = (id: string, subSection: string, index: number, value: string) => {
    const launch = launches.find(l => l.id === id);
    if (!launch) return;

    const newArray = [...launch.research[subSection].companies];
    newArray[index] = value;
    const updatedSub = { ...launch.research[subSection], companies: newArray };
    updateLaunch(id, { research: { ...launch.research, [subSection]: updatedSub } });
  };

  const handleSaveAllResearch = (launchId: string) => {
    const launch = launches.find(l => l.id === launchId);
    if (!launch) return;

    const sections = ['personas', 'bdtList', 'industryFilter', 'keywordsFocus'];
    const allTitles = sections
      .map(s => launch.research[s].booleanTitle)
      .filter(t => t && t.trim() !== "")
      .join(" | ");
    
    const allKeywords = sections
      .map(s => launch.research[s].keywords)
      .filter(k => k && k.trim() !== "")
      .join(" | ");

    if (!allTitles && !allKeywords) {
      toast.error("Please enter at least one Boolean Title or Keyword to save");
      return;
    }

    setBooleanEntries((prev: BooleanEntry[]) => {
      const existingIndex = prev.findIndex(e => e.client === launch.company && e.title === launch.jobTitle);
      
      const newEntry: BooleanEntry = {
        id: existingIndex >= 0 ? prev[existingIndex].id : Date.now().toString(),
        category: 'Active Searches',
        industry: launch.category || 'Residential Services',
        client: launch.company,
        title: launch.jobTitle,
        booleanTitle: allTitles,
        keywords: allKeywords
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newEntry;
        return updated;
      } else {
        return [newEntry, ...prev];
      }
    });

    toast.success("Boolean Keywords saved to Research!");
  };

  if (selectedLaunch) {
    if (subView === 'scorecard') {
      return (
        <JobOrderScorecard 
          launch={selectedLaunch} 
          onUpdate={(updates) => updateLaunch(selectedLaunch.id, updates)}
          onBack={() => setSubView('main')}
        />
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedLaunchId(null)}
              className="p-2 hover:bg-navy/5 rounded-lg text-tx-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-serif font-bold text-navy">{selectedLaunch.jobTitle}</h1>
              <div className="flex items-center gap-2 text-sm text-tx-muted">
                <span>{selectedLaunch.company}</span>
                {selectedLaunch.category && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-navy/20" />
                    <span className="font-medium text-brand-blue">{selectedLaunch.category}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
              selectedLaunch.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-navy/5 text-tx-muted"
            )}>
              {selectedLaunch.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Administration & Enrichment & Outreach */}
          <div className="space-y-6">
            {/* Administration */}
            <div className="bg-surf border border-navy/10 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-navy/5 bg-navy/[0.02] flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-brand-blue" />
                <h2 className="text-sm font-bold text-navy uppercase tracking-wider">Search Administration</h2>
              </div>
              <div className="p-6 space-y-3">
                {[
                  { id: 'internalMeeting', label: 'Schedule Internal Search Launch Meeting' },
                  { id: 'clientUpdateCalls', label: 'Schedule Client Update Calls' },
                  { id: 'jobScorecard', label: 'Grade the Job – Job Order Scorecard' },
                  { id: 'loxoAdded', label: 'Add the Job to Loxo' },
                  { id: 'liProject', label: 'Create LinkedIn Recruiter Project' },
                  { id: 'phoneScript', label: 'Write Phone Script' },
                  { id: 'evalCriteria', label: 'Evaluation Criteria to Candidate Template' },
                  { id: 'outreachMessages', label: 'Write Outreach Messages' },
                  { id: 'jobDescription', label: 'Write or Elevate the Job Description' },
                ].map(item => {
                  const isScorecard = item.id === 'jobScorecard';
                  const scorecard = selectedLaunch.scorecard || {};
                  const totalScore = (Object.values(scorecard) as number[]).reduce((sum: number, val: number) => sum + (val || 0), 0);
                  const isScorecardComplete = SCORECARD_CATEGORIES.every(cat => scorecard[cat.id] !== undefined);
                  const grade = getGrade(totalScore);

                  return (
                    <div key={item.id} className="flex items-center gap-3 group">
                      <input 
                        type="checkbox" 
                        checked={selectedLaunch.admin[item.id]}
                        onChange={() => toggleCheck(selectedLaunch.id, 'admin', item.id)}
                        className="w-4 h-4 rounded border-navy/20 text-brand-blue focus:ring-brand-blue"
                      />
                      <button 
                        onClick={() => {
                          if (isScorecard) {
                            setSubView('scorecard');
                          }
                        }}
                        className={cn(
                          "text-[13px] transition-colors text-left flex-1 flex items-center justify-between",
                          selectedLaunch.admin[item.id] ? "text-tx-muted" : "text-navy group-hover:text-brand-blue"
                        )}
                      >
                        <span className={cn(selectedLaunch.admin[item.id] && "line-through")}>{item.label}</span>
                        {isScorecard && isScorecardComplete && (
                          <span className={cn(
                            "ml-2 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm whitespace-nowrap",
                            grade === 'A' ? "bg-emerald-100 text-emerald-700" :
                            grade === 'B' ? "bg-blue-100 text-blue-700" :
                            grade === 'C' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                          )}>
                            Score: {totalScore} ({grade})
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Enrichment */}
            <div className="bg-surf border border-navy/10 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-navy/5 bg-navy/[0.02] flex items-center gap-2">
                <Database className="w-4 h-4 text-brand-blue" />
                <h2 className="text-sm font-bold text-navy uppercase tracking-wider">Data Enrichment</h2>
              </div>
              <div className="p-6 space-y-3">
                {[
                  { id: 'apollo', label: 'Apollo (LinkedIn Recruiter Profiles)' },
                  { id: 'loxoTagging', label: 'Loxo Tagging (From Database)' },
                  { id: 'updateEmails', label: 'Utilize Apollo to Update Emails' },
                  { id: 'reviewPipeline', label: 'Review the Pipeline for Prior Interactions' },
                ].map(item => (
                  <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedLaunch.enrichment[item.id]}
                      onChange={() => toggleCheck(selectedLaunch.id, 'enrichment', item.id)}
                      className="w-4 h-4 rounded border-navy/20 text-brand-blue focus:ring-brand-blue"
                    />
                    <span className={cn(
                      "text-[13px] transition-colors",
                      selectedLaunch.enrichment[item.id] ? "text-tx-muted line-through" : "text-navy group-hover:text-brand-blue"
                    )}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Outreach Campaign */}
            <div className="bg-surf border border-navy/10 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-navy/5 bg-navy/[0.02] flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-blue" />
                <h2 className="text-sm font-bold text-navy uppercase tracking-wider">Outreach Campaign</h2>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { id: 'day1Text', day: 'Day 1', label: 'Text High Profile Candidates' },
                  { id: 'day1LI', day: 'Day 1', label: 'LinkedIn Connection Requests' },
                  { id: 'day2InMail', day: 'Day 2', label: 'LinkedIn Recruiter InMail' },
                  { id: 'day4Email1', day: 'Day 4', label: 'Email 1' },
                  { id: 'day8Email2', day: 'Day 8', label: 'Email 2' },
                  { id: 'dayExtra', day: 'Day ?', label: 'Text/Call High Potential Candidates' },
                ].map(item => (
                  <div key={item.id} className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      checked={selectedLaunch.outreach[item.id]}
                      onChange={() => toggleCheck(selectedLaunch.id, 'outreach', item.id)}
                      className="w-4 h-4 mt-1 rounded border-navy/20 text-brand-blue focus:ring-brand-blue"
                    />
                    <div>
                      <div className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">{item.day}</div>
                      <div className={cn(
                        "text-[13px] transition-colors",
                        selectedLaunch.outreach[item.id] ? "text-tx-muted line-through" : "text-navy"
                      )}>
                        {item.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Research (Spans 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surf border border-navy/10 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-navy/5 bg-navy/[0.02] flex items-center gap-2">
                <Search className="w-4 h-4 text-brand-blue" />
                <h2 className="text-sm font-bold text-navy uppercase tracking-wider">Research Strategy</h2>
              </div>
              
              <div className="p-6 space-y-8">
                {/* LinkedIn Recruiter Sections */}
                {[
                  { id: 'personas', label: 'Personas-Focused Research' },
                  { id: 'bdtList', label: 'BDT List of Companies-Focused Research' },
                  { id: 'industryFilter', label: 'Industry Filter-Focused Research', extra: ['industry', 'companySize'] },
                  { id: 'keywordsFocus', label: 'Keywords-Focused Research', extra: ['industry', 'companySize'] },
                ].map(section => (
                  <div key={section.id} className="space-y-4">
                    <h3 className="text-[11px] font-bold text-brand-blue uppercase tracking-widest border-l-2 border-brand-blue pl-3">
                      LinkedIn Recruiter - {section.label}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-tx-muted uppercase tracking-widest">Boolean Title</label>
                        <input 
                          type="text" 
                          value={selectedLaunch.research[section.id].booleanTitle}
                          onChange={(e) => updateResearchField(selectedLaunch.id, section.id, 'booleanTitle', e.target.value)}
                          className="w-full px-3 py-2 bg-navy/[0.02] border border-navy/10 rounded-lg text-[13px] outline-none focus:border-brand-blue/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-tx-muted uppercase tracking-widest">Geography</label>
                        <input 
                          type="text" 
                          value={selectedLaunch.research[section.id].geography}
                          onChange={(e) => updateResearchField(selectedLaunch.id, section.id, 'geography', e.target.value)}
                          className="w-full px-3 py-2 bg-navy/[0.02] border border-navy/10 rounded-lg text-[13px] outline-none focus:border-brand-blue/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-tx-muted uppercase tracking-widest">Years of Experience</label>
                        <input 
                          type="text" 
                          value={selectedLaunch.research[section.id].yearsExp}
                          onChange={(e) => updateResearchField(selectedLaunch.id, section.id, 'yearsExp', e.target.value)}
                          className="w-full px-3 py-2 bg-navy/[0.02] border border-navy/10 rounded-lg text-[13px] outline-none focus:border-brand-blue/50"
                        />
                      </div>
                      {section.extra?.map(field => (
                        <div key={field} className="space-y-1">
                          <label className="text-[10px] font-bold text-tx-muted uppercase tracking-widest">{field.replace(/([A-Z])/g, ' $1')}</label>
                          <input 
                            type="text" 
                            value={selectedLaunch.research[section.id][field]}
                            onChange={(e) => updateResearchField(selectedLaunch.id, section.id, field, e.target.value)}
                            className="w-full px-3 py-2 bg-navy/[0.02] border border-navy/10 rounded-lg text-[13px] outline-none focus:border-brand-blue/50"
                          />
                        </div>
                      ))}
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-tx-muted uppercase tracking-widest">Keywords</label>
                        <textarea 
                          rows={2}
                          value={selectedLaunch.research[section.id].keywords}
                          onChange={(e) => updateResearchField(selectedLaunch.id, section.id, 'keywords', e.target.value)}
                          className="w-full px-3 py-2 bg-navy/[0.02] border border-navy/10 rounded-lg text-[13px] outline-none focus:border-brand-blue/50 resize-none"
                        />
                      </div>
                      {selectedLaunch.research[section.id].companies && (
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-bold text-tx-muted uppercase tracking-widest">Identify Companies (1-10)</label>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {selectedLaunch.research[section.id].companies.map((company: string, idx: number) => (
                              <input 
                                key={idx}
                                type="text" 
                                placeholder={`${idx + 1}...`}
                                value={company}
                                onChange={(e) => updateNestedResearchArray(selectedLaunch.id, section.id, idx, e.target.value)}
                                className="w-full px-2 py-1.5 bg-navy/[0.02] border border-navy/10 rounded text-[12px] outline-none focus:border-brand-blue/50"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Table 5: Loxo & Indeed I Ideal Profile Connections */}
                <div className="pt-4 border-t border-navy/5 space-y-4">
                  <h3 className="text-[11px] font-bold text-brand-blue uppercase tracking-widest border-l-2 border-brand-blue pl-3">
                    5 - Loxo & Indeed I Ideal Profile Connections
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-tx-muted uppercase tracking-widest">Loxo Prior Searches (1-3)</label>
                        {selectedLaunch.research.loxoPrior.map((item: string, idx: number) => (
                          <input 
                            key={idx}
                            type="text" 
                            placeholder={`${idx + 1}...`}
                            value={item}
                            onChange={(e) => updateResearchArray(selectedLaunch.id, 'loxoPrior', idx, e.target.value)}
                            className="w-full px-3 py-2 bg-navy/[0.02] border border-navy/10 rounded-lg text-[13px] outline-none focus:border-brand-blue/50"
                          />
                        ))}
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={selectedLaunch.research.indeedPosting}
                          onChange={() => updateResearchField(selectedLaunch.id, 'indeedPosting', '', !selectedLaunch.research.indeedPosting)}
                          className="w-4 h-4 rounded border-navy/20 text-brand-blue focus:ring-brand-blue"
                        />
                        <span className="text-[13px] text-navy">Indeed - Job Posting</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={selectedLaunch.research.indeedQuery}
                          onChange={() => updateResearchField(selectedLaunch.id, 'indeedQuery', '', !selectedLaunch.research.indeedQuery)}
                          className="w-4 h-4 rounded border-navy/20 text-brand-blue focus:ring-brand-blue"
                        />
                        <span className="text-[13px] text-navy">Indeed - Setup Query and Daily Reminders</span>
                      </label>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-tx-muted uppercase tracking-widest">Ideal Profile Connections (1-10)</label>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedLaunch.research.liConnections.map((item: string, idx: number) => (
                          <input 
                            key={idx}
                            type="text" 
                            placeholder={`${idx + 1}...`}
                            value={item}
                            onChange={(e) => updateResearchArray(selectedLaunch.id, 'liConnections', idx, e.target.value)}
                            className="w-full px-2 py-1.5 bg-navy/[0.02] border border-navy/10 rounded text-[12px] outline-none focus:border-brand-blue/50"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Single Save Button for Boolean Keywords */}
                <div className="pt-6 border-t border-navy/5 flex justify-center">
                  <button 
                    onClick={() => handleSaveAllResearch(selectedLaunch.id)}
                    className="px-8 py-3 bg-navy text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg flex items-center gap-2 group"
                  >
                    <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Save Boolean Keywords to Research
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold text-navy">Search Launch</h1>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-navy text-white rounded-lg text-[13px] font-bold hover:opacity-90 transition-all shadow-sm uppercase tracking-wider flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Start New Launch
        </button>
      </div>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surf border border-navy/10 rounded-2xl p-6 shadow-md"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-navy">New Search Launch</h2>
            <button onClick={() => setIsCreating(false)} className="text-tx-muted hover:text-navy">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-tx-muted uppercase tracking-widest">Category</label>
              <select 
                value={newLaunchData.category}
                onChange={(e) => setNewLaunchData({ ...newLaunchData, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-navy/[0.02] border border-navy/10 rounded-xl text-sm outline-none focus:border-brand-blue/50"
              >
                <option>Residential Services</option>
                <option>Construction</option>
                <option>Real Estate</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-tx-muted uppercase tracking-widest">Tier</label>
              <select 
                value={newLaunchData.tier}
                onChange={(e) => setNewLaunchData({ ...newLaunchData, tier: e.target.value })}
                className="w-full px-4 py-2.5 bg-navy/[0.02] border border-navy/10 rounded-xl text-sm outline-none focus:border-brand-blue/50"
              >
                <option>Tier 1</option>
                <option>Tier 2</option>
                <option>Tier 3</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-tx-muted uppercase tracking-widest">Company Name</label>
              <input 
                type="text" 
                value={newLaunchData.company}
                onChange={(e) => setNewLaunchData({ ...newLaunchData, company: e.target.value })}
                placeholder="e.g. Acme Corp"
                className="w-full px-4 py-2.5 bg-navy/[0.02] border border-navy/10 rounded-xl text-sm outline-none focus:border-brand-blue/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-tx-muted uppercase tracking-widest">Job Title</label>
              <input 
                type="text" 
                value={newLaunchData.jobTitle}
                onChange={(e) => setNewLaunchData({ ...newLaunchData, jobTitle: e.target.value })}
                placeholder="e.g. Senior Product Manager"
                className="w-full px-4 py-2.5 bg-navy/[0.02] border border-navy/10 rounded-xl text-sm outline-none focus:border-brand-blue/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-[13px] font-bold text-tx-muted hover:text-navy transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreateLaunch}
              className="px-6 py-2 bg-brand-blue text-white rounded-lg text-[13px] font-bold hover:bg-light-blue transition-all shadow-sm"
            >
              Create Launch
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surf border border-navy/10 rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue mb-4">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-navy mb-2">Active Launches</h3>
          <p className="text-3xl font-serif font-bold text-navy">{launches.filter(l => l.status === 'Active').length}</p>
          <p className="text-[11px] text-tx-muted mt-2 uppercase tracking-widest">Currently in progress</p>
        </div>
        
        <div className="bg-surf border border-navy/10 rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
            <Check className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-navy mb-2">Completed</h3>
          <p className="text-3xl font-serif font-bold text-navy">{launches.filter(l => l.status === 'Completed').length}</p>
          <p className="text-[11px] text-tx-muted mt-2 uppercase tracking-widest">All time</p>
        </div>

        <div className="bg-surf border border-navy/10 rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 mb-4">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-navy mb-2">Recent Launches</h3>
          <p className="text-3xl font-serif font-bold text-navy">
            {launches.filter(l => {
              const date = new Date(l.createdAt);
              const now = new Date();
              return (now.getTime() - date.getTime()) < (7 * 24 * 60 * 60 * 1000);
            }).length}
          </p>
          <p className="text-[11px] text-tx-muted mt-2 uppercase tracking-widest">Last 7 days</p>
        </div>
      </div>

      {launches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {launches.map(launch => (
            <button 
              key={launch.id}
              onClick={() => setSelectedLaunchId(launch.id)}
              className="bg-surf border border-navy/10 rounded-2xl p-6 shadow-sm hover:border-brand-blue/30 transition-all text-left group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center text-navy group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-colors">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  {launch.tier && (
                    <div className="px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest bg-brand-blue/10 text-brand-blue">
                      {launch.tier}
                    </div>
                  )}
                  <div className={cn(
                    "px-2 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest",
                    launch.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-navy/5 text-tx-muted"
                  )}>
                    {launch.status}
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-serif font-bold text-navy mb-1 group-hover:text-brand-blue transition-colors">{launch.jobTitle}</h3>
              <p className="text-sm text-tx-muted mb-4">{launch.company}</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-tx-muted">Launch Progress</span>
                  <span className="text-brand-blue">
                    {Math.round((
                      Object.values(launch.admin).filter(Boolean).length + 
                      Object.values(launch.enrichment).filter(Boolean).length + 
                      Object.values(launch.outreach).filter(Boolean).length
                    ) / (9 + 4 + 6) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-navy/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-blue transition-all duration-500"
                    style={{ width: `${Math.round((
                      Object.values(launch.admin).filter(Boolean).length + 
                      Object.values(launch.enrichment).filter(Boolean).length + 
                      Object.values(launch.outreach).filter(Boolean).length
                    ) / (9 + 4 + 6) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-tx-muted">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(launch.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span>{Object.values(launch.admin).filter(Boolean).length + Object.values(launch.enrichment).filter(Boolean).length + Object.values(launch.outreach).filter(Boolean).length} tasks done</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-surf border border-navy/10 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-navy/5 flex items-center justify-center text-navy/20 mx-auto mb-6">
            <Search className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-serif font-bold text-navy mb-2">No Search Launches Yet</h2>
          <p className="text-tx-muted max-w-md mx-auto mb-8">Start a new search launch to track your administration, research strategy, and outreach progress all in one place.</p>
          <button 
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 bg-navy text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md uppercase tracking-wider inline-flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            Create Your First Launch
          </button>
        </div>
      )}
    </div>
  );
};
const MasterlistView = ({ data, type }: { data: any[], type: string }) => {
  return (
    <div className="bg-surf border border-navy/10 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm bdt-table">
          <thead className="bg-surf-2">
            {type === 'placements' && (
              <tr>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Candidate</th>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Client</th>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Position</th>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Revenue</th>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Start Date</th>
              </tr>
            )}
            {type === 'jobOrders' && (
              <tr>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Client</th>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Position</th>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Fee %</th>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Status</th>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Date</th>
              </tr>
            )}
            {type === 'touchpoints' && (
              <tr>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Client</th>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Contact</th>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Type</th>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Date</th>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Notes</th>
              </tr>
            )}
            {type === 'jobLeads' && (
              <tr>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Client</th>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Position</th>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Source</th>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Status</th>
                <th className="p-4 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Date</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-navy/5">
            {data.map((item, i) => (
              <tr key={i} className="hover:bg-surf-2 transition-colors">
                {type === 'placements' && (
                  <>
                    <td className="p-4 font-serif font-bold text-navy">{item.name}</td>
                    <td className="p-4 text-tx-sec">{item.client}</td>
                    <td className="p-4 text-tx-sec">{item.position}</td>
                    <td className="p-4 font-mono font-bold text-brand-blue">${item.revenue?.toLocaleString()}</td>
                    <td className="p-4 text-tx-muted">{fmtS(item.start)}</td>
                  </>
                )}
                {type === 'jobOrders' && (
                  <>
                    <td className="p-4 font-serif font-bold text-navy">{item.client}</td>
                    <td className="p-4 text-tx-sec">{item.position}</td>
                    <td className="p-4 font-mono text-tx-sec">{item.fee}%</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-light-blue/10 text-brand-blue text-[10px] font-bold uppercase tracking-widest rounded border border-brand-blue/20">{item.status}</span>
                    </td>
                    <td className="p-4 text-tx-muted">{fmtS(item.date)}</td>
                  </>
                )}
                {type === 'touchpoints' && (
                  <>
                    <td className="p-4 font-serif font-bold text-navy">{item.client}</td>
                    <td className="p-4 text-tx-sec">{item.contact}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-surf-3 text-tx-sec text-[10px] font-bold uppercase tracking-widest rounded border border-navy/5">{item.type}</span>
                    </td>
                    <td className="p-4 text-tx-muted">{fmtS(item.date)}</td>
                    <td className="p-4 text-[11px] text-tx-sec max-w-xs truncate">{item.notes}</td>
                  </>
                )}
                {type === 'jobLeads' && (
                  <>
                    <td className="p-4 font-serif font-bold text-navy">{item.client}</td>
                    <td className="p-4 text-tx-sec">{item.position}</td>
                    <td className="p-4 text-tx-sec">{item.source}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-navy/5 text-navy text-[10px] font-bold uppercase tracking-widest rounded border border-navy/10">{item.status}</span>
                    </td>
                    <td className="p-4 text-tx-muted">{fmtS(item.date)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ResidentialMasterlistView = ({ 
  data, 
  onUpdate,
  onViewChange
}: { 
  data: any[], 
  onUpdate: (data: any[]) => void,
  onViewChange: (view: string) => void
}) => {
  const industries = [
    "Exterior / Doors / Windows",
    "HVAC / Plumbing",
    "Large Home Services",
    "Pest Control",
    "Remodelers",
    "Roofing",
    "Tree Care / Lawn / Landscaping",
    "Other Known Brands"
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedState, setSelectedState] = useState<string>("All States");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("All Specialties");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("All Platforms");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", state: "", specialty: industries[0], platform: "" });
  const [modalTab, setModalTab] = useState<"manual" | "csv" | "duplicates">("manual");
  const [pendingUpload, setPendingUpload] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uniqueStates = useMemo(() => {
    const states = Array.from(new Set(data.map(c => c.state))).sort();
    return ["All States", ...states];
  }, [data]);

  const uniqueSpecialties = useMemo(() => {
    const specialties = Array.from(new Set(data.map(c => c.specialty))).sort();
    return ["All Specialties", ...specialties];
  }, [data]);

  const uniquePlatforms = useMemo(() => {
    const platforms = Array.from(new Set(data.map(c => c.platform).filter(Boolean))).sort();
    return ["All Platforms", ...platforms];
  }, [data]);

  const filteredData = data.filter(c => 
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.platform?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedState === "All States" || c.state === selectedState) &&
    (selectedSpecialty === "All Specialties" || c.specialty === selectedSpecialty) &&
    (selectedPlatform === "All Platforms" || c.platform === selectedPlatform)
  );

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, selectedState, selectedSpecialty, selectedPlatform]);

  const handleCopyVisible = () => {
    const content = paginatedData.map(c => c.name).join("\n");
    navigator.clipboard.writeText(content);
    toast.success(`Copied ${paginatedData.length} company names to clipboard`);
  };

  const handleRemove = (id: string) => {
    onUpdate(data.filter(c => c.id !== id));
    toast.success("Company removed");
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setModalTab("manual");
    setFormData({ name: "", state: "", specialty: industries[0], platform: "" });
    setIsModalOpen(true);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as any[];
        const newCompanies = parsedData.map((row: any, index: number) => ({
          id: `rs-csv-${Date.now()}-${index}`,
          name: row["Company Name"] || row["name"] || "",
          state: row["State"] || row["state"] || "",
          specialty: row["Industry"] || row["specialty"] || row["Industry"] || industries[0],
          platform: row["Platform"] || row["platform"] || ""
        })).filter(c => c.name);

        if (newCompanies.length > 0) {
          const existingNames = new Set(data.map(c => c.name.toLowerCase()));
          const foundDuplicates = newCompanies.filter(c => existingNames.has(c.name.toLowerCase()));
          
          if (foundDuplicates.length > 0) {
            setPendingUpload(newCompanies);
            setDuplicates(foundDuplicates);
            setModalTab("duplicates");
          } else {
            onUpdate([...data, ...newCompanies]);
            toast.success("All companies have been uploaded", {
              action: {
                label: "Go to Backup",
                onClick: () => onViewChange("backup")
              }
            });
            setIsModalOpen(false);
          }
        } else {
          toast.error("No valid companies found in CSV. Ensure columns match: Company Name, State, Industry, Platform");
        }
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const confirmUpload = (skipDuplicates: boolean) => {
    const finalData = skipDuplicates 
      ? pendingUpload.filter(c => !duplicates.some(d => d.name.toLowerCase() === c.name.toLowerCase()))
      : pendingUpload;
    
    onUpdate([...data, ...finalData]);
    toast.success("All companies have been uploaded", {
      action: {
        label: "Go to Backup",
        onClick: () => onViewChange("backup")
      }
    });
    setIsModalOpen(false);
    setPendingUpload([]);
    setDuplicates([]);
  };

  const handleOpenEdit = (company: any) => {
    setModalMode("edit");
    setEditingCompany(company);
    setFormData({ 
      name: company.name, 
      state: company.state, 
      specialty: company.specialty || industries[0],
      platform: company.platform || "" 
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.state) {
      toast.error("Name and State are required");
      return;
    }

    if (modalMode === "add") {
      const newCompany = { ...formData, id: `rs-${Date.now()}` };
      onUpdate([...data, newCompany]);
      toast.success("Company added");
    } else {
      const updatedCompany = { ...editingCompany, ...formData };
      onUpdate(data.map(c => c.id === editingCompany.id ? updatedCompany : c));
      toast.success("Company updated");
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 bg-surf min-h-screen">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tx-muted" />
                <input 
                  type="text"
                  placeholder="Search residential services..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-navy/10 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-navy/10 rounded-lg">
                  <Filter className="w-3 h-3 text-tx-muted" />
                  <select 
                    className="bg-transparent border-none focus:outline-none text-[13px] font-medium text-navy cursor-pointer"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                  >
                    {uniqueStates.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-navy/10 rounded-lg">
                  <Filter className="w-3 h-3 text-tx-muted" />
                  <select 
                    className="bg-transparent border-none focus:outline-none text-[13px] font-medium text-navy cursor-pointer"
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                  >
                    {uniqueSpecialties.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-navy/10 rounded-lg">
                  <Filter className="w-3 h-3 text-tx-muted" />
                  <select 
                    className="bg-transparent border-none focus:outline-none text-[13px] font-medium text-navy cursor-pointer"
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                  >
                    {uniquePlatforms.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-navy/10 text-navy rounded-lg text-[14px] font-medium hover:bg-navy/5 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Add Company
            </button>
            <button 
              onClick={handleCopyVisible}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg text-[14px] font-medium hover:bg-brand-blue/90 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-navy/5 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-navy/[0.02] border-b border-navy/5">
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider">Company</th>
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider">State</th>
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider">Industry</th>
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider">Platform</th>
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {paginatedData.map((item) => (
              <tr key={item.id} className="hover:bg-navy/[0.01] transition-colors group">
                <td className="p-4 text-[14px] font-medium text-navy">{item.name}</td>
                <td className="p-4 text-[13px] text-tx-muted">
                  <button 
                    onClick={() => setSelectedState(item.state)}
                    className="hover:text-brand-blue hover:underline transition-colors text-left whitespace-nowrap"
                    title={`Filter by ${item.state}`}
                  >
                    {item.state}
                  </button>
                </td>
                <td className="p-4 text-[13px] text-tx-muted">
                  <button 
                    onClick={() => setSelectedSpecialty(item.specialty)}
                    className="hover:text-brand-blue hover:underline transition-colors text-left"
                    title={`Filter by ${item.specialty}`}
                  >
                    {item.specialty}
                  </button>
                </td>
                <td className="p-4 text-[13px] text-tx-muted">
                  {item.platform && (
                    <button 
                      onClick={() => setSelectedPlatform(item.platform)}
                      className="hover:text-brand-blue hover:underline transition-colors text-left"
                      title={`Filter by ${item.platform}`}
                    >
                      {item.platform}
                    </button>
                  )}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(item.name);
                        toast.success(`Copied ${item.name} to clipboard`);
                      }}
                      className="p-1 text-tx-muted hover:text-brand-blue hover:bg-brand-blue/5 rounded transition-colors"
                      title="Copy Company Name"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleOpenEdit(item)}
                      className="p-1 text-tx-muted hover:text-brand-blue hover:bg-brand-blue/5 rounded transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="p-1 text-tx-muted hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-tx-muted italic">
                  No companies found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-[13px] text-tx-muted">
              Showing <span className="font-medium text-navy">{startIndex + 1}</span> to <span className="font-medium text-navy">{Math.min(startIndex + pageSize, filteredData.length)}</span> of <span className="font-medium text-navy">{filteredData.length}</span> companies
            </div>
            <div className="flex items-center gap-2 text-[13px] text-tx-muted border-l border-navy/10 pl-4">
              <select 
                className="bg-transparent border-none focus:outline-none font-medium text-navy cursor-pointer"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center text-[13px] font-medium text-navy bg-white border border-navy/10 rounded-lg hover:bg-navy/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mr-1"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {(() => {
                const maxVisible = 5;
                let start = Math.max(1, currentPage - 2);
                let end = Math.min(totalPages, currentPage + 2);
                if (start === 1) end = Math.min(totalPages, maxVisible);
                else if (end === totalPages) start = Math.max(1, totalPages - maxVisible + 1);
                
                return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-9 h-9 flex items-center justify-center text-[13px] font-medium rounded-lg transition-all",
                      currentPage === pageNum 
                        ? "bg-brand-blue text-white shadow-sm" 
                        : "text-tx-muted hover:bg-navy/5 bg-white border border-navy/10"
                    )}
                  >
                    {pageNum}
                  </button>
                ));
              })()}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-9 h-9 flex items-center justify-center text-[13px] font-medium text-navy bg-white border border-navy/10 rounded-lg hover:bg-navy/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-1"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-navy/5 flex items-center justify-between">
              <h3 className="text-lg font-serif font-bold text-navy">
                {modalMode === "add" ? "Add New Company" : "Edit Company"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-tx-muted hover:text-navy">
                <X size={20} />
              </button>
            </div>
            
            {modalMode === "add" && (
              <div className="flex border-b border-navy/5">
                <button 
                  onClick={() => setModalTab("manual")}
                  className={cn(
                    "flex-1 py-3 text-[13px] font-bold uppercase tracking-wider transition-all",
                    modalTab === "manual" ? "text-brand-blue border-b-2 border-brand-blue bg-brand-blue/5" : "text-tx-muted hover:text-navy"
                  )}
                >
                  Manual Entry
                </button>
                <button 
                  onClick={() => setModalTab("csv")}
                  className={cn(
                    "flex-1 py-3 text-[13px] font-bold uppercase tracking-wider transition-all",
                    modalTab === "csv" ? "text-brand-blue border-b-2 border-brand-blue bg-brand-blue/5" : "text-tx-muted hover:text-navy"
                  )}
                >
                  CSV Upload
                </button>
              </div>
            )}

            {modalTab === "manual" || modalMode === "edit" ? (
              <>
                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-tx-muted uppercase tracking-wider">Company Name</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2 bg-navy/5 border border-navy/10 rounded-lg text-[14px] outline-none focus:border-brand-blue/30"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-tx-muted uppercase tracking-wider">State</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2 bg-navy/5 border border-navy/10 rounded-lg text-[14px] outline-none focus:border-brand-blue/30"
                      value={formData.state}
                      onChange={e => setFormData({...formData, state: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-tx-muted uppercase tracking-wider">Industry</label>
                    <select 
                      className="w-full px-4 py-2 bg-navy/5 border border-navy/10 rounded-lg text-[14px] outline-none focus:border-brand-blue/30"
                      value={formData.specialty}
                      onChange={e => setFormData({...formData, specialty: e.target.value})}
                    >
                      {industries.map(ind => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-tx-muted uppercase tracking-wider">Platform</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2 bg-navy/5 border border-navy/10 rounded-lg text-[14px] outline-none focus:border-brand-blue/30"
                      value={formData.platform}
                      onChange={e => setFormData({...formData, platform: e.target.value})}
                    />
                  </div>
                </div>
                <div className="p-6 bg-navy/[0.02] border-t border-navy/5 flex items-center justify-end gap-3">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-[14px] font-medium text-tx-muted hover:text-navy transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-brand-blue text-white rounded-lg text-[14px] font-bold hover:bg-brand-blue/90 transition-colors"
                  >
                    {modalMode === "add" ? "Add Company" : "Save Changes"}
                  </button>
                </div>
              </>
            ) : modalTab === "duplicates" ? (
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-[13px] font-medium">
                    We found {duplicates.length} companies that already exist in the masterlist.
                  </p>
                </div>
                <div className="max-h-[200px] overflow-y-auto border border-navy/5 rounded-lg divide-y divide-navy/5">
                  {duplicates.map((d, i) => (
                    <div key={i} className="p-3 text-[13px] text-navy flex justify-between items-center">
                      <span>{d.name}</span>
                      <span className="text-[11px] font-bold text-tx-muted uppercase">{d.state}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => confirmUpload(true)}
                    className="w-full py-3 bg-brand-blue text-white rounded-lg text-[14px] font-bold hover:bg-brand-blue/90 transition-colors"
                  >
                    Skip Duplicates & Upload ({pendingUpload.length - duplicates.length} new)
                  </button>
                  <button 
                    onClick={() => confirmUpload(false)}
                    className="w-full py-3 bg-white border border-navy/10 text-navy rounded-lg text-[14px] font-bold hover:bg-navy/5 transition-colors"
                  >
                    Upload All Anyway ({pendingUpload.length} total)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-10 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue">
                  <Upload size={32} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-navy font-bold">Upload CSV File</h4>
                  <p className="text-tx-muted text-[13px] max-w-[280px]">
                    Upload a CSV file with columns: <br />
                    <span className="font-mono text-brand-blue font-bold">Company Name, State, Industry, Platform</span>
                  </p>
                </div>
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleCsvUpload}
                />
                <div className="flex flex-col w-full gap-3">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 bg-brand-blue text-white rounded-lg text-[14px] font-bold hover:bg-brand-blue/90 transition-colors shadow-sm"
                  >
                    Select CSV File
                  </button>
                  <button 
                    onClick={() => setModalTab("manual")}
                    className="w-full py-3 text-[13px] font-medium text-tx-muted hover:text-navy transition-colors"
                  >
                    Back to Manual Entry
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

const RealEstateMasterlistView = ({ 
  data, 
  onUpdate,
  onViewChange
}: { 
  data: any[], 
  onUpdate: (data: any[]) => void,
  onViewChange: (view: string) => void
}) => {
  const industries = [
    "Commercial",
    "Residential",
    "Industrial",
    "Retail",
    "Multi-family",
    "Land",
    "Property Management",
    "Brokerage"
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedState, setSelectedState] = useState<string>("All States");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("All Industries");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", state: "", specialty: industries[0], platform: "" });
  const [modalTab, setModalTab] = useState<"manual" | "csv" | "duplicates">("manual");
  const [pendingUpload, setPendingUpload] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uniqueStates = useMemo(() => {
    const states = Array.from(new Set(data.map(c => c.state))).sort();
    return ["All States", ...states];
  }, [data]);

  const uniqueIndustries = useMemo(() => {
    const inds = Array.from(new Set(data.map(c => c.specialty))).sort();
    return ["All Industries", ...inds];
  }, [data]);

  const filteredData = data.filter(c => 
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.platform?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedState === "All States" || c.state === selectedState) &&
    (selectedIndustry === "All Industries" || c.specialty === selectedIndustry)
  );

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, selectedState, selectedIndustry]);

  const handleCopyVisible = () => {
    const content = paginatedData.map(c => c.name).join("\n");
    navigator.clipboard.writeText(content);
    toast.success(`Copied ${paginatedData.length} company names to clipboard`);
  };

  const handleRemove = (id: string) => {
    onUpdate(data.filter(c => c.id !== id));
    toast.success("Company removed");
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setModalTab("manual");
    setFormData({ name: "", state: "", specialty: industries[0], platform: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (company: any) => {
    setModalMode("edit");
    setEditingCompany(company);
    setFormData({ 
      name: company.name, 
      state: company.state, 
      specialty: company.specialty || industries[0],
      platform: company.platform || "" 
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.state) {
      toast.error("Name and State are required");
      return;
    }

    if (modalMode === "add") {
      const newCompany = { ...formData, id: `re-${Date.now()}` };
      onUpdate([...data, newCompany]);
      toast.success("Company added");
    } else {
      const updatedCompany = { ...editingCompany, ...formData };
      onUpdate(data.map(c => c.id === editingCompany.id ? updatedCompany : c));
      toast.success("Company updated");
    }
    setIsModalOpen(false);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as any[];
        const newCompanies = parsedData.map((row: any, index: number) => ({
          id: `re-csv-${Date.now()}-${index}`,
          name: row["Company Name"] || row["name"] || "",
          state: row["State"] || row["state"] || "",
          specialty: row["Industry"] || row["specialty"] || industries[0],
          platform: row["Platform"] || row["platform"] || ""
        })).filter(c => c.name);

        if (newCompanies.length > 0) {
          const existingNames = new Set(data.map(c => c.name.toLowerCase()));
          const foundDuplicates = newCompanies.filter(c => existingNames.has(c.name.toLowerCase()));

          if (foundDuplicates.length > 0) {
            setPendingUpload(newCompanies);
            setDuplicates(foundDuplicates);
            setModalTab("duplicates");
          } else {
            onUpdate([...data, ...newCompanies]);
            toast.success("All companies have been uploaded", {
              action: {
                label: "Go to Backup",
                onClick: () => onViewChange("backup")
              }
            });
            setIsModalOpen(false);
          }
        } else {
          toast.error("No valid companies found in CSV. Ensure columns match: Company Name, State, Industry, Platform");
        }
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const confirmUpload = (skipDuplicates: boolean) => {
    const finalData = skipDuplicates 
      ? pendingUpload.filter(c => !duplicates.some(d => d.name.toLowerCase() === c.name.toLowerCase()))
      : pendingUpload;
    
    onUpdate([...data, ...finalData]);
    toast.success("All companies have been uploaded", {
      action: {
        label: "Go to Backup",
        onClick: () => onViewChange("backup")
      }
    });
    setIsModalOpen(false);
    setPendingUpload([]);
    setDuplicates([]);
  };

  return (
    <div className="p-6 bg-surf min-h-screen">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tx-muted" />
                <input 
                  type="text"
                  placeholder="Search real estate companies..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-navy/10 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-navy/10 rounded-lg">
                  <Filter className="w-3 h-3 text-tx-muted" />
                  <select 
                    className="bg-transparent border-none focus:outline-none text-[13px] font-medium text-navy cursor-pointer"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                  >
                    {uniqueStates.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-navy/10 rounded-lg">
                  <Filter className="w-3 h-3 text-tx-muted" />
                  <select 
                    className="bg-transparent border-none focus:outline-none text-[13px] font-medium text-navy cursor-pointer"
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                  >
                    {uniqueIndustries.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-navy/10 text-navy rounded-lg text-[14px] font-medium hover:bg-navy/5 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Add Company
            </button>
            <button 
              onClick={handleCopyVisible}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg text-[14px] font-medium hover:bg-brand-blue/90 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-navy/5 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-navy/[0.02] border-b border-navy/5">
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider">Company</th>
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider">State</th>
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider">Industry</th>
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider">Platform</th>
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {paginatedData.map((item) => (
              <tr key={item.id} className="hover:bg-navy/[0.01] transition-colors group">
                <td className="p-4 text-[13px] font-medium text-navy">{item.name}</td>
                <td className="p-4 text-[13px] text-tx-muted">
                  <button 
                    onClick={() => setSelectedState(item.state)}
                    className="hover:text-brand-blue hover:underline transition-colors text-left whitespace-nowrap"
                  >
                    {item.state}
                  </button>
                </td>
                <td className="p-4 text-[13px] text-tx-muted">
                  <button 
                    onClick={() => setSelectedIndustry(item.specialty)}
                    className="hover:text-brand-blue hover:underline transition-colors text-left"
                  >
                    {item.specialty}
                  </button>
                </td>
                <td className="p-4 text-[13px] text-tx-muted">{item.platform}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(item.name);
                        toast.success(`Copied ${item.name} to clipboard`);
                      }}
                      className="p-1 text-tx-muted hover:text-brand-blue hover:bg-brand-blue/5 rounded transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleOpenEdit(item)}
                      className="p-1 text-tx-muted hover:text-brand-blue hover:bg-brand-blue/5 rounded transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="p-1 text-tx-muted hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-tx-muted italic">
                  No companies found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-[13px] text-tx-muted">
              Showing <span className="font-medium text-navy">{startIndex + 1}</span> to <span className="font-medium text-navy">{Math.min(startIndex + pageSize, filteredData.length)}</span> of <span className="font-medium text-navy">{filteredData.length}</span> companies
            </div>
            <div className="flex items-center gap-2 text-[13px] text-tx-muted border-l border-navy/10 pl-4">
              <select 
                className="bg-transparent border-none focus:outline-none font-medium text-navy cursor-pointer"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center text-[13px] font-medium text-navy bg-white border border-navy/10 rounded-lg hover:bg-navy/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mr-1"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {(() => {
                const maxVisible = 5;
                let start = Math.max(1, currentPage - 2);
                let end = Math.min(totalPages, currentPage + 2);
                if (start === 1) end = Math.min(totalPages, maxVisible);
                else if (end === totalPages) start = Math.max(1, totalPages - maxVisible + 1);
                
                return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-9 h-9 flex items-center justify-center text-[13px] font-medium rounded-lg transition-all",
                      currentPage === pageNum 
                        ? "bg-brand-blue text-white shadow-sm" 
                        : "text-tx-muted hover:bg-navy/5 bg-white border border-navy/10"
                    )}
                  >
                    {pageNum}
                  </button>
                ));
              })()}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-9 h-9 flex items-center justify-center text-[13px] font-medium text-navy bg-white border border-navy/10 rounded-lg hover:bg-navy/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-1"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-navy/5 flex items-center justify-between">
              <h3 className="text-lg font-serif font-bold text-navy">
                {modalMode === "add" ? "Add New Real Estate Company" : "Edit Company"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-tx-muted hover:text-navy">
                <X size={20} />
              </button>
            </div>
            
            {modalMode === "add" && (
              <div className="flex border-b border-navy/5">
                <button 
                  onClick={() => setModalTab("manual")}
                  className={cn(
                    "flex-1 py-3 text-[13px] font-bold uppercase tracking-wider transition-all",
                    modalTab === "manual" ? "text-brand-blue border-b-2 border-brand-blue bg-brand-blue/5" : "text-tx-muted hover:text-navy"
                  )}
                >
                  Manual Entry
                </button>
                <button 
                  onClick={() => setModalTab("csv")}
                  className={cn(
                    "flex-1 py-3 text-[13px] font-bold uppercase tracking-wider transition-all",
                    modalTab === "csv" ? "text-brand-blue border-b-2 border-brand-blue bg-brand-blue/5" : "text-tx-muted hover:text-navy"
                  )}
                >
                  CSV Upload
                </button>
              </div>
            )}

            {modalTab === "manual" || modalMode === "edit" ? (
              <>
                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-tx-muted uppercase tracking-wider">Company Name</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2 bg-navy/5 border border-navy/10 rounded-lg text-[14px] outline-none focus:border-brand-blue/30"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-tx-muted uppercase tracking-wider">State</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2 bg-navy/5 border border-navy/10 rounded-lg text-[14px] outline-none focus:border-brand-blue/30"
                      value={formData.state}
                      onChange={e => setFormData({...formData, state: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-tx-muted uppercase tracking-wider">Industry</label>
                    <select 
                      className="w-full px-4 py-2 bg-navy/5 border border-navy/10 rounded-lg text-[14px] outline-none focus:border-brand-blue/30"
                      value={formData.specialty}
                      onChange={e => setFormData({...formData, specialty: e.target.value})}
                    >
                      {industries.map(ind => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-tx-muted uppercase tracking-wider">Platform</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2 bg-navy/5 border border-navy/10 rounded-lg text-[14px] outline-none focus:border-brand-blue/30"
                      value={formData.platform}
                      onChange={e => setFormData({...formData, platform: e.target.value})}
                    />
                  </div>
                </div>
                <div className="p-6 bg-navy/[0.02] border-t border-navy/5 flex items-center justify-end gap-3">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-[14px] font-medium text-tx-muted hover:text-navy transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-brand-blue text-white rounded-lg text-[14px] font-bold hover:bg-brand-blue/90 transition-colors"
                  >
                    {modalMode === "add" ? "Add Company" : "Save Changes"}
                  </button>
                </div>
              </>
            ) : modalTab === "duplicates" ? (
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-[13px] font-medium">
                    We found {duplicates.length} companies that already exist in the masterlist.
                  </p>
                </div>
                <div className="max-h-[200px] overflow-y-auto border border-navy/5 rounded-lg divide-y divide-navy/5">
                  {duplicates.map((d, i) => (
                    <div key={i} className="p-3 text-[13px] text-navy flex justify-between items-center">
                      <span>{d.name}</span>
                      <span className="text-[11px] font-bold text-tx-muted uppercase">{d.state}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => confirmUpload(true)}
                    className="w-full py-3 bg-brand-blue text-white rounded-lg text-[14px] font-bold hover:bg-brand-blue/90 transition-colors"
                  >
                    Skip Duplicates & Upload ({pendingUpload.length - duplicates.length} new)
                  </button>
                  <button 
                    onClick={() => confirmUpload(false)}
                    className="w-full py-3 bg-white border border-navy/10 text-navy rounded-lg text-[14px] font-bold hover:bg-navy/5 transition-colors"
                  >
                    Upload All Anyway ({pendingUpload.length} total)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-10 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue">
                  <Upload size={32} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-navy font-bold">Upload CSV File</h4>
                  <p className="text-tx-muted text-[13px] max-w-[280px]">
                    Upload a CSV file with columns: <br />
                    <span className="font-mono text-brand-blue font-bold">Company Name, State, Industry, Platform</span>
                  </p>
                </div>
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleCsvUpload}
                />
                <div className="flex flex-col w-full gap-3">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 bg-brand-blue text-white rounded-lg text-[14px] font-bold hover:bg-brand-blue/90 transition-colors shadow-sm"
                  >
                    Select CSV File
                  </button>
                  <button 
                    onClick={() => setModalTab("manual")}
                    className="w-full py-3 text-[13px] font-medium text-tx-muted hover:text-navy transition-colors"
                  >
                    Back to Manual Entry
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

const ConstructionMasterlistView = ({ 
  generalContractors, 
  specialtyContractors,
  onUpdateGeneral,
  onUpdateSpecialty,
  onViewChange
}: { 
  generalContractors: any[], 
  specialtyContractors: any[],
  onUpdateGeneral: (data: any[]) => void,
  onUpdateSpecialty: (data: any[]) => void,
  onViewChange: (view: string) => void
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [activeTab, setActiveTab] = useState<"general" | "specialty">("general");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedState, setSelectedState] = useState<string>("All States");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("All Specialties");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", state: "", specialty: "" });
  const [modalTab, setModalTab] = useState<"manual" | "csv" | "duplicates">("manual");
  const [pendingUpload, setPendingUpload] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uniqueStates = useMemo(() => {
    const data = activeTab === "general" ? generalContractors : specialtyContractors;
    const states = Array.from(new Set(data.map(c => c.state))).sort();
    return ["All States", ...states];
  }, [activeTab, generalContractors, specialtyContractors]);

  const uniqueSpecialties = useMemo(() => {
    const specialties = Array.from(new Set(specialtyContractors.map(c => c.specialty))).sort();
    return ["All Specialties", ...specialties];
  }, [specialtyContractors]);

  const filteredGeneral = generalContractors.filter(c => 
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.state.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedState === "All States" || c.state === selectedState)
  );

  const filteredSpecialty = specialtyContractors.filter(c => 
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.specialty?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedState === "All States" || c.state === selectedState) &&
    (selectedSpecialty === "All Specialties" || c.specialty === selectedSpecialty)
  );

  const currentFilteredData = activeTab === "general" ? filteredGeneral : filteredSpecialty;
  const totalPages = Math.ceil(currentFilteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = currentFilteredData.slice(startIndex, startIndex + pageSize);

  // Reset page when search or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, pageSize, selectedState, selectedSpecialty]);

  const handleCopyVisible = () => {
    const content = paginatedData.map(c => c.name).join("\n");
    navigator.clipboard.writeText(content);
    toast.success(`Copied ${paginatedData.length} company names to clipboard`);
  };

  const handleRemove = (id: string) => {
    if (activeTab === "general") {
      onUpdateGeneral(generalContractors.filter(c => c.id !== id));
    } else {
      onUpdateSpecialty(specialtyContractors.filter(c => c.id !== id));
    }
    toast.success("Company removed");
  };

  const handleOpenAdd = () => {
    setModalMode("add");
    setModalTab("manual");
    setFormData({ name: "", state: "", specialty: "" });
    setIsModalOpen(true);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as any[];
        const newCompanies = parsedData.map((row: any, index: number) => ({
          id: `${activeTab === "general" ? "gc" : "sc"}-csv-${Date.now()}-${index}`,
          name: row["Company Name"] || row["name"] || "",
          state: row["State"] || row["state"] || "",
          specialty: row["Industry"] || row["specialty"] || row["Industry"] || (activeTab === "specialty" ? uniqueSpecialties[1] : "")
        })).filter(c => c.name);

        if (newCompanies.length > 0) {
          const currentData = activeTab === "general" ? generalContractors : specialtyContractors;
          const existingNames = new Set(currentData.map(c => c.name.toLowerCase()));
          const foundDuplicates = newCompanies.filter(c => existingNames.has(c.name.toLowerCase()));

          if (foundDuplicates.length > 0) {
            setPendingUpload(newCompanies);
            setDuplicates(foundDuplicates);
            setModalTab("duplicates");
          } else {
            if (activeTab === "general") {
              onUpdateGeneral([...generalContractors, ...newCompanies]);
            } else {
              onUpdateSpecialty([...specialtyContractors, ...newCompanies]);
            }
            toast.success("All companies have been uploaded", {
              action: {
                label: "Go to Backup",
                onClick: () => onViewChange("backup")
              }
            });
            setIsModalOpen(false);
          }
        } else {
          toast.error("No valid companies found in CSV. Ensure columns match: Company Name, State, Industry");
        }
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const confirmUpload = (skipDuplicates: boolean) => {
    const finalData = skipDuplicates 
      ? pendingUpload.filter(c => !duplicates.some(d => d.name.toLowerCase() === c.name.toLowerCase()))
      : pendingUpload;
    
    if (activeTab === "general") {
      onUpdateGeneral([...generalContractors, ...finalData]);
    } else {
      onUpdateSpecialty([...specialtyContractors, ...finalData]);
    }
    
    toast.success("All companies have been uploaded", {
      action: {
        label: "Go to Backup",
        onClick: () => onViewChange("backup")
      }
    });
    setIsModalOpen(false);
    setPendingUpload([]);
    setDuplicates([]);
  };

  const handleOpenEdit = (company: any) => {
    setModalMode("edit");
    setEditingCompany(company);
    setFormData({ name: company.name, state: company.state, specialty: company.specialty || "" });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.state) {
      toast.error("Name and State are required");
      return;
    }

    if (modalMode === "add") {
      const newCompany = { ...formData, id: `${activeTab === "general" ? "gc" : "sc"}-${Date.now()}` };
      if (activeTab === "general") {
        onUpdateGeneral([...generalContractors, newCompany]);
      } else {
        onUpdateSpecialty([...specialtyContractors, newCompany]);
      }
      toast.success("Company added");
    } else {
      const updatedCompany = { ...editingCompany, ...formData };
      if (activeTab === "general") {
        onUpdateGeneral(generalContractors.map(c => c.id === editingCompany.id ? updatedCompany : c));
      } else {
        onUpdateSpecialty(specialtyContractors.map(c => c.id === editingCompany.id ? updatedCompany : c));
      }
      toast.success("Company updated");
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 bg-surf min-h-screen">
      {/* Search and Controls */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div className="flex items-center bg-navy/5 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab("general")}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all",
                    activeTab === "general" ? "bg-white text-brand-blue shadow-sm" : "text-tx-muted hover:text-navy"
                  )}
                >
                  General Contractor
                </button>
                <button 
                  onClick={() => setActiveTab("specialty")}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all",
                    activeTab === "specialty" ? "bg-white text-brand-blue shadow-sm" : "text-tx-muted hover:text-navy"
                  )}
                >
                  Specialty Contractor
                </button>
             </div>
             <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tx-muted" />
                <input 
                  type="text"
                  placeholder="Search companies..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-navy/10 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-navy/10 rounded-lg">
                  <Filter className="w-3 h-3 text-tx-muted" />
                  <select 
                    className="bg-transparent border-none focus:outline-none text-[13px] font-medium text-navy cursor-pointer"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                  >
                    {uniqueStates.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {activeTab === "specialty" && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-navy/10 rounded-lg">
                    <Filter className="w-3 h-3 text-tx-muted" />
                    <select 
                      className="bg-transparent border-none focus:outline-none text-[13px] font-medium text-navy cursor-pointer"
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                    >
                      {uniqueSpecialties.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
             </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-navy/10 text-navy rounded-lg text-[14px] font-medium hover:bg-navy/5 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Add Company
            </button>
            <button 
              onClick={handleCopyVisible}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg text-[14px] font-medium hover:bg-brand-blue/90 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-navy/5 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-navy/[0.02] border-b border-navy/5">
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider">Company</th>
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider">State</th>
              {activeTab === "specialty" && (
                <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider">Specialty</th>
              )}
              <th className="p-4 text-[11px] font-bold text-tx-muted uppercase tracking-wider text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {paginatedData.map((item) => (
              <tr key={item.id} className="hover:bg-navy/[0.01] transition-colors group">
                <td className="p-4 text-[13px] font-medium text-navy">{item.name}</td>
                <td className="p-4 text-[13px] text-tx-muted">
                  <button 
                    onClick={() => setSelectedState(item.state)}
                    className="hover:text-brand-blue hover:underline transition-colors text-left whitespace-nowrap"
                    title={`Filter by ${item.state}`}
                  >
                    {item.state}
                  </button>
                </td>
                {activeTab === "specialty" && (
                  <td className="p-4 text-[13px] text-tx-muted">
                    <button 
                      onClick={() => setSelectedSpecialty(item.specialty)}
                      className="hover:text-brand-blue hover:underline transition-colors text-left"
                      title={`Filter by ${item.specialty}`}
                    >
                      {item.specialty}
                    </button>
                  </td>
                )}
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(item.name);
                        toast.success(`Copied ${item.name} to clipboard`);
                      }}
                      className="p-1 text-tx-muted hover:text-brand-blue hover:bg-brand-blue/5 rounded transition-colors"
                      title="Copy Company Name"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleOpenEdit(item)}
                      className="p-1 text-tx-muted hover:text-brand-blue hover:bg-brand-blue/5 rounded transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="p-1 text-tx-muted hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={activeTab === "specialty" ? 4 : 3} className="p-8 text-center text-tx-muted italic">
                  No companies found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-[13px] text-tx-muted">
              Showing <span className="font-medium text-navy">{startIndex + 1}</span> to <span className="font-medium text-navy">{Math.min(startIndex + pageSize, currentFilteredData.length)}</span> of <span className="font-medium text-navy">{currentFilteredData.length}</span> companies
            </div>
            <div className="flex items-center gap-2 text-[13px] text-tx-muted border-l border-navy/10 pl-4">
              <select 
                className="bg-transparent border-none focus:outline-none font-medium text-navy cursor-pointer"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center text-[13px] font-medium text-navy bg-white border border-navy/10 rounded-lg hover:bg-navy/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mr-1"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {(() => {
                const maxVisible = 5;
                let start = Math.max(1, currentPage - 2);
                let end = Math.min(totalPages, currentPage + 2);
                if (start === 1) end = Math.min(totalPages, maxVisible);
                else if (end === totalPages) start = Math.max(1, totalPages - maxVisible + 1);
                
                return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-9 h-9 flex items-center justify-center text-[13px] font-medium rounded-lg transition-all",
                      currentPage === pageNum 
                        ? "bg-brand-blue text-white shadow-sm" 
                        : "text-tx-muted hover:bg-navy/5 bg-white border border-navy/10"
                    )}
                  >
                    {pageNum}
                  </button>
                ));
              })()}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-9 h-9 flex items-center justify-center text-[13px] font-medium text-navy bg-white border border-navy/10 rounded-lg hover:bg-navy/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-1"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-navy/5"
            >
              <div className="p-6 border-b border-navy/5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-navy">
                  {modalMode === "add" ? `Add New ${activeTab === "general" ? "General" : "Specialty"} Contractor` : "Edit Company"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-tx-muted hover:text-navy">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalMode === "add" && (
                <div className="flex border-b border-navy/5">
                  <button 
                    onClick={() => setModalTab("manual")}
                    className={cn(
                      "flex-1 py-3 text-[13px] font-bold uppercase tracking-wider transition-all",
                      modalTab === "manual" ? "text-brand-blue border-b-2 border-brand-blue bg-brand-blue/5" : "text-tx-muted hover:text-navy"
                    )}
                  >
                    Manual Entry
                  </button>
                  <button 
                    onClick={() => setModalTab("csv")}
                    className={cn(
                      "flex-1 py-3 text-[13px] font-bold uppercase tracking-wider transition-all",
                      modalTab === "csv" ? "text-brand-blue border-b-2 border-brand-blue bg-brand-blue/5" : "text-tx-muted hover:text-navy"
                    )}
                  >
                    CSV Upload
                  </button>
                </div>
              )}

              {modalTab === "manual" || modalMode === "edit" ? (
                <>
                  <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-tx-muted uppercase tracking-wider">Company Name</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-2 bg-navy/5 border border-navy/10 rounded-lg text-[14px] outline-none focus:border-brand-blue"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-tx-muted uppercase tracking-wider">State</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-2 bg-navy/5 border border-navy/10 rounded-lg text-[14px] outline-none focus:border-brand-blue"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                    {activeTab === "specialty" && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-tx-muted uppercase tracking-wider">Specialty</label>
                        <input 
                          type="text"
                          className="w-full px-4 py-2 bg-navy/5 border border-navy/10 rounded-lg text-[14px] outline-none focus:border-brand-blue"
                          value={formData.specialty}
                          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-6 bg-navy/[0.02] border-t border-navy/5 flex items-center justify-end gap-3">
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-[14px] font-medium text-tx-sec hover:bg-navy/5 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="px-6 py-2 bg-brand-blue text-white text-[14px] font-bold rounded-lg hover:bg-brand-blue/90 transition-colors"
                    >
                      {modalMode === "add" ? "Add Company" : "Save Changes"}
                    </button>
                  </div>
                </>
              ) : modalTab === "duplicates" ? (
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-[13px] font-medium">
                      We found {duplicates.length} companies that already exist in the {activeTab} list.
                    </p>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto border border-navy/5 rounded-lg divide-y divide-navy/5">
                    {duplicates.map((d, i) => (
                      <div key={i} className="p-3 text-[13px] text-navy flex justify-between items-center">
                        <span>{d.name}</span>
                        <span className="text-[11px] font-bold text-tx-muted uppercase">{d.state}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => confirmUpload(true)}
                      className="w-full py-3 bg-brand-blue text-white rounded-lg text-[14px] font-bold hover:bg-brand-blue/90 transition-colors"
                    >
                      Skip Duplicates & Upload ({pendingUpload.length - duplicates.length} new)
                    </button>
                    <button 
                      onClick={() => confirmUpload(false)}
                      className="w-full py-3 bg-white border border-navy/10 text-navy rounded-lg text-[14px] font-bold hover:bg-navy/5 transition-colors"
                    >
                      Upload All Anyway ({pendingUpload.length} total)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-10 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue">
                    <Upload size={32} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-navy font-bold">Upload CSV File</h4>
                    <p className="text-tx-muted text-[13px] max-w-[280px]">
                      Upload a CSV file for <span className="font-bold text-brand-blue">{activeTab === "general" ? "General" : "Specialty"} Contractors</span>. <br />
                      Required columns: <br />
                      <span className="font-mono text-brand-blue font-bold">Company Name, State{activeTab === "specialty" ? ", Industry" : ""}</span>
                    </p>
                  </div>
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleCsvUpload}
                  />
                  <div className="flex flex-col w-full gap-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 bg-brand-blue text-white rounded-lg text-[14px] font-bold hover:bg-brand-blue/90 transition-colors shadow-sm"
                    >
                      Select CSV File
                    </button>
                    <button 
                      onClick={() => setModalTab("manual")}
                      className="w-full py-3 text-[13px] font-medium text-tx-muted hover:text-navy transition-colors"
                    >
                      Back to Manual Entry
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BackupView = ({ 
  weeks, 
  placements, 
  jobOrders, 
  touchpoints, 
  jobLeads, 
  wirEntries, 
  l10Ratings, 
  residentialServices, 
  generalContractors, 
  specialtyContractors, 
  realEstateCompanies,
  goals,
  issues,
  rocks,
  headlines,
  ptItems,
  bdItems
}: { 
  weeks: any[], 
  placements: any[], 
  jobOrders: any[], 
  touchpoints: any[], 
  jobLeads: any[], 
  wirEntries: any[], 
  l10Ratings: any[], 
  residentialServices: any[], 
  generalContractors: any[], 
  specialtyContractors: any[], 
  realEstateCompanies: any[],
  goals: any,
  issues: any[],
  rocks: any[],
  headlines: any[],
  ptItems: any[],
  bdItems: any[]
}) => {
  const exportToCsv = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error(`No data available for ${filename}`);
      return;
    }
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename} exported successfully`);
  };

  const exportAllAsJson = () => {
    const allData = {
      weeks,
      placements,
      jobOrders,
      touchpoints,
      jobLeads,
      wirEntries,
      l10Ratings,
      residentialServices,
      generalContractors,
      specialtyContractors,
      realEstateCompanies,
      goals,
      issues,
      rocks,
      headlines,
      ptItems,
      bdItems,
      exportedAt: new Date().toISOString()
    };
    const json = JSON.stringify(allData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `full_system_backup_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Full system backup exported successfully");
  };

  const exportItems = [
    { label: 'Weekly Activity', data: weeks, filename: 'weekly_activity', icon: <PlusCircle size={18} /> },
    { label: 'Placements', data: placements, filename: 'placements', icon: <UserPlus size={18} /> },
    { label: 'Job Orders', data: jobOrders, filename: 'job_orders', icon: <Briefcase size={18} /> },
    { label: 'Touchpoints', data: touchpoints, filename: 'touchpoints', icon: <Users size={18} /> },
    { label: 'Job Leads', data: jobLeads, filename: 'job_leads', icon: <Search size={18} /> },
    { label: 'Week in Review', data: wirEntries, filename: 'week_in_review', icon: <FileText size={18} /> },
    { label: 'L10 Ratings', data: l10Ratings, filename: 'l10_ratings', icon: <Star size={18} /> },
    { label: 'Residential Services', data: residentialServices, filename: 'residential_services', icon: <Home size={18} /> },
    { label: 'General Contractors', data: generalContractors, filename: 'general_contractors', icon: <HardHat size={18} /> },
    { label: 'Specialty Contractors', data: specialtyContractors, filename: 'specialty_contractors', icon: <HardHat size={18} /> },
    { label: 'Real Estate Companies', data: realEstateCompanies, filename: 'real_estate_companies', icon: <Map size={18} /> },
    { label: 'System Goals', data: [goals], filename: 'system_goals', icon: <Target size={18} /> },
    { label: 'L10 Issues', data: issues, filename: 'l10_issues', icon: <AlertCircle size={18} /> },
    { label: 'L10 Rocks', data: rocks, filename: 'l10_rocks', icon: <Zap size={18} /> },
    { label: 'L10 Headlines', data: headlines, filename: 'l10_headlines', icon: <MessageSquare size={18} /> },
    { label: 'L10 Touchpoints', data: ptItems, filename: 'l10_touchpoints', icon: <Users size={18} /> },
    { label: 'L10 Bus. Dev.', data: bdItems, filename: 'l10_business_dev', icon: <Briefcase size={18} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12 px-6">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center mx-auto">
          <Database size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-serif font-bold text-navy">System Backup & Export</h2>
          <p className="text-tx-sec max-w-lg mx-auto">
            Securely export your recruitment data for external backup, analysis, or system migration.
          </p>
        </div>
      </div>

      <div className="bg-brand-blue/5 border border-brand-blue/10 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-2">
          <h3 className="text-xl font-bold text-navy flex items-center gap-2">
            <Download className="w-5 h-5 text-brand-blue" />
            Full System Backup
          </h3>
          <p className="text-sm text-tx-sec">
            Download all system data including goals, masterlists, and activity logs in a single JSON file.
          </p>
        </div>
        <button 
          onClick={exportAllAsJson}
          className="px-8 py-4 bg-brand-blue text-white rounded-xl font-bold hover:bg-light-blue transition-all shadow-lg hover:shadow-brand-blue/20 flex items-center gap-3 whitespace-nowrap"
        >
          <Database size={20} />
          Download Full Backup
        </button>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-bold text-navy border-b border-navy/5 pb-2">Individual Data Exports (CSV)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exportItems.map(item => (
            <button 
              key={item.label} 
              onClick={() => exportToCsv(item.data, item.filename)}
              className="flex items-center gap-4 p-5 bg-surf border border-navy/10 rounded-2xl hover:border-brand-blue/30 hover:shadow-xl transition-all text-left group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Download size={14} className="text-brand-blue" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center text-brand-blue group-hover:bg-brand-blue/10 transition-colors shrink-0">
                {item.icon}
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-navy text-[14px] leading-tight">{item.label}</div>
                <div className="text-[11px] text-tx-muted uppercase tracking-wider">{item.data.length} Records</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4">
        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-900">Data Security Note</h4>
          <p className="text-xs text-amber-800 leading-relaxed">
            Exported files contain sensitive recruitment data. Ensure these files are stored securely and handled in compliance with your data protection policies.
          </p>
        </div>
      </div>
    </div>
  );
};
const ReportView = ({ weeks, placements, jobOrders, touchpoints, jobLeads, goals, headlines }: any) => {
  const [reportType, setReportType] = useState<'quarterly' | 'annual'>('quarterly');
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const quarters = [
    { id: 1, label: 'Q1 (Jan - Mar)', months: [0, 1, 2] },
    { id: 2, label: 'Q2 (Apr - Jun)', months: [3, 4, 5] },
    { id: 3, label: 'Q3 (Jul - Sep)', months: [6, 7, 8] },
    { id: 4, label: 'Q4 (Oct - Dec)', months: [9, 10, 11] },
  ];

  const quarterInfo = quarters.find(q => q.id === selectedQuarter)!;

  const filteredWeeks = useMemo(() => {
    return weeks.filter((w: any) => {
      const d = new Date(w.date);
      if (reportType === 'annual') {
        return d.getFullYear() === selectedYear;
      }
      return d.getFullYear() === selectedYear && quarterInfo.months.includes(d.getMonth());
    }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [weeks, selectedYear, selectedQuarter, reportType]);

  const chartData = useMemo(() => {
    return filteredWeeks.map((w: any) => ({
      name: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      meetings: w.meetings || 0,
      subs: w.subs || 0,
      int1: w.int1 || 0,
    }));
  }, [filteredWeeks]);

  const filteredPlacements = useMemo(() => {
    return placements.filter((p: any) => {
      if (!p.start) return false;
      const d = new Date(p.start);
      if (reportType === 'annual') return d.getFullYear() === selectedYear;
      return d.getFullYear() === selectedYear && quarterInfo.months.includes(d.getMonth());
    });
  }, [placements, selectedYear, selectedQuarter, reportType, quarterInfo.months]);

  const filteredJobOrders = useMemo(() => {
    return jobOrders.filter((j: any) => {
      const d = new Date(j.date || j.createdAt);
      if (reportType === 'annual') return d.getFullYear() === selectedYear;
      return d.getFullYear() === selectedYear && quarterInfo.months.includes(d.getMonth());
    });
  }, [jobOrders, selectedYear, selectedQuarter, reportType, quarterInfo.months]);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const html2canvas = (await import('html2canvas')).default;
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const navy: [number, number, number] = [44, 62, 80];
      const orange: [number, number, number] = [211, 84, 0];
      const lightGrey: [number, number, number] = [244, 244, 244];
      const footerBg: [number, number, number] = [249, 249, 247];

      // Filter data
      const filteredPlacements = placements.filter((p: any) => {
        if (!p.start) return false;
        const d = new Date(p.start);
        if (reportType === 'annual') return d.getFullYear() === selectedYear;
        return d.getFullYear() === selectedYear && quarterInfo.months.includes(d.getMonth());
      });

      const filteredJobOrders = jobOrders.filter((j: any) => {
        const d = new Date(j.date || j.createdAt);
        if (reportType === 'annual') return d.getFullYear() === selectedYear;
        return d.getFullYear() === selectedYear && quarterInfo.months.includes(d.getMonth());
      });

      const totalRevenue = filteredPlacements.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0);
      const divisor = reportType === 'annual' ? 1 : 4;
      const targetRevenue = goals.revenue / divisor;

      const stats = filteredWeeks.reduce((acc: any, w: any) => ({
        meetings: acc.meetings + (w.meetings || 0),
        subs: acc.subs + (w.subs || 0),
        int1: acc.int1 + (w.int1 || 0),
        place: acc.place + (w.place || 0)
      }), { meetings: 0, subs: 0, int1: 0, place: 0 });

      // --- HEADER ---
      doc.setFillColor(...navy);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      // Slanted Image Placeholder (Left)
      doc.setFillColor(60, 80, 100);
      doc.triangle(0, 0, 80, 0, 0, 50, 'F');
      doc.setFillColor(...orange);
      doc.setLineWidth(2);
      doc.line(80, 0, 0, 50);

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('One Pager Performance Report', 85, 20);
      doc.setFontSize(22);
      doc.text('Executive Summary', 85, 32);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const headerSubtext = `This one page report showcase the details of company performance for ${reportType === 'annual' ? selectedYear : `${quarterInfo.label} ${selectedYear}`}, including key highlights, activity trends, and financial objectives.`;
      doc.text(doc.splitTextToSize(headerSubtext, 110), 85, 40);

      // --- COMPANY BAR ---
      doc.setFillColor(...orange);
      doc.rect(0, 50, pageWidth, 15, 'F');
      doc.triangle(0, 50, 60, 50, 45, 65, 'F'); // Slant transition
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Blue Door Talent', 15, 60);
      doc.text('Executive Search', pageWidth - 55, 60);

      // --- BODY LAYOUT (TWO COLUMNS) ---
      const col1X = 10;
      const col2X = 110;
      const colWidth = 90;
      let currentY = 75;

      // Helper for Section Titles
      const drawSectionTitle = (title: string, x: number, y: number) => {
        doc.setTextColor(...orange);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(title, x + 8, y);
        // Circle icon placeholder
        doc.setDrawColor(...navy);
        doc.setLineWidth(0.5);
        doc.circle(x + 3, y - 1.5, 3);
        return y + 8;
      };

      // LEFT COLUMN
      let leftY = currentY;
      leftY = drawSectionTitle('Key Highlights', col1X, leftY);
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const highlightsList = headlines.length > 0 ? headlines.slice(0, 3).map(h => h.text) : [
        `Achieved $${totalRevenue.toLocaleString()} in total revenue.`,
        `Successfully completed ${filteredPlacements.length} executive placements.`,
        `Generated ${filteredJobOrders.length} new job orders.`
      ];
      highlightsList.forEach(h => {
        const splitH = doc.splitTextToSize(`• ${h}`, colWidth);
        doc.text(splitH, col1X, leftY);
        leftY += (splitH.length * 4) + 2;
      });

      leftY += 5;
      leftY = drawSectionTitle('Current Status', col1X, leftY);
      const boxWidth = 28;
      const boxHeight = 25;
      const boxes = [
        { label: 'Total Sales', val: `$${(totalRevenue/1000).toFixed(1)}K`, color: navy },
        { label: 'Placements', val: filteredPlacements.length.toString(), color: navy },
        { label: 'Job Orders', val: filteredJobOrders.length.toString(), color: navy }
      ];
      boxes.forEach((box, i) => {
        const bx = col1X + (i * (boxWidth + 3));
        doc.setFillColor(...box.color);
        doc.rect(bx, leftY, boxWidth, boxHeight, 'F');
        doc.setTextColor(...orange);
        doc.setFontSize(10);
        doc.text(box.val, bx + boxWidth/2, leftY + 12, { align: 'center' });
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.text(doc.splitTextToSize(box.label, boxWidth - 4), bx + boxWidth/2, leftY + 18, { align: 'center' });
      });
      leftY += boxHeight + 10;

      leftY = drawSectionTitle('Sales Growth Drivers', col1X, leftY);
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(9);
      const drivers = [
        'Strategic focus on high-growth construction sectors.',
        'Expansion of candidate network in Real Estate.',
        'Enhanced client relationship management.'
      ];
      drivers.forEach(d => {
        doc.text(`• ${d}`, col1X, leftY);
        leftY += 5;
      });

      leftY += 8;
      leftY = drawSectionTitle('Company Objectives', col1X, leftY);
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(9);
      const objectiveText = "To create the highest standards of quality and offer outstanding customer services in executive search.";
      doc.text(doc.splitTextToSize(objectiveText, colWidth), col1X, leftY);

      // RIGHT COLUMN
      let rightY = currentY;
      
      // Sales Channel Chart (Manual Draw)
      doc.setFillColor(...navy);
      doc.rect(col2X, rightY - 5, colWidth, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text('Activity Channels', col2X + colWidth/2, rightY - 0.5, { align: 'center' });
      rightY += 5;
      
      const chartItems = [
        { label: 'Meetings', val: stats.meetings, max: goals.meetings },
        { label: 'Submissions', val: stats.subs, max: goals.subs },
        { label: 'Interviews', val: stats.int1, max: goals.int1 },
        { label: 'Placements', val: stats.place, max: goals.place }
      ];
      chartItems.forEach(item => {
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(8);
        doc.text(item.label, col2X, rightY + 4);
        doc.setFillColor(230, 230, 230);
        doc.rect(col2X + 25, rightY, colWidth - 30, 5, 'F');
        const barWidth = Math.min((item.val / (item.max || 1)) * (colWidth - 30), colWidth - 30);
        doc.setFillColor(...orange);
        doc.rect(col2X + 25, rightY, barWidth, 5, 'F');
        rightY += 8;
      });

      rightY += 10;
      // Sales Pipeline (Using the captured chart)
      doc.setFillColor(...navy);
      doc.rect(col2X, rightY - 5, colWidth, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('Sales Pipeline Trends', col2X + colWidth/2, rightY - 0.5, { align: 'center' });
      rightY += 5;

      if (chartRef.current && chartData.length > 0) {
        const canvas = await html2canvas(chartRef.current, { scale: 2, logging: false, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', col2X, rightY, colWidth, 40);
        rightY += 45;
      }

      rightY = drawSectionTitle('Financial Objectives', col2X, rightY);
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(9);
      const finObjective = `Increasing profit margin and achieving a revenue target of $${targetRevenue.toLocaleString()} for this period.`;
      doc.text(doc.splitTextToSize(finObjective, colWidth), col2X, rightY);

      // --- FOOTER SECTION (CURRENT FINANCIAL STATUS) ---
      const footerY = 205;
      doc.setFillColor(...footerBg);
      doc.rect(0, footerY, pageWidth, pageHeight - footerY, 'F');
      
      doc.setTextColor(...orange);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Current Financial Status', pageWidth/2, footerY + 12, { align: 'center' });
      
      const metrics = [
        { label: 'Total Revenue', val: `$${totalRevenue.toLocaleString()}`, sub: 'Direct placement fees' },
        { label: 'Target Revenue', val: `$${targetRevenue.toLocaleString()}`, sub: 'Strategic goal' },
        { label: 'Total Placements', val: filteredPlacements.length.toString(), sub: 'Successful hires' },
        { label: 'Avg Fee', val: `$${(totalRevenue / (filteredPlacements.length || 1)).toLocaleString()}`, sub: 'Per placement' },
        { label: 'Job Orders', val: filteredJobOrders.length.toString(), sub: 'Active searches' },
        { label: 'Success Rate', val: `${Math.round((filteredPlacements.length / (filteredJobOrders.length || 1)) * 100)}%`, sub: 'Fill ratio' }
      ];

      let mx = 15;
      let my = footerY + 25;
      metrics.forEach((m, i) => {
        doc.setFillColor(255, 255, 255);
        doc.rect(mx, my, 85, 18, 'F');
        
        // Icon placeholder
        doc.setFillColor(...lightGrey);
        doc.circle(mx + 8, my + 9, 6, 'F');
        
        doc.setTextColor(...orange);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(m.label, mx + 16, my + 7);
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(m.sub, mx + 16, my + 13);
        
        doc.setTextColor(...orange);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(m.val, mx + 80, my + 11, { align: 'right' });

        if (i % 2 === 0) {
          mx = 110;
        } else {
          mx = 15;
          my += 21;
        }
      });

      doc.save(`${reportType === 'annual' ? 'Annual' : 'Quarterly'}_Report_${selectedYear}.pdf`);
      toast.success("Report generated successfully");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12 px-6">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center mx-auto">
          <FilePlus size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-serif font-bold text-navy">System Performance Report</h2>
          <p className="text-tx-sec max-w-lg mx-auto">
            Generate a comprehensive one-page summary of your recruitment activity and goal progress.
          </p>
        </div>
      </div>

      <div className="bg-surf border border-navy/10 rounded-2xl p-10 shadow-sm space-y-8">
        <div className="space-y-4">
          <label className="text-xs font-bold text-tx-muted uppercase tracking-widest">Report Type</label>
          <div className="flex gap-4">
            <button
              onClick={() => setReportType('quarterly')}
              className={cn(
                "flex-1 py-4 px-4 rounded-xl border font-bold transition-all text-sm",
                reportType === 'quarterly' 
                  ? "bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20" 
                  : "bg-surf-2 border-navy/5 text-tx-sec hover:border-brand-blue/30"
              )}
            >
              Quarterly Report
            </button>
            <button
              onClick={() => setReportType('annual')}
              className={cn(
                "flex-1 py-4 px-4 rounded-xl border font-bold transition-all text-sm",
                reportType === 'annual' 
                  ? "bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20" 
                  : "bg-surf-2 border-navy/5 text-tx-sec hover:border-brand-blue/30"
              )}
            >
              Annual Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reportType === 'quarterly' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-tx-muted uppercase tracking-widest">Select Quarter</label>
              <div className="grid grid-cols-2 gap-3">
                {quarters.map(q => (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuarter(q.id)}
                    className={cn(
                      "py-4 px-4 rounded-xl border font-bold transition-all text-sm",
                      selectedQuarter === q.id 
                        ? "bg-brand-blue text-white border-brand-blue" 
                        : "bg-surf-2 border-navy/5 text-tx-sec hover:border-brand-blue/30"
                    )}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-xs font-bold text-tx-muted uppercase tracking-widest">Select Year</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full py-4 px-4 bg-surf-2 border border-navy/5 rounded-xl font-bold text-navy outline-none focus:border-brand-blue transition-all"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Hidden Chart for PDF Capture */}
        <div className="absolute -left-[9999px] top-0">
          <div ref={chartRef} className="w-[800px] bg-white p-10 space-y-10">
            <h3 className="text-xl font-bold text-navy border-b pb-2">
              {reportType === 'annual' ? 'Annual Activity Trends' : `Weekly Activity Trends - ${quarterInfo.label}`}
            </h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={10} interval={reportType === 'annual' ? 4 : 0} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="meetings" name="Meetings" fill="#2980B9" isAnimationActive={false} />
                  <Bar dataKey="subs" name="Submissions" fill="#C0392B" isAnimationActive={false} />
                  <Bar dataKey="int1" name="Interviews" fill="#E67E22" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-navy/5 flex flex-col items-center gap-6">
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 max-w-md w-full">
            <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Comprehensive Report
            </h4>
            <ul className="text-xs text-blue-800 space-y-2">
              <li className="flex items-center gap-2">• Performance Summary & Goal Analysis</li>
              <li className="flex items-center gap-2">• Key Headlines & Milestones</li>
              <li className="flex items-center gap-2">• Top Recorded Placements</li>
              <li className="flex items-center gap-2">• LinkedIn Follower Growth Tracking</li>
            </ul>
          </div>

          <button 
            disabled={isGenerating}
            onClick={generatePDF}
            className="w-full max-w-md py-5 bg-brand-blue text-white rounded-xl font-bold hover:bg-light-blue transition-all shadow-xl hover:shadow-brand-blue/30 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download size={20} />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const JobOrdersView = ({ jobOrders, setJobOrders, goals }: { jobOrders: any[], setJobOrders: any, goals: any }) => {
  return <MonthlyTrackerView title="Job Orders" data={jobOrders} setData={setJobOrders} goal={goals.orders} isJobOrder={true} />;
};
const ScorecardView = ({ weeks, stats, placements, setPlacements, goals, jobOrders, touchpoints, jobLeads }: { weeks: any[], stats: any, placements: any[], setPlacements: any, goals: any, jobOrders: any[], touchpoints: any[], jobLeads: any[] }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  const PLACEMENT_MILESTONES = [
    { yrs: 7/365, l: '1st Week' },
    { yrs: 1/12, l: '1st Month' },
    { yrs: 3/12, l: '3rd Month' },
    { yrs: 1, l: '1 Year' },
    { yrs: 2, l: '2 Years' },
    { yrs: 3, l: '3 Years' },
    { yrs: 4, l: '4 Years' },
    { yrs: 5, l: '5 Years' }
  ];

  const chartData = useMemo(() => {
    const sorted = [...weeks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted.map((w, i) => {
      const prev = sorted[i - 1];
      const growth = prev ? (w.followers || 0) - (prev.followers || 0) : 0;
      
      // Calculate placements for this specific week
      const weekStart = new Date(w.date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekPlacements = placements.filter(p => {
        if (!p.start) return false;
        const pDate = new Date(p.start + 'T00:00:00');
        return pDate >= weekStart && pDate <= weekEnd;
      }).length;

      return {
        name: fmtS(w.date),
        meetings: w.meetings || 0,
        subs: w.subs || 0,
        int1: w.int1 || 0,
        int2: w.int2 || 0,
        place: weekPlacements,
        followers: growth
      };
    });
  }, [weeks, placements]);

  const revData = useMemo(() => {
    const q = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
    const curYr = new Date().getFullYear();
    placements.filter(p => p.start?.startsWith(String(curYr))).forEach(p => {
      const m = new Date(p.start + 'T00:00:00').getMonth() + 1;
      const k = m <= 3 ? 'Q1' : m <= 6 ? 'Q2' : m <= 9 ? 'Q3' : 'Q4';
      q[k as keyof typeof q] += (p.revenue || 0);
    });
    return q;
  }, [placements]);

  const curDate = new Date();
  const startOfYear = new Date(curDate.getFullYear(), 0, 1);
  const endOfYear = new Date(curDate.getFullYear(), 11, 31);
  const totalDays = (endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
  const elapsedDays = (curDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
  const percentYearElapsed = Math.min(Math.round((elapsedDays / totalDays) * 100), 100);

  const overallProgress = Math.round((stats.meetings / goals.meetings + stats.place / goals.place + stats.orders / goals.orders) / 3 * 100);
  const progressDiff = overallProgress - percentYearElapsed;

  const MetricCard = ({ title, val, goal, t1, t2, t3, t1Goal, t2Goal, t3Goal, isFollowers = false, bg = "bg-surf" }: any) => {
    const percent = goal > 0 ? Math.round((val / goal) * 1000) / 10 : 0;
    const t1Pct = t1Goal > 0 ? Math.round((t1 / t1Goal) * 1000) / 10 : 0;
    const t2Pct = t2Goal > 0 ? Math.round((t2 / t2Goal) * 100) : 0;
    const t3Pct = t3Goal > 0 ? Math.round((t3 / t3Goal) * 100) : 0;

    const isDark = bg && (bg.includes('600') || bg.includes('700') || bg.includes('800') || bg.includes('900') || bg.includes('navy'));

    return (
      <div className={cn("border border-navy/10 rounded-xl p-5 shadow-sm flex flex-col h-full transition-all hover:shadow-md", bg)}>
        <h4 className={cn("text-[11px] font-bold uppercase tracking-wider mb-3", isDark ? "text-white/80" : "text-brand-blue")}>{title}</h4>
        <div className="flex items-baseline gap-2 mb-1">
          <span className={cn("text-2xl font-serif font-bold", isDark ? "text-white" : "text-navy")}>
            {isFollowers ? val.toLocaleString() : val}
          </span>
          <span className={cn("text-xs", isDark ? "text-white/60" : "text-tx-muted")}>/ {isFollowers ? goal.toLocaleString() : goal}</span>
        </div>
        <div className={cn("text-[11px] font-bold mb-4", isDark ? "text-white" : "text-brand-blue")}>
          {percent}%
        </div>
        
        <div className="mt-auto space-y-3">
          <div className={cn("h-1.5 rounded-full overflow-hidden", isDark ? "bg-white/20" : "bg-navy/10")}>
            <div className={cn("h-full", isDark ? "bg-white" : "bg-brand-blue")} style={{ width: `${Math.min(percent, 100)}%` }} />
          </div>
          
          <div className={cn("space-y-2 pt-2 border-t", isDark ? "border-white/10" : "border-navy/10")}>
            {[
              { l: 'T1', v: t1, g: t1Goal, p: t1Pct, color: isDark ? 'bg-white' : 'bg-blue-600' },
              { l: 'T2', v: t2, g: t2Goal, p: t2Pct, color: isDark ? 'bg-white/80' : 'bg-blue-400' },
              { l: 'T3', v: t3, g: t3Goal, p: t3Pct, color: isDark ? 'bg-white/60' : 'bg-slate-400' }
            ].map(t => (
              <div key={t.l} className="flex items-center gap-3">
                <span className={cn("text-[9px] font-bold w-4", isDark ? "text-white/70" : "text-tx-muted")}>{t.l}</span>
                <span className={cn("text-[9px] w-12", isDark ? "text-white/80" : "text-tx-sec")}>{t.v} / {t.g}</span>
                <div className={cn("flex-1 h-1 rounded-full overflow-hidden", isDark ? "bg-white/20" : "bg-navy/10")}>
                  <div className={cn("h-full", t.color)} style={{ width: `${Math.min(t.p, 100)}%` }} />
                </div>
                <span className={cn("text-[9px] font-bold w-8 text-right", isDark ? "text-white/70" : "text-tx-muted")}>{t.p}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-surf border border-navy/10 rounded-2xl p-8 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-tx-muted font-bold mb-2">Overall Progress</p>
          <div className="text-6xl font-serif font-bold text-brand-blue">{progressDiff > 0 ? '+' : ''}{progressDiff}%</div>
          <p className="text-[11px] text-tx-muted mt-4">
            <span className="font-bold">{percentYearElapsed}%</span> of 2026 elapsed<br/>
            <span className="text-tx-muted/70">52 weeks · through Dec 28</span>
          </p>
        </div>
        
        <div className="bg-surf border border-navy/10 rounded-2xl p-8 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-tx-muted font-bold mb-2">Revenue</p>
          <div className="text-6xl font-serif font-bold text-brand-blue">${stats.revenue.toLocaleString()}</div>
          <p className="text-[11px] text-tx-muted mb-6">Goal: ${goals.revenue.toLocaleString()}</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {Object.entries(revData).map(([q, val]) => (
              <div key={q}>
                <p className="text-[10px] font-bold text-tx-muted/60 uppercase tracking-widest">{q}</p>
                <p className="text-lg font-serif font-bold text-brand-blue">${val.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surf border border-navy/10 rounded-2xl p-8 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-tx-muted font-bold mb-2">Placements</p>
          <div className="text-6xl font-serif font-bold text-brand-blue">{stats.place}</div>
          <p className="text-[11px] text-tx-muted mt-4">
            Goal: {goals.place} · {Math.round((stats.place / goals.place) * 1000) / 10}%
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-bold text-brand-blue uppercase tracking-widest mb-6 border-b border-navy/10 pb-2">All Metrics — Annual Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard 
            title="# of Job Orders (New Searches)" 
            val={stats.orders} 
            goal={goals.orders}
            t1={jobOrders.filter(j => j.tier === 'Tier 1').length} t1Goal={38}
            t2={jobOrders.filter(j => j.tier === 'Tier 2').length} t2Goal={30}
            t3={jobOrders.filter(j => j.tier === 'Tier 3').length} t3Goal={7}
            bg="bg-emerald-900"
          />
          <MetricCard 
            title="# of Candidate Meetings" 
            val={stats.meetings} 
            goal={goals.meetings}
            t1={0} t1Goal={500}
            t2={0} t2Goal={350}
            t3={0} t3Goal={150}
            bg="bg-rose-900"
          />
          <MetricCard 
            title="# of Candidate Submissions" 
            val={stats.subs} 
            goal={goals.subs}
            t1={0} t1Goal={185}
            t2={0} t2Goal={130}
            t3={0} t3Goal={55}
            bg="bg-emerald-800"
          />
          <MetricCard 
            title="# of First Time Interviews" 
            val={stats.int1} 
            goal={goals.int1}
            t1={0} t1Goal={100}
            t2={0} t2Goal={70}
            t3={0} t3Goal={30}
            bg="bg-rose-800"
          />
          <MetricCard 
            title="# of 2nd Round Interviews" 
            val={stats.int2} 
            goal={goals.int2}
            t1={0} t1Goal={43}
            t2={0} t2Goal={30}
            t3={0} t3Goal={12}
            bg="bg-emerald-700"
          />
          <MetricCard 
            title="# of Placements" 
            val={stats.place} 
            goal={goals.place}
            t1={stats.t1} t1Goal={22}
            t2={stats.t2} t2Goal={15}
            t3={stats.t3} t3Goal={7}
            bg="bg-rose-700"
          />
          <MetricCard 
            title="# of LinkedIn Posts" 
            val={stats.posts} 
            goal={goals.posts}
            t1={stats.posts} t1Goal={52}
            t2={0} t2Goal={0}
            t3={0} t3Goal={0}
            bg="bg-emerald-950"
          />
          <MetricCard 
            title="# of 1:1 Touchpoints" 
            val={stats.touch} 
            goal={goals.touch}
            t1={0} t1Goal={165}
            t2={0} t2Goal={115}
            t3={0} t3Goal={50}
            bg="bg-rose-950"
          />
          <MetricCard 
            title="# of Job Leads" 
            val={stats.leads} 
            goal={goals.leads}
            t1={0} t1Goal={43}
            t2={0} t2Goal={30}
            t3={0} t3Goal={13}
            bg="bg-emerald-600"
          />
          <MetricCard 
            title="LinkedIn Follower Growth" 
            val={stats.followers} 
            goal={goals.followers}
            t1={stats.followers} t1Goal={2600}
            t2={0} t2Goal={0}
            t3={0} t3Goal={0}
            isFollowers={true}
            bg="bg-rose-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surf border border-navy/10 rounded-2xl p-8 shadow-sm">
          <h3 className="text-[10px] font-bold text-brand-blue uppercase tracking-[0.3em] mb-8 font-serif"># of Candidate Meetings per Week</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#0A112810" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} stroke="#0A112840" />
                <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#0A112840" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #0A112810', fontSize: '12px', color: '#0A1128' }}
                  cursor={{ fill: '#0A112805' }}
                />
                <Bar dataKey="meetings" radius={[2, 2, 0, 0]} barSize={30} fill="#1ABC9C" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surf border border-navy/10 rounded-2xl p-8 shadow-sm">
          <h3 className="text-[10px] font-bold text-brand-blue uppercase tracking-[0.3em] mb-8 font-serif"># of Candidate Submissions per Week</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#0A112810" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} stroke="#0A112840" />
                <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#0A112840" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #0A112810', fontSize: '12px', color: '#0A1128' }}
                  cursor={{ fill: '#0A112805' }}
                />
                <Bar dataKey="subs" radius={[2, 2, 0, 0]} barSize={30} fill="#3498DB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surf border border-navy/10 rounded-2xl p-8 shadow-sm">
          <h3 className="text-[10px] font-bold text-brand-blue uppercase tracking-[0.3em] mb-8 font-serif"># of First Time Interviews</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#0A112810" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} stroke="#0A112840" />
                <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#0A112840" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #0A112810', fontSize: '12px', color: '#0A1128' }}
                  cursor={{ fill: '#0A112805' }}
                />
                <Bar dataKey="int1" radius={[2, 2, 0, 0]} barSize={30} fill="#F27D26" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surf border border-navy/10 rounded-2xl p-8 shadow-sm">
          <h3 className="text-[10px] font-bold text-brand-blue uppercase tracking-[0.3em] mb-8 font-serif"># of 2nd Round Interviews</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#0A112810" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} stroke="#0A112840" />
                <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#0A112840" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #0A112810', fontSize: '12px', color: '#0A1128' }}
                  cursor={{ fill: '#0A112805' }}
                />
                <Bar dataKey="int2" radius={[2, 2, 0, 0]} barSize={30} fill="#34495E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surf border border-navy/10 rounded-2xl p-8 shadow-sm">
          <h3 className="text-[10px] font-bold text-brand-blue uppercase tracking-[0.3em] mb-8 font-serif"># of Placements</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#0A112810" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} stroke="#0A112840" />
                <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#0A112840" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #0A112810', fontSize: '12px', color: '#0A1128' }}
                  cursor={{ fill: '#0A112805' }}
                />
                <Bar dataKey="place" radius={[2, 2, 0, 0]} barSize={30} fill="#1ABC9C" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surf border border-navy/10 rounded-2xl p-8 shadow-sm">
          <h3 className="text-[10px] font-bold text-brand-blue uppercase tracking-[0.3em] mb-8 font-serif">Follower Count - Weekly Growth</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorFoll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F27D26" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#F27D26" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#0A112810" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} stroke="#0A112840" />
                <YAxis fontSize={10} axisLine={false} tickLine={false} domain={[0, 'dataMax + 10']} stroke="#0A112840" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #0A112810', fontSize: '12px', color: '#0A1128' }}
                />
                <Area type="monotone" dataKey="followers" stroke="#F27D26" fillOpacity={1} fill="url(#colorFoll)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <div className="text-[13px] font-bold text-brand-blue uppercase tracking-widest mb-4 font-serif">Placements</div>
          <div className="bg-surf border border-navy/10 rounded-xl overflow-hidden overflow-x-auto max-h-[600px] overflow-y-auto relative">
            <table className="w-full text-[11px] bdt-table border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="text-left p-4 border-b border-navy/5 bg-surf-2 font-bold uppercase tracking-wider">Name</th>
                  <th className="text-left p-4 border-b border-navy/5 bg-surf-2 font-bold uppercase tracking-wider w-32">Position</th>
                  <th className="text-left p-4 border-b border-navy/5 bg-surf-2 font-bold uppercase tracking-wider w-32">Client</th>
                  <th className="text-left p-4 border-b border-navy/5 bg-surf-2 font-bold uppercase tracking-wider">Category</th>
                  <th className="text-center p-4 border-b border-navy/5 bg-surf-2 font-bold uppercase tracking-wider">Start Date</th>
                  <th className="text-center p-4 border-b border-navy/5 bg-surf-2 font-bold uppercase tracking-wider">Tenure</th>
                  {PLACEMENT_MILESTONES.map(ms => (
                    <th key={ms.l} className="text-center p-4 whitespace-nowrap border-b border-navy/5 bg-surf-2 font-bold uppercase tracking-wider">{ms.l}</th>
                  ))}
                  <th className="text-center p-4 border-b border-navy/5 bg-surf-2 font-bold uppercase tracking-wider">Status</th>
                  <th className="text-center p-4 border-b border-navy/5 bg-surf-2 font-bold uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {placements.sort((a,b) => b.start.localeCompare(a.start)).map(p => {
                  const isEditing = editingId === p.id;
                  const startDate = new Date(p.start + 'T00:00:00');
                  const isStartCur = isCurrentMonth(startDate);
                  const tenure = ((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);

                  const handleSave = () => {
                    setPlacements(placements.map(item => item.id === p.id ? { ...item, ...editForm } : item));
                    setEditingId(null);
                    toast.success("Placement updated");
                  };

                  return (
                    <tr key={p.id} className="hover:bg-navy/5 transition-colors border-b border-navy/5">
                      <td className="font-bold text-navy p-4 whitespace-nowrap">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editForm?.name || ""} 
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                            className="w-full bg-surf border border-navy/10 rounded px-2 py-1 text-[11px]"
                          />
                        ) : p.name}
                      </td>
                      <td className="text-tx-sec p-4 w-32 break-words leading-tight">
                        {isEditing ? (
                          <textarea 
                            value={editForm?.position || ""} 
                            onChange={e => setEditForm({...editForm, position: e.target.value})}
                            className="w-full bg-surf border border-navy/10 rounded px-2 py-1 text-[11px] resize-none"
                            rows={2}
                          />
                        ) : p.position}
                      </td>
                      <td className="text-tx-sec p-4 w-32 break-words leading-tight">
                        {isEditing ? (
                          <textarea 
                            value={editForm?.client || ""} 
                            onChange={e => setEditForm({...editForm, client: e.target.value})}
                            className="w-full bg-surf border border-navy/10 rounded px-2 py-1 text-[11px] resize-none"
                            rows={2}
                          />
                        ) : p.client}
                      </td>
                      <td className="text-tx-sec p-4 whitespace-nowrap">
                        {isEditing ? (
                          <select 
                            value={editForm?.tier || "Tier 1"} 
                            onChange={e => setEditForm({...editForm, tier: e.target.value})}
                            className="bg-surf border border-navy/10 rounded px-2 py-1 text-[11px]"
                          >
                            <option value="Tier 1">Tier 1</option>
                            <option value="Tier 2">Tier 2</option>
                            <option value="Tier 3">Tier 3</option>
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 bg-navy/5 rounded text-[10px] font-medium">{p.tier}</span>
                        )}
                      </td>
                      <td className={cn("text-center p-4 whitespace-nowrap", isStartCur ? "text-green-800 font-bold bg-green-100" : "text-tx-sec")}>
                        {isEditing ? (
                          <input 
                            type="date" 
                            value={editForm?.start || ""} 
                            onChange={e => setEditForm({...editForm, start: e.target.value})}
                            className="bg-surf border border-navy/10 rounded px-2 py-1 text-[11px]"
                          />
                        ) : fmtShortMonth(startDate)}
                      </td>
                      <td className="text-center p-4 whitespace-nowrap text-tx-sec font-mono">{tenure} yrs</td>
                      {PLACEMENT_MILESTONES.map(ms => {
                        const d = new Date(p.start + 'T00:00:00');
                        d.setDate(d.getDate() + Math.round(ms.yrs * 365));
                        const isCur = isCurrentMonth(d);
                        return (
                          <td key={ms.l} className={cn("text-center p-4 whitespace-nowrap", isCur ? "text-green-800 font-bold bg-green-100" : "text-tx-sec")}>
                            {fmtShortMonth(d)}
                          </td>
                        );
                      })}
                      <td className="text-center p-4">
                        <select 
                          value={p.status || 'Active'} 
                          onChange={(e) => {
                            const newPlacements = placements.map(item => 
                              item.id === p.id ? { ...item, status: e.target.value } : item
                            );
                            setPlacements(newPlacements);
                          }}
                          className="bg-transparent border border-navy/10 rounded px-2 py-1 text-[10px] font-bold focus:ring-0 cursor-pointer"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="text-center p-4">
                        <div className="flex items-center justify-center gap-1">
                          {isEditing ? (
                            <button 
                              onClick={handleSave}
                              className="p-1.5 text-blue-800 hover:bg-blue-100 rounded transition-colors"
                              title="Save Changes"
                            >
                              <Check size={14} />
                            </button>
                          ) : (
                            <button 
                              onClick={() => {
                                setEditingId(p.id);
                                setEditForm({ ...p });
                              }}
                              className="p-1.5 text-tx-muted hover:text-brand-blue transition-colors"
                              title="Edit Placement"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => setRemovingId(p.id)}
                            className="p-1.5 text-tx-muted hover:text-navy transition-colors"
                            title="Remove Placement"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {placements.length === 0 && (
                  <tr>
                    <td colSpan={PLACEMENT_MILESTONES.length + 7} className="p-8 text-center text-tx-muted italic">No placements found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={removingId !== null}
        onClose={() => setRemovingId(null)}
        onConfirm={() => {
          if (removingId) {
            setPlacements(placements.filter(item => item.id !== removingId));
            toast.success("Placement removed");
          }
        }}
        title="Remove Placement"
        message="Are you sure you want to remove this placement?"
      />
    </div>
  );
};

const Sidebar = ({ activeView, onViewChange }: { activeView: string, onViewChange: (view: string) => void }) => {
  const [isMasterlistOpen, setIsMasterlistOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, section: "OVERVIEW" },
    { id: "l10", label: "L10 Meeting", icon: ClipboardList, section: "OVERVIEW" },
    { id: "scorecard", label: "Scorecard", icon: BarChartIcon, section: "OVERVIEW" },
    { id: "search-launch", label: "Search Launch", icon: Zap, section: "OVERVIEW" },
    
    { id: "log-weekly", label: "Weekly Activity Log", icon: PlusCircle, section: "DATA ENTRY" },
    { id: "log-placement", label: "Log Placement", icon: UserPlus, section: "DATA ENTRY" },
    { id: "touchpoints", label: "2026 Touchpoints", icon: Users, section: "DATA ENTRY" },
    { id: "job-leads", label: "Job Leads Tracker", icon: Search, section: "DATA ENTRY" },
    { id: "job-orders", label: "Job Order Tracker", icon: Briefcase, section: "DATA ENTRY" },
    
    { id: "goals", label: "Goals", icon: Target, section: "RECORDS" },
    { id: "wir", label: "Week in Review", icon: FileText, section: "RECORDS" },
    { id: "l10-ratings", label: "L10 Weekly Ratings", icon: Star, section: "RECORDS" },
    
    { id: "backup", label: "Backup & Export", icon: Database, section: "BACKUP AND REPORT" },
    { id: "create-report", label: "Create Report", icon: FilePlus, section: "BACKUP AND REPORT" },
  ];

  const sections = ["OVERVIEW", "DATA ENTRY", "RECORDS", "RESEARCH", "BACKUP AND REPORT"];

  return (
    <aside className="w-[230px] bg-surf border-r border-navy/5 flex flex-col fixed top-0 left-0 bottom-0 z-30 overflow-y-auto custom-scrollbar">
      <div className="p-5 border-b border-navy/5 flex flex-col items-center">
        <img 
          src={import.meta.env.VITE_LOGO_URL || "https://storage.googleapis.com/static.antigravity.ai/blue-door-logo-v2.png"} 
          alt="Blue Door Executive Search Partners" 
          className="h-14 object-contain mb-3"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="text-[14px] font-bold text-[#4A7BB7] tracking-[0.05em] uppercase text-center whitespace-nowrap font-serif">Blue Door Talent</div>
      </div>

      <nav className="p-2 flex-1 mt-2">
        {sections.map(section => (
          <div key={section} className="mb-2">
            <div className="text-[11px] font-bold tracking-widest text-[#7E96B1] uppercase px-4 py-1.5 mb-1">{section}</div>
            
            {section === "RESEARCH" && (
              <div className="space-y-0.5 mb-0.5">
                <button
                  onClick={() => setIsMasterlistOpen(!isMasterlistOpen)}
                  className={cn(
                    "w-full flex items-start justify-between px-4 py-1.5 rounded-xl text-[13px] font-medium text-left transition-all",
                    activeView.startsWith('ml-') ? "bg-[#E8EDFB] text-brand-blue" : "text-brand-blue hover:bg-navy/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 shrink-0 text-tx-muted mt-0.5" />
                    Masterlist
                  </div>
                  <ChevronDown className={cn("w-3 h-3 transition-transform", isMasterlistOpen && "rotate-180")} />
                </button>
                {isMasterlistOpen && (
                  <div className="pl-8 space-y-0.5 mt-0.5">
                    {[
                      { id: "ml-residentialservices", label: "Residential Services", icon: Home },
                      { id: "ml-construction", label: "Construction", icon: HardHat },
                      { id: "ml-realestate", label: "Real Estate", icon: Map }
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={cn(
                          "w-full flex items-start gap-3 px-4 py-1.5 rounded-lg text-[13px] font-medium text-left transition-all whitespace-nowrap",
                          activeView === item.id
                            ? "text-[#2C5282] bg-[#E8EDFB]/50"
                            : "text-[#4A5568] hover:text-[#2C5282] hover:bg-navy/5"
                        )}
                      >
                        <item.icon className="w-3.5 h-3.5 shrink-0 opacity-70 mt-0.5" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
                
                <button
                  onClick={() => onViewChange("boolean")}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-1.5 rounded-xl text-[13px] font-medium text-left transition-all mt-0.5",
                    activeView === "boolean" ? "bg-[#E8EDFB] text-brand-blue" : "text-brand-blue hover:bg-navy/5"
                  )}
                >
                  <Lock className="w-4 h-4 shrink-0 text-tx-muted mt-0.5" />
                  Boolean Keywords
                </button>
              </div>
            )}

            {navItems.filter(item => item.section === section).map(item => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-1.5 rounded-xl text-[13px] font-medium text-left transition-all mb-0.5 group",
                  activeView === item.id 
                    ? "bg-[#E8EDFB] text-brand-blue" 
                    : "text-brand-blue hover:bg-navy/5"
                )}
              >
                <item.icon className={cn("w-4 h-4 shrink-0 mt-0.5", activeView === item.id ? "text-brand-blue" : "text-tx-muted")} />
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-navy/5">
        <div className="flex items-center gap-2 text-[11px] text-tx-muted">
          <div className="as-dot ok" />
          All changes saved
        </div>
      </div>
    </aside>
  );
};

const Topbar = ({ title, user }: { title: string, user: FirebaseUser }) => {
  const [search, setSearch] = useState("");

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="h-[62px] bg-surf border-b border-navy/5 flex items-center justify-between px-6 sticky top-0 z-20">
      <span className="text-lg font-serif font-bold text-navy">{title}</span>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tx-muted" />
          <input 
            type="text" 
            placeholder="Search everything..."
            value={search || ""}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-1.5 bg-navy/5 border border-navy/10 rounded-full text-[13px] outline-none focus:border-light-blue w-64 transition-all text-tx-main"
          />
        </div>
        
        <div className="h-8 w-[1px] bg-navy/10 mx-2" />
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[13px] font-bold text-navy leading-none">{user.displayName || user.email?.split('@')[0]}</p>
            <p className="text-[10px] text-brand-blue uppercase tracking-wider mt-1">Recruiter</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-tx-muted hover:text-navy transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

const AuthScreen = ({ onVerificationSent }: { onVerificationSent: (email: string) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          await sendEmailVerification(userCredential.user);
          onVerificationSent(userCredential.user.email || "");
          await signOut(auth);
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        onVerificationSent(userCredential.user.email || "");
        await signOut(auth);
      }
    } catch (err: any) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Email or password is incorrect");
      } else if (err.code === "auth/email-already-in-use") {
        setError("User already exists. Please sign in");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070" 
          alt="Modern Office Buildings" 
          className="w-full h-full object-cover opacity-30"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-transparent to-white/40" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md glass p-10 rounded-2xl shadow-xl"
      >
        <div className="text-center mb-10">
          <img 
            src="https://storage.googleapis.com/static.antigravity.ai/blue-door-logo-v2.png" 
            alt="Blue Door Executive Search Partners" 
            className="h-16 object-contain mx-auto mb-6"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <h2 className="text-3xl font-serif mb-2 text-navy">{isLogin ? "Welcome Back" : "Create an Account"}</h2>
          <p className="text-tx-muted text-xs uppercase tracking-widest whitespace-nowrap">Executive Search Partners</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-tx-muted flex items-center gap-2">
              <User className="w-3 h-3" /> Email Address
            </label>
            <input 
              type="email" 
              required
              value={email || ""}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-navy/10 py-3 focus:border-light-blue outline-none transition-colors text-tx-main" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-tx-muted flex items-center gap-2">
              <Lock className="w-3 h-3" /> Password
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password || ""}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-navy/10 py-3 pr-10 focus:border-light-blue outline-none transition-colors text-tx-main" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-tx-muted hover:text-brand-blue transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-xs text-center font-medium"
            >
              {error}
            </motion.p>
          )}

          <button 
            disabled={loading}
            className="w-full py-5 bg-brand-blue text-white font-bold uppercase tracking-[0.2em] text-xs hover:bg-light-blue transition-colors disabled:opacity-50"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] uppercase tracking-widest text-tx-muted hover:text-brand-blue transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const VerificationScreen = ({ email, onBackToLogin }: { email: string; onBackToLogin: () => void }) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070" 
          alt="Modern Office Buildings" 
          className="w-full h-full object-cover opacity-30"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-transparent to-white/40" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md glass p-10 rounded-2xl text-center"
      >
        <div className="w-12 h-16 border-2 border-brand-blue relative mx-auto mb-8">
          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-brand-blue/30" />
        </div>
        <h2 className="text-3xl font-serif mb-6 text-navy">Verify Your Email</h2>
        <p className="text-tx-sec leading-relaxed mb-10">
          We have sent you a verification email to <span className="text-brand-blue font-medium">{email}</span>. Please verify it and log in.
        </p>
        <button 
          onClick={onBackToLogin}
          className="w-full py-5 bg-brand-blue text-white font-bold uppercase tracking-[0.2em] text-xs hover:bg-light-blue transition-colors"
        >
          Login
        </button>
      </motion.div>
    </div>
  );
};

const HomeView = ({ stats, placements, goals }: { stats: any, placements: any[], goals: any }) => {
  const now = new Date();
  const weekNum = Math.max(1, Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 864e5)));
  const pace = weekNum / 52;

  const milestones = [
    { yrs: 7/365, l: '1st Week' },
    { yrs: 1/12, l: '1st Month' },
    { yrs: 3/12, l: '3rd Month' },
    { yrs: 1, l: '1 Year' },
    { yrs: 2, l: '2 Years' },
    { yrs: 3, l: '3 Years' },
    { yrs: 4, l: '4 Years' },
    { yrs: 5, l: '5 Years' }
  ];

  const upcoming = useMemo(() => {
    const list: any[] = [];
    placements.forEach(p => {
      milestones.forEach(ms => {
        if (!p.start) return;
        const d = new Date(p.start + 'T00:00:00');
        d.setDate(d.getDate() + Math.round(ms.yrs * 365));
        const diff = Math.ceil((d.getTime() - now.getTime()) / 864e5);
        if (diff >= -1 && diff <= 14) {
          list.push({ name: p.name, l: ms.l, date: d, diff });
        }
      });
    });
    return list.sort((a, b) => a.diff - b.diff);
  }, [placements]);

  const kpis = [
    { l: 'Meetings', a: stats.meetings, g: goals.meetings },
    { l: 'Placements', a: stats.place, g: goals.place },
    { l: 'Job Orders', a: stats.orders, g: goals.orders },
    { l: 'Revenue', a: stats.revenue, g: goals.revenue, money: true },
    { l: 'Touchpoints', a: stats.touch, g: goals.touch },
    { l: 'Job Leads', a: stats.leads, g: goals.leads },
  ];

  const hr = now.getHours();
  const greeting = hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif font-bold text-navy">Good {greeting}! 👋</h2>
        <p className="text-sm text-tx-sec mt-1">
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · Week {weekNum} of 52 ({Math.round(pace * 100)}% elapsed)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(k => {
          const p = pct(k.a, k.g);
          const diff = k.a - k.g * pace;
          const ok = diff >= -0.5;
          const fv = (v: number) => k.money ? `$${Math.round(v).toLocaleString()}` : Math.round(v).toLocaleString();
          
          return (
            <div key={k.l} className="bg-surf border border-navy/10 rounded-xl p-5 border-l-4" style={{ borderLeftColor: ok ? '#10B981' : '#EF4444' }}>
              <div className="text-[12px] font-bold text-brand-blue mb-2 uppercase tracking-wider">{k.l}</div>
              <div className="text-2xl font-bold text-navy mb-1">
                {fv(k.a)}
                <span className="text-xs text-tx-muted font-normal ml-1">/ {fv(k.g)}</span>
              </div>
              <div className={cn("text-[11px] font-bold", ok ? "text-green-600" : "text-red-600")}>
                {Math.abs(diff) < 1 ? 'On pace' : `${fv(Math.abs(diff))} ${ok ? 'ahead' : 'behind'} pace`}
              </div>
              <div className="mt-3 h-1.5 w-full bg-navy/5 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-500", ok ? "bg-green-500" : "bg-red-500")}
                  style={{ width: `${Math.min(p, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="text-[13px] font-bold text-brand-blue uppercase tracking-widest mb-4 font-serif">Upcoming Milestones (Next 14 Days)</div>
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {upcoming.map((ms, i) => {
              const isPast = ms.diff < 0;
              const isToday = ms.diff === 0;
              return (
                <div 
                  key={i} 
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    isPast ? "bg-red-500/10 border-red-500/20" : isToday ? "bg-brand-blue/10 border-brand-blue/20" : "bg-navy/5 border-navy/10"
                  )}
                >
                  <div className="text-[13px] font-bold text-navy">{ms.name}</div>
                  <div className="text-[11px] text-tx-sec mt-0.5">{ms.l}</div>
                  <div className={cn(
                    "text-[11px] font-bold mt-2",
                    isPast ? "text-red-500" : isToday ? "text-brand-blue" : "text-brand-blue/60"
                  )}>
                    {isPast ? "Past due" : isToday ? "Today" : `${ms.diff} days`}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surf border border-navy/10 rounded-xl p-8 text-center text-tx-muted text-sm">
            No milestones in the next 14 days.
          </div>
        )}
      </div>

      <div>
        <div className="text-[13px] font-bold text-brand-blue uppercase tracking-widest mb-4 font-serif">Recent Placements</div>
        <div className="bg-surf border border-navy/10 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm bdt-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Client</th>
                <th>Start</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {placements.slice(0, 5).map(p => (
                <tr key={p.id} className="hover:bg-navy/5 transition-colors">
                  <td className="font-bold text-navy">{p.name}</td>
                  <td className="text-[12px] text-tx-sec">{p.position || '—'}</td>
                  <td className="text-[12px] text-tx-sec">{p.client || '—'}</td>
                  <td className="text-[12px] text-tx-sec">{fmtLong(p.start)}</td>
                  <td>
                    <span className={cn("badge", p.status === 'Active' ? "bg-brand-blue/10 text-brand-blue border-brand-blue/20" : "bg-navy/5 text-tx-muted border-navy/10")}>
                      {p.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const L10MeetingView = ({ 
  rocks, setRocks, 
  headlines, setHeadlines, 
  ptItems, setPTItems, 
  bdItems, setBDItems,
  l10Ratings, setL10Ratings,
  issues, setIssues,
  wirEntries, setWirEntries,
  onViewChange
}: { 
  rocks: any[], setRocks: any, 
  headlines: any[], setHeadlines: any, 
  ptItems: any[], setPTItems: any, 
  bdItems: any[], setBDItems: any,
  l10Ratings: any[], setL10Ratings: any,
  issues: any[], setIssues: any,
  wirEntries: any[], setWirEntries: any,
  onViewChange: (view: string) => void
}) => {
  const [date, setDate] = useState(todayStr());
  const [l10Chk, setL10Chk] = useState<Record<string, boolean>>({});
  const [newRock, setNewRock] = useState("");
  const [newHl, setNewHl] = useState("");
  const [hlType, setHlType] = useState<"Positive" | "Negative">("Positive");
  
  const [newIssue, setNewIssue] = useState({ client: "", position: "", priority: "Medium" });
  const [newBD, setNewBD] = useState({ client: "", position: "", stage: "Potential Searches" });
  
  const sections = [
    { id: 'segue', title: 'Segue — Personal & Professional Bests', time: '5 min', desc: 'Go around the room — share one personal and one professional best before diving into the agenda.' },
    { id: 'sc', title: 'Scorecard Review', time: '5 min', desc: 'Review the weekly scorecard metrics.' },
    { id: 'rocks', title: 'Q1 Rock Review — On Track / Off Track', time: '5 min' },
    { id: 'hl', title: 'Customer / Team Headlines — Good & Bad Reports', time: '5 min' },
    { id: 'issues', title: 'Issues List — All Searches, Review Plan for Week', time: '60 min' },
    { id: 'pt', title: 'Placement Tracker — Current Month', time: '' },
    { id: 'bd', title: 'Business Development', time: '' },
  ];

  const totalScore = useMemo(() => {
    const checked = Object.values(l10Chk).filter(Boolean).length;
    return Math.round((checked / sections.length) * 10 * 10) / 10;
  }, [l10Chk]);

  const handleSave = () => {
    const monday = getMonday(date);
    const existing = l10Ratings.findIndex(r => r.date === monday);
    const newRatings = [...l10Ratings];
    if (existing >= 0) newRatings[existing].score = totalScore;
    else newRatings.push({ date: monday, score: totalScore });
    setL10Ratings(newRatings);
    setL10Chk({}); // Reset score to zero
    toast.success("L10 Meeting Saved!");
  };

  const addHeadline = () => {
    if (!newHl) return;
    const hl = { id: Date.now(), type: hlType, text: newHl };
    setHeadlines([hl, ...headlines]);
    
    // Add to Week in Review
    const wir = {
      id: Date.now() + 1,
      date: getMonday(todayStr()),
      type: hlType === 'Positive' ? 'Success' : 'Challenge',
      content: newHl
    };
    setWirEntries([wir, ...wirEntries]);
    setNewHl("");
  };

  const addIssue = () => {
    if (!newIssue.client || !newIssue.position) return;
    setIssues([...issues, { id: Date.now(), ...newIssue, discussed: false }]);
    setNewIssue({ client: "", position: "", priority: "Medium" });
  };

  const addBD = () => {
    if (!newBD.client || !newBD.position) return;
    setBDItems([...bdItems, { id: Date.now(), ...newBD }]);
    setNewBD({ client: "", position: "", stage: "Potential Searches" });
  };

  const removeHeadline = (id: number) => {
    setHeadlines(headlines.filter(h => h.id !== id));
  };

  const fmtTableDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + 'T00:00:00'); // Ensure local time
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const saveRockNote = (index: number) => {
    const rock = rocks[index];
    if (!rock.note) return;

    const newRocks = [...rocks];
    const newNote = { id: Date.now(), text: rock.note };
    newRocks[index].notes = [newNote, ...(newRocks[index].notes || [])];
    newRocks[index].note = ""; // Clear the input
    setRocks(newRocks);
  };

  const removeRockNote = (rockIndex: number, noteId: number) => {
    const newRocks = [...rocks];
    newRocks[rockIndex].notes = newRocks[rockIndex].notes.filter((n: any) => n.id !== noteId);
    setRocks(newRocks);
  };

  return (
    <div className="space-y-4">
      <div className="bg-surf border border-navy/10 rounded-xl p-6 flex items-center justify-between shadow-lg text-navy">
        <div className="flex-1 text-center">
          <h2 className="text-2xl font-serif font-bold text-brand-blue">L10 Meeting</h2>
          <p className="text-tx-sec text-sm mt-1">{fmtLong(date)}</p>
          <div className="font-mono text-sm mt-2 opacity-80">
            {new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })} EST
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full border-4 border-brand-blue/20 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold leading-none text-brand-blue">{totalScore.toFixed(1)}</span>
            <span className="text-[10px] opacity-50">/ 10</span>
          </div>
          <button 
            onClick={handleSave}
            className="bg-brand-blue text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-light-blue transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map(sec => (
          <div key={sec.id} className="bg-surf border border-navy/10 rounded-xl overflow-hidden">
            <div className="flex items-center gap-4 p-4 bg-navy/5 border-b border-navy/5">
              <div 
                onClick={() => setL10Chk(prev => ({ ...prev, [sec.id]: !prev[sec.id] }))}
                className={cn("l10-chk", l10Chk[sec.id] && "on")} 
              />
              <span className="flex-1 font-bold text-navy text-sm">{sec.title}</span>
              {sec.id === 'issues' && (
                <a 
                  href="https://app.loxo.co/agencies/16930/jobs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 bg-brand-blue text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-light-blue transition-colors shadow-sm"
                >
                  <ExternalLink size={12} />
                  Go to Loxo
                </a>
              )}
              {sec.time && <span className="text-[11px] text-tx-muted font-mono">{sec.time}</span>}
            </div>
            <div className="p-4">
              {sec.id === 'segue' && <p className="text-sm text-tx-sec leading-relaxed">{sec.desc}</p>}
              
              {sec.id === 'sc' && (
                <div className="space-y-4">
                  <p className="text-sm text-tx-sec">{sec.desc}</p>
                  <button 
                    onClick={() => onViewChange('scorecard')}
                    className="flex items-center gap-3 p-4 bg-navy/5 border border-navy/10 rounded-xl hover:bg-navy/10 transition-all group"
                  >
                    <BarChart3 className="w-5 h-5 text-brand-blue" />
                    <span className="text-sm font-bold text-navy">Go to Scorecard View</span>
                    <ArrowRight className="w-4 h-4 text-tx-muted group-hover:translate-x-1 transition-transform ml-auto" />
                  </button>
                </div>
              )}

              {sec.id === 'rocks' && (
                <div className="space-y-3">
                  {rocks.map((rock, i) => (
                    <div key={rock.id} className="rock-block bg-navy/5 border-navy/5 p-4 rounded-lg">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="bg-navy/10 text-brand-blue text-[10px] font-bold px-2 py-1 rounded">Rock {i+1}</span>
                        <input 
                          type="text"
                          value={rock.desc || ""}
                          onChange={(e) => {
                            const newRocks = [...rocks];
                            newRocks[i].desc = e.target.value;
                            setRocks(newRocks);
                          }}
                          className="flex-1 text-sm font-bold text-navy bg-transparent border-b border-transparent focus:border-brand-blue outline-none"
                        />
                        <select 
                          value={rock.status || "On-track"}
                          onChange={(e) => {
                            const newRocks = [...rocks];
                            newRocks[i].status = e.target.value;
                            setRocks(newRocks);
                          }}
                          className={cn(
                            "text-[11px] font-bold px-2 py-1 rounded border outline-none cursor-pointer bg-transparent",
                            rock.status === 'On-track' ? "text-green-600 border-green-600/30" : 
                            rock.status === 'Done' ? "text-slate-500 border-slate-500/30" : 
                            "text-red-600 border-red-600/30"
                          )}
                        >
                          <option className="bg-surf">On-track</option>
                          <option className="bg-surf">Off-track</option>
                          <option className="bg-surf">Done</option>
                        </select>
                      </div>
                      <div className="space-y-2 mb-3">
                        {(rock.notes || []).map((n: any) => (
                          <div key={n.id} className="flex items-center gap-2 bg-white/30 p-2 rounded text-[11px] text-tx-sec group/note">
                            <span className="flex-1">{n.text}</span>
                            <button 
                              onClick={() => removeRockNote(i, n.id)}
                              className="opacity-0 group-hover/note:opacity-100 text-slate-400 hover:text-slate-600 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <textarea 
                          placeholder="Add a note..."
                          value={rock.note || ""}
                          onChange={(e) => {
                            const newRocks = [...rocks];
                            newRocks[i].note = e.target.value;
                            setRocks(newRocks);
                          }}
                          className="flex-1 bg-white/50 border border-navy/5 rounded p-2 text-xs text-tx-sec outline-none focus:border-brand-blue resize-none"
                          rows={2}
                        />
                        <button 
                          onClick={() => saveRockNote(i)}
                          className="bg-brand-blue text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-4">
                    <input 
                      type="text" 
                      placeholder="New rock description..."
                      value={newRock || ""}
                      onChange={(e) => setNewRock(e.target.value)}
                      className="flex-1 px-3 py-2 bg-navy/5 border border-navy/10 rounded-lg text-sm outline-none focus:border-light-blue text-navy"
                    />
                    <button 
                      onClick={() => {
                        if (!newRock) return;
                        setRocks([...rocks, { id: Date.now(), desc: newRock, status: 'On-track', note: "", notes: [] }]);
                        setNewRock("");
                      }}
                      className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-light-blue transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              )}

              {sec.id === 'hl' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {headlines.map(hl => (
                      <div key={hl.id} className="flex items-center gap-3 py-2 border-b border-navy/5 last:border-0 group">
                        <div className={cn("w-2 h-2 rounded-full", hl.type === 'Positive' ? "bg-green-500" : "bg-red-500")} />
                        <span className="flex-1 text-sm text-tx-sec">{hl.text}</span>
                        <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded", hl.type === 'Positive' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600")}>{hl.type}</span>
                        <button 
                          onClick={() => removeHeadline(hl.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 p-4 bg-navy/5 rounded-xl border border-navy/5">
                    <select 
                      value={hlType || "Positive"}
                      onChange={(e) => setHlType(e.target.value as any)}
                      className="px-3 py-2 bg-surf border border-navy/10 rounded-lg text-sm outline-none text-navy"
                    >
                      <option value="Positive">Positive</option>
                      <option value="Negative">Negative</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="Enter headline report..."
                      value={newHl || ""}
                      onChange={(e) => setNewHl(e.target.value)}
                      className="flex-1 px-3 py-2 bg-surf border border-navy/10 rounded-lg text-sm outline-none focus:border-brand-blue text-navy"
                    />
                    <button 
                      onClick={addHeadline}
                      className="bg-brand-blue text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-light-blue transition-colors"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}

              {sec.id === 'issues' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm bdt-table">
                      <thead className="bg-navy/5">
                        <tr>
                          <th className="p-3 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Client</th>
                          <th className="p-3 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Position</th>
                          <th className="p-3 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Priority</th>
                          <th className="p-3 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Discussed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy/5">
                        {issues.map(issue => (
                          <tr key={issue.id} className="hover:bg-navy/5 transition-colors">
                            <td className="p-3 font-serif font-bold text-navy">{issue.client}</td>
                            <td className="p-3 text-tx-sec">{issue.position}</td>
                            <td className="p-3">
                              <select 
                                value={issue.priority || "Medium"}
                                onChange={(e) => {
                                  const newIssues = issues.map(i => i.id === issue.id ? { ...i, priority: e.target.value } : i);
                                  setIssues(newIssues);
                                }}
                                className={cn(
                                  "text-[11px] font-bold px-2 py-1 rounded border outline-none cursor-pointer bg-transparent",
                                  issue.priority === 'High' ? "text-red-600 border-red-600/30" : 
                                  issue.priority === 'Medium' ? "text-amber-600 border-amber-600/30" : 
                                  issue.priority === 'Low' ? "text-blue-400 border-blue-400/30" : 
                                  "text-green-600 border-green-600/30"
                                )}
                              >
                                <option className="bg-surf">High</option>
                                <option className="bg-surf">Medium</option>
                                <option className="bg-surf">Low</option>
                                <option className="bg-surf">No Action Needed</option>
                              </select>
                            </td>
                            <td className="p-3">
                              <button 
                                onClick={() => {
                                  const newIssues = issues.map(i => i.id === issue.id ? { ...i, discussed: !i.discussed } : i);
                                  setIssues(newIssues);
                                }}
                                className={cn(
                                  "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded border transition-all",
                                  issue.discussed ? "bg-blue-500/10 text-blue-600 border-blue-600/20" : "bg-slate-500/10 text-slate-600 border-slate-600/20"
                                )}
                              >
                                {issue.discussed ? "Discussed" : "Not Discussed"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-4 bg-navy/5 rounded-xl border border-navy/5">
                    <input 
                      type="text" 
                      placeholder="Client..."
                      value={newIssue.client || ""}
                      onChange={(e) => setNewIssue({ ...newIssue, client: e.target.value })}
                      className="px-3 py-2 bg-surf border border-navy/10 rounded-lg text-sm outline-none text-navy"
                    />
                    <input 
                      type="text" 
                      placeholder="Position..."
                      value={newIssue.position || ""}
                      onChange={(e) => setNewIssue({ ...newIssue, position: e.target.value })}
                      className="px-3 py-2 bg-surf border border-navy/10 rounded-lg text-sm outline-none text-navy"
                    />
                    <select 
                      value={newIssue.priority || "Medium"}
                      onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value })}
                      className="px-3 py-2 bg-surf border border-navy/10 rounded-lg text-sm outline-none text-navy"
                    >
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                      <option>No Action Needed</option>
                    </select>
                    <button 
                      onClick={addIssue}
                      className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-light-blue transition-colors"
                    >
                      + Add Issue
                    </button>
                  </div>
                </div>
              )}

              {sec.id === 'pt' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm bdt-table">
                    <thead className="bg-navy/5">
                      <tr>
                        <th className="p-3 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Name</th>
                        <th className="p-3 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Client</th>
                        <th className="p-3 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Tenure</th>
                        <th className="p-3 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Date</th>
                        <th className="p-3 text-[10px] font-bold text-brand-blue uppercase tracking-widest border-b border-navy/5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy/5">
                      {ptItems.map(item => (
                        <tr key={item.id} className="hover:bg-navy/5 transition-colors">
                          <td className="p-3 font-serif font-bold text-navy">{item.name}</td>
                          <td className="p-3 text-tx-sec">{item.client}</td>
                          <td className="p-3">
                            <select 
                              value={item.tenure || "1st Day"}
                              onChange={(e) => {
                                const newItems = ptItems.map(p => p.id === item.id ? { ...p, tenure: e.target.value } : p);
                                setPTItems(newItems);
                              }}
                              className="text-[12px] border border-navy/10 rounded px-2 py-1 outline-none bg-navy/5 text-navy"
                            >
                              {['1st Day','1st Week','1st Month','3rd Month','1 Year','2 Years','3 Years','4 Years','5 Years'].map(t => <option key={t} className="bg-surf">{t}</option>)}
                            </select>
                          </td>
                          <td className="p-3 text-tx-muted font-mono text-[11px]">{fmtTableDate(item.date)}</td>
                          <td className="p-3">
                            <select 
                              value={item.status || "Not Contacted"}
                              onChange={(e) => {
                                const newItems = ptItems.map(p => p.id === item.id ? { ...p, status: e.target.value } : p);
                                setPTItems(newItems);
                              }}
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border outline-none cursor-pointer bg-transparent",
                                item.status === 'Contacted' ? "text-blue-600 border-blue-600/30" : "text-navy border-navy/30"
                              )}
                            >
                              <option className="bg-surf">Contacted</option>
                              <option className="bg-surf">Not Contacted</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {sec.id === 'bd' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Potential Searches', 'Potential Openings', 'Indeed Postings'].map(stage => (
                      <div 
                        key={stage} 
                        className="bg-navy/5 border border-navy/10 rounded-xl overflow-hidden"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          const id = parseInt(e.dataTransfer.getData("id"));
                          const newItems = bdItems.map(i => i.id === id ? { ...i, stage } : i);
                          setBDItems(newItems);
                        }}
                      >
                        <div className="bg-navy/5 text-brand-blue text-[11px] font-bold uppercase tracking-widest px-3 py-2 border-b border-navy/5">{stage}</div>
                        <div className="p-2 space-y-2 min-h-[100px]">
                          {bdItems.filter(i => i.stage === stage).map(item => (
                            <div 
                              key={item.id} 
                              draggable
                              onDragStart={(e) => e.dataTransfer.setData("id", item.id.toString())}
                              className="bg-surf border border-navy/5 p-3 rounded-lg shadow-sm cursor-move hover:border-brand-blue/30 transition-all"
                            >
                              <div className="font-serif font-bold text-navy text-[13px]">{item.client}</div>
                              <div className="text-[11px] text-tx-muted mt-1">{item.position}</div>
                            </div>
                          ))}
                          <div className="border-2 border-dashed border-navy/10 rounded-lg p-3 text-center text-[10px] text-tx-muted font-bold uppercase tracking-widest">
                            Drop here
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-4 bg-navy/5 rounded-xl border border-navy/5">
                    <input 
                      type="text" 
                      placeholder="Client..."
                      value={newBD.client || ""}
                      onChange={(e) => setNewBD({ ...newBD, client: e.target.value })}
                      className="px-3 py-2 bg-surf border border-navy/10 rounded-lg text-sm outline-none text-navy"
                    />
                    <input 
                      type="text" 
                      placeholder="Position..."
                      value={newBD.position || ""}
                      onChange={(e) => setNewBD({ ...newBD, position: e.target.value })}
                      className="px-3 py-2 bg-surf border border-navy/10 rounded-lg text-sm outline-none text-navy"
                    />
                    <select 
                      value={newBD.stage || "Potential Searches"}
                      onChange={(e) => setNewBD({ ...newBD, stage: e.target.value })}
                      className="px-3 py-2 bg-surf border border-navy/10 rounded-lg text-sm outline-none text-navy"
                    >
                      <option>Potential Searches</option>
                      <option>Potential Openings</option>
                      <option>Indeed Postings</option>
                    </select>
                    <button 
                      onClick={addBD}
                      className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-light-blue transition-colors"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
const Dashboard = ({ user }: { user: FirebaseUser }) => {
  const [activeView, setActiveView] = useState("dashboard");
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);
  
  // State for all data
  const [goals, setGoals] = useState(GOALS);
  const [weeks, setWeeks] = useState(SEED_WEEKS);
  const [placements, setPlacements] = useState(SEED_PLACEMENTS);
  const [jobOrders, setJobOrders] = useState(SEED_JO);
  const [touchpoints, setTouchpoints] = useState(SEED_TP);
  const [jobLeads, setJobLeads] = useState(SEED_JL);
  const [wirEntries, setWirEntries] = useState(SEED_WIR);
  const [l10Ratings, setL10Ratings] = useState(SEED_L10);
  const [generalContractors, setGeneralContractors] = useState<any[]>([]);
  const [specialtyContractors, setSpecialtyContractors] = useState<any[]>([]);
  const [residentialServices, setResidentialServices] = useState<any[]>([]);
  const [realEstateCompanies, setRealEstateCompanies] = useState<any[]>([]);
  const [issues, setIssues] = useState([
    { id: 1, client: "TechCorp", position: "Senior Dev", priority: "High", discussed: false },
    { id: 2, client: "InnoSoft", position: "Product Manager", priority: "Medium", discussed: true }
  ]);
  
  // L10 Meeting specific state
  const [rocks, setRocks] = useState([
    { id: 1, desc: "Implement new CRM automation", status: "On-track", note: "", notes: [] },
    { id: 2, desc: "Hit $250k in Q1 Revenue", status: "Off-track", note: "", notes: [] },
    { id: 3, desc: "Hire Associate Recruiter", status: "Done", note: "", notes: [] }
  ]);
  const [headlines, setHeadlines] = useState([
    { id: 1, type: "Positive", text: "New client signed: TechCorp" },
    { id: 2, type: "Negative", text: "Candidate withdrew from Senior Dev role" }
  ]);
  const [ptItems, setPTItems] = useState([
    { id: 1, name: "John Doe", client: "TechCorp", tenure: "1st Week", date: "2026-03-25", status: "Contacted" },
    { id: 2, name: "Jane Smith", client: "InnoSoft", tenure: "1st Month", date: "2026-03-20", status: "Pending" }
  ]);
  const [bdItems, setBDItems] = useState([
    { id: 1, client: "Acme Corp", position: "Product Manager", stage: "Potential Searches" },
    { id: 2, client: "Global Inc", position: "Sales Director", stage: "Potential Openings" }
  ]);
  const [booleanEntries, setBooleanEntries] = useState<BooleanEntry[]>(MOCK_BOOLEAN_ENTRIES);
  const [searchLaunches, setSearchLaunches] = useState<any[]>([
    {
      id: "1",
      company: "TechFlow Systems",
      jobTitle: "VP of Engineering",
      category: "Construction",
      status: 'Active',
      createdAt: new Date().toISOString(),
      admin: {
        internalMeeting: true,
        clientUpdateCalls: true,
        jobScorecard: true,
        loxoAdded: true,
        liProject: true,
        phoneScript: false,
        evalCriteria: false,
        outreachMessages: false,
        jobDescription: true,
      },
      research: {
        personas: { booleanTitle: "VP Engineering, CTO (VP AND Engineering)", geography: "Remote", companies: ["Google", "Meta", "Amazon"], keywords: "SaaS, Cloud", yearsExp: "15+" },
        bdtList: { booleanTitle: "", geography: "", companies: Array(10).fill(""), keywords: "", yearsExp: "" },
        industryFilter: { booleanTitle: "", geography: "", keywords: "", yearsExp: "", industry: "", companySize: "" },
        keywordsFocus: { booleanTitle: "", geography: "", keywords: "", yearsExp: "", industry: "", companySize: "" },
        loxoPrior: ["Search 2023", "CTO Search", ""],
        indeedPosting: true,
        indeedQuery: false,
        liConnections: Array(10).fill(""),
      },
      enrichment: {
        apollo: true,
        loxoTagging: true,
        updateEmails: false,
        reviewPipeline: false,
      },
      outreach: {
        day1Text: true,
        day1LI: true,
        day2InMail: false,
        day4Email1: false,
        day8Email2: false,
        dayExtra: false,
      },
      scorecard: {}
    }
  ]);

  const stats = useMemo(() => {
    const totals = { meetings: 0, subs: 0, int1: 0, int2: 0, posts: 0, followers: 0 };
    weeks.forEach(w => {
      totals.meetings += (w.meetings || 0);
      totals.subs += (w.subs || 0);
      totals.int1 += (w.int1 || 0);
      totals.int2 += (w.int2 || 0);
      totals.posts += (w.posts || 0);
    });
    
    // Calculate total follower growth
    if (weeks.length > 1) {
      const sorted = [...weeks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      totals.followers = (sorted[sorted.length - 1].followers || 0) - (sorted[0].followers || 0);
    } else {
      totals.followers = 0;
    }

    const curYear = new Date().getFullYear().toString();
    const placementsThisYear = placements.filter(p => p.start?.startsWith(curYear));
    const revenue = placements.reduce((acc, p) => acc + (p.revenue || 0), 0);
    
    const t1 = placementsThisYear.filter(p => p.tier === "Tier 1").length;
    const t2 = placementsThisYear.filter(p => p.tier === "Tier 2").length;
    const t3 = placementsThisYear.filter(p => p.tier === "Tier 3").length;

    return {
      ...totals,
      orders: jobOrders.length,
      touch: touchpoints.length,
      leads: jobLeads.length,
      place: placementsThisYear.length,
      t1, t2, t3,
      revenue: revenue
    };
  }, [weeks, placements, jobOrders, touchpoints, jobLeads]);

  const viewTitles: Record<string, string> = {
    dashboard: "Dashboard",
    l10: "L10 Meeting",
    scorecard: "Scorecard",
    "search-launch": "Search Launch",
    "log-weekly": "Weekly Activity Log",
    "log-placement": "Log Placement",
    touchpoints: "2026 Touchpoints",
    "job-leads": "Job Leads Tracker",
    "job-orders": "Job Order Tracker",
    goals: "Goals",
    wir: "Week in Review",
    "l10-ratings": "L10 Weekly Ratings",
    boolean: "Boolean Keywords",
    backup: "Backup & Export",
    "create-report": "System Report",
    "ml-residentialservices": "Residential Services Masterlist",
    "ml-construction": "Construction Masterlist",
    "ml-realestate": "Real Estate Masterlist"
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <HomeView stats={stats} placements={placements} goals={goals} />;
      case 'l10': return <L10MeetingView 
        rocks={rocks} setRocks={setRocks}
        headlines={headlines} setHeadlines={setHeadlines}
        ptItems={ptItems} setPTItems={setPTItems}
        bdItems={bdItems} setBDItems={setBDItems}
        l10Ratings={l10Ratings} setL10Ratings={setL10Ratings}
        issues={issues} setIssues={setIssues}
        wirEntries={wirEntries} setWirEntries={setWirEntries}
        onViewChange={setActiveView}
      />;
      case 'scorecard': return <ScorecardView 
        weeks={weeks} 
        stats={stats} 
        placements={placements} 
        setPlacements={setPlacements} 
        goals={goals}
        jobOrders={jobOrders}
        touchpoints={touchpoints}
        jobLeads={jobLeads}
      />;
      case 'search-launch': return (
        <SearchLaunchView 
          launches={searchLaunches} 
          setLaunches={setSearchLaunches} 
          setBooleanEntries={setBooleanEntries}
          setJobOrders={setJobOrders}
        />
      );
      case 'log-weekly': return <WeeklyLogView weeks={weeks} setWeeks={setWeeks} />;
      case 'log-placement': return <LogPlacementView placements={placements} setPlacements={setPlacements} />;
      case 'touchpoints': return <TouchpointsView touchpoints={touchpoints} setTouchpoints={setTouchpoints} goals={goals} />;
      case 'job-leads': return <JobLeadsView jobLeads={jobLeads} setJobLeads={setJobLeads} goals={goals} />;
      case 'job-orders': return <JobOrdersView jobOrders={jobOrders} setJobOrders={setJobOrders} goals={goals} />;
      case 'goals': return <GoalsView goals={goals} setGoals={setGoals} />;
      case 'wir': return <WIRView wirEntries={wirEntries} setWirEntries={setWirEntries} />;
      case 'l10-ratings': return <L10RatingsView l10Ratings={l10Ratings} setL10Ratings={setL10Ratings} />;
      case 'create-report': return <ReportView 
        weeks={weeks} 
        placements={placements} 
        jobOrders={jobOrders} 
        touchpoints={touchpoints} 
        jobLeads={jobLeads}
        goals={goals}
        headlines={headlines}
      />;
      case 'boolean': return <BooleanView entries={booleanEntries} setEntries={setBooleanEntries} />;
      case 'backup': return <BackupView 
        weeks={weeks}
        placements={placements}
        jobOrders={jobOrders}
        touchpoints={touchpoints}
        jobLeads={jobLeads}
        wirEntries={wirEntries}
        l10Ratings={l10Ratings}
        residentialServices={residentialServices}
        generalContractors={generalContractors}
        specialtyContractors={specialtyContractors}
        realEstateCompanies={realEstateCompanies}
        goals={goals}
        issues={issues}
        rocks={rocks}
        headlines={headlines}
        ptItems={ptItems}
        bdItems={bdItems}
      />;
      case 'ml-residentialservices': return (
        <ResidentialMasterlistView 
          data={residentialServices} 
          onUpdate={setResidentialServices} 
          onViewChange={setActiveView}
        />
      );
      case 'ml-construction': return (
        <ConstructionMasterlistView 
          generalContractors={generalContractors} 
          specialtyContractors={specialtyContractors}
          onUpdateGeneral={setGeneralContractors}
          onUpdateSpecialty={setSpecialtyContractors}
          onViewChange={setActiveView}
        />
      );
      case 'ml-realestate': return (
        <RealEstateMasterlistView 
          data={realEstateCompanies} 
          onUpdate={setRealEstateCompanies} 
          onViewChange={setActiveView}
        />
      );
      default: return <HomeView stats={stats} placements={placements} goals={goals} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-app-bg">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      <main className="flex-1 ml-[230px] flex flex-col min-h-screen">
        <Topbar title={viewTitles[activeView] || "Portal"} user={user} />
        
        <div className="p-6 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};



export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (currentUser.emailVerified) {
          setUser(currentUser);
          setVerificationEmail(null);
        } else {
          setVerificationEmail(currentUser.email);
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="w-12 h-16 border-2 border-brand-blue/20 relative animate-pulse">
          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-brand-blue/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen selection:bg-brand-blue selection:text-white">
      <Toaster position="top-right" richColors />
      <AnimatePresence mode="wait">
        {user ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Dashboard user={user} />
          </motion.div>
        ) : verificationEmail ? (
          <motion.div
            key="verification"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <VerificationScreen 
              email={verificationEmail} 
              onBackToLogin={() => setVerificationEmail(null)} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AuthScreen onVerificationSent={(email) => setVerificationEmail(email)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
