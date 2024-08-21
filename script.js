let map;
let recognition;
let baseLayers;

document.addEventListener("DOMContentLoaded", function () {
  initializeMap();

  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = function (event) {
      const result =
        event.results[event.resultIndex][0].transcript.toLowerCase();
      console.log("Recognized result:", result);

      document.getElementById("voice-query-bar").textContent = result;

      handleVoiceCommand(result);
    };

    recognition.onerror = function (event) {
      console.error("Speech recognition error", event);
      //alert("Error with speech recognition: " + event.error);
    };

    recognition.onend = function () {
      console.log("Speech recognition service disconnected");
      startVoiceSearch(); // restart listening
    };

    startVoiceSearch(); // start listening initially
  } else {
    alert("Speech recognition not supported in this browser.");
  }

  document
    .getElementById("search-bar")
    .addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        const destination = event.target.value.trim();
        if (destination) {
          navigateTo(destination, true);
        }
      }
    });
});

function initializeMap() {
  map = L.map("map").setView([51.505, -0.09], 13);
  const osm = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  ).addTo(map);

  const satellite = L.tileLayer(
    "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  );

  const terrain = L.tileLayer(
    "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    {
      attribution:
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    }
  );

  const dark = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  );

  const night = L.tileLayer(
    "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  );

  baseLayers = {
    OSM: osm,
    Satellite: satellite,
    Terrain: terrain,
    Dark: dark,
    Night: night,
  };

  L.control.layers(baseLayers).addTo(map);
}

function startVoiceSearch() {
  if (!recognition) {
    console.error("Speech recognition is not initialized.");
    document.getElementById("voice-query-bar").textContent =
      "Speech recognition is not initialized";
    return;
  }
  recognition.start();
  console.log("Listening for voice commands...");
}

function handleVoiceCommand(command) {
  document.getElementById("voice-query-bar").style.background = "lightgreen";
  if (command.startsWith("go to ") || command.startsWith("navigate to ")) {
    const destination = command.replace(/^(go to|navigate to) /, "").trim();
    if (destination) {
      navigateTo(destination, false);
    } else {
      console.log("No destination provided.");
    }
  } else if (command === "zoom in") {
    map.zoomIn();
  } else if (command === "zoom out") {
    map.zoomOut();
  } else if (command === "satellite view") {
    changeLayer("Satellite");
  } else if (command === "terrain view") {
    changeLayer("Terrain");
  } else if (command === "default view" || command === "osm view") {
    changeLayer("OSM");
  } else if (command === "dark view") {
    changeLayer("Dark");
  } else if (command === "night view") {
    changeLayer("Night");
  } else if (command === "add marker") {
    addMarkerAtCurrentLocation();
  } else {
    console.log("Unrecognized command.");
    //alert("Unrecognized command. Please try again.");
    document.getElementById("voice-query-bar").style.background = "red";
  }
}

async function navigateTo(destination, addMarker) {
  if (!map) {
    alert("Map is not initialized");
    return;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        destination
      )}`
    );
    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    if (data.length > 0) {
      const { lat, lon } = data[0];
      map.setView([lat, lon], 13);
      if (addMarker) {
        L.marker([lat, lon]).addTo(map);
      }
    } else {
      alert("Location not found");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Geocode was not successful.");
  }
}

function changeLayer(layerName) {
  Object.keys(baseLayers).forEach((layer) => {
    if (map.hasLayer(baseLayers[layer])) {
      map.removeLayer(baseLayers[layer]);
    }
  });
  map.addLayer(baseLayers[layerName]);
}

function addMarkerAtCurrentLocation() {
  const currentCenter = map.getCenter();
  L.marker([currentCenter.lat, currentCenter.lng]).addTo(map);
}

document
  .getElementById("voice-search")
  .addEventListener("click", startVoiceSearch);
document
  .getElementById("zoom-in")
  .addEventListener("click", () => map.zoomIn());
document
  .getElementById("zoom-out")
  .addEventListener("click", () => map.zoomOut());
