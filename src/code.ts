import * as VM from "@voidmerge/voidmerge-code";
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

/**
 * Execute this in your VoidMergeHandler to validate static site objects.
 */
export async function vmStaticSiteObjCheck(req: VM.RequestObjCheck) {
  const appPath = req.meta.appPath();

  if (!appPath.startsWith("static-site~")) {
    throw new Error("static-site~: Invalid appPath");
  }

  const parsed: any = unpack(req.data);

  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof parsed.mime !== "string" ||
    !(parsed.data instanceof Uint8Array) ||
    !(parsed.hash instanceof Uint8Array)
  ) {
    throw new Error(`static-site~: Invalid data structure`);
  }
}

/**
 * Execute this in your VoidMergeHandler to handle /static-site/* requests.
 */
export async function vmStaticSiteFn(
  req: VM.RequestFn,
): Promise<VM.ResponseFnOk | undefined> {
  if (req.path.startsWith("static-site")) {
    let appPath = `static-site~${req.path.substring(12).replaceAll("/", "~")}`;
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
      headers: new Headers().contentType("text/plain; charset=utf-8").finish(),
    });
  }
}
