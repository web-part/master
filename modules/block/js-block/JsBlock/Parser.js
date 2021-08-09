
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
                    'isOld': false,
                    'file': file,
                    'href': href,
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


        /**
        * 从动态的 JsLink 节点列表提取 json 信息。
        * @param {Array} list 动态的 JsLink 节点列表。
        *  列表中的每个元素 item = { }; 为 parse() 方法中返回的结果。
        * @param {object} [opt] 可选的配置参数。
        *   opt = {
        *       tabs: 0,            //缩进的空格数。
        *       md5: 4,             //添加到 href 中 query 部分的 md5 的长度。
        *   };
        * @returns
        */
        toJSON(list, opt) {
            list = list.map((item) => {
                // console.log(item)

                let data = opt ? {
                    'tabs': opt.tabs,
                    'md5': opt.md5,
                    'href': item.href,
                } : null;

                let link = item.link.toJSON(data);

                return {
                    'isOld': item.isOld,
                    'file': item.file,
                    'href': item.href,
                    'link': link,
                };
            });

            return list;
        },
    };

});


