// ========= PRICE DISPLAY =========
const serviceSelect = document.getElementById("serviceSelect");
const priceDisplay = document.getElementById("priceDisplay");

function updatePriceDisplay() {
  if (!serviceSelect || !priceDisplay) return;
  const selected = serviceSelect.options[serviceSelect.selectedIndex];
  const price = selected ? selected.getAttribute("data-price") : null;
  priceDisplay.innerText = price ? `ფასი: ${price}₾` : "";
}

if (serviceSelect) serviceSelect.addEventListener("change", updatePriceDisplay);

// ========= ORDER FORM =========
const orderForm = document.getElementById("orderForm");
const API_URL = "http://localhost:3000";

if (orderForm) {
  orderForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("customerName").value;
    const phone = document.getElementById("customerPhone").value;
    const service = serviceSelect ? serviceSelect.value : "";
    const price = serviceSelect
      ? serviceSelect.options[serviceSelect.selectedIndex].getAttribute("data-price")
      : "";
    const address = document.getElementById("address").value;
    const description = document.getElementById("description").value;
    const date = document.getElementById("date").value.split("T").join("  ");

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
        alert("შეცდომა: " + (result.message || "დაფიქსირდა გაურკეველი შეცდომა"));
      }
    } catch (error) {
      console.error("Order submission error:", error);
      alert("სერვერთან დაკავშირების შეცდომა. ჯერ არის აკტიური?");
    }
  });
}

// ========= ADMIN PANEL =========
const adminBox = document.getElementById("adminBox"); // modal container
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
    .then(res => res.json())
    .then(result => {
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
    .catch(error => {
      console.error("Error loading orders:", error);
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#ff6b6b;">Error loading orders</td></tr>`;
    });
}

// IMPORTANT: deleteOrder must be global (because onclick is in HTML string)
window.deleteOrder = function (orderId) {
  fetch(`${API_URL}/api/orders/${orderId}`, {
    method: "DELETE"
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        loadOrders();
      } else {
        alert("Error deleting order: " + (result.message || "Unknown error"));
      }
    })
    .catch(error => {
      console.error("Error deleting order:", error);
      alert("Error deleting order");
    });
};

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const user = usernameInput ? usernameInput.value : "";
    const password = passwordInput ? passwordInput.value : "";

    if (password === "2003" && user === "admin") {
      // hide login box
      if (adminBox) {
        adminBox.classList.remove("show");
        adminBox.style.display = "none";
      }

      // show admin panel
      if (adminPanel) adminPanel.style.display = "block";
      loadOrders();
    } else {
      alert("მომხმარებელი ან პაროლი არასწორია ❌");
    }
  });
}

// ========= HASH ADMIN ROUTE (FIXED) =========
document.addEventListener("DOMContentLoaded", function () {
  function handleRoute() {
    const isAdmin = window.location.hash === "#admin";

    if (isAdmin) {
      // hide public sections
      sectionList.forEach((el) => { if (el) el.style.display = "none"; });

      // ensure admin panel is hidden until login
      if (adminPanel) adminPanel.style.display = "none";

      // ✅ show admin login modal (IMPORTANT: add .show)
      if (adminBox) {
        adminBox.style.display = "block";
        adminBox.classList.add("show");
      }
    } else {
      // show public sections back
      sectionList.forEach((el) => { if (el) el.style.display = ""; });

      // hide admin UI
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