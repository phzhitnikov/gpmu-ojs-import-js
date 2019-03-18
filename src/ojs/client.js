const rp = require("request-promise");
const cheerio = require("cheerio");
const url = require("url");

const endpoints = require("./endpoints");

class Client {
  constructor(config) {
    this.config = config;

    this.host = config.host;
    this.csrfToken = "";

    this.apiDefaults = {
      baseUrl: this.host,
      jar: true, // enable cookies
      gzip: this.config.gzip || false,
      resolveWithFullResponse: true,
      headers: {
        // 'Host': '127.0.0.1:8080',
        "User-Agent":
          "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:65.0) Gecko/20100101 Firefox/65.0",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
        "X-Requested-With": "XMLHttpRequest"
      }
    };

    this.api = rp.defaults(this.apiDefaults);
  }

  init() {
    return this.getCSRF()
      .then(token => (this.csrfToken = token))
      .then(() =>
        this.authorize(this.config.adminUsername, this.config.adminPassword)
      )
      .catch(err => console.error("Client init failed:", err));
  }

  getCSRF() {
    // console.log("getting CSRF token..");

    return this.api
      .get(endpoints.login.page)
      .then(response => {
        const $ = cheerio.load(response.body);
        const csrfToken = $("input[name=csrfToken]").val();

        return csrfToken;
      })
      .catch(err => console.error("CSRF fetching failed:", err));
  }

  authorize(user, password) {
    console.log("authorizing..");

    return this.api
      .post(endpoints.login.action, {
        form: {
          username: user,
          password: password,
          remember: "1"
        },
        simple: false // because server responds with 302 code
      })
      .then(response => {
        // TODO check login success
        console.success("authorized");

        // Add cookie to headers
        var cookie = response.headers["set-cookie"].toString();
        this.api.defaults({ headers: { Cookie: cookie } });
      })
      .catch(err => console.error("Login failed:", err));
  }

  send(options) {
    if (options.method == "POST" && !options.formData) {
      options.form = options.form || {};
      options.form["csrfToken"] = this.csrfToken;
    }
    return this.api(options);
  }

  sendJson(options) {
    options["json"] = true;
    options["resolveWithFullResponse"] = false;

    return this.send(options);
  }

  getJournals() {
    // this.restoreBaseUrl();

    return this.send({
      baseUrl: this.host,
      method: "GET",
      uri: endpoints.journal.getAll,

      json: true,
      resolveWithFullResponse: false
    })
      .then(jsonData => {
        // TODO Check JSON has certain info

        if (!jsonData) Promise.reject();

        // console.log("Parsing journals..");
        var journals = [];

        const $ = cheerio.load(jsonData.content);
        const $labels = $(".gridRow td:not(.first_column) .label");

        $labels.each((i, el) => {
          const name = $(el)
            .text()
            .trim();
          journals.push(name);
        });

        return journals;
      })
      .catch(err => console.error("Fetching journals failed:", err));
  }

  // TODO clean this mess
  getJournalUrl(journalSlug) {
    return url.resolve(this.host, journalSlug);
  }

  setJournalUrl(journalSlug) {
    // console.log('setting slug:', journalSlug);
    this.apiDefaults.baseUrl = this.getJournalUrl(journalSlug);
    this.api.defaults(this.apiDefaults);
  }

  // restoreBaseUrl() {
  //     this.apiDefaults.baseUrl = this.host;
  //     this.api.defaults(this.apiDefaults)
  // }

  async journalExists(slug) {
    return await this.getJournals().then(journals => {
      return journals.includes(slug);
    });
  }

  getIssueIds(journalSlug) {
    //TODO check journal exists

    const journalUrl = this.getJournalUrl(journalSlug);

    return this.send({
      baseUrl: journalUrl,
      method: "GET",
      uri: endpoints.issue.getAll,

      json: true,
      resolveWithFullResponse: false
    })
      .then(jsonData => {
        // TODO Check JSON has certain info

        if (!jsonData) Promise.reject();

        const $ = cheerio.load(jsonData.content);
        const $gridRows = $(".gridRow"); // <tr id="component-grid-issues-futureissuegrid-row-1" class="gridRow has_extras"></tr>

        var ids = [];

        $gridRows.each((i, el) => {
          const idAttr = $(el).attr("id"); // component-grid-issues-futureissuegrid-row-1
          const id = idAttr.split("-").slice(-1)[0]; // 1
          ids.push(id);
        });

        return ids;
      })
      .catch(err => console.error("getIssueIds failed:", err));
  }
}

module.exports = Client;
