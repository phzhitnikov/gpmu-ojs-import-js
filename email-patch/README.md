## OJS patch for email fields to be optional on author form during submission creation

Tested only on OJS v. 3.1.1.2 and 3.1.1.4
Patch is probably incompatible with later versions

## Installation:

### Either:
    Copy userDetails.tpl to [/var/www/html/lib/pkp/templates/common]
    Copy authorForm.tpl to [/var/www/html/lib/pkp/templates/controllers/grid/users/author/form]
    Copy AuthorForm.inc.php to [/var/www/lib/pkp/controllers/grid/users/author/form]

### OR: just apply patches with command:
    patch [options] originalfile patchfile 