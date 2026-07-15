import Map, { MapContainer, usePendingMapAction } from "./Map";
import { Capability } from "./api";
import GoToTargetClientStructure from "./structures/client_structures/GoToTargetClientStructure";
import TestPointLabelClientStructure from "./structures/client_structures/TestPointLabelStructure";
import { ActionsContainer } from "./Styled";
import SegmentActions from "./actions/live_map_actions/SegmentActions";
import SegmentLabelMapStructure from "./structures/map_structures/SegmentLabelMapStructure";
import ZoneActions from "./actions/live_map_actions/ZoneActions";
import ZoneClientStructure from "./structures/client_structures/ZoneClientStructure";
import GoToActions from "./actions/live_map_actions/GoToActions";
import TestingActions from "./actions/live_map_actions/TestingActions";
import PrintActions from "./actions/live_map_actions/PrintActions";
import React from "react";
import { LiveMapModeSwitcher } from "./LiveMapModeSwitcher";
import TestingGridClientStructure from "./structures/client_structures/TestingGridClientStructure";
import TestPointClientStructure from "./structures/client_structures/TestPointClientStructure";
import PrintObjectClientStructure from "./structures/client_structures/PrintObjectClientStructure";
import MeasureLineClientStruture from "./structures/client_structures/MeasureLineClientStructure";
import RobotStatus from "./RobotStatus";
import MeasureActions from "./actions/live_map_actions/MeasureActions";

const LIVE_MAP_MODE_LOCAL_STORAGE_KEY = "live-map-mode";
class LiveMap extends Map {
    constructor(props) {
        super(props);
        this.supportedModes = [];
        if (props.supportedCapabilities[Capability.MapSegmentation]) {
            // this.supportedModes.push("segments");
        }
        if (props.supportedCapabilities[Capability.ZoneCleaning]) {
            // this.supportedModes.push("zones");
        }
        if (props.supportedCapabilities[Capability.GoToLocation]) {
            this.supportedModes.push("goto");
            
        }
        //Attempt to add testing mode to the map which would overlay grid and allow for testing of the map
        this.supportedModes.push("testing");

        this.supportedModes.push("printing");
    
        this.supportedModes.push("measure");

        this.offset = {x : 0.35, y: 0.35}; // distance to middle in meters

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
            measureLine: undefined, 
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

            measureLine: this.structureManager.getClientStructures().find(s => {
                return s.type === MeasureLineClientStruture.TYPE; 
            })
            
            
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
            case "measure": {
                // this.structureManager.addClientStructure(new MeasureLineClientStruture(tappedPointInMapSpace.x, tappedPointInMapSpace.y));
                // this.updateState();
                // return true;
                // this.draw();
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
                                
                <RobotStatus />

                <ActionsContainer>
                    {this.state.mode === "segments" &&
                <SegmentActions segments={this.state.selectedSegmentIds} onClear={() => {
                        this.structureManager.getMapStructures().forEach(s => {
                            if (s.type === SegmentLabelMapStructure.TYPE) {
                                const label = s;
                                label.selected = false;
                            }
                        });
                        this.updateState();
                        this.redrawLayers();
                    }}/>}
                    {this.state.mode === "zones" &&
                <ZoneActions zones={this.state.zones} convertPixelCoordinatesToCMSpace={(coordinates => {
                        return this.structureManager.convertPixelCoordinatesToCMSpace(coordinates);
                    })} onClear={() => {
                        this.structureManager.getClientStructures().forEach(s => {
                            if (s.type === ZoneClientStructure.TYPE) {
                                this.structureManager.removeClientStructure(s);
                            }
                        });
                        this.updateState();
                        this.draw();
                    }} onAdd={() => {
                        const currentCenter = this.getCurrentViewportCenterCoordinatesInPixelSpace();
                        const p0 = {
                            x: currentCenter.x - 5,
                            y: currentCenter.y - 5
                        };
                        const p1 = {
                            x: currentCenter.x + 5,
                            y: currentCenter.y + 5
                        };
                        this.structureManager.addClientStructure(new ZoneClientStructure(p0.x, p0.y, p1.x, p1.y, true));
                        this.updateState();
                        this.draw();
                    }}/>}
                    {this.state.mode === "goto" &&
            
                <GoToActions goToTarget={this.state.goToTarget} convertPixelCoordinatesToCMSpace={(coordinates => {
                        return this.structureManager.convertPixelCoordinatesToCMSpace(coordinates);
                    })} onClear={() => {
                        this.structureManager.getClientStructures().forEach(s => {
                            if (s.type === GoToTargetClientStructure.TYPE) {
                                this.structureManager.removeClientStructure(s);
                            }
                        });
                        this.updateState();
                        this.draw();
                    }}/>}
                
                {this.state.mode === "testing" &&
                <TestingActions testingGrids={this.state.testingGrids} testPoint={this.state.testPoint} convertPixelCoordinatesToCMSpace={(coordinates => {
                        return this.structureManager.convertPixelCoordinatesToCMSpace(coordinates);
                    })} onClear={() => {
                        this.structureManager.getClientStructures().forEach(s => {
                            if (s.type === TestPointClientStructure.TYPE || s.type === TestPointLabelClientStructure.TYPE ) {
                                this.structureManager.removeClientStructure(s);
                            }
                        });
                        this.updateState();
                        this.draw();
                    }} onMakeGrid={() => {
                        //This sets up the way the grid should be drawn which is sent to the structureManager > CLient Structure > TestingGridClientStructure
                        const rows = 4;
                        const cols = 4;
                        const currentCenter = this.getCurrentViewportCenterCoordinatesInPixelSpace();
                        
                        const p0 = {
                            x: currentCenter.x - 10,
                            y: currentCenter.y - 10
                        };
                        const p1 = {
                            x: currentCenter.x + 10,
                            y: currentCenter.y + 10
                        };

                        this.structureManager.addClientStructure(new TestingGridClientStructure(p0.x, p0.y, p1.x, p1.y, rows, cols, this.state.gridActivated));
                        this.updateState();
                        this.draw();
                        
                        
                    }} generateTestPoint = {() => {
                        //generate a random point within an existing TestingGridClientStructure
                        const testingGrid = this.structureManager.getClientStructures().find(s => s.type === TestingGridClientStructure.TYPE);
                        if (testingGrid === undefined) {
                            return;
                        } else {
                            const minBound = {x: testingGrid.x0,
                                              y: testingGrid.y0};
                            const maxBound = {x: testingGrid.x1, 
                                              y: testingGrid.y1};
                                              
                            const randomPoint = {x: Math.random() * (maxBound.x - minBound.x) + minBound.x, y: Math.random() * (maxBound.y - minBound.y) + minBound.y};
                            // const randomPointDim = {x: randomPoint.x - minBound.x, y: randomPoint.y - minBound.y};


                            const gridP0 = {x: testingGrid.x0, y: testingGrid.y0};
                            const gridP1 = {x: testingGrid.x1, y: testingGrid.y1};

                            this.structureManager.addClientStructure(new TestPointClientStructure(randomPoint.x, randomPoint.y));
                            this.structureManager.addClientStructure(new TestPointLabelClientStructure(randomPoint.x, randomPoint.y, gridP0.x, gridP0.y, gridP1.x, gridP1.y, ));
                            
                            this.updateState();
                            this.draw();
                            return true; 
                        }}
                    } 
                />}

                {this.state.mode === "measure" &&
                <MeasureActions convertPixelCoordinatesToCMSpace={(coordinates => {
                    return this.structureManager.convertPixelCoordinatesToCMSpace(coordinates);
                })}  convertCMCoordinatesToPixelSpace={(coordinates => {
                    return this.structureManager.convertCMCoordinatesToPixelSpace(coordinates);
                })}   onMakeMeasureLine = {() => {
                    const currentCenter = this.getCurrentViewportCenterCoordinatesInPixelSpace();
                    const p0 = {
                        x: currentCenter.x - 20,
                        y: currentCenter.y - 20
                    };
                    const p1 = {
                        x: currentCenter.x + 20,
                        y: currentCenter.y + 20
                    };
                    this.structureManager.addClientStructure(new MeasureLineClientStruture(p0.x, p0.y, p1.x, p1.y, true));
                    this.updateState();
                    this.draw();
                }}/>
                }

                {this.state.mode === "printing" &&
                <PrintActions PrintObject={this.state.printObject} convertPixelCoordinatesToCMSpace={(coordinates => {
                    return this.structureManager.convertPixelCoordinatesToCMSpace(coordinates);
                })}  convertCMCoordinatesToPixelSpace={(coordinates => {
                    return this.structureManager.convertCMCoordinatesToPixelSpace(coordinates);
                })} onClear={() => {
                    this.structureManager.getClientStructures().forEach(s => {
                        if (s.type === PrintObjectClientStructure.TYPE) {
                            this.structureManager.removeClientStructure(s);
                        }
                    });
                    this.updateState();
                    this.draw();
                }} placePrint = {() => {
                    //place a print object at the current center of the viewport
                    const currentCenter = this.getCurrentViewportCenterCoordinatesInPixelSpace();
                    const objectCenter = {x: currentCenter.x, y: currentCenter.y};
                    const initPrintAngle= {printAngle: 0}
                    const initScale = {printScale: 1}
                    this.structureManager.addClientStructure(new PrintObjectClientStructure(objectCenter.x, objectCenter.y, initPrintAngle.printAngle, initScale.printScale));                    
                    this.updateState();
                    this.draw();
                }}  onRotate={(Angle) => {
                    //rotate print object to the value of the slider 
                    this.structureManager.getClientStructures().forEach(s => {
                        if (s.type === PrintObjectClientStructure.TYPE) {
                            s.printAngle = Angle;
                        }

                    });
        
                    this.updateState();
                    this.draw();
                }} onScale={(Scale) => {
                    //scale print object to the value of the slider
                    this.structureManager.getClientStructures().forEach(s => {
                        if (s.type === PrintObjectClientStructure.TYPE) {
                            s.printScale = Scale;
                        }
                    });
                    this.updateState();
                    this.draw();
                }} onReachedLocation={() => {
                }}
                
              />}

                </ActionsContainer>
            </MapContainer>);
    }
}
export default LiveMap;