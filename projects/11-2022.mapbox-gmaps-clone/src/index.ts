import { h1 } from "@thi.ng/hiccup-html";
import { $compile } from "@thi.ng/rdom";
import mapbox, { Map, NavigationControl } from "mapbox-gl";
import { tw } from "twind";
// import * as MapboxDirections from '@mapbox/mapbox-gl-directions';

const MB_TOKEN = import.meta.env.VITE_MB_TOKEN ?? "";

// https://docs.mapbox.com/mapbox-gl-js/api/

// https://docs.mapbox.com/help/glossary/access-token/
mapbox.accessToken = <string> MB_TOKEN;

// https://developer.mozilla.org/en-US/docs/Web/API/Navigator
// https://developer.mozilla.org/en-US/docs/Web/API/Geolocation
navigator.geolocation.getCurrentPosition(success, error, {
  enableHighAccuracy: true,
});
function error(err: GeolocationPositionError) {
  setupMap([-0.12, 51.50]);
}
function success(p: GeolocationPosition) {
  const c = p.coords;
  setupMap([c.longitude, c.latitude]);
}

function setupMap(center: [number, number]) {
  // https://docs.mapbox.com/mapbox-gl-js/api/map/
  const map = new Map({
    container: "app",
    style: "mapbox://styles/mapbox/streets-v11",
    center,
    zoom: 15,
  });

  // https://docs.mapbox.com/mapbox-gl-js/api/markers/
  // https://docs.mapbox.com/mapbox-gl-js/api/markers/#navigationcontrol
  const nav = new NavigationControl({
    visualizePitch: true,
  });
  map.addControl(nav, "bottom-right");

  // https://github.com/mapbox/mapbox-gl-directions
  // https://github.com/mapbox/mapbox-gl-directions/blob/master/API.md
  // const directions = new MapboxDirections({
  //   accessToken: MB_TOKEN,
  // });

  // map.addControl(directions, 'top-left');
}
