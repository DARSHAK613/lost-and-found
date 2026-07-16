

        document.addEventListener('DOMContentLoaded', function() {
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

    if (user) {
        // Topbar
        document.querySelector(".user-info .fw-bold").innerText = user.name;
        document.querySelector(".user-info .small").innerText = user.email;

        // Avatar
        const initials = user.name.split(" ").map(n => n[0]).join("");
        document.querySelector(".user-avatar").innerText = initials;

        // Profile Page
        document.querySelector(".profile-name").innerText = user.name;
        document.querySelector(".profile-email").innerText = user.email;
    }
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
                    
                    switch(pageId) {
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
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.querySelector("#register-name").value;
    const email = document.querySelector("#register-email").value;
    const password = document.querySelector("#register-password").value;

    const res = await fetch("http://127.0.0.1:5000/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    alert(data.message);

    if (res.ok) {
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
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
         alert(data.message);

    // Store user data
    localStorage.setItem("user", JSON.stringify(data.user));

    showPage(dashboardContainer);
    showDashboardPage(dashboardPage);

    loadUserProfile(); // IMPORTANT
    } else {
        alert(data.message);
    }
});

            
            // Image Preview for Lost Item Form
            lostItemImage.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        lostImagePreview.src = event.target.result;
                        lostImagePreview.style.display = 'block';
                    }
                    reader.readAsDataURL(file);
                }
            });
            
            // Image Preview for Found Item Form
            foundItemImage.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
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
            const lostForm = document.getElementById('lost-item-form');

if (lostForm) {
    lostForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Lost item report submitted successfully!');
        showDashboardPage(dashboardPage);
        e.target.reset();
        lostImagePreview.style.display = 'none';
    });
}
            
            const foundForm = document.getElementById('found-item-form');
if (foundForm) {
    foundForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Found item report submitted successfully!');
    });
}
const quickLost = document.getElementById('quick-lost-form');
if (quickLost) {
    quickLost.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Lost item report submitted successfully!');
    });
}
            
            const quickFound = document.getElementById('quick-found-form');
if (quickFound) {
    quickFound.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Found item report submitted successfully!');
    });
}
            // Profile Form Submissions (Mock)
            const profileForm = document.getElementById('profile-form');
if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Profile updated successfully!');
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
    