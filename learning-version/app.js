const API_URL = window.APP_CONFIG.API_URL;
const addButton = document.getElementById("addButton");
const saveButton = document.getElementById("saveButton");
const clearButton = document.getElementById("clearButton");
const totalCount = document.getElementById("totalCount");
const applicationList = document.getElementById("applicationList");
let savedApplications = [];
savedApplications.forEach(function (application) {
  if (!application.id) {
    application.id = crypto.randomUUID();
  }
});

function saveToBrowser() {
  localStorage.setItem(
    "applications",
    JSON.stringify(savedApplications)
  );
}

function updateTotal() {
  totalCount.textContent =
    savedApplications.length + " applications tracked";
}

async function loadApplicationsFromApi() {
  try {
    const response = await fetch(API_URL + "/applications");

    if (!response.ok) {
      throw new Error("Could not load applications");
    }

    const data = await response.json();

    savedApplications = data.applications.map(function (application) {
      return {
        ...application,
        id: application.applicationId
      };
    });

    applicationList.innerHTML = "";
    savedApplications.forEach(createApplicationItem);
    updateTotal();
  } catch (error) {
    console.error(error);
    alert("Could not connect to the AWS API.");
  }
}

function createApplicationItem(application) {
  const item = document.createElement("li");
  const details = document.createElement("span");
  details.textContent =
    application.company + " — " +
    application.role + " — " +
    application.status + " — " +
    (application.dateApplied || "No date");

  const editButton = document.createElement("button");
  editButton.textContent = "Edit Status";
  editButton.dataset.editId = application.id;

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.dataset.applicationId = application.id;

  item.appendChild(details);
  item.appendChild(editButton);
  item.appendChild(deleteButton);
  applicationList.appendChild(item);
}

loadApplicationsFromApi();

addButton.addEventListener("click", function () {
  document.getElementById("company").focus();
});

clearButton.addEventListener("click", function () {
  const shouldClear = confirm("Delete all saved applications?");

  if (!shouldClear) {
    return;
  }

  savedApplications.length = 0;
  localStorage.removeItem("applications");
  applicationList.innerHTML = "";
  updateTotal();
});

applicationList.addEventListener("click", async function (event) {
  if (event.target.matches("[data-edit-id]")) {
    const application = savedApplications.find(
      function (savedApplication) {
        return savedApplication.id === event.target.dataset.editId;
      }
    );

    if (!application) {
      return;
    }

    const newStatus = prompt(
      "Enter Saved, Applied, Interview, Offer, or Rejected:",
      application.status
    );
    const allowedStatuses = [
      "Saved", "Applied", "Interview", "Offer", "Rejected"
    ];

    if (newStatus === null) {
      return;
    }

    const cleanedStatus = newStatus.trim();
    if (!allowedStatuses.includes(cleanedStatus)) {
      alert("Please enter one of the listed statuses exactly.");
      return;
    }

    try {
      const response = await fetch(
        API_URL + "/applications/" + application.id,
        {
          method: "PUT",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            status: cleanedStatus
          })
        }
      );

      if (!response.ok) {
        throw new Error("AWS could not update the status");
      }

      await loadApplicationsFromApi();
    } catch (error) {
      console.error(error);
      alert("The status could not be updated in AWS.");
    }

    return;
  }

  if (!event.target.matches("[data-application-id]")) {
    return;
  }

  const shouldDelete = confirm("Delete this application?");
  if (!shouldDelete) {
    return;
  }

  const applicationId = event.target.dataset.applicationId;

  try {
    const response = await fetch(
      API_URL + "/applications/" + applicationId,
      {
        method: "DELETE"
      }
    );

    if (!response.ok) {
      throw new Error("AWS could not delete the application");
    }

    savedApplications = savedApplications.filter(function (application) {
      return application.id !== applicationId;
    });
    saveToBrowser();
    applicationList.innerHTML = "";
    savedApplications.forEach(createApplicationItem);
    updateTotal();
  } catch (error) {
    console.error(error);
    alert("The application could not be deleted from AWS.");
  }
});

saveButton.addEventListener("click", async function () {
  const company = document.getElementById("company").value;
  const role = document.getElementById("role").value;
  const status = document.getElementById("status").value;
  const dateApplied = document.getElementById("dateApplied").value;

  if (company === "" || role === "") {
    alert("Please enter both a company and job title.");
    return;
  }

  const newApplication = {
    company,
    role,
    status,
    dateApplied
  };

  try {
    const response = await fetch(API_URL + "/applications", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(newApplication)
    });

    if (!response.ok) {
      throw new Error("AWS could not save the application");
    }

    document.getElementById("company").value = "";
    document.getElementById("role").value = "";

    await loadApplicationsFromApi();
  } catch (error) {
    console.error(error);
    alert("The application could not be saved to AWS.");
  }
});
