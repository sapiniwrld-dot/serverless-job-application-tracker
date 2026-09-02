const addButton = document.getElementById("addButton");
const saveButton = document.getElementById("saveButton");
const clearButton = document.getElementById("clearButton");
const totalCount = document.getElementById("totalCount");
const applicationList = document.getElementById("applicationList");
const savedApplications =
  JSON.parse(localStorage.getItem("applications")) || [];

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

saveToBrowser();
savedApplications.forEach(createApplicationItem);
updateTotal();

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

applicationList.addEventListener("click", function (event) {
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

    application.status = cleanedStatus;
    saveToBrowser();
    window.location.reload();
    return;
  }

  if (!event.target.matches("[data-application-id]")) {
    return;
  }

  const shouldDelete = confirm("Delete this application?");
  if (!shouldDelete) {
    return;
  }

  const applicationIndex = savedApplications.findIndex(
    function (application) {
      return application.id === event.target.dataset.applicationId;
    }
  );

  if (applicationIndex === -1) {
    return;
  }

  savedApplications.splice(applicationIndex, 1);
  saveToBrowser();
  event.target.closest("li").remove();
  updateTotal();
});

saveButton.addEventListener("click", function () {
  const company = document.getElementById("company").value;
  const role = document.getElementById("role").value;
  const status = document.getElementById("status").value;
  const dateApplied = document.getElementById("dateApplied").value;

  if (company === "" || role === "") {
    alert("Please enter both a company and job title.");
    return;
  }

  const newApplication = {
    id: crypto.randomUUID(),
    company,
    role,
    status,
    dateApplied
  };

  savedApplications.push(newApplication);
  createApplicationItem(newApplication);
  saveToBrowser();
  updateTotal();

  document.getElementById("company").value = "";
  document.getElementById("role").value = "";
});

