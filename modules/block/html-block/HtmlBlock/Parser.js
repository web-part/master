
/**
* 
*/
define('HtmlBlock/Parser', function (require, module, exports) {
    const console = require('@webpart/console');
    const Patterns = require('@definejs/patterns');
    const File = require('@definejs/file');
    
    const Env = require('Env');
    const HtmlLink = require('HtmlLink');



    return {
        /**
        * 解析。
        *   opt = {
        *       error: function(file),  //文件不存在时的回调函数。
        *   };
        */
        parse(meta, opt = {}) {
            let { error, } = opt;

            //解析出来的新列表，尽量复用之前创建的实例。
            let file$link = meta.file$link;     //当前集合。
            let old$link = meta.old.file$link;  //旧集合。
            let news = [];  //需要新建的。
            let olds = [];  //可以复用的。

            let files = Patterns.getFiles(meta.patterns, meta.excludes);    //做减法。

            //过滤掉与当前环境无关的文件。
            files = Env.filter(files);

            
            let list = files.map((file) => {
                return {
                    'isOld': false,
                    'file': file,
                    'link': null,
                };
            });


            list.forEach((item) => {
                let file = item.file;
                let link = old$link[file];

                if (!link) {
                    news.push(item);
                    return;
                }

                console.log('复用'.bgGreen, file.gray);

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

                let link = file$link[file] || new HtmlLink({
                    'file': file,
                });

                link.parse();
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

        toJSON(list) {
            
            list = list.map((item) => {
                let link = item.link.toJSON(item);

                return {
                    'isOld': item.isOld,
                    'file': item.file,
                    'link': link,
                };
            });

            return list;
        },
    };

});


