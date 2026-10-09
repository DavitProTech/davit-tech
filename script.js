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

    const bookedSlots = result.bookedTimes || []; // მაგ: ["2026-10-12 14:00", ...]

    timeSelect.innerHTML = '<option value="">აირჩიეთ სასურველი დრო</option>';

    WORKING_HOURS.forEach((time) => {
      const fullDateTime = `${selectedDate} ${time}`;
      const isBooked = bookedSlots.some(slot => slot.includes(time) || slot === fullDateTime);

      const option = document.createElement("option");
      option.value = time;

      if (isBooked) {
        option.textContent = `${time} - (დაკავებულია ❌)`;
        option.disabled = true;
      } else {
        option.textContent = `${time} - (თავისუფალია ✅)`;
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
const sectionList = [
  document.getElementById("hero"),
  document.getElementById("services"),
  document.getElementById("order")
];

async function loadOrders() {
  const tbody = document.querySelector("#ordersTable tbody");
  if (!tbody) return;

  try {
    const response = await fetch(`${API_URL}/api/orders`);
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to load orders");
    }

    tbody.replaceChildren();
    const orders = result.data || [];
    if (orders.length === 0) {
      const row = tbody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 10;
      cell.textContent = "No orders found";
      return;
    }

    orders.forEach((order) => {
      const row = tbody.insertRow();
      [
        order.id,
        order.service,
        order.name,
        order.phone,
        order.address,
        `${order.price}₾`,
        order.description,
        order.date,
        order.status || '⏳ მუშავდება'
      ].forEach((value) => {
        row.insertCell().textContent = value || "";
      });

      const actionCell = row.insertCell();
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "წაშლა";
      deleteButton.addEventListener("click", () => window.deleteOrder(order.id));
      actionCell.appendChild(deleteButton);
    });
  } catch (error) {
    console.error("Error loading orders:", error);
    tbody.replaceChildren();
    const row = tbody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 10;
    cell.textContent = "Cannot load orders. Server is not running.";
  }
}

window.deleteOrder = async (orderId) => {
  try {
    const response = await fetch(`${API_URL}/api/orders/${encodeURIComponent(orderId)}`, {
      method: "DELETE"
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unknown error");
    }
    await loadOrders();
  } catch (error) {
    console.error("Error deleting order:", error);
    alert("Error deleting order: " + error.message);
  }
};

document.getElementById("refreshOrdersBtn")?.addEventListener("click", loadOrders);

adminLoginForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (passwordInput?.value === "2003" && usernameInput?.value === "admin") {
    if (adminBox) {
      adminBox.classList.remove("show");
      adminBox.style.display = "none";
    }
    if (adminPanel) adminPanel.style.display = "block";
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