
/**
* 
*/
define('PackageBlock/Parser', function (require, module, exports) {
    const $Object = require('@definejs/object');
    const Patterns = require('@definejs/patterns');
    
    const Package = require('Package');
    const Log = require('Log');



    return exports = {
        /**
        * 
        */
        parse(meta) {
            //解析出来的新列表，尽量复用之前创建的实例。
            let news = [];                      //需要新建的。
            let olds = [];                      //可以复用的。

            let file$item = meta.file$item;     //当前集合。
            let file$old = meta.old.file$item;  //旧集合。
            let files = Patterns.getFiles(meta.patterns);   //这里面的每个文件名都是唯一的。

            let list = files.map((file) => {
                return {
                    'file': file,       //
                    'pack': null,       //Package 实例。
                    'isOld': false,     //
                    'key$output': {},   //针对编译中不同的 options 的缓存结果。 key = JSON.string(options);
                    'output': null,     //缓存最近一次 pack.compile() 的编译结果。
                    'info': {},         //缓存 pack.parse() 的输出结果。
                };
            });


            list.forEach((item) => {
                let file = item.file;
                let old = file$old[file];

                //尚未存在，则先添加到新建列表里。
                if (!old) {
                    news.push(item);
                    return;
                }

                //复用过来的实例，不需要重新解析。
                console.log('复用'.bgGreen, file.gray);
                olds.push(file);

                Object.assign(item, old);//拷贝到新的。
                item.isOld = true;
                file$item[file] = item;
            });

            //需要新建的。
            news.forEach((item) => {
                let file = item.file;

                let pack = new Package({
                    'file': file,
                    'htdocs': meta.htdocs,
                    'css': meta.css,
                    'dest': meta.dest.dir,      //分包资源文件的输出目录。
                });

                //转发事件。
                pack.on({
                    'compile': {
                        'html-block': function (...args) {
                            let values = meta.emitter.fire('compile', 'html-block', args);
                            return values.slice(-1)[0];
                        },
                        'js-block': function (...args) {
                            let values = meta.emitter.fire('compile', 'js-block', args);
                            return values.slice(-1)[0];
                        },
                    },
                });


                //新建的要解析。
                item.info = pack.parse();
                item.pack = pack;
                file$item[file] = item;
            });


            let invalid = exports.check(list);
            if (invalid) {
                throw new Error('存在同名的包。');
            }



            //释放备份中没有复用到的实例。
            Object.keys(file$old).forEach((file) => {
                let old = file$old[file];
                delete file$old[file];

                //不在可以复用的集合里，则销毁。
                if (!olds.includes(file)) {
                    old.pack.destroy();
                }
            });

            return list;

        },

        /**
        * 检查是否存在同名的包文件。
        */
        check(list) {
            let name$files = {};
            let invalid = false;

            list.forEach((item) => {
                let name = item.pack.name;
                let files = name$files[name] || [];

                files.push(item.file);
                name$files[name] = files;
            });

            $Object.each(name$files, (name, files) => {
                if (files.length < 2) {
                    return;
                }

                invalid = true;
                console.error('存在同名的包文件:', name.green);
                Log.logArray(files, 'yellow');

            });

            return invalid;
        },

        /**
        * 把各个分包里的模式，按分类合并到总模式列表中。
        */
        merge(meta) {
            let type$patterns = meta.type$patterns;

            meta.list.forEach((item) => {

                $Object.each(type$patterns, (type, all) => {
                    let patterns = item.info.patterns[type];    //分包里的。

                    patterns = Patterns.join(item.info.dir, patterns);

                    type$patterns[type] = [...new Set([...all, ...patterns])];
                });

            });

            //分类的总模式发生了变化。
            let old = JSON.stringify(meta.old.type$patterns);
            let current = JSON.stringify(type$patterns);

            return old != current;


        },
    };

});


