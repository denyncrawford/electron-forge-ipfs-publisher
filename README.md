# IPFS Electron Publisher

How to publish your distributable Electron app artifacts to IPFS with web3.storage

The IPFS target publishes your Make artifacts to an IPFS directory. Authentication, naming client (IPNS) and upload client, are provided by web3.storage.

# Authentication

To authenticate with web3.storage you must provide your `web3StorageEmail` address and a `space` (optional) to the configuration options.

If you don't have an account at this moment you can use the `autoGenerateSpace` property to generate a new space for you. 

> Be careful, this will generate a new space with every run, we recommend you to create an account using [web3.storage](https://console.web3.storage)

# Usage

Configurations options are documented in the [PublisherIpfsConfig](./src/types.ts) file.

```js
module.exports = {
  // ...
  publishers: [
    {
      name: "electron-forge-ipfs-publisher",
      config: {
        web3StorageEmail: process.env.WEB3_STORAGE_EMAIL,
        space: process.env.SPACE, // example: did:key:z6MkgkS7iCnKakvK6PTWtEWXQQEhXgwv4n8b7Vf1VibcaRyT
      },
    },
  ],
};
```

# Key management

By default, the IPFS publisher will upload its objects to the `{prefix}/{platform}/{arch}/{name}` key, where:

`{prefix}` is the value of the config.folder option (defaults to the "name" field in your package.json).

`{platform}` is the target platform for the artifact you are publishing.

`{arch}` is the target architecture for the artifact you are publishing.

`{name}` is the file name of the artifact you are publishing.

<blockquote>
If you run the Publish command multiple times on the same platform for the same version (e.g. simultaneously publishing <code>ia32</code> and <code>x64</code> Windows artifacts), your uploads can get overwritten in the IPFS directory. 
<br/><br/>
To avoid this problem, you can use the <code>keyResolver</code> option to generate the IPFS key programmatically.
<br/><br/>

```js
module.exports = {
  name: "electron-forge-ipfs-publisher",
  config: {
    // ...
    keyResolver: (fileName, platform, arch) => {
      return `some-prefix/${platform}/${arch}/${filename}`;
    },
    // ...
  },
};
```

</blockquote>

# Auto updating from IPFS

You can configure Electron's built-in autoUpdater module to use the artifacts published by the IPFS publisher. This is a four-step process:

First, you must configure `electron-forge-ipfs-publisher` to publish your files into an auto-updater compatible layout and use `@electron-forge/maker-zip` + `@electron-forge/maker-squirrel` to build your application.

```js
    module.exports = {
    // ...
    makers: [
        {
        name: '@electron-forge/maker-zip',
        config: (arch) => ({
            // Note that we must provide the IPNS url here
            // in order to support smooth version transitions
            // by now you need to leave it empty
            macUpdateManifestBaseUrl: undefined
        })
        },
        {
        name: '@electron-forge/maker-squirrel',
        config: (arch) => ({
            // Note that we must provide this IPNS url here
            // in order to generate delta updates
            // by now you need to leave it empty
            remoteReleases: undefined
        })
        }
    ],
    publishers: [
        {
        name: 'electron-forge-ipfs-publisher',
        config: {
            ... // your config
        }
        }
    ]
    };
```

Then, run `electron-forge publish` to publish your application to IPFS the first time, **this is a v0 publish**.

> Note: It is important to follow the instructions from the terminal to publish your application to IPFS.

It will generate new files in the root of yor project, these files are used by the publisher so you may not edit them:

- `publications.json` - contains the IPFS, IPNS and W3S CID's of the published application 

    > Note: You can use this CID to get the release artifacts. IPNS and W3S CID's are the paths that you need to use to request the release artifacts permanently through a IPFS gateway. IPFS CID's are the paths that you need to use to request the release artifacts for a specific version of your application.

- `.w3name/name.key` - contains the W3S/IPNS name private key, this key is used to publish IPNS values (versions of yor app). This key should not be shared with anyone, you may want to ignore it in your git repo too.

Now you can update your makers config to use the update urls with the provided CID's:

```js
    module.exports = {
    // ...
    makers: [
        {
        name: '@electron-forge/maker-zip',
        config: (arch) => ({
            // Note that we must provide the IPNS url here
            // in order to support smooth version transitions
            macUpdateManifestBaseUrl: `https://ipfs.io/ipfs/${ipfsCid}/my-app-updates/darwin/${arch}`,
        })
        },
        {
        name: '@electron-forge/maker-squirrel',
        config: (arch) => ({
            // Note that we must provide this IPNS url here
            // in order to generate delta updates
            remoteReleases: `https://ipfs.io/ipfs/${ipfsCid}/my-app-updates/win32/${arch}`,
        })
        }
    ],
    publishers: [
        {
        name: 'electron-forge-ipfs-publisher',
        config: {
            ... // your config
        }
        }
    ]
    };
```

With Forge configured correctly, the second step is to configure the autoUpdater module inside your app's main process. The simplest form is shown below but you might want to hook additional events to show UI to your user or ask them if they want to update your app right now.

```js
const { updateElectronApp, UpdateSourceType } = require('update-electron-app');

updateElectronApp({
  updateSource: {
    type: UpdateSourceType.StaticStorage,
    baseUrl: `https://ipfs.io/ipfs/${ipfsCid}/my-app-updates/${process.platform}/${process.arch}`,
  }
});
```

# Limitations and considerations

- Since ipfs is a distributed system, you can't guarantee that your artifacts will be available at all times, so you should always check the status of your artifacts before using them.

- IPNS is publication secure but not content securable, so you may want to hide your IPNS paths from the public if necessary. Since CID's are hard to guess it makes difficult to but it is not impossible, so you need to be aware that this method is made for public publishing mostly.

- To visually access and manage you artifacts you can use the [web3.storage](https://console.web3.storage) Console but you can always use any IPFS library, cli tool, GUI or gateway to access your artifacts by CID's.

- By now you need to verify your email address every time you publish your artifacts. If you want to contribute to this project there is a `enableExperimentalSession` option that you can use to enable the experimental session feature, this feature is not yet stable and it is not recommended to use it in production, there's still some problems with bundled dependencies, i'm working on delegation and session for enabling scalable CI/CD pipelines.