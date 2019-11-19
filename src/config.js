exports.DEV = {
  host: "http://127.0.0.1:8080/index.php/",
  adminUsername: "admin",
  adminPassword: "admin"
};

exports.PRODUCTION = {
  host: "http://PRODUCTION-SERVER.ORG/index.php/",
  adminUsername: "admin",
  adminPassword: "admin",

  gzip: true
};
