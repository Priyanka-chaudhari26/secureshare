const urlParams = new URLSearchParams(window.location.search);
const sid = urlParams.get("sid"); // Share ID from URL
const emailRequired = urlParams.get("emailRequired") === "true"; // Email protection

const emailGroup = document.getElementById("emailGroup");
const statusEl = document.getElementById("status");
const accessBtn = document.getElementById("accessBtn");

// Hide email input if not required
if (!emailRequired) {
  emailGroup.style.display = "none";
}

accessBtn.onclick = async () => {
  statusEl.style.color = "red"; // default status color
  statusEl.textContent = "";

  const password = document.getElementById("password").value.trim();
  const payload = { sid, password, emailRequired };

  if (emailRequired) {
    const recipientEmail = document
      .getElementById("recipientEmail")
      .value.trim();
    if (!recipientEmail || !password) {
      statusEl.textContent = "Please enter both email and password.";
      return;
    }
    payload.recipientEmail = recipientEmail;
  } else {
    if (!password) {
      statusEl.textContent = "Please enter the file password.";
      return;
    }
  }

  try {
    statusEl.textContent = "Verifying and downloading file...";
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_BASEURL}/access-file`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to access file.");
    }

    const contentDisposition = response.headers.get("Content-Disposition");
    console.log("Raw Header:", contentDisposition);
    let fileName = "SecureFile";
    if (contentDisposition) {
      const cleanHeader = contentDisposition.trim();
      const parts = cleanHeader.split(";");
      for (let part of parts) {
        part = part.trim();
        if (part.toLowerCase().startsWith("filename=")) {
          fileName = part.split("=")[1].replaceAll('"', "").trim();
          console.log("Extracted file name:", fileName);
          break;
        }
      }
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Trigger file download
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    statusEl.style.color = "green";
    statusEl.textContent = "File downloaded successfully!";
  } catch (err) {
    console.error(err);
    statusEl.textContent = err.message;
  }
};
