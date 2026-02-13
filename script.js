// ========= PRICE DISPLAY =========
const serviceSelect = document.getElementById("serviceSelect");
const priceDisplay = document.getElementById("priceDisplay");

if (serviceSelect) {
  serviceSelect.addEventListener("change", function () {
    let selected = serviceSelect.options[serviceSelect.selectedIndex];
    let price = selected.getAttribute("data-price");
    if (price) {
      priceDisplay.innerText = "ფასი: " + price + "₾";
    }
  });
}

// ========= ORDER FORM =========
const form = document.getElementById("orderForm");
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    let name = document.getElementById("customerName").value;
    let phone = document.getElementById("customerPhone").value;
    let service = serviceSelect.value;
    let price =
      serviceSelect.options[serviceSelect.selectedIndex].getAttribute(
        "data-price",
      );
    let address = document.getElementById("address").value;
    let description = document.getElementById("description").value;
    let date = document.getElementById("date").value.split("T").join('  ');

    let orderID = "DT-" + Math.floor(Math.random() * 100000);

    let order = { id: orderID, name, phone, service, price, address, description, date };

    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));

    alert("შეკვეთა მიღებულია ✅ Order ID: " + orderID);

    form.reset();
    priceDisplay.innerText = "";
  });
}

// ========= ADMIN PANEL =========
const adminForm = document.getElementById("adminBox");
const adminPanel = document.getElementById("adminPanel");
const usernameInput = document.getElementById("adminUsername");
const passwordInput = document.getElementById("adminPassword");
const sectionList = [
  document.getElementById("hero"),
  document.getElementById("services"),
  document.getElementById("order")
]

if (adminForm) {
  adminForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const user = usernameInput.value;
    const password = passwordInput.value;

    if (password === "2003" && user === "admin") {
      sectionList.forEach((element) => {
        element.style.display = "none";
      })
      adminForm.style.display = "none";
      adminPanel.style.display = "block";
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
  let orders = JSON.parse(localStorage.getItem("orders")) || [];
  orders.splice(index, 1);
  localStorage.setItem("orders", JSON.stringify(orders));
  loadOrders();
}

// Admin Box Toggle
const adminToggle = document.getElementById("adminToggle");
const adminBox = document.getElementById("adminBox");

adminToggle.addEventListener("click", () => {
  if (adminBox.style.display === "none" || adminBox.style.display === "") {
    adminBox.style.display = "block";
  } else {
    adminBox.style.display = "none";
  }
});

adminToggle.addEventListener("click", () => {
  adminBox.classList.toggle("show");
});

// ========= HERO CTA SCROLL =========
const heroCta = document.querySelector("#hero .cta-btn");
const header = document.querySelector("header");
if (heroCta) {
  heroCta.addEventListener("click", (e) => {
    const target = document.getElementById("services");
    if (!target) return;
    const headerHeight = header ? header.offsetHeight : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
    window.scrollTo({ top, behavior: "smooth" });
  });
}

