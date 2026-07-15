import { PROCESS_LAYERS } from "./MapLayerManagerUtils";


let cachedLayers = [];
window.self.postMessage({
    ready: true
});
window.self.addEventListener("message", (evt) => {
    //According to SonarJS S2819, this might be problematic
    //I honestly have no idea if this check is actually needed in a webworker context, but I'll do as the tool says.
    // if (evt.origin !== "") {
    //     // eslint-disable-next-line no-console
    //     console.warn(`Received event with unexpected origin "${evt.origin}"`);
    //     return;
    // }
    if (evt.data.mapLayers) {
        cachedLayers = evt.data.mapLayers;
    }
    const rendered = PROCESS_LAYERS(cachedLayers, evt.data.pixelSize, evt.data.colors, evt.data.backgroundColors, evt.data.selectedSegmentIds);
    window.self.postMessage({
        pixelData: rendered.pixelData.buffer,
        width: rendered.width,
        height: rendered.height,
        left: rendered.left,
        top: rendered.top,
        segmentLookupData: rendered.segmentLookupData.buffer,
        segmentLookupIdMapping: rendered.segmentLookupIdMapping
    }, {
        transfer: [
            rendered.pixelData.buffer,
            rendered.segmentLookupData.buffer
        ]
    });
});