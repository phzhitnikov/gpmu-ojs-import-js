var argv = require("minimist")(process.argv.slice(2));

require("manakin").global;
const inquirer = require("inquirer");

const Client = require("./ojs/client");
const Importer = require("./importer");
const config = require("./config");
const helpers = require("./helpers");

const client = new Client(config.PRODUCTION);
const importer = new Importer(client);

if (!argv._) {
  console.error("No dirs provided");
  return;
}

const separateUpload = argv.separate || false;

const datastores = importer.getXMLDatastores(argv._);
console.log("Got datastores:", datastores);

(async () => {
  await importer.client.init();
  await helpers.asyncForEach(datastores, async (d, i) => {
    if (separateUpload || i == 0) {
      const journals = await importer.client.getJournals();
      selectedJournal = await importer.chooseJournal(journals);
    }

    await importer.importIssue(d, selectedJournal);
  });
})();
