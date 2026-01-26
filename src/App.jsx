import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar, Users, RefreshCw, Download, Play, TrendingUp, ArrowLeftRight,
  X, Check, LogIn, LogOut, Bell, Send, User, Moon, Building2,
  Stethoscope, Star, FileSpreadsheet, Printer, Settings, Home,
  CalendarOff, MessageSquare, Shield, ChevronLeft, ChevronRight,
  Copy, ExternalLink, Clock, AlertCircle, Plus, Trash2, PlusCircle,
  Eye, EyeOff, Percent, Phone, Mail, AlertTriangle, Edit2, UserPlus,
  BarChart3, UserCheck, Replace
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

// Helper pour identifier un TITULAIRE (pas viewer, pas remplaçant)
// Un titulaire a un ETP >= 0.5 (50%) et n'est pas un compte générique
const isTitulaire = (anesthesist) => {
  if (!anesthesist) return false;
  if (anesthesist.role === 'viewer') return false;
  if ((anesthesist.etp || 0) < 0.5) return false;
  // Exclure les comptes génériques "Remplaçant"
  if (anesthesist.name?.toLowerCase().includes('remplaçant')) return false;
  if (anesthesist.name?.toLowerCase().includes('remplacant')) return false;
  return true;
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState('login'); // 'login', 'firstTime', 'forgot'
  const [resetSent, setResetSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  // Vérifier si l'email existe dans la base (anesthesists ou iades)
  const verifyEmail = async () => {
    setLoading(true);
    setError('');

    try {
      // Vérifier dans anesthesists
      const { data: anesthData } = await supabase
        .from('anesthesists')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (anesthData) {
        setEmailVerified(true);
        setLoading(false);
        return;
      }

      // Vérifier dans iades
      const { data: iadeData } = await supabase
        .from('iades')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (iadeData) {
        setEmailVerified(true);
        setLoading(false);
        return;
      }

      setError("Cet email n'est pas autorisé. Contactez l'administrateur pour être ajouté.");
    } catch (err) {
      setError("Cet email n'est pas autorisé. Contactez l'administrateur pour être ajouté.");
    } finally {
      setLoading(false);
    }
  };

  // Créer le compte pour première connexion
  const handleFirstTimeSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      // Créer le compte dans Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password
      });

      if (error) throw error;

      // Connexion automatique après création
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      });

      if (loginError) {
        setMessage('Compte créé ! Vous pouvez maintenant vous connecter.');
        setMode('login');
        setEmailVerified(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        onLogin(loginData.user);
      }
    } catch (err) {
      if (err.message.includes('already registered')) {
        setError('Un compte existe déjà avec cet email. Utilisez "Se connecter" ou "Mot de passe oublié".');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Connexion normale
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      });
      if (error) throw error;
      onLogin(data.user);
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect' : err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mot de passe oublié
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Vérifier que l'email existe
      const { data: anesthData } = await supabase
        .from('anesthesists')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .single();

      const { data: iadeData } = await supabase
        .from('iades')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (!anesthData && !iadeData) {
        setError("Aucun compte associé à cet email");
        setLoading(false);
        return;
      }

      // Envoyer le lien de réinitialisation
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: window.location.origin,
      });

      if (error) throw error;

      setResetSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Écran de confirmation reset envoyé
  if (resetSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)` }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: theme.gray[800] }}>Email envoyé !</h2>
          <p className="text-gray-500 mb-4">
            Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.<br />
            Vérifiez votre boîte mail (et les spams).
          </p>
          <button
            onClick={() => { setMode('login'); setResetSent(false); setError(''); }}
            className="font-medium" style={{ color: theme.primary }}
          >
            ← Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)` }}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: theme.primary }}>
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: theme.gray[800] }}>Planning Anesthésistes</h1>
          <p className="text-gray-500 mt-2">
            {mode === 'login' && 'Connectez-vous'}
            {mode === 'firstTime' && (emailVerified ? 'Créez votre mot de passe' : 'Première connexion')}
            {mode === 'forgot' && 'Mot de passe oublié'}
          </p>
        </div>

        {/* MODE CONNEXION */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                required
                minLength={6}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}
            {message && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-xl text-sm">{message}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: theme.primary }}
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                <>
                  <LogIn className="w-5 h-5" />
                  Se connecter
                </>
              )}
            </button>

            <div className="mt-4 space-y-2 text-center">
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
                className="text-sm hover:underline"
                style={{ color: theme.gray[500] }}
              >
                Mot de passe oublié ?
              </button>
              <br />
              <button
                type="button"
                onClick={() => { setMode('firstTime'); setError(''); setMessage(''); setEmailVerified(false); }}
                className="text-sm font-medium hover:underline"
                style={{ color: theme.primary }}
              >
                🆕 Première connexion ? Créer mon compte
              </button>
            </div>
          </form>
        )}

        {/* MODE PREMIÈRE CONNEXION */}
        {mode === 'firstTime' && !emailVerified && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm" style={{ color: theme.gray[600] }}>
              <strong>Première connexion ?</strong><br />
              Entrez votre email professionnel. S'il a été enregistré par l'administrateur, vous pourrez créer votre mot de passe.
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email professionnel"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}

            <button
              onClick={verifyEmail}
              disabled={loading || !email}
              className="w-full text-white py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: theme.primary }}
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                <>
                  <Check className="w-5 h-5" />
                  Vérifier mon email
                </>
              )}
            </button>

            <button
              onClick={() => { setMode('login'); setError(''); }}
              className="w-full text-sm hover:underline"
              style={{ color: theme.gray[500] }}
            >
              ← Retour à la connexion
            </button>
          </div>
        )}

        {/* MODE PREMIÈRE CONNEXION - EMAIL VÉRIFIÉ */}
        {mode === 'firstTime' && emailVerified && (
          <form onSubmit={handleFirstTimeSignUp} className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
              ✓ Email vérifié : <strong>{email}</strong><br />
              Définissez maintenant votre mot de passe.
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nouveau mot de passe (min. 6 caractères)"
                required
                minLength={6}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmer le mot de passe"
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: theme.success }}
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Créer mon compte
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setEmailVerified(false); setPassword(''); setConfirmPassword(''); }}
              className="w-full text-sm hover:underline"
              style={{ color: theme.gray[500] }}
            >
              ← Retour à la connexion
            </button>
          </form>
        )}

        {/* MODE MOT DE PASSE OUBLIÉ */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm" style={{ color: theme.gray[600] }}>
              Entrez votre email pour recevoir un lien de réinitialisation.
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full text-white py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: theme.primary }}
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                <>
                  <Mail className="w-5 h-5" />
                  Envoyer le lien
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className="w-full text-sm hover:underline"
              style={{ color: theme.gray[500] }}
            >
              ← Retour à la connexion
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ============================================
// COMPOSANT ETP MODAL (avec validation 400%)
// ============================================
const ETPModal = ({ anesthesists, onClose, onSave, theme }) => {
  const TARGET_ETP = 4.0; // 400% = 4 ETP

  // État local pour les modifications
  const [etpValues, setEtpValues] = useState(() => {
    const initial = {};
    anesthesists.forEach(a => {
      initial[a.id] = a.etp || 0.5;
    });
    return initial;
  });

  // Calculer le total
  const totalETP = Object.values(etpValues).reduce((sum, val) => sum + val, 0);
  const totalPercent = Math.round(totalETP * 100);
  const isValid = Math.abs(totalETP - TARGET_ETP) < 0.01; // Tolérance pour les arrondis

  const handleChange = (id, newValue) => {
    setEtpValues(prev => ({
      ...prev,
      [id]: newValue
    }));
  };

  const handleSave = () => {
    if (!isValid) {
      alert(`Le total doit être égal à ${TARGET_ETP * 100}% (${TARGET_ETP} ETP).\n\nActuellement : ${totalPercent}%`);
      return;
    }
    onSave(etpValues);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Gestion des ETP</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <p className="text-sm mb-4" style={{ color: theme.gray[500] }}>
            Ajustez le pourcentage de temps de travail. Le total doit être égal à <strong>{TARGET_ETP * 100}%</strong> ({TARGET_ETP} ETP).
          </p>

          {/* Indicateur du total */}
          <div className={`mb-4 p-3 rounded-xl flex items-center justify-between ${isValid ? 'bg-green-50' : 'bg-red-50'}`}>
            <span className="font-medium">Total ETP :</span>
            <span className={`text-xl font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
              {totalPercent}% / {TARGET_ETP * 100}%
            </span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {anesthesists.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: theme.gray[50] }}>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: a.color }} />
                  <span className="font-medium">{a.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={Math.round(etpValues[a.id] * 100)}
                    onChange={(e) => handleChange(a.id, parseInt(e.target.value) / 100)}
                    className="w-24"
                  />
                  <span className="w-12 text-center font-bold" style={{ color: theme.primary }}>
                    {Math.round(etpValues[a.id] * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-medium border"
              style={{ borderColor: theme.gray[300], color: theme.gray[600] }}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className={`flex-1 py-3 rounded-xl font-medium text-white ${!isValid ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ backgroundColor: isValid ? theme.success : theme.gray[400] }}
            >
              {isValid ? 'Enregistrer' : `Total ≠ ${TARGET_ETP * 100}%`}
            </button>
          </div>
        </div>
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
  const [remplacants, setRemplacants] = useState([]);
  const [remplacements, setRemplacements] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [holidays, setHolidays] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [swapRequests, setSwapRequests] = useState([]);
  const [exchangeBoard, setExchangeBoard] = useState([]);
  const [unavailabilities, setUnavailabilities] = useState([]);
  const [emailPreferences, setEmailPreferences] = useState({});

  // IADES
  const [iades, setIades] = useState([]);
  const [scheduleIades, setScheduleIades] = useState({});
  const [selectedIadesFilters, setSelectedIadesFilters] = useState(new Set());
  const [iadesStatsPeriod, setIadesStatsPeriod] = useState({ start: '', end: '' });
  const [editingIade, setEditingIade] = useState(null);
  const [iadesMenuOpen, setIadesMenuOpen] = useState(false);
  const [showIadesInPlanning, setShowIadesInPlanning] = useState(true);
  const [iadesHeures, setIadesHeures] = useState([]);
  const [currentIade, setCurrentIade] = useState(null);

  // Modals
  const [editingRemplacant, setEditingRemplacant] = useState(null);
  const [editingAnesth, setEditingAnesth] = useState(null);
  const [replacementModal, setReplacementModal] = useState(null); // {date, shift, remplacant}

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
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // ============================================
  // RÔLES ET PERMISSIONS
  // ============================================
  // Rôles table anesthesists:
  // - admin: accès total (planning anesth, génération auto, gestion utilisateurs)
  // - user: anesthésiste (échanges, indispo, consultation)
  // - viewer: lecteur (consultation planning + listes uniquement)
  //
  // Champ is_iade_admin (boolean) dans anesthesists:
  // - Si true, l'anesthésiste peut aussi gérer le planning IADE et les accès IADE
  //
  // Rôles table iades:
  // - iade: IADE (consultation planning anesth + IADE + listes)

  const isAdmin = currentUser?.role === 'admin';
  const isViewer = currentUser?.role === 'viewer';
  const isIade = currentUser?.role === 'iade';
  const isAnesthesiste = currentUser?.role === 'user';
  const isIadeAdmin = currentUser?.is_iade_admin === true;

  // Permissions dérivées
  const canEditPlanning = isAdmin; // Seul l'admin peut modifier le planning anesthésiste
  const canEditIadePlanning = isAdmin || isIadeAdmin; // Admin ou Admin IADE peut modifier le planning IADE
  const canManageAnesthesists = isAdmin; // Seul l'admin peut gérer les anesthésistes
  const canManageIades = isAdmin || isIadeAdmin; // Admin ou Admin IADE peut gérer les IADEs
  const canGeneratePlanning = isAdmin; // Seul l'admin peut générer le planning auto
  const canRequestSwap = isAdmin || isAnesthesiste; // Admin et anesthésistes peuvent demander des échanges
  const canSetUnavailability = isAdmin || isAnesthesiste; // Admin et anesthésistes peuvent saisir des indispos
  const canViewPlanning = true; // Tout le monde peut voir les plannings
  const canViewContacts = true; // Tout le monde peut voir les coordonnées

  const unreadCount = notifications.filter(n => !n.read).length;

  // ============================================
  // AUTH
  // ============================================
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      // Détecter si l'utilisateur arrive via un lien de récupération de mot de passe
      if (event === 'PASSWORD_RECOVERY') {
        setShowPasswordReset(true);
      }
    });

    // Vérifier aussi l'URL pour le token de recovery
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setShowPasswordReset(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  // ============================================
  // DATA LOADING
  // ============================================
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const [anesth, rempl, replmts, sched, hol, notif, swaps, exchange, unavail, iadesData, schedIades, heuresData] = await Promise.all([
        supabase.from('anesthesists').select('*').order('id'),
        supabase.from('remplacants').select('*').eq('actif', true).order('name'),
        supabase.from('remplacements').select('*'),
        supabase.from('schedule').select('*').limit(100000),
        supabase.from('holidays').select('*'),
        supabase.from('notifications').select('*, swap_request:swap_requests(*)').order('created_at', { ascending: false }),
        supabase.from('swap_requests').select('*'),
        supabase.from('exchange_board').select('*').order('created_at', { ascending: false }),
        supabase.from('unavailabilities').select('*'),
        supabase.from('iades').select('*').order('name'),
        supabase.from('schedule_iades').select('*').limit(100000),
        supabase.from('iades_heures').select('*'),
      ]);

      // Debug: voir ce que retourne schedule

      if (anesth.data) {
        // Appliquer les couleurs distinctes
        const anesthWithColors = anesth.data.map((a, index) => ({
          ...a,
          color: DISTINCT_COLORS[index % DISTINCT_COLORS.length]
        }));
        setAnesthesists(anesthWithColors);

        // Chercher si l'utilisateur est un anesthésiste
        const profile = anesthWithColors.find(a => a.email === user.email);
        if (profile) {
          setCurrentUser(profile);
          if (!profile.user_id) {
            await supabase.from('anesthesists').update({ user_id: user.id }).eq('id', profile.id);
          }
          const { data: prefs } = await supabase.from('email_preferences').select('*').eq('anesthesist_id', profile.id).single();
          if (prefs) setEmailPreferences(prefs);
        }

        // Ne réinitialiser les filtres qu'au premier chargement (seulement titulaires ETP >= 0.2)
        if (selectedFilters.size === 0 && !filtersInitialized.current) {
          const titulaires = anesthWithColors.filter(a => isTitulaire(a));
          setSelectedFilters(new Set([...titulaires.map(a => a.id), 'remplacants']));
          filtersInitialized.current = true;
        }
      }

      if (rempl.data) setRemplacants(rempl.data);
      if (replmts.data) setRemplacements(replmts.data);

      if (sched.data) {
        const scheduleMap = {};
        sched.data.forEach(item => {
          if (!scheduleMap[item.date]) scheduleMap[item.date] = {};
          if (!scheduleMap[item.date][item.shift]) scheduleMap[item.date][item.shift] = [];

          if (item.anesthesist_id) {
            // C'est un titulaire
            scheduleMap[item.date][item.shift].push({ type: 'titulaire', id: item.anesthesist_id });
          } else if (item.remplacant_name) {
            // C'est un remplaçant
            scheduleMap[item.date][item.shift].push({
              type: 'remplacant',
              name: item.remplacant_name,
              scheduleId: item.id
            });
          }
        });
        setSchedule(scheduleMap);
      }

      // Charger les IADES
      if (iadesData.data) {
        const IADES_COLORS = ['#059669', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#65a30d', '#0284c7', '#9333ea'];
        const iadesWithColors = iadesData.data.map((i, index) => ({
          ...i,
          color: i.is_titulaire ? IADES_COLORS[index % IADES_COLORS.length] : '#6b7280'
        }));
        setIades(iadesWithColors);

        // Vérifier si l'utilisateur est un IADE (si pas déjà identifié comme anesthésiste)
        if (!currentUser) {
          const iadeProfile = iadesWithColors.find(i => i.email === user.email);
          if (iadeProfile) {
            setCurrentIade(iadeProfile);
            setCurrentUser({ ...iadeProfile, role: 'iade', name: iadeProfile.name });
          }
        }

        // Initialiser les filtres IADES
        if (selectedIadesFilters.size === 0) {
          setSelectedIadesFilters(new Set(iadesWithColors.map(i => i.id)));
        }
      }

      // Charger le planning IADES
      if (schedIades.data) {
        const scheduleIadesMap = {};
        schedIades.data.forEach(item => {
          if (!scheduleIadesMap[item.date]) scheduleIadesMap[item.date] = {};
          if (!scheduleIadesMap[item.date][item.shift]) scheduleIadesMap[item.date][item.shift] = [];

          if (item.iade_id) {
            scheduleIadesMap[item.date][item.shift].push({ type: 'titulaire', id: item.iade_id, scheduleId: item.id });
          } else if (item.remplacant_name) {
            scheduleIadesMap[item.date][item.shift].push({
              type: 'remplacant',
              name: item.remplacant_name,
              scheduleId: item.id
            });
          }
        });
        setScheduleIades(scheduleIadesMap);
      }

      // Charger les heures IADES
      if (heuresData.data) setIadesHeures(heuresData.data);

      if (hol.data) setHolidays(hol.data);
      if (notif.data) setNotifications(notif.data);
      if (swaps.data) setSwapRequests(swaps.data);
      if (exchange.data) setExchangeBoard(exchange.data);
      if (unavail.data) setUnavailabilities(unavail.data);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  }, [user, selectedFilters.size, selectedIadesFilters.size]);

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
    if (!canEditPlanning || isGenerating) return;
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
      }

      // Supprimer les entrées avant de régénérer
      // - Mode 'new' (18 mois): supprimer TOUT le futur pour éviter les orphelins
      // - Mode 'range': supprimer uniquement la plage spécifiée
      let deleteQuery = supabase
        .from('schedule')
        .delete()
        .is('remplacant_name', null); // Ne pas supprimer les remplaçants manuels

      if (mode === 'new') {
        // Supprimer tout à partir de startDate (évite les entrées fantômes)
        deleteQuery = deleteQuery.gte('date', formatDateKey(startDate));
      } else {
        // Mode range: supprimer uniquement la plage
        deleteQuery = deleteQuery
          .gte('date', formatDateKey(startDate))
          .lte('date', formatDateKey(endDate));
      }

      const { error: delErr } = await deleteQuery;
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


      // Insérer par batch
      for (let i = 0; i < inserts.length; i += 500) {
        const batch = inserts.slice(i, i + 500);
        const { error } = await supabase.from('schedule').insert(batch);
        if (error) {
          console.error('Erreur batch', i, ':', error);
          throw error;
        }
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
    if (!canEditPlanning) return;
    const dateKey = formatDateKey(date);
    const entries = schedule[dateKey]?.[shift] || [];
    const exists = entries.some(e => e.type === 'titulaire' && e.id === anesthesistId);

    if (exists) {
      await supabase.from('schedule').delete().eq('date', dateKey).eq('shift', shift).eq('anesthesist_id', anesthesistId);
    } else {
      await supabase.from('schedule').insert({ date: dateKey, shift, anesthesist_id: anesthesistId, year: new Date(date).getFullYear() });
    }
    await loadData();
  };

  // Supprimer un remplaçant du planning
  const removeRemplacant = async (scheduleId) => {
    if (!canEditPlanning) return;
    await supabase.from('schedule').delete().eq('id', scheduleId);
    await loadData();
  };

  const updateETP = async (anesthesistId, newETP) => {
    if (!canEditPlanning) return;
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

  // ============================================
  // GESTION DES REMPLAÇANTS
  // ============================================
  const saveRemplacant = async (remplacant) => {
    if (!canEditPlanning) return;

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
    await loadData();
  };

  const deleteRemplacant = async (id) => {
    if (!canEditPlanning) return;
    if (!window.confirm('Supprimer ce remplaçant ?')) return;

    await supabase.from('remplacants').update({ actif: false }).eq('id', id);
    await loadData();
  };

  // ============================================
  // GESTION DES ANESTHÉSISTES (ADMIN)
  // ============================================
  const saveAnesthesist = async (anesth) => {
    if (!canManageAnesthesists) return;

    if (anesth.id) {
      await supabase.from('anesthesists').update({
        name: anesth.name,
        email: anesth.email,
        phone: anesth.phone,
        role: anesth.role,
        etp: anesth.etp,
        is_iade_admin: anesth.is_iade_admin || false
      }).eq('id', anesth.id);
    } else {
      await supabase.from('anesthesists').insert({
        name: anesth.name,
        email: anesth.email,
        phone: anesth.phone,
        role: anesth.role || 'user',
        etp: anesth.etp || 0.5,
        is_iade_admin: anesth.is_iade_admin || false
      });
    }

    setEditingAnesth(null);
    await loadData();
  };

  // Fonction pour changer le mot de passe
  const updatePassword = async () => {
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message);
    } else {
      alert('Mot de passe mis à jour avec succès !');
      setShowPasswordReset(false);
      setNewPassword('');
      setConfirmPassword('');
      // Nettoyer l'URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const deleteAnesthesist = async (id) => {
    if (!canManageAnesthesists) return;
    if (!window.confirm('Supprimer ce médecin ? (Les données de planning seront conservées)')) return;

    await supabase.from('anesthesists').delete().eq('id', id);
    await loadData();
  };

  // ============================================
  // GESTION DES REMPLACEMENTS
  // ============================================
  const addRemplacement = async (date, shift, remplacantId, titulaireId) => {
    if (!canEditPlanning) return;

    const remplacant = remplacants.find(r => r.id === remplacantId);
    if (!remplacant) return;

    // Vérifier si ce remplacement existe déjà (éviter doublons)
    const { data: existing } = await supabase
      .from('remplacements')
      .select('id')
      .eq('date', date)
      .eq('shift', shift)
      .eq('remplacant_name', remplacant.name)
      .single();

    if (!existing) {
      // 1. Enregistrer dans l'historique des remplacements
      await supabase.from('remplacements').insert({
        date,
        shift,
        remplacant_id: remplacantId,
        remplacant_name: remplacant.name,
        titulaire_id: titulaireId
      });
    }

    // 2. Vérifier si déjà dans le planning
    const { data: existingSchedule } = await supabase
      .from('schedule')
      .select('id')
      .eq('date', date)
      .eq('shift', shift)
      .eq('remplacant_name', remplacant.name)
      .single();

    if (!existingSchedule) {
      // Ajouter le remplaçant au planning
      const year = new Date(date).getFullYear();
      const { error } = await supabase.from('schedule').insert({
        date,
        shift,
        anesthesist_id: null,
        remplacant_name: remplacant.name,
        year
      });

      if (error) {
        console.error('Erreur ajout schedule:', error);
      }
    }

    setReplacementModal(null);
    await loadData();
  };

  const deleteRemplacement = async (id) => {
    if (!canEditPlanning) return;
    await supabase.from('remplacements').delete().eq('id', id);
    await loadData();
  };

  // ============================================
  // FONCTIONS IADES
  // ============================================
  const addIade = async (iadeData) => {
    if (!canManageIades) return;
    const { error } = await supabase.from('iades').insert(iadeData);
    if (!error) await loadData();
    return error;
  };

  const updateIade = async (id, iadeData) => {
    if (!canManageIades) return;
    const { error } = await supabase.from('iades').update(iadeData).eq('id', id);
    if (!error) await loadData();
    return error;
  };

  const deleteIade = async (id) => {
    if (!canManageIades) return;
    await supabase.from('schedule_iades').delete().eq('iade_id', id);
    await supabase.from('iades').delete().eq('id', id);
    await loadData();
  };

  const assignIade = async (date, shift, iadeId, isRemplacant = false, remplacantName = null) => {
    if (!canEditIadePlanning) return;
    const dateKey = formatDateKey(date);
    const year = new Date(date).getFullYear();

    const insertData = {
      date: dateKey,
      shift,
      year,
      iade_id: isRemplacant ? null : iadeId,
      remplacant_name: isRemplacant ? remplacantName : null
    };

    const { error } = await supabase.from('schedule_iades').insert(insertData);
    if (!error) await loadData();
    return error;
  };

  const removeIadeAssignment = async (scheduleId) => {
    if (!canEditIadePlanning) return;
    await supabase.from('schedule_iades').delete().eq('id', scheduleId);
    await loadData();
  };

  const getAssignedIades = (date, shift) => {
    const key = formatDateKey(date);
    const entries = scheduleIades[key]?.[shift] || [];

    return entries.map(entry => {
      if (entry.type === 'titulaire') {
        const iade = iades.find(i => i.id === entry.id);
        if (iade && selectedIadesFilters.has(iade.id)) {
          return { ...iade, isRemplacant: false, scheduleId: entry.scheduleId };
        }
      } else if (entry.type === 'remplacant') {
        return {
          id: `r_${entry.scheduleId}`,
          name: entry.name,
          color: '#6b7280',
          isRemplacant: true,
          scheduleId: entry.scheduleId
        };
      }
      return null;
    }).filter(Boolean);
  };

  const calculateIadesStats = (startDate = null, endDate = null) => {
    const stats = {};

    // Initialiser les stats pour tous les IADES
    iades.forEach(iade => {
      stats[iade.id] = {
        ...iade,
        total: 0,
        totalHeures: 0,
        journees: {}
      };
    });

    // Compter les jours travaillés
    Object.entries(scheduleIades).forEach(([dateKey, shifts]) => {
      if (startDate && dateKey < startDate) return;
      if (endDate && dateKey > endDate) return;

      Object.entries(shifts).forEach(([shift, entries]) => {
        entries.forEach(entry => {
          if (entry.type === 'titulaire' && stats[entry.id]) {
            if (!stats[entry.id].journees[dateKey]) {
              stats[entry.id].journees[dateKey] = true;
              stats[entry.id].total++;
            }
          }
        });
      });
    });

    // Ajouter les heures déclarées
    iadesHeures.forEach(h => {
      if (startDate && h.date < startDate) return;
      if (endDate && h.date > endDate) return;
      if (stats[h.iade_id]) {
        stats[h.iade_id].totalHeures += h.heures || 0;
      }
    });

    return Object.values(stats);
  };

  // Fonctions pour les heures IADES
  const saveIadeHeures = async (iadeId, date, heures, commentaire = '') => {
    const dateKey = formatDateKey(date);

    // Vérifier si une entrée existe déjà
    const existing = iadesHeures.find(h => h.iade_id === iadeId && h.date === dateKey);

    if (existing) {
      const { error } = await supabase.from('iades_heures').update({ heures, commentaire }).eq('id', existing.id);
      if (!error) await loadData();
      return error;
    } else {
      const { error } = await supabase.from('iades_heures').insert({
        iade_id: iadeId,
        date: dateKey,
        heures,
        commentaire
      });
      if (!error) await loadData();
      return error;
    }
  };

  const deleteIadeHeures = async (id) => {
    await supabase.from('iades_heures').delete().eq('id', id);
    await loadData();
  };

  // ============================================
  // DÉTECTION DES INCOHÉRENCES
  // ============================================
  const getIncoherences = () => {
    const incoherences = [];

    Object.entries(schedule).forEach(([dateStr, shifts]) => {
      const date = new Date(dateStr);
      const isWE = isWeekend(date);
      const isHol = isHoliday(date);

      // Helper pour extraire les IDs des titulaires
      const getIds = (entries) => entries?.filter(e => e.type === 'titulaire').map(e => e.id) || [];

      if (isWE) {
        const astreinteWE = shifts.astreinte_we || [];
        if (astreinteWE.length === 0) {
          incoherences.push({
            date: dateStr,
            type: 'missing_astreinte_we',
            message: 'Week-end sans astreinte',
            severity: 'error'
          });
        } else if (astreinteWE.length > 1) {
          incoherences.push({
            date: dateStr,
            type: 'multiple_astreinte_we',
            message: `${astreinteWE.length} personnes d'astreinte WE`,
            severity: 'warning'
          });
        }
      } else if (isHol) {
        const astreinteFerie = shifts.astreinte_ferie || [];
        if (astreinteFerie.length === 0) {
          incoherences.push({
            date: dateStr,
            type: 'missing_astreinte_ferie',
            message: 'Jour férié sans astreinte',
            severity: 'error'
          });
        } else if (astreinteFerie.length > 1) {
          // Nouveau check: plus d'une personne sur un jour férié
          incoherences.push({
            date: dateStr,
            type: 'multiple_astreinte_ferie',
            message: `${astreinteFerie.length} personnes d'astreinte férié`,
            severity: 'warning'
          });
        }
      } else {
        const astreinte = shifts.astreinte || [];
        const bloc = shifts.bloc || [];
        const consultation = shifts.consultation || [];

        if (astreinte.length === 0) {
          incoherences.push({
            date: dateStr,
            type: 'missing_astreinte',
            message: 'Pas d\'astreinte assignée',
            severity: 'error'
          });
        }

        if (bloc.length < 2) {
          incoherences.push({
            date: dateStr,
            type: 'missing_bloc',
            message: `Seulement ${bloc.length} bloc(s) (besoin 2)`,
            severity: 'warning'
          });
        }

        if (consultation.length === 0) {
          incoherences.push({
            date: dateStr,
            type: 'missing_consultation',
            message: 'Pas de consultation',
            severity: 'warning'
          });
        }

        // Vérifier que l'astreinte est aussi au bloc (titulaires OU remplaçants)
        if (astreinte.length > 0 && bloc.length > 0) {
          const astreinteIds = getIds(astreinte);
          const blocIds = getIds(bloc);
          // Vérifier aussi les remplaçants par nom
          const astreinteRemplacants = astreinte.filter(e => e.type === 'remplacant').map(e => e.name);
          const blocRemplacants = bloc.filter(e => e.type === 'remplacant').map(e => e.name);

          const titulaireMatch = astreinteIds.some(id => blocIds.includes(id));
          const remplacantMatch = astreinteRemplacants.some(name => blocRemplacants.includes(name));

          if (!titulaireMatch && !remplacantMatch) {
            incoherences.push({
              date: dateStr,
              type: 'astreinte_not_in_bloc',
              message: 'Astreinte pas au bloc',
              severity: 'warning'
            });
          }
        }

        // Nouveau check: même personne au bloc et en consultation
        if (bloc.length > 0 && consultation.length > 0) {
          const blocIds = getIds(bloc);
          const consultationIds = getIds(consultation);
          const blocRemplacants = bloc.filter(e => e.type === 'remplacant').map(e => e.name);
          const consultationRemplacants = consultation.filter(e => e.type === 'remplacant').map(e => e.name);

          const sameTitulaire = blocIds.some(id => consultationIds.includes(id));
          const sameRemplacant = blocRemplacants.some(name => consultationRemplacants.includes(name));

          if (sameTitulaire || sameRemplacant) {
            incoherences.push({
              date: dateStr,
              type: 'bloc_and_consultation_same_person',
              message: 'Même personne au bloc et en consultation',
              severity: 'error'
            });
          }
        }
      }
    });

    return incoherences.sort((a, b) => a.date.localeCompare(b.date));
  };

  const incoherenceCount = getIncoherences().length;

  // State pour la période des stats
  const [statsPeriod, setStatsPeriod] = useState({ start: '', end: '' });

  // ============================================
  // CALCUL DES STATS AVEC REMPLACEMENTS
  // ============================================
  const calculateFullStats = (startDate = null, endDate = null) => {
    // Stats pour les titulaires
    const titulairesStats = anesthesists.filter(a => isTitulaire(a)).map(a => ({
      ...a,
      bloc: 0,
      consultation: 0,
      astreinte: 0,
      we: 0,
      ferie: 0,
      total: 0,
      blocAstreinte: 0, // Nouveau: jours avec bloc ET astreinte
      joursRemplaces: 0,
      etp: a.etp || 0.5,
      isTitulaire: true,
      _datesPresence: new Set() // Pour calculer les jours uniques
    }));

    // Stats pour les remplaçants
    const remplacantsStatsMap = {};

    // D'abord, collecter tous les shifts par date et par personne
    Object.entries(schedule).forEach(([dateKey, shifts]) => {
      // Filtrer par période si définie
      if (startDate && dateKey < startDate) return;
      if (endDate && dateKey > endDate) return;

      const date = new Date(dateKey);
      const isWE = isWeekend(date);
      const isHol = isHoliday(date);

      // Si férié dans un WE, ne pas compter le férié (seulement le WE)
      const isFerieInWE = isHol && isWE;

      Object.entries(shifts).forEach(([shift, entries]) => {
        entries.forEach(entry => {
          if (entry.type === 'titulaire') {
            const stat = titulairesStats.find(s => s.id === entry.id);
            if (stat) {
              stat._datesPresence.add(dateKey);
              if (shift === 'bloc') stat.bloc++;
              else if (shift === 'consultation') stat.consultation++;
              else if (shift === 'astreinte') stat.astreinte++;
              else if (shift === 'astreinte_we') stat.we++;
              else if (shift === 'astreinte_ferie') {
                if (!isFerieInWE) stat.ferie++;
              }
            }
          } else if (entry.type === 'remplacant') {
            if (!remplacantsStatsMap[entry.name]) {
              remplacantsStatsMap[entry.name] = {
                id: `rempl_${entry.name}`,
                name: entry.name,
                color: theme.gray[500],
                bloc: 0, consultation: 0, astreinte: 0, we: 0, ferie: 0, total: 0,
                blocAstreinte: 0,
                joursRemplaces: 0,
                etp: 0,
                isTitulaire: false,
                _datesPresence: new Set(),
                _datesBlocAstreinte: {} // Pour tracker bloc+astreinte par date
              };
            }
            const stat = remplacantsStatsMap[entry.name];
            stat._datesPresence.add(dateKey);

            // Tracker les shifts par date pour détecter bloc+astreinte
            if (!stat._datesBlocAstreinte[dateKey]) {
              stat._datesBlocAstreinte[dateKey] = { bloc: false, astreinte: false };
            }

            if (shift === 'bloc') {
              stat.bloc++;
              stat._datesBlocAstreinte[dateKey].bloc = true;
            }
            else if (shift === 'consultation') stat.consultation++;
            else if (shift === 'astreinte') {
              stat.astreinte++;
              stat._datesBlocAstreinte[dateKey].astreinte = true;
            }
            else if (shift === 'astreinte_we') stat.we++;
            else if (shift === 'astreinte_ferie') {
              if (!isFerieInWE) stat.ferie++;
            }
          }
        });
      });
    });

    // Calculer le total (jours uniques) et bloc+astreinte pour les remplaçants
    Object.values(remplacantsStatsMap).forEach(stat => {
      // Total = nombre de jours uniques de présence
      stat.total = stat._datesPresence.size;

      // Compter les jours où le remplaçant a fait bloc ET astreinte
      Object.values(stat._datesBlocAstreinte).forEach(dayShifts => {
        if (dayShifts.bloc && dayShifts.astreinte) {
          stat.blocAstreinte++;
        }
      });

      // Nettoyer les propriétés temporaires
      delete stat._datesPresence;
      delete stat._datesBlocAstreinte;
    });

    // Calculer le total pour les titulaires
    titulairesStats.forEach(stat => {
      stat.total = stat._datesPresence.size;
      delete stat._datesPresence;
    });

    // Compter les jours remplacés pour les titulaires (filtré par période)
    // On compte les jours UNIQUES où le titulaire a été remplacé
    const joursRemplacesParTitulaire = {};
    remplacements.forEach(r => {
      if (startDate && r.date < startDate) return;
      if (endDate && r.date > endDate) return;

      if (!joursRemplacesParTitulaire[r.titulaire_id]) {
        joursRemplacesParTitulaire[r.titulaire_id] = new Set();
      }
      joursRemplacesParTitulaire[r.titulaire_id].add(r.date);
    });

    // Appliquer le compte de jours uniques à chaque titulaire
    titulairesStats.forEach(stat => {
      stat.joursRemplaces = joursRemplacesParTitulaire[stat.id]?.size || 0;
    });

    // Combiner titulaires et remplaçants
    const remplacantsStats = Object.values(remplacantsStatsMap);
    return [...titulairesStats, ...remplacantsStats];
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
    const stats = anesthesists.filter(a => isTitulaire(a)).map(a => ({
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
      Object.entries(shifts).forEach(([shift, entries]) => {
        entries.forEach(entry => {
          if (entry.type === 'titulaire') {
            const stat = stats.find(s => s.id === entry.id);
            if (stat) {
              stat.total++;
              if (shift === 'bloc') stat.bloc++;
              else if (shift === 'consultation') stat.consultation++;
              else if (shift === 'astreinte') stat.astreinte++;
              else if (shift === 'astreinte_we') stat.we++;
              else if (shift === 'astreinte_ferie') stat.ferie++;
            }
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
    const entries = schedule[key]?.[shift] || [];

    return entries.map(entry => {
      if (entry.type === 'titulaire') {
        const anesth = anesthesists.find(a => a.id === entry.id);
        if (anesth && selectedFilters.has(anesth.id)) {
          return { ...anesth, isRemplacant: false };
        }
      } else if (entry.type === 'remplacant') {
        // Afficher si le filtre "remplacants" est actif
        if (selectedFilters.has('remplacants')) {
          // Chercher qui est remplacé dans l'historique
          const repl = remplacements.find(r => r.date === key && r.shift === shift && r.remplacant_name === entry.name);
          const titulaire = repl ? anesthesists.find(t => t.id === repl.titulaire_id) : null;

          return {
            id: `r_${entry.scheduleId}`,
            name: entry.name,
            color: theme.gray[500],
            isRemplacant: true,
            scheduleId: entry.scheduleId,
            titulaireRemplace: titulaire?.name || null
          };
        }
      }
      return null;
    }).filter(Boolean);
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
            { id: 'dashboard', icon: Home, label: 'Tableau de bord', show: canRequestSwap }, // Admin et anesthésistes
            { id: 'planning', icon: Calendar, label: 'Planning', show: true }, // Tout le monde
            { id: 'stats', icon: BarChart3, label: 'Statistiques', show: !isIade }, // Pas les IADEs
            { id: 'incoherences', icon: AlertTriangle, label: 'Incohérences', show: canEditPlanning, badge: incoherenceCount }, // Admin seulement
            { id: 'remplacants', icon: UserPlus, label: 'Remplaçants', show: !isIade && !isViewer }, // Admin et anesthésistes
            { id: 'exchange', icon: MessageSquare, label: 'Bourse aux échanges', show: canRequestSwap }, // Admin et anesthésistes
            { id: 'unavailabilities', icon: CalendarOff, label: 'Indisponibilités', show: canSetUnavailability }, // Admin et anesthésistes
            { id: 'admin', icon: Shield, label: 'Administration', show: canManageAnesthesists || canManageIades }, // Admin ou Admin IADE
            { id: 'settings', icon: Settings, label: 'Paramètres', show: canRequestSwap }, // Admin et anesthésistes
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
              {item.badge > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{item.badge}</span>
              )}
            </button>
          ))}

          {/* Section IADES avec sous-menu */}
          <div className="mt-3 pt-3 border-t border-white/20">
            <button
              onClick={() => setIadesMenuOpen(!iadesMenuOpen)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${
                currentView.startsWith('iades') ? 'bg-white/20' : 'hover:bg-white/10 text-white/70'
              }`}
            >
              <Stethoscope className="w-5 h-5" />
              <span className="font-medium">IADES</span>
              <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${iadesMenuOpen ? 'rotate-90' : ''}`} />
            </button>

            {iadesMenuOpen && (
              <div className="ml-4 space-y-1">
                <button
                  onClick={() => setCurrentView('iades-planning')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all ${
                    currentView === 'iades-planning' ? 'bg-white/20' : 'hover:bg-white/10 text-white/70'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Planning</span>
                </button>
                <button
                  onClick={() => setCurrentView('iades-list')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all ${
                    currentView === 'iades-list' ? 'bg-white/20' : 'hover:bg-white/10 text-white/70'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Équipe</span>
                </button>
                {canManageIades && (
                  <button
                    onClick={() => setCurrentView('iades-heures')}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all ${
                      currentView === 'iades-heures' ? 'bg-white/20' : 'hover:bg-white/10 text-white/70'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Saisie heures</span>
                  </button>
                )}
                {canManageIades && (
                  <button
                    onClick={() => setCurrentView('iades-stats')}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all ${
                      currentView === 'iades-stats' ? 'bg-white/20' : 'hover:bg-white/10 text-white/70'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Statistiques</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: currentUser?.color || theme.accent }}>
              {currentUser?.name?.split(' ').map(n => n[0]).join('') || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{currentUser?.name || 'Utilisateur'}</p>
              <p className="text-xs text-white/60">
                {isAdmin ? 'Admin' : isViewer ? 'Consultation' : isIade ? 'IADE' : 'Utilisateur'}
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
            {currentView === 'stats' && 'Statistiques'}
            {currentView === 'incoherences' && 'Détection des incohérences'}
            {currentView === 'remplacants' && 'Liste des remplaçants'}
            {currentView === 'iades-planning' && 'Planning IADES'}
            {currentView === 'iades-list' && 'Équipe IADES'}
            {currentView === 'iades-stats' && 'Statistiques IADES'}
            {currentView === 'iades-heures' && 'Saisie des heures IADES'}
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
                    {['week', 'month', 'year'].map(m => (
                      <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-2 rounded-xl text-sm font-medium ${viewMode === m ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
                        {m === 'week' ? 'Semaine' : m === 'month' ? 'Mois' : 'Année'}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowStats(!showStats)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> Stats
                    </button>
                    {canEditPlanning && (
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
                  
                  {viewMode === 'week' ? (
                    <div className="flex items-center gap-3 min-w-[280px] justify-center">
                      <span className="text-sm" style={{ color: theme.gray[500] }}>Semaine {getWeekNumber(currentWeekStart)}</span>
                      <span className="px-4 py-2 rounded-xl font-bold text-lg text-white" style={{ backgroundColor: theme.primary }}>
                        {currentWeekStart.toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase()} {currentWeekStart.getFullYear()}
                      </span>
                    </div>
                  ) : (
                    <span className="font-bold min-w-[200px] text-center">
                      {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </span>
                  )}

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
                                  onClick={() => {
                                    if (!canEditPlanning) return;
                                    if (a.isRemplacant) {
                                      removeRemplacant(a.scheduleId);
                                    } else {
                                      toggleAssignment(d, a.id, shift);
                                    }
                                  }}
                                  className={`text-xs px-2 py-1.5 rounded-lg text-white mb-1 ${canEditPlanning ? 'cursor-pointer hover:opacity-80' : ''} ${!a.isRemplacant && a.id === currentUser?.id ? 'ring-2 ring-yellow-400' : ''}`}
                                  style={{ backgroundColor: a.color }}
                                  title={a.isRemplacant && a.titulaireRemplace ? `${a.name} remplace ${a.titulaireRemplace}` : a.name}
                                >
                                  {a.isRemplacant ? (
                                    <>
                                      🔄 {a.name.split(' ')[1] || a.name.split(' ')[0]}
                                      {a.titulaireRemplace && (
                                        <span className="opacity-75"> → {a.titulaireRemplace.split(' ')[1] === 'EL' ? 'EL K.' : a.titulaireRemplace.split(' ')[1]?.substring(0, 4)}</span>
                                      )}
                                    </>
                                  ) : (
                                    <>Dr {a.name.split(' ')[1] === 'EL' ? 'EL KAMEL' : a.name.split(' ')[1]}</>
                                  )}
                                </div>
                              ))}
                              {canEditPlanning && (
                                <select
                                  className="w-full text-xs p-1.5 border rounded-lg mt-1"
                                  value=""
                                  onChange={(e) => {
                                    if (!e.target.value) return;
                                    if (e.target.value.startsWith('r_')) {
                                      // Remplaçant - ouvrir modal pour choisir qui est remplacé
                                      const remplacantId = parseInt(e.target.value.substring(2));
                                      setReplacementModal({
                                        date: formatDateKey(d),
                                        shift,
                                        remplacantId
                                      });
                                    } else {
                                      toggleAssignment(d, parseInt(e.target.value), shift);
                                    }
                                    e.target.value = '';
                                  }}
                                >
                                  <option value="">+ Ajouter</option>
                                  <optgroup label="── Titulaires ──">
                                    {anesthesists.filter(a => isTitulaire(a) && !getAssigned(d, shift).some(assigned => !assigned.isRemplacant && assigned.id === a.id)).map(a => (
                                      <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                  </optgroup>
                                  {remplacants.length > 0 && (
                                    <optgroup label="── Remplaçants ──">
                                      {remplacants.map(r => (
                                        <option key={`r_${r.id}`} value={`r_${r.id}`}>{r.name}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              )}
                            </div>
                          ))}

                          {/* Affichage des IADES si activé */}
                          {showIadesInPlanning && !isWE && !isHol && (
                            <div className="mt-2 pt-2 border-t border-dashed" style={{ borderColor: theme.gray[300] }}>
                              <div className="flex items-center gap-1 mb-1">
                                <Stethoscope className="w-3 h-3" style={{ color: '#059669' }} />
                                <span className="text-xs font-medium" style={{ color: '#059669' }}>IADES</span>
                              </div>
                              {getAssignedIades(d, 'bloc').map(iade => (
                                <div
                                  key={iade.id}
                                  className="text-xs px-2 py-1 rounded-lg text-white mb-1"
                                  style={{ backgroundColor: iade.color }}
                                >
                                  {iade.name}
                                </div>
                              ))}
                              {getAssignedIades(d, 'bloc').length === 0 && (
                                <span className="text-xs italic" style={{ color: theme.gray[400] }}>-</span>
                              )}
                            </div>
                          )}
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

              {/* Vue Année */}
              {viewMode === 'year' && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b flex items-center justify-between">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear() - 1, 0, 1))} className="p-2 rounded-xl hover:bg-gray-100">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-bold">{currentMonth.getFullYear()}</h3>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear() + 1, 0, 1))} className="p-2 rounded-xl hover:bg-gray-100">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-4 p-4">
                    {Array.from({ length: 12 }, (_, monthIndex) => {
                      const monthDate = new Date(currentMonth.getFullYear(), monthIndex, 1);
                      const monthName = monthDate.toLocaleDateString('fr-FR', { month: 'long' });
                      const daysInMonth = new Date(currentMonth.getFullYear(), monthIndex + 1, 0).getDate();

                      // Calculer les stats du mois
                      let totalAssignments = 0;
                      let weCount = 0;

                      for (let day = 1; day <= daysInMonth; day++) {
                        const d = new Date(currentMonth.getFullYear(), monthIndex, day);
                        const dateKey = formatDateKey(d);
                        const daySchedule = schedule[dateKey];
                        if (daySchedule) {
                          Object.values(daySchedule).forEach(ids => {
                            totalAssignments += ids.length;
                          });
                        }
                        if (isWeekend(d)) weCount++;
                      }

                      return (
                        <div
                          key={monthIndex}
                          className="border rounded-xl p-3 hover:bg-gray-50 cursor-pointer transition-all"
                          onClick={() => {
                            setCurrentMonth(monthDate);
                            setViewMode('month');
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold capitalize">{monthName}</span>
                            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: theme.gray[100] }}>
                              {daysInMonth}j
                            </span>
                          </div>
                          <div className="text-xs space-y-1" style={{ color: theme.gray[500] }}>
                            <div className="flex justify-between">
                              <span>Assignations:</span>
                              <span className="font-medium" style={{ color: theme.gray[700] }}>{totalAssignments}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Week-ends:</span>
                              <span className="font-medium" style={{ color: theme.gray[700] }}>{weCount / 2} WE</span>
                            </div>
                          </div>
                          {/* Mini calendrier visuel */}
                          <div className="mt-2 grid grid-cols-7 gap-0.5">
                            {Array.from({ length: daysInMonth }, (_, i) => {
                              const d = new Date(currentMonth.getFullYear(), monthIndex, i + 1);
                              const dateKey = formatDateKey(d);
                              const hasData = schedule[dateKey] && Object.keys(schedule[dateKey]).length > 0;
                              const isWE = isWeekend(d);
                              return (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-sm ${hasData ? 'bg-blue-500' : isWE ? 'bg-gray-200' : 'bg-gray-100'}`}
                                  title={`${i + 1} ${monthName}`}
                                />
                              );
                            })}
                          </div>
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
                  {anesthesists.filter(a => isTitulaire(a)).map(a => (
                    <button
                      key={a.id}
                      onClick={() => {
                        const titulaires = anesthesists.filter(x => isTitulaire(x));
                        const allSelected = selectedFilters.size === titulaires.length + 1;
                        if (allSelected) {
                          setSelectedFilters(new Set([a.id]));
                        } else if (selectedFilters.has(a.id) && selectedFilters.size === 1) {
                          setSelectedFilters(new Set([...titulaires.map(x => x.id), 'remplacants']));
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
                  {/* Bouton Remplaçants */}
                  <button
                    onClick={() => {
                      if (selectedFilters.has('remplacants')) {
                        const f = new Set(selectedFilters);
                        f.delete('remplacants');
                        setSelectedFilters(f);
                      } else {
                        const f = new Set(selectedFilters);
                        f.add('remplacants');
                        setSelectedFilters(f);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${selectedFilters.has('remplacants') ? 'text-white' : ''}`}
                    style={selectedFilters.has('remplacants') ? { backgroundColor: theme.gray[600], borderColor: theme.gray[600] } : { borderColor: theme.gray[200], color: theme.gray[400] }}
                  >
                    Remplaçants
                  </button>
                  <button onClick={() => setSelectedFilters(new Set([...anesthesists.filter(a => isTitulaire(a)).map(a => a.id), 'remplacants']))} className="text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: theme.gray[100] }}>Tous</button>
                  <button onClick={() => setSelectedFilters(new Set())} className="text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: theme.gray[100] }}>Aucun</button>

                  {/* Séparateur et toggle IADES */}
                  <div className="border-l border-gray-300 h-6 mx-2"></div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showIadesInPlanning}
                      onChange={(e) => setShowIadesInPlanning(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium" style={{ color: theme.gray[600] }}>
                      <Stethoscope className="w-4 h-4 inline mr-1" />
                      Afficher IADES
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STATISTIQUES */}
          {currentView === 'stats' && (
            <div>
              {/* Filtres de période */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: theme.gray[600] }}>Période :</span>
                  <input
                    type="date"
                    value={statsPeriod.start}
                    onChange={(e) => setStatsPeriod(p => ({ ...p, start: e.target.value }))}
                    className="px-3 py-1.5 border rounded-lg text-sm"
                    style={{ borderColor: theme.gray[300] }}
                  />
                  <span style={{ color: theme.gray[400] }}>→</span>
                  <input
                    type="date"
                    value={statsPeriod.end}
                    onChange={(e) => setStatsPeriod(p => ({ ...p, end: e.target.value }))}
                    className="px-3 py-1.5 border rounded-lg text-sm"
                    style={{ borderColor: theme.gray[300] }}
                  />
                  {(statsPeriod.start || statsPeriod.end) && (
                    <button
                      onClick={() => setStatsPeriod({ start: '', end: '' })}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: theme.gray[100], color: theme.gray[600] }}
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
              </div>

              {/* Tableau des TITULAIRES */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: theme.gray[800] }}>Anesthésistes titulaires</h3>
                    <p className="text-sm" style={{ color: theme.gray[500] }}>Médecins permanents de l'équipe</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ backgroundColor: theme.gray[50] }}>
                        <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Nom</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>ETP</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Blocs</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Consult.</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Astreintes</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>WE</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Fériés</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Total</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.danger }}>Jours remplacé</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculateFullStats(statsPeriod.start || null, statsPeriod.end || null).filter(stat => stat.isTitulaire).map(stat => (
                        <tr key={stat.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                              <span className="font-medium">{stat.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm">{Math.round(stat.etp * 100)}%</td>
                          <td className="px-4 py-3 text-center text-sm">{stat.bloc}</td>
                          <td className="px-4 py-3 text-center text-sm">{stat.consultation}</td>
                          <td className="px-4 py-3 text-center text-sm">{stat.astreinte}</td>
                          <td className="px-4 py-3 text-center text-sm">{stat.we}</td>
                          <td className="px-4 py-3 text-center text-sm">{stat.ferie}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{stat.total}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              stat.joursRemplaces > 5 ? 'bg-red-100 text-red-700' :
                              stat.joursRemplaces > 2 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {stat.joursRemplaces} j
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SÉPARATION */}
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px" style={{ backgroundColor: theme.gray[300] }}></div>
                <span className="text-sm font-medium px-4" style={{ color: theme.gray[500] }}>⬇️ Remplaçants ⬇️</span>
                <div className="flex-1 h-px" style={{ backgroundColor: theme.gray[300] }}></div>
              </div>

              {/* Tableau des REMPLAÇANTS */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6" style={{ borderColor: theme.gray[300] }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.gray[600] }}>
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: theme.gray[800] }}>Remplaçants</h3>
                    <p className="text-sm" style={{ color: theme.gray[500] }}>Médecins ayant effectué des remplacements</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ backgroundColor: theme.gray[100] }}>
                        <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Nom</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Blocs</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Consult.</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Astreintes</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Bloc+Astr.</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>WE</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Fériés</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Total jours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculateFullStats(statsPeriod.start || null, statsPeriod.end || null).filter(stat => !stat.isTitulaire && stat.total > 0).map(stat => (
                        <tr key={stat.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.gray[400] }} />
                              <span className="font-medium">{stat.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm">{stat.bloc}</td>
                          <td className="px-4 py-3 text-center text-sm">{stat.consultation}</td>
                          <td className="px-4 py-3 text-center text-sm">{stat.astreinte}</td>
                          <td className="px-4 py-3 text-center text-sm" style={{ color: stat.blocAstreinte > 0 ? theme.accent : 'inherit' }}>{stat.blocAstreinte}</td>
                          <td className="px-4 py-3 text-center text-sm">{stat.we}</td>
                          <td className="px-4 py-3 text-center text-sm">{stat.ferie}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{stat.total}</td>
                        </tr>
                      ))}
                      {calculateFullStats(statsPeriod.start || null, statsPeriod.end || null).filter(stat => !stat.isTitulaire && stat.total > 0).length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: theme.gray[500] }}>
                            Aucun remplaçant n'a encore travaillé
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Détail des remplacements */}
              {(() => {
                const filteredRemplacements = remplacements.filter(r => {
                  if (statsPeriod.start && r.date < statsPeriod.start) return false;
                  if (statsPeriod.end && r.date > statsPeriod.end) return false;
                  return true;
                });
                return filteredRemplacements.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-6">
                  <h3 className="font-bold mb-4" style={{ color: theme.gray[800] }}>Détails des remplacements ({filteredRemplacements.length})</h3>
                  <div className="space-y-2">
                    {filteredRemplacements.sort((a, b) => b.date.localeCompare(a.date)).map(r => {
                      const titulaire = anesthesists.find(a => a.id === r.titulaire_id);
                      return (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: theme.gray[50] }}>
                          <div>
                            <span className="font-medium">{new Date(r.date).toLocaleDateString('fr-FR')}</span>
                            <span className="mx-2">-</span>
                            <span className="text-sm" style={{ color: theme.gray[600] }}>
                              {r.remplacant_name} remplace <strong>{titulaire?.name || '?'}</strong>
                            </span>
                            <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: theme.gray[200] }}>
                              {getShiftLabel(r.shift)}
                            </span>
                          </div>
                          {canEditPlanning && (
                            <button onClick={() => deleteRemplacement(r.id)} className="p-1 rounded hover:bg-red-100" style={{ color: theme.danger }}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
              })()}
            </div>
          )}

          {/* INCOHÉRENCES */}
          {currentView === 'incoherences' && (
            <div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                {getIncoherences().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold" style={{ color: theme.gray[800] }}>Tout est en ordre !</h3>
                    <p style={{ color: theme.gray[500] }} className="mt-2">Aucune incohérence détectée dans le planning.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-4 mb-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <span>Erreur ({getIncoherences().filter(i => i.severity === 'error').length})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                        <span>Attention ({getIncoherences().filter(i => i.severity === 'warning').length})</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {getIncoherences().map((inc, idx) => {
                        const date = new Date(inc.date);
                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border-l-4 ${
                              inc.severity === 'error'
                                ? 'bg-red-50 border-red-500'
                                : 'bg-yellow-50 border-yellow-500'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold" style={{ color: theme.gray[800] }}>
                                  {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                                <div className={`text-sm ${inc.severity === 'error' ? 'text-red-700' : 'text-yellow-700'}`}>
                                  {inc.message}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setCurrentWeekStart(getMonday(date));
                                  setCurrentView('planning');
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
                  </>
                )}
              </div>
            </div>
          )}

          {/* REMPLAÇANTS */}
          {currentView === 'remplacants' && (
            <div>
              <div className="flex justify-between mb-6">
                <p style={{ color: theme.gray[500] }}>Liste des médecins remplaçants de la clinique</p>
                {canEditPlanning && (
                  <button
                    onClick={() => setEditingRemplacant({ name: '', email: '', phone: '', specialite: '', notes: '' })}
                    className="px-4 py-2 text-white rounded-xl font-medium flex items-center gap-2"
                    style={{ backgroundColor: theme.primary }}
                  >
                    <UserPlus className="w-4 h-4" /> Ajouter
                  </button>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                {remplacants.length === 0 ? (
                  <p style={{ color: theme.gray[500] }}>Aucun remplaçant enregistré</p>
                ) : (
                  <div className="space-y-4">
                    {remplacants.map(r => (
                      <div key={r.id} className="p-4 rounded-xl border border-gray-200 flex items-center justify-between hover:bg-gray-50">
                        <div>
                          <h4 className="font-semibold" style={{ color: theme.gray[800] }}>{r.name}</h4>
                          {r.specialite && (
                            <p className="text-sm" style={{ color: theme.gray[500] }}>{r.specialite}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: theme.gray[600] }}>
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
                            <p className="text-sm mt-2 italic" style={{ color: theme.gray[500] }}>{r.notes}</p>
                          )}
                        </div>
                        {canEditPlanning && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingRemplacant(r)}
                              className="p-2 rounded-xl hover:bg-blue-50"
                              style={{ color: theme.accent }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteRemplacant(r.id)}
                              className="p-2 rounded-xl hover:bg-red-50"
                              style={{ color: theme.danger }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
          {currentView === 'admin' && (canManageAnesthesists || canManageIades) && (
            <div>
              {/* Gestion des médecins - Visible uniquement pour Admin global */}
              {canManageAnesthesists && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">Gestion des médecins</h3>
                    <button
                      onClick={() => setEditingAnesth({ name: '', email: '', phone: '', role: 'user', etp: 0.5, is_iade_admin: false })}
                      className="px-4 py-2 text-white rounded-xl font-medium flex items-center gap-2"
                      style={{ backgroundColor: theme.primary }}
                    >
                      <UserPlus className="w-4 h-4" /> Ajouter
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Nom</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Email</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Téléphone</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Rôle</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Admin IADE</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>ETP</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: theme.gray[600] }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {anesthesists.filter(a => a.role !== 'viewer').map(a => (
                          <tr key={a.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                                {a.name}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm" style={{ color: theme.gray[600] }}>{a.email}</td>
                            <td className="px-4 py-3 text-sm" style={{ color: theme.gray[600] }}>{a.phone || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs ${
                                a.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {a.role === 'admin' ? 'Admin' : 'Utilisateur'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded text-xs ${a.is_iade_admin ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {a.is_iade_admin ? '✓ Oui' : 'Non'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">{`${Math.round((a.etp || 0.5) * 100)}%`}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setEditingAnesth(a)}
                                  className="p-2 rounded-xl hover:bg-blue-50"
                                  style={{ color: theme.accent }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                {a.id !== currentUser?.id && (
                                  <button
                                    onClick={() => deleteAnesthesist(a.id)}
                                    className="p-2 rounded-xl hover:bg-red-50"
                                    style={{ color: theme.danger }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Comptes consultation seule */}
              {canManageAnesthesists && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold" style={{ color: theme.gray[800] }}>👁️ Comptes en consultation seule</h3>
                      <p className="text-sm" style={{ color: theme.gray[600] }}>
                        Ces comptes peuvent uniquement consulter le planning, sans possibilité de modification.
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingAnesth({ name: '', email: '', phone: '', role: 'viewer', etp: 0 })}
                      className="px-4 py-2 text-white rounded-xl font-medium flex items-center gap-2"
                      style={{ backgroundColor: theme.gray[600] }}
                    >
                      <UserPlus className="w-4 h-4" /> Ajouter
                    </button>
                  </div>

                  {anesthesists.filter(a => a.role === 'viewer').length > 0 ? (
                    <div className="overflow-x-auto bg-white rounded-xl">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b" style={{ backgroundColor: theme.gray[50] }}>
                            <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Nom</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Email</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Téléphone</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: theme.gray[600] }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {anesthesists.filter(a => a.role === 'viewer').map(a => (
                            <tr key={a.id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium">{a.name}</td>
                              <td className="px-4 py-3 text-sm" style={{ color: theme.gray[600] }}>{a.email}</td>
                              <td className="px-4 py-3 text-sm" style={{ color: theme.gray[600] }}>{a.phone || '-'}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingAnesth(a)}
                                    className="p-2 rounded-xl hover:bg-blue-50"
                                    style={{ color: theme.accent }}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteAnesthesist(a.id)}
                                    className="p-2 rounded-xl hover:bg-red-50"
                                    style={{ color: theme.danger }}
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
                  ) : (
                    <div className="bg-white rounded-xl p-4 text-center">
                      <p className="text-sm italic" style={{ color: theme.gray[500] }}>
                        Aucun compte en consultation. Cliquez sur "Ajouter" pour en créer un.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {canManageAnesthesists && (
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
              )}

              {/* Section gestion des IADEs - Visible pour Admin global et Admin IADE */}
              {canManageIades && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold">Gestion des IADEs</h3>
                      <p className="text-sm" style={{ color: theme.gray[500] }}>Gérer l'accès des IADEs à l'outil</p>
                    </div>
                    <button
                      onClick={() => setEditingIade({ name: '', email: '', phone: '', is_titulaire: true, actif: true, role: 'iade' })}
                      className="px-4 py-2 text-white rounded-xl font-medium flex items-center gap-2"
                      style={{ backgroundColor: '#059669' }}
                    >
                      <UserPlus className="w-4 h-4" /> Ajouter IADE
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b" style={{ backgroundColor: theme.gray[50] }}>
                          <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Nom</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Email</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Téléphone</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Titulaire</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Actif</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: theme.gray[600] }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {iades.map(iade => (
                          <tr key={iade.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{iade.name}</td>
                            <td className="px-4 py-3 text-sm" style={{ color: theme.gray[600] }}>{iade.email || '-'}</td>
                            <td className="px-4 py-3 text-sm" style={{ color: theme.gray[600] }}>{iade.phone || '-'}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded text-xs ${iade.is_titulaire ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {iade.is_titulaire ? 'Oui' : 'Non'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded text-xs ${iade.actif ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                {iade.actif ? 'Actif' : 'Inactif'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setEditingIade(iade)}
                                  className="p-2 rounded-xl hover:bg-blue-50"
                                  style={{ color: theme.accent }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { if(confirm('Supprimer cet IADE ?')) deleteIade(iade.id); }}
                                  className="p-2 rounded-xl hover:bg-red-50"
                                  style={{ color: theme.danger }}
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
              )}

              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold mb-4">Jours fériés {new Date().getFullYear()} / {new Date().getFullYear() + 1}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[...getHolidaysForYear(new Date().getFullYear()), ...getHolidaysForYear(new Date().getFullYear() + 1)].map(h => (
                    <div key={h.date} className="p-2 rounded-lg text-sm" style={{ backgroundColor: theme.gray[50] }}>
                      <span className="font-medium">{new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
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
                  <input type="text" readOnly value={`https://vqlieplrtrvqcvllhmob.supabase.co/functions/v1/smart-handler/${currentUser?.ics_token}.ics`} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50" />
                  <button onClick={() => { navigator.clipboard.writeText(`https://vqlieplrtrvqcvllhmob.supabase.co/functions/v1/smart-handler/${currentUser?.ics_token}.ics`); alert('Lien copié !'); }} className="px-4 py-2 rounded-xl border border-gray-200 flex items-center gap-2 hover:bg-gray-50">
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

              <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-6">
                <h3 className="font-bold mb-4">🔐 Sécurité</h3>
                <p className="text-sm mb-4" style={{ color: theme.gray[500] }}>
                  Modifiez votre mot de passe de connexion.
                </p>
                <button
                  onClick={() => setShowPasswordReset(true)}
                  className="px-4 py-2 rounded-xl border border-gray-200 flex items-center gap-2 hover:bg-gray-50"
                >
                  Changer mon mot de passe
                </button>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* VUES IADES */}
          {/* ============================================ */}

          {/* PLANNING IADES */}
          {currentView === 'iades-planning' && (
            <div className="w-full">
              {/* Navigation semaine */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <button onClick={() => setCurrentWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })} className="p-2 rounded-xl hover:bg-gray-100">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setCurrentWeekStart(getMonday(new Date()))} className="px-4 py-2 rounded-xl hover:bg-gray-100 text-sm">Aujourd'hui</button>
                <h2 className="text-lg font-semibold" style={{ color: theme.gray[800] }}>
                  Semaine {getWeekNumber(currentWeekStart)} - {currentWeekStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={() => setCurrentWeekStart(d => { const n = new Date(d); n.setDate(d.getDate() + 7); return n; })} className="p-2 rounded-xl hover:bg-gray-100">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Filtres IADES */}
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium" style={{ color: theme.gray[600] }}>Filtrer :</span>
                {iades.filter(i => i.actif).map(iade => (
                  <button
                    key={iade.id}
                    onClick={() => {
                      const f = new Set(selectedIadesFilters);
                      if (f.has(iade.id)) f.delete(iade.id);
                      else f.add(iade.id);
                      setSelectedIadesFilters(f);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${selectedIadesFilters.has(iade.id) ? 'text-white' : ''}`}
                    style={selectedIadesFilters.has(iade.id) ? { backgroundColor: iade.color, borderColor: iade.color } : { borderColor: theme.gray[200], color: theme.gray[400] }}
                  >
                    {iade.name}
                  </button>
                ))}
                <button onClick={() => setSelectedIadesFilters(new Set(iades.map(i => i.id)))} className="text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: theme.gray[100] }}>Tous</button>
                <button onClick={() => setSelectedIadesFilters(new Set())} className="text-xs px-3 py-1 rounded-lg" style={{ backgroundColor: theme.gray[100] }}>Aucun</button>
              </div>

              {/* Grille planning IADES - Journées de bloc */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden w-full">
                <div className="grid grid-cols-7 border-b" style={{ backgroundColor: theme.gray[50] }}>
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day, i) => {
                    const d = new Date(currentWeekStart);
                    d.setDate(d.getDate() + i);
                    const isToday = formatDateKey(d) === formatDateKey(new Date());
                    return (
                      <div key={i} className={`p-4 text-center border-r last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}>
                        <div className="text-xs uppercase tracking-wider mb-1" style={{ color: theme.gray[500] }}>{day}</div>
                        <div className={`text-2xl font-bold ${isToday ? 'text-blue-600' : ''}`} style={{ color: isToday ? undefined : theme.gray[800] }}>{d.getDate()}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Une seule ligne pour les journées bloc */}
                <div className="grid grid-cols-7">
                  {[0, 1, 2, 3, 4, 5, 6].map(i => {
                    const d = new Date(currentWeekStart);
                    d.setDate(d.getDate() + i);
                    const assigned = getAssignedIades(d, 'bloc');
                    const isWE = isWeekend(d);
                    const isHol = isHoliday(d);
                    const isClosed = isWE || isHol; // Bloc fermé WE et fériés

                    return (
                      <div key={i} className="p-3 border-r last:border-r-0 min-h-[150px]" style={{ backgroundColor: isClosed ? theme.gray[100] : 'white' }}>
                        {isClosed ? (
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <span className="text-2xl mb-2">🚫</span>
                            <span className="text-xs font-medium" style={{ color: theme.gray[400] }}>
                              {isHol ? 'Férié' : 'Week-end'}
                            </span>
                            <span className="text-xs" style={{ color: theme.gray[400] }}>Bloc fermé</span>
                          </div>
                        ) : (
                          <>
                            <div className="text-xs font-medium mb-3" style={{ color: theme.gray[500] }}>
                              🏥 Bloc
                            </div>
                            <div className="space-y-2">
                              {assigned.map(iade => (
                                <div key={iade.id} className="flex items-center gap-1 group">
                                  <span className="px-3 py-1.5 rounded-lg text-sm text-white truncate flex-1 font-medium" style={{ backgroundColor: iade.color }}>
                                    {iade.isRemplacant ? '🔄 ' : ''}{iade.name}
                                  </span>
                                  {canEditIadePlanning && (
                                    <button onClick={() => removeIadeAssignment(iade.scheduleId)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100">
                                      <X className="w-4 h-4 text-red-500" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {canEditIadePlanning && (
                                <select
                                  className="w-full text-sm p-2 border rounded-lg mt-2"
                                  style={{ borderColor: theme.gray[300] }}
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      assignIade(d, 'bloc', parseInt(e.target.value));
                                      e.target.value = '';
                                    }
                                  }}
                                >
                                  <option value="">+ Ajouter IADE</option>
                                  {iades.filter(iade => iade.actif && !assigned.some(a => a.id === iade.id)).map(iade => (
                                    <option key={iade.id} value={iade.id}>{iade.name}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* LISTE IADES */}
          {currentView === 'iades-list' && (
            <div className="w-full">
              {/* TITULAIRES */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 w-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#059669' }}>
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold" style={{ color: theme.gray[800] }}>IADES Titulaires</h3>
                      <p className="text-sm" style={{ color: theme.gray[500] }}>Équipe permanente</p>
                    </div>
                  </div>
                  {canManageIades && (
                    <button
                      onClick={() => setEditingIade({ is_titulaire: true, actif: true })}
                      className="flex items-center gap-2 px-4 py-2 text-white rounded-xl"
                      style={{ backgroundColor: theme.accent }}
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ backgroundColor: theme.gray[50] }}>
                        <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Nom</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Téléphone</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Email</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Actif</th>
                        {canManageIades && <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: theme.gray[600] }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {iades.filter(i => i.is_titulaire).map(iade => (
                        <tr key={iade.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{iade.name}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: theme.gray[600] }}>{iade.phone || '-'}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: theme.gray[600] }}>{iade.email || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${iade.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {iade.actif ? 'Oui' : 'Non'}
                            </span>
                          </td>
                          {canManageIades && (
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => setEditingIade(iade)} className="p-1.5 rounded hover:bg-gray-100 mr-1">
                                <Edit2 className="w-4 h-4" style={{ color: theme.gray[500] }} />
                              </button>
                              <button onClick={() => { if(confirm('Supprimer cet IADE ?')) deleteIade(iade.id); }} className="p-1.5 rounded hover:bg-red-100">
                                <Trash2 className="w-4 h-4" style={{ color: theme.danger }} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {iades.filter(i => i.is_titulaire).length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: theme.gray[500] }}>Aucun IADE titulaire</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* REMPLAÇANTS IADES */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.gray[500] }}>
                      <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold" style={{ color: theme.gray[800] }}>IADES Remplaçants</h3>
                      <p className="text-sm" style={{ color: theme.gray[500] }}>Personnel de remplacement</p>
                    </div>
                  </div>
                  {canManageIades && (
                    <button
                      onClick={() => setEditingIade({ is_titulaire: false, actif: true })}
                      className="flex items-center gap-2 px-4 py-2 text-white rounded-xl"
                      style={{ backgroundColor: theme.gray[600] }}
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ backgroundColor: theme.gray[50] }}>
                        <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Nom</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Téléphone</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Email</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Actif</th>
                        {canManageIades && <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: theme.gray[600] }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {iades.filter(i => !i.is_titulaire).map(iade => (
                        <tr key={iade.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{iade.name}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: theme.gray[600] }}>{iade.phone || '-'}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: theme.gray[600] }}>{iade.email || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${iade.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {iade.actif ? 'Oui' : 'Non'}
                            </span>
                          </td>
                          {canManageIades && (
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => setEditingIade(iade)} className="p-1.5 rounded hover:bg-gray-100 mr-1">
                                <Edit2 className="w-4 h-4" style={{ color: theme.gray[500] }} />
                              </button>
                              <button onClick={() => { if(confirm('Supprimer cet IADE ?')) deleteIade(iade.id); }} className="p-1.5 rounded hover:bg-red-100">
                                <Trash2 className="w-4 h-4" style={{ color: theme.danger }} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {iades.filter(i => !i.is_titulaire).length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: theme.gray[500] }}>Aucun IADE remplaçant</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SAISIE HEURES IADES */}
          {currentView === 'iades-heures' && (
            <div className="w-full">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 w-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.accent }}>
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: theme.gray[800] }}>Saisie des heures</h3>
                    <p className="text-sm" style={{ color: theme.gray[500] }}>
                      {isIade ? 'Enregistrez vos heures de travail' : 'Heures déclarées par les IADES'}
                    </p>
                  </div>
                </div>

                {/* Formulaire de saisie */}
                {(isIade || isAdmin) && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target;
                    const iadeId = isIade ? currentIade.id : parseInt(form.iade_id.value);
                    const date = form.date.value;
                    const heures = parseFloat(form.heures.value);
                    const commentaire = form.commentaire.value;

                    if (iadeId && date && heures) {
                      await saveIadeHeures(iadeId, date, heures, commentaire);
                      form.reset();
                    }
                  }} className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {!isIade && (
                        <div>
                          <label className="block text-sm font-medium mb-1">IADE</label>
                          <select name="iade_id" required className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: theme.gray[300] }}>
                            <option value="">Sélectionner...</option>
                            {iades.filter(i => i.actif).map(iade => (
                              <option key={iade.id} value={iade.id}>{iade.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input type="date" name="date" required className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: theme.gray[300] }} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Heures</label>
                        <input type="number" name="heures" step="0.5" min="0" max="24" required placeholder="Ex: 8.5" className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: theme.gray[300] }} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Commentaire</label>
                        <input type="text" name="commentaire" placeholder="Optionnel..." className="w-full px-3 py-2 border rounded-lg" style={{ borderColor: theme.gray[300] }} />
                      </div>
                    </div>
                    <button type="submit" className="mt-4 px-4 py-2 text-white rounded-lg font-medium" style={{ backgroundColor: theme.accent }}>
                      Enregistrer
                    </button>
                  </form>
                )}

                {/* Liste des heures saisies */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ backgroundColor: theme.gray[50] }}>
                        <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Date</th>
                        {!isIade && <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>IADE</th>}
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Heures</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Commentaire</th>
                        {(isAdmin || isIade) && <th className="px-4 py-3 text-right text-sm font-semibold" style={{ color: theme.gray[600] }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {iadesHeures
                        .filter(h => isIade ? h.iade_id === currentIade?.id : true)
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .slice(0, 50)
                        .map(h => {
                          const iade = iades.find(i => i.id === h.iade_id);
                          return (
                            <tr key={h.id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium">{new Date(h.date).toLocaleDateString('fr-FR')}</td>
                              {!isIade && <td className="px-4 py-3 text-sm">{iade?.name || '?'}</td>}
                              <td className="px-4 py-3 text-center font-bold">{h.heures}h</td>
                              <td className="px-4 py-3 text-sm" style={{ color: theme.gray[600] }}>{h.commentaire || '-'}</td>
                              {(isAdmin || (isIade && h.iade_id === currentIade?.id)) && (
                                <td className="px-4 py-3 text-right">
                                  <button onClick={() => { if(confirm('Supprimer cette entrée ?')) deleteIadeHeures(h.id); }} className="p-1.5 rounded hover:bg-red-100">
                                    <Trash2 className="w-4 h-4" style={{ color: theme.danger }} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      {iadesHeures.filter(h => isIade ? h.iade_id === currentIade?.id : true).length === 0 && (
                        <tr><td colSpan={isIade ? 4 : 5} className="px-4 py-8 text-center text-sm" style={{ color: theme.gray[500] }}>Aucune heure enregistrée</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STATS IADES */}
          {currentView === 'iades-stats' && (
            <div className="w-full">
              {/* Filtres de période */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 w-full">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: theme.gray[600] }}>Période :</span>
                  <input
                    type="date"
                    value={iadesStatsPeriod.start}
                    onChange={(e) => setIadesStatsPeriod(p => ({ ...p, start: e.target.value }))}
                    className="px-3 py-1.5 border rounded-lg text-sm"
                    style={{ borderColor: theme.gray[300] }}
                  />
                  <span style={{ color: theme.gray[400] }}>→</span>
                  <input
                    type="date"
                    value={iadesStatsPeriod.end}
                    onChange={(e) => setIadesStatsPeriod(p => ({ ...p, end: e.target.value }))}
                    className="px-3 py-1.5 border rounded-lg text-sm"
                    style={{ borderColor: theme.gray[300] }}
                  />
                  {(iadesStatsPeriod.start || iadesStatsPeriod.end) && (
                    <button
                      onClick={() => setIadesStatsPeriod({ start: '', end: '' })}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ backgroundColor: theme.gray[100], color: theme.gray[600] }}
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
              </div>

              {/* Tableau stats */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#059669' }}>
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: theme.gray[800] }}>Statistiques IADES</h3>
                    <p className="text-sm" style={{ color: theme.gray[500] }}>Récapitulatif des journées travaillées</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ backgroundColor: theme.gray[50] }}>
                        <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.gray[600] }}>Nom</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Type</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Jours travaillés</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.gray[600] }}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculateIadesStats(iadesStatsPeriod.start || null, iadesStatsPeriod.end || null).map(stat => (
                        <tr key={stat.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{stat.name}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${stat.is_titulaire ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {stat.is_titulaire ? 'Titulaire' : 'Remplaçant'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-lg font-bold">{stat.total}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${stat.total > 20 ? 'bg-red-100 text-red-700' : stat.total > 15 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                              {stat.total > 20 ? '⚠️ Alerte' : stat.total > 15 ? '⚡ Attention' : '✅ OK'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {iades.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: theme.gray[500] }}>Aucun IADE enregistré</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
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

      {/* MODAL EDITION IADE */}
      {editingIade && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingIade.id ? 'Modifier IADE' : 'Nouvel IADE'}</h2>
              <button onClick={() => setEditingIade(null)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const data = {
                name: form.name.value,
                phone: form.phone.value,
                email: form.email.value,
                is_titulaire: form.is_titulaire.checked,
                actif: form.actif.checked
              };
              if (editingIade.id) {
                await updateIade(editingIade.id, data);
              } else {
                await addIade(data);
              }
              setEditingIade(null);
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom complet</label>
                <input name="name" defaultValue={editingIade.name || ''} required className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Téléphone</label>
                <input name="phone" defaultValue={editingIade.phone || ''} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input name="email" type="email" defaultValue={editingIade.email || ''} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input name="is_titulaire" type="checkbox" defaultChecked={editingIade.is_titulaire} />
                  <span className="text-sm">Titulaire</span>
                </label>
                <label className="flex items-center gap-2">
                  <input name="actif" type="checkbox" defaultChecked={editingIade.actif !== false} />
                  <span className="text-sm">Actif</span>
                </label>
              </div>
              <button type="submit" className="w-full py-2 text-white rounded-xl font-medium" style={{ backgroundColor: theme.accent }}>
                {editingIade.id ? 'Enregistrer' : 'Créer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ETP */}
      {showETPModal && (
        <ETPModal
          anesthesists={anesthesists.filter(a => a.role !== 'viewer')}
          onClose={() => setShowETPModal(false)}
          onSave={async (newETPs) => {
            for (const [id, etp] of Object.entries(newETPs)) {
              await supabase.from('anesthesists').update({ etp }).eq('id', parseInt(id));
            }
            await loadData();
            setShowETPModal(false);
          }}
          theme={theme}
        />
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

      {/* MODAL ÉDITION REMPLAÇANT */}
      {editingRemplacant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingRemplacant.id ? 'Modifier le remplaçant' : 'Nouveau remplaçant'}
              </h2>
              <button onClick={() => setEditingRemplacant(null)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom *</label>
                <input
                  type="text"
                  value={editingRemplacant.name}
                  onChange={(e) => setEditingRemplacant({...editingRemplacant, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="Dr Jean DUPONT"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={editingRemplacant.phone || ''}
                  onChange={(e) => setEditingRemplacant({...editingRemplacant, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editingRemplacant.email || ''}
                  onChange={(e) => setEditingRemplacant({...editingRemplacant, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Spécialité</label>
                <input
                  type="text"
                  value={editingRemplacant.specialite || ''}
                  onChange={(e) => setEditingRemplacant({...editingRemplacant, specialite: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="Anesthésie générale"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={editingRemplacant.notes || ''}
                  onChange={(e) => setEditingRemplacant({...editingRemplacant, notes: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl"
                  rows={2}
                  placeholder="Disponibilités, préférences..."
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setEditingRemplacant(null)}
                className="px-4 py-2 border rounded-xl hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => saveRemplacant(editingRemplacant)}
                disabled={!editingRemplacant.name}
                className="px-4 py-2 text-white rounded-xl disabled:opacity-50"
                style={{ backgroundColor: theme.primary }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ÉDITION ANESTHÉSISTE */}
      {editingAnesth && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingAnesth.id ? 'Modifier le médecin' : 'Nouveau médecin'}
              </h2>
              <button onClick={() => setEditingAnesth(null)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom complet *</label>
                <input
                  type="text"
                  value={editingAnesth.name}
                  onChange={(e) => setEditingAnesth({...editingAnesth, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="Prénom NOM"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={editingAnesth.email}
                  onChange={(e) => setEditingAnesth({...editingAnesth, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={editingAnesth.phone || ''}
                  onChange={(e) => setEditingAnesth({...editingAnesth, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rôle</label>
                <select
                  value={editingAnesth.role}
                  onChange={(e) => setEditingAnesth({...editingAnesth, role: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="user">Utilisateur (peut modifier)</option>
                  <option value="admin">Administrateur</option>
                  <option value="viewer">Consultation seule</option>
                </select>
              </div>
              {editingAnesth.role !== 'viewer' && (
                <div>
                  <label className="block text-sm font-medium mb-1">ETP (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={Math.round((editingAnesth.etp || 0.5) * 100)}
                    onChange={(e) => setEditingAnesth({...editingAnesth, etp: parseInt(e.target.value) / 100})}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              )}
              {editingAnesth.role !== 'viewer' && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: theme.gray[50] }}>
                  <input
                    type="checkbox"
                    id="is_iade_admin"
                    checked={editingAnesth.is_iade_admin || false}
                    onChange={(e) => setEditingAnesth({...editingAnesth, is_iade_admin: e.target.checked})}
                    className="w-5 h-5 rounded"
                  />
                  <label htmlFor="is_iade_admin" className="cursor-pointer">
                    <div className="font-medium text-sm">Admin IADE</div>
                    <div className="text-xs" style={{ color: theme.gray[500] }}>Peut gérer le planning et les accès des IADEs</div>
                  </label>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setEditingAnesth(null)}
                className="px-4 py-2 border rounded-xl hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => saveAnesthesist(editingAnesth)}
                disabled={!editingAnesth.name || !editingAnesth.email}
                className="px-4 py-2 text-white rounded-xl disabled:opacity-50"
                style={{ backgroundColor: theme.primary }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REMPLACEMENT - Choix du titulaire remplacé */}
      {replacementModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Qui est remplacé ?</h2>
              <button onClick={() => setReplacementModal(null)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm mb-4" style={{ color: theme.gray[500] }}>
                <strong>{remplacants.find(r => r.id === replacementModal.remplacantId)?.name}</strong> remplace qui pour le <strong>{getShiftLabel(replacementModal.shift)}</strong> du <strong>{new Date(replacementModal.date).toLocaleDateString('fr-FR')}</strong> ?
              </p>
              <div className="space-y-2">
                {anesthesists.filter(a => isTitulaire(a)).map(a => (
                  <button
                    key={a.id}
                    onClick={() => addRemplacement(replacementModal.date, replacementModal.shift, replacementModal.remplacantId, a.id)}
                    className="w-full p-3 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center gap-3 text-left"
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                    <span>{a.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 border-t">
              <button
                onClick={() => setReplacementModal(null)}
                className="w-full px-4 py-2 border rounded-xl hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHANGEMENT MOT DE PASSE */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">🔐 Définir un nouveau mot de passe</h2>
              <p className="text-sm mt-1" style={{ color: theme.gray[500] }}>
                Veuillez entrer votre nouveau mot de passe
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="Au moins 6 caractères"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="Répétez le mot de passe"
                />
              </div>
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {passwordError}
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPasswordReset(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                  window.history.replaceState(null, '', window.location.pathname);
                }}
                className="px-4 py-2 border rounded-xl hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={updatePassword}
                disabled={!newPassword || !confirmPassword}
                className="px-4 py-2 text-white rounded-xl disabled:opacity-50"
                style={{ backgroundColor: theme.primary }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnesthesistScheduler;
