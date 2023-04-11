//Dynie
function addPumpkinLayer2021(map) {
    map.addInteractiveLayer('pumpkin2021', pumpkin2021, {
        name: "Dynie [2021] [Archiwum] 0/150",
        create_checkbox: true,
        create_feature_popup: true,
        is_default: true,
        sidebar_icon_html: '🎃',
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: Utils.getCustomIcon('🎃'),
                riseOnHover: true
            });
        },
        coordsToLatLng: function (coords) {
            return gtaCoordinatesToLeaflet(coords);
        }
    });
}

function addPumpkinLayer2022(map) {
    map.addInteractiveLayer('pumpkin2022', pumpkin2022, {
        name: "Dynie [2022] [Archiwum] 70/125",
        create_checkbox: true,
        create_feature_popup: true,
        is_default: true,
        sidebar_icon_html: '🎃',
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: Utils.getCustomIcon('🎃'),
                riseOnHover: true
            });
        },
        coordsToLatLng: function (coords) {
            return gtaCoordinatesToLeaflet(coords);
        }
    });
}