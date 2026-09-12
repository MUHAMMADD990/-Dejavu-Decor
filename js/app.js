const STORAGE_KEY = 'dijavu-state';

const state = loadState();

const elements = {
  projectCount: document.getElementById('projectCount'),
  customerCount: document.getElementById('customerCount'),
  projectsList: document.getElementById('projectsList'),
  customersList: document.getElementById('customersList'),
  projectSearch: document.getElementById('projectSearch'),
  customerSearch: document.getElementById('customerSearch'),
  statusFilter: document.getElementById('statusFilter'),
  pricingProjectSelect: document.getElementById('pricingProjectSelect'),
  pricingProjectName: document.getElementById('pricingProjectName'),
  pricingAmount: document.getElementById('pricingAmount'),
  pricingNotes: document.getElementById('pricingNotes'),
  projectModal: document.getElementById('projectModal'),
  customerModal: document.getElementById('customerModal'),
  projectForm: document.getElementById('projectForm'),
  customerForm: document.getElementById('customerForm')
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return { projects: [], customers: [], pricing: {} };
    }
  }
  return { projects: [], customers: [], pricing: {} };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getProjectById(id) {
  return state.projects.find(project => project.id === id);
}

function renderStats() {
  elements.projectCount.textContent = state.projects.length;
  elements.customerCount.textContent = state.customers.length;
}

function renderProjects() {
  const query = elements.projectSearch.value.trim().toLowerCase();
  const status = elements.statusFilter.value;

  let filtered = [...state.projects];

  if (status !== 'all') {
    filtered = filtered.filter(project => project.status === status);
  }

  if (query) {
    filtered = filtered.filter(project => {
      return (
        project.name.toLowerCase().includes(query) ||
        project.customerName.toLowerCase().includes(query)
      );
    });
  }

  elements.projectsList.innerHTML = filtered.map(project => `
    <article class="card">
      <h4>${project.name}</h4>
      <div class="meta">العميل: ${project.customerName}</div>
      <div class="meta">الميزانية: ${project.budget || 0} ر.س</div>
      <div class="badge status-${project.status === 'مكتمل' ? 'complete' : project.status === 'جديد' ? 'pending' : 'normal'}">${project.status}</div>
      <div class="actions">
        <button class="secondary-btn" data-project-id="${project.id}" data-action="edit-project">تعديل</button>
        <button class="primary-btn" data-project-id="${project.id}" data-action="open-pricing">التسعير</button>
      </div>
    </article>
  `).join('');
}

function renderCustomers() {
  const query = elements.customerSearch.value.trim().toLowerCase();
  const filtered = query
    ? state.customers.filter(customer => customer.name.toLowerCase().includes(query))
    : state.customers;

  elements.customersList.innerHTML = filtered.map(customer => `
    <article class="card">
      <h4>${customer.name}</h4>
      <div class="meta">الهاتف: ${customer.phone || '—'}</div>
      <div class="meta">البريد: ${customer.email || '—'}</div>
    </article>
  `).join('');
}

function renderPricingSelect() {
  elements.pricingProjectSelect.innerHTML = '<option value="">اختر مشروعًا</option>' + state.projects.map(project => `
    <option value="${project.id}">${project.name}</option>
  `).join('');
}

function renderState() {
  renderStats();
  renderProjects();
  renderCustomers();
  renderPricingSelect();
}

function openView(viewName) {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  document.querySelectorAll('.view').forEach(view => {
    view.classList.toggle('active', view.id === `${viewName}View`);
  });
}

function openProjectModal() {
  elements.projectModal.classList.remove('hidden');
}

function closeProjectModal() {
  elements.projectModal.classList.add('hidden');
  elements.projectForm.reset();
}

function openCustomerModal() {
  elements.customerModal.classList.remove('hidden');
}

function closeCustomerModal() {
  elements.customerModal.classList.add('hidden');
  elements.customerForm.reset();
}

function addProject(event) {
  event.preventDefault();

  const name = document.getElementById('projectName').value.trim();
  const customerName = document.getElementById('projectCustomerName').value.trim();
  const status = document.getElementById('projectStatus').value;
  const budget = document.getElementById('projectBudget').value || 0;

  if (!name || !customerName) return;

  const existingCustomer = state.customers.find(customer => customer.name === customerName);
  if (!existingCustomer) {
    state.customers.push({
      id: crypto.randomUUID(),
      name: customerName,
      phone: '',
      email: ''
    });
  }

  state.projects.push({
    id: crypto.randomUUID(),
    name,
    customerName,
    status,
    budget: Number(budget),
    pricing: state.pricing[name] || null
  });

  saveState();
  renderState();
  closeProjectModal();
}

function addCustomer(event) {
  event.preventDefault();

  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const email = document.getElementById('customerEmail').value.trim();

  if (!name) return;

  state.customers.push({
    id: crypto.randomUUID(),
    name,
    phone,
    email
  });

  saveState();
  renderState();
  closeCustomerModal();
}

function openPricing(projectId) {
  const project = getProjectById(projectId);
  if (!project) return;

  elements.pricingProjectSelect.value = projectId;
  elements.pricingProjectName.value = project.name;
  elements.pricingAmount.value = project.pricing?.amount || '';
  elements.pricingNotes.value = project.pricing?.notes || '';
  openView('pricing');
}

function savePricing() {
  const projectId = elements.pricingProjectSelect.value;
  if (!projectId) return;

  const project = getProjectById(projectId);
  if (!project) return;

  project.pricing = {
    amount: Number(elements.pricingAmount.value || 0),
    notes: elements.pricingNotes.value.trim()
  };

  saveState();
  renderState();
  alert('تم حفظ التسعير للمشروع بنجاح');
}

function initEvents() {
  document.getElementById('newProjectBtn').addEventListener('click', openProjectModal);
  document.getElementById('cancelProjectBtn').addEventListener('click', closeProjectModal);
  document.getElementById('newCustomerBtn').addEventListener('click', openCustomerModal);
  document.getElementById('cancelCustomerBtn').addEventListener('click', closeCustomerModal);
  document.getElementById('savePricingBtn').addEventListener('click', savePricing);

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => openView(btn.dataset.view));
  });

  elements.projectForm.addEventListener('submit', addProject);
  elements.customerForm.addEventListener('submit', addCustomer);

  elements.projectSearch.addEventListener('input', renderProjects);
  elements.customerSearch.addEventListener('input', renderCustomers);
  elements.statusFilter.addEventListener('change', renderProjects);

  elements.projectsList.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-action]');
    if (!btn) return;

    const projectId = btn.dataset.projectId;
    const action = btn.dataset.action;

    if (action === 'open-pricing') {
      openPricing(projectId);
    }
  });

  elements.pricingProjectSelect.addEventListener('change', (event) => {
    const projectId = event.target.value;
    if (!projectId) {
      elements.pricingProjectName.value = '';
      elements.pricingAmount.value = '';
      elements.pricingNotes.value = '';
      return;
    }

    const project = getProjectById(projectId);
    if (project) {
      elements.pricingProjectName.value = project.name;
      elements.pricingAmount.value = project.pricing?.amount || '';
      elements.pricingNotes.value = project.pricing?.notes || '';
    }
  });
}

renderState();
initEvents();
