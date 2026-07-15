
import { useQuery , useMutation } from "react-query";
import { addPrintCommand, addPrintFile, fetchPrintFiles } from "./mobiprintclient";


var QueryKeys;

(function (QueryKeys) {
    QueryKeys["PrintFiles"] = "printFiles";
})(QueryKeys || (QueryKeys = {}));

export const usePrintFilesQuery = () => {
    return useQuery(QueryKeys.PrintFiles, fetchPrintFiles);
}

export const useAddPrintFileMutation = () => {
    return useMutation(addPrintFile);
}

export const useAddPrintCommandMutation = () => {
    return useMutation(addPrintCommand);
}

// NOTE: a useStartPrintQuery hook used to live here. It called
// startPrint(printFile) during render (instead of passing a function to
// react-query), which fired a real M32 print command at the printer every
// time the component rendered. Start prints imperatively instead, e.g. via
// startPrint() in mobiprintclient.js, from an explicit user action.
