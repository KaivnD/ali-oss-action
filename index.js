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
        const from = tmp[0];
        const to = tmp[1];
        core.info(`Deply ${from} to ${to}`);
        return {
          from: from,
          to: to
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
    core.info(`Got a file ${file.from} to deploy`);
    let stream = fs.createReadStream(file.from);
    let result = await client.putStream(file.to, stream);
    core.info(
      `[${result.res.statusCode}] put ${result.name} to OSS is ${result.res.statusMessage}`
    );
  };

  const processDir = dir => {
    if (!dir) return;
    const dirAbsPath = path.resolve(dir.from);
    if (!fs.existsSync(dirAbsPath)) return;
    core.info(`Got a directory ${dir.from} to deploy`);
    fs.readdirSync(dirAbsPath).forEach(item => {
      const pathItem = path.join(dirAbsPath, item);
      if (fs.lstatSync(pathItem).isDirectory()) {
        core.info(
          `There is another directory ${pathItem} inside ${dirAbsPath} to deploy`
        );
        processDir({
          from: pathItem,
          to: dir.to
        });
      } else {
        processFile({
          from: pathItem,
          to: path.join(dir.to, item)
        });
      }
    });
  };

  try {
    files.forEach(file => processFile(file));
    dirs.forEach(dir => processDir(dir));
    core.info("AliOss deploy is Done!");
  } catch (e) {
    core.error(e.message);
  }
} catch (error) {
  core.setFailed(error.message);
}
