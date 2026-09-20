const registerForm = document.getElementById("register-form");
const logoutBtn = document.getElementById("logout-btn");
const loginForm = document.getElementById("login-form");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const managementLoginForm = document.getElementById("management-login-form");

const managementLogoutBtn =
    document.getElementById("management-logout-btn");


// ==================== REGISTER ====================

if (registerForm) {

    registerForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {

            const response = await fetch("/register", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message);
                return;
            }

            alert("Registration successful!");

            window.location.href = "student_login.html";

        } catch (error) {

            console.error("Registration error:", error);

            alert("Something went wrong. Please try again.");
        }
    });
}


// ==================== LOGIN ====================

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {

            const response = await fetch("/login", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message);
                return;
            }

            alert("Login successful!");

            window.location.href = "/student/student.html";

        } catch (error) {

            console.error("Login error:", error);

            alert("Something went wrong. Please try again.");
        }
    });
}


// ==================== GOOGLE LOGIN ====================

// Check if backend sent an OAuth error

const params = new URLSearchParams(window.location.search);
const error = params.get("error");

if (error === "google_auth_failed") {

    alert("Google login failed. Please try again.");
}


// Start Google OAuth

if (googleLoginBtn) {

    googleLoginBtn.addEventListener("click", () => {

        googleLoginBtn.disabled = true;

        googleLoginBtn.innerHTML = `
            <span class="google-icon">G</span>
            Connecting...
        `;

        window.location.href = "/auth/google";
    });
}


// ==================== STUDENT LOGOUT ====================

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        try {

            logoutBtn.disabled = true;
            logoutBtn.textContent = "Logging out...";

            const response = await fetch("/logout", {
                method: "POST",
                credentials: "include"
            });

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message || "Logout failed"
                );
            }

            window.location.href =
                "/student/student_login.html";

        } catch (error) {

            console.error("Logout error:", error);

            logoutBtn.disabled = false;
            logoutBtn.textContent = "Logout";

            alert(
                error.message ||
                "Logout failed. Please try again."
            );
        }
    });
}


// ==================== MANAGEMENT LOGIN ====================

if (managementLoginForm) {

    managementLoginForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            const email =
                document
                    .getElementById("management-email")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("management-password")
                    .value;

            const loginButton =
                managementLoginForm.querySelector(
                    'button[type="submit"]'
                );

            try {

                loginButton.disabled = true;
                loginButton.textContent = "Logging in...";

                const response =
                    await fetch("/management/login", {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials: "include",

                        body: JSON.stringify({
                            email,
                            password
                        })
                    });

                const data =
                    await response.json();

                if (!response.ok) {

                    alert(data.message);
                    return;
                }

                alert(
                    "Management login successful!"
                );

                window.location.href =
                    "/management/management.html";

            } catch (error) {

                console.error(
                    "Management login error:",
                    error
                );

                alert(
                    "Something went wrong. Please try again."
                );

            } finally {

                loginButton.disabled = false;
                loginButton.textContent = "Login";
            }
        }
    );
}


// ==================== MANAGEMENT LOGOUT ====================

if (managementLogoutBtn) {

    managementLogoutBtn.addEventListener("click", async () => {

        try {

            managementLogoutBtn.disabled = true;
            managementLogoutBtn.textContent = "Logging out...";

            const response = await fetch("/logout", {
                method: "POST",
                credentials: "include"
            });

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message || "Logout failed"
                );
            }

            window.location.href =
                "/management/managemnt_login.html";

        } catch (error) {

            console.error(
                "Management logout error:",
                error
            );

            managementLogoutBtn.disabled = false;

            managementLogoutBtn.innerHTML = `
                <span>↪</span>
                Logout
            `;

            alert(
                error.message ||
                "Logout failed. Please try again."
            );
        }
    });
}