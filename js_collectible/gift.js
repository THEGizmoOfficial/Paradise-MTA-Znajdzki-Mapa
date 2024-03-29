//Prezenty
function addGiftLayer2021(map) {
    map.addInteractiveLayer('gift2021', gift2021, {
        name: "Prezenty [2021] [Archiwum] 120/120",
        create_checkbox: true,
        create_feature_popup: true,
        is_default: true,
        sidebar_icon_html: '🎁',
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: Utils.getCustomIcon('🎁'),
                riseOnHover: true
            });
        },
        coordsToLatLng: function (coords) {
            return gtaCoordinatesToLeaflet(coords);
        }
    });
}

function addGiftLayer2022(map) {
    map.addInteractiveLayer('gift2022', gift2022, {
        name: "Prezenty [2022] [Archiwum] 115/115",
        create_checkbox: true,
        create_feature_popup: true,
        is_default: true,
        sidebar_icon_html: '🎁',
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: Utils.getCustomIcon('🎁'),
                riseOnHover: true
            });
        },
        coordsToLatLng: function (coords) {
            return gtaCoordinatesToLeaflet(coords);
        }
    });
}