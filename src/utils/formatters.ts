import type { BudgetItem, TimelineTask, EventProfile, CompletePlan } from '../types.ts';

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  
  if (currency === '₹' || currency === 'INR') {
    // Indian numbering format (Lakhs, Crores)
    const formatted = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(safeAmount);
    return `₹${formatted}`;
  }

  const symbolMap: Record<string, string> = {
    USD: '$',
    '$': '$',
    EUR: '€',
    '€': '€',
    GBP: '£',
    '£': '£',
    CAD: 'CA$',
    AUD: 'A$',
  };

  const symbol = symbolMap[currency] || currency;
  const numStr = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(safeAmount);

  return `${symbol}${numStr}`;
}

export function formatEventDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getDaysRemaining(targetDateStr: string): { days: number; isPast: boolean; label: string } {
  try {
    const target = new Date(targetDateStr);
    const now = new Date();
    // Reset time components for clean day diff
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - now.getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return { days: 0, isPast: false, label: 'Today is the big day!' };
    } else if (days > 0) {
      return { days, isPast: false, label: `${days} days to go` };
    } else {
      return { days: Math.abs(days), isPast: true, label: `${Math.abs(days)} days ago` };
    }
  } catch {
    return { days: 0, isPast: false, label: 'Date pending' };
  }
}

export function downloadICS(event: EventProfile, tasks: TimelineTask[]) {
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  const formatDateToICS = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '20261201';
      return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    } catch {
      return '20261201';
    }
  };

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aayojan//GenAI Event Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${event.title} - Planning Timeline`,
    'X-WR-TIMEZONE:UTC',
  ];

  // Add primary event
  const eventDateFormatted = formatDateToICS(event.date);
  icsLines.push(
    'BEGIN:VEVENT',
    `UID:event-${event.id}@eventgenie.ai`,
    `DTSTAMP:${formatDateToICS(new Date().toISOString())}T000000Z`,
    `DTSTART;VALUE=DATE:${eventDateFormatted}`,
    `DTEND;VALUE=DATE:${eventDateFormatted}`,
    `SUMMARY:🎉 ${event.title}`,
    `DESCRIPTION:Event Day for ${event.title} in ${event.location}. Total guests: ${event.guestCount}.`,
    `LOCATION:${event.location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT'
  );

  // Add tasks
  tasks.forEach((task) => {
    const taskDateFormatted = formatDateToICS(task.dueDate);
    icsLines.push(
      'BEGIN:VEVENT',
      `UID:task-${task.id}@eventgenie.ai`,
      `DTSTAMP:${formatDateToICS(new Date().toISOString())}T000000Z`,
      `DTSTART;VALUE=DATE:${taskDateFormatted}`,
      `DTEND;VALUE=DATE:${taskDateFormatted}`,
      `SUMMARY:[${task.category}] ${task.title}`,
      `DESCRIPTION:${(task.description || '').replace(/\n/g, ' ')} (Priority: ${task.priority.toUpperCase()}, Assignee: ${task.assignee})`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  icsLines.push('END:VCALENDAR');

  const icsBlob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(icsBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_timeline.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadBudgetCSV(event: EventProfile, items: BudgetItem[]) {
  const headers = ['Category', 'Item Name', 'Priority', 'Estimated', 'Actual', 'Paid Advance', 'Variance (Est - Act)', 'Notes'];
  const rows = items.map((item) => [
    `"${item.category}"`,
    `"${item.name.replace(/"/g, '""')}"`,
    `"${item.priority}"`,
    item.estimated,
    item.actual,
    item.paid,
    item.estimated - item.actual,
    `"${(item.notes || '').replace(/"/g, '""')}"`,
  ]);

  const totalEst = items.reduce((acc, i) => acc + i.estimated, 0);
  const totalAct = items.reduce((acc, i) => acc + i.actual, 0);
  const totalPaid = items.reduce((acc, i) => acc + i.paid, 0);

  rows.push([
    '"TOTAL"',
    `"Total Budget: ${event.totalBudget}"`,
    '""',
    totalEst,
    totalAct,
    totalPaid,
    totalEst - totalAct,
    '"Generated by Aayojan"',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_budget.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
