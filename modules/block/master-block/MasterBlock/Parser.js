
/**
* 
*/
define('MasterBlock/Parser', function (require, module, exports) {
    const Patterns = require('@definejs/patterns');
    
    const MasterPage = require('MasterPage');



    return {
        /**
        * 
        */
        parse(meta) {
            //解析出来的新列表，尽量复用之前创建的实例。
            let news = [];                      //需要新建的。
            let olds = [];                      //可以复用的。
            let file$master = meta.file$master;     //当前集合。
            let old$master = meta.old.file$master;  //旧集合。
            let files = Patterns.getFiles(meta.patterns);

            let list = files.map((file) => {
                return {
                    'file': file,
                    'master': null,
                    'isOld': false,
                    'key$output': {},   //针对编译中不同的 options 的缓存结果。 key = JSON.string(options);
                    'output': null,     //缓存最近一次的编译结果。
                };
            });


            list.forEach((item) => {
                let file = item.file;
                let master = old$master[file];

                //尚未存在，则先添加到新建列表里。
                if (!master) {
                    news.push(item);
                    return;
                }

                //复用过来的实例，不需要重新解析。
                console.log('复用'.bgGreen, file.gray);
                item.isOld = true;
                olds.push(file);
                item.master = file$master[file] = master;
            });


            //有可能同一个文件名给引用了多次，这里也对应为一个实例。
            news.forEach((item) => {
                let file = item.file;
                let master = item.master = file$master[file];

                if (master) {
                    return;
                }


                master = new MasterPage({
                    'file': file,
                    'htdocs': meta.htdocs,
                    'css': meta.css,
                    'dest': meta.dest,
                    'excludes': meta.excludes,
                    'delay': 100,   //这里不能设为 0，因为 less、js、html 各种资源有可能同时引起触发。
                });

                //转发事件。
                master.on({
                    'parse': {
                        'master': function (...args) {
                            let values = meta.emitter.fire('parse', 'master', args);
                            return values.slice(-1)[0];
                        },
                    },
                    'render': {
                        'master': function (...args) {
                            let values = meta.emitter.fire('render', 'master', args);
                            return values.slice(-1)[0];
                        },
                        'js-link': function (...args) {
                            let values = meta.emitter.fire('render', 'js-link', args);
                            return values.slice(-1)[0];
                        },
                    },
                });



                //新建的要解析。
                master.parse();

                item.master = file$master[file] = master;
            });


            //释放备份中没有复用到的实例。 
            Object.keys(old$master).forEach((file) => {
                let master = old$master[file];
                delete old$master[file];

                //不在可以复用的集合里，则销毁。
                if (!olds.includes(file)) {
                    master.destroy();
                }
            });

            return list;

        },


    };

});


