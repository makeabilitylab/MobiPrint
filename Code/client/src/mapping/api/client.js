import axios from "axios";
import { Capability } from "./types";
import { floorObject } from "./utils";
import { preprocessMap } from "./mapUtils";
import ReconnectingEventSource from "reconnecting-eventsource";
import { robotAPIBase } from "../../config";

// Robot address is configurable on the Connect page (see src/config.js)
export const valetudoAPI = axios.create({
  baseURL: robotAPIBase(),
  withCredentials: true,
});
let currentCommitId = "unknown";
valetudoAPI.interceptors.response.use(response => {
  /*
     As using an outdated frontend with an updated backend might lead to undesirable
     or even catastrophic results, we try to automatically detect this state and
     act accordingly.
     By just looking at the response headers of any api request, we avoid additional
     periodic API requests for polling the current version.
     If something such as a reverse proxy strips these headers, the check will not work.
     Users of advanced setups like these should remember to press ctrl + f5 to force refresh
     after each Valetudo update
  */
  if (response.headers["x-valetudo-commit-id"]) {
    if (currentCommitId !== response.headers["x-valetudo-commit-id"]) {
      if (currentCommitId === "unknown") {
        currentCommitId = response.headers["x-valetudo-commit-id"];
      } else {
        /*
            While we could display a textbox informing the user that the backend changed,
            there wouldn't be any benefit to that as the refresh is mandatory anyway
              By just calling location.reload() here, we avoid having to somehow inject the currentCommitId
            value from this mostly stateless api layer into the React application state
         */
        window.location.reload();
      }
    }
  }
  return response;
});
const SSETracker = new Map();
const subscribeToSSE = (endpoint, event, listener, raw = false) => {
  const key = `${endpoint}@${event}@${raw}`;
  const tracker = SSETracker.get(key);
  if (tracker !== undefined) {
    return tracker();
  }
  const source = new ReconnectingEventSource(valetudoAPI.defaults.baseURL + endpoint, {
    withCredentials: true,
    max_retry_time: 30000
  });
  source.addEventListener(event, event => {
    listener(raw ? event.data : JSON.parse(event.data));
  });
  // eslint-disable-next-line no-console
  console.log(`[SSE] Subscribed to ${endpoint} ${event}`);
  let subscribers = 0;
  const subscriber = () => {
    subscribers += 1;
    return () => {
      subscribers -= 1;
      if (subscribers <= 0) {
        source.close();
        SSETracker.delete(key);
      }
    };
  };
  SSETracker.set(key, subscriber);
  return subscriber();
};
export const fetchCapabilities = () => {
  return valetudoAPI.get("/robot/capabilities").then(({
    data
  }) => {
    return data;
  });
};
export const fetchMap = () => {
  return valetudoAPI.get("/robot/state/map").then(({
    data
  }) => {
    return preprocessMap(data);
  });
};
export const subscribeToMap = listener => {
  return subscribeToSSE("/robot/state/map/sse", "MapUpdated", data => {
    listener(preprocessMap(data));
  });
};
export const fetchStateAttributes = async () => {
  return valetudoAPI.get("/robot/state/attributes").then(({
    data
  }) => {
    return data;
  });
};
export const subscribeToStateAttributes = listener => {
  return subscribeToSSE("/robot/state/attributes/sse", "StateAttributesUpdated", data => {
    return listener(data);
  });
};
export const fetchPresetSelections = async capability => {
  return valetudoAPI.get(`/robot/capabilities/${capability}/presets`).then(({
    data
  }) => {
    return data;
  });
};
export const updatePresetSelection = async (capability, level) => {
  await valetudoAPI.put(`/robot/capabilities/${capability}/preset`, {
    name: level
  });
};
export const sendBasicControlCommand = async command => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.BasicControl}`, {
    action: command
  });
};
export const sendGoToCommand = async point => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.GoToLocation}`, {
    action: "goto",
    coordinates: floorObject(point)
  });
};
export const fetchZoneProperties = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.ZoneCleaning}/properties`).then(({
    data
  }) => {
    return data;
  });
};
export const sendCleanTemporaryZonesCommand = async zones => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.ZoneCleaning}`, {
    action: "clean",
    zones: zones.map(floorObject)
  });
};
export const fetchSegments = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.MapSegmentation}`).then(({
    data
  }) => {
    return data;
  });
};
export const fetchMapSegmentationProperties = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.MapSegmentation}/properties`).then(({
    data
  }) => {
    return data;
  });
};
export const sendCleanSegmentsCommand = async parameters => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.MapSegmentation}`, {
    action: "start_segment_action",
    segment_ids: parameters.segment_ids,
    iterations: parameters.iterations ?? 1,
    customOrder: parameters.customOrder ?? false
  });
};
export const sendJoinSegmentsCommand = async parameters => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.MapSegmentEdit}`, {
    action: "join_segments",
    segment_a_id: parameters.segment_a_id,
    segment_b_id: parameters.segment_b_id
  });
};
export const sendSplitSegmentCommand = async parameters => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.MapSegmentEdit}`, {
    action: "split_segment",
    segment_id: parameters.segment_id,
    pA: parameters.pA,
    pB: parameters.pB
  });
};
export const sendRenameSegmentCommand = async parameters => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.MapSegmentRename}`, {
    action: "rename_segment",
    segment_id: parameters.segment_id,
    name: parameters.name
  });
};
export const sendLocateCommand = async () => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.Locate}`, {
    action: "locate"
  });
};
export const sendAutoEmptyDockManualTriggerCommand = async () => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.AutoEmptyDockManualTrigger}`, {
    action: "trigger"
  });
};
export const fetchConsumableStateInformation = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.ConsumableMonitoring}`).then(({
    data
  }) => {
    return data;
  });
};
export const sendConsumableReset = async parameters => {
  let urlFragment = `${parameters.type}`;
  if (parameters.subType) {
    urlFragment += `/${parameters.subType}`;
  }
  return valetudoAPI.put(`/robot/capabilities/${Capability.ConsumableMonitoring}/${urlFragment}`, {
    action: "reset"
  }).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not reset consumable");
    }
  });
};
export const fetchConsumableProperties = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.ConsumableMonitoring}/properties`).then(({
    data
  }) => {
    return data;
  });
};
export const fetchRobotInformation = async () => {
  return valetudoAPI.get("/robot").then(({
    data
  }) => {
    return data;
  });
};
export const fetchValetudoInformation = async () => {
  return valetudoAPI.get("/valetudo").then(({
    data
  }) => {
    return data;
  });
};
export const sendDismissWelcomeDialogAction = async () => {
  await valetudoAPI.put("/valetudo/action", {
    "action": "dismissWelcomeDialog"
  }).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not dismiss welcome dialog");
    }
  });
};
export const sendRestoreDefaultConfigurationAction = async () => {
  await valetudoAPI.put("/valetudo/action", {
    "action": "restoreDefaultConfiguration"
  }).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not restore default configuration.");
    }
  });
};
export const fetchValetudoVersionInformation = async () => {
  return valetudoAPI.get("/valetudo/version").then(({
    data
  }) => {
    return data;
  });
};
export const fetchValetudoLog = async () => {
  return valetudoAPI.get("/valetudo/log/content").then(({
    data
  }) => {
    return data;
  });
};
export const subscribeToLogMessages = listener => {
  return subscribeToSSE("/valetudo/log/content/sse", "LogMessage", data => {
    return listener(data);
  }, true);
};
export const fetchValetudoLogLevel = async () => {
  return valetudoAPI.get("/valetudo/log/level").then(({
    data
  }) => {
    return data;
  });
};
export const sendValetudoLogLevel = async logLevel => {
  await valetudoAPI.put("/valetudo/log/level", logLevel).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not set new log level");
    }
  });
};
export const fetchSystemHostInfo = async () => {
  return valetudoAPI.get("/system/host/info").then(({
    data
  }) => {
    return data;
  });
};
export const fetchSystemRuntimeInfo = async () => {
  return valetudoAPI.get("/system/runtime/info").then(({
    data
  }) => {
    return data;
  });
};
export const fetchMQTTConfiguration = async () => {
  return valetudoAPI.get("/valetudo/config/interfaces/mqtt").then(({
    data
  }) => {
    return data;
  });
};
export const sendMQTTConfiguration = async mqttConfiguration => {
  return valetudoAPI.put("/valetudo/config/interfaces/mqtt", mqttConfiguration).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not update MQTT configuration");
    }
  });
};
export const fetchMQTTStatus = async () => {
  return valetudoAPI.get("/mqtt/status").then(({
    data
  }) => {
    return data;
  });
};
export const fetchMQTTProperties = async () => {
  return valetudoAPI.get("/mqtt/properties").then(({
    data
  }) => {
    return data;
  });
};
export const fetchHTTPBasicAuthConfiguration = async () => {
  return valetudoAPI.get("/valetudo/config/interfaces/http/auth/basic").then(({
    data
  }) => {
    return data;
  });
};
export const sendHTTPBasicAuthConfiguration = async configuration => {
  return valetudoAPI.put("/valetudo/config/interfaces/http/auth/basic", configuration).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not update HTTP basic auth configuration");
    }
  });
};
export const fetchNetworkAdvertisementConfiguration = async () => {
  return valetudoAPI.get("/networkadvertisement/config").then(({
    data
  }) => {
    return data;
  });
};
export const sendNetworkAdvertisementConfiguration = async configuration => {
  return valetudoAPI.put("/networkadvertisement/config", configuration).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not update NetworkAdvertisement configuration");
    }
  });
};
export const fetchNetworkAdvertisementProperties = async () => {
  return valetudoAPI.get("/networkadvertisement/properties").then(({
    data
  }) => {
    return data;
  });
};
export const fetchNTPClientState = async () => {
  return valetudoAPI.get("/ntpclient/state").then(({
    data
  }) => {
    return data;
  });
};
export const fetchNTPClientConfiguration = async () => {
  return valetudoAPI.get("/ntpclient/config").then(({
    data
  }) => {
    return data;
  });
};
export const sendNTPClientConfiguration = async configuration => {
  return valetudoAPI.put("/ntpclient/config", configuration).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not update NTP client configuration");
    }
  });
};
export const fetchTimerInformation = async () => {
  return valetudoAPI.get("/timers").then(({
    data
  }) => {
    return data;
  });
};
export const deleteTimer = async id => {
  await valetudoAPI.delete(`/timers/${id}`);
};
export const sendTimerCreation = async timerData => {
  await valetudoAPI.post("/timers", timerData).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not create timer");
    }
  });
};
export const sendTimerUpdate = async timerData => {
  await valetudoAPI.put(`/timers/${timerData.id}`, timerData).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not update timer");
    }
  });
};
export const fetchTimerProperties = async () => {
  return valetudoAPI.get("/timers/properties").then(({
    data
  }) => {
    return data;
  });
};
export const fetchValetudoEvents = async () => {
  return valetudoAPI.get("/events").then(({
    data
  }) => {
    return data;
  });
};
export const sendValetudoEventInteraction = async interaction => {
  await valetudoAPI.put(`/events/${interaction.id}/interact`, interaction.interaction).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not interact with event");
    }
  });
};
export const fetchPersistentDataState = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.PersistentMapControl}`).then(({
    data
  }) => {
    return data;
  });
};
const sendToggleMutation = async (capability, enable) => {
  await valetudoAPI.put(`/robot/capabilities/${capability}`, {
    action: enable ? "enable" : "disable"
  }).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error(`Could not change ${capability} state`);
    }
  });
};
export const sendPersistentDataEnable = async enable => {
  await sendToggleMutation(Capability.PersistentMapControl, enable);
};
export const sendMapReset = async () => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.MapReset}`, {
    action: "reset"
  }).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not reset the map");
    }
  });
};
export const sendStartMappingPass = async () => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.MappingPass}`, {
    action: "start_mapping"
  }).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not start the mapping pass");
    }
  });
};
export const fetchSpeakerVolumeState = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.SpeakerVolumeControl}`).then(({
    data
  }) => {
    return data;
  });
};
export const sendSpeakerVolume = async volume => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.SpeakerVolumeControl}`, {
    action: "set_volume",
    value: volume
  }).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not change speaker volume");
    }
  });
};
export const fetchVoicePackManagementState = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.VoicePackManagement}`).then(({
    data
  }) => {
    return data;
  });
};
export const sendVoicePackManagementCommand = async command => {
  return valetudoAPI.put(`/robot/capabilities/${Capability.VoicePackManagement}`, command).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not send voice pack management command");
    }
  });
};
export const sendSpeakerTestCommand = async () => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.SpeakerTest}`, {
    action: "play_test_sound"
  });
};
export const fetchKeyLockState = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.KeyLock}`).then(({
    data
  }) => {
    return data;
  });
};
export const sendKeyLockEnable = async enable => {
  await sendToggleMutation(Capability.KeyLock, enable);
};
export const fetchCarpetModeState = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.CarpetModeControl}`).then(({
    data
  }) => {
    return data;
  });
};
export const sendCarpetModeEnable = async enable => {
  await sendToggleMutation(Capability.CarpetModeControl, enable);
};
export const fetchAutoEmptyDockAutoEmptyControlState = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.AutoEmptyDockAutoEmptyControl}`).then(({
    data
  }) => {
    return data;
  });
};
export const sendAutoEmptyDockAutoEmptyControlEnable = async enable => {
  await sendToggleMutation(Capability.AutoEmptyDockAutoEmptyControl, enable);
};
export const fetchDoNotDisturbConfiguration = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.DoNotDisturb}`).then(({
    data
  }) => {
    return data;
  });
};
export const sendDoNotDisturbConfiguration = async configuration => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.DoNotDisturb}`, configuration).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not update DND configuration");
    }
  });
};
export const fetchWifiStatus = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.WifiConfiguration}`).then(({
    data
  }) => {
    return data;
  });
};
export const fetchWifiConfigurationProperties = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.WifiConfiguration}/properties`).then(({
    data
  }) => {
    return data;
  });
};
export const sendWifiConfiguration = async configuration => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.WifiConfiguration}`, configuration).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not set Wifi configuration");
    }
  });
};
export const fetchWifiScan = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.WifiScan}`).then(({
    data
  }) => {
    return data;
  });
};
export const fetchManualControlState = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.ManualControl}`).then(({
    data
  }) => {
    return data;
  });
};
export const fetchManualControlProperties = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.ManualControl}/properties`).then(({
    data
  }) => {
    return data;
  });
};
export const sendManualControlInteraction = async interaction => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.ManualControl}`, interaction).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not send manual control interaction");
    }
  });
};
export const fetchCombinedVirtualRestrictionsPropertiesProperties = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.CombinedVirtualRestrictions}/properties`).then(({
    data
  }) => {
    return data;
  });
};
export const sendCombinedVirtualRestrictionsUpdate = async parameters => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.CombinedVirtualRestrictions}`, parameters);
};
export const fetchUpdaterConfiguration = async () => {
  return valetudoAPI.get("/updater/config").then(({
    data
  }) => {
    return data;
  });
};
export const sendUpdaterConfiguration = async configuration => {
  return valetudoAPI.put("/updater/config", configuration).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not update updater configuration");
    }
  });
};
export const fetchUpdaterState = async () => {
  return valetudoAPI.get("/updater/state").then(({
    data
  }) => {
    return data;
  });
};
export const sendUpdaterCommand = async command => {
  await valetudoAPI.put("/updater", {
    "action": command
  });
};
export const fetchCurrentStatistics = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.CurrentStatistics}`).then(({
    data
  }) => {
    return data;
  });
};
export const fetchCurrentStatisticsProperties = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.CurrentStatistics}/properties`).then(({
    data
  }) => {
    return data;
  });
};
export const fetchTotalStatistics = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.TotalStatistics}`).then(({
    data
  }) => {
    return data;
  });
};
export const fetchTotalStatisticsProperties = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.TotalStatistics}/properties`).then(({
    data
  }) => {
    return data;
  });
};
export const fetchQuirks = async () => {
  return valetudoAPI.get(`/robot/capabilities/${Capability.Quirks}`).then(({
    data
  }) => {
    return data;
  });
};
export const sendSetQuirkValueCommand = async command => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.Quirks}`, {
    "id": command.id,
    "value": command.value
  });
};
export const fetchRobotProperties = async () => {
  return valetudoAPI.get("/robot/properties").then(({
    data
  }) => {
    return data;
  });
};
export const sendMopDockCleanManualTriggerCommand = async command => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.MopDockCleanManualTrigger}`, {
    action: command
  });
};
export const sendMopDockDryManualTriggerCommand = async command => {
  await valetudoAPI.put(`/robot/capabilities/${Capability.MopDockDryManualTrigger}`, {
    action: command
  });
};
export const fetchValetudoCustomizations = async () => {
  return valetudoAPI.get("/valetudo/config/customizations").then(({
    data
  }) => {
    return data;
  });
};
export const sendValetudoCustomizations = async customizations => {
  return valetudoAPI.put("/valetudo/config/customizations", customizations).then(({
    status
  }) => {
    if (status !== 200) {
      throw new Error("Could not update ValetudoCustomizations");
    }
  });
};