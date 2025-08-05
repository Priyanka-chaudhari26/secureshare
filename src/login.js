import {loginUser} from './script.js';
document.getElementById("login-btn").addEventListener("click", () => {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  if (email && password) {
    loginUser(email, password);
  } else {
    alert("Please enter email and password!");
  }
});
