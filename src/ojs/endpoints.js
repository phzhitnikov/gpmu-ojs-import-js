module.exports = {
    login: {
        page: '/index/login',
        action: '/index/login/signIn'
    },
    journal: {
        getAll: 'index/$$$call$$$/grid/admin/journal/journal-grid/fetch-grid',
        create: 'index/$$$call$$$/grid/admin/journal/journal-grid/update-context'
    },
    issue: {
        getAll: '$$$call$$$/grid/issues/future-issue-grid/fetch-grid',
        create: '$$$call$$$/grid/issues/future-issue-grid/update-issue?issueId=',
        publish: '$$$call$$$/grid/issues/future-issue-grid/publish-issue'
    },
    submission: {
        prepare: 'submission/step/1',
        step1_save: 'submission/saveStep/1',
        step2: {
            getGenreId: '$$$call$$$/wizard/file-upload/file-upload-wizard/display-file-upload-form',
            save: 'submission/saveStep/2'
        },
        step3_metadata: 'submission/saveStep/3',
        step4_confirm: 'submission/saveStep/4',
        galley: {
            create: '$$$call$$$/grid/article-galleys/article-galley-grid/update-galley',
            getAssocTypeAssocId: '$$$call$$$/grid/article-galleys/article-galley-grid/fetch-row'
        },
        getAuthors: '$$$call$$$/grid/users/author/author-grid/fetch-grid',
        removeAuthor: '$$$call$$$/grid/users/author/author-grid/delete-author',
        authorForm: '$$$call$$$/grid/users/author/author-grid/add-author',
        addAuthor: '$$$call$$$/grid/users/author/author-grid/update-author?authorId=',
        uploadFile: '$$$call$$$/wizard/file-upload/file-upload-wizard/upload-file',

        save: '$$$call$$$/tab/issue-entry/issue-entry-tab/save-publication-metadata-form'
    },
}