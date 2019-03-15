const endpoints = require('./endpoints')
const form_data = require('./form-data')

diff = (a, b) => a.filter(function (i) { return b.indexOf(i) < 0; })

exports.create = async (client, journalSlug, info = {}) => {
    const journalUrl = client.getJournalUrl(journalSlug);

    const issueIdsBefore = await client.getIssueIds(journalSlug);

    // Create issue
    await client
        .sendJson({
            baseUrl: journalUrl,
            method: 'POST',
            uri: endpoints.issue.create,
            form: {
                ...form_data.issue.create,
                ...info
            }
        })
        .then(jsonData => {
            if (!jsonData)
                Promise.reject('Wrong response');

            console.info('Create issue result:', jsonData);
        })
        .catch(err => console.error('Issue creation failed:', err))

    const issueIdsAfter = await client.getIssueIds(journalSlug);

    return diff(issueIdsAfter, issueIdsBefore)[0]
}

exports.publish = async (client, journalSlug, issueId) => {
    const journalUrl = client.getJournalUrl(journalSlug);

    return client
        .sendJson({
            baseUrl: journalUrl,
            method: 'POST',
            uri: endpoints.issue.publish,
            form: {
                ...form_data.issue.publish,
                issueId: issueId,
            }
        })
        .then(jsonData => {
            // TODO Check JSON has certain info
            console.info('Issue.publish result:', jsonData);

            if (!jsonData)
                Promise.reject();
        })
        .catch(err => console.error('Issue publishing failed:', err))
}