class Utils {
    static download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    static getCustomIcon(icon_id = undefined, icon_mode = undefined) {
        var background_path = icon_mode ? `ui/icons/point_${icon_mode}.svg` : "ui/icons/point.svg";

        if (!icon_id) {
            return L.divIcon({
                className: 'map-marker',
                html: `
            <img class="map-marker-background" src="${background_path}" />
            `,
                iconSize: [25, 41],
                popupAnchor: [1, -34],
                iconAnchor: [12, 41],
                tooltipAnchor: [0, 0]
            });
        }

        if (icon_id.startsWith('fa-')) {
            return L.divIcon({
                className: 'map-marker',
                html: `
            <img class="map-marker-background" src="${background_path}" />
            <div class="map-marker-foreground-wrapper"><i class="fas ${icon_id} map-marker-foreground"></i></div>
            `,
                iconSize: [25, 41],
                popupAnchor: [1, -34],
                iconAnchor: [12, 41],
                tooltipAnchor: [0, 0]
            });
        } else if (icon_id.length > 2) {
            return L.divIcon({
                className: 'map-marker',
                html: `
                <img class="map-marker-background" src="${background_path}" />
                <div class="map-marker-foreground-wrapper"><img class='map-marker-foreground' src='ui/icons/${icon_id}.png' /></div>
                `,
                iconSize: [25, 41],
                popupAnchor: [1, -34],
                iconAnchor: [12, 41],
                tooltipAnchor: [0, 0]
            });
        } else if (icon_id.length < 3) {
            return L.divIcon({
                className: 'map-marker',
                html: `
            <img class="map-marker-background" src="${background_path}" />
            <div class="map-marker-foreground-wrapper"><p class="map-marker-foreground">${icon_id}</p></div>
            `,
                iconSize: [25, 41],
                popupAnchor: [1, -34],
                iconAnchor: [12, 41],
                tooltipAnchor: [0, 0]
            });
        }
    }

    static setHistoryState(list_id = undefined, feature_id = undefined, website_subdir = '') {
        if (list_id && feature_id) {
            history.replaceState({}, "", `?list=${list_id}&id=${feature_id}`);
        } else if (list_id) {
            history.replaceState({}, "", `?list=${list_id}`);
        } else {
            switch (window.location.protocol) {
                case 'http:':
                case 'https:':
                    history.replaceState({}, "", `/${website_subdir}/`);
                    break;
                case 'file:':
                    history.replaceState({}, "", `index.html`);
                    break;
                default:
            }
        }
    }
}