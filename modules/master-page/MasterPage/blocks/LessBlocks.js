
/**
* 
*/
define('MasterPage/LessBlocks', function (require, module, exports) {
    const console = require('@webpart/console');
    const Tasker = require('@definejs/tasker');
    
    const Lines = require('Lines');
    const Path = require('Path');
    const BlockList = require('BlockList');
    const LessBlock = require('LessBlock');


    return {
        /**
        * 
        */
        parse(meta) {
            //解析出来的新列表，尽量复用之前创建的实例。
            //使用复用旧实例的策略，主要是为了应付母版页本身的内容发生改变时，需要重新解析带来的性能问题。
            //母版页内容发生局部变化时，大多数标签不变，重新解析时可以复用之前创建的实例，从而提高性能。
            let file$block = meta.patterns$LessBlock;     //当前集合。
            let old$block = meta.old.patterns$LessBlock;  //旧集合。
            let news = [];  //需要新建的。
            let olds = [];  //可以复用的。

            let list = BlockList.parse(meta.lines, meta.tags.less);

            list.forEach((item) => {
                let file = item.patterns.join();    //把整个路径模式看作一个整体。
                let block = old$block[file];

                if (!block) {
                    news.push(item);
                    return;
                }

                item.isOld = true;
                olds.push(file);
                item.block = file$block[file] = block;

                //同一个路径模式对应的实例只能给复用一次。
                //如果后续再遇到相同的路径模式，则只能新建一个，
                //不过，这种情况在现实中几乎不可能出现，
                //因为同一个页面中出现多个完全相同的路径模式没任何意义。
                delete old$block[file];
            });


            //有可能同一个文件名给引用了多次，这里也对应为一个实例。
            news.forEach((item) => {
                let file = item.patterns.join();
                let block = item.block = file$block[file];

                if (block) {
                    return;
                }

                block = new LessBlock({
                    'patterns': item.patterns,
                    'excludes': meta.excludes['less'],
                    'dir': meta.dir,
                    'htdocs': meta.htdocs,
                    'css': meta.css,
                    'delay': 0,
                });


                block.parse({
                    error(file) {
                        console.error('不存在 less 文件', file);
                        console.log('所在的 html 文件'.bgCyan, meta.file.cyan);

                        file = Path.relative(meta.dir, file);
                        BlockList.highlight(meta.lines, item, file);

                        throw new Error();
                    },
                });

                item.block = file$block[file] = block;

            });

            //释放备份中没有复用到的实例。
            Object.keys(old$block).forEach((file) => {
                let block = old$block[file];
                delete old$block[file];

                if (!olds.includes(file)) {
                    block.destroy();
                }
            });

            return list;
        },



        /**
        *
        */
        render(meta, done) {
            let tasker = new Tasker(meta.LessBlocks);

            tasker.on('each', function (item, index, done) {
                item.block.compile({
                    'minify': false,
                    'concat': false,
                    'dest': {           //输出各个分目标文件。
                        each: true,
                    },
                    'done'() {
                        let html = this.render({
                            'tabs': item.tabs,
                            'inline': item.inline,
                            'props': {},
                        });

                        Lines.replace(meta.lines, item.begin, item.end, html);

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

            meta.LessBlocks.forEach((item) => {
                if (item.isOld) { //复用过来的，不需要重新绑定。
                    return;
                }

                item.block.on('change', function () { //这里不要用箭头函数，因为下面有 this。

                    this.compile({
                        'minify': false,
                        'concat': false,
                        'dest': {           //输出各个分目标文件。
                            each: true,
                        },
                        'done'() {
                            let html = this.render({
                                'tabs': item.tabs,
                                'inline': item.inline,
                                'props': {},
                            });

                            Lines.replace(meta.lines, item.begin, item.end, html);

                            meta.mix(true);
                        },
                    });
                });

                item.block.watch();

            });

        },



        /**
        * 构建。
        *   options = {
        *       minify: false,      //是否压缩。
        *       inline: false,      //是否内联。
        *       dest: '{md5}.css',  //输出的目标文件名。 支持 `{md5}` 模板字段。 
        *       props: {},          //输出到标签里的 html 属性。
        *       query: {},          //生成到 href 属性中的 query 部分。
        *   };
        */
        build(meta, options, done) {
            let tasker = new Tasker(meta.LessBlocks);

            tasker.on('each', function (item, index, done) {
                item.block.build({
                    'tabs': item.tabs,
                    'minify': options.minify,
                    'inline': options.inline,
                    'dest': options.dest,
                    'props': options.props,
                    'query': options.query,

                    'done'(html) {
                        Lines.replace(meta.lines, item.begin, item.end, html);
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
            let list = meta.LessBlocks.map(function (item) {
                let block = item.block.toJSON();

                //以下字段参照 `BlockList/Item` 模块。
                return {
                    'begin': item.begin,
                    'end': item.end,
                    'tabs': item.tabs,
                    'tags': item.tags,
                    'content': item.content,
                    'patterns': item.patterns,
                    'block': block,
                };
            });

            return list;
        },

    };

});


