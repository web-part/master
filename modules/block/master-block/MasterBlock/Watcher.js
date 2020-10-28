
/**
* 
*/
define('MasterBlock/Watcher', function (require, module, exports) {
    const Watcher = require('Watcher');


    return {
        create(meta) {
            let watcher = new Watcher(meta.patterns);

            watcher.on([
                'add',
                'delete',
                'rename',
            ], function (files, name) {
                meta.this.reset();
                meta.this.parse();
                meta.this.watch();
                meta.change(100);
            });


            return watcher;

        },


    };

});


