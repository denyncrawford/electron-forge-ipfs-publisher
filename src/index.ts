import {
  PublisherOptions,
  PublisherStatic,
} from "@electron-forge/publisher-static";
import { type PublisherIpfsConfig, type IpfsArtifact } from "./types.js";
import debug from "debug";
import { getClient, upload } from "./upload.js";
import { publishRevision } from "./publish.js";

const d = debug("electron-forge:publish:IPFS");

export default class PublisherIPFS extends PublisherStatic<PublisherIpfsConfig> {
  name = "IPFS";

  ipfsKeySafe(name: string) {
    return name.replace(/@/g, "_").replace(/\//g, "_");
  }

  async publish({ makeResults, setStatusLine }: PublisherOptions) {
    let artifacts: IpfsArtifact[] = [];

    if (!this.config.space) {
      throw new Error(
        'In order to publish to IPFS, you must set the "space" property in your Forge publisher config. See the docs for more info'
      );
    }

    if (!this.config.web3StorageEmail) {
      throw new Error(
        'In order to publish to IPFS, you must set the "web3StorageEmail" property in your Forge publisher config. See the docs for more info'
      );
    }

    for (const makeResult of makeResults) {
      artifacts.push(
        ...makeResult.artifacts.map((artifact) => ({
          path: artifact,
          keyPrefix:
            this.config.folder || this.ipfsKeySafe(makeResult.packageJSON.name),
          platform: makeResult.platform,
          arch: makeResult.arch,
        }))
      );
    }

    artifacts = artifacts.map((artifact) => ({
      ...artifact,
      key: this.keyForArtifact(artifact),
    }));

    d("creating web3.storage client with options:", this.config);
    d(
      `Open your email at ${this.config.web3StorageEmail} and follow the instructions to log in`
    );

    await getClient(this.config.web3StorageEmail, this.config.space);

    d("uploading files to web3.storage");

    const directoryCid = await upload(artifacts, this.config, d);
    
    setStatusLine(`Uploaded to IPFS: ${directoryCid}`);

    d("Publishing to IPFS");

    await publishRevision(directoryCid.toString());

    setStatusLine("Published to IPFS");
  }
}
