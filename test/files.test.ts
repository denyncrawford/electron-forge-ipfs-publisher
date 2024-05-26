import { test, expect } from "vitest";
import { getClient } from "../src/upload.js";
import axios from "axios";

test(
  "getClient without session",
  async () => {
    const client = await getClient({
      web3StorageEmail: "kiquerangelb@gmail.com",
      space: "did:key:z6MkgkS7iCnKakvK6PTWtEWXQQEhXgwv4n8b7Vf1VibcaRyJ",
    });
    expect(client).toBeDefined();
  },
  {
    timeout: 100000,
  }
);

test(
  "getClient with session",
  async () => {
    const client = await getClient({
      web3StorageEmail: "kiquerangelb@gmail.com",
      space: "did:key:z6MkgkS7iCnKakvK6PTWtEWXQQEhXgwv4n8b7Vf1VibcaRyJ",
      enableExperimentalSession: true,
    });
    expect(client).toBeDefined();
  }
);

test(
    "uploadFile",
    async () => {
        const client = await getClient({
            web3StorageEmail: "kiquerangelb@gmail.com",
            space: "did:key:z6MkgkS7iCnKakvK6PTWtEWXQQEhXgwv4n8b7Vf1VibcaRyJ",
            enableExperimentalSession: true,
        });
        const value = "test";
        const file = new File([value], "test.txt", {
            type: "text/plain",
        });
        const directoryCid = await client.uploadFile(file);
        expect(directoryCid).toBeDefined();

        const {data: fileContent} = await axios.get('https://w3s.link/ipfs/' + directoryCid.toString());
        expect(fileContent).toBe(value);
    },
    {
        timeout: 100000,
    }
);