# voidmerge-static-site

VoidMerge Hooks For Hosting Static Web Content.

## Usage

### Option 1: As a Mixin

If you have your own Void Merge application, invoke the following functions
in your VoidMergeHandler code.

- `vmStaticSiteObjCheck`
- `vmStaticSiteFn`

### Option 2: As a Standalone

`src/code-standalone.ts` is built into `dist/bundle-code.js` which you can use
to configure your context directly if not adding any additional functionality.

## Uploading the Site

Use the `vm-static-site` utility to publish files to your context.

At the moment, directory and filenames must use appPath-safe characters
`a-zA-Z0-9.-_~`.
