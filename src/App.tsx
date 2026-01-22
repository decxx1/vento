import { useState, useEffect, useMemo } from 'react';
import { X, Calendar, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';
import { addDays, addMonths, addYears, startOfMonth, endOfMonth, isWithinInterval, parseISO, isBefore, startOfDay, startOfWeek, endOfWeek } from 'date-fns';
import Database from '@tauri-apps/plugin-sql';
import { cn } from './lib/utils'; // Assuming cn utility is available

// Types
import { Category, Event, EventStatus } from './types';

// Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { EventCard } from './components/EventCard';
import { CategoryForm } from './components/CategoryForm';
import { EventForm } from './components/EventForm';
import { EventDetailModal } from './components/EventDetailModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { DeleteCategoryModal } from './components/DeleteCategoryModal';

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'inprogress' | 'completed'>('upcoming');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [db, setDb] = useState<any>(null);
  const [isSidebarLocked, setIsSidebarLocked] = useState(false);

  // Initialize DB and Load Data
  useEffect(() => {
    async function init() {
      if (!(window as any).__TAURI_INTERNALS__) {
        console.warn("No detectado Tauri. Cargando datos de prueba.");
        setCategories([
          { id: 1, name: "Trabajo", color: "#6366f1" },
          { id: 2, name: "Personal", color: "#a855f7" },
          { id: 3, name: "Salud", color: "#10b981" }
        ]);
        setEvents([
          { id: 1, category_id: 1, title: "Presentación de Proyecto", description: "Entregar el informe final...", event_date: addDays(new Date(), 2).toISOString().split('T')[0], status: 'normal' },
          { id: 2, category_id: 2, title: "Almuerzo con Familia", description: "Reservar mesa...", event_date: addDays(new Date(), 5).toISOString().split('T')[0], status: 'normal' },
          { id: 3, category_id: 3, title: "Cita Médica", description: "Control anual...", event_date: new Date().toISOString().split('T')[0], status: 'pending' },
          { id: 4, category_id: 1, title: "Reunión de Equipo", description: "Planificar...", event_date: addDays(new Date(), -2).toISOString().split('T')[0], status: 'completed' },
          { id: 5, category_id: 2, title: "Evento Desactivado", description: "No debería verse en dashboard", event_date: addDays(new Date(), 1).toISOString().split('T')[0], status: 'deactivated' }
        ]);
        return;
      }
      try {
        const _db = await Database.load("sqlite:events.db");
        setDb(_db);

        await _db.execute(`
          CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color TEXT NOT NULL
          );
        `);

        await _db.execute(`
          CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            event_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'normal',
            FOREIGN KEY(category_id) REFERENCES categories(id)
          );
        `);

        loadData(_db);
      } catch (e) {
        console.error("Error cargando DB:", e);
      }
    }
    init();
  }, []);

  async function loadData(_db: any) {
    if (!_db) return;
    const cats = await _db.select("SELECT * FROM categories");
    const evts = await _db.select("SELECT * FROM events ORDER BY event_date ASC") as Event[];

    // Automatic status update: if status is normal and date is today or before, change to pending
    const today = startOfDay(new Date());
    let updatedNeeded = false;
    const updatedEvents = evts.map(e => {
      const eDate = parseISO(e.event_date);
      if (e.status === 'normal' && isBefore(eDate, today)) {
        updatedNeeded = true;
        return { ...e, status: 'pending' as EventStatus };
      }
      return e;
    });

    if (updatedNeeded) {
      for (const e of updatedEvents) {
        if (e.status === 'pending' && evts.find(old => old.id === e.id)?.status === 'normal') {
          await _db.execute("UPDATE events SET status = 'pending' WHERE id = ?", [e.id]);
        }
      }
    }

    setCategories(cats);
    setEvents(updatedEvents);
  }

  // Helper to determine status based on date
  const calculateStatus = (dateStr: string, isDeactivated: boolean): EventStatus => {
    if (isDeactivated) return 'deactivated';
    const today = startOfDay(new Date());
    const eDate = parseISO(dateStr);
    return isBefore(eDate, today) ? 'pending' : 'normal';
  };

  // Logic & Sorting
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }, [events]);

  const upcomingEvents = useMemo(() => {
    return sortedEvents.filter(e => e.status === 'normal' || e.status === 'deactivated');
  }, [sortedEvents]);

  const inProgressEvents = useMemo(() => {
    return sortedEvents.filter(e => e.status === 'pending');
  }, [sortedEvents]);

  const completedEvents = useMemo(() => {
    return sortedEvents.filter(e => e.status === 'completed');
  }, [sortedEvents]);

  // Dashboard calculations (only normal events)
  const dashboardEvents = useMemo(() => sortedEvents.filter(e => e.status === 'normal'), [sortedEvents]);

  const nextUpcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return dashboardEvents.filter(e => e.event_date >= today);
  }, [dashboardEvents]);

  const nextEvent = nextUpcomingEvents[0];

  const currentMonthEvents = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return dashboardEvents.filter(e => {
      const date = parseISO(e.event_date);
      return isWithinInterval(date, { start, end });
    });
  }, [dashboardEvents]);

  const currentWeekEvents = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    return dashboardEvents.filter(e => {
      const date = parseISO(e.event_date);
      return isWithinInterval(date, { start, end });
    });
  }, [dashboardEvents]);

  const currentTabEvents = useMemo(() => {
    let filtered: Event[] = [];
    if (activeTab === 'upcoming') filtered = upcomingEvents;
    else if (activeTab === 'inprogress') filtered = inProgressEvents;
    else if (activeTab === 'completed') filtered = completedEvents;

    if (selectedCategory) {
      filtered = filtered.filter(e => e.category_id === selectedCategory);
    }
    return filtered;
  }, [activeTab, upcomingEvents, inProgressEvents, completedEvents, selectedCategory]);

  const groupedEvents = useMemo(() => {
    return categories.map(cat => ({
      category: cat,
      events: currentTabEvents.filter(e => e.category_id === cat.id)
    })).filter(group => group.events.length > 0);
  }, [currentTabEvents, categories]);

  // Actions
  const handleSaveCategory = async (name: string, color: string) => {
    if (db) {
      await db.execute("INSERT INTO categories (name, color) VALUES (?, ?)", [name, color]);
      loadData(db);
    } else {
      setCategories([...categories, { id: Date.now(), name, color }]);
    }
    setIsAddCategoryOpen(false);
  };

  const handleSaveEvent = async (evt: any) => {
    // Determine new status based on date if it's not completed or deactivated explicitly
    let newStatus = evt.status;
    if (newStatus !== 'completed' && newStatus !== 'deactivated') {
      newStatus = calculateStatus(evt.event_date, false);
    }

    if (db) {
      if (editingEvent) {
        await db.execute(
          "UPDATE events SET category_id = ?, title = ?, description = ?, event_date = ?, status = ? WHERE id = ?",
          [evt.category_id, evt.title, evt.description, evt.event_date, newStatus, editingEvent.id]
        );
      } else {
        await db.execute(
          "INSERT INTO events (category_id, title, description, event_date, status) VALUES (?, ?, ?, ?, ?)",
          [evt.category_id, evt.title, evt.description, evt.event_date, newStatus]
        );
      }
      loadData(db);
    } else {
      if (editingEvent) {
        setEvents(events.map(e => e.id === editingEvent.id ? { ...evt, id: e.id, status: newStatus } : e));
      } else {
        setEvents([...events, { ...evt, id: Date.now(), status: newStatus }]);
      }
    }
    setIsAddEventOpen(false);
    setEditingEvent(null);
  };

  const handleUpdateStatus = async (eventId: number, status: EventStatus) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    let finalStatus = status;
    // Only recalculate based on date if we are explicitly trying to set it to 'normal'
    // This allows manual overrides to 'pending' from the UI
    if (status === 'normal') {
      finalStatus = calculateStatus(event.event_date, false);
    }

    if (db) {
      await db.execute("UPDATE events SET status = ? WHERE id = ?", [finalStatus, eventId]);
      loadData(db);
    } else {
      setEvents(events.map(e => e.id === eventId ? { ...e, status: finalStatus } : e));
    }
    setViewingEvent(null);
  };

  const handlePostpone = async (eventId: number, type: 'month' | 'year') => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const oldDate = parseISO(event.event_date);
    const newDate = type === 'month' ? addMonths(oldDate, 1) : addYears(oldDate, 1);
    const newDateStr = newDate.toISOString().split('T')[0];

    // After postpone, recalculate status (it might still be pending if postponed date is still past, though unlikely)
    const newStatus = calculateStatus(newDateStr, false);

    if (db) {
      await db.execute("UPDATE events SET event_date = ?, status = ? WHERE id = ?", [newDateStr, newStatus, eventId]);
      loadData(db);
    } else {
      setEvents(events.map(e => e.id === eventId ? { ...e, event_date: newDateStr, status: newStatus } : e));
    }
    setViewingEvent(null);
  };

  const handleDeleteEvent = async () => {
    if (!deletingEventId) return;
    if (db) {
      await db.execute("DELETE FROM events WHERE id = ?", [deletingEventId]);
      loadData(db);
    } else {
      setEvents(events.filter(e => e.id !== deletingEventId));
    }
    setViewingEvent(null);
    setEditingEvent(null);
    setDeletingEventId(null);
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategoryId) return;
    if (db) {
      await db.execute("DELETE FROM events WHERE category_id = ?", [deletingCategoryId]);
      await db.execute("DELETE FROM categories WHERE id = ?", [deletingCategoryId]);
      loadData(db);
    } else {
      setEvents(events.filter(e => e.category_id !== deletingCategoryId));
      setCategories(categories.filter(c => c.id !== deletingCategoryId));
    }
    if (selectedCategory === deletingCategoryId) {
      setSelectedCategory(null);
    }
    setDeletingCategoryId(null);
  };

  const categoryToDelete = categories.find(c => c.id === deletingCategoryId);
  const eventsInCategoryCount = events.filter(e => e.category_id === deletingCategoryId).length;

  return (
    <div className="flex h-screen w-full bg-background text-white font-sans overflow-hidden">
      <Sidebar
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onAddCategory={() => setIsAddCategoryOpen(true)}
        onDeleteCategory={(id) => setDeletingCategoryId(id)}
        isLocked={isSidebarLocked}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <Header
          onAddEvent={() => { setEditingEvent(null); setIsAddEventOpen(true); }}
          isSidebarLocked={isSidebarLocked}
          setIsSidebarLocked={setIsSidebarLocked}
        />

        <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
          <Dashboard
            nextEvent={nextEvent}
            currentMonthEvents={currentMonthEvents}
            currentWeekEvents={currentWeekEvents}
            pendingEvents={inProgressEvents}
            categories={categories}
            setViewingEvent={setViewingEvent}
          />

          {/* Tabs Section */}
          <section className="space-y-8 pb-20">
            <div className="flex items-center gap-6 border-b border-white/5 pb-4">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold",
                  activeTab === 'upcoming' ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <RotateCcw size={18} />
                Próximos
              </button>
              <button
                onClick={() => setActiveTab('inprogress')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold relative",
                  activeTab === 'inprogress' ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <AlertCircle size={18} />
                En curso
                {inProgressEvents.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-urgent rounded-full animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold",
                  activeTab === 'completed' ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <CheckCircle2 size={18} />
                Finalizados
              </button>
            </div>

            {groupedEvents.length > 0 ? (
              groupedEvents.map(group => (
                <div key={group.category.id} className="space-y-6">
                  <div className="flex items-center gap-4 px-2">
                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: group.category.color }} />
                    <h4 className="text-xl font-bold tracking-tight">{group.category.name}</h4>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {group.events.map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => setViewingEvent(event)}
                        onEdit={() => { setEditingEvent(event); setIsAddEventOpen(true); }}
                        onDelete={() => setDeletingEventId(event.id)}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 flex flex-col items-center justify-center glass-card rounded-3xl border-dashed border-white/10">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-white/20">
                  <Calendar size={32} />
                </div>
                <p className="text-white/40 font-medium">No hay eventos para mostrar en esta sección.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {viewingEvent && (
        <EventDetailModal
          event={viewingEvent}
          categories={categories}
          onClose={() => setViewingEvent(null)}
          onEdit={() => { setEditingEvent(viewingEvent); setViewingEvent(null); setIsAddEventOpen(true); }}
          onDelete={() => setDeletingEventId(viewingEvent.id)}
          onUpdateStatus={handleUpdateStatus}
          onPostpone={handlePostpone}
        />
      )}

      {(isAddEventOpen || isAddCategoryOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => { setIsAddEventOpen(false); setIsAddCategoryOpen(false); setEditingEvent(null); }} />
          <div className="relative w-full max-w-md bg-surface border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
            <h3 className="text-2xl font-bold mb-6">
              {isAddCategoryOpen ? "Nueva Categoría" : (editingEvent ? "Editar Evento" : "Nuevo Evento")}
            </h3>

            <button
              onClick={() => { setIsAddEventOpen(false); setIsAddCategoryOpen(false); setEditingEvent(null); }}
              className="absolute top-6 right-8 text-white/20 hover:text-white"
            >
              <X size={24} />
            </button>

            {isAddCategoryOpen ? (
              <CategoryForm
                onClose={() => setIsAddCategoryOpen(false)}
                onSave={handleSaveCategory}
              />
            ) : (
              <EventForm
                categories={categories}
                initialData={editingEvent}
                onClose={() => { setIsAddEventOpen(false); setEditingEvent(null); }}
                onSave={handleSaveEvent}
              />
            )}
          </div>
        </div>
      )}

      {deletingEventId && (
        <DeleteConfirmationModal
          onCancel={() => setDeletingEventId(null)}
          onConfirm={handleDeleteEvent}
        />
      )}

      {deletingCategoryId && categoryToDelete && (
        <DeleteCategoryModal
          categoryName={categoryToDelete.name}
          eventCount={eventsInCategoryCount}
          onCancel={() => setDeletingCategoryId(null)}
          onConfirm={handleDeleteCategory}
        />
      )}
    </div>
  );
}
