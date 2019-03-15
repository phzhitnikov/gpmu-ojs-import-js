var fs = require("fs");
var path = require("path");
const url = require("url");

const cheerio = require("cheerio");

const helpers = require("../helpers");
const endpoints = require("./endpoints");
const form_data = require("./form-data");

class Submission {
  constructor(client) {
    this.client = client;
    this.submissionId = 1;

    this.info;
  }

  prepare() {
    return this.client
      .sendJson({
        method: "GET",
        uri: endpoints.submission.prepare
      })
      .then(jsonData => {
        // TODO Check JSON has certain info

        if (!jsonData) Promise.reject();

        const $ = cheerio.load(jsonData.content);
        const userGroupEl = $("input[id^='userGroup']").first();
        const sectionIdEl = $("#sectionId");

        const result = {
          userGroupId: userGroupEl.val(),
          sectionId: sectionIdEl.val()
        };

        console.info(result);

        return result;
      })
      .catch(err =>
        console.error(
          "Prepare submission (userGroupId and sectionId fetching) failed:",
          err
        )
      );
  }

  step1_save(data) {
    return this.client
      .sendJson({
        method: "POST",
        uri: endpoints.submission.step1_save,
        form: { ...form_data.submission.step1_save, ...data }
      })
      .then(jsonData => {
        // TODO Check JSON has certain info

        if (!jsonData || !jsonData.events) Promise.reject();

        // Get submissionId from HTML
        const submissionUrl = jsonData.events[0].data;
        const parsedUrl = url.parse(submissionUrl, true);

        this.submissionId = parsedUrl.query.submissionId;
        console.info("got submissionId:", this.submissionId);
      })
      .catch(err => console.error("Save step1 failed:", err));
  }

  step2_getGenreId() {
    return this.client
      .sendJson({
        method: "GET",
        uri: endpoints.submission.step2.getGenreId,
        qs: {
          ...form_data.submission.step2.getGenreId,
          submissionId: this.submissionId
        }
      })
      .then(jsonData => {
        // TODO Check JSON has certain info

        if (!jsonData) Promise.reject();

        // Get genreId from HTML
        const $ = cheerio.load(jsonData.content);
        const genreIdEl = $("option[label^='Текст статьи']").first();
        const genreId = genreIdEl.val();

        return { genreId: genreId };
      })
      .catch(err =>
        console.error(
          "Fetching genreId (material pre-upload step) failed:",
          err
        )
      );
  }

  step2_upload(materialFilePath, genreId) {
    console.log("Uploading:", materialFilePath);

    const fileName = path.basename(materialFilePath);
    const fileStream = fs.createReadStream(materialFilePath);

    return this.client
      .sendJson({
        method: "POST",
        uri: endpoints.submission.uploadFile,
        headers: {
          browser_user_agent: this.client.apiDefaults.headers["User-Agent"]
        },
        qs: {
          ...form_data.submission.step2.uploadQuery,
          submissionId: this.submissionId
        },
        formData: {
          genreId: genreId,
          name: fileName,
          uploadedFile: fileStream
        }
      })
      .then(jsonData => {
        console.info("Upload result:", jsonData);

        // TODO Check JSON has certain info
        if (!jsonData || !jsonData.uploadedFile) Promise.reject();
      })
      .catch(err => console.error("Material upload failed:", err));
  }

  step2_save() {
    return this.client
      .sendJson({
        method: "POST",
        uri: endpoints.submission.step2.save,
        form: { submissionId: this.submissionId }
      })
      .then(jsonData => {
        // TODO Check JSON has certain info
        console.info("Save step2 result:", jsonData);

        if (!jsonData || !jsonData.events) Promise.reject();
      })
      .catch(err => console.error("Save step2 failed:", err));
  }

  step3_metadata() {
    const info = {
      "title[ru_RU]": this.info.title_rus,
      "abstract[ru_RU]": this.info.abstract_rus,
      "keywords[ru_RU-keywords]": this.info.keywords
    };

    return this.client
      .sendJson({
        method: "POST",
        uri: endpoints.submission.step3_metadata,
        form: {
          ...form_data.submission.step3_metadata,
          ...info,
          submissionId: this.submissionId
        }
      })
      .then(jsonData => {
        // TODO Check JSON has certain info
        console.info("Step3 (metadata) result:", jsonData);

        if (!jsonData || !jsonData.events) Promise.reject();
      })
      .catch(err => console.error("Step3 (metadata) failed:", err));
  }

  step4_confirm() {
    return this.client
      .sendJson({
        method: "POST",
        uri: endpoints.submission.step4_confirm,
        form: { submissionId: this.submissionId }
      })
      .then(jsonData => {
        // TODO Check JSON has certain info
        console.info("Step4 (confirmation) result:", jsonData);

        if (!jsonData || !jsonData.events) Promise.reject();
      })
      .catch(err => console.error("Step4 (confirmation) failed:", err));
  }

  createGalley() {
    return this.client
      .sendJson({
        method: "POST",
        uri: endpoints.submission.galley.create,
        qs: { submissionId: this.submissionId, representationId: "" },
        form: form_data.submission.galley.create
      })
      .then(jsonData => {
        // TODO Check JSON has certain info
        console.info("Create galley result:", jsonData);

        if (!jsonData || !jsonData.events) Promise.reject();

        const rowId = jsonData.events[0].data[0];
        console.log("Got rowId:", rowId);

        return rowId;
      })
      .catch(err => console.error("Galley creation failed:", err));
  }

  galley_getAssocTypeAssocId(rowId) {
    return this.client
      .sendJson({
        method: "GET",
        uri: endpoints.submission.galley.getAssocTypeAssocId,
        qs: {
          rowId: rowId,
          submissionId: this.submissionId
        }
      })
      .then(jsonData => {
        // TODO Check JSON has certain info
        // console.log('getAssocTypeAssocId data:', jsonData.content);

        if (!jsonData) Promise.reject();

        const assocTypeParam = jsonData.content.match(/assocType=\d+/);
        const assocType = assocTypeParam[0].split("=")[1];

        const assocIdParam = jsonData.content.match(/assocId=\d+/);
        const assocId = assocIdParam[0].split("=")[1];

        return { assocId: assocId, assocType: assocType };
      })
      .catch(err =>
        console.error(
          "Fetching assocType & assocId (material pre-upload step) failed:",
          err
        )
      );
  }

  galleyUpload(materialFilePath, genreId, assocType, assocId) {
    console.log("Uploading:", materialFilePath);

    const fileName = path.basename(materialFilePath);
    const fileStream = fs.createReadStream(materialFilePath);

    return this.client
      .sendJson({
        method: "POST",
        uri: endpoints.submission.uploadFile,
        headers: {
          browser_user_agent: this.client.apiDefaults.headers["User-Agent"]
        },
        qs: {
          ...form_data.submission.galley.uploadQuery,
          submissionId: this.submissionId,
          assocType: assocType,
          assocId: assocId
        },
        formData: {
          genreId: genreId,
          name: fileName,
          uploadedFile: fileStream
        }
      })
      .then(jsonData => {
        console.info("Upload result:", jsonData);

        // TODO Check JSON has certain info
        if (!jsonData || !jsonData.uploadedFile) Promise.reject();
      })
      .catch(err => console.error("Galley material upload failed:", err));
  }

  getAuthorsIds() {
    return this.client
      .sendJson({
        method: "GET",
        uri: endpoints.submission.getAuthors,
        qs: { submissionId: this.submissionId, stageId: 1 }
      })
      .then(jsonData => {
        // TODO Check JSON has certain info
        // console.info('getAuthorsIds result:', jsonData);

        if (!jsonData || !jsonData.events) Promise.reject();

        var authorsIds = [];
        const $ = cheerio.load(jsonData.content);
        const $gridRows = $(".gridRow");
        $gridRows.each((i, r) => {
          const $r = $(r);
          const idAttr = $r.attr("id");
          const id = idAttr.split("-").slice(-1)[0];
          authorsIds.push(id);
        });

        console.log("Got author ids:", authorsIds);

        return authorsIds;
      })
      .catch(err => console.error("Authors fetching failed:", err));
  }

  removeCreatorFromAuthorsList() {
    return this.getAuthorsIds()
      .then(authors => this.removeAuthor(authors[0]))
      .catch(err => console.error("removing submission creator failed:", err));
  }

  removeAuthor(authorId) {
    console.log("Removing author with id:", authorId);

    return this.client
      .sendJson({
        method: "POST",
        uri: endpoints.submission.removeAuthor,
        qs: { submissionId: this.submissionId, authorId: authorId }
      })
      .then(jsonData => {
        // TODO Check JSON has certain info
        console.info("removeAuthor result:", jsonData);

        if (!jsonData || !jsonData.events) Promise.reject();
      })
      .catch(err => console.error("Author removal failed:", err));
  }

  authorForm_getUserGroupId() {
    return this.client
      .sendJson({
        method: "GET",
        uri: endpoints.submission.authorForm,
        qs: { submissionId: this.submissionId }
      })
      .then(jsonData => {
        // TODO Check JSON has certain info

        if (!jsonData) Promise.reject();

        // Get genreId from HTML
        const $ = cheerio.load(jsonData.content);
        const userGroupEl = $("input[id^='userGroup']").first();
        const userGroupId = userGroupEl.val();

        console.info("author form userGroupId:", userGroupId);

        return userGroupId;
      })
      .catch(err => console.error("authorForm_getUserGroupId failed:", err));
  }

  async addAuthor(userGroupId, info = {}) {
    return await this.client
      .sendJson({
        method: "POST",
        uri: endpoints.submission.addAuthor,
        form: {
          ...form_data.submission.addAuthor,
          ...info,
          submissionId: this.submissionId,
          userGroupId: userGroupId
        }
      })
      .then(jsonData => {
        // TODO Check JSON has certain info
        console.info("addAuthor result:", jsonData);

        if (!jsonData) Promise.reject();
      })
      .catch(err => console.error("Author adding failed:", err));
  }

  async addAuthors(userGroupId) {
    console.info(`Start adding authors for submissionId ${this.submissionId}`);
    const totalAuthors = this.info.authors.length;

    await helpers.asyncForEach(this.info.authors, async (authorInfo, i) => {
      console.info(`Adding author ${i + 1}/${totalAuthors}`);
      // console.info(authorInfo);
      await this.addAuthor(userGroupId, authorInfo);
    });
  }

  attachIssue() {
    return this.client
      .sendJson({
        method: "POST",
        uri: endpoints.submission.save,
        form: {
          ...form_data.submission.save,
          submissionId: this.submissionId,
          pages: this.info.pages,
          issueId: this.info.issueId
        }
      })
      .then(jsonData => {
        // TODO Check JSON has certain info
        console.info("attachIssue result:", jsonData);

        if (!jsonData) Promise.reject();
      })
      .catch(err => console.error("Issue attaching failed:", err));
  }

  async create(journalSlug, submissionInfo = {}) {
    this.client.setJournalUrl(journalSlug);
    this.info = submissionInfo;

    return await this.prepare()
      .then(data => this.step1_save(data))
      .then(() => this.step2_getGenreId())
      .then(data => this.step2_upload(this.info.materialFilePath, data.genreId))
      .then(() => this.step2_save())
      .then(() => this.step3_metadata())
      .then(() => this.step4_confirm())

      .then(() => this.createGalley())
      .then(rowId => {
        return Promise.all([
          this.galley_getAssocTypeAssocId(rowId),
          this.step2_getGenreId()
        ]);
      })
      .then(data => {
        data = { ...data[0], ...data[1] };

        console.log("Galley data:", data);
        this.galleyUpload(
          this.info.materialFilePath,
          data.genreId,
          data.assocType,
          data.assocId
        );
      })
      .then(() => this.removeCreatorFromAuthorsList())
      .then(() => this.authorForm_getUserGroupId())
      .then(async userGroupId => await this.addAuthors(userGroupId))
      .then(() => this.attachIssue())

      .then(() => console.success("Submission created successfully"))
      .catch(err => console.error("Submission creation failed", err));
  }
}

module.exports = Submission;
