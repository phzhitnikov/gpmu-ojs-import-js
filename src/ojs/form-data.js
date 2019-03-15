module.exports = {
    submission: {
        step1_save: {
            'csrfToken': '',
            'sectionId': '14',
            'userGroupId': '240',

            'submissionChecklist': '1',
            'locale': 'ru_RU',
            'checklist-0': '1',
            'checklist-1': '1',
            'checklist-2': '1',
            'checklist-3': '1',
            'checklist-4': '1',
            'commentsToEditor': '',
            'privacyConsent': '1',
        },

        step2: {
            getGenreId: {
                'submissionId': '',

                'stageId': '1',
                'fileStage': '2',
            },
            uploadQuery: {
                'csrfToken': '',
                'submissionId': '',

                'stageId': '1',
                'fileStage': '2',
                'reviewRoundId': '',
                'assocType': '',
                'assocId': ''
            }
        },

        step3_metadata: {
            'csrfToken': '',

            'prefix[ru_RU]': '',
            'subtitle[ru_RU]': '',
            'title[ru_RU]': 'testing',
            'abstract[ru_RU]': 'testing',
            'keywords[ru_RU-keywords]': ['lulz', 'testtest2']
        },

        galley: {
            create: {
                'csrfToken': '',

                'label': 'PDF',
                'galleyLocale': 'ru_RU',
                'remoteURL': ''
            },
            uploadQuery: {
                'csrfToken': '',
                'submissionId': '',

                'stageId': '5',
                'fileStage': '10',
                'reviewRoundId': '',
                'assocType': '',
                'assocId': ''
            }
        },

        addAuthor: {
            'csrfToken': '',
            'submissionId': '',

            'firstName': 'Иван',
            'middleName': '',
            'lastName': 'Иванов',
            'email': '',
            'country': 'RU',
            'suffix': '',
            'userUrl': '',
            'orcid': '',
            'affiliation[ru_RU]': 'org',
            'biography[ru_RU]': '',
            'userGroupId': '',
            'includeInBrowse': 'on',
        },

        save: {
            'csrfToken': '',
            'submissionId': '',

            'issueId': '',
            'stageId': '5',
            'copyrightHolder[ru_RU]': 'test-journal',
            'pages': '',
            'waivePublicationFee': '0',
            'markAsPaid': 0,
            'licenseURL': '',
            'copyrightYear': '',
        }
    },

    issue: {
        create: {
            'csrfToken': '',

            'title[ru_RU]': 'issue-title',
            'volume': '1',
            'number': '1',
            'year': '2019',
            'showVolume': '1',
            'showNumber': '1',
            'showYear': '1',
            'showTitle': '1',
            'description[ru_RU]': '',
            'temporaryFileId': ''
        },

        publish: {
            'csrfToken': '',

            'issueId': '',
            'confirmed': 'true',
        }
    }
}