

document.addEventListener('DOMContentLoaded', function () {
    // Page Navigation
    const loginPage = document.getElementById('login-page');
    const registerPage = document.getElementById('register-page');
    const dashboardContainer = document.getElementById('dashboard-container');
    const dashboardPage = document.getElementById('dashboard-page');
    const reportLostPage = document.getElementById('report-lost-page');
    const reportFoundPage = document.getElementById('report-found-page');
    const searchItemsPage = document.getElementById('search-items-page');
    const profilePage = document.getElementById('profile-page');
    const adminPanelPage = document.getElementById('admin-panel-page');

    // Sidebar elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const adminItem = document.querySelector('.admin-item');

    // Auth elements
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn');

    // Form elements
    const lostItemImage = document.getElementById('lostItemImage');
    const lostImagePreview = document.getElementById('lostImagePreview');
    const foundItemImage = document.getElementById('foundItemImage');
    const foundImagePreview = document.getElementById('foundImagePreview');
    const cancelLostReport = document.getElementById('cancel-lost-report');
    const cancelFoundReport = document.getElementById('cancel-found-report');

    // Search elements
    const searchButton = document.getElementById('searchButton');
    const resetFilters = document.getElementById('resetFilters');


    // Show admin panel if user is admin


    function loadUserProfile() {

        const user = JSON.parse(localStorage.getItem("user"));

        if (!user) return;

        // Top Bar
        document.querySelector(".user-info .fw-bold").innerText =
            user.firstname + " " + user.lastname;

        document.querySelector(".user-info .small").innerText =
            user.email;

        // Avatar (Top Bar)
        document.querySelector(".user-avatar").innerText =
            user.firstname.charAt(0).toUpperCase() +
            user.lastname.charAt(0).toUpperCase();

        // Profile Page
        document.getElementById("profile-avatar").innerText =
            user.firstname.charAt(0).toUpperCase() +
            user.lastname.charAt(0).toUpperCase();

        document.getElementById("profile-name").innerText =
            user.firstname + " " + user.lastname;

        document.getElementById("profile-email").innerText =
            user.email;

        // Form

        document.getElementById("profile-firstname").value =
            user.firstname;

        document.getElementById("profile-lastname").value =
            user.lastname;

        document.getElementById("profile-email-input").value =
            user.email;

        document.getElementById("profile-phone").value =
            user.phone;

        document.getElementById("profile-studentid").value =
            user.studentid;

        document.getElementById("profile-department").value =
            user.department;
    }
    // Page Navigation Functions
    function showPage(pageElement) {

        // Hide all pages
        loginPage.classList.add('hidden');
        registerPage.classList.add('hidden');
        dashboardContainer.classList.add('hidden');

        // Show requested page
        pageElement.classList.remove('hidden');

        // Close mobile menu if open
        sidebar.classList.remove('active');
    }

    function showDashboardPage(pageElement, clickedLink) {
        // Hide all dashboard subpages
        dashboardPage.classList.add('hidden');
        reportLostPage.classList.add('hidden');
        reportFoundPage.classList.add('hidden');
        searchItemsPage.classList.add('hidden');
        profilePage.classList.add('hidden');
        adminPanelPage.classList.add('hidden');


        // Show requested dashboard subpage
        pageElement.classList.remove('hidden');

        // Update sidebar active link
        sidebarLinks.forEach(link => link.classList.remove('active'));
        if (clickedLink) {
            clickedLink.classList.add('active');
        }
        loadTotalFoundItems();
    }

    // Event Listeners for Navigation
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(registerPage);
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(loginPage);
    });

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();

        localStorage.removeItem("user"); // IMPORTANT

        showPage(loginPage);
    });

    // Dashboard Navigation
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');

            switch (pageId) {
                case 'dashboard':
                    showDashboardPage(dashboardPage, link);
                    break;
                case 'report-lost':
                    showDashboardPage(reportLostPage);
                    break;
                case 'report-found':
                    showDashboardPage(reportFoundPage);
                    break;
                case 'search-items':
                    showDashboardPage(searchItemsPage);
                    break;
                case 'profile':
                    showDashboardPage(profilePage);
                    break;
                case 'admin-panel':
                    showDashboardPage(adminPanelPage);
                    break;
            }
        });
    });

    // Login and Register Form Submission
    // ---------------- REGISTER ----------------
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const firstname = document.getElementById("register-firstname").value;
        const lastname = document.getElementById("register-lastname").value;
        const email = document.getElementById("register-email").value;
        const phone = document.getElementById("register-phone").value;
        const studentid = document.getElementById("register-studentid").value;
        const department = document.getElementById("register-department").value;
        const password = document.getElementById("register-password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        const response = await fetch("http://127.0.0.1:5000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                firstname,
                lastname,
                email,
                phone,
                studentid,
                department,
                password
            })
        });

        const data = await response.json();

        alert(data.message);

        if (response.ok) {
            showPage(loginPage);
        }
    });


    // ---------------- LOGIN ----------------
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.querySelector("#login-email").value;
        const password = document.querySelector("#login-password").value;

        const res = await fetch("http://127.0.0.1:5000/login", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        email: email,
        password: password
    })
});

const data = await res.json();

console.log(data);

if (res.status === 200) {

    localStorage.setItem("user", JSON.stringify(data.user));

    showPage(dashboardContainer);

    showDashboardPage(dashboardPage);

    loadUserProfile();

    loadTotalFoundItems();
    loadTotalLostItems();
    loadRecentLostItems();

} else {
    alert(data.message);
}
    });


    // Image Preview for Lost Item Form
    lostItemImage.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                lostImagePreview.src = event.target.result;
                lostImagePreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });

    // Image Preview for Found Item Form
    foundItemImage.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                foundImagePreview.src = event.target.result;
                foundImagePreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });

    // Cancel Report Buttons
    cancelLostReport.addEventListener('click', () => {
        showDashboardPage(dashboardPage);
        document.getElementById('lost-item-form').reset();
        lostImagePreview.style.display = 'none';
    });

    cancelFoundReport.addEventListener('click', () => {
        showDashboardPage(dashboardPage);
        document.getElementById('found-item-form').reset();
        foundImagePreview.style.display = 'none';
    });

    // Search Functionality
    searchButton.addEventListener('click', () => {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        if (searchTerm) {
            alert(`Searching for: ${searchTerm}\nIn a real application, this would filter the results.`);
        }
    });

    resetFilters.addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').selectedIndex = 0;
        document.getElementById('statusFilter').selectedIndex = 0;
        document.getElementById('dateFilter').selectedIndex = 0;
        alert('Filters have been reset.');
    });

    // Form Submissions (Mock)
    const lostForm = document.getElementById("lost-item-form");

    if (lostForm) {

        lostForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            const imageInput = document.getElementById("lostItemImage");

            let image = "";

            if (imageInput.files.length > 0) {
                image = imageInput.files[0].name;
            }

            const response = await fetch("http://127.0.0.1:5000/lost-item", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    item_name: document.getElementById("lost-item-name").value,

                    category: document.getElementById("lost-category").value,

                    date_lost: document.getElementById("lost-date").value,

                    location_lost: document.getElementById("lost-location").value,

                    description: document.getElementById("lost-description").value,

                    image: image

                })

            });

            const data = await response.json();

            alert(data.message);

            if (response.ok) {

                lostForm.reset();

                const preview = document.getElementById("lostImagePreview");

                if (preview) {
                    preview.style.display = "none";
                }
                loadTotalLostItems();
                loadRecentLostItems();

                showDashboardPage(dashboardPage);

            }

        });

    }

    const foundForm = document.getElementById("found-item-form");

    if (foundForm) {

        foundForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            const imageInput = document.getElementById("foundItemImage");

            let image = "";

            if (imageInput.files.length > 0) {
                image = imageInput.files[0].name;
            }

            const response = await fetch("http://127.0.0.1:5000/found-item", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    item_name: document.getElementById("found-item-name").value,

                    category: document.getElementById("found-category").value,

                    date_found: document.getElementById("found-date").value,

                    location_found: document.getElementById("found-location").value,

                    description: document.getElementById("found-description").value,

                    image: image

                })

            });

            const data = await response.json();

            alert(data.message);

            if (response.ok) {

                foundForm.reset();

                foundImagePreview.style.display = "none";
                loadTotalFoundItems();

                showDashboardPage(dashboardPage);

            }

        });

    }



    const quickLostForm = document.getElementById("quick-lost-form");

    if (quickLostForm) {

        quickLostForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            const response = await fetch("http://127.0.0.1:5000/quick-lost-item", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    item_name: document.getElementById("quick-lost-name").value,

                    location_lost: document.getElementById("quick-lost-location").value,

                    description: document.getElementById("quick-lost-description").value

                })

            });

            const data = await response.json();

            alert(data.message);

            if (response.ok) {

                quickLostForm.reset();

                loadTotalLostItems();
                loadRecentLostItems();

                showDashboardPage(dashboardPage);

            }

        });

    }
    const quickFoundForm = document.getElementById("quick-found-form");

    if (quickFoundForm) {

        quickFoundForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            const response = await fetch("http://127.0.0.1:5000/quick-found-item", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    item_name: document.getElementById("quick-found-name").value,

                    location_found: document.getElementById("quick-found-location").value,

                    description: document.getElementById("quick-found-description").value

                })

            });

            const data = await response.json();

            alert(data.message);

            if (response.ok) {

                quickFoundForm.reset();
                loadTotalFoundItems();

                showDashboardPage(dashboardPage);

            }

        });

    }
    async function loadTotalFoundItems() {

        const response = await fetch("http://127.0.0.1:5000/total-found-items");

        const data = await response.json();

        document.getElementById("total-found-items").innerText = data.total;

    }

    async function loadTotalLostItems() {

        const response = await fetch("http://127.0.0.1:5000/total-lost-items");

        const data = await response.json();

        document.getElementById("total-lost-items").innerText = data.total;

    }
    async function loadRecentLostItems() {

        const response = await fetch("http://127.0.0.1:5000/recent-lost-items");

        const items = await response.json();

        const container = document.getElementById("recent-lost-items-container");

        container.innerHTML = "";

        items.forEach(item => {

            container.innerHTML += `
        <div class="col-md-6 col-lg-4">

            <div class="item-card">

                <div class="item-details">

                    <span class="item-category category-lost">LOST</span>

                    <h3 class="item-title">${item.item_name}</h3>

                    <p class="item-description">${item.description}</p>

                    <div class="item-meta">

                        <span>
                            <i class="fas fa-map-marker-alt me-1"></i>
                            ${item.location_lost}
                        </span>

                        <span>
                            <i class="fas fa-calendar me-1"></i>
                            ${item.date_lost}
                        </span>

                    </div>

                    <div class="item-actions">

    <button class="btn btn-sm btn-outline-danger"
    onclick="openFoundReport(
        '${item.item_name}',
        '${item.category}',
        '${item.location_lost}'
    )">

    Mark as Found

    </button>

</div>

                </div>

            </div>

        </div>
        `;

        });

    }
    function openFoundReport(itemName, category, location) {

    // Open the Report Found Item page
    showPage(reportFoundPage);   // If your project uses another function, tell me.

    // Fill the form
    document.getElementById("found-item-name").value = itemName;

    document.getElementById("found-category").value = category;

    document.getElementById("found-location").value = location;

    // Set today's date
    document.getElementById("found-date").value =
        new Date().toISOString().split("T")[0];
}
    // Profile Form Submissions (Mock)
    // ---------------- UPDATE PROFILE ----------------

    const profileForm = document.getElementById("profile-form");

    if (profileForm) {

        profileForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            const user = JSON.parse(localStorage.getItem("user"));

            const response = await fetch("http://127.0.0.1:5000/update-profile", {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    firstname: document.getElementById("profile-firstname").value,

                    lastname: document.getElementById("profile-lastname").value,

                    email: user.email,

                    phone: document.getElementById("profile-phone").value

                })

            });

            const data = await response.json();

            alert(data.message);

            if (response.ok) {

                localStorage.setItem("user", JSON.stringify(data.user));

                loadUserProfile();

            }

        });

    }

    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Password changed successfully!');
        });
    }

    // Initialize with login page visible
    const user = localStorage.getItem("user");

    if (user) {
        showPage(dashboardContainer);
        showDashboardPage(dashboardPage);
        loadUserProfile();
    } else {
        showPage(loginPage);
    }
});
