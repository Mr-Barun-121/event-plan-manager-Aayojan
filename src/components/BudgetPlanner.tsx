import React, { useState, useMemo } from 'react';
import { BudgetItem, EventProfile } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp, 
  Sparkles, 
  Edit3, 
  Check, 
  PieChart as PieIcon, 
  BarChart3,
  Sliders,
  DollarSign,
  Info
} from 'lucide-react';

interface BudgetPlannerProps {
  event: EventProfile;
  budgetItems: BudgetItem[];
  setBudgetItems: React.Dispatch<React.SetStateAction<BudgetItem[]>>;
  currency: string;
  onAskCopilot: (prompt: string) => void;
}

// Visual color palette for budget categories
const CATEGORY_COLORS: Record<string, string> = {
  'Venue': '#4F46E5', // Indigo
  'Catering': '#F59E0B', // Amber
  'Decor & Florals': '#EC4899', // Pink
  'Photography & Media': '#06B6D4', // Cyan
  'Photography': '#06B6D4',
  'Attire & Beauty': '#8B5CF6', // Purple
  'Entertainment': '#10B981', // Emerald
  'Music & DJ': '#10B981',
  'Invitations & Favors': '#F97316', // Orange
  'Logistics & Transport': '#64748B', // Slate
  'Contingency': '#EF4444', // Red
  'Bakery': '#F43F5E',
  'General': '#6B7280',
};

const DEFAULT_COLOR = '#6B7280';

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({
  event,
  budgetItems,
  setBudgetItems,
  currency,
  onAskCopilot,
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'donut' | 'bars'>('donut');
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  // Form state for adding an item
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Catering');
  const [newItemEst, setNewItemEst] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');
  const [newItemPriority, setNewItemPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // Calculations
  const totalBudget = event.totalBudget || 1;
  const totalEstimated = useMemo(() => budgetItems.reduce((acc, i) => acc + (Number(i.estimated) || 0), 0), [budgetItems]);
  const totalActual = useMemo(() => budgetItems.reduce((acc, i) => acc + (Number(i.actual) || 0), 0), [budgetItems]);
  const totalPaid = useMemo(() => budgetItems.reduce((acc, i) => acc + (Number(i.paid) || 0), 0), [budgetItems]);
  const remainingBudget = totalBudget - (totalActual > 0 ? totalActual : totalEstimated);
  const isOverBudget = (totalActual > 0 ? totalActual : totalEstimated) > totalBudget;
  const variance = totalEstimated - totalActual;

  const contingencyItem = budgetItems.find((i) => i.category.toLowerCase() === 'contingency');
  const hasContingency = Boolean(contingencyItem);

  // Group items by category for summary metrics
  const categorySummary = useMemo(() => {
    const map: Record<string, { category: string; estimated: number; actual: number; count: number; color: string }> = {};
    budgetItems.forEach((item) => {
      const cat = item.category || 'General';
      if (!map[cat]) {
        map[cat] = {
          category: cat,
          estimated: 0,
          actual: 0,
          count: 0,
          color: CATEGORY_COLORS[cat] || DEFAULT_COLOR,
        };
      }
      map[cat].estimated += Number(item.estimated) || 0;
      map[cat].actual += Number(item.actual) || 0;
      map[cat].count += 1;
    });
    return Object.values(map);
  }, [budgetItems]);

  // Donut SVG generator
  const donutSegments = useMemo(() => {
    let cumulativeAngle = 0;
    const totalForDonut = totalEstimated > 0 ? totalEstimated : 1;
    return categorySummary.map((cat) => {
      const sliceAngle = (cat.estimated / totalForDonut) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + sliceAngle;
      cumulativeAngle += sliceAngle;

      // Coordinate math for SVG arc (Radius = 70, center = 100, 100)
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = 100 + 70 * Math.cos(startRad);
      const y1 = 100 + 70 * Math.sin(startRad);
      const x2 = 100 + 70 * Math.cos(endRad);
      const y2 = 100 + 70 * Math.sin(endRad);

      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
      const pathData = `M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      return {
        ...cat,
        percentage: ((cat.estimated / totalForDonut) * 100).toFixed(1),
        pathData,
      };
    });
  }, [categorySummary, totalEstimated]);

  // Categories list for filter
  const categoriesList = useMemo(() => {
    const list = Array.from(new Set(budgetItems.map((i) => i.category)));
    return ['All', ...list];
  }, [budgetItems]);

  const filteredItems = useMemo(() => {
    if (selectedCategoryFilter === 'All') return budgetItems;
    return budgetItems.filter((i) => i.category === selectedCategoryFilter);
  }, [budgetItems, selectedCategoryFilter]);

  const handleUpdateItem = (id: string, field: keyof BudgetItem, value: any) => {
    setBudgetItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'estimated') {
            const num = Number(value) || 0;
            updated.estimated = num;
            updated.percentage = totalBudget > 0 ? Number(((num / totalBudget) * 100).toFixed(1)) : 0;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    setBudgetItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemEst) return;

    const est = parseFloat(newItemEst) || 0;
    const newItem: BudgetItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      category: newItemCategory,
      estimated: est,
      actual: 0,
      paid: 0,
      percentage: totalBudget > 0 ? Number(((est / totalBudget) * 100).toFixed(1)) : 0,
      notes: newItemNotes.trim(),
      priority: newItemPriority,
    };

    setBudgetItems((prev) => [...prev, newItem]);
    setNewItemName('');
    setNewItemEst('');
    setNewItemNotes('');
    setIsAddModalOpen(false);
  };

  const handleToggleContingency = () => {
    if (hasContingency) {
      setBudgetItems((prev) => prev.filter((i) => i.category.toLowerCase() !== 'contingency'));
    } else {
      const tenPercent = Math.round(totalBudget * 0.1);
      const contingency: BudgetItem = {
        id: `contingency-${Date.now()}`,
        category: 'Contingency',
        name: 'Recommended Contingency & Buffer (10%)',
        estimated: tenPercent,
        actual: 0,
        paid: 0,
        percentage: 10,
        notes: 'Vital buffer for unforeseen overtime, emergency logistics, or guest additions',
        priority: 'high',
      };
      setBudgetItems((prev) => [...prev, contingency]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Target Budget */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Target Budget</span>
            <DollarSign className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900 tracking-tight">
            {formatCurrency(totalBudget, currency)}
          </div>
          <div className="mt-2 text-xs text-stone-500 flex items-center justify-between">
            <span>Allocated: {((totalEstimated / totalBudget) * 100).toFixed(0)}%</span>
            <span className={isOverBudget ? 'text-rose-600 font-bold' : 'text-emerald-600 font-medium'}>
              {isOverBudget ? 'Over Budget' : 'Within Bounds'}
            </span>
          </div>
          <div className="w-full bg-stone-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min((totalEstimated / totalBudget) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Estimated Allocation */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Estimated</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-950 tracking-tight">
            {formatCurrency(totalEstimated, currency)}
          </div>
          <div className="mt-2 text-xs text-stone-500 flex items-center gap-1.5">
            <span className="font-semibold text-stone-800">{budgetItems.length}</span> line items planned
          </div>
        </div>

        {/* Actual Spend */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Actual Committed</span>
            <Sliders className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 tracking-tight">
            {formatCurrency(totalActual, currency)}
          </div>
          <div className="mt-2 text-xs text-stone-500 flex items-center justify-between">
            <span>Advance Paid:</span>
            <span className="font-semibold text-stone-900">{formatCurrency(totalPaid, currency)}</span>
          </div>
        </div>

        {/* Remaining Balance */}
        <div className={`p-5 rounded-2xl border shadow-xs ${
          isOverBudget 
            ? 'bg-rose-50/70 border-rose-200 text-rose-900' 
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center justify-between mb-1 opacity-80">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isOverBudget ? 'Over Budget By' : 'Unallocated Buffer'}
            </span>
            {isOverBudget ? (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="text-2xl font-black tracking-tight">
            {formatCurrency(Math.abs(remainingBudget), currency)}
          </div>
          <div className="mt-2 text-xs opacity-80">
            {isOverBudget 
              ? 'Consider trimming non-essential items or rebalancing.' 
              : 'Safe and ready for unexpected costs.'}
          </div>
        </div>

      </div>

      {/* Contingency Banner & Quick AI Actions */}
      <div className="bg-linear-to-r from-stone-900 via-amber-950 to-stone-900 text-white rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl border border-amber-500/30">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 mt-0.5 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display text-base font-bold flex items-center gap-2">
              <span>10% Smart Contingency Guardrail</span>
              {hasContingency ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-semibold">
                  Active ({formatCurrency(contingencyItem?.estimated || 0, currency)})
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-semibold">
                  Recommended
                </span>
              )}
            </h4>
            <p className="font-serif-festive italic text-xs text-amber-100/80 mt-1 max-w-2xl">
              Professional event planners strictly recommend safeguarding 10% of total budget for overtime, sudden guest changes, or permit additions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={handleToggleContingency}
            className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              hasContingency
                ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
                : 'bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md'
            }`}
          >
            {hasContingency ? 'Remove Contingency' : '+ Add 10% Contingency'}
          </button>
          <button
            type="button"
            onClick={() => onAskCopilot(`Please analyze our current ${event.eventType} budget of ${currency}${totalBudget} and suggest 3 high-impact cost cuts or category reallocations.`)}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl border border-white/20 flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Rebalance</span>
          </button>
        </div>
      </div>

      {/* Visual Chart & Category Distribution */}
      <div className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-xs festive-card-glow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-display font-black text-stone-900 text-lg flex items-center gap-2">
              <span>Category Allocation Breakdown</span>
            </h3>
            <p className="font-serif-festive italic text-xs text-amber-800 font-medium">
              Interactive distribution of planned expenditures
            </p>
          </div>

          <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold border border-stone-200">
            <button
              type="button"
              onClick={() => setChartView('donut')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                chartView === 'donut' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Donut Wheel</span>
            </button>
            <button
              type="button"
              onClick={() => setChartView('bars')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                chartView === 'bars' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Category Bars</span>
            </button>
          </div>
        </div>

        {chartView === 'donut' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* SVG Donut */}
            <div className="lg:col-span-5 flex justify-center relative">
              <svg 
                viewBox="0 0 200 200" 
                className="w-56 h-56 transform -rotate-90"
                role="img"
                aria-label={`Category budget allocation donut chart. Total estimated allocation: ${formatCurrency(totalEstimated, currency)}.`}
              >
                <title>Category Budget Allocation Donut Chart</title>
                <desc>Interactive visualization of estimated spending across event categories</desc>
                {donutSegments.map((seg, idx) => (
                  <path
                    key={idx}
                    d={seg.pathData}
                    fill={seg.color}
                    role="button"
                    tabIndex={0}
                    aria-label={`${seg.category}: ${formatCurrency(seg.estimated, currency)} (${seg.percentage}%)`}
                    className="transition-all duration-300 cursor-pointer hover:opacity-85 hover:scale-105 origin-center focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    onMouseEnter={() => setHoveredSlice(seg.category)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    onFocus={() => setHoveredSlice(seg.category)}
                    onBlur={() => setHoveredSlice(null)}
                    onClick={() => setSelectedCategoryFilter(seg.category === selectedCategoryFilter ? 'All' : seg.category)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedCategoryFilter(seg.category === selectedCategoryFilter ? 'All' : seg.category);
                      }
                    }}
                  />
                ))}
                {/* Center Cutout hole */}
                <circle cx="100" cy="100" r="45" fill="white" />
              </svg>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center" aria-hidden="true">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  {hoveredSlice || 'Total'}
                </span>
                <span className="text-sm font-extrabold text-stone-900">
                  {hoveredSlice 
                    ? formatCurrency(categorySummary.find((c) => c.category === hoveredSlice)?.estimated || 0, currency)
                    : formatCurrency(totalEstimated, currency)
                  }
                </span>
              </div>
            </div>

            {/* Category Legend Pill Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="group" aria-label="Category Filters">
              {donutSegments.map((cat, idx) => (
                <div
                  key={idx}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedCategoryFilter === cat.category}
                  aria-label={`Filter by ${cat.category}: ${formatCurrency(cat.estimated, currency)}, ${cat.percentage}% of total`}
                  onMouseEnter={() => setHoveredSlice(cat.category)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  onFocus={() => setHoveredSlice(cat.category)}
                  onBlur={() => setHoveredSlice(null)}
                  onClick={() => setSelectedCategoryFilter(cat.category === selectedCategoryFilter ? 'All' : cat.category)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedCategoryFilter(cat.category === selectedCategoryFilter ? 'All' : cat.category);
                    }
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between focus:outline-hidden focus:ring-2 focus:ring-amber-500 ${
                    selectedCategoryFilter === cat.category
                      ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20'
                      : hoveredSlice === cat.category
                      ? 'bg-stone-50 border-stone-300'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-md shrink-0 shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-stone-800 truncate">
                        {cat.category}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {cat.count} {cat.count === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-extrabold text-stone-900">
                      {formatCurrency(cat.estimated, currency)}
                    </div>
                    <div className="text-[11px] font-semibold text-stone-500">
                      {cat.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        ) : (
          /* Comparative Horizontal Bars */
          <div className="space-y-3.5">
            {categorySummary.map((cat, idx) => {
              const maxEst = Math.max(...categorySummary.map((c) => c.estimated), 1);
              const estWidth = (cat.estimated / maxEst) * 100;
              const actWidth = (cat.actual / maxEst) * 100;
              return (
                <div key={idx} className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-stone-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                      {cat.category}
                    </span>
                    <div className="flex items-center gap-4 text-stone-600">
                      <span>Est: <strong className="text-stone-900">{formatCurrency(cat.estimated, currency)}</strong></span>
                      <span>Actual: <strong className={cat.actual > cat.estimated ? 'text-rose-600' : 'text-stone-900'}>{formatCurrency(cat.actual, currency)}</strong></span>
                    </div>
                  </div>
                  
                  {/* Estimated Bar */}
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${estWidth}%`, backgroundColor: cat.color }}
                    />
                  </div>
                  {/* Actual Bar */}
                  {cat.actual > 0 && (
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          cat.actual > cat.estimated ? 'bg-rose-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(actWidth, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Line Item Management Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-stone-900 text-base">Budget Line Items</h3>
            <p className="text-xs text-stone-500">
              Click any value to edit in-place. Changes update your totals in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter pills */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="text-xs font-semibold bg-stone-100 border border-stone-200 text-stone-700 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
            >
              {categoriesList.map((c) => (
                <option key={c} value={c}>Category: {c}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-2 rounded-xl transition-colors shadow-xs ml-auto sm:ml-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line Item</span>
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50/80 text-stone-400 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Item & Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4 text-right">Estimated</th>
                <th className="py-3 px-4 text-right">Actual</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Variance</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredItems.map((item) => {
                const isEditing = editingId === item.id;
                const isContingency = item.category.toLowerCase() === 'contingency';
                const varDiff = item.estimated - item.actual;
                const isItemOver = item.actual > item.estimated && item.actual > 0;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-stone-50/60 transition-colors ${
                      isContingency ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* Item Name & Notes */}
                    <td className="py-3 px-4 max-w-xs">
                      {isEditing ? (
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                          className="w-full text-xs font-bold text-stone-900 bg-white border border-stone-300 rounded-md px-2 py-1"
                        />
                      ) : (
                        <div>
                          <span className="font-bold text-stone-900 block">{item.name}</span>
                          {item.notes && (
                            <span className="text-[11px] text-stone-400 block truncate max-w-sm">
                              {item.notes}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[item.category] || DEFAULT_COLOR}15`,
                          color: CATEGORY_COLORS[item.category] || DEFAULT_COLOR,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[item.category] || DEFAULT_COLOR }}
                        />
                        {item.category}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.priority === 'high'
                          ? 'bg-rose-100 text-rose-800'
                          : item.priority === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        {item.priority}
                      </span>
                    </td>

                    {/* Estimated */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-stone-900">
                      {isEditing ? (
                        <input
                          type="number"
                          value={item.estimated}
                          onChange={(e) => handleUpdateItem(item.id, 'estimated', e.target.value)}
                          className="w-24 text-right text-xs font-bold bg-white border border-stone-300 rounded-md px-2 py-1"
                        />
                      ) : (
                        <span>{formatCurrency(item.estimated, currency)}</span>
                      )}
                    </td>

                    {/* Actual */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          value={item.actual}
                          onChange={(e) => handleUpdateItem(item.id, 'actual', Number(e.target.value))}
                          className="w-24 text-right text-xs font-bold bg-white border border-stone-300 rounded-md px-2 py-1"
                        />
                      ) : (
                        <span className={`font-semibold ${isItemOver ? 'text-rose-600 font-bold' : 'text-stone-700'}`}>
                          {item.actual > 0 ? formatCurrency(item.actual, currency) : '—'}
                        </span>
                      )}
                    </td>

                    {/* Paid */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          value={item.paid}
                          onChange={(e) => handleUpdateItem(item.id, 'paid', Number(e.target.value))}
                          className="w-24 text-right text-xs font-bold bg-white border border-stone-300 rounded-md px-2 py-1"
                        />
                      ) : (
                        <span className="text-stone-600">
                          {item.paid > 0 ? formatCurrency(item.paid, currency) : '—'}
                        </span>
                      )}
                    </td>

                    {/* Variance */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-[11px]">
                      {item.actual > 0 ? (
                        <span className={varDiff < 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}>
                          {varDiff < 0 ? `-${formatCurrency(Math.abs(varDiff), currency)}` : `+${formatCurrency(varDiff, currency)}`}
                        </span>
                      ) : (
                        <span className="text-stone-400">0</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingId(isEditing ? null : item.id)}
                          className="p-1 text-stone-400 hover:text-stone-800 rounded transition-colors"
                          title={isEditing ? 'Save edits' : 'Edit row'}
                        >
                          {isEditing ? <Check className="w-4 h-4 text-emerald-600" /> : <Edit3 className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="font-bold text-lg text-stone-900 mb-1">Add Budget Line Item</h3>
            <p className="text-xs text-stone-500 mb-4">
              Add a new expenditure to your {event.eventType} financial plan.
            </p>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Item Title</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Vintage Champagne Toast / Drone Operator"
                  className="w-full text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                  >
                    <option value="Catering">Catering</option>
                    <option value="Venue">Venue</option>
                    <option value="Photography & Media">Photography & Media</option>
                    <option value="Decor & Florals">Decor & Florals</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Attire & Beauty">Attire & Beauty</option>
                    <option value="Invitations & Favors">Invitations & Favors</option>
                    <option value="Logistics & Transport">Logistics & Transport</option>
                    <option value="Contingency">Contingency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Priority</label>
                  <select
                    value={newItemPriority}
                    onChange={(e) => setNewItemPriority(e.target.value as any)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                  >
                    <option value="high">High (Must-have)</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low (Nice-to-have)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Estimated Amount ({currency})</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newItemEst}
                  onChange={(e) => setNewItemEst(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Notes / Vendor Tips</label>
                <textarea
                  rows={2}
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                  placeholder="Optional notes or details..."
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
