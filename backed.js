//i add this comment for testing

document.addEventListener('DOMContentLoaded', function () {
    // Page Navigation
    const loginPage = document.getElementById('login-page');
    const registerPage = document.getElementById('register-page');
    const dashboardContainer = document.getElementById('dashboard-container');
    const emailVerificationPage = document.getElementById("email-verification-page");
    const dashboardPage = document.getElementById('dashboard-page');
    const reportLostPage = document.getElementById('report-lost-page');
    const reportFoundPage = document.getElementById('report-found-page');
    const searchItemsPage = document.getElementById('search-items-page');
    const profilePage = document.getElementById('profile-page');
    const manageUsersPage = document.getElementById("manage-users-page");
    const reportManagementPage = document.getElementById("report-management-page");
    const potentialMatchesPage = document.getElementById("potential-matches-page");

    // Sidebar elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const adminItems = document.querySelectorAll('.admin-item');
    const userOnlySections = document.querySelectorAll(".user-only");

    function updateAdminMenu() {

        const role = localStorage.getItem("role");

        adminItems.forEach(item => {

            if (role === "admin") {
                item.classList.remove("hidden");
            } else {
                item.classList.add("hidden");
            }

        });

        userOnlySections.forEach(section => {

            if (role === "admin") {
                section.classList.add("hidden");
            } else {
                section.classList.remove("hidden");
            }

        });

    }

    updateAdminMenu();

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
    //otp verification
    const verifyOtpBtn = document.getElementById("verify-otp-btn");
    const resendOtpBtn = document.getElementById("resend-otp-btn");
    const otpInput = document.getElementById("otp-input");
    const otpTimer = document.getElementById("otp-timer");


    // Show admin panel if user is admin


    function loadUserProfile() {

        const user = JSON.parse(localStorage.getItem("user"));
        const role = localStorage.getItem("role");

        if (!user) return;
        if (role === "admin") {

            // Show Admin Fields
            document.getElementById("student-fields").classList.add("hidden");
            document.getElementById("profile-firstname").required = false;
            document.getElementById("profile-lastname").required = false;
            document.getElementById("admin-fields").classList.remove("hidden");
            document.getElementById("profile-role-badge").innerText = "Administrator";

            // Top Bar
            document.querySelector(".user-info .fw-bold").innerText =
                user.fullname;

            document.querySelector(".user-info .small").innerText =
                user.email;

            // Avatar
            // Avatar
            const initials = user.fullname
                .split(" ")
                .map(word => word[0].toUpperCase())
                .join("");

            document.querySelector(".user-avatar").innerText = initials;
            document.getElementById("profile-avatar").innerText = initials;

            // Profile Header
            document.getElementById("profile-name").innerText =
                user.fullname;

            document.getElementById("profile-email").innerText =
                user.email;

            // Admin Form
            document.getElementById("admin-fullname").value =
                user.fullname;

            document.getElementById("profile-email-input").value =
                user.email;

            return;
        }
        document.getElementById("student-fields").classList.remove("hidden");
        document.getElementById("profile-firstname").required = true;
        document.getElementById("profile-lastname").required = true;
        document.getElementById("admin-fields").classList.add("hidden");
        document.getElementById("profile-role-badge").innerText = "Student";

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




        loginPage.classList.add("hidden");
        registerPage.classList.add("hidden");
        dashboardContainer.classList.add("hidden");
        emailVerificationPage.classList.add("hidden");

        pageElement.classList.remove("hidden");


        sidebar.classList.remove("active");
    }



    function showDashboardPage(pageElement, clickedLink) {
        // Hide all dashboard subpages
        dashboardPage.classList.add('hidden');
        reportLostPage.classList.add('hidden');
        reportFoundPage.classList.add('hidden');
        searchItemsPage.classList.add('hidden');
        profilePage.classList.add('hidden');
        manageUsersPage.classList.add('hidden');
        reportManagementPage.classList.add('hidden');
        potentialMatchesPage.classList.add('hidden');



        // Show requested dashboard subpage
        pageElement.classList.remove('hidden');

        // Update sidebar active link
        sidebarLinks.forEach(link => link.classList.remove('active'));
        if (clickedLink) {
            clickedLink.classList.add('active');
        }
        loadTotalFoundItems();
        loadTotalLostItems();
        loadTotalReturnedItems();
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
        updateAdminMenu();

        showPage(loginPage);
    });


    // resend otp
    let otpCountdown;

    function startOtpTimer(seconds = 300) {

        clearInterval(otpCountdown);

        let timeLeft = seconds;

        otpCountdown = setInterval(() => {

            const minutes = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;

            otpTimer.innerText =
                `OTP expires in ${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

            if (timeLeft <= 0) {

                clearInterval(otpCountdown);

                otpTimer.innerText = "OTP Expired";

                verifyOtpBtn.disabled = true;

            }

            timeLeft--;

        }, 1000);

    }

    // verification of otp
    // Verify OTP
    verifyOtpBtn.addEventListener("click", async () => {

        const pendingUser = JSON.parse(localStorage.getItem("pendingUser"));

        const response = await fetch("http://127.0.0.1:5000/verify-otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: pendingUser.email,
                otp: otpInput.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        alert(data.message);

        localStorage.removeItem("pendingUser");

        showPage(loginPage);

    });


    // Resend OTP
    resendOtpBtn.addEventListener("click", async () => {

        const pendingUser = JSON.parse(localStorage.getItem("pendingUser"));

        const response = await fetch("http://127.0.0.1:5000/resend-otp", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: pendingUser.email
            })

        });

        const data = await response.json();

        alert(data.message);

        if (!response.ok) return;

        verifyOtpBtn.disabled = false;

        startOtpTimer();

        startResendTimer();

    });


    // Resend Timer
    let resendCountdown;

    function startResendTimer(seconds = 30) {

        clearInterval(resendCountdown);

        let timeLeft = seconds;

        resendOtpBtn.disabled = true;

        resendCountdown = setInterval(() => {

            resendOtpBtn.innerText = `Resend OTP (${timeLeft}s)`;

            if (timeLeft <= 0) {

                clearInterval(resendCountdown);

                resendOtpBtn.disabled = false;

                resendOtpBtn.innerText = "Resend OTP";

            }

            timeLeft--;

        }, 1000);

    }



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
                    showDashboardPage(reportLostPage, link);
                    break;
                case 'report-found':
                    showDashboardPage(reportFoundPage, link);
                    break;
                case 'search-items':
                    showDashboardPage(searchItemsPage, link);
                    break;
                case 'profile':
                    showDashboardPage(profilePage, link);
                    break;
                case 'manage-users':
                    console.log("Manage Users clicked");
                    console.log(manageUsersPage);
                    showDashboardPage(manageUsersPage, link);
                    loadUsers();
                    break;
                case "report-management":

                    showDashboardPage(reportManagementPage);

                    loadReports();

                    loadAdminTotalFoundItems();
                    loadAdminTotalLostItems();

                    break;

                case "potential-matches":

                    showDashboardPage(potentialMatchesPage, link);

                    loadMatches();
                    loadMatchHistory();

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

        const response = await fetch("http://127.0.0.1:5000/send-otp", {
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

        if (!response.ok) {
            alert(data.message);
            return;
        }

        alert(data.message);

        localStorage.setItem("pendingUser", JSON.stringify({
            firstname,
            lastname,
            email,
            phone,
            studentid,
            department,
            password
        }));

        showPage(emailVerificationPage);
        verifyOtpBtn.disabled = false;
        startOtpTimer();
        resendOtpBtn.disabled = true;
        startResendTimer();
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



        if (res.status === 200) {


            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("role", data.role);

            updateAdminMenu();

            if (data.role === "admin") {

                adminItems.forEach(item => {
                    item.classList.remove("hidden");
                });

                showPage(dashboardContainer);
                showDashboardPage(manageUsersPage);
                loadUserProfile();

                // Dashboard Data
                loadTotalFoundItems();
                loadTotalLostItems();
                loadTotalReturnedItems();
                loadRecentLostItems();
                loadRecentActivities();

                loadUsers();
                loadReports();
                loadAdminCount();

            } else {

                adminItems.forEach(item => {
                    item.classList.add("hidden");
                });

                showPage(dashboardContainer);

                showDashboardPage(dashboardPage);

                loadUserProfile();
                loadRecentActivities();

                loadTotalFoundItems();
                loadTotalLostItems();
                loadTotalReturnedItems();
                loadRecentLostItems();



            }

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

            const user = JSON.parse(localStorage.getItem("user"));

            const formData = new FormData();

            formData.append("item_name", document.getElementById("lost-item-name").value);
            formData.append("category", document.getElementById("lost-category").value);
            formData.append("date_lost", document.getElementById("lost-date").value);
            formData.append("location_lost", document.getElementById("lost-location").value);
            formData.append("description", document.getElementById("lost-description").value);
            formData.append("email", user.email);

            if (imageInput.files.length > 0) {
                formData.append("image", imageInput.files[0]);
            }

            const response = await fetch("http://127.0.0.1:5000/lost-item", {
                method: "POST",
                body: formData
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
                loadRecentActivities();
                showDashboardPage(dashboardPage);

            }

        });

    }




    const foundForm = document.getElementById("found-item-form");

    if (foundForm) {

        foundForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            const user = JSON.parse(localStorage.getItem("user"));

            const imageInput = document.getElementById("foundItemImage");

            const formData = new FormData();

            formData.append("item_name", document.getElementById("found-item-name").value);
            formData.append("category", document.getElementById("found-category").value);
            formData.append("date_found", document.getElementById("found-date").value);
            formData.append("location_found", document.getElementById("found-location").value);
            formData.append("description", document.getElementById("found-description").value);
            formData.append("email", user.email);

            if (imageInput.files.length > 0) {
                formData.append("image", imageInput.files[0]);
            }

            const response = await fetch(
                "http://127.0.0.1:5000/found-item",
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await response.json();

            alert(data.message);

            if (response.ok) {

                foundForm.reset();

                foundImagePreview.style.display = "none";

                loadTotalFoundItems();

                loadRecentActivities();

                showDashboardPage(dashboardPage);

            }

        });

    }


    const quickLostForm = document.getElementById("quick-lost-form");

    if (quickLostForm) {

        quickLostForm.addEventListener("submit", async (e) => {

            e.preventDefault();
            const user = JSON.parse(localStorage.getItem("user"));

            const response = await fetch("http://127.0.0.1:5000/quick-lost-item", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    item_name: document.getElementById("quick-lost-name").value,

                    location_lost: document.getElementById("quick-lost-location").value,

                    description: document.getElementById("quick-lost-description").value,

                    email: user.email

                })

            });

            const data = await response.json();

            alert(data.message);

            if (response.ok) {

                quickLostForm.reset();

                loadTotalLostItems();
                loadRecentLostItems();
                loadRecentActivities();
                showDashboardPage(dashboardPage);

            }

        });

    }



    const quickFoundForm = document.getElementById("quick-found-form");

    if (quickFoundForm) {

        quickFoundForm.addEventListener("submit", async (e) => {

            e.preventDefault();
            const user = JSON.parse(localStorage.getItem("user"));

            const response = await fetch("http://127.0.0.1:5000/quick-found-item", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    item_name: document.getElementById("quick-found-name").value,

                    location_found: document.getElementById("quick-found-location").value,

                    description: document.getElementById("quick-found-description").value,

                    email: user.email

                })

            });

            const data = await response.json();

            alert(data.message);

            if (response.ok) {

                quickFoundForm.reset();
                loadTotalFoundItems();
                loadRecentActivities();
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

    async function loadTotalReturnedItems() {

        const response = await fetch(
            "http://127.0.0.1:5000/total-returned-items"
        );

        const data = await response.json();

        document.getElementById("returned-items").innerText = data.total;

    }

    async function loadAdminTotalFoundItems() {

        const response = await fetch("http://127.0.0.1:5000/total-found-items");
        const data = await response.json();

        document.getElementById("admin-total-found-items").innerText =
            data.total;

    }

    async function loadAdminTotalLostItems() {

        const response = await fetch("http://127.0.0.1:5000/total-lost-items");
        const data = await response.json();

        document.getElementById("admin-total-lost-items").innerText =
            data.total;

    }




    function getTimeAgo(time) {

        const now = new Date();
        const activityTime = new Date(time);



        const diff = now - activityTime;

        ;

        const seconds = Math.floor(diff / 1000);
        ;

        const minutes = Math.floor(seconds / 60);


        if (seconds < 60) return "Just now";

        if (minutes < 60)
            return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;

        const hours = Math.floor(minutes / 60);


        if (hours < 24)
            return `${hours} hour${hours > 1 ? "s" : ""} ago`;

        const days = Math.floor(hours / 24);

        if (days === 1) return "Yesterday";

        if (days < 7)
            return `${days} days ago`;

        return activityTime.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }




    async function loadRecentActivities() {

        const user = JSON.parse(localStorage.getItem("user"));

        if (!user) return;

        const response = await fetch(
            `http://127.0.0.1:5000/recent-activities?email=${user.email}`
        );

        const activities = await response.json();

        const list = document.getElementById("recent-activity-list");

        list.innerHTML = "";

        activities.forEach(activity => {


            list.innerHTML += `

        <li class="list-group-item d-flex justify-content-between align-items-start">

            <div class="ms-2 me-auto">

                <div class="fw-bold">${activity.activity}</div>

            </div>

            
            <span class="badge bg-primary rounded-pill">

                ${getTimeAgo(activity.time)}

            </span>

        </li>

        `;

        });

    }
    console.log("JS reached loadUsers definition");
    async function loadUsers() {

        console.log("loadUsers() called");

        const response = await fetch("http://127.0.0.1:5000/admin/users");

        const users = await response.json();

        window.allUsers = users;

        const totalUsers = users.length;

        const totalStudents = users.filter(user => user.role !== "admin").length;

        const totalAdmins = users.filter(user => user.role === "admin").length;

        const totalBlocked = users.filter(user => user.status === "blocked").length;

        document.getElementById("total-users").innerText = totalUsers;
        loadAdminCount();

        document.getElementById("total-students").innerText = totalStudents;

        document.getElementById("total-admins").innerText = totalAdmins;

        document.getElementById("total-blocked").innerText = totalBlocked;

        renderUsers(users);
    }
    async function loadAdminCount() {
        try {
            const response = await fetch("http://127.0.0.1:5000/admin/admin-count");

            const data = await response.json();

            document.getElementById("total-admins").innerText = data.count;

        } catch (error) {
            console.error(error);
        }
    }
    let reportSearch = "";
    let reportType = "all";
    let reportStatus = "all";
    async function loadReports() {
        const response = await fetch("http://127.0.0.1:5000/admin/reports");

        const reports = await response.json();
        const filteredReports = reports.filter(report => {

            const searchText = reportSearch;
            const reportName = String(report.item_name || "").toLowerCase();
            const reporterName = String(report.fullname || "").toLowerCase();
            const studentId = String(report.studentid || "").toLowerCase();

            const matchesSearch =
                reportName.includes(searchText) ||
                reporterName.includes(searchText) ||
                studentId.includes(searchText);

            const matchesType =
                reportType === "all" ||
                report.type.toLowerCase() === reportType.toLowerCase();

            const matchesStatus =
                reportStatus === "all" ||
                report.status.toLowerCase() === reportStatus.toLowerCase();

            return matchesSearch && matchesType && matchesStatus;
        });
        const tbody = document.getElementById("reports-table-body");

        tbody.innerHTML = "";
        filteredReports.forEach(report => {

            const badge =
                report.type === "Lost"
                    ? '<span class="badge bg-danger">Lost</span>'
                    : '<span class="badge bg-success">Found</span>';

            const row = `

        <tr>

        <td>${report.fullname || "Unknown User"}</td>

        <td>${badge}</td>

        <td>${report.item_name}</td>

        <td>${report.category || "-"}</td>

        <td>

       <span class="status-badge
        ${report.status === "Approved"
                    ? "status-active"
                    : report.status === "Pending"
                        ? "status-pending"
                        : report.status === "Rejected"
                            ? "status-rejected"
                            : "status-returned"
                }">

        ${report.status}

        </span>

        </td>

        <td>${report.date_lost || report.date_found || "-"}</td>

        <td>

        <button class="btn btn-sm btn-outline-primary view-report-btn">
        <i class="fas fa-eye"></i>
        </button>

        ${report.status === "Pending"
                    ? `
            <button class="btn btn-sm btn-outline-success approve-btn">
                <i class="fas fa-check"></i>
            </button>

            <button class="btn btn-sm btn-outline-danger reject-btn">
                <i class="fas fa-times"></i>
            </button>
            `
                    : report.status === "Approved"
                        ? `
            <button class="btn btn-sm btn-outline-info return-btn">
                <i class="fas fa-box-open"></i>
            </button>

            <button class="btn btn-sm btn-outline-danger reject-btn">
                <i class="fas fa-times"></i>
            </button>
            `
                        : report.status === "Returned"
                            ? `
            <button class="btn btn-sm btn-outline-warning unreturn-btn">
                <i class="fas fa-undo"></i>
            </button>
            `
                            : report.status === "Rejected"
                                ? `
            <button class="btn btn-sm btn-outline-secondary unreject-btn">
                <i class="fas fa-rotate-left"></i>
            </button>
            `
                                : ""
                }

            </td>

            </tr>

            `;

            tbody.insertAdjacentHTML("beforeend", row);
            const lastRow = tbody.lastElementChild;

            lastRow.querySelector(".view-report-btn")
                .addEventListener("click", () => {
                    console.log(report);
                    viewReport(report);
                });
            const approveBtn = lastRow.querySelector(".approve-btn");

            if (approveBtn) {

                approveBtn.addEventListener("click", async () => {

                    const response = await fetch(
                        "http://127.0.0.1:5000/admin/approve-report",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                id: report._id,
                                type: report.type
                            })
                        }
                    );

                    const data = await response.json();

                    alert(data.message);

                    loadReports();

                });

            }
            const rejectBtn = lastRow.querySelector(".reject-btn");

            if (rejectBtn) {

                rejectBtn.addEventListener("click", async () => {

                    const response = await fetch(
                        "http://127.0.0.1:5000/admin/reject-report",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                id: report._id,
                                type: report.type
                            })
                        }
                    );

                    const data = await response.json();

                    alert(data.message);

                    loadReports();

                });


            }



            const returnBtn = lastRow.querySelector(".return-btn");

            if (returnBtn) {

                returnBtn.addEventListener("click", async () => {

                    const response = await fetch(
                        "http://127.0.0.1:5000/admin/return-report",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                id: report._id,
                                type: report.type
                            })
                        }
                    );

                    const data = await response.json();

                    alert(data.message);

                    loadReports();
                    loadTotalReturnedItems();

                });

            }


            const unreturnBtn = lastRow.querySelector(".unreturn-btn");

            if (unreturnBtn) {

                unreturnBtn.addEventListener("click", async () => {

                    const response = await fetch(
                        "http://127.0.0.1:5000/admin/not-returned",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                id: report._id,
                                type: report.type
                            })
                        }
                    );

                    const data = await response.json();

                    alert(data.message);

                    loadReports();
                    loadTotalReturnedItems();

                });

            }
            const unrejectBtn = lastRow.querySelector(".unreject-btn");

            if (unrejectBtn) {

                unrejectBtn.addEventListener("click", async () => {

                    const response = await fetch(
                        "http://127.0.0.1:5000/admin/unreject-report",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                id: report._id,
                                type: report.type
                            })
                        }
                    );

                    const data = await response.json();

                    alert(data.message);

                    loadReports();

                });

            }

        });

    }
    document.getElementById("report-search").addEventListener("input", function () {
        reportSearch = this.value.toLowerCase().trim();
        loadReports();
    });

    document.getElementById("report-type-filter").addEventListener("change", function () {
        reportType = this.value;
        loadReports();
    });

    document.getElementById("report-status-filter").addEventListener("change", function () {
        reportStatus = this.value;
        loadReports();
    });
    console.log("Reached viewReport");
    window.viewReport = function (report) {
        document.getElementById("report-item-name").innerText = report.item_name;

        document.getElementById("report-category").innerText = report.category;

        document.getElementById("report-type").innerText = report.type;

        document.getElementById("report-status").innerText = report.status;

        document.getElementById("report-user").innerText =
            report.fullname || "Unknown User";

        document.getElementById("report-studentid").innerText =
            report.studentid || "-";

        document.getElementById("report-department").innerText =
            report.department || "-";

        document.getElementById("report-phone").innerText =
            report.phone || "-";

        document.getElementById("report-location").innerText =
            report.location_lost || report.location_found;

        document.getElementById("report-date").innerText =
            report.date_lost || report.date_found;

        document.getElementById("report-description").innerText =
            report.description;

        const img = document.getElementById("report-image");

        if (report.image) {

            img.src = "http://127.0.0.1:5000/uploads/" + report.image;

            img.style.display = "block";

        } else {

            img.style.display = "none";

        }

        const modal = new bootstrap.Modal(
            document.getElementById("viewReportModal")
        );

        modal.show();

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
        showDashboardPage(reportFoundPage);   // If your project uses another function, tell me.

        // Fill the form
        document.getElementById("found-item-name").value = itemName;

        document.getElementById("found-category").value = category;

        document.getElementById("found-location").value = location;

        // Set today's date
        document.getElementById("found-date").value =
            new Date().toISOString().split("T")[0];
    }
    window.openFoundReport = openFoundReport;





    // Profile Form Submissions (Mock)
    // ---------------- UPDATE PROFILE ----------------

    const profileForm = document.getElementById("profile-form");

    if (profileForm) {

        profileForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            const user = JSON.parse(localStorage.getItem("user"));

            const role = localStorage.getItem("role");

            let bodyData;

            if (role === "admin") {

                bodyData = {

                    fullname: document.getElementById("admin-fullname").value,

                    email: user.email,

                    role: "admin"

                };

            } else {

                bodyData = {

                    firstname: document.getElementById("profile-firstname").value,

                    lastname: document.getElementById("profile-lastname").value,

                    email: user.email,

                    phone: document.getElementById("profile-phone").value,

                    role: "user"

                };

            }

            const response = await fetch("http://127.0.0.1:5000/update-profile", {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(bodyData)

            });

            const data = await response.json();


            alert(data.message);

            if (response.ok) {

                localStorage.setItem("user", JSON.stringify(data.user));


                loadUserProfile();

                if (role === "user") {
                    loadRecentActivities();
                }

            }

        });

    }


    const passwordForm = document.getElementById("password-form");

    if (passwordForm) {

        passwordForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            const user = JSON.parse(localStorage.getItem("user"));

            const currentPassword = document.getElementById("current-password").value;

            const newPassword = document.getElementById("new-password").value;

            const confirmPassword = document.getElementById("confirm-password").value;

            if (newPassword !== confirmPassword) {
                alert("New passwords do not match");
                return;
            }

            const response = await fetch("http://127.0.0.1:5000/change-password", {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    email: user.email,

                    current_password: currentPassword,

                    new_password: newPassword

                })

            });

            const data = await response.json();

            alert(data.message);

            if (response.ok) {

                passwordForm.reset();

            }

        });

    }



    // Initialize with login page visible
    const user = localStorage.getItem("user");

    if (user) {

        showPage(dashboardContainer);

        const role = localStorage.getItem("role");

        if (role === "admin") {
            showDashboardPage(manageUsersPage);
        } else {
            showDashboardPage(dashboardPage);
        }

        loadUserProfile();

        loadTotalFoundItems();
        loadTotalLostItems();
        loadRecentLostItems();
        loadRecentActivities();
    } else {

        showPage(loginPage);

    }




    function renderUsers(users) {

        const tbody = document.getElementById("users-table-body");

        tbody.innerHTML = "";

        users.forEach(user => {

            tbody.innerHTML += `
        <tr>
            <td class="text-center">${user.studentid || "-"}</td>
            <td>${user.fullname}</td>
            <td>${user.email}</td>
            <td>${user.role === "admin" ? "Administrator" : "Student"}</td>
            <td>

    ${user.status === "blocked"

                    ?

                    `<span class="status-badge status-pending">
            Blocked
        </span>`

                    :

                    `<span class="status-badge status-active">
            Active
        </span>`
                }

</td>

            <td>
                
    <button
    class="btn btn-sm btn-outline-primary view-user-btn"
    data-id="${user._id}">

    <i class="fas fa-eye"></i>

</button>

                <button
    class="btn btn-sm btn-outline-warning edit-user-btn"
    data-id="${user._id}">
    <i class="fas fa-edit"></i>
</button>
${user.status === "blocked"

                    ?

                    `<button
        class="btn btn-sm btn-outline-success unblock-user-btn"
        data-id="${user._id}">

        <i class="fas fa-check"></i>

    </button>`

                    :

                    `<button
        class="btn btn-sm btn-outline-danger block-user-btn"
        data-id="${user._id}">

        <i class="fas fa-ban"></i>

    </button>`
                }
            </td>

        </tr>
        `;

        });
        document.querySelectorAll(".view-user-btn").forEach(btn => {

            btn.addEventListener("click", () => {

                viewUser(btn.dataset.id);

            });

        });

        document.querySelectorAll(".edit-user-btn").forEach(btn => {

            btn.addEventListener("click", () => {

                openEditUser(btn.dataset.id);

            });

        });
        document.querySelectorAll(".block-user-btn").forEach(btn => {

            btn.addEventListener("click", () => {

                openBlockModal(btn.dataset.id);

            });

        });
        document.querySelectorAll(".unblock-user-btn").forEach(btn => {

            btn.addEventListener("click", () => {

                unblockUser(btn.dataset.id);

            });

        });

    }

    const searchInput = document.getElementById("user-search");

    document.getElementById("user-search")
        .addEventListener("input", filterUsers);
    document.getElementById("role-filter")
        .addEventListener("change", filterUsers);

    document.getElementById("status-filter")
        .addEventListener("change", filterUsers);



    function filterUsers() {

        const searchValue =
            document.getElementById("user-search").value.toLowerCase();

        const roleValue =
            document.getElementById("role-filter").value;

        const statusValue =
            document.getElementById("status-filter").value;

        const filtered = window.allUsers.filter(user => {

            const name =
                (user.fullname || "").toLowerCase();

            const email =
                (user.email || "").toLowerCase();

            const studentid =
                (user.studentid || "").toLowerCase();

            const role =
                user.role || "user";

            const status =
                user.status || "active";

            const matchesSearch =
                name.includes(searchValue) ||
                email.includes(searchValue) ||
                studentid.includes(searchValue);

            const matchesRole =
                roleValue === "all" || role === roleValue;

            const matchesStatus =
                statusValue === "all" || status === statusValue;

            return matchesSearch && matchesRole && matchesStatus;

        });

        renderUsers(filtered);

    }

    function viewUser(id) {

        const user = window.allUsers.find(u => u._id === id);

        if (!user) return;

        document.getElementById("view-fullname").innerText =
            user.fullname || "-";

        document.getElementById("view-email").innerText =
            user.email || "-";

        document.getElementById("view-phone").innerText =
            user.phone || "-";

        document.getElementById("view-studentid").innerText =
            user.studentid || "—";

        document.getElementById("view-department").innerText =
            user.department || "—";

        document.getElementById("view-role").innerText =
            user.role === "admin"
                ? "Administrator"
                : "Student";

        const modal = new bootstrap.Modal(
            document.getElementById("userDetailsModal")
        );

        modal.show();

    }
    function openEditUser(id) {

        const user = window.allUsers.find(u => u._id === id);

        if (!user) return;

        document.getElementById("edit-user-id").value =
            user._id;

        document.getElementById("edit-fullname").value =
            user.fullname || "";

        document.getElementById("edit-email").value =
            user.email || "";

        document.getElementById("edit-studentid").value =
            user.studentid || "";

        document.getElementById("edit-phone").value =
            user.phone || "";

        document.getElementById("edit-department").value =
            user.department || "";

        document.getElementById("edit-role").value =
            user.role || "user";


        const modal = new bootstrap.Modal(
            document.getElementById("editUserModal")
        );

        modal.show();

    }
    document.getElementById("save-edit-user-btn").addEventListener("click", async () => {

        const userId =
            document.getElementById("edit-user-id").value;

        const fullname =
            document.getElementById("edit-fullname").value.trim();

        const studentid =
            document.getElementById("edit-studentid").value.trim();

        const phone =
            document.getElementById("edit-phone").value.trim();

        const department =
            document.getElementById("edit-department").value.trim();

        const role =
            document.getElementById("edit-role").value;

        try {

            const response = await fetch(
                "http://127.0.0.1:5000/admin/update-user",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        user_id: userId,
                        fullname: fullname,
                        studentid: studentid,
                        phone: phone,
                        department: department,
                        role: role
                    })
                }
            );

            const data = await response.json();

            alert(data.message);

            if (!response.ok) {
                return;
            }

            const modalElement =
                document.getElementById("editUserModal");

            const modal =
                bootstrap.Modal.getInstance(modalElement);

            modal.hide();

            loadUsers();

        } catch (error) {

            console.error("Update user error:", error);

            alert("Something went wrong while updating the user.");

        }

    });
    function openBlockModal(id) {

        document.getElementById("block-user-id").value = id;

        document.getElementById("block-reason").value = "";

        document.getElementById("block-note").value = "";

        document.getElementById("send-email").checked = true;

        const modal = new bootstrap.Modal(
            document.getElementById("blockUserModal")
        );

        modal.show();

    }


    document.getElementById("confirm-block-btn")
        .addEventListener("click", async () => {

            const userId = document.getElementById("block-user-id").value;

            const reason = document.getElementById("block-reason").value;

            const note = document.getElementById("block-note").value;

            if (reason === "") {

                alert("Please select a reason.");

                return;

            }

            const response = await fetch(
                "http://127.0.0.1:5000/admin/block-user",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        user_id: userId,
                        reason: reason,
                        note: note
                    })
                }
            );

            const result = await response.json();

            alert(result.message);

            bootstrap.Modal.getInstance(
                document.getElementById("blockUserModal")
            ).hide();

            loadUsers();

        });


    async function unblockUser(id) {

        if (!confirm("Are you sure you want to unblock this user?")) {
            return;
        }

        const response = await fetch(
            "http://127.0.0.1:5000/admin/unblock-user",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    user_id: id
                })
            }
        );

        const result = await response.json();

        alert(result.message);

        loadUsers();

    }

});
async function loadMatches() {
    try {
        const response = await fetch("http://127.0.0.1:5000/admin/matches");

        const matches = await response.json();

        const tbody = document.getElementById("matches-table-body");

        tbody.innerHTML = "";

        if (matches.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        No potential matches found.
                    </td>
                </tr>
            `;
            return;
        }

        matches.forEach(match => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${match.lost_item}</td>

                <td>${match.found_item}</td>

                <td>${match.score}%</td>

                <td>${match.level}</td>

                <td>
                    <button
                        class="btn btn-sm btn-primary check-match-btn"
                        data-lost-id="${match.lost_id}"
                        data-found-id="${match.found_id}">
                        Check Information
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading matches:", error);
    }
}
document.addEventListener("click", async function (e) {

    if (e.target.classList.contains("check-match-btn")) {

        const lostId = e.target.dataset.lostId;
        const foundId = e.target.dataset.foundId;

        document.getElementById("confirmMatchBtn").dataset.lostId = lostId;
        document.getElementById("confirmMatchBtn").dataset.foundId = foundId;

        try {

            const response = await fetch(
                `http://127.0.0.1:5000/admin/match/${lostId}/${foundId}`
            );

            const data = await response.json();

            if (!response.ok) {
                console.error("Server error:", data);
                alert(data.message || "Unable to load match information.");
                return;
            }

            const lost = data.lost_item;
            const found = data.found_item;

            const lostReporter = data.lost_reporter;
            const foundReporter = data.found_reporter;


            // Lost Item
            document.getElementById("match-lost-item").textContent =
                lost.item_name || "";

            document.getElementById("match-lost-category").textContent =
                lost.category || "";

            document.getElementById("match-lost-date").textContent =
                lost.date_lost || "";

            document.getElementById("match-lost-location").textContent =
                lost.location_lost || "";

            document.getElementById("match-lost-description").textContent =
                lost.description || "No description available.";
            // Lost Item Image
            const lostImage = document.getElementById("match-lost-image");

            if (lost.image) {
                lostImage.src = "http://127.0.0.1:5000/uploads/" + lost.image;
                lostImage.style.display = "inline-block";
            } else {
                lostImage.style.display = "none";
            }


            // Lost Reporter
            document.getElementById("match-lost-reporter-name").textContent =
                lostReporter.fullname || "";

            document.getElementById("match-lost-reporter-studentid").textContent =
                lostReporter.studentid || "";

            document.getElementById("match-lost-reporter-department").textContent =
                lostReporter.department || "";

            document.getElementById("match-lost-reporter-phone").textContent =
                lostReporter.phone || "";

            document.getElementById("match-lost-reporter-email").textContent =
                lostReporter.email || "";


            // Found Item
            document.getElementById("match-found-item").textContent =
                found.item_name || "";

            document.getElementById("match-found-category").textContent =
                found.category || "";

            document.getElementById("match-found-date").textContent =
                found.date_found || "";

            document.getElementById("match-found-location").textContent =
                found.location_found || "";

            document.getElementById("match-found-description").textContent =
                found.description || "No description available.";
            // Found Item Image
            const foundImage = document.getElementById("match-found-image");

            if (found.image) {
                foundImage.src = "http://127.0.0.1:5000/uploads/" + found.image;
                foundImage.style.display = "inline-block";
            } else {
                foundImage.style.display = "none";
            }


            // Found Reporter
            document.getElementById("match-found-reporter-name").textContent =
                foundReporter.fullname || "";

            document.getElementById("match-found-reporter-studentid").textContent =
                foundReporter.studentid || "";

            document.getElementById("match-found-reporter-department").textContent =
                foundReporter.department || "";

            document.getElementById("match-found-reporter-phone").textContent =
                foundReporter.phone || "";

            document.getElementById("match-found-reporter-email").textContent =
                foundReporter.email || "";


            // Open modal
            const modalElement =
                document.getElementById("matchInformationModal");

            const modal =
                new bootstrap.Modal(modalElement);

            modal.show();

        } catch (error) {

            console.error("Error fetching match details:", error);

            alert("Unable to load match information.");

        }

    }

    if (e.target.id === "confirmMatchBtn") {

        const lostId = e.target.dataset.lostId;
        const foundId = e.target.dataset.foundId;

        try {

            const response = await fetch(
                "http://127.0.0.1:5000/admin/confirm-match",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        lost_id: lostId,
                        found_id: foundId
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Unable to confirm match.");
                return;
            }

            alert(data.message);

            loadMatches();

            loadMatchHistory();

        } catch (error) {

            console.error("Error confirming match:", error);

            alert("Unable to confirm match.");

        }

    }

});
async function loadMatchHistory() {

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/admin/match-history"
        );

        const history = await response.json();

        const tbody = document.getElementById(
            "match-history-table-body"
        );

        tbody.innerHTML = "";

        if (history.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        No matching history found.
                    </td>
                </tr>
            `;

            return;
        }

        history.forEach(match => {

            const row = document.createElement("tr");

            const date = match.created_at
                ? new Date(match.created_at).toLocaleString()
                : "";

            row.innerHTML = `
                <td>${match.lost_item}</td>

                <td>${match.found_item}</td>

                <td>${match.status}</td>

                <td>${date}</td>

                <td>
    <button
        class="btn btn-sm btn-success item-returned-btn"
        data-history-id="${match.history_id}"
        data-lost-id="${match.lost_id}"
        data-found-id="${match.found_id}">
        Item Returned
    </button>

    <button
        class="btn btn-sm btn-danger not-match-btn"
        data-history-id="${match.history_id}"
        data-lost-id="${match.lost_id}"
        data-found-id="${match.found_id}">
        Not Match
    </button>
</td>
            `;

            tbody.appendChild(row);

        });

    } catch (error) {

        console.error(
            "Error loading match history:",
            error
        );

    }

}
document.addEventListener("click", async function (e) {

    if (!e.target.classList.contains("not-match-btn")) {
        return;
    }

    const historyId = e.target.dataset.historyId;
    const lostId = e.target.dataset.lostId;
    const foundId = e.target.dataset.foundId;

    const response = await fetch(
        "http://127.0.0.1:5000/admin/not-match",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                history_id: historyId,
                lost_id: lostId,
                found_id: foundId
            })
        }
    );

    const data = await response.json();

    alert(data.message);

    if (response.ok) {

        loadMatches();
        loadMatchHistory();

    }

});
document.addEventListener("click", async function (e) {

    if (!e.target.classList.contains("item-returned-btn")) {
        return;
    }

    const historyId = e.target.dataset.historyId;
    const lostId = e.target.dataset.lostId;
    const foundId = e.target.dataset.foundId;

    const response = await fetch(
        "http://127.0.0.1:5000/admin/item-returned",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                history_id: historyId,
                lost_id: lostId,
                found_id: foundId
            })
        }
    );

    const data = await response.json();

    alert(data.message);

    if (response.ok) {
        loadMatchHistory();
    }

});
