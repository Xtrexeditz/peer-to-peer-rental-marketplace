// RentEasy - JavaScript Logic for Campus Portal

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
    bookingSection.style.display = "block";
    document.getElementById("bookingForm").parentElement.style.display = "block";
    document.getElementById("receipt").style.display = "none";

    document.getElementById("itemName").value = name;
    document.getElementById("userName").value = currentUser || "";
    document.getElementById("userAddress").value = currentAddress || "";

    bookingSection.scrollIntoView({ behavior: "smooth" });
    document.getElementById("userName").focus();
}

// Book an item submission
let bookingForm = document.getElementById("bookingForm");
if (bookingForm) {
    bookingForm.onsubmit = function(event) {
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
            let title = cards[i].getElementsByTagName("h3")[0].textContent.trim();
            if (title === item) {
                let priceText = cards[i].getElementsByClassName("price")[0].textContent;
                let match = priceText.match(/\d+/);
                if (match) price = parseInt(match[0]);
                break;
            }
        }

        let total = price * days;

        // Fill receipt
        document.getElementById("recName").textContent = name;
        document.getElementById("recAddress").textContent = address;
        document.getElementById("recItem").textContent = item;
        document.getElementById("recDays").textContent = days;
        document.getElementById("recTotal").textContent = total;

        // Show receipt and hide form
        bookingForm.parentElement.style.display = "none";
        document.getElementById("receipt").style.display = "block";
        alert("Booking Confirmed!");
    };
}

// Add new item submission
let addItemForm = document.getElementById("addItemForm");
if (addItemForm) {
    addItemForm.onsubmit = function(event) {
        event.preventDefault();
        let name = document.getElementById("newItemName").value.trim();
        let price = document.getElementById("newItemPrice").value;
        let category = document.getElementById("newItemCategory").value;

        // Choose image
        let img = "./images/laptop.png";
        if (category === "Tools") img = "./images/drill.png";
        if (category === "Vehicles") img = "./images/bicycle.png";
        if (category === "Electronics") img = "./images/camera.png";

        // Create card html and append
        let grid = document.querySelector(".items-grid");
        let card = document.createElement("div");
        card.className = "item-card";
        card.setAttribute("data-category", category);
        card.innerHTML = `
            <img src="${img}" alt="${name}">
            <div class="item-details">
                <h3>${name}</h3>
                <p class="price">$${price}/day</p>
                <button class="rent-btn" onclick="selectItem('${name}')">Rent Now</button>
            </div>
        `;
        grid.appendChild(card);

        // Add option to select list
        let itemSelect = document.getElementById("itemName");
        if (itemSelect) {
            let opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            itemSelect.appendChild(opt);
        }

        alert(name + " listed successfully!");
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

    authForm.onsubmit = function(event) {
        event.preventDefault();
        let email = document.getElementById("email").value.trim();
        let password = document.getElementById("password").value;
        let users = JSON.parse(localStorage.getItem("users") || "{}");

        if (isSignUp) {
            let name = document.getElementById("fullName").value.trim();
            let address = document.getElementById("address").value.trim();

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
