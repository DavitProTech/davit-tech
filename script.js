const API_URL = "https://davit-tech-api.onrender.com";
const serviceSelect = document.getElementById("serviceSelect");
const priceDisplay = document.getElementById("priceDisplay");
const orderForm = document.getElementById("orderForm");

function updatePriceDisplay() {
  if (!serviceSelect || !priceDisplay) return;
  const selected = serviceSelect.options[serviceSelect.selectedIndex];
  const price = selected?.getAttribute("data-price");
  priceDisplay.innerText = price ? `ფასი: ${price}₾` : "";
}

serviceSelect?.addEventListener("change", updatePriceDisplay);
updatePriceDisplay();

orderForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = orderForm.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;

  const selectedOption = serviceSelect?.options[serviceSelect.selectedIndex];
  const dateInput = document.getElementById("date")?.value || "";
  const order = {
    name: document.getElementById("customerName")?.value.trim() || "",
    phone: document.getElementById("customerPhone")?.value.trim() || "",
    service: serviceSelect?.value || "",
    price: selectedOption?.getAttribute("data-price") || "",
    address: document.getElementById("address")?.value.trim() || "",
    description: document.getElementById("description")?.value.trim() || "",
    date: dateInput ? dateInput.replace("T", "  ") : ""
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
    updatePriceDisplay();
  } catch (error) {
    console.error("Order submission error:", error);
    alert("სერვერთან დაკავშირების შეცდომა. სცადე თავიდან.");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

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
      cell.colSpan = 9;
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
        order.date
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
    cell.colSpan = 9;
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
