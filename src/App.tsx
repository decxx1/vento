import { useState, useEffect, useMemo } from 'react';
import { Plus, Calendar, List, Trash2, Edit2, Bell, X, CalendarDays, ArrowRight } from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Database from '@tauri-apps/plugin-sql';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Category {
  id: number;
  name: string;
  color: string;
}

interface Event {
  id: number;
  category_id: number;
  title: string;
  description: string;
  event_date: string; // YYYY-MM-DD
}

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

  const getProximityColor = (dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr < todayStr) return "text-overdue border-overdue/30 bg-overdue/5";
    if (dateStr === todayStr || dateStr <= addDays(new Date(), 3).toISOString().split('T')[0]) return "text-urgent border-urgent/30 bg-urgent/5";
    return "text-upcoming border-upcoming/30 bg-upcoming/5";
  };

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
      {/* Sidebar - Categories */}
      <aside className="w-64 glass border-r border-white/10 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
            <CalendarDays size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Vento</h1>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              selectedCategory === null ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            <List size={18} />
            <span className="font-medium">Todos los eventos</span>
          </button>

          <div className="pt-6 pb-2 px-4 uppercase text-[10px] font-bold tracking-widest text-white/30">Categorías</div>

          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                selectedCategory === cat.id ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="font-medium flex-1 text-left">{cat.name}</span>
            </button>
          ))}

          <button
            onClick={() => setIsAddCategoryOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-primary hover:bg-primary/10 transition-all border border-dashed border-primary/30 mt-4"
          >
            <Plus size={18} />
            <span className="font-medium">Nueva categoría</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-10 border-b border-white/5">
          <h2 className="text-2xl font-bold capitalize">
            {format(new Date(), "MMMM yyyy", { locale: es })}
          </h2>
          <button
            onClick={() => { setEditingEvent(null); setIsAddEventOpen(true); }}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Evento
          </button>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12">

          {/* Dashboard Hero Row */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Next Up Card */}
            <div
              className="relative overflow-hidden rounded-3xl p-8 glass-card border-white/10 min-h-[220px] flex flex-col justify-between cursor-pointer group"
              onClick={() => nextEvent && setViewingEvent(nextEvent)}
            >
              <div className="absolute top-0 right-0 p-8 text-primary/10 -mr-4 -mt-4 transition-transform group-hover:scale-110">
                <Bell size={100} strokeWidth={1} />
              </div>
              {nextEvent ? (
                <div className="relative z-10">
                  <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest">Siguiente</span>
                  <h3 className="text-4xl font-bold mt-4 mb-2 group-hover:text-primary transition-colors">{nextEvent.title}</h3>
                  <div className="flex items-center gap-2 text-white/40 mt-4">
                    <Calendar size={18} />
                    <span className="capitalize">{format(parseISO(nextEvent.event_date), "eeee d 'de' MMMM", { locale: es })}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/20">
                  <CalendarDays size={48} className="mb-2" />
                  <p>No hay eventos próximos</p>
                </div>
              )}
            </div>

            {/* This Month List Card */}
            <div className="glass-card rounded-3xl p-6 border-white/10 flex flex-col">
              <h4 className="text-sm font-bold uppercase tracking-widest text-white/30 mb-4 px-2">Eventos de este mes</h4>
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[160px]">
                {currentMonthEvents.length > 0 ? (
                  currentMonthEvents.map(e => (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => setViewingEvent(e)}>
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: categories.find(c => c.id === e.category_id)?.color }} />
                        <span className="font-medium text-sm truncate max-w-[150px] group-hover:text-primary">{e.title}</span>
                      </div>
                      <span className="text-[11px] text-white/40">{format(parseISO(e.event_date), "d MMM", { locale: es })}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-white/20 py-8 text-sm">Sin eventos este mes</p>
                )}
              </div>
            </div>
          </section>

          {/* Grouped Timeline */}
          <section className="space-y-12 pb-20">
            {groupedEvents.length > 0 ? (
              groupedEvents.map(group => (
                <div key={group.category.id} className="space-y-6">
                  <div className="flex items-center gap-4 px-2">
                    <div className="w-1 h-6 rounded-full" style={{ backgroundColor: group.category.color }} />
                    <h4 className="text-xl font-bold tracking-tight">{group.category.name}</h4>
                    <div className="flex-1 h-[1px] bg-white/5" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {group.events.map(event => (
                      <div
                        key={event.id}
                        onClick={() => setViewingEvent(event)}
                        className="glass-card group p-6 rounded-2xl flex flex-col justify-between text-left hover:border-primary/30 cursor-pointer relative"
                      >
                        <div className="flex justify-between items-start w-full mb-4">
                          <h5 className="text-lg font-bold group-hover:text-primary transition-colors flex-1 pr-12">{event.title}</h5>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap",
                            getProximityColor(event.event_date)
                          )}>
                            {format(parseISO(event.event_date), "d MMM", { locale: es })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingEvent(event); setIsAddEventOpen(true); }}
                              className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeletingEventId(event.id); }}
                              className="p-2 hover:bg-red-500/20 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <ArrowRight size={14} className="text-white/10 group-hover:text-white/40 transition-colors" />
                        </div>
                      </div>
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

      {/* Detail Modal */}
      {viewingEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setViewingEvent(null)} />
          <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-3xl p-10 shadow-2xl">
            <button
              onClick={() => setViewingEvent(null)}
              className="absolute top-6 right-8 text-white/20 hover:text-white"
            >
              <X size={24} />
            </button>

            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-3 h-8 rounded-full" style={{ backgroundColor: categories.find(c => c.id === viewingEvent.category_id)?.color }} />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">
                    {categories.find(c => c.id === viewingEvent.category_id)?.name}
                  </p>
                  <h3 className="text-3xl font-bold">{viewingEvent.title}</h3>
                </div>
              </div>

              <div className="flex items-center gap-6 py-6 border-y border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg text-primary">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-white/30 font-bold">Fecha</p>
                    <p className="font-semibold capitalize">{format(parseISO(viewingEvent.event_date), "eeee d 'de' MMMM, yyyy", { locale: es })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg text-accent">
                    <Bell size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-white/30 font-bold">Estado</p>
                    <p className="font-semibold">{viewingEvent.event_date < new Date().toISOString().split('T')[0] ? "Vencido" : "Próximo"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] uppercase text-white/30 font-bold">Descripción</p>
                <p className="text-white/70 leading-relaxed text-lg whitespace-pre-wrap">
                  {viewingEvent.description || "Sin descripción adicional."}
                </p>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => { setEditingEvent(viewingEvent); setViewingEvent(null); setIsAddEventOpen(true); }}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
                >
                  <Edit2 size={18} />
                  Editar
                </button>
                <button
                  onClick={() => setDeletingEventId(viewingEvent.id)}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
                >
                  <Trash2 size={18} />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modals */}
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

      {/* Aesthetic Confirmation Modal */}
      {deletingEventId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={() => setDeletingEventId(null)} />
          <div className="relative w-full max-w-sm bg-surface border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h4 className="text-xl font-bold mb-2">¿Estás seguro?</h4>
            <p className="text-white/50 text-sm mb-8">Esta acción no se puede deshacer. El evento se eliminará para siempre.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingEventId(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteEvent}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-lg shadow-red-500/20"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryForm({ onClose, onSave }: any) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/50">Nombre de la Categoría</label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
          placeholder="Ej: Trabajo, Personal..."
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/50">Elige un Color</label>
        <div className="flex gap-3">
          {["#6366f1", "#a855f7", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#ff7b7b"].map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all",
                color === c ? "border-white scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors">Cancelar</button>
        <button onClick={() => onSave(name, color)} className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 font-bold transition-colors shadow-lg shadow-primary/20">Crear</button>
      </div>
    </div>
  );
}

function EventForm({ categories, initialData, onClose, onSave }: any) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [desc, setDesc] = useState(initialData?.description || "");
  const [date, setDate] = useState(initialData?.event_date || new Date().toISOString().split('T')[0]);
  const [catId, setCatId] = useState(initialData?.category_id || categories[0]?.id || "");

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/50">Título</label>
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
          placeholder="Nombre del evento"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/50">Descripción</label>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors h-24 resize-none"
          placeholder="Notas adicionales..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/50">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/50">Categoría</label>
          <select
            value={catId}
            onChange={e => setCatId(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
          >
            {categories.map((c: any) => (
              <option key={c.id} value={c.id} className="bg-surface">{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-3 pt-6">
        <button
          onClick={() => onSave({ category_id: Number(catId), title, description: desc, event_date: date })}
          className="w-full px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 font-bold transition-colors shadow-lg shadow-primary/20"
        >
          {initialData ? "Guardar Cambios" : "Crear Evento"}
        </button>
        <button onClick={onClose} className="w-full px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-semibold">
          Cancelar
        </button>
      </div>
    </div>
  );
}
