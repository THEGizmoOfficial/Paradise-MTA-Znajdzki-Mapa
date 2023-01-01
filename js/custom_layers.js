class CustomLayers {
    #custom_layers = new Map();
    #custom_layer_controls;
    #edit_mode = false;
    #interactive_map;
    #map;
    #website_subdir;

    constructor(interactive_map) {
        this.#map = interactive_map.getMap();
        this.#interactive_map = interactive_map;
        this.#website_subdir = interactive_map.getWebsiteSubdir();

        this.#loadFromStorage();

        this.#extendDefaultLayerControl(this.#map);
        this.#custom_layer_controls = new L.Control.Layers(null, Object.fromEntries(this.#custom_layers), {
            collapsed: false
        });

        window.onbeforeunload = this.#saveToStorage.bind(this);

        window.setInterval(this.#saveToStorage.bind(this), 300000);
    }

    addLayersToMap(layers) {
        layers.forEach(layer => {
            if (this.#hasLayer(layer)) {
                this.#map.addLayer(this.#getLayer(layer));
            }
        });
    }

    createLayer() {
        var active_layer = this.#getActiveLayer();

        var layer_id = prompt("Unikalna nowa nazwa warstwy");

        if (layer_id == null || layer_id == '' || layer_id in this.#custom_layers) {
            return false;
        }

        var new_layer = L.featureGroup(null, {
            pmIgnore: false
        });

        this.#custom_layers.set(layer_id, new_layer);

        this.#custom_layer_controls.addOverlay(new_layer, layer_id);

        new_layer.addTo(this.#map);

        this.#map.pm.setGlobalOptions({
            layerGroup: new_layer,
            markerStyle: {
                icon: Utils.getCustomIcon(layer_id.substring(0, 2))
            }
        });

        this.#interactive_map.addUserLayer(layer_id);

        if (this.isInEditMode()) {
            this.#interactive_map.removeUserLayer(this.#getActiveLayerId());
            this.#switchLayer(active_layer, new_layer);
        }

        return true;
    }

    disableEditing() {
        L.PM.setOptIn(true);

        var active_layer = this.#getActiveLayer();
        if (active_layer) {
            L.PM.reInitLayer(active_layer);
        }

        this.#map.pm.disableDraw();
        this.#map.pm.disableGlobalEditMode();
        this.#map.pm.disableGlobalDragMode();
        this.#map.pm.disableGlobalRemovalMode();
        this.#map.pm.disableGlobalCutMode();
        this.#map.pm.disableGlobalRotateMode();
        this.#map.pm.toggleControls();

        this.#edit_mode = false;
        this.updateControls();
        this.#map.off('pm:create');
        this.#interactive_map.getShareMarker().turnOn();
    }

    enableEditing() {
        if (this.#getActiveLayerCount() < 1) {
            if (!this.createLayer()) {
                return;
            }
        } else if (this.#getActiveLayerCount() > 1) {
            alert('Wybierz tylko jedną warstwę niestandardową do edycji');
            return;
        }

        var active_layer = this.#getActiveLayer();
        if (!active_layer) {
            return;
        }

        L.PM.setOptIn(false);
        L.PM.reInitLayer(active_layer);

        this.#map.pm.toggleControls();
        this.#map.pm.setGlobalOptions({
            layerGroup: active_layer,
            markerStyle: {
                icon: Utils.getCustomIcon(this.#getActiveLayerId().substring(0, 2))
            }
        });

        this.#edit_mode = true;
        this.#hideControls();
        this.#interactive_map.getShareMarker().turnOff();
        Utils.setHistoryState(undefined, undefined, this.#website_subdir);

        this.#map.on('pm:create', event => {
            this.#createPopup(event.layer);
        });
    }

    exportLayer() {
        var active_layer = this.#getActiveLayer();

        if (!active_layer) {
            return;
        }

        Utils.download(this.#getActiveLayerId() + '.json', JSON.stringify(active_layer.toGeoJSON(), null, '    '));
    }

    isInEditMode() {
        return this.#edit_mode;
    }

    updateControls() {
        if (this.#getLayerCount() > 0) {
            this.#showControls();
        } else {
            this.#hideControls();
        }
    }

    removeLayer() {
        if (!this.isInEditMode()) {
            return;
        }

        if (!confirm('Czy na pewno usunąć bieżącą niestandardową warstwę znaczników?')) {
            return;
        }

        var active_layer = this.#getActiveLayer();

        if (active_layer) {
            var active_layer_id = this.#getActiveLayerId();
            localStorage.removeItem(`${this.#website_subdir}:${active_layer_id}`);
            this.#custom_layer_controls.removeLayer(active_layer);
            this.#map.removeLayer(active_layer);
            this.#custom_layers.delete(active_layer_id);

            this.#interactive_map.removeUserLayer(active_layer_id);
        }

        this.disableEditing();
    }
    
    #createPopup(layer) {
        layer.bindPopup(() => {
            var html = document.createElement('div');

            var id_p = document.createElement('p');

            var id_input = document.createElement('input');
            id_input.setAttribute('type', 'text');
            id_input.id = layer._leaflet_id + ':id';

            var id_label = document.createElement('label');
            id_label.htmlFor = id_input.id;
            id_label.innerHTML = 'ID: ';

            if (!layer.feature) {
                layer.feature = {};
                layer.feature.type = 'Feature';
            }

            if (!layer.feature.properties) {
                layer.feature.properties = {};
            }

            if (layer.feature.properties.id) {
                id_input.value = layer.feature.properties.id;
            }

            id_input.addEventListener('change', event => {
                layer.feature.properties.id = event.target.value;
            });

            id_p.appendChild(id_label);
            id_p.appendChild(id_input);
            html.appendChild(id_p);

            var name_p = document.createElement('p');

            var name_input = document.createElement('input');
            name_input.setAttribute('type', 'text');
            name_input.id = layer._leaflet_id + ':name';

            var name_label = document.createElement('label');
            name_label.htmlFor = name_input.id;
            name_label.innerHTML = 'Nazwa: ';

            if (layer.feature.properties.name) {
                name_input.value = layer.feature.properties.name;
            }

            name_input.addEventListener('change', event => {
                layer.feature.properties.name = event.target.value;
            });

            name_p.appendChild(name_label);
            name_p.appendChild(name_input);
            html.appendChild(name_p);

            var image_id_p = document.createElement('p');

            var image_id_input = document.createElement('input');
            image_id_input.setAttribute('type', 'text');
            image_id_input.id = layer._leaflet_id + ':image_id';

            var image_id_label = document.createElement('label');
            image_id_label.htmlFor = image_id_input.id;
            image_id_label.innerHTML = 'Obrazek link: ';

            if (layer.feature.properties.image_id) {
                image_id_input.value = layer.feature.properties.image_id;
            }

            image_id_input.addEventListener('change', event => {
                layer.feature.properties.image_id = event.target.value;
            });

            image_id_p.appendChild(image_id_label);
            image_id_p.appendChild(image_id_input);
            html.appendChild(image_id_p);

            var video_id_p = document.createElement('p');

            var video_id_input = document.createElement('input');
            video_id_input.setAttribute('type', 'text');
            video_id_input.id = layer._leaflet_id + ':video_id';

            var video_id_label = document.createElement('label');
            video_id_label.htmlFor = video_id_input.id;
            video_id_label.innerHTML = 'Film link: ';

            if (layer.feature.properties.video_id) {
                video_id_input.value = layer.feature.properties.video_id;
            }

            video_id_input.addEventListener('change', event => {
                layer.feature.properties.video_id = event.target.value;
            });

            video_id_p.appendChild(video_id_label);
            video_id_p.appendChild(video_id_input);
            html.appendChild(video_id_p);

            var description_p = document.createElement('p');

            var description_input = document.createElement('input');
            description_input.setAttribute('type', 'text');
            description_input.id = layer._leaflet_id + ':description';

            var description_label = document.createElement('label');
            description_label.htmlFor = description_input.id;
            description_label.innerHTML = 'Opis: ';

            if (layer.feature.properties.description) {
                description_input.value = layer.feature.properties.description;
            }

            description_input.addEventListener('change', event => {
                layer.feature.properties.description = event.target.value;
            });

            description_p.appendChild(description_label);
            description_p.appendChild(description_input);
            html.appendChild(description_p);

            return html;
        });

        layer.on('popupopen', event => {
            Utils.setHistoryState(undefined, undefined, this.#website_subdir);
            this.#interactive_map.getShareMarker().removeMarker();
        });

        layer.on('popupclose', event => {
            if (this.isInEditMode()) return;

            this.#interactive_map.getShareMarker().prevent();
        });
    }

    #extendDefaultLayerControl(map) {
        L.Control.Layers.include({
            getOverlays: function (args = {}) {
                var defaults = {
                    only_active: false
                };
                var params = { ...defaults, ...args }
                var control, layers;
                layers = {};
                control = this;
                control._layers.forEach(function (obj) {
                    var layerName;

                    if (obj.overlay) {
                        
                        layerName = obj.name;

                        if (params.only_active && !map.hasLayer(obj.layer)) {
                            return;
                        }
                        return layers[layerName] = map.hasLayer(obj.layer);
                    }
                });

                return layers;
            }
        });
    }

    #getActiveLayer() {
        if (this.#getActiveLayerCount() != 1) {
            return undefined;
        }

        return this.#custom_layers.get(this.#getActiveLayerId());
    }

    #getActiveLayerCount() {
        var active_layers = this.#custom_layer_controls.getOverlays({
            only_active: true
        });

        return Object.keys(active_layers).length;
    }

    #getActiveLayerId() {
        var active_layers = this.#custom_layer_controls.getOverlays({
            only_active: true
        });

        return Object.keys(active_layers)[0];
    }

    #getLayer(id) {
        return this.#custom_layers.get(id);
    }

    #getLayerCount() {
        return this.#custom_layers.size;
    }

    #hasLayer(id) {
        return this.#custom_layers.has(id);
    }

    #hideControls() {
        this.#map.removeControl(this.#custom_layer_controls);
    }

    #loadFromStorage() {
        if (localStorage.getItem(`${this.#website_subdir}:custom_layers`)) {
            JSON.parse(localStorage.getItem(`${this.#website_subdir}:custom_layers`)).forEach(id => {
                if (!localStorage.getItem(`${this.#website_subdir}:${id}`)) {
                    return;
                }

                var geojson = JSON.parse(localStorage.getItem(`${this.#website_subdir}:${id}`));

                var geojson_layer = L.geoJSON(geojson, {
                    pointToLayer: (feature, latlng) => {
                        return L.marker(latlng, {
                            icon: Utils.getCustomIcon(id.substring(0, 2)),
                            riseOnHover: true
                        });
                    },
                    onEachFeature: (feature, l) => {
                        this.#createPopup(l);
                    },
                    pmIgnore: false
                });
                this.#custom_layers.set(id, geojson_layer);
            });
        }
    }

    #saveToStorage() {
        var array = new Array();

        if (this.#getLayerCount() < 1) {
            localStorage.removeItem(`${this.#website_subdir}:custom_layers`);
            return;
        }

        this.#custom_layers.forEach((layer, id) => {
            localStorage.setItem(`${this.#website_subdir}:${id}`, JSON.stringify(layer.toGeoJSON()));
            array.push(id);
        });

        localStorage.setItem(`${this.#website_subdir}:custom_layers`, JSON.stringify(array));
    }

    #showControls() {
        this.#custom_layer_controls = new L.Control.Layers(null, Object.fromEntries(this.#custom_layers), {
            collapsed: false
        });

        this.#map.addControl(this.#custom_layer_controls);
    }

    #switchLayer(old_layer, new_layer) {
        this.#map.off('pm:create');
        this.#map.removeLayer(old_layer);
        L.PM.setOptIn(true);
        L.PM.reInitLayer(old_layer);

        L.PM.setOptIn(false);
        L.PM.reInitLayer(new_layer);

        this.#map.on('pm:create', event => {
            this.#createPopup(event.layer);
        });
    }
}