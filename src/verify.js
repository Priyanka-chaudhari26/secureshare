import { verifyOtp } from "./script.js";
document.getElementById("verify-btn").addEventListener("click", () => {
  const email = document.getElementById("verify-email").value;
  const otp = document.getElementById("otp-input").value;

  if (email && otp) {
    verifyOtp(email, otp);
  } else {
    alert("Please enter your email and OTP!");
  }
});
