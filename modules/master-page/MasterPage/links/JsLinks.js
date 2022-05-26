
/**
* 
*/
define('MasterPage/JsLinks', function (require, module, exports) {
    const console = require('@webpart/console');
    const File = require('@definejs/file');
    const Tasker = require('@definejs/tasker');
    
    const JsLink = require('JsLink');
    const Lines = require('Lines');



    return exports = {

        /**
        * 
        */
        parse(meta) {
            //解析出来的新列表，尽量复用之前创建的实例。
            let file$link = meta.js$link;     //当前集合。
            let old$link = meta.old.js$link;  //旧集合。
            let news = [];  //需要新建的。
            let olds = [];  //可以复用的。

            let list = JsLink.parse(meta.content, {
                'dir': meta.dir,
            });


            list.forEach((item) => {
                let file = item.file;
                let link = old$link[file];

                if (!link) {
                    news.push(item);
                    return;
                }

                item.isOld = true;
                olds.push(file);
                item.link = file$link[file] = link;

                //同一个路径对应的实例只能给复用一次。
                //如果后续再遇到相同的路径，则只能新建一个，
                //不过，这种情况在现实中几乎不可能出现，
                //因为同一个页面中出现多个完全相同的路径没任何意义。
                delete old$link[file];
            });


            //有可能同一个文件名给引用了多次，这里也对应为一个实例。
            news.forEach((item) => {
                let file = item.file;
                let existed = item.external || File.exists(file); //内部资源时，检查文件是否存在。

                if (!existed) {
                    console.error('不存在 js 文件', file);
                    console.log('所在的 html 文件'.bgCyan, meta.file.cyan);
                    Lines.highlight(meta.lines, item.no);
                    throw new Error();
                }

                let link = item.link = file$link[file];
                if (link) {
                    return;
                }



                link = item.link = file$link[file] = new JsLink({
                    'file': item.file,
                });

                link.on({
                    'render': function (file, html, data) {
                        //增加些字段。
                        Object.assign(data, {
                            'dir': meta.dir,
                            'link': link,
                            'item': item,   // item 不为空，说明是静态 <script> 方式的。
                        });

                        let args = [...arguments];
                        let values = meta.emitter.fire('render', 'js-link', args);

                        return values.slice(-1)[0];
                    },
                });

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
        *
        */
        watch(meta) {
            meta.JsLinks.forEach((item) => {
                if (item.isOld) { //复用过来的，不需要重新绑定。
                    return;
                }

                item.link.on('change', function () {
                    let html = item.link.render({
                        'inline': item.inline,
                        'tabs': item.tabs,
                        'href': item.href,
                        'md5': 4,
                        'props': item.props,
                        'query': {},
                    });

                    if (html == item.output) {
                        return;
                    }

                    item.output = html;
                    meta.lines[item.no] = html;
                    meta.mix(true);
                });

                item.link.watch();

            });
        },

        /**
        *
        */
        render(meta, done) {
            meta.JsLinks.forEach((item) => {
                

                let html = item.link.render({
                    'inline': item.inline,
                    'tabs': item.tabs,
                    'href': item.href,
                    'md5': meta.md5.js,
                    'props': item.props,
                    'query': {},
                });

                item.output = html;
                meta.lines[item.no] = html;
            });

            done();

        },

        /**
        * 构建。
        */
        build(meta, done) {

            let tasker = new Tasker(meta.JsLinks);

            tasker.on('each', function (item, index, done) {
                //静态方法。
                JsLink.build(item, (html) => {
                    item.output = html;
                    meta.lines[item.no] = html;
                    done();
                });
            });

            tasker.on('all', function (...args) {
                done(...args);
            });


            tasker.parallel();

        },

        
        /**
        * 提取所有静态的 JsLink 对应的 json 信息。
        */
        toJSON(meta) {
            let list = JsLink.toJSON(meta.JsLinks);
            return list;
        },



    };

});


