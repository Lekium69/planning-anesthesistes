import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Users, RefreshCw, Download, Play, TrendingUp, ArrowLeftRight, 
  X, Check, LogIn, LogOut, Bell, Send, User, Moon, Building2, 
  Stethoscope, Star, FileSpreadsheet, Printer, Settings, Home,
  CalendarOff, MessageSquare, Shield, ChevronLeft, ChevronRight,
  Copy, ExternalLink, Clock, AlertCircle, Plus, Trash2
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// ⚠️ REMPLACE CES VALEURS PAR LES TIENNES
const SUPABASE_URL = 'https://vqlieplrtrvqcvllhmob.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxbGllcGxydHJ2cWN2bGxobW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMDA4MzMsImV4cCI6MjA4MDg3NjgzM30.BcK8sDePzCwSC3BMSRLagdZUQhevdRIrNshLsP1MgW8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// THÈME
// ============================================
const theme = {
  primary: '#1e3a5f',
  primaryLight: '#2d4a6f',
  primaryDark: '#0f2744',
  accent: '#3b82f6',
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  gray: {
    50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db',
    400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151',
    800: '#1f2937', 900: '#111827',
  }
};

// ============================================
// HELPERS
// ============================================
const formatDateKey = (date) => {
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

const getShiftLabel = (shift) => {
  const labels = {
    astreinte: 'Astreinte',
    astreinte_we: 'Astreinte WE',
    astreinte_ferie: 'Astreinte férié',
    bloc: 'Bloc',
    consultation: 'Consultation'
  };
  return labels[shift] || shift;
};

const ShiftIcon = ({ shift, className = "w-4 h-4" }) => {
  if (shift?.includes('astreinte')) return <Moon className={className} />;
  if (shift === 'bloc') return <Building2 className={className} />;
  if (shift === 'consultation') return <Stethoscope className={className} />;
  return <Calendar className={className} />;
};

// ============================================
// COMPOSANT LOGIN
// ============================================
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Compte créé ! Vous pouvez maintenant vous connecter.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)` }}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: theme.primary }}>
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: theme.gray[800] }}>Planning Anesthésistes</h1>
          <p className="text-gray-500 mt-2">{isSignUp ? 'Créer un compte' : 'Connectez-vous'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" required minLength={6}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}
          {message && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-xl text-sm">{message}</div>}
          <button type="submit" disabled={loading} className="w-full text-white py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: theme.primary }}>
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><LogIn className="w-5 h-5" />{isSignUp ? "S'inscrire" : 'Se connecter'}</>}
          </button>
        </form>
        <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="w-full mt-4 text-sm hover:underline" style={{ color: theme.primary }}>
          {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
        </button>
      </div>
    </div>
  );
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
const AnesthesistScheduler = () => {
  // Auth
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data
  const [anesthesists, setAnesthesists] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [holidays, setHolidays] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [swapRequests, setSwapRequests] = useState([]);
  const [exchangeBoard, setExchangeBoard] = useState([]);
  const [unavailabilities, setUnavailabilities] = useState([]);
  const [emailPreferences, setEmailPreferences] = useState({});

  // UI
  const [currentView, setCurrentView] = useState('dashboard');
  const [viewMode, setViewMode] = useState('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedFilters, setSelectedFilters] = useState(new Set());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const unreadCount = notifications.filter(n => !n.read).length;

  // ============================================
  // AUTH
  // ============================================
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ============================================
  // DATA LOADING
  // ============================================
  const loadData = useCallback(async () => {
    if (!user) return;
    
    const [anesth, sched, hol, notif, swaps, exchange, unavail] = await Promise.all([
      supabase.from('anesthesists').select('*').order('id'),
      supabase.from('schedule').select('*'),
      supabase.from('holidays').select('*'),
      supabase.from('notifications').select('*, swap_request:swap_requests(*)').order('created_at', { ascending: false }),
      supabase.from('swap_requests').select('*'),
      supabase.from('exchange_board').select('*').order('created_at', { ascending: false }),
      supabase.from('unavailabilities').select('*'),
    ]);

    if (anesth.data) {
      setAnesthesists(anesth.data);
      const profile = anesth.data.find(a => a.email === user.email);
      if (profile) {
        setCurrentUser(profile);
        if (!profile.user_id) {
          await supabase.from('anesthesists').update({ user_id: user.id }).eq('id', profile.id);
        }
        const { data: prefs } = await supabase.from('email_preferences').select('*').eq('anesthesist_id', profile.id).single();
        if (prefs) setEmailPreferences(prefs);
      }
      if (selectedFilters.size === 0) setSelectedFilters(new Set(anesth.data.map(a => a.id)));
    }

    if (sched.data) {
      const scheduleMap = {};
      sched.data.forEach(item => {
        if (!scheduleMap[item.date]) scheduleMap[item.date] = {};
        if (!scheduleMap[item.date][item.shift]) scheduleMap[item.date][item.shift] = [];
        scheduleMap[item.date][item.shift].push(item.anesthesist_id);
      });
      setSchedule(scheduleMap);
    }

    if (hol.data) setHolidays(hol.data);
    if (notif.data) setNotifications(notif.data);
    if (swaps.data) setSwapRequests(swaps.data);
    if (exchange.data) setExchangeBoard(exchange.data);
    if (unavail.data) setUnavailabilities(unavail.data);
  }, [user, selectedFilters.size]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentUser(null);
  };

  // ============================================
  // SCHEDULE GENERATION
  // ============================================
  const generateSchedule = async () => {
    if (!isAdmin || isGenerating) return;
    setIsGenerating(true);

    await supabase.from('schedule').delete().neq('id', 0);

    const year = 2025;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const inserts = [];

    // Stats pour équilibrage
    const stats = {};
    anesthesists.forEach(a => { stats[a.id] = { we: 0, ferie: 0, astreinte: 0, bloc: 0, consultation: 0 }; });

    // Collecter les indisponibilités
    const unavailDates = {};
    unavailabilities.forEach(u => {
      const start = new Date(u.date_start);
      const end = new Date(u.date_end);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = formatDateKey(d);
        if (!unavailDates[key]) unavailDates[key] = new Set();
        unavailDates[key].add(u.anesthesist_id);
      }
    });

    const getAvailable = (dateKey) => {
      const unavail = unavailDates[dateKey] || new Set();
      return anesthesists.filter(a => !unavail.has(a.id));
    };

    const pickBest = (available, statKey) => {
      if (available.length === 0) return null;
      available.sort((a, b) => stats[a.id][statKey] - stats[b.id][statKey]);
      return available[0];
    };

    // Générer les week-ends (1 personne pour sam+dim)
    let current = new Date(startDate);
    while (current <= endDate) {
      if (current.getDay() === 6) { // Samedi
        const satKey = formatDateKey(current);
        const sunday = new Date(current);
        sunday.setDate(sunday.getDate() + 1);
        const sunKey = formatDateKey(sunday);

        const available = getAvailable(satKey).filter(a => !unavailDates[sunKey]?.has(a.id));
        const picked = pickBest(available, 'we');
        
        if (picked) {
          inserts.push({ date: satKey, shift: 'astreinte_we', anesthesist_id: picked.id, year });
          inserts.push({ date: sunKey, shift: 'astreinte_we', anesthesist_id: picked.id, year });
          stats[picked.id].we++;
        }
      }
      current.setDate(current.getDate() + 1);
    }

    // Générer les jours fériés
    for (const hol of holidays) {
      const available = getAvailable(hol.date);
      const picked = pickBest(available, 'ferie');
      if (picked) {
        inserts.push({ date: hol.date, shift: 'astreinte_ferie', anesthesist_id: picked.id, year });
        stats[picked.id].ferie++;
      }
    }

    // Générer les jours de semaine
    current = new Date(startDate);
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const dateKey = formatDateKey(current);
      const isHol = holidays.some(h => h.date === dateKey);

      if (dayOfWeek >= 1 && dayOfWeek <= 5 && !isHol) {
        const available = getAvailable(dateKey);

        // Astreinte
        const astrPicked = pickBest([...available], 'astreinte');
        if (astrPicked) {
          inserts.push({ date: dateKey, shift: 'astreinte', anesthesist_id: astrPicked.id, year });
          stats[astrPicked.id].astreinte++;
        }

        // Bloc (2 personnes)
        const blocAvail = available.filter(a => a.id !== astrPicked?.id);
        for (let i = 0; i < 2 && blocAvail.length > 0; i++) {
          const picked = pickBest(blocAvail, 'bloc');
          if (picked) {
            inserts.push({ date: dateKey, shift: 'bloc', anesthesist_id: picked.id, year });
            stats[picked.id].bloc++;
            blocAvail.splice(blocAvail.indexOf(picked), 1);
          }
        }

        // Consultation (1 personne)
        const consAvail = available.filter(a => !inserts.some(i => i.date === dateKey && i.anesthesist_id === a.id));
        const consPicked = pickBest(consAvail, 'consultation');
        if (consPicked) {
          inserts.push({ date: dateKey, shift: 'consultation', anesthesist_id: consPicked.id, year });
          stats[consPicked.id].consultation++;
        }
      }
      current.setDate(current.getDate() + 1);
    }

    // Insérer par batch
    for (let i = 0; i < inserts.length; i += 500) {
      await supabase.from('schedule').insert(inserts.slice(i, i + 500));
    }

    // Sauvegarder dans l'historique
    await supabase.from('schedule_history').insert({
      year,
      generated_by: currentUser.id,
      schedule_data: inserts,
      is_current: true
    });

    await loadData();
    setIsGenerating(false);
  };

  // ============================================
  // ACTIONS
  // ============================================
  const toggleAssignment = async (date, anesthesistId, shift) => {
    if (!isAdmin) return;
    const dateKey = formatDateKey(date);
    const exists = schedule[dateKey]?.[shift]?.includes(anesthesistId);

    if (exists) {
      await supabase.from('schedule').delete().eq('date', dateKey).eq('shift', shift).eq('anesthesist_id', anesthesistId);
    } else {
      await supabase.from('schedule').insert({ date: dateKey, shift, anesthesist_id: anesthesistId });
    }
    await loadData();
  };

  const handleSwapRequest = async (data) => {
    await supabase.from('swap_requests').insert(data);
    await loadData();
  };

  const respondToSwap = async (id, status) => {
    await supabase.from('swap_requests').update({ status, responded_at: new Date().toISOString() }).eq('id', id);
    await loadData();
  };

  const markNotificationRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    await loadData();
  };

  const addUnavailability = async (data) => {
    await supabase.from('unavailabilities').insert(data);
    await loadData();
  };

  const deleteUnavailability = async (id) => {
    await supabase.from('unavailabilities').delete().eq('id', id);
    await loadData();
  };

  const postToExchangeBoard = async (data) => {
    await supabase.from('exchange_board').insert(data);
    await loadData();
  };

  const takeFromExchangeBoard = async (id) => {
    await supabase.from('exchange_board').update({ status: 'taken', taken_by: currentUser.id }).eq('id', id);
    await loadData();
  };

  const closeExchangePost = async (id) => {
    await supabase.from('exchange_board').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', id);
    await loadData();
  };

  const transferAdmin = async (newAdminId) => {
    await supabase.rpc('transfer_admin', { new_admin_id: newAdminId });
    await loadData();
  };

  const updateEmailPreferences = async (prefs) => {
    await supabase.from('email_preferences').update(prefs).eq('anesthesist_id', currentUser.id);
    setEmailPreferences(prefs);
  };

  // ============================================
  // STATS
  // ============================================
  const calculateStats = () => {
    const stats = anesthesists.map(a => ({
      ...a, bloc: 0, consultation: 0, astreinte: 0, we: 0, ferie: 0, total: 0
    }));

    Object.entries(schedule).forEach(([dateKey, shifts]) => {
      Object.entries(shifts).forEach(([shift, ids]) => {
        ids.forEach(id => {
          const stat = stats.find(s => s.id === id);
          if (stat) {
            stat.total++;
            if (shift === 'bloc') stat.bloc++;
            else if (shift === 'consultation') stat.consultation++;
            else if (shift === 'astreinte') stat.astreinte++;
            else if (shift === 'astreinte_we') stat.we++;
            else if (shift === 'astreinte_ferie') stat.ferie++;
          }
        });
      });
    });
    return stats;
  };

  // ============================================
  // HELPERS VUE
  // ============================================
  const getWeekDays = (start) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const isHoliday = (date) => holidays.some(h => h.date === formatDateKey(date));
  const getHolidayName = (date) => holidays.find(h => h.date === formatDateKey(date))?.name;

  const getAssigned = (date, shift) => {
    const key = formatDateKey(date);
    return (schedule[key]?.[shift] || [])
      .map(id => anesthesists.find(a => a.id === id))
      .filter(a => a && selectedFilters.has(a.id));
  };

  const getShiftsForDay = (date) => {
    if (isWeekend(date)) return ['astreinte_we'];
    if (isHoliday(date)) return ['astreinte_ferie'];
    return ['astreinte', 'bloc', 'consultation'];
  };

  // ============================================
  // RENDER CONDITIONS
  // ============================================
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: theme.gray[100] }}>
      <RefreshCw className="w-8 h-8 animate-spin" style={{ color: theme.primary }} />
    </div>;
  }

  if (!user) return <LoginPage onLogin={setUser} />;

  const weekDays = getWeekDays(currentWeekStart);
  const stats = calculateStats();

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: theme.gray[100] }}>
      {/* Sidebar */}
      <div className="w-64 text-white flex flex-col fixed h-screen" style={{ backgroundColor: theme.primary }}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold">Planning</h1>
              <p className="text-xs text-white/60">Anesthésistes 2025</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          {[
            { id: 'dashboard', icon: Home, label: 'Tableau de bord' },
            { id: 'planning', icon: Calendar, label: 'Planning' },
            { id: 'exchange', icon: MessageSquare, label: 'Bourse aux échanges' },
            { id: 'unavailabilities', icon: CalendarOff, label: 'Indisponibilités' },
            ...(isAdmin ? [{ id: 'admin', icon: Shield, label: 'Administration' }] : []),
            { id: 'settings', icon: Settings, label: 'Paramètres' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${
                currentView === item.id ? 'bg-white/20' : 'hover:bg-white/10 text-white/70'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: currentUser?.color }}>
              {currentUser?.name?.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{currentUser?.name}</p>
              <p className="text-xs text-white/60">{isAdmin ? 'Admin' : 'Utilisateur'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold" style={{ color: theme.gray[800] }}>
            {currentView === 'dashboard' && 'Tableau de bord'}
            {currentView === 'planning' && 'Planning'}
            {currentView === 'exchange' && 'Bourse aux échanges'}
            {currentView === 'unavailabilities' && 'Mes indisponibilités'}
            {currentView === 'admin' && 'Administration'}
            {currentView === 'settings' && 'Paramètres'}
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowNotifications(true)} className="relative p-2 rounded-xl hover:bg-gray-100">
              <Bell className="w-6 h-6" style={{ color: theme.gray[600] }} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{unreadCount}</span>
              )}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-100" style={{ color: theme.gray[600] }}>
              <LogOut className="w-5 h-5" /><span>Déconnexion</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-8">
          {/* DASHBOARD */}
          {currentView === 'dashboard' && (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold" style={{ color: theme.gray[800] }}>Bonjour, {currentUser?.name?.split(' ')[0]} 👋</h2>
                <p style={{ color: theme.gray[500] }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold mb-4" style={{ color: theme.gray[800] }}>Mes prochains postes</h3>
                  {Object.entries(schedule)
                    .filter(([dk]) => new Date(dk) >= new Date())
                    .filter(([dk, shifts]) => Object.values(shifts).flat().includes(currentUser?.id))
                    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
                    .slice(0, 5)
                    .map(([dk, shifts]) => (
                      <div key={dk} className="flex items-center gap-3 mb-2 p-2 rounded-lg" style={{ backgroundColor: theme.gray[50] }}>
                        <span className="font-medium text-sm" style={{ color: theme.gray[800] }}>
                          {new Date(dk).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                        {Object.entries(shifts).map(([s, ids]) => ids.includes(currentUser?.id) && (
                          <span key={s} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: theme.gray[200] }}>{getShiftLabel(s)}</span>
                        ))}
                      </div>
                    ))}
                  <button onClick={() => setCurrentView('planning')} className="text-sm font-medium mt-4" style={{ color: theme.accent }}>Voir le planning →</button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold mb-4" style={{ color: theme.gray[800] }}>Demandes reçues</h3>
                  {swapRequests.filter(r => r.status === 'pending' && r.target_id === currentUser?.id).slice(0, 3).map(req => (
                    <div key={req.id} className="p-3 rounded-xl mb-2" style={{ backgroundColor: theme.gray[50] }}>
                      <p className="font-medium text-sm">{anesthesists.find(a => a.id === req.requester_id)?.name}</p>
                      <p className="text-xs" style={{ color: theme.gray[500] }}>
                        {new Date(req.date_start).toLocaleDateString('fr-FR')} → {new Date(req.date_end).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold mb-4" style={{ color: theme.gray[800] }}>Actions rapides</h3>
                  <button onClick={() => setShowSwapModal(true)} className="w-full mb-2 px-4 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2" style={{ backgroundColor: theme.accent }}>
                    <ArrowLeftRight className="w-4 h-4" /> Demander un échange
                  </button>
                  <button onClick={() => setCurrentView('unavailabilities')} className="w-full px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 border border-gray-200">
                    <CalendarOff className="w-4 h-4" /> Déclarer une absence
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PLANNING */}
          {currentView === 'planning' && (
            <div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
                    {['week', 'month'].map(m => (
                      <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-2 rounded-xl text-sm font-medium ${viewMode === m ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
                        {m === 'week' ? 'Semaine' : 'Mois'}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowStats(!showStats)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> Stats
                    </button>
                    {isAdmin && (
                      <button onClick={generateSchedule} disabled={isGenerating} className="px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50" style={{ backgroundColor: theme.success }}>
                        {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        {isGenerating ? 'Génération...' : 'Générer'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => viewMode === 'week' ? setCurrentWeekStart(new Date(currentWeekStart.setDate(currentWeekStart.getDate() - 7))) : setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-2 rounded-xl hover:bg-gray-100">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => { setCurrentWeekStart(getMonday(new Date())); setCurrentMonth(new Date()); }} className="px-4 py-2 rounded-xl text-sm" style={{ backgroundColor: theme.gray[100] }}>Aujourd'hui</button>
                  <span className="font-bold min-w-[150px] text-center">
                    {viewMode === 'week' ? `Semaine ${getWeekNumber(currentWeekStart)}` : currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => viewMode === 'week' ? setCurrentWeekStart(new Date(currentWeekStart.setDate(currentWeekStart.getDate() + 7))) : setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-2 rounded-xl hover:bg-gray-100">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {showStats && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                  <h3 className="font-bold mb-4">Statistiques 2025</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map(s => (
                      <div key={s.id} className={`p-4 rounded-xl ${s.id === currentUser?.id ? 'ring-2 ring-yellow-400' : ''}`} style={{ backgroundColor: theme.gray[50] }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="font-medium text-sm">{s.name.split(' ')[1]}</span>
                        </div>
                        <div className="text-xs space-y-1" style={{ color: theme.gray[600] }}>
                          <div>Bloc: {s.bloc} | Cs: {s.consultation}</div>
                          <div>Astr: {s.astreinte} | WE: {s.we} | Fériés: {s.ferie}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewMode === 'week' && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-7 border-b">
                    {weekDays.map((d, i) => (
                      <div key={i} className={`p-4 text-center border-r last:border-r-0 ${isWeekend(d) ? 'bg-gray-50' : isHoliday(d) ? 'bg-amber-50' : ''}`}>
                        <p className="text-xs font-medium uppercase" style={{ color: theme.gray[500] }}>{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</p>
                        <p className={`text-xl font-bold mt-1 ${d.toDateString() === new Date().toDateString() ? 'bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto' : ''}`}>{d.getDate()}</p>
                        {isHoliday(d) && <p className="text-xs mt-1" style={{ color: theme.warning }}>{getHolidayName(d)}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {weekDays.map((d, i) => (
                      <div key={i} className={`p-3 border-r last:border-r-0 min-h-[250px] ${isWeekend(d) ? 'bg-gray-50' : isHoliday(d) ? 'bg-amber-50' : ''}`}>
                        {getShiftsForDay(d).map(shift => (
                          <div key={shift} className="mb-3">
                            <div className="flex items-center gap-1 mb-1">
                              <ShiftIcon shift={shift} className="w-3 h-3" style={{ color: theme.gray[400] }} />
                              <span className="text-xs font-medium" style={{ color: theme.gray[500] }}>{getShiftLabel(shift)}</span>
                            </div>
                            {getAssigned(d, shift).map(a => (
                              <div key={a.id} onClick={() => isAdmin && toggleAssignment(d, a.id, shift)} className={`text-xs px-2 py-1.5 rounded-lg text-white mb-1 ${isAdmin ? 'cursor-pointer hover:opacity-80' : ''} ${a.id === currentUser?.id ? 'ring-2 ring-yellow-400' : ''}`} style={{ backgroundColor: a.color }}>
                                Dr {a.name.split(' ')[1] === 'EL' ? 'EL KAMEL' : a.name.split(' ')[1]}
                              </div>
                            ))}
                            {isAdmin && (
                              <select className="w-full text-xs p-1.5 border rounded-lg mt-1" value="" onChange={(e) => e.target.value && toggleAssignment(d, parseInt(e.target.value), shift)}>
                                <option value="">+ Ajouter</option>
                                {anesthesists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                              </select>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewMode === 'month' && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-7 border-b">
                    {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(d => (
                      <div key={d} className="p-2 text-center text-xs font-semibold border-r last:border-r-0" style={{ color: theme.gray[500] }}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {getDaysInMonth(currentMonth).map((d, i) => (
                      <div key={i} className={`p-2 border-r border-b last:border-r-0 min-h-[80px] ${!d ? 'bg-gray-50' : isWeekend(d) ? 'bg-gray-50' : isHoliday(d) ? 'bg-amber-50' : ''}`}>
                        {d && <>
                          <p className={`text-sm font-bold mb-1 ${d.toDateString() === new Date().toDateString() ? 'text-blue-600' : ''}`}>{d.getDate()}</p>
                          {getShiftsForDay(d).map(shift => getAssigned(d, shift).slice(0, 2).map(a => (
                            <div key={`${shift}-${a.id}`} className="text-xs px-1 py-0.5 rounded text-white mb-0.5 truncate" style={{ backgroundColor: a.color, fontSize: '9px' }}>
                              {a.name.split(' ')[1]?.substring(0, 3)}
                            </div>
                          )))}
                        </>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filtres */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 mt-6">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-medium text-sm" style={{ color: theme.gray[700] }}>Filtrer :</span>
                  {anesthesists.map(a => (
                    <button key={a.id} onClick={() => { const f = new Set(selectedFilters); f.has(a.id) ? f.delete(a.id) : f.add(a.id); setSelectedFilters(f); }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${selectedFilters.has(a.id) ? 'text-white' : ''}`}
                      style={selectedFilters.has(a.id) ? { backgroundColor: a.color, borderColor: a.color } : { borderColor: theme.gray[200], color: theme.gray[400] }}>
                      {a.name.split(' ')[1] === 'EL' ? 'EL KAMEL' : a.name.split(' ')[1]}
                    </button>
                  ))}
                  <button onClick={() => setSelectedFilters(new Set(anesthesists.map(a => a.id)))} className="text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: theme.gray[100] }}>Tous</button>
                  <button onClick={() => setSelectedFilters(new Set())} className="text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: theme.gray[100] }}>Aucun</button>
                </div>
              </div>
            </div>
          )}

          {/* BOURSE AUX ÉCHANGES */}
          {currentView === 'exchange' && (
            <div>
              <div className="flex justify-between mb-6">
                <p style={{ color: theme.gray[500] }}>Proposez ou prenez des gardes</p>
                <button onClick={() => setShowSwapModal(true)} className="px-4 py-2 text-white rounded-xl font-medium flex items-center gap-2" style={{ backgroundColor: theme.primary }}>
                  <Plus className="w-4 h-4" /> Publier
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                {exchangeBoard.filter(e => e.status === 'open').length === 0 ? (
                  <p style={{ color: theme.gray[500] }}>Aucune annonce</p>
                ) : (
                  exchangeBoard.filter(e => e.status === 'open').map(post => {
                    const poster = anesthesists.find(a => a.id === post.anesthesist_id);
                    return (
                      <div key={post.id} className="p-4 rounded-xl border border-gray-200 mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: poster?.color }}>{poster?.name?.split(' ').map(n => n[0]).join('')}</div>
                          <div>
                            <p className="font-medium">{poster?.name}</p>
                            <p className="text-sm" style={{ color: theme.gray[500] }}>Cherche à échanger le {new Date(post.date_to_exchange).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                        {post.anesthesist_id !== currentUser?.id && (
                          <button onClick={() => takeFromExchangeBoard(post.id)} className="px-4 py-2 rounded-xl text-white text-sm" style={{ backgroundColor: theme.success }}>Je prends</button>
                        )}
                        {post.anesthesist_id === currentUser?.id && (
                          <button onClick={() => closeExchangePost(post.id)} className="px-4 py-2 rounded-xl border text-sm">Fermer</button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* INDISPONIBILITÉS */}
          {currentView === 'unavailabilities' && (
            <div>
              <div className="flex justify-between mb-6">
                <p style={{ color: theme.gray[500] }}>Déclarez vos congés et absences</p>
                <button onClick={() => {/* TODO: modal */}} className="px-4 py-2 text-white rounded-xl font-medium flex items-center gap-2" style={{ backgroundColor: theme.primary }}>
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                {unavailabilities.filter(u => u.anesthesist_id === currentUser?.id).length === 0 ? (
                  <p style={{ color: theme.gray[500] }}>Aucune indisponibilité déclarée</p>
                ) : (
                  unavailabilities.filter(u => u.anesthesist_id === currentUser?.id).map(u => (
                    <div key={u.id} className="p-4 rounded-xl border border-gray-200 mb-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{new Date(u.date_start).toLocaleDateString('fr-FR')} → {new Date(u.date_end).toLocaleDateString('fr-FR')}</p>
                        {u.reason && <p className="text-sm" style={{ color: theme.gray[500] }}>{u.reason}</p>}
                      </div>
                      <button onClick={() => deleteUnavailability(u.id)} className="p-2 rounded-xl hover:bg-red-50" style={{ color: theme.danger }}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ADMIN */}
          {currentView === 'admin' && isAdmin && (
            <div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <h3 className="font-bold mb-4">Transférer le rôle admin</h3>
                <p className="text-sm mb-4" style={{ color: theme.gray[500] }}>Sélectionnez la personne qui deviendra le nouvel administrateur.</p>
                <select className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-xl" onChange={(e) => e.target.value && transferAdmin(parseInt(e.target.value))}>
                  <option value="">Choisir un anesthésiste...</option>
                  {anesthesists.filter(a => a.id !== currentUser?.id).map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {currentView === 'settings' && (
            <div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <h3 className="font-bold mb-4">Lien calendrier ICS</h3>
                <p className="text-sm mb-4" style={{ color: theme.gray[500] }}>Ajoutez ce lien à Google Agenda, Outlook ou Apple Calendar pour synchroniser automatiquement votre planning.</p>
                <div className="flex gap-2">
                  <input type="text" readOnly value={`${window.location.origin}/api/calendar/${currentUser?.ics_token}.ics`} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm" />
                  <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/calendar/${currentUser?.ics_token}.ics`)} className="px-4 py-2 rounded-xl border border-gray-200 flex items-center gap-2">
                    <Copy className="w-4 h-4" /> Copier
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold mb-4">Notifications par email</h3>
                {[
                  { key: 'notify_new_planning', label: 'Nouveau planning généré' },
                  { key: 'notify_swap_request', label: 'Demande d\'échange reçue' },
                  { key: 'notify_swap_response', label: 'Réponse à ma demande' },
                  { key: 'notify_exchange_board', label: 'Nouvelle annonce sur la bourse' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 mb-3 cursor-pointer">
                    <input type="checkbox" checked={emailPreferences[key]} onChange={(e) => updateEmailPreferences({ ...emailPreferences, [key]: e.target.checked })} className="w-5 h-5 rounded" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL NOTIFICATIONS */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Notifications</h2>
              <button onClick={() => setShowNotifications(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-8 text-center" style={{ color: theme.gray[500] }}>Aucune notification</p>
              ) : notifications.map(n => (
                <div key={n.id} className={`p-4 border-b ${n.read ? '' : 'bg-blue-50'}`}>
                  <p className="font-semibold text-sm">{n.title}</p>
                  <p className="text-sm mt-1" style={{ color: theme.gray[600] }}>{n.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: theme.gray[400] }}>{new Date(n.created_at).toLocaleDateString('fr-FR')}</span>
                    {!n.read && <button onClick={() => markNotificationRead(n.id)} className="text-xs" style={{ color: theme.accent }}>Marquer lu</button>}
                  </div>
                  {n.type === 'swap_request' && n.swap_request?.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => respondToSwap(n.swap_request_id, 'accepted')} className="px-3 py-1.5 text-white text-sm rounded-lg" style={{ backgroundColor: theme.success }}>Accepter</button>
                      <button onClick={() => respondToSwap(n.swap_request_id, 'rejected')} className="px-3 py-1.5 text-white text-sm rounded-lg" style={{ backgroundColor: theme.danger }}>Refuser</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL SWAP */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Demander un échange</h2>
              <button onClick={() => setShowSwapModal(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              await handleSwapRequest({
                requester_id: currentUser.id,
                target_id: parseInt(form.target.value),
                date_start: form.date_start.value,
                date_end: form.date_end.value,
                shift: form.shift.value,
                message: form.message.value
              });
              setShowSwapModal(false);
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date début</label>
                  <input type="date" name="date_start" required className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date fin</label>
                  <input type="date" name="date_end" required className="w-full px-3 py-2 border rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type de poste</label>
                <select name="shift" className="w-full px-3 py-2 border rounded-xl">
                  <option value="all">Tous</option>
                  <option value="bloc">Bloc</option>
                  <option value="consultation">Consultation</option>
                  <option value="astreinte">Astreinte</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Échanger avec</label>
                <select name="target" required className="w-full px-3 py-2 border rounded-xl">
                  <option value="">Sélectionner...</option>
                  {anesthesists.filter(a => a.id !== currentUser?.id).map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message (optionnel)</label>
                <textarea name="message" className="w-full px-3 py-2 border rounded-xl" rows={2} />
              </div>
              <button type="submit" className="w-full py-3 text-white rounded-xl font-medium" style={{ backgroundColor: theme.primary }}>Envoyer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnesthesistScheduler;
