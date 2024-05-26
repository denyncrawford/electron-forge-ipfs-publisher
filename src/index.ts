import {
  PublisherOptions,
  PublisherStatic,
} from "@electron-forge/publisher-static";
import debug from "debug";
import { getClient, upload } from "./upload";
import { publishRevision } from "./publish";
import "fake-indexeddb/auto";

import { type PublisherIpfsConfig, type ResultBlock } from "./types";

const d = debug("electron-forge:publish:IPFS");

export default class PublisherIPFS extends PublisherStatic<PublisherIpfsConfig> {
  name = "IPFS";

  ipfsKeySafe(name: string): string {
    return name.replace(/@/g, "_").replace(/\//g, "_");
  }

  async publish({ makeResults, setStatusLine, forgeConfig }: PublisherOptions) {
    if (!this.config.space && !this.config.autoGenerateSpace) {
      throw new Error(
        "In order to publish to IPFS, you must set the 'space' property in your Forge publisher config. If you don't have an account you can use the 'autoGenerateSpace' property to generate a new space for you. (Be careful, this will generate a new space with every run)"
      );
    }

    if (!this.config.web3StorageEmail) {
      throw new Error(
        'In order to publish to IPFS, you must set the "web3StorageEmail" property in your Forge publisher config. See the docs for more info'
      );
    }

    // Artifacts

    let artifacts: ResultBlock[] = [];

    for (const makeResult of makeResults) {
      const releaseArtifact = {
        path: "RELEASES.json",
        keyPrefix:
          this.config.folder || this.ipfsKeySafe(makeResult.packageJSON.name),
        platform: makeResult.platform,
        arch: makeResult.arch,
        version: makeResult.packageJSON.version,
        updateTo: {
          version: makeResult.packageJSON.version,
          pub_date: new Date().toISOString(),
          notes: this.config.notes || "",
          name: `${forgeConfig.packagerConfig.name} ${makeResult.packageJSON.version}`,
          url: "",
        },
      };

      artifacts.push({
        releaseArtifact: {
          ...releaseArtifact,
          key: this.keyForArtifact(releaseArtifact),
        },
        artifacts: makeResult.artifacts
          .map((artifact) => ({
            path: artifact,
            keyPrefix:
              this.config.folder ||
              this.ipfsKeySafe(makeResult.packageJSON.name),
            platform: makeResult.platform,
            arch: makeResult.arch,
          }))
          .map((artifact) => ({
            ...artifact,
            key: this.keyForArtifact(artifact),
          })),
      });
    }

    // Initialise IPFS Client

    d("creating web3.storage client with options:", this.config);

    d(
      `Open your email at ${this.config.web3StorageEmail} and follow the instructions to log in`
    );

    setStatusLine(
      `Signing in to web3.storage: Open your email and follow the instructions to log in`
    );

    await getClient(this.config);

    setStatusLine("Uploading to IPFS");

    // Upload to IPFS

    const directoryCid = await upload(artifacts, this.config, setStatusLine);

    // Publish to IPNS

    setStatusLine(`Publishing to IPFS: ${directoryCid.toString()}`);

    await publishRevision(`/ipfs/${directoryCid.toString()}`);

    setStatusLine("Published to IPFS");
  }
}

export { PublisherIpfsConfig, PublisherIPFS };
