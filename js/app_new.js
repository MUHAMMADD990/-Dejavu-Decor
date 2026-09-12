const STORAGE_KEY = 'dejavu_laser_erp_v1';
const THEME_KEY = 'dejavu_laser_theme';

const rolePermissions = {
  dashboard: ['Admin', 'Manager', 'Accountant', 'Viewer'],
  workPrep: ['Admin', 'Manager', 'Production Operator'],
  salesOrders: ['Admin', 'Manager', 'Accountant'],
  customers: ['Admin', 'Manager', 'Accountant'],
  inventory: ['Admin', 'Manager', 'Production Operator'],
  expenses: ['Admin', 'Manager', 'Accountant'],
  cashBank: ['Admin', 'Manager', 'Accountant'],
  decisions: ['Admin', 'Manager'],
  reports: ['Admin', 'Manager', 'Accountant', 'Viewer'],
  users: ['Admin'],
  settings: ['Admin'],
  audit: ['Admin', 'Manager', 'Accountant'],
};

const defaultState = {
  company: {
    name: 'DEJAVU LASER',
    currency: 'EGP',
    dateFormat: 'DD/MM/YYYY',
  },
  users: [
    { id: 'u1', username: 'admin', password: 'admin123', name: 'مدير النظام', role: 'Admin' },
    { id: 'u2', username: 'manager', password: 'manager123', name: 'المدير', role: 'Manager' },
    { id: 'u3', username: 'operator', password: 'operator123', name: 'المشغل', role: 'Production Operator' },
    { id: 'u4', username: 'accountant', password: 'accountant123', name: 'المحاسب', role: 'Accountant' },
    { id: 'u5', username: 'viewer', password: 'viewer123', name: 'المشاهد', role: 'Viewer' },
  ],
  customers: [
    { id: 'c1', name: 'مؤسسة النور', phone: '01000000001', email: 'test1@example.com', address: 'القاهرة', activity: 'إضاءة', status: 'نشط' },
    { id: 'c2', name: 'أبو عبيد', phone: '01000000002', email: 'test2@example.com', address: 'الإسكندرية', activity: 'مناسبات', status: 'مميز' },
  ],
  salesOrders: [],
  workOrders: [],
  completedWorkOrders: [],
  materials: [
    { id: 'm1', name: 'أكريليك', type: 'لوح', color: 'شفاف', thickness: 3, length: 244, width: 122, quantity: 20, remnantArea: 0, remnantPieces: 0, remnantLength: 0, remnantWidth: 0, unitCost: 350, minStock: 6, supplier: 'مورد محلي', storage: 'مستودع A' },
    { id: 'm2', name: 'MDF', type: 'لوح', color: 'بني', thickness: 3, length: 244, width: 122, quantity: 15, remnantArea: 0, remnantPieces: 0, remnantLength: 0, remnantWidth: 0, unitCost: 220, minStock: 5, supplier: 'مورد خشب', storage: 'مستودع B' },
  ],
  expenses: [],
  cashTransactions: [],
  bankTransactions: [],
  decisions: [],
  activityLogs: [],
  ui: { activeView: 'dashboard', selectedSalesOrderId: null },
};

const state = loadState();
let currentUser = null;
const editing = { salesOrderId: null, customerId: null, materialId: null, expenseId: null, decisionId: null };
const els = {
  app: document.getElementById('app'),
  loginScreen: document.getElementById('loginScreen'),
  loginForm: document.getElementById('loginForm'),
  loginUsername: document.getElementById('loginUsername'),
  loginPassword: document.getElementById('loginPassword'),
  currentUserBadge: document.getElementById('currentUserBadge'),
  logoutBtn: document.getElementById('logoutBtn'),
  themeToggle: document.getElementById('themeToggle'),
  navButtons: [...document.querySelectorAll('.nav-btn')],
  dashboardKpis: document.getElementById('dashboardKpis'),
  dashboardRecentActivity: document.getElementById('dashboardRecentActivity'),
  dashboardAnalysis: document.getElementById('dashboardAnalysis'),
  dashboardMonth: document.getElementById('dashboardMonth'),
  dashboardMonthlySummary: document.getElementById('dashboardMonthlySummary'),
  monthlySalesChart: document.getElementById('monthlySalesChart'),
  monthlyProfitChart: document.getElementById('monthlyProfitChart'),
  expenseByTypeChart: document.getElementById('expenseByTypeChart'),
  workStatusChart: document.getElementById('workStatusChart'),
  materialUsageChart: document.getElementById('materialUsageChart'),
  customerSalesChart: document.getElementById('customerSalesChart'),
  salesQueueList: document.getElementById('salesQueueList'),
  workPrepDetail: document.getElementById('workPrepDetail'),
  completedWorkOrdersTable: document.getElementById('completedWorkOrdersTable'),
  salesOrderForm: document.getElementById('salesOrderForm'),
  salesOrdersTable: document.getElementById('salesOrdersTable'),
  salesOrderMaterial: document.getElementById('salesOrderMaterial'),
  customerForm: document.getElementById('customerForm'),
  customersTable: document.getElementById('customersTable'),
  materialForm: document.getElementById('materialForm'),
  materialsTable: document.getElementById('materialsTable'),
  expenseForm: document.getElementById('expenseForm'),
  expensesTable: document.getElementById('expensesTable'),
  cashForm: document.getElementById('cashForm'),
  bankForm: document.getElementById('bankForm'),
  cashBankSummary: document.getElementById('cashBankSummary'),
  cashBankTransactions: document.getElementById('cashBankTransactions'),
  cashSalesOrder: document.getElementById('cashSalesOrder'),
  bankSalesOrder: document.getElementById('bankSalesOrder'),
  decisionForm: document.getElementById('decisionForm'),
  decisionsTable: document.getElementById('decisionsTable'),
  reportsSummary: document.getElementById('reportsSummary'),
  userForm: document.getElementById('userForm'),
  usersTable: document.getElementById('usersTable'),
  settingsForm: document.getElementById('settingsForm'),
  auditTable: document.getElementById('auditTable'),
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const fallback = structuredClone(defaultState);
  if (!saved) return fallback;

  try {
    const parsed = JSON.parse(saved);
    const merged = {
      ...fallback,
      ...parsed,
      company: { ...fallback.company, ...(parsed.company || {}) },
      ui: { ...fallback.ui, ...(parsed.ui || {}) },
    };

    ['users', 'customers', 'salesOrders', 'workOrders', 'completedWorkOrders', 'materials', 'expenses', 'cashTransactions', 'bankTransactions', 'decisions', 'activityLogs'].forEach(key => {
      if (!Array.isArray(merged[key])) merged[key] = fallback[key];
    });

    merged.materials = merged.materials.map(material => {
      if (material.id === 'm1') return { ...material, color: material.color || 'شفاف', length: Number(material.length) || 244, width: Number(material.width) || 122, thickness: material.thickness || 3, remnantArea: Number(material.remnantArea) || 0, remnantPieces: Number(material.remnantPieces) || 0, remnantLength: Number(material.remnantLength) || 0, remnantWidth: Number(material.remnantWidth) || 0 };
      if (material.id === 'm2') return { ...material, color: material.color || 'بني', length: Number(material.length) || 244, width: Number(material.width) || 122, thickness: material.thickness || 3, remnantArea: Number(material.remnantArea) || 0, remnantPieces: Number(material.remnantPieces) || 0, remnantLength: Number(material.remnantLength) || 0, remnantWidth: Number(material.remnantWidth) || 0 };
      return material;
    });

    return merged;
  } catch {
    return fallback;
  }
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function applyTheme(theme) {
  const light = theme === 'light';
  document.body.classList.toggle('light-theme', light);
  els.themeToggle.textContent = light ? 'الوضع الداكن' : 'الوضع العادي';
  els.themeToggle.setAttribute('aria-label', light ? 'التبديل للوضع الداكن' : 'التبديل للوضع العادي');
  localStorage.setItem(THEME_KEY, light ? 'light' : 'dark');
}
function toggleTheme() { applyTheme(document.body.classList.contains('light-theme') ? 'dark' : 'light'); }
function uid(prefix='id') { return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`; }
function formatCurrency(value) { return `${Number(value||0).toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م`; }
function formatDate(value) {
  if (!value) return '—';
  const dateText = String(value);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(dateText) ? new Date(`${dateText}T00:00:00`) : new Date(dateText);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatThickness(value) { const text = String(value ?? '').trim(); return text ? (/مم$/.test(text) ? text : `${text} مم`) : '—'; }
function userCan(section) { if (!currentUser) return false; return (rolePermissions[section] || []).includes(currentUser.role); }
function logActivity(action, section, payload) { state.activityLogs.unshift({ id: uid('log'), user: currentUser?.name || 'النظام', operation: action, section, log: `${section} - ${action}`, dateTime: new Date().toISOString(), payload }); state.activityLogs = state.activityLogs.slice(0, 200); }
function updateSelectedView(viewName) { state.ui.activeView = viewName; document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `${viewName}View`)); document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === viewName)); }

function renderNavigation() {
  els.currentUserBadge.textContent = currentUser ? `${currentUser.name} (${currentUser.role})` : 'مدير النظام';
  els.navButtons.forEach(btn => {
    const allowed = userCan(btn.dataset.view);
    btn.style.display = allowed ? 'block' : 'none';
  });
}

function chartItemsFromMap(map, limit = 6) {
  const entries = [...map.entries()].slice(-limit);
  const max = Math.max(...entries.map(([, value]) => value), 1);
  return entries.map(([label, value]) => ({ label, value: Math.max(8, (value / max) * 100), displayValue: Number(value.toFixed(2)) }));
}

function monthKey(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  if (!key) return 'غير محدد';
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
}

function renderDashboard() {
  const salesTotal = state.salesOrders.reduce((sum, o) => sum + Number(o.netSales || 0), 0);
  const collected = state.salesOrders.reduce((sum, o) => sum + Number(o.paid || 0), 0);
  const expenseTotal = state.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const materialsCost = [...state.workOrders, ...state.completedWorkOrders].reduce((sum, w) => sum + Number(w.materialCost || 0), 0);
  const profit = salesTotal - materialsCost - expenseTotal;
  const cashBalance = state.cashTransactions.reduce((sum, t) => sum + (t.type === 'دخل' ? Number(t.amount) : -Number(t.amount)), 0);
  const bankBalance = state.bankTransactions.reduce((sum, t) => sum + (t.type === 'دخل' ? Number(t.amount) : -Number(t.amount)), 0);
  const inventoryValue = state.materials.reduce((sum, m) => {
    const sheetArea = Number(m.length || 0) * Number(m.width || 0);
    const remnantValue = sheetArea > 0 ? (Number(m.remnantArea || 0) / sheetArea) * Number(m.unitCost || 0) : 0;
    return sum + Number(m.quantity || 0) * Number(m.unitCost || 0) + remnantValue;
  }, 0);

  const kpis = [
    ['إجمالي المبيعات', formatCurrency(salesTotal)],
    ['إجمالي التحصيلات', formatCurrency(collected)],
    ['إجمالي المصروفات', formatCurrency(expenseTotal)],
    ['إجمالي الربح', formatCurrency(profit)],
    ['رصيد الخزينة', formatCurrency(cashBalance)],
    ['رصيد البنك', formatCurrency(bankBalance)],
    ['قيمة المخزون', formatCurrency(inventoryValue)],
    ['أوامر البيع', state.salesOrders.length],
    ['أوامر الشغل', state.workOrders.length + state.completedWorkOrders.length],
    ['قيد التنفيذ', state.workOrders.filter(w => w.status === 'قيد التشغيل').length],
    ['مكتمل', state.workOrders.filter(w => ['جاهز للتسليم', 'مكتمل'].includes(w.status)).length + state.completedWorkOrders.length],
  ];

  els.dashboardKpis.innerHTML = kpis.map(([title, value]) => `
    <div class="kpi-card"><h4>${title}</h4><div class="value">${value}</div></div>
  `).join('');
  document.getElementById('dashboardDate').textContent = new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const recentOperations = state.activityLogs.slice(0, 10);
  els.dashboardRecentActivity.innerHTML = recentOperations.map(log => `
    <div class="recent-activity-item"><span class="activity-dot"></span><div><strong>${log.operation}</strong><small>${log.section} • ${formatDate(log.dateTime)}</small></div></div>
  `).join('') || '<div class="empty-state">لا توجد عمليات مسجلة حتى الآن</div>';

  const completedJobs = state.workOrders.filter(work => ['جاهز للتسليم', 'مكتمل'].includes(work.status)).length + state.completedWorkOrders.length;
  const totalJobs = state.workOrders.length + state.completedWorkOrders.length;
  const collectionRate = salesTotal > 0 ? Math.min(100, (collected / salesTotal) * 100) : 0;
  const completionRate = totalJobs > 0 ? Math.min(100, (completedJobs / totalJobs) * 100) : 0;
  const stockHealth = state.materials.length ? (state.materials.filter(m => Number(m.quantity || 0) > Number(m.minStock || 0)).length / state.materials.length) * 100 : 0;
  const profitRate = salesTotal > 0 ? Math.max(0, Math.min(100, (profit / salesTotal) * 100)) : 0;
  els.dashboardAnalysis.innerHTML = [
    ['نسبة التحصيل', collectionRate, `${formatCurrency(collected)} من ${formatCurrency(salesTotal)}`, 'primary'],
    ['نسبة إتمام الشغل', completionRate, `${completedJobs} من ${totalJobs} أوامر`, 'success'],
    ['سلامة المخزون', stockHealth, `${state.materials.filter(m => Number(m.quantity || 0) > Number(m.minStock || 0)).length} خامات متاحة`, 'warning'],
    ['هامش التشغيل', profitRate, formatCurrency(profit), 'info'],
  ].map(([title, percent, detail, tone]) => `
    <div class="analysis-card"><div class="analysis-ring ${tone}" style="--progress:${percent}%"><span>${percent.toFixed(0)}%</span></div><div><h4>${title}</h4><p>${detail}</p></div></div>
  `).join('');

  const salesByMonth = new Map();
  const profitByMonth = new Map();
  const expensesByType = new Map();
  const workByStatus = new Map();
  const materialUsage = new Map();
  const customerSales = new Map();
  const expensesByMonth = new Map();

  state.salesOrders.forEach(order => {
    const month = monthKey(order.orderDate);
    salesByMonth.set(month, (salesByMonth.get(month) || 0) + Number(order.netSales || 0));
    customerSales.set(order.customerName, (customerSales.get(order.customerName) || 0) + Number(order.netSales || 0));
    const workOrder = [...state.workOrders, ...state.completedWorkOrders].find(work => work.salesOrderId === order.id);
    const cost = Number(workOrder?.materialCost || 0);
    profitByMonth.set(month, (profitByMonth.get(month) || 0) + Number(order.netSales || 0) - cost);
  });
  state.expenses.forEach(expense => {
    expensesByType.set(expense.type, (expensesByType.get(expense.type) || 0) + Number(expense.amount || 0));
    const month = monthKey(expense.date);
    expensesByMonth.set(month, (expensesByMonth.get(month) || 0) + Number(expense.amount || 0));
  });
  expensesByMonth.forEach((amount, month) => profitByMonth.set(month, (profitByMonth.get(month) || 0) - amount));
  [...state.workOrders, ...state.completedWorkOrders].forEach(work => {
    workByStatus.set(work.status, (workByStatus.get(work.status) || 0) + 1);
    const material = state.materials.find(item => item.id === work.materialId);
    const name = material?.name || 'غير محدد';
    materialUsage.set(name, (materialUsage.get(name) || 0) + Number(work.consumedSheets || work.materialConsumed || 0));
  });

  renderBars(els.monthlySalesChart, chartItemsFromMap(salesByMonth).map(item => ({ ...item, label: monthLabel([...salesByMonth.keys()][item.label ? [...salesByMonth.keys()].indexOf(item.label) : 0]) })));
  renderBars(els.monthlyProfitChart, chartItemsFromMap(profitByMonth).map(item => ({ ...item, label: monthLabel([...profitByMonth.keys()][item.label ? [...profitByMonth.keys()].indexOf(item.label) : 0]) })));
  renderBars(els.expenseByTypeChart, chartItemsFromMap(expensesByType));
  renderBars(els.workStatusChart, chartItemsFromMap(workByStatus));
  renderBars(els.materialUsageChart, chartItemsFromMap(materialUsage));
  renderBars(els.customerSalesChart, chartItemsFromMap(customerSales));

  const monthKeys = [...new Set([...salesByMonth.keys(), ...expensesByMonth.keys()])].filter(Boolean).sort().reverse();
  const selectedMonth = els.dashboardMonth.value || monthKeys[0] || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  els.dashboardMonth.innerHTML = monthKeys.map(key => `<option value="${key}">${monthLabel(key)}</option>`).join('') || `<option value="${selectedMonth}">${monthLabel(selectedMonth)}</option>`;
  els.dashboardMonth.value = selectedMonth;
  renderMonthlySummary(selectedMonth);
}

function renderMonthlySummary(selectedMonth) {
  const monthlySales = state.salesOrders.filter(order => monthKey(order.orderDate) === selectedMonth).reduce((sum, order) => sum + Number(order.netSales || 0), 0);
  const monthlyExpenses = state.expenses.filter(expense => monthKey(expense.date) === selectedMonth).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const monthlyMaterialCost = [...state.workOrders, ...state.completedWorkOrders].filter(work => monthKey(work.completedAt || work.createdAt || '') === selectedMonth).reduce((sum, work) => sum + Number(work.materialCost || 0), 0);
  const monthlyProfit = monthlySales - monthlyExpenses - monthlyMaterialCost;
  els.dashboardMonthlySummary.innerHTML = [
    ['مبيعات الشهر', formatCurrency(monthlySales), 'primary'],
    ['مصروفات الشهر', formatCurrency(monthlyExpenses), 'danger'],
    ['تكلفة الخامات', formatCurrency(monthlyMaterialCost), 'warning'],
    ['أرباح الشهر', formatCurrency(monthlyProfit), 'success'],
  ].map(([title, value, tone]) => `<div class="monthly-card ${tone}"><span>${title}</span><strong>${value}</strong><small>${monthLabel(selectedMonth)}</small></div>`).join('');
}

function renderBars(container, items) {
  if (!items.length) {
    container.innerHTML = '<div class="chart-empty"><span class="chart-empty-icon">—</span><span>لا توجد بيانات مسجلة</span><small>ستظهر النتائج تلقائيًا بعد إضافة العمليات</small></div>';
    return;
  }
  container.innerHTML = items.map(item => `
    <div class="bar-item" style="height:${item.value}%">
      <span>${item.displayValue ?? item.value}</span>
      <span class="label">${item.label}</span>
    </div>
  `).join('');
}

function renderSalesOrders() {
  const options = state.materials.map(m => `<option value="${m.id}">${m.name} - ${m.color || 'بدون لون'} - ${formatThickness(m.thickness)} - ${m.length || '—'}×${m.width || '—'} سم</option>`).join('');
  els.salesOrderMaterial.innerHTML = options;

  const rows = state.salesOrders.map(order => `
    <tr>
      <td>${order.orderNumber}</td>
      <td>${formatDate(order.orderDate)}</td>
      <td>${order.customerName}</td>
      <td>${order.description}<br><small>${order.cutLength || '—'}×${order.cutWidth || '—'} سم × ${order.quantity}</small></td>
      <td>${formatCurrency(order.netSales || 0)}</td>
      <td>${order.status}</td>
      <td><button class="secondary-btn small" data-action="prepare-order" data-id="${order.id}">تجهيز</button><button class="secondary-btn small" data-action="edit-order" data-id="${order.id}">تعديل</button><button class="secondary-btn small" data-action="delete-order" data-id="${order.id}">حذف</button></td>
    </tr>
  `).join('');

  els.salesOrdersTable.innerHTML = `<table><thead><tr><th>رقم الطلب</th><th>التاريخ</th><th>العميل</th><th>الوصف</th><th>صافي البيع</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>${rows || '<tr><td colspan="7">لا توجد بيانات</td></tr>'}</tbody></table>`;
}

function renderCustomers() {
  const rows = state.customers.map(c => `
    <tr><td>${c.name}</td><td>${c.phone || '—'}</td><td>${c.email || '—'}</td><td>${c.address || '—'}</td><td>${c.activity || '—'}</td><td>${c.status || 'نشط'}</td><td><button class="secondary-btn small" data-action="edit-customer" data-id="${c.id}">تعديل</button><button class="secondary-btn small" data-action="delete-customer" data-id="${c.id}">حذف</button></td></tr>
  `).join('');
  els.customersTable.innerHTML = `<table><thead><tr><th>الاسم</th><th>الهاتف</th><th>البريد</th><th>العنوان</th><th>النشاط</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>${rows || '<tr><td colspan="7">لا توجد بيانات</td></tr>'}</tbody></table>`;
}

function renderMaterials() {
  const rows = state.materials.map(m => {
    const status = Number(m.quantity) <= Number(m.minStock) ? 'منخفض' : 'متوفر';
    const badgeClass = Number(m.quantity) <= Number(m.minStock) ? 'warning' : 'success';
    const sheetArea = Number(m.length || 0) * Number(m.width || 0);
    const remnantValue = sheetArea > 0 ? (Number(m.remnantArea || 0) / sheetArea) * Number(m.unitCost || 0) : 0;
    const totalValue = Number(m.quantity || 0) * Number(m.unitCost || 0) + remnantValue;
    return `<tr><td>${m.name}</td><td>${m.type}</td><td>${m.color || '—'}</td><td>${formatThickness(m.thickness)}</td><td>${m.length || '—'} × ${m.width || '—'}</td><td>${m.quantity}</td><td>${Number(m.remnantArea || 0).toLocaleString('ar-EG')} سم²<br><small>${m.remnantPieces || 0} قطعة مكافئة</small></td><td>${formatCurrency(m.unitCost || 0)}</td><td>${formatCurrency(totalValue)}</td><td><span class="badge ${badgeClass}">${status}</span></td><td>${m.storage || '—'}</td><td><button class="secondary-btn small" data-action="edit-material" data-id="${m.id}">تعديل</button><button class="secondary-btn small" data-action="delete-material" data-id="${m.id}">حذف</button></td></tr>`;
  }).join('');
  els.materialsTable.innerHTML = `<table><thead><tr><th>اسم الخامة</th><th>النوع</th><th>اللون</th><th>السمك</th><th>أبعاد اللوح</th><th>الألواح الكاملة</th><th>الباقي من آخر لوح</th><th>تكلفة الوحدة</th><th>إجمالي القيمة</th><th>الحالة</th><th>مكان التخزين</th><th>إجراءات</th></tr></thead><tbody>${rows || '<tr><td colspan="12">لا توجد بيانات</td></tr>'}</tbody></table>`;
}

function renderExpenses() {
  const rows = state.expenses.map(e => `
    <tr><td>${formatDate(e.date)}</td><td>${e.type}</td><td>${e.description}</td><td>${formatCurrency(e.amount || 0)}</td><td>${e.account}</td><td><button class="secondary-btn small" data-action="edit-expense" data-id="${e.id}">تعديل</button><button class="secondary-btn small" data-action="delete-expense" data-id="${e.id}">حذف</button></td></tr>
  `).join('');
  els.expensesTable.innerHTML = `<table><thead><tr><th>التاريخ</th><th>نوع المصروف</th><th>الوصف</th><th>المبلغ</th><th>الخزينة/البنك</th><th>إجراءات</th></tr></thead><tbody>${rows || '<tr><td colspan="6">لا توجد بيانات</td></tr>'}</tbody></table>`;
}

function renderCashBank() {
  const orderOptions = state.salesOrders.map(order => `<option value="${order.id}">${order.orderNumber} - ${order.customerName} - متبقي ${formatCurrency(order.remaining || 0)}</option>`).join('');
  els.cashSalesOrder.innerHTML = `<option value="">حركة عامة</option>${orderOptions}`;
  els.bankSalesOrder.innerHTML = `<option value="">حركة عامة</option>${orderOptions}`;
  const cashIn = state.cashTransactions.filter(t => t.type === 'دخل').reduce((s, t) => s + Number(t.amount || 0), 0);
  const cashOut = state.cashTransactions.filter(t => t.type === 'مصروف').reduce((s, t) => s + Number(t.amount || 0), 0);
  const bankIn = state.bankTransactions.filter(t => t.type === 'دخل').reduce((s, t) => s + Number(t.amount || 0), 0);
  const bankOut = state.bankTransactions.filter(t => t.type === 'مصروف').reduce((s, t) => s + Number(t.amount || 0), 0);

  els.cashBankSummary.innerHTML = `
    <div class="summary-card"><h4>إجمالي دخل الخزينة</h4><div class="value">${formatCurrency(cashIn)}</div></div>
    <div class="summary-card"><h4>إجمالي مصروف الخزينة</h4><div class="value">${formatCurrency(cashOut)}</div></div>
    <div class="summary-card"><h4>رصيد الخزينة</h4><div class="value">${formatCurrency(cashIn - cashOut)}</div></div>
    <div class="summary-card"><h4>إجمالي دخل البنك</h4><div class="value">${formatCurrency(bankIn)}</div></div>
    <div class="summary-card"><h4>إجمالي مصروف البنك</h4><div class="value">${formatCurrency(bankOut)}</div></div>
    <div class="summary-card"><h4>رصيد البنك</h4><div class="value">${formatCurrency(bankIn - bankOut)}</div></div>
  `;

  const rows = [...state.cashTransactions, ...state.bankTransactions].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,25).map(t => `
    <tr><td>${t.account}</td><td>${t.type}</td><td>${t.description}</td><td>${formatCurrency(t.amount || 0)}</td><td>${formatDate(t.date)}</td></tr>
  `).join('');

  els.cashBankTransactions.innerHTML = `<table><thead><tr><th>الحساب</th><th>النوع</th><th>الوصف</th><th>المبلغ</th><th>التاريخ</th></tr></thead><tbody>${rows || '<tr><td colspan="5">لا توجد بيانات</td></tr>'}</tbody></table>`;
}

function renderDecisions() {
  const rows = state.decisions.map(d => `
    <tr><td>${formatDate(d.date)}</td><td>${d.title}</td><td>${d.reason || '—'}</td><td>${d.status}</td><td><button class="secondary-btn small" data-action="edit-decision" data-id="${d.id}">تعديل</button><button class="secondary-btn small" data-action="delete-decision" data-id="${d.id}">حذف</button></td></tr>
  `).join('');
  els.decisionsTable.innerHTML = `<table><thead><tr><th>التاريخ</th><th>القرار</th><th>السبب</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>${rows || '<tr><td colspan="5">لا توجد بيانات</td></tr>'}</tbody></table>`;
}

function renderReports() {
  const salesTotal = state.salesOrders.reduce((s, o) => s + Number(o.netSales || 0), 0);
  const expenseTotal = state.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const materialCost = [...state.workOrders, ...state.completedWorkOrders].reduce((s, w) => s + Number(w.materialCost || 0), 0);
  const profit = salesTotal - materialCost - expenseTotal;
  els.reportsSummary.innerHTML = `
    <div class="summary-card"><h4>إجمالي المبيعات</h4><div class="value">${formatCurrency(salesTotal)}</div></div>
    <div class="summary-card"><h4>إجمالي المصروفات</h4><div class="value">${formatCurrency(expenseTotal)}</div></div>
    <div class="summary-card"><h4>إجمالي الربح</h4><div class="value">${formatCurrency(profit)}</div></div>
    <div class="summary-card"><h4>عدد أوامر الشغل</h4><div class="value">${state.workOrders.length + state.completedWorkOrders.length}</div></div>
  `;
}

function renderUsers() {
  const rows = state.users.map(u => `
    <tr><td>${u.username}</td><td>${u.name}</td><td>${u.role}</td><td>${u.username === 'admin' ? '—' : `<button class="secondary-btn small" data-action="delete-user" data-id="${u.id}">حذف</button>`}</td></tr>
  `).join('');
  els.usersTable.innerHTML = `<table><thead><tr><th>اسم المستخدم</th><th>الاسم</th><th>الدور</th><th>إجراءات</th></tr></thead><tbody>${rows || '<tr><td colspan="4">لا توجد بيانات</td></tr>'}</tbody></table>`;
}

function renderAudit() {
  const rows = state.activityLogs.map(log => `
    <tr><td>${log.user}</td><td>${log.operation}</td><td>${log.section}</td><td>${formatDate(log.dateTime)}</td></tr>
  `).join('');
  els.auditTable.innerHTML = `<table><thead><tr><th>المستخدم</th><th>العملية</th><th>القسم</th><th>التاريخ والوقت</th></tr></thead><tbody>${rows || '<tr><td colspan="4">لا توجد بيانات</td></tr>'}</tbody></table>`;
}

function renderCompletedWorkOrders() {
  const rows = state.completedWorkOrders.map(work => `
    <tr>
      <td>${work.workOrderNumber}</td>
      <td>${work.customerName}</td>
      <td>${work.description}</td>
      <td>${work.materialName || '—'} ${work.materialColor ? `(${work.materialColor})` : ''}</td>
      <td>${work.cutLength || '—'} × ${work.cutWidth || '—'} سم × ${work.quantity || 0}</td>
      <td>${work.consumedSheets || work.materialConsumed || 0} لوح</td>
      <td>${work.remainingPieces || 0} قطعة / ${Number(work.remainingArea || 0).toLocaleString('ar-EG')} سم²</td>
      <td>${formatCurrency(work.materialCost || 0)}</td>
      <td>${formatDate(work.completedAt)}</td>
    </tr>
  `).join('');
  els.completedWorkOrdersTable.innerHTML = `<table><thead><tr><th>رقم أمر الشغل</th><th>العميل</th><th>الوصف</th><th>الخامة</th><th>مساحة التشغيل</th><th>المستهلك</th><th>الباقي</th><th>تكلفة الخامة</th><th>تاريخ الإغلاق</th></tr></thead><tbody>${rows || '<tr><td colspan="9">لا توجد أوامر شغل مكتملة</td></tr>'}</tbody></table>`;
}

function renderWorkOrderActions(workOrder) {
  if (workOrder.status === 'ملغي') return '<div class="list-meta">تم إلغاء أمر الشغل وعكس خصم المخزون.</div>';
  return `<div class="mini-form">
    <button class="primary-btn small" data-action="start-job" data-id="${workOrder.id}">بدء التشغيل</button>
    <button class="secondary-btn small" data-action="pause-job" data-id="${workOrder.id}">إيقاف التشغيل</button>
    <button class="primary-btn small" data-action="complete-job" data-id="${workOrder.id}">استكمال التشغيل</button>
    <button class="primary-btn small" data-action="quality-check" data-id="${workOrder.id}">إرسال للجودة</button>
    <button class="primary-btn small" data-action="approve-quality" data-id="${workOrder.id}">اعتماد الجودة</button>
    <button class="primary-btn small" data-action="ready-delivery" data-id="${workOrder.id}">جاهز للتسليم</button>
    <button class="secondary-btn small" data-action="archive-work-order" data-id="${workOrder.id}">إغلاق وحفظ بالأرشيف</button>
    <button class="secondary-btn small" data-action="cancel-work-order" data-id="${workOrder.id}">إلغاء أمر الشغل</button>
  </div>`;
}

function renderWorkPreparation() {
  const archivedSalesOrderIds = new Set(state.completedWorkOrders.map(work => work.salesOrderId));
  const salesOrders = state.salesOrders.filter(order => !archivedSalesOrderIds.has(order.id) && order.status !== 'ملغي');
  els.salesQueueList.innerHTML = salesOrders.map(order => `
    <div class="list-item">
      <h4>${order.description}</h4>
      <div class="list-meta">${order.customerName} • ${formatDate(order.deliveryDate)}</div>
      <div class="badge ${order.status === 'مكتمل' ? 'success' : order.status === 'ملغي' ? 'danger' : 'info'}">${order.status}</div>
      <div class="actions-row" style="margin-top:12px;">
        <button class="primary-btn small" data-action="select-order" data-id="${order.id}">اختيار</button>
        <button class="secondary-btn small" data-action="prepare-order" data-id="${order.id}">تجهيز</button>
      </div>
    </div>
  `).join('') || '<div class="list-item">لا توجد أوامر بيع</div>';

  const selectedOrder = state.ui.selectedSalesOrderId ? salesOrders.find(o => o.id === state.ui.selectedSalesOrderId) : salesOrders[0];
  if (!selectedOrder) {
    els.workPrepDetail.innerHTML = '<div class="status-box">لا يوجد شغل محدد</div>';
    return;
  }

  const existingWorkOrder = state.workOrders.find(w => w.salesOrderId === selectedOrder.id);
  if (!existingWorkOrder) {
    const material = state.materials.find(m => m.id === selectedOrder.materialId) || state.materials[0];
    const available = Number(material?.quantity || 0);
    const requirement = calculateMaterialRequirement(selectedOrder, material);
    const hasDimensions = Number(material?.length) > 0 && Number(material?.width) > 0;
    const canCalculate = hasDimensions && requirement.piecesPerSheet > 0;
    const shortage = Math.max(0, requirement.requiredSheets - available);
    els.workPrepDetail.innerHTML = `
      <div class="status-box">
        <h4>${selectedOrder.description}</h4>
        <div class="list-meta">العميل: ${selectedOrder.customerName}</div>
        <div class="list-meta">الخامة: ${material?.name || '—'} | اللون: ${material?.color || '—'} | السمك: ${formatThickness(material?.thickness)}</div>
        <div class="list-meta">مساحة التشغيل: ${requirement.cutLength} × ${requirement.cutWidth} سم × ${requirement.quantity}</div>
        <div class="list-meta">المساحة المطلوبة: ${requirement.requiredArea.toLocaleString()} سم²</div>
        <div class="list-meta">اللوح ${material?.length || '—'} × ${material?.width || '—'} سم يستوعب: ${hasDimensions ? requirement.piecesPerSheet : 'غير محسوب'} قطعة</div>
        <div class="list-meta">الألواح المطلوبة: ${canCalculate ? requirement.requiredSheets : 'غير محسوبة'} | المخزون المتاح: ${available}</div>
        <div class="list-meta">المتبقي بعد التنفيذ: ${canCalculate ? requirement.remainingPieces : 'غير محسوب'} قطعة مكافئة = ${canCalculate ? requirement.remainingArea.toLocaleString() : '—'} سم²</div>
        <div class="badge ${!canCalculate || shortage > 0 ? 'warning' : 'success'}">${!hasDimensions ? 'أبعاد الخامة ناقصة' : !canCalculate ? 'القطعة أكبر من اللوح' : shortage > 0 ? 'الخامة غير كافية' : 'الخامة متوفرة'}</div>
        ${!hasDimensions ? '<div class="list-meta">أكمل طول وعرض اللوح من شاشة المخزون قبل إنشاء أمر الشغل.</div>' : !canCalculate ? '<div class="list-meta">راجع طول وعرض التشغيل أو اختر لوحًا أكبر.</div>' : shortage > 0 ? `<div class="list-meta">العجز: ${shortage} لوح</div>` : ''}
        <div class="actions-row" style="margin-top:16px;"><button class="primary-btn" data-action="generate-work-order" data-id="${selectedOrder.id}" ${!canCalculate || shortage > 0 ? 'disabled' : ''}>إنشاء أمر شغل</button></div>
      </div>
    `;
    return;
  }

  els.workPrepDetail.innerHTML = `
    <div class="status-box">
      <h4>أمر الشغل ${existingWorkOrder.workOrderNumber}</h4>
      <div class="list-meta">العميل: ${existingWorkOrder.customerName}</div>
      <div class="list-meta">الوصف: ${existingWorkOrder.description}</div>
      <div class="list-meta">الحالة: <span class="badge ${existingWorkOrder.status === 'جاهز للتسليم' ? 'success' : existingWorkOrder.status === 'قيد التشغيل' ? 'warning' : 'info'}">${existingWorkOrder.status}</span></div>
      ${renderWorkOrderActions(existingWorkOrder)}
    </div>
  `;
}

function renderAll() {
  if (!currentUser) {
    els.loginUsername.value = '';
    els.loginPassword.value = '';
    els.app.classList.add('hidden');
    els.loginScreen.classList.remove('hidden');
    return;
  }

  els.loginScreen.classList.add('hidden');
  els.app.classList.remove('hidden');
  renderNavigation();
  renderDashboard();
  renderSalesOrders();
  renderCustomers();
  renderMaterials();
  renderExpenses();
  renderCashBank();
  renderDecisions();
  renderReports();
  renderUsers();
  renderAudit();
  renderWorkPreparation();
  renderCompletedWorkOrders();
  updateSelectedView(state.ui.activeView);
}

function login(event) {
  event.preventDefault();
  const username = els.loginUsername.value.trim();
  const password = els.loginPassword.value.trim();
  const user = state.users.find(u => u.username === username && u.password === password);
  if (!user) return alert('اسم المستخدم أو كلمة المرور غير صحيحة');
  currentUser = user;
  logActivity('تسجيل الدخول', 'الأمان', { username: user.username, role: user.role });
  saveState();
  renderAll();
}

function logout() {
  currentUser = null;
  renderAll();
}

function setField(id, value) {
  const field = document.getElementById(id);
  if (field) field.value = value ?? '';
}

function editRecord(type, id) {
  const records = { order: state.salesOrders, customer: state.customers, material: state.materials, expense: state.expenses, decision: state.decisions };
  const record = records[type]?.find(item => item.id === id);
  if (!record) return;

  if (type === 'order') {
    editing.salesOrderId = id;
    Object.entries({ salesOrderNumber: record.orderNumber, salesOrderDate: record.orderDate, salesOrderCustomer: record.customerName, salesOrderPhone: record.phone, salesOrderDescription: record.description, salesOrderType: record.workType, salesOrderMaterial: record.materialId, salesOrderCutLength: record.cutLength, salesOrderCutWidth: record.cutWidth, salesOrderQuantity: record.quantity, salesOrderUnitPrice: record.unitPrice, salesOrderDiscount: record.discount, salesOrderDeposit: record.deposit, salesOrderDepositAccount: record.depositAccount, salesOrderDeliveryDate: record.deliveryDate, salesOrderPriority: record.priority, salesOrderStatus: record.status, salesOrderNotes: record.notes }).forEach(([field, value]) => setField(field, value));
    updateSelectedView('salesOrders');
  }
  if (type === 'customer') {
    editing.customerId = id;
    Object.entries({ customerName: record.name, customerPhone: record.phone, customerEmail: record.email, customerAddress: record.address, customerActivity: record.activity, customerStatus: record.status }).forEach(([field, value]) => setField(field, value));
    updateSelectedView('customers');
  }
  if (type === 'material') {
    editing.materialId = id;
    Object.entries({ materialName: record.name, materialType: record.type, materialColor: record.color, materialThickness: record.thickness, materialLength: record.length, materialWidth: record.width, materialQuantity: record.quantity, materialUnitCost: record.unitCost, materialMinStock: record.minStock, materialSupplier: record.supplier, materialStorage: record.storage }).forEach(([field, value]) => setField(field, value));
    updateSelectedView('inventory');
  }
  if (type === 'expense') {
    editing.expenseId = id;
    Object.entries({ expenseDate: record.date, expenseType: record.type, expenseDescription: record.description, expenseAmount: record.amount, expenseAccount: record.account, expenseSupplier: record.supplier }).forEach(([field, value]) => setField(field, value));
    updateSelectedView('expenses');
  }
  if (type === 'decision') {
    editing.decisionId = id;
    Object.entries({ decisionDate: record.date, decisionTitle: record.title, decisionReason: record.reason, decisionStatus: record.status, decisionNotes: record.notes }).forEach(([field, value]) => setField(field, value));
    updateSelectedView('decisions');
  }
}

function addSalesOrder(event) {
  event.preventDefault();
  if (!userCan('salesOrders')) return alert('ليس لديك صلاحية لإضافة أوامر البيع');
  const order = {
    id: uid('sale'),
    orderNumber: document.getElementById('salesOrderNumber').value.trim(),
    orderDate: document.getElementById('salesOrderDate').value,
    customerName: document.getElementById('salesOrderCustomer').value.trim(),
    phone: document.getElementById('salesOrderPhone').value.trim(),
    description: document.getElementById('salesOrderDescription').value.trim(),
    workType: document.getElementById('salesOrderType').value,
    materialId: document.getElementById('salesOrderMaterial').value,
    cutLength: Number(document.getElementById('salesOrderCutLength').value || 0),
    cutWidth: Number(document.getElementById('salesOrderCutWidth').value || 0),
    quantity: Number(document.getElementById('salesOrderQuantity').value || 0),
    unitPrice: Number(document.getElementById('salesOrderUnitPrice').value || 0),
    discount: Number(document.getElementById('salesOrderDiscount').value || 0),
    deposit: Number(document.getElementById('salesOrderDeposit').value || 0),
    depositAccount: document.getElementById('salesOrderDepositAccount').value,
    deliveryDate: document.getElementById('salesOrderDeliveryDate').value,
    priority: document.getElementById('salesOrderPriority').value,
    status: document.getElementById('salesOrderStatus').value,
    notes: document.getElementById('salesOrderNotes').value.trim(),
    paid: Number(document.getElementById('salesOrderDeposit').value || 0),
  };
  order.totalSales = order.quantity * order.unitPrice;
  order.netSales = Math.max(0, order.totalSales - order.discount);
  order.remaining = Math.max(0, order.netSales - order.deposit);
  const existingOrder = editing.salesOrderId && state.salesOrders.find(item => item.id === editing.salesOrderId);
  if (existingOrder) {
    const oldDeposit = existingOrder.deposit;
    Object.assign(existingOrder, order, { id: existingOrder.id });
    state.cashTransactions = state.cashTransactions.filter(t => !(t.sourceType === 'salesOrderDeposit' && t.sourceId === existingOrder.id));
    state.bankTransactions = state.bankTransactions.filter(t => !(t.sourceType === 'salesOrderDeposit' && t.sourceId === existingOrder.id));
    logActivity('تعديل أمر بيع', 'أوامر البيع', existingOrder);
    editing.salesOrderId = null;
  } else {
    state.salesOrders.unshift(order);
    logActivity('إضافة أمر بيع', 'أوامر البيع', order);
  }
  if (order.deposit > 0) {
    const depositTransaction = {
      id: uid(order.depositAccount === 'بنك' ? 'bank' : 'cash'),
      account: order.depositAccount,
      date: order.orderDate,
      type: 'دخل',
      description: `عربون أمر بيع ${order.orderNumber}`,
      amount: order.deposit,
      sourceType: 'salesOrderDeposit',
      sourceId: existingOrder?.id || order.id,
    };
    if (order.depositAccount === 'بنك') state.bankTransactions.unshift(depositTransaction);
    else state.cashTransactions.unshift(depositTransaction);
  }
  state.ui.selectedSalesOrderId = existingOrder?.id || order.id;
  saveState();
  event.target.reset();
  renderAll();
}

function addCustomer(event) {
  event.preventDefault();
  if (!userCan('customers')) return alert('ليس لديك صلاحية لإضافة العملاء');
  const customer = {
    id: uid('customer'),
    name: document.getElementById('customerName').value.trim(),
    phone: document.getElementById('customerPhone').value.trim(),
    email: document.getElementById('customerEmail').value.trim(),
    address: document.getElementById('customerAddress').value.trim(),
    activity: document.getElementById('customerActivity').value.trim(),
    status: document.getElementById('customerStatus').value,
  };
  const existingCustomer = editing.customerId && state.customers.find(item => item.id === editing.customerId);
  if (existingCustomer) {
    Object.assign(existingCustomer, customer, { id: existingCustomer.id });
    editing.customerId = null;
    logActivity('تعديل عميل', 'العملاء', existingCustomer);
  } else {
    state.customers.unshift(customer);
    logActivity('إضافة عميل', 'العملاء', customer);
  }
  saveState();
  event.target.reset();
  renderAll();
}

function addMaterial(event) {
  event.preventDefault();
  if (!userCan('inventory')) return alert('ليس لديك صلاحية لإدارة المخزون');
  const material = {
    id: uid('material'),
    name: document.getElementById('materialName').value.trim(),
    type: document.getElementById('materialType').value.trim(),
    color: document.getElementById('materialColor').value.trim(),
    thickness: Number(document.getElementById('materialThickness').value || 0),
    length: Number(document.getElementById('materialLength').value || 0),
    width: Number(document.getElementById('materialWidth').value || 0),
    quantity: Number(document.getElementById('materialQuantity').value || 0),
    unitCost: Number(document.getElementById('materialUnitCost').value || 0),
    minStock: Number(document.getElementById('materialMinStock').value || 0),
    supplier: document.getElementById('materialSupplier').value.trim(),
    storage: document.getElementById('materialStorage').value.trim(),
  };
  const existingMaterial = editing.materialId && state.materials.find(item => item.id === editing.materialId);
  if (existingMaterial) {
    Object.assign(existingMaterial, material, { id: existingMaterial.id });
    editing.materialId = null;
    logActivity('تعديل خامة', 'المخزون', existingMaterial);
  } else {
    state.materials.unshift(material);
    logActivity('إضافة خامة', 'المخزون', material);
  }
  saveState();
  event.target.reset();
  renderAll();
}

function addExpense(event) {
  event.preventDefault();
  if (!userCan('expenses')) return alert('ليس لديك صلاحية للإضافة إلى المصروفات');
  const expense = {
    id: uid('expense'),
    date: document.getElementById('expenseDate').value,
    type: document.getElementById('expenseType').value,
    description: document.getElementById('expenseDescription').value.trim(),
    amount: Number(document.getElementById('expenseAmount').value || 0),
    account: document.getElementById('expenseAccount').value,
    supplier: document.getElementById('expenseSupplier').value.trim(),
  };
  const existingExpense = editing.expenseId && state.expenses.find(item => item.id === editing.expenseId);
  if (existingExpense) {
    Object.assign(existingExpense, expense, { id: existingExpense.id });
    state.cashTransactions = state.cashTransactions.filter(t => !(t.sourceType === 'expense' && t.sourceId === existingExpense.id));
    state.bankTransactions = state.bankTransactions.filter(t => !(t.sourceType === 'expense' && t.sourceId === existingExpense.id));
    editing.expenseId = null;
    logActivity('تعديل مصروف', 'المصروفات', existingExpense);
  } else {
    state.expenses.unshift(expense);
    logActivity('إضافة مصروف', 'المصروفات', expense);
  }
  const expenseTransaction = {
    id: uid(expense.account === 'بنك' ? 'bank' : 'cash'),
    account: expense.account,
    date: expense.date,
    type: 'مصروف',
    description: `مصروف: ${expense.description}`,
    amount: expense.amount,
    sourceType: 'expense',
    sourceId: existingExpense?.id || expense.id,
  };
  if (expense.account === 'بنك') state.bankTransactions.unshift(expenseTransaction);
  else state.cashTransactions.unshift(expenseTransaction);
  if (!existingExpense) logActivity('إضافة مصروف', 'المصروفات', expense);
  saveState();
  event.target.reset();
  renderAll();
}

function addCashTransaction(event) {
  event.preventDefault();
  if (!userCan('cashBank')) return alert('ليس لديك صلاحية لإدارة الخزينة');
  const amount = Number(document.getElementById('cashAmount').value || 0);
  const salesOrderId = document.getElementById('cashSalesOrder').value;
  const tx = { id: uid('cash'), account: 'خزينة', date: document.getElementById('cashDate').value, type: document.getElementById('cashType').value, description: document.getElementById('cashDescription').value.trim(), amount, salesOrderId };
  if (tx.type === 'دخل' && salesOrderId) applySalesOrderPayment(salesOrderId, amount);
  state.cashTransactions.unshift(tx);
  logActivity('إضافة حركة خزينة', 'الخزينة والبنك', tx);
  saveState();
  event.target.reset();
  renderAll();
}

function addBankTransaction(event) {
  event.preventDefault();
  if (!userCan('cashBank')) return alert('ليس لديك صلاحية لإدارة البنك');
  const amount = Number(document.getElementById('bankAmount').value || 0);
  const salesOrderId = document.getElementById('bankSalesOrder').value;
  const tx = { id: uid('bank'), account: 'بنك', date: document.getElementById('bankDate').value, type: document.getElementById('bankType').value, description: document.getElementById('bankDescription').value.trim(), amount, salesOrderId };
  if (tx.type === 'دخل' && salesOrderId) applySalesOrderPayment(salesOrderId, amount);
  state.bankTransactions.unshift(tx);
  logActivity('إضافة حركة بنك', 'الخزينة والبنك', tx);
  saveState();
  event.target.reset();
  renderAll();
}

function applySalesOrderPayment(orderId, amount) {
  const order = state.salesOrders.find(item => item.id === orderId);
  if (!order) return;
  order.paid = Math.min(Number(order.netSales || 0), Number(order.paid || 0) + Number(amount || 0));
  order.remaining = Math.max(0, Number(order.netSales || 0) - order.paid);
}

function addDecision(event) {
  event.preventDefault();
  if (!userCan('decisions')) return alert('ليس لديك صلاحية لإدارة القرارات');
  const decision = {
    id: uid('decision'),
    date: document.getElementById('decisionDate').value,
    title: document.getElementById('decisionTitle').value.trim(),
    reason: document.getElementById('decisionReason').value.trim(),
    status: document.getElementById('decisionStatus').value,
    notes: document.getElementById('decisionNotes').value.trim(),
  };
  const existingDecision = editing.decisionId && state.decisions.find(item => item.id === editing.decisionId);
  if (existingDecision) {
    Object.assign(existingDecision, decision, { id: existingDecision.id });
    editing.decisionId = null;
    logActivity('تعديل قرار', 'القرارات الإدارية', existingDecision);
  } else {
    state.decisions.unshift(decision);
    logActivity('إضافة قرار', 'القرارات الإدارية', decision);
  }
  saveState();
  event.target.reset();
  renderAll();
}

function addUser(event) {
  event.preventDefault();
  if (!userCan('users')) return alert('ليس لديك صلاحية لإدارة المستخدمين');
  const user = {
    id: uid('user'),
    username: document.getElementById('userUsername').value.trim(),
    name: document.getElementById('userName').value.trim(),
    password: document.getElementById('userPassword').value.trim(),
    role: document.getElementById('userRole').value,
  };
  state.users.unshift(user);
  logActivity('إضافة مستخدم', 'المستخدمين والصلاحيات', user);
  saveState();
  event.target.reset();
  renderAll();
}

function saveSettings(event) {
  event.preventDefault();
  if (!userCan('settings')) return alert('ليس لديك صلاحية للإعدادات');
  state.company.name = document.getElementById('settingsCompanyName').value.trim() || 'DEJAVU LASER';
  state.company.currency = document.getElementById('settingsCurrency').value.trim() || 'EGP';
  state.company.dateFormat = document.getElementById('settingsDateFormat').value.trim() || 'DD/MM/YYYY';
  logActivity('تحديث الإعدادات', 'الإعدادات', state.company);
  saveState();
  renderAll();
}

function calculateMaterialRequirement(order, material) {
  const quantity = Number(order.quantity || 0);
  const cutLength = Number(order.cutLength || material?.length || 0);
  const cutWidth = Number(order.cutWidth || material?.width || 0);
  const sheetLength = Number(material?.length || 0);
  const sheetWidth = Number(material?.width || 0);
  const directFit = Math.floor(sheetLength / cutLength) * Math.floor(sheetWidth / cutWidth);
  const rotatedFit = Math.floor(sheetLength / cutWidth) * Math.floor(sheetWidth / cutLength);
  const piecesPerSheet = Math.max(directFit, rotatedFit);
  const requiredArea = cutLength * cutWidth * quantity;
  const sheetArea = sheetLength * sheetWidth;
  const sameRemnant = Number(material?.remnantLength) === cutLength && Number(material?.remnantWidth) === cutWidth;
  const remnantPiecesAvailable = sameRemnant ? Number(material?.remnantPieces || 0) : 0;
  const piecesFromSheets = Math.max(0, quantity - remnantPiecesAvailable);
  const requiredSheets = piecesPerSheet > 0 ? Math.ceil(piecesFromSheets / piecesPerSheet) : 0;
  const piecesOnLastSheet = piecesPerSheet > 0 && requiredSheets > 0 ? (piecesFromSheets % piecesPerSheet || piecesPerSheet) : 0;
  const remainingPieces = Math.max(0, remnantPiecesAvailable + (requiredSheets * piecesPerSheet) - quantity);
  const remainingArea = remainingPieces * cutLength * cutWidth;

  return { quantity, cutLength, cutWidth, sheetLength, sheetWidth, requiredArea, sheetArea, piecesPerSheet, requiredSheets, piecesOnLastSheet, remnantPiecesAvailable, remainingPieces, remainingArea };
}

function generateWorkOrder(orderId) {
  const order = state.salesOrders.find(o => o.id === orderId);
  if (!order) return;
  const material = state.materials.find(m => m.id === order.materialId) || state.materials[0];
  if (!material || Number(material.length) <= 0 || Number(material.width) <= 0) {
    alert('لا يمكن إنشاء أمر الشغل قبل تسجيل طول وعرض اللوح للخامة المختارة.');
    return;
  }
  const requirement = calculateMaterialRequirement(order, material);
  if (requirement.piecesPerSheet <= 0) {
    alert('مقاس القطعة أكبر من مقاس اللوح، أو أبعاد التشغيل غير صحيحة.');
    return;
  }

  if (!material || Number(material.quantity || 0) < requirement.requiredSheets) {
    alert(`المخزون غير كافٍ. المطلوب: ${requirement.requiredSheets} لوح، والمتاح: ${material?.quantity || 0} لوح`);
    return;
  }

  const workOrder = {
    id: uid('work'),
    createdAt: new Date().toISOString(),
    salesOrderId: order.id,
    workOrderNumber: `WO-${String(state.workOrders.length + 1).padStart(4, '0')}`,
    customerName: order.customerName,
    description: order.description,
    quantity: requirement.quantity,
    status: 'قيد التجهيز',
    operator: currentUser?.name || 'غير محدد',
    materialId: material ? material.id : '',
    materialName: material?.name || '',
    materialColor: material?.color || '',
    materialThickness: material?.thickness || 0,
    materialLength: material?.length || 0,
    materialWidth: material?.width || 0,
    cutLength: requirement.cutLength,
    cutWidth: requirement.cutWidth,
    requiredArea: requirement.requiredArea,
    piecesPerSheet: requirement.piecesPerSheet,
    remainingPieces: requirement.remainingPieces,
    remainingArea: requirement.remainingArea,
    consumedSheets: requirement.requiredSheets,
    materialCost: Number(material?.unitCost || 0) * requirement.requiredSheets,
    materialConsumed: requirement.requiredSheets,
    scrapQty: 0,
    notes: '',
    inventoryBefore: {
      quantity: Number(material.quantity || 0),
      remnantArea: Number(material.remnantArea || 0),
      remnantPieces: Number(material.remnantPieces || 0),
      remnantLength: Number(material.remnantLength || 0),
      remnantWidth: Number(material.remnantWidth || 0),
    },
  };

  if (material) {
    material.quantity = Math.max(0, Number(material.quantity || 0) - requirement.requiredSheets);
    material.remnantArea = requirement.remainingArea;
    material.remnantPieces = requirement.remainingPieces;
    material.remnantLength = requirement.remainingPieces > 0 ? requirement.cutLength : 0;
    material.remnantWidth = requirement.remainingPieces > 0 ? requirement.cutWidth : 0;
  }

  state.workOrders.unshift(workOrder);
  order.status = 'قيد التجهيز';
  logActivity('إنشاء أمر شغل', 'تجهيز الشغل', workOrder);
  saveState();
  renderAll();
}

function handleWorkAction(action, id) {
  const job = state.workOrders.find(w => w.id === id);
  if (!job) return;

  if (action === 'start-job') job.status = 'قيد التشغيل';
  if (action === 'pause-job') job.status = 'متوقف';
  if (action === 'complete-job') job.status = 'جاهز للجودة';
  if (action === 'quality-check') job.status = 'قيد المراجعة';
  if (action === 'approve-quality') job.status = 'جاهز للتسليم';
  if (action === 'ready-delivery') job.status = 'جاهز للتسليم';

  logActivity(action, 'تجهيز الشغل', job);
  saveState();
  renderAll();
}

function archiveWorkOrder(id) {
  const index = state.workOrders.findIndex(work => work.id === id);
  if (index === -1) return;
  const workOrder = state.workOrders[index];
  if (!['جاهز للتسليم', 'مكتمل'].includes(workOrder.status)) {
    alert('لا يمكن أرشفة أمر الشغل قبل اعتماده وجعله جاهزًا للتسليم.');
    return;
  }
  const salesOrder = state.salesOrders.find(order => order.id === workOrder.salesOrderId);
  workOrder.status = 'مكتمل';
  workOrder.completedAt = new Date().toISOString();
  workOrder.completedBy = currentUser?.name || 'غير محدد';
  state.completedWorkOrders.unshift(workOrder);
  state.workOrders.splice(index, 1);
  if (salesOrder) salesOrder.status = 'مكتمل';
  state.ui.selectedSalesOrderId = null;
  logActivity('إغلاق وأرشفة أمر شغل', 'تجهيز الشغل', workOrder);
  saveState();
  renderAll();
}

function cancelWorkOrder(id) {
  const workOrder = state.workOrders.find(work => work.id === id);
  if (!workOrder || workOrder.status === 'ملغي') return;
  if (!confirm('سيتم إلغاء أمر الشغل وإعادة الكمية والباقي إلى المخزون. هل تريد المتابعة؟')) return;

  const material = state.materials.find(item => item.id === workOrder.materialId);
  if (material && workOrder.inventoryBefore) {
    Object.assign(material, workOrder.inventoryBefore);
  } else if (material) {
    material.quantity = Number(material.quantity || 0) + Number(workOrder.consumedSheets || workOrder.materialConsumed || 0);
  }

  workOrder.status = 'ملغي';
  workOrder.cancelledAt = new Date().toISOString();
  workOrder.inventoryReversed = true;
  const salesOrder = state.salesOrders.find(order => order.id === workOrder.salesOrderId);
  if (salesOrder) salesOrder.status = 'ملغي';
  logActivity('إلغاء أمر شغل وعكس خصم المخزون', 'تجهيز الشغل', workOrder);
  saveState();
  renderAll();
}

function handleButtonActions(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === 'select-order' || action === 'prepare-order') {
    state.ui.selectedSalesOrderId = id;
    renderWorkPreparation();
  }

  if (action === 'edit-order') editRecord('order', id);
  if (action === 'edit-customer') editRecord('customer', id);
  if (action === 'edit-material') editRecord('material', id);
  if (action === 'edit-expense') editRecord('expense', id);
  if (action === 'edit-decision') editRecord('decision', id);

  if (action === 'generate-work-order') generateWorkOrder(id);
  if (action === 'archive-work-order') archiveWorkOrder(id);
  if (action === 'cancel-work-order') cancelWorkOrder(id);
  if (['start-job', 'pause-job', 'complete-job', 'quality-check', 'approve-quality', 'ready-delivery'].includes(action)) handleWorkAction(action, id);

  if (action === 'delete-order') {
    const activeWorkOrder = state.workOrders.find(w => w.salesOrderId === id && w.status !== 'ملغي');
    if (activeWorkOrder || state.completedWorkOrders.some(w => w.salesOrderId === id)) {
      alert('لا يمكن حذف أمر بيع بدأ له أمر شغل. أغلق أمر الشغل أولاً أو اعكس حركة المخزون من خلال إجراء مخصص.');
      return;
    }
    state.workOrders = state.workOrders.filter(w => w.salesOrderId !== id);
    state.salesOrders = state.salesOrders.filter(o => o.id !== id);
    state.cashTransactions = state.cashTransactions.filter(t => !(t.sourceType === 'salesOrderDeposit' && t.sourceId === id));
    state.bankTransactions = state.bankTransactions.filter(t => !(t.sourceType === 'salesOrderDeposit' && t.sourceId === id));
    logActivity('حذف أمر بيع', 'أوامر البيع', { id });
    saveState();
    renderAll();
  }
  if (action === 'delete-customer') { state.customers = state.customers.filter(c => c.id !== id); logActivity('حذف عميل', 'العملاء', { id }); saveState(); renderAll(); }
  if (action === 'delete-material') { state.materials = state.materials.filter(m => m.id !== id); logActivity('حذف خامة', 'المخزون', { id }); saveState(); renderAll(); }
  if (action === 'delete-expense') {
    state.expenses = state.expenses.filter(e => e.id !== id);
    state.cashTransactions = state.cashTransactions.filter(t => !(t.sourceType === 'expense' && t.sourceId === id));
    state.bankTransactions = state.bankTransactions.filter(t => !(t.sourceType === 'expense' && t.sourceId === id));
    logActivity('حذف مصروف', 'المصروفات', { id });
    saveState();
    renderAll();
  }
  if (action === 'delete-decision') { state.decisions = state.decisions.filter(d => d.id !== id); logActivity('حذف قرار', 'القرارات', { id }); saveState(); renderAll(); }
  if (action === 'delete-user') {
    if (id === state.users.find(u => u.username === 'admin')?.id) return alert('لا يمكن حذف المستخدم الرئيسي');
    state.users = state.users.filter(u => u.id !== id);
    logActivity('حذف مستخدم', 'المستخدمين', { id });
    saveState();
    renderAll();
  }
}

function handleExport(event) {
  const report = event.target.dataset.report;
  if (report === 'csv') {
    const rows = [
      ['إجمالي المبيعات', state.salesOrders.reduce((s, o) => s + Number(o.netSales || 0), 0)],
      ['إجمالي المصروفات', state.expenses.reduce((s, e) => s + Number(e.amount || 0), 0)],
      ['إجمالي الربح', state.salesOrders.reduce((s, o) => s + Number(o.netSales || 0), 0) - state.expenses.reduce((s, e) => s + Number(e.amount || 0), 0)],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'dejavu_report.csv';
    a.click(); URL.revokeObjectURL(url);
  }
  if (report === 'print') window.print();
}

function wireEvents() {
  els.loginForm.addEventListener('submit', login);
  els.logoutBtn.addEventListener('click', logout);
  els.themeToggle.addEventListener('click', toggleTheme);
  els.dashboardMonth.addEventListener('change', event => renderMonthlySummary(event.target.value));
  els.navButtons.forEach(btn => btn.addEventListener('click', () => updateSelectedView(btn.dataset.view)));

  els.salesOrderForm.addEventListener('submit', addSalesOrder);
  els.customerForm.addEventListener('submit', addCustomer);
  els.materialForm.addEventListener('submit', addMaterial);
  els.expenseForm.addEventListener('submit', addExpense);
  els.cashForm.addEventListener('submit', addCashTransaction);
  els.bankForm.addEventListener('submit', addBankTransaction);
  els.decisionForm.addEventListener('submit', addDecision);
  els.userForm.addEventListener('submit', addUser);
  els.settingsForm.addEventListener('submit', saveSettings);

  document.addEventListener('click', handleButtonActions);
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-report]');
    if (target) handleExport(event);
  });
}

applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
wireEvents();
renderAll();
