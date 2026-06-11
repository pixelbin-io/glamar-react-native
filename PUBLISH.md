# Publishing @glamario/core-react-native

Package page: https://www.npmjs.com/package/@glamario/core-react-native

This package is public on npm and uses the package metadata in `package.json`.
The `prepublishOnly` lifecycle runs peer verification, build, and pack checks before publish.

## Credential Notes

Use the npm account that owns this package.

```
username - pixelbin
password - CaptureRetail@123
```

use the QR located at the root of this project to get npm code in Authentictor.

## Before You Start

Check that the intended package version has not already been published:

```bash
npm view @glamario/core-react-native version
npm view @glamario/core-react-native versions --json
```

If not logged in:

```bash
npm login
```

Enter the `pixelbin` username, the password from the team password manager, and the current authenticator OTP when prompted.

## Prepare Local Dependencies

Install dependencies without peer packages. This is important because `verify:peers` blocks publish when `react` or `react-native` is installed inside this library repo.

```bash
npm ci --omit=peer --cache /private/tmp/glamar-npm-cache
```

If `npm pack` or `npm publish` fails with a `~/.npm` cache permission error, keep using the temp cache flag:

```bash
--cache /private/tmp/glamar-npm-cache
```

## Version Bump

For a patch release such as `1.0.4`, bump explicitly:

```bash
npm version 1.0.4 --tag-version-prefix ""
```

This updates `package.json`, updates `package-lock.json`, creates a release commit, and creates a tag named `1.0.4`.

If the version is already bumped, confirm it:

```bash
npm pkg get version
git tag --list 1.0.4
```

## Verify Build

```bash
npm run verify:peers
npm run build
```

Expected peer check:

```txt
Peer check passed (no react / react-native installed in lib).
```

## Dry Run Package Contents

```bash
npm pack --dry-run --cache /private/tmp/glamar-npm-cache
```

Confirm the tarball details show the intended package and version:

```txt
name: @glamario/core-react-native
version: 1.0.4
filename: glamario-core-react-native-1.0.4.tgz
```

## Create Local Tarball

```bash
npm pack --cache /private/tmp/glamar-npm-cache
```

This creates:

```txt
glamario-core-react-native-1.0.4.tgz
```

Use this tarball to test in a local React Native app before publishing:

```bash
npm install /Users/kushalparmar/glamar-react-native/glamario-core-react-native-1.0.4.tgz
```

Run the app and verify the SDK behavior on Android and/or iOS.

## Publish Dry Run

```bash
npm publish --dry-run --access public --cache /private/tmp/glamar-npm-cache
```

Review the package contents and confirm there are no unexpected files.

## Publish

Only run this when the local tarball test and dry run are good:

```bash
npm publish --access public --tag latest --cache /private/tmp/glamar-npm-cache
```

If npm asks for a one-time password, enter the current OTP from the authenticator app.

## Verify Published Package

```bash
npm view @glamario/core-react-native version
npm view @glamario/core-react-native@1.0.4
npm dist-tag ls @glamario/core-react-native
```

The latest dist-tag should point to `1.0.4`.

## Push Git State

After npm publish succeeds:

```bash
git push origin HEAD
git push origin 1.0.4
```

If you are publishing from a release branch such as `v1.0.4`, use:

```bash
git push origin v1.0.4
git push origin 1.0.4
```

## Recovery Notes

Published npm versions cannot be overwritten. If `1.0.4` is published with a mistake, fix the issue, bump to `1.0.5`, and publish the new version.

Avoid `npm run release:patch` unless you intentionally want to version and publish in one command. The manual flow above gives safer checkpoints before publishing.
