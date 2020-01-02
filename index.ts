import core from "@actions/core";
import OSS from "ali-oss";
import fs from "fs";

declare interface FileItem {
  from: string;
  to: string;
}

try {
  const OSS_ID = core.getInput("oss_id");
  const OSS_SECRET = core.getInput("oss_secret");
  const BUCKET = core.getInput("bucket");
  const SSL = core.getInput("ssl");

  const prepare = (str: string): (FileItem | undefined)[] =>
    str.split("\n").map(item => {
      const tmp = item.trim().split("=>");
      if (tmp.length == 2) {
        let fileItem: FileItem = {
          from: tmp[0],
          to: tmp[1]
        };
        return fileItem;
      }
    });

  const files = prepare(core.getInput("files"));
  const dirs = prepare(core.getInput("dirs"));

  if (!OSS_ID || !OSS_SECRET || !BUCKET) {
    throw new Error("Both OSS access key and access secret is required");
  }

  if (files.length === 0 || dirs.length === 0) {
    throw new Error("files or dirs to upload is empty");
  }

  const client = new OSS({
    region: "oss-accelerate", // oss-cn-shanghai
    accessKeyId: OSS_ID,
    accessKeySecret: OSS_SECRET,
    bucket: BUCKET,
    secure: SSL === "true"
  });

  files.forEach(async (file: FileItem | undefined) => {
    if (!file) return;
    if (!fs.existsSync(file.from)) return;
    let stream = fs.createReadStream(file.from);
    let result = await client.putStream(file.to, stream);
    console.log(
      `[${result.res.status}] Put ${result.name} to OSS is ${
        result.res.status === 200 ? "success" : "faild"
      }`
    );
  });

  dirs.forEach(async dir => console.log(dir));
} catch (error) {
  core.setFailed(error.message);
}
