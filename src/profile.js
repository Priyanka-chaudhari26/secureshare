import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getDatabase,
  ref as dbRef,
  get,
  remove,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { firebaseConfig } from "../src/script.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

const userEmail = document.getElementById("user-email");
const userUid = document.getElementById("user-uid");
const userRegistered = document.getElementById("user-registered");
const logoutBtn = document.getElementById("logout-btn");
const changePasswordBtn = document.getElementById("change-password-btn");
const deleteBtn = document.getElementById("delete-account-btn");

const modal = document.getElementById("changePasswordModal");
const closeModalBtn = document.getElementById("close-modal-btn");
const updatePasswordBtn = document.getElementById("update-password-btn");

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

changePasswordBtn.addEventListener("click", () => {
  modal.style.display = "block";
});

closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

updatePasswordBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  const currentPassword = document.getElementById("current-password").value;
  const newPassword = document.getElementById("new-password").value;
  const confirmNewPassword = document.getElementById(
    "confirm-new-password"
  ).value;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    alert("Please fill in all fields.");
    return;
  }

  if (newPassword !== confirmNewPassword) {
    alert("New passwords do not match.");
    return;
  }

  try {
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    alert("Password updated successfully!");
    modal.style.display = "none";
  } catch (err) {
    console.error(err);
    alert("Error updating password: " + err.message);
  }
});

deleteBtn.addEventListener("click", async () => {
  if (
    confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    )
  ) {
    const user = auth.currentUser;

    if (user) {
      try {
        const password = prompt(
          "Please re-enter your password to confirm deletion:"
        );
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);

        await remove(dbRef(database, `users/${user.uid}`));
        await deleteUser(user);

        alert("Account deleted successfully.");
        window.location.href = "index.html";
      } catch (err) {
        console.error(err);
        alert("Error deleting account: " + err.message);
      }
    }
  }
});
