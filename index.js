const core = require("@actions/core");
const OSS = require("ali-oss");
const fs = require("fs");
const path = require("path");

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
    accessKeyId: OSS_ID,
    accessKeySecret: OSS_SECRET,
    bucket: BUCKET,
    secure: SSL === "true"
  });

  const processFile = async file => {
    if (!file) return;
    if (!fs.existsSync(file.from)) return;
    let stream = fs.createReadStream(file.from);
    let result = await client.putStream(file.to, stream);
    console.log(
      `[${result.res.statusCode}] Put ${result.name} to OSS is ${result.res.statusMessage}`
    );
  };

  const processDir = dir => {
    if (!dir) return;
    if (!fs.existsSync(dir.from)) return;

    fs.readdirSync(dir.from).forEach(item => {
      if (fs.lstatSync(item).isDirectory()) {
        processDir({
          from: path.join(dir, item),
          to: dir.to
        });
      } else {
        processFile({
          from: path.join(dir.from, item),
          to: path.join(dir.to, item)
        });
      }
    });
  };

  files.forEach(file => processFile(file));
  dirs.forEach(dir => processDir(dir));

  console.log("Done!");
} catch (error) {
  core.setFailed(error.message);
}
