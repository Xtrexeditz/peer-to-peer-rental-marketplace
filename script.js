const currentUser = localStorage.getItem("currentUser");
const currentAddress = localStorage.getItem("currentAddress");

// Common Navbar Setup
const authLink = document.getElementById("authLink");
if (authLink) {
    authLink.textContent = currentUser ? `Logout (${currentUser})` : "Login / Signup";
    authLink.href = currentUser ? "#" : "login.html";
    if (currentUser) {
        authLink.onclick = () => { localStorage.clear(); location.reload(); };
    }
}

// 1. GALLERY & DETAILS MODAL (index.html)
let allItemsList = [];
const grid = document.querySelector(".items-grid");
if (grid) {
    (async () => {
        const res = await fetch("/api/items");
        allItemsList = res.ok ? await res.json() : [];
        grid.innerHTML = allItemsList.map(item => {
            const img = item.image || (item.category === "Tools" ? "./images/drill.png" : item.category === "Vehicles" ? "./images/bicycle.png" : item.category === "Electronics" ? "./images/camera.png" : "./images/laptop.png");
            return `
            <div class="item-card" data-category="${item.category}">
                <img src="${img}" alt="${item.name}">
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p class="price">$${item.price}/day</p>
                    <div class="item-actions-group">
                        <button class="details-btn" onclick="openDetailsModal('${item._id}')">Details</button>
                        <button class="rent-btn" onclick="selectItem('${item.name.replace(/'/g, "\\'")}')">Rent Now</button>
                    </div>
                </div>
            </div>`;
        }).join("") || `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No items available.</p>`;
    })();
}

window.selectItem = (name) => {
    window.location.href = `book.html?item=${encodeURIComponent(name)}`;
};

window.filterCategory = (cat, btn) => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn?.classList.add("active");
    document.querySelectorAll(".item-card").forEach(card => {
        card.style.display = (cat === "All" || card.dataset.category === cat) ? "flex" : "none";
    });
};

window.openDetailsModal = (id) => {
    const item = allItemsList.find(i => i._id === id);
    if (!item) return;
    
    document.getElementById("modalItemImage").src = item.image || (item.category === "Tools" ? "./images/drill.png" : item.category === "Vehicles" ? "./images/bicycle.png" : item.category === "Electronics" ? "./images/camera.png" : "./images/laptop.png");
    document.getElementById("modalItemName").textContent = item.name;
    document.getElementById("modalItemPrice").textContent = item.price;
    document.getElementById("modalItemCategory").textContent = item.category;
    document.getElementById("modalItemOwner").textContent = item.owner || "Campus Lender";
    document.getElementById("modalItemLocation").textContent = item.location || "Campus";
    document.getElementById("modalItemPhone").textContent = item.phone || "N/A";
    document.getElementById("modalItemDate").textContent = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recently";
    document.getElementById("modalItemDescription").textContent = item.description || "No description.";
    
    const badge = document.getElementById("modalItemStatus");
    if (badge) {
        badge.textContent = item.available ? "Available" : "Rented";
        badge.className = `status-badge ${item.available ? "available" : "rented"}`;
    }
    document.getElementById("modalRentBtn").onclick = () => selectItem(item.name);
    document.getElementById("detailsModal").style.display = "flex";
};

window.closeDetailsModal = () => {
    document.getElementById("detailsModal").style.display = "none";
};

// Close modal if user clicks outside of card
window.onclick = (e) => {
    const modal = document.getElementById("detailsModal");
    if (e.target === modal) modal.style.display = "none";
};

// 2. AUTHENTICATION (login.html)
const authForm = document.getElementById("authForm");
if (authForm) {
    let isSignUp = false;
    const toggle = document.getElementById("toggleAuthMode");
    toggle.onclick = (e) => {
        e.preventDefault();
        isSignUp = !isSignUp;
        document.getElementById("authTitle").textContent = isSignUp ? "Create Account" : "Login";
        document.getElementById("authSubtitle").textContent = isSignUp ? "Create account to rent items" : "Sign in to rent campus items";
        document.getElementById("authSubmitBtn").textContent = isSignUp ? "Sign Up" : "Sign In";
        toggle.textContent = isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up";
        document.getElementById("nameGroup").style.display = isSignUp ? "block" : "none";
        document.getElementById("addressGroup").style.display = isSignUp ? "block" : "none";
        document.getElementById("fullName").required = isSignUp;
        document.getElementById("address").required = isSignUp;
    };

    authForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const payload = { email, password };
        if (isSignUp) {
            payload.name = document.getElementById("fullName").value.trim();
            payload.address = document.getElementById("address").value.trim();
        }
        const res = await fetch(isSignUp ? "/api/auth/signup" : "/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem("currentUser", data.user.name);
            localStorage.setItem("currentAddress", data.user.address);
            alert(isSignUp ? "Account created!" : `Welcome, ${data.user.name}!`);
            window.location.href = "index.html";
        } else {
            alert("Authentication failed!");
        }
    };
}

// 3. LIST NEW ITEM (list-item.html)
const addItemForm = document.getElementById("addItemForm");
if (addItemForm) {
    if (!currentUser) { alert("Please log in first!"); window.location.href = "login.html"; }
    addItemForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById("newItemName").value.trim();
        const price = document.getElementById("newItemPrice").value;
        const category = document.getElementById("newItemCategory").value;
        const description = document.getElementById("newItemDescription").value.trim();
        const location = document.getElementById("newItemLocation").value.trim();
        const phone = document.getElementById("newItemPhone").value.trim();
        const fileInput = document.getElementById("newItemImage");
        
        let image = "";
        if (fileInput?.files?.[0]) {
            const file = fileInput.files[0];
            image = await new Promise(r => {
                const reader = new FileReader();
                reader.onload = () => r(reader.result);
                reader.readAsDataURL(file);
            });
        }
        const res = await fetch("/api/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, price, category, image, description, location, phone, owner: currentUser })
        });
        if (res.ok) {
            alert(`${name} listed successfully!`);
            window.location.href = "index.html#items";
        } else {
            alert("Failed to list item!");
        }
    };
}

// 4. BOOK ITEM (book.html)
const bookingForm = document.getElementById("bookingForm");
if (bookingForm) {
    if (currentUser) document.getElementById("userName").value = currentUser;
    if (currentAddress) document.getElementById("userAddress").value = currentAddress;
    
    let itemsList = [];
    const select = document.getElementById("itemName");
    
    (async () => {
        const res = await fetch("/api/items");
        itemsList = res.ok ? await res.json() : [];
        select.innerHTML = '<option value="" disabled selected>Select an item</option>';
        itemsList.forEach(item => select.add(new Option(`${item.name} ($${item.price}/day)`, item.name)));
        
        const preselectedItem = new URLSearchParams(window.location.search).get("item");
        if (preselectedItem) { select.value = preselectedItem; updateCost(); }
    })();

    const updateCost = () => {
        const item = itemsList.find(i => i.name === select.value);
        const days = parseInt(document.getElementById("rentalDays").value) || 0;
        const calc = document.getElementById("costCalculator");
        if (item && days > 0) {
            document.getElementById("estimatedCost").textContent = item.price * days;
            calc.style.display = "block";
        } else {
            calc.style.display = "none";
        }
    };
    select.onchange = updateCost;
    document.getElementById("rentalDays").oninput = updateCost;

    bookingForm.onsubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return alert("Log in first!");
        const name = document.getElementById("userName").value.trim();
        const address = document.getElementById("userAddress").value.trim();
        const phone = document.getElementById("userPhone").value.trim();
        const itemName = select.value;
        const days = parseInt(document.getElementById("rentalDays").value);
        const item = itemsList.find(i => i.name === itemName);
        const total = (item ? item.price : 5) * days;

        const res = await fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userName: name, userAddress: address, userPhone: phone, itemName, rentalDays: days, totalPrice: total })
        });
        if (res.ok) {
            document.getElementById("bookingFormContainer").style.display = "none";
            document.getElementById("receipt").style.display = "block";
            document.getElementById("recName").textContent = name;
            document.getElementById("recAddress").textContent = address;
            document.getElementById("recPhone").textContent = phone;
            document.getElementById("recItem").textContent = itemName;
            document.getElementById("recDays").textContent = days;
            document.getElementById("recTotal").textContent = total;
            alert("Booking Confirmed!");
        } else {
            alert("Failed!");
        }
    };
}
