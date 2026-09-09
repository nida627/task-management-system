/* =========================================================
   FRONTEND AUTH CHECK
========================================================= */
const token = localStorage.getItem("access_token");
// Login/Register page par already logged-in user
if (
    (document.getElementById("loginForm") ||
     document.getElementById("registerForm")) &&
    token
) {
    window.location.href = "/dashboard";
}
// Protected pages must be have a token otherwise redirect on login 
if (
    (document.getElementById("tasksContainer") ||
     document.getElementById("taskForm")) &&
    !token
) {
    window.location.href = "/login";
}

/* =========================================================
   REGISTER
========================================================= */
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const message = document.getElementById("registerMessage");

        try {
            const response = await fetch("/api/auth/register", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })

            });
            const data = await response.json();
            if (response.ok) {

                message.textContent =
                    data.message || "Registration successful!";

                registerForm.reset();

                setTimeout(() => {

                    window.location.href = "/login";

                }, 1000);

            } else {

                message.textContent =
                    data.error || "Registration failed.";
            }

        } catch (error) {

            console.error(error);

            message.textContent =
                "Something went wrong.";
        }

    });

}
/* =========================================================
   LOGIN
========================================================= */
const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const message =
            document.getElementById("loginMessage");

        try {

            const response = await fetch("/api/auth/login", {

                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {

                localStorage.setItem(
                    "access_token",
                    data.access_token
                );

                message.textContent =
                    "Login successful!";

                setTimeout(() => {

                    window.location.href =
                        "/dashboard";

                }, 500);

            } else {

                message.textContent =
                    data.error || "Login failed.";

            }

        } catch (error) {

            console.error(error);

            message.textContent =
                "Something went wrong.";
        }

    });

}
/* =========================================================
   AUTH CHECK FOR LOGIN PAGE
========================================================= */
if (document.getElementById("loginForm")) {
    const token = localStorage.getItem("access_token");
    if (token) {
        window.location.href = "/dashboard";
    }
}

/* =========================================================
   DASHBOARD
========================================================= */
const tasksContainer =
    document.getElementById("tasksContainer");

if (tasksContainer) {

    const token =
        localStorage.getItem("access_token");

    /* -----------------------------------------------------
       Check Login
    ----------------------------------------------------- */
    if (!token) {
        window.location.href = "/login";
    } else {

        /* -------------------------------------------------
           LOAD TASKS
        ------------------------------------------------- */
        async function loadTasks() {

            const searchInput =
                document.getElementById("searchInput");

            const statusFilter =
                document.getElementById("statusFilter");

            const priorityFilter =
                document.getElementById("priorityFilter");

            const search = searchInput
                ? searchInput.value.trim()
                : "";

            const status = statusFilter
                ? statusFilter.value
                : "";

            const priority = priorityFilter
                ? priorityFilter.value
                : "";

            const params =
                new URLSearchParams();

            if (search) {

                params.append(
                    "search",
                    search
                );

            }
            if (status) {

                params.append(
                    "status",
                    status
                );

            }

            if (priority) {

                params.append(
                    "priority",
                    priority
                );

            }

            let url = "/api/tasks";

            if (params.toString()) {
                url += "?" + params.toString();

            }

            try {

                const response =
                    await fetch(url, {
                        method: "GET",
                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }

                    });
                /* -----------------------------------------
                   Unauthorized
                ----------------------------------------- */
                if (response.status === 401) {

                    localStorage.removeItem(
                        "access_token"
                    );

                    window.location.href =
                        "/login";

                    return;
                }

                const data =
                    await response.json();
                if (!response.ok) {

                    tasksContainer.innerHTML =
                        `<p>${data.error || "Unable to load tasks."}</p>`;
                    return;

                }

                displayTasks(
                    data.tasks || []
                );

                updateStats(
                    data.tasks || []
                );

            } catch (error) {
                console.error(error);

                tasksContainer.innerHTML =
                    "<p>Unable to load tasks.</p>";
            }

        }
        /* -------------------------------------------------
           DISPLAY TASKS
        ------------------------------------------------- */
        function displayTasks(tasks) {

            tasksContainer.innerHTML = "";

            if (tasks.length === 0) {

                tasksContainer.innerHTML =
                    "<p>No tasks found.</p>";

                return;
            }

            tasks.forEach(task => {

                const taskCard =
                    document.createElement("div");

                taskCard.className =
                    "task-card";

                taskCard.innerHTML = `

                    <h3>
                        ${task.title}
                    </h3>

                    <p>
                        ${task.description || "No description"}
                    </p>
                    <div class="task-meta">

                        <span class="badge">
                            Status: ${task.status}
                        </span>

                        <span class="badge">
                            Priority: ${task.priority}
                        </span>

                        <span class="badge">
                            Due: ${task.due_date || "No due date"}
                        </span>
                    </div>

                    <div class="task-actions">
                        <button
                            type="button"
                            onclick="editTask(${task.id})"
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            onclick="deleteTask(${task.id})"
                        >
                            Delete
                        </button>
                    </div>
                `;

                tasksContainer.appendChild(
                    taskCard
                );

            });

        }


        /* -------------------------------------------------
           UPDATE TASKS
        ------------------------------------------------- */

        function updateStats(tasks) {

            const total =
                tasks.length;

            const pending =
                tasks.filter(
                    task =>
                        task.status === "pending"
                ).length;

            const inProgress =
                tasks.filter(
                    task =>
                        task.status === "in_progress"
                ).length;

            const completed =
                tasks.filter(
                    task =>
                        task.status === "completed"
                ).length;

            const highPriority =
                tasks.filter(
                    task =>
                        task.priority === "high"
                ).length;

            const totalTasks =
                document.getElementById(
                    "totalTasks"
                );

            const pendingTasks =
                document.getElementById(
                    "pendingTasks"
                );

            const inProgressTasks =
                document.getElementById(
                    "inProgressTasks"
                );

            const completedTasks =
                document.getElementById(
                    "completedTasks"
                );

            const highPriorityTasks =
                document.getElementById(
                    "highPriorityTasks"
                );

            if (totalTasks) {

                totalTasks.textContent =
                    total;

            }

            if (pendingTasks) {

                pendingTasks.textContent =
                    pending;

            }

            if (inProgressTasks) {

                inProgressTasks.textContent =
                    inProgress;

            }

            if (completedTasks) {

                completedTasks.textContent =
                    completed;

            }

            if (highPriorityTasks) {

                highPriorityTasks.textContent =
                    highPriority;

            }

        }

        /* -------------------------------------------------
           FILTER BUTTON
        ------------------------------------------------- */

        const filterBtn =
            document.getElementById(
                "filterBtn"
            );


        if (filterBtn) {

            filterBtn.addEventListener(
                "click",
                loadTasks
            );

        }


        /* -------------------------------------------------
           LOGOUT
        ------------------------------------------------- */

        const logoutBtn =
            document.getElementById(
                "logoutBtn"
            );


        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                function () {

                    localStorage.removeItem(
                        "access_token"
                    );

                    window.location.href =
                        "/login";

                }
            );

        }


        /* -------------------------------------------------
           CREATE TASK BUTTON
        ------------------------------------------------- */

        const createTaskBtn =
            document.getElementById(
                "createTaskBtn"
            );


        if (createTaskBtn) {

            createTaskBtn.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "/tasks/create";

                }
            );

        }


        /* -------------------------------------------------
           DELETE TASK
        ------------------------------------------------- */
/* =========================================================
   DELETE TASK
========================================================= */

window.deleteTask = async function(taskId) {

    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "/login";
        return;
    }

    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    try {

        const response = await fetch(`/api/tasks/${taskId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            localStorage.removeItem("access_token");
            window.location.href = "/login";
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Failed to delete task");
            return;
        }

        alert("Task deleted successfully");

        window.location.reload();

    } catch (error) {

        console.error("Delete error:", error);
        alert("Something went wrong while deleting the task");

    }
};

        /* -------------------------------------------------
           INITIAL LOAD
        ------------------------------------------------- */

        loadTasks();

    }

}

/* =========================================================
   CREATE / EDIT TASK FORM
========================================================= */

const taskForm =
    document.getElementById("taskForm");


if (taskForm) {

    const taskIdInput = document.getElementById("taskId");

    /*
       If taskId exists, this is EDIT page.
       Otherwise, this is CREATE page.
    */
    
    const isEditPage = taskIdInput && taskIdInput.value;
    

    /* -----------------------------------------------------
       TOKEN
    ----------------------------------------------------- */

    const token =
        localStorage.getItem(
            "access_token"
        );

    if (!token) {

        window.location.href =
            "/login";

    } else {

        /* -------------------------------------------------
           LOAD TASK FOR EDIT
        ------------------------------------------------- */

        async function loadTaskForEdit() {

            const taskId =
                taskIdInput.value;


            if (!taskId) {

                return;

            }

            try {

                const response =
                    await fetch(
                        `/api/tasks/${taskId}`,
                        {

                            method: "GET",

                            headers: {

                                "Authorization":
                                    `Bearer ${token}`

                            }

                        }
                    );

                if (response.status === 401) {

                    localStorage.removeItem(
                        "access_token"
                    );

                    window.location.href =
                        "/login";

                    return;

                }

                const data =
                    await response.json();

                if (!response.ok) {

                    alert(
                        data.error ||
                        "Unable to load task."
                    );

                    window.location.href =
                        "/dashboard";

                    return;

                }

                const task =
                    data.task;

                const titleInput =
                    document.getElementById(
                        "title"
                    );

                const descriptionInput =
                    document.getElementById(
                        "description"
                    );

                const statusInput =
                    document.getElementById(
                        "status"
                    );

                const priorityInput =
                    document.getElementById(
                        "priority"
                    );

                const dueDateInput =
                    document.getElementById(
                        "due_date"
                    );

                if (titleInput) {

                    titleInput.value =
                        task.title || "";

                }

                if (descriptionInput) {

                    descriptionInput.value =
                        task.description || "";
                }

                if (statusInput) {

                    statusInput.value =
                        task.status || "pending";

                }

                if (priorityInput) {
                    priorityInput.value =
                        task.priority || "medium";
                }
                if (dueDateInput) {

                    dueDateInput.value = task.due_date
                        ? task.due_date.slice(0, 16)
                            : "";
                }
            } catch (error) {

                console.error(error);

                alert(
                    "Unable to load task."
                );

            }

        }

        /* -------------------------------------------------
           CREATE / UPDATE SUBMIT
        ------------------------------------------------- */
        taskForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const title =
                    document
                        .getElementById("title")
                        .value
                        .trim();
                const description =
                    document
                        .getElementById("description")
                        .value
                        .trim();

                const status =
                    document
                        .getElementById("status")
                        .value;

                const priority =
                    document
                        .getElementById("priority")
                        .value;

                const dueDate =
                    document
                        .getElementById("due_date")
                        .value;

                const taskData = {
                    title: title,
                    description: description,
                    status: status,
                    priority: priority,
                    due_date: dueDate || null
                };

                const message =
                    document.getElementById(
                        "taskMessage"
                    );

                try {

                    let url =
                        "/api/tasks";

                    let method =
                        "POST";

                    /*                      CREATE                   */

                    if (isEditPage) {

                        const taskId =
                            taskIdInput.value;

                        /*                          UPDATE                       */

                        url =
                            `/api/tasks/${taskId}`;

                        method =
                            "PUT";

                    }

                    const response =
                        await fetch(
                            url,
                            {

                                method: method,
                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        `Bearer ${token}`

                                },

                                body:
                                    JSON.stringify(
                                        taskData
                                    )

                            }
                        );

                    if (response.status === 401) {

                        localStorage.removeItem(
                            "access_token"
                        );

                        window.location.href =
                            "/login";

                        return;

                    }

                    const data =
                        await response.json();

                    if (response.ok) {

                        if (message) {

                            message.textContent =
                                data.message ||
                                (
                                    isEditPage
                                        ? "Task updated successfully!"
                                        : "Task created successfully!"
                                );

                        }

                        if (!isEditPage) {
                            taskForm.reset();

                        }

                        setTimeout(() => {

                            window.location.href =
                                "/dashboard";

                        }, 700);


                    } else {

                        if (message) {

                            message.textContent =
                                data.error ||
                                "Unable to save task.";

                        }

                    }

                } catch (error) {

                    console.error(error);

                    if (message) {

                        message.textContent =
                            "Something went wrong.";

                    }

                }

            }
        );

        /* -------------------------------------------------
           LOAD EDIT TASK
        ------------------------------------------------- */

        if (isEditPage) {

            loadTaskForEdit();
        }
    }
}
/* =========================================================
   EDIT TASK REDIRECT
========================================================= */

function editTask(taskId) {

    window.location.href =
        `/tasks/edit/${taskId}`;

}