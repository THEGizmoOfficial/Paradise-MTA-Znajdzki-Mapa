//Serca
function addHeartLayer2022(map) {
    map.addInteractiveLayer('heart2022', heart2022, {
        name: "Serca [2022] [Archiwum] 93/120",
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