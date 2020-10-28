
/**
* 
*/
define('JsLink/Watcher', function (require, module, exports) {
    const Watcher = require('Watcher');


    return {
        create(meta) {

            let watcher = new Watcher(meta.file);

            watcher.on('modify', function () {
                meta.emitter.fire('change');

            });

            return watcher;

        },


    };

});


