import * as VM from "@voidmerge/voidmerge-code";
import { vmStaticSiteObjCheck, vmStaticSiteFn } from "./code.js";
VM.defineVoidMergeHandler(async (req) => {
    if (req instanceof VM.RequestObjCheck) {
        await vmStaticSiteObjCheck(req);
        return new VM.ResponseObjCheckOk();
    }
    else if (req instanceof VM.RequestFn) {
        const res = await vmStaticSiteFn(req);
        if (res) {
            return res;
        }
    }
    throw new Error("Unhandled Request");
});
//# sourceMappingURL=code-standalone.js.map