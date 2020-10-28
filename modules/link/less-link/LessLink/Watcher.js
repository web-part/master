
/**
* 
*/
define('LessLink/Watcher', function (require, module, exports) {
    const Watcher = require('Watcher');


    return {
        create(meta) {
            let watcher = new Watcher(meta.file);

            watcher.on('modify', function () {
                meta.reset();
                meta.emitter.fire('change');
            });

            return watcher;

        },


    };

});


