const http = require("http");
const crypto = require("crypto");

const iv = Buffer.from("01234567", "utf-8");
const secretKey = Buffer.from("m1yanfa@seeyon.com119$#M1#$", "utf-8");

function generateKey(secret) {
  const keyBuffer = Buffer.alloc(24);
  secret.copy(keyBuffer, 0, 0, Math.min(secret.length, 24));
  return keyBuffer;
}

function encode(str) {
  if (!str) return "";
  try {
    const cipher = crypto.createCipheriv(
      "des-ede3-cbc",
      generateKey(secretKey),
      iv
    );
    let encrypted = cipher.update(str, "utf-8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
  } catch (error) {
    throw new Error(error.message);
  }
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const uuid = generateUUID();

const hostname = `xxx`;

const commonHeaders = {
  "accessm3-scheme": "http",
  Connection: "keep-alive",
  "Accept-Encoding": "gzip, deflate",
  "Content-Type": "application/json; charset=utf-8",
  "User-Agent": "seeyon-m3/4.6.1",
  Cookie: "",
  Host: `${hostname}`,
  "cmp-plugins": "cmp/faceid",
  "Accept-Language": "zh_CN",
  Accept: "application/json; charset=utf-8",
};

function login() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      deviceCode: uuid,
      // 密码
      password: encode("123456"),
      client: "iphone",
      // 手机号
      login_mobliephone: encode("xxx"),
      // 账号
      name: encode("xxx"),
      // 目前不知道作用的参数
      // deviceID
      // sendTime
    });

    const options = {
      hostname: hostname,
      port: 80,
      path: "/seeyon/rest/m3/login/verification",
      method: "POST",
      headers: commonHeaders,
    };

    const req = http.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        const response = JSON.parse(responseData);
        const ticket = response.data.ticket;
        resolve(ticket);
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

function sign(headers) {
  return new Promise((resolve, reject) => {
    const submitParams = getSubmitParams();
    const data = JSON.stringify(submitParams);

    const options = {
      hostname: hostname,
      port: 80,
      path: "/seeyon/rest/attendance/save/m3?cmprnd=85447784&option.n_a_s=1",
      method: "POST",
      headers: headers,
    };

    const req = http.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        console.info(responseData);
        resolve();
      });
    });

    req.on("error", (error) => {
      console.error("Error:", error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

function getSubmitParams() {
  const params = {
    // wifi名字
    sign: "觉世光",
    // regwifi
    source: 3,
    // 设备ID 应该是固定值 不存在则生成个uuid
    deviceId: uuid,
    // 1:上班 2:下班
    type: 1,
    // 经度
    longitude: "xxx",
    // 维度
    latitude: "xxx",
    continent: "",
    // mac地址
    macAddress: "xxx",
    country: "中国",
    province: "贵州省",
    city: "贵阳市",
    town: "xx",
    street: "xx",
    nearAddress: "xxx",
    classType: "0",
    // 上班9:00 下班18:00
    fixTime: "9:00",
    workDown: false,
  };

  const timestamp = new Date().valueOf();
  const nonce = crypto
    .createHash("md5")
    .update(timestamp + Math.round(Math.random() * 1000) + "")
    .digest("hex");
  const keySign = crypto
    .createHash("md5")
    .update(
      params.sign +
        params.longitude +
        params.latitude +
        params.nearAddress +
        timestamp +
        nonce +
        ""
    )
    .digest("hex");
  params.timestamp = timestamp + "";
  params.nonce = nonce;
  params.digitSign = keySign;
  return params;
}

(async () => {
  const randomDelay = Math.floor(
    Math.random() * (3 * 60 - 1 * 60 + 1) + 1 * 60
  );
  console.log(`Waiting for ${randomDelay} seconds before executing...`);
  await delay(randomDelay * 1000);
  try {
    const ticket = await login();
    console.log(
      "%c [ ticket ]-41",
      "font-size:13px; background:#6a0b78; color:#ae4fbc;",
      ticket
    );
    if (ticket) {
      commonHeaders.Cookie = `JSESSIONID=${ticket}`;
      await sign(commonHeaders);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
