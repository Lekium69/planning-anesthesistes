import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar, Users, RefreshCw, Download, Play, TrendingUp, AlertTriangle, UserPlus, Settings, LogOut, ChevronLeft, ChevronRight, Phone, Mail, Eye, EyeOff, Edit2, Trash2, Save, X, Check } from 'lucide-react';

// ============================================
// CONFIGURATION SUPABASE
// ============================================
const SUPABASE_URL = 'https://vqlieplrtrvqcvllhmob.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxbGllcGxydHJ2cWN2bGxobW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMDA4MzMsImV4cCI6MjA4MDg3NjgzM30.BcK8sDePzCwSC3BMSRLagdZUQhevdRIrNshLsP1MgW8';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// COULEURS PAR DÉFAUT
// ============================================
const DEFAULT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

// ============================================
// JOURS FÉRIÉS 2025-2026
// ============================================
const FRENCH_HOLIDAYS = [
  // 2025
  { date: '2025-01-01', name: "Jour de l'an" },
  { date: '2025-04-21', name: 'Lundi de Pâques' },
  { date: '2025-05-01', name: 'Fête du Travail' },
  { date: '2025-05-08', name: 'Victoire 1945' },
  { date: '2025-05-29', name: 'Ascension' },
  { date: '2025-06-09', name: 'Lundi de Pentecôte' },
  { date: '2025-07-14', name: 'Fête Nationale' },
  { date: '2025-08-15', name: 'Assomption' },
  { date: '2025-11-01', name: 'Toussaint' },
  { date: '2025-11-11', name: 'Armistice 1918' },
  { date: '2025-12-25', name: 'Noël' },
  // 2026
  { date: '2026-01-01', name: "Jour de l'an" },
  { date: '2026-04-06', name: 'Lundi de Pâques' },
  { date: '2026-05-01', name: 'Fête du Travail' },
  { date: '2026-05-08', name: 'Victoire 1945' },
  { date: '2026-05-14', name: 'Ascension' },
  { date: '2026-05-25', name: 'Lundi de Pentecôte' },
  { date: '2026-07-14', name: 'Fête Nationale' },
  { date: '2026-08-15', name: 'Assomption' },
  { date: '2026-11-01', name: 'Toussaint' },
  { date: '2026-11-11', name: 'Armistice 1918' },
  { date: '2026-12-25', name: 'Noël' },
];

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
const AnesthesistScheduler = () => {
  // États d'authentification
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // États principaux
  const [anesthesists, setAnesthesists] = useState([]);
  const [remplacants, setRemplacants] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [unavailabilities, setUnavailabilities] = useState([]);
  
  // États de navigation
  const [activeTab, setActiveTab] = useState('semaine');
  const [currentWeekStart, setCurrentWeekStart] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // États UI
  const [showStats, setShowStats] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const filtersInitialized = useRef(false);

  // États modaux
  const [showETPModal, setShowETPModal] = useState(false);
  const [showRemplacantModal, setShowRemplacantModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingRemplacant, setEditingRemplacant] = useState(null);
  const [editingAnesth, setEditingAnesth] = useState(null);

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

  const isHoliday = (date) => {
    const dateKey = formatDateKey(date);
    return FRENCH_HOLIDAYS.some(h => h.date === dateKey);
  };

  const getHolidayName = (date) => {
    const dateKey = formatDateKey(date);
    const holiday = FRENCH_HOLIDAYS.find(h => h.date === dateKey);
    return holiday ? holiday.name : null;
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const canEdit = () => {
    return currentUser && (currentUser.role === 'admin' || currentUser.role === 'user');
  };

  const isAdmin = () => {
    return currentUser && currentUser.role === 'admin';
  };

  const isViewer = () => {
    return currentUser && currentUser.role === 'viewer';
  };

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================
  const loadData = async () => {
    try {
      // Charger les anesthésistes (non remplaçants)
      const { data: anesthData } = await supabase
        .from('anesthesists')
        .select('*')
        .or('is_remplacant.is.null,is_remplacant.eq.false')
        .neq('role', 'viewer')
        .order('name');
      
      if (anesthData) {
        const anesthWithColors = anesthData.map((a, i) => ({
          ...a,
          color: a.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
        }));
        setAnesthesists(anesthWithColors);
        
        if (selectedFilters.size === 0 && !filtersInitialized.current) {
          setSelectedFilters(new Set(anesthWithColors.map(a => a.id)));
          filtersInitialized.current = true;
        }
      }

      // Charger les remplaçants
      const { data: remplacantData } = await supabase
        .from('remplacants')
        .select('*')
        .eq('actif', true)
        .order('name');
      
      if (remplacantData) {
        setRemplacants(remplacantData);
      }

      // Charger le planning
      const { data: scheduleData } = await supabase
        .from('schedule')
        .select('*')
        .order('date');
      
      if (scheduleData) {
        setSchedule(scheduleData);
      }

      // Charger les indisponibilités
      const { data: unavailData } = await supabase
        .from('unavailabilities')
        .select('*');
      
      if (unavailData) {
        setUnavailabilities(unavailData);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  // ============================================
  // AUTHENTIFICATION
  // ============================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    const { data: user, error } = await supabase
      .from('anesthesists')
      .select('*')
      .eq('email', loginEmail.toLowerCase())
      .single();

    if (error || !user) {
      setLoginError('Email non trouvé');
      return;
    }

    if (loginPassword !== 'planning2025') {
      setLoginError('Mot de passe incorrect');
      return;
    }

    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('currentUser');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoginError('');
    setResetLoading(true);

    // Vérifier si l'email existe
    const { data: user, error } = await supabase
      .from('anesthesists')
      .select('email, name')
      .eq('email', loginEmail.toLowerCase())
      .single();

    if (error || !user) {
      setLoginError('Aucun compte associé à cet email');
      setResetLoading(false);
      return;
    }

    // Envoyer l'email via Supabase Auth (si configuré) ou afficher les instructions
    try {
      // Option 1: Si vous avez Supabase Auth configuré
      // const { error: resetError } = await supabase.auth.resetPasswordForEmail(loginEmail);
      
      // Option 2: Pour l'instant, on simule l'envoi et affiche un message
      // Dans une vraie implémentation, vous utiliseriez un service email (Resend, SendGrid, etc.)
      
      setResetEmailSent(true);
      setResetLoading(false);
    } catch (err) {
      setLoginError('Erreur lors de l\'envoi. Veuillez réessayer.');
      setResetLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsLoggedIn(true);
    }
    setCurrentWeekStart(getMonday(new Date()));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  // ============================================
  // GESTION DU PLANNING
  // ============================================
  const getScheduleForDate = (date, shift) => {
    const dateKey = formatDateKey(date);
    return schedule.filter(s => s.date === dateKey && s.shift === shift);
  };

  const getAnesthesistById = (id) => {
    return anesthesists.find(a => a.id === id);
  };

  const getRemplacantById = (id) => {
    return remplacants.find(r => r.id === id);
  };

  const toggleAssignment = async (date, personId, shift, isRemplacant = false) => {
    if (!canEdit()) return;
    
    const dateKey = formatDateKey(date);
    const existing = schedule.find(s => 
      s.date === dateKey && 
      s.shift === shift && 
      (isRemplacant ? s.remplacant_id === personId : s.anesthesist_id === personId)
    );

    if (existing) {
      await supabase.from('schedule').delete().eq('id', existing.id);
    } else {
      const newEntry = {
        date: dateKey,
        shift,
        year: date.getFullYear(),
        ...(isRemplacant ? { remplacant_id: personId } : { anesthesist_id: personId })
      };
      await supabase.from('schedule').insert(newEntry);
    }
    
    loadData();
  };

  // ============================================
  // DÉTECTION DES INCOHÉRENCES
  // ============================================
  const getIncoherences = () => {
    const incoherences = [];
    const dateMap = {};

    // Grouper par date
    schedule.forEach(s => {
      if (!dateMap[s.date]) {
        dateMap[s.date] = { astreinte: [], astreinte_we: [], bloc: [], consultation: [] };
      }
      if (dateMap[s.date][s.shift]) {
        dateMap[s.date][s.shift].push(s);
      }
    });

    Object.entries(dateMap).forEach(([dateStr, shifts]) => {
      const date = new Date(dateStr);
      const isWE = isWeekend(date);
      const isHol = isHoliday(date);

      if (isWE || isHol) {
        // Week-end ou férié: doit avoir exactement 1 personne d'astreinte WE
        const astreinteWE = shifts.astreinte_we || [];
        if (astreinteWE.length === 0) {
          incoherences.push({
            date: dateStr,
            type: 'missing_astreinte_we',
            message: `${isHol ? 'Jour férié' : 'Week-end'} sans astreinte`,
            severity: 'error'
          });
        } else if (astreinteWE.length > 1) {
          incoherences.push({
            date: dateStr,
            type: 'multiple_astreinte_we',
            message: `${astreinteWE.length} personnes d'astreinte WE (devrait être 1)`,
            severity: 'error'
          });
        }
      } else {
        // Jour de semaine: vérifier le schéma classique
        const astreinte = shifts.astreinte || [];
        const bloc = shifts.bloc || [];
        const consultation = shifts.consultation || [];

        // Doit avoir 1 astreinte
        if (astreinte.length === 0) {
          incoherences.push({
            date: dateStr,
            type: 'missing_astreinte',
            message: 'Pas d\'astreinte assignée',
            severity: 'error'
          });
        } else if (astreinte.length > 1) {
          incoherences.push({
            date: dateStr,
            type: 'multiple_astreinte',
            message: `${astreinte.length} personnes d'astreinte (devrait être 1)`,
            severity: 'warning'
          });
        }

        // Doit avoir 2 blocs (1 avec astreinte, 1 simple)
        if (bloc.length < 2) {
          incoherences.push({
            date: dateStr,
            type: 'missing_bloc',
            message: `Seulement ${bloc.length} bloc(s) (devrait être 2)`,
            severity: 'warning'
          });
        }

        // Doit avoir 1 consultation
        if (consultation.length === 0) {
          incoherences.push({
            date: dateStr,
            type: 'missing_consultation',
            message: 'Pas de consultation assignée',
            severity: 'warning'
          });
        }

        // Vérifier que la personne d'astreinte est aussi au bloc
        if (astreinte.length > 0 && bloc.length > 0) {
          const astreinteIds = astreinte.map(a => a.anesthesist_id);
          const blocIds = bloc.map(b => b.anesthesist_id);
          const astreinteAlsoBloc = astreinteIds.some(id => blocIds.includes(id));
          
          if (!astreinteAlsoBloc) {
            incoherences.push({
              date: dateStr,
              type: 'astreinte_not_in_bloc',
              message: 'La personne d\'astreinte n\'est pas au bloc',
              severity: 'warning'
            });
          }
        }
      }
    });

    // Trier par date
    return incoherences.sort((a, b) => a.date.localeCompare(b.date));
  };

  // ============================================
  // NAVIGATION
  // ============================================
  const getWeekDays = (startDate, includWeekend = true) => {
    const days = [];
    const numDays = includWeekend ? 7 : 5;
    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const changeWeek = (delta) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (delta * 7));
    setCurrentWeekStart(getMonday(newDate));
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentMonth(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(getMonday(new Date()));
    setCurrentMonth(new Date());
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Ajuster pour commencer par Lundi
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // ============================================
  // FILTRES
  // ============================================
  const handleFilterClick = (anesthId) => {
    const newFilters = new Set(selectedFilters);
    const allIds = anesthesists.map(a => a.id);
    const allSelected = allIds.every(id => selectedFilters.has(id));

    if (allSelected) {
      newFilters.clear();
      newFilters.add(anesthId);
    } else if (newFilters.has(anesthId)) {
      newFilters.delete(anesthId);
      if (newFilters.size === 0) {
        allIds.forEach(id => newFilters.add(id));
      }
    } else {
      newFilters.add(anesthId);
    }
    
    setSelectedFilters(newFilters);
  };

  const selectAllFilters = () => {
    setSelectedFilters(new Set(anesthesists.map(a => a.id)));
  };

  const selectNoFilters = () => {
    filtersInitialized.current = true;
    setSelectedFilters(new Set());
  };

  // ============================================
  // STATISTIQUES
  // ============================================
  const calculateStats = () => {
    const stats = {};
    anesthesists.forEach(a => {
      stats[a.id] = {
        ...a,
        semaines: 0,
        astreinte: 0,
        astreinte_we: 0,
        bloc: 0,
        consultation: 0,
        feries: 0
      };
    });

    const weeksWorked = {};
    anesthesists.forEach(a => { weeksWorked[a.id] = new Set(); });

    schedule.forEach(s => {
      if (!s.anesthesist_id || !stats[s.anesthesist_id]) return;
      
      const stat = stats[s.anesthesist_id];
      const date = new Date(s.date);
      const weekNum = getWeekNumber(date);
      
      weeksWorked[s.anesthesist_id].add(weekNum);
      
      if (s.shift === 'astreinte') stat.astreinte++;
      if (s.shift === 'astreinte_we') stat.astreinte_we++;
      if (s.shift === 'bloc') stat.bloc++;
      if (s.shift === 'consultation') stat.consultation++;
      
      if (isHoliday(date)) stat.feries++;
    });

    Object.keys(stats).forEach(id => {
      stats[id].semaines = weeksWorked[id].size;
    });

    return Object.values(stats);
  };

  // ============================================
  // GESTION REMPLAÇANTS
  // ============================================
  const saveRemplacant = async (remplacant) => {
    if (!isAdmin()) return;
    
    if (remplacant.id) {
      await supabase.from('remplacants').update({
        name: remplacant.name,
        email: remplacant.email,
        phone: remplacant.phone,
        specialite: remplacant.specialite,
        notes: remplacant.notes,
        updated_at: new Date().toISOString()
      }).eq('id', remplacant.id);
    } else {
      await supabase.from('remplacants').insert({
        name: remplacant.name,
        email: remplacant.email,
        phone: remplacant.phone,
        specialite: remplacant.specialite,
        notes: remplacant.notes
      });
    }
    
    setEditingRemplacant(null);
    loadData();
  };

  const deleteRemplacant = async (id) => {
    if (!isAdmin()) return;
    if (!confirm('Supprimer ce remplaçant ?')) return;
    
    await supabase.from('remplacants').update({ actif: false }).eq('id', id);
    loadData();
  };

  // ============================================
  // GESTION ANESTHÉSISTES (ADMIN)
  // ============================================
  const saveAnesthesist = async (anesth) => {
    if (!isAdmin()) return;
    
    if (anesth.id) {
      await supabase.from('anesthesists').update({
        name: anesth.name,
        email: anesth.email,
        phone: anesth.phone,
        role: anesth.role,
        etp: anesth.etp
      }).eq('id', anesth.id);
    } else {
      await supabase.from('anesthesists').insert({
        name: anesth.name,
        email: anesth.email,
        phone: anesth.phone,
        role: anesth.role || 'user',
        etp: anesth.etp || 1
      });
    }
    
    setEditingAnesth(null);
    loadData();
  };

  const deleteAnesthesist = async (id) => {
    if (!isAdmin()) return;
    if (!confirm('Supprimer ce médecin ? (Les données de planning seront conservées)')) return;
    
    await supabase.from('anesthesists').delete().eq('id', id);
    loadData();
  };

  // ============================================
  // RENDU - ÉCRAN DE CONNEXION
  // ============================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Planning Anesthésistes</h1>
            <p className="text-gray-500 mt-2">Clinique Herbert</p>
          </div>

          {/* Mode mot de passe oublié */}
          {forgotPasswordMode ? (
            <div>
              {resetEmailSent ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">Email envoyé !</h2>
                  <p className="text-gray-600 text-sm mb-6">
                    Si un compte existe avec l'adresse <strong>{loginEmail}</strong>, vous recevrez un lien de réinitialisation.
                  </p>
                  <p className="text-gray-500 text-xs mb-6">
                    💡 En attendant la configuration email, contactez l'administrateur pour réinitialiser votre mot de passe.
                  </p>
                  <button
                    onClick={() => {
                      setForgotPasswordMode(false);
                      setResetEmailSent(false);
                      setLoginError('');
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    ← Retour à la connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="text-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Mot de passe oublié ?</h2>
                    <p className="text-gray-500 text-sm mt-1">
                      Entrez votre email pour recevoir un lien de réinitialisation
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="votre.email@example.com"
                      required
                    />
                  </div>

                  {loginError && (
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                      {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Envoyer le lien
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordMode(false);
                      setLoginError('');
                    }}
                    className="w-full text-gray-500 hover:text-gray-700 py-2 text-sm"
                  >
                    ← Retour à la connexion
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Mode connexion normal */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="votre.email@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Se connecter
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordMode(true);
                    setLoginError('');
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (isLoading || !currentWeekStart) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const weekDays = getWeekDays(currentWeekStart);
  const stats = calculateStats();
  const incoherences = getIncoherences();

  // ============================================
  // RENDU - APPLICATION PRINCIPALE
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-800">Planning Anesthésistes</h1>
              {isViewer() && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Consultation seule
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {currentUser?.name}
                <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                  {currentUser?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-56 bg-white shadow-sm min-h-screen p-4">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('semaine')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'semaine' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Semaine
            </button>
            
            <button
              onClick={() => setActiveTab('mois')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'mois' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Mois
            </button>

            <button
              onClick={() => setActiveTab('incoherences')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'incoherences' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              Incohérences
              {incoherences.length > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {incoherences.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('remplacants')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'remplacants' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              Remplaçants
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'stats' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Statistiques
            </button>

            {isAdmin() && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-5 h-5" />
                Administration
              </button>
            )}
          </nav>

          {/* Filtres */}
          {(activeTab === 'semaine' || activeTab === 'mois') && (
            <div className="mt-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Filtrer</h3>
              <div className="space-y-1">
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={selectAllFilters}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Tous
                  </button>
                  <button
                    onClick={selectNoFilters}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Aucun
                  </button>
                </div>
                {anesthesists.map(a => (
                  <button
                    key={a.id}
                    onClick={() => handleFilterClick(a.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedFilters.has(a.id) ? 'bg-gray-100' : 'opacity-40'
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                    <span className="truncate">{a.name.split(' ')[1]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contenu principal */}
        <div className="flex-1 p-6">
          {/* ============================================ */}
          {/* ONGLET SEMAINE */}
          {/* ============================================ */}
          {activeTab === 'semaine' && (
            <div>
              {/* Navigation semaine */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => changeWeek(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="text-center">
                    <button
                      onClick={goToToday}
                      className="text-xs text-indigo-600 hover:underline mb-1"
                    >
                      Aujourd'hui
                    </button>
                    <h2 className="text-xl font-bold">
                      Semaine {getWeekNumber(currentWeekStart)}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {currentWeekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - {' '}
                      {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => changeWeek(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Grille semaine */}
              <div className="grid grid-cols-7 gap-3">
                {weekDays.map((date) => {
                  const isToday = formatDateKey(date) === formatDateKey(new Date());
                  const isWE = isWeekend(date);
                  const isHol = isHoliday(date);
                  const holidayName = getHolidayName(date);

                  return (
                    <div
                      key={formatDateKey(date)}
                      className={`bg-white rounded-lg shadow-sm p-3 min-h-[350px] ${
                        isToday ? 'ring-2 ring-indigo-500' : ''
                      } ${isWE ? 'bg-gray-50' : ''} ${isHol ? 'bg-orange-50' : ''}`}
                    >
                      {/* En-tête jour */}
                      <div className="text-center mb-3 pb-2 border-b">
                        <div className={`text-xs uppercase ${isWE ? 'text-gray-400' : 'text-gray-500'}`}>
                          {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </div>
                        <div className={`text-lg font-bold ${isWE ? 'text-gray-400' : 'text-gray-800'}`}>
                          {date.getDate()}
                        </div>
                        {isHol && (
                          <div className="text-xs text-orange-600 font-medium">
                            🎉 {holidayName}
                          </div>
                        )}
                      </div>

                      {/* Contenu selon jour */}
                      {isWE || isHol ? (
                        // Week-end ou férié: seulement astreinte WE
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-2">🌙 Astreinte</div>
                          {getScheduleForDate(date, 'astreinte_we').map(s => {
                            const person = getAnesthesistById(s.anesthesist_id);
                            if (!person || !selectedFilters.has(person.id)) return null;
                            return (
                              <div
                                key={s.id}
                                onClick={() => canEdit() && toggleAssignment(date, person.id, 'astreinte_we')}
                                className={`text-xs px-2 py-1.5 rounded text-white mb-1 ${canEdit() ? 'cursor-pointer hover:opacity-80' : ''}`}
                                style={{ backgroundColor: person.color }}
                              >
                                {person.name.split(' ').slice(-1)[0]}
                              </div>
                            );
                          })}
                          {canEdit() && (
                            <select
                              className="w-full text-xs mt-2 p-1.5 border rounded"
                              value=""
                              onChange={(e) => e.target.value && toggleAssignment(date, parseInt(e.target.value), 'astreinte_we')}
                            >
                              <option value="">+ Ajouter</option>
                              {anesthesists.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                              ))}
                              <optgroup label="Remplaçants">
                                {remplacants.map(r => (
                                  <option key={`r-${r.id}`} value={`r-${r.id}`}>{r.name}</option>
                                ))}
                              </optgroup>
                            </select>
                          )}
                        </div>
                      ) : (
                        // Jour de semaine: astreinte, bloc, consultation
                        <div className="space-y-3">
                          {/* Astreinte */}
                          <div>
                            <div className="text-xs font-semibold text-gray-600 mb-1">🌙 Astreinte</div>
                            {getScheduleForDate(date, 'astreinte').map(s => {
                              const person = getAnesthesistById(s.anesthesist_id);
                              if (!person || !selectedFilters.has(person.id)) return null;
                              return (
                                <div
                                  key={s.id}
                                  onClick={() => canEdit() && toggleAssignment(date, person.id, 'astreinte')}
                                  className={`text-xs px-2 py-1 rounded text-white mb-1 ${canEdit() ? 'cursor-pointer hover:opacity-80' : ''}`}
                                  style={{ backgroundColor: person.color }}
                                >
                                  {person.name.split(' ').slice(-1)[0]}
                                </div>
                              );
                            })}
                            {canEdit() && (
                              <select
                                className="w-full text-xs mt-1 p-1 border rounded"
                                value=""
                                onChange={(e) => e.target.value && toggleAssignment(date, parseInt(e.target.value), 'astreinte')}
                              >
                                <option value="">+ Ajouter</option>
                                {anesthesists.map(a => (
                                  <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                              </select>
                            )}
                          </div>

                          {/* Bloc */}
                          <div>
                            <div className="text-xs font-semibold text-gray-600 mb-1">🏥 Bloc</div>
                            {getScheduleForDate(date, 'bloc').map(s => {
                              const person = getAnesthesistById(s.anesthesist_id);
                              if (!person || !selectedFilters.has(person.id)) return null;
                              return (
                                <div
                                  key={s.id}
                                  onClick={() => canEdit() && toggleAssignment(date, person.id, 'bloc')}
                                  className={`text-xs px-2 py-1 rounded text-white mb-1 ${canEdit() ? 'cursor-pointer hover:opacity-80' : ''}`}
                                  style={{ backgroundColor: person.color }}
                                >
                                  {person.name.split(' ').slice(-1)[0]}
                                </div>
                              );
                            })}
                            {canEdit() && (
                              <select
                                className="w-full text-xs mt-1 p-1 border rounded"
                                value=""
                                onChange={(e) => e.target.value && toggleAssignment(date, parseInt(e.target.value), 'bloc')}
                              >
                                <option value="">+ Ajouter</option>
                                {anesthesists.map(a => (
                                  <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                                <optgroup label="Remplaçants">
                                  {remplacants.map(r => (
                                    <option key={`r-${r.id}`} value={`r-${r.id}`}>{r.name}</option>
                                  ))}
                                </optgroup>
                              </select>
                            )}
                          </div>

                          {/* Consultation */}
                          <div>
                            <div className="text-xs font-semibold text-gray-600 mb-1">👨‍⚕️ Consult</div>
                            {getScheduleForDate(date, 'consultation').map(s => {
                              const person = getAnesthesistById(s.anesthesist_id);
                              if (!person || !selectedFilters.has(person.id)) return null;
                              return (
                                <div
                                  key={s.id}
                                  onClick={() => canEdit() && toggleAssignment(date, person.id, 'consultation')}
                                  className={`text-xs px-2 py-1 rounded text-white mb-1 ${canEdit() ? 'cursor-pointer hover:opacity-80' : ''}`}
                                  style={{ backgroundColor: person.color }}
                                >
                                  {person.name.split(' ').slice(-1)[0]}
                                </div>
                              );
                            })}
                            {canEdit() && (
                              <select
                                className="w-full text-xs mt-1 p-1 border rounded"
                                value=""
                                onChange={(e) => e.target.value && toggleAssignment(date, parseInt(e.target.value), 'consultation')}
                              >
                                <option value="">+ Ajouter</option>
                                {anesthesists.map(a => (
                                  <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* ONGLET MOIS */}
          {/* ============================================ */}
          {activeTab === 'mois' && (
            <div>
              {/* Navigation mois */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="text-center">
                    <button
                      onClick={goToToday}
                      className="text-xs text-indigo-600 hover:underline mb-1"
                    >
                      Aujourd'hui
                    </button>
                    <h2 className="text-xl font-bold capitalize">
                      {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </h2>
                  </div>
                  
                  <button
                    onClick={() => changeMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Grille mois */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div key={day} className="text-center font-semibold text-gray-600 py-2 text-sm">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {getDaysInMonth(currentMonth).map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="min-h-[100px]" />;
                    }

                    const isToday = formatDateKey(date) === formatDateKey(new Date());
                    const isWE = isWeekend(date);
                    const isHol = isHoliday(date);

                    return (
                      <div
                        key={formatDateKey(date)}
                        className={`border rounded-lg p-2 min-h-[100px] ${
                          isToday ? 'border-indigo-500 bg-indigo-50' : ''
                        } ${isWE ? 'bg-gray-50' : ''} ${isHol ? 'bg-orange-50' : ''}`}
                      >
                        <div className={`text-center font-semibold mb-1 ${isWE ? 'text-gray-400' : ''}`}>
                          {date.getDate()}
                          {isHol && <span className="ml-1">🎉</span>}
                        </div>
                        <div className="space-y-0.5 text-xs">
                          {(isWE || isHol ? getScheduleForDate(date, 'astreinte_we') : getScheduleForDate(date, 'astreinte'))
                            .map(s => {
                              const person = getAnesthesistById(s.anesthesist_id);
                              if (!person || !selectedFilters.has(person.id)) return null;
                              return (
                                <div
                                  key={s.id}
                                  className="px-1 py-0.5 rounded text-white truncate"
                                  style={{ backgroundColor: person.color }}
                                >
                                  🌙 {person.name.split(' ').slice(-1)[0].substring(0, 4)}
                                </div>
                              );
                            })}
                          {!isWE && !isHol && getScheduleForDate(date, 'bloc').slice(0, 2).map(s => {
                            const person = getAnesthesistById(s.anesthesist_id);
                            if (!person || !selectedFilters.has(person.id)) return null;
                            return (
                              <div
                                key={s.id}
                                className="px-1 py-0.5 rounded text-white truncate"
                                style={{ backgroundColor: person.color }}
                              >
                                🏥 {person.name.split(' ').slice(-1)[0].substring(0, 4)}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* ONGLET INCOHÉRENCES */}
          {/* ============================================ */}
          {activeTab === 'incoherences' && (
            <div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-orange-500" />
                  Détection des incohérences
                </h2>
                
                {incoherences.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Tout est en ordre !</h3>
                    <p className="text-gray-500 mt-2">Aucune incohérence détectée dans le planning.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <span>Erreur ({incoherences.filter(i => i.severity === 'error').length})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                        <span>Attention ({incoherences.filter(i => i.severity === 'warning').length})</span>
                      </div>
                    </div>

                    {incoherences.map((inc, idx) => {
                      const date = new Date(inc.date);
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border-l-4 ${
                            inc.severity === 'error' 
                              ? 'bg-red-50 border-red-500' 
                              : 'bg-yellow-50 border-yellow-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-800">
                                {date.toLocaleDateString('fr-FR', { 
                                  weekday: 'long', 
                                  day: 'numeric', 
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className={`text-sm ${
                                inc.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                              }`}>
                                {inc.message}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setCurrentWeekStart(getMonday(date));
                                setActiveTab('semaine');
                              }}
                              className="px-3 py-1.5 bg-white border rounded-lg text-sm hover:bg-gray-50"
                            >
                              Voir →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* ONGLET REMPLAÇANTS */}
          {/* ============================================ */}
          {activeTab === 'remplacants' && (
            <div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <UserPlus className="w-6 h-6 text-indigo-600" />
                    Liste des remplaçants
                  </h2>
                  {isAdmin() && (
                    <button
                      onClick={() => setEditingRemplacant({ name: '', email: '', phone: '', specialite: '', notes: '' })}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Ajouter
                    </button>
                  )}
                </div>

                {remplacants.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Aucun remplaçant enregistré
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {remplacants.map(r => (
                      <div key={r.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-800">{r.name}</h3>
                            {r.specialite && (
                              <p className="text-sm text-gray-500">{r.specialite}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              {r.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-4 h-4" />
                                  {r.phone}
                                </span>
                              )}
                              {r.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-4 h-4" />
                                  {r.email}
                                </span>
                              )}
                            </div>
                            {r.notes && (
                              <p className="text-sm text-gray-500 mt-2 italic">{r.notes}</p>
                            )}
                          </div>
                          {isAdmin() && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingRemplacant(r)}
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteRemplacant(r.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal édition remplaçant */}
              {editingRemplacant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl p-6 w-full max-w-md">
                    <h3 className="text-lg font-bold mb-4">
                      {editingRemplacant.id ? 'Modifier le remplaçant' : 'Nouveau remplaçant'}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                        <input
                          type="text"
                          value={editingRemplacant.name}
                          onChange={(e) => setEditingRemplacant({...editingRemplacant, name: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="Dr Jean DUPONT"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                        <input
                          type="tel"
                          value={editingRemplacant.phone || ''}
                          onChange={(e) => setEditingRemplacant({...editingRemplacant, phone: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="06 12 34 56 78"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={editingRemplacant.email || ''}
                          onChange={(e) => setEditingRemplacant({...editingRemplacant, email: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité</label>
                        <input
                          type="text"
                          value={editingRemplacant.specialite || ''}
                          onChange={(e) => setEditingRemplacant({...editingRemplacant, specialite: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="Anesthésie générale"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                          value={editingRemplacant.notes || ''}
                          onChange={(e) => setEditingRemplacant({...editingRemplacant, notes: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                          rows={2}
                          placeholder="Disponibilités, préférences..."
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => setEditingRemplacant(null)}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => saveRemplacant(editingRemplacant)}
                        disabled={!editingRemplacant.name}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================ */}
          {/* ONGLET STATISTIQUES */}
          {/* ============================================ */}
          {activeTab === 'stats' && (
            <div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                  Statistiques
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map(stat => (
                    <div key={stat.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stat.color }} />
                        <span className="font-semibold text-gray-800">{stat.name}</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Semaines:</span>
                          <span className="font-medium">{stat.semaines}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Astreintes:</span>
                          <span className="font-medium">{stat.astreinte}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Astr. WE:</span>
                          <span className="font-medium">{stat.astreinte_we}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Blocs:</span>
                          <span className="font-medium">{stat.bloc}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Consultations:</span>
                          <span className="font-medium">{stat.consultation}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-orange-600">🎉 Fériés:</span>
                          <span className="font-medium text-orange-600">{stat.feries}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">ETP:</span>
                          <span className="font-medium">{(stat.etp * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* ONGLET ADMINISTRATION */}
          {/* ============================================ */}
          {activeTab === 'admin' && isAdmin() && (
            <div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-indigo-600" />
                  Administration
                </h2>

                {/* Gestion des médecins */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Gestion des médecins</h3>
                    <button
                      onClick={() => setEditingAnesth({ name: '', email: '', phone: '', role: 'user', etp: 1 })}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Ajouter
                    </button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nom</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Téléphone</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Rôle</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">ETP</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {anesthesists.map(a => (
                          <tr key={a.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                                {a.name}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{a.email}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{a.phone || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs ${
                                a.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                a.role === 'viewer' ? 'bg-gray-100 text-gray-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {a.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">{(a.etp * 100).toFixed(0)}%</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setEditingAnesth(a)}
                                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteAnesthesist(a.id)}
                                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Comptes consultation */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Comptes en consultation seule</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 mb-4">
                      Ces comptes peuvent uniquement consulter le planning, sans possibilité de modification.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div>
                          <div className="font-medium">Secrétaire ARE</div>
                          <div className="text-sm text-gray-500">are.herbert6@gmail.com</div>
                        </div>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">viewer</span>
                      </div>
                      <div className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div>
                          <div className="font-medium">Direction</div>
                          <div className="text-sm text-gray-500">direction@clinique-herbert.fr</div>
                        </div>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">viewer</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal édition anesthésiste */}
              {editingAnesth && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl p-6 w-full max-w-md">
                    <h3 className="text-lg font-bold mb-4">
                      {editingAnesth.id ? 'Modifier le médecin' : 'Nouveau médecin'}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                        <input
                          type="text"
                          value={editingAnesth.name}
                          onChange={(e) => setEditingAnesth({...editingAnesth, name: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="Prénom NOM"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          value={editingAnesth.email}
                          onChange={(e) => setEditingAnesth({...editingAnesth, email: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                        <input
                          type="tel"
                          value={editingAnesth.phone || ''}
                          onChange={(e) => setEditingAnesth({...editingAnesth, phone: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="06 12 34 56 78"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                        <select
                          value={editingAnesth.role}
                          onChange={(e) => setEditingAnesth({...editingAnesth, role: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="user">Utilisateur (peut modifier)</option>
                          <option value="admin">Administrateur</option>
                          <option value="viewer">Consultation seule</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ETP (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="5"
                          value={(editingAnesth.etp * 100).toFixed(0)}
                          onChange={(e) => setEditingAnesth({...editingAnesth, etp: parseInt(e.target.value) / 100})}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => setEditingAnesth(null)}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => saveAnesthesist(editingAnesth)}
                        disabled={!editingAnesth.name || !editingAnesth.email}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnesthesistScheduler;
