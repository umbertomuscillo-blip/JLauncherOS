import { memo, useMemo, useState, type FC } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { CalendarWidgetStyle, WidgetConfig, WidgetSize } from '~types';

interface CalendarWidgetProps {
  widget: WidgetConfig;
  size?: WidgetSize;
}

const WEEKDAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

export const CalendarWidget: FC<CalendarWidgetProps> = memo(({ widget, size = widget.size }) => {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const today = useMemo(() => new Date(), []);

  const style: CalendarWidgetStyle =
    (widget.settings?.style as CalendarWidgetStyle) || 'month';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString('it-IT', { month: 'long' }).toUpperCase();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Costruisci le celle della griglia mensile
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Lunedì = 0

  const calendarDays = useMemo(() => {
    const list: Array<{ day: number; isCurrentMonth: boolean; isToday: boolean }> = [];

    // Giorni del mese precedente
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      list.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Giorni del mese corrente
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday =
        today.getDate() === d &&
        today.getMonth() === month &&
        today.getFullYear() === year;

      list.push({
        day: d,
        isCurrentMonth: true,
        isToday,
      });
    }

    // Completa la griglia a 35 o 42 celle
    const totalSlots = list.length <= 35 ? 35 : 42;
    const remaining = totalSlots - list.length;
    for (let n = 1; n <= remaining; n++) {
      list.push({
        day: n,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return list;
  }, [year, month, firstDayIndex, daysInMonth, today]);

  // ───────────────────────── 1. AGENDA STYLE ─────────────────────────
  if (style === 'agenda') {
    const todayNum = today.getDate();
    const todayWeekday = today.toLocaleDateString('it-IT', { weekday: 'long' }).toUpperCase();
    const todayMonth = today.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }).toUpperCase();

    const sampleAgenda = [
      { time: '10:00', title: 'Daily Standup & Sync', tag: 'Lavoro', color: 'bg-blue-400' },
      { time: '14:30', title: 'Review Architettura M4', tag: 'Progetto', color: 'bg-purple-400' },
      { time: '17:00', title: 'Sessione Deep Work', tag: 'Focus', color: 'bg-emerald-400' },
    ];

    return (
      <div className="relative w-full h-full flex flex-col justify-between p-3.5 rounded-3xl bg-neutral-900/80 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white select-none">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
            <CalendarIcon size={13} className="text-amber-400" />
            Agenda del Giorno
          </span>
          <span className="text-[10px] text-amber-400 font-mono font-semibold">{todayMonth}</span>
        </div>

        <div className="flex items-center gap-3 my-auto py-1">
          {/* Large Today Date Box */}
          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 min-w-[70px] shadow-inner">
            <span className="text-3xl font-black tracking-tighter leading-none">{todayNum}</span>
            <span className="text-[9px] font-bold tracking-widest mt-0.5">{todayWeekday.slice(0, 3)}</span>
          </div>

          {/* Agenda Schedule Items */}
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            {sampleAgenda.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-white/5 border border-white/5 text-xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                  <span className="truncate font-medium text-white/90">{item.title}</span>
                </div>
                <span className="text-[10px] text-white/50 font-mono shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-white/40 pt-1 border-t border-white/5 font-mono">
          <span>{todayWeekday}</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 size={11} /> 3 impegni programmati
          </span>
        </div>
      </div>
    );
  }

  // ───────────────────────── 2. MONTH GRID STYLE ─────────────────────────
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3 rounded-3xl bg-neutral-900/80 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden text-white select-none">
      {/* Month & Navigation Header */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-bold text-white tracking-wide">
          {monthName} <span className="text-white/50 font-mono font-normal">{year}</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Mese precedente"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Mese successivo"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Weekday Row */}
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-white/40 mb-0.5 font-mono">
        {WEEKDAYS.map((w, idx) => (
          <span key={idx}>{w}</span>
        ))}
      </div>

      {/* Perpetual Month Days Grid */}
      <div className="grid grid-cols-7 gap-0.5 text-center flex-1">
        {calendarDays.slice(0, size === '1x1' ? 28 : 35).map((d, index) => (
          <div
            key={index}
            className={`flex items-center justify-center rounded-lg text-[11px] font-medium h-5 transition-all ${
              d.isToday
                ? 'bg-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-400/40 scale-105 z-10'
                : d.isCurrentMonth
                ? 'text-white/90 hover:bg-white/10'
                : 'text-white/20'
            }`}
          >
            {d.day}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-[9px] text-white/40 pt-1 border-t border-white/5 font-mono">
        <span>Oggi: {today.getDate()} {monthName.slice(0, 3)}</span>
        <span className="text-amber-400">Calendario Perpetuo</span>
      </div>
    </div>
  );
});

CalendarWidget.displayName = 'CalendarWidget';
export default CalendarWidget;
