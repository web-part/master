
/**
* 
*/
define('PackageBlock/Watcher', function (require, module, exports) {
    const Watcher = require('Watcher');


    return {
        create(meta) {
            let watcher = meta.watcher;

            if (!watcher) {
                watcher = new Watcher(meta.patterns);

                // `modify` 的留在外面的 Package 实例里处理。
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
            }

            meta.list.forEach((item, index) => {
                if (item.isOld) { //复用过来的，不需要重新绑定。
                    return;
                }

                let pack = item.pack;

                pack.on('change', function () {
                    item.output = null;
                    item.key$output = {};
                    meta.change(100);
                });

                pack.on('change', 'name', function (name, old) {
                    let invalid = Parser.check(meta.list);
                    if (invalid) {
                        throw new Error('存在同名的包。');
                    }
                });

                //包的内容发生了变化。
                pack.on('change', 'content', function (info) {
                    //因为下面要重新解析，因此不再是闭包外层的 item。
                    let item = meta.file$item[info.file];

                    item.info = info;
                    item.output = null;
                    item.key$output = {};

                    meta.this.reset();
                    meta.this.parse();
                    meta.this.watch();
                    meta.change(100);
                });

                pack.watch();
            });

            return watcher;

        },


    };

});


