const fs = require("fs");
const path = require("path");

const inquirer = require("inquirer");
const glob = require("glob");
const cheerio = require("cheerio");

const Journal = require("./ojs/journal");
const Issue = require("./ojs/issue");
const Submission = require("./ojs/submission");
const helpers = require("./helpers");

class Importer {
  constructor(client) {
    this.client = client;
    this.submission = new Submission(client);

    this.$ = cheerio.load("", { xmlMode: true });
  }

  async chooseJournal(journalChoices) {
    journalChoices.push(new inquirer.Separator(), "[New journal]");

    const questions = [
      {
        type: "list",
        name: "selectedJournal",
        message: "Choose journal to upload issue to",
        choices: journalChoices
      },
      {
        type: "input",
        name: "selectedJournal",
        message: "Enter english slug for journal",
        when: answers => {
          return answers.selectedJournal == "[New journal]";
        },
        validate: function (value) {
          if (!value.match(/^[a-zA-Z0-9\/._-]+$/))
            return "Slug can only contain numbers, english letters, dashes (-) and underscores (_)";
          else if (journalChoices.includes(value))
            return "Slug exists. Choose another slug";
          else return true;
        }
      }
    ];

    return await inquirer.prompt(questions).then(answers => {
      return answers.selectedJournal;
    });
  }

  getXMLDatastores(paths) {
    const arr = paths.map(p => {
      p = path.resolve(p);

      var searchPattern;

      if (process.platform == 'linux') {
        searchPattern = `${p}/**/*.xml`;
      }
      else if (process.platform == 'win32') {
        searchPattern = `${p}\\**\\*.xml`;
      }

      return glob.sync(searchPattern);
    });

    const flattenArr = arr.reduce((acc, val) => acc.concat(val), []);
    return flattenArr.filter((x, i, a) => a.indexOf(x) == i); // filter unique paths
  }

  async importIssue(xmlFilePath, journalSlug) {
    const cwd = path.dirname(xmlFilePath);
    console.success("Processing directory:", path.relative(__dirname, cwd));

    const xmlData = fs.readFileSync(xmlFilePath, "utf-16le");
    const $xml = cheerio.load(xmlData, { xmlMode: true });

    // Create journal if needed
    const exists = await this.client.journalExists(journalSlug);
    if (!exists) {
      console.info(`Creating journal ${journalSlug}`);

      const journalTitle_rus = $xml("journalInfo[lang=RUS]")
        .find("title")
        .text();
      const journalTitle_eng = $xml("journalInfo[lang=ENG]")
        .find("title")
        .text();

      const journalInfo = {
        name: { rus: journalTitle_rus, eng: journalTitle_eng },
        path: journalSlug
      };
      //   console.log("journalInfo", journalInfo);
      await Journal.create(this.client, journalInfo);
      await Journal.makeMultilingual(this.client, journalSlug);
    }

    //Collect issue info
    const $issue = $xml("issue");

    const volume = $issue.children("volume").text();
    const number = $issue.children("number").text();
    const year = $issue
      .children("dateUni")
      .text()
      .slice(0, 4); //dirty hack for parameters like '201733/2017' or '201733'
    const title_rus = $issue.children("issTitle").text();

    var info = {
      volume: volume,
      number: number,
      year: year,
      "title[ru_RU]": title_rus
    };

    if (!title_rus) info["showTitle"] = "0";

    if (!volume) info["showVolume"] = "0";

    if (!number) info["showNumber"] = "0";

    if (!year) info["showYear"] = "0";

    // console.log(info)

    const issueId = await Issue.create(this.client, journalSlug, info);
    console.success("Got issue id:", issueId);

    // Process articles
    const $articles = $xml("article");
    const totalArticles = $articles.length;
    console.info(`Found ${totalArticles} articles`);

    await helpers.asyncForEach($articles, async (articleXML, i) => {
      console.info(
        `Creating submission ${i + 1}/${totalArticles} with issueId ${issueId}`
      );
      var submissionInfo = await this.getArticleInfo(articleXML, cwd);

      submissionInfo["issueId"] = issueId;

      // TODO validate info
      // TODO validate file

      await this.submission.create(journalSlug, submissionInfo);
    });

    await Issue.publish(this.client, journalSlug, issueId);
  }

  getAuthorInfo($individInfo) {
    var info = {};

    const initials = $individInfo.find("initials").text();
    const splitted_initials = initials.split(/[\s.]+/).filter(Boolean);
    // console.log(initials, '||', splitted_initials);

    const first_name = splitted_initials[0];
    info["firstName"] = first_name;

    const middle_name =
      splitted_initials.length > 1 ? splitted_initials[1] : "";
    info["middleName"] = middle_name;

    const surname = $individInfo.find("surname").text();
    info["lastName"] = surname;

    const organization = $individInfo.find("orgName").text();
    const address = $individInfo.find("address").text();
    info["affiliation[ru_RU]"] = organization + " " + address;

    const bio = $individInfo.find("otherInfo").text();
    info["biography[ru_RU]"] = bio;

    const email = $individInfo.find("email").text();
    info["email"] = email;

    return info;
  }

  async getArticleInfo(articleXML, cwd) {
    const $article = this.$(articleXML);

    const title_rus = $article.find("artTitle[lang=RUS]").text();
    const title_eng = $article.find("artTitle[lang=ENG]").text();

    const abstract_rus = $article.find("abstract[lang=RUS]").text() || "<br>";
    const abstract_eng = $article.find("abstract[lang=ENG]").text() || "<br>";

    const pages = $article.find("pages").text();

    const materialFileName = $article.find("file").text();
    const materialPath = path.join(cwd, materialFileName);

    const $keywords = $article.find("keyword");

    var keywords = [];
    $keywords.each((i, k) => {
      const keyword = this.$(k).text();
      keywords.push(keyword);
    });

    // Collect authors
    const $authors = $article.find("author");

    var authorInfoCollection = [];
    $authors.each((i, author) => {
      const $author = this.$(author);
      const $individInfo_rus = $author.find("individInfo[lang=RUS]");
      const $individInfo_eng = $author.find("individInfo[lang=ENG]");

      const authorInfo = this.getAuthorInfo($individInfo_rus);
      authorInfoCollection.push(authorInfo);
    });

    // console.log(title_rus)
    // console.log(title_eng)
    // console.log(abstract_rus)
    // console.log(keywords);

    return {
      title_rus: title_rus,
      title_eng: title_eng,
      abstract_rus: abstract_rus,
      abstract_eng: abstract_eng,
      keywords: keywords,
      pages: pages,
      materialFilePath: materialPath,
      authors: authorInfoCollection
    };
  }
}

module.exports = Importer;
