const core = require("@actions/core");
const OSS = require("ali-oss");
const fs = require("fs");

try {
  const OSS_ID = core.getInput("oss_id");
  const OSS_SECRET = core.getInput("oss_secret");
  const BUCKET = core.getInput("bucket");
  const SSL = core.getInput("ssl");

  const prepare = str =>
    str.split("\n").map(item => {
      const tmp = item.trim().split("=>");
      if (tmp.length == 2) {
        return {
          from: tmp[0],
          to: tmp[1]
        };
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
    accessKeyId: OSS_KEYID,
    accessKeySecret: OSS_KEYSECRET,
    bucket: BUCKET,
    secure: SSL
  });

  files.forEach(async file => {
    if (!file) return;
    if (!fs.existsSync(file.from)) return;
    let stream = fs.createReadStream(file.from);
    let result = await client.putStream(file.to, stream);
    console.log(
      `[${result.res.statusCode}] Put ${result.name} to OSS is ${result.res.statusMessage}`
    );
  });

  dirs.forEach(async dir => console.log(dir));
} catch (error) {
  core.setFailed(error.message);
}
