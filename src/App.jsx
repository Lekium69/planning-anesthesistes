import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Calendar, Users, RefreshCw, Download, Play, TrendingUp, ArrowLeftRight, 
  X, Check, LogIn, LogOut, Bell, Send, User, Moon, Building2, 
  Stethoscope, Star, FileSpreadsheet, Printer, Settings, Home,
  CalendarOff, MessageSquare, Shield, ChevronLeft, ChevronRight,
  Copy, ExternalLink, Clock, AlertCircle, Plus, Trash2, PlusCircle,
  Eye, Percent
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// ⚠️ REMPLACE CES VALEURS PAR LES TIENNES
const SUPABASE_URL = 'https://vqlieplrtrvqcvllhmob.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxbGllcGxydHJ2cWN2bGxobW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMDA4MzMsImV4cCI6MjA4MDg3NjgzM30.BcK8sDePzCwSC3BMSRLagdZUQhevdRIrNshLsP1MgW8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// THÈME - COULEURS PLUS DISTINCTES
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

// Couleurs très distinctes pour les anesthésistes
const DISTINCT_COLORS = [
  '#2563eb', // Bleu vif
  '#dc2626', // Rouge
  '#059669', // Vert émeraude
  '#7c3aed', // Violet
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#c026d3', // Magenta
  '#65a30d', // Vert lime
];

// ============================================
// HELPERS
// ============================================
const formatDateKey = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const parseDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
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

const isWeekend = (date) => {
  const d = new Date(date);
  return d.getDay() === 0 || d.getDay() === 6;
};

const isFriday = (date) => {
  const d = new Date(date);
  return d.getDay() === 5;
};

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
// CALCUL DES JOURS FÉRIÉS FRANÇAIS
// ============================================
const getHolidaysForYear = (year) => {
  // Calcul de Pâques (algorithme de Meeus/Jones/Butcher)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, month - 1, day);

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const lundiPaques = addDays(easter, 1);
  const ascension = addDays(easter, 39);
  const lundiPentecote = addDays(easter, 50);

  return [
    { date: `${year}-01-01`, name: "Jour de l'an" },
    { date: formatDateKey(lundiPaques), name: "Lundi de Pâques" },
    { date: `${year}-05-01`, name: "Fête du Travail" },
    { date: `${year}-05-08`, name: "Victoire 1945" },
    { date: formatDateKey(ascension), name: "Ascension" },
    { date: formatDateKey(lundiPentecote), name: "Lundi de Pentecôte" },
    { date: `${year}-07-14`, name: "Fête Nationale" },
    { date: `${year}-08-15`, name: "Assomption" },
    { date: `${year}-11-01`, name: "Toussaint" },
    { date: `${year}-11-11`, name: "Armistice 1918" },
    { date: `${year}-12-25`, name: "Noël" },
  ];
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

  // Ref pour éviter de réinitialiser les filtres après "Aucun"
  const filtersInitialized = useRef(false);

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
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showETPModal, setShowETPModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Rôles: 'admin', 'user', 'viewer' (direction)
  const isAdmin = currentUser?.role === 'admin';
  const isViewer = currentUser?.role === 'viewer';
  const canEdit = isAdmin; // Seul l'admin peut modifier
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
    
    try {
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
        // Appliquer les couleurs distinctes
        const anesthWithColors = anesth.data.map((a, index) => ({
          ...a,
          color: DISTINCT_COLORS[index % DISTINCT_COLORS.length]
        }));
        setAnesthesists(anesthWithColors);
        
        const profile = anesthWithColors.find(a => a.email === user.email);
        if (profile) {
          setCurrentUser(profile);
          if (!profile.user_id) {
            await supabase.from('anesthesists').update({ user_id: user.id }).eq('id', profile.id);
          }
          const { data: prefs } = await supabase.from('email_preferences').select('*').eq('anesthesist_id', profile.id).single();
          if (prefs) setEmailPreferences(prefs);
        }
        // Ne réinitialiser les filtres qu'au premier chargement (pas quand l'utilisateur a choisi "Aucun")
        if (selectedFilters.size === 0 && !filtersInitialized.current) {
          setSelectedFilters(new Set(anesthWithColors.map(a => a.id)));
          filtersInitialized.current = true;
        }
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
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  }, [user, selectedFilters.size]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentUser(null);
  };

  // ============================================
  // HELPERS POUR HOLIDAYS
  // ============================================
  const getAllHolidaysForPeriod = (startDate, endDate) => {
    const allHolidays = [];
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      const yearHolidays = getHolidaysForYear(year);
      yearHolidays.forEach(h => {
        const hDate = new Date(h.date);
        if (hDate >= startDate && hDate <= endDate) {
          allHolidays.push(h);
        }
      });
    }
    return allHolidays;
  };

  const isHolidayDate = (date, holidaysList) => {
    const dateKey = formatDateKey(date);
    return holidaysList.some(h => h.date === dateKey);
  };

  const isHoliday = (date) => {
    const dateKey = formatDateKey(date);
    // Vérifier dans la liste dynamique
    const year = new Date(date).getFullYear();
    const yearHolidays = getHolidaysForYear(year);
    return yearHolidays.some(h => h.date === dateKey) || holidays.some(h => h.date === dateKey);
  };

  const getHolidayName = (date) => {
    const dateKey = formatDateKey(date);
    const year = new Date(date).getFullYear();
    const yearHolidays = getHolidaysForYear(year);
    const found = yearHolidays.find(h => h.date === dateKey) || holidays.find(h => h.date === dateKey);
    return found?.name;
  };

  // Vérifie si la veille est un jour férié ou un vendredi (veille de WE)
  const isEveOfHolidayOrWeekend = (date, holidaysList) => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Si demain est samedi (donc aujourd'hui vendredi)
    if (nextDay.getDay() === 6) return true;
    
    // Si demain est un jour férié (et pas un WE)
    if (isHolidayDate(nextDay, holidaysList) && !isWeekend(nextDay)) return true;
    
    return false;
  };
  // ============================================
  // GÉNÉRATION DU PLANNING
  // Priorité 1: Semaines entières (3 personnes fixes par semaine)
  // Priorité 2: Astreinte WE/férié = astreinte de la veille/vendredi
  // Priorité 3: Équilibrer WE puis fériés
  // ============================================
  const generateSchedule = async (mode = 'new', rangeStart = null, rangeEnd = null) => {
    if (!isAdmin || isGenerating) return;
    setIsGenerating(true);
    setShowGenerateModal(false);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let startDate, endDate;
      
      if (mode === 'range' && rangeStart && rangeEnd) {
        startDate = new Date(rangeStart);
        endDate = new Date(rangeEnd);
        // Ajuster au lundi
        while (startDate.getDay() !== 1) {
          startDate.setDate(startDate.getDate() + 1);
        }
        // Ajuster au dimanche
        while (endDate.getDay() !== 0) {
          endDate.setDate(endDate.getDate() + 1);
        }
      } else {
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() + 1);
        while (startDate.getDay() !== 1) {
          startDate.setDate(startDate.getDate() + 1);
        }
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 18);
      }

      console.log('=== DÉBUT GÉNÉRATION ===');
      console.log('Mode:', mode);
      console.log('Du:', formatDateKey(startDate), 'au:', formatDateKey(endDate));

      // Anesthésistes actifs
      const activeAnesth = anesthesists.filter(a => a.role !== 'viewer');
      
      if (activeAnesth.length < 3) {
        alert('Il faut au moins 3 anesthésistes actifs pour générer le planning');
        return;
      }

      // ============================================
      // CHARGER LES STATS DU PASSÉ (Priorité 3: équilibrage)
      // ============================================
      const stats = {};
      activeAnesth.forEach(a => {
        stats[a.id] = { 
          semaines: 0, 
          we: 0, 
          ferie: 0, 
          etp: a.etp || 0.5 
        };
      });

      const { data: pastSchedule } = await supabase
        .from('schedule')
        .select('*')
        .lt('date', formatDateKey(startDate));

      if (pastSchedule) {
        console.log(`Chargement de ${pastSchedule.length} entrées passées pour équilibrage`);
        const countedWE = new Set(); // Pour ne pas compter 2x sam+dim
        pastSchedule.forEach(entry => {
          if (stats[entry.anesthesist_id]) {
            if (entry.shift === 'astreinte_we') {
              const weKey = `${entry.date}-${entry.anesthesist_id}`;
              if (!countedWE.has(weKey.substring(0, 10))) {
                stats[entry.anesthesist_id].we++;
                countedWE.add(entry.date.substring(0, 10));
              }
            }
            else if (entry.shift === 'astreinte_ferie') stats[entry.anesthesist_id].ferie++;
          }
        });
        console.log('Stats WE/fériés passés:', Object.entries(stats).map(([id, s]) => `${id}: WE=${s.we}, Fériés=${s.ferie}`));
      }

      // Supprimer les entrées dans la plage
      const { error: delErr } = await supabase
        .from('schedule')
        .delete()
        .gte('date', formatDateKey(startDate))
        .lte('date', formatDateKey(endDate));
      
      if (delErr) console.error('Erreur delete:', delErr);

      // Jours fériés
      const holidaySet = new Set();
      for (let y = startDate.getFullYear(); y <= endDate.getFullYear(); y++) {
        getHolidaysForYear(y).forEach(h => holidaySet.add(h.date));
      }

      // Indisponibilités
      const unavailMap = {};
      unavailabilities.forEach(u => {
        let d = new Date(u.date_start);
        const end = new Date(u.date_end);
        while (d <= end) {
          const k = formatDateKey(d);
          if (!unavailMap[k]) unavailMap[k] = new Set();
          unavailMap[k].add(u.anesthesist_id);
          d.setDate(d.getDate() + 1);
        }
      });

      // Disponibilité semaine complète (lun-ven + sam-dim)
      const isAvailableForWeek = (anesthId, mondayDate) => {
        for (let i = 0; i < 7; i++) { // Lun-Dim
          const d = new Date(mondayDate);
          d.setDate(d.getDate() + i);
          const dk = formatDateKey(d);
          if (unavailMap[dk]?.has(anesthId)) return false;
        }
        return true;
      };

      // Picker équilibré par ETP
      const pickMinForStat = (list, statKey) => {
        if (!list.length) return null;
        return list.reduce((best, curr) => {
          const scoreBest = stats[best.id][statKey] / stats[best.id].etp;
          const scoreCurr = stats[curr.id][statKey] / stats[curr.id].etp;
          return scoreCurr < scoreBest ? curr : best;
        });
      };

      const inserts = [];
      
      // ============================================
      // COLLECTER LES SEMAINES
      // ============================================
      const weeks = [];
      let currentMonday = new Date(startDate);
      
      while (currentMonday <= endDate) {
        weeks.push({
          monday: new Date(currentMonday),
          weekKey: `${currentMonday.getFullYear()}-W${getWeekNumber(currentMonday)}`
        });
        currentMonday.setDate(currentMonday.getDate() + 7);
      }

      console.log(`${weeks.length} semaines à planifier`);

      // ============================================
      // PRIORITÉ 1 + 2 + 3: ASSIGNER PAR SEMAINE COMPLÈTE
      // Pour chaque semaine: 
      // - Choisir 3 personnes disponibles TOUTE la semaine (lun-dim)
      // - Celui avec le moins de WE (équilibré) sera en position B (astreinte vendredi = WE)
      // - Rotation des postes dans la semaine
      // ============================================

      // Pattern de rotation : [astreinte+bloc, bloc, consultation]
      const rotationPattern = [
        [0, 1, 2], // Lundi:    A=astr+bloc, B=bloc, C=consult
        [1, 2, 0], // Mardi:    B=astr+bloc, C=bloc, A=consult
        [2, 0, 1], // Mercredi: C=astr+bloc, A=bloc, B=consult
        [0, 1, 2], // Jeudi:    A=astr+bloc, B=bloc, C=consult
        [1, 2, 0], // Vendredi: B=astr+bloc, C=bloc, A=consult (B fait le WE!)
      ];
      
      for (const week of weeks) {
        // Trouver qui est disponible TOUTE la semaine (lun-dim)
        const availForFullWeek = activeAnesth.filter(a => isAvailableForWeek(a.id, week.monday));
        
        if (availForFullWeek.length < 3) {
          console.warn(`Semaine ${week.weekKey}: seulement ${availForFullWeek.length} personnes disponibles toute la semaine`);
          // TODO: gérer ce cas (semaine partielle)
          continue;
        }

        // PRIORITÉ 3: Équilibrer les WE
        // La personne B fait l'astreinte vendredi, donc fait le WE
        // On choisit celle avec le moins de WE pour la position B
        
        // Trier par nombre de WE (équilibré par ETP)
        const sortedByWE = [...availForFullWeek].sort((a, b) => {
          const scoreA = stats[a.id].we / stats[a.id].etp;
          const scoreB = stats[b.id].we / stats[b.id].etp;
          return scoreA - scoreB;
        });

        // Position B = celui avec le moins de WE (il fera le WE)
        const personB = sortedByWE[0];
        
        // Positions A et C parmi les restants
        const remaining = sortedByWE.filter(a => a.id !== personB.id);
        const personA = remaining[0];
        const personC = remaining[1];

        const weekTeam = [personA, personB, personC];
        
        stats[personA.id].semaines++;
        stats[personB.id].semaines++;
        stats[personC.id].semaines++;
        stats[personB.id].we++; // B fait le WE

        console.log(`Semaine ${week.weekKey}: A=${personA.name.split(' ')[1]}, B=${personB.name.split(' ')[1]} (WE), C=${personC.name.split(' ')[1]}`);

        // ============================================
        // GÉNÉRER LES JOURS DE LA SEMAINE
        // ============================================
        for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
          const d = new Date(week.monday);
          d.setDate(d.getDate() + dayIndex);
          const dk = formatDateKey(d);
          
          // Si jour férié en semaine
          if (holidaySet.has(dk)) {
            // PRIORITÉ 2: Astreinte férié = astreinte de la veille
            // La veille = dayIndex-1, on regarde qui était d'astreinte
            const [prevAstrIdx] = dayIndex > 0 ? rotationPattern[dayIndex - 1] : [1]; // Si lundi férié, prendre B (astreinte vendredi précédent)
            const feriePerson = weekTeam[prevAstrIdx];
            
            inserts.push({ date: dk, shift: 'astreinte_ferie', anesthesist_id: feriePerson.id, year: d.getFullYear() });
            stats[feriePerson.id].ferie++;
            continue;
          }
          
          const [astrIdx, blocIdx, consIdx] = rotationPattern[dayIndex];
          
          const astrPerson = weekTeam[astrIdx];
          const blocPerson = weekTeam[blocIdx];
          const consPerson = weekTeam[consIdx];

          // Astreinte + Bloc
          inserts.push({ date: dk, shift: 'astreinte', anesthesist_id: astrPerson.id, year: d.getFullYear() });
          inserts.push({ date: dk, shift: 'bloc', anesthesist_id: astrPerson.id, year: d.getFullYear() });

          // Bloc (2ème personne)
          inserts.push({ date: dk, shift: 'bloc', anesthesist_id: blocPerson.id, year: d.getFullYear() });

          // Consultation
          inserts.push({ date: dk, shift: 'consultation', anesthesist_id: consPerson.id, year: d.getFullYear() });
        }

        // ============================================
        // SAMEDI + DIMANCHE
        // PRIORITÉ 2: Celui d'astreinte vendredi (B) fait le WE
        // ============================================
        const saturday = new Date(week.monday);
        saturday.setDate(saturday.getDate() + 5);
        const sunday = new Date(week.monday);
        sunday.setDate(sunday.getDate() + 6);
        
        // Vérifier que le WE est dans la plage
        if (saturday <= endDate) {
          const satKey = formatDateKey(saturday);
          const sunKey = formatDateKey(sunday);
          
          // B était d'astreinte vendredi, donc fait le WE
          inserts.push({ date: satKey, shift: 'astreinte_we', anesthesist_id: personB.id, year: saturday.getFullYear() });
          inserts.push({ date: sunKey, shift: 'astreinte_we', anesthesist_id: personB.id, year: sunday.getFullYear() });
        }
      }

      console.log('Entrées générées:', inserts.length);
      console.log('Stats finales:', stats);

      // Insérer par batch
      for (let i = 0; i < inserts.length; i += 500) {
        const batch = inserts.slice(i, i + 500);
        const { error } = await supabase.from('schedule').insert(batch);
        if (error) {
          console.error('Erreur batch', i, ':', error);
          throw error;
        }
        console.log('Batch', i/500 + 1, 'inséré');
      }

      // Historique
      try {
        await supabase.from('schedule_history').insert({
          year: today.getFullYear(),
          generated_by: currentUser?.id,
          schedule_data: { count: inserts.length, mode, stats, range: mode === 'range' ? { start: rangeStart, end: rangeEnd } : null },
          is_current: true
        });
      } catch (e) {
        console.warn('Historique non sauvé:', e);
      }

      await loadData();
      
      const modeLabel = mode === 'range' 
        ? `Plage du ${new Date(rangeStart).toLocaleDateString('fr-FR')} au ${new Date(rangeEnd).toLocaleDateString('fr-FR')}`
        : 'Planning intégral 18 mois';
      alert(`✅ ${modeLabel}\n\n${inserts.length} entrées générées\n\n• Semaines complètes (3 personnes/semaine)\n• Astreinte WE = astreinte du vendredi\n• WE et fériés équilibrés`);

    } catch (err) {
      console.error('ERREUR GÉNÉRATION:', err);
      alert('Erreur: ' + (err.message || err));
    } finally {
      setIsGenerating(false);
    }
  };
  // ============================================
  // ACTIONS
  // ============================================
  const toggleAssignment = async (date, anesthesistId, shift) => {
    if (!canEdit) return;
    const dateKey = formatDateKey(date);
    const exists = schedule[dateKey]?.[shift]?.includes(anesthesistId);

    if (exists) {
      await supabase.from('schedule').delete().eq('date', dateKey).eq('shift', shift).eq('anesthesist_id', anesthesistId);
    } else {
      await supabase.from('schedule').insert({ date: dateKey, shift, anesthesist_id: anesthesistId, year: new Date(date).getFullYear() });
    }
    await loadData();
  };

  const updateETP = async (anesthesistId, newETP) => {
    if (!isAdmin) return;
    await supabase.from('anesthesists').update({ etp: newETP }).eq('id', anesthesistId);
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
    if (!window.confirm('Êtes-vous sûr de vouloir transférer le rôle admin ?')) return;
    await supabase.from('anesthesists').update({ role: 'user' }).eq('id', currentUser.id);
    await supabase.from('anesthesists').update({ role: 'admin' }).eq('id', newAdminId);
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
      ...a, 
      bloc: 0, 
      consultation: 0, 
      astreinte: 0, 
      we: 0, 
      ferie: 0, 
      total: 0,
      etp: a.etp || 0.5
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
    const s = new Date(start);
    for (let i = 0; i < 7; i++) {
      const d = new Date(s);
      d.setDate(s.getDate() + i);
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
    // Ajuster pour commencer le lundi (0=lun, 6=dim)
    // getDay() retourne 0=dim, 1=lun, ..., 6=sam
    // On veut que lundi=0, donc on fait (getDay() + 6) % 7
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

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
              <p className="text-xs text-white/60">Anesthésistes</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          {[
            { id: 'dashboard', icon: Home, label: 'Tableau de bord', show: !isViewer },
            { id: 'planning', icon: Calendar, label: 'Planning', show: true },
            { id: 'exchange', icon: MessageSquare, label: 'Bourse aux échanges', show: !isViewer },
            { id: 'unavailabilities', icon: CalendarOff, label: 'Indisponibilités', show: !isViewer },
            { id: 'admin', icon: Shield, label: 'Administration', show: isAdmin },
            { id: 'settings', icon: Settings, label: 'Paramètres', show: !isViewer },
          ].filter(item => item.show).map(item => (
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: currentUser?.color || theme.accent }}>
              {currentUser?.name?.split(' ').map(n => n[0]).join('') || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{currentUser?.name || 'Utilisateur'}</p>
              <p className="text-xs text-white/60">
                {isAdmin ? 'Admin' : isViewer ? 'Consultation' : 'Utilisateur'}
              </p>
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
            {!isViewer && (
              <button onClick={() => setShowNotifications(true)} className="relative p-2 rounded-xl hover:bg-gray-100">
                <Bell className="w-6 h-6" style={{ color: theme.gray[600] }} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-100" style={{ color: theme.gray[600] }}>
              <LogOut className="w-5 h-5" /><span>Déconnexion</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-8">
          {/* DASHBOARD */}
          {currentView === 'dashboard' && !isViewer && (
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
                  {Object.entries(schedule).filter(([dk]) => new Date(dk) >= new Date()).filter(([dk, shifts]) => Object.values(shifts).flat().includes(currentUser?.id)).length === 0 && (
                    <p className="text-sm" style={{ color: theme.gray[500] }}>Aucun poste à venir</p>
                  )}
                  <button onClick={() => setCurrentView('planning')} className="text-sm font-medium mt-4" style={{ color: theme.accent }}>Voir le planning →</button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold mb-4" style={{ color: theme.gray[800] }}>Demandes reçues</h3>
                  {swapRequests.filter(r => r.status === 'pending' && r.target_id === currentUser?.id).length === 0 ? (
                    <p className="text-sm" style={{ color: theme.gray[500] }}>Aucune demande en attente</p>
                  ) : (
                    swapRequests.filter(r => r.status === 'pending' && r.target_id === currentUser?.id).slice(0, 3).map(req => (
                      <div key={req.id} className="p-3 rounded-xl mb-2" style={{ backgroundColor: theme.gray[50] }}>
                        <p className="font-medium text-sm">{anesthesists.find(a => a.id === req.requester_id)?.name}</p>
                        <p className="text-xs" style={{ color: theme.gray[500] }}>
                          {new Date(req.date_start).toLocaleDateString('fr-FR')} → {new Date(req.date_end).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ))
                  )}
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
                      <>
                        <button 
                          onClick={() => setShowETPModal(true)} 
                          className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium flex items-center gap-2"
                        >
                          <Percent className="w-4 h-4" /> ETP
                        </button>
                        <button 
                          onClick={() => setShowGenerateModal(true)} 
                          disabled={isGenerating} 
                          className="px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50" 
                          style={{ backgroundColor: theme.success }}
                        >
                          {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                          {isGenerating ? 'Génération...' : 'Générer'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => {
                    if (viewMode === 'week') {
                      const newDate = new Date(currentWeekStart);
                      newDate.setDate(newDate.getDate() - 7);
                      setCurrentWeekStart(newDate);
                    } else {
                      const newDate = new Date(currentMonth);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setCurrentMonth(newDate);
                    }
                  }} className="p-2 rounded-xl hover:bg-gray-100">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => { setCurrentWeekStart(getMonday(new Date())); setCurrentMonth(new Date()); }} className="px-4 py-2 rounded-xl text-sm" style={{ backgroundColor: theme.gray[100] }}>Aujourd'hui</button>
                  <span className="font-bold min-w-[200px] text-center">
                    {viewMode === 'week' 
                      ? `Semaine ${getWeekNumber(currentWeekStart)} - ${currentWeekStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}` 
                      : currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => {
                    if (viewMode === 'week') {
                      const newDate = new Date(currentWeekStart);
                      newDate.setDate(newDate.getDate() + 7);
                      setCurrentWeekStart(newDate);
                    } else {
                      const newDate = new Date(currentMonth);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setCurrentMonth(newDate);
                    }
                  }} className="p-2 rounded-xl hover:bg-gray-100">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {showStats && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                  <h3 className="font-bold mb-4">Statistiques</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.filter(s => s.role !== 'viewer').map(s => (
                      <div key={s.id} className={`p-4 rounded-xl ${s.id === currentUser?.id ? 'ring-2 ring-yellow-400' : ''}`} style={{ backgroundColor: theme.gray[50] }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="font-medium text-sm">{s.name.split(' ')[1]}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: theme.gray[200] }}>{Math.round((s.etp || 0.5) * 100)}%</span>
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

              {/* Vue Semaine */}
              {viewMode === 'week' && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-7 border-b">
                    {weekDays.map((d, i) => {
                      const isToday = d.toDateString() === new Date().toDateString();
                      const isWE = isWeekend(d);
                      const isHol = isHoliday(d);
                      return (
                        <div key={i} className={`p-4 text-center border-r last:border-r-0 ${isWE ? 'bg-gray-50' : isHol ? 'bg-amber-50' : ''}`}>
                          <p className="text-xs font-medium uppercase" style={{ color: theme.gray[500] }}>{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</p>
                          <p className={`text-xl font-bold mt-1 ${isToday ? 'bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto' : ''}`}>{d.getDate()}</p>
                          {isHol && <p className="text-xs mt-1 truncate" style={{ color: theme.warning }}><Star className="w-3 h-3 inline" /> {getHolidayName(d)}</p>}
                          {isWE && !isHol && <p className="text-xs mt-1" style={{ color: theme.gray[400] }}>Week-end</p>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-7">
                    {weekDays.map((d, i) => {
                      const isWE = isWeekend(d);
                      const isHol = isHoliday(d);
                      const shifts = getShiftsForDay(d);
                      return (
                        <div key={i} className={`p-3 border-r last:border-r-0 min-h-[250px] ${isWE ? 'bg-gray-50' : isHol ? 'bg-amber-50' : ''}`}>
                          {shifts.map(shift => (
                            <div key={shift} className="mb-3">
                              <div className="flex items-center gap-1 mb-1">
                                <ShiftIcon shift={shift} className="w-3 h-3" style={{ color: theme.gray[400] }} />
                                <span className="text-xs font-medium" style={{ color: theme.gray[500] }}>{getShiftLabel(shift)}</span>
                              </div>
                              {getAssigned(d, shift).map(a => (
                                <div 
                                  key={a.id} 
                                  onClick={() => canEdit && toggleAssignment(d, a.id, shift)} 
                                  className={`text-xs px-2 py-1.5 rounded-lg text-white mb-1 ${canEdit ? 'cursor-pointer hover:opacity-80' : ''} ${a.id === currentUser?.id ? 'ring-2 ring-yellow-400' : ''}`} 
                                  style={{ backgroundColor: a.color }}
                                >
                                  Dr {a.name.split(' ')[1] === 'EL' ? 'EL KAMEL' : a.name.split(' ')[1]}
                                </div>
                              ))}
                              {canEdit && (
                                <select 
                                  className="w-full text-xs p-1.5 border rounded-lg mt-1" 
                                  value="" 
                                  onChange={(e) => e.target.value && toggleAssignment(d, parseInt(e.target.value), shift)}
                                >
                                  <option value="">+ Ajouter</option>
                                  {anesthesists.filter(a => a.role !== 'viewer' && !getAssigned(d, shift).some(assigned => assigned.id === a.id)).map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Vue Mois */}
              {viewMode === 'month' && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-7 border-b">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                      <div key={day} className="p-2 text-center text-xs font-semibold border-r last:border-r-0" style={{ color: theme.gray[500] }}>{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {getDaysInMonth(currentMonth).map((d, i) => {
                      if (!d) return <div key={`empty-${i}`} className="p-2 min-h-[80px] border-r border-b last:border-r-0 bg-gray-50" />;
                      const isToday = d.toDateString() === new Date().toDateString();
                      const isWE = isWeekend(d);
                      const isHol = isHoliday(d);
                      const shifts = getShiftsForDay(d);
                      return (
                        <div key={formatDateKey(d)} className={`p-2 min-h-[80px] border-r border-b last:border-r-0 ${isWE ? 'bg-gray-50' : isHol ? 'bg-amber-50' : ''}`}>
                          <p className={`text-sm font-bold mb-1 ${isToday ? 'text-blue-600' : ''}`}>{d.getDate()}</p>
                          {isHol && <div className="text-xs mb-1"><Star className="w-3 h-3 inline" style={{ color: theme.warning }} /></div>}
                          {shifts.map(shift => getAssigned(d, shift).slice(0, 2).map(a => (
                            <div key={`${shift}-${a.id}`} className="text-xs px-1 py-0.5 rounded text-white mb-0.5 truncate" style={{ backgroundColor: a.color, fontSize: '9px' }}>
                              <ShiftIcon shift={shift} className="w-2 h-2 inline mr-0.5" />
                              {a.name.split(' ')[1]?.substring(0, 3)}
                            </div>
                          )))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Filtres */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 mt-6">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-medium text-sm" style={{ color: theme.gray[700] }}><Users className="w-4 h-4 inline mr-1" />Filtrer :</span>
                  {anesthesists.filter(a => a.role !== 'viewer').map(a => (
                    <button 
                      key={a.id} 
                      onClick={() => { 
                        // Si tous sont sélectionnés, on sélectionne uniquement celui cliqué
                        // Sinon, on ajoute/retire de la sélection
                        const allSelected = selectedFilters.size === anesthesists.filter(x => x.role !== 'viewer').length;
                        if (allSelected) {
                          setSelectedFilters(new Set([a.id]));
                        } else if (selectedFilters.has(a.id) && selectedFilters.size === 1) {
                          // Si c'est le dernier sélectionné, remettre tous
                          setSelectedFilters(new Set(anesthesists.filter(x => x.role !== 'viewer').map(x => x.id)));
                        } else if (selectedFilters.has(a.id)) {
                          const f = new Set(selectedFilters);
                          f.delete(a.id);
                          setSelectedFilters(f);
                        } else {
                          const f = new Set(selectedFilters);
                          f.add(a.id);
                          setSelectedFilters(f);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${selectedFilters.has(a.id) ? 'text-white' : ''} ${a.id === currentUser?.id ? 'ring-2 ring-offset-1 ring-yellow-400' : ''}`}
                      style={selectedFilters.has(a.id) ? { backgroundColor: a.color, borderColor: a.color } : { borderColor: theme.gray[200], color: theme.gray[400] }}
                    >
                      {a.name.split(' ')[1] === 'EL' ? 'EL KAMEL' : a.name.split(' ')[1]} {a.id === currentUser?.id && '(moi)'}
                    </button>
                  ))}
                  <button onClick={() => setSelectedFilters(new Set(anesthesists.filter(a => a.role !== 'viewer').map(a => a.id)))} className="text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: theme.gray[100] }}>Tous</button>
                  <button onClick={() => setSelectedFilters(new Set())} className="text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: theme.gray[100] }}>Aucun</button>
                </div>
              </div>
            </div>
          )}
          {/* BOURSE AUX ÉCHANGES */}
          {currentView === 'exchange' && !isViewer && (
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
          {currentView === 'unavailabilities' && !isViewer && (
            <div>
              <div className="flex justify-between mb-6">
                <p style={{ color: theme.gray[500] }}>Déclarez vos congés et absences</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <h3 className="font-bold mb-4">Ajouter une indisponibilité</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target;
                  await addUnavailability({
                    anesthesist_id: currentUser.id,
                    date_start: form.date_start.value,
                    date_end: form.date_end.value,
                    reason: form.reason.value
                  });
                  form.reset();
                }} className="flex gap-4 items-end flex-wrap">
                  <div>
                    <label className="block text-sm font-medium mb-1">Du</label>
                    <input type="date" name="date_start" required className="px-3 py-2 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Au</label>
                    <input type="date" name="date_end" required className="px-3 py-2 border rounded-xl" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Motif (optionnel)</label>
                    <input type="text" name="reason" placeholder="Congés, formation..." className="w-full px-3 py-2 border rounded-xl" />
                  </div>
                  <button type="submit" className="px-4 py-2 text-white rounded-xl" style={{ backgroundColor: theme.primary }}>Ajouter</button>
                </form>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold mb-4">Mes indisponibilités</h3>
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
                <h3 className="font-bold mb-4">Gestion des ETP</h3>
                <p className="text-sm mb-4" style={{ color: theme.gray[500] }}>Ajustez le pourcentage de temps de travail de chaque anesthésiste.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {anesthesists.filter(a => a.role !== 'viewer').map(a => (
                    <div key={a.id} className="p-4 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                        <span className="font-medium text-sm">{a.name.split(' ')[1]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="10" 
                          max="100" 
                          step="5"
                          value={Math.round((a.etp || 0.5) * 100)} 
                          onChange={(e) => updateETP(a.id, parseInt(e.target.value) / 100)}
                          className="w-20 px-2 py-1 border rounded-lg text-center text-sm"
                        />
                        <span className="text-sm" style={{ color: theme.gray[500] }}>%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <h3 className="font-bold mb-4">Transférer le rôle admin</h3>
                <p className="text-sm mb-4" style={{ color: theme.gray[500] }}>Attention : cette action est irréversible.</p>
                <select 
                  className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-xl" 
                  onChange={(e) => e.target.value && transferAdmin(parseInt(e.target.value))}
                  defaultValue=""
                >
                  <option value="">Choisir un anesthésiste...</option>
                  {anesthesists.filter(a => a.id !== currentUser?.id && a.role !== 'viewer').map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold mb-4">Jours fériés {new Date().getFullYear()}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {getHolidaysForYear(new Date().getFullYear()).map(h => (
                    <div key={h.date} className="p-2 rounded-lg text-sm" style={{ backgroundColor: theme.gray[50] }}>
                      <span className="font-medium">{new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      <span className="ml-2" style={{ color: theme.gray[500] }}>{h.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {currentView === 'settings' && !isViewer && (
            <div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <h3 className="font-bold mb-4">Lien calendrier ICS</h3>
                <p className="text-sm mb-4" style={{ color: theme.gray[500] }}>Ajoutez ce lien à Google Agenda, Outlook ou Apple Calendar.</p>
                <div className="flex gap-2">
                  <input type="text" readOnly value={`${window.location.origin}/api/calendar/${currentUser?.ics_token}.ics`} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50" />
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/calendar/${currentUser?.ics_token}.ics`); alert('Lien copié !'); }} className="px-4 py-2 rounded-xl border border-gray-200 flex items-center gap-2 hover:bg-gray-50">
                    <Copy className="w-4 h-4" /> Copier
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold mb-4">Notifications par email</h3>
                {[
                  { key: 'notify_new_planning', label: 'Nouveau planning généré' },
                  { key: 'notify_swap_request', label: "Demande d'échange reçue" },
                  { key: 'notify_swap_response', label: 'Réponse à ma demande' },
                  { key: 'notify_exchange_board', label: 'Nouvelle annonce sur la bourse' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 mb-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={emailPreferences[key] || false} 
                      onChange={(e) => updateEmailPreferences({ ...emailPreferences, [key]: e.target.checked })} 
                      className="w-5 h-5 rounded" 
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
      {/* MODAL GÉNÉRATION */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Générer le planning</h2>
              <button onClick={() => setShowGenerateModal(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm mb-6" style={{ color: theme.gray[600] }}>
                Règles appliquées : semaines complètes avec rotation des postes, équilibrage WE/fériés, celui d'astreinte vendredi = astreinte WE.
              </p>
              
              <div className="space-y-4">
                {/* Option 1: Nouveau planning intégral */}
                <button
                  onClick={() => generateSchedule('new')}
                  disabled={isGenerating}
                  className="w-full p-4 rounded-xl border-2 text-left hover:border-blue-500 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-6 h-6" style={{ color: theme.danger }} />
                    <div>
                      <p className="font-bold">Nouveau planning intégral</p>
                      <p className="text-sm" style={{ color: theme.gray[500] }}>Efface tout à partir d'aujourd'hui et régénère sur 18 mois</p>
                    </div>
                  </div>
                </button>
                
                {/* Option 2: Plage de dates */}
                <div className="p-4 rounded-xl border-2">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-6 h-6" style={{ color: theme.accent }} />
                    <div>
                      <p className="font-bold">Générer une plage spécifique</p>
                      <p className="text-sm" style={{ color: theme.gray[500] }}>Régénère uniquement la période sélectionnée (équilibre basé sur l'historique)</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Date début</label>
                      <input 
                        type="date" 
                        id="genStartDate"
                        min={formatDateKey(new Date())}
                        max={formatDateKey(new Date(new Date().setMonth(new Date().getMonth() + 18)))}
                        defaultValue={formatDateKey(new Date())}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date fin</label>
                      <input 
                        type="date" 
                        id="genEndDate"
                        min={formatDateKey(new Date())}
                        max={formatDateKey(new Date(new Date().setMonth(new Date().getMonth() + 18)))}
                        defaultValue={formatDateKey(new Date(new Date().setMonth(new Date().getMonth() + 3)))}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      const startInput = document.getElementById('genStartDate');
                      const endInput = document.getElementById('genEndDate');
                      if (startInput && endInput) {
                        generateSchedule('range', startInput.value, endInput.value);
                      }
                    }}
                    disabled={isGenerating}
                    className="w-full py-2 text-white rounded-xl font-medium disabled:opacity-50"
                    style={{ backgroundColor: theme.accent }}
                  >
                    Générer cette plage
                  </button>
                </div>
              </div>

              {isGenerating && (
                <div className="flex items-center justify-center gap-2 text-sm mt-4" style={{ color: theme.gray[500] }}>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Génération en cours...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ETP */}
      {showETPModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Gestion des ETP</h2>
              <button onClick={() => setShowETPModal(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm mb-4" style={{ color: theme.gray[500] }}>
                Ajustez le pourcentage de temps de travail. La répartition des gardes sera proportionnelle à l'ETP.
              </p>
              <div className="space-y-3">
                {anesthesists.filter(a => a.role !== 'viewer').map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: theme.gray[50] }}>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: a.color }} />
                      <span className="font-medium">{a.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        step="5"
                        value={Math.round((a.etp || 0.5) * 100)} 
                        onChange={(e) => updateETP(a.id, parseInt(e.target.value) / 100)}
                        className="w-24"
                      />
                      <span className="w-12 text-center font-bold" style={{ color: theme.primary }}>{Math.round((a.etp || 0.5) * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
                  {anesthesists.filter(a => a.id !== currentUser?.id && a.role !== 'viewer').map(a => (
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
