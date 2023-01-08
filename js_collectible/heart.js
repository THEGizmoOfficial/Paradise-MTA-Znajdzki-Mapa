//Serca
function addHeartLayer2021(map) {
    map.addInteractiveLayer('heart2021', heart2021, {
        name: "Walentynki - Serca [2021] Soon",
        create_checkbox: true,
        create_feature_popup: true,
        is_default: true,
        sidebar_icon_html: '❤️',
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: Utils.getCustomIcon('❤️'),
                riseOnHover: true
            });
        },
        coordsToLatLng: function (coords) {
            return gtaCoordinatesToLeaflet(coords);
        }
    });
}

function addHeartLayer2022(map) {
    map.addInteractiveLayer('heart2022', heart2022, {
        name: "Walentynki - Serca [2022] Niekompletne",
        create_checkbox: true,
        create_feature_popup: true,
        is_default: true,
        sidebar_icon_html: '❤️',
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: Utils.getCustomIcon('❤️'),
                riseOnHover: true
            });
        },
        coordsToLatLng: function (coords) {
            return gtaCoordinatesToLeaflet(coords);
        }
    });
}