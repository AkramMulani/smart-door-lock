import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCTV1GjkC_vuEQelMVOgWSawsK2i8jhSu4",
  projectId: "smart-lock-genius-kods",
};

const app = initializeApp(firebaseConfig);
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
    if (window.innerWidth < 768) toggleSidebar();
    if (id === "stream") {
      loadCapturedImages();
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
    fetch(`/wifi?ssid=${encodeURIComponent(ssid)}&pass=${encodeURIComponent(pass)}`)
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

document.addEventListener("DOMContentLoaded", () => {
  navigate("stream");
  setInterval(loadCapturedImages, 10000);
});
