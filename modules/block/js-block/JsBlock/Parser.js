
/**
* 
*/
define('JsBlock/Parser', function (require, module, exports) {
    const console = require('@webpart/console');
    const File = require('@definejs/file');
    const Patterns = require('@definejs/patterns');
    
    const JsLink = require('JsLink');
    const Path = require('Path');



    return {
        /**
        * 解析。
        *   options = {
        *       error: function(file),  //文件不存在时的回调函数。
        *   };
        */
        parse(meta, options = {}) {
            let error = options.error;

            //解析出来的新列表，尽量复用之前创建的实例。
            let file$link = meta.file$link;     //当前集合。
            let old$link = meta.old.file$link;  //旧集合。
            let news = [];  //需要新建的。
            let olds = [];  //可以复用的。

            let files = Patterns.getFiles(meta.patterns, meta.excludes);    //做减法。

            let list = files.map((file) => {
                let href = Path.relative(meta.dir, file);

                return {
                    'file': file,
                    'href': href,
                    'link': null,
                    'isOld': false,
                };
            });

            list.forEach((item) => {
                let file = item.file;
                let link = old$link[file];

                if (!link) {
                    news.push(item);
                    return;
                }

                //console.log('复用'.bgGreen, file.gray);
                item.isOld = true;
                olds.push(file);
                item.link = file$link[file] = link;
            });


            //有可能同一个文件名给引用了多次，这里也对应为一个实例。
            news.forEach((item) => {
                let file = item.file;

                if (!File.exists(file)) {
                    error && error(file);
                    return;
                }

                let link = item.link = file$link[file];

                if (link) {
                    return;
                }

                link = new JsLink({
                    'file': file,
                });


                link.on({
                    'render': function (file, html, data) {
                        //增加些字段。
                        Object.assign(data, {
                            'dir': meta.dir,
                            'link': link,
                            'item': null,       //item 为空，说明是动态的方式引入的。
                        });

                        let args = [...arguments];
                        let values = meta.emitter.fire('render', 'js-link', args);

                        return values.slice(-1)[0];
                    },
                });

                item.link = file$link[file] = link;
            });

            //释放备份中没有复用到的实例。
            Object.keys(old$link).forEach((file) => {
                let link = old$link[file];
                delete old$link[file];

                if (!olds.includes(file)) {
                    link.destroy();
                }
            });

            return list;

        },
    };

});


