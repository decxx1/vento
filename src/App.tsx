import { useState, useEffect, useMemo } from 'react';
import { X, Calendar } from 'lucide-react';
import { addDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import Database from '@tauri-apps/plugin-sql';

// Types
import { Category, Event } from './types';

// Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { EventCard } from './components/EventCard';
import { CategoryForm } from './components/CategoryForm';
import { EventForm } from './components/EventForm';
import { EventDetailModal } from './components/EventDetailModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
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
          { id: 1, category_id: 1, title: "Presentación de Proyecto", description: "Entregar el informe final del trimestre detallando cada una de las fases del desarrollo y los resultados obtenidos en las pruebas de usuario.", event_date: addDays(new Date(), 2).toISOString().split('T')[0] },
          { id: 2, category_id: 2, title: "Almuerzo con Familia", description: "Reservar mesa en el restaurante de pastas que le gusta a la abuela.", event_date: addDays(new Date(), 5).toISOString().split('T')[0] },
          { id: 3, category_id: 3, title: "Cita Médica", description: "Control anual con el cardiólogo.", event_date: new Date().toISOString().split('T')[0] },
          { id: 4, category_id: 1, title: "Reunión de Equipo", description: "Planificar siguiente sprint y revisar backlog.", event_date: addDays(new Date(), -2).toISOString().split('T')[0] }
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
    const evts = await _db.select("SELECT * FROM events ORDER BY event_date ASC");
    setCategories(cats);
    setEvents(evts);
  }

  // Logic & Sorting
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sortedEvents.filter(e => e.event_date >= today);
  }, [sortedEvents]);

  const nextEvent = upcomingEvents[0];

  const currentMonthEvents = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return sortedEvents.filter(e => {
      const date = parseISO(e.event_date);
      return isWithinInterval(date, { start, end });
    });
  }, [sortedEvents]);

  const groupedEvents = useMemo(() => {
    const filtered = selectedCategory
      ? sortedEvents.filter(e => e.category_id === selectedCategory)
      : sortedEvents;

    return categories.map(cat => ({
      category: cat,
      events: filtered.filter(e => e.category_id === cat.id)
    })).filter(group => group.events.length > 0);
  }, [sortedEvents, categories, selectedCategory]);

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
    if (db) {
      if (editingEvent) {
        await db.execute(
          "UPDATE events SET category_id = ?, title = ?, description = ?, event_date = ? WHERE id = ?",
          [evt.category_id, evt.title, evt.description, evt.event_date, editingEvent.id]
        );
      } else {
        await db.execute(
          "INSERT INTO events (category_id, title, description, event_date) VALUES (?, ?, ?, ?)",
          [evt.category_id, evt.title, evt.description, evt.event_date]
        );
      }
      loadData(db);
    } else {
      if (editingEvent) {
        setEvents(events.map(e => e.id === editingEvent.id ? { ...evt, id: e.id } : e));
      } else {
        setEvents([...events, { ...evt, id: Date.now() }]);
      }
    }
    setIsAddEventOpen(false);
    setEditingEvent(null);
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

  return (
    <div className="flex h-screen w-full bg-background text-white font-sans overflow-hidden">
      <Sidebar
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onAddCategory={() => setIsAddCategoryOpen(true)}
        isLocked={isSidebarLocked}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <Header
          onAddEvent={() => { setEditingEvent(null); setIsAddEventOpen(true); }}
          isSidebarLocked={isSidebarLocked}
          setIsSidebarLocked={setIsSidebarLocked}
        />

        <div className="flex-1 overflow-y-auto p-10 space-y-12">
          <Dashboard
            nextEvent={nextEvent}
            currentMonthEvents={currentMonthEvents}
            categories={categories}
            setViewingEvent={setViewingEvent}
          />

          <section className="space-y-12 pb-20">
            {groupedEvents.length > 0 ? (
              groupedEvents.map(group => (
                <div key={group.category.id} className="space-y-6">
                  <div className="flex items-center gap-4 px-2">
                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: group.category.color }} />
                    <h4 className="text-lg font-bold uppercase">{group.category.name}</h4>
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
                <p className="text-white/40 font-medium">No hay eventos para mostrar.</p>
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
    </div>
  );
}
