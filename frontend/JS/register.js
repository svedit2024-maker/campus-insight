const registerForm = document.getElementById("register-form");

const loginForm = document.getElementById("login-form");
if(registerForm) {
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
        alert("Something went wrong");
    }
});}
if(loginForm) {

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

        window.location.href = "student.html";

    } catch (error) {
        console.error("Login error:", error);
        alert("Something went wrong");
    }
});}