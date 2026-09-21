let allIssues = [];

async function loadAllIssues() {
    try {
        const response = await fetch("/management/all-issues", {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to load issues");
        }

        allIssues = data.issues || [];

        console.log("Issues:", allIssues);

        displayIssues(allIssues);

    } catch (error) {
        console.error("Failed to load issues:", error);
    }
}


function displayIssues(issues) {

    const table = document.getElementById("issues-table");
    const emptyState = document.getElementById("empty-state");
    const issueCount = document.getElementById("issue-count");

    if (!table) return;

    table.innerHTML = "";

    // Update issue count
    if (issueCount) {
        issueCount.textContent = `${issues.length} Issues`;
    }

    // No issues
    if (issues.length === 0) {

        if (emptyState) {
            emptyState.style.display = "block";
        }

        return;
    }

    if (emptyState) {
        emptyState.style.display = "none";
    }


    issues.forEach(issue => {

        console.log("IMAGE URL:", issue.photoUrl);

        const row = document.createElement("tr");


        // =========================
        // IMAGE
        // =========================

        let imageHTML = "";

        if (issue.photoUrl) {

            imageHTML = `
                <div class="issue-image">
                    <img
                        src="${issue.photoUrl}"
                        alt="Issue Image"
                        width="70"
                        height="70"
                        loading="lazy"
                        style="
                            width: 70px;
                            height: 70px;
                            object-fit: cover;
                            border-radius: 8px;
                            display: block;
                        "
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                    >

                    <span style="display:none;">
                        📷
                    </span>
                </div>
            `;

        } else {

            imageHTML = `
                <div class="issue-image">
                    <span>📷</span>
                </div>
            `;
        }


        // =========================
        // ROW
        // =========================

        row.innerHTML = `

            <!-- Issue -->
            <td>
                <div class="issue-name">

                    ${imageHTML}

                    <div>
                        <strong>
                            ${issue.description || "Reported Issue"}
                        </strong>

                        <small>
                            ${issue._id}
                        </small>
                    </div>

                </div>
            </td>


            <!-- Category -->
            <td>
                <span class="category">
                    ${issue.category || "-"}
                </span>
            </td>


            <!-- Location -->
            <td>
                ${issue.location || "-"}
            </td>


            <!-- Reported By -->
            <td>
                <strong>
                    ${issue.userId?.name || "Unknown Student"}
                </strong>

                <br>

                <small>
                    ${issue.userId?.email || ""}
                </small>
            </td>


            <!-- Date -->
            <td>
                ${
                    issue.createdAt
                        ? new Date(issue.createdAt)
                            .toLocaleDateString("en-IN")
                        : "-"
                }
            </td>


            <!-- Status -->
            <td>
                <span class="status ${
                    issue.status === "Pending"
                        ? "pending-status"
                        : issue.status === "In Progress"
                            ? "progress-status"
                            : issue.status === "Resolved"
                                ? "resolved-status"
                                : ""
                }">
                    ${issue.status || "Pending"}
                </span>
            </td>

        `;


        table.appendChild(row);

    });
}


// ===============================
// SEARCH
// ===============================

document
    .getElementById("issue-search")
    ?.addEventListener("input", function () {

        const value = this.value.toLowerCase().trim();

        const filtered = allIssues.filter(issue => {

            return (
                issue.description
                    ?.toLowerCase()
                    .includes(value) ||

                issue.category
                    ?.toLowerCase()
                    .includes(value) ||

                issue.location
                    ?.toLowerCase()
                    .includes(value) ||

                issue.userId?.name
                    ?.toLowerCase()
                    .includes(value) ||

                issue.userId?.email
                    ?.toLowerCase()
                    .includes(value)
            );

        });

        displayIssues(filtered);

    });


// ===============================
// STATUS FILTER
// ===============================

document
    .getElementById("status-filter")
    ?.addEventListener("change", function () {

        const value = this.value;

        if (value === "all") {
            displayIssues(allIssues);
            return;
        }


        const statusMap = {
            pending: "Pending",
            progress: "In Progress",
            resolved: "Resolved"
        };


        const filtered = allIssues.filter(
            issue => issue.status === statusMap[value]
        );


        displayIssues(filtered);

    });


// ===============================
// CATEGORY FILTER
// ===============================

document
    .getElementById("category-filter")
    ?.addEventListener("change", function () {

        const value = this.value;

        if (value === "all") {
            displayIssues(allIssues);
            return;
        }


        const filtered = allIssues.filter(
            issue => issue.category === value
        );


        displayIssues(filtered);

    });


// ===============================
// LOAD PAGE
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    const table = document.getElementById("issues-table");

    if (table) {
        loadAllIssues();
    }

});