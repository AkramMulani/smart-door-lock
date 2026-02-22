import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  deleteDoc,
  addDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyCTV1GjkC_vuEQelMVOgWSawsK2i8jhSu4",
  projectId: "smart-lock-genius-kods",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function loadCapturedImages() {
  const table = document.getElementById("imagesTable");
  table.innerHTML = "";

  const snap = await getDocs(collection(db, "images"));

  let i = 1;
  snap.forEach(docSnap => {
    const data = docSnap.data();
    const date = new Date(data.timestamp * 1000);

    table.innerHTML += `
      <tr class="border-b dark:border-slate-700">
        <td class="p-2">${i++}</td>
        <td class="p-2">${data.timestamp}</td>
        <td class="p-2">${date.toLocaleString()}</td>
        <td class="p-2 space-x-2">
          <button class="btn-blue"
            onclick="viewImage('${docSnap.id}')">
            View
          </button>
          <button class="btn-red"
            onclick="deleteImage('${docSnap.id}')">
            Delete
          </button>
        </td>
      </tr>
    `;
  });

  if (i === 1) {
    table.innerHTML = `
      <tr>
        <td colspan="4" class="p-3 text-center text-gray-500">
          No images found
        </td>
      </tr>`;
  }
}

async function viewImage(docId) {
  const snap = await getDoc(doc(db, "images", docId));
  if (!snap.exists()) return;

  const base64 = snap.data().image;

  const img = document.getElementById("modalImage");
  img.src = `data:image/jpeg;base64,${base64}`;

  document.getElementById("imageModal").classList.remove("hidden");
}

function closeImageModal() {
  document.getElementById("imageModal").classList.add("hidden");
  document.getElementById("modalImage").src = "";
}

async function deleteImage(docId) {
  if (!confirm("Delete this image?")) return;

  await deleteDoc(doc(db, "images", docId));
  loadCapturedImages();
}

tailwind.config = {
    darkMode: 'class'
}
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

function toggleSidebar() {
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

function navigate(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    document.getElementById('pageTitle').innerText =
        id.charAt(0).toUpperCase() + id.slice(1);
    document.getElementById('loginSection').classList.add('hidden');

    if (window.innerWidth < 768) toggleSidebar();
    if (id === "stream") {
      loadCapturedImages();
    }
    else if (id === "system") {
      loadSystemStatus();
      setInterval(loadSystemStatus, 5000);
    }
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    localStorage.theme =
      document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    updateIcon();
}

function updateIcon() {
    document.getElementById('darkIcon').innerText =
      document.documentElement.classList.contains('dark') ? '☀' : '🌙';
}

// INIT
if (localStorage.theme === 'dark') {
    document.documentElement.classList.add('dark');
}
updateIcon();

const STREAM_URL = "http://"+ CAM_IP + ":81/stream";
const STREAM_CTL = "http://"+ CAM_IP + "/streamctl?on=";
const CAPTURE_URL = "http://"+ CAM_IP + "/capture";

const streamFrame = document.getElementById("streamFrame");

/* ================= STREAM CONTROLS ================= */

function startStream() {
    // Tell ESP to start stream
    fetch(STREAM_CTL + "1")
        .then(() => {
            // Load stream into iframe
            streamFrame.src = STREAM_URL;
        })
        .catch(err => {
            alert("Failed to start stream");
            console.error(err);
        });
}

function stopStream() {
    // Stop iframe first (important)
    streamFrame.src = "";

    // Tell ESP to stop stream
    fetch(STREAM_CTL + "0")
        .catch(err => {
            console.error("Failed to stop stream", err);
        });
}

/* ================= CAPTURE ================= */

function captureImage() {
    fetch(CAPTURE_URL)
      .then(response => response.blob())
      .then(blob => {
        // Show preview + auto-download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "capture.jpg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(err => {
        alert("Capture failed");
        console.error(err);
      });
}

const WIFI_API = "http://"+ CAM_IP;

function openWifiDialog() {
    document.getElementById("wifiDialog").classList.remove("hidden");
    loadWifiStatus();
}

function closeWifiDialog() {
    document.getElementById("wifiDialog").classList.add("hidden");
}

function loadWifiStatus() {
    // OPTIONAL endpoint – safe fallback
    fetch(WIFI_API + "/wifi/status")
      .then(res => res.json())
      .then(data => {
        document.getElementById("wifiMode").innerText = data.mode || "Unknown";
        document.getElementById("wifiSSID").innerText = data.ssid || "—";
        document.getElementById("wifiIP").innerText = data.ip || "—";
      })
      .catch(() => {
        document.getElementById("wifiMode").innerText = "AP / STA";
        document.getElementById("wifiSSID").innerText = "Unknown";
        document.getElementById("wifiIP").innerText = location.hostname;
      });
}

function submitWifi() {
    const ssid = document.getElementById("wifiSsid").value.trim();
    const pass = document.getElementById("wifiPass").value.trim();
    const status = document.getElementById("wifiStatus");

    if (!ssid || !pass) {
      status.innerText = "SSID & Password required";
      return;
    }

    status.innerText = "Connecting… device will reboot";

    fetch(`${WIFI_API}/wifi?ssid=${encodeURIComponent(ssid)}&pass=${encodeURIComponent(pass)}`)
      .then(() => {
        status.innerText = "✅ Credentials sent to Camera ...";
      })
      .catch(() => {
        status.innerText = "❌ Failed to send WiFi config";
      });
    
    status.innerText = "Camera rebooting...";
    
    fetch(`${WIFI_API}/wifi?ssid=${encodeURIComponent(ssid)}&pass=${encodeURIComponent(pass)}&ready=yes`)
    .then(() => {
      status.innerText = "✅ Credentials sent to Camera! Rebooting...";
    })
    .catch(() => {
      status.innerText = "❌ Failed to send WiFi config";
    });

    status.innerText = "System rebooting...";
    fetch(`/wifi?ssid=${encodeURIComponent(ssid)}&pass=${encodeURIComponent(pass)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `ssid=${encodeURIComponent(ssid)}&pass=${encodeURIComponent(pass)}`
    })
      .then(() => {
        status.innerText = "✅ Credentials sent to system ...";
      })
      .catch(() => {
        status.innerText = "❌ Failed to send WiFi config";
      });
}

function factoryReset() {
    fetch('/factory-reset').then(()=> {
        status.innerText = "✅ Factory reset done! Wait for few seconds!";
    })
}

async function resetPassword() {
  const oldPass = document.getElementById("oldPassword").value;
  const newPass = document.getElementById("newPassword").value;
  const confirmPass = document.getElementById("confirmPassword").value;

  if (!oldPass || !newPass || !confirmPass) {
    alert("All fields are required");
    return;
  }

  if (newPass !== confirmPass) {
    alert("New passwords do not match");
    return;
  }

  try {
    const res = await fetch("/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        oldPassword: oldPass,
        newPassword: newPass
      })
    });

    const data = await res.json();

    if (res.status === 200 && data.status === "ok") {
      alert("✅ Password updated successfully");
    } else if (res.status === 401) {
      alert("❌ Old password is incorrect");
    } else {
      alert("❌ Failed to update password");
    }

  } catch (err) {
    console.error(err);
    alert("❌ Network error");
  }
}

async function loadSystemStatus() {
  try {
    const res = await fetch("/system/status");
    const data = await res.json();

    document.getElementById("uptime").innerText = data.uptimeHuman;

    const door = document.getElementById("doorStatus");
    door.innerText = data.doorStatus;

    door.className =
      data.doorStatus === "LOCKED"
        ? "text-green-500 font-semibold"
        : "text-red-500 font-semibold";

  } catch (e) {
    console.error("System status error", e);
  }
}

/****************************************************
 SMART DOOR LOCK - USERS MANAGEMENT + RBAC
*****************************************************/

/****************************************************
 DOM REFERENCES
*****************************************************/
const tableBody = document.getElementById("usersTableBody");
const addUserBtn = document.getElementById("addUserBtn");

/****************************************************
 INITIAL LOAD
*****************************************************/
document.addEventListener("DOMContentLoaded", async () => {
  await loadCurrentUserRole();
  applyRBAC();
  loadUsers();
});

/****************************************************
 LOAD CURRENT USER ROLE FROM FIRESTORE
*****************************************************/
async function loadCurrentUserRole() {
  if (currentUser === null) return;
  const userRef = doc(db, "users", currentUser.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    currentUser = { uid: snap.id, ...snap.data() };
  }
}

/****************************************************
 RBAC
*****************************************************/
function applyRBAC() {
  if (currentUser.role === "admin") {
    addUserBtn.classList.remove("hidden");
  } else {
    addUserBtn.classList.add("hidden");
  }
}

/****************************************************
 LOAD USERS FROM FIRESTORE
*****************************************************/
async function loadUsers() {
  tableBody.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "users"));

  querySnapshot.forEach((doc) => {
    const user = { id: doc.id, ...doc.data() };

    const tr = document.createElement("tr");
    tr.className = "border-b dark:border-slate-700";

    tr.innerHTML = `
      <td class="p-2">${user.name}</td>
      <td class="p-2">${user.mobile}</td>
      <td class="p-2">${user.role}</td>
      <td class="p-2">${user.lastUsed || "-"}</td>
      <td class="p-2 text-center space-x-2">
        ${
          currentUser.role === "admin"
            ? `
            <button onclick="editUserDialog('${user.id}')" class="btn-gray">Edit</button>
            <button onclick="deleteUserDialog('${user.id}')" class="btn-red">Delete</button>
            `
            : `<span class="text-xs text-gray-400">No Permission</span>`
        }
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

/****************************************************
 ADD USER
*****************************************************/
addUserBtn.addEventListener("click", async () => {
  const name = prompt("Enter user name:");
  const mobile = prompt("Enter mobile number:");

  if (!name || !mobile) return;

  await addDoc(collection(db, "users"), {
    name,
    mobile,
    role: "user",
    lastUsed: "-"
  });

  loadUsers();
});

/****************************************************
 EDIT USER
*****************************************************/
async function editUser(id) {
  if (currentUser.role !== "admin") {
    alert("Access Denied");
    return;
  }

  const userRef = doc(db, "users", id);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return;

  const data = snap.data();

  const newName = prompt("Edit name:", data.name);
  const newMobile = prompt("Edit mobile:", data.mobile);

  if (!newName || !newMobile) return;

  await updateDoc(userRef, {
    name: newName,
    mobile: newMobile
  });

  loadUsers();
};

/****************************************************
 DELETE USER
*****************************************************/
async function deleteUser(id) {
  if (currentUser.role !== "admin") {
    alert("Access Denied");
    return;
  }

  if (!confirm("Delete this user?")) return;

  await deleteDoc(doc(db, "users", id));

  loadUsers();
};

window.editUserDialog = async function (id) {

  if (currentUser.role !== "admin") {
    alert("Access Denied");
    return;
  }

  const userRef = doc(db, "users", id);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const user = snap.data();
  const container = document.getElementById("dialogContainer");

  container.innerHTML = `
    <div class="dialog-overlay">
      <div class="dialog-box">
        <h3>Edit User</h3>

        <label>Name</label>
        <input id="editName" class="dialog-input" value="${user.name}" />

        <label>Mobile</label>
        <input id="editMobile" class="dialog-input" value="${user.mobile}" />

        <label>Role</label>
        <select id="editRole" class="dialog-input">
          <option value="user" ${user.role === "user" ? "selected" : ""}>User</option>
          <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
        </select>

        <div class="dialog-actions">
          <button class="btn-red" onclick="closeDialog()">Cancel</button>
          <button class="btn-blue" onclick="confirmEditUser('${id}')">Update</button>
        </div>
      </div>
    </div>
  `;
};

window.confirmEditUser = async function (id) {

  const newName = document.getElementById("editName").value.trim();
  const newMobile = document.getElementById("editMobile").value.trim();
  const newRole = document.getElementById("editRole").value;

  if (!newName || !newMobile) {
    alert("All fields required");
    return;
  }

  await updateDoc(doc(db, "users", id), {
    name: newName,
    mobile: newMobile,
    role: newRole
  });

  closeDialog();
  loadUsers();
};

window.deleteUserDialog = async function (id) {

  if (currentUser.role !== "admin") {
    alert("Access Denied");
    return;
  }

  const snap = await getDoc(doc(db, "users", id));
  if (!snap.exists()) return;

  const user = snap.data();
  const container = document.getElementById("dialogContainer");

  container.innerHTML = `
    <div class="dialog-overlay">
      <div class="dialog-box">
        <h3 style="color:red;">Delete User</h3>

        <p>
          You are going to delete:<br><br>
          <strong>${user.name}</strong><br>
          ${user.mobile}
        </p>

        <div class="dialog-actions">
          <button class="btn-red-400" onclick="closeDialog()">Cancel</button>
          <button class="btn-red" onclick="confirmDeleteUser('${id}')">Delete</button>
        </div>
      </div>
    </div>
  `;
};

window.confirmDeleteUser = async function (id) {

  await deleteDoc(doc(db, "users", id));

  closeDialog();
  loadUsers();
};

window.closeDialog = function () {
  document.getElementById("dialogContainer").innerHTML = "";
};

let confirmationResult;
let currentUser = null;

let recaptchaVerifier;

document.addEventListener("DOMContentLoaded", () => {

  recaptchaVerifier = new RecaptchaVerifier(
    auth,
    "recaptcha-container",
    {
      size: "normal",
      callback: (response) => {
        console.log("reCAPTCHA solved");
      }
    }
  );

  recaptchaVerifier.render();
});

/****************************************************
 SEND OTP
*****************************************************/
document.getElementById("sendOtpBtn").addEventListener("click", async () => {

  const phoneNumber = document.getElementById("phoneNumber").value.trim();

  if (!phoneNumber.startsWith("+")) {
    alert("Use country code. Example: +91XXXXXXXXXX");
    return;
  }

  try {
    confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );

    document.getElementById("phoneStep").classList.add("hidden");
    document.getElementById("otpStep").classList.remove("hidden");

  } catch (error) {
    alert(error.message);
  }
});

/****************************************************
 VERIFY OTP
*****************************************************/
document.getElementById("verifyOtpBtn").addEventListener("click", async () => {

  const code = document.getElementById("otpCode").value.trim();

  try {
    const result = await confirmationResult.confirm(code);
    currentUser = result.user;

  } catch (error) {
    alert("Invalid OTP");
  }
});

/****************************************************
 AUTH STATE LISTENER
*****************************************************/
onAuthStateChanged(auth, async (user) => {

  if (user) {
    currentUser = user;

    await loadUserRole(user.uid);

    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("appSection").classList.remove("hidden");

  } else {
    document.getElementById("loginSection").classList.remove("hidden");
    document.getElementById("appSection").classList.add("hidden");
  }
});

/****************************************************
 LOAD ROLE FROM FIRESTORE
*****************************************************/
async function loadUserRole(uid) {

  const snap = await getDoc(doc(db, "users", uid));

  if (!snap.exists()) {
    alert("User not registered in system");
    return;
  }

  currentUser = { uid, ...snap.data() };
}

window.logout = async function () {
  await signOut(auth);
};

document.addEventListener("DOMContentLoaded", () => {
  navigate("stream");
  setInterval(loadCapturedImages, 10000);
});

window.navigate = navigate;
window.startStream = startStream;
window.stopStream = stopStream;
window.captureImage = captureImage;
window.viewImage = viewImage;
window.closeImageModal = closeImageModal;
window.deleteImage = deleteImage;
window.factoryReset = factoryReset;
window.submitWifi = submitWifi;
window.closeWifiDialog = closeWifiDialog;
window.openWifiDialog = openWifiDialog;
window.toggleDarkMode = toggleDarkMode;
window.toggleSidebar = toggleSidebar;
window.resetPassword = resetPassword;
window.loadSystemStatus = loadSystemStatus;
window.editUser = editUser;
window.deleteUser = deleteUser;
