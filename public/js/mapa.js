"use strict";

const coordenadasSousa = {
    latitude: -6.7592,
    longitude: -38.2281,
    zoom: 14
};

const mapa = L.map("mapa").setView(
    [
        coordenadasSousa.latitude,
        coordenadasSousa.longitude
    ],
    coordenadasSousa.zoom
);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
).addTo(mapa);