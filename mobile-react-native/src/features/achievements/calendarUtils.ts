export type WeekStartsOn = 0 | 1;

export type CalendarCell = {
  date: Date;
  isoDate: string;
  dayNumber: number;
  inCurrentMonth: boolean;
};

const capitalize = (value: string) => (value ? `${value[0].toUpperCase()}${value.slice(1)}` : value);

export const toIsoDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseIsoDateKey = (value: string) => {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  return new Date(year || 1970, (month || 1) - 1, day || 1, 12, 0, 0, 0);
};

export const startOfMonth = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), 1, 12, 0, 0, 0);

export const endOfMonth = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth() + 1, 0, 12, 0, 0, 0);

export const addMonths = (value: Date, months: number) =>
  new Date(value.getFullYear(), value.getMonth() + months, 1, 12, 0, 0, 0);

export const addDays = (value: Date, days: number) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate() + days, 12, 0, 0, 0);

export const getMonthKey = (value: Date) =>
  `${value.getFullYear()}-${`${value.getMonth() + 1}`.padStart(2, '0')}`;

export const formatMonthLabel = (value: Date) =>
  capitalize(
    new Intl.DateTimeFormat('es-ES', {
      month: 'long',
      year: 'numeric',
    }).format(value),
  );

export const getWeekdayLabels = (weekStartsOn: WeekStartsOn) => {
  const sundayFirst = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  if (weekStartsOn === 1) {
    return [...sundayFirst.slice(1), sundayFirst[0]];
  }
  return sundayFirst;
};

export const getMonthMatrix = (
  year: number,
  month: number,
  weekStartsOn: WeekStartsOn = 0,
): CalendarCell[][] => {
  const firstDay = new Date(year, month, 1, 12, 0, 0, 0);
  const monthEnd = new Date(year, month + 1, 0, 12, 0, 0, 0);
  const leadingDays = (firstDay.getDay() - weekStartsOn + 7) % 7;
  const daysInMonth = monthEnd.getDate();
  const rows = Math.ceil((leadingDays + daysInMonth) / 7);
  const gridStart = addDays(firstDay, -leadingDays);

  const matrix: CalendarCell[][] = [];
  for (let row = 0; row < rows; row += 1) {
    const week: CalendarCell[] = [];
    for (let column = 0; column < 7; column += 1) {
      const dayOffset = row * 7 + column;
      const date = addDays(gridStart, dayOffset);
      week.push({
        date,
        isoDate: toIsoDateKey(date),
        dayNumber: date.getDate(),
        inCurrentMonth: date.getMonth() === month && date.getFullYear() === year,
      });
    }
    matrix.push(week);
  }
  return matrix;
};
