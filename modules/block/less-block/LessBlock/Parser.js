

/**
* 
*/
define('LessBlock/Parser', function (require, module, exports) {
    const console = require('@webpart/console');
    const Patterns = require('@definejs/patterns');
    const File = require('@definejs/file');
    
    const Env = require('Env');
    const LessLink = require('LessLink');


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
                let dest = LessLink.get({
                    'htdocs': meta.htdocs,
                    'dir': meta.dir,
                    'css': meta.css,
                    'file': file,
                });


                return {
                    'isOld': false,
                    'file': file,
                    'dest': dest,
                    'link': null,
                };
            });


            list.forEach((item) => {
                let file = item.file;
                let link = old$link[file];

                //旧列表中还没有，则添加到待新建的集合中。
                if (!link) {
                    news.push(item);
                    return;
                }

                console.log('复用'.bgGreen, file.gray);

                olds.push(file);
                item.isOld = true;
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


                link = new LessLink({
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
                        let values = meta.emitter.fire('render', 'less-link', args);

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

        toJSON(list, opt) {
            list = list.map((item) => {
             

                let link = item.link.toJSON({
                    'tabs': opt.tabs,
                    'href': item.dest.href,
                });

                return {
                    'isOld': item.isOld,
                    'file': item.file,
                    'dest': item.dest,
                    'link': link,
                };
            });

            return list;
        },
    };

});


