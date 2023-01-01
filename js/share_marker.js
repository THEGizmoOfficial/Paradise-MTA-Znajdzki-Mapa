class ShareMarker extends L.Marker {
    #interactive_map;
    #map;

    constructor(interactive_map) {
        super([0, 0], {
            icon: Utils.getCustomIcon('fa-share-alt'),
            riseOnHover: true,
            draggable: true,
            pmIgnore: true
        });

        this.#interactive_map = interactive_map;
        this.#map = this.#interactive_map.getMap();

        this.on('moveend', this.removeHighlight);
        this.on('moveend', event => {
            history.replaceState({}, "", `?share=${event.target._latlng.lng},${event.target._latlng.lat}`);
        });

        this.bindPopup(() => {
            var html = document.createElement('div');

            var title = document.createElement('h2');
            title.className = 'popup-title';
            title.innerHTML = 'Twój znacznik';
            html.appendChild(title);

            var button = document.createElement('button');
            button.innerHTML = 'Usuń';
            button.className = 'popup-checkbox is-fullwidth';
            html.appendChild(button);

            button.addEventListener('click', () => {
                this.removeMarker();
                Utils.setHistoryState(undefined, undefined, this.#interactive_map.getWebsiteSubdir());
            });

            return html;
        });

        this.turnOn();
    }

    highlight() {
        var icon = this.getIcon();
        icon.options.html = `<div class="map-marker-ping"></div>${icon.options.html}`;
        this.setIcon(icon);

        this.#map.on('click', this.removeHighlight, this);
    }

    move(latlng) {
        this.setLatLng([latlng[0], latlng[1]]);
        this.addTo(this.#map);
    }

    prevent(time = 300) {
        this.#map.off('click', this.#moveEvent, this);
        window.setTimeout(() => {
            this.#map.on('click', this.#moveEvent, this);
        }, time);
    }

    removeHighlight() {
        var icon = this.getIcon();
        icon.options.html = icon.options.html.replace('<div class="map-marker-ping"></div>', '');
        this.setIcon(icon);

        this.off('moveend', this.removeHighlight);
        this.#map.off('click', this.removeHighlight, this);
    }

    removeMarker() {
        this.removeHighlight();
        this.remove();
    }

    turnOff() {
        this.removeMarker();
        this.#map.off('click', this.#moveEvent, this);
    }

    turnOn() {
        this.#map.on('click', this.#moveEvent, this);
    }

    zoomTo() {
        let bounds = [];

        bounds.push([this._latlng.lat, this._latlng.lng]);

        this.#interactive_map.zoomToBounds(bounds);
    }

    #moveEvent(event) {
        this.setLatLng(event.latlng);
        this.addTo(this.#map);
        history.replaceState({}, "", `?share=${event.latlng.lng},${event.latlng.lat}`);
    }
}