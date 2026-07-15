import Map, { MapContainer, usePendingMapAction } from "./Map";
import { Capability } from "./api";
import GoToTargetClientStructure from "./structures/client_structures/GoToTargetClientStructure";
import TestPointLabelClientStructure from "./structures/client_structures/TestPointLabelStructure";

import SegmentLabelMapStructure from "./structures/map_structures/SegmentLabelMapStructure";

import ZoneClientStructure from "./structures/client_structures/ZoneClientStructure";

import React from "react";
import { LiveMapModeSwitcher } from "./LiveMapModeSwitcher";
import TestingGridClientStructure from "./structures/client_structures/TestingGridClientStructure";
import TestPointClientStructure from "./structures/client_structures/TestPointClientStructure";
import PrintObjectClientStructure from "./structures/client_structures/PrintObjectClientStructure";

import MapStatus from "./MapStatus";
const LIVE_MAP_MODE_LOCAL_STORAGE_KEY = "live-map-mode";
class PreviewLiveMap extends Map {
    constructor(props) {
        super(props);
        this.supportedModes = [];

        if (props.supportedCapabilities[Capability.GoToLocation]) {
            this.supportedModes.push("goto");
            
        }
        //Attempt to add testing mode to the map which would overlay grid and allow for testing of the map
        // this.supportedModes.push("testing");

        // this.supportedModes.push("printing");

        let modeIdxToUse = 0;
        try {
            const previousMode = window.localStorage.getItem(LIVE_MAP_MODE_LOCAL_STORAGE_KEY);
            modeIdxToUse = Math.max(this.supportedModes.findIndex(e => e === previousMode), 0 //default to the first if not defined or not supported
            );
        }
        catch (e) {
            /* users with non-working local storage will have to live with the defaults */
        }
        //setting initial state of the map
        this.state = {
            mode: this.supportedModes[modeIdxToUse] ?? "none",
            selectedSegmentIds: [],
            zones: [],
            goToTarget: undefined,
            gridActivated: false,
            testingGrids: [],
            testPoint: undefined,
            printObject: undefined,
        };
    }

    updateState() {
        super.updateState();
        this.setState({
            // update the state with the latest segments from client structures
            zones: this.structureManager.getClientStructures().filter(s => {
                return s.type === ZoneClientStructure.TYPE;
            }),
            //update the state with the latest targets from client structures
            goToTarget: this.structureManager.getClientStructures().find(s => {
                return s.type === GoToTargetClientStructure.TYPE;
            }),
            // update the state with the latest grids from client structures
            testingGrids: this.structureManager.getClientStructures().filter(s => {
                return s.type === TestingGridClientStructure.TYPE;
            }),
            // update the state with the latest test Points from client structures
            testPoint: this.structureManager.getClientStructures().find(s => {
                return s.type === TestPointClientStructure.TYPE;
            }),

            // update the state with the latest test Points from client structures
            testPointLabel: this.structureManager.getClientStructures().find(s => {
                return s.type === TestPointLabelClientStructure.TYPE;
            }),

            // update the state with the latest print object from client structures
            printObject: this.structureManager.getClientStructures().find(s => {
                return s.type === PrintObjectClientStructure.TYPE;
            }), 
            
        
            
        });

    }
    onTap(evt) {
        if (super.onTap(evt, this.state.mode)) {
            return true;
        }
        const { x, y } = this.relativeCoordinatesToCanvas(evt.x0, evt.y0);
        const tappedPointInMapSpace = this.ctxWrapper.mapPointToCurrentTransform(x, y);
        switch (this.state.mode) {
            case "segments": {
                const intersectingSegmentId = this.mapLayerManager.getIntersectingSegment(tappedPointInMapSpace.x, tappedPointInMapSpace.y);
                if (intersectingSegmentId) {
                    const segmentLabels = this.structureManager.getMapStructures().filter(s => {
                        return s.type === SegmentLabelMapStructure.TYPE;
                    });
                    const matchedSegmentLabel = segmentLabels.find(l => {
                        return l.id === intersectingSegmentId;
                    });
                    if (matchedSegmentLabel) {
                        matchedSegmentLabel.onTap();
                        this.updateState();
                        this.redrawLayers();
                        return true;
                    }
                }
                break;
            }
            case "goto": {
                if (this.structureManager.getClientStructures().filter(s => {
                    return s.type !== GoToTargetClientStructure.TYPE;
                }).length === 0 || this.structureManager.getClientStructures().filter(s => {
                    return s.type === TestingGridClientStructure.TYPE;
                }).length > 0) {
                    this.structureManager.getClientStructures().forEach(s => {
                        if (s.type === GoToTargetClientStructure.TYPE) {
                            this.structureManager.removeClientStructure(s);
                        }
                    });
                    this.structureManager.addClientStructure(new GoToTargetClientStructure(tappedPointInMapSpace.x, tappedPointInMapSpace.y));
                    this.updateState();
                    this.draw();
                    return true;
                }
                break;
            }
            // case "testing": {
            //     break;
            // }
        }
    }
    componentDidUpdate(prevProps, prevState) {
        super.componentDidUpdate(prevProps, prevState);
        if (this.state.selectedSegmentIds.length > 0 ||
            this.state.zones.length > 0 ||
            this.state.goToTarget !== undefined) {
            usePendingMapAction.setState({ hasPendingMapAction: true });
        }
        else {
            usePendingMapAction.setState({ hasPendingMapAction: false });
        }
    }
    render() {
        return (<MapContainer style={{ overflow: "visible" }}>
                <canvas ref={this.canvasRef} style={{
                    width: "100%",
                    height: "100%",
                    imageRendering: "crisp-edges"
                }}/>

                {/* <RobotStatus /> */}
                <MapStatus />

                {this.supportedModes.length > 0 &&
                <LiveMapModeSwitcher supportedModes={this.supportedModes} currentMode={this.state.mode} setMode={(newMode) => {
                        this.structureManager.getMapStructures().forEach(s => {
                            if (s.type === SegmentLabelMapStructure.TYPE) {
                                const label = s;
                                label.selected = false;
                            }
                        });
                        this.structureManager.getClientStructures().forEach(s => {
                            if (s.type === GoToTargetClientStructure.TYPE) {
                                this.structureManager.removeClientStructure(s);
                            }
                            if (s.type === ZoneClientStructure.TYPE) {
                                this.structureManager.removeClientStructure(s);
                            }
                            if (s.type === TestingGridClientStructure.TYPE) {
                                this.structureManager.removeClientStructure(s);
                            }
                        });
                        this.updateState();
                        this.redrawLayers();
                        this.setState({
                            mode: newMode
                        });
                        try {
                            window.localStorage.setItem(LIVE_MAP_MODE_LOCAL_STORAGE_KEY, newMode);
                        }
                        catch (e) {
                            /* intentional */
                        }
                    }}/>
                    }

                                
            </MapContainer>);
    }
}
export default PreviewLiveMap
;