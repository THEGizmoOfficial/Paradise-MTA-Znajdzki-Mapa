class InteractiveLayer {
    #create_checkbox;
    #ignore_next_resize = new Set();
    #feature_group;
    #geojsons = new Array();
    #highlighted_layers = new Array();
    #interactive_map;
    #is_default;
    #layers = new Map();
    #polygon_style_highlights = new Map();
    #resize_observer = new ResizeObserver(entries => {
        for (const entry of entries) {
            let feature_id = entry.target.closest('.popup-id').id.split(':')[2];
            if (this.#ignore_next_resize.has(feature_id)) {
                this.#ignore_next_resize.delete(feature_id);
                continue;
            }

            this.#getLayers(feature_id).forEach(layer => {
                if (layer.isPopupOpen()) {
                    this.#resize_observer.unobserve(entry.target);

                    layer.getPopup().update();

                    this.#ignore_next_resize.add(feature_id);
                    for (const element of document.getElementById(`popup:${this.id}:${feature_id}`).getElementsByClassName('popup-media')) {
                        this.#resize_observer.observe(element);
                    }
                }
            });
        }
    });
    #sidebar;
    #sidebar_list_html = undefined;
    #website_subdir;

    #default_onEachFeature = function (feature, layer) { };
    #default_pointToLayer = function (feature, latlng) {
        return L.marker(latlng, {
            icon: Utils.getCustomIcon(this.id),
            riseOnHover: true
        });
    };
    #default_polygon_style = function (feature) { return {}; };
    #default_polygon_style_highlight = function () {
        return {
            opacity: 1.0,
            fillOpacity: 0.7
        }
    };
    #default_sidebar_icon_html = function () {
        return `<img class="sidebar-image" src="ui/icons/${this.id}.png" />`;
    };

    constructor(id, geojson, interactive_map, args) {
        let defaults = {
            name: id,
            create_checkbox: false,
            create_feature_popup: false,
            is_default: false,
            sidebar_icon_html: this.#default_sidebar_icon_html,
            pointToLayer: this.#default_pointToLayer,
            onEachFeature: this.#default_onEachFeature,
            polygon_style: this.#default_polygon_style,
            polygon_style_highlight: this.#default_polygon_style_highlight,
            coordsToLatLng: L.GeoJSON.coordsToLatLng
        };

        let params = { ...defaults, ...args };

        this.id = id;
        this.name = params.name;
        this.#interactive_map = interactive_map;

        this.#create_checkbox = params.create_checkbox;
        this.#is_default = params.is_default;
        this.#feature_group = params.feature_group ? params.feature_group : L.featureGroup.subGroup(this.#interactive_map.getClusterGroup());
        this.#sidebar = this.#interactive_map.getSidebar();
        this.#website_subdir = this.#interactive_map.getWebsiteSubdir();

        if (this.#create_checkbox) {
            this.#sidebar_list_html = this.#createSidebarTab(params.sidebar_icon_html);
        }

        this.addGeoJson(geojson, {
            create_feature_popup: params.create_feature_popup,
            pointToLayer: params.pointToLayer,
            onEachFeature: params.onEachFeature,
            polygon_style: params.polygon_style,
            polygon_style_highlight: params.polygon_style_highlight,
            coordsToLatLng: params.coordsToLatLng
        });
    }

    addGeoJson(geojson, args) {
        let defaults = {
            create_feature_popup: false,
            pointToLayer: this.#default_pointToLayer,
            onEachFeature: this.#default_onEachFeature,
            polygon_style: this.#default_polygon_style,
            polygon_style_highlight: this.#default_polygon_style_highlight,
            coordsToLatLng: L.GeoJSON.coordsToLatLng
        };

        let params = { ...defaults, ...args };
        var onEachFeature = params.onEachFeature.bind(this);

        var geojson_layer = L.geoJSON(geojson, {
            pointToLayer: params.pointToLayer.bind(this),
            onEachFeature: (feature, layer) => {
                if (this.#create_checkbox) {
                    this.#createSidebarCheckbox(feature);
                }

                if (params.create_feature_popup) {
                    this.#createFeaturePopup(feature, layer);
                }

                onEachFeature(feature, layer);

                this.#setFeature(feature.properties.id, layer);
            },
            coordsToLatLng: params.coordsToLatLng.bind(this),
            style: params.polygon_style
        });

        this.#geojsons.push(geojson_layer);

        if (params.polygon_style_highlight instanceof Function) {
            this.#polygon_style_highlights.set(geojson_layer, params.polygon_style_highlight.bind(this));
        } else {
            this.#polygon_style_highlights.set(geojson_layer, params.polygon_style_highlight);
        }

        this.#feature_group.addLayer(geojson_layer);
        geojson_layer.eachLayer(layer => {
            layer.feature._origin = this.#feature_group.getLayerId(geojson_layer);
        });
    }

    getAllLayers() {
        return this.#layers;
    }

    getGroup() {
        return this.#feature_group;
    }

    getGroupBounds() {
        var bounds = L.latLngBounds();

        this.#layers.forEach((layers, key) => {
            bounds.extend(this.#getLayerBounds(key));
        });

        return bounds;
    }

    hasFeature(id) {
        return this.#layers.has(id);
    }

    highlightFeature(id) {
        this.#getLayers(id).forEach(layer => {
            if (layer instanceof L.Path) {
                this.#highlightPolygon(layer);
            } else {
                this.#highlightPoint(layer);
            }
        });

        this.#interactive_map.getMap().on('click', () => { this.removeFeatureHighlight(id); });
    }

    isDefault() {
        return this.#is_default;
    }

    removeAllHighlights() {
        this.#highlighted_layers.forEach(layer => {
            if (layer instanceof L.Path) {
                this.#removePolygonHighlight(layer);
            } else {
                this.#removePointHighlight(layer);
            }
        });

        this.#highlighted_layers = [];
        this.#interactive_map.getMap().off('click', this.removeAllHighlights, this);
    }

    removeFeatureHighlight(id) {
        var layers = this.#getLayers(id);

        for (const index of this.#reverseKeys(this.#highlighted_layers)) {
            var layer = this.#highlighted_layers[index];

            if (!layers.includes(layer)) {
                continue;
            }

            if (layer instanceof L.Path) {
                this.#removePolygonHighlight(layer);
                this.#highlighted_layers.splice(index, 1);
            } else {
                this.#removePointHighlight(layer);
                this.#highlighted_layers.splice(index, 1);
            }
        }

        this.#interactive_map.getMap().off('click', () => { this.removeFeatureHighlight(id); });
    }

    removeLayer(layer) {
        this.#getGroupForEdit(layer).removeLayer(layer);
    }

    setSidebarColumnCount() {
        if (!this.#sidebar_list_html) {
            return;
        }

        var length = 4;
        var columns = 1;

        this.#layers.forEach((layer, id) => {
            if (id.length > length) {
                length = id.length;
            }
        });

        if (length < 5) {
            columns = 3;
        } else if (length < 15) {
            columns = 2;
        }

        this.#sidebar_list_html.setAttribute('style', `grid-template-columns: repeat(${columns}, auto)`);
    }

    show() {
        this.getGroup().addTo(this.#interactive_map.getMap());
    }

    zoomTo() {
        this.#interactive_map.zoomToBounds(this.getGroupBounds());
    }

    zoomToFeature(id) {
        var layers = this.#getLayers(id);

        if (layers.length > 1) {
            this.#interactive_map.zoomToBounds(this.#getLayerBounds(id));
            return;
        }

        var layer = layers[0];

        if (layer instanceof L.Path) {
            this.#interactive_map.zoomToBounds(this.#getLayerBounds(id));
            return;
        }

        var group = this.#getGroupForEdit(layer);

        if (group instanceof L.MarkerClusterGroup && group.hasLayer(layer)) {
            group.zoomToShowLayer(layer, () => {
                window.setTimeout(() => {
                    if (this.#interactive_map.getMap().getZoom() < this.#interactive_map.getMaxZoom()) {
                        this.#interactive_map.zoomToBounds(this.#getLayerBounds(id));
                    }
                }, 300);
            });
            return;
        }

        this.#interactive_map.zoomToBounds(this.#getLayerBounds(id));
    }

    #addLayer(layer) {
        this.#getGroupForEdit(layer).addLayer(layer);
    }

    #createFeaturePopup(feature, layer) {
        let content = function (layer) {
            var html = document.createElement('div');
            html.className = 'popup-id';
            html.id = `popup:${this.id}:${feature.properties.id}`;

            var title = document.createElement('h2');
            title.className = 'popup-title';
            title.innerHTML = feature.properties.name ? feature.properties.name : feature.properties.id;

            html.appendChild(title);

            let media_html = getPopupMedia(feature, this.id);
            if (media_html) {
                html.appendChild(media_html);
            }

            if (feature.properties.description) {
                var description = document.createElement('p');
                description.className = 'popup-description';
                var span = document.createElement('span');
                span.setAttribute('style', 'white-space: pre-wrap');
                span.appendChild(document.createTextNode(feature.properties.description));
                description.appendChild(span);

                html.appendChild(description);
            }

            if (this.#create_checkbox && document.getElementById(this.id + ':' + feature.properties.id)) {
                var label = document.createElement('label');
                label.className = 'popup-checkbox is-fullwidth';

                var label_text = document.createTextNode('Ukryj ten znacznik');

                var checkbox = document.createElement('input');
                checkbox.type = 'checkbox';

                if (localStorage.getItem(`${this.#website_subdir}:${this.id}:${feature.properties.id}`)) {
                    checkbox.checked = true;
                }

                checkbox.addEventListener('change', element => {
                    if (element.target.checked) {
                        document.getElementById(this.id + ':' + feature.properties.id).checked = true;
                        this.#getLayers(feature.properties.id).forEach(l => {
                            this.#getGroupForEdit(l).removeLayer(l);
                        });
                        localStorage.setItem(`${this.#website_subdir}:${this.id}:${feature.properties.id}`, true);
                    } else {
                        document.getElementById(this.id + ':' + feature.properties.id).checked = false;
                        this.#getLayers(feature.properties.id).forEach(l => {
                            this.#addLayer(l);
                        });
                        localStorage.removeItem(`${this.#website_subdir}:${this.id}:${feature.properties.id}`);
                    }
                });

                label.appendChild(checkbox);
                label.appendChild(label_text);
                html.appendChild(label);
            }

            return html;
        }.bind(this);

        layer.bindPopup(content, { maxWidth: "auto" });

        layer.on('popupopen', event => {
            this.#interactive_map.getShareMarker().removeMarker();
            Utils.setHistoryState(this.id, feature.properties.id);
            for (const entry of document.getElementById(`popup:${this.id}:${feature.properties.id}`).getElementsByClassName('popup-media')) {
                this.#resize_observer.observe(entry);
            }
        }, this);

        layer.on('popupclose', event => {
            this.#interactive_map.getShareMarker().prevent();
            Utils.setHistoryState(undefined, undefined, this.#website_subdir);
            this.#resize_observer.disconnect();
        }, this);
    }

    #createSidebarCheckbox(feature) {
        if (!document.getElementById(this.id + ':' + feature.properties.id)) {
            var list_entry = document.createElement('li');
            list_entry.className = 'flex-grow-1';

            var leave_function = () => { this.removeFeatureHighlight(feature.properties.id); };
            list_entry.addEventListener('mouseenter', () => { this.highlightFeature(feature.properties.id); });
            list_entry.addEventListener('mouseleave', leave_function);

            var checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            checkbox.id = this.id + ':' + feature.properties.id;
            checkbox.className = 'flex-grow-0';

            var label = document.createElement('label')
            label.appendChild(document.createTextNode(feature.properties.id + ' '));
            label.htmlFor = checkbox.id;
            label.className = 'flex-grow-1';

            var icon = document.createElement('i');
            icon.className = 'fas fa-crosshairs fa-xs';

            var locate_button = document.createElement('button');
            locate_button.innerHTML = icon.outerHTML;
            locate_button.addEventListener('click', () => {
                if (window.matchMedia('(max-device-width: 767px)').matches) {
                    this.#sidebar.close();
                }

                Utils.setHistoryState(this.id, feature.properties.id);

                this.#interactive_map.removeAllHighlights();
                this.highlightFeature(feature.properties.id);
                this.zoomToFeature(feature.properties.id);

                list_entry.removeEventListener('mouseleave', leave_function);
                window.setTimeout(() => {
                    list_entry.addEventListener('mouseleave', leave_function);
                }, 3000);
            });
            locate_button.className = 'flex-grow-0';

            list_entry.appendChild(checkbox);
            list_entry.appendChild(label);
            list_entry.appendChild(locate_button);
            this.#sidebar_list_html.appendChild(list_entry);

            if (localStorage.getItem(`${this.#website_subdir}:${this.id}:${feature.properties.id}`)) {
                checkbox.checked = true;
            }

            if (document.getElementById(this.id + ':' + feature.properties.id) != null) {
                document.getElementById(this.id + ':' + feature.properties.id).addEventListener('change', element => {
                    if (element.target.checked) {
                        this.#getLayers(feature.properties.id).forEach(l => {
                            this.#getGroupForEdit(l).removeLayer(l);
                        });
                        localStorage.setItem(`${this.#website_subdir}:${this.id}:${feature.properties.id}`, true);
                    } else {
                        this.#getLayers(feature.properties.id).forEach(l => {
                            this.#addLayer(l);
                        });
                        localStorage.removeItem(`${this.#website_subdir}:${this.id}:${feature.properties.id}`);
                    }
                });
            }
        }
    }

    #createSidebarTab(icon_html) {
        var list = document.createElement('ul');
        list.className = 'collectibles_list';

        var icon = icon_html;

        if (icon_html instanceof Function) {
            icon = icon_html.bind(this);
            icon = icon();
        }

        this.#sidebar.addPanel({
            id: this.id,
            tab: icon,
            title: this.name,
            pane: '<p></p>'
        });
        document.getElementById(this.id).appendChild(list);

        return list;
    }

    #getGroupForEdit(layer) {
        var group = this.#feature_group.getLayer(layer.feature._origin);
        var parent_group = this.#feature_group;
        while (parent_group instanceof L.FeatureGroup.SubGroup) {
            parent_group = this.#feature_group.getParentGroup();
        }

        if (parent_group instanceof L.MarkerClusterGroup) {
            group = parent_group;
        }

        return group;
    }
    
    #getLayers(id) {
        return this.#layers.get(id);
    }

    #getLayerBounds(id) {
        var bounds = L.latLngBounds();

        this.#getLayers(id).forEach(layer => {
            if (layer instanceof L.Polyline) {
                bounds.extend(layer.getBounds());
            } else if (layer instanceof L.Circle) {
                // FIXME: This somehow fails:
                // bounds.extend(layer.getBounds());
                // Do this in the meantime:
                var position = layer._latlng;
                var radius = layer._mRadius;
                bounds.extend([[position.lat - radius, position.lng - radius], [position.lat + radius, position.lng + radius]]);
            } else {
                bounds.extend([layer.getLatLng()]);
            }
        });

        return bounds;
    }

    #highlightPoint(layer) {
        if (this.#highlighted_layers.includes(layer)) {
            return;
        }

        var icon = layer.getIcon();
        icon.options.html = `<div class="map-marker-ping"></div>${icon.options.html}`;
        layer.setIcon(icon);

        this.#highlighted_layers.push(layer);
    }

    #highlightPolygon(layer) {
        if (this.#highlighted_layers.includes(layer)) {
            return;
        }

        this.#polygon_style_highlights.forEach((style, geojson) => {
            if (geojson.hasLayer(layer)) {
                if (style instanceof Function) {
                    layer.setStyle(style(layer.feature));
                } else {
                    layer.setStyle(style);
                }
            }
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }

        this.#highlighted_layers.push(layer);
    }

    #removePointHighlight(layer) {
        if (!this.#highlighted_layers.includes(layer)) {
            return;
        }

        var icon = layer.getIcon();
        icon.options.html = icon.options.html.replace('<div class="map-marker-ping"></div>', '');
        layer.setIcon(icon);
    }

    #removePolygonHighlight(layer = undefined) {
        if (layer) {
            if (!this.#highlighted_layers.includes(layer)) {
                return;
            }

            this.#geojsons.forEach(geojson => {
                if (geojson.hasLayer(layer)) {
                    geojson.resetStyle(layer);
                    return;
                }
            });
            return;
        }

        this.#geojsons.forEach(geojson => {
            geojson.resetStyle(layer);
        });
    }

    * #reverseKeys(arr) {
        var key = arr.length - 1;

        while (key >= 0) {
            yield key;
            key -= 1;
        }
    }

    #setFeature(id, layer) {
        if (!this.#layers.has(id)) {
            this.#layers.set(id, new Array());
        }

        this.#layers.get(id).push(layer);
    }
}