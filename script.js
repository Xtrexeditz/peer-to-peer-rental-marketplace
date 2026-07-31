const isLocal = window.location.hostname === "localhost" || 
                window.location.hostname === "127.0.0.1" || 
                window.location.hostname.startsWith("192.168.") || 
                window.location.hostname.startsWith("10.") || 
                window.location.hostname.startsWith("172.") ||
                window.location.protocol === "file:";

const API_BASE = isLocal
    ? (window.location.port === "5000" ? "" : (window.location.protocol === "file:" ? "http://localhost:5000" : `http://${window.location.hostname}:5000`))
    : "";

const currentUser = localStorage.getItem("currentUser");
const currentAddress = localStorage.getItem("currentAddress");

// Common Navbar Setup
const authLink = document.getElementById("authLink");
if (authLink) {
    if (currentUser) {
        const parentLi = authLink.parentElement;
        parentLi.className = "profile-container";
        const initials = currentUser.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
        parentLi.innerHTML = `
            <button class="profile-icon-btn" id="profileIconBtn" title="${currentUser}">${initials}</button>
            <div class="profile-dropdown" id="profileDropdown">
                <div class="dropdown-header">
                    <span class="dropdown-name">${currentUser}</span>
                    <span class="dropdown-address">${currentAddress || 'No Address'}</span>
                </div>
                <hr class="dropdown-divider">
                <a href="bookings.html" class="dropdown-item">Booking History</a>
                <a href="#" class="dropdown-item" id="logoutBtn">Logout</a>
            </div>
        `;
        const dropdown = document.getElementById("profileDropdown");
        document.getElementById("profileIconBtn").onclick = (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("show");
        };
        document.getElementById("logoutBtn").onclick = (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = "index.html";
        };
        window.addEventListener("click", (e) => {
            if (!parentLi.contains(e.target)) dropdown.classList.remove("show");
        });
    } else {
        authLink.textContent = "Login / Signup";
        authLink.href = "login.html";
    }
}

// 1. GALLERY & DETAILS MODAL (index.html)
let allItemsList = [];
const grid = document.querySelector(".items-grid");
if (grid) {
    (async () => {
        try {
            const res = await fetch(`${API_BASE}/api/items`);
            allItemsList = res.ok ? await res.json() : [];
            grid.innerHTML = allItemsList.map(item => {
                const img = item.image || (item.category === "Tools" ? "./images/drill.png" : item.category === "Vehicles" ? "./images/bicycle.png" : item.category === "Electronics" ? "./images/camera.png" : "./images/laptop.png");
                const safeName = item.name.replace(/"/g, '&quot;');
                return `
                <div class="item-card" data-category="${item.category}">
                    <img src="${img}" alt="${item.name}">
                    <div class="item-details">
                        <h3>${item.name}</h3>
                        <p class="price">$${item.price}/day</p>
                        <div class="item-actions-group">
                            <button class="details-btn" onclick="openDetailsModal('${item._id}')">Details</button>
                            <button class="rent-btn" data-item-name="${safeName}" onclick="selectItem(this.dataset.itemName)">Rent Now</button>
                        </div>
                    </div>
                </div>`;
            }).join("") || `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No items available.</p>`;
        } catch (error) {
            console.error("Fetch items error:", error);
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Error connecting to server. Please ensure the backend is running.</p>`;
        }
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
        try {
            const res = await fetch(`${API_BASE}${isSignUp ? "/api/auth/signup" : "/api/auth/login"}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem("currentUser", data.user.name);
                localStorage.setItem("currentAddress", data.user.address);
                localStorage.setItem("currentEmail", data.user.email);
                alert(isSignUp ? "Account created!" : `Welcome, ${data.user.name}!`);
                window.location.href = "index.html";
            } else {
                let errorMsg = "Authentication failed!";
                try {
                    const data = await res.json();
                    if (data && data.error) errorMsg = data.error;
                } catch (jsonErr) {}
                alert(errorMsg);
            }
        } catch (error) {
            console.error("Authentication error:", error);
            alert("Network error: Could not connect to the backend server. Please make sure the server is running on port 5000.");
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
        try {
            const res = await fetch(`${API_BASE}/api/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, price, category, image, description, location, phone, owner: currentUser })
            });
            if (res.ok) {
                alert(`${name} listed successfully!`);
                window.location.href = "index.html#items";
            } else {
                let errorMsg = "Failed to list item!";
                try {
                    const data = await res.json();
                    if (data && data.error) errorMsg = data.error;
                } catch (jsonErr) {}
                alert(errorMsg);
            }
        } catch (error) {
            console.error("List item error:", error);
            alert("Network error: Could not connect to the backend server. Please make sure the server is running on port 5000.");
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
        try {
            const res = await fetch(`${API_BASE}/api/items`);
            itemsList = res.ok ? await res.json() : [];
            select.innerHTML = '<option value="" disabled selected>Select an item</option>';
            itemsList.forEach(item => {
                const optText = `${item.name} ($${item.price}/day)${!item.available ? ' - Rented' : ''}`;
                const option = new Option(optText, item.name);
                if (!item.available) option.disabled = true;
                select.add(option);
            });
            
            const preselectedItem = new URLSearchParams(window.location.search).get("item");
            if (preselectedItem) { select.value = preselectedItem; updateCost(); }
        } catch (error) {
            console.error("Load items for booking error:", error);
            select.innerHTML = '<option value="" disabled selected>Error loading items from server</option>';
        }
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

        try {
            const res = await fetch(`${API_BASE}/api/bookings`, {
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
                let errorMsg = "Booking failed!";
                try {
                    const data = await res.json();
                    if (data && data.error) errorMsg = data.error;
                } catch (jsonErr) {}
                alert(errorMsg);
            }
        } catch (error) {
            console.error("Booking error:", error);
            alert("Network error: Could not connect to the backend server. Please make sure the server is running on port 5000.");
        }
    };
}

// 5. BOOKINGS HISTORY (bookings.html)
const bookingsContainer = document.getElementById("bookingsList");
if (bookingsContainer) {
    if (!currentUser) {
        alert("Please log in first!");
        window.location.href = "login.html";
    } else {
        const el = id => document.getElementById(id);
        if (el("profileNameLarge")) {
            el("profileAvatarLarge").textContent = currentUser.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
            el("profileNameLarge").textContent = currentUser;
            el("profileEmailLarge").textContent = localStorage.getItem("currentEmail") || `${currentUser.replace(/\s+/g, "").toLowerCase()}@college.edu`;
            el("profileAddressLarge").textContent = currentAddress || 'No Address Listed';
        }

        let activeTab = "rentals";

        window.switchTab = (tab) => {
            activeTab = tab;
            document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
            if (tab === "rentals") {
                el("tabRentals").classList.add("active");
            } else {
                el("tabReceived").classList.add("active");
            }
            loadBookings();
        };

        const loadBookings = async () => {
            try {
                // Update titles based on active tab
                const statCards = document.querySelectorAll(".bookings-stats .stat-card");
                const statTotalTitle = statCards[0].querySelector("h3");
                const statActiveTitle = statCards[1].querySelector("h3");
                const statMoneyTitle = statCards[2].querySelector("h3");

                let url = "";
                if (activeTab === "rentals") {
                    url = `${API_BASE}/api/bookings?userName=${encodeURIComponent(currentUser)}`;
                    statTotalTitle.textContent = "Total Bookings";
                    statActiveTitle.textContent = "Active Rentals";
                    statMoneyTitle.textContent = "Total Spent";
                } else {
                    url = `${API_BASE}/api/bookings?ownerName=${encodeURIComponent(currentUser)}`;
                    statTotalTitle.textContent = "Bookings Received";
                    statActiveTitle.textContent = "Approved Rentals";
                    statMoneyTitle.textContent = "Estimated Earnings";
                }

                const res = await fetch(url);
                const bookings = res.ok ? await res.json() : [];
                const confirmed = bookings.filter(b => b.status === "Confirmed");
                
                el("statTotalBookings").textContent = bookings.length;
                el("statActiveRentals").textContent = confirmed.length;
                el("statTotalSpent").textContent = `$${confirmed.reduce((sum, b) => sum + b.totalPrice, 0)}`;
                
                bookingsContainer.innerHTML = bookings.map(b => {
                    const statusClass = (b.status || 'Pending').toLowerCase();
                    const statusText = b.status || 'Pending';
                    const showCancelForRenter = activeTab === "rentals" && (b.status === "Confirmed" || b.status === "Pending");
                    const showActionsForOwner = activeTab === "received" && b.status === "Pending";
                    const showCancelForOwner = activeTab === "received" && b.status === "Confirmed";
                    
                    return `
                    <div class="booking-card">
                        <div class="booking-card-header">
                            <div>
                                <h3>${b.itemName}</h3>
                                <p class="booking-date">
                                    ${activeTab === "rentals" ? 'Owned by: ' + (b.ownerName || 'Lender') : 'Rented by: ' + b.userName} | 
                                    Booked on ${b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "Recently"}
                                </p>
                            </div>
                            <span class="status-badge ${statusClass}">${statusText}</span>
                        </div>
                        <div class="booking-card-details">
                            <div class="detail-row"><span>Duration</span><strong>${b.rentalDays} Days</strong></div>
                            <div class="detail-row"><span>${activeTab === "rentals" ? "Total Paid" : "Earnings"}</span><strong class="booking-total">$${b.totalPrice}</strong></div>
                            <div class="detail-row"><span>${activeTab === "rentals" ? "Lender Contact" : "Renter Contact"}</span><strong>${b.userPhone}</strong></div>
                            <div class="detail-row"><span>Delivery Address</span><strong>${b.userAddress}</strong></div>
                        </div>
                        
                        ${showCancelForRenter ? `<button class="cancel-booking-btn" onclick="updateBookingStatus('${b._id}', 'Cancelled')">Cancel Booking</button>` : ''}
                        
                        ${showActionsForOwner ? `
                        <div class="booking-card-actions">
                            <button class="accept-booking-btn" onclick="updateBookingStatus('${b._id}', 'Confirmed')">Accept Booking</button>
                            <button class="decline-booking-btn" onclick="updateBookingStatus('${b._id}', 'Cancelled')">Decline Booking</button>
                        </div>
                        ` : ''}

                        ${showCancelForOwner ? `
                        <div class="booking-card-actions">
                            <button class="decline-booking-btn" onclick="updateBookingStatus('${b._id}', 'Cancelled')">Decline Booking</button>
                        </div>
                        ` : ''}
                    </div>
                `;
                }).join("") || `
                    <div class="empty-state">
                        <svg class="empty-icon" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        <h3>No Bookings Found</h3>
                        <p>${activeTab === "rentals" ? "You haven't rented any items yet." : "No one has booked your items yet."}</p>
                        ${activeTab === "rentals" ? `<a href="index.html#items" class="cta-btn" style="margin-top: 15px; display: inline-block;">Browse Items</a>` : ''}
                    </div>
                `;
            } catch (e) {
                console.error(e);
                bookingsContainer.innerHTML = `<p style="text-align: center; color: red;">Error connecting to server.</p>`;
            }
        };

        window.updateBookingStatus = async (id, status) => {
            const confirmMsg = status === "Confirmed" ? "Are you sure you want to accept this booking?" : "Are you sure you want to cancel/decline this booking?";
            if (confirm(confirmMsg)) {
                try {
                    const res = await fetch(`${API_BASE}/api/bookings/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status })
                    });
                    if (res.ok) { 
                        alert(status === "Confirmed" ? "Booking accepted!" : "Booking cancelled/declined!"); 
                        loadBookings(); 
                    } else {
                        alert("Failed to update booking.");
                    }
                } catch (err) { 
                    alert("Network error."); 
                }
            }
        };

        loadBookings();
    }
}
