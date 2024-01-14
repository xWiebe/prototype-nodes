// BACKUP: last implemented feature: geofence radius settings

let map;
let markers = [];
let geofence;
let geofenceCenter = { lat: 51.1657, lng: 10.4515 }; // Default center
let currentAssetFilter = "all"; // Store the current asset filter
let selectedAlarmStatus = "all"; // Store the selected alarm status
let currentRole = "both"; // Store the current user role

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: geofenceCenter,
    zoom: 6,
  });

  // Initial geofence
  updateGeofence();

  // Load asset data
  fetch("asset_data.json")
    .then((response) => response.json())
    .then((data) => {
      markers = data.map((asset, index) => {
        let markerColor = "white"; // Default color

        if (asset["alarm-status"] === "critical") {
          markerColor = "red";
        }
        if (asset["alarm-status"] === "major") {
          markerColor = "yellow";
        }
        if (asset["alarm-status"] === "minor") {
          markerColor = "blue";
        }

        const marker = new google.maps.Marker({
          position: { lat: asset.latitude, lng: asset.longitude },
          map: null, // Initially set to null, will be shown based on the filter
          title: asset.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: markerColor,
            fillOpacity: 1,
            strokeColor: "black",
            strokeWeight: 1,
            scale: 8,
          },
        });

        marker.addListener("click", () => {
          // Display asset information
          alert(`
            Name: ${asset.name}
            Asset Type: ${asset["asset-type"]}
            Alarm Status: ${asset["alarm-status"]}
          `);
        });

        // Adding the asset type property to the marker object
        marker.assetType = asset["asset-type"];
        marker.alarmStatus = asset["alarm-status"];

        return marker;
      });

      // Update asset list based on the current geofence, filter, and role
      updateMapAndAssetList();
    })
    .catch((error) => {
      console.error("Error loading asset data:", error);
    });
}

function selectMarker(index) {
  // Get the selected marker
  const selectedMarker = markers[index];

  // Set the map center to the selected marker's position
  map.setCenter(selectedMarker.getPosition());

  // Adjust the zoom level (you can customize the zoom level as needed)
  map.setZoom(12);

  // Trigger a click event on the selected marker
  google.maps.event.trigger(selectedMarker, "click");
}

function updateGeofence() {
  // Remove existing geofence if any
  if (geofence) {
    geofence.setMap(null);
  }

  // Get the geofence radius from the textbox
  const radiusTextbox = document.getElementById("geofenceRadius");
  const radius = parseFloat(radiusTextbox.value * 1000);

  // Draw geofence
  geofence = new google.maps.Circle({
    strokeColor: "#FF0000", // Red color
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000", // Red color
    fillOpacity: 0.35,
    map: map,
    center: geofenceCenter,
    radius: radius || 500000,
  });

  // Adjust the map zoom to fit the geofence
  const bounds = geofence.getBounds();
  if (bounds) {
    map.fitBounds(bounds);
  }

  // Update marker visibility based on the filter
  updateMarkerVisibility();
  updateAssetList();
}

function updateAssetList() {
  const assetList = document.getElementById("asset-list");

  // Clear the current asset list
  assetList.innerHTML = "";

  // Filter assets based on the current geofence, filter, and alarm status
  markers.forEach((marker, index) => {
    const assetType = getAssetTypeByIndex(index);
    const position = marker.getPosition();

    // Check if the asset is within the geofence
    const withinGeofence =
      google.maps.geometry.spherical.computeDistanceBetween(
        position,
        geofenceCenter
      ) <= geofence.getRadius();

    // Check if the asset type matches the filter
    const assetTypeMatches =
      currentAssetFilter === "all" || assetType === currentAssetFilter;

    // Check if the alarm status matches the selected status
    const alarmStatusMatches =
      selectedAlarmStatus === "all" ||
      marker.alarmStatus === selectedAlarmStatus;

    if (withinGeofence && assetTypeMatches && alarmStatusMatches) {
      // Asset is within the geofence, matches the filter and alarm status, add to the list
      const listItem = document.createElement("li");
      listItem.textContent = markers[index].getTitle(); // Use the marker's title (name) as text

      // Add a click event listener to the list item
      listItem.addEventListener("click", () => {
        // Select the corresponding marker on the map and zoom in
        selectMarker(index);
      });

      assetList.appendChild(listItem);
    }
  });
}

function getAssetTypeByIndex(index) {
  // Replace this with your actual data structure if it differs
  return markers[index]?.assetType || "";
}

function updateMarkerVisibility() {
  // Update marker visibility based on the filter and selected alarm status
  markers.forEach((marker) => {
    const assetType = marker.assetType;
    const alarmStatus = marker.alarmStatus;

    const assetTypeMatches =
      currentAssetFilter === "all" || assetType === currentAssetFilter;

    const alarmStatusMatches =
      selectedAlarmStatus === "all" || alarmStatus === selectedAlarmStatus;

    // Set the marker visibility based on both asset type and alarm status filters
    marker.setMap(assetTypeMatches && alarmStatusMatches ? map : null);
  });
}

// Add this function to update the asset filter and refresh the map and asset list
function updateAssetFilter() {
  const filterDropdown = document.getElementById("assetTypeFilter");
  currentAssetFilter = filterDropdown.value;

  // Refresh the map and asset list based on the new filter
  updateMarkerVisibility();
  updateAssetList();
  updateGeofence();
}

// Add this function to update the map and asset list together
function updateMapAndAssetList() {
  updateGeofence();
  updateMarkerVisibility();
  updateAssetList();
}

function updateAlarmStatusFilter() {
  // Get the selected alarm status
  const alarmStatusDropdown = document.getElementById("alarmStatusDropdown");
  selectedAlarmStatus = alarmStatusDropdown.value;

  // Refresh the map and asset list based on the new alarm status filter
  updateMapAndAssetList();
}

function setGeofenceCenter() {
  // Get the geofence center from the textbox
  const geoCenterTextbox = document.getElementById("geoCenter");
  const geoCenterInput = geoCenterTextbox.value.trim();

  // Parse the input to get latitude and longitude
  const [latStr, lngStr] = geoCenterInput.split(",");
  const latitude = parseFloat(latStr);
  const longitude = parseFloat(lngStr);

  // Check if the input is valid
  if (!isNaN(latitude) && !isNaN(longitude)) {
    // Update the geofence center
    geofenceCenter = { lat: latitude, lng: longitude };

    // Refresh the map and asset list based on the new geofence center
    updateMapAndAssetList();
  } else {
    // Handle invalid input (e.g., show an error message)
    alert(
      "Invalid geofence center coordinates. Please enter valid latitude and longitude."
    );
  }
}

function useRealTimeLocation() {
  if (navigator.geolocation) {
    // Get the user's current location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Update the geofence center with the user's location
        geofenceCenter = userLocation;

        // Update the input field with the new coordinates
        const geoCenterTextbox = document.getElementById("geoCenter");
        geoCenterTextbox.value = `${userLocation.lat},${userLocation.lng}`;

        // Refresh the map and asset list based on the new geofence center
        updateMapAndAssetList();
      },
      (error) => {
        console.error("Error getting user's location:", error);
        // Handle errors (e.g., show an error message to the user)
      }
    );
  } else {
    // Geolocation is not supported
    alert("Geolocation is not supported by your browser");
  }
}

function toggleGeofenceCenterSettings() {
  const geofenceSettingsContainer = document.getElementById(
    "geofence-center-settings-container"
  );
  const displayStyle = geofenceSettingsContainer.style.display;

  // Toggle the visibility of the geofence settings container
  geofenceSettingsContainer.style.display =
    displayStyle === "none" ? "block" : "none";
}

// Add an event listener to the "Update geoCenter" button
document
  .getElementById("setGeofenceCenter")
  .addEventListener("click", setGeofenceCenter);

// Add an event listener to the "Use Real Time Location" button
document
  .getElementById("useRealTimeLocation")
  .addEventListener("click", useRealTimeLocation);

// Add an event listener to the "Geofence Center Settings" button
document
  .getElementById("geofenceCenterSettings")
  .addEventListener("click", toggleGeofenceCenterSettings);

// Add an event listener for radio buttons
const alarmStatusDropdown = document.getElementById("alarmStatusDropdown");
alarmStatusDropdown.addEventListener("change", updateAlarmStatusFilter);

function updateFilters() {
  // Update the geofence, marker visibility, and asset list based on the current filters
  updateGeofence();
  updateMarkerVisibility();
  updateAssetList();
}

// Add this function to toggle the visibility of the "Filter by Asset Type" based on the selected role
function updateRole() {
  const roleRadios = document.getElementsByName("role");
  roleRadios.forEach((radio) => {
    if (radio.checked) {
      currentRole = radio.value;
    }
  });

  const filterControls = document.getElementById("filter-controls");
  const assetTypeFilterDropdown = document.getElementById("assetTypeFilter");

  // Set the asset type filter based on the selected role
  if (currentRole === "both") {
    assetTypeFilterDropdown.value = "all";
  } else if (currentRole === "gas") {
    assetTypeFilterDropdown.value = "Gas";
  } else if (currentRole === "helium") {
    assetTypeFilterDropdown.value = "Helium";
  }

  // Toggle the visibility of the filter controls
  filterControls.style.display = currentRole === "both" ? "block" : "none";

  // Update the asset filter and refresh the map and asset list
  updateAssetFilter();
}

function toggleRoles() {
  const rolesContainer = document.getElementById("roles-container");
  const displayStyle = rolesContainer.style.display;

  // Toggle the visibility of the roles container
  rolesContainer.style.display = displayStyle === "none" ? "block" : "none";
}

// Add an event listener for radio buttons (Roles)
const roleRadios = document.getElementsByName("role");
roleRadios.forEach(function (radio) {
  radio.addEventListener("click", function () {
    updateRole();
  });
});

// Add an event listener for the initial page load to set up roles visibility
document.addEventListener("DOMContentLoaded", function () {
  updateRole();
});

document
  .getElementById("alarmStatusDropdown")
  .addEventListener("change", updateAlarmStatusFilter);
