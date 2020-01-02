const core = require("@actions/core");
const OSS = require("ali-oss");

try {
  // `who-to-greet` input defined in action metadata file
  // const OSS_ID = core.getInput("oss_id");
  // const OSS_SECRET = core.getInput("oss_secret");
  // const BUCKET = core.getInput("bucket");
  // const SSL = core.getInput("ssl");
  // if (!OSS_ID || !OSS_SECRET || !BUCKET) {
  //   throw new Error("Both OSS access key and access secret is required");
  // }
  // const client = new OSS({
  //   region: "oss-accelerate", // oss-cn-shanghai
  //   accessKeyId: OSS_KEYID,
  //   accessKeySecret: OSS_KEYSECRET,
  //   bucket: BUCKET,
  //   secure: SSL
  // });
  console.log(core.getInput("files"));
} catch (error) {
  core.setFailed(error.message);
}
