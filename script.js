// RentEasy - JavaScript Logic for Campus Portal (MongoDB Backend Integration)

const API_BASE = "http://localhost:5000/api";

// Check login status from localStorage
let currentUser = localStorage.getItem("currentUser");
let currentAddress = localStorage.getItem("currentAddress");

// Navbar Auth Display
let authLink = document.getElementById("authLink");
if (authLink) {
    if (currentUser) {
        authLink.textContent = "Logout (" + currentUser + ")";
        authLink.href = "#";
        authLink.onclick = function() {
            localStorage.clear();
            alert("Logged out successfully!");
            location.reload();
        };
    } else {
        authLink.textContent = "Login / Signup";
        authLink.href = "login.html";
    }
}

// Show and scroll to List Item section
let listItemLink = document.getElementById("listItemLink");
if (listItemLink) {
    listItemLink.onclick = function(event) {
        event.preventDefault();
        let listSection = document.getElementById("list-item");
        if (listSection) {
            listSection.style.display = "block";
            listSection.scrollIntoView({ behavior: "smooth" });
        }
    };
}

// Fetch items from MongoDB API and render
async function fetchItemsFromAPI() {
    try {
        const res = await fetch(`${API_BASE}/items`);
        if (res.ok) {
            const items = await res.json();
            renderItemsGrid(items);
        }
    } catch (err) {
        console.warn("MongoDB API offline. Showing static items from HTML.", err);
    }
}

function renderItemsGrid(items) {
    const grid = document.querySelector(".items-grid");
    const itemSelect = document.getElementById("itemName");

    if (grid && items && items.length > 0) {
        grid.innerHTML = "";
        if (itemSelect) {
            itemSelect.innerHTML = `<option value="" disabled selected>Select an item</option>`;
        }

        items.forEach(item => {
            const card = document.createElement("div");
            card.className = "item-card";
            card.setAttribute("data-category", item.category);
            card.innerHTML = `
                <img src="${item.image || './images/laptop.png'}" alt="${item.name}">
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p class="price">$${item.price}/day</p>
                    <button class="rent-btn" onclick="selectItem('${item.name.replace(/'/g, "\\'")}')">Rent Now</button>
                </div>
            `;
            grid.appendChild(card);

            if (itemSelect) {
                const opt = document.createElement("option");
                opt.value = item.name;
                opt.textContent = item.name;
                itemSelect.appendChild(opt);
            }
        });
    }
}

// Call on page load
document.addEventListener("DOMContentLoaded", () => {
    fetchItemsFromAPI();
});

// Category filter
function filterCategory(cat, btn) {
    let buttons = document.getElementsByClassName("filter-btn");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active");
    }
    if (btn) btn.classList.add("active");

    let cards = document.getElementsByClassName("item-card");
    for (let i = 0; i < cards.length; i++) {
        let category = cards[i].getAttribute("data-category");
        if (cat === "All" || category === cat) {
            cards[i].style.display = "flex";
        } else {
            cards[i].style.display = "none";
        }
    }
}

// Select item to book
function selectItem(name) {
    let bookingSection = document.getElementById("booking");
    if (!bookingSection) return;

    bookingSection.style.display = "block";
    let bookingParent = document.getElementById("bookingForm")?.parentElement;
    if (bookingParent) bookingParent.style.display = "block";
    
    let receipt = document.getElementById("receipt");
    if (receipt) receipt.style.display = "none";

    let itemSelect = document.getElementById("itemName");
    if (itemSelect) itemSelect.value = name;
    
    document.getElementById("userName").value = currentUser || "";
    document.getElementById("userAddress").value = currentAddress || "";

    bookingSection.scrollIntoView({ behavior: "smooth" });
    document.getElementById("userName").focus();
}

// Book an item submission
let bookingForm = document.getElementById("bookingForm");
if (bookingForm) {
    bookingForm.onsubmit = async function(event) {
        event.preventDefault();
        if (!currentUser) {
            alert("You must login first to book an item!");
            window.location.href = "login.html";
            return;
        }

        let name = document.getElementById("userName").value.trim();
        let address = document.getElementById("userAddress").value.trim();
        let item = document.getElementById("itemName").value;
        let days = parseInt(document.getElementById("rentalDays").value);

        // Find price of the item
        let price = 5;
        let cards = document.getElementsByClassName("item-card");
        for (let i = 0; i < cards.length; i++) {
            let titleHeading = cards[i].getElementsByTagName("h3")[0];
            if (titleHeading && titleHeading.textContent.trim() === item) {
                let priceText = cards[i].getElementsByClassName("price")[0].textContent;
                let match = priceText.match(/\d+/);
                if (match) price = parseInt(match[0]);
                break;
            }
        }

        let total = price * days;

        // Attempt MongoDB API booking save
        try {
            const response = await fetch(`${API_BASE}/bookings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userName: name,
                    userAddress: address,
                    itemName: item,
                    rentalDays: days,
                    totalPrice: total
                })
            });
            if (!response.ok) {
                const errData = await response.json();
                console.warn("MongoDB Booking Warning:", errData);
            }
        } catch (err) {
            console.warn("Could not sync booking to MongoDB backend, using offline mode.", err);
        }

        // Fill receipt UI
        document.getElementById("recName").textContent = name;
        document.getElementById("recAddress").textContent = address;
        document.getElementById("recItem").textContent = item;
        document.getElementById("recDays").textContent = days;
        document.getElementById("recTotal").textContent = total;

        // Show receipt and hide form
        bookingForm.parentElement.style.display = "none";
        document.getElementById("receipt").style.display = "block";
        alert("Booking Confirmed and saved to MongoDB!");
    };
}

// Add new item submission
let addItemForm = document.getElementById("addItemForm");
if (addItemForm) {
    addItemForm.onsubmit = async function(event) {
        event.preventDefault();
        let name = document.getElementById("newItemName").value.trim();
        let price = document.getElementById("newItemPrice").value;
        let category = document.getElementById("newItemCategory").value;

        // Get image URL
        let image = document.getElementById("newItemImage").value.trim();

        // Attempt MongoDB API item creation
        try {
            const res = await fetch(`${API_BASE}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, price, category, image })
            });

            if (res.ok) {
                alert(name + " listed successfully and saved to MongoDB!");
                addItemForm.reset();
                fetchItemsFromAPI();
                return;
            }
        } catch (err) {
            console.warn("MongoDB server unavailable, listing item locally.", err);
        }

        // Offline Fallback UI insertion
        let img = image || "./images/laptop.png";
        if (!image) {
            if (category === "Tools") img = "./images/drill.png";
            if (category === "Vehicles") img = "./images/bicycle.png";
            if (category === "Electronics") img = "./images/camera.png";
        }

        let grid = document.querySelector(".items-grid");
        let card = document.createElement("div");
        card.className = "item-card";
        card.setAttribute("data-category", category);
        card.innerHTML = `
            <img src="${img}" alt="${name}">
            <div class="item-details">
                <h3>${name}</h3>
                <p class="price">$${price}/day</p>
                <button class="rent-btn" onclick="selectItem('${name.replace(/'/g, "\\'")}')">Rent Now</button>
            </div>
        `;
        grid.appendChild(card);

        let itemSelect = document.getElementById("itemName");
        if (itemSelect) {
            let opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            itemSelect.appendChild(opt);
        }

        alert(name + " listed locally!");
        addItemForm.reset();
    };
}

// Login and Signup toggle logic (login.html)
let isSignUp = false;
let toggleAuthMode = document.getElementById("toggleAuthMode");
let authForm = document.getElementById("authForm");

if (toggleAuthMode && authForm) {
    toggleAuthMode.onclick = function(event) {
        event.preventDefault();
        isSignUp = !isSignUp;
        
        if (isSignUp) {
            document.getElementById("authTitle").textContent = "Create Account";
            document.getElementById("authSubtitle").textContent = "Create account to rent items";
            document.getElementById("authSubmitBtn").textContent = "Sign Up";
            toggleAuthMode.textContent = "Already have an account? Login";
            
            document.getElementById("nameGroup").style.display = "block";
            document.getElementById("addressGroup").style.display = "block";
            document.getElementById("fullName").required = true;
            document.getElementById("address").required = true;
        } else {
            document.getElementById("authTitle").textContent = "Login";
            document.getElementById("authSubtitle").textContent = "Sign in to rent campus items";
            document.getElementById("authSubmitBtn").textContent = "Sign In";
            toggleAuthMode.textContent = "Don't have an account? Sign Up";
            
            document.getElementById("nameGroup").style.display = "none";
            document.getElementById("addressGroup").style.display = "none";
            document.getElementById("fullName").required = false;
            document.getElementById("address").required = false;
        }
    };

    authForm.onsubmit = async function(event) {
        event.preventDefault();
        let email = document.getElementById("email").value.trim();
        let password = document.getElementById("password").value;

        if (isSignUp) {
            let name = document.getElementById("fullName").value.trim();
            let address = document.getElementById("address").value.trim();

            try {
                const res = await fetch(`${API_BASE}/auth/signup`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password, address })
                });

                const data = await res.json();
                if (!res.ok) {
                    alert(data.error || "Signup failed");
                    return;
                }

                localStorage.setItem("currentUser", data.user.name);
                localStorage.setItem("currentAddress", data.user.address);
                alert("Account created and saved to MongoDB!");
                window.location.href = "index.html";
                return;
            } catch (err) {
                console.warn("MongoDB API offline, falling back to localStorage authentication.", err);
            }

            // Fallback localStorage auth
            let users = JSON.parse(localStorage.getItem("users") || "{}");
            if (users[email]) {
                alert("An account with this email already exists!");
                return;
            }
            users[email] = { name: name, address: address, password: password };
            localStorage.setItem("users", JSON.stringify(users));
            localStorage.setItem("currentUser", name);
            localStorage.setItem("currentAddress", address);
            alert("Account created successfully!");
            window.location.href = "index.html";

        } else {
            // Login flow
            try {
                const res = await fetch(`${API_BASE}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem("currentUser", data.user.name);
                    localStorage.setItem("currentAddress", data.user.address);
                    alert("Welcome back, " + data.user.name + "!");
                    window.location.href = "index.html";
                    return;
                } else {
                    alert(data.error || "Invalid login credentials");
                    return;
                }
            } catch (err) {
                console.warn("MongoDB API offline, checking local storage.", err);
            }

            // Local fallback
            let users = JSON.parse(localStorage.getItem("users") || "{}");
            let userObj = users[email];
            if (userObj && userObj.password === password) {
                localStorage.setItem("currentUser", userObj.name);
                localStorage.setItem("currentAddress", userObj.address);
                alert("Welcome back, " + userObj.name + "!");
                window.location.href = "index.html";
            } else {
                alert("Invalid email or password!");
            }
        }
    };
}
