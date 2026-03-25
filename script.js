// ========= PRICE DISPLAY =========
const serviceSelect = document.getElementById("serviceSelect");
const priceDisplay = document.getElementById("priceDisplay");
const API_URL = "https://davit-tech-api.onrender.com";

function updatePriceDisplay() {
  if (!serviceSelect || !priceDisplay) return;
  const selected = serviceSelect.options[serviceSelect.selectedIndex];
  const price = selected ? selected.getAttribute("data-price") : null;
  priceDisplay.innerText = price ? `ფასი: ${price}₾` : "";
}

if (serviceSelect) {
  serviceSelect.addEventListener("change", updatePriceDisplay);
  updatePriceDisplay();
}

// ========= ORDER FORM =========
const orderForm = document.getElementById("orderForm");

if (orderForm) {
  orderForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("customerName")?.value?.trim() || "";
    const phone = document.getElementById("customerPhone")?.value?.trim() || "";
    const service = serviceSelect ? serviceSelect.value : "";
    const price = serviceSelect
      ? serviceSelect.options[serviceSelect.selectedIndex]?.getAttribute("data-price") || ""
      : "";
    const address = document.getElementById("address")?.value?.trim() || "";
    const description = document.getElementById("description")?.value?.trim() || "no description";
    const dateInput = document.getElementById("date")?.value || "";
    const date = dateInput ? dateInput.split("T").join("  ") : "";

    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, service, price, address, description, date })
      });

      const result = await response.json();

      if (result.success) {
        alert("შეკვეთა მიღებულია ✅ Order ID: " + result.data.id);
        orderForm.reset();
        updatePriceDisplay();
      } else {
        alert("შეცდომა: " + (result.message || "დაფიქსირდა გაურკვეველი შეცდომა"));
      }
    } catch (error) {
      console.error("Order submission error:", error);
      alert("სერვერთან დაკავშირების შეცდომა. სცადე თავიდან.");
    }
  });
}

// ========= ADMIN PANEL =========
const adminBox = document.getElementById("adminBox");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminPanel = document.getElementById("adminPanel");
const usernameInput = document.getElementById("adminUsername");
const passwordInput = document.getElementById("adminPassword");
const sectionList = [
  document.getElementById("hero"),
  document.getElementById("services"),
  document.getElementById("order"),
];

function loadOrders() {
  const tbody = document.querySelector("#ordersTable tbody");
  if (!tbody) return;

  fetch(`${API_URL}/api/orders`)
    .then((res) => res.json())
    .then((result) => {
      if (!result.success) {
        console.error("Failed to load orders:", result.message);
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#ff6b6b;">Cannot load orders. Server is not running.</td></tr>`;
        return;
      }

      tbody.innerHTML = "";
      const orders = result.data || [];

      if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">No orders found</td></tr>`;
        return;
      }

      orders.forEach((order) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${order.id || ""}</td>
          <td>${order.service || ""}</td>
          <td>${order.name || ""}</td>
          <td>${order.phone || ""}</td>
          <td>${order.address || ""}</td>
          <td>${order.price || ""}₾</td>
          <td>${order.description || ""}</td>
          <td>${order.date || ""}</td>
          <td><button onclick="deleteOrder('${order.id}')">წაშლა</button></td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch((error) => {
      console.error("Error loading orders:", error);
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#ff6b6b;">Error loading orders</td></tr>`;
    });
}

window.deleteOrder = function (orderId) {
  fetch(`${API_URL}/api/orders/${orderId}`, {
    method: "DELETE"
  })
    .then((res) => res.json())
    .then((result) => {
      if (result.success) {
        loadOrders();
      } else {
        alert("Error deleting order: " + (result.message || "Unknown error"));
      }
    })
    .catch((error) => {
      console.error("Error deleting order:", error);
      alert("Error deleting order");
    });
};

const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");

if (refreshOrdersBtn) {
  refreshOrdersBtn.addEventListener("click", function () {
    loadOrders();
  });
}

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const user = usernameInput ? usernameInput.value : "";
    const password = passwordInput ? passwordInput.value : "";

    if (password === "2003" && user === "admin") {
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
}

// ========= HASH ADMIN ROUTE =========
document.addEventListener("DOMContentLoaded", function () {
  function handleRoute() {
    const isAdmin = window.location.hash === "#admin";

    if (isAdmin) {
      sectionList.forEach((el) => {
        if (el) el.style.display = "none";
      });

      if (adminPanel) adminPanel.style.display = "none";

      if (adminBox) {
        adminBox.style.display = "block";
        adminBox.classList.add("show");
      }
    } else {
      sectionList.forEach((el) => {
        if (el) el.style.display = "";
      });

      if (adminBox) {
        adminBox.classList.remove("show");
        adminBox.style.display = "none";
      }

      if (adminPanel) adminPanel.style.display = "none";
    }
  }

  handleRoute();
  window.addEventListener("hashchange", handleRoute);
});

// ========= HERO CTA SCROLL =========
const heroCta = document.querySelector("#hero .cta-btn");
const header = document.querySelector("header");

if (heroCta) {
  heroCta.addEventListener("click", () => {
    const target = document.getElementById("services");
    if (!target) return;

    const headerHeight = header ? header.offsetHeight : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

    window.scrollTo({ top, behavior: "smooth" });
  });
}