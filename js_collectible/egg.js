//Jajka
function addEggLayer2021(map) {
    map.addInteractiveLayer('egg2021', egg2021, {
        name: "Wielkanoc - Jajka [2021] Soon",
        create_checkbox: true,
        create_feature_popup: true,
        is_default: true,
        sidebar_icon_html: '🥚',
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: Utils.getCustomIcon('🥚'),
                riseOnHover: true
            });
        },
        coordsToLatLng: function (coords) {
            return gtaCoordinatesToLeaflet(coords);
        }
    });
}

function addEggLayer2022(map) {
    map.addInteractiveLayer('egg2022', egg2022, {
        name: "Wielkanoc - Jajka [2022]",
        create_checkbox: true,
        create_feature_popup: true,
        is_default: true,
        sidebar_icon_html: '🥚',
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: Utils.getCustomIcon('🥚'),
                riseOnHover: true
            });
        },
        coordsToLatLng: function (coords) {
            return gtaCoordinatesToLeaflet(coords);
        }
    });
}

function addEggLayer2023(map) {
    map.addInteractiveLayer('egg2023', egg2023, {
        name: "Wielkanoc - Jajka [2023]",
        create_checkbox: true,
        create_feature_popup: true,
        is_default: true,
        sidebar_icon_html: '🥚',
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: Utils.getCustomIcon('🥚'),
                riseOnHover: true
            });
        },
        coordsToLatLng: function (coords) {
            return gtaCoordinatesToLeaflet(coords);
        }
    });
}