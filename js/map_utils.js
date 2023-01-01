function getPopupMedia(feature, list_id) {
    var html = document.createElement('div');

    if (feature.properties.image_id) {
        var prefix = '';
        var suffix = '';

        var image_link = document.createElement('a');
        if (feature.properties.image_link) {
            switch (list_id) {
                case 'gift2022':
                    image_link.href = `${feature.properties.image_link}`;
                    break;

                default:
                    image_link.href = prefix + feature.properties.image_id + suffix;
                    break;
            }
        } else {
            image_link.href = prefix + feature.properties.image_id + suffix;
        }

        var image = document.createElement('img');
        image.src = prefix + feature.properties.image_id + suffix;
        image.className = 'popup-media';

        image_link.appendChild(image);
        html.appendChild(image_link);
    } else if (feature.properties.video_id) {
        var video = document.createElement('iframe');
        video.className = 'popup-media';
        //video.width = POPUP_WIDTH_16_9;
        //video.height = POPUP_WIDTH_16_9 / 16 * 9;
        video.src = `https://www.youtube-nocookie.com/embed/${feature.properties.video_id}`;
        video.title = 'Film YouTube';
        video.frameborder = 0;
        //video.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; allowfullscreen'

        html.appendChild(video);
    }

    return html;
}

function gtaCoordinatesToLeaflet(coords) {
    lx = (coords[0] + 3000) * 0.032;
    ly = (coords[1] - 3000) * 0.032;
    return L.latLng(ly, lx);
}