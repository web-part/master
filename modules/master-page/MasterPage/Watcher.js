
/**
* 
*/
define('MasterPage/Watcher', function (require, module, exports) {
    const Watcher = require('Watcher');


    return {
        create(meta) {
            let watcher = new Watcher(meta.file);

            //因为是静态文件引用，所以只监控文件内容是否发生变化即可。
            //当前 html 片段内容发生了变化，引用的下级片段列表可能也发生了变化，因此需要重新解析。
            watcher.on('modify', function () {
                meta.this.reset();
                meta.this.parse();
                meta.this.watch();
                meta.change();

            });

            return watcher;

        },


    };

});


