import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getDatabase,
  ref as dbRef,
  get,
  set,
  remove,
  push,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { firebaseConfig } from "./script.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

const fileInput = document.getElementById("file-input");
const fileNameDisplay = document.getElementById("file-name");
const fileWarning = document.getElementById("file-warning");
const logoutBtn = document.getElementById("logout-btn");
let isLoggingOut = false;
onAuthStateChanged(auth, async (user) => {
  if (user) {
    userEmail.textContent = user.email;
    userUid.textContent = user.uid;

    const snapshot = await get(dbRef(database, `users/${user.uid}`));
    if (snapshot.exists()) {
      const userData = snapshot.val();
      userRegistered.textContent = new Date(
        userData.createdAt
      ).toLocaleString();
    } else {
      userRegistered.textContent = "N/A";
    }
  } else if (!isLoggingOut) {
    alert("Please login first!");
    window.location.href = "login.html";
  }
});
logoutBtn.addEventListener("click", () => {
  isLoggingOut = true;
  signOut(auth)
    .then(() => {
      alert("Logged out successfully!");
      window.location.href = "login.html";
    })
    .catch((err) => {
      alert("Error logging out: " + err.message);
    });
});
fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      fileNameDisplay.textContent = "";
      fileWarning.textContent =
        "File too large! Please upload a file smaller than 10MB.";
      fileInput.value = "";
    } else {
      fileNameDisplay.textContent = file.name;
      fileWarning.textContent = "";
    }
  } else {
    fileWarning.textContent = "No file chosen";
    fileNameDisplay.textContent = "";
  }
});

document.querySelector(".custom-upload").addEventListener("click", (e) => {
  if (
    e.target.tagName !== "LABEL" &&
    e.target.id !== "file-name" &&
    e.target.id !== "file-warning"
  ) {
    fileInput.click();
  }
});

function uploadFile(file) {
  const user = auth.currentUser;
  return new Promise((resolve, reject) => {
    if (!user) {
      reject("Not logged in");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      const base64String = event.target.result;
      const fileMetaRef = dbRef(database, "users/" + user.uid + "/files");

      push(fileMetaRef, {
        name: file.name,
        uploadedAt: new Date().toISOString(),
        content: base64String,
      })
        .then(() => resolve())
        .catch((err) => reject(err));
    };

    reader.onerror = function () {
      reject("Failed to read file");
    };

    reader.readAsDataURL(file);
  });
}

function replaceFile(fileKey, file) {
  const user = auth.currentUser;
  return new Promise((resolve, reject) => {
    if (!user) {
      reject("Not logged in");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      const base64String = event.target.result;
      const fileRef = dbRef(
        database,
        "users/" + user.uid + "/files/" + fileKey
      );

      set(fileRef, {
        name: file.name,
        uploadedAt: new Date().toISOString(),
        content: base64String,
      })
        .then(() => resolve())
        .catch((err) => reject(err));
    };

    reader.onerror = function () {
      reject("Failed to read file");
    };

    reader.readAsDataURL(file);
  });
}

document.getElementById("upload-btn").addEventListener("click", () => {
  const fileInput = document.getElementById("file-input");
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    uploadFile(file)
      .then(() => {
        alert("File uploaded successfully!");
        window.location.reload();
      })
      .catch((err) => {
        console.error(err);
        alert("Upload failed.");
      });
  } else {
    alert("Please select a file to upload!");
  }
});
// Get modal elements
const shareModal = document.getElementById("shareModal");
const sendShareBtn = document.getElementById("sendShareBtn");
const cancelShareBtn = document.getElementsByClassName("cancelShareBtn");
const shareStatus = document.getElementById("shareStatus");

// Cancel button
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("cancelShareBtn")) {
    shareModal.style.display = "none";
    clearModalFields();
  }
});

function clearModalFields() {
  document.getElementById("recipientEmail").value = "";
  document.getElementById("sharePassword").value = "";
  document.getElementById("expiryDate").value = "";
  document.getElementById("linkExpiry").value = "";
  shareStatus.textContent = "";
}
const emailOptionBtn = document.getElementById("emailOptionBtn");
const linkOptionBtn = document.getElementById("linkOptionBtn");
const emailForm = document.getElementById("emailForm");
const linkForm = document.getElementById("linkForm");
function resetModalState() {
  emailForm.style.display = "none";
  linkForm.style.display = "none";

  // Remove active class from both buttons
  emailOptionBtn.classList.remove("active");
  linkOptionBtn.classList.remove("active");
}
function openShareModal(fileKey) {
  resetModalState();
  shareModal.style.display = "flex";
  shareModal.dataset.fileKey = fileKey;
}

emailOptionBtn.onclick = () => {
  emailOptionBtn.classList.add("active");
  linkOptionBtn.classList.remove("active");
  emailForm.style.display = "block";
  linkForm.style.display = "none";
};
linkOptionBtn.onclick = () => {
  linkOptionBtn.classList.add("active");
  emailOptionBtn.classList.remove("active");
  linkForm.style.display = "block";
  emailForm.style.display = "none";
};

// Send Share button
sendShareBtn.onclick = () => {
  const recipientEmail = document.getElementById("recipientEmail").value;
  const password = document.getElementById("sharePassword").value;
  const expiryDate = document.getElementById("expiryDate").value;
  const fileKey = shareModal.dataset.fileKey;

  if (!recipientEmail || !password) {
    shareStatus.style.color = "red";
    shareStatus.textContent = "Recipient email and password are required.";
    return;
  }

  // Call backend API to share file
  const user = auth.currentUser;
  console.log("ownerUid:", user.uid);
  console.log("fileKey:", fileKey);
  console.log("recipientEmail", recipientEmail);
  console.log("password", password);
  fetch(`${import.meta.env.VITE_BACKEND_BASEURL}/share-file`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ownerUid: user.uid,
      fileKey,
      recipientEmail,
      password,
      expiresAt: expiryDate ? new Date(expiryDate).getTime() : null,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        shareStatus.style.color = "green";
        shareStatus.textContent = "Link sent successfully!";
        setTimeout(() => {
          shareModal.style.display = "none";
          clearModalFields();
        }, 1500);
      } else {
        shareStatus.style.color = "red";
        shareStatus.textContent = "Failed to share: " + data.error;
      }
    })
    .catch((err) => {
      console.error(err);
      shareStatus.style.color = "red";
      shareStatus.textContent = "Error sharing file.";
    });
};

document.getElementById("generateLinkBtn").onclick = async () => {
  const password = document.getElementById("linkPassword").value.trim();
  const expiry = document.getElementById("linkExpiry").value;
  const fileKey = shareModal.dataset.fileKey;
  const user = auth.currentUser;
  if (!password) {
    alert("Password is required.");
    return;
  }

  const payload = {
    ownerUid: user.uid,
    fileKey,
    password,
    expiresAt: expiry ? new Date(expiry).getTime() : null,
  };
  const env = import.meta.env;
  const baseurl = import.meta.env.VITE_BACKEND_BASEURL;

  console.log("env", baseurl);
  try {
    const response = await fetch(`${baseurl}/generate-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (result.success) {
      const shareLink = result.link;

      // Show link in UI
      const linkContainer = document.getElementById("linkContainer");
      linkContainer.style.display = "block";
      document.getElementById("generatedLink").value = shareLink;

      // Copy button
      document.getElementById("copyLinkBtn").onclick = () => {
        const linkInput = document.getElementById("generatedLink");
        linkInput.select();
        document.execCommand("copy");
        alert("Link copied to clipboard!");
      };
    } else {
      alert("Failed to generate link.");
    }
  } catch (err) {
    console.error(err);
    alert("Error while generating link.");
  }
};
// Show files
const fileListContainer = document.getElementById("file-list");

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById(
      "welcome-text"
    ).innerText = `Welcome, ${user.email}`;

    const userFilesRef = dbRef(database, "users/" + user.uid + "/files");
    get(userFilesRef).then((snapshot) => {
      if (snapshot.exists()) {
        const files = snapshot.val();
        fileListContainer.innerHTML = "<h3>Your Uploaded Files:</h3>";

        Object.keys(files).forEach((fileKey) => {
          const fileData = files[fileKey];

          const fileDiv = document.createElement("div");
          fileDiv.style.margin = "10px 0";

          const fileName = document.createElement("span");
          fileName.textContent = ` ${fileData.name}`;
          fileName.style.marginRight = "10px";

          // File link
          const fileLink = document.createElement("a");
          fileLink.href = fileData.content;
          fileLink.download = fileData.name;
          //   fileLink.textContent = ` ${fileData.name}`;
          fileLink.style.marginRight = "10px";
          fileLink.textContent = "Download";
          fileLink.style.display = "inline-block";
          fileLink.style.padding = "5px 1px";
          fileLink.style.textAlign = "center";
          fileLink.style.backgroundColor = "#007bff";
          fileLink.style.color = "#fff";
          fileLink.style.border = "none";
          fileLink.style.borderRadius = "4px";
          fileLink.style.textDecoration = "none";
          fileLink.style.marginRight = "5px";
          fileLink.style.cursor = "pointer";

          // Replace button
          const replaceBtn = document.createElement("button");
          replaceBtn.textContent = "Replace";
          replaceBtn.style.marginRight = "5px";
          replaceBtn.onclick = () => {
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "*/*";
            fileInput.onchange = () => {
              if (fileInput.files.length > 0) {
                const newFile = fileInput.files[0];
                replaceFile(fileKey, newFile)
                  .then(() => {
                    alert("File replaced successfully!");
                    window.location.reload();
                  })
                  .catch((err) => {
                    console.error(err);
                    alert("Failed to replace file.");
                  });
              }
            };
            fileInput.click();
          };

          // Delete button
          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "Delete";
          deleteBtn.onclick = () => {
            const fileRef = dbRef(
              database,
              "users/" + user.uid + "/files/" + fileKey
            );
            remove(fileRef).then(() => {
              alert("File deleted!");
              window.location.reload();
            });
          };

          // Share button
          const shareBtn = document.createElement("button");
          shareBtn.textContent = "Share";
          shareBtn.style.marginRight = "5px";
          shareBtn.onclick = () => {
            // Open modal
            document.getElementById("shareModal").style.display = "flex";

            // Save current file details in modal dataset
            document.getElementById("shareModal").dataset.fileKey = fileKey;
          };

          fileDiv.appendChild(fileName);
          fileDiv.appendChild(fileLink);
          fileDiv.appendChild(replaceBtn);
          fileDiv.appendChild(deleteBtn);
          fileDiv.appendChild(shareBtn);

          fileListContainer.appendChild(fileDiv);
        });
      } else {
        fileListContainer.innerHTML = "<p>No files found.</p>";
      }
    });
  } else {
    window.location.href = "login.html";
  }
});
