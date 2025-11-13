import * as VM from "@voidmerge/voidmerge-code"
import { unpack } from "msgpackr";

interface File {
  data: Uint8Array;
  hash: Uint8Array;
  mime: string;
}

class Headers {
  #hdr: { [k: string]: string };

  constructor() {
    this.#hdr = {};
  }

  contentType(t: string): Headers {
    this.#hdr["content-type"] = t;
    return this;
  }

  cache(): Headers {
    this.#hdr["cache-control"] = "public, max-age=7200, s-maxage=7200";
    return this;
  }

  finish(): { [k: string]: string } {
    return this.#hdr;
  }
}

VM.defineVoidMergeHandler(async (req) => {
  if (req instanceof VM.RequestObjCheck) {
    return new VM.ResponseObjCheckOk();
  } else if (req instanceof VM.RequestFn) {
    if (req.path.startsWith("static-site")) {
      let appPath = `static-site~${req.path.substring(12)}`;
      if (appPath === "static-site~" || appPath === "static-site~/") {
        appPath = "static-site~index.html";
      }
      const { data } = await VM.objGet({
        meta: VM.ObjMeta.fromParts({ appPath }),
      });
      const parsed = unpack(data) as File;
      return new VM.ResponseFnOk({
        status: 200,
        body: parsed.data,
        headers: new Headers().contentType(parsed.mime).cache().finish(),
      });
    } else {
      return new VM.ResponseFnOk({
        status: 404,
        body: new TextEncoder().encode("Not Found"),
        headers: new Headers()
          .contentType("text/plain; charset=utf-8")
          .finish(),
      });
    }
  }

  throw new Error("Unhandled Request");
})
