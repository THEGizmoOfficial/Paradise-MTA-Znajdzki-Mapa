var interactive_map = new InteractiveMap('map', {
    max_good_zoom: 6,
    max_map_zoom: 8,
    website_source: 'https://github.com/THEGizmoOfficial/Paradise-MTA-Znajdzki-Mapa',
    website_subdir: 'Paradise-MTA-Znajdzki-Mapa',
});

interactive_map.addTileLayer("Mapa Paradise", {
    minNativeZoom: 2,
    maxNativeZoom: 5,
}, 'ui/maps/Paradise/{z}/{x}/{y}.png')

interactive_map.addTileLayer("Mapa Gry", {
    minNativeZoom: 2,
    maxNativeZoom: 5,
});

interactive_map.addTileLayer("Mapa MTA", {
    minNativeZoom: 0,
    maxNativeZoom: 5,
    tileSize: 262,
}, 'ui/maps/MTA_SA/{z}/{x}/{y}.png')

addHeartLayer2021(interactive_map);
addEggLayer2021(interactive_map);
addPumpkinLayer2021(interactive_map);
addGiftLayer2021(interactive_map);

addHeartLayer2022(interactive_map);
addEggLayer2022(interactive_map);
addPumpkinLayer2022(interactive_map);
addGiftLayer2022(interactive_map);

interactive_map.finalize();