// Map Initialization
const map = L.map('map').setView([22.4, 89.1], 9);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Data Keys
const PIN_KEY = 'superghm_final_pins';
const HEAT_KEY = 'superghm_final_heat';

let pins = JSON.parse(localStorage.getItem(PIN_KEY)) || [];
let heatZones = JSON.parse(localStorage.getItem(HEAT_KEY)) || [];
let markers = [];
let drawnZones = [];
let isDrawing = false;

// Tab Switching
function openTab(evt, tabName) {
    const contents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < contents.length; i++) contents[i].classList.remove("active");
    
    const links = document.getElementsByClassName("tab-link");
    for (let i = 0; i < links.length; i++) links[i].classList.remove("active");
    
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
    
    if(tabName === 'Map') {
        setTimeout(() => { map.invalidateSize(); }, 200);
    }
}

// Drawing Feature
function startHeatmap() {
    isDrawing = true;
    alert("Click 4 points on the map to define a Salinity Hotzone.");
    let pts = [];
    map.on('click', function onClick(e) {
        if(!isDrawing) return;
        pts.push([e.latlng.lat, e.latlng.lng]);
        if(pts.length === 4) {
            heatZones.push({ coords: pts, color: '#ef4444', opacity: 0.3 });
            isDrawing = false;
            map.off('click', onClick);
            updateData();
        }
    });
}

// Pin Dropping
map.on('click', function(e) {
    if(isDrawing) return;
    const name = prompt("Village/Clinic Name:");
    const status = prompt("Deployment Status:");
    if(name) {
        pins.push({ 
            id: Date.now(), 
            lat: e.latlng.lat, 
            lng: e.latlng.lng, 
            name, 
            status: status || "Operational", 
            type: document.getElementById('pinType').value 
        });
        updateData();
    }
});

function render() {
    markers.forEach(m => map.removeLayer(m));
    drawnZones.forEach(z => map.removeLayer(z));
    markers = []; drawnZones = [];
    
    const list = document.getElementById('pin-list');
    list.innerHTML = '';

    heatZones.forEach(z => {
        drawnZones.push(L.polygon(z.coords, {color: z.color, fillOpacity: z.opacity}).addTo(map));
    });

    pins.forEach(p => {
        const color = p.type === 'tech' ? '#10b981' : p.type === 'expert' ? '#3b82f6' : '#f59e0b';
        const m = L.circleMarker([p.lat, p.lng], { color, radius: 8, fillOpacity: 0.8 }).addTo(map);
        m.bindPopup(`<b>${p.name}</b><br>${p.status}<br><button onclick="deletePin(${p.id})">Remove</button>`);
        markers.push(m);

        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.padding = '8px 0';
        li.style.borderBottom = '1px solid #f1f5f9';
        li.innerHTML = `<span><b>${p.name}</b></span> <button onclick="deletePin(${p.id})" style="border:none; color:red; background:none; cursor:pointer">×</button>`;
        list.appendChild(li);
    });
}

function deletePin(id) { pins = pins.filter(p => p.id !== id); updateData(); }

function clearAllData() {
    if(confirm("Permanently clear all map data?")) { pins = []; heatZones = []; updateData(); }
}

function updateData() {
    localStorage.setItem(PIN_KEY, JSON.stringify(pins));
    localStorage.setItem(HEAT_KEY, JSON.stringify(heatZones));
    render();
}

function exportData() {
    const data = JSON.stringify({ pins, heatZones });
    const blob = new Blob([data], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'superghm_strategy_backup.json';
    a.click();
}

function importData(e) {
    const reader = new FileReader();
    reader.onload = (f) => {
        const d = JSON.parse(f.target.result);
        pins = d.pins || []; heatZones = d.heatZones || [];
        updateData();
    };
    reader.readAsText(e.target.files[0]);
}

function toggleAcc(id) {
    const el = document.getElementById(id);
    el.style.display = (el.style.display === 'block') ? 'none' : 'block';
}

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
window.onscroll = () => { document.getElementById("scrollTopBtn").style.display = (window.scrollY > 300) ? "block" : "none"; };

render();