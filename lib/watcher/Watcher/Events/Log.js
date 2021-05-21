define('Watcher/Events/Log', function (require, module, exports) {
    const console = require('@webpart/console');
    const desc$file$item = {};


    return {
        add(desc, file, fn) {
            let file$item = desc$file$item[desc];

            if (!file$item) {
                file$item = desc$file$item[desc] = {};
            }


            let item = file$item[file];

            if (item) {
                item.list.push(fn);
                clearTimeout(item.tid);
            }
            else {
                item = file$item[file] = {
                    'list': [fn],
                    'tid': null,
                };
            }


            item.tid = setTimeout(() => {
                console.log(desc.cyan, file);

                item.list.forEach((fn) => {
                    fn();
                });

                delete file$item[file];

            }, 200);
        },
    };



});




