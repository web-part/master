
/**
* 
*/
define('MasterPage/LessLinks', function (require, module, exports) {
    const console = require('@webpart/console');
    const $String = require('@definejs/string');
    const File = require('@definejs/file');
    const Tasker = require('@definejs/tasker');

    const LessLink = require('LessLink');
    const Lines = require('Lines');



    return exports = {
        /**
        * 
        */
        parse(meta) {
            //解析出来的新列表，尽量复用之前创建的实例。
            let file$link = meta.less$link;     //当前集合。
            let old$link = meta.old.less$link;  //旧集合。
            let news = [];  //需要新建的。
            let olds = [];  //可以复用的。

            //静态方法。
            let list = LessLink.parse(meta.content, {
                'dir': meta.dir,
                'htdocs': meta.htdocs,
                'css': meta.css,
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

                if (!File.exists(file)) {
                    console.error('不存在 less 文件', file);
                    console.log('所在的 html 文件'.bgCyan, meta.file.cyan);
                    Lines.highlight(meta.lines, item.no);
                    throw new Error();
                }

                let link = item.link = file$link[file];

                if (link) {
                    return;
                }


                link = item.link = file$link[file] = new LessLink({
                    'file': file,
                });

                link.on({
                    'render': function (file, html, data) {
                        //增加些字段。
                        Object.assign(data, {
                            'dir': meta.dir,
                            'link': link,
                            'item': item,   // item 不为空，说明是静态 <link> 方式的。
                        });

                        let args = [...arguments];
                        let values = meta.emitter.fire('render', 'less-link', args);

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
        render(meta, done) {
            let tasker = new Tasker(meta.LessLinks);

            tasker.on('each', function (item, index, done) {

                item.link.compile({
                    'minify': false,
                    'dest': item.dest.file,

                    'done'() {
                        let html = this.render({
                            'tabs': item.tabs,
                            'props': item.props,
                            'inline': item.inline,
                            'href': item.dest.href,
                            'md5': meta.md5.less,
                        });

                        item.output = html;
                        meta.lines[item.no] = html;

                        done();
                    },
                });
            });

            tasker.on('all', function () {
                done();
            });

            tasker.parallel();
        },


        /**
        *
        */
        watch(meta) {
            meta.LessLinks.forEach((item) => {
                if (item.isOld) { //复用过来的，不需要重新绑定。
                    return;
                }

                item.link.on('change', function () { //这里不要用箭头函数，因为下面有 this 引用。

                    item.link.compile({
                        'minify': false,
                        'dest': item.dest.file,

                        'done'() {
                            let html = this.render({
                                'tabs': item.tabs,
                                'props': item.props,
                                'inline': item.inline,
                                'href': item.dest.href,
                                'md5': 4,
                            });

                            if (html == item.output) {
                                return;
                            }

                            item.output = html;
                            meta.lines[item.no] = html;
                            meta.mix(true);
                        },
                    });


                });

                item.link.watch();

            });
        },


        /**
        * 构建。
        *   opt = {
        *       minify: true,       //是否压缩。
        *       name: '',           //输出的目标文件名，不包含目录部分。 支持两个模板字段 `{name}`、`{md5}`。 
        *       md5: 4,             //添加到 href 中 query 部分的 md5 的长度。
        *       query: null || fn,  //添加到 href 中 query 部分。
        *   };
        */
        build(meta, opt, done) {
            let tasker = new Tasker(meta.LessLinks);

            tasker.on('each', function (item, index, done) {
                let dest = '';
                let href = '';
                let name = opt.name;

                if (name) {
                    name = $String.format(name, { 'name': item.dest.name, });
                    dest = item.dest.dir.css + name;
                    href = item.dest.dir.href + name;
                }

                item.link.build({
                    'minify': opt.minify,
                    'query': opt.query,
                    'md5': opt.md5,
                    'dest': dest,
                    'href': href,
                    'tabs': item.tabs,
                    'props': item.props,
                    'inline': item.inline,

                    'done'(html) {
                        item.output = html;
                        meta.lines[item.no] = html;

                        done();
                    },
                });
            });

            tasker.on('all', function () {
                done();
            });

            tasker.parallel();
        },


        toJSON(meta) {
            let list = LessLink.toJSON(meta.LessLinks);
            return list;
        },


    };

});


