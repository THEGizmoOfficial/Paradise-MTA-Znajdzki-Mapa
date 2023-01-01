class InteractiveMap {
    #cluster_group;
    #common_attribution = `
    <li><a href="https://github.com/Leaflet/Leaflet" title="Leaflet">Leaflet</a> na licencji <a href="https://github.com/Leaflet/Leaflet/blob/ee71642691c2c71605bacff69456760cfbc80a2a/LICENSE">BSD2</a>.</li>
    <li><a href="https://github.com/Leaflet/Leaflet.markercluster" title="Leaflet.markercluster">Leaflet.markercluster</a> na licencji <a href="https://github.com/Leaflet/Leaflet.markercluster/blob/31360f226e1a40c03c71d68b016891beb5e63370/MIT-LICENCE.txt">MIT</a>.</li>
    <li><a href="https://github.com/ghybs/Leaflet.FeatureGroup.SubGroup" title="Leaflet.FeatureGroup.SubGroup">Leaflet.FeatureGroup.SubGroup</a> na licencji <a href="https://github.com/ghybs/Leaflet.FeatureGroup.SubGroup/blob/c7ec78b0cf13be39b00d46beb50c954b8b4c78bb/LICENSE">BSD2</a>.</li>
    <li><a href="https://github.com/noerw/leaflet-sidebar-v2" title="leaflet-sidebar-v2">leaflet-sidebar-v2</a> na licencji <a href="https://github.com/noerw/leaflet-sidebar-v2/blob/4ceb0006647c33afff9982502fb5e572eb514158/LICENSE">MIT</a>.</li>
    <li><a href="https://github.com/geoman-io/leaflet-geoman" title="Leaflet-Geoman">Leaflet-Geoman</a> na licencji <a href="https://github.com/geoman-io/leaflet-geoman/blob/1fdc918fa39ffa84327fdf639fa75865168f716d/LICENSE">MIT</a>.</li>
    <li>Ikony z <a href="https://fontawesome.com/" title="Font Awesome">Font Awesome</a> na licencji <a href="https://fontawesome.com/license">CCA4</a>.</li>
    `
    #custom_layers;
    #interactive_layers = new Map();
    #map;
    #overlay_maps = new Object();
    #share_marker;
    #sidebar;
    #tile_layers = new Object();
    #user_layers;
    #website_subdir = '';

    constructor(id, args) {
        let defaults = {
            maxClusterRadius: 20,
            attribution: '',
            max_good_zoom: 5,
            website_source: '',
            website_subdir: '',
            max_map_zoom: 8
        }
        let params = { ...defaults, ...args };

        this.#map = L.map(id, {
            crs: L.CRS.Simple,
            maxZoom: params.max_map_zoom,
        });;
        this.MAX_ZOOM = params.max_good_zoom;
        this.#website_subdir = params.website_subdir;

        this.#cluster_group = L.markerClusterGroup({
            spiderfyOnMaxZoom: true,
            maxClusterRadius: params.maxClusterRadius
        }).addTo(this.#map);

        this.#setUpToolbar();
        this.#setUpSidebar(params.attribution, params.website_source, this.#website_subdir);

        this.#user_layers = JSON.parse(localStorage.getItem(`${this.#website_subdir}:user_layers`));
        this.#share_marker = new ShareMarker(this);
        this.#custom_layers = new CustomLayers(this);

        this.#map.on('overlayadd', event => {
            this.addUserLayer(event.name);
        });
        this.#map.on('overlayremove ', event => {
            this.removeUserLayer(event.name);

            if (this.hasLayer(this.#getLayerByName(event.name))) {
                this.#getLayerByName(event.name).removeAllHighlights();
            }
        });
    }

    addTileLayer(name, args, url = `ui/maps/GTA_SA/{z}/{x}/{y}.png`) {
        let defaults = {
            minNativeZoom: 3,
            maxNativeZoom: 5,
            noWrap: true,
            detectRetina: true
        }
        let params = { ...defaults, ...args };
        params.maxNativeZoom = L.Browser.retina ? params.maxNativeZoom - 1 : params.maxNativeZoom;

        var tile_layer = new L.tileLayer(url, params);

        if (Object.keys(this.#tile_layers).length < 1) {
            tile_layer.addTo(this.#map);
        }

        this.#tile_layers[name] = tile_layer;
    }

    addInteractiveLayer(id, geojson, args) {
        let layer = new InteractiveLayer(id, geojson, this, args);

        this.#interactive_layers.set(layer.id, layer);

        return layer;
    }

    addUserLayer(name) {
        if (!this.#user_layers.includes(name)) {
            this.#user_layers.push(name);
        }
        localStorage.setItem(`${this.#website_subdir}:user_layers`, JSON.stringify(this.#user_layers));
    }

    finalize() {
        this.getLayers().forEach((layer, id) => {
            layer.setSidebarColumnCount();
        });

        this.getLayers().forEach((layer, id) => {
            this.#overlay_maps[layer.name] = layer.getGroup();
        });

        L.control.layers(this.#tile_layers, this.#overlay_maps, {
            hideSingleBase: true
        }).addTo(this.#map);

        this.#custom_layers.updateControls();

        if (!this.#user_layers) {
            this.#user_layers = new Array();
            this.getLayers().forEach((layer, id) => {
                if (layer.isDefault()) {
                    this.#user_layers.push(layer.name);
                }
            });
        }
        this.getLayers().forEach((layer, id) => {
            if (this.#user_layers.includes(layer.name)) {
                layer.show();
            }
        });
        this.#custom_layers.addLayersToMap(this.#user_layers);

        this.zoomToBounds(this.#getBounds());

        this.getLayers().forEach((layer, layer_id) => {
            layer.getAllLayers().forEach((array, feature_id) => {
                if (localStorage.getItem(`${this.#website_subdir}:${layer_id}:${feature_id}`)) {
                    array.forEach(feature => {
                        layer.removeLayer(feature);
                    });
                }
            });
        });

        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        if (urlParams.has('share')) {
            const share = urlParams.get('share');

            let latlng = share.split(",");
            this.#share_marker.move([latlng[1], latlng[0]]);

            this.#share_marker.highlight();
            this.#share_marker.zoomTo();
        } else if (urlParams.has('list')) {
            const list = urlParams.get('list');

            if (this.hasLayer(list)) {
                var layer = this.getLayer(list);;

                layer.show();

                if (!urlParams.has('id')) {
                    layer.zoomTo();

                    this.#sidebar._tabitems.every(element => {
                        if (element._id == list) {
                            this.#sidebar.open(list);
                            return false;
                        }
                        return true;
                    });
                } else {
                    const id = urlParams.get('id');

                    if (layer.hasFeature(id)) {
                        layer.highlightFeature(id);
                        layer.zoomToFeature(id);
                        this.#map.on('click', this.removeAllHighlights, this);
                    }
                }
            }
        }
    }

    getClusterGroup() {
        return this.#cluster_group;
    }

    getLayer(id) {
        if (!this.#interactive_layers.has(id)) {
            return undefined;
        }

        return this.#interactive_layers.get(id);
    }

    getLayers() {
        return this.#interactive_layers;
    }

    getMap() {
        return this.#map;
    }

    getMaxZoom() {
        return this.MAX_ZOOM;
    }

    getShareMarker() {
        return this.#share_marker;
    }

    getSidebar() {
        return this.#sidebar;
    }

    getWebsiteSubdir() {
        return this.#website_subdir;
    }

    //getUserLayers() {
        //return this.#user_layers;
    //}

    hasLayer(id) {
        return this.#interactive_layers.has(id);
    }

    removeAllHighlights() {
        this.getLayers().forEach((layer, id) => {
            layer.removeAllHighlights();
        });

        this.#share_marker.removeHighlight();

        this.#map.off('click', this.removeAllHighlights, this);
    }

    removeUserLayer(name) {
        this.#user_layers = this.#user_layers.filter((value, index, array) => {
            return value != name;
        });
        localStorage.setItem(`${this.#website_subdir}:user_layers`, JSON.stringify(this.#user_layers));
    }

    zoomToBounds(bounds) {
        this.#map.fitBounds(bounds, {
            maxZoom: this.MAX_ZOOM
        });
    }

    #setUpSidebar(attribution, website, website_subdir) {
        this.#sidebar = L.control.sidebar({
            autopan: true,
            closeButton: true,
            container: 'sidebar',
            position: 'left'
        }).addTo(this.#map);

        this.#sidebar.addPanel({
            id: 'reset',
            tab: '<i class="fas fa-trash"></i>',
            position: 'bottom',
            button: () => {
                if (!confirm('Czy naprawdę usunąć wszystkie zaznaczone lokalizacje i wszystkie niestandardowe warstwy znaczników?')) {
                    return;
                }

                window.onbeforeunload = () => { };

                for (var key in localStorage) {
                    if (key.startsWith(`${website_subdir}:`)) {
                        localStorage.removeItem(key);
                    }
                };

                location.reload();
            }
        });

        /*this.#sidebar.addPanel({
            id: 'edit',
            tab: '<i class="fas fa-map-marked"></i>',
            title: 'Dodaj lub edytuj znacznik',
            position: 'bottom',
            button: () => {
                if (!this.#custom_layers.isInEditMode()) {
                    this.#custom_layers.enableEditing();
                } else {
                    this.#custom_layers.disableEditing();
                }
            }
        });*/

        this.#sidebar.addPanel({
            id: 'attributions',
            tab: '<i class="fas fa-info-circle"></i>',
            title: 'Informacje',
            position: 'bottom',
            pane: `<h3>Projekt powstał dla ułatwienia szukania znajdźek na podstawie starych pozycji z poprzednich lat</h3><h3>Nowe znajdźki też się tu pojawią jeśli będą znalezione (Mapa będzie aktualizowana)<h3><h3>Po kliknięciu na znacznik pokaże się zdjęcie jeżeli zostało dodane i opis jeśli byłoby trudno znaleźć<h3><h3>Projekt wykorzystuje:</h3><ul>${attribution}${this.#common_attribution}</ul>`
        });

        /*this.#sidebar.addPanel({
            id: 'visit-github',
            tab: '<i class="fab fa-github"></i>',
            position: 'bottom',
            button: website
        });*/

        /*this.#sidebar.addPanel({
            id: 'go-back',
            tab: '<i class="fas fa-arrow-left"></i>',
            position: 'bottom',
            button: ''
        });*/

        this.#sidebar.on('content', event => {
            if (event.id == 'attributions') return;

            this.#map.addLayer(this.#interactive_layers.get(event.id).getGroup());
            Utils.setHistoryState(event.id);
            this.getShareMarker().removeMarker();
        });

        this.#sidebar.on('closing', () => {
            Utils.setHistoryState(undefined, undefined, this.#website_subdir);
            this.getShareMarker().removeMarker();
        })
    }

    #setUpToolbar() {
        L.PM.setOptIn(true);

        this.#map.pm.Toolbar.createCustomControl({
            name: 'add_layer',
            block: 'custom',
            title: 'Dodaj niestandardową warstwę',
            className: 'fas fa-plus',
            toggle: false,
            onClick: () => {
                this.#custom_layers.createLayer();
            }
        });
        this.#map.pm.Toolbar.createCustomControl({
            name: 'remove_layer',
            block: 'custom',
            title: 'Usuń niestandardową warstwę',
            className: 'fas fa-trash',
            toggle: false,
            onClick: () => {
                this.#custom_layers.removeLayer();
            }
        });
        this.#map.pm.Toolbar.createCustomControl({
            name: 'export_layer',
            block: 'custom',
            title: 'Eksportuj niestandardową warstwę',
            className: 'fas fa-file-download',
            toggle: false,
            onClick: () => {
                this.#custom_layers.exportLayer();
            }
        });
        this.#map.pm.addControls({
            position: 'bottomright',
            drawCircleMarker: false,
            oneBlock: false
        });
        this.#map.pm.toggleControls();
    }

    #getBounds() {
        var bounds = L.latLngBounds();

        this.getLayers().forEach((layer, k) => {
            bounds.extend(layer.getGroupBounds());
        });

        return bounds;
    }

    #getLayerByName(name) {
        var interactive_layer = undefined;
        this.#interactive_layers.forEach((layer, id) => {
            if (layer.name == name) {
                interactive_layer = layer;
            }
        });

        return interactive_layer;
    }
}