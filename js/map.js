var interactive_map = new InteractiveMap('map', {
    max_good_zoom: 6,
    max_map_zoom: 8,
    website_source: '',
    website_subdir: '',
});

interactive_map.addTileLayer("Mapa Gry", {  //
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