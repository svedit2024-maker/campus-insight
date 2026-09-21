
// =========================
// MANAGEMENT DASHBOARD
// =========================

const totalIssues = document.getElementById("total-issues");
const pendingIssues = document.getElementById("pending-issues");
const progressIssues = document.getElementById("progress-issues");
const resolvedIssues = document.getElementById("resolved-issues");

const issuesTable = document.getElementById("issues-table");

const searchInput = document.getElementById("issue-search");
const statusFilter = document.getElementById("status-filter");
const categoryFilter = document.getElementById("category-filter");


const issueDetails = document.getElementById("issue-details");
const issueStatus = document.getElementById("issue-status");
const managementResponse = document.getElementById("management-response");
const updateIssueBtn = document.getElementById("update-issue");

let allIssues = [];
let selectedIssueId = null;


// =========================
// CHECK MANAGEMENT SESSION
// =========================

async function checkManagementSession() {
    try {
        const response = await fetch("/management/check", {
            credentials: "include"
        });

        if (!response.ok) {
            window.location.href = "/management/management_login.html";
            return false;
        }

        return true;

    } catch (error) {
        console.error("Management session error:", error);

        window.location.href = "/management/management_login.html";

        return false;
    }
}


// =========================
// LOAD STATISTICS
// =========================

async function loadStatistics() {
    try {
        const response = await fetch("/management/stats", {
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load statistics");
        }

        totalIssues.textContent = data.total;
        pendingIssues.textContent = data.pending;
        progressIssues.textContent = data.inProgress;
        resolvedIssues.textContent = data.resolved;

    } catch (error) {
        console.error("Statistics error:", error);
    }
}


// =========================
// LOAD ISSUES
// =========================

async function loadIssues() {
    try {
        const response = await fetch("/management/issues", {
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load issues");
        }

        allIssues = data.issues;

        displayIssues(allIssues);

    } catch (error) {
        console.error("Issues loading error:", error);

        issuesTable.innerHTML = `
            <tr>
                <td colspan="7">
                    Failed to load issues
                </td>
            </tr>
        `;
    }
}


// =========================
// DISPLAY ISSUES
// =========================

function displayIssues(issues) {

    issuesTable.innerHTML = "";

    if (issues.length === 0) {
        issuesTable.innerHTML = `
            <tr>
                <td colspan="7">
                    No issues found
                </td>
            </tr>
        `;

        return;
    }

    issues.forEach(issue => {

        const row = document.createElement("tr");

        const date = new Date(issue.createdAt).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

        let statusClass = "";

        if (issue.status === "Pending") {
            statusClass = "pending-status";
        } 
        else if (issue.status === "In Progress") {
            statusClass = "progress-status";
        } 
        else if (issue.status === "Resolved") {
            statusClass = "resolved-status";
        }

        row.innerHTML = `
            <td>
                <div class="issue-name">

                    <div class="issue-image">
                        ${
                            issue.photo
                            ? `<img src="${issue.photo}" 
                                style="width:100%;height:100%;object-fit:cover;border-radius:7px;">`
                            : "🖼"
                        }
                    </div>

                    <div>
                        <strong>${issue.category}</strong>
                        <small>#${issue._id.slice(-6)}</small>
                    </div>

                </div>
            </td>

            <td>
                <span class="category">
                    ${issue.category}
                </span>
            </td>

            <td>
                ${issue.location}
            </td>

            <td>
                ${issue.userId?.name || "Student"}
            </td>

            <td>
                ${date}
            </td>

            <td>
                <span class="status ${statusClass}">
                    ${issue.status}
                </span>
            </td>

            <td>
                <button 
                    class="view-btn"
                    data-id="${issue._id}">
                    View
                </button>
            </td>
        `;

        issuesTable.appendChild(row);
    });
}


// =========================
// VIEW ISSUE
// =========================

issuesTable.addEventListener("click", (event) => {

    if (!event.target.classList.contains("view-btn")) {
        return;
    }

    const issueId = event.target.dataset.id;

    const issue = allIssues.find(
        item => item._id === issueId
    );

    if (!issue) {
        return;
    }

    showIssueDetails(issue);
});


function showIssueDetails(issue) {

    selectedIssueId = issue._id;

    const detailsTitle = issueDetails.querySelector(".details-header h2");
    const detailsId = issueDetails.querySelector(".issue-id");

    const detailValues = issueDetails.querySelectorAll(
        ".info-row strong"
    );

    const description = issueDetails.querySelector(
        ".description p"
    );

    const detailsImage = issueDetails.querySelector(
        ".details-image"
    );

    detailsTitle.textContent = issue.category;

    detailsId.textContent = `#${issue._id}`;

    detailValues[0].textContent = issue.category;
    detailValues[1].textContent = issue.location;

    detailValues[2].textContent =
        issue.userId?.name || "Student";

    detailValues[3].textContent =
        new Date(issue.createdAt).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    description.textContent = issue.description;

    if (issue.photo) {
        detailsImage.innerHTML = `
            <img
                src="${issue.photo}"
                style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    border-radius:10px;
                "
            >
        `;
    } else {
        detailsImage.innerHTML = `
            <span>No Image</span>
        `;
    }

    issueStatus.value = issue.status;

    managementResponse.value =
        issue.managementResponse || "";

    issueDetails.scrollIntoView({
        behavior: "smooth"
    });
}


// =========================
// UPDATE ISSUE
// =========================

updateIssueBtn.addEventListener("click", async () => {

    if (!selectedIssueId) {
        alert("Select an issue first.");
        return;
    }

    const status = issueStatus.value;

    const responseText = managementResponse.value;

    try {

        const response = await fetch(
            `/management/issues/${selectedIssueId}`,
            {
                method: "PATCH",

                credentials: "include",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status: convertStatus(status),
                    managementResponse: responseText
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to update issue"
            );
        }

        alert("Issue updated successfully!");

        await loadStatistics();

        await loadIssues();

        const updatedIssue = allIssues.find(
            issue => issue._id === selectedIssueId
        );

        if (updatedIssue) {
            showIssueDetails(updatedIssue);
        }

    } catch (error) {

        console.error("Update issue error:", error);

        alert(error.message);
    }
});


// =========================
// STATUS CONVERSION
// =========================

function convertStatus(status) {

    if (status === "pending") {
        return "Pending";
    }

    if (status === "progress") {
        return "In Progress";
    }

    if (status === "resolved") {
        return "Resolved";
    }

    return status;
}


// =========================
// SEARCH
// =========================

searchInput.addEventListener("input", filterIssues);

statusFilter.addEventListener("change", filterIssues);

categoryFilter.addEventListener("change", filterIssues);


function filterIssues() {

    const searchValue =
        searchInput.value.toLowerCase().trim();

    const selectedStatus =
        statusFilter.value;

    const selectedCategory =
        categoryFilter.value;

    const filtered = allIssues.filter(issue => {

        const searchMatch =
            issue.category.toLowerCase().includes(searchValue) ||
            issue.location.toLowerCase().includes(searchValue) ||
            (issue.userId?.name || "")
                .toLowerCase()
                .includes(searchValue);

        let statusMatch = true;

        if (selectedStatus !== "all") {

            statusMatch =
                convertStatus(selectedStatus) === issue.status;
        }

        let categoryMatch = true;

        if (selectedCategory !== "all") {

            categoryMatch =
                issue.category.toLowerCase() ===
                selectedCategory.toLowerCase();
        }

        return (
            searchMatch &&
            statusMatch &&
            categoryMatch
        );
    });

    displayIssues(filtered);
}



// =========================
// START DASHBOARD
// =========================

async function startDashboard() {

    const authenticated =
        await checkManagementSession();

    if (!authenticated) {
        return;
    }

    await loadStatistics();

    await loadIssues();
}

startDashboard();
