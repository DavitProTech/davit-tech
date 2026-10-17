const API_URL = "https://davit-tech-api.onrender.com";
const serviceSelect = document.getElementById("serviceSelect");
const orderForm = document.getElementById("orderForm");
const dateInput = document.getElementById("date");
const timeSelect = document.getElementById("timeSelect");
const summaryService = document.getElementById("summaryService");
const summaryDateTime = document.getElementById("summaryDateTime");
const summaryPrice = document.getElementById("summaryPrice");

// ხელმისაწვდომი სამუშაო საათები
const WORKING_HOURS = Array.from({ length: 21 }, (_, index) => {
  const minutesFromStart = index * 30;
  const hours = 10 + Math.floor(minutesFromStart / 60);
  const minutes = minutesFromStart % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

function updatePriceDisplay() {
  if (!serviceSelect || !summaryService || !summaryPrice) return;
  const selected = serviceSelect.options[serviceSelect.selectedIndex];
  const price = selected?.getAttribute("data-price");
  summaryService.textContent = selected?.value || "არ არის არჩეული";
  summaryPrice.textContent = price ? `${price}₾` : "—";
  updateSummaryDateTime();
}

function updateSummaryDateTime() {
  if (!summaryDateTime) return;
  const rawDate = dateInput?.value;
  const selectedTime = timeSelect?.value;

  if (!rawDate || !selectedTime) {
    summaryDateTime.textContent = "არ არის არჩეული";
    return;
  }

  const [year, month, day] = rawDate.split("-").map(Number);
  const monthNames = [
    "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
    "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"
  ];
  const formattedDate = `${day} ${monthNames[month - 1]}, ${year}`;

  summaryDateTime.textContent = `${formattedDate} · ${selectedTime}`;
}

serviceSelect?.addEventListener("change", updatePriceDisplay);
dateInput?.addEventListener("change", updateSummaryDateTime);
timeSelect?.addEventListener("change", updateSummaryDateTime);
updatePriceDisplay();

// --- თარიღის არჩევისას დაკავებული საათების შემოწმება ---
dateInput?.addEventListener("change", async (e) => {
  const selectedDate = e.target.value;
  if (!selectedDate) {
    timeSelect.innerHTML = '<option value="">ჯერ აირჩიეთ თარიღი</option>';
    timeSelect.disabled = true;
    updateSummaryDateTime();
    return;
  }

  timeSelect.disabled = true;
  timeSelect.innerHTML = '<option value="">მოწმდება თავისუფალი დროები...</option>';
  updateSummaryDateTime();

  try {
    const response = await fetch(`${API_URL}/api/booked-slots?date=${selectedDate}`);
    const result = await response.json();

    const bookedSlots = result.bookedTimes || []; 

    timeSelect.innerHTML = '<option value="">აირჩიეთ სასურველი დრო</option>';

    WORKING_HOURS.forEach((time) => {
      const fullDateTime = `${selectedDate} ${time}`;
      const isBooked = bookedSlots.some(slot => slot.includes(time) || slot === fullDateTime);

      const option = document.createElement("option");
      option.value = time;

      if (isBooked) {
        option.textContent = `${time} (დაკავებულია ❌)`;
        option.disabled = true;
      } else {
        option.textContent = `${time} (თავისუფალია ✅)`;
      }

      timeSelect.appendChild(option);
    });

    timeSelect.disabled = false;
    updateSummaryDateTime();
  } catch (error) {
    console.error("Error fetching booked slots:", error);
    timeSelect.innerHTML = '<option value="">შეცდომა დროების ჩატვირთვისას</option>';
    updateSummaryDateTime();
  }
});

// --- შეკვეთის გაგზავნა ---
orderForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = orderForm.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;

  const selectedOption = serviceSelect?.options[serviceSelect.selectedIndex];
  const rawDate = dateInput?.value || "";
  const selectedTime = timeSelect?.value || "";

  if (!rawDate || !selectedTime) {
    alert("გთხოვთ აირჩიოთ თარიღი და დრო!");
    if (submitButton) submitButton.disabled = false;
    return;
  }

  const combinedDateTime = `${rawDate} ${selectedTime}`;

  const order = {
    name: document.getElementById("customerName")?.value.trim() || "",
    phone: document.getElementById("customerPhone")?.value.trim() || "",
    service: serviceSelect?.value || "",
    price: selectedOption?.getAttribute("data-price") || "",
    address: document.getElementById("address")?.value.trim() || "",
    description: document.getElementById("description")?.value.trim() || "",
    date: combinedDateTime
  };

  try {
    const response = await fetch(`${API_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      alert("შეცდომა: " + (result.message || "დაფიქსირდა გაურკვეველი შეცდომა"));
      return;
    }

    alert("შეკვეთა მიღებულია ✅ Order ID: " + result.data.id);
    orderForm.reset();
    timeSelect.innerHTML = '<option value="">ჯერ აირჩიეთ თარიღი</option>';
    timeSelect.disabled = true;
    updatePriceDisplay();
  } catch (error) {
    console.error("Order submission error:", error);
    alert("სერვერთან დაკავშირების შეცდომა. სცადე თავიდან.");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

// --- ადმინ პანელი და მარშრუტიზაცია ---
const adminBox = document.getElementById("adminBox");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminPanel = document.getElementById("adminPanel");
const usernameInput = document.getElementById("adminUsername");
const passwordInput = document.getElementById("adminPassword");
const adminStatsView = document.getElementById("adminStatsView");
const adminOrdersView = document.getElementById("adminOrdersView");
const statsPeriod = document.getElementById("statsPeriod");
let adminOrders = [];
let pendingCancellationOrderId = null;
let adminStatusToastTimeout;
const georgianMonthNames = [
  "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
  "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"
];
const georgianShortMonthNames = [
  "იან", "თებ", "მარ", "აპრ", "მაი", "ივნ",
  "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"
];
const sectionList = [
  document.getElementById("hero"),
  document.getElementById("services"),
  document.getElementById("how-it-works"),
  document.getElementById("order")
];

function getOrderDate(order) {
  const parseDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  return parseDate(order.createdAt) || parseDate(order.date);
}

function getSelectedOrders() {
  if (statsPeriod?.value === "all") return adminOrders;

  const days = Number(statsPeriod?.value) || 30;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);

  return adminOrders.filter((order) => {
    const date = getOrderDate(order);
    return date && date >= start && date <= new Date();
  });
}

function formatMoney(amount) {
  return `₾ ${Number(amount || 0).toLocaleString("ka-GE", {
    maximumFractionDigits: 2
  })}`;
}

function isCancelledOrder(order) {
  return (order.status || "").includes("❌") || /cancel/i.test(order.status || "");
}

function getOrderStatusGroup(order) {
  const status = order.status || "";
  if (isCancelledOrder(order)) return "cancelled";
  if (status.includes("✅") || /confirm|complete|დადასტურებულ/i.test(status)) return "completed";
  if (status.includes("🚗") || /progress|გზაში/i.test(status)) return "inProgress";
  return "pending";
}

function formatOrderDate(order) {
  const date = new Date(order.date || order.createdAt || "");
  if (Number.isNaN(date.getTime())) return order.date || "—";
  return `${date.getDate()} ${georgianMonthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function renderTrendChart(orders) {
  const container = document.getElementById("adminTrendChart");
  if (!container) return;
  container.replaceChildren();

  const range = statsPeriod?.value === "all" ? 30 : Number(statsPeriod?.value) || 30;
  const datedOrders = orders
    .map((order) => ({ order, date: getOrderDate(order) }))
    .filter((entry) => entry.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let startDate = new Date(today);
  startDate.setDate(startDate.getDate() - range + 1);

  if (statsPeriod?.value === "all" && datedOrders.length) {
    const earliestDate = datedOrders.reduce(
      (earliest, entry) => Math.min(earliest, entry.date.getTime()),
      Number.POSITIVE_INFINITY
    );
    startDate = new Date(earliestDate);
    startDate.setHours(0, 0, 0, 0);
  }

  const daySpan = Math.max(1, Math.floor((today - startDate) / 86400000) + 1);
  const maxBuckets = statsPeriod?.value === "all" ? 30 : 90;
  const bucketCount = Math.min(daySpan, maxBuckets);
  const buckets = Array.from({ length: bucketCount }, () => ({ revenue: 0, orders: 0 }));
  const bucketForDate = (date) => {
    const day = Math.floor((date - startDate) / 86400000);
    return Math.min(bucketCount - 1, Math.max(0, Math.floor(day * bucketCount / daySpan)));
  };

  datedOrders.forEach(({ order, date }) => {
    if (date < startDate || date > new Date()) return;
    const bucket = buckets[bucketForDate(date)];
    bucket.orders += 1;
    if (!isCancelledOrder(order)) bucket.revenue += Number.parseFloat(order.price) || 0;
  });

  const width = 680;
  const height = 230;
  const left = 48;
  const right = 640;
  const top = 20;
  const bottom = 180;
  const maxRevenue = Math.max(1, ...buckets.map((bucket) => bucket.revenue));
  const revenueCeiling = Math.ceil(maxRevenue / 100) * 100 || 100;
  const maxOrders = Math.max(1, ...buckets.map((bucket) => bucket.orders));
  const xForIndex = (index) => left + (bucketCount < 2 ? 0 : index * (right - left) / (bucketCount - 1));
  const yForRevenue = (value) => bottom - value / revenueCeiling * (bottom - top);
  const yForOrders = (value) => bottom - value / maxOrders * (bottom - top);
  const svg = createSvgElement("svg", {
    viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio: "none",
    role: "img",
    "aria-label": `არჩეული პერიოდის შემოსავლისა და შეკვეთების დინამიკა. მაქსიმალური შემოსავალი: ${formatMoney(maxRevenue)}.`
  });

  const defs = createSvgElement("defs");
  const gradient = createSvgElement("linearGradient", {
    id: "adminRevenueGradient",
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "1"
  });
  gradient.append(
    createSvgElement("stop", { offset: "0%", "stop-color": "#39a96f", "stop-opacity": ".2" }),
    createSvgElement("stop", { offset: "100%", "stop-color": "#39a96f", "stop-opacity": "0" })
  );
  defs.appendChild(gradient);
  svg.appendChild(defs);

  for (let index = 0; index <= 3; index += 1) {
    const y = top + (bottom - top) * index / 3;
    svg.appendChild(createSvgElement("line", {
      x1: left,
      y1: y,
      x2: right,
      y2: y,
      class: "admin-chart-gridline"
    }));
    const axisLabel = createSvgElement("text", { x: 0, y: y + 4, class: "admin-chart-axis" });
    axisLabel.textContent = `₾${Math.round(revenueCeiling * (3 - index) / 3)}`;
    svg.appendChild(axisLabel);
    const orderLabel = createSvgElement("text", {
      x: right + 8,
      y: y + 4,
      class: "admin-chart-axis admin-chart-right-axis"
    });
    orderLabel.textContent = String(Math.round(maxOrders * (3 - index) / 3));
    svg.appendChild(orderLabel);
  }

  const revenuePoints = buckets.map((bucket, index) => [xForIndex(index), yForRevenue(bucket.revenue)]);
  const orderPoints = buckets.map((bucket, index) => [xForIndex(index), yForOrders(bucket.orders)]);
  const trendPoints = (mode) => buckets.map((_, index) => {
    const nearby = buckets.slice(Math.max(0, index - 2), Math.min(buckets.length, index + 3));
    const values = nearby.map((bucket) => bucket.revenue);
    return [xForIndex(index), yForRevenue(mode === "high" ? Math.max(...values) : Math.min(...values))];
  });
  const pointsToPath = (points) => points
    .map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const revenuePath = pointsToPath(revenuePoints);
  const areaPath = `${revenuePath} L${right} ${bottom} L${left} ${bottom} Z`;

  svg.append(
    createSvgElement("path", { d: areaPath, fill: "url(#adminRevenueGradient)" }),
    createSvgElement("path", { d: pointsToPath(trendPoints("high")), class: "admin-chart-high-trend" }),
    createSvgElement("path", { d: pointsToPath(trendPoints("low")), class: "admin-chart-low-trend" }),
    createSvgElement("path", { d: revenuePath, class: "admin-chart-revenue" }),
    createSvgElement("path", { d: pointsToPath(orderPoints), class: "admin-chart-orders" })
  );

  const labelCount = Math.min(5, bucketCount);
  for (let index = 0; index < labelCount; index += 1) {
    const bucketIndex = Math.round(index * (bucketCount - 1) / Math.max(1, labelCount - 1));
    const labelDate = new Date(startDate);
    labelDate.setDate(labelDate.getDate() + Math.floor(bucketIndex * daySpan / bucketCount));
    const label = createSvgElement("text", {
      x: xForIndex(bucketIndex),
      y: 211,
      class: "admin-chart-axis admin-chart-date",
      "text-anchor": index === 0 ? "start" : index === labelCount - 1 ? "end" : "middle"
    });
    label.textContent = `${labelDate.getDate()} ${georgianShortMonthNames[labelDate.getMonth()]}`;
    svg.appendChild(label);
  }

  container.appendChild(svg);
}

function renderOrderStatus(orders) {
  const container = document.getElementById("adminStatusBreakdown");
  if (!container) return;
  container.replaceChildren();

  const counts = { completed: 0, inProgress: 0, pending: 0, cancelled: 0 };
  orders.forEach((order) => { counts[getOrderStatusGroup(order)] += 1; });
  const total = orders.length;
  const categories = [
    ["completed", "დადასტურებული"],
    ["inProgress", "გზაშია"],
    ["pending", "მოლოდინში"],
    ["cancelled", "გაუქმებული"]
  ];

  const track = document.createElement("div");
  track.className = "admin-status-track";
  categories.forEach(([key, label]) => {
    const segment = document.createElement("span");
    segment.className = `admin-status-segment status-${key}`;
    segment.style.width = `${total ? counts[key] / total * 100 : 0}%`;
    segment.setAttribute("aria-label", `${label}: ${counts[key]}`);
    track.appendChild(segment);
  });
  container.appendChild(track);

  const list = document.createElement("div");
  list.className = "admin-status-list";
  categories.forEach(([key, label]) => {
    const row = document.createElement("div");
    row.className = "admin-status-row";
    const name = document.createElement("span");
    name.className = "admin-status-name";
    const dot = document.createElement("i");
    dot.className = `admin-status-dot status-${key}`;
    const value = document.createElement("span");
    value.textContent = label;
    name.append(dot, value);
    const count = document.createElement("strong");
    count.textContent = String(counts[key]);
    row.append(name, count);
    list.appendChild(row);
  });
  container.appendChild(list);

  const note = document.createElement("p");
  note.className = "admin-status-note";
  note.textContent = `გაუქმებული შეკვეთები შემოსავალში არ არის გათვალისწინებული (${counts.cancelled})`;
  container.appendChild(note);
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById("recentOrdersTable");
  if (!tbody) return;
  tbody.replaceChildren();

  const recentOrders = [...orders]
    .sort((first, second) => (getOrderDate(second)?.getTime() || 0) - (getOrderDate(first)?.getTime() || 0))
    .slice(0, 5);

  if (!recentOrders.length) {
    const row = tbody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 6;
    cell.textContent = "ამ პერიოდში შეკვეთები არ არის.";
    return;
  }

  recentOrders.forEach((order) => {
    const row = tbody.insertRow();
    const status = document.createElement("span");
    const statusGroup = getOrderStatusGroup(order);
    status.className = `admin-status-pill status-${statusGroup}`;
    status.textContent = getStatusLabel(order);
    [
      order.id,
      order.name,
      order.service,
      formatOrderDate(order),
      formatMoney(order.price),
      status
    ].forEach((value, index) => {
      const cell = row.insertCell();
      if (index === 0) cell.className = "admin-history-id";
      if (index === 4) cell.className = "admin-history-amount";
      if (value instanceof Node) cell.appendChild(value);
      else cell.textContent = value || "—";
    });
  });
}

function renderAdminStats() {
  const orders = getSelectedOrders();
  const billableOrders = orders.filter((order) => !isCancelledOrder(order));
  const totalRevenue = billableOrders.reduce((sum, order) => sum + (Number.parseFloat(order.price) || 0), 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((order) => getOrderStatusGroup(order) === "pending").length;

  document.getElementById("totalRevenue").textContent = formatMoney(totalRevenue);
  document.getElementById("totalOrdersCount").textContent = String(totalOrders);
  document.getElementById("averageOrderValue").textContent = formatMoney(
    billableOrders.length ? totalRevenue / billableOrders.length : 0
  );
  document.getElementById("pendingOrdersCount").textContent = String(pendingOrders);
  renderTrendChart(orders);
  renderOrderStatus(orders);
  renderRecentOrders(orders);
}

function setAdminView(view) {
  const showStats = view === "stats";
  if (adminStatsView) adminStatsView.hidden = !showStats;
  if (adminOrdersView) adminOrdersView.hidden = showStats;

  document.querySelectorAll("[data-admin-view]").forEach((button) => {
    const isActive = button.dataset.adminView === view;
    if (button.classList.contains("admin-nav-button")) {
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    }
  });

  const title = document.getElementById("adminPageTitle");
  const breadcrumb = document.getElementById("adminBreadcrumb");
  const subtitle = document.querySelector(".admin-page-subtitle");
  if (title) title.textContent = showStats ? "სტატისტიკა და შეკვეთები" : "შეკვეთების მართვა";
  if (breadcrumb) breadcrumb.textContent = showStats ? "სტატისტიკა" : "შეკვეთები";
  if (subtitle) {
    subtitle.textContent = showStats
      ? "შემოსავალი, შეკვეთების აქტივობა და ბოლო შეკვეთები ერთ სივრცეში."
      : "იხილეთ მომხმარებლების შეკვეთები და მართეთ მათი სტატუსები.";
  }
  const periodLabel = document.querySelector(".admin-period-label");
  if (periodLabel) periodLabel.hidden = !showStats;
  if (statsPeriod) statsPeriod.hidden = !showStats;
  renderAdminStats();
}

function showAdminError(message) {
  const loadError = document.getElementById("adminLoadError");
  if (!loadError) return;
  loadError.textContent = message;
  loadError.hidden = false;
}

function clearAdminError() {
  const loadError = document.getElementById("adminLoadError");
  if (!loadError) return;
  loadError.hidden = true;
  loadError.textContent = "";
}

function showAdminStatusToast(message) {
  const toast = document.getElementById("adminStatusToast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(adminStatusToastTimeout);
  adminStatusToastTimeout = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2400);
}

function getStatusLabel(order) {
  const status = order.status || "⏳ მუშავდება";
  const labels = {
    completed: "დადასტურებულია",
    inProgress: "ოსტატი გზაშია",
    pending: "მუშავდება",
    cancelled: "გაუქმებულია"
  };
  return labels[getOrderStatusGroup(order)] || status;
}

function getAdminErrorMessage(error, fallback) {
  const messages = {
    "Failed to fetch": "სერვერთან დაკავშირება ვერ მოხერხდა.",
    "Failed to load orders": "შეკვეთების ჩატვირთვა ვერ მოხერხდა.",
    "Invalid orders response": "სერვერიდან მიღებული შეკვეთების მონაცემები არასწორია.",
    "Failed to update order status": "შეკვეთის სტატუსის განახლება ვერ მოხერხდა.",
    "Order not found": "შეკვეთა ვერ მოიძებნა.",
    "Invalid order status": "შეკვეთის სტატუსი არასწორია.",
    "Unknown error": "დაფიქსირდა უცნობი შეცდომა."
  };
  return messages[error?.message] || fallback;
}

async function loadOrders() {
  const tbody = document.querySelector("#ordersTable tbody");
  if (!tbody) return;

  try {
    const response = await fetch(`${API_URL}/api/orders`);
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to load orders");
    }

    if (!Array.isArray(result.data)) {
      throw new Error("Invalid orders response");
    }

    adminOrders = result.data;
    tbody.replaceChildren();
    if (adminOrders.length === 0) {
      const row = tbody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 10;
      cell.textContent = "შეკვეთები არ მოიძებნა.";
      clearAdminError();
      renderAdminStats();
      return;
    }

    adminOrders.forEach((order) => {
      const row = tbody.insertRow();
      [
        order.id,
        order.service,
        order.name,
        order.phone,
        order.address,
        `${order.price}₾`,
        order.description,
        order.date
      ].forEach((value) => {
        row.insertCell().textContent = value || "";
      });

      const statusCell = row.insertCell();
      const statusGroup = getOrderStatusGroup(order);
      const statusBadge = document.createElement("span");
      statusBadge.className = `admin-order-current-status status-${statusGroup}`;
      statusBadge.textContent = getStatusLabel(order);
      statusCell.appendChild(statusBadge);

      const actionCell = row.insertCell();
      const statusActions = document.createElement("div");
      statusActions.className = "admin-order-status-actions";
      const quickActions = document.createElement("div");
      quickActions.className = "admin-order-quick-actions";
      const selectedAction = {
        completed: "confirm",
        inProgress: "ontheway",
        cancelled: "cancel"
      }[statusGroup];
      [
        ["confirm", "✅ დადასტურება"],
        ["ontheway", "🚗 გზაშია"],
        ["cancel", "❌ გაუქმება"]
      ].forEach(([status, label]) => {
        const statusButton = document.createElement("button");
        statusButton.type = "button";
        statusButton.className = `admin-order-status-button status-action-${status}`;
        if (status === selectedAction) {
          statusButton.classList.add("is-selected");
          statusButton.setAttribute("aria-pressed", "true");
        } else {
          statusButton.setAttribute("aria-pressed", "false");
        }
        statusButton.textContent = label;
        statusButton.addEventListener("click", () => {
          if (status === "cancel") {
            pendingCancellationOrderId = order.id;
            document.getElementById("cancelOrderDialog")?.showModal();
            return;
          }
          window.updateOrderStatus(order.id, status);
        });
        quickActions.appendChild(statusButton);
      });
      statusActions.appendChild(quickActions);

      const currentStatus = document.createElement("span");
      currentStatus.className = "admin-order-current-label";
      currentStatus.textContent = `მიმდინარე სტატუსი: ${getStatusLabel(order)}`;
      statusActions.appendChild(currentStatus);

      actionCell.appendChild(statusActions);
    });
    clearAdminError();
    renderAdminStats();
  } catch (error) {
    console.error("Error loading orders:", error);
    adminOrders = [];
    renderAdminStats();
    showAdminError(getAdminErrorMessage(error, "შეკვეთების ჩატვირთვა ვერ მოხერხდა. შეამოწმეთ კავშირი და სცადეთ ხელახლა."));
    tbody.replaceChildren();
    const row = tbody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 10;
    cell.textContent = "შეკვეთების ჩატვირთვა ვერ მოხერხდა. შეამოწმეთ სერვერთან კავშირი.";
  }
}

window.updateOrderStatus = async (orderId, status) => {
  const row = [...document.querySelectorAll("#ordersTable tbody tr")]
    .find((tableRow) => tableRow.cells[0]?.textContent === orderId);
  const buttons = row ? [...row.querySelectorAll(".admin-order-status-button")] : [];
  buttons.forEach((button) => { button.disabled = true; });

  try {
    const response = await fetch(`${API_URL}/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to update order status");
    }
    clearAdminError();
    await loadOrders();
    showAdminStatusToast(`შეკვეთა ${orderId} · ${getStatusLabel(result.data)}`);
  } catch (error) {
    console.error(`Error updating status for order ${orderId}:`, error);
    showAdminError(`${getAdminErrorMessage(error, "შეკვეთის სტატუსის განახლება ვერ მოხერხდა.")} (შეკვეთა ${orderId})`);
    buttons.forEach((button) => { button.disabled = false; });
  }
};

document.getElementById("keepOrderButton")?.addEventListener("click", () => {
  pendingCancellationOrderId = null;
  document.getElementById("cancelOrderDialog")?.close();
});

document.getElementById("confirmCancelOrderButton")?.addEventListener("click", () => {
  const orderId = pendingCancellationOrderId;
  pendingCancellationOrderId = null;
  document.getElementById("cancelOrderDialog")?.close();
  if (orderId) window.updateOrderStatus(orderId, "cancel");
});

document.getElementById("cancelOrderDialog")?.addEventListener("close", () => {
  pendingCancellationOrderId = null;
});

document.getElementById("refreshOrdersBtn")?.addEventListener("click", loadOrders);
document.querySelectorAll("[data-admin-view]").forEach((button) => {
  button.addEventListener("click", () => setAdminView(button.dataset.adminView));
});
statsPeriod?.addEventListener("change", renderAdminStats);

adminLoginForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (passwordInput?.value === "2003" && usernameInput?.value === "admin") {
    if (adminBox) {
      adminBox.classList.remove("show");
      adminBox.style.display = "none";
    }
    if (adminPanel) adminPanel.style.display = "block";
    setAdminView("orders");
    loadOrders();
  } else {
    alert("მომხმარებელი ან პაროლი არასწორია ❌");
  }
});

function handleRoute() {
  const isAdmin = window.location.hash === "#admin";
  const whatsappButton = document.querySelector(".whatsapp-float");
  if (whatsappButton) whatsappButton.style.display = isAdmin ? "none" : "flex";

  sectionList.forEach((section) => {
    if (section) section.style.display = isAdmin ? "none" : "";
  });
  if (adminPanel) adminPanel.style.display = "none";
  if (adminBox) {
    adminBox.style.display = isAdmin ? "block" : "none";
    adminBox.classList.toggle("show", isAdmin);
  }
}

handleRoute();
window.addEventListener("hashchange", handleRoute);

document.querySelector("#hero .cta-btn")?.addEventListener("click", () => {
  const target = document.getElementById("services");
  if (!target) return;

  const headerHeight = document.querySelector("header")?.offsetHeight || 0;
  const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
  window.scrollTo({ top, behavior: "smooth" });
});