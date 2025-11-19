import minimist from "minimist";
import mime from "mime";
import { exit, argv } from "node:process";
import { readdir, readFile } from "node:fs/promises";
import { join, extname, resolve, sep } from "node:path";
import { createHash } from "crypto";
import { pack } from "msgpackr";
import { objPut } from "@voidmerge/voidmerge-client";
import { b64Enc } from "./b64.js";

function help() {
  console.log(`
usage: vm-static-site <CMD> [OPTIONS]

help -h --help    : print this help info

publish           : publish directory contents as static site data
  --dir   <DIR>   : directory to publish
  --url   <URL>   : void merge server url
  --ctx   <CTX>   : void merge context
  --token <TOKEN> : void merge ctxadmin token
`);
}

async function main() {
  const args = minimist(argv.slice(2), {
    alias: {
      h: "help",
    },
    boolean: ["help"],
    string: ["dir", "url", "ctx", "token"],
    default: {
      dir: ".",
      url: "http://127.0.0.1:8080",
      ctx: "vm-static-site",
      token: "bobo",
    },
  });

  let cmd = (args["_"] && args["_"][0]) || "help";
  if (args.help) {
    cmd = "help";
  }

  console.log("cmd", cmd, args);

  if (cmd === "help") {
    help();
    exit(0);
  } else if (cmd === "publish") {
    const items = await gather(args.dir);
    console.log("Publishing...");
    for (const item of items) {
      await publish(item, args.url, args.ctx, args.token);
    }
    console.log("Done.");
  }
}

main().then(
  () => {},
  (err) => {
    console.error(err);
    exit(1);
  },
);

interface GatherResult {
  full: string;
  app: string;
  ext: string;
  type: string;
}

async function gather(path: string): Promise<GatherResult[]> {
  const out: GatherResult[] = [];

  const abs = resolve(path) + sep;
  const files = await readdir(abs, { withFileTypes: true, recursive: true });
  for (const file of files) {
    if (!file.isFile()) {
      continue;
    }
    const full = join(file.parentPath, file.name);
    const app = full.substring(abs.length);
    const ext = extname(full).substring(1);

    let type = mime.getType(ext) || "application/octet-stream";

    if (type.startsWith("text/")) {
      type = type + "; charset=utf-8";
    }

    out.push({ full, app, ext, type });
  }

  return out;
}

async function publish(
  item: GatherResult,
  url: string,
  ctx: string,
  token: string,
) {
  const data = await readFile(item.full);
  const len = data.byteLength;
  const hasher = createHash("sha256");
  hasher.update(data);
  const hash = b64Enc(hasher.digest());
  const out = pack({
    data,
    hash,
    mime: item.type,
  });
  const appPath = `static-site~${item.app.replaceAll("/", "~")}`;
  console.log(appPath, `${out.byteLength} bytes, ${item.type}`);
  const { meta } = await objPut({
    url,
    ctx,
    token,
    appPath,
    createdSecs: Date.now() / 1000,
    data: out,
  });
}
