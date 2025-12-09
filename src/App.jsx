import React, { useState, useEffect } from 'react';
import { Calendar, Users, RefreshCw, Download, Play, TrendingUp } from 'lucide-react';

const AnesthesistScheduler = () => {
  const [anesthesists, setAnesthesists] = useState([
    { id: 1, name: 'Thomas FAUVET', color: '#3b82f6' },
    { id: 2, name: 'Eugénie TAILLARDAT', color: '#10b981' },
    { id: 3, name: 'Olivier CARLE', color: '#f59e0b' },
    { id: 4, name: 'Stephane COMBAZ', color: '#ef4444' },
    { id: 5, name: 'Stephane SALLABERRY', color: '#8b5cf6' },
    { id: 6, name: 'Rémi JOURDAN', color: '#ec4899' },
    { id: 7, name: 'Marc BELLIER', color: '#14b8a6' },
    { id: 8, name: 'Mehdi EL KAMEL', color: '#f97316' }
  ]);

  const [schedule, setSchedule] = useState({});
  const [currentWeekStart, setCurrentWeekStart] = useState(null);
  const [showStats, setShowStats] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [viewMode, setViewMode] = useState('week');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const frenchHolidays2025 = [
    { date: '2025-01-01', name: 'Jour de l\'an' },
    { date: '2025-04-21', name: 'Lundi de Pâques' },
    { date: '2025-05-01', name: 'Fête du Travail' },
    { date: '2025-05-08', name: 'Victoire 1945' },
    { date: '2025-05-29', name: 'Ascension' },
    { date: '2025-06-09', name: 'Lundi de Pentecôte' },
    { date: '2025-07-14', name: 'Fête Nationale' },
    { date: '2025-08-15', name: 'Assomption' },
    { date: '2025-11-01', name: 'Toussaint' },
    { date: '2025-11-11', name: 'Armistice 1918' },
    { date: '2025-12-25', name: 'Noël' }
  ];

  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  useEffect(() => {
    setCurrentWeekStart(getMonday(new Date()));
  }, []);

  function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const formatDateKey = (date) => {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const isHoliday = (date) => {
    const dateKey = formatDateKey(date);
    return frenchHolidays2025.some(h => h.date === dateKey);
  };

  const getHolidayName = (date) => {
    const dateKey = formatDateKey(date);
    const holiday = frenchHolidays2025.find(h => h.date === dateKey);
    return holiday ? holiday.name : null;
  };

  function generateYearSchedule() {
    setIsGenerating(true);
    
    setTimeout(() => {
      const newSchedule = {};
      const startDate = new Date(2025, 0, 1);
      const endDate = new Date(2025, 11, 31);
      
      const weeks = [];
      let current = getMonday(startDate);
      
      while (current <= endDate) {
        weeks.push(new Date(current));
        current.setDate(current.getDate() + 7);
      }

      const numAnesthesists = anesthesists.length;
      const totalWeeks = weeks.length;
      const weeksPerDoctor = Math.floor(totalWeeks * 4 / numAnesthesists);
      
      const assignments = [];
      anesthesists.forEach(a => {
        for (let i = 0; i < weeksPerDoctor; i++) {
          assignments.push(a.id);
        }
      });
      
      while (assignments.length < totalWeeks * 4) {
        assignments.push(anesthesists[assignments.length % numAnesthesists].id);
      }
      
      const shuffledAssignments = shuffle(assignments);
      const astreinteCount = {};
      const blocCount = {};
      const consultationCount = {};
      
      anesthesists.forEach(a => {
        astreinteCount[a.id] = 0;
        blocCount[a.id] = 0;
        consultationCount[a.id] = 0;
      });

      weeks.forEach((weekStart, weekIndex) => {
        const team = [
          shuffledAssignments[weekIndex * 4],
          shuffledAssignments[weekIndex * 4 + 1],
          shuffledAssignments[weekIndex * 4 + 2],
          shuffledAssignments[weekIndex * 4 + 3]
        ];

        // Pattern inspiré de votre Excel : les 4 médecins tournent sur tous les rôles pendant leur semaine
        // A chaque jour, on change qui fait quoi parmi les 4 médecins de l'équipe
        const weekPatterns = [
          // Pattern 1 : rotation complète dans la semaine
          [
            { astreinte: [team[0], team[1]], bloc: [team[2], team[3]], consultation: [team[0]] },
            { astreinte: [team[1]], bloc: [team[2], team[3]], consultation: [team[0]] },
            { astreinte: [team[2]], bloc: [team[0], team[3]], consultation: [team[1]] },
            { astreinte: [team[3]], bloc: [team[0], team[1]], consultation: [team[2]] },
            { astreinte: [team[0]], bloc: [team[1], team[2]], consultation: [team[3]] }
          ],
          // Pattern 2 : autre rotation
          [
            { astreinte: [team[2], team[3]], bloc: [team[0], team[1]], consultation: [team[2]] },
            { astreinte: [team[3]], bloc: [team[0], team[1]], consultation: [team[2]] },
            { astreinte: [team[0]], bloc: [team[2], team[3]], consultation: [team[1]] },
            { astreinte: [team[1]], bloc: [team[2], team[3]], consultation: [team[0]] },
            { astreinte: [team[2]], bloc: [team[0], team[1]], consultation: [team[3]] }
          ],
          // Pattern 3 : encore une autre rotation
          [
            { astreinte: [team[1], team[2]], bloc: [team[0], team[3]], consultation: [team[1]] },
            { astreinte: [team[2]], bloc: [team[0], team[3]], consultation: [team[1]] },
            { astreinte: [team[3]], bloc: [team[1], team[2]], consultation: [team[0]] },
            { astreinte: [team[0]], bloc: [team[1], team[2]], consultation: [team[3]] },
            { astreinte: [team[1]], bloc: [team[0], team[3]], consultation: [team[2]] }
          ],
          // Pattern 4 : dernière rotation
          [
            { astreinte: [team[3], team[0]], bloc: [team[1], team[2]], consultation: [team[3]] },
            { astreinte: [team[0]], bloc: [team[1], team[2]], consultation: [team[3]] },
            { astreinte: [team[1]], bloc: [team[0], team[3]], consultation: [team[2]] },
            { astreinte: [team[2]], bloc: [team[0], team[1]], consultation: [team[3]] },
            { astreinte: [team[3]], bloc: [team[1], team[2]], consultation: [team[0]] }
          ]
        ];

        // Utiliser un pattern différent pour chaque semaine
        const weekPlan = weekPatterns[weekIndex % 4];

        weekPlan.forEach(day => {
          day.astreinte.forEach(id => astreinteCount[id]++);
          day.bloc.forEach(id => blocCount[id]++);
          day.consultation.forEach(id => consultationCount[id]++);
        });

        for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
          const date = new Date(weekStart);
          date.setDate(date.getDate() + dayOffset);
          const dateKey = formatDateKey(date);
          
          newSchedule[dateKey] = {
            bloc: weekPlan[dayOffset].bloc,
            consultation: weekPlan[dayOffset].consultation,
            astreinte: weekPlan[dayOffset].astreinte
          };
        }
      });

      setSchedule(newSchedule);
      localStorage.setItem('anesthesistSchedule', JSON.stringify(newSchedule));
      setIsGenerating(false);
    }, 100);
  }

  useEffect(() => {
    const saved = localStorage.getItem('anesthesistSchedule');
    if (saved) {
      setSchedule(JSON.parse(saved));
    } else {
      generateYearSchedule();
    }
  }, []);

  const getWeekDays = (startDate) => {
    const days = [];
    for (let i = 0; i < 5; i++) {
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

  const goToToday = () => {
    setCurrentWeekStart(getMonday(new Date()));
    setCurrentMonth(new Date());
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentMonth(newDate);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const toggleAssignment = (date, anesthesistId, shift) => {
    const key = formatDateKey(date);
    const newSchedule = { ...schedule };
    
    if (!newSchedule[key]) {
      newSchedule[key] = { bloc: [], consultation: [], astreinte: [] };
    }
    
    if (!newSchedule[key][shift]) {
      newSchedule[key][shift] = [];
    }
    
    const index = newSchedule[key][shift].indexOf(anesthesistId);
    if (index > -1) {
      newSchedule[key][shift].splice(index, 1);
    } else {
      newSchedule[key][shift].push(anesthesistId);
    }
    
    setSchedule(newSchedule);
    localStorage.setItem('anesthesistSchedule', JSON.stringify(newSchedule));
  };

  const getAssignedAnesthesists = (date, shift) => {
    const key = formatDateKey(date);
    const ids = schedule[key]?.[shift] || [];
    return ids.map(id => anesthesists.find(a => a.id === id)).filter(Boolean);
  };

  const calculateYearStats = () => {
    const stats = anesthesists.map(a => ({
      ...a,
      weeksWorked: new Set(),
      bloc: 0,
      consultation: 0,
      astreinte: 0,
      total: 0,
      holidays: 0
    }));

    Object.entries(schedule).forEach(([dateKey, shifts]) => {
      const date = new Date(dateKey);
      const weekNumber = getWeekNumber(date);
      const isHol = isHoliday(date);
      
      Object.entries(shifts).forEach(([shift, ids]) => {
        ids.forEach(id => {
          const stat = stats.find(s => s.id === id);
          if (stat) {
            stat.weeksWorked.add(weekNumber);
            stat.total++;
            if (shift === 'bloc') stat.bloc++;
            if (shift === 'consultation') stat.consultation++;
            if (shift === 'astreinte') stat.astreinte++;
            if (isHol) stat.holidays++;
          }
        });
      });
    });

    return stats.map(s => ({ ...s, weeksCount: s.weeksWorked.size }));
  };

  const exportToICS = (anesthesistId = null) => {
    const events = [];
    
    Object.entries(schedule).forEach(([dateKey, shifts]) => {
      Object.entries(shifts).forEach(([shift, ids]) => {
        ids.forEach(id => {
          if (anesthesistId === null || id === anesthesistId) {
            const anesthesist = anesthesists.find(a => a.id === id);
            if (!anesthesist) return;
            
            let startTime, endTime, summary;
            const date = new Date(dateKey);
            
            if (shift === 'bloc') {
              startTime = '080000';
              endTime = '180000';
              summary = 'Bloc';
            } else if (shift === 'consultation') {
              startTime = '080000';
              endTime = '180000';
              summary = 'Consultation';
            } else if (shift === 'astreinte') {
              startTime = '180000';
              const nextDay = new Date(date);
              nextDay.setDate(nextDay.getDate() + 1);
              endTime = '080000';
              summary = 'Astreinte';
              
              const endDateStr = `${nextDay.getFullYear()}${String(nextDay.getMonth() + 1).padStart(2, '0')}${String(nextDay.getDate()).padStart(2, '0')}`;
              
              events.push({
                dateStr: dateKey.replace(/-/g, ''),
                endDateStr: endDateStr,
                startTime,
                endTime,
                summary: `${summary} - ${anesthesist.name}`
              });
              return;
            }
            
            events.push({
              dateStr: dateKey.replace(/-/g, ''),
              endDateStr: dateKey.replace(/-/g, ''),
              startTime,
              endTime,
              summary: `${summary} - ${anesthesist.name}`
            });
          }
        });
      });
    });

    let icsContent = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Planning//FR\r\n';
    events.forEach((event, index) => {
      icsContent += `BEGIN:VEVENT\r\nUID:${event.dateStr}-${index}@planning.com\r\n`;
      icsContent += `DTSTART:${event.dateStr}T${event.startTime}\r\n`;
      icsContent += `DTEND:${event.endDateStr}T${event.endTime}\r\n`;
      icsContent += `SUMMARY:${event.summary}\r\nEND:VEVENT\r\n`;
    });
    icsContent += 'END:VCALENDAR\r\n';

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = anesthesistId ? `planning-${anesthesists.find(a => a.id === anesthesistId)?.name}-2025.ics` : 'planning-2025.ics';
    link.click();
  };

  const getAllWeeksOfYear = () => {
    const weeks = [];
    const startDate = new Date(2025, 0, 1);
    const endDate = new Date(2025, 11, 31);
    let current = getMonday(startDate);
    
    while (current <= endDate) {
      weeks.push({
        start: new Date(current),
        number: getWeekNumber(current),
        days: getWeekDays(current)
      });
      current.setDate(current.getDate() + 7);
    }
    return weeks;
  };

  if (!currentWeekStart) return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;

  const weekDays = getWeekDays(currentWeekStart);
  const weekNumber = getWeekNumber(currentWeekStart);
  const yearStats = calculateYearStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-800">Planning 2025</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setViewMode('week')} className={`px-4 py-2 ${viewMode === 'week' ? 'bg-purple-600' : 'bg-purple-400'} text-white rounded-lg hover:bg-purple-700 flex items-center gap-2`}>
                <Calendar className="w-4 h-4" />
                Semaine
              </button>
              <button onClick={() => setViewMode('month')} className={`px-4 py-2 ${viewMode === 'month' ? 'bg-purple-600' : 'bg-purple-400'} text-white rounded-lg hover:bg-purple-700 flex items-center gap-2`}>
                <Calendar className="w-4 h-4" />
                Mois
              </button>
              <button onClick={() => setViewMode('year')} className={`px-4 py-2 ${viewMode === 'year' ? 'bg-purple-600' : 'bg-purple-400'} text-white rounded-lg hover:bg-purple-700 flex items-center gap-2`}>
                <Calendar className="w-4 h-4" />
                Année
              </button>
              <button onClick={() => setShowStats(!showStats)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Stats
              </button>
              <button onClick={() => exportToICS()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Download className="w-4 h-4" />
                ICS
              </button>
              <button 
                onClick={() => {
                  console.log('Bouton Lancer cliqué - Génération directe');
                  generateYearSchedule();
                }} 
                disabled={isGenerating} 
                className={`px-4 py-2 ${generationSuccess ? 'bg-green-700' : 'bg-green-600'} text-white rounded-lg hover:bg-green-700 flex items-center gap-2 ${isGenerating ? 'opacity-50' : ''}`}
                style={{ cursor: isGenerating ? 'not-allowed' : 'pointer' }}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Génération...
                  </>
                ) : generationSuccess ? (
                  <>
                    ✓ Généré !
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Lancer
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            {viewMode === 'week' ? (
              <>
                <button onClick={() => changeWeek(-1)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">← Préc.</button>
                <button onClick={goToToday} className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm">Aujourd'hui</button>
                <div className="text-center">
                  <h2 className="text-xl font-semibold">Semaine {weekNumber}</h2>
                </div>
                <button onClick={() => changeWeek(1)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Suiv. →</button>
              </>
            ) : viewMode === 'month' ? (
              <>
                <button onClick={() => changeMonth(-1)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">← Préc.</button>
                <button onClick={goToToday} className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm">Aujourd'hui</button>
                <div className="text-center">
                  <h2 className="text-xl font-semibold capitalize">{currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h2>
                </div>
                <button onClick={() => changeMonth(1)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Suiv. →</button>
              </>
            ) : (
              <div className="text-center">
                <h2 className="text-xl font-semibold">Planning complet 2025</h2>
              </div>
            )}
          </div>
        </div>

        {showStats && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Statistiques 2025</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {yearStats.map(stat => (
                <div key={stat.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stat.color }} />
                    <span className="font-semibold text-gray-700">{stat.name}</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="font-bold text-lg text-indigo-600">{stat.weeksCount} sem</div>
                    <div>Bloc: {stat.bloc}</div>
                    <div>Cs: {stat.consultation}</div>
                    <div>Astr: {stat.astreinte}</div>
                    <div className="text-xs text-orange-600 font-semibold mt-2">🎉 Fériés: {stat.holidays}</div>
                  </div>
                  <button
                    onClick={() => exportToICS(stat.id)}
                    className="mt-2 w-full text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Export ICS
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                🎉 Jours fériés 2025
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-700">
                {frenchHolidays2025.map(holiday => (
                  <div key={holiday.date} className="flex items-center gap-2">
                    <span className="font-semibold">{new Date(holiday.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                    <span>- {holiday.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          {viewMode === 'week' ? (
            <div className="grid grid-cols-5 gap-4">
              {weekDays.map((date) => {
                const isToday = date.toDateString() === new Date().toDateString();
                const isHol = isHoliday(date);
                const holidayName = getHolidayName(date);

                return (
                  <div key={formatDateKey(date)} className={`border-2 rounded-lg p-4 min-h-[400px] ${isToday ? 'border-indigo-500 bg-indigo-50' : isHol ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}`}>
                    <div className="font-bold text-center mb-3">
                      <div className="text-sm text-gray-500">{date.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                      <div className="text-lg">{date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
                      {isHol && (
                        <>
                          <div className="text-xs text-orange-600 mt-1">🎉</div>
                          <div className="text-xs text-orange-700 font-semibold">{holidayName}</div>
                        </>
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="text-xs font-semibold mb-2">🌙 Astreinte</div>
                      <div className="space-y-1">
                        {getAssignedAnesthesists(date, 'astreinte').map(a => (
                          <div key={a.id} className="text-xs px-2 py-1.5 rounded text-white cursor-pointer hover:opacity-80" style={{ backgroundColor: a.color }} onClick={() => toggleAssignment(date, a.id, 'astreinte')}>
                            Dr {a.name.split(' ')[1] === 'EL' ? 'EL KAMEL' : a.name.split(' ')[1]}
                          </div>
                        ))}
                      </div>
                      <select className="w-full text-xs mt-1 p-1.5 border rounded" value="" onChange={(e) => e.target.value && toggleAssignment(date, parseInt(e.target.value), 'astreinte')}>
                        <option value="">+ Ajouter</option>
                        {anesthesists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>

                    <div className="mb-3">
                      <div className="text-xs font-semibold mb-2">🏥 Bloc</div>
                      <div className="space-y-1">
                        {getAssignedAnesthesists(date, 'bloc').map(a => (
                          <div key={a.id} className="text-xs px-2 py-1.5 rounded text-white cursor-pointer hover:opacity-80" style={{ backgroundColor: a.color }} onClick={() => toggleAssignment(date, a.id, 'bloc')}>
                            Dr {a.name.split(' ')[1] === 'EL' ? 'EL KAMEL' : a.name.split(' ')[1]}
                          </div>
                        ))}
                      </div>
                      <select className="w-full text-xs mt-1 p-1.5 border rounded" value="" onChange={(e) => e.target.value && toggleAssignment(date, parseInt(e.target.value), 'bloc')}>
                        <option value="">+ Ajouter</option>
                        {anesthesists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <div className="text-xs font-semibold mb-2">👨‍⚕️ Consultation</div>
                      <div className="space-y-1">
                        {getAssignedAnesthesists(date, 'consultation').map(a => (
                          <div key={a.id} className="text-xs px-2 py-1.5 rounded text-white cursor-pointer hover:opacity-80" style={{ backgroundColor: a.color }} onClick={() => toggleAssignment(date, a.id, 'consultation')}>
                            Dr {a.name.split(' ')[1] === 'EL' ? 'EL KAMEL' : a.name.split(' ')[1]}
                          </div>
                        ))}
                      </div>
                      <select className="w-full text-xs mt-1 p-1.5 border rounded" value="" onChange={(e) => e.target.value && toggleAssignment(date, parseInt(e.target.value), 'consultation')}>
                        <option value="">+ Ajouter</option>
                        {anesthesists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'month' ? (
            <div>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                  <div key={day} className="text-center font-bold text-gray-600 py-2 text-sm">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth(currentMonth).map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="min-h-[120px]" />;
                  }

                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isHol = isHoliday(date);
                  const holidayName = getHolidayName(date);

                  if (isWeekend) {
                    return (
                      <div key={formatDateKey(date)} className="border rounded-lg p-2 min-h-[120px] bg-gray-100">
                        <div className="text-center font-semibold text-gray-400">{date.getDate()}</div>
                      </div>
                    );
                  }

                  return (
                    <div key={formatDateKey(date)} className={`border rounded-lg p-2 min-h-[120px] ${isToday ? 'border-indigo-500 bg-indigo-50' : isHol ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}`}>
                      <div className="text-center font-semibold mb-1">
                        {date.getDate()}
                        {isHol && <div className="text-xs text-orange-600">🎉</div>}
                      </div>
                      {isHol && <div className="text-xs text-orange-700 font-semibold mb-1 text-center">{holidayName}</div>}
                      <div className="space-y-1 text-xs">
                        {getAssignedAnesthesists(date, 'astreinte').slice(0, 2).map(a => (
                          <div key={a.id} className="px-1 py-0.5 rounded text-white" style={{ backgroundColor: a.color }}>
                            🌙 {a.name.split(' ')[1] === 'EL' ? 'EK' : a.name.split(' ')[1].substring(0, 3)}
                          </div>
                        ))}
                        {getAssignedAnesthesists(date, 'bloc').slice(0, 2).map(a => (
                          <div key={a.id} className="px-1 py-0.5 rounded text-white" style={{ backgroundColor: a.color }}>
                            🏥 {a.name.split(' ')[1] === 'EL' ? 'EK' : a.name.split(' ')[1].substring(0, 3)}
                          </div>
                        ))}
                        {getAssignedAnesthesists(date, 'consultation').slice(0, 1).map(a => (
                          <div key={a.id} className="px-1 py-0.5 rounded text-white" style={{ backgroundColor: a.color }}>
                            👨‍⚕️ {a.name.split(' ')[1] === 'EL' ? 'EK' : a.name.split(' ')[1].substring(0, 3)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {getAllWeeksOfYear().map((week, weekIdx) => (
                <div key={weekIdx} className="border-2 border-gray-200 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-3 text-gray-800">Semaine {week.number} - {week.start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</h3>
                  <div className="grid grid-cols-5 gap-3">
                    {week.days.map((date) => (
                      <div key={formatDateKey(date)} className="border rounded-lg p-3 bg-gray-50">
                        <div className="font-semibold text-center mb-2 text-sm">
                          {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                        <div className="space-y-2 text-xs">
                          <div>
                            <div className="font-semibold text-gray-600 mb-1">🌙 Astr</div>
                            {getAssignedAnesthesists(date, 'astreinte').map(a => (
                              <div key={a.id} className="px-2 py-1 rounded text-white mb-1" style={{ backgroundColor: a.color }}>
                                Dr {a.name.split(' ')[1] === 'EL' ? 'EL KAMEL' : a.name.split(' ')[1]}
                              </div>
                            ))}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-600 mb-1">🏥 Bloc</div>
                            {getAssignedAnesthesists(date, 'bloc').map(a => (
                              <div key={a.id} className="px-2 py-1 rounded text-white mb-1" style={{ backgroundColor: a.color }}>
                                Dr {a.name.split(' ')[1] === 'EL' ? 'EL KAMEL' : a.name.split(' ')[1]}
                              </div>
                            ))}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-600 mb-1">👨‍⚕️ Cs</div>
                            {getAssignedAnesthesists(date, 'consultation').map(a => (
                              <div key={a.id} className="px-2 py-1 rounded text-white mb-1" style={{ backgroundColor: a.color }}>
                                Dr {a.name.split(' ')[1] === 'EL' ? 'EL KAMEL' : a.name.split(' ')[1]}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnesthesistScheduler;
