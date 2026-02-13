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
if (orderForm) {
  orderForm.addEventListener("submit", function (e) {
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

    const orderID = "DT-" + Math.floor(Math.random() * 100000);
    const order = { id: orderID, name, phone, service, price, address, description, date };

    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));

    alert("შეკვეთა მიღებულია ✅ Order ID: " + orderID);

    orderForm.reset();
    updatePriceDisplay();
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
  document.getElementById("order")
];

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const user = usernameInput ? usernameInput.value : "";
    const password = passwordInput ? passwordInput.value : "";

    if (password === "2003" && user === "admin") {
      sectionList.forEach((el) => { if (el) el.style.display = "none"; });
      if (adminBox) adminBox.style.display = "none";
      if (adminPanel) adminPanel.style.display = "block";
      loadOrders();
    } else {
      alert("მომხმარებელი ან პაროლი არასწორია ❌");
    }
  });
}

function loadOrders() {
  let orders = JSON.parse(localStorage.getItem("orders")) || [];
  let tbody = document.querySelector("#ordersTable tbody");
  tbody.innerHTML = "";

  orders.forEach((order, index) => {
    let row = document.createElement("tr");
    row.innerHTML = `
<td>${order.id}</td>
<td>${order.service}</td>
<td>${order.name}</td>
<td>${order.phone}</td>
<td>${order.address}</td>
<td>${order.price}₾</td>
<td>${order.description}</td>
<td>${order.date}</td>
<td><button onclick="deleteOrder(${index})">წაშლა</button></td>
`;
    tbody.appendChild(row);
  });
}

function deleteOrder(index) {
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  orders.splice(index, 1);
  localStorage.setItem("orders", JSON.stringify(orders));
  loadOrders();
}

// Admin Box Toggle
const adminToggle = document.getElementById("adminToggle");
if (adminToggle && adminBox) {
  adminToggle.addEventListener("click", () => {
    const isHidden = adminBox.style.display === "none" || adminBox.style.display === "";
    adminBox.style.display = isHidden ? "block" : "none";
    adminBox.classList.toggle("show");
  });
}

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

