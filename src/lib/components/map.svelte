<script>
    import { onMount } from "svelte";
    import L from "leaflet";
    import "leaflet/dist/leaflet.css";

    // manually load the markers so that they can be embedded in the prod bundle
    import markerIconUrl from "leaflet/dist/images/marker-icon.png";
    import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
    import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

    export let height = 225;
    export let point = { lat: 0, lon: 0 };

    let map;
    let mapEl;
    let marker;
    let userLocationMarker;
    let isSearching = false;
    let searchTerm = "";
    let searchResults = [];
    let searchTimeoutId;
    let searchAbortController;
    let panTimeoutId;
    let userLocation = null;
    let watchId = null;

    const defaultZoomLevel = 13;

    $: search(searchTerm);

    $: if (point.lat && point.lon) {
        panInside();
    }

    function normalizeCoordinate(coord) {
        return +(+coord).toFixed(6);
    }

    function panInside(debounce = 200) {
        clearTimeout(panTimeoutId);
        panTimeoutId = setTimeout(() => {
            marker?.setLatLng([point.lat, point.lon]);
            map?.panInside([point.lat, point.lon], { padding: [20, 40] });
        }, debounce);
    }

    function centerOnUser() {
        if (userLocation) {
            const { lat, lon } = userLocation;
            map?.setView([lat, lon], defaultZoomLevel);
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude: lat, longitude: lon } = position.coords;
                    userLocation = { lat, lon };
                    updateUserLocationMarker(lat, lon);
                    map?.setView([lat, lon], defaultZoomLevel);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    alert("Unable to get your location. Please check your browser permissions.");
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 30000,
                    timeout: 27000
                }
            );
        } else {
            alert("Geolocation is not supported by your browser");
        }
    }

    function updateUserLocationMarker(lat, lon) {
        if (!userLocationMarker) {
            const blueDot = L.divIcon({
                className: 'user-location-dot',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                html: '<div style="background-color: #3b82f6; width: 100%; height: 100%; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>'
            });
            
            userLocationMarker = L.marker([lat, lon], {
                icon: blueDot,
                interactive: false,
                zIndexOffset: 1000
            }).addTo(map);
        } else {
            userLocationMarker.setLatLng([lat, lon]);
        }
    }

    function initMap() {
        const latlon = [normalizeCoordinate(point.lat), normalizeCoordinate(point.lon)];

        map = L.map(mapEl, { zoomControl: false }).setView(latlon, defaultZoomLevel);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        // reassign the default marker images with the loaded ones
        L.Icon.Default.prototype.options.iconUrl = markerIconUrl;
        L.Icon.Default.prototype.options.iconRetinaUrl = markerIconRetinaUrl;
        L.Icon.Default.prototype.options.shadowUrl = markerShadowUrl;
        L.Icon.Default.imagePath = "";

        // Create the marker at the initial position
        marker = L.marker(latlon, {
            draggable: true,
            autoPan: true,
        }).addTo(map);

        // Handle marker drag end
        marker.on("moveend", (e) => {
            if (e.sourceTarget?._latlng) {
                select(e.sourceTarget._latlng.lat, e.sourceTarget._latlng.lng, false);
            }
        });

        // Handle map click to move the marker
        map.on("click", (e) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            select(lat, lng, false);
        });

        map.on("contextmenu", (e) => {
            select(e.latlng.lat, e.latlng.lng, false);
        });

        // Add zoom controls
        L.control.zoom({
            position: 'topright'
        }).addTo(map);

        // Add locate control
        // L.control.locate({
        //     position: 'topright',
        //     drawCircle: false,
        //     setView: 'untilPanOrZoom',
        //     keepCurrentZoomLevel: true,
        //     locateOptions: {
        //         enableHighAccuracy: true,
        //         maximumAge: 15000,
        //         timeout: 10000
        //     },
        //     strings: {
        //         title: 'Center on me'
        //     }
        // }).addTo(map);

        // Start watching user's location
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude: lat, longitude: lon } = position.coords;
                    userLocation = { lat, lon };
                    updateUserLocationMarker(lat, lon);
                },
                (error) => {
                    console.error("Error watching location:", error);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 30000,
                    timeout: 27000
                }
            );
        }
    }

    function destroyMap() {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
        resetSearch();
        marker?.remove();
        userLocationMarker?.remove();
        map?.remove();
    }

    function resetSearch() {
        searchAbortController?.abort();
        clearTimeout(searchTimeoutId);
        isSearching = false;
        searchResults = [];
        searchTerm = "";
    }

    // note: using debounce > 1s to minimize hitting the API rate limits
    // (see also https://operations.osmfoundation.org/policies/nominatim/)
    function search(q, debounce = 1100) {
        isSearching = true;
        searchResults = [];
        clearTimeout(searchTimeoutId);
        searchAbortController?.abort();

        if (!q) {
            isSearching = false;
            return;
        }

        searchTimeoutId = setTimeout(async () => {
            searchAbortController = new AbortController();

            try {
                const response = await fetch(
                    "https://nominatim.openstreetmap.org/search.php?format=jsonv2&q=" + encodeURIComponent(q),
                    { signal: searchAbortController.signal },
                );
                if (response.status != 200) {
                    throw new Error("OpenStreetMap API error " + response.status);
                }

                const addresses = await response.json();
                searchResults = []; // Clear previous results
                
                for (const item of addresses) {
                    searchResults.push({
                        lat: parseFloat(item.lat),
                        lon: parseFloat(item.lon),
                        name: item.display_name,
                    });
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.warn("[address search failed]", err);
                }
            }

            isSearching = false;
        }, debounce);
    }

    function select(lat, lon, centerMap = true) {
        // Create a new point object to trigger reactivity
        const newPoint = { 
            lat: normalizeCoordinate(lat), 
            lon: normalizeCoordinate(lon) 
        };
        
        // Update the point prop using the binding
        point = newPoint;

        // center the map if needed
        if (centerMap) {
            marker?.setLatLng([newPoint.lat, newPoint.lon]);
            map?.panTo([newPoint.lat, newPoint.lon], { animate: true, duration: 0.5 });
        }

        resetSearch();
    }

    onMount(() => {
        initMap();
        return () => {
            destroyMap();
        };
    });
</script>

<div class="map-wrapper" style="height: {height}px">
    <div class="map-search">
        <div class="form-field m-0">
            {#if isSearching}
                <div class="form-field-addon">
                    <span class="loader loader-xs"></span>
                </div>
            {:else if searchTerm.length}
                <div class="form-field-addon">
                    <button
                        type="button"
                        class="btn btn-circle btn-xs btn-transparent"
                        on:click={resetSearch}
                    >
                        <i class="ri-close-line"></i>
                    </button>
                </div>
            {/if}
            <input 
                type="text" 
                placeholder="Search address..." 
                bind:value={searchTerm}
                class="search-input"
            />
        </div>
        {#if searchTerm.length && searchResults.length}
            <div class="dropdown dropdown-sm dropdown-block">
                {#each searchResults as result}
                    <button
                        type="button"
                        class="dropdown-item"
                        on:click={() => select(result.lat, result.lon)}
                    >
                        {result.name}
                    </button>
                {/each}
            </div>
        {/if}
    </div>
    <div bind:this={mapEl} class="map-box"></div>
    
    <!-- Custom locate control button -->
    <div class="locate-control">
        <button 
            type="button" 
            class="locate-btn"
            on:click={centerOnUser}
            title="Center on my location"
        >
        <img src="/center.png" alt="Center on my location" />
        </button>
    </div>
</div>

<style>
    .map-wrapper {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .map-box {
        width: 100%;
        height: 100%;
        z-index: 1;
    }

    .map-search {
        position: absolute;
        top: 12px;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        max-width: 500px;
        z-index: 2;
    }

    .form-field {
        position: relative;
        margin-bottom: 0;
    }

    .search-input {
        width: 100%;
        padding: 8px 12px 8px 36px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.2s ease;
        background-color: white;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .search-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-field-addon {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        display: flex;
        align-items: center;
        padding-left: 12px;
        pointer-events: none;
    }

    .btn-transparent {
        background: transparent;
        border: none;
        padding: 4px;
        cursor: pointer;
        pointer-events: auto;
        color: #64748b;
    }

    .btn-transparent:hover {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 50%;
    }

    .dropdown {
        position: absolute;
        width: 100%;
        max-height: 200px;
        overflow-y: auto;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        margin-top: 4px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .dropdown-item {
        display: block;
        width: 100%;
        padding: 8px 12px;
        text-align: left;
        background: none;
        border: none;
        font-size: 14px;
        color: #1a202c;
        cursor: pointer;
        transition: background-color 0.1s;
    }

    .dropdown-item:hover {
        background-color: #f7fafc;
    }

    .loader-xs {
        width: 16px;
        height: 16px;
        border: 2px solid #e2e8f0;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    /* Locate control */
    .locate-control {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 1000;
    }

    .locate-btn {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #4b5563;
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .locate-btn:hover {
        background: #f8fafc;
        color: #1f2937;
    }

    /* Leaflet overrides */
    :global(.leaflet-top) {
        top: 60px;
    }

    :global(.leaflet-touch .leaflet-bar a) {
        width: 30px;
        height: 30px;
        line-height: 30px;
    }

    :global(.leaflet-bar a:first-child) {
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
    }

    :global(.leaflet-bar a:last-child) {
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
</style>