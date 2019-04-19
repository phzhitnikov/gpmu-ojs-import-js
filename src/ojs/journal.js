const schema = require("schm");
const translate = require("schm-translate");

const endpoints = require("./endpoints");
const form_data = require("./form-data");

const journalCreateSchema = schema(
  {
    "name[ru_RU]": {
      type: String,
      required: true
    },
    "name[en_US]": String,
    "description[ru_RU]": String,
    "description[en_US]": String,
    path: {
      type: String,
      required: true
    },
    enabled: 1
  },
  translate({
    "name[ru_RU]": "name.rus",
    "name[en_US]": "name.eng",
    "description[ru_RU]": "description.rus",
    "description[en_US]": "description.eng",
    path: "path",
    enabled: "enabled"
  })
);

/**
@param journalInfo:

{
    name: {rus: 'лала', eng: 'lala'},
    description: {rus: 'лала', eng: 'lala'},
    path: 'test-journal',
    [enabled: 0]
}
**/
exports.create = async (client, journalInfo = {}) => {
  await journalCreateSchema
    .validate(journalInfo)
    .then(async parsedData => {
      // console.log('Parsed schema:', parsedData)

      await client
        .send({
          method: "POST",
          uri: endpoints.journal.create,
          form: parsedData
        })
        .then(response => {
          // TODO Check JSON has certain info
          console.info("Journal creation result:", response.body);
        })
        .catch(err => console.error("Journal creation failed:", err));
    })
    .catch(err => console.error("Journal info validation failed", err));
};

exports.create_no_validation = async (client, journalInfo = {}) => {
  const info = {
    "name[ru_RU]": journalInfo.name.rus || "",
    "name[en_US]": journalInfo.name.eng || "",
    "description[ru_RU]": "",
    "description[en_US]": "",
    path: journalInfo.path,
    enabled: journalInfo.enabled || 1
  };

  return await client
    .send({
      method: "POST",
      uri: endpoints.journal.create,
      form: info
    })
    .then(response => {
      // TODO Check JSON has certain info
      console.log(response.body);
    })
    .catch(err => console.error("Journal creation failed:", err));
};

exports.makeMultilingual = async (client, journalSlug) => {
  journalUrl = client.getJournalUrl(journalSlug);

  await client
    .send({
      baseUrl: journalUrl,
      method: "POST",
      uri: endpoints.journal.languageSettings,
      qs: form_data.journal.addEnglishForms
    })
    .then(response => {
      // TODO Check JSON has certain info ('dataChanged' field)
      console.info("Make journal multilingual result:", response.body);
    })
    .catch(err => console.error("Making journal multilingual failed:", err));
}