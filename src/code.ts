import * as VM from "@voidmerge/voidmerge-code";
import { unpack } from "msgpackr";

interface File {
  data: Uint8Array;
  hash: string;
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

  etag(etag: string): Headers {
    this.#hdr["etag"] = `"${etag}"`;
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
    typeof parsed.hash !== "string" ||
    typeof parsed.mime !== "string" ||
    !(parsed.data instanceof Uint8Array)
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

    const headers = new Headers()
      .contentType(parsed.mime)
      .etag(parsed.hash)
      .cache()
      .finish();

    if (
      req.headers["if-none-match"] &&
      req.headers["if-none-match"].includes(parsed.hash)
    ) {
      // if the etags match, we can send the 304 Not Modified response
      return new VM.ResponseFnOk({
        status: 304,
        // 304 responses have an empty body
        body: new Uint8Array(0),
        // 304 responses have the same headers as 200 responses
        headers,
      });
    }

    return new VM.ResponseFnOk({
      status: 200,
      body: parsed.data,
      headers,
    });
  } else {
    return new VM.ResponseFnOk({
      status: 404,
      body: new TextEncoder().encode("Not Found"),
      headers: new Headers().contentType("text/plain; charset=utf-8").finish(),
    });
  }
}
