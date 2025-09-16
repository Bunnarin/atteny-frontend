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
    let isSearching = false;
    let searchTerm = "";
    let searchResults = [];
    let searchTimeoutId;
    let searchAbortController;
    let panTimeoutId;

    const defaultZoomLevel = 8;

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

    function initMap() {
        const latlon = [normalizeCoordinate(point.lat), normalizeCoordinate(point.lon)];

        map = L.map(mapEl, { zoomControl: false }).setView(latlon, defaultZoomLevel);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        // reassign the default marker images with the loaded ones
        // (https://leafletjs.com/reference.html#icon-default-option)
        L.Icon.Default.prototype.options.iconUrl = markerIconUrl;
        L.Icon.Default.prototype.options.iconRetinaUrl = markerIconRetinaUrl;
        L.Icon.Default.prototype.options.shadowUrl = markerShadowUrl;
        L.Icon.Default.imagePath = "";

        marker = L.marker(latlon, {
            draggable: true,
            autoPan: true,
        }).addTo(map);

        marker.bindTooltip("drag or right click anywhere on the map to move");

        marker.on("moveend", (e) => {
            if (e.sourceTarget?._latlng) {
                select(e.sourceTarget._latlng.lat, e.sourceTarget._latlng.lng, false);
            }
        });

        map.on("contextmenu", (e) => {
            select(e.latlng.lat, e.latlng.lng, false);
        });
    }

    function destroyMap() {
        resetSearch();
        marker?.remove();
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
                for (const item of addresses) {
                    searchResults.push({
                        lat: item.lat,
                        lon: item.lon,
                        name: item.display_name,
                    });
                }
            } catch (err) {
                console.warn("[address search failed]", err);
            }

            searchResults = searchResults;
            isSearching = false;
        }, debounce);
    }

    function select(lat, lon, centerMap = true) {
        point.lat = normalizeCoordinate(lat);
        point.lon = normalizeCoordinate(lon);

        // center the map
        if (centerMap) {
            marker?.setLatLng([point.lat, point.lon]); // optimistic marker update
            map?.panTo([point.lat, point.lon], { animate: false });
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

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    :global(.leaflet-top) {
        top: 60px;
    }

    :global(.leaflet-touch .leaflet-bar a) {
        width: 30px;
        height: 30px;
        line-height: 30px;
    }
</style>