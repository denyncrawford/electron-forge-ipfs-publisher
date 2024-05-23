export interface RevisionFile {
  latest: string;
}

export interface SquirrelMacRelease {
  version: string;
  updateTo: {
    version: string;
    pub_date: string;
    notes: string;
    name: string;
    url: string;
  };
}

export interface SquirrelMacReleases {
  currentRelease: string;
  releases?: SquirrelMacRelease[];
}

export interface IpfsArtifact {
  path: string;
  keyPrefix: string;
  platform: string;
  arch: string;
  key?: string;
};

export type Email = `${string}@${string}`;
export type DID = `did:${string}:${string}`;

export interface PublisherIpfsConfig {
    /**
     * The email address to use for your Web3.Storage account
     */
    web3StorageEmail: Email;

    /**
     * The space to upload to
     */
    space: DID;

    /**
     * the folder to upload to
     */ 
    folder?: string;

    /**
     * Custom function to provide the key to upload a given file to
     */
    keyResolver?: (fileName: string, platform: string, arch: string) => string;
  }
