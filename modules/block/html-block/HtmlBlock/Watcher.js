
/**
* 
*/
define('HtmlBlock/Watcher', function (require, module, exports) {
    const Watcher = require('Watcher');

    return {
        create(meta) {
            let patterns = [
                ...meta.patterns,
                ...meta.excludes,
            ];

            let watcher = new Watcher(patterns);


            // `modify` 的留在外面的下级实例里处理。
            watcher.on([
                'add',
                'delete',
                'rename',
            ], function (files, name) {
                meta.this.reset();
                meta.this.parse();
                meta.this.watch();
                meta.change(true);
            });


            return watcher;

        },


    };

});


